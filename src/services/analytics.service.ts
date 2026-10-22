// ==============================================================================
// DATABASE-DRIVEN ANALYTICS SERVICE — SHOLKVEDA
// Real Aggregated Business Intelligence (Zero Mock / Fake Data)
// ==============================================================================

import { db } from '@/lib/db';
import { isPostgresConfigured, pgQuery } from '@/lib/postgres';
import { OrderRepository } from '@/repositories/order.repository';
import { ProductRepository } from '@/repositories/product.repository';
import { OrderStatus, PaymentStatus, Product, ProductVariant, Order } from '@/types';

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
  public static async getDashboardMetrics(): Promise<DashboardMetrics> {
    let orders: Order[];
    let totalOrders: number;
    let totalCustomers: number;
    let products: Product[];
    let variants: ProductVariant[];
    if (isPostgresConfigured()) {
      const orderResult = await OrderRepository.listOrders({ limit: 1000 });
      orders = orderResult.orders;
      totalOrders = orderResult.total;
      const usersResult = await pgQuery('SELECT count(*)::int AS total FROM "User" WHERE "isActive"=TRUE');
      totalCustomers = usersResult.rows[0]?.total || 0;
      const productsResult = await ProductRepository.listProducts({ limit: 1000 });
      products = productsResult.products.filter((p) => p.isActive);
      variants = products.flatMap((p) => p.variants || []).filter((v) => v.isActive);
    } else {
      orders = Array.from(db.orders.values());
      totalOrders = orders.length;
      totalCustomers = Array.from(db.users.values()).length;
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

