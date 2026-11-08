/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOrderFinancials,
  formatZMW,
  simulateUnitEconomics,
  calculateYangoDualPayment,
  calculateDistanceDeliveryFee
} from './economics';

test('K800 example order calculation from Section 11.1 matches exact requirements', () => {
  // Section 11.1 Test Case:
  // Product subtotal: K800
  // Delivery fee: K25
  // Platform service fee: K5
  // Merchant commission: 8% of K800 = K64
  // Rider compensation: K18
  // Discounts: K0
  const result = calculateOrderFinancials({
    productSubtotal: 800,
    deliveryFee: 25,
    serviceFee: 5,
    merchantCommissionRate: 0.08,
    riderBaseCompensation: 18,
    riderDistanceKm: 0,
    discounts: 0
  });

  // Customer total = K800 + K25 + K5 = K830
  assert.equal(result.customerPayable, 830, 'Customer payable must be exactly K830.00');

  // Merchant commission = 8% * 800 = K64
  assert.equal(result.merchantCommission, 64, 'Merchant commission must be K64.00');

  // Merchant net proceeds = K800 - K64 = K736
  assert.equal(result.merchantNetProceeds, 736, 'Merchant net proceeds must be K736.00');

  // Platform delivery revenue = K25
  assert.equal(result.platformDeliveryRevenue, 25, 'Platform delivery revenue must be K25.00');

  // Platform service-fee revenue = K5
  assert.equal(result.platformServiceFeeRevenue, 5, 'Platform service fee revenue must be K5.00');

  // Platform commission revenue = K64
  assert.equal(result.platformCommissionRevenue, 64, 'Platform commission revenue must be K64.00');

  // Total gross platform revenue = K25 + K5 + K64 = K94
  assert.equal(result.platformGrossRevenue, 94, 'Gross platform revenue must be K94.00');

  // Rider compensation = K18
  assert.equal(result.riderCompensation, 18, 'Rider compensation must be K18.00');

  // Platform contribution margin = K94 - K18 = K76
  assert.equal(result.platformContributionMargin, 76, 'Platform contribution must be exactly K76.00');

  assert.equal(formatZMW(result.customerPayable), 'K830.00');
});

test('Scenario simulator calculates GMV, contribution margin, and breakeven orders correctly', () => {
  const scenario = simulateUnitEconomics({
    dailyOrders: 100,
    averageBasketValue: 400,
    commissionRate: 0.08,
    deliveryFee: 25,
    serviceFee: 5,
    riderCompensation: 18,
    paymentFeeRate: 0.015,
    refundRate: 0.005,
    monthlyFixedCosts: 45000
  });

  assert.equal(scenario.monthlyOrders, 3000);
  assert.equal(scenario.monthlyGMV, 1200000);
  assert.ok(scenario.contributionPerOrder > 0, 'Contribution per order must be positive');
  assert.ok(scenario.breakevenMonthlyOrders < 5000, 'Breakeven volume should be achievable');
});

test('Yango dual-stage payment model splits merchandise and courier cash cleanly', () => {
  const bikerOrder = calculateYangoDualPayment({
    productSubtotal: 320,
    vehicleType: 'biker',
    serviceFee: 5,
    distanceKm: 2.5
  });

  // Stage 1 = K320 merchandise + K5 management fee = K325
  assert.equal(bikerOrder.stage1MerchandisePayable, 325, 'Stage 1 must be K325.00');
  // Stage 2 = K25 (Biker base)
  assert.equal(bikerOrder.stage2DeliveryPayable, 25, 'Stage 2 biker fee must be K25.00');
  // Total cost shown transparently like Yango Food = K350.00
  assert.equal(bikerOrder.totalEstimatedTripCost, 350, 'Total cost must be K350.00');

  const taxiOrder = calculateYangoDualPayment({
    productSubtotal: 800,
    vehicleType: 'taxi',
    serviceFee: 5,
    distanceKm: 3
  });

  // Stage 1 = K800 + K5 = K805
  assert.equal(taxiOrder.stage1MerchandisePayable, 805);
  // Stage 2 = K50 (Taxi base)
  assert.equal(taxiOrder.stage2DeliveryPayable, 50);
  assert.equal(taxiOrder.totalEstimatedTripCost, 855);
});

test('Rider delivery prices are strictly dependent on distance from shop to customer', () => {
  // Within 3km base threshold
  const nearBiker = calculateDistanceDeliveryFee(1.5, 'biker');
  assert.equal(nearBiker.totalDeliveryFee, 25, 'Nearby biker delivery should be K25 base');
  assert.equal(nearBiker.extraKm, 0);

  const nearTaxi = calculateDistanceDeliveryFee(2.0, 'taxi');
  assert.equal(nearTaxi.totalDeliveryFee, 50, 'Nearby cargo taxi delivery should be K50 base');
  assert.equal(nearTaxi.extraKm, 0);

  // Longer distance: 5.0 km (2.0 km extra)
  // Biker: K25 + 2.0 * K3.50 = K32.00
  const midBiker = calculateDistanceDeliveryFee(5.0, 'biker');
  assert.equal(midBiker.totalDeliveryFee, 32, '5km biker fee should be K32');
  assert.equal(midBiker.extraKm, 2.0);

  // Taxi: K50 + 2.0 * K6.50 = K63.00
  const midTaxi = calculateDistanceDeliveryFee(5.0, 'taxi');
  assert.equal(midTaxi.totalDeliveryFee, 63, '5km taxi fee should be K63');
  assert.equal(midTaxi.extraKm, 2.0);

  // Cross-town distance: 8.0 km (5.0 km extra)
  // Biker: K25 + 5.0 * K3.50 = K42.50
  const farBiker = calculateDistanceDeliveryFee(8.0, 'biker');
  assert.equal(farBiker.totalDeliveryFee, 42.5, '8km biker fee should be K42.50');

  // Taxi: K50 + 5.0 * K6.50 = K82.50
  const farTaxi = calculateDistanceDeliveryFee(8.0, 'taxi');
  assert.equal(farTaxi.totalDeliveryFee, 82.5, '8km taxi fee should be K82.50');
});

