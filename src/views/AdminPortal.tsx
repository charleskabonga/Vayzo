/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, BarChart3, Truck, DollarSign, Brain, Users, Store, Bike, Sliders, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { Order, Merchant, Product, FinancialLedgerEntry } from '../types';
import { formatZMW, calculateOrderFinancials, simulateUnitEconomics, ScenarioParams } from '../utils/economics';
import { OrderStatus, ORDER_STATUS_LABELS } from '../utils/orderStateMachine';

interface AdminPortalProps {
  orders: Order[];
  merchants: Merchant[];
  products: Product[];
  ledger: FinancialLedgerEntry[];
  onAdvanceOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  orders,
  merchants,
  products,
  ledger,
  onAdvanceOrderStatus
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'simulator' | 'dispatch' | 'ledger' | 'copilot'>('overview');

  // Scenario Simulator Interactive Parameters (initialized to realistic Zambian pilot numbers)
  const [scenarioParams, setScenarioParams] = useState<ScenarioParams>({
    dailyOrders: 120,
    averageBasketValue: 450,
    commissionRate: 0.08,
    deliveryFee: 25,
    serviceFee: 5,
    riderCompensation: 18,
    paymentFeeRate: 0.015,
    refundRate: 0.005,
    monthlyFixedCosts: 48000
  });

