/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Vayzo Customer Loyalty Points Engine
 * Customers earn points for completed orders, redeemable for discounts on future courier delivery fees.
 */

// 1 point earned for every K10 spent on merchandise
export const EARNING_RATE_PER_KWACHA = 0.1;

// 10 loyalty points = K1.00 discount on delivery fees
export const POINTS_PER_KWACHA_DISCOUNT = 10;

/**
 * Calculate loyalty points earned from a completed order subtotal
 * @param merchandiseSubtotal Product subtotal in Zambian Kwacha (ZMW)
 * @returns Points earned (rounded to nearest integer)
 */
export function calculatePointsEarned(merchandiseSubtotal: number): number {
  if (!merchandiseSubtotal || merchandiseSubtotal <= 0) return 0;
  return Math.max(1, Math.floor(merchandiseSubtotal * EARNING_RATE_PER_KWACHA));
}

/**
 * Convert loyalty points into Kwacha delivery discount value
 * @param points Number of points to convert
 * @returns Value in Zambian Kwacha (ZMW)
 */
export function getPointsCashValue(points: number): number {
  if (!points || points <= 0) return 0;
  return Math.round((points / POINTS_PER_KWACHA_DISCOUNT) * 100) / 100;
}

/**
 * Calculate the maximum points that can be redeemed against a specific delivery fee
 * @param availablePoints Customer's total available points balance
 * @param deliveryFee Delivery fee in Kwacha (ZMW)
 * @returns Maximum redeemable points (cannot exceed delivery fee)
 */
export function getMaxRedeemablePoints(availablePoints: number, deliveryFee: number): number {
  if (!availablePoints || availablePoints <= 0 || !deliveryFee || deliveryFee <= 0) return 0;
  const maxPointsNeeded = Math.ceil(deliveryFee * POINTS_PER_KWACHA_DISCOUNT);
  return Math.min(availablePoints, maxPointsNeeded);
}

/**
 * Calculate delivery discount and final delivery fee after loyalty redemption
 * @param pointsRequested Points user wants to redeem
 * @param deliveryFee Total delivery fee in ZMW
 * @param availablePoints Customer's total points balance
 */
export function calculateDeliveryDiscount(
  pointsRequested: number,
  deliveryFee: number,
  availablePoints: number
): {
  discountZMW: number;
  pointsDeducted: number;
  finalDeliveryFee: number;
} {
  if (!pointsRequested || pointsRequested <= 0 || !deliveryFee || deliveryFee <= 0) {
    return {
      discountZMW: 0,
      pointsDeducted: 0,
      finalDeliveryFee: deliveryFee
    };
  }

  // Bound requested points by available points and maximum required points
  const pointsEligible = Math.min(pointsRequested, availablePoints);
  const rawDiscount = getPointsCashValue(pointsEligible);

  // Discount cannot exceed the delivery fee itself
  const discountZMW = Math.min(rawDiscount, deliveryFee);
  const pointsDeducted = Math.ceil(discountZMW * POINTS_PER_KWACHA_DISCOUNT);
  const finalDeliveryFee = Math.max(0, Math.round((deliveryFee - discountZMW) * 100) / 100);

  return {
    discountZMW,
    pointsDeducted,
    finalDeliveryFee
  };
}
