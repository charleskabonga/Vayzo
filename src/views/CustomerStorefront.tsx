/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Box,
  Store,
  Clock,
  MapPin,
  ChevronRight,
  ArrowLeft,
  Bike,
  Car,
  Star,
  UtensilsCrossed,
  ShoppingCart,
  PackageCheck,
  PlusCircle,
  Building2,
  CheckCircle2,
  History,
  RotateCcw,
  Calendar,
  Check,
  ExternalLink,
  Receipt,
  Truck,
  ShoppingBag
} from 'lucide-react';
import { Product, Merchant, CartItem, Order, BusinessSector } from '../types';
import { ProductCard } from '../components/ProductCard';
import { OrderHistorySection } from '../components/OrderHistorySection';
import { formatZMW, calculateDistanceDeliveryFee } from '../utils/economics';
import { TOWNSHIP_PROXIMITY_MATRIX, getDistanceBetweenTownships } from '../utils/distance';
import {
  StoreCategoryFilter,
  isFoodStore,
  isRetailOtherStore,
  getMerchantGroupLabel,
  getStoreCategoryCounts
} from '../utils/merchantSector';

interface CustomerStorefrontProps {
  products: Product[];
  merchants: Merchant[];
  cart: CartItem[];
  activeOrders: Order[];
  allOrders?: Order[];
  selectedTownship: string;
  onAddToCart: (product: Product, quantity?: number) => void;
  onAddMultipleToCart?: (items: { product: Product; quantity: number }[]) => void;
  onUpdateCartQuantity: (productId: string, quantity: number) => void;
  onOpenProductDetails: (product: Product) => void;
  onViewOrderTracking: (order: Order) => void;
  onOpenAi: () => void;
  onOpenRegisterStore?: () => void;
}

