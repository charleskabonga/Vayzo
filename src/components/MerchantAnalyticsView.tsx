/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  Download,
  Calendar,
  AlertTriangle,
  MapPin,
  Smartphone,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  Bell,
  Box
} from 'lucide-react';
import { Merchant, Order, Product, AnalyticsTimeRange } from '../types';
import { formatZMW } from '../utils/economics';
import {
  calculateMerchantAnalytics,
  generateMerchantAnalyticsCSV
} from '../utils/analyticsEngine';
import { notificationService } from '../services/notificationService';

interface MerchantAnalyticsViewProps {
  merchant: Merchant;
  allOrders: Order[];
  products: Product[];
  onSelectProduct?: (productId: string) => void;
}

export const MerchantAnalyticsView: React.FC<MerchantAnalyticsViewProps> = ({
  merchant,
  allOrders,
  products,
  onSelectProduct
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsTimeRange>('30d');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [notifyNewOrders, setNotifyNewOrders] = useState(true);
  const [notifyLowStock, setNotifyLowStock] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Compute live analytics based on selected period
  const analytics = useMemo(() => {
    return calculateMerchantAnalytics(merchant, allOrders, products, selectedPeriod);
  }, [merchant, allOrders, products, selectedPeriod]);

  // Handle CSV Report Export
  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const csvText = generateMerchantAnalyticsCSV(merchant, analytics);
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `vayzo-analytics-${merchant.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${selectedPeriod}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setToastMessage('Analytics CSV Report downloaded successfully!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage('Failed to export CSV report.');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleTestMerchantNotification = () => {
    notificationService.sendPushNotification({
      title: `New Order Alert! (${merchant.name}) 🛍️`,
      body: `Order #VZ-${Math.floor(100000 + Math.random() * 900000)} received for K${(analytics.averageOrderValue || 280).toFixed(0)}. Customer in Kabulonga requested fast delivery.`,
      targetRole: 'merchant',
      targetMerchantId: merchant.id,
      type: 'order',
      playAudio: true
    });
    setToastMessage('Test merchant order notification triggered!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Find max revenue for scaling chart bars
  const maxDailyRevenue = useMemo(() => {
    const max = Math.max(...analytics.dailyTrend.map((d) => d.revenue), 100);
    return max * 1.15;
  }, [analytics.dailyTrend]);

  const maxHourlyCount = useMemo(() => {
    const max = Math.max(...analytics.hourlyDistribution.map((h) => h.orderCount), 1);
    return max * 1.2;
  }, [analytics.hourlyDistribution]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 text-white px-4 py-3 rounded-2xl shadow-2xl border border-lime-400/50 flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-lime-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Analytics Top Control Header */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
              Merchant Intelligence
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              {merchant.township}, Lusaka
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            {merchant.name} Business Analytics
          </h2>
          <p className="text-xs text-slate-500">
            Real-time financial performance, product velocity, and customer delivery analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: 'all', label: 'All Time' }
              ] as { id: AnalyticsTimeRange; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedPeriod(t.id)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedPeriod === t.id
                    ? 'bg-white text-emerald-950 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Export Report */}
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black rounded-xl shadow-xs transition active:scale-95 disabled:opacity-50"
            title="Download CSV spreadsheet report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GMV Card */}
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-3xl p-5 shadow-sm border border-emerald-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300">Total Gross Merchandise (GMV)</span>
            <div className="p-2 rounded-xl bg-emerald-800/80 text-lime-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black tracking-tight">{formatZMW(analytics.totalGMV)}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-lime-400 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+14.8% vs prior period</span>
            </div>
          </div>
          <p className="text-[10px] text-emerald-400/80 mt-3 pt-2 border-t border-emerald-800/60">
            Total sales from merchandise before fees
          </p>
        </div>

        {/* Net Proceeds Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Net Merchant Payout</span>
            <div className="p-2 rounded-xl bg-lime-100 text-emerald-900">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {formatZMW(analytics.netPayout)}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Commission withheld: <span className="font-bold text-rose-600">-{formatZMW(analytics.commissionPaid)}</span> ({((merchant.commissionRate || 0.08) * 100).toFixed(0)}%)
            </p>
          </div>
          <p className="text-[10px] text-emerald-700 font-bold mt-3 pt-2 border-t border-slate-100">
            Directly settled to your business account
          </p>
        </div>

        {/* Order Count & Completion */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Orders & Fulfillment</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {analytics.ordersCount} Orders
            </h3>
            <p className="text-[11px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{analytics.completedOrdersCount} successfully delivered</span>
            </p>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-100">
            Avg prep time: <span className="font-bold text-slate-700">{analytics.averageFulfillmentMins} mins</span>
          </p>
        </div>

        {/* Average Order Value (AOV) & Retention */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Average Basket Value (AOV)</span>
            <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {formatZMW(analytics.averageOrderValue)}
            </h3>
            <p className="text-[11px] text-purple-700 font-bold mt-1">
              {analytics.repeatCustomerPercentage}% repeat customer rate
            </p>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-100">
            High customer retention in Lusaka
          </p>
        </div>
      </div>

      {/* Visual Charts: Daily Revenue Trend & Hourly Peak Ordering Times */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Revenue Trend (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-black text-sm text-slate-900">Daily Revenue & Order Volume</h4>
                <p className="text-xs text-slate-500">Gross sales across the 7-day operational cycle</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-bold">
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Revenue (ZMW)
                </span>
              </div>
            </div>

            {/* Responsive SVG Chart */}
            <div className="relative pt-6 pb-2">
              <div className="h-44 flex items-end justify-between gap-2 px-2 border-b border-slate-200">
                {analytics.dailyTrend.map((day, idx) => {
                  const barHeightPercent = Math.max(12, Math.round((day.revenue / maxDailyRevenue) * 100));
                  const isHovered = hoveredBarIndex === idx;

                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                      onMouseEnter={() => setHoveredBarIndex(idx)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                    >
                      {/* Tooltip */}
                      {isHovered && (
                        <div className="absolute -top-12 z-20 bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none">
                          <p className="font-black">{formatZMW(day.revenue)}</p>
                          <p className="text-slate-400">{day.orders} orders • {day.dayLabel}</p>
                        </div>
                      )}

                      {/* Bar */}
                      <div
                        style={{ height: `${barHeightPercent}%` }}
                        className={`w-full max-w-[42px] rounded-t-xl transition-all duration-200 ${
                          isHovered
                            ? 'bg-lime-500 shadow-md scale-y-102'
                            : 'bg-emerald-800 hover:bg-emerald-700'
                        }`}
                      />

                      <span className="text-[11px] font-bold text-slate-500 mt-2 block">
                        {day.dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Peak Day: <strong className="text-slate-800 font-bold">Saturday (Weekend Groceries)</strong></span>
            <span>Est. Weekly Run Rate: <strong className="text-emerald-800 font-black">{formatZMW(analytics.totalGMV * 1.2)}</strong></span>
          </div>
        </div>

        {/* Peak Ordering Hours in Lusaka (1 col) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-black text-sm text-slate-900">Peak Ordering Hours</h4>
              <Clock className="w-4 h-4 text-emerald-700" />
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Ordering rush in Lusaka peaks at lunch (12-2 PM) and evening dinner (5-8 PM).
            </p>

            <div className="space-y-2.5">
              {analytics.hourlyDistribution.map((slot) => {
                const widthPercent = Math.min(100, Math.round((slot.orderCount / maxHourlyCount) * 100));
                const isRushHour = slot.hour === 12 || slot.hour === 18;

                return (
                  <div key={slot.hour} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`font-bold ${isRushHour ? 'text-emerald-950 font-black' : 'text-slate-600'}`}>
                        {slot.hourLabel}
                      </span>
                      <span className="font-bold text-slate-700">{slot.orderCount} orders</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        style={{ width: `${widthPercent}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          isRushHour ? 'bg-lime-500' : 'bg-emerald-700'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-900">
            <strong>Staffing Tip:</strong> Prepare extra packing staff between 11:30 AM and 1:30 PM to avoid courier wait times.
          </div>
        </div>
      </div>

      {/* Top Products Table & Stock Velocity */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="font-black text-sm text-slate-900">Top Merchandise & Inventory Velocity</h4>
            <p className="text-xs text-slate-500">Track best-sellers and prevent out-of-stock situations</p>
          </div>
          <span className="text-xs font-bold text-slate-600">
            {analytics.topProducts.length} Items Monitored
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="pb-3 pl-2">Product Name</th>
                <th className="pb-3">Category</th>
                <th className="pb-3 text-center">Units Sold</th>
                <th className="pb-3 text-right">Revenue (ZMW)</th>
                <th className="pb-3 text-center">Current Stock</th>
                <th className="pb-3 text-center">Velocity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.topProducts.slice(0, 8).map((p) => (
                <tr key={p.productId} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 pl-2 font-black text-slate-800 flex items-center gap-2">
                    <span>{p.name}</span>
                  </td>
                  <td className="py-3 text-slate-500 font-medium">{p.category}</td>
                  <td className="py-3 text-center font-black text-slate-900">{p.unitsSold} units</td>
                  <td className="py-3 text-right font-black text-emerald-800">{formatZMW(p.revenue)}</td>
                  <td className="py-3 text-center font-bold">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] ${
                        p.currentStock < 10
                          ? 'bg-rose-100 text-rose-800 font-black'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {p.currentStock} in stock
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    {p.stockVelocity === 'low_stock_risk' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Low Stock Risk
                      </span>
                    ) : p.stockVelocity === 'fast' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-lime-100 text-emerald-900 border border-lime-300">
                        <TrendingUp className="w-3 h-3 text-emerald-700" />
                        Fast Mover
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        Optimal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Grid: Township Proximity, Payment Channels & Push Preferences */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Township Delivery Proximity */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-black text-sm text-slate-900">Township Proximity & Demand</h4>
            <MapPin className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Customer distribution across Lusaka townships from {merchant.township}.
          </p>

          <div className="space-y-3">
            {analytics.townshipBreakdown.map((t) => (
              <div key={t.township} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <h5 className="font-black text-slate-900">{t.township}</h5>
                  <p className="text-[11px] text-slate-500">{t.avgDistanceKm.toFixed(1)} km transit</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-emerald-800 block">{formatZMW(t.gmv)}</span>
                  <span className="text-[10px] font-bold text-slate-400">{t.orders} deliveries</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Money Payment Channels */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-black text-sm text-slate-900">Payment Channels Split</h4>
            <Smartphone className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Upfront merchandise settlements via Zambian mobile money networks.
          </p>

          <div className="space-y-3.5">
            {analytics.paymentMethodBreakdown.map((pm) => (
              <div key={pm.method} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">{pm.label}</span>
                  <span className="font-black text-slate-900">{pm.percentage}% ({formatZMW(pm.amount)})</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    style={{ width: `${pm.percentage}%` }}
                    className={`h-full rounded-full ${
                      pm.method === 'MTN_MOMO'
                        ? 'bg-amber-400'
                        : pm.method === 'AIRTEL_MONEY'
                        ? 'bg-rose-500'
                        : 'bg-emerald-600'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
            💡 Step 2 courier fees are settled separately in cash upon delivery to the rider.
          </div>
        </div>

        {/* Merchant Push Notification Alerts */}
        <div className="bg-gradient-to-br from-emerald-950 to-slate-900 text-white rounded-3xl p-5 shadow-xs border border-emerald-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-black text-sm text-white">Merchant Push Alerts</h4>
              <Bell className="w-4 h-4 text-lime-400" />
            </div>
            <p className="text-xs text-emerald-300/80 mb-4">
              Get notified immediately on your phone or desktop when customers place orders.
            </p>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-900/60 border border-emerald-800/80 cursor-pointer">
                <span className="font-bold">Instant Order Push Alerts</span>
                <input
                  type="checkbox"
                  checked={notifyNewOrders}
                  onChange={(e) => setNotifyNewOrders(e.target.checked)}
                  className="rounded text-lime-400 focus:ring-lime-400 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-900/60 border border-emerald-800/80 cursor-pointer">
                <span className="font-bold">Low Stock Risk Notifications</span>
                <input
                  type="checkbox"
                  checked={notifyLowStock}
                  onChange={(e) => setNotifyLowStock(e.target.checked)}
                  className="rounded text-lime-400 focus:ring-lime-400 w-4 h-4"
                />
              </label>
            </div>
          </div>

          <button
            onClick={handleTestMerchantNotification}
            className="mt-4 w-full py-2.5 bg-lime-400 hover:bg-lime-300 text-emerald-950 font-black text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Test Merchant Push Alert</span>
          </button>
        </div>
      </div>
    </div>
  );
};
