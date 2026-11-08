/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreRiderForDispatch, rankRidersForDispatch, calculateRiderEarnings } from './dispatchEngine';

test('Dispatch engine prioritizes online, nearby riders with capacity', () => {
  const offlineRider = scoreRiderForDispatch({
    id: 'r1',
    name: 'Chanda M.',
    vehicle: 'motorcycle',
    isOnline: false,
    distanceToMerchantKm: 1.2,
    activeOrdersCount: 0,
    rating: 4.8
  });
  assert.equal(offlineRider.eligible, false);

  const busyRider = scoreRiderForDispatch({
    id: 'r2',
    name: 'Mutale K.',
    vehicle: 'motorcycle',
    isOnline: true,
    distanceToMerchantKm: 0.5,
    activeOrdersCount: 2,
    rating: 4.9
  });
  assert.equal(busyRider.eligible, false);

  const activeRiders = [
    {
      id: 'r3',
      name: 'Bwalya T.',
      vehicle: 'motorcycle' as const,
      isOnline: true,
      distanceToMerchantKm: 1.5,
      activeOrdersCount: 0,
      rating: 4.9
    },
    {
      id: 'r4',
      name: 'Kelvin S.',
      vehicle: 'bicycle' as const,
      isOnline: true,
      distanceToMerchantKm: 4.5,
      activeOrdersCount: 1,
      rating: 4.2
    }
  ];

  const ranked = rankRidersForDispatch(activeRiders);
  assert.equal(ranked.length, 2);
  assert.equal(ranked[0].riderId, 'r3', 'Closer motorcycle rider should rank higher');
  assert.ok(ranked[0].score > ranked[1].score);
});

test('Rider earnings formula calculates base + distance + tip transparently', () => {
  const earnings = calculateRiderEarnings({
    distanceKm: 5, // 5km total -> 3km billable * K3 = K9
    waitingMinutes: 25, // 10 min extra * K0.5 = K5
    tip: 10,
    peakBonus: 5
  });

  // Base 15 + Distance 9 + Waiting 5 + Tip 10 + Peak 5 = K44
  assert.equal(earnings.basePay, 15);
  assert.equal(earnings.distancePay, 9);
  assert.equal(earnings.waitingPay, 5);
  assert.equal(earnings.tip, 10);
  assert.equal(earnings.peakBonus, 5);
  assert.equal(earnings.totalEarnings, 44);
});
