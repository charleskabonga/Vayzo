/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  Merchant,
  Product,
  Order,
  DeliveryTask,
  UserProfile,
  UserRole,
  BusinessSector,
  UnitOfMeasure,
  ZambianAddress,
  OrderItem,
  VehicleOption,
} from '../types';
import type { OrderStatus } from '../utils/orderStateMachine';

export interface AppAuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
}

const VALID_ROLES: UserRole[] = ['customer', 'merchant', 'rider', 'admin'];

function normalizeRole(rawRole: unknown): UserRole {
  if (typeof rawRole === 'string' && VALID_ROLES.includes(rawRole as UserRole)) {
    return rawRole as UserRole;
  }
  return 'customer';
}

// ---------------------------------------------------------------------------
// Auth & Session Helpers (supabase.auth + profiles + user_roles)
// ---------------------------------------------------------------------------

export async function getCurrentSession(): Promise<Session | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.warn('Supabase getSession error:', error.message);
    return null;
  }
  return data.session;
}

export function onAuthSessionChange(
  callback: (event: string, session: Session | null) => void
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return () => subscription.unsubscribe();
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(params: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}) {
  const { email, password, fullName, phone } = params;
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: fullName.trim(),
        display_name: fullName.trim(),
        phone: phone?.trim() || undefined,
      },
    },
  });
  if (error) throw error;

  if (data.user && data.session) {
    await syncProfileAndRoleOnAuth(data.user, fullName.trim(), phone?.trim());
  }

  return data;
}

export async function signInWithGoogleOAuth() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  });
  if (error) throw error;
  return data;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Profiles & User Roles (profiles, user_roles)
// ---------------------------------------------------------------------------

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, full_name, username, phone, city, township, street, landmark, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Supabase fetchUserProfile skipped:', error.message);
    return null;
  }
  if (!data) return null;

  return {
    id: data.id,
    email: data.email || '',
    displayName: data.display_name || data.full_name || data.username || data.email || 'Vayzo User',
    role: 'customer',
    phone: data.phone || undefined,
    city: data.city || 'Lusaka',
    township: data.township || undefined,
    street: data.street || undefined,
    landmark: data.landmark || undefined,
    createdAt: data.created_at || new Date().toISOString(),
  };
}

export async function fetchUserRole(userId: string): Promise<UserRole> {
  if (!isSupabaseConfigured || !userId) return 'customer';
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Supabase fetchUserRole skipped:', error.message);
    return 'customer';
  }
  return normalizeRole(data?.role);
}

export async function syncProfileAndRoleOnAuth(
  user: SupabaseUser,
  overrideName?: string,
  overridePhone?: string
): Promise<AppAuthUser> {
  const fallbackName =
    overrideName ||
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.display_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split('@')[0] ||
    'Vayzo User';

  const fallbackPhone =
    overridePhone || (user.user_metadata?.phone as string | undefined) || undefined;

  let profile = await fetchUserProfile(user.id);
  if (!profile && isSupabaseConfigured) {
    const { error: upsertErr } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        email: user.email || '',
        display_name: fallbackName,
        phone: fallbackPhone || null,
        city: 'Lusaka',
      },
      { onConflict: 'id' }
    );
    if (upsertErr) {
      console.warn('Supabase profile upsert skipped:', upsertErr.message);
    } else {
      profile = await fetchUserProfile(user.id);
    }
  }

  let role = await fetchUserRole(user.id);
  if (role === 'customer' && isSupabaseConfigured) {
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existingRole) {
      const { error: roleErr } = await supabase.from('user_roles').insert({
        user_id: user.id,
        role: 'customer',
      });
      if (roleErr) {
        console.warn('Supabase default user_roles insert skipped:', roleErr.message);
      }
    } else {
      role = normalizeRole(existingRole.role);
    }
  }

  return {
    id: user.id,
    email: user.email || profile?.email || '',
    displayName: profile?.displayName || fallbackName,
    role,
    phone: profile?.phone || fallbackPhone,
  };
}

// ---------------------------------------------------------------------------
// Stores (stores table)
// ---------------------------------------------------------------------------

function mapStoreRow(row: Record<string, any>): Merchant {
  return {
    id: String(row.id),
    name: String(row.name || 'Unnamed Store'),
    businessSector: (row.business_sector || row.businessSector || 'supermarket_grocery') as BusinessSector,
    category: String(row.category || 'Supermarket'),
    description: String(row.description || ''),
    city: String(row.city || 'Lusaka'),
    township: String(row.township || 'Kabulonga'),
    address: String(row.address || ''),
    phone: String(row.phone || '+260 97 000 0000'),
    commissionRate: Number(row.commission_rate ?? row.commissionRate ?? 0.08),
    rating: Number(row.rating ?? 4.8),
    reviewCount: Number(row.review_count ?? row.reviewCount ?? 0),
    deliveryTimeMins: String(row.delivery_time_mins || row.deliveryTimeMins || '25-40 min'),
    minOrder: Number(row.min_order ?? row.minOrder ?? 50),
    status: (row.status || 'active') as Merchant['status'],
    imageUrl: String(
      row.image_url ||
        row.imageUrl ||
        'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80'
    ),
    distanceKm: row.distance_km !== undefined ? Number(row.distance_km) : row.distanceKm,
  };
}

