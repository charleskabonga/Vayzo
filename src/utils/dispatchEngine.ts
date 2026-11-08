/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RiderCandidate {
  id: string;
  name: string;
  vehicle: 'motorcycle' | 'bicycle' | 'van';
  isOnline: boolean;
  distanceToMerchantKm: number;
  activeOrdersCount: number;
  rating: number;
}

export interface DispatchScore {
  riderId: string;
  name: string;
  score: number;
  distanceKm: number;
  eligible: boolean;
  reason: string;
}

export function scoreRiderForDispatch(rider: RiderCandidate): DispatchScore {
  if (!rider.isOnline) {
    return {
      riderId: rider.id,
      name: rider.name,
      score: 0,
      distanceKm: rider.distanceToMerchantKm,
      eligible: false,
      reason: 'Rider is offline'
    };
  }

  if (rider.activeOrdersCount >= 2) {
    return {
      riderId: rider.id,
      name: rider.name,
      score: 0,
      distanceKm: rider.distanceToMerchantKm,
      eligible: false,
      reason: 'Rider is at maximum batch capacity (2 active orders)'
    };
  }

  // Scoring formula:
  // Base 100 points
  // Proximity: -10 points per km to merchant
  // Workload: -15 points per active order
  // Rating: +5 points per rating point above 4.0
  // Vehicle bonus: motorcycle +10 for Lusaka traffic agility
  let score = 100;
  score -= Math.min(60, rider.distanceToMerchantKm * 10);
  score -= rider.activeOrdersCount * 15;
  score += Math.max(0, (rider.rating - 4.0) * 10);
  if (rider.vehicle === 'motorcycle') score += 10;

  return {
    riderId: rider.id,
    name: rider.name,
    score: Math.max(1, Math.round(score)),
    distanceKm: rider.distanceToMerchantKm,
    eligible: true,
    reason: 'Available and qualified within service zone'
  };
}

export function rankRidersForDispatch(riders: RiderCandidate[]): DispatchScore[] {
  return riders
    .map(scoreRiderForDispatch)
    .filter((s) => s.eligible)
    .sort((a, b) => b.score - a.score);
}

export function calculateRiderEarnings(params: {
  distanceKm: number;
  waitingMinutes?: number;
  tip?: number;
  peakBonus?: number;
}): {
  basePay: number;
  distancePay: number;
  waitingPay: number;
  tip: number;
  peakBonus: number;
  totalEarnings: number;
} {
  const basePay = 15; // K15 base
  const extraKm = Math.max(0, params.distanceKm - 2);
  const distancePay = Math.round(extraKm * 3); // K3/km after first 2km
  const waitingMinutes = params.waitingMinutes ?? 0;
  const waitingPay = waitingMinutes > 15 ? Math.round((waitingMinutes - 15) * 0.5) : 0;
  const tip = params.tip ?? 0;
  const peakBonus = params.peakBonus ?? 0;
  const totalEarnings = basePay + distancePay + waitingPay + tip + peakBonus;

  return {
    basePay,
    distancePay,
    waitingPay,
    tip,
    peakBonus,
    totalEarnings
  };
}
