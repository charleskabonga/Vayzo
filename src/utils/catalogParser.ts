/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CatalogImportRow } from '../types';

export interface ParseResult {
  rows: CatalogImportRow[];
  error?: string;
}

/**
 * Parses merchandise CSV, TSV, or JSON content into validated CatalogImportRow entries.
 */
export function parseMerchandiseCatalog(content: string, defaultMerchantName = 'Merchant'): ParseResult {
  const trimmed = content.trim();
  if (!trimmed) {
    return { rows: [] };
  }

  // Handle JSON
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const json = JSON.parse(trimmed);
      const rows: CatalogImportRow[] = json
        .map((item: any) => ({
          name: String(item.name || item.title || '').trim(),
          category: String(item.category || 'Supermarket').trim(),
          price: Number(item.price) || 0,
          packSize: String(item.packSize || item.unit || '1 unit').trim(),
          stock: Number(item.stock) || 20,
          description: String(item.description || '').trim(),
          brand: String(item.brand || defaultMerchantName).trim()
        }))
        .filter((r: CatalogImportRow) => r.name && r.price > 0);

      return { rows };
    } catch (e: any) {
      return { rows: [], error: `Invalid JSON: ${e.message}` };
    }
  }

  // Handle CSV / TSV
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { rows: [], error: 'File must contain a header and at least one item row.' };
  }

  const isTab = lines[0].includes('\t');
  const delimiter = isTab ? '\t' : ',';

  const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase().replace(/[\s_()]+/g, ''));
  const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('product') || h.includes('item'));
  const catIdx = headers.findIndex((h) => h.includes('category') || h.includes('type'));
  const priceIdx = headers.findIndex((h) => h.includes('price') || h.includes('cost') || h.includes('zmw'));
  const packIdx = headers.findIndex((h) => h.includes('pack') || h.includes('size') || h.includes('unit'));
  const stockIdx = headers.findIndex((h) => h.includes('stock') || h.includes('qty') || h.includes('quantity'));
  const descIdx = headers.findIndex((h) => h.includes('desc') || h.includes('detail'));
  const brandIdx = headers.findIndex((h) => h.includes('brand'));

  if (nameIdx === -1 || priceIdx === -1) {
    return { rows: [], error: 'Could not find required columns "Product Name" and "Price" in header.' };
  }

  const rows: CatalogImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cols: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        cols.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    cols.push(cur.trim());

    const name = cols[nameIdx]?.replace(/^"|"$/g, '').trim();
    const rawPrice = cols[priceIdx]?.replace(/[^0-9.]/g, '');
    const price = parseFloat(rawPrice) || 0;

    if (name && price > 0) {
      rows.push({
        name,
        category: (catIdx >= 0 ? cols[catIdx]?.replace(/^"|"$/g, '') : '') || 'Supermarket',
        price,
        packSize: (packIdx >= 0 ? cols[packIdx]?.replace(/^"|"$/g, '') : '') || '1 unit',
        stock: (stockIdx >= 0 ? parseInt(cols[stockIdx]?.replace(/[^0-9]/g, '')) : 25) || 25,
        description: (descIdx >= 0 ? cols[descIdx]?.replace(/^"|"$/g, '') : '') || `Supplied by ${defaultMerchantName}`,
        brand: (brandIdx >= 0 ? cols[brandIdx]?.replace(/^"|"$/g, '') : '') || defaultMerchantName
      });
    }
  }

  if (rows.length === 0) {
    return { rows: [], error: 'No valid rows with name and price could be parsed.' };
  }

  return { rows };
}
