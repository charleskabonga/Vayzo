/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Store,
  UtensilsCrossed,
  ShoppingCart,
  PackageCheck,
  MapPin,
  Phone,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2
} from 'lucide-react';
import { Merchant, BusinessSector } from '../types';

interface RegisterStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (newMerchant: Merchant) => void;
  defaultTownship?: string;
}

const LUSAKA_TOWNSHIPS = [
  'Kabulonga',
  'Woodlands',
  'Rhodes Park',
  'Northmead',
  'Roma',
  'Olympia Park',
  'Longacres',
  'Chelstone',
  'Chilenje'
];

const SECTOR_CATEGORIES: Record<BusinessSector, string[]> = {
  food_dining: [
    'Fast Food & Takeaway',
    'Restaurant & Grill',
    'Bakery & Confectionery',
    'Traditional Zambian Kitchen',
    'Cafe & Refreshments'
  ],
  supermarket_grocery: [
    'Supermarket',
    'Fresh Produce',
    'Butchery & Meats',
    'Dairy & Pantry',
    'Greengrocer'
  ],
  retail_other: [
    'Electronics & Accessories',
    'Pharmacy & Health',
    'Hardware & Home',
    'Fashion & Apparel',
    'General Retail'
  ]
};

const DEFAULT_IMAGES: Record<BusinessSector, string> = {
  food_dining: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
  supermarket_grocery: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
  retail_other: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80'
};

