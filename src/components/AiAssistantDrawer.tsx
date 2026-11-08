/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Brain, Globe, MapPin, ShoppingBag, Loader2, Check, RefreshCw } from 'lucide-react';
import { Product } from '../types';
import { formatZMW } from '../utils/economics';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  groundingChunks?: any[];
  proposedProducts?: { id: string; name: string; price: number; quantity: number }[];
  timestamp: string;
}

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: Product[];
  onAddMultipleToCart: (items: { product: Product; quantity: number }[]) => void;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  catalog,
  onAddMultipleToCart
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: "Mwapoleni! I'm Vayzo AI, your Zambian grocery and shopping assistant. I can help you plan family meals (like nshima with relish), budget for weekly groceries under K500, compare local prices, or find farm-fresh ingredients in Lusaka.",
      timestamp: 'Just now'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [groundingMode, setGroundingMode] = useState<'none' | 'search' | 'maps' | 'thinking'>('none');
  const [isLoading, setIsLoading] = useState(false);
  const [addedBatchNotice, setAddedBatchNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  // Catalog context snippet to ground model with real prices
  const catalogContext = catalog
    .map((p) => `- ${p.name} (${p.category}): ${formatZMW(p.price)} per ${p.packSize} [ID: ${p.id}, Stock: ${p.stock}]`)
    .join('\n');

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = textToSend || inputText;
    if (!prompt.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      // Pick endpoint depending on whether High Thinking Mode (gemini-4-argon) is active
      if (groundingMode === 'thinking') {
        const response = await fetch('/api/ai/thinking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            businessData: {
              activeMarket: 'Lusaka, Zambia',
              catalogSummary: catalog.map((p) => ({ name: p.name, price: p.price, category: p.category }))
            }
          })
        });

        const data = await response.json();
        const assistantMessage: Message = {
          id: `ai_${Date.now()}`,
          sender: 'assistant',
          text: data.text || 'High thinking analysis completed.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const response = await fetch('/api/ai/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            conversationHistory: messages.map((m) => ({
              role: m.sender === 'user' ? 'user' : 'model',
              text: m.text
            })),
            catalogContext,
            useGrounding: groundingMode === 'search' ? 'search' : groundingMode === 'maps' ? 'maps' : undefined,
            userLocation: { latitude: -15.4167, longitude: 28.2833 } // Lusaka coordinates
          })
        });

        const data = await response.json();

        // Detect if assistant proposed products that match our catalog
        const lowerText = (data.text || '').toLowerCase();
        const matchedProducts: { id: string; name: string; price: number; quantity: number }[] = [];
        for (const prod of catalog) {
          if (lowerText.includes(prod.name.toLowerCase()) || (prod.brand && lowerText.includes(prod.brand.toLowerCase()))) {
            matchedProducts.push({
              id: prod.id,
              name: prod.name,
              price: prod.price,
              quantity: 1
            });
          }
        }

        const assistantMessage: Message = {
          id: `ai_${Date.now()}`,
          sender: 'assistant',
          text: data.text || 'Here is what I found for you.',
          groundingChunks: data.groundingChunks,
          proposedProducts: matchedProducts.length > 0 ? matchedProducts : undefined,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: 'I ran into an issue retrieving that information. Please try again.',
          timestamp: 'Just now'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProposedToCart = (proposed: { id: string; name: string; price: number; quantity: number }[]) => {
    const toAdd: { product: Product; quantity: number }[] = [];
    for (const item of proposed) {
      const found = catalog.find((p) => p.id === item.id);
      if (found) {
        toAdd.push({ product: found, quantity: item.quantity });
      }
    }

    if (toAdd.length > 0) {
      onAddMultipleToCart(toAdd);
      setAddedBatchNotice(`Added ${toAdd.length} items to your shopping cart!`);
      setTimeout(() => setAddedBatchNotice(null), 3000);
    }
  };

  const quickPrompts = [
    'Help me buy groceries for K500.',
    'Find affordable ingredients for nshima and relish.',
    'What can I cook with eggs, tomatoes, and greens?',
    'Compare mealie meal brands and prices.'
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-950 to-teal-950 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-lime-400 text-emerald-950 flex items-center justify-center font-black">
                <Sparkles className="w-4 h-4 text-emerald-950" />
              </div>
              <div>
                <h2 className="font-bold text-base flex items-center gap-1.5">
                  <span>Vayzo AI Assistant</span>
                  <span className="text-[10px] font-black uppercase px-1.5 py-0.2 bg-lime-400/20 text-lime-300 border border-lime-400/30 rounded">
                    Gemini
                  </span>
                </h2>
                <p className="text-[11px] text-emerald-200/80">Grounding & intelligent shopping planner</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-full text-emerald-300 hover:text-white hover:bg-emerald-900"
              aria-label="Close AI Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Selector Pill Bar */}
          <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-1 overflow-x-auto text-[11px]">
            <span className="font-semibold text-slate-500 shrink-0">Intelligence:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setGroundingMode('none')}
                className={`px-2 py-1 rounded-lg font-medium transition ${
                  groundingMode === 'none'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                Catalog AI
              </button>
              <button
                onClick={() => setGroundingMode('search')}
                className={`px-2 py-1 rounded-lg font-medium flex items-center gap-1 transition ${
                  groundingMode === 'search'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Globe className="w-3 h-3 text-blue-500" />
                Google Search
              </button>
              <button
                onClick={() => setGroundingMode('maps')}
                className={`px-2 py-1 rounded-lg font-medium flex items-center gap-1 transition ${
                  groundingMode === 'maps'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <MapPin className="w-3 h-3 text-red-500" />
                Google Maps
              </button>
              <button
                onClick={() => setGroundingMode('thinking')}
                className={`px-2 py-1 rounded-lg font-medium flex items-center gap-1 transition ${
                  groundingMode === 'thinking'
                    ? 'bg-purple-800 text-white shadow-xs font-bold'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Brain className="w-3 h-3 text-purple-600" />
                High Thinking
              </button>
            </div>
          </div>

          {/* Conversation Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-emerald-800 text-white rounded-br-none'
                      : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/70'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Grounding Sources (Search / Maps) */}
                  {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-[11px] space-y-1">
                      <span className="font-bold text-slate-700 block">Verified Grounding Sources:</span>
                      {msg.groundingChunks.slice(0, 3).map((chunk: any, i: number) => {
                        const uri = chunk.web?.uri || chunk.maps?.uri;
                        const title = chunk.web?.title || chunk.maps?.title || 'Source reference';
                        if (!uri) return null;
                        return (
                          <a
                            key={i}
                            href={uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:underline block truncate"
                          >
                            • {title}
                          </a>
                        );
                      })}
                    </div>
                  )}

                  {/* Proposed Basket Items Action */}
                  {msg.proposedProducts && msg.proposedProducts.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                      <span className="font-bold text-[11px] text-emerald-950 block mb-1">
                        Proposed Shopping Basket ({msg.proposedProducts.length} items):
                      </span>
                      <ul className="space-y-1 text-[11px] text-slate-600 mb-2">
                        {msg.proposedProducts.map((p) => (
                          <li key={p.id} className="flex justify-between">
                            <span>{p.name}</span>
                            <span className="font-bold text-slate-900">{formatZMW(p.price)}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => handleAddProposedToCart(msg.proposedProducts!)}
                        className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition active:scale-95"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-lime-400" />
                        <span>Add Proposed Items to Basket</span>
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-2xl w-fit text-xs text-slate-600 border border-slate-200">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                <span>
                  {groundingMode === 'thinking'
                    ? 'Gemini 4 Argon is conducting high-level reasoning...'
                    : groundingMode === 'search'
                    ? 'Consulting Google Search data...'
                    : groundingMode === 'maps'
                    ? 'Retrieving Lusaka location data...'
                    : 'Vayzo AI is formulating recommendations...'}
                </span>
              </div>
            )}

            {addedBatchNotice && (
              <div className="p-2.5 bg-lime-100 border border-lime-300 text-emerald-900 font-bold text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-700" />
                <span>{addedBatchNotice}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(qp)}
                className="whitespace-nowrap px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 rounded-full transition shrink-0"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-slate-200 bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder="Ask Vayzo AI (e.g. Help me buy groceries for K500)..."
                className="flex-1 text-xs font-medium border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-700 outline-none"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
                className="p-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-sm transition active:scale-95 disabled:opacity-50"
                aria-label="Send message to AI assistant"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
