/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  CheckCircle2, 
  Zap, 
  Clock, 
  FileText, 
  Download, 
  Upload, 
  Share2, 
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  Building
} from 'lucide-react';
import { Payment } from '../types';

interface TenantDashboardProps {
  onOpenInvoice: (id: string) => void;
  onOpenServiceRequest: () => void;
}

export default function TenantDashboard({
  onOpenInvoice,
  onOpenServiceRequest
}: TenantDashboardProps) {
  
  // Interactive States
  const [balanceOutstanding, setBalanceOutstanding] = useState<number>(2450.00);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'ach' | 'card'>('ach');
  const [referralCopied, setReferralCopied] = useState(false);
  
  // Prepopulated payments
  const [recentPayments, setRecentPayments] = useState([
    { id: 't-pay-1', title: 'September Rent', date: 'Sept 02, 2023', method: 'ACH', amount: 2450.00 },
    { id: 't-pay-2', title: 'August Rent', date: 'Aug 01, 2023', method: 'ACH', amount: 2450.00 },
    { id: 't-pay-3', title: 'Move-in Deposit', date: 'July 15, 2023', method: 'Credit Card', amount: 3000.00 },
  ]);

  // Handle Rent payment simulation
  const handlePayRentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentSuccess(true);
    
    setTimeout(() => {
      // Add transaction
      const newPay = {
        id: `t-pay-new-${Date.now()}`,
        title: 'October Rent',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        method: activeTab === 'ach' ? 'Bank ACH' : 'Credit Card',
        amount: balanceOutstanding
      };
      setRecentPayments([newPay, ...recentPayments]);
      setBalanceOutstanding(0);
      setShowPayModal(false);
      setPaymentSuccess(false);
    }, 1500);
  };

  const copyReferralLink = () => {
    setReferralCopied(true);
    navigator.clipboard?.writeText('https://promanagepro.com/refer/oakwood-lofts-402');
    setTimeout(() => {
      setReferralCopied(false);
    }, 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Welcome & Top Res Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <span className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
            WELCOME BACK, ALEX
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Tenant Dashboard
          </h2>
        </div>

        {/* Current Residence Widget */}
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl">
          <Building size={16} className="text-sky-500" />
          <div className="text-left">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">CURRENT RESIDENCE</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Oakwood Lofts, Unit 402</span>
          </div>
        </div>
      </div>

      {/* Hero row: Rent outstanding, Balance & status panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pay Rent block */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row justify-between gap-4 items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">NEXT RENT DUE</span>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">October 1st, 2023</p>
              
              <div className="mt-4">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">TOTAL BALANCE OUTSTANDING</span>
                <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight font-sans">
                  ${balanceOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Action */}
            {balanceOutstanding > 0 ? (
              <button
                id="btn-pay-rent"
                type="button"
                onClick={() => setShowPayModal(true)}
                className="w-full sm:w-auto px-6 py-3 bg-slate-950 hover:bg-slate-900 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-4 sm:mt-0"
              >
                <CreditCard size={14} />
                Pay Rent
              </button>
            ) : (
              <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold rounded-lg flex items-center gap-1.5 self-start">
                <CheckCircle2 size={16} />
                Paid / Balance Clear
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xxs font-semibold text-slate-500 dark:text-slate-400 gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Auto-pay is Active</span>
            </div>
            <span>Last payment: Sept 02, 2023</span>
            <a href="#payment-methods" className="text-sky-500 hover:underline">
              Manage Payment Methods
            </a>
          </div>

        </div>

        {/* Right mini KPI widgets */}
        <div className="flex flex-col gap-4">
          {/* KPI 1: Active Requests */}
          <div 
            onClick={onOpenServiceRequest}
            className="flex-1 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center justify-between group cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">ACTIVE REQUESTS</span>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">0 Pending</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-500">
              <Zap size={20} />
            </div>
          </div>

          {/* KPI 2: Lease Status */}
          <div className="flex-1 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">LEASE STATUS</span>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">9 Months Left</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/20 flex items-center justify-center text-sky-500">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Grid: Recent Payments & Lease Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recent Payments Panel */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Payments
              </h3>
              <span className="text-[10px] font-bold text-sky-500 hover:underline uppercase cursor-pointer">
                VIEW HISTORY
              </span>
            </div>

            <div className="space-y-3.5">
              {recentPayments.map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => onOpenInvoice('pay-5')} // Trigger receipt
                  className="flex justify-between items-center p-2.5 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30 rounded-lg cursor-pointer transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
                        {p.title}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                        {p.date} • Paid via {p.method}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                    ${p.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lease Documents panel */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Lease Documents
              </h3>
              <span className="text-[10px] font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 uppercase cursor-pointer flex items-center gap-1">
                <Upload size={12} /> UPLOAD NEW
              </span>
            </div>

            <div className="space-y-3">
              {/* Document 1 */}
              <div className="flex justify-between items-center p-2 rounded-lg border border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText size={16} className="text-slate-400" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">Master Lease Agreement</p>
                    <p className="text-[10px] text-slate-400 font-medium">PDF • 2.4 MB • Signed Jul 12, 2023</p>
                  </div>
                </div>
                <span className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 rounded transition-colors shrink-0">
                  <Download size={14} />
                </span>
              </div>

              {/* Document 2 */}
              <div className="flex justify-between items-center p-2 rounded-lg border border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText size={16} className="text-slate-400" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">Building Rules & Regs</p>
                    <p className="text-[10px] text-slate-400 font-medium">PDF • 1.1 MB • Updated Jan 2023</p>
                  </div>
                </div>
                <span className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 rounded transition-colors shrink-0">
                  <Download size={14} />
                </span>
              </div>

              {/* Document 3 */}
              <div className="flex justify-between items-center p-2 rounded-lg border border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText size={16} className="text-slate-400" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">Insurance Certificate</p>
                    <p className="text-[10px] text-slate-400 font-medium">JPG • 450 KB • Valid thru Jul 2024</p>
                  </div>
                </div>
                <span className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 rounded transition-colors shrink-0">
                  <Download size={14} />
                </span>
              </div>
            </div>
          </div>
          
          <button
            id="btn-upload-new-doc"
            type="button"
            onClick={() => alert("Simulating document file explorer picker")}
            className="w-full mt-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-center cursor-pointer"
          >
            Upload New Document
          </button>
        </div>

      </div>

      {/* Promo Banner: Refer a Neighbor */}
      <div 
        className="rounded-xl border border-slate-250 dark:border-slate-800 p-8 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden select-none transition-all hover:shadow-md cursor-pointer"
        style={{
          backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.85)), url("https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1000")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        onClick={copyReferralLink}
      >
        <div className="text-center md:text-left relative z-10 space-y-1">
          <h4 className="text-xl font-extrabold text-white tracking-tight">Refer a Neighbor</h4>
          <p className="text-slate-300 text-xs">
            Get $500 off your next month's rent when a friend signs a lease at Oakwood Lofts.
          </p>
        </div>

        <button
          id="btn-referral-link"
          type="button"
          className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all relative z-10 bg-sky-400 hover:bg-sky-300 text-slate-950 flex items-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <Share2 size={14} />
          {referralCopied ? 'Link Copied!' : 'Get Referral Link'}
        </button>
      </div>

      {/* Pay Rent Dialog Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden shadow-2xl relative">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Pay Rent Ledger</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Specify payment type and complete securely.</p>

              <div className="my-6 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 rounded-lg flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase">Amount Due</span>
                <span className="text-xl font-black text-slate-950 dark:text-white">${balanceOutstanding.toLocaleString()}</span>
              </div>

              {/* Tabs for payment method */}
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded mb-4 text-xs font-semibold">
                <button 
                  type="button" 
                  onClick={() => setActiveTab('ach')}
                  className={`flex-1 py-1.5 rounded transition-colors ${activeTab === 'ach' ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white font-bold shadow-xs' : 'text-slate-500'}`}
                >
                  Bank ACH Transfer
                </button>
                <button 
                  type="button" 
                  onClick={() => setActiveTab('card')}
                  className={`flex-1 py-1.5 rounded transition-colors ${activeTab === 'card' ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white font-bold shadow-xs' : 'text-slate-500'}`}
                >
                  Credit / Debit Card
                </button>
              </div>

              <form onSubmit={handlePayRentSubmit} className="space-y-4">
                {activeTab === 'ach' ? (
                  <>
                    <div>
                      <label htmlFor="ach-routing" className="block text-[10px] font-bold text-slate-400 uppercase">ROUTING NUMBER</label>
                      <input id="ach-routing" type="text" required placeholder="123456789" className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs" />
                    </div>
                    <div>
                      <label htmlFor="ach-account" className="block text-[10px] font-bold text-slate-400 uppercase">ACCOUNT NUMBER</label>
                      <input id="ach-account" type="text" required placeholder="00012345678" className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs" />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label htmlFor="card-number" className="block text-[10px] font-bold text-slate-400 uppercase">CARD NUMBER</label>
                      <input id="card-number" type="text" required placeholder="4111 2222 3333 4444" className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="card-exp" className="block text-[10px] font-bold text-slate-400 uppercase">EXPIRATION</label>
                        <input id="card-exp" type="text" required placeholder="MM/YY" className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs" />
                      </div>
                      <div>
                        <label htmlFor="card-cvv" className="block text-[10px] font-bold text-slate-400 uppercase">CVV</label>
                        <input id="card-cvv" type="text" required placeholder="123" className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs" />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="submit" 
                    className="flex-1 py-2.5 bg-sky-500 text-slate-950 font-bold rounded hover:bg-sky-400 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    {paymentSuccess ? 'Processing...' : 'Authorize Payment'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowPayModal(false)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 text-xs uppercase font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
