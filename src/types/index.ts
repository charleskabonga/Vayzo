/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrderStatus } from '../utils/orderStateMachine';

export type UserRole = 'customer' | 'merchant' | 'rider' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  city?: string;
  township?: string;
  street?: string;
  landmark?: string;
  createdAt: string;
}

export type BusinessSector = 'food_dining' | 'supermarket_grocery' | 'retail_other';

export interface Merchant {
  id: string;
  name: string;
  businessSector: BusinessSector;
  category: string;
  description: string;
  city: string;
  township: string;
  address: string;
  phone: string;
  commissionRate: number; // e.g. 0.08
  rating: number;
  reviewCount: number;
  deliveryTimeMins: string;
  minOrder: number;
  status: 'active' | 'pending' | 'suspended';
  imageUrl: string;
  distanceKm?: number;
}

export type UnitOfMeasure = 'each' | 'kg' | 'g' | 'litre' | 'pack' | 'tray' | 'bunch';

export interface Product {
  id: string;
  merchantId: string;
  merchantName: string;
  name: string;
  description: string;
  category: string;
  unit: UnitOfMeasure;
  packSize: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  has3dModel: boolean;
  modelType?: 'mealie_meal_sack' | 'cooking_oil_jug' | 'honey_jar' | 'tea_tin';
  imageUrl: string;
  rating: number;
  reviewCount: number;
  brand?: string;
  tags?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ZambianAddress {
  city: string;
  township: string;
  street: string;
  housePlotNumber: string;
  landmark: string;
  deliveryInstructions?: string;
  recipientPhone: string;
  recipientName: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  unit: string;
  packSize: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export type VehicleOption = 'biker' | 'taxi';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  merchantId: string;
  merchantName: string;
  items: OrderItem[];
  subtotal: number; // Merchandise cost
  serviceFee: number; // Platform management fee
  deliveryFee: number; // Courier fee
  total: number; // Grand total (Stage 1 + Stage 2)
  status: OrderStatus;
  deliveryAddress: ZambianAddress;
  vehicleType: VehicleOption;
  
  // Yango Dual Payment Stages:
  // Stage 1: Merchandise + Platform Management Fee (Paid upfront via MTN / Airtel / Zamtel)
  stage1Amount: number;
  stage1Paid: boolean;
  stage1PaymentMethod: 'MTN_MOMO' | 'AIRTEL_MONEY' | 'ZAMTEL_KWACHA';
  stage1TxRef?: string;
  
  // Stage 2: Courier Biker / Taxi Delivery Fee (Paid in CASH only upon arrival)
  stage2Amount: number;
  stage2Paid: boolean;
  stage2PaymentMethod: 'CASH_ON_DELIVERY';

  // Loyalty Rewards
  loyaltyPointsRedeemed?: number;
  loyaltyDiscountZMW?: number;
  pointsEarned?: number;

  paymentMethod: 'MTN_MOMO' | 'AIRTEL_MONEY' | 'ZAMTEL_KWACHA' | 'CASH_ON_DELIVERY';
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED';
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  vehiclePlate?: string;
  pickupVerificationCode: string;
  deliveryConfirmationCode: string;
  timeline: { status: OrderStatus; timestamp: string; note: string }[];
  createdAt: string;
  updatedAt: string;
}


export interface CatalogImportRow {
  name: string;
  category: string;
  price: number;
  packSize: string;
  stock: number;
  description?: string;
  imageUrl?: string;
  brand?: string;
}

export interface DeliveryTask {
  id: string;
  orderId: string;
  merchantId: string;
  merchantName: string;
  merchantAddress: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: ZambianAddress;
  riderId?: string;
  status: 'unassigned' | 'accepted' | 'heading_to_merchant' | 'picked_up' | 'in_transit' | 'delivered';
  pickupCode: string;
  confirmationCode: string;
  estimatedDistanceKm: number;
  basePay: number;
  distancePay: number;
  tip: number;
  totalEarnings: number;
  createdAt: string;
}

export interface FinancialLedgerEntry {
  id: string;
  orderId: string;
  type: 'ORDER_PAYMENT' | 'MERCHANT_SETTLEMENT' | 'RIDER_PAYOUT' | 'PLATFORM_FEE' | 'REFUND';
  grossAmount: number;
  merchantShare: number;
  platformShare: number;
  riderShare: number;
  status: 'POSTED' | 'RECONCILED' | 'PENDING';
  reference: string;
  createdAt: string;
}

export type NotificationTargetRole = 'all' | 'customer' | 'merchant' | 'rider' | 'admin';
export type NotificationType = 'order' | 'delivery' | 'inventory' | 'payment' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  targetRole: NotificationTargetRole;
  targetUserId?: string;
  targetMerchantId?: string;
  orderId?: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export type AnalyticsTimeRange = 'today' | '7d' | '30d' | 'all';

export interface TopProductMetric {
  productId: string;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
  currentStock: number;
  stockVelocity: 'fast' | 'normal' | 'low_stock_risk';
}

export interface TownshipMetric {
  township: string;
  orders: number;
  gmv: number;
  avgDistanceKm: number;
}

export interface HourlyDistributionMetric {
  hourLabel: string;
  hour: number;
  orderCount: number;
  gmv: number;
}

export interface PaymentMethodMetric {
  method: string;
  label: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface OrderFunnelMetric {
  stage: string;
  label: string;
  count: number;
  percentage: number;
}

export interface DailyTrendMetric {
  date: string;
  dayLabel: string;
  orders: number;
  revenue: number;
}

export interface MerchantAnalyticsSummary {
  period: AnalyticsTimeRange;
  totalGMV: number;
  netPayout: number;
  commissionPaid: number;
  ordersCount: number;
  completedOrdersCount: number;
  averageOrderValue: number;
  averageFulfillmentMins: number;
  repeatCustomerPercentage: number;
  topProducts: TopProductMetric[];
  townshipBreakdown: TownshipMetric[];
  hourlyDistribution: HourlyDistributionMetric[];
  paymentMethodBreakdown: PaymentMethodMetric[];
  orderFunnel: OrderFunnelMetric[];
  dailyTrend: DailyTrendMetric[];
}

