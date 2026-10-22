// ==============================================================================
// INVENTORY & LEDGER REPOSITORY — SHOLKVEDA
// ==============================================================================

import { db } from '@/lib/db';
import { isPostgresConfigured, pgQuery, withPostgresTransaction } from '@/lib/postgres';
import crypto from 'node:crypto';
import { InventoryChangeReason, InventoryLedger, ProductVariant } from '@/types';
import { StockUnavailableError, ValidationError } from '@/lib/errors';

/** Stock movements must always be whole units — never let NaN/fractions/strings reach a balance. */
function assertIntegerQty(value: number, label = 'Quantity'): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new ValidationError(`${label} must be a whole number`);
  }
  return value;
}

const iso=(value:Date|string)=>new Date(value).toISOString();
function mapVariant(r:any):ProductVariant{return{id:r.id,productId:r.productId,sku:r.sku,sizeLabel:r.sizeLabel,mrp:Number(r.mrp),sellingPrice:Number(r.sellingPrice),costPrice:Number(r.costPrice),stockQuantity:r.stockQuantity,reservedQuantity:r.reservedQuantity,lowStockThreshold:r.lowStockThreshold,weightInGrams:r.weightInGrams,isDefault:r.isDefault,isActive:r.isActive,createdAt:iso(r.createdAt),updatedAt:iso(r.updatedAt)}}
function mapLedger(r:any):InventoryLedger{return{id:r.id,variantId:r.variantId,changeQty:r.changeQty,resultingQty:r.resultingQty,reason:r.reason,referenceId:r.referenceId??null,notes:r.notes??null,createdAt:iso(r.createdAt)}}

export class InventoryRepository {
  public static async getVariantStock(variantId: string): Promise<number> {
    if (isPostgresConfigured()) { const r=await pgQuery('SELECT "stockQuantity" FROM "ProductVariant" WHERE "id"=$1',[variantId]); return r.rows[0]?.stockQuantity ?? 0; }
    const v = db.productVariants.get(variantId);
    return v ? v.stockQuantity : 0;
  }

  /** Sellable units = physical stock minus units held by pending checkouts. */
  public static async getAvailableStock(variantId: string): Promise<number> {
    if (isPostgresConfigured()) { const r=await pgQuery('SELECT GREATEST("stockQuantity"-"reservedQuantity",0) AS available FROM "ProductVariant" WHERE "id"=$1',[variantId]); return r.rows[0]?.available ?? 0; }
    const v = db.productVariants.get(variantId);
    return v ? Math.max(0, v.stockQuantity - (v.reservedQuantity || 0)) : 0;
  }

