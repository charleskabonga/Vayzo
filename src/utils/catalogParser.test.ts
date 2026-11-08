/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { parseMerchandiseCatalog } from './catalogParser';

test('parseMerchandiseCatalog parses valid CSV file correctly', () => {
  const csv = `Product Name,Category,Price,Pack Size,Stock,Description,Brand
White Spoon Sugar 1kg,Supermarket,38,1kg pack,50,Zambia Sugar pure fine granulated white cane sugar,Zambia Sugar
Fresh Village Eggs (Tray of 30),Fresh Produce,95,Tray of 30,24,Local free-range farm fresh brown eggs,Chongwe Valley`;

  const result = parseMerchandiseCatalog(csv, 'Chongwe Green Market');
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.rows.length, 2);
  assert.strictEqual(result.rows[0].name, 'White Spoon Sugar 1kg');
  assert.strictEqual(result.rows[0].price, 38);
  assert.strictEqual(result.rows[0].category, 'Supermarket');
  assert.strictEqual(result.rows[1].price, 95);
});

test('parseMerchandiseCatalog handles JSON array input', () => {
  const json = JSON.stringify([
    { name: 'Mosi Lager 330ml Can', category: 'Supermarket', price: 22, packSize: '330ml Can', stock: 120 },
    { name: 'Zambeef Prime Steak 500g', category: 'Butchery', price: 95, packSize: '500g Pack', stock: 15 }
  ]);

  const result = parseMerchandiseCatalog(json, 'Pinnacle Grocers');
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.rows.length, 2);
  assert.strictEqual(result.rows[0].name, 'Mosi Lager 330ml Can');
  assert.strictEqual(result.rows[1].price, 95);
});

test('parseMerchandiseCatalog rejects header missing required fields', () => {
  const invalidCsv = `InvalidHeader1,InvalidHeader2\nItem1,123`;
  const result = parseMerchandiseCatalog(invalidCsv);
  assert.ok(result.error);
});
