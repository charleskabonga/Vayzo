/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Bike,
  Car,
  Power,
  MapPin,
  CheckCircle2,
  Phone,
  AlertCircle,
  ShieldAlert,
  DollarSign,
  Navigation,
  Key,
  Banknote
} from 'lucide-react';
import { Order, VehicleOption } from '../types';
import { formatZMW } from '../utils/economics';
import { calculateRiderEarnings } from '../utils/dispatchEngine';
import { OrderStatus } from '../utils/orderStateMachine';

interface RiderPortalProps {
  orders: Order[];
  onAdvanceOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
}

export const RiderPortal: React.FC<RiderPortalProps> = ({ orders, onAdvanceOrderStatus }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [vehicleMode, setVehicleMode] = useState<VehicleOption>('biker');
  const [activeTab, setActiveTab] = useState<'deliveries' | 'earnings'>('deliveries');
  const [pickupInputCode, setPickupInputCode] = useState('');
  const [deliveryInputCode, setDeliveryInputCode] = useState('');
  const [cashCollectedConfirmed, setCashCollectedConfirmed] = useState(false);
  const [codeError, setCodeError] = useState('');

  // Active delivery for rider (orders in READY_FOR_PICKUP, RIDER_ASSIGNED, PICKED_UP, or IN_TRANSIT)
  const activeOrder = orders.find(
    (o) => ['READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status)
  );

  const completedOrders = orders.filter((o) => o.status === 'DELIVERED');

  const handleVerifyPickup = (order: Order) => {
    setCodeError('');
    if (pickupInputCode.trim() !== order.pickupVerificationCode) {
      setCodeError(`Invalid pickup code. Ask the merchant for their 4-digit code (e.g. ${order.pickupVerificationCode}).`);
      return;
    }
    onAdvanceOrderStatus(order.id, 'PICKED_UP');
    setPickupInputCode('');
  };

  const handleVerifyDelivery = (order: Order) => {
    setCodeError('');
    if (!cashCollectedConfirmed) {
      setCodeError(`Please collect ${formatZMW(order.stage2Amount || order.deliveryFee || 25)} in CASH from customer first and check the confirmation box.`);
      return;
    }

    if (deliveryInputCode.trim() !== order.deliveryConfirmationCode) {
      setCodeError(`Invalid confirmation PIN. Ask customer for their 4-digit handover PIN (e.g. ${order.deliveryConfirmationCode}).`);
      return;
    }

    onAdvanceOrderStatus(order.id, 'DELIVERED');
    setDeliveryInputCode('');
    setCashCollectedConfirmed(false);
  };

  const cashDue = activeOrder ? (activeOrder.stage2Amount || activeOrder.deliveryFee || (activeOrder.vehicleType === 'taxi' ? 50 : 25)) : 25;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      {/* Online / Offline Status Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center font-bold text-emerald-900">
            {vehicleMode === 'taxi' ? <Car className="w-6 h-6" /> : <Bike className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">
                {vehicleMode === 'taxi' ? 'Driver: Mwamba Chileshe' : 'Courier: Bwalya Tembo'}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                4.9 ★
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {vehicleMode === 'taxi' ? 'Toyota Corolla Cab (BCL 8821 ZM)' : 'Honda Ace 125 Motorbike (ABX 4920 ZM)'} • Lusaka Zone
            </p>
          </div>
        </div>

        {/* Vehicle Toggle & Online Button */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setVehicleMode('biker')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                vehicleMode === 'biker' ? 'bg-emerald-800 text-white' : 'text-slate-600'
              }`}
            >
              Biker
            </button>
            <button
              onClick={() => setVehicleMode('taxi')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                vehicleMode === 'taxi' ? 'bg-teal-800 text-white' : 'text-slate-600'
              }`}
            >
              Taxi
            </button>
          </div>

          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs shadow-sm transition active:scale-95 ${
              isOnline
                ? 'bg-lime-400 text-emerald-950 font-black'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-slate-100 p-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab('deliveries')}
          className={`flex-1 py-2.5 rounded-xl transition ${
            activeTab === 'deliveries' ? 'bg-emerald-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Active Deliveries
        </button>
        <button
          onClick={() => setActiveTab('earnings')}
          className={`flex-1 py-2.5 rounded-xl transition ${
            activeTab === 'earnings' ? 'bg-emerald-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Earnings & Cash Collected
        </button>
      </div>

      {/* Deliveries Tab */}
      {activeTab === 'deliveries' && (
        <div className="space-y-4">
          {!isOnline ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
              <Power className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800">You are currently offline</h3>
              <p className="text-xs text-slate-400 mt-1">Toggle online above to start receiving Lusaka delivery requests.</p>
            </div>
          ) : activeOrder ? (
            <div className="bg-white rounded-3xl p-6 border-2 border-emerald-600 shadow-md space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Active Trip #{activeOrder.id} • {activeOrder.vehicleType === 'taxi' ? 'Taxi' : 'Biker'}
                  </span>
                </div>
                <span className="text-xs font-black px-3 py-1 bg-amber-100 text-amber-950 rounded-lg border border-amber-300">
                  Collect Cash: {formatZMW(cashDue)}
                </span>
              </div>

              {codeError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{codeError}</span>
                </div>
              )}

              {/* Step 1: Merchant Collection */}
              {(activeOrder.status === 'READY_FOR_PICKUP' || activeOrder.status === 'RIDER_ASSIGNED') && (
                <div className="space-y-4 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase">
                    <Navigation className="w-4 h-4 text-emerald-700" />
                    <span>Step 1: Go to Store for Collection</span>
                  </div>

                  <div className="text-xs space-y-1">
                    <p className="font-bold text-sm text-slate-900">{activeOrder.merchantName}</p>
                    <p className="text-slate-600">Location: Bishops Road, Kabulonga</p>
                    <p className="text-slate-500">Items: {activeOrder.items.length} packaged parcels</p>
                  </div>

                  <div className="pt-2 border-t border-emerald-200/60 flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={pickupInputCode}
                      onChange={(e) => setPickupInputCode(e.target.value)}
                      placeholder="Enter 4-digit code (4912)"
                      className="w-full sm:w-48 text-xs font-mono font-bold border border-slate-300 rounded-xl px-3 py-2 bg-white outline-none"
                    />
                    <button
                      onClick={() => handleVerifyPickup(activeOrder)}
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-800 text-white font-bold text-xs rounded-xl hover:bg-emerald-900 transition"
                    >
                      Verify Pickup & Depart
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Customer Handover & Cash Collection (Yango Operating Model) */}
              {(activeOrder.status === 'PICKED_UP' || activeOrder.status === 'IN_TRANSIT') && (
                <div className="space-y-4 bg-teal-50/60 p-4 rounded-2xl border border-teal-200/80">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-900 uppercase">
                    <MapPin className="w-4 h-4 text-teal-700" />
                    <span>Step 2: Deliver to Customer & Collect Cash</span>
                  </div>

                  <div className="text-xs space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-sm text-slate-900">{activeOrder.customerName}</p>
                        <p className="text-slate-600">
                          {activeOrder.deliveryAddress.housePlotNumber}, {activeOrder.deliveryAddress.street}, {activeOrder.deliveryAddress.township}
                        </p>
                      </div>
                      <a
                        href={`tel:${activeOrder.customerPhone}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 text-white font-bold text-xs rounded-lg"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-teal-200 text-teal-950 font-medium">
                      <strong>Landmark:</strong> {activeOrder.deliveryAddress.landmark}
                    </div>
                  </div>

                  {activeOrder.status === 'PICKED_UP' && (
                    <button
                      onClick={() => onAdvanceOrderStatus(activeOrder.id, 'IN_TRANSIT')}
                      className="w-full py-2 bg-emerald-800 text-white font-bold text-xs rounded-xl"
                    >
                      Start Navigation (In Transit)
                    </button>
                  )}

                  {activeOrder.status === 'IN_TRANSIT' && (
                    <div className="pt-3 border-t border-teal-200/80 space-y-3">
                      {/* CRITICAL CASH COLLECTION CHECKBOX */}
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-amber-950 flex items-start gap-2.5">
                        <Banknote className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-black text-xs">
                            CASH PAYMENT REQUIRED: Collect {formatZMW(cashDue)} in Cash
                          </p>
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                            <input
                              type="checkbox"
                              checked={cashCollectedConfirmed}
                              onChange={(e) => setCashCollectedConfirmed(e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded"
                            />
                            <span>I have received {formatZMW(cashDue)} cash from the customer</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          value={deliveryInputCode}
                          onChange={(e) => setDeliveryInputCode(e.target.value)}
                          placeholder="Customer Handover PIN (8204)"
                          className="w-full sm:w-48 text-xs font-mono font-bold border border-slate-300 rounded-xl px-3 py-2 bg-white outline-none"
                        />
                        <button
                          onClick={() => handleVerifyDelivery(activeOrder)}
                          className="w-full sm:w-auto px-4 py-2 bg-lime-400 text-emerald-950 font-black text-xs rounded-xl hover:bg-lime-300 transition shadow-sm"
                        >
                          Confirm Cash Handover & Complete Delivery
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800">You're caught up!</h3>
              <p className="text-xs text-slate-400 mt-1">Waiting for next dispatch in Lusaka area.</p>
            </div>
          )}
        </div>
      )}

      {/* Earnings Tab */}
      {activeTab === 'earnings' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Today's Earnings & Cash Ledger (ZMW)
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Completed Trips</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{completedOrders.length + 1}</div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80">
                <span className="text-[11px] font-bold text-amber-900 uppercase">Cash Collected (In Hand)</span>
                <div className="text-2xl font-black text-amber-950 mt-1">
                  {formatZMW((completedOrders.length + 1) * 25)}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
              <h4 className="font-bold text-slate-900">Delivery Compensation Rules:</h4>
              <ul className="space-y-1 text-slate-600 list-disc list-inside">
                <li>Biker Delivery Fee: <strong>K25.00</strong> collected in cash</li>
                <li>Taxi Delivery Fee: <strong>K50.00</strong> collected in cash</li>
                <li>Merchandise is paid upfront through MTN / Airtel / Zamtel MoMo directly to store</li>
                <li>Courier keeps 100% of customer tips and delivery earnings</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