export const RegisterStoreModal: React.FC<RegisterStoreModalProps> = ({
  isOpen,
  onClose,
  onRegister,
  defaultTownship = 'Kabulonga'
}) => {
  const [storeName, setStoreName] = useState('');
  const [selectedSector, setSelectedSector] = useState<BusinessSector>('food_dining');
  const [category, setCategory] = useState<string>(SECTOR_CATEGORIES.food_dining[0]);
  const [township, setTownship] = useState(defaultTownship);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('+260 ');
  const [deliveryTimeMins, setDeliveryTimeMins] = useState('20-35 min');
  const [minOrder, setMinOrder] = useState<number>(50);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredMerchant, setRegisteredMerchant] = useState<Merchant | null>(null);

  if (!isOpen) return null;

  const handleSectorChange = (sector: BusinessSector) => {
    setSelectedSector(sector);
    setCategory(SECTOR_CATEGORIES[sector][0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !address.trim()) return;

    const newMerchant: Merchant = {
      id: `m_${Date.now().toString(36)}`,
      name: storeName.trim(),
      businessSector: selectedSector,
      category: category,
      description: description.trim() || `${storeName} serving customers in ${township}, Lusaka.`,
      city: 'Lusaka',
      township: township,
      address: address.trim(),
      phone: phone.trim() || '+260 97 000 0000',
      commissionRate: selectedSector === 'food_dining' ? 0.10 : 0.08,
      rating: 5.0,
      reviewCount: 1,
      deliveryTimeMins: deliveryTimeMins,
      minOrder: Number(minOrder) || 30,
      status: 'active',
      imageUrl: imageUrl.trim() || DEFAULT_IMAGES[selectedSector],
      distanceKm: 2.0
    };

    onRegister(newMerchant);
    setRegisteredMerchant(newMerchant);
    setIsSuccess(true);
  };

  const handleReset = () => {
    setIsSuccess(false);
    setRegisteredMerchant(null);
    setStoreName('');
    setAddress('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white p-6 relative">
          <button
            onClick={handleReset}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-lime-400/20 text-lime-300 border border-lime-400/30 rounded-full text-xs font-bold mb-2">
            <Building2 className="w-3.5 h-3.5 text-lime-400" />
            <span>Merchant Onboarding • Lusaka Commerce Network</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Register Your Business</h2>
          <p className="text-xs text-emerald-200 mt-1 max-w-lg">
            Categorize your store accurately. Food businesses and supermarket/retail stores remain strictly separated on the customer storefront.
          </p>
        </div>

        {isSuccess && registeredMerchant ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-lime-100 text-emerald-800 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-emerald-700" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">{registeredMerchant.name} is Live!</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Your business has been registered under{' '}
                <strong className="text-emerald-800">
                  {registeredMerchant.businessSector === 'food_dining'
                    ? '🍽️ Food & Dining'
                    : registeredMerchant.businessSector === 'supermarket_grocery'
                    ? '🛒 Supermarket & Grocery'
                    : '📦 General Retail'}
                </strong>{' '}
                in <strong className="text-slate-800">{registeredMerchant.township}</strong>.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left max-w-md mx-auto text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Business Sector:</span>
                <span className="font-bold text-slate-800 uppercase text-[11px] bg-slate-200 px-2 py-0.5 rounded">
                  {registeredMerchant.businessSector.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Store Category:</span>
                <span className="font-bold text-slate-800">{registeredMerchant.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-bold text-slate-800">{registeredMerchant.address}, {registeredMerchant.township}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Dispatch:</span>
                <span className="font-bold text-emerald-700">Biker K25 Cash • Taxi K50 Cash</span>
              </div>
            </div>

            <div className="pt-3 flex justify-center gap-3">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Done & View Store in App
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Step 1: Mandatory Business Sector Selection (Food vs Supermarket vs Retail) */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                1. Select Business Sector <span className="text-rose-500">* (Mandatory)</span>
              </label>
              <p className="text-[11px] text-slate-500">
                This guarantees food businesses and supermarket/retail stores remain separate for customers:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* Food & Dining Card */}
                <div
                  onClick={() => handleSectorChange('food_dining')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition text-left flex flex-col justify-between ${
                    selectedSector === 'food_dining'
                      ? 'border-amber-500 bg-amber-50/70 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                        <UtensilsCrossed className="w-4 h-4 text-amber-700" />
                      </div>
                      {selectedSector === 'food_dining' && (
                        <CheckCircle2 className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <h4 className="font-black text-slate-900 text-xs">Food & Dining</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Prepared meals, restaurants, grills, takeaways, fresh bakeries & cafes.
                    </p>
                  </div>
                  <span className="mt-3 text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-100/80 px-2 py-0.5 rounded text-center">
                    Food Business
                  </span>
                </div>

                {/* Supermarket & Grocery Card */}
                <div
                  onClick={() => handleSectorChange('supermarket_grocery')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition text-left flex flex-col justify-between ${
                    selectedSector === 'supermarket_grocery'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-emerald-700" />
                      </div>
                      {selectedSector === 'supermarket_grocery' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <h4 className="font-black text-slate-900 text-xs">Supermarkets</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Groceries, Shoprite/PnP style supermarkets, fresh produce & butcheries.
                    </p>
                  </div>
                  <span className="mt-3 text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100/80 px-2 py-0.5 rounded text-center">
                    Supermarket & Grocery
                  </span>
                </div>

                {/* Retail & Other Card */}
                <div
                  onClick={() => handleSectorChange('retail_other')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition text-left flex flex-col justify-between ${
                    selectedSector === 'retail_other'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
                        <PackageCheck className="w-4 h-4 text-indigo-700" />
                      </div>
                      {selectedSector === 'retail_other' && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                    <h4 className="font-black text-slate-900 text-xs">General Retail</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Electronics, phone gadgets, pharmacies, hardware & general merchandise.
                    </p>
                  </div>
                  <span className="mt-3 text-[10px] font-bold text-indigo-800 uppercase tracking-wider bg-indigo-100/80 px-2 py-0.5 rounded text-center">
                    Retail & Other
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2: Store Identity & Specific Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Business / Store Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Lusaka Flame Grill & Takeaway"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Store Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none bg-white font-medium"
                >
                  {SECTOR_CATEGORIES[selectedSector].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 3: Location Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lusaka Township <span className="text-rose-500">*</span>
                </label>
                <select
                  value={township}
                  onChange={(e) => setTownship(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none bg-white font-medium"
                >
                  {LUSAKA_TOWNSHIPS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Physical Address / Mall / Street <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Shop 24, Woodlands Shopping Mall"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none"
                />
              </div>
            </div>

            {/* Step 4: Contact & Operations */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+260 97 123 4567"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Delivery ETA</label>
                <input
                  type="text"
                  value={deliveryTimeMins}
                  onChange={(e) => setDeliveryTimeMins(e.target.value)}
                  placeholder="e.g. 20-35 min"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Min Order (ZMW)</label>
                <input
                  type="number"
                  min="0"
                  value={minOrder}
                  onChange={(e) => setMinOrder(Number(e.target.value))}
                  placeholder="50"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none"
                />
              </div>
            </div>

            {/* Step 5: Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Store Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what your business sells, your specialty, or store hours..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none resize-none"
              />
            </div>

            {/* Dispatch Rules Notice */}
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-[11px] text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Transparent Dual Payment Stage System Active:</p>
                <p className="text-emerald-800/90 mt-0.5">
                  Customers pay for merchandise and management fee upfront via MTN/Airtel/Zamtel. Courier riders (Biker K25 / Cargo Taxi K50) are paid cash on delivery.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black rounded-xl shadow-md transition active:scale-95"
              >
                Register Business & Start Selling →
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
