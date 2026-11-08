/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Award, Sparkles, Bike, CheckCircle2, TrendingUp, HelpCircle } from 'lucide-react';
import { getPointsCashValue } from '../utils/loyalty';
import { formatZMW } from '../utils/economics';

interface LoyaltyRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pointsBalance: number;
}

export const LoyaltyRewardsModal: React.FC<LoyaltyRewardsModalProps> = ({
  isOpen,
  onClose,
  pointsBalance
}) => {
  if (!isOpen) return null;

  const cashValue = getPointsCashValue(pointsBalance);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header with Points Showcase */}
        <div className="p-6 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-lime-400 text-emerald-950">
                <Award className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-black text-sm text-white">Vayzo Loyalty Rewards</h3>
                <p className="text-[11px] text-emerald-300">Earn points on every completed delivery</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900 transition"
              aria-label="Close Rewards Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 relative z-10 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
                Your Available Points
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black text-lime-400">{pointsBalance}</span>
                <span className="text-xs font-bold text-white">pts</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-emerald-200 block">Delivery Credit Value</span>
              <span className="text-lg font-black text-white">{formatZMW(cashValue)}</span>
            </div>
          </div>
        </div>

        {/* How It Works Body */}
        <div className="p-6 space-y-4 text-xs text-slate-700">
          <h4 className="font-black text-slate-900 text-sm">How Vayzo Rewards Work:</h4>

          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0 text-xs">
                1
              </div>
              <div>
                <h5 className="font-black text-slate-900">Earn with Every Order</h5>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Get <strong>1 point for every K10 spent</strong> on food, groceries, and retail merchandise. Points are credited instantly once your courier marks the order as delivered.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-lime-100 text-emerald-950 font-black flex items-center justify-center shrink-0 text-xs">
                2
              </div>
              <div>
                <h5 className="font-black text-slate-900">Redeem for Delivery Discounts</h5>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Apply your points at checkout to discount Step 2 courier fees: <strong>10 points = K1.00 off</strong>. You can even redeem enough points for 100% free delivery!
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-900 font-black flex items-center justify-center shrink-0 text-xs">
                3
              </div>
              <div>
                <h5 className="font-black text-slate-900">Fair to Riders</h5>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Your delivery discount is subsidized by Vayzo. The delivery rider always receives their full compensation for distance traveled.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">Automatic balance sync across Lusaka</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs rounded-xl shadow-xs transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
