/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, initialAuthLinkType } from './lib/supabaseClient';
import { listProperties, createProperty } from './lib/api/properties';
import { listUnitsWithDetails, createUnit, updateUnit } from './lib/api/units';
import { listActiveLeasesAsTenants } from './lib/api/leases';
import { listPayments, updatePaymentStatus } from './lib/api/payments';
import { listServiceRequests, createServiceRequest } from './lib/api/serviceRequests';
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
import SessionTimeoutWarning from './components/SessionTimeoutWarning';
import ResetPasswordScreen from './components/ResetPasswordScreen';
import AcceptInviteScreen from './components/AcceptInviteScreen';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { AUTH_NOTICE_KEY } from './lib/authNotice';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import OwnerDashboard from './components/OwnerDashboard';
import PaymentTracker from './components/PaymentTracker';
import UnitConfiguration from './components/UnitConfiguration';
import TenantDashboard from './components/TenantDashboard';
import InvoiceView from './components/InvoiceView';
import SettingsScreen from './components/SettingsScreen';

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

export default function App() {
  // Theme & Identity States
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });
  const [user, setUser] = useState<{ email: string; fullName: string | null; persona: Persona } | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [showAcceptInvite, setShowAcceptInvite] = useState(() => initialAuthLinkType === 'invite');
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

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
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [addUnitPropertyId, setAddUnitPropertyId] = useState<string | null>(null);

  // New Property Form States
  const [newPropName, setNewPropName] = useState('');
  const [newPropAddress, setNewPropAddress] = useState('');
  const [newPropUnits, setNewPropUnits] = useState(12);

  // New Unit Form States
  const [newUnitNumber, setNewUnitNumber] = useState('');
  const [newUnitBedrooms, setNewUnitBedrooms] = useState(1);
  const [newUnitBathrooms, setNewUnitBathrooms] = useState(1);
  const [newUnitSqft, setNewUnitSqft] = useState(600);
  const [newUnitBaseRent, setNewUnitBaseRent] = useState(1500);

  // Service Request Form States
  const [srCategory, setSrCategory] = useState<'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'general'>('plumbing');
  const [srDescription, setSrDescription] = useState('');
  const [srPriority, setSrPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Restore/track the Supabase auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Resolve the signed-in session into a persona via the profiles table
  const refetchProfile = React.useCallback((currentSession: Session) => {
    return supabase
      .from('profiles')
      .select('role, email, full_name')
      .eq('id', currentSession.user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          console.error('Failed to load profile for signed-in user', error);
          setUser(null);
          return;
        }
        setUser({
          email: data.email ?? currentSession.user.email ?? '',
          fullName: data.full_name,
          persona: data.role === 'admin' ? 'owner' : 'tenant',
        });
      });
  }, []);

  useEffect(() => {
    if (!session) {
      setUser(null);
      return;
    }
    setProfileLoading(true);
    refetchProfile(session).finally(() => setProfileLoading(false));
  }, [session, refetchProfile]);

  // Fetch all entity data from Supabase once the signed-in user is resolved
  const refetchAll = React.useCallback(async () => {
    setDataLoading(true);
    try {
      const [propertiesData, unitsData, tenantsData, paymentsData, serviceRequestsData] = await Promise.all([
        listProperties(),
        listUnitsWithDetails(),
        listActiveLeasesAsTenants(),
        listPayments(),
        listServiceRequests(),
      ]);
      setProperties(propertiesData);
      setUnits(unitsData);
      setTenants(tenantsData);
      setPayments(paymentsData);
      setServiceRequests(serviceRequestsData);
    } catch (err) {
      console.error('Failed to load data from Supabase', err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setProperties([]);
      setUnits([]);
      setTenants([]);
      setPayments([]);
      setServiceRequests([]);
      return;
    }
    refetchAll();
  }, [user, refetchAll]);

  // Sync theme changes with DOM and localStorage
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Toggle Dark/Light themes
  const handleThemeToggle = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSessionTimeout = React.useCallback(() => {
    sessionStorage.setItem(AUTH_NOTICE_KEY, 'inactivity');
    supabase.auth.signOut();
  }, []);

  const { secondsRemaining, stayActive } = useSessionTimeout(!!session, handleSessionTimeout);

  // Helper action: Update specific payment status
  const handleUpdatePaymentStatus = async (id: string, status: 'Paid' | 'Overdue' | 'Pending' | 'Partial', datePaid?: string) => {
    try {
      await updatePaymentStatus(id, status, datePaid);
      const freshPayments = await listPayments();
      setPayments(freshPayments);
    } catch (err) {
      console.error('Failed to update payment status', err);
      alert('Could not update payment status. Please try again.');
    }
  };

  // Helper action: Configure specific unit
  const handleSelectUnitConfig = (propertyId: string, unitNumber: string) => {
    setSelectedPropertyId(propertyId);
    setSelectedUnitNumber(unitNumber);
    setActiveOwnerScreen('configure-unit');
  };

  // Helper action: Save updated unit details back to property
  const handleSaveUnitConfig = async (updatedUnit: Unit) => {
    try {
      await updateUnit(updatedUnit.id, { baseRent: updatedUnit.baseRent, utilities: updatedUnit.utilities });
      const freshUnits = await listUnitsWithDetails();
      setUnits(freshUnits);
    } catch (err) {
      console.error('Failed to save unit configuration', err);
      alert('Could not save unit changes. Please try again.');
    }
  };

  // Helper action: Add new property asset
  const handleAddPropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName || !newPropAddress) return;

    try {
      await createProperty({ name: newPropName, address: newPropAddress, unitsCount: newPropUnits });
      const freshProperties = await listProperties();
      setProperties(freshProperties);
      setNewPropName('');
      setNewPropAddress('');
      setShowAddPropertyModal(false);
    } catch (err) {
      console.error('Failed to create property', err);
      alert('Could not create property. Please try again.');
    }
  };

  // Helper action: Add a new unit to a property
  const handleAddUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUnitPropertyId || !newUnitNumber) return;

    try {
      await createUnit(addUnitPropertyId, {
        unitNumber: newUnitNumber,
        bedrooms: newUnitBedrooms,
        bathrooms: newUnitBathrooms,
        sqft: newUnitSqft,
        baseRent: newUnitBaseRent,
      });
      const [freshUnits, freshProperties] = await Promise.all([listUnitsWithDetails(), listProperties()]);
      setUnits(freshUnits);
      setProperties(freshProperties);
      setNewUnitNumber('');
      setNewUnitBedrooms(1);
      setNewUnitBathrooms(1);
      setNewUnitSqft(600);
      setNewUnitBaseRent(1500);
      setShowAddUnitModal(false);
      setAddUnitPropertyId(null);
    } catch (err) {
      console.error('Failed to create unit', err);
      alert('Could not create unit. Please try again.');
    }
  };

  // Helper action: Create tenant service request
  const handleServiceRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!srDescription) return;

    try {
      await createServiceRequest({
        title: `${srCategory.toUpperCase()} Service Request`,
        category: srCategory.toUpperCase(),
        description: srDescription,
      });
      const freshRequests = await listServiceRequests();
      setServiceRequests(freshRequests);
      setSrDescription('');
      setShowServiceRequestModal(false);
      alert('Service Request submitted successfully! The building superintendent has been notified.');
    } catch (err) {
      console.error('Failed to submit service request', err);
      alert(err instanceof Error ? err.message : 'Could not submit service request. Please try again.');
    }
  };

  // Helper view resolver: Get active unit details for configuration
  const activeConfiguringUnit = React.useMemo(() => {
    if (!selectedPropertyId || !selectedUnitNumber) return null;
    return units.find(u => u.propertyId === selectedPropertyId && u.unitNumber === selectedUnitNumber) || null;
  }, [units, selectedPropertyId, selectedUnitNumber]);

  // An invite link creates a real session too (Supabase only special-cases
  // 'recovery' as its own event; 'invite' just looks like a plain sign-in),
  // so we gate on the URL-captured type instead and route to setup first.
  if (showAcceptInvite && session) {
    return (
      <AcceptInviteScreen
        theme={theme}
        userEmail={session.user.email ?? ''}
        onThemeToggle={handleThemeToggle}
        onDone={() => setShowAcceptInvite(false)}
      />
    );
  }

  // A recovery link creates a real session, but we force the user through
  // "set a new password" before letting them into the app with it.
  if (passwordRecovery) {
    return (
      <ResetPasswordScreen
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onDone={async () => {
          setPasswordRecovery(false);
          sessionStorage.setItem(AUTH_NOTICE_KEY, 'password-reset');
          await supabase.auth.signOut();
        }}
      />
    );
  }

  // Wait for the initial session check (and the first data fetch) before
  // deciding what to render, so a refresh with an existing session doesn't
  // flash the login screen or an empty dashboard.
  if (authLoading || (session && profileLoading) || (session && user && dataLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcf8fa] dark:bg-[#0f1418] text-slate-400 text-sm">
        Loading…
      </div>
    );
  }

  // If user is not logged in, render beautiful auth splash
  if (!session || !user) {
    return (
      <LoginScreen
        theme={theme}
        onThemeToggle={handleThemeToggle}
      />
    );
  }

  return (
    <>
      {secondsRemaining !== null && (
        <SessionTimeoutWarning seconds={secondsRemaining} onStayActive={stayActive} />
      )}
      <div className="flex h-screen overflow-hidden bg-[#fcf8fa] dark:bg-[#0f1418] text-[#1b1b1d] dark:text-[#dee3e8] font-sans transition-colors duration-300">

      {/* Sidebar Navigation */}
      <Sidebar
        persona={user.persona}
        currentUserEmail={user.email}
        currentUserName={user.fullName}
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
          theme={theme}
          onThemeToggle={handleThemeToggle}
          onAddPropertyClick={() => setShowAddPropertyModal(true)}
          onServiceRequestClick={() => setShowServiceRequestModal(true)}
          onSettingsClick={() => {
            if (user.persona === 'owner') {
              setActiveOwnerScreen('settings');
            } else {
              setActiveTenantScreen('settings');
            }
          }}
          currentUserEmail={user.email}
          currentUserName={user.fullName}
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
                    units={units}
                    payments={payments}
                    tenants={tenants}
                    onSelectProperty={() => {
                      setActiveOwnerScreen('properties');
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
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="text-xxs font-bold text-slate-400 uppercase tracking-widest">Active Units</h4>
                              <button
                                type="button"
                                onClick={() => {
                                  setAddUnitPropertyId(prop.id);
                                  setShowAddUnitModal(true);
                                }}
                                className="text-xxs font-bold text-sky-500 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Plus size={12} /> Add Unit
                              </button>
                            </div>
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
                              {units.filter(u => u.propertyId === prop.id).length === 0 && (
                                <p className="col-span-2 text-[10px] text-slate-400 italic py-2">No units yet — add one to get started.</p>
                              )}
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
                    units={units}
                    payments={payments}
                    serviceRequests={serviceRequests}
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
                  units[0] ? (
                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                      <div className="p-8 space-y-8">
                        <div>
                          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{units[0].propertyName}</h2>
                          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Unit {units[0].unitNumber}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400 border-t border-b border-slate-100 dark:border-slate-800 py-4">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block mb-1">Bedrooms</span>
                            <span className="text-slate-900 dark:text-white font-bold">{units[0].bedrooms}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block mb-1">Bathrooms</span>
                            <span className="text-slate-900 dark:text-white font-bold">{units[0].bathrooms}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block mb-1">Square Feet</span>
                            <span className="text-slate-900 dark:text-white font-bold">{units[0].sqft}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block mb-1">Base Rent</span>
                            <span className="text-slate-900 dark:text-white font-bold">${units[0].baseRent.toLocaleString()}</span>
                          </div>
                        </div>

                        {units[0].utilities.length > 0 && (
                          <div>
                            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white mb-3">Utilities & Add-ons</h3>
                            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                              {units[0].utilities.map((u) => (
                                <span key={u.id}>{u.name}: ${u.amount.toLocaleString()}/mo</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No active lease on file yet.</p>
                    </div>
                  )
                )}

                {activeTenantScreen === 'payments' && (
                  <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Payment Ledger Statement</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Review historical billing and printable ledger statements.</p>
                    </div>

                    <div className="overflow-x-auto border border-slate-150 dark:border-slate-800 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                            <th className="px-6 py-3">BILLING ITEM</th>
                            <th className="px-6 py-3">STATUS</th>
                            <th className="px-6 py-3">DATE PAID</th>
                            <th className="px-6 py-3 text-right">AMOUNT</th>
                            <th className="px-6 py-3 text-center">RECEIPT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs font-semibold">
                          {payments.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                              <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{p.month}</td>
                              <td className="px-6 py-4 text-slate-600">{p.status}</td>
                              <td className="px-6 py-4 text-slate-500">{p.datePaid || '—'}</td>
                              <td className="px-6 py-4 text-right font-mono font-bold">${p.totalDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                              <td className="px-6 py-4 text-center">
                                <button type="button" onClick={() => setSelectedPaymentInvoice(p)} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xxs font-bold uppercase">View Statement</button>
                              </td>
                            </tr>
                          ))}
                          {payments.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-semibold">
                                No billing history yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTenantScreen === 'documents' && (
                  <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 p-8 rounded-xl space-y-6">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Lease Agreements & Vault Docs</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Documents attached to your lease.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      {(units[0]?.leaseDocs ?? []).map((doc, idx) => (
                        <div key={idx} className="p-4 border border-slate-150 dark:border-slate-800 rounded-lg flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <FileText size={24} className="text-sky-500" />
                            <div>
                              <p className="font-bold text-xs text-slate-900 dark:text-white">{doc.name}</p>
                              <p className="text-xxs text-slate-400">{doc.size} • {doc.date}</p>
                            </div>
                          </div>
                          <Download size={16} className="text-slate-400" />
                        </div>
                      ))}
                      {(!units[0]?.leaseDocs || units[0].leaseDocs.length === 0) && (
                        <p className="col-span-2 text-xs font-semibold text-slate-400 dark:text-slate-500 text-center py-8">
                          No documents on file yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Settings Sub-View (shared across personas) */}
            {((user.persona === 'owner' && activeOwnerScreen === 'settings') ||
              (user.persona === 'tenant' && activeTenantScreen === 'settings')) && (
              <SettingsScreen
                persona={user.persona}
                onProfileUpdated={() => {
                  if (session) refetchProfile(session);
                }}
              />
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

              <div>
                <label htmlFor="new-property-units" className="block text-[10px] font-bold text-slate-400 uppercase">TARGET UNITS COUNT</label>
                <input
                  id="new-property-units"
                  type="number"
                  required
                  min="1"
                  value={newPropUnits}
                  onChange={(e) => setNewPropUnits(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">Informational only — add individual units afterwards from the property card.</p>
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

      {/* Add Unit Modal */}
      {showAddUnitModal && (
        <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Add Unit</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Register a new unit under this property.</p>

            <form onSubmit={handleAddUnitSubmit} className="space-y-4 mt-6">
              <div>
                <label htmlFor="new-unit-number" className="block text-[10px] font-bold text-slate-400 uppercase">UNIT NUMBER</label>
                <input
                  id="new-unit-number"
                  type="text"
                  required
                  placeholder="e.g. 204"
                  value={newUnitNumber}
                  onChange={(e) => setNewUnitNumber(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="new-unit-bedrooms" className="block text-[10px] font-bold text-slate-400 uppercase">BEDS</label>
                  <input
                    id="new-unit-bedrooms"
                    type="number"
                    required
                    min="0"
                    value={newUnitBedrooms}
                    onChange={(e) => setNewUnitBedrooms(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="new-unit-bathrooms" className="block text-[10px] font-bold text-slate-400 uppercase">BATHS</label>
                  <input
                    id="new-unit-bathrooms"
                    type="number"
                    required
                    min="0"
                    value={newUnitBathrooms}
                    onChange={(e) => setNewUnitBathrooms(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="new-unit-sqft" className="block text-[10px] font-bold text-slate-400 uppercase">SQFT</label>
                  <input
                    id="new-unit-sqft"
                    type="number"
                    required
                    min="0"
                    value={newUnitSqft}
                    onChange={(e) => setNewUnitSqft(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="new-unit-rent" className="block text-[10px] font-bold text-slate-400 uppercase">BASE RENT ($)</label>
                <input
                  id="new-unit-rent"
                  type="number"
                  required
                  min="0"
                  value={newUnitBaseRent}
                  onChange={(e) => setNewUnitBaseRent(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sky-500 text-slate-950 font-bold rounded-lg hover:bg-sky-400 text-xs uppercase tracking-wider"
                >
                  Add Unit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUnitModal(false);
                    setAddUnitPropertyId(null);
                  }}
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
    </>
  );
}
