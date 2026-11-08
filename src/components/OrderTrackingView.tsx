/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Bike,
  Car,
  Store,
  Phone,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Banknote,
  AlertCircle
} from 'lucide-react';
import { Order } from '../types';
import { formatZMW } from '../utils/economics';
import { ORDER_STATUS_LABELS, OrderStatus } from '../utils/orderStateMachine';

interface OrderTrackingViewProps {
  order: Order;
  onBack: () => void;
  onAdvanceStatus?: (orderId: string, nextStatus: OrderStatus) => void;
}

const LIFECYCLE_STEPS: OrderStatus[] = [
  'CONFIRMED',
  'MERCHANT_ACCEPTED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'RIDER_ASSIGNED',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED'
];

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  order,
  onBack,
  onAdvanceStatus
}) => {
  const currentStepIndex = LIFECYCLE_STEPS.indexOf(order.status);
  const isDelivered = order.status === 'DELIVERED';
  const isTaxi = order.vehicleType === 'taxi';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Navigation */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Storefront</span>
      </button>

      {/* Main Status Header Card */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-emerald-900/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-lime-400 uppercase tracking-wider mb-1">
              <span className="flex h-2 w-2 rounded-full bg-lime-400 animate-ping" />
              <span>Live Order & Courier Tracking</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black">Order #{order.id}</h1>
            <p className="text-xs text-emerald-200/80 mt-1">
              Store: <strong>{order.merchantName}</strong> • Dispatched via{' '}
              <strong className="text-lime-300">
                {isTaxi ? 'Cargo Cab / Taxi' : 'Motorbike Biker'}
              </strong>
            </p>
          </div>

          {/* Verification Code Box for Delivery Handover */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center shrink-0">
            <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold block">
              Customer Handover PIN
            </span>
            <span className="text-3xl font-black font-mono tracking-widest text-lime-300 mt-1 block">
              {order.deliveryConfirmationCode}
            </span>
            <span className="text-[10px] text-emerald-200/70 block mt-1">
              Pay cash to courier, then give this PIN
            </span>
          </div>
        </div>

        {/* Dual Payment Status Strip (Yango Operating Model) */}
        <div className="relative z-10 mt-6 pt-4 border-t border-emerald-800/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Stage 1: Merchandise Payment */}
          <div className="bg-emerald-900/40 border border-emerald-700/60 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-300">
                Stage 1: Merchandise & Service
              </span>
              <p className="font-black text-sm text-white">
                {formatZMW(order.stage1Amount || order.subtotal + (order.serviceFee || 5))}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-lime-400 text-emerald-950 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>PAID ({order.stage1PaymentMethod?.replace('_', ' ') || 'MTN MOMO'})</span>
            </span>
          </div>

          {/* Stage 2: Courier Fee (Cash on Delivery) */}
          <div className="bg-emerald-900/40 border border-emerald-700/60 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-300">
                Stage 2: Courier {isTaxi ? 'Taxi' : 'Biker'} Fee
              </span>
              <p className="font-black text-sm text-lime-300">
                {formatZMW(order.stage2Amount || order.deliveryFee || 25)}
              </p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 ${
                isDelivered || order.stage2Paid
                  ? 'bg-lime-400 text-emerald-950'
                  : 'bg-amber-400 text-amber-950 animate-pulse'
              }`}
            >
              <Banknote className="w-3 h-3" />
              <span>
                {isDelivered || order.stage2Paid ? 'CASH PAID TO DRIVER' : 'CASH DUE ON ARRIVAL'}
              </span>
            </span>
          </div>
        </div>

        {/* Status Stepper Tracker */}
        <div className="relative z-10 mt-6 pt-6 border-t border-emerald-800/60">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            {LIFECYCLE_STEPS.map((step, idx) => {
              const isPast = currentStepIndex > idx;
              const isCurrent = currentStepIndex === idx;
              const label = ORDER_STATUS_LABELS[step]?.label || step;

              return (
                <div key={step} className="flex flex-col items-center text-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition ${
                      isPast
                        ? 'bg-lime-400 text-emerald-950'
                        : isCurrent
                        ? 'bg-white text-emerald-950 ring-4 ring-lime-400/40 shadow-lg'
                        : 'bg-emerald-900/60 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[10px] leading-tight ${
                      isCurrent
                        ? 'font-black text-lime-300'
                        : isPast
                        ? 'font-medium text-emerald-100'
                        : 'text-emerald-400/60'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Development Quick Advance Control */}
        {onAdvanceStatus && currentStepIndex < LIFECYCLE_STEPS.length - 1 && (
          <div className="mt-6 pt-4 border-t border-emerald-900/60 flex items-center justify-between text-xs text-emerald-300">
            <span>[Dev Simulation Control]</span>
            <button
              onClick={() => onAdvanceStatus(order.id, LIFECYCLE_STEPS[currentStepIndex + 1])}
              className="px-3 py-1 bg-lime-400 text-emerald-950 font-bold rounded-lg hover:bg-lime-300 transition"
            >
              Advance to: {ORDER_STATUS_LABELS[LIFECYCLE_STEPS[currentStepIndex + 1]]?.label}
            </button>
          </div>
        )}
      </div>

      {/* Grid: Courier Details + Itemized Receipt */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Courier & Landmark Navigation */}
        <div className="md:col-span-2 space-y-6">
          {/* Courier Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                {isTaxi ? <Car className="w-4 h-4 text-teal-700" /> : <Bike className="w-4 h-4 text-emerald-700" />}
                <span>
                  Assigned Courier ({isTaxi ? 'Cargo Cab / Taxi' : 'Motorbike Biker'})
                </span>
              </h3>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                Cash Fee: {formatZMW(order.stage2Amount || order.deliveryFee || 25)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center font-bold text-emerald-900 text-lg">
                  {order.riderName ? order.riderName[0] : isTaxi ? 'M' : 'B'}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">
                    {order.riderName || (isTaxi ? 'Mwamba Chileshe' : 'Bwalya Tembo')}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {order.vehiclePlate || (isTaxi ? 'BCL 8821 ZM (Toyota Corolla)' : 'ABX 4920 ZM (Honda Ace)')} • Rating 4.9 ★
                  </p>
                </div>
              </div>

              <a
                href={`tel:${order.riderPhone || order.customerPhone}`}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 hover:bg-emerald-100 transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Courier</span>
              </a>
            </div>

            {/* Cash Handover Reminder Box */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Cash Payment on Handover:</strong> Please prepare exact cash of{' '}
                <span className="font-black text-amber-900">
                  {formatZMW(order.stage2Amount || order.deliveryFee || 25)}
                </span>{' '}
                to give the courier upon package arrival. Then share your 4-digit PIN (
                <span className="font-mono font-bold text-slate-900">{order.deliveryConfirmationCode}</span>
                ) to confirm completion.
              </div>
            </div>
          </div>

          {/* Destination Landmark & Delivery Address */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>Delivery Destination (Lusaka)</span>
            </h3>

            <div className="space-y-2 text-xs text-slate-700">
              <p className="font-bold text-sm text-slate-900">
                {order.deliveryAddress.housePlotNumber}, {order.deliveryAddress.street}, {order.deliveryAddress.township}
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-medium">
                <strong>Landmark:</strong> {order.deliveryAddress.landmark}
              </div>
              {order.deliveryAddress.deliveryInstructions && (
                <p className="text-slate-500">
                  <strong>Notes:</strong> {order.deliveryAddress.deliveryInstructions}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Transparent Itemized Receipt (Yango Breakdown) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-4">
              Itemized Receipt
            </h3>

            <div className="divide-y divide-slate-100 text-xs">
              {order.items.map((item) => (
                <div key={item.productId} className="py-2.5 flex justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-[11px] text-slate-500">Qty: {item.quantity} • {item.packSize}</p>
                  </div>
                  <span className="font-bold text-slate-800">{formatZMW(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200 space-y-2 text-xs">
              {/* Stage 1 items */}
              <div className="flex justify-between text-slate-600">
                <span>Merchandise Subtotal</span>
                <span>{formatZMW(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform Management Fee</span>
                <span>{formatZMW(order.serviceFee || 5)}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-bold bg-emerald-50 px-2 py-1 rounded">
                <span>Stage 1 (MoMo)</span>
                <span>{formatZMW(order.stage1Amount || order.subtotal + 5)}</span>
              </div>

              {/* Stage 2 courier */}
              <div className="flex justify-between text-amber-900 font-bold bg-amber-50 px-2 py-1 rounded mt-1">
                <span>Stage 2 Courier ({isTaxi ? 'Taxi' : 'Biker'} Cash)</span>
                <span>{formatZMW(order.stage2Amount || order.deliveryFee || 25)}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-emerald-950">
                <span>Total Trip Cost</span>
                <span>{formatZMW(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Digital receipt verified on Vayzo immutable ledger.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
