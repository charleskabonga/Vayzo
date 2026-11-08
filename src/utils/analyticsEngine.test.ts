/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMerchantAnalytics, generateMerchantAnalyticsCSV } from './analyticsEngine';
import { SEED_MERCHANTS, INITIAL_ORDERS, SEED_PRODUCTS } from '../data/seedData';

test('calculateMerchantAnalytics calculates GMV, net payout and commission for Shoprite', () => {
  const shoprite = SEED_MERCHANTS.find((m) => m.name.includes('Shoprite'))!;
  assert.ok(shoprite, 'Shoprite merchant exists');

  const summary = calculateMerchantAnalytics(shoprite, INITIAL_ORDERS, SEED_PRODUCTS, 'all');

  assert.ok(summary.totalGMV > 0, 'Total GMV should be greater than 0');
  assert.equal(summary.commissionPaid, summary.totalGMV * shoprite.commissionRate);
  assert.equal(summary.netPayout, summary.totalGMV - summary.commissionPaid);
  assert.ok(summary.topProducts.length > 0, 'Should include top products');
  assert.ok(summary.townshipBreakdown.length > 0, 'Should include township delivery stats');
  assert.ok(summary.orderFunnel.length === 5, 'Should include 5 funnel stages');
  assert.ok(summary.dailyTrend.length === 7, 'Should include 7 days of trend data');
});

test('generateMerchantAnalyticsCSV outputs formatted CSV with key sections', () => {
  const shoprite = SEED_MERCHANTS.find((m) => m.name.includes('Shoprite'))!;
  const summary = calculateMerchantAnalytics(shoprite, INITIAL_ORDERS, SEED_PRODUCTS, '30d');
  const csv = generateMerchantAnalyticsCSV(shoprite, summary);

  assert.match(csv, /"Vayzo Merchant Analytics Report - Shoprite/);
  assert.match(csv, /"Total GMV/);
  assert.match(csv, /"TOP SELLING PRODUCTS"/);
  assert.match(csv, /"TOWNSHIP DELIVERY BREAKDOWN"/);
  assert.match(csv, /"MOBILE MONEY PAYMENT BREAKDOWN"/);
});