export const CustomerStorefront: React.FC<CustomerStorefrontProps> = ({
  products,
  merchants,
  cart,
  activeOrders,
  allOrders = [],
  selectedTownship,
  onAddToCart,
  onAddMultipleToCart,
  onUpdateCartQuantity,
  onOpenProductDetails,
  onViewOrderTracking,
  onOpenAi,
  onOpenRegisterStore
}) => {
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [storeCategoryFilter, setStoreCategoryFilter] = useState<StoreCategoryFilter>('all');
  const [selectedStoreSubCategory, setSelectedStoreSubCategory] = useState<string>('All');
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'proximity' | 'rating' | 'min_order'>('proximity');

  // Customer Top-Level View: Browse Stores vs Order History
  const [activeCustomerTab, setActiveCustomerTab] = useState<'stores' | 'history'>('stores');
  const [orderHistoryFilter, setOrderHistoryFilter] = useState<'all' | 'delivered' | 'in_transit'>('all');
  const [reorderNotification, setReorderNotification] = useState<string | null>(null);

  // Compute live proximity for each merchant based on selected township
  const merchantsWithProximity = useMemo(() => {
    return merchants.map((m) => {
      const distance =
        TOWNSHIP_PROXIMITY_MATRIX[selectedTownship]?.[m.township] ??
        m.distanceKm ??
        3.5;
      return {
        ...m,
        liveDistanceKm: distance
      };
    }).sort((a, b) => {
      if (sortBy === 'proximity') return a.liveDistanceKm - b.liveDistanceKm;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'min_order') return a.minOrder - b.minOrder;
      return 0;
    });
  }, [merchants, selectedTownship, sortBy]);

  // Compute store counts for Food Stores vs Retail/Other Stores
  const categoryCounts = useMemo(() => {
    return getStoreCategoryCounts(merchants);
  }, [merchants]);

  // Order History aggregation
  const customerOrders = useMemo(() => {
    return allOrders && allOrders.length > 0 ? allOrders : activeOrders;
  }, [allOrders, activeOrders]);

  const deliveredOrders = useMemo(() => {
    return customerOrders.filter((o) => o.status === 'DELIVERED');
  }, [customerOrders]);

  const inTransitOrders = useMemo(() => {
    return customerOrders.filter((o) => o.status !== 'DELIVERED');
  }, [customerOrders]);

  const filteredHistoryOrders = useMemo(() => {
    if (orderHistoryFilter === 'delivered') return deliveredOrders;
    if (orderHistoryFilter === 'in_transit') return inTransitOrders;
    return customerOrders;
  }, [customerOrders, deliveredOrders, inTransitOrders, orderHistoryFilter]);

  // Reorder all items from a past delivery
  const handleReorderOrder = (order: Order) => {
    const itemsToAdd: { product: Product; quantity: number }[] = [];
    let itemsFoundCount = 0;

    for (const item of order.items) {
      const match =
        products.find((p) => p.id === item.productId) ||
        products.find((p) => p.name.toLowerCase() === item.name.toLowerCase());
      if (match) {
        itemsToAdd.push({ product: match, quantity: item.quantity });
        itemsFoundCount++;
      }
    }

    if (itemsToAdd.length > 0) {
      if (onAddMultipleToCart) {
        onAddMultipleToCart(itemsToAdd);
      } else {
        for (const { product, quantity } of itemsToAdd) {
          onAddToCart(product, quantity);
        }
      }
      setReorderNotification(`Added ${itemsFoundCount} item${itemsFoundCount > 1 ? 's' : ''} from ${order.merchantName} to your basket!`);
      setTimeout(() => setReorderNotification(null), 4000);
    } else {
      setReorderNotification(`Products from order #${order.id} are being updated.`);
      setTimeout(() => setReorderNotification(null), 4000);
    }
  };

  // Reorder single item from order history
  const handleReorderSingleItem = (item: { productId: string; name: string; quantity: number }) => {
    const match =
      products.find((p) => p.id === item.productId) ||
      products.find((p) => p.name.toLowerCase() === item.name.toLowerCase());

    if (match) {
      onAddToCart(match, item.quantity);
      setReorderNotification(`Added ${match.name} (x${item.quantity}) to your basket!`);
      setTimeout(() => setReorderNotification(null), 3500);
    }
  };

  // Sub-categories available under the currently selected category filter
  const availableStoreSubCategories = useMemo(() => {
    let pool = merchants;
    if (storeCategoryFilter === 'food') {
      pool = pool.filter(isFoodStore);
    } else if (storeCategoryFilter === 'retail_other') {
      pool = pool.filter(isRetailOtherStore);
    }
    const cats = Array.from(new Set(pool.map((m) => m.category))).filter(Boolean);
    return ['All', ...cats];
  }, [merchants, storeCategoryFilter]);

  // Filtered merchants based on Category Filter ('Food Stores' vs 'Retail/Other Stores'), Sub-category, and Search Query
  const filteredMerchants = useMemo(() => {
    return merchantsWithProximity.filter((m) => {
      if (storeCategoryFilter === 'food' && !isFoodStore(m)) {
        return false;
      }
      if (storeCategoryFilter === 'retail_other' && !isRetailOtherStore(m)) {
        return false;
      }
      if (selectedStoreSubCategory !== 'All' && m.category !== selectedStoreSubCategory) {
        return false;
      }
      if (storeSearchQuery.trim()) {
        const q = storeSearchQuery.toLowerCase();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesCategory = m.category.toLowerCase().includes(q);
        const matchesTownship = m.township.toLowerCase().includes(q);
        const matchesDesc = m.description.toLowerCase().includes(q);
        return matchesName || matchesCategory || matchesTownship || matchesDesc;
      }
      return true;
    });
  }, [merchantsWithProximity, storeCategoryFilter, selectedStoreSubCategory, storeSearchQuery]);

  // Handler when user changes category filter
  const handleCategoryFilterChange = (filter: StoreCategoryFilter) => {
    setStoreCategoryFilter(filter);
    setSelectedStoreSubCategory('All');
  };

  // Current active merchant if selected
  const activeMerchant = useMemo(() => {
    if (!selectedMerchantId) return null;
    return merchantsWithProximity.find((m) => m.id === selectedMerchantId) || null;
  }, [selectedMerchantId, merchantsWithProximity]);

  // Products filtered for the currently active merchant
  const currentStoreProducts = useMemo(() => {
    if (!activeMerchant) return [];
    return products
      .filter((p) => p.merchantId === activeMerchant.id)
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
          (p.brand && p.brand.toLowerCase().includes(productSearchQuery.toLowerCase()));

        if (!matchesSearch) return false;
        if (selectedCategory === 'All') return true;
        if (selectedCategory === '3D Interactive') return p.has3dModel;
        return p.category === selectedCategory;
      });
  }, [products, activeMerchant, productSearchQuery, selectedCategory]);

  // In-store category options
  const storeCategories = useMemo(() => {
    if (!activeMerchant) return [];
    const set = new Set<string>();
    const pool = products.filter((p) => p.merchantId === activeMerchant.id);
    for (const p of pool) {
      set.add(p.category);
    }
    return ['All', '3D Interactive', ...Array.from(set)];
  }, [products, activeMerchant]);

  const cartQuantityMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cart) {
      map.set(item.product.id, item.quantity);
    }
    return map;
  }, [cart]);

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification for Reorders */}
      {reorderNotification && (
        <div className="bg-emerald-900 text-white p-3.5 rounded-2xl shadow-lg border border-emerald-700 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5 font-bold text-xs">
            <CheckCircle2 className="w-5 h-5 text-lime-400 shrink-0" />
            <span>{reorderNotification}</span>
          </div>
          <button
            onClick={() => setReorderNotification(null)}
            className="text-emerald-200 hover:text-white text-xs font-bold px-2 py-1 rounded-lg"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Customer Mode Switcher: Browse Stores vs Order History */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveCustomerTab('stores');
              setSelectedMerchantId(null);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              activeCustomerTab === 'stores'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Browse Stores ({merchants.length})</span>
          </button>

          <button
            onClick={() => setActiveCustomerTab('history')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              activeCustomerTab === 'history'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Order History ({customerOrders.length})</span>
            {deliveredOrders.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-lime-400 text-emerald-950">
                {deliveredOrders.length} delivered
              </span>
            )}
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium hidden sm:flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-700" />
          <span>Delivering to <strong>{selectedTownship}</strong></span>
        </div>
      </div>

      {activeCustomerTab === 'history' ? (
        <OrderHistorySection
          orders={customerOrders}
          merchants={merchants}
          products={products}
          selectedTownship={selectedTownship}
          onReorderOrder={handleReorderOrder}
          onReorderSingleItem={handleReorderSingleItem}
          onViewOrderTracking={onViewOrderTracking}
          onBrowseStores={() => setActiveCustomerTab('stores')}
        />
      ) : (
        <>
          {/* Active Order Banner if an order is in transit or confirmed */}
          {activeOrders.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white p-4 rounded-3xl shadow-lg border border-emerald-700/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-lime-400 text-emerald-950 flex items-center justify-center font-black">
              {activeOrders[0].vehicleType === 'taxi' ? <Car className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-lime-300 uppercase tracking-wider">
                  Active {activeOrders[0].vehicleType === 'taxi' ? 'Cargo Cab' : 'Biker'} Delivery #{activeOrders[0].id}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime-400/20 text-lime-300 border border-lime-400/30">
                  {activeOrders[0].status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                From {activeOrders[0].merchantName} → {activeOrders[0].deliveryAddress.township} • Handover PIN: <span className="font-mono font-bold text-white">{activeOrders[0].deliveryConfirmationCode}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => onViewOrderTracking(activeOrders[0])}
            className="px-4 py-2 bg-lime-400 text-emerald-950 font-black text-xs rounded-xl hover:bg-lime-300 transition shadow-sm"
          >
            Track Delivery Live →
          </button>
        </div>
      )}

      {/* Main Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white p-6 md:p-8 shadow-xl border border-emerald-800/60">
        <div className="max-w-3xl relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-lime-400/20 text-lime-300 border border-lime-400/30 rounded-full text-xs font-bold">
            <MapPin className="w-3.5 h-3.5 text-lime-400" />
            <span>Delivering to {selectedTownship}, Lusaka • 25–45 Min Rapid Dispatch</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
            Lusaka Fast Grocery, Food & Retail Delivery. <br />
            <span className="text-lime-300">Shoprite, Pick n Pay, Hungry Lion & Local Merchants.</span>
          </h1>

          <p className="text-xs md:text-sm text-emerald-100 leading-relaxed max-w-2xl">
            Order authentic groceries and hot meals delivered straight to Kabulonga, Woodlands, Rhodes Park, and across Lusaka. Merchandise paid upfront via Mobile Money; distance-based courier fee paid in cash directly to your rider.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-emerald-200">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-900/80 border border-emerald-700/80 text-white">
                ✓ Authentic Shelf Prices
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-900/80 border border-emerald-700/80 text-white">
                ✓ MTN, Airtel & Zamtel MoMo
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-900/80 border border-emerald-700/80 text-white">
                ✓ Earn Loyalty Delivery Credits
              </span>
            </div>

            {onOpenRegisterStore && (
              <button
                onClick={onOpenRegisterStore}
                className="px-4 py-2 bg-lime-400 hover:bg-lime-300 text-emerald-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition active:scale-95"
              >
                <Building2 className="w-4 h-4 text-emerald-950" />
                <span>Register Store</span>
              </button>
            )}
          </div>
        </div>
      </div>


      {/* VIEW MODE 1: DEDICATED STOREFRONT (WHEN A STORE IS SELECTED) */}
      {activeMerchant ? (
        <div className="space-y-6">
          {/* Back Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <button
              onClick={() => {
                setSelectedMerchantId(null);
                setProductSearchQuery('');
                setSelectedCategory('All');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-emerald-900 font-bold text-xs rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-700" />
              <span>← Back to All Stores</span>
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Current Store:</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 font-black border border-emerald-200">
                {activeMerchant.name}
              </span>
            </div>
          </div>

          {/* Dedicated Store Hero Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="relative h-48 sm:h-56 w-full bg-slate-900">
              <img
                src={activeMerchant.imageUrl}
                alt={activeMerchant.name}
                className="w-full h-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />

              <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                      activeMerchant.businessSector === 'food_dining'
                        ? 'bg-amber-400 text-amber-950'
                        : activeMerchant.businessSector === 'supermarket_grocery'
                        ? 'bg-lime-400 text-emerald-950'
                        : 'bg-indigo-300 text-indigo-950'
                    }`}>
                      {activeMerchant.businessSector === 'food_dining'
                        ? '🍽️ Food & Dining'
                        : activeMerchant.businessSector === 'supermarket_grocery'
                        ? '🛒 Supermarket & Grocery'
                        : '📦 General Retail'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-white/20 text-white backdrop-blur-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-lime-400" />
                      {activeMerchant.liveDistanceKm.toFixed(1)} km from {selectedTownship} • {activeMerchant.township}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black">{activeMerchant.name}</h2>
                  <p className="text-xs text-slate-200 max-w-xl line-clamp-1">{activeMerchant.description}</p>
                </div>

                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/20 text-xs shrink-0">
                  <div className="text-center px-2">
                    <div className="flex items-center justify-center gap-1 font-black text-lime-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-lime-300" />
                      <span>Verified</span>
                    </div>
                    <span className="text-[10px] text-slate-300">Partner Store</span>
                  </div>

                  <div className="h-6 w-px bg-white/20" />
                  <div className="text-center px-2">
                    <span className="font-bold block text-white">{activeMerchant.deliveryTimeMins}</span>
                    <span className="text-[10px] text-slate-300">Delivery</span>
                  </div>
                  <div className="h-6 w-px bg-white/20" />
                  <div className="text-center px-2">
                    <span className="font-bold block text-lime-300">Min {formatZMW(activeMerchant.minOrder)}</span>
                    <span className="text-[10px] text-slate-300">Order</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Courier Dispatch Rates Banner - Strictly Dependent on Distance from Shop to Customer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-4">
                <span className="font-bold text-slate-800">Direct Courier Options:</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <Bike className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Biker: <strong>{formatZMW(calculateDistanceDeliveryFee(activeMerchant.liveDistanceKm, 'biker').totalDeliveryFee)} Cash</strong>
                    <span className="text-[10px] text-slate-500 ml-1">({activeMerchant.liveDistanceKm.toFixed(1)} km)</span>
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-teal-800 font-semibold bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                  <Car className="w-3.5 h-3.5 text-teal-600" />
                  <span>
                    Cargo Cab / Taxi: <strong>{formatZMW(calculateDistanceDeliveryFee(activeMerchant.liveDistanceKm, 'taxi').totalDeliveryFee)} Cash</strong>
                  </span>
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Merchandise paid via MTN/Airtel/Zamtel MoMo • Courier paid in Cash upon delivery
              </span>
            </div>
          </div>

          {/* In-Store Search & Category Filters */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  placeholder={`Search inside ${activeMerchant.name}...`}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-white border border-slate-300/80 rounded-2xl shadow-xs focus:ring-2 focus:ring-emerald-700 outline-none"
                />
                {productSearchQuery && (
                  <button
                    onClick={() => setProductSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs w-full sm:w-auto">
                {storeCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap px-3.5 py-2 rounded-xl font-bold transition shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-emerald-800 text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {cat === '3D Interactive' && <Box className="inline w-3.5 h-3.5 mr-1 text-lime-500" />}
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Store Products Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900">
                  {selectedCategory === 'All' ? 'Available Items' : selectedCategory} ({currentStoreProducts.length})
                </h3>
                <span className="text-xs text-emerald-800 font-bold">
                  Verified stock at {activeMerchant.name}
                </span>
              </div>

              {currentStoreProducts.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                  <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-800 text-base">No items found</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    No products matched your search in this store. Try resetting your filter or search keywords.
                  </p>
                  <button
                    onClick={() => {
                      setProductSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    className="mt-4 px-4 py-2 bg-emerald-800 text-white font-bold text-xs rounded-xl"
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {currentStoreProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      quantityInCart={cartQuantityMap.get(product.id) || 0}
                      onAddToCart={onAddToCart}
                      onUpdateQuantity={onUpdateCartQuantity}
                      onOpenDetails={onOpenProductDetails}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: STORE SELECTION (CATEGORIZED BY FOOD vs SUPERMARKETS vs RETAIL) */
        <div className="space-y-6">
          {/* Category Filter System: Primary Distinction between Food Stores and Retail/Other Stores */}
          <div className="bg-white p-3 sm:p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Primary Category Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <button
                  onClick={() => handleCategoryFilterChange('all')}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                    storeCategoryFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-slate-50 border border-slate-200/80'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>All Stores ({categoryCounts.all})</span>
                </button>

                <button
                  onClick={() => handleCategoryFilterChange('food')}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                    storeCategoryFilter === 'food'
                      ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-500/20'
                      : 'text-amber-900 hover:bg-amber-50 bg-amber-50/50 border border-amber-200/80'
                  }`}
                >
                  <UtensilsCrossed className="w-4 h-4 text-amber-500 group-hover:text-amber-600" />
                  <span>Food Stores ({categoryCounts.food})</span>
                </button>

                <button
                  onClick={() => handleCategoryFilterChange('retail_other')}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                    storeCategoryFilter === 'retail_other'
                      ? 'bg-emerald-800 text-white shadow-md ring-2 ring-emerald-600/20'
                      : 'text-emerald-900 hover:bg-emerald-50 bg-emerald-50/50 border border-emerald-200/80'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 text-emerald-600" />
                  <span>Retail/Other Stores ({categoryCounts.retail_other})</span>
                </button>
              </div>

              {/* Sort & Proximity Dropdown */}
              <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-end">
                <span className="text-slate-400 font-medium hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 outline-none cursor-pointer"
                >
                  <option value="proximity">Proximity (Nearest First)</option>
                  <option value="rating">Top Rated (★)</option>
                  <option value="min_order">Lowest Min Order</option>
                </select>
              </div>
            </div>

            {/* Sub-Category Pills for the Active Store Category */}
            {availableStoreSubCategories.length > 2 && (
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                  {storeCategoryFilter === 'food'
                    ? 'Food Types:'
                    : storeCategoryFilter === 'retail_other'
                    ? 'Retail Categories:'
                    : 'All Categories:'}
                </span>
                {availableStoreSubCategories.map((subCat) => {
                  const isSelected = selectedStoreSubCategory === subCat;
                  return (
                    <button
                      key={subCat}
                      onClick={() => setSelectedStoreSubCategory(subCat)}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition text-xs shrink-0 ${
                        isSelected
                          ? storeCategoryFilter === 'food'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-emerald-800 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                      }`}
                    >
                      {subCat === 'All'
                        ? storeCategoryFilter === 'food'
                          ? 'All Food'
                          : storeCategoryFilter === 'retail_other'
                          ? 'All Retail'
                          : 'All'
                        : subCat}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category Separation Explanation Pill & Search */}
          <div className="bg-slate-100/90 border border-slate-200/90 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                {storeCategoryFilter === 'food' && (
                  <span>
                    <strong>Showing Food Stores ({filteredMerchants.length}):</strong> Prepared meals, grills, takeaways, and bakeries (Hungry Lion, Choma Braai House, Golden Crust).
                  </span>
                )}
                {storeCategoryFilter === 'retail_other' && (
                  <span>
                    <strong>Showing Retail/Other Stores ({filteredMerchants.length}):</strong> Supermarkets & general merchandise (Shoprite, Pick n Pay, Chongwe Farm, Lusaka Tech Hub).
                  </span>
                )}
                {storeCategoryFilter === 'all' && (
                  <span>
                    <strong>All Stores ({filteredMerchants.length}):</strong> Select any food or retail store below to view its exclusive catalog and order.
                  </span>
                )}
              </span>
            </div>

            {/* Store Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={storeSearchQuery}
                onChange={(e) => setStoreSearchQuery(e.target.value)}
                placeholder="Search stores (e.g. Shoprite, Pick n Pay...)"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-700 font-medium"
              />
            </div>
          </div>

          {/* Stores Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredMerchants.map((merchant, idx) => {
              const isNearest = idx === 0 && sortBy === 'proximity';
              const merchantProductCount = products.filter((p) => p.merchantId === merchant.id).length;

              return (
                <div
                  key={merchant.id}
                  onClick={() => {
                    setSelectedMerchantId(merchant.id);
                    setProductSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className={`group relative bg-white rounded-3xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md cursor-pointer ${
                    isNearest
                      ? 'border-emerald-600/80 ring-2 ring-emerald-500/20'
                      : 'border-slate-200/90 hover:border-emerald-500/50'
                  }`}
                >
                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                    <span className={`px-2.5 py-1 text-[10px] font-black rounded-full shadow-md uppercase tracking-wider ${
                      merchant.businessSector === 'food_dining'
                        ? 'bg-amber-500 text-white'
                        : merchant.businessSector === 'supermarket_grocery'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-indigo-700 text-white'
                    }`}>
                      {merchant.businessSector === 'food_dining'
                        ? '🍽️ Food & Dining'
                        : merchant.businessSector === 'supermarket_grocery'
                        ? '🛒 Supermarket'
                        : '📦 Retail'}
                    </span>

                    {isNearest && (
                      <span className="px-2.5 py-1 bg-lime-400 text-emerald-950 text-[10px] font-black rounded-full shadow-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-950" />
                        <span>Nearest ({merchant.liveDistanceKm.toFixed(1)} km)</span>
                      </span>
                    )}
                  </div>

                  {/* Cover Image */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <img
                      src={merchant.imageUrl}
                      alt={merchant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

                    {/* Proximity & ETA Floating Pill */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-xs font-bold flex items-center gap-1.5 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-lime-400" />
                        <span>{merchant.liveDistanceKm.toFixed(1)} km away • {merchant.township}</span>
                      </span>

                      <span className="px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-xs font-bold flex items-center gap-1 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-lime-400" />
                        <span>{merchant.deliveryTimeMins}</span>
                      </span>
                    </div>
                  </div>

                  {/* Store Details Body */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                            {merchant.category}
                          </span>
                          <span className="text-xs text-emerald-800 font-bold">
                            {merchantProductCount} Items Listed
                          </span>
                        </div>
                        <h3 className="font-black text-slate-900 text-lg group-hover:text-emerald-800 transition mt-1">
                          {merchant.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                          {merchant.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="text-[11px] font-black text-emerald-950">Verified</span>
                      </div>
                    </div>


                    {/* Delivery & Pricing Breakdown - Strictly Dependent on Distance from Shop to Customer */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-slate-600 font-medium">
                          <Bike className="w-3.5 h-3.5 text-emerald-700" />
                          <span>
                            Biker: <strong>{formatZMW(calculateDistanceDeliveryFee(merchant.liveDistanceKm, 'biker').totalDeliveryFee)} Cash</strong>
                            <span className="text-[10px] text-slate-400 ml-1">({merchant.liveDistanceKm.toFixed(1)} km)</span>
                          </span>
                        </div>
                        <span className="text-slate-300">•</span>
                        <div className="flex items-center gap-1 text-slate-600 font-medium">
                          <Car className="w-3.5 h-3.5 text-teal-700" />
                          <span>
                            Taxi: <strong>{formatZMW(calculateDistanceDeliveryFee(merchant.liveDistanceKm, 'taxi').totalDeliveryFee)} Cash</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-emerald-800 font-black group-hover:underline">
                        <span>Select Store & View Catalog</span>
                        <ChevronRight className="w-4 h-4 text-emerald-800 group-hover:translate-x-1 transition" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredMerchants.length === 0 && (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 text-base">No stores found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No stores found matching your sector filter or search query. Try switching categories or clearing search.
              </p>
              <button
                onClick={() => {
                  handleCategoryFilterChange('all');
                  setStoreSearchQuery('');
                }}
                className="mt-4 px-4 py-2 bg-emerald-800 text-white font-bold text-xs rounded-xl"
              >
                Show All Stores
              </button>
            </div>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
};