export async function fetchStores(): Promise<Merchant[] | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('stores').select('*');
  if (error) {
    console.warn('Supabase fetchStores skipped:', error.message);
    return null;
  }
  if (!data || data.length === 0) return [];
  return data.map(mapStoreRow);
}

export async function insertStore(merchant: Merchant, ownerId?: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const payload: Record<string, unknown> = {
    id: merchant.id,
    name: merchant.name,
    business_sector: merchant.businessSector,
    category: merchant.category,
    description: merchant.description,
    city: merchant.city,
    township: merchant.township,
    address: merchant.address,
    phone: merchant.phone,
    commission_rate: merchant.commissionRate,
    rating: merchant.rating,
    review_count: merchant.reviewCount,
    delivery_time_mins: merchant.deliveryTimeMins,
    min_order: merchant.minOrder,
    status: merchant.status,
    image_url: merchant.imageUrl,
    distance_km: merchant.distanceKm ?? 2.0,
  };
  if (ownerId) {
    payload.owner_id = ownerId;
  }

  const { error } = await supabase.from('stores').insert(payload);
  if (error) {
    console.warn('Supabase insertStore skipped:', error.message);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Products (products table)
// ---------------------------------------------------------------------------

function mapProductRow(row: Record<string, any>): Product {
  return {
    id: String(row.id),
    merchantId: String(row.store_id || row.merchant_id || row.merchantId || ''),
    merchantName: String(row.merchant_name || row.merchantName || 'Vayzo Store'),
    name: String(row.name || row.title || 'Product'),
    description: String(row.description || ''),
    category: String(row.category || 'Supermarket'),
    unit: (row.unit || 'each') as UnitOfMeasure,
    packSize: String(row.pack_size || row.packSize || '1 unit'),
    price: Number(row.price ?? 0),
    compareAtPrice:
      row.compare_at_price !== undefined
        ? Number(row.compare_at_price)
        : row.compareAtPrice,
    stock: Number(row.stock ?? 0),
    status: (row.status || 'in_stock') as Product['status'],
    has3dModel: Boolean(row.has_3d_model ?? row.has3dModel ?? false),
    modelType: row.model_type || row.modelType || undefined,
    imageUrl: String(
      row.image_url ||
        row.imageUrl ||
        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'
    ),
    rating: Number(row.rating ?? 5.0),
    reviewCount: Number(row.review_count ?? row.reviewCount ?? 0),
    brand: row.brand || undefined,
    tags: Array.isArray(row.tags) ? row.tags : undefined,
  };
}

export async function fetchProducts(): Promise<Product[] | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    console.warn('Supabase fetchProducts skipped:', error.message);
    return null;
  }
  if (!data || data.length === 0) return [];
  return data.map(mapProductRow);
}

export async function insertProduct(product: Product): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase.from('products').insert({
    id: product.id,
    store_id: product.merchantId,
    merchant_id: product.merchantId,
    merchant_name: product.merchantName,
    name: product.name,
    description: product.description,
    category: product.category,
    unit: product.unit,
    pack_size: product.packSize,
    price: product.price,
    compare_at_price: product.compareAtPrice ?? null,
    stock: product.stock,
    status: product.status,
    has_3d_model: product.has3dModel,
    model_type: product.modelType ?? null,
    image_url: product.imageUrl,
    rating: product.rating,
    review_count: product.reviewCount,
    brand: product.brand ?? null,
  });
  if (error) {
    console.warn('Supabase insertProduct skipped:', error.message);
    return false;
  }
  return true;
}

export async function bulkInsertProducts(products: Product[]): Promise<boolean> {
  if (!isSupabaseConfigured || products.length === 0) return false;
  const rows = products.map((product) => ({
    id: product.id,
    store_id: product.merchantId,
    merchant_id: product.merchantId,
    merchant_name: product.merchantName,
    name: product.name,
    description: product.description,
    category: product.category,
    unit: product.unit,
    pack_size: product.packSize,
    price: product.price,
    stock: product.stock,
    status: product.status,
    has_3d_model: product.has3dModel,
    image_url: product.imageUrl,
    rating: product.rating,
    review_count: product.reviewCount,
    brand: product.brand ?? null,
  }));
  const { error } = await supabase.from('products').insert(rows);
  if (error) {
    console.warn('Supabase bulkInsertProducts skipped:', error.message);
    return false;
  }
  return true;
}

