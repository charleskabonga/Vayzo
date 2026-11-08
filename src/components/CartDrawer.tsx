/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Store } from 'lucide-react';
import { CartItem } from '../types';
import { formatZMW } from '../utils/economics';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onClearCart,
  onProceedToCheckout
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = items.length > 0 ? 25 : 0;
  const serviceFee = items.length > 0 ? 5 : 0;
  const total = subtotal + deliveryFee + serviceFee;

  // Group items by merchant
  const groupedByMerchant = items.reduce<Record<string, { merchantName: string; items: CartItem[] }>>(
    (acc, item) => {
      const mId = item.product.merchantId;
      if (!acc[mId]) {
        acc[mId] = { merchantName: item.product.merchantName, items: [] };
      }
      acc[mId].items.push(item);
      return acc;
    },
    {}
  );

  const distinctMerchantsCount = Object.keys(groupedByMerchant).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-800" />
              <h2 className="font-bold text-slate-900 text-lg">Your Shopping Basket</h2>
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                {items.reduce((s, i) => s + i.quantity, 0)} items
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Your cart is empty</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-xs">
                  Discover fresh produce, breakfast mealie meal, and pantry essentials from local Lusaka shops.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {distinctMerchantsCount > 1 && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                    <Store className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Your order contains items from {distinctMerchantsCount} different shops. Deliveries will be consolidated.</span>
                  </div>
                )}

                {Object.entries(groupedByMerchant).map(([mId, group]) => (
                  <div key={mId} className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 flex items-center gap-2 text-xs font-bold text-emerald-900">
                      <Store className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{group.merchantName}</span>
                    </div>

                    <div className="divide-y divide-slate-100 p-2">
                      {group.items.map((item) => (
                        <div key={item.product.id} className="py-3 px-2 flex items-center justify-between gap-3">
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-14 h-14 rounded-xl object-cover border border-slate-100 shrink-0"
                          />

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-xs text-slate-900 truncate">
                              {item.product.name}
                            </h4>
                            <p className="text-[11px] text-slate-500">{item.product.packSize}</p>
                            <p className="text-xs font-bold text-emerald-800 mt-0.5">
                              {formatZMW(item.product.price)}
                            </p>
                          </div>

                          {/* Quantity control */}
                          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center rounded text-slate-700 hover:bg-white active:scale-95"
                              aria-label={`Decrease ${item.product.name}`}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center font-bold text-xs text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center rounded text-slate-700 hover:bg-white active:scale-95"
                              aria-label={`Increase ${item.product.name}`}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {items.length > 0 && (
            <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Goods Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatZMW(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Platform Management Fee</span>
                  <span className="font-semibold text-slate-900">{formatZMW(serviceFee)}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold bg-emerald-50 px-2 py-1 rounded">
                  <span>Step 1 MoMo Upfront</span>
                  <span>{formatZMW(subtotal + serviceFee)}</span>
                </div>
                <div className="flex justify-between text-amber-900 font-bold bg-amber-50 px-2 py-1 rounded">
                  <span>Step 2 Courier (Cash on Delivery)</span>
                  <span>From {formatZMW(deliveryFee)} (Biker)</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm">
                  <span className="font-black text-slate-900">Total Estimated Trip Cost</span>
                  <span className="font-black text-emerald-950 text-base">{formatZMW(total)}</span>
                </div>
              </div>

              <button
                onClick={onProceedToCheckout}
                className="w-full py-3.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition active:scale-98"
              >
                <span>Proceed to Checkout & Courier Booking</span>
                <ArrowRight className="w-4 h-4 text-lime-400" />
              </button>

              <p className="text-[10px] text-slate-400 text-center">
                Two-step checkout: Goods via MTN/Airtel/Zamtel, delivery fee in Cash upon arrival.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
