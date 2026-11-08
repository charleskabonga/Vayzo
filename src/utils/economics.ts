/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OrderFinancialInputs {
  productSubtotal: number;
  deliveryFee: number;
  serviceFee?: number;
  merchantCommissionRate?: number; // e.g. 0.08 for 8%
  riderBaseCompensation?: number;
  riderDistanceKm?: number;
  riderKmRate?: number;
  tip?: number;
  discounts?: number;
}

export interface OrderFinancialBreakdown {
  customerPayable: number;
  merchantCommission: number;
  merchantNetProceeds: number;
  platformDeliveryRevenue: number;
  platformServiceFeeRevenue: number;
  platformCommissionRevenue: number;
  platformGrossRevenue: number;
  riderCompensation: number;
  platformContributionMargin: number;
  currency: string;
}

/**
 * Calculates authoritative financial breakdown for an order.
 * Uses integer minor units (ngwee) internally to prevent floating point inaccuracies.
 */
export function calculateOrderFinancials(inputs: OrderFinancialInputs): OrderFinancialBreakdown {
  const toMinor = (val: number) => Math.round(val * 100);
  const toMajor = (minor: number) => minor / 100;

  const subtotalMinor = toMinor(inputs.productSubtotal);
  const deliveryFeeMinor = toMinor(inputs.deliveryFee);
  const serviceFeeMinor = toMinor(inputs.serviceFee ?? 5);
  const discountMinor = toMinor(inputs.discounts ?? 0);
  const commissionRate = inputs.merchantCommissionRate ?? 0.08;

  // Customer payable = Subtotal + Delivery + Service - Discounts
  const customerPayableMinor = subtotalMinor + deliveryFeeMinor + serviceFeeMinor - discountMinor;

  // Merchant commission = Subtotal * rate
  const merchantCommissionMinor = Math.round(subtotalMinor * commissionRate);
  const merchantNetMinor = subtotalMinor - merchantCommissionMinor;

  // Rider compensation = base (default K18) + distance component + tip
  const baseRider = inputs.riderBaseCompensation ?? 18;
  const distanceKm = Math.max(0, (inputs.riderDistanceKm ?? 0) - 2);
  const kmRate = inputs.riderKmRate ?? 2.5;
  const distancePay = distanceKm * kmRate;
  const tip = inputs.tip ?? 0;
  const riderCompensationMinor = toMinor(baseRider + distancePay + tip);

  // Platform gross revenue = delivery fee + service fee + merchant commission
  const platformDeliveryMinor = deliveryFeeMinor;
  const platformServiceMinor = serviceFeeMinor;
  const platformCommissionMinor = merchantCommissionMinor;
  const platformGrossMinor = platformDeliveryMinor + platformServiceMinor + platformCommissionMinor;

  // Platform contribution margin = Gross platform revenue - Rider compensation
  const platformContributionMinor = platformGrossMinor - riderCompensationMinor;

  return {
    customerPayable: toMajor(customerPayableMinor),
    merchantCommission: toMajor(merchantCommissionMinor),
    merchantNetProceeds: toMajor(merchantNetMinor),
    platformDeliveryRevenue: toMajor(platformDeliveryMinor),
    platformServiceFeeRevenue: toMajor(platformServiceMinor),
    platformCommissionRevenue: toMajor(platformCommissionMinor),
    platformGrossRevenue: toMajor(platformGrossMinor),
    riderCompensation: toMajor(riderCompensationMinor),
    platformContributionMargin: toMajor(platformContributionMinor),
    currency: 'ZMW'
  };
}

export interface DistancePricingResult {
  distanceKm: number;
  vehicleType: 'biker' | 'taxi';
  baseFare: number;
  baseKmThreshold: number;
  extraKm: number;
  perKmRate: number;
  distanceFee: number;
  totalDeliveryFee: number;
  formulaLabel: string;
}

/**
 * Calculates dynamic rider / courier delivery price strictly dependent on
 * distance from shop to customer.
 */
export function calculateDistanceDeliveryFee(
  distanceKm: number,
  vehicleType: 'biker' | 'taxi'
): DistancePricingResult {
  const safeDistance = Math.max(0.5, Number.isFinite(distanceKm) && distanceKm > 0 ? distanceKm : 3.0);
  const baseKm = 3.0;

  if (vehicleType === 'biker') {
    const baseFare = 25;
    const perKmRate = 3.5;
    const extraKm = Math.max(0, safeDistance - baseKm);
    const distanceFee = Math.round(extraKm * perKmRate * 100) / 100;
    const totalDeliveryFee = Math.round((baseFare + distanceFee) * 10) / 10;
    return {
      distanceKm: safeDistance,
      vehicleType: 'biker',
      baseFare,
      baseKmThreshold: baseKm,
      extraKm: Math.round(extraKm * 10) / 10,
      perKmRate,
      distanceFee,
      totalDeliveryFee,
      formulaLabel:
        extraKm > 0
          ? `K${baseFare} base (up to 3km) + K${perKmRate}/km × ${extraKm.toFixed(1)}km extra`
          : `K${baseFare} standard (within 3km)`
    };
  } else {
    const baseFare = 50;
    const perKmRate = 6.5;
    const extraKm = Math.max(0, safeDistance - baseKm);
    const distanceFee = Math.round(extraKm * perKmRate * 100) / 100;
    const totalDeliveryFee = Math.round((baseFare + distanceFee) * 10) / 10;
    return {
      distanceKm: safeDistance,
      vehicleType: 'taxi',
      baseFare,
      baseKmThreshold: baseKm,
      extraKm: Math.round(extraKm * 10) / 10,
      perKmRate,
      distanceFee,
      totalDeliveryFee,
      formulaLabel:
        extraKm > 0
          ? `K${baseFare} base (up to 3km) + K${perKmRate}/km × ${extraKm.toFixed(1)}km extra`
          : `K${baseFare} standard (within 3km)`
    };
  }
}

