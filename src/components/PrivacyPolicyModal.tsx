/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ShieldCheck, Lock, Eye, Database, Smartphone } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-900/80 text-lime-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white">Privacy Policy</h2>
              <p className="text-[11px] text-emerald-300">Zambian Data Protection Act No. 3 of 2021 Compliance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900 transition"
            aria-label="Close Privacy Policy"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-[11px]">
              Vayzo ("we", "our", or "us") respects your privacy. This Privacy Policy details how we collect, store, and safeguard your personal information when using our on-demand ordering and delivery platform in Zambia.
            </p>
          </div>

          <section className="space-y-2">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <span>1. Information We Collect</span>
            </h3>
            <p>To process and deliver your orders accurately in Lusaka, we collect:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Contact Information:</strong> Full name, Zambian phone number (+260), and email address.</li>
              <li><strong>Delivery Coordinates:</strong> Lusaka township, street name, house/plot number, and delivery landmarks.</li>
              <li><strong>Order & Transaction History:</strong> Merchandise ordered, store selected, dual-stage payment amounts, and order timestamps.</li>
              <li><strong>Loyalty & Rewards Data:</strong> Accumulated points and delivery discount redemption records.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-black text-slate-900">2. Payment Security & Mobile Money Data</h3>
            <p>
              Merchandise transactions are processed through authorized payment gateways for <strong>MTN Mobile Money</strong>, <strong>Airtel Money</strong>, and <strong>Zamtel Kwacha</strong>.
            </p>
            <p>
              <strong>We never store your Mobile Money PIN:</strong> Payment approvals occur securely within your provider's encrypted USSD or mobile wallet prompt.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-black text-slate-900">3. Sharing with Merchants & Couriers</h3>
            <p>
              We disclose only strictly necessary information to facilitate fulfillment:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>To Merchants:</strong> Ordered product list, special dietary or packaging notes, and customer recipient name.</li>
              <li><strong>To Assigned Couriers:</strong> Delivery township, street, house number, landmark, recipient phone number, and distance. Rider access to customer contact details expires once the order is marked as <code>DELIVERED</code>.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-black text-slate-900">4. Browser Push Notifications</h3>
            <p>
              If enabled, we use the Web Notification API to alert you when your order is accepted, dispatched, or when the rider arrives at your gate. You may revoke push notification permissions anytime directly in your browser settings.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-black text-slate-900">5. Your Legal Rights</h3>
            <p>
              Under the Data Protection Act of Zambia, you have the right to request access to your personal information, request rectification of inaccurate data, or request permanent deletion of your profile by emailing <code>privacy@vayzo.co.zm</code>.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">Data Controller: Vayzo Zambia Limited</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs rounded-xl shadow-xs transition"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