  public static async listLedger(variantId?: string): Promise<InventoryLedger[]> {
    if (isPostgresConfigured()) { const r=await pgQuery(`SELECT * FROM "InventoryLedger" ${variantId?'WHERE "variantId"=$1':''} ORDER BY "createdAt" DESC`,variantId?[variantId]:[]); return r.rows.map(mapLedger); }
    const list = Array.from(db.inventoryLedgers.values());
    if (variantId) {
      return list.filter((l) => l.variantId === variantId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public static async listLowStock(): Promise<Array<ProductVariant & { productName: string }>> {
    if (isPostgresConfigured()) {
      const r=await pgQuery('SELECT v.*,p."name" AS "productName" FROM "ProductVariant" v JOIN "Product" p ON p."id"=v."productId" WHERE v."isActive"=TRUE AND v."stockQuantity"<=v."lowStockThreshold" ORDER BY v."stockQuantity" ASC');
      return r.rows.map((row)=>({...mapVariant(row),productName:row.productName}));
    }
    const results: Array<ProductVariant & { productName: string }> = [];
    for (const v of db.productVariants.values()) {
      if (v.isActive && v.stockQuantity <= v.lowStockThreshold) {
        const product = db.products.get(v.productId);
        results.push({
          ...v,
          productName: product?.name || 'Unknown Ayurvedic Product',
        });
      }
    }
    return results;
  }

  /**
   * Atomic Transactional Stock Adjustment
   * Prevents negative stock, updates variant balance, and records immutable ledger entry.
   */
  public static async adjustStock(
    variantId: string,
    changeQty: number,
    reason: InventoryChangeReason,
    referenceId?: string | null,
    notes?: string | null
  ): Promise<{ variant: ProductVariant; ledger: InventoryLedger }> {
    assertIntegerQty(changeQty, 'Stock adjustment');
    if (changeQty === 0) {
      throw new ValidationError('Stock adjustment cannot be zero');
    }
    if (isPostgresConfigured()) {
      return withPostgresTransaction(async(client)=>{
        const update=await client.query('UPDATE "ProductVariant" SET "stockQuantity"="stockQuantity"+$2,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=$1 AND "stockQuantity"+$2>=0 RETURNING *',[variantId,changeQty]);
        if(!update.rows[0]){const current=await client.query('SELECT "sku","stockQuantity" FROM "ProductVariant" WHERE "id"=$1',[variantId]);if(!current.rows[0])throw new Error(`Variant ${variantId} not found`);throw new StockUnavailableError(current.rows[0].sku,Math.abs(changeQty),current.rows[0].stockQuantity);}
        const variant=mapVariant(update.rows[0]),id=`inv_${crypto.randomUUID()}`;
        const ledger=await client.query('INSERT INTO "InventoryLedger" ("id","variantId","changeQty","resultingQty","reason","referenceId","notes","createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_TIMESTAMP) RETURNING *',[id,variantId,changeQty,variant.stockQuantity,reason,referenceId??null,notes??null]);
        return {variant,ledger:mapLedger(ledger.rows[0])};
      });
    }
    const variant = db.productVariants.get(variantId);
    if (!variant) {
      throw new Error(`Variant ${variantId} not found`);
    }

    const newStock = variant.stockQuantity + changeQty;
    if (newStock < 0) {
      throw new StockUnavailableError(variant.sku, Math.abs(changeQty), variant.stockQuantity);
    }

    const now = new Date().toISOString();
    const updatedVariant: ProductVariant = {
      ...variant,
      stockQuantity: newStock,
      updatedAt: now,
    };
    db.productVariants.set(variantId, updatedVariant);

    const ledgerId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const ledgerEntry: InventoryLedger = {
      id: ledgerId,
      variantId,
      changeQty,
      resultingQty: newStock,
      reason,
      referenceId,
      notes,
      createdAt: now,
    };
    db.inventoryLedgers.set(ledgerId, ledgerEntry);

    return {
      variant: { ...updatedVariant },
      ledger: { ...ledgerEntry },
    };
  }

  /**
   * Atomic Batch Decrement for Order Purchases
   */
  public static async decrementForOrder(
    items: Array<{ variantId: string; quantity: number; sku: string }>,
    orderNumber: string
  ): Promise<void> {
    for (const item of items) assertIntegerQty(item.quantity);
    if (isPostgresConfigured()) {
      await withPostgresTransaction(async(client)=>{
        for(const item of items){
          const update=await client.query('UPDATE "ProductVariant" SET "stockQuantity"="stockQuantity"-$2,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=$1 AND "stockQuantity">=$2 RETURNING "stockQuantity"',[item.variantId,item.quantity]);
          if(!update.rows[0]){const current=await client.query('SELECT "stockQuantity" FROM "ProductVariant" WHERE "id"=$1',[item.variantId]);throw new StockUnavailableError(item.sku,item.quantity,current.rows[0]?.stockQuantity??0);}
          await client.query('INSERT INTO "InventoryLedger" ("id","variantId","changeQty","resultingQty","reason","referenceId","notes","createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_TIMESTAMP)',[`inv_${crypto.randomUUID()}`,item.variantId,-item.quantity,update.rows[0].stockQuantity,InventoryChangeReason.SALE,orderNumber,`Purchased under Order #${orderNumber}`]);
        }
      });
      return;
    }
    // 1. Dry run validation to ensure ALL items have sufficient stock
    for (const item of items) {
      const v = db.productVariants.get(item.variantId);
      if (!v || v.stockQuantity < item.quantity) {
        throw new StockUnavailableError(item.sku, item.quantity, v ? v.stockQuantity : 0);
      }
    }

    // 2. Perform atomic decrements & ledger records
    for (const item of items) {
      await this.adjustStock(
        item.variantId,
        -item.quantity,
        InventoryChangeReason.SALE,
        orderNumber,
        `Purchased under Order #${orderNumber}`
      );
    }
  }

  /**
   * Atomic Batch Restoration for Order Cancellations / Returns
   */
  public static async restoreForOrder(
    items: Array<{ variantId: string; quantity: number }>,
    orderNumber: string,
    reason: InventoryChangeReason = InventoryChangeReason.ORDER_CANCELLATION
  ): Promise<void> {
    for (const item of items) assertIntegerQty(item.quantity);
    if (isPostgresConfigured()) {
      await withPostgresTransaction(async(client)=>{
        for(const item of items){
          const update=await client.query('UPDATE "ProductVariant" SET "stockQuantity"="stockQuantity"+$2,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=$1 RETURNING "stockQuantity"',[item.variantId,item.quantity]);
          if(!update.rows[0])throw new Error(`Variant ${item.variantId} not found`);
          await client.query('INSERT INTO "InventoryLedger" ("id","variantId","changeQty","resultingQty","reason","referenceId","notes","createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_TIMESTAMP)',[`inv_${crypto.randomUUID()}`,item.variantId,item.quantity,update.rows[0].stockQuantity,reason,orderNumber,`Restocked from Order #${orderNumber}`]);
        }
      });
      return;
    }
    for (const item of items) {
      await this.adjustStock(
        item.variantId,
        item.quantity,
        reason,
        orderNumber,
        `Restocked from Order #${orderNumber}`
      );
    }
  }

  /**
   * Reserves stock for a pending checkout so the same units cannot be sold
   * twice while the customer is on the payment page. Availability everywhere
   * else is `stockQuantity - reservedQuantity`.
   */
  public static async reserveForOrder(
    items: Array<{ variantId: string; quantity: number; sku: string }>,
    orderNumber: string
  ): Promise<void> {
    for (const item of items) assertIntegerQty(item.quantity);
    if (isPostgresConfigured()) {
      await withPostgresTransaction(async (client) => {
        for (const item of items) {
          const update = await client.query(
            'UPDATE "ProductVariant" SET "reservedQuantity"="reservedQuantity"+$2,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=$1 AND "stockQuantity"-"reservedQuantity">=$2 RETURNING "id"',
            [item.variantId, item.quantity]
          );
          if (!update.rows[0]) {
            const current = await client.query('SELECT GREATEST("stockQuantity"-"reservedQuantity",0) AS available FROM "ProductVariant" WHERE "id"=$1', [item.variantId]);
            throw new StockUnavailableError(item.sku, item.quantity, current.rows[0]?.available ?? 0);
          }
        }
      });
      return;
    }
    // Dry-run first so a failed reservation never reserves partially.
    for (const item of items) {
      const v = db.productVariants.get(item.variantId);
      const available = v ? Math.max(0, v.stockQuantity - (v.reservedQuantity || 0)) : 0;
      if (!v || available < item.quantity) {
        throw new StockUnavailableError(item.sku, item.quantity, available);
      }
    }
    const now = new Date().toISOString();
    for (const item of items) {
      const v = db.productVariants.get(item.variantId)!;
      db.productVariants.set(item.variantId, {
        ...v,
        reservedQuantity: (v.reservedQuantity || 0) + item.quantity,
        updatedAt: now,
      });
    }
    void orderNumber;
  }

  /** Releases a checkout reservation (payment abandoned/failed/cancelled). Safe to call twice. */
  public static async releaseReservation(
    items: Array<{ variantId: string; quantity: number }>
  ): Promise<void> {
    for (const item of items) assertIntegerQty(item.quantity);
    if (isPostgresConfigured()) {
      await withPostgresTransaction(async (client) => {
        for (const item of items) {
          await client.query(
            'UPDATE "ProductVariant" SET "reservedQuantity"=GREATEST("reservedQuantity"-$2,0),"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=$1',
            [item.variantId, item.quantity]
          );
        }
      });
      return;
    }
    const now = new Date().toISOString();
    for (const item of items) {
      const v = db.productVariants.get(item.variantId);
      if (!v) continue;
      db.productVariants.set(item.variantId, {
        ...v,
        reservedQuantity: Math.max(0, (v.reservedQuantity || 0) - item.quantity),
        updatedAt: now,
      });
    }
  }

  /**
   * Converts a reservation into a sale at payment completion: physical stock
   * and the reservation both decrease. Also safe for legacy orders that were
   * created without a reservation (reserved simply floors at 0).
   */
  public static async commitReservationForOrder(
    items: Array<{ variantId: string; quantity: number; sku: string }>,
    orderNumber: string
  ): Promise<void> {
    for (const item of items) assertIntegerQty(item.quantity);
    if (isPostgresConfigured()) {
      await withPostgresTransaction(async (client) => {
        for (const item of items) {
          const update = await client.query(
            'UPDATE "ProductVariant" SET "stockQuantity"="stockQuantity"-$2,"reservedQuantity"=GREATEST("reservedQuantity"-$2,0),"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=$1 AND "stockQuantity">=$2 RETURNING "stockQuantity"',
            [item.variantId, item.quantity]
          );
          if (!update.rows[0]) {
            const current = await client.query('SELECT "stockQuantity" FROM "ProductVariant" WHERE "id"=$1', [item.variantId]);
            throw new StockUnavailableError(item.sku, item.quantity, current.rows[0]?.stockQuantity ?? 0);
          }
          await client.query(
            'INSERT INTO "InventoryLedger" ("id","variantId","changeQty","resultingQty","reason","referenceId","notes","createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_TIMESTAMP)',
            [`inv_${crypto.randomUUID()}`, item.variantId, -item.quantity, update.rows[0].stockQuantity, InventoryChangeReason.SALE, orderNumber, `Purchased under Order #${orderNumber}`]
          );
        }
      });
      return;
    }
    for (const item of items) {
      const v = db.productVariants.get(item.variantId);
      if (!v || v.stockQuantity < item.quantity) {
        throw new StockUnavailableError(item.sku, item.quantity, v ? v.stockQuantity : 0);
      }
    }
    const now = new Date().toISOString();
    for (const item of items) {
      const v = db.productVariants.get(item.variantId)!;
      const newStock = v.stockQuantity - item.quantity;
      db.productVariants.set(item.variantId, {
        ...v,
        stockQuantity: newStock,
        reservedQuantity: Math.max(0, (v.reservedQuantity || 0) - item.quantity),
        updatedAt: now,
      });
      const ledgerId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      db.inventoryLedgers.set(ledgerId, {
        id: ledgerId,
        variantId: item.variantId,
        changeQty: -item.quantity,
        resultingQty: newStock,
        reason: InventoryChangeReason.SALE,
        referenceId: orderNumber,
        notes: `Purchased under Order #${orderNumber}`,
        createdAt: now,
      });
    }
  }

  // Aliases & Instance Methods
  public static async getLowStockItems() { return this.listLowStock(); }

  public getVariantStock(variantId: string) { return InventoryRepository.getVariantStock(variantId); }
  public getAvailableStock(variantId: string) { return InventoryRepository.getAvailableStock(variantId); }
  public reserveForOrder(items: any[], orderNumber: string) { return InventoryRepository.reserveForOrder(items, orderNumber); }
  public releaseReservation(items: any[]) { return InventoryRepository.releaseReservation(items); }
  public commitReservationForOrder(items: any[], orderNumber: string) { return InventoryRepository.commitReservationForOrder(items, orderNumber); }
  public listLedger(variantId?: string) { return InventoryRepository.listLedger(variantId); }
  public listLowStock() { return InventoryRepository.listLowStock(); }
  public getLowStockItems() { return InventoryRepository.getLowStockItems(); }
  public adjustStock(variantId: string, changeQty: number, reason: any, ref?: string, notes?: string) { return InventoryRepository.adjustStock(variantId, changeQty, reason, ref, notes); }
  public decrementForOrder(items: any[], orderNumber: string) { return InventoryRepository.decrementForOrder(items, orderNumber); }
  public restoreForOrder(items: any[], orderNumber: string, reason?: any) { return InventoryRepository.restoreForOrder(items, orderNumber, reason); }
}

export const inventoryRepository = new InventoryRepository();

