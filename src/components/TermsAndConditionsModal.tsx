/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ShieldCheck, FileText, Scale, CheckCircle2, AlertCircle } from 'lucide-react';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-900/80 text-lime-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white">Terms & Conditions of Service</h2>
              <p className="text-[11px] text-emerald-300">Vayzo Commercial Marketplace & Last-Mile Delivery • Lusaka, Zambia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900 transition"
            aria-label="Close Terms & Conditions"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-[11px]">
              Last updated: <strong>November 2026</strong>. These Terms govern your access to and use of Vayzo’s multi-vendor ordering platform, mobile money checkout, and courier dispatch services in Zambia.
            </p>
          </div>

          <section className="space-y-2">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <span>1. Overview & Dual Payment Protocol</span>
            </h3>
            <p>
              Vayzo operates an on-demand multi-store marketplace connecting customers with verified retail stores, supermarkets (including Shoprite and Pick n Pay branches), bakeries, and dining merchants in Lusaka.
            </p>
            <p>
              <strong>Two-Step Payment Requirement:</strong> Transactions on Vayzo operate under an authoritative dual-payment flow:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>
                <strong>Step 1 (Merchandise & Management Fee):</strong> Paid upfront securely via Zambian Mobile Money (MTN MoMo, Airtel Money, or Zamtel Kwacha).
              </li>
              <li>
                <strong>Step 2 (Courier Delivery Fee):</strong> Dependent on the distance from the store to your delivery township in Lusaka. This fee is payable <em>strictly in CASH</em> directly to the delivery rider upon arrival.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-black text-slate-900">2. Distance-Based Delivery Pricing</h3>
            <p>
              Courier delivery fees are calculated transparently based on actual transit distance between the merchant's location and the customer's delivery township:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Motorbike Courier:</strong> K25.00 base fare (covers up to 3.0 km) + K3.50 per additional kilometer.</li>
              <li><strong>Cargo Cab / Taxi:</strong> K50.00 base fare (covers up to 3.0 km) + K6.50 per additional kilometer.</li>
            </ul>
            <p>
              Delivery fees displayed at checkout are binding and may only be discounted through valid Loyalty Points redemption.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-black text-slate-900">3. Vayzo Customer Loyalty Rewards Program</h3>
            <p>
              Customers earn <strong>1 Loyalty Point for every K10 spent</strong> on merchandise upon successful delivery completion.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Points can be redeemed strictly towards discounts on courier delivery fees (10 points = K1.00 delivery discount).</li>
              <li>Loyalty points carry no cash surrender value and cannot be redeemed for merchandise or transferred between user accounts.</li>
              <li>Points are credited once the delivery status transitions to <code>DELIVERED</code>.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-black text-slate-900">4. Merchant Inventory & Order Fulfillment</h3>
            <p>
              Merchants are independent businesses responsible for item packaging, freshness, and catalog pricing accuracy. In the rare event that an item is out of stock after order confirmation, the merchant or platform will contact the customer for an immediate substitution or mobile money refund.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-black text-slate-900">5. Handover Verification Codes</h3>
            <p>
              To ensure safety and eliminate delivery disputes, Vayzo issues:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>A <strong>Merchant Pickup Verification Code</strong> provided to the rider before items leave the shop.</li>
              <li>A <strong>Customer Confirmation Code</strong> provided to the customer upon checkout, which must be presented to the rider upon package arrival.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-black text-slate-900">6. Governing Law</h3>
            <p>
              These Terms and Conditions shall be governed by and construed in accordance with the laws of the Republic of Zambia, and any disputes shall fall under the jurisdiction of the High Court of Zambia.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">Vayzo Commerce Platform • Lusaka, Zambia</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs rounded-xl shadow-xs transition"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
