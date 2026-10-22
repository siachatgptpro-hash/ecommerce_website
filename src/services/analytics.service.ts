// ==============================================================================
// DATABASE-DRIVEN ANALYTICS SERVICE — SHOLKVEDA
// Real Aggregated Business Intelligence (Zero Mock / Fake Data)
// ==============================================================================

import { db } from '@/lib/db';
import { isPostgresConfigured, pgQuery } from '@/lib/postgres';
import { OrderStatus, PaymentStatus, SystemRole, Product, ProductVariant, Order } from '@/types';

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  paidOrdersCount: number;
  averageOrderValue: number;
  totalCustomers: number;
  totalProducts: number;
  activeProducts: number;
  lowStockCount: number;
  statusBreakdown: Record<OrderStatus, number>;
  topProducts: Array<{
    productId: string;
    productName: string;
    totalQuantitySold: number;
    totalRevenue: number;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    totalPayableAmount: number;
    orderStatus: OrderStatus;
    paymentStatus: PaymentStatus;
    createdAt: string;
  }>;
}

export class AnalyticsService {
  /**
   * Postgres metrics are computed with SQL aggregates over ALL orders.
   * (Previously only the latest 1,000 orders were hydrated and summed in JS,
   * so revenue silently diverged from reality at scale.)
   */
  private static async getPostgresMetrics(): Promise<DashboardMetrics> {
    const [totals, byStatus, top, recent, customers, productCount, lowStock] = await Promise.all([
      pgQuery(
        'SELECT count(*)::int AS total, COALESCE(SUM("totalPayableAmount") FILTER (WHERE "paymentStatus"=$1),0)::float AS revenue, (count(*) FILTER (WHERE "paymentStatus"=$1))::int AS paid FROM "Order"',
        [PaymentStatus.PAID]
      ),
      pgQuery('SELECT "orderStatus" AS status, count(*)::int AS count FROM "Order" GROUP BY "orderStatus"'),
      pgQuery(
        'SELECT v."productId" AS "productId", oi."productNameSnapshot" AS "productName", SUM(oi."quantity")::int AS qty, COALESCE(SUM(oi."lineTotal"),0)::float AS revenue FROM "OrderItem" oi JOIN "Order" o ON o."id"=oi."orderId" AND o."paymentStatus"=$1 JOIN "ProductVariant" v ON v."id"=oi."variantId" GROUP BY v."productId", oi."productNameSnapshot" ORDER BY revenue DESC LIMIT 5',
        [PaymentStatus.PAID]
      ),
      pgQuery('SELECT "id","orderNumber","customerName","totalPayableAmount","orderStatus","paymentStatus","createdAt" FROM "Order" ORDER BY "createdAt" DESC LIMIT 10'),
      pgQuery('SELECT count(DISTINCT u."id")::int AS total FROM "User" u JOIN "UserRole" ur ON ur."userId"=u."id" JOIN "Role" r ON r."id"=ur."roleId" WHERE r."name"=$1 AND u."isActive"=TRUE', ['CUSTOMER']),
      pgQuery('SELECT count(*)::int AS total FROM "Product" WHERE "isActive"=TRUE'),
      pgQuery('SELECT count(*)::int AS total FROM "ProductVariant" WHERE "isActive"=TRUE AND "stockQuantity"<="lowStockThreshold"'),
    ]);

    const totalRevenue = Number(Number(totals.rows[0]?.revenue || 0).toFixed(2));
    const paidOrdersCount = totals.rows[0]?.paid || 0;
    const statusBreakdown: Record<OrderStatus, number> = {
      [OrderStatus.PENDING]: 0,
      [OrderStatus.CONFIRMED]: 0,
      [OrderStatus.PACKED]: 0,
      [OrderStatus.SHIPPED]: 0,
      [OrderStatus.DELIVERED]: 0,
      [OrderStatus.CANCELLED]: 0,
      [OrderStatus.RETURNED]: 0,
    };
    for (const row of byStatus.rows) {
      if (row.status in statusBreakdown) statusBreakdown[row.status as OrderStatus] = row.count;
    }

    return {
      totalRevenue,
      totalOrders: totals.rows[0]?.total || 0,
      paidOrdersCount,
      averageOrderValue: paidOrdersCount > 0 ? Number((totalRevenue / paidOrdersCount).toFixed(2)) : 0,
      totalCustomers: customers.rows[0]?.total || 0,
      totalProducts: productCount.rows[0]?.total || 0,
      activeProducts: productCount.rows[0]?.total || 0,
      lowStockCount: lowStock.rows[0]?.total || 0,
      statusBreakdown,
      topProducts: top.rows.map((row) => ({
        productId: row.productId,
        productName: row.productName,
        totalQuantitySold: row.qty,
        totalRevenue: Number(Number(row.revenue || 0).toFixed(2)),
      })),
      recentOrders: recent.rows.map((row) => ({
        id: row.id,
        orderNumber: row.orderNumber,
        customerName: row.customerName,
        totalPayableAmount: Number(row.totalPayableAmount),
        orderStatus: row.orderStatus,
        paymentStatus: row.paymentStatus,
        createdAt: new Date(row.createdAt).toISOString(),
      })),
    };
  }