export interface YangoDualPaymentInputs {
  productSubtotal: number;
  vehicleType: 'biker' | 'taxi';
  serviceFee?: number; // Management / service fee (e.g. K5)
  discounts?: number;
  distanceKm?: number; // Distance in km from shop to customer
}

export interface YangoDualPaymentBreakdown {
  stage1MerchandisePayable: number; // Merchandise + Management fee, paid upfront via MTN / Airtel / Zamtel
  stage2DeliveryPayable: number; // Courier fee, paid in CASH only upon arrival
  totalEstimatedTripCost: number; // Total trip cost displayed like Yango Food
  vehicleType: 'biker' | 'taxi';
  vehicleLabel: string;
  vehicleDescription: string;
  serviceFee: number;
  deliveryFee: number;
  distanceKm: number;
  pricingFormula: string;
  currency: string;
}

export function calculateYangoDualPayment(inputs: YangoDualPaymentInputs): YangoDualPaymentBreakdown {
  const toMinor = (val: number) => Math.round(val * 100);
  const toMajor = (minor: number) => minor / 100;

  const subtotalMinor = toMinor(inputs.productSubtotal);
  const serviceFeeMinor = toMinor(inputs.serviceFee ?? 5);
  const discountMinor = toMinor(inputs.discounts ?? 0);

  // Stage 1: Merchandise + Management fee
  const stage1Minor = Math.max(0, subtotalMinor + serviceFeeMinor - discountMinor);

  // Stage 2: Courier delivery (Biker vs Taxi) strictly dependent on distance from shop to customer
  const distanceCalc = calculateDistanceDeliveryFee(inputs.distanceKm ?? 3.0, inputs.vehicleType);
  const deliveryFeeMinor = toMinor(distanceCalc.totalDeliveryFee);

  const totalMinor = stage1Minor + deliveryFeeMinor;

  return {
    stage1MerchandisePayable: toMajor(stage1Minor),
    stage2DeliveryPayable: toMajor(deliveryFeeMinor),
    totalEstimatedTripCost: toMajor(totalMinor),
    vehicleType: inputs.vehicleType,
    vehicleLabel: inputs.vehicleType === 'biker' ? 'Motorbike Courier' : 'Cargo Cab / Taxi',
    vehicleDescription:
      inputs.vehicleType === 'biker'
        ? `Fast express courier on motorbike (${distanceCalc.distanceKm.toFixed(1)} km from shop). Ideal for grocery bags, meal boxes and small parcels.`
        : `Spacious 4-wheel cab with trunk space (${distanceCalc.distanceKm.toFixed(1)} km from shop). Ideal for bulk cartons, 25kg mealie meal sacks & fragile goods.`,
    serviceFee: toMajor(serviceFeeMinor),
    deliveryFee: toMajor(deliveryFeeMinor),
    distanceKm: distanceCalc.distanceKm,
    pricingFormula: distanceCalc.formulaLabel,
    currency: 'ZMW'
  };
}

export function formatZMW(amount: number): string {
  return `K${amount.toFixed(2)}`;
}

export interface ScenarioParams {
  dailyOrders: number;
  averageBasketValue: number;
  commissionRate: number; // e.g. 0.08
  deliveryFee: number;
  serviceFee: number;
  riderCompensation: number;
  paymentFeeRate: number; // e.g. 0.015 for 1.5%
  refundRate: number; // e.g. 0.01 for 1%
  monthlyFixedCosts: number;
}

export interface ScenarioResult {
  monthlyOrders: number;
  monthlyGMV: number;
  monthlyGrossRevenue: number;
  monthlyVariableCosts: number;
  monthlyContributionMargin: number;
  contributionPerOrder: number;
  monthlyNetOperatingResult: number;
  breakevenMonthlyOrders: number;
}

export function simulateUnitEconomics(params: ScenarioParams): ScenarioResult {
  const daysInMonth = 30;
  const monthlyOrders = params.dailyOrders * daysInMonth;
  const monthlyGMV = monthlyOrders * params.averageBasketValue;

  // Gross revenue per order
  const commissionPerOrder = params.averageBasketValue * params.commissionRate;
  const grossRevPerOrder = commissionPerOrder + params.deliveryFee + params.serviceFee;

  // Variable cost per order
  const paymentCostPerOrder = (params.averageBasketValue + params.deliveryFee + params.serviceFee) * params.paymentFeeRate;
  const refundCostPerOrder = params.averageBasketValue * params.refundRate;
  const variableCostPerOrder = params.riderCompensation + paymentCostPerOrder + refundCostPerOrder;

  const contributionPerOrder = grossRevPerOrder - variableCostPerOrder;

  const monthlyGrossRevenue = monthlyOrders * grossRevPerOrder;
  const monthlyVariableCosts = monthlyOrders * variableCostPerOrder;
  const monthlyContributionMargin = monthlyOrders * contributionPerOrder;
  const monthlyNetOperatingResult = monthlyContributionMargin - params.monthlyFixedCosts;

  const breakevenMonthlyOrders = contributionPerOrder > 0
    ? Math.ceil(params.monthlyFixedCosts / contributionPerOrder)
    : Infinity;

  return {
    monthlyOrders,
    monthlyGMV,
    monthlyGrossRevenue,
    monthlyVariableCosts,
    monthlyContributionMargin,
    contributionPerOrder,
    monthlyNetOperatingResult,
    breakevenMonthlyOrders
  };
}
