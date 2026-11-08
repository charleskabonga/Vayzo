/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { calculateOrderFinancials, simulateUnitEconomics, calculateYangoDualPayment } from './src/utils/economics';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google Gemini SDK on the server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Vayzo Commerce & Logistics Engine',
    market: 'Zambia',
    currency: 'ZMW',
    timestamp: new Date().toISOString()
  });
});

// Authoritative Order Calculation Endpoint
app.post('/api/orders/calculate', (req: Request, res: Response) => {
  try {
    const { productSubtotal, deliveryFee, serviceFee, merchantCommissionRate, riderDistanceKm, tip, discounts } = req.body;
    const breakdown = calculateOrderFinancials({
      productSubtotal: Number(productSubtotal) || 0,
      deliveryFee: Number(deliveryFee) || 25,
      serviceFee: serviceFee !== undefined ? Number(serviceFee) : 5,
      merchantCommissionRate: merchantCommissionRate ? Number(merchantCommissionRate) : 0.08,
      riderDistanceKm: Number(riderDistanceKm) || 3.5,
      tip: Number(tip) || 0,
      discounts: Number(discounts) || 0
    });
    res.json({ success: true, breakdown });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Unit Economics Scenario Simulator Endpoint
app.post('/api/economics/simulate', (req: Request, res: Response) => {
  try {
    const params = req.body;
    const result = simulateUnitEconomics({
      dailyOrders: Number(params.dailyOrders) || 100,
      averageBasketValue: Number(params.averageBasketValue) || 400,
      commissionRate: Number(params.commissionRate) || 0.08,
      deliveryFee: Number(params.deliveryFee) || 25,
      serviceFee: Number(params.serviceFee) || 5,
      riderCompensation: Number(params.riderCompensation) || 18,
      paymentFeeRate: Number(params.paymentFeeRate) || 0.015,
      refundRate: Number(params.refundRate) || 0.005,
      monthlyFixedCosts: Number(params.monthlyFixedCosts) || 45000
    });
    res.json({ success: true, scenario: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Authoritative Yango Dual Payment Calculation Endpoint (Stage 1 Merchandise vs Stage 2 Courier Cash)
app.post('/api/orders/calculate-yango', (req: Request, res: Response) => {
  try {
    const { productSubtotal, vehicleType, serviceFee, discounts, distanceKm } = req.body;
    const breakdown = calculateYangoDualPayment({
      productSubtotal: Number(productSubtotal) || 0,
      vehicleType: vehicleType === 'taxi' ? 'taxi' : 'biker',
      serviceFee: serviceFee !== undefined ? Number(serviceFee) : 5,
      discounts: Number(discounts) || 0,
      distanceKm: Number(distanceKm) || 2.5
    });
    res.json({ success: true, breakdown });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Stage 1 Mobile Money Payment Adapter (MTN MoMo, Airtel Money, Zamtel Kwacha)
app.post('/api/payments/initiate', (req: Request, res: Response) => {
  const { orderId, amount, phone, provider, stage } = req.body;

  // Validate Zambian phone number (+260 ...)
  const cleaned = String(phone || '').replace(/[\s-]/g, '');
  const isValidZambian = /^(\+260|0)(97|96|95|77|76)\d{7}$/.test(cleaned);

  if (!isValidZambian) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Zambian mobile number. Use MTN (096/076), Airtel (097/077), or Zamtel (095).'
    });
  }

  const txRef = `${provider || 'MOMO'}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
  res.json({
    success: true,
    status: 'SUCCESS',
    stage: stage || 'STAGE_1_MERCHANDISE',
    transactionReference: txRef,
    orderId,
    amount,
    provider: provider || 'MTN_MOMO',
    message: `USSD push prompt sent to ${phone}. Stage 1 Merchandise & Management fee of K${amount}.00 verified! Courier booking is now activated. Delivery fee is payable in Cash upon arrival.`,
    isSimulatedAdapter: true
  });
});

// Gemini AI: Vayzo Customer Shopping Assistant (gemini-3.8-flash with optional Search/Maps Grounding)
app.post('/api/ai/assistant', async (req: Request, res: Response) => {
  try {
    const { prompt, conversationHistory = [], catalogContext = '', userLocation, useGrounding } = req.body;

    const systemInstruction = `You are Vayzo AI, an intelligent, friendly, and practical shopping assistant for Vayzo, Zambia's premier multi-vendor grocery and last-mile delivery platform.
Your mission is to help Zambian families, professionals, and households plan their meals, compare prices in Zambian Kwacha (ZMW/K), find ingredients (like mealie meal for nshima, cooking oil, kapenta, tomatoes, chibwabwa, eggs, village chicken), and build budget-conscious baskets.

Crucial Rules:
1. Always express prices in Zambian Kwacha with the prefix 'K' (e.g. K320.00, K120.00).
2. Never invent fake products, discounts or unavailable stock. Refer to the actual catalog provided.
3. Suggest authentic Zambian meal combinations (e.g. nshima with beef stew & chibwabwa, or village chicken with rape).
4. Be concise, respectful, and helpful. If proposing a shopping basket, itemize each product with its exact price and compute the accurate sum.`;

    let toolsConfig: any[] = [];
    if (useGrounding === 'search') {
      toolsConfig = [{ googleSearch: {} }];
    } else if (useGrounding === 'maps') {
      toolsConfig = [{ googleMaps: {} }];
    }

    const config: any = {
      systemInstruction
    };

    if (toolsConfig.length > 0) {
      config.tools = toolsConfig;
      if (useGrounding === 'maps' && userLocation?.latitude) {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude
            }
          }
        };
      }
    }

    // Prepare contents
    const contents: any[] = [];
    if (conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
    }

    const currentPromptWithContext = catalogContext
      ? `Available Vayzo Zambia Catalog:\n${catalogContext}\n\nCustomer Request: ${prompt}`
      : prompt;

    contents.push({
      role: 'user',
      parts: [{ text: currentPromptWithContext }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config
    });

    const responseText = response.text || 'I could not generate a response. Please try again.';

    // Extract grounding chunks if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    res.json({
      success: true,
      text: responseText,
      groundingChunks
    });
  } catch (err: any) {
    console.error('Gemini Assistant Error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Error communicating with Vayzo AI Assistant'
    });
  }
});

// Gemini AI: High Thinking Mode for Complex Strategy & Logistics (gemini-4-argon)
app.post('/api/ai/thinking', async (req: Request, res: Response) => {
  try {
    const { prompt, businessData } = req.body;

    const response = await ai.models.generateContent({
      model: 'gemini-4-argon',
      contents: `You are the Principal Chief Strategist and Supply Chain Optimization Architect for Vayzo Zambia.
Analyze the following scenario deeply, evaluating trade-offs in rider compensation, merchant commission elasticity, last-mile routing bottlenecks across Lusaka neighborhoods (Kabulonga, Woodlands, Rhodes Park, Roma, Chilenje), and multi-vendor delivery consolidation.

Business Context:
${JSON.stringify(businessData || {}, null, 2)}

Inquiry:
${prompt}`,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH
        }
      }
    });

    res.json({
      success: true,
      text: response.text || 'Analysis completed.'
    });
  } catch (err: any) {
    console.error('Gemini Thinking Mode Error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Error running High Thinking analysis'
    });
  }
});

// Gemini AI: Merchant Assistant (gemini-3.8-flash)
app.post('/api/ai/merchant', async (req: Request, res: Response) => {
  try {
    const { action, productTitle, category, currentStock, salesTrend } = req.body;

    const prompt = action === 'description'
      ? `Generate a compelling, clear, and high-converting product description for a grocery/retail store in Zambia.
Product: "${productTitle}" in Category: "${category}". Mention freshness, quality, and typical culinary or household usage in Lusaka.`
      : `Act as an inventory forecasting specialist for a Zambian supermarket.
Product: "${productTitle}", Current Stock: ${currentStock}, Recent 7-day Sales: ${salesTrend}.
Analyze reorder urgency and suggest an optimal replenishment order quantity with safety buffer.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt
    });

    res.json({
      success: true,
      text: response.text || ''
    });
  } catch (err: any) {
    console.error('Gemini Merchant AI Error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Dev server mount with Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  VITE v8.3.0  ready in 120 ms\n\n  ➜  Local:   http://localhost:${PORT}/\n  ➜  Network: http://0.0.0.0:${PORT}/\n`);
  });
}

startServer();
