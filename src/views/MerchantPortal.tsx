/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Store,
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  DollarSign,
  Box,
  Plus,
  Edit2,
  Loader2,
  Upload,
  FileSpreadsheet,
  Download,
  Check,
  FileText,
  BarChart3
} from 'lucide-react';
import { Product, Order, Merchant, CatalogImportRow } from '../types';
import { formatZMW } from '../utils/economics';
import { OrderStatus } from '../utils/orderStateMachine';
import { parseMerchandiseCatalog } from '../utils/catalogParser';
import { MerchantAnalyticsView } from '../components/MerchantAnalyticsView';


interface MerchantPortalProps {
  merchant: Merchant;
  products: Product[];
  orders: Order[];
  allMerchants?: Merchant[];
  onSelectMerchant?: (merchantId: string) => void;
  onOpenRegisterStore?: () => void;
  onUpdateProductStock: (productId: string, newStock: number) => void;
  onUpdateProductPrice: (productId: string, newPrice: number) => void;
  onAdvanceOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onAddNewProduct: (product: Partial<Product>) => void;
  onBulkAddProducts?: (products: Partial<Product>[]) => void;
}

const SAMPLE_CSV = `Product Name,Category,Price,Pack Size,Stock,Description,Brand
White Spoon Sugar 1kg,Supermarket,38,1kg pack,50,Zambia Sugar pure fine granulated white cane sugar,Zambia Sugar
Fresh Village Eggs (Tray of 30),Fresh Produce,95,Tray of 30,24,Local free-range farm fresh brown eggs from Chongwe,Chongwe Valley
Pure Rape Greens (Bunch),Fresh Produce,15,Fresh bunch,40,Tender dark green rape leaves picked fresh at dawn,Local Garden
Dambo Dry Kapenta 500g,Fresh Produce,110,500g packet,35,Crispy sun-dried Siavonga Lake Kariba kapenta fish,Lake Fresh
Bakers Pride White Bread 700g,Bakery,24,700g Loaf,60,Enriched soft sliced sandwich bread freshly baked,Bakers Pride
Zambeef Tender Boerewors 1kg,Butchery,130,1kg pack,20,Traditional spiced beef sausage coils ready for braai,Zambeef`;

