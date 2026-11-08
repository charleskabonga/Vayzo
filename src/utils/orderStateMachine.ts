/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OrderStatus =
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'CONFIRMED'
  | 'MERCHANT_ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'RIDER_ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CREATED: ['PAYMENT_PENDING', 'CANCELLED'],
  PAYMENT_PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['MERCHANT_ACCEPTED', 'CANCELLED'],
  MERCHANT_ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP', 'CANCELLED'],
  READY_FOR_PICKUP: ['RIDER_ASSIGNED', 'CANCELLED'],
  RIDER_ASSIGNED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['IN_TRANSIT'],
  IN_TRANSIT: ['DELIVERED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: ['REFUNDED'],
  REFUNDED: []
};

export function canTransitionOrder(fromStatus: OrderStatus, toStatus: OrderStatus): boolean {
  const allowed = VALID_TRANSITIONS[fromStatus];
  if (!allowed) return false;
  return allowed.includes(toStatus);
}

export function validateOrderTransition(fromStatus: OrderStatus, toStatus: OrderStatus): void {
  if (!canTransitionOrder(fromStatus, toStatus)) {
    throw new Error(`Invalid order transition from '${fromStatus}' to '${toStatus}'.`);
  }
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, { label: string; description: string; step: number }> = {
  CREATED: { label: 'Order Created', description: 'Order initialized in cart', step: 1 },
  PAYMENT_PENDING: { label: 'Awaiting Payment', description: 'Pending MoMo or card verification', step: 2 },
  CONFIRMED: { label: 'Order Confirmed', description: 'Payment verified, routed to shop', step: 3 },
  MERCHANT_ACCEPTED: { label: 'Merchant Accepted', description: 'Shop confirmed items available', step: 4 },
  PREPARING: { label: 'Preparing Items', description: 'Groceries being carefully packed', step: 5 },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', description: 'Awaiting courier collection', step: 6 },
  RIDER_ASSIGNED: { label: 'Rider Dispatched', description: 'Courier heading to merchant', step: 7 },
  PICKED_UP: { label: 'Picked Up', description: 'Verified with merchant pickup code', step: 8 },
  IN_TRANSIT: { label: 'In Transit', description: 'On the way to your address', step: 9 },
  DELIVERED: { label: 'Delivered', description: 'Delivery completed with confirmation code', step: 10 },
  CANCELLED: { label: 'Cancelled', description: 'Order has been cancelled', step: -1 },
  REFUNDED: { label: 'Refunded', description: 'Payment reversed or refunded', step: -2 }
};
