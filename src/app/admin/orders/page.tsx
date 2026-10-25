'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Order, OrderStatus } from '@/types';
import { ShoppingCart, Search, Eye, Filter, CheckCircle2, Clock } from 'lucide-react';

const PAGE_SIZE = 25;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Filtering/searching happens server-side — previously only the first 25
  // orders were downloaded and filtered in the browser, so anything older
  // was undiscoverable.
  const fetchOrders = async (targetPage = page, status = statusFilter, query = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(targetPage), limit: String(PAGE_SIZE) });
      if (status !== 'ALL') params.set('status', status);
      if (query.trim()) params.set('q', query.trim());
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setOrders(data.data.orders || []);
        setTotalPages(data.data.totalPages || 1);
        setTotalOrders(data.data.total ?? (data.data.orders || []).length);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, statusFilter, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchOrders(1, statusFilter, search);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    fetchOrders(nextPage, statusFilter, search);
  };

  const filteredOrders = orders;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#F3EFE6] shadow-sm flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-bold text-gray-900">
            Order Fulfillment & Dispatch Desk
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Process Pan-India orders, update courier tracking numbers, and fulfill customer shipments.
          </p>
        </div>

        {/* Status filters wrap onto multiple rows on small screens instead
            of overflowing the card (7 pills are ~560px wide in one row). */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter orders by status">
          {['ALL', 'PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => { setPage(1); setStatusFilter(st); }}
              aria-pressed={statusFilter === st}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-[#1B4332] text-white'
                  : 'bg-[#FAF7F2] text-gray-700 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#F3EFE6] flex items-center gap-3">
        <Search className="w-5 h-5 shrink-0 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order # (e.g. AE-2026-0001), customer name, or destination city..."
          className="min-w-0 flex-1 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-[#F3EFE6] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading fulfillment queue...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <ShoppingCart className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-sm font-bold text-gray-700">No matching orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Minimum width keeps all 7 columns readable on phones —
                the wrapper scrolls sideways instead of crushing cells. */}
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-[#FAF7F2] text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Order Reference</th>
                  <th className="py-3 px-4">Customer & City</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Fulfillment Status</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#1B4332] whitespace-nowrap">
                      #{ord.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-gray-900 block truncate max-w-[180px]">
                        {ord.shippingAddress.fullName}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {ord.shippingAddress.city}, {ord.shippingAddress.state}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-gray-900 block">{ord.paymentMethod}</span>
                      <span
                        className={`text-[10px] font-bold ${
                          ord.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ord.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'SHIPPED'
                            ? 'bg-blue-100 text-blue-800'
                            : ord.status === 'PACKED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {ord.paymentStatus === 'PAID' && ord.status === 'PENDING' ? 'AWAITING APPROVAL' : ord.status === 'CONFIRMED' ? 'APPROVED' : ord.status === 'SHIPPED' ? 'SHIPPED' : ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#1B4332] whitespace-nowrap">₹{ord.totalAmount}</td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/orders/${ord.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FAF7F2] text-[#1B4332] hover:bg-[#1B4332] hover:text-white font-bold text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Fulfill</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages} · {totalOrders} orders
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => changePage(Math.max(1, page - 1))}
                disabled={page <= 1 || loading}
                className="whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF7F2] text-gray-700 hover:bg-gray-200 disabled:opacity-40"
              >
                ← Previous
              </button>
              <button
                onClick={() => changePage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages || loading}
                className="whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF7F2] text-gray-700 hover:bg-gray-200 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