export async function updateProductInDb(
  productId: string,
  updates: { stock?: number; price?: number }
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase
    .from('products')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId);

  if (error) {
    console.warn('Supabase updateProductInDb skipped:', error.message);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Orders (orders table)
// ---------------------------------------------------------------------------

function mapOrderRow(row: Record<string, any>): Order {
  const defaultAddress: ZambianAddress = {
    city: 'Lusaka',
    township: 'Kabulonga',
    street: '',
    housePlotNumber: '',
    landmark: '',
    recipientPhone: String(row.customer_phone || row.customerPhone || ''),
    recipientName: String(row.customer_name || row.customerName || 'Customer'),
  };

  return {
    id: String(row.id),
    customerId: String(row.customer_id || row.buyer_id || row.customerId || ''),
    customerName: String(row.customer_name || row.customerName || 'Customer'),
    customerPhone: String(row.customer_phone || row.customerPhone || ''),
    merchantId: String(row.store_id || row.merchant_id || row.seller_id || row.merchantId || ''),
    merchantName: String(row.merchant_name || row.merchantName || 'Store'),
    items: Array.isArray(row.items) ? (row.items as OrderItem[]) : [],
    subtotal: Number(row.subtotal ?? 0),
    serviceFee: Number(row.service_fee ?? row.serviceFee ?? 5),
    deliveryFee: Number(row.delivery_fee ?? row.deliveryFee ?? 25),
    total: Number(row.total ?? row.total_amount ?? 0),
    status: (row.status || 'CONFIRMED') as OrderStatus,
    deliveryAddress: (row.delivery_address || row.deliveryAddress || defaultAddress) as ZambianAddress,
    vehicleType: (row.vehicle_type || row.vehicleType || 'biker') as VehicleOption,
    stage1Amount: Number(row.stage1_amount ?? row.stage1Amount ?? row.subtotal ?? 0),
    stage1Paid: Boolean(row.stage1_paid ?? row.stage1Paid ?? true),
    stage1PaymentMethod: (row.stage1_payment_method || row.stage1PaymentMethod || 'MTN_MOMO') as Order['stage1PaymentMethod'],
    stage1TxRef: row.stage1_tx_ref || row.stage1TxRef || undefined,
    stage2Amount: Number(row.stage2_amount ?? row.stage2Amount ?? row.delivery_fee ?? 25),
    stage2Paid: Boolean(row.stage2_paid ?? row.stage2Paid ?? false),
    stage2PaymentMethod: 'CASH_ON_DELIVERY',
    loyaltyPointsRedeemed: row.loyalty_points_redeemed ?? row.loyaltyPointsRedeemed,
    loyaltyDiscountZMW: row.loyalty_discount_zmw ?? row.loyaltyDiscountZMW,
    pointsEarned: row.points_earned ?? row.pointsEarned,
    paymentMethod: (row.payment_method || row.paymentMethod || 'MTN_MOMO') as Order['paymentMethod'],
    paymentStatus: (row.payment_status || row.paymentStatus || 'SUCCESS') as Order['paymentStatus'],
    riderId: row.rider_id || row.riderId || undefined,
    riderName: row.rider_name || row.riderName || undefined,
    riderPhone: row.rider_phone || row.riderPhone || undefined,
    vehiclePlate: row.vehicle_plate || row.vehiclePlate || undefined,
    pickupVerificationCode: String(row.pickup_verification_code || row.pickupVerificationCode || '4912'),
    deliveryConfirmationCode: String(row.delivery_confirmation_code || row.deliveryConfirmationCode || '8204'),
    timeline: Array.isArray(row.timeline) ? row.timeline : [],
    createdAt: String(row.created_at || row.createdAt || new Date().toISOString()),
    updatedAt: String(row.updated_at || row.updatedAt || new Date().toISOString()),
  };
}

export async function fetchOrders(): Promise<Order[] | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('orders')
    .select('*');

  if (error) {
    console.warn('Supabase fetchOrders skipped:', error.message);
    return null;
  }
  if (!data || data.length === 0) return [];
  return data
    .map(mapOrderRow)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function insertOrder(order: Order): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase.from('orders').insert({
    id: order.id,
    customer_id: order.customerId,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    store_id: order.merchantId,
    merchant_id: order.merchantId,
    merchant_name: order.merchantName,
    items: order.items,
    subtotal: order.subtotal,
    service_fee: order.serviceFee,
    delivery_fee: order.deliveryFee,
    total: order.total,
    status: order.status,
    delivery_address: order.deliveryAddress,
    vehicle_type: order.vehicleType,
    stage1_amount: order.stage1Amount,
    stage1_paid: order.stage1Paid,
    stage1_payment_method: order.stage1PaymentMethod,
    stage1_tx_ref: order.stage1TxRef ?? null,
    stage2_amount: order.stage2Amount,
    stage2_paid: order.stage2Paid,
    stage2_payment_method: order.stage2PaymentMethod,
    loyalty_points_redeemed: order.loyaltyPointsRedeemed ?? 0,
    loyalty_discount_zmw: order.loyaltyDiscountZMW ?? 0,
    points_earned: order.pointsEarned ?? 0,
    payment_method: order.paymentMethod,
    payment_status: order.paymentStatus,
    rider_id: order.riderId ?? null,
    rider_name: order.riderName ?? null,
    rider_phone: order.riderPhone ?? null,
    vehicle_plate: order.vehiclePlate ?? null,
    pickup_verification_code: order.pickupVerificationCode,
    delivery_confirmation_code: order.deliveryConfirmationCode,
    timeline: order.timeline,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
  });

  if (error) {
    console.warn('Supabase insertOrder skipped:', error.message);
    return false;
  }
  return true;
}