  public static async getDashboardMetrics(): Promise<DashboardMetrics> {
    if (isPostgresConfigured()) {
      return this.getPostgresMetrics();
    }

    let orders: Order[];
    let totalOrders: number;
    let totalCustomers: number;
    let products: Product[];
    let variants: ProductVariant[];
    {
      orders = Array.from(db.orders.values());
      totalOrders = orders.length;
      // "Customers" means active customer accounts — not admins or
      // deactivated users (which were previously included in the count).
      totalCustomers = Array.from(db.users.values()).filter(
        (user) => user.isActive && (user.roles ? user.roles.includes(SystemRole.CUSTOMER) : true)
      ).length;
      products = Array.from(db.products.values()).filter((p) => p.isActive);
      variants = Array.from(db.productVariants.values()).filter((v) => v.isActive);
    }

    let totalRevenue = 0;
    let paidOrdersCount = 0;
    const statusBreakdown: Record<OrderStatus, number> = {
      [OrderStatus.PENDING]: 0,
      [OrderStatus.CONFIRMED]: 0,
      [OrderStatus.PACKED]: 0,
      [OrderStatus.SHIPPED]: 0,
      [OrderStatus.DELIVERED]: 0,
      [OrderStatus.CANCELLED]: 0,
      [OrderStatus.RETURNED]: 0,
    };

    const productSalesMap = new Map<string, { productName: string; qty: number; revenue: number }>();

    for (const order of orders) {
      statusBreakdown[order.orderStatus] = (statusBreakdown[order.orderStatus] || 0) + 1;

      if (order.paymentStatus === PaymentStatus.PAID) {
        totalRevenue += order.totalPayableAmount;
        paidOrdersCount++;

        // Calculate product level contribution
        for (const item of order.items) {
          const variant = variants.find((candidate) => candidate.id === item.variantId);
          const productId = variant?.productId || 'unknown';
          const existing = productSalesMap.get(productId) || {
            productName: item.productNameSnapshot,
            qty: 0,
            revenue: 0,
          };
          existing.qty += item.quantity;
          existing.revenue += item.lineTotal;
          productSalesMap.set(productId, existing);
        }
      }
    }

    totalRevenue = Number(totalRevenue.toFixed(2));
    const averageOrderValue = paidOrdersCount > 0 ? Number((totalRevenue / paidOrdersCount).toFixed(2)) : 0;
    const totalProducts = products.length;
    const lowStockCount = variants.filter((v) => v.stockQuantity <= v.lowStockThreshold).length;

    const topProducts = Array.from(productSalesMap.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.productName,
        totalQuantitySold: data.qty,
        totalRevenue: Number(data.revenue.toFixed(2)),
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        totalPayableAmount: o.totalPayableAmount,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
      }));

    return {
      totalRevenue,
      totalOrders,
      paidOrdersCount,
      averageOrderValue,
      totalCustomers,
      totalProducts,
      activeProducts: totalProducts,
      lowStockCount,
      statusBreakdown,
      topProducts,
      recentOrders,
    };
  }

  public getDashboardMetrics() { return AnalyticsService.getDashboardMetrics(); }
}

export const analyticsService = new AnalyticsService();