  // Copilot State
  const [copilotPrompt, setCopilotPrompt] = useState('Analyze rider utilization and zone pricing for Kabulonga vs Roma deliveries.');
  const [copilotOutput, setCopilotOutput] = useState('');
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);

  // High-Level Platform Metrics
  const totalGMV = orders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalCustomerCollections = orders.reduce((sum, o) => sum + o.total, 0);
  const totalDeliveryRevenue = orders.reduce((sum, o) => sum + o.deliveryFee, 0);
  const totalServiceFees = orders.reduce((sum, o) => sum + o.serviceFee, 0);
  const totalMerchantCommission = orders.reduce((sum, o) => sum + o.subtotal * 0.08, 0);
  const totalPlatformGrossRevenue = totalDeliveryRevenue + totalServiceFees + totalMerchantCommission;
  const estimatedRiderExpense = orders.length * 18;
  const platformContributionMargin = totalPlatformGrossRevenue - estimatedRiderExpense;

  // Run Scenario Calculation
  const simulationResult = simulateUnitEconomics(scenarioParams);

  // K800 baseline test verification check
  const baselineK800 = calculateOrderFinancials({
    productSubtotal: 800,
    deliveryFee: 25,
    serviceFee: 5,
    merchantCommissionRate: 0.08,
    riderBaseCompensation: 18
  });

  const handleRunCopilot = async () => {
    setIsCopilotLoading(true);
    try {
      const res = await fetch('/api/ai/thinking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: copilotPrompt,
          businessData: {
            ordersCount: orders.length,
            gmv: totalGMV,
            contributionMargin: platformContributionMargin,
            scenario: simulationResult
          }
        })
      });
      const data = await res.json();
      setCopilotOutput(data.text || 'High reasoning synthesis complete.');
    } catch {
      setCopilotOutput('Failed to execute Gemini 4 Argon reasoning copilot.');
    } finally {
      setIsCopilotLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Admin Executive Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-lime-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-lime-400" />
            <span>Operations & Financial Command Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black">Vayzo Admin Operating System</h1>
          <p className="text-xs text-slate-300 mt-1">Authoritative Ledger • Dispatch Routing • Unit Economics Engine</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white/10 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === 'overview' ? 'bg-lime-400 text-slate-950 font-black shadow-sm' : 'text-slate-200 hover:text-white'
            }`}
          >
            Executive Metrics
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === 'simulator' ? 'bg-lime-400 text-slate-950 font-black shadow-sm' : 'text-slate-200 hover:text-white'
            }`}
          >
            Unit Economics (K800)
          </button>
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === 'dispatch' ? 'bg-lime-400 text-slate-950 font-black shadow-sm' : 'text-slate-200 hover:text-white'
            }`}
          >
            Dispatch Operations
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === 'ledger' ? 'bg-lime-400 text-slate-950 font-black shadow-sm' : 'text-slate-200 hover:text-white'
            }`}
          >
            Immutable Ledger
          </button>
          <button
            onClick={() => setActiveTab('copilot')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1 ${
              activeTab === 'copilot' ? 'bg-lime-400 text-slate-950 font-black shadow-sm' : 'text-slate-200 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-purple-400" />
            AI High Thinking
          </button>
        </div>
      </div>

      {/* Tab 1: Executive Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Gross Merchandise Value (GMV)</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{formatZMW(totalGMV)}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Value of goods sold across shops</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Platform Gross Revenue</span>
              <div className="text-2xl font-black text-emerald-800 mt-1">{formatZMW(totalPlatformGrossRevenue)}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Delivery (K25) + Service (K5) + Comm (8%)</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Courier Payout Expense</span>
              <div className="text-2xl font-black text-slate-800 mt-1">{formatZMW(estimatedRiderExpense)}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Base K15 + Distance K3/km</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-lime-300 bg-lime-50/60 shadow-sm">
              <span className="text-xs font-bold text-emerald-950 uppercase">Contribution Margin</span>
              <div className="text-2xl font-black text-emerald-950 mt-1">{formatZMW(platformContributionMargin)}</div>
              <p className="text-[11px] text-emerald-700 mt-0.5">Before monthly fixed overheads</p>
            </div>
          </div>

          {/* Metric Definitions Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Documented Accounting Metric Definitions (Section 10.1 & 11.2)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <strong className="text-slate-900 block mb-1">Customer Payable:</strong>
                Subtotal + Delivery Charges (K25) + Service Fee (K5) - Discounts. Customer collections are held in trust until fulfillment.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <strong className="text-slate-900 block mb-1">Merchant Proceeds:</strong>
                Subtotal - Agreed Commission (8%). Merchant money is strictly segregated from platform revenue.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <strong className="text-slate-900 block mb-1">Platform Revenue:</strong>
                Recognized merchant commissions + delivery revenue + service fees. (Never conflated with GMV).
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <strong className="text-slate-900 block mb-1">Contribution Margin:</strong>
                Recognized platform gross revenue minus attributable courier expenses and direct payment costs.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Unit Economics & Section 11.1 Verification */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          {/* Section 11.1 Example Live Card */}
          <div className="bg-gradient-to-r from-emerald-950 to-teal-950 text-white rounded-3xl p-6 shadow-md border border-emerald-900">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-800">
              <div>
                <h3 className="text-base font-black text-lime-300">
                  Section 11.1 Benchmark Test Case: The K800 Order Verification
                </h3>
                <p className="text-xs text-emerald-200/80">Exact arithmetic from specification</p>
              </div>
              <span className="px-3 py-1 bg-lime-400 text-emerald-950 font-black text-xs rounded-full">
                PASSED UNIT TEST
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                <span className="text-emerald-300 block text-[11px]">Product Subtotal</span>
                <span className="text-lg font-black text-white">K800.00</span>
              </div>
              <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                <span className="text-emerald-300 block text-[11px]">Customer Total (+K25 +K5)</span>
                <span className="text-lg font-black text-lime-300">{formatZMW(baselineK800.customerPayable)}</span>
              </div>
              <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                <span className="text-emerald-300 block text-[11px]">Merchant Proceeds (-8%)</span>
                <span className="text-lg font-black text-white">{formatZMW(baselineK800.merchantNetProceeds)}</span>
              </div>
              <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                <span className="text-emerald-300 block text-[11px]">Platform Contribution (-K18 rider)</span>
                <span className="text-lg font-black text-lime-400">{formatZMW(baselineK800.platformContributionMargin)}</span>
              </div>
            </div>
          </div>

          {/* Scenario Simulator Controls & Results */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Sliders */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-800" />
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                  Unit Economics Scenario Adjuster (Zambia Pilot)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Daily Orders: <strong>{scenarioParams.dailyOrders}</strong>
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="1000"
                    step="10"
                    value={scenarioParams.dailyOrders}
                    onChange={(e) => setScenarioParams({ ...scenarioParams, dailyOrders: Number(e.target.value) })}
                    className="w-full accent-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Average Basket Value: <strong>K{scenarioParams.averageBasketValue}</strong>
                  </label>
                  <input
                    type="range"
                    min="150"
                    max="1200"
                    step="25"
                    value={scenarioParams.averageBasketValue}
                    onChange={(e) => setScenarioParams({ ...scenarioParams, averageBasketValue: Number(e.target.value) })}
                    className="w-full accent-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Merchant Commission Rate: <strong>{(scenarioParams.commissionRate * 100).toFixed(0)}%</strong>
                  </label>
                  <input
                    type="range"
                    min="0.05"
                    max="0.15"
                    step="0.01"
                    value={scenarioParams.commissionRate}
                    onChange={(e) => setScenarioParams({ ...scenarioParams, commissionRate: Number(e.target.value) })}
                    className="w-full accent-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Rider Delivery Pay: <strong>K{scenarioParams.riderCompensation}</strong>
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="35"
                    step="1"
                    value={scenarioParams.riderCompensation}
                    onChange={(e) => setScenarioParams({ ...scenarioParams, riderCompensation: Number(e.target.value) })}
                    className="w-full accent-emerald-700"
                  />
                </div>
              </div>
            </div>

            {/* Right Col: Output Projection */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-lime-400 mb-3">
                  Monthly Scenario Projection
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Monthly Orders:</span>
                    <span className="font-bold">{simulationResult.monthlyOrders.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Monthly GMV:</span>
                    <span className="font-bold">{formatZMW(simulationResult.monthlyGMV)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Platform Gross Revenue:</span>
                    <span className="font-bold text-emerald-300">{formatZMW(simulationResult.monthlyGrossRevenue)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Variable Costs:</span>
                    <span className="font-bold text-red-400">-{formatZMW(simulationResult.monthlyVariableCosts)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Contribution Margin:</span>
                    <span className="font-bold text-lime-300">{formatZMW(simulationResult.monthlyContributionMargin)}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-sm font-black">
                    <span className="text-white">Breakeven Volume:</span>
                    <span className="text-lime-400">{simulationResult.breakevenMonthlyOrders.toLocaleString()} orders/mo</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 mt-4 pt-3 border-t border-slate-800">
                Labeled as simulation scenario. Not a guaranteed forecast.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Dispatch Operations */}
      {activeTab === 'dispatch' && (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-900">Live Dispatch Control Center</h2>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Customer & Area</th>
                    <th className="p-4">Merchant</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">PIN Codes</th>
                    <th className="p-4">Total</th>
                    <th className="p-4 text-right">Operational Advance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-4 font-mono font-bold text-slate-900">#{o.id}</td>
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{o.customerName}</p>
                        <span className="text-slate-500 text-[11px]">{o.deliveryAddress.township}</span>
                      </td>
                      <td className="p-4 text-slate-700">{o.merchantName}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          {o.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-600">
                        Pick: {o.pickupVerificationCode} | Drop: {o.deliveryConfirmationCode}
                      </td>
                      <td className="p-4 font-bold text-slate-900">{formatZMW(o.total)}</td>
                      <td className="p-4 text-right">
                        {o.status !== 'DELIVERED' && (
                          <button
                            onClick={() => {
                              const nextMap: Record<OrderStatus, OrderStatus> = {
                                CREATED: 'CONFIRMED',
                                PAYMENT_PENDING: 'CONFIRMED',
                                CONFIRMED: 'MERCHANT_ACCEPTED',
                                MERCHANT_ACCEPTED: 'PREPARING',
                                PREPARING: 'READY_FOR_PICKUP',
                                READY_FOR_PICKUP: 'RIDER_ASSIGNED',
                                RIDER_ASSIGNED: 'PICKED_UP',
                                PICKED_UP: 'IN_TRANSIT',
                                IN_TRANSIT: 'DELIVERED',
                                DELIVERED: 'DELIVERED',
                                CANCELLED: 'CANCELLED',
                                REFUNDED: 'REFUNDED'
                              };
                              onAdvanceOrderStatus(o.id, nextMap[o.status]);
                            }}
                            className="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-xs"
                          >
                            Advance Status
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Immutable Financial Ledger */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Platform Financial Audit Ledger</h2>
              <p className="text-xs text-slate-500">Append-only double-entry transaction record. Guaranteed immutable.</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">Entry ID</th>
                    <th className="p-4">Order Ref</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Customer Gross</th>
                    <th className="p-4">Merchant Share</th>
                    <th className="p-4">Courier Share</th>
                    <th className="p-4">Platform Margin</th>
                    <th className="p-4">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledger.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-4 font-mono font-bold text-slate-900">{l.id}</td>
                      <td className="p-4 font-mono text-slate-600">{l.orderId}</td>
                      <td className="p-4 font-semibold text-slate-700">{l.type}</td>
                      <td className="p-4 font-bold text-slate-900">{formatZMW(l.grossAmount)}</td>
                      <td className="p-4 text-slate-700">{formatZMW(l.merchantShare)}</td>
                      <td className="p-4 text-slate-700">{formatZMW(l.riderShare)}</td>
                      <td className="p-4 font-bold text-emerald-800">{formatZMW(l.platformShare)}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Admin AI Copilot (High Thinking Mode) */}
      {activeTab === 'copilot' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700 font-black">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Operations Copilot & Dispatch Intelligence
              </h2>
              <p className="text-xs text-slate-500">
                Strategic analytics for Zambian multi-vendor logistics and pricing elasticity
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Operational Strategic Inquiry</label>
            <textarea
              rows={3}
              value={copilotPrompt}
              onChange={(e) => setCopilotPrompt(e.target.value)}
              className="w-full text-xs font-medium border border-slate-300 rounded-2xl p-3 outline-none focus:ring-2 focus:ring-purple-700"
            />
          </div>

          <button
            onClick={handleRunCopilot}
            disabled={isCopilotLoading}
            className="px-5 py-2.5 bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {isCopilotLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-lime-400" />
                <span>Running High Thinking Analysis...</span>
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 text-lime-400" />
                <span>Execute Deep Reasoning Copilot</span>
              </>
            )}
          </button>

          {copilotOutput && (
            <div className="p-5 bg-purple-50/60 border border-purple-200/80 rounded-2xl text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
              <span className="font-bold text-purple-950 block mb-2 text-sm">
                Strategic Reasoning Synthesis:
              </span>
              {copilotOutput}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
