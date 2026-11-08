/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShoppingBag, Sparkles, Store, Bike, ShieldCheck, MapPin, User, LogIn, LogOut, Bell } from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAi: () => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  loyaltyPoints?: number;
  onOpenLoyalty?: () => void;
  selectedTownship: string;
  onTownshipChange: (township: string) => void;
  currentUser: any;
  onSignIn: () => void;
  onSignOut: () => void;
}



const LUSAKA_TOWNSHIPS = [
  'Kabulonga',
  'Woodlands',
  'Rhodes Park',
  'Roma',
  'Olympia Park',
  'Longacres',
  'Northmead',
  'Chelstone',
  'Avondale',
  'Chilenje'
];

export const Navbar: React.FC<NavbarProps> = ({
  activeRole,
  onRoleChange,
  cartCount,
  onOpenCart,
  onOpenAi,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  loyaltyPoints = 0,
  onOpenLoyalty,
  selectedTownship,
  onTownshipChange,
  currentUser,
  onSignIn,
  onSignOut
}) => {

  return (
    <header className="sticky top-0 z-40 bg-emerald-950 text-white border-b border-emerald-900/60 shadow-md">
      {/* Top Banner with Zambian Market Details & Role Switcher */}
      <div className="bg-emerald-900/70 border-b border-emerald-800/50 px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-lime-400" />
            <span className="text-emerald-100 font-medium">Zambia Pilot • Lusaka Fast Delivery (ZMW/K)</span>
          </div>

          {/* Quick Role Switcher for seamless cross-role testing */}
          <div className="flex items-center gap-1 bg-emerald-950/80 p-0.5 rounded-lg border border-emerald-800/80 text-[11px]">
            <span className="text-emerald-400 px-2 font-medium">Experience:</span>
            <button
              onClick={() => onRoleChange('customer')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                activeRole === 'customer'
                  ? 'bg-lime-400 text-emerald-950 font-bold shadow-sm'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => onRoleChange('merchant')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                activeRole === 'merchant'
                  ? 'bg-lime-400 text-emerald-950 font-bold shadow-sm'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              Merchant
            </button>
            <button
              onClick={() => onRoleChange('rider')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                activeRole === 'rider'
                  ? 'bg-lime-400 text-emerald-950 font-bold shadow-sm'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              Rider
            </button>
            <button
              onClick={() => onRoleChange('admin')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                activeRole === 'admin'
                  ? 'bg-lime-400 text-emerald-950 font-bold shadow-sm'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              Admin Ops
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo & Slogan */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onRoleChange('customer')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-lime-400 to-emerald-400 flex items-center justify-center text-emerald-950 font-black text-xl shadow-md">
              V
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-white">VAYZO</span>
                <span className="px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider bg-lime-400/20 text-lime-300 border border-lime-400/30 rounded">
                  Zambia
                </span>
              </div>
              <p className="text-[10px] text-emerald-300/80 -mt-0.5 font-medium hidden sm:block">
                Everything you need. Delivered smarter.
              </p>
            </div>
          </div>

          {/* Lusaka Township Selector */}
          {activeRole === 'customer' && (
            <div className="hidden md:flex items-center gap-1.5 ml-4 pl-4 border-l border-emerald-800 text-xs">
              <MapPin className="w-3.5 h-3.5 text-lime-400" />
              <span className="text-emerald-300">Deliver to:</span>
              <select
                value={selectedTownship}
                onChange={(e) => onTownshipChange(e.target.value)}
                className="bg-emerald-900/90 text-white font-medium border border-emerald-700/60 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-lime-400 outline-none cursor-pointer"
                aria-label="Select delivery township in Lusaka"
              >
                {LUSAKA_TOWNSHIPS.map((t) => (
                  <option key={t} value={t}>
                    {t}, Lusaka
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Push Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-white border border-emerald-700/60 transition active:scale-95 flex items-center justify-center"
            aria-label={`View notifications (${unreadNotificationsCount} unread)`}
            title="Push Notifications & Live Alerts"
          >
            <Bell className="w-4 h-4 text-lime-400" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-lime-400 text-emerald-950 font-black text-[10px] rounded-full flex items-center justify-center shadow-xs">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Vayzo AI Assistant Trigger */}
          <button
            onClick={onOpenAi}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-lime-300 font-semibold text-xs border border-lime-400/40 shadow-sm transition active:scale-95"
            aria-label="Open Vayzo AI Assistant"
          >
            <Sparkles className="w-4 h-4 text-lime-400" />
            <span className="hidden sm:inline">Vayzo AI</span>
          </button>

          {/* Customer Loyalty Points Button */}
          {activeRole === 'customer' && onOpenLoyalty && (
            <button
              onClick={onOpenLoyalty}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-lime-300 font-bold text-xs border border-emerald-700/60 transition active:scale-95 shadow-2xs"
              title="Vayzo Loyalty Rewards (Delivery Credits)"
              aria-label={`View loyalty rewards (${loyaltyPoints} points)`}
            >
              <span>🪙</span>
              <span className="font-black text-white">{loyaltyPoints}</span>
              <span className="hidden md:inline text-[10px] text-lime-400 font-bold">pts</span>
            </button>
          )}

          {/* Cart Button (for Customer view) */}

          {activeRole === 'customer' && (
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-white font-semibold text-xs border border-emerald-700/60 transition active:scale-95"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <ShoppingBag className="w-4 h-4 text-lime-400" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 bg-lime-400 text-emerald-950 font-black text-[11px] rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Firebase Auth Google Sign In Button */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-emerald-800 text-xs">
              <div className="w-7 h-7 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-lime-300 text-xs border border-emerald-700">
                {currentUser.displayName ? currentUser.displayName[0] : 'U'}
              </div>
              <span className="hidden lg:inline text-emerald-200 text-xs truncate max-w-[120px]">
                {currentUser.displayName || currentUser.email}
              </span>
              <button
                onClick={onSignOut}
                aria-label="Sign out"
                className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-emerald-950 hover:bg-slate-100 font-bold text-xs shadow-sm transition active:scale-95"
              aria-label="Sign in with Google"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-800" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
