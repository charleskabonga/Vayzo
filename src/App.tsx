/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CustomerStorefront } from './views/CustomerStorefront';
import { MerchantPortal } from './views/MerchantPortal';
import { RiderPortal } from './views/RiderPortal';
import { AdminPortal } from './views/AdminPortal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackingView } from './components/OrderTrackingView';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { RegisterStoreModal } from './components/RegisterStoreModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { TermsAndConditionsModal } from './components/TermsAndConditionsModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { CustomDomainModal } from './components/CustomDomainModal';
import { LoyaltyRewardsModal } from './components/LoyaltyRewardsModal';
import { notificationService } from './services/notificationService';
import { SEED_PRODUCTS, SEED_MERCHANTS, INITIAL_ORDERS, INITIAL_LEDGER } from './data/seedData';
import { UserRole, Product, CartItem, Order, FinancialLedgerEntry, Merchant, AppNotification } from './types';
import { auth, signInWithGoogle, logOut, testConnection } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { OrderStatus, validateOrderTransition } from './utils/orderStateMachine';
import { calculateOrderFinancials } from './utils/economics';



export default function App() {
  const [activeRole, setActiveRole] = useState<UserRole>('customer');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Core Collections State
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [merchants, setMerchants] = useState<Merchant[]>(() => {
    try {
      const saved = localStorage.getItem('vayzo_merchants_v2');
      return saved ? JSON.parse(saved) : SEED_MERCHANTS;
    } catch {
      return SEED_MERCHANTS;
    }
  });
  const [activeMerchantId, setActiveMerchantId] = useState<string>(SEED_MERCHANTS[0].id);

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('vayzo_orders_v2');
      if (saved) return JSON.parse(saved);
      const oldSaved = localStorage.getItem('vayzo_orders_v1');
      if (oldSaved) {
        const parsed: Order[] = JSON.parse(oldSaved);
        const map = new Map<string, Order>();
        for (const o of INITIAL_ORDERS) map.set(o.id, o);
        for (const o of parsed) map.set(o.id, o);
        return Array.from(map.values());
      }
      return INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });
  const [ledger, setLedger] = useState<FinancialLedgerEntry[]>(INITIAL_LEDGER);

  // Cart State with Local Storage Persistence
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('vayzo_cart_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Navigation & Location
  const [selectedTownship, setSelectedTownship] = useState<string>('Kabulonga');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);

  // Modal / Drawer Toggles
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isRegisterStoreOpen, setIsRegisterStoreOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(() => {
    return notificationService.getStoredNotifications().filter((n) => !n.read).length;
  });

  // Customer Loyalty Points State (Persisted)
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('vayzo_loyalty_points_v1');
      return saved ? parseInt(saved, 10) : 150; // default 150 points for pilot customer
    } catch {
      return 150;
    }
  });

  // Policy & Domain Modals
  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isCustomDomainOpen, setIsCustomDomainOpen] = useState(false);

  // Loyalty Points Deduction Handler
  const handleRedeemLoyaltyPoints = (pointsDeducted: number) => {
    setLoyaltyPoints((prev) => {
      const next = Math.max(0, prev - pointsDeducted);
      localStorage.setItem('vayzo_loyalty_points_v1', next.toString());
      return next;
    });
  };


  // Keep unread notification count synchronized
  useEffect(() => {
    const handleNotificationUpdate = (e: any) => {
      const list: AppNotification[] = e.detail || notificationService.getStoredNotifications();
      setUnreadNotificationsCount(list.filter((n) => !n.read).length);
    };

    window.addEventListener('vayzo_notifications_updated', handleNotificationUpdate);
    return () => window.removeEventListener('vayzo_notifications_updated', handleNotificationUpdate);
  }, []);

  // Persist merchants
  useEffect(() => {
    localStorage.setItem('vayzo_merchants_v2', JSON.stringify(merchants));
  }, [merchants]);

  // Persist cart
  useEffect(() => {
    localStorage.setItem('vayzo_cart_v1', JSON.stringify(cart));
  }, [cart]);

  // Persist orders
  useEffect(() => {
    localStorage.setItem('vayzo_orders_v2', JSON.stringify(orders));
  }, [orders]);

  // Firebase Boot connection check and Auth Listener
  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Cart Handlers
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
    } else {
      setCart((prev) =>
        prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
      );
    }
  };

  const handleClearCart = () => setCart([]);

  const handleAddMultipleToCart = (items: { product: Product; quantity: number }[]) => {
    setCart((prev) => {
      let updated = [...prev];
      for (const { product, quantity } of items) {
        const idx = updated.findIndex((i) => i.product.id === product.id);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + quantity };
        } else {
          updated.push({ product, quantity });
        }
      }
      return updated;
    });
    setIsCartOpen(true);
  };

  // Order Placement Handler
  const handleOrderPlaced = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);

    // Financial breakdown and immutable ledger recording
    const fin = calculateOrderFinancials({
      productSubtotal: newOrder.subtotal,
      deliveryFee: newOrder.deliveryFee,
      serviceFee: newOrder.serviceFee
    });

    const newLedgerEntry: FinancialLedgerEntry = {
      id: `LED-${Date.now().toString(36).toUpperCase()}`,
      orderId: newOrder.id,
      type: 'ORDER_PAYMENT',
      grossAmount: fin.customerPayable,
      merchantShare: fin.merchantNetProceeds,
      platformShare: fin.platformContributionMargin,
      riderShare: fin.riderCompensation,
      status: 'POSTED',
      reference: `MOMO-REF-${newOrder.id}`,
      createdAt: new Date().toISOString()
    };

    setLedger((prev) => [newLedgerEntry, ...prev]);

    // Release cart items that were ordered
    handleClearCart();

    // Immediately open live order tracking
    setTrackedOrder(newOrder);

    // Push notification for Customer
    notificationService.sendPushNotification({
      title: 'Order Confirmed! 🛒',
      body: `Order #${newOrder.id} for ${newOrder.merchantName} is confirmed. Awaiting merchant packing.`,
      targetRole: 'customer',
      orderId: newOrder.id,
      type: 'order'
    });

    // Push notification for Merchant
    notificationService.sendPushNotification({
      title: `New Order Alert! (${newOrder.merchantName}) 📦`,
      body: `You received Order #${newOrder.id} for K${newOrder.subtotal.toFixed(2)}. Customer in ${newOrder.deliveryAddress.township} is waiting.`,
      targetRole: 'merchant',
      targetMerchantId: newOrder.merchantId,
      orderId: newOrder.id,
      type: 'order'
    });
  };

  // Order Lifecycle Status Advance Handler
  const handleAdvanceOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;

        validateOrderTransition(ord.status, nextStatus);

        const newTimeline = [
          ...ord.timeline,
          {
            status: nextStatus,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            note: `Status updated to ${nextStatus.replace('_', ' ')}`
          }
        ];

        const updated = {
          ...ord,
          status: nextStatus,
          timeline: newTimeline,
          updatedAt: new Date().toISOString()
        };

        if (trackedOrder?.id === orderId) {
          setTrackedOrder(updated);
        }

        // Fire targeted push notifications based on state advance
        if (nextStatus === 'MERCHANT_ACCEPTED') {
          notificationService.sendPushNotification({
            title: 'Store Packing Order 👨‍🍳',
            body: `${ord.merchantName} accepted Order #${orderId} and is packing your items.`,
            targetRole: 'customer',
            orderId,
            type: 'order'
          });
        } else if (nextStatus === 'RIDER_ASSIGNED') {
          notificationService.sendPushNotification({
            title: 'Courier Assigned 🏍️',
            body: `Rider assigned to deliver Order #${orderId} from ${ord.merchantName}.`,
            targetRole: 'customer',
            orderId,
            type: 'delivery'
          });
          notificationService.sendPushNotification({
            title: 'New Dispatch Task 📍',
            body: `Head to ${ord.merchantName} to pickup Order #${orderId} for ${ord.deliveryAddress.township}. Cash fee K${ord.stage2Amount.toFixed(2)}.`,
            targetRole: 'rider',
            orderId,
            type: 'delivery'
          });
        } else if (nextStatus === 'PICKED_UP') {
          notificationService.sendPushNotification({
            title: 'Order On The Way 🚀',
            body: `Courier picked up Order #${orderId} from ${ord.merchantName} and is en route to ${ord.deliveryAddress.township}.`,
            targetRole: 'customer',
            orderId,
            type: 'delivery'
          });
        } else if (nextStatus === 'DELIVERED') {
          // Calculate and credit customer loyalty points
          const earned = Math.max(1, Math.floor(ord.subtotal * 0.1));
          setLoyaltyPoints((prev) => {
            const next = prev + earned;
            localStorage.setItem('vayzo_loyalty_points_v1', next.toString());
            return next;
          });

          notificationService.sendPushNotification({
            title: `Order Delivered! (+${earned} Loyalty Points) 🪙`,
            body: `Order #${orderId} arrived safely in ${ord.deliveryAddress.township}. You earned +${earned} loyalty points for future delivery discounts!`,
            targetRole: 'customer',
            orderId,
            type: 'delivery'
          });
          notificationService.sendPushNotification({
            title: 'Delivery Complete & Settled ✅',
            body: `Order #${orderId} marked as delivered. Proceeds recorded in merchant ledger.`,
            targetRole: 'merchant',
            targetMerchantId: ord.merchantId,
            orderId,
            type: 'payment'
          });
        }


        return updated;
      })
    );
  };

  // Merchant Inventory Handlers
  const handleUpdateProductStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const clamped = Math.max(0, newStock);
          if (clamped < 10 && clamped < p.stock) {
            notificationService.sendPushNotification({
              title: 'Low Stock Risk Alert ⚠️',
              body: `${p.name} has only ${clamped} units left. Restock recommended.`,
              targetRole: 'merchant',
              targetMerchantId: p.merchantId,
              type: 'inventory'
            });
          }
          return { ...p, stock: clamped };
        }
        return p;
      })
    );
  };


  const handleUpdateProductPrice = (productId: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, price: Math.max(1, newPrice) } : p))
    );
  };

  const handleAddNewProduct = (newProduct: Partial<Product>) => {
    const fullProd: Product = {
      id: `prod_${Date.now()}`,
      merchantId: newProduct.merchantId || merchants[0].id,
      merchantName: newProduct.merchantName || merchants[0].name,
      name: newProduct.name || 'New Catalog Item',
      description: newProduct.description || 'Quality product available in Lusaka.',
      category: newProduct.category || 'Supermarket',
      unit: newProduct.unit || 'each',
      packSize: newProduct.packSize || '1 unit',
      price: newProduct.price || 50,
      stock: newProduct.stock || 20,
      status: 'in_stock',
      has3dModel: !!newProduct.has3dModel,
      modelType: newProduct.modelType,
      imageUrl: newProduct.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
      rating: 5.0,
      reviewCount: 0
    };
    setProducts((prev) => [fullProd, ...prev]);
  };

  const handleRegisterMerchant = (newMerchant: Merchant) => {
    setMerchants((prev) => [newMerchant, ...prev]);
    setActiveMerchantId(newMerchant.id);
  };

  const activeMerchant = merchants.find((m) => m.id === activeMerchantId) || merchants[0];

  const handleBulkAddProducts = (newProducts: Partial<Product>[]) => {
    const fullProds: Product[] = newProducts.map((p, idx) => ({
      id: `prod_bulk_${Date.now()}_${idx}`,
      merchantId: p.merchantId || activeMerchant.id,
      merchantName: p.merchantName || activeMerchant.name,
      name: p.name || 'Catalog Item',
      description: p.description || 'Quality merchandise supplied in Lusaka.',
      category: p.category || 'Supermarket',
      unit: p.unit || 'pack',
      packSize: p.packSize || '1 unit',
      price: p.price || 20,
      stock: p.stock || 25,
      status: 'in_stock',
      has3dModel: false,
      imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
      brand: p.brand || activeMerchant.name,
      rating: 5.0,
      reviewCount: 0
    }));
    setProducts((prev) => [...fullProds, ...prev]);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-lime-400 selection:text-emerald-950">
      {/* Universal Top Navigation */}
      <Navbar
        activeRole={activeRole}
        onRoleChange={(role) => {
          setActiveRole(role);
          setTrackedOrder(null);
        }}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAi={() => setIsAiOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        loyaltyPoints={loyaltyPoints}
        onOpenLoyalty={() => setIsLoyaltyOpen(true)}
        selectedTownship={selectedTownship}
        onTownshipChange={setSelectedTownship}
        currentUser={currentUser}
        onSignIn={signInWithGoogle}
        onSignOut={logOut}
      />


      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {trackedOrder ? (
          <OrderTrackingView
            order={trackedOrder}
            onBack={() => setTrackedOrder(null)}
            onAdvanceStatus={handleAdvanceOrderStatus}
          />
        ) : (
          <>
            {activeRole === 'customer' && (
              <CustomerStorefront
                products={products}
                merchants={merchants}
                cart={cart}
                activeOrders={orders.filter((o) => o.status !== 'DELIVERED')}
                allOrders={orders}
                selectedTownship={selectedTownship}
                onAddToCart={(p) => handleAddToCart(p, 1)}
                onAddMultipleToCart={handleAddMultipleToCart}
                onUpdateCartQuantity={handleUpdateCartQuantity}
                onOpenProductDetails={(p) => setSelectedProduct(p)}
                onViewOrderTracking={(ord) => setTrackedOrder(ord)}
                onOpenAi={() => setIsAiOpen(true)}
                onOpenRegisterStore={() => setIsRegisterStoreOpen(true)}
              />
            )}

            {activeRole === 'merchant' && (
              <MerchantPortal
                merchant={activeMerchant}
                allMerchants={merchants}
                onSelectMerchant={setActiveMerchantId}
                onOpenRegisterStore={() => setIsRegisterStoreOpen(true)}
                products={products}
                orders={orders}
                onUpdateProductStock={handleUpdateProductStock}
                onUpdateProductPrice={handleUpdateProductPrice}
                onAdvanceOrderStatus={handleAdvanceOrderStatus}
                onAddNewProduct={handleAddNewProduct}
                onBulkAddProducts={handleBulkAddProducts}
              />
            )}

            {activeRole === 'rider' && (
              <RiderPortal
                orders={orders}
                onAdvanceOrderStatus={handleAdvanceOrderStatus}
              />
            )}

            {activeRole === 'admin' && (
              <AdminPortal
                orders={orders}
                merchants={merchants}
                products={products}
                ledger={ledger}
                onAdvanceOrderStatus={handleAdvanceOrderStatus}
              />
            )}
          </>
        )}
      </main>

      {/* Product Detail Modal (with 3D WebGL Viewer) */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        quantityInCart={
          selectedProduct
            ? cart.find((i) => i.product.id === selectedProduct.id)?.quantity || 0
            : 0
        }
        onAddToCart={handleAddToCart}
      />

      {/* Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onClearCart={handleClearCart}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        defaultTownship={selectedTownship}
        onOrderPlaced={handleOrderPlaced}
        currentUser={currentUser}
        merchants={merchants}
        loyaltyPointsBalance={loyaltyPoints}
        onRedeemLoyaltyPoints={handleRedeemLoyaltyPoints}
      />

      {/* Vayzo AI Assistant Drawer */}
      <AiAssistantDrawer
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        catalog={products}
        onAddMultipleToCart={handleAddMultipleToCart}
      />

      {/* Register Business Modal */}
      <RegisterStoreModal
        isOpen={isRegisterStoreOpen}
        onClose={() => setIsRegisterStoreOpen(false)}
        onRegister={handleRegisterMerchant}
        defaultTownship={selectedTownship}
      />

      {/* Push Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        activeRole={activeRole}
        onSelectOrder={(orderId) => {
          const ord = orders.find((o) => o.id === orderId);
          if (ord) setTrackedOrder(ord);
        }}
      />

      {/* Terms & Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
      />

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />

      {/* Custom Domain Configuration Modal */}
      <CustomDomainModal
        isOpen={isCustomDomainOpen}
        onClose={() => setIsCustomDomainOpen(false)}
      />

      {/* Loyalty Rewards Modal */}
      <LoyaltyRewardsModal
        isOpen={isLoyaltyOpen}
        onClose={() => setIsLoyaltyOpen(false)}
        pointsBalance={loyaltyPoints}
      />

      {/* Enterprise Professional Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-black text-emerald-950 text-sm tracking-tight">VAYZO ZAMBIA</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-medium">Lusaka Retail, Supermarket & Dining On-Demand Platform</span>
            </div>

            {/* Legal, Domain & Loyalty Quick Links */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
              <button
                onClick={() => setIsTermsOpen(true)}
                className="text-slate-600 hover:text-emerald-900 transition underline-offset-2 hover:underline"
              >
                Terms & Conditions
              </button>
              <span className="text-slate-300">•</span>
              <button
                onClick={() => setIsPrivacyOpen(true)}
                className="text-slate-600 hover:text-emerald-900 transition underline-offset-2 hover:underline"
              >
                Privacy Policy
              </button>
              <span className="text-slate-300">•</span>
              <button
                onClick={() => setIsCustomDomainOpen(true)}
                className="text-slate-600 hover:text-emerald-900 transition underline-offset-2 hover:underline"
              >
                Custom Domain Setup
              </button>
              <span className="text-slate-300">•</span>
              <button
                onClick={() => setIsLoyaltyOpen(true)}
                className="text-emerald-800 hover:text-emerald-950 font-black transition flex items-center gap-1"
              >
                <span>🪙 Loyalty Rewards ({loyaltyPoints} pts)</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <p>
              Dual-Stage Payment Protocol: Merchandise via MTN/Airtel/Zamtel MoMo • Distance-based Courier in Cash upon Delivery.
            </p>
            <p>© 2026 Vayzo Zambia Limited. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>

  );
}