export async function updateOrderStatusInDb(
  orderId: string,
  status: OrderStatus,
  timeline: Order['timeline']
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase
    .from('orders')
    .update({
      status,
      timeline,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    console.warn('Supabase updateOrderStatusInDb skipped:', error.message);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Deliveries (deliveries table)
// ---------------------------------------------------------------------------

function mapDeliveryRow(row: Record<string, any>): DeliveryTask {
  return {
    id: String(row.id),
    orderId: String(row.order_id || row.orderId || ''),
    merchantId: String(row.merchant_id || row.store_id || row.merchantId || ''),
    merchantName: String(row.merchant_name || row.merchantName || ''),
    merchantAddress: String(row.merchant_address || row.merchantAddress || ''),
    customerId: String(row.customer_id || row.customerId || ''),
    customerName: String(row.customer_name || row.customerName || ''),
    customerPhone: String(row.customer_phone || row.customerPhone || ''),
    customerAddress: (row.customer_address || row.customerAddress || {}) as ZambianAddress,
    riderId: row.rider_id || row.riderId || undefined,
    status: (row.status || 'unassigned') as DeliveryTask['status'],
    pickupCode: String(row.pickup_code || row.pickupCode || ''),
    confirmationCode: String(row.confirmation_code || row.confirmationCode || ''),
    estimatedDistanceKm: Number(row.estimated_distance_km ?? row.estimatedDistanceKm ?? 2.5),
    basePay: Number(row.base_pay ?? row.basePay ?? 25),
    distancePay: Number(row.distance_pay ?? row.distancePay ?? 0),
    tip: Number(row.tip ?? 0),
    totalEarnings: Number(row.total_earnings ?? row.totalEarnings ?? 25),
    createdAt: String(row.created_at || row.createdAt || new Date().toISOString()),
  };
}

export async function fetchDeliveries(): Promise<DeliveryTask[] | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('deliveries')
    .select('*');

  if (error) {
    console.warn('Supabase fetchDeliveries skipped:', error.message);
    return null;
  }
  if (!data || data.length === 0) return [];
  return data.map(mapDeliveryRow);
}

export async function insertDeliveryForOrder(order: Order): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase.from('deliveries').insert({
    order_id: order.id,
    merchant_id: order.merchantId,
    merchant_name: order.merchantName,
    customer_id: order.customerId,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_address: order.deliveryAddress,
    rider_id: order.riderId ?? null,
    status: 'accepted',
    pickup_code: order.pickupVerificationCode,
    confirmation_code: order.deliveryConfirmationCode,
    base_pay: order.stage2Amount || order.deliveryFee,
    total_earnings: order.stage2Amount || order.deliveryFee,
  });

  if (error) {
    console.warn('Supabase insertDeliveryForOrder skipped:', error.message);
    return false;
  }
  return true;
}

export async function updateDeliveryStatusForOrder(
  orderId: string,
  orderStatus: OrderStatus
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const deliveryStatusMap: Partial<Record<OrderStatus, DeliveryTask['status']>> = {
    RIDER_ASSIGNED: 'accepted',
    PICKED_UP: 'picked_up',
    IN_TRANSIT: 'in_transit',
    DELIVERED: 'delivered',
  };
  const nextDeliveryStatus = deliveryStatusMap[orderStatus];
  if (!nextDeliveryStatus) return true;

  const { error } = await supabase
    .from('deliveries')
    .update({ status: nextDeliveryStatus })
    .eq('order_id', orderId);

  if (error) {
    console.warn('Supabase updateDeliveryStatusForOrder skipped:', error.message);
    return false;
  }
  return true;
}
