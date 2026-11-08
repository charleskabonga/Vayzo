/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { SEED_MERCHANTS, SEED_PRODUCTS } from '../data/seedData';
import {
  isFoodStore,
  isRetailOtherStore,
  getMerchantGroupLabel,
  filterMerchantsByCategoryGroup,
  getStoreCategoryCounts
} from './merchantSector';

test('Shoprite and Pick n Pay exist in seed merchants as Retail/Other Stores', () => {
  const shoprite = SEED_MERCHANTS.find((m) => m.name.toLowerCase().includes('shoprite'));
  const picknpay = SEED_MERCHANTS.find((m) => m.name.toLowerCase().includes('pick n pay'));

  assert.ok(shoprite, 'Shoprite must be present in merchants');
  assert.equal(shoprite.businessSector, 'supermarket_grocery');
  assert.equal(isFoodStore(shoprite), false, 'Shoprite is not a food dining store');
  assert.equal(isRetailOtherStore(shoprite), true, 'Shoprite is a Retail/Other store');
  assert.equal(getMerchantGroupLabel(shoprite), 'Retail/Other Store');

  assert.ok(picknpay, 'Pick n Pay must be present in merchants');
  assert.equal(picknpay.businessSector, 'supermarket_grocery');
  assert.equal(isFoodStore(picknpay), false, 'Pick n Pay is not a food dining store');
  assert.equal(isRetailOtherStore(picknpay), true, 'Pick n Pay is a Retail/Other store');
  assert.equal(getMerchantGroupLabel(picknpay), 'Retail/Other Store');

  // Verify products linked to Shoprite
  const shopriteProducts = SEED_PRODUCTS.filter((p) => p.merchantId === shoprite.id);
  assert.ok(shopriteProducts.length >= 3, 'Shoprite must have catalog products');

  // Verify products linked to Pick n Pay
  const picknpayProducts = SEED_PRODUCTS.filter((p) => p.merchantId === picknpay.id);
  assert.ok(picknpayProducts.length >= 3, 'Pick n Pay must have catalog products');
});

test('Hungry Lion and Choma Braai House are correctly classified as Food Stores', () => {
  const hungryLion = SEED_MERCHANTS.find((m) => m.name.toLowerCase().includes('hungry lion'));
  const chomaBraai = SEED_MERCHANTS.find((m) => m.name.toLowerCase().includes('choma braai'));

  assert.ok(hungryLion, 'Hungry Lion must be present');
  assert.equal(hungryLion.businessSector, 'food_dining');
  assert.equal(isFoodStore(hungryLion), true, 'Hungry Lion must be classified as a Food Store');
  assert.equal(isRetailOtherStore(hungryLion), false);
  assert.equal(getMerchantGroupLabel(hungryLion), 'Food Store');

  assert.ok(chomaBraai, 'Choma Braai House must be present');
  assert.equal(chomaBraai.businessSector, 'food_dining');
  assert.equal(isFoodStore(chomaBraai), true, 'Choma Braai House must be classified as a Food Store');
  assert.equal(isRetailOtherStore(chomaBraai), false);
  assert.equal(getMerchantGroupLabel(chomaBraai), 'Food Store');
});

test('Category filter system accurately separates Food Stores and Retail/Other Stores', () => {
  const counts = getStoreCategoryCounts(SEED_MERCHANTS);
  assert.equal(counts.all, SEED_MERCHANTS.length);
  assert.ok(counts.food > 0, 'Food stores count must be greater than 0');
  assert.ok(counts.retail_other > 0, 'Retail/Other stores count must be greater than 0');
  assert.equal(counts.food + counts.retail_other, counts.all, 'Sum of food and retail/other must equal total');

  // Filter only Food Stores
  const foodStores = filterMerchantsByCategoryGroup(SEED_MERCHANTS, 'food');
  assert.equal(foodStores.length, counts.food);
  for (const store of foodStores) {
    assert.equal(isFoodStore(store), true, `Store ${store.name} must be a food store`);
    assert.equal(isRetailOtherStore(store), false, `Store ${store.name} must NOT be a retail/other store`);
  }

  // Filter only Retail/Other Stores
  const retailOtherStores = filterMerchantsByCategoryGroup(SEED_MERCHANTS, 'retail_other');
  assert.equal(retailOtherStores.length, counts.retail_other);
  for (const store of retailOtherStores) {
    assert.equal(isRetailOtherStore(store), true, `Store ${store.name} must be a retail/other store`);
    assert.equal(isFoodStore(store), false, `Store ${store.name} must NOT be a food store`);
  }

  // Ensure Shoprite and Pick n Pay appear in retail_other and never in food
  assert.ok(retailOtherStores.some((s) => s.name.includes('Shoprite')));
  assert.ok(retailOtherStores.some((s) => s.name.includes('Pick n Pay')));
  assert.ok(!foodStores.some((s) => s.name.includes('Shoprite')));
  assert.ok(!foodStores.some((s) => s.name.includes('Pick n Pay')));

  // Ensure Hungry Lion appears in food and never in retail_other
  assert.ok(foodStores.some((s) => s.name.includes('Hungry Lion')));
  assert.ok(!retailOtherStores.some((s) => s.name.includes('Hungry Lion')));
});

test('Subcategory filtering works within Food Stores and Retail/Other Stores', () => {
  // Test subcategory within retail_other
  const supermarketsOnly = filterMerchantsByCategoryGroup(SEED_MERCHANTS, 'retail_other', 'Supermarket');
  assert.ok(supermarketsOnly.length >= 2, 'Should find at least Shoprite and Pick n Pay in Supermarket subcategory');
  for (const s of supermarketsOnly) {
    assert.equal(s.category, 'Supermarket');
  }

  // Test subcategory within food
  const fastFoodOnly = filterMerchantsByCategoryGroup(SEED_MERCHANTS, 'food', 'Fast Food & Takeaway');
  assert.ok(fastFoodOnly.length >= 1, 'Should find at least Hungry Lion');
  for (const s of fastFoodOnly) {
    assert.equal(s.category, 'Fast Food & Takeaway');
  }
});
