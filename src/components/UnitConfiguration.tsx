/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Trash2, 
  Plus, 
  Mail, 
  Phone, 
  Calendar, 
  Download, 
  MessageSquare, 
  MapPin, 
  FileText,
  Check,
  Eye
} from 'lucide-react';
import { Unit, UtilityItem } from '../types';

interface UnitConfigurationProps {
  unit: Unit;
  onSave: (updatedUnit: Unit) => void;
  onClose: () => void;
}

export default function UnitConfiguration({
  unit,
  onSave,
  onClose,
}: UnitConfigurationProps) {
  
  // Local States mirroring Unit fields
  const [baseRent, setBaseRent] = useState<number>(unit.baseRent);
  const [utilities, setUtilities] = useState<UtilityItem[]>(unit.utilities);
  const [newUtilityName, setNewUtilityName] = useState('');
  const [newUtilityAmount, setNewUtilityAmount] = useState<number>(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Sync state if unit changes
  useEffect(() => {
    setBaseRent(unit.baseRent);
    setUtilities(unit.utilities);
    setSaveSuccess(false);
  }, [unit]);

  // Calculations
  const totalUtilities = utilities.reduce((sum, u) => sum + u.amount, 0);
  const totalProjection = baseRent + totalUtilities;

  // Handlers
  const handleAddUtility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUtilityName || newUtilityAmount <= 0) return;
    
    const newItem: UtilityItem = {
      id: `util-new-${Date.now()}`,
      name: newUtilityName,
      amount: newUtilityAmount,
    };

    setUtilities([...utilities, newItem]);
    setNewUtilityName('');
    setNewUtilityAmount(0);
    setShowAddForm(false);
  };

  const handleDeleteUtility = (id: string) => {
    setUtilities(utilities.filter(u => u.id !== id));
  };

  const handleSave = () => {
    const updated: Unit = {
      ...unit,
      baseRent,
      utilities,
    };
    onSave(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/50 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            <span>Properties</span>
            <span>&gt;</span>
            <span>{unit.propertyName}</span>
            <span>&gt;</span>
            <span className="text-slate-600 dark:text-slate-400">Unit {unit.unitNumber}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Unit {unit.unitNumber} Configuration
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            {unit.propertyName} • {unit.bedrooms} Bedroom / {unit.bathrooms} Bath • {unit.sqft} sq ft
          </p>
        </div>

        {/* Buttons top right */}
        <div className="flex gap-2">
          <button
            id="btn-view-photos"
            type="button"
            onClick={() => setShowPhotoModal(true)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
          >
            <Eye size={14} />
            View Unit Photos
          </button>
          
          <button
            id="btn-save-configuration"
            type="button"
            onClick={handleSave}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              saveSuccess 
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-950 hover:bg-slate-900 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950'
            }`}
          >
            {saveSuccess ? (
              <>
                <Check size={14} /> Saved!
              </>
            ) : (
              'Save Configuration'
            )}
          </button>
        </div>
      </div>

      {/* Main double column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Financial Configuration (occupies 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-6 pb-2 border-b border-slate-100 dark:border-slate-800/60">
              Financial Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-6">
                
                {/* Rent Field */}
                <div>
                  <label htmlFor="base-monthly-rent" className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                    BASE MONTHLY RENT
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <DollarSign size={14} />
                    </span>
                    <input
                      id="base-monthly-rent"
                      type="number"
                      value={baseRent}
                      onChange={(e) => setBaseRent(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    />
                  </div>
                  <p className="text-xxs text-slate-400 mt-2 font-medium">
                    Standard market rate for similar {unit.bedrooms}BR units: $1,900
                  </p>
                </div>

                {/* Separator Notice Box */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-xxs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">ℹ️ Notice:</span>
                  Base rent covers living space only. Utilities and premiums are calculated separately below and added to monthly ledger invoices.
                </div>
              </div>

              {/* Projection Box */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 p-6 rounded-xl flex flex-col justify-between h-full">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    TOTAL MONTHLY PROJECTION
                  </span>
                  <p className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-2 font-sans">
                    ${totalProjection.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="border-t border-slate-200/60 dark:border-slate-800 pt-4 mt-4 space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Base Rent</span>
                    <span className="font-mono text-slate-900 dark:text-white">${baseRent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Selected Utilities</span>
                    <span className="font-mono text-slate-900 dark:text-white">${totalUtilities.toLocaleString()}</span>
                  </div>
                </div>
                <button
                  id="btn-generate-next-bill"
                  type="button"
                  onClick={() => {
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 2000);
                  }}
                  className="w-full mt-6 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-850 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Generate Next Bill
                </button>
              </div>

            </div>

            {/* Utilities and Add-ons Sub-list */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/60">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Utilities & Add-ons
                </h4>
                
                {!showAddForm && (
                  <button
                    id="btn-add-utility-toggle"
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="text-xs text-sky-500 hover:text-sky-400 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> Add Utility or Fee
                  </button>
                )}
              </div>

              {/* Inline Add Utility Form */}
              {showAddForm && (
                <form onSubmit={handleAddUtility} className="mb-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[120px]">
                    <label htmlFor="new-utility-name" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">NAME</label>
                    <input
                      id="new-utility-name"
                      type="text"
                      required
                      placeholder="e.g. Water & Sewage"
                      value={newUtilityName}
                      onChange={(e) => setNewUtilityName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs focus:outline-none"
                    />
                  </div>
                  <div className="w-24">
                    <label htmlFor="new-utility-amount" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">AMOUNT ($)</label>
                    <input
                      id="new-utility-amount"
                      type="number"
                      required
                      min="1"
                      value={newUtilityAmount || ''}
                      onChange={(e) => setNewUtilityAmount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-1.5 bg-sky-500 text-white rounded text-xs font-bold hover:bg-sky-400">Add</button>
                    <button type="button" onClick={() => setShowAddForm(false)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs">Cancel</button>
                  </div>
                </form>
              )}

              {/* Interactive utilities list */}
              <div className="space-y-2 max-w-md">
                {utilities.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex justify-between items-center p-3 border border-slate-150 dark:border-slate-800 rounded-lg"
                  >
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      <span>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-xs text-slate-950 dark:text-white">${item.amount}</span>
                      <button
                        id={`btn-delete-utility-${item.id}`}
                        type="button"
                        onClick={() => handleDeleteUtility(item.id)}
                        className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded transition-colors"
                        title="Delete utility"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {utilities.length === 0 && (
                  <p className="text-xxs font-semibold text-slate-400 uppercase tracking-wider py-2">
                    No active utilities or add-on premiums configured.
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Right column: Active Tenant and Lease Docs */}
        <div className="space-y-6">
          
          {/* Tenant block */}
          {unit.activeTenant ? (
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                ACTIVE TENANT
              </h3>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-extrabold flex items-center justify-center text-sm">
                  {unit.activeTenant.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {unit.activeTenant.name}
                  </h4>
                  <p className="text-xxs font-semibold text-slate-400 uppercase tracking-wide">
                    Lease: Premium Resident
                  </p>
                </div>
              </div>

              {/* Metadata block */}
              <div className="space-y-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 border-t border-b border-slate-100 dark:border-slate-800/60 py-4 mb-4">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-slate-400 shrink-0" />
                  <span className="truncate">{unit.activeTenant.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400 shrink-0" />
                  <span>{unit.activeTenant.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400 shrink-0" />
                  <span>{unit.activeTenant.leaseStart} - {unit.activeTenant.leaseEnd}</span>
                </div>
              </div>

              {/* Action */}
              <button
                id="btn-message-tenant"
                type="button"
                onClick={() => alert(`Opening messenger proxy with ${unit.activeTenant?.name}`)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare size={14} />
                Message Tenant
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm text-center">
              <h3 className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 text-left">
                ACTIVE TENANT
              </h3>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No active tenant occupied</p>
              <button type="button" className="mt-3 text-xs bg-sky-500 text-white font-bold px-4 py-2 rounded">
                Assign Lease
              </button>
            </div>
          )}

          {/* Lease Documents block */}
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
              LEASE DOCUMENTS
            </h3>
            
            <div className="space-y-2.5">
              {unit.leaseDocs?.map((doc, idx) => (
                <div 
                  key={idx} 
                  className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all cursor-pointer"
                  onClick={() => alert(`Downloading lease document: ${doc.name}`)}
                >
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-slate-400" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                        {doc.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        PDF • {doc.size} • Signed {doc.date}
                      </p>
                    </div>
                  </div>
                  <span className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 rounded transition-colors shrink-0">
                    <Download size={14} />
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Location mock Map */}
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <h3 className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <MapPin size={12} className="text-sky-500" /> LOCATION MAP
            </h3>

            {/* Custom stylized vector mock map of Alcatraz/Golden Gate bridge area */}
            <div className="relative h-44 rounded-lg bg-[#b6e2f7] dark:bg-[#131b2e] border border-slate-100 dark:border-slate-800 overflow-hidden select-none">
              
              {/* Landmass shapes */}
              <div className="absolute top-2 left-2 right-4 bottom-12 bg-[#ebf7ee] dark:bg-[#0f172a] rounded-lg opacity-80" />
              <div className="absolute bottom-0 left-0 right-16 h-12 bg-[#ebf7ee] dark:bg-[#0f172a] rounded-t-xl opacity-80" />
              
              {/* Grid Roads */}
              <div className="absolute top-8 left-0 right-0 h-1 bg-white dark:bg-slate-800 opacity-60" />
              <div className="absolute top-20 left-0 right-0 h-1 bg-white dark:bg-slate-800 opacity-60" />
              <div className="absolute bottom-6 left-0 right-0 h-1 bg-white dark:bg-slate-800 opacity-60" />
              <div className="absolute top-0 bottom-0 left-12 w-1 bg-white dark:bg-slate-800 opacity-60" />
              <div className="absolute top-0 bottom-0 left-36 w-1 bg-white dark:bg-slate-800 opacity-60" />
              <div className="absolute top-0 bottom-0 left-52 w-1 bg-white dark:bg-slate-800 opacity-60" />
              
              {/* Golden Gate Bridge representation (Orange line) */}
              <div className="absolute top-0 bottom-0 right-8 w-2 bg-[#ff5a36] opacity-90 rounded-md" />
              <span className="absolute top-4 right-1 text-[8px] font-bold text-[#ff5a36] bg-white/90 dark:bg-slate-900/90 px-1 py-0.5 rounded rotate-90">
                Golden Gate
              </span>

              {/* Water Label */}
              <span className="absolute bottom-8 right-16 text-[9px] font-extrabold text-[#3a84cf] dark:text-sky-600 uppercase tracking-wider">
                Sausalito Bay
              </span>

              {/* Active Locator Pointer PIN */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="px-2 py-1 bg-slate-950 dark:bg-sky-400 text-white dark:text-slate-950 text-[9px] font-extrabold rounded-md shadow-lg border border-slate-700/20 whitespace-nowrap relative z-10">
                  {unit.unitNumber} MAPLE ST, SF
                </div>
                <div className="w-2.5 h-2.5 bg-slate-950 dark:bg-sky-400 rounded-full border-2 border-white dark:border-slate-900 -mt-0.5 relative z-10 animate-ping" />
                <div className="w-2.5 h-2.5 bg-slate-950 dark:bg-sky-400 rounded-full border-2 border-white dark:border-slate-900 -mt-2.5 relative z-10" />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Photo gallery modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-6 z-50 animate-in fade-in duration-250">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white">Unit {unit.unitNumber} Interior Photos</h3>
              <button type="button" onClick={() => setShowPhotoModal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1 rounded">CLOSE</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600" alt="living room" className="rounded-lg object-cover h-40 w-full" />
              <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=600" alt="kitchen" className="rounded-lg object-cover h-40 w-full" />
            </div>
            <p className="text-xxs text-slate-400 mt-4">Demo assets fetched from secure CDN workspace representation.</p>
          </div>
        </div>
      )}

    </div>
  );
}
