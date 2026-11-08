/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePointsEarned,
  getPointsCashValue,
  getMaxRedeemablePoints,
  calculateDeliveryDiscount
} from './loyalty';

test('Loyalty Points earning rate: 1 point per K10 spent', () => {
  assert.equal(calculatePointsEarned(0), 0);
  assert.equal(calculatePointsEarned(58), 5); // K58 gives 5 points
  assert.equal(calculatePointsEarned(326), 32); // K326 gives 32 points
  assert.equal(calculatePointsEarned(800), 80); // K800 gives 80 points
  assert.equal(calculatePointsEarned(1250), 125); // K1250 gives 125 points
});

test('getPointsCashValue converts 10 points to K1.00', () => {
  assert.equal(getPointsCashValue(0), 0);
  assert.equal(getPointsCashValue(50), 5.0);
  assert.equal(getPointsCashValue(100), 10.0);
  assert.equal(getPointsCashValue(250), 25.0);
});

test('getMaxRedeemablePoints caps points at delivery fee threshold', () => {
  // Delivery fee K28.90 requires 289 points for 100% discount
  assert.equal(getMaxRedeemablePoints(100, 28.9), 100);
  assert.equal(getMaxRedeemablePoints(350, 28.9), 289);
  assert.equal(getMaxRedeemablePoints(0, 28.9), 0);
});

test('calculateDeliveryDiscount applies discount correctly and bounds by delivery fee', () => {
  // User has 150 points (worth K15.00), delivery fee is K28.50
  const res1 = calculateDeliveryDiscount(100, 28.5, 150);
  assert.equal(res1.discountZMW, 10.0);
  assert.equal(res1.pointsDeducted, 100);
  assert.equal(res1.finalDeliveryFee, 18.5);

  // User has 400 points (worth K40.00), delivery fee is K25.00
  const res2 = calculateDeliveryDiscount(400, 25.0, 400);
  assert.equal(res2.discountZMW, 25.0); // capped at delivery fee
  assert.equal(res2.pointsDeducted, 250); // only 250 points needed
  assert.equal(res2.finalDeliveryFee, 0.0); // 100% free delivery
});
