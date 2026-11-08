/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Box, Image as ImageIcon, Star, ShieldCheck, Truck, Store, Plus, Minus, Check, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';
import { formatZMW } from '../utils/economics';
import { ThreeProductViewer } from './ThreeProductViewer';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  quantityInCart: number;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  quantityInCart,
  onAddToCart
}) => {
  if (!product) return null;

  const [activeTab, setActiveTab] = useState<'3d' | 'photo'>(product.has3dModel ? '3d' : 'photo');
  const [selectedQty, setSelectedQty] = useState<number>(quantityInCart > 0 ? quantityInCart : 1);
  const [addedNotice, setAddedNotice] = useState(false);

  const handleAdd = () => {
    onAddToCart(product, selectedQty);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {product.category}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">{product.merchantName}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
            aria-label="Close product details modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Visual Presentation Column (3D or certified photo) */}
          <div className="flex flex-col">
            {/* View Mode Switcher if 3D model exists */}
            {product.has3dModel && (
              <div className="flex items-center gap-1.5 mb-3 p-1 bg-slate-100 rounded-xl w-fit">
                <button
                  onClick={() => setActiveTab('3d')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                    activeTab === '3d'
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  Three.js 3D View
                </button>
                <button
                  onClick={() => setActiveTab('photo')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                    activeTab === 'photo'
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Product Photo
                </button>
              </div>
            )}

            {/* Display surface */}
            <div className="w-full">
              {product.has3dModel && activeTab === '3d' && product.modelType ? (
                <ThreeProductViewer
                  modelType={product.modelType}
                  productName={product.name}
                  fallbackImageUrl={product.imageUrl}
                />
              ) : (
                <div className="relative aspect-square w-full rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-slate-900/80 text-white text-[11px] font-medium rounded-lg backdrop-blur-sm">
                    Verified Merchant Photograph
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-2">
              Authoritative stock and specifications provided by {product.merchantName}.
            </p>
          </div>

          {/* Product Specifications & Purchase Column */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md font-bold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Verified Merchant Stock</span>
                </div>
                <span className="text-slate-200">•</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  In Stock ({product.stock} units)
                </span>
              </div>


              <h1 className="text-2xl font-black text-slate-900 leading-tight">{product.name}</h1>
              <p className="text-xs font-semibold text-slate-500 mt-1">Pack Size: {product.packSize} • Unit: {product.unit}</p>

              {/* Price display */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-black text-emerald-950">{formatZMW(product.price)}</span>
                {product.compareAtPrice && (
                  <span className="text-base text-slate-400 line-through">
                    {formatZMW(product.compareAtPrice)}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                  About this Product
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Zambian Assurance Badges */}
              <div className="mt-6 space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Store className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Sold by <strong>{product.merchantName}</strong> (Kabulonga & Woodlands branch)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Delivered within <strong>25–45 minutes</strong> in Lusaka service area</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Vayzo Freshness Guarantee: Inspect before confirming rider pickup</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions: Quantity Selector & Add to Cart */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-4">
                {/* Quantity adjuster */}
                <div className="flex items-center border border-slate-300 rounded-xl bg-white p-1 shadow-sm">
                  <button
                    onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-700 font-bold active:scale-95"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-slate-900">{selectedQty}</span>
                  <button
                    onClick={() => setSelectedQty(Math.min(product.stock, selectedQty + 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-700 font-bold active:scale-95"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Add Button */}
                <button
                  onClick={handleAdd}
                  disabled={product.stock <= 0}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm shadow-md transition active:scale-98 ${
                    addedNotice
                      ? 'bg-lime-500 text-emerald-950 font-black'
                      : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                  }`}
                >
                  {addedNotice ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <span>Add {selectedQty} to Basket • {formatZMW(product.price * selectedQty)}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
