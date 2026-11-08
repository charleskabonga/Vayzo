/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  MapPin,
  Phone,
  CreditCard,
  ShieldCheck,
  Check,
  AlertCircle,
  Loader2,
  Bike,
  Car,
  Banknote,
  CheckCircle2,
  ArrowRight,
  Info
} from 'lucide-react';
import { CartItem, ZambianAddress, Order, VehicleOption, Merchant } from '../types';
import { formatZMW, calculateYangoDualPayment } from '../utils/economics';
import { getDistanceBetweenTownships } from '../utils/distance';
import {
  calculateDeliveryDiscount,
  getMaxRedeemablePoints,
  getPointsCashValue
} from '../utils/loyalty';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  defaultTownship: string;
  onOrderPlaced: (order: Order) => void;
  currentUser: any;
  merchants?: Merchant[];
  loyaltyPointsBalance?: number;
  onRedeemLoyaltyPoints?: (pointsDeducted: number) => void;
}


type StepPhase = 'DETAILS' | 'USSD_PROMPT' | 'STAGE_1_CONFIRMED' | 'DISPATCHING';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  defaultTownship,
  onOrderPlaced,
  currentUser,
  merchants = [],
  loyaltyPointsBalance = 0,
  onRedeemLoyaltyPoints
}) => {
  if (!isOpen || items.length === 0) return null;

  const [recipientName, setRecipientName] = useState(currentUser?.displayName || 'Charles Kabonga');
  const [recipientPhone, setRecipientPhone] = useState('+260 97 712 3456');
  const [township, setTownship] = useState(defaultTownship || 'Kabulonga');
  const [street, setStreet] = useState('Kudu Road');
  const [housePlot, setHousePlot] = useState('Plot 418');
  const [landmark, setLandmark] = useState('Near Centro Mall, black gate with solar wall lights');
  const [deliveryNotes, setDeliveryNotes] = useState('Call recipient on arrival at the gate');

  // Yango Vehicle Choice: Motorbike Biker vs Cargo Cab Taxi
  const [vehicleType, setVehicleType] = useState<VehicleOption>('biker');

  // Step 1 Mobile Money Provider (MTN, Airtel, Zamtel)
  const [momoProvider, setMomoProvider] = useState<'MTN_MOMO' | 'AIRTEL_MONEY' | 'ZAMTEL_KWACHA'>('MTN_MOMO');

  // Loyalty Points Redemption State
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);

  // Interactive Payment Lifecycle Phases
  const [phase, setPhase] = useState<StepPhase>('DETAILS');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [stage1TxRef, setStage1TxRef] = useState('');

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Determine shop township and calculate actual distance in km from shop to customer
  const primaryMerchantId = items[0]?.product?.merchantId;
  const primaryMerchant = merchants.find((m) => m.id === primaryMerchantId);
  const shopTownship = primaryMerchant?.township || 'Rhodes Park';
  const shopName = primaryMerchant?.name || items[0]?.product?.merchantName || 'Store';
  const distanceKm = getDistanceBetweenTownships(shopTownship, township);

  // Yango Dual Payment Breakdown Calculation strictly dependent on distance
  const yangoBreakdown = calculateYangoDualPayment({
    productSubtotal: subtotal,
    vehicleType,
    serviceFee: 5,
    distanceKm
  });

  // Calculate Loyalty Points Delivery Discount
  const loyaltyDiscount = calculateDeliveryDiscount(
    pointsToRedeem,
    yangoBreakdown.stage2DeliveryPayable,
    loyaltyPointsBalance
  );
  const finalDeliveryFee = loyaltyDiscount.finalDeliveryFee;
  const totalTripCost = yangoBreakdown.stage1MerchandisePayable + finalDeliveryFee;
  const maxRedeemable = getMaxRedeemablePoints(loyaltyPointsBalance, yangoBreakdown.stage2DeliveryPayable);

  const bikerBreakdown = calculateYangoDualPayment({
    productSubtotal: subtotal,
    vehicleType: 'biker',
    serviceFee: 5,
    distanceKm
  });

  const taxiBreakdown = calculateYangoDualPayment({
    productSubtotal: subtotal,
    vehicleType: 'taxi',
    serviceFee: 5,
    distanceKm
  });


  const handleValidateForm = () => {
    setErrorMsg('');
    const cleanPhone = recipientPhone.replace(/[\s-]/g, '');
    const isValidPhone = /^(\+260|0)(97|96|95|77|76)\d{7}$/.test(cleanPhone);
    if (!isValidPhone) {
      setErrorMsg('Please enter a valid Zambian mobile number (+260 97/96/95/77/76...).');
      return false;
    }

    if (!landmark.trim()) {
      setErrorMsg('Please provide a landmark to assist our Lusaka courier in finding your gate.');
      return false;
    }

    return true;
  };

  // Phase 1: Initiate Step 1 Mobile Money Payment (Merchandise + Platform Management Fee)
  const handleInitiateStage1Payment = async () => {
    if (!handleValidateForm()) return;

    setIsSubmitting(true);
    setPhase('USSD_PROMPT');

    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: `VZ-${Math.floor(100000 + Math.random() * 900000)}`,
          amount: yangoBreakdown.stage1MerchandisePayable,
          phone: recipientPhone,
          provider: momoProvider,
          stage: 'STAGE_1_MERCHANDISE'
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Payment initiation failed.');
      }

      // Simulate USSD PIN prompt entry in Zambia
      await new Promise((r) => setTimeout(r, 1400));

      setStage1TxRef(data.transactionReference || `${momoProvider}-REF-${Date.now()}`);
      setPhase('STAGE_1_CONFIRMED');
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment processing error.');
      setPhase('DETAILS');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Phase 2: Once Step 1 is Paid, Activate Booking of Biker or Taxi (Cash on Delivery)
  const handleActivateCourierBooking = async () => {
    setIsSubmitting(true);
    setPhase('DISPATCHING');

    try {
      const orderId = `VZ-${Math.floor(100000 + Math.random() * 900000)}`;
      const pickupVerificationCode = Math.floor(1000 + Math.random() * 9000).toString();
      const deliveryConfirmationCode = Math.floor(1000 + Math.random() * 9000).toString();

      // Deduct loyalty points if redeemed
      if (loyaltyDiscount.pointsDeducted > 0 && onRedeemLoyaltyPoints) {
        onRedeemLoyaltyPoints(loyaltyDiscount.pointsDeducted);
      }

      const pointsToEarn = Math.max(1, Math.floor(subtotal * 0.1));

      const newOrder: Order = {
        id: orderId,
        customerId: currentUser?.uid || 'guest_user',
        customerName: recipientName,
        customerPhone: recipientPhone,
        merchantId: items[0].product.merchantId,
        merchantName: items[0].product.merchantName,
        items: items.map((i) => ({
          productId: i.product.id,
          name: i.product.name,
          unit: i.product.unit,
          packSize: i.product.packSize,
          price: i.product.price,
          quantity: i.quantity,
          subtotal: i.product.price * i.quantity
        })),
        subtotal,
        deliveryFee: finalDeliveryFee,
        serviceFee: yangoBreakdown.serviceFee,
        total: totalTripCost,
        status: 'CONFIRMED',
        deliveryAddress: {
          city: 'Lusaka',
          township,
          street,
          housePlotNumber: housePlot,
          landmark,
          deliveryInstructions: deliveryNotes,
          recipientPhone,
          recipientName
        },
        vehicleType,
        // Yango Dual Payment Attributes
        stage1Amount: yangoBreakdown.stage1MerchandisePayable,
        stage1Paid: true,
        stage1PaymentMethod: momoProvider,
        stage1TxRef,
        stage2Amount: finalDeliveryFee,
        stage2Paid: false,
        stage2PaymentMethod: 'CASH_ON_DELIVERY',
        // Loyalty Rewards Attributes
        loyaltyPointsRedeemed: loyaltyDiscount.pointsDeducted,
        loyaltyDiscountZMW: loyaltyDiscount.discountZMW,
        pointsEarned: pointsToEarn,
        paymentMethod: momoProvider,
        paymentStatus: 'SUCCESS',
        riderId: vehicleType === 'taxi' ? 'driver_mwamba' : 'rider_bwalya',
        riderName: vehicleType === 'taxi' ? 'Mwamba Chileshe' : 'Bwalya Tembo',
        riderPhone: vehicleType === 'taxi' ? '+260 95 881 2345' : '+260 97 455 1234',
        vehiclePlate: vehicleType === 'taxi' ? 'BCL 8821 ZM (Toyota Corolla Cab)' : 'ABX 4920 ZM (Honda Ace 125)',
        pickupVerificationCode,
        deliveryConfirmationCode,
        timeline: [
          {
            status: 'CONFIRMED',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            note: `Step 1 Merchandise paid via ${momoProvider.replace('_', ' ')} (${stage1TxRef}). Courier booking activated.${
              loyaltyDiscount.discountZMW > 0
                ? ` K${loyaltyDiscount.discountZMW.toFixed(2)} delivery discount applied using ${loyaltyDiscount.pointsDeducted} Loyalty Points.`
                : ''
            }`
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await new Promise((r) => setTimeout(r, 600));

      onOrderPlaced(newOrder);
      onClose();

    } catch (err: any) {
      setErrorMsg(err.message || 'Error activating courier booking.');
      setPhase('STAGE_1_CONFIRMED');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-950 to-teal-950 text-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-lime-400 text-emerald-950">
                Direct Delivery
              </span>
              <span className="text-xs text-emerald-200">Lusaka Last-Mile</span>
            </div>
            <h2 className="font-black text-lg text-white mt-0.5">Checkout & Courier Booking</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-300 hover:text-white hover:bg-white/10"
            aria-label="Close checkout modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Upfront Total Cost Breakdown */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-xs uppercase tracking-wider text-lime-400">
                Transparent Trip Cost Summary
              </span>
              <span className="text-[11px] text-slate-400">Upfront Price Transparency</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Stage 1 Box */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Stage 1: Pay Upfront</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300">
                    Mobile Money
                  </span>
                </div>
                <div className="text-xl font-black text-white">
                  {formatZMW(yangoBreakdown.stage1MerchandisePayable)}
                </div>
                <p className="text-[11px] text-slate-400">
                  Goods ({formatZMW(subtotal)}) + Service fee ({formatZMW(yangoBreakdown.serviceFee)})
                </p>
              </div>

              {/* Stage 2 Box */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Stage 2: Pay on Arrival</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-400/20 text-emerald-300">
                    Cash Only
                  </span>
                </div>
                <div className="text-xl font-black text-lime-300">
                  {formatZMW(yangoBreakdown.stage2DeliveryPayable)}
                </div>
                <p className="text-[11px] text-slate-400">
                  {vehicleType === 'biker' ? 'Motorbike Courier' : 'Cargo Cab / Taxi'} fee to driver
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm">
              <span className="font-bold text-slate-300">Total Estimated Cost (Goods + Delivery):</span>
              <span className="font-black text-lime-400 text-base">
                {formatZMW(yangoBreakdown.totalEstimatedTripCost)}
              </span>
            </div>
          </div>

          {/* SECTION 1: Delivery Address in Lusaka */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-emerald-800" />
              <span>1. Delivery Destination in Lusaka</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Township / Area *</label>
                <select
                  disabled={phase !== 'DETAILS'}
                  value={township}
                  onChange={(e) => setTownship(e.target.value)}
                  className="w-full font-medium border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-emerald-700 outline-none disabled:opacity-70"
                >
                  <option value="Kabulonga">Kabulonga</option>
                  <option value="Woodlands">Woodlands</option>
                  <option value="Rhodes Park">Rhodes Park</option>
                  <option value="Roma">Roma</option>
                  <option value="Olympia Park">Olympia Park</option>
                  <option value="Longacres">Longacres</option>
                  <option value="Northmead">Northmead</option>
                  <option value="Chelstone">Chelstone</option>
                  <option value="Chilenje">Chilenje</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Street Name *</label>
                <input
                  type="text"
                  required
                  disabled={phase !== 'DETAILS'}
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full font-medium border border-slate-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-700 outline-none disabled:opacity-70"
                  placeholder="e.g. Kudu Road / Bishops Road"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">House / Plot Number *</label>
                <input
                  type="text"
                  required
                  disabled={phase !== 'DETAILS'}
                  value={housePlot}
                  onChange={(e) => setHousePlot(e.target.value)}
                  className="w-full font-medium border border-slate-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-700 outline-none disabled:opacity-70"
                  placeholder="e.g. Plot 418 or Flat 2B"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Recipient Name *</label>
                <input
                  type="text"
                  required
                  disabled={phase !== 'DETAILS'}
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full font-medium border border-slate-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-700 outline-none disabled:opacity-70"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Landmark / Navigational Aid * (Crucial in Lusaka)
              </label>
              <input
                type="text"
                required
                disabled={phase !== 'DETAILS'}
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full font-medium border border-slate-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-700 outline-none disabled:opacity-70"
                placeholder="e.g. Opposite Puma filling station, next to Centro Mall, green gate"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Recipient Zambian Phone * (For USSD MoMo & Courier Call)
              </label>
              <input
                type="tel"
                required
                disabled={phase !== 'DETAILS'}
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full font-medium border border-slate-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-700 outline-none disabled:opacity-70"
                placeholder="+260 97 123 4567"
              />
            </div>
          </div>

          {/* SECTION 2: Select Delivery Courier Vehicle (Biker vs Taxi) - Strictly Dependent on Distance */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <div className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider">
                <Bike className="w-4 h-4 text-emerald-800" />
                <span>2. Select Courier Option (Cash on Delivery)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-900 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <MapPin className="w-3 h-3 text-emerald-700" />
                <span>{shopName} ({shopTownship}) → {township}: <strong>{distanceKm.toFixed(1)} km</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Biker */}
              <button
                type="button"
                disabled={phase !== 'DETAILS' && phase !== 'STAGE_1_CONFIRMED'}
                onClick={() => setVehicleType('biker')}
                className={`p-3.5 rounded-2xl border text-left transition relative ${
                  vehicleType === 'biker'
                    ? 'border-emerald-700 bg-emerald-50/70 ring-2 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center">
                      <Bike className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Motorbike Biker</h4>
                      <p className="text-[11px] text-slate-500">Express courier • Light items</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm text-emerald-950 block">
                      {formatZMW(bikerBreakdown.stage2DeliveryPayable)}
                    </span>
                    <span className="text-[10px] text-slate-400">Cash on delivery</span>
                  </div>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-600 flex items-center justify-between">
                  <span>Based on {distanceKm.toFixed(1)} km distance</span>
                  <span className="text-emerald-800 font-bold">{bikerBreakdown.pricingFormula}</span>
                </div>
              </button>

              {/* Option 2: Taxi */}
              <button
                type="button"
                disabled={phase !== 'DETAILS' && phase !== 'STAGE_1_CONFIRMED'}
                onClick={() => setVehicleType('taxi')}
                className={`p-3.5 rounded-2xl border text-left transition relative ${
                  vehicleType === 'taxi'
                    ? 'border-teal-700 bg-teal-50/70 ring-2 ring-teal-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-900 flex items-center justify-center">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Cargo Cab / Taxi</h4>
                      <p className="text-[11px] text-slate-500">Spacious car • Bulk & Heavy</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm text-teal-950 block">
                      {formatZMW(taxiBreakdown.stage2DeliveryPayable)}
                    </span>
                    <span className="text-[10px] text-slate-400">Cash on delivery</span>
                  </div>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-600 flex items-center justify-between">
                  <span>Based on {distanceKm.toFixed(1)} km distance</span>
                  <span className="text-teal-800 font-bold">{taxiBreakdown.pricingFormula}</span>
                </div>
              </button>
            </div>
          </div>

          {/* SECTION: Vayzo Loyalty Points Delivery Discount */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-lime-50 border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-lime-400 text-emerald-950 font-black text-xs shadow-2xs">
                  🪙
                </span>
                <div>
                  <h4 className="font-black text-xs text-slate-900">Vayzo Loyalty Points (Delivery Discount)</h4>
                  <p className="text-[11px] text-emerald-800">
                    Available: <strong>{loyaltyPointsBalance} pts</strong> (Worth {formatZMW(getPointsCashValue(loyaltyPointsBalance))} in Delivery Credit)
                  </p>
                </div>
              </div>

              {loyaltyDiscount.discountZMW > 0 && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-lime-400 text-emerald-950 shadow-xs">
                  Save {formatZMW(loyaltyDiscount.discountZMW)} on Delivery!
                </span>
              )}
            </div>

            {loyaltyPointsBalance > 0 ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <button
                    type="button"
                    disabled={phase !== 'DETAILS' && phase !== 'STAGE_1_CONFIRMED'}
                    onClick={() => setPointsToRedeem(0)}
                    className={`px-3 py-1.5 rounded-xl border transition ${
                      pointsToRedeem === 0
                        ? 'bg-slate-900 text-white border-slate-900 font-black shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    No Discount (0 pts)
                  </button>

                  {loyaltyPointsBalance >= 50 && (
                    <button
                      type="button"
                      disabled={phase !== 'DETAILS' && phase !== 'STAGE_1_CONFIRMED'}
                      onClick={() => setPointsToRedeem(50)}
                      className={`px-3 py-1.5 rounded-xl border transition ${
                        pointsToRedeem === 50
                          ? 'bg-emerald-800 text-white border-emerald-800 font-black shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Save K5.00 (50 pts)
                    </button>
                  )}

                  {loyaltyPointsBalance >= 100 && (
                    <button
                      type="button"
                      disabled={phase !== 'DETAILS' && phase !== 'STAGE_1_CONFIRMED'}
                      onClick={() => setPointsToRedeem(100)}
                      className={`px-3 py-1.5 rounded-xl border transition ${
                        pointsToRedeem === 100
                          ? 'bg-emerald-800 text-white border-emerald-800 font-black shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Save K10.00 (100 pts)
                    </button>
                  )}

                  {maxRedeemable > 0 && maxRedeemable !== 50 && maxRedeemable !== 100 && (
                    <button
                      type="button"
                      disabled={phase !== 'DETAILS' && phase !== 'STAGE_1_CONFIRMED'}
                      onClick={() => setPointsToRedeem(maxRedeemable)}
                      className={`px-3 py-1.5 rounded-xl border transition ${
                        pointsToRedeem === maxRedeemable
                          ? 'bg-lime-400 text-emerald-950 border-lime-400 font-black shadow-2xs'
                          : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      Max Discount ({maxRedeemable} pts • {formatZMW(getPointsCashValue(maxRedeemable))} off)
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-600 border-t border-emerald-200/60">
                  <span>
                    Original Delivery: <span className="line-through">{formatZMW(yangoBreakdown.stage2DeliveryPayable)}</span>
                  </span>
                  <span className="font-black text-emerald-900">
                    Pay Rider in Cash: {formatZMW(finalDeliveryFee)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                You will earn <strong>+{Math.max(1, Math.floor(subtotal * 0.1))} Loyalty Points</strong> on this order for future delivery discounts!
              </p>
            )}
          </div>

          {/* SECTION 3: Step 1 Mobile Money Provider Selection */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider">
                <CreditCard className="w-4 h-4 text-emerald-800" />
                <span>3. Step 1 Payment Method (MTN, Airtel, Zamtel)</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Pays: <strong>{formatZMW(yangoBreakdown.stage1MerchandisePayable)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* MTN */}
              <button
                type="button"
                disabled={phase !== 'DETAILS'}
                onClick={() => setMomoProvider('MTN_MOMO')}
                className={`p-3 rounded-2xl border text-left transition ${
                  momoProvider === 'MTN_MOMO'
                    ? 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-400'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-yellow-900">MTN MoMo</span>
                  {momoProvider === 'MTN_MOMO' && <Check className="w-3.5 h-3.5 text-yellow-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">096 / 076 USSD</p>
              </button>

              {/* Airtel */}
              <button
                type="button"
                disabled={phase !== 'DETAILS'}
                onClick={() => setMomoProvider('AIRTEL_MONEY')}
                className={`p-3 rounded-2xl border text-left transition ${
                  momoProvider === 'AIRTEL_MONEY'
                    ? 'border-red-500 bg-red-50 ring-2 ring-red-400'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-red-900">Airtel Money</span>
                  {momoProvider === 'AIRTEL_MONEY' && <Check className="w-3.5 h-3.5 text-red-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">097 / 077 USSD</p>
              </button>

              {/* Zamtel */}
              <button
                type="button"
                disabled={phase !== 'DETAILS'}
                onClick={() => setMomoProvider('ZAMTEL_KWACHA')}
                className={`p-3 rounded-2xl border text-left transition ${
                  momoProvider === 'ZAMTEL_KWACHA'
                    ? 'border-green-600 bg-green-50 ring-2 ring-green-500'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-green-900">Zamtel Kwacha</span>
                  {momoProvider === 'ZAMTEL_KWACHA' && <Check className="w-3.5 h-3.5 text-green-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">095 USSD</p>
              </button>
            </div>
          </div>

          {/* DUAL STAGE INTERACTION CONTROLS */}
          {phase === 'USSD_PROMPT' && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 space-y-2 text-center">
              <div className="flex items-center justify-center gap-2 font-bold">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                <span>USSD Push Prompt Sent to {recipientPhone}</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Please check your phone screen and enter your Mobile Money PIN to authorize payment of{' '}
                <strong>{formatZMW(yangoBreakdown.stage1MerchandisePayable)}</strong> to Vayzo.
              </p>
            </div>
          )}

          {phase === 'STAGE_1_CONFIRMED' && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 space-y-2">
              <div className="flex items-center gap-2 font-black text-sm text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <span>Stage 1 Merchandise Payment Confirmed!</span>
              </div>
              <p className="text-xs text-emerald-800">
                Ref: <span className="font-mono font-bold">{stage1TxRef}</span> •{' '}
                {formatZMW(yangoBreakdown.stage1MerchandisePayable)} paid via {momoProvider.replace('_', ' ')}.
              </p>
              <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Booking for {vehicleType === 'biker' ? 'Motorbike Biker' : 'Cargo Cab / Taxi'} is ready to activate.
                  </span>
                </div>
                <span className="font-black text-sm text-emerald-950">
                  {formatZMW(finalDeliveryFee)} Cash
                </span>
              </div>
            </div>
          )}


          {/* ACTION BUTTONS */}
          <div className="pt-2">
            {phase === 'DETAILS' && (
              <button
                type="button"
                onClick={handleInitiateStage1Payment}
                disabled={isSubmitting}
                className="w-full py-4 px-6 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
              >
                <span>
                  Pay Step 1: Merchandise ({formatZMW(yangoBreakdown.stage1MerchandisePayable)}) via {momoProvider.replace('_', ' ')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {phase === 'STAGE_1_CONFIRMED' && (
              <button
                type="button"
                onClick={handleActivateCourierBooking}
                disabled={isSubmitting}
                className="w-full py-4 px-6 bg-lime-400 hover:bg-lime-300 text-emerald-950 font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-950" />
                    <span>Dispatching Courier...</span>
                  </>
                ) : (
                  <>
                    <Bike className="w-4 h-4 text-emerald-950" />
                    <span>
                      Activate Booking of {vehicleType === 'biker' ? 'Biker' : 'Taxi'} • Pay {formatZMW(finalDeliveryFee)} Cash on Delivery
                    </span>
                  </>
                )}
              </button>

            )}
          </div>
        </div>
      </div>
    </div>
  );
};
