/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

function sanitizeSupabaseUrl(rawUrl: string | undefined): string {
  if (!rawUrl) return '';
  const cleaned = rawUrl
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1$/i, '')
    .replace(/\/+$/, '');

  if (!cleaned || cleaned.includes('PASTE_')) return '';

  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return '';
    }
    return parsed.origin;
  } catch {
    return '';
  }
}

function sanitizeSupabaseKey(rawKey: string | undefined): string {
  if (!rawKey) return '';
  const cleaned = rawKey.trim().replace(/^["']|["']$/g, '').trim();
  if (!cleaned || cleaned.includes('PASTE_')) return '';
  return cleaned;
}

const supabaseUrl = sanitizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = sanitizeSupabaseKey(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const initializedUrl = supabaseUrl || 'https://placeholder.supabase.co';
console.info('[Supabase] Initializing client with URL:', initializedUrl);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing or placeholders.'
  );
}

export const supabase = createClient(initializedUrl, supabaseAnonKey || 'placeholder-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