export const MerchantPortal: React.FC<MerchantPortalProps> = ({
  merchant,
  products,
  orders,
  allMerchants = [],
  onSelectMerchant,
  onOpenRegisterStore,
  onUpdateProductStock,
  onUpdateProductPrice,
  onAdvanceOrderStatus,
  onAddNewProduct,
  onBulkAddProducts
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'analytics' | 'inventory' | 'import' | 'financials' | 'ai'>('orders');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [tempStock, setTempStock] = useState<number>(0);
  const [tempPrice, setTempPrice] = useState<number>(0);

  // Merchant AI State
  const [aiProductTitle, setAiProductTitle] = useState('Fresh Organic Chongwe Tomatoes');
  const [aiCategory, setAiCategory] = useState('Fresh Produce');
  const [aiGeneratedText, setAiGeneratedText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // File Upload & Catalog Import State
  const [importText, setImportText] = useState('');
  const [parsedRows, setParsedRows] = useState<CatalogImportRow[]>([]);
  const [importError, setImportError] = useState('');
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

  // Filter products for this merchant
  const merchantProducts = products.filter((p) => p.merchantId === merchant.id);
  const merchantOrders = orders.filter((o) => o.merchantId === merchant.id);

  // Financial calculations
  const totalGMV = merchantOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const commissionRate = merchant.commissionRate || 0.08;
  const totalCommissionWithheld = totalGMV * commissionRate;
  const netMerchantProceeds = totalGMV - totalCommissionWithheld;

  const handleStartEdit = (product: Product) => {
    setEditingProductId(product.id);
    setTempStock(product.stock);
    setTempPrice(product.price);
  };

  const handleSaveEdit = (productId: string) => {
    onUpdateProductStock(productId, tempStock);
    onUpdateProductPrice(productId, tempPrice);
    setEditingProductId(null);
  };

  const handleRunMerchantAi = async (action: 'description' | 'forecast') => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/merchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          productTitle: aiProductTitle,
          category: aiCategory,
          currentStock: 25,
          salesTrend: '14 units sold in last 48 hours'
        })
      });
      const data = await res.json();
      setAiGeneratedText(data.text || 'Recommendation generated.');
    } catch {
      setAiGeneratedText('Failed to generate AI recommendation.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // CSV / TSV / JSON File Parsing using shared utility
  const parseMerchandiseFile = (content: string) => {
    setImportError('');
    setImportSuccessMsg('');

    const res = parseMerchandiseCatalog(content, merchant.name);
    if (res.error) {
      setImportError(res.error);
      setParsedRows([]);
    } else {
      setParsedRows(res.rows);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
      parseMerchandiseFile(content);
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `vayzo_merchandise_template_${merchant.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;

    const newProductItems: Partial<Product>[] = parsedRows.map((row, idx) => ({
      merchantId: merchant.id,
      merchantName: merchant.name,
      name: row.name,
      description: row.description || `Quality item supplied by ${merchant.name}.`,
      category: row.category,
      unit: 'pack',
      packSize: row.packSize,
      price: row.price,
      stock: row.stock,
      status: 'in_stock',
      has3dModel: false,
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
      brand: row.brand || merchant.name
    }));

    if (onBulkAddProducts) {
      onBulkAddProducts(newProductItems);
    } else {
      for (const item of newProductItems) {
        onAddNewProduct(item);
      }
    }

    setImportSuccessMsg(`Success! Imported ${parsedRows.length} merchandise items into ${merchant.name}'s active storefront catalog.`);
    setParsedRows([]);
    setImportText('');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Merchant Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={merchant.imageUrl}
            alt={merchant.name}
            className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-sm"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md ${
                merchant.businessSector === 'food_dining'
                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                  : merchant.businessSector === 'supermarket_grocery'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                  : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
              }`}>
                {merchant.businessSector === 'food_dining'
                  ? '🍽️ Food & Dining Business'
                  : merchant.businessSector === 'supermarket_grocery'
                  ? '🛒 Supermarket & Grocery'
                  : '📦 General Retail'}
              </span>
              <span className="text-xs text-slate-400">• {merchant.township}, Lusaka</span>
            </div>
            
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-2xl font-black text-slate-900">{merchant.name}</h1>
              {allMerchants.length > 1 && onSelectMerchant && (
                <select
                  value={merchant.id}
                  onChange={(e) => onSelectMerchant(e.target.value)}
                  className="text-xs font-semibold bg-slate-100 border border-slate-300 rounded-xl px-2.5 py-1 text-slate-800 outline-none cursor-pointer"
                >
                  {allMerchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      Switch to: {m.name} ({m.category})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Category: <strong className="text-slate-700">{merchant.category}</strong> • Agreed Commission: {(merchant.commissionRate * 100).toFixed(0)}% • Rating: {merchant.rating} ★
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-start md:self-auto">
          {onOpenRegisterStore && (
            <button
              onClick={onOpenRegisterStore}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>Register New Store</span>
            </button>
          )}

          {/* Portal Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl self-start md:self-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === 'orders' ? 'bg-emerald-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Orders ({merchantOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-emerald-800 text-white shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-lime-400" />
            <span>Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === 'inventory' ? 'bg-emerald-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inventory ({merchantProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'import' ? 'bg-lime-400 text-emerald-950 font-black shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Catalog</span>
          </button>
          <button
            onClick={() => setActiveTab('financials')}
            className={`px-3.5 py-2 rounded-xl transition ${
              activeTab === 'financials' ? 'bg-emerald-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Settlement
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'ai' ? 'bg-purple-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-lime-400" />
            Merchant AI
          </button>
        </div>
        </div>
      </div>

      {/* Tab: Merchant Analytics View */}
      {activeTab === 'analytics' && (
        <MerchantAnalyticsView
          merchant={merchant}
          allOrders={orders}
          products={products}
        />
      )}

      {/* Tab: Catalog File Upload & Import */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                  <span>Upload Merchandise Pricing & Catalog File</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Import inventory files (.csv, .tsv, .json) or copy & paste from your spreadsheet to automatically populate your storefront.
                </p>
              </div>

              <button
                onClick={handleDownloadSample}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
              >
                <Download className="w-4 h-4 text-emerald-800" />
                <span>Download Sample Template (.csv)</span>
              </button>
            </div>

            {importSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs rounded-2xl flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span className="font-semibold">{importSuccessMsg}</span>
              </div>
            )}

            {importError && (
              <div className="p-4 bg-red-50 border border-red-300 text-red-800 text-xs rounded-2xl flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* File Drag and Drop / Picker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-emerald-600 transition bg-slate-50/60 flex flex-col items-center justify-center space-y-2">
                <Upload className="w-8 h-8 text-slate-400" />
                <p className="font-bold text-xs text-slate-700">Choose a file from your device</p>
                <p className="text-[11px] text-slate-400">Supports .CSV, .TSV, or .JSON files</p>
                <label className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm">
                  <span>Browse File</span>
                  <input
                    type="file"
                    accept=".csv,.tsv,.json,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Paste from Excel / Sheets */}
              <div className="space-y-2">
                <label className="block font-bold text-xs text-slate-700">
                  Or Paste Merchandise Data (CSV or Excel columns)
                </label>
                <textarea
                  rows={5}
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    parseMerchandiseFile(e.target.value);
                  }}
                  placeholder="Product Name,Category,Price,Pack Size,Stock,Description..."
                  className="w-full font-mono text-xs p-3 border border-slate-300 rounded-2xl bg-white focus:ring-2 focus:ring-emerald-700 outline-none"
                />
              </div>
            </div>

            {/* Live Parsed Preview Table */}
            {parsedRows.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Parsed Preview ({parsedRows.length} Items Ready to Import)
                  </h3>
                  <button
                    onClick={handleConfirmImport}
                    className="px-5 py-2 bg-lime-400 hover:bg-lime-300 text-emerald-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm & Import {parsedRows.length} Items to Storefront</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Price (ZMW)</th>
                        <th className="p-3">Pack Size</th>
                        <th className="p-3">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-400 font-mono">{i + 1}</td>
                          <td className="p-3 font-semibold text-slate-900">{r.name}</td>
                          <td className="p-3 text-slate-600">{r.category}</td>
                          <td className="p-3 font-bold text-emerald-900">{formatZMW(r.price)}</td>
                          <td className="p-3 text-slate-600">{r.packSize}</td>
                          <td className="p-3 text-slate-600">{r.stock} units</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 1: Orders Queue */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-900">Live Customer Orders</h2>

          {merchantOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-700">No active orders right now</h3>
              <p className="text-xs text-slate-400">Incoming customer orders in Lusaka will ring here in real-time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {merchantOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-slate-900">#{order.id}</span>
                        <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-md bg-emerald-100 text-emerald-800">
                          {order.status.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {order.vehicleType === 'taxi' ? 'Cargo Cab' : 'Biker'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Customer: <strong>{order.customerName}</strong> ({order.customerPhone}) • Destination: {order.deliveryAddress.township}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-950">{formatZMW(order.subtotal)}</span>
                      <p className="text-[11px] text-slate-400">Merchandise Subtotal</p>
                    </div>
                  </div>

                  {/* Order Line Items */}
                  <div className="space-y-1.5 text-xs">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-700 py-1 border-b border-slate-50">
                        <span>
                          <strong>{item.quantity}x</strong> {item.name} ({item.packSize})
                        </span>
                        <span className="font-semibold text-slate-900">{formatZMW(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Merchant Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium">Pickup Verification Code:</span>
                      <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {order.pickupVerificationCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.status === 'CONFIRMED' && (
                        <button
                          onClick={() => onAdvanceOrderStatus(order.id, 'MERCHANT_ACCEPTED')}
                          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl transition"
                        >
                          Accept Order & Confirm Stock
                        </button>
                      )}

                      {order.status === 'MERCHANT_ACCEPTED' && (
                        <button
                          onClick={() => onAdvanceOrderStatus(order.id, 'PREPARING')}
                          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl transition"
                        >
                          Pack Items (Preparing)
                        </button>
                      )}

                      {order.status === 'PREPARING' && (
                        <button
                          onClick={() => onAdvanceOrderStatus(order.id, 'READY_FOR_PICKUP')}
                          className="px-4 py-2 bg-lime-500 hover:bg-lime-400 text-emerald-950 font-black rounded-xl transition shadow"
                        >
                          Mark Ready for Courier Collection
                        </button>
                      )}

                      {order.status === 'READY_FOR_PICKUP' && (
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                          Awaiting assigned courier to scan code {order.pickupVerificationCode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Inventory Management */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Inventory Catalog</h2>
              <p className="text-xs text-slate-500">Authoritative stock and pricing controls in Zambian Kwacha (ZMW)</p>
            </div>
            <button
              onClick={() => setActiveTab('import')}
              className="px-3.5 py-1.5 bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-emerald-900 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import via File</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price (ZMW)</th>
                    <th className="p-4">Stock Level</th>
                    <th className="p-4">3D Asset</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {merchantProducts.map((p) => {
                    const isEditing = editingProductId === p.id;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-4 font-semibold text-slate-900 flex items-center gap-3">
                          <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                          <div>
                            <p>{p.name}</p>
                            <span className="text-[11px] text-slate-400">{p.packSize}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600">{p.category}</td>
                        <td className="p-4 font-bold text-slate-900">
                          {isEditing ? (
                            <input
                              type="number"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(Number(e.target.value))}
                              className="w-20 px-2 py-1 border border-slate-300 rounded font-mono text-xs"
                            />
                          ) : (
                            formatZMW(p.price)
                          )}
                        </td>
                        <td className="p-4">
                          {isEditing ? (
                            <input
                              type="number"
                              value={tempStock}
                              onChange={(e) => setTempStock(Number(e.target.value))}
                              className="w-16 px-2 py-1 border border-slate-300 rounded font-mono text-xs"
                            />
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                p.stock > 10
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : p.stock > 0
                                  ? 'bg-amber-50 text-amber-800'
                                  : 'bg-red-50 text-red-800'
                              }`}
                            >
                              {p.stock} units
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {p.has3dModel ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                              <Box className="w-3 h-3 text-emerald-600" />
                              Linked ({p.modelType})
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Photo only</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleSaveEdit(p.id)}
                                className="px-3 py-1 bg-emerald-800 text-white font-bold rounded-lg hover:bg-emerald-900"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingProductId(null)}
                                className="px-2 py-1 bg-slate-200 text-slate-700 font-medium rounded-lg"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(p)}
                              className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg"
                              title="Edit Price & Stock"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Financials & Settlement */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Gross Merchandise Value (GMV)</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{formatZMW(totalGMV)}</div>
              <p className="text-[11px] text-slate-400 mt-1">Total customer purchases from your store</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Platform Commission ({(commissionRate * 100).toFixed(0)}%)</span>
              <div className="text-2xl font-black text-red-600 mt-1">-{formatZMW(totalCommissionWithheld)}</div>
              <p className="text-[11px] text-slate-400 mt-1">Contractual service fee withheld</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-emerald-300/80 bg-emerald-50/50 shadow-sm">
              <span className="text-xs font-bold text-emerald-900 uppercase">Estimated Net Settlement</span>
              <div className="text-2xl font-black text-emerald-950 mt-1">{formatZMW(netMerchantProceeds)}</div>
              <p className="text-[11px] text-emerald-700 mt-1">Authoritative funds payable to merchant</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
              Settlement Arithmetic Transparency
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Vayzo operates on transparent commercial formulas. For every completed grocery order, merchant proceeds equal eligible product sales minus the agreed {(commissionRate * 100).toFixed(0)}% commission. Customer delivery fees (K25 Biker / K50 Taxi) are collected directly by couriers in cash upon arrival and do not pass through merchant accounts.
            </p>
          </div>
        </div>
      )}

      {/* Tab: Merchant AI Assistant */}
      {activeTab === 'ai' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span>Vayzo Product Copy Assistant</span>
            </h2>
            <p className="text-xs text-slate-500">
              Automated commercial copy generator and inventory demand forecasting
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Product Title</label>
              <input
                type="text"
                value={aiProductTitle}
                onChange={(e) => setAiProductTitle(e.target.value)}
                className="w-full text-xs font-medium border border-slate-300 rounded-xl px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={aiCategory}
                onChange={(e) => setAiCategory(e.target.value)}
                className="w-full text-xs font-medium border border-slate-300 rounded-xl px-3 py-2 bg-white"
              >
                <option value="Fresh Produce">Fresh Produce</option>
                <option value="Supermarket">Supermarket</option>
                <option value="Butchery">Butchery</option>
                <option value="Bakery">Bakery</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleRunMerchantAi('description')}
              disabled={isAiLoading}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-lime-400" />}
              <span>Generate Description</span>
            </button>
            <button
              onClick={() => handleRunMerchantAi('forecast')}
              disabled={isAiLoading}
              className="px-4 py-2 bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              <TrendingUp className="w-4 h-4 text-lime-400" />
              <span>Forecast Stock Reorder</span>
            </button>
          </div>

          {aiGeneratedText && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
              <span className="font-bold text-slate-900 block mb-1">AI Recommendation Output:</span>
              {aiGeneratedText}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
