/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  getSavedState, 
  saveState, 
  INITIAL_PROPERTIES, 
  INITIAL_TENANTS, 
  INITIAL_PAYMENTS, 
  INITIAL_SERVICE_REQUESTS 
} from './data';
import { 
  Property, 
  Tenant, 
  Payment, 
  ServiceRequest, 
  Persona, 
  OwnerScreen, 
  TenantScreen, 
  Unit 
} from './types';

// Importing Custom High-Fidelity Components
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import OwnerDashboard from './components/OwnerDashboard';
import PaymentTracker from './components/PaymentTracker';
import UnitConfiguration from './components/UnitConfiguration';
import TenantDashboard from './components/TenantDashboard';
import InvoiceView from './components/InvoiceView';

import { 
  Building, 
  Plus, 
  Trash2, 
  Wrench, 
  Send, 
  AlertCircle, 
  FileSpreadsheet, 
  ChevronRight, 
  HelpCircle,
  FileText,
  Home,
  CheckCircle,
  Info,
  Upload,
  Download
} from 'lucide-react';
import { INITIAL_UNITS } from './data';

export default function App() {
  // Theme & Identity States
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });
  const [user, setUser] = useState<{ email: string; persona: Persona } | null>(null);

  // Screen Routing States
  const [activeOwnerScreen, setActiveOwnerScreen] = useState<OwnerScreen>('dashboard');
  const [activeTenantScreen, setActiveTenantScreen] = useState<TenantScreen>('dashboard');

  // Core Entity States (With LocalStorage Persistence)
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);

  // Detailed Interactive States
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedUnitNumber, setSelectedUnitNumber] = useState<string | null>(null);
  const [selectedPaymentInvoice, setSelectedPaymentInvoice] = useState<Payment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal Triggers
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [showServiceRequestModal, setShowServiceRequestModal] = useState(false);

  // New Property Form States
  const [newPropName, setNewPropName] = useState('');
  const [newPropAddress, setNewPropAddress] = useState('');
  const [newPropUnits, setNewPropUnits] = useState(12);
  const [newPropRent, setNewPropRent] = useState(1800);

  // Service Request Form States
  const [srCategory, setSrCategory] = useState<'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'general'>('plumbing');
  const [srDescription, setSrDescription] = useState('');
  const [srPriority, setSrPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Load state on mount
  useEffect(() => {
    // Sync with saved state or fall back to INITIAL constants
    const savedProperties = getSavedState<Property[]>('properties', INITIAL_PROPERTIES);
    const savedUnits = getSavedState<Unit[]>('units', INITIAL_UNITS);
    const savedTenants = getSavedState<Tenant[]>('tenants', INITIAL_TENANTS);
    const savedPayments = getSavedState<Payment[]>('payments', INITIAL_PAYMENTS);
    const savedRequests = getSavedState<ServiceRequest[]>('service_requests', INITIAL_SERVICE_REQUESTS);

    setProperties(savedProperties);
    setUnits(savedUnits);
    setTenants(savedTenants);
    setPayments(savedPayments);
    setServiceRequests(savedRequests);
  }, []);

  // Sync theme changes with DOM and localStorage
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Save state on any change
  useEffect(() => {
    if (properties.length > 0) saveState('properties', properties);
  }, [properties]);

  useEffect(() => {
    if (units.length > 0) saveState('units', units);
  }, [units]);

  useEffect(() => {
    if (tenants.length > 0) saveState('tenants', tenants);
  }, [tenants]);

  useEffect(() => {
    if (payments.length > 0) saveState('payments', payments);
  }, [payments]);

  useEffect(() => {
    if (serviceRequests.length > 0) saveState('service_requests', serviceRequests);
  }, [serviceRequests]);

  // Toggle Dark/Light themes
  const handleThemeToggle = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Switch Logins
  const handleLogin = (persona: Persona, email: string) => {
    setUser({ email, persona });
    if (persona === 'owner') {
      setActiveOwnerScreen('dashboard');
    } else {
      setActiveTenantScreen('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Helper action: Update specific payment status
  const handleUpdatePaymentStatus = (id: string, status: 'Paid' | 'Overdue' | 'Pending' | 'Partial', datePaid?: string) => {
    setPayments(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status,
          datePaid: datePaid || p.datePaid
        };
      }
      return p;
    }));
  };

  // Helper action: Configure specific unit
  const handleSelectUnitConfig = (propertyId: string, unitNumber: string) => {
    setSelectedPropertyId(propertyId);
    setSelectedUnitNumber(unitNumber);
    setActiveOwnerScreen('configure-unit');
  };

  // Helper action: Save updated unit details back to property
  const handleSaveUnitConfig = (updatedUnit: Unit) => {
    setUnits(prev => prev.map(u => u.id === updatedUnit.id ? updatedUnit : u));
  };

  // Helper action: Add new property asset
  const handleAddPropertySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName || !newPropAddress) return;

    const propId = `prop-new-${Date.now()}`;

    // Generate basic mock units
    const mockUnits: Unit[] = Array.from({ length: 4 }).map((_, idx) => {
      const unitNum = `${idx + 1}0${idx + 1}`;
      const isOccupied = idx < 3; // 75% occupancy
      return {
        id: `u-${propId}-${unitNum}`,
        propertyId: propId,
        propertyName: newPropName,
        unitNumber: unitNum,
        bedrooms: idx % 2 === 0 ? 2 : 1,
        bathrooms: 1,
        sqft: idx % 2 === 0 ? 850 : 650,
        baseRent: newPropRent,
        utilities: [
          { id: `util-e-${unitNum}`, name: 'Electricity recovery', amount: 120 },
          { id: `util-g-${unitNum}`, name: 'Garbage & Recycling', amount: 25 }
        ],
        leaseDocs: [
          { name: `Lease_Agreement_${unitNum}.pdf`, size: '2.1 MB', date: 'Jul 12, 2023' }
        ],
        activeTenant: isOccupied ? {
          id: `t-${propId}-${unitNum}`,
          name: idx === 0 ? 'Elena Martinez' : idx === 1 ? 'John Doe' : 'Claire Smith',
          email: idx === 0 ? 'elena.m@provider.com' : 'john.d@provider.com',
          phone: '+1 (555) 012-3456',
          leaseStart: 'Oct 01, 2023',
          leaseEnd: 'Sept 30, 2024',
          status: 'Active' as const,
          unitNumber: unitNum,
          propertyName: newPropName
        } : undefined
      };
    });

    const newProperty: Property = {
      id: propId,
      name: newPropName,
      address: newPropAddress,
      unitsCount: newPropUnits,
      occupancyRate: 75,
      monthlyRevenue: newPropRent * 3 + 145 * 3, // based on 3 occupied units
      iconType: 'building'
    };

    setProperties([newProperty, ...properties]);
    setUnits(prev => [...prev, ...mockUnits]);
    setNewPropName('');
    setNewPropAddress('');
    setShowAddPropertyModal(false);
  };

  // Helper action: Create tenant service request
  const handleServiceRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!srDescription) return;

    const newRequest: ServiceRequest = {
      id: `sr-new-${Date.now()}`,
      title: `${srCategory.toUpperCase()} Service Request`,
      category: srCategory.toUpperCase(),
      description: srDescription,
      status: 'Pending',
      dateCreated: new Date().toISOString().split('T')[0]
    };

    setServiceRequests([newRequest, ...serviceRequests]);
    setSrDescription('');
    setShowServiceRequestModal(false);
    alert('Service Request submitted successfully! The building superintendent has been notified.');
  };

  // Helper view resolver: Get active unit details for configuration
  const activeConfiguringUnit = React.useMemo(() => {
    if (!selectedPropertyId || !selectedUnitNumber) return null;
    return units.find(u => u.propertyId === selectedPropertyId && u.unitNumber === selectedUnitNumber) || null;
  }, [units, selectedPropertyId, selectedUnitNumber]);

  // If user is not logged in, render beautiful auth splash
  if (!user) {
    return (
      <LoginScreen 
        onLogin={handleLogin} 
        theme={theme} 
        onThemeToggle={handleThemeToggle} 
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#fcf8fa] dark:bg-[#0f1418] text-[#1b1b1d] dark:text-[#dee3e8] font-sans transition-colors duration-300">
      
      {/* Sidebar Navigation */}
      <Sidebar
        persona={user.persona}
        activeOwnerScreen={activeOwnerScreen}
        activeTenantScreen={activeTenantScreen}
        onOwnerScreenChange={(scr) => {
          setActiveOwnerScreen(scr);
          setSearchQuery('');
        }}
        onTenantScreenChange={(scr) => {
          setActiveTenantScreen(scr);
          setSearchQuery('');
        }}
        onLogout={handleLogout}
        onGenerateReportClick={() => {
          if (user.persona === 'owner') {
            setActiveOwnerScreen('reports');
          }
        }}
        onServiceRequestClick={() => {
          setShowServiceRequestModal(true);
        }}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        
        {/* Header bar */}
        <Header
          persona={user.persona}
          onPersonaChange={(p) => {
            setUser({ email: user.email, persona: p });
            setSearchQuery('');
          }}
          theme={theme}
          onThemeToggle={handleThemeToggle}
          onAddPropertyClick={() => setShowAddPropertyModal(true)}
          onServiceRequestClick={() => setShowServiceRequestModal(true)}
          currentUserEmail={user.email}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Dynamic Screen View Router */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          
          <div className="max-w-6xl mx-auto space-y-8">
            
            {user.persona === 'owner' ? (
              // OWNER PERSONA SCREEN ROUTER
              <>
                {activeOwnerScreen === 'dashboard' && (
                  <OwnerDashboard
                    properties={properties}
                    tenants={tenants}
                    onSelectProperty={(id) => {
                      setSelectedPropertyId(id);
                      setSelectedUnitNumber('402'); // default demo unit
                      setActiveOwnerScreen('configure-unit');
                    }}
                    onOpenInvoice={(paymentId) => {
                      const pay = payments.find(p => p.id === paymentId);
                      if (pay) setSelectedPaymentInvoice(pay);
                    }}
                    onAddPropertyClick={() => setShowAddPropertyModal(true)}
                  />
                )}

                {activeOwnerScreen === 'properties' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Properties Registry</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage physical space structures, rooms, and lease agreements.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddPropertyModal(true)}
                        className="px-4 py-2 bg-slate-950 dark:bg-sky-400 hover:bg-slate-900 dark:hover:bg-sky-300 text-white dark:text-slate-950 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={14} /> Add Property
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {properties.map((prop) => (
                        <div key={prop.id} className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">{prop.name}</h3>
                              <p className="text-xxs font-semibold text-slate-400 uppercase mt-0.5">{prop.address}</p>
                            </div>
                            <span className="px-3 py-1 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-xxs font-bold rounded-full">
                              {prop.unitsCount} Units
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 dark:border-slate-800/60 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase block mb-1">Occupancy Rate</span>
                              <span className="text-slate-900 dark:text-white font-bold">{prop.occupancyRate}%</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase block mb-1">Projected Income</span>
                              <span className="text-emerald-500 font-bold font-sans">${prop.monthlyRevenue.toLocaleString()}</span>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xxs font-bold text-slate-400 uppercase mb-3 tracking-widest">Active Units</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {units.filter(u => u.propertyId === prop.id).map(unit => (
                                <button
                                  key={unit.unitNumber}
                                  type="button"
                                  onClick={() => handleSelectUnitConfig(prop.id, unit.unitNumber)}
                                  className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-150 dark:border-slate-800 text-left rounded-lg text-xs transition-colors flex justify-between items-center group cursor-pointer"
                                >
                                  <div>
                                    <p className="font-bold text-slate-800 dark:text-white">Unit {unit.unitNumber}</p>
                                    <p className="text-[10px] text-slate-400">{unit.activeTenant ? unit.activeTenant.name : 'Vacant'}</p>
                                  </div>
                                  <ChevronRight size={14} className="text-slate-300 group-hover:text-sky-400 transition-colors" />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeOwnerScreen === 'payments' && (
                  <PaymentTracker
                    payments={payments}
                    onUpdatePaymentStatus={handleUpdatePaymentStatus}
                    onOpenInvoice={(paymentId) => {
                      const pay = payments.find(p => p.id === paymentId);
                      if (pay) setSelectedPaymentInvoice(pay);
                    }}
                  />
                )}

                {activeOwnerScreen === 'reports' && (
                  <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 p-8 rounded-xl space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Compiled Financial Ledger Projections</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Select structured report and trigger ledger summaries.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                      {/* Report Card 1 */}
                      <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-sky-500/50 transition-colors cursor-pointer space-y-4">
                        <FileSpreadsheet className="text-sky-500" size={28} />
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Revenue Summary (XLS)</h3>
                          <p className="text-xxs text-slate-400 mt-1">A granular breakdown of rents and utilities recovery collected per block.</p>
                        </div>
                        <button type="button" onClick={() => alert("Simulating XLS compilation")} className="text-xs text-sky-500 font-bold hover:underline">Download XLS representation</button>
                      </div>

                      {/* Report Card 2 */}
                      <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-sky-500/50 transition-colors cursor-pointer space-y-4">
                        <FileText className="text-emerald-500" size={28} />
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Overdue Rental Balance (PDF)</h3>
                          <p className="text-xxs text-slate-400 mt-1">Identifies tenants that are over 10 days past due date with late charges.</p>
                        </div>
                        <button type="button" onClick={() => alert("Simulating PDF compilation")} className="text-xs text-sky-500 font-bold hover:underline">Download PDF representation</button>
                      </div>

                      {/* Report Card 3 */}
                      <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-sky-500/50 transition-colors cursor-pointer space-y-4">
                        <Wrench className="text-amber-500" size={28} />
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Maintenance Audit (PDF)</h3>
                          <p className="text-xxs text-slate-400 mt-1">Tracks capital expenditures, HVAC filter intervals, and on-site logs.</p>
                        </div>
                        <button type="button" onClick={() => alert("Simulating maintenance PDF compilation")} className="text-xs text-sky-500 font-bold hover:underline">Download PDF representation</button>
                      </div>
                    </div>
                  </div>
                )}

                {activeOwnerScreen === 'configure-unit' && activeConfiguringUnit && (
                  <UnitConfiguration
                    unit={activeConfiguringUnit}
                    onSave={handleSaveUnitConfig}
                    onClose={() => setActiveOwnerScreen('dashboard')}
                  />
                )}
              </>
            ) : (
              // TENANT PERSONA SCREEN ROUTER
              <>
                {activeTenantScreen === 'dashboard' && (
                  <TenantDashboard
                    onOpenInvoice={(id) => {
                      const pay = payments.find(p => p.id === id);
                      if (pay) setSelectedPaymentInvoice(pay);
                    }}
                    onOpenServiceRequest={() => {
                      setShowServiceRequestModal(true);
                    }}
                  />
                )}

                {activeTenantScreen === 'property-details' && (
                  <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    {/* Hero Banner */}
                    <div 
                      className="h-48 flex items-end p-6 select-none"
                      style={{
                        backgroundImage: 'linear-gradient(to top, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.1)), url("https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1000")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Oakwood Lofts</h2>
                        <p className="text-slate-300 text-xs mt-1">123 Maple Street, San Francisco, CA 94115</p>
                      </div>
                    </div>

                    {/* Description content */}
                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="md:col-span-2 space-y-6">
                        <div>
                          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white mb-3">About Oakwood Lofts</h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            Originally constructed in 1912, Oakwood Lofts features beautifully restored industrial masonry, exposed timber columns, concrete accent walls, and oversized dual-pane sash windows. Conveniently situated in lower Pacific Heights, residents enjoy quick access to tech shuttle routes, central transit links, grocery retailers, and boutique parks.
                          </p>
                        </div>

                        <div>
                          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white mb-3">Building Amenities</h3>
                          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                            <span className="flex items-center gap-2">✓ Restored Roof Garden & Sun deck</span>
                            <span className="flex items-center gap-2">✓ Controlled Access Bike Storage Room</span>
                            <span className="flex items-center gap-2">✓ Secure Keyless Salto Lock Entrance</span>
                            <span className="flex items-center gap-2">✓ On-site EV Charging Stations</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800 p-6 rounded-xl space-y-4">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Emergency Contacts</h3>
                        <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                          <div>
                            <span className="text-[10px] text-slate-400 block mb-0.5">EMERGENCY HOTLINE</span>
                            <span className="text-slate-900 dark:text-white font-bold">1-800-555-LOFT</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block mb-0.5">ON-SITE SUPERINTENDENT</span>
                            <span className="text-slate-900 dark:text-white font-bold">Marcus Thompson (Unit 101)</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block mb-0.5">FIRE / POLICE EMERGENCY</span>
                            <span className="text-red-500 font-bold">Dial 911</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTenantScreen === 'payments' && (
                  <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Payment Ledger Statement</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Review historical billing, auto-pay debits, and printable ledger statements.</p>
                    </div>

                    <div className="overflow-x-auto border border-slate-150 dark:border-slate-800 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                            <th className="px-6 py-3">BILLING ITEM</th>
                            <th className="px-6 py-3">DATE PAID</th>
                            <th className="px-6 py-3">METHOD</th>
                            <th className="px-6 py-3 text-right">AMOUNT PAID</th>
                            <th className="px-6 py-3 text-center">RECEIPT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs font-semibold">
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">September Rent</td>
                            <td className="px-6 py-4 text-slate-500">Sept 02, 2023</td>
                            <td className="px-6 py-4 text-slate-600">Bank ACH (...8829)</td>
                            <td className="px-6 py-4 text-right font-mono font-bold">$2,450.00</td>
                            <td className="px-6 py-4 text-center">
                              <button type="button" onClick={() => setSelectedPaymentInvoice(payments[1])} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xxs font-bold uppercase">View Statement</button>
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">August Rent</td>
                            <td className="px-6 py-4 text-slate-500">Aug 01, 2023</td>
                            <td className="px-6 py-4 text-slate-600">Bank ACH (...8829)</td>
                            <td className="px-6 py-4 text-right font-mono font-bold">$2,450.00</td>
                            <td className="px-6 py-4 text-center">
                              <button type="button" onClick={() => setSelectedPaymentInvoice(payments[2])} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xxs font-bold uppercase">View Statement</button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTenantScreen === 'documents' && (
                  <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 p-8 rounded-xl space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Lease Agreements & Vault Docs</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Review critical documents, sign lease updates, or upload renters insurance policies.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => alert("Simulating document file upload picker")}
                        className="px-4 py-2 bg-slate-950 dark:bg-sky-400 hover:bg-slate-900 dark:hover:bg-sky-300 text-white dark:text-slate-950 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload size={14} /> Upload Vault Doc
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      {/* Doc 1 */}
                      <div className="p-4 border border-slate-150 dark:border-slate-800 rounded-lg flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <FileText size={24} className="text-sky-500" />
                          <div>
                            <p className="font-bold text-xs text-slate-900 dark:text-white">Master Lease Agreement.pdf</p>
                            <p className="text-xxs text-slate-400">PDF • 2.4 MB • Signed Jul 12, 2023</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => alert("Downloading document...")} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded"><Download size={16} /></button>
                      </div>

                      {/* Doc 2 */}
                      <div className="p-4 border border-slate-150 dark:border-slate-800 rounded-lg flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <FileText size={24} className="text-sky-500" />
                          <div>
                            <p className="font-bold text-xs text-slate-900 dark:text-white">Building Rules & Regulations.pdf</p>
                            <p className="text-xxs text-slate-400">PDF • 1.1 MB • Signed Jul 12, 2023</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => alert("Downloading document...")} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded"><Download size={16} /></button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Help Center Accordion Sub-View */}
            {((user.persona === 'owner' && activeOwnerScreen === 'help') || 
              (user.persona === 'tenant' && activeTenantScreen === 'help')) && (
              <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 p-8 rounded-xl space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Support & Help Center</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Frequently asked questions regarding utilities, invoices, and service requests.</p>
                </div>

                <div className="space-y-4 pt-4 text-xs font-semibold">
                  {/* Q1 */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-150 dark:border-slate-800">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <HelpCircle size={14} className="text-sky-500" /> How do I update utility pricing?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                      Owners can navigate to any unit's configuration screen, edit the individual utility entries, or click "+ Add Utility" to establish new rates. These will update total monthly projection figures in real-time.
                    </p>
                  </div>

                  {/* Q2 */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-150 dark:border-slate-800">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <HelpCircle size={14} className="text-sky-500" /> How are utility charges billed to tenants?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                      Utility recoveries are appended directly to the monthly rental statement. Invoices dynamically render the line-item breakdowns for clear, audit-compliant resident disclosures.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </main>
      </div>

      {/* Invoice Statement Modal */}
      {selectedPaymentInvoice && (
        <InvoiceView
          payment={selectedPaymentInvoice}
          onClose={() => setSelectedPaymentInvoice(null)}
        />
      )}

      {/* Add Property Modal */}
      {showAddPropertyModal && (
        <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Create New Asset Block</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Add a new physical property block to your administrative registry index.</p>

            <form onSubmit={handleAddPropertySubmit} className="space-y-4 mt-6">
              <div>
                <label htmlFor="new-property-name" className="block text-[10px] font-bold text-slate-400 uppercase">PROPERTY NAME</label>
                <input
                  id="new-property-name"
                  type="text"
                  required
                  placeholder="e.g. Grandview Lofts"
                  value={newPropName}
                  onChange={(e) => setNewPropName(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                />
              </div>

              <div>
                <label htmlFor="new-property-address" className="block text-[10px] font-bold text-slate-400 uppercase">STREET ADDRESS</label>
                <input
                  id="new-property-address"
                  type="text"
                  required
                  placeholder="e.g. 789 Grandview Ave, San Francisco"
                  value={newPropAddress}
                  onChange={(e) => setNewPropAddress(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="new-property-units" className="block text-[10px] font-bold text-slate-400 uppercase">UNITS COUNT</label>
                  <input
                    id="new-property-units"
                    type="number"
                    required
                    min="1"
                    value={newPropUnits}
                    onChange={(e) => setNewPropUnits(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="new-property-rent" className="block text-[10px] font-bold text-slate-400 uppercase">MONTHLY BASE RENT ($)</label>
                  <input
                    id="new-property-rent"
                    type="number"
                    required
                    min="100"
                    value={newPropRent}
                    onChange={(e) => setNewPropRent(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-sky-500 text-slate-950 font-bold rounded-lg hover:bg-sky-400 text-xs uppercase tracking-wider"
                >
                  Create Property Asset
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddPropertyModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 text-xs font-bold uppercase"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service Request Modal */}
      {showServiceRequestModal && (
        <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Create Service Ticket</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Describe the maintenance issue and alert superintendent.</p>

            <form onSubmit={handleServiceRequestSubmit} className="space-y-4 mt-6">
              <div>
                <label htmlFor="service-request-category" className="block text-[10px] font-bold text-slate-400 uppercase">ISSUE CATEGORY</label>
                <select
                  id="service-request-category"
                  value={srCategory}
                  onChange={(e) => setSrCategory(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs"
                >
                  <option value="plumbing">Plumbing (Leak, drain, faucet)</option>
                  <option value="electrical">Electrical (Outlet, light, breaker)</option>
                  <option value="hvac">HVAC / Heating & AC</option>
                  <option value="appliance">Kitchen Appliance</option>
                  <option value="general">General Building Maintenance</option>
                </select>
              </div>

              <div>
                <label htmlFor="service-request-description" className="block text-[10px] font-bold text-slate-400 uppercase">DETAILED DESCRIPTION</label>
                <textarea
                  id="service-request-description"
                  required
                  rows={3}
                  placeholder="e.g. Toilet is constantly running water and tank fill is noisy."
                  value={srDescription}
                  onChange={(e) => setSrDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="service-request-priority" className="block text-[10px] font-bold text-slate-400 uppercase">PRIORITY LEVEL</label>
                <select
                  id="service-request-priority"
                  value={srPriority}
                  onChange={(e) => setSrPriority(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs"
                >
                  <option value="low">Low (General convenience check-up)</option>
                  <option value="medium">Medium (Requires attention in 48 hrs)</option>
                  <option value="high">High (Urgent damage/leak hazard)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-500 text-xs uppercase tracking-wider"
                >
                  Submit Service Ticket
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowServiceRequestModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 text-xs font-bold uppercase"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
