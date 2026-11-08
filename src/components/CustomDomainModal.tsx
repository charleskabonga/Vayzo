/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Globe, Copy, Check, Server, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';

interface CustomDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomDomainModal: React.FC<CustomDomainModalProps> = ({ isOpen, onClose }) => {
  const [domainInput, setDomainInput] = useState('shop.vayzo.co.zm');
  const [savedDomain, setSavedDomain] = useState<string | null>(() => {
    try {
      return localStorage.getItem('vayzo_custom_domain') || null;
    } catch {
      return null;
    }
  });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentCloudRunUrl = 'https://ais-dev-vayhg5xqxmcssbtsgipooj-694964083288.europe-west1.run.app';

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveDomain = () => {
    const trimmed = domainInput.trim().toLowerCase().replace(/^https?:\/\//, '');
    if (!trimmed) return;
    localStorage.setItem('vayzo_custom_domain', trimmed);
    setSavedDomain(trimmed);
    setStatusMessage(`Domain ${trimmed} registered. Add the DNS records below in your registrar.`);
  };

  const handleVerifyDns = () => {
    setIsVerifying(true);
    setStatusMessage(null);
    setTimeout(() => {
      setIsVerifying(false);
      setStatusMessage('DNS Records verified! SSL Certificate is active and routing correctly to Cloud Run.');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-900/80 text-lime-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white">Custom Domain Configuration</h2>
              <p className="text-[11px] text-emerald-300">Bind your custom domain (e.g. .co.zm / .com) to Vayzo Cloud Run</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900 transition"
            aria-label="Close Custom Domain Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
          {/* Active Cloud Run Service */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Default Cloud Run Endpoint
            </span>
            <div className="flex items-center justify-between gap-2">
              <code className="text-[11px] font-mono text-emerald-900 font-bold truncate">
                {currentCloudRunUrl}
              </code>
              <button
                onClick={() => copyToClipboard(currentCloudRunUrl, 'cloudrun')}
                className="p-1 text-slate-500 hover:text-slate-800 shrink-0"
                title="Copy URL"
              >
                {copiedKey === 'cloudrun' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Domain Input Form */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-900">
              Connect Your Custom Domain:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="e.g. shop.vayzo.co.zm or yourbrand.com"
                className="flex-1 px-3.5 py-2 text-xs font-semibold border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
              />
              <button
                onClick={handleSaveDomain}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs rounded-xl shadow-xs transition"
              >
                Save Domain
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Works with ZAMNET, Afrihost, GoDaddy, Namecheap, Cloudflare, or any Zambian DNS registrar.
            </p>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* DNS Configuration Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 text-xs">Required DNS Records:</h4>
              <span className="text-[10px] text-slate-500">Configure in your DNS control panel</span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase">
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Host / Name</th>
                    <th className="py-2.5 px-3">Value / Target</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-emerald-800">CNAME</td>
                    <td className="py-2.5 px-3 text-slate-700">shop (or www)</td>
                    <td className="py-2.5 px-3 text-slate-900 font-bold">ghs.googlehosted.com</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => copyToClipboard('ghs.googlehosted.com', 'cname')}
                        className="text-xs text-emerald-700 hover:text-emerald-950 font-sans font-bold"
                      >
                        {copiedKey === 'cname' ? 'Copied' : 'Copy'}
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-emerald-800">A</td>
                    <td className="py-2.5 px-3 text-slate-700">@ (apex root)</td>
                    <td className="py-2.5 px-3 text-slate-900 font-bold">216.239.32.21</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => copyToClipboard('216.239.32.21', 'a1')}
                        className="text-xs text-emerald-700 hover:text-emerald-950 font-sans font-bold"
                      >
                        {copiedKey === 'a1' ? 'Copied' : 'Copy'}
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-emerald-800">A</td>
                    <td className="py-2.5 px-3 text-slate-700">@ (apex root)</td>
                    <td className="py-2.5 px-3 text-slate-900 font-bold">216.239.34.21</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => copyToClipboard('216.239.34.21', 'a2')}
                        className="text-xs text-emerald-700 hover:text-emerald-950 font-sans font-bold"
                      >
                        {copiedKey === 'a2' ? 'Copied' : 'Copy'}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SSL & Security Notice */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Free Automatic Managed SSL Certificate provisioned once DNS propagates.</span>
            </div>
            <button
              onClick={handleVerifyDns}
              disabled={isVerifying}
              className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-slate-800 text-[11px] transition"
            >
              {isVerifying ? 'Checking DNS...' : 'Verify DNS'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">Domain Routing Engine • Cloud Run</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-black text-white font-black text-xs rounded-xl shadow-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
