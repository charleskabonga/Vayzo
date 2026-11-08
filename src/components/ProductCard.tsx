/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plus, Minus, Box, Star, Check } from 'lucide-react';
import { Product } from '../types';
import { formatZMW } from '../utils/economics';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onOpenDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantityInCart,
  onAddToCart,
  onUpdateQuantity,
  onOpenDetails
}) => {
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="group flex flex-col justify-between bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-600/50 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Product Image & Badges Container */}
      <div className="relative aspect-square w-full bg-slate-100 overflow-hidden cursor-pointer" onClick={() => onOpenDetails(product)}>
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* 3D Model Badge */}
        {product.has3dModel && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2.5 py-1 bg-slate-900/90 text-lime-300 font-bold text-[11px] rounded-lg border border-lime-400/30 shadow backdrop-blur-sm">
            <Box className="w-3.5 h-3.5 text-lime-400" />
            <span>3D Model</span>
          </div>
        )}

        {/* Stock / Sale Badge */}
        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-red-600 text-white font-black text-[10px] uppercase tracking-wider rounded-md shadow">
            Save {formatZMW(product.compareAtPrice - product.price)}
          </div>
        )}

        {/* Hover Inspect CTA Overlay */}
        <div className="absolute inset-0 bg-emerald-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <span className="w-full py-1.5 bg-white/95 text-emerald-950 font-bold text-xs text-center rounded-xl shadow-lg border border-slate-200">
            {product.has3dModel ? 'View in 3D' : 'View Details'}
          </span>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium text-emerald-800">{product.merchantName}</span>
            <div className="flex items-center gap-1 text-amber-500 font-semibold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{product.rating.toFixed(1)}</span>
            </div>
          </div>

          <h3
            onClick={() => onOpenDetails(product)}
            className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 hover:text-emerald-800 cursor-pointer transition"
          >
            {product.name}
          </h3>

          <p className="text-xs text-slate-500 mt-1">{product.packSize}</p>
        </div>

        {/* Price & Cart Actions */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-base font-black text-slate-900">{formatZMW(product.price)}</div>
            {product.compareAtPrice && (
              <div className="text-[11px] text-slate-400 line-through -mt-0.5">
                {formatZMW(product.compareAtPrice)}
              </div>
            )}
          </div>

          {/* Quantity Controls / Add to Cart Button */}
          {quantityInCart > 0 ? (
            <div className="flex items-center bg-emerald-50 rounded-xl border border-emerald-300/80 p-0.5">
              <button
                onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-emerald-900 font-bold hover:bg-emerald-100 active:scale-95 shadow-sm transition"
                aria-label={`Decrease quantity of ${product.name}`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-7 text-center font-bold text-xs text-emerald-950">
                {quantityInCart}
              </span>
              <button
                onClick={() => onUpdateQuantity(product.id, quantityInCart + 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-700 text-white font-bold hover:bg-emerald-800 active:scale-95 shadow-sm transition"
                aria-label={`Increase quantity of ${product.name}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart(product)}
              disabled={isOutOfStock}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm'
              }`}
              aria-label={`Add ${product.name} to cart`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isOutOfStock ? 'Sold Out' : 'Add'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
