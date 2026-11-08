/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Merchant, BusinessSector } from '../types';

export type StoreCategoryFilter = 'all' | 'food' | 'retail_other';

/**
 * Checks if a merchant is classified as a 'Food Store'
 * based on businessSector ('food_dining') or registered food categories.
 */
export function isFoodStore(merchant: Pick<Merchant, 'businessSector' | 'category'>): boolean {
  if (merchant.businessSector === 'food_dining') return true;
  const foodKeywords = ['food', 'dining', 'restaurant', 'grill', 'bakery', 'takeaway', 'confectionery', 'kitchen', 'cafe', 'braai'];
  const cat = (merchant.category || '').toLowerCase();
  return foodKeywords.some((kw) => cat.includes(kw));
}

/**
 * Checks if a merchant is classified as a 'Retail/Other Store'
 * (including supermarkets, groceries, electronics, and general retail).
 */
export function isRetailOtherStore(merchant: Pick<Merchant, 'businessSector' | 'category'>): boolean {
  return !isFoodStore(merchant);
}

/**
 * Returns the primary category classification label for display: 'Food Store' or 'Retail/Other Store'.
 */
export function getMerchantGroupLabel(merchant: Pick<Merchant, 'businessSector' | 'category'>): 'Food Store' | 'Retail/Other Store' {
  return isFoodStore(merchant) ? 'Food Store' : 'Retail/Other Store';
}

/**
 * Filter merchants by category filter ('all' | 'food' | 'retail_other') and optional subCategory.
 */
export function filterMerchantsByCategoryGroup<T extends Pick<Merchant, 'businessSector' | 'category'>>(
  merchants: T[],
  filter: StoreCategoryFilter,
  subCategory?: string
): T[] {
  let list = merchants;
  if (filter === 'food') {
    list = list.filter(isFoodStore);
  } else if (filter === 'retail_other') {
    list = list.filter(isRetailOtherStore);
  }

  if (subCategory && subCategory !== 'All') {
    list = list.filter((m) => m.category === subCategory);
  }

  return list;
}

/**
 * Helper to compute counts for each category filter option.
 */
export function getStoreCategoryCounts<T extends Pick<Merchant, 'businessSector' | 'category'>>(merchants: T[]) {
  const foodCount = merchants.filter(isFoodStore).length;
  const retailOtherCount = merchants.filter(isRetailOtherStore).length;
  return {
    all: merchants.length,
    food: foodCount,
    retail_other: retailOtherCount
  };
}
