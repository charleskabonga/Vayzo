/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  History,
  RotateCcw,
  CheckCircle2,
  Clock,
  Store,
  MapPin,
  Bike,
  Car,
  ChevronRight,
  Plus,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Order, Merchant, Product, OrderItem } from '../types';
import { formatZMW } from '../utils/economics';
import { getDistanceBetweenTownships } from '../utils/distance';

interface OrderHistorySectionProps {
  orders: Order[];
  merchants: Merchant[];
  products: Product[];
  selectedTownship: string;
  onReorderOrder: (order: Order) => void;
  onReorderSingleItem: (item: { productId: string; name: string; quantity: number }, merchantName: string) => void;
  onViewOrderTracking: (order: Order) => void;
  onBrowseStores: () => void;
}

export const OrderHistorySection: React.FC<OrderHistorySectionProps> = ({
  orders,
  merchants,
  products,
  selectedTownship,
  onReorderOrder,
  onReorderSingleItem,
  onViewOrderTracking,
  onBrowseStores
}) => {
  const [filter, setFilter] = useState<'all' | 'delivered' | 'in_transit'>('all');
  const [reorderedOrderId, setReorderedOrderId] = useState<string | null>(null);

  const deliveredOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'DELIVERED');
  }, [orders]);

  const inTransitOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'DELIVERED');
  }, [orders]);

  const displayedOrders = useMemo(() => {
    if (filter === 'delivered') return deliveredOrders;
    if (filter === 'in_transit') return inTransitOrders;
    return orders;
  }, [orders, deliveredOrders, inTransitOrders, filter]);

  const handleReorderClick = (order: Order) => {
    setReorderedOrderId(order.id);
    onReorderOrder(order);
    setTimeout(() => setReorderedOrderId(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Order History Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/80">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-lime-400/20 text-lime-300 border border-lime-400/30">
            <History className="w-3.5 h-3.5 text-lime-400" />
            <span>Lusaka Delivery Records & Quick Reordering</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Order History & Instant Reorder
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Quickly reorder items from your previous successful deliveries from Shoprite, Pick n Pay, Hungry Lion, and local merchants across Lusaka.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shrink-0 ${
              filter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-slate-50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>All Deliveries ({orders.length})</span>
          </button>

          <button
            onClick={() => setFilter('delivered')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shrink-0 ${
              filter === 'delivered'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-emerald-900 hover:bg-emerald-50 bg-emerald-50/50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Completed Deliveries ({deliveredOrders.length})</span>
          </button>

          <button
            onClick={() => setFilter('in_transit')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shrink-0 ${
              filter === 'in_transit'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-900 hover:bg-amber-50 bg-amber-50/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>In-Transit ({inTransitOrders.length})</span>
          </button>
        </div>

        <button
          onClick={onBrowseStores}
          className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
        >
          <span>← Browse Stores</span>
        </button>
      </div>

      {/* Orders List */}
      {displayedOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-slate-800 text-base">No orders found in this view</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {filter === 'delivered'
              ? 'You have not completed any deliveries yet. Place an order to see it here for quick reordering.'
              : 'No orders match your filter. Browse our Lusaka stores to start shopping.'}
          </p>
          <button
            onClick={onBrowseStores}
            className="mt-4 px-5 py-2.5 bg-emerald-800 text-white font-black text-xs rounded-xl shadow-sm hover:bg-emerald-900 transition"
          >
            Browse Stores & Shop Now
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedOrders.map((order) => {
            const isDelivered = order.status === 'DELIVERED';
            const merchant = merchants.find((m) => m.id === order.merchantId);
            const shopTownship = merchant?.township || 'Rhodes Park';
            const customerTownship = order.deliveryAddress?.township || selectedTownship;
            const distanceKm = getDistanceBetweenTownships(shopTownship, customerTownship);
            const isRecentlyReordered = reorderedOrderId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition hover:border-emerald-500/50 hover:shadow-md"
              >
                {/* Order Card Top Bar */}
                <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-black text-sm">
                      <Store className="w-5 h-5 text-emerald-800" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-base">
                          {order.merchantName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-200 text-slate-700">
                          {merchant?.category || 'Store'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Order #{order.id} • Placed {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                        isDelivered
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-lime-100 text-emerald-950 border border-lime-300'
                      }`}
                    >
                      {isDelivered ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Delivered Successfully</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-emerald-800" />
                          <span>{order.status.replace('_', ' ')}</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Delivery Logistics & Distance Route */}
                <div className="px-5 py-3 bg-emerald-50/40 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      <span>
                        Route: <strong>{shopTownship} → {customerTownship}</strong> ({distanceKm.toFixed(1)} km)
                      </span>
                    </div>

                    <span className="text-slate-300 hidden sm:inline">•</span>

                    <div className="flex items-center gap-1.5 font-medium">
                      {order.vehicleType === 'taxi' ? (
                        <Car className="w-3.5 h-3.5 text-teal-700" />
                      ) : (
                        <Bike className="w-3.5 h-3.5 text-emerald-700" />
                      )}
                      <span>
                        {order.vehicleType === 'taxi' ? 'Cargo Cab' : 'Motorbike Biker'}: <strong>{order.riderName || 'Bwalya Tembo'}</strong>
                        {order.vehiclePlate && <span className="text-[11px] text-slate-500 ml-1">({order.vehiclePlate})</span>}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono">
                    Handover PIN: <strong className="text-slate-800">{order.deliveryConfirmationCode}</strong>
                  </div>
                </div>

                {/* Ordered Items List */}
                <div className="p-5 space-y-4">
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Delivered Items ({order.items.length})
                    </h5>

                    <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden">
                      {order.items.map((item, idx) => {
                        const matchingProduct =
                          products.find((p) => p.id === item.productId) ||
                          products.find((p) => p.name.toLowerCase() === item.name.toLowerCase());
                        const itemImageUrl =
                          matchingProduct?.imageUrl ||
                          'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80';

                        return (
                          <div
                            key={`${item.productId}-${idx}`}
                            className="p-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 hover:bg-slate-50 transition"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <img
                                src={itemImageUrl}
                                alt={item.name}
                                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                              <div className="min-w-0">
                                <h6 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                  {item.name}
                                </h6>
                                <p className="text-[11px] text-slate-500">
                                  {item.packSize || item.unit} • {formatZMW(item.price)} each
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                              <div className="text-right">
                                <span className="font-bold text-slate-900 text-xs block">
                                  {formatZMW(item.subtotal || item.price * item.quantity)}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  Qty: {item.quantity}
                                </span>
                              </div>

                              <button
                                onClick={() =>
                                  onReorderSingleItem(
                                    {
                                      productId: item.productId,
                                      name: item.name,
                                      quantity: item.quantity
                                    },
                                    order.merchantName
                                  )
                                }
                                className="px-3 py-1.5 rounded-xl border border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-bold text-xs flex items-center gap-1 transition"
                                title="Reorder just this product"
                              >
                                <Plus className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Reorder Item</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dual Payment & Financial Breakdown */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">Step 1 Merchandise:</span>
                        <span className="font-black text-slate-900">{formatZMW(order.stage1Amount || order.subtotal + (order.serviceFee || 5))}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                          Paid via {order.stage1PaymentMethod?.replace('_', ' ') || 'Mobile Money'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">Step 2 Courier ({order.vehicleType === 'biker' ? 'Motorbike' : 'Cargo Cab'}):</span>
                        <span className="font-black text-emerald-800">{formatZMW(order.stage2Amount || order.deliveryFee)}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                          Paid in Cash on Delivery ({distanceKm.toFixed(1)} km)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 block">Total Order Value:</span>
                        <span className="text-lg font-black text-slate-900">
                          {formatZMW(order.total)}
                        </span>
                      </div>

                      {/* Primary Reorder All Items Button */}
                      <button
                        onClick={() => handleReorderClick(order)}
                        className={`px-5 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-2 shadow-sm ${
                          isRecentlyReordered
                            ? 'bg-lime-400 text-emerald-950 scale-102'
                            : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                        }`}
                      >
                        {isRecentlyReordered ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-950" />
                            <span>Added to Basket!</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-4 h-4 text-white" />
                            <span>Reorder All Items ({order.items.length})</span>
                          </>
                        )}
                      </button>

                      {!isDelivered && (
                        <button
                          onClick={() => onViewOrderTracking(order)}
                          className="px-4 py-2.5 rounded-xl border border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-bold text-xs flex items-center gap-1.5 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Track Live</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
