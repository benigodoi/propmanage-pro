/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { screenToPath, pathToScreen } from './lib/screenRouting';
import { supabase, initialAuthLinkType } from './lib/supabaseClient';
import { listProperties, createProperty, deleteProperty } from './lib/api/properties';
import { listUnitsWithDetails, createUnit, updateUnit, deleteUnit } from './lib/api/units';
import { listActiveLeasesAsTenants, addTenant, inviteTenantToPortal, deleteTenant } from './lib/api/leases';
import { listPayments, updatePaymentStatus } from './lib/api/payments';
import { listServiceRequests, createServiceRequest, updateServiceRequestStatus } from './lib/api/serviceRequests';
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
import { useAsyncGuard } from './hooks/useAsyncGuard';
import { AUTH_NOTICE_KEY } from './lib/authNotice';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import OwnerDashboard from './components/OwnerDashboard';
import PaymentTracker from './components/PaymentTracker';
import UnitConfiguration from './components/UnitConfiguration';
import TenantDashboard from './components/TenantDashboard';
import ServiceRequestsInbox from './components/ServiceRequestsInbox';
import MyServiceRequestsModal from './components/MyServiceRequestsModal';
import { buildNotifications, AppNotification } from './lib/notifications';
import InvoiceView from './components/InvoiceView';
import SettingsScreen from './components/SettingsScreen';
import Toast, { ToastState, ToastVariant } from './components/Toast';
import ConfirmDialog, { ConfirmDialogState } from './components/ConfirmDialog';
import { useLocalization } from './contexts/LocalizationContext';
import { enumLabel } from './lib/i18n';

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
  const { t, locale, currency, formatMoney } = useLocalization();
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
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedPaymentInvoice, setSelectedPaymentInvoice] = useState<Payment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal Triggers
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [showServiceRequestModal, setShowServiceRequestModal] = useState(false);
  const [showMyServiceRequests, setShowMyServiceRequests] = useState(false);
  const [serviceRequestsLoading, setServiceRequestsLoading] = useState(false);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [addUnitPropertyId, setAddUnitPropertyId] = useState<string | null>(null);
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [inviteToPortalTenant, setInviteToPortalTenant] = useState<Tenant | null>(null);
  const [actionLinkToShare, setActionLinkToShare] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const showToast = (message: string, variant: ToastVariant) => setToast({ message, variant });

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

  // New Tenant Form States
  const [newTenantUnitId, setNewTenantUnitId] = useState('');
  const [newTenantFullName, setNewTenantFullName] = useState('');
  const [newTenantEmail, setNewTenantEmail] = useState('');
  const [newTenantPhone, setNewTenantPhone] = useState('');
  const [newTenantLeaseStart, setNewTenantLeaseStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [newTenantLeaseEnd, setNewTenantLeaseEnd] = useState('');
  const [newTenantBaseRent, setNewTenantBaseRent] = useState(0);
  const [newTenantGrantAccess, setNewTenantGrantAccess] = useState(false);
  const [newTenantSendEmail, setNewTenantSendEmail] = useState(false);
  const [inviteToPortalSendEmail, setInviteToPortalSendEmail] = useState(false);

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

  // The URL is the source of truth for which screen is showing — this keeps
  // activeOwnerScreen/activeTenantScreen (and the configure-unit selection)
  // in sync with it, including on back/forward navigation and on refresh
  // (react-router's useLocation already reflects the real URL on mount).
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const resolved = pathToScreen(user.persona, location.pathname);
    if (user.persona === 'owner') {
      setActiveOwnerScreen(resolved.screen as OwnerScreen);
      if (resolved.unitId) setSelectedUnitId(resolved.unitId);
    } else {
      setActiveTenantScreen(resolved.screen as TenantScreen);
    }
  }, [location.pathname, user?.persona]);

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

  // Service request status is changed by the other party (owner updates it,
  // tenant files it), so the once-at-login fetch goes stale — re-pull it
  // whenever the tab regains focus and whenever the tenant opens their list.
  const refreshServiceRequests = React.useCallback(async () => {
    setServiceRequestsLoading(true);
    try {
      setServiceRequests(await listServiceRequests());
    } catch (err) {
      console.error('Failed to refresh service requests', err);
    } finally {
      setServiceRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshServiceRequests();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user, refreshServiceRequests]);

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
      showToast(t('errors.updatePaymentStatus'), 'error');
    }
  };

  const notifications = useMemo(
    () => (user ? buildNotifications(user.persona, serviceRequests, payments) : []),
    [user, serviceRequests, payments],
  );

  const handleNotificationClick = (n: AppNotification) => {
    if (!user) return;
    if (n.serviceRequest) {
      if (user.persona === 'owner') {
        navigate(screenToPath('owner', 'service-requests'));
      } else {
        setShowMyServiceRequests(true);
        refreshServiceRequests();
      }
    } else {
      navigate(screenToPath(user.persona, 'payments'));
    }
  };

  const handleUpdateServiceRequestStatus = async (id: string, status: ServiceRequest['status']) => {
    try {
      await updateServiceRequestStatus(id, status);
      const freshRequests = await listServiceRequests();
      setServiceRequests(freshRequests);
    } catch (err) {
      console.error('Failed to update service request status', err);
      showToast(t('errors.updateServiceRequestStatus'), 'error');
    }
  };

  // Helper action: Configure specific unit
  const handleSelectUnitConfig = (unitId: string) => {
    navigate(screenToPath('owner', 'configure-unit', { unitId }));
  };

  // Helper action: Save updated unit details back to property
  const handleSaveUnitConfig = async (updatedUnit: Unit) => {
    try {
      await updateUnit(updatedUnit.id, { baseRent: updatedUnit.baseRent, utilities: updatedUnit.utilities });
      const freshUnits = await listUnitsWithDetails();
      setUnits(freshUnits);
    } catch (err) {
      console.error('Failed to save unit configuration', err);
      showToast(t('errors.saveUnitConfig'), 'error');
    }
  };

  // Helper action: Add new property asset
  const [addingProperty, runAddProperty] = useAsyncGuard();
  const handleAddPropertySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName || !newPropAddress) return;

    runAddProperty(async () => {
      try {
        await createProperty({ name: newPropName, address: newPropAddress, unitsCount: newPropUnits });
        const freshProperties = await listProperties();
        setProperties(freshProperties);
        setNewPropName('');
        setNewPropAddress('');
        setShowAddPropertyModal(false);
      } catch (err) {
        console.error('Failed to create property', err);
        showToast(t('errors.createProperty'), 'error');
      }
    });
  };

  // Helper action: Add a new unit to a property
  const [addingUnit, runAddUnit] = useAsyncGuard();
  const handleAddUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUnitPropertyId || !newUnitNumber) return;

    runAddUnit(async () => {
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
        showToast(t('errors.createUnit'), 'error');
      }
    });
  };

  // Helper action: Add a renter, with or without portal access
  const [addingTenant, runAddTenant] = useAsyncGuard();
  const handleAddTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantUnitId || !newTenantFullName || !newTenantLeaseStart) return;
    if (newTenantGrantAccess && !newTenantEmail) {
      showToast(t('errors.emailRequiredForPortalAccess'), 'error');
      return;
    }

    runAddTenant(async () => {
      try {
        const result = await addTenant({
          unitId: newTenantUnitId,
          fullName: newTenantFullName,
          email: newTenantEmail || undefined,
          phone: newTenantPhone || undefined,
          leaseStart: newTenantLeaseStart,
          leaseEnd: newTenantLeaseEnd || undefined,
          baseRent: newTenantBaseRent,
          grantAccess: newTenantGrantAccess,
          sendEmail: newTenantSendEmail,
        });
        const [freshTenants, freshUnits] = await Promise.all([listActiveLeasesAsTenants(), listUnitsWithDetails()]);
        setTenants(freshTenants);
        setUnits(freshUnits);
        setShowAddTenantModal(false);
        setNewTenantUnitId('');
        setNewTenantFullName('');
        setNewTenantEmail('');
        setNewTenantPhone('');
        setNewTenantLeaseStart(new Date().toISOString().slice(0, 10));
        setNewTenantLeaseEnd('');
        setNewTenantBaseRent(0);
        setNewTenantGrantAccess(false);
        setNewTenantSendEmail(false);
        if (result.actionLink) {
          setActionLinkToShare(result.actionLink);
        }
      } catch (err) {
        console.error('Failed to add tenant', err);
        showToast(err instanceof Error ? err.message : t('errors.addTenant'), 'error');
      }
    });
  };

  // Helper action: Upgrade an existing no-access tenant to a full portal account
  const [invitingToPortal, runInviteToPortal] = useAsyncGuard();
  const handleConfirmInviteToPortal = () => {
    if (!inviteToPortalTenant?.leaseId) return;

    runInviteToPortal(async () => {
      try {
        const result = await inviteTenantToPortal(inviteToPortalTenant.leaseId!, inviteToPortalSendEmail);
        const freshTenants = await listActiveLeasesAsTenants();
        setTenants(freshTenants);
        setInviteToPortalTenant(null);
        setInviteToPortalSendEmail(false);
        if (result.actionLink) {
          setActionLinkToShare(result.actionLink);
        }
      } catch (err) {
        console.error('Failed to grant portal access', err);
        showToast(err instanceof Error ? err.message : t('errors.grantPortalAccess'), 'error');
      }
    });
  };

  // Helper action: Remove a tenant's lease outright — no confirmation email, no undo
  const handleDeleteTenant = (tenant: Tenant) => {
    if (!tenant.leaseId) return;
    setConfirmDialog({
      title: t('confirm.removeTenantTitle'),
      message: t('confirm.removeTenantMessage', { name: tenant.name, unit: tenant.unitNumber }),
      confirmLabel: t('common.remove'),
      danger: true,
      onConfirm: async () => {
        try {
          await deleteTenant(tenant.leaseId!);
          const [freshTenants, freshUnits] = await Promise.all([listActiveLeasesAsTenants(), listUnitsWithDetails()]);
          setTenants(freshTenants);
          setUnits(freshUnits);
        } catch (err) {
          console.error('Failed to delete tenant', err);
          showToast(t('errors.removeTenant'), 'error');
        }
      },
    });
  };

  // Helper action: Remove a property and everything under it (units, leases, payments, ...)
  const handleDeleteProperty = (property: Property) => {
    setConfirmDialog({
      title: t('confirm.deletePropertyTitle'),
      message: t('confirm.deletePropertyMessage', { name: property.name }),
      confirmLabel: t('common.delete'),
      danger: true,
      onConfirm: async () => {
        try {
          await deleteProperty(property.id);
          const [freshProperties, freshUnits, freshTenants] = await Promise.all([
            listProperties(),
            listUnitsWithDetails(),
            listActiveLeasesAsTenants(),
          ]);
          setProperties(freshProperties);
          setUnits(freshUnits);
          setTenants(freshTenants);
        } catch (err) {
          console.error('Failed to delete property', err);
          showToast(t('errors.deleteProperty'), 'error');
        }
      },
    });
  };

  // Helper action: Remove a unit and everything under it (leases, utilities, ...)
  const handleDeleteUnit = (unit: Unit) => {
    const occupancyNote = unit.activeTenant ? ` ${t('confirm.deleteUnitOccupancyNote')}` : '';
    setConfirmDialog({
      title: t('confirm.deleteUnitTitle'),
      message: `${t('confirm.deleteUnitMessage', { unit: unit.unitNumber })}${occupancyNote} ${t('confirm.cannotBeUndone')}`,
      confirmLabel: t('common.delete'),
      danger: true,
      onConfirm: async () => {
        try {
          await deleteUnit(unit.id);
          const [freshProperties, freshUnits, freshTenants] = await Promise.all([
            listProperties(),
            listUnitsWithDetails(),
            listActiveLeasesAsTenants(),
          ]);
          setProperties(freshProperties);
          setUnits(freshUnits);
          setTenants(freshTenants);
          navigate(screenToPath('owner', 'properties'));
        } catch (err) {
          console.error('Failed to delete unit', err);
          showToast(t('errors.deleteUnit'), 'error');
        }
      },
    });
  };

  // Helper action: Create tenant service request
  const [submittingServiceRequest, runServiceRequest] = useAsyncGuard();
  const handleServiceRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!srDescription) return;

    runServiceRequest(async () => {
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
        showToast(t('modals.serviceRequestSubmitted'), 'success');
      } catch (err) {
        console.error('Failed to submit service request', err);
        showToast(err instanceof Error ? err.message : t('errors.submitServiceRequest'), 'error');
      }
    });
  };

  // Helper view resolver: Get active unit details for configuration. Keyed
  // by the unit's own unique id — unit_number is NOT guaranteed unique
  // within a property, so matching on (propertyId, unitNumber) can resolve
  // to the wrong duplicate unit if one exists.
  const activeConfiguringUnit = React.useMemo(() => {
    if (!selectedUnitId) return null;
    return units.find(u => u.id === selectedUnitId) || null;
  }, [units, selectedUnitId]);

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
        {t('common.loading')}
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
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <ConfirmDialog state={confirmDialog} onCancel={() => setConfirmDialog(null)} />
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
          navigate(screenToPath('owner', scr));
          setSearchQuery('');
        }}
        onTenantScreenChange={(scr) => {
          navigate(screenToPath('tenant', scr));
          setSearchQuery('');
        }}
        onLogout={handleLogout}
        onGenerateReportClick={() => {
          if (user.persona === 'owner') {
            navigate(screenToPath('owner', 'reports'));
          }
        }}
        onServiceRequestClick={() => {
          setShowServiceRequestModal(true);
        }}
        pendingServiceRequestCount={serviceRequests.filter((r) => r.status === 'Pending').length}
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
            navigate(screenToPath(user.persona, 'settings'));
          }}
          currentUserEmail={user.email}
          currentUserName={user.fullName}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
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
                      navigate(screenToPath('owner', 'properties'));
                    }}
                    onOpenInvoice={(paymentId) => {
                      const pay = payments.find(p => p.id === paymentId);
                      if (pay) setSelectedPaymentInvoice(pay);
                    }}
                    onAddPropertyClick={() => setShowAddPropertyModal(true)}
                    onAddTenantClick={() => {
                      setNewTenantUnitId('');
                      setNewTenantBaseRent(0);
                      setShowAddTenantModal(true);
                    }}
                    onInviteToPortalClick={(tenant) => setInviteToPortalTenant(tenant)}
                    onDeleteTenantClick={handleDeleteTenant}
                  />
                )}

                {activeOwnerScreen === 'properties' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">{t('properties.title')}</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('properties.subtitle')}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddPropertyModal(true)}
                        className="px-4 py-2 bg-slate-950 dark:bg-sky-400 hover:bg-slate-900 dark:hover:bg-sky-300 text-white dark:text-slate-950 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={14} /> {t('header.addProperty')}
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
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-xxs font-bold rounded-full">
                                {t('dashboard.unitsCount', { count: prop.unitsCount })}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteProperty(prop)}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded transition-colors cursor-pointer"
                                title={t('properties.deleteProperty')}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 dark:border-slate-800/60 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase block mb-1">{t('dashboard.occupancyRate')}</span>
                              <span className="text-slate-900 dark:text-white font-bold">{prop.occupancyRate}%</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase block mb-1">{t('properties.projectedIncome')}</span>
                              <span className="text-emerald-500 font-bold font-sans">{formatMoney(prop.monthlyRevenue)}</span>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="text-xxs font-bold text-slate-400 uppercase tracking-widest">{t('properties.activeUnits')}</h4>
                              <button
                                type="button"
                                onClick={() => {
                                  setAddUnitPropertyId(prop.id);
                                  setShowAddUnitModal(true);
                                }}
                                className="text-xxs font-bold text-sky-500 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Plus size={12} /> {t('properties.addUnit')}
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {units.filter(u => u.propertyId === prop.id).map(unit => (
                                <button
                                  key={unit.unitNumber}
                                  type="button"
                                  onClick={() => handleSelectUnitConfig(unit.id)}
                                  className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-150 dark:border-slate-800 text-left rounded-lg text-xs transition-colors flex justify-between items-center group cursor-pointer"
                                >
                                  <div>
                                    <p className="font-bold text-slate-800 dark:text-white">{t('dashboard.unitLabel', { unit: unit.unitNumber })}</p>
                                    <p className="text-[10px] text-slate-400">{unit.activeTenant ? unit.activeTenant.name : t('properties.vacant')}</p>
                                  </div>
                                  <ChevronRight size={14} className="text-slate-300 group-hover:text-sky-400 transition-colors" />
                                </button>
                              ))}
                              {units.filter(u => u.propertyId === prop.id).length === 0 && (
                                <p className="col-span-2 text-[10px] text-slate-400 italic py-2">{t('properties.noUnitsYet')}</p>
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

                {activeOwnerScreen === 'service-requests' && (
                  <ServiceRequestsInbox
                    serviceRequests={serviceRequests}
                    onUpdateStatus={handleUpdateServiceRequestStatus}
                  />
                )}

                {activeOwnerScreen === 'reports' && (
                  <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 p-8 rounded-xl space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('reports.title')}</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('reports.subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                      {/* Report Card 1 */}
                      <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-sky-500/50 transition-colors cursor-pointer space-y-4">
                        <FileSpreadsheet className="text-sky-500" size={28} />
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('reports.revenueSummary')}</h3>
                          <p className="text-xxs text-slate-400 mt-1">{t('reports.revenueSummaryDesc')}</p>
                        </div>
                        <button type="button" onClick={() => showToast(t('reports.simulatingXls'), 'info')} className="text-xs text-sky-500 font-bold hover:underline">{t('reports.downloadXls')}</button>
                      </div>

                      {/* Report Card 2 */}
                      <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-sky-500/50 transition-colors cursor-pointer space-y-4">
                        <FileText className="text-emerald-500" size={28} />
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('reports.overdueBalance')}</h3>
                          <p className="text-xxs text-slate-400 mt-1">{t('reports.overdueBalanceDesc')}</p>
                        </div>
                        <button type="button" onClick={() => showToast(t('reports.simulatingPdf'), 'info')} className="text-xs text-sky-500 font-bold hover:underline">{t('reports.downloadPdf')}</button>
                      </div>

                      {/* Report Card 3 */}
                      <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-sky-500/50 transition-colors cursor-pointer space-y-4">
                        <Wrench className="text-amber-500" size={28} />
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('reports.maintenanceAudit')}</h3>
                          <p className="text-xxs text-slate-400 mt-1">{t('reports.maintenanceAuditDesc')}</p>
                        </div>
                        <button type="button" onClick={() => showToast(t('reports.simulatingMaintenancePdf'), 'info')} className="text-xs text-sky-500 font-bold hover:underline">{t('reports.downloadPdf')}</button>
                      </div>
                    </div>
                  </div>
                )}

                {activeOwnerScreen === 'configure-unit' && activeConfiguringUnit && (
                  <UnitConfiguration
                    unit={activeConfiguringUnit}
                    onSave={handleSaveUnitConfig}
                    onClose={() => navigate(screenToPath('owner', 'dashboard'))}
                    onDelete={handleDeleteUnit}
                    onNotify={(message) => showToast(message, 'info')}
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
                    onOpenServiceRequests={() => {
                      setShowMyServiceRequests(true);
                      refreshServiceRequests();
                    }}
                  />
                )}

                {activeTenantScreen === 'property-details' && (
                  units[0] ? (
                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                      <div className="p-8 space-y-8">
                        <div>
                          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{units[0].propertyName}</h2>
                          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{t('dashboard.unitLabel', { unit: units[0].unitNumber })}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400 border-t border-b border-slate-100 dark:border-slate-800 py-4">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block mb-1">{t('tenantProperty.bedrooms')}</span>
                            <span className="text-slate-900 dark:text-white font-bold">{units[0].bedrooms}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block mb-1">{t('tenantProperty.bathrooms')}</span>
                            <span className="text-slate-900 dark:text-white font-bold">{units[0].bathrooms}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block mb-1">{t('tenantProperty.squareFeet')}</span>
                            <span className="text-slate-900 dark:text-white font-bold">{units[0].sqft}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block mb-1">{t('unitConfig.baseRent')}</span>
                            <span className="text-slate-900 dark:text-white font-bold">{formatMoney(units[0].baseRent)}</span>
                          </div>
                        </div>

                        {units[0].utilities.length > 0 && (
                          <div>
                            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white mb-3">{t('unitConfig.utilitiesAddons')}</h3>
                            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                              {units[0].utilities.map((u) => (
                                <span key={u.id}>{t('tenantProperty.utilityPerMonth', { name: u.name, amount: formatMoney(u.amount) })}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('tenantDashboard.noLease')}</p>
                    </div>
                  )
                )}

                {activeTenantScreen === 'payments' && (
                  <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('tenantPayments.title')}</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('tenantPayments.subtitle')}</p>
                    </div>

                    <div className="overflow-x-auto border border-slate-150 dark:border-slate-800 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                            <th className="px-6 py-3">{t('tenantPayments.billingItem')}</th>
                            <th className="px-6 py-3">{t('dashboard.status')}</th>
                            <th className="px-6 py-3">{t('payments.datePaid')}</th>
                            <th className="px-6 py-3 text-right">{t('tenantPayments.amount')}</th>
                            <th className="px-6 py-3 text-center">{t('tenantPayments.receipt')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs font-semibold">
                          {payments.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                              <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{p.month}</td>
                              <td className="px-6 py-4 text-slate-600">{enumLabel(locale, p.status)}</td>
                              <td className="px-6 py-4 text-slate-500">{p.datePaid || '—'}</td>
                              <td className="px-6 py-4 text-right font-mono font-bold">{formatMoney(p.totalDue)}</td>
                              <td className="px-6 py-4 text-center">
                                <button type="button" onClick={() => setSelectedPaymentInvoice(p)} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xxs font-bold uppercase">{t('tenantPayments.viewStatement')}</button>
                              </td>
                            </tr>
                          ))}
                          {payments.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-semibold">
                                {t('tenantPayments.noBillingHistory')}
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
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('tenantDocuments.title')}</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('tenantDocuments.subtitle')}</p>
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
                          {t('tenantDocuments.noDocuments')}
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
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('help.title')}</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('help.subtitle')}</p>
                </div>

                <div className="space-y-4 pt-4 text-xs font-semibold">
                  {/* Q1 */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-150 dark:border-slate-800">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <HelpCircle size={14} className="text-sky-500" /> {t('help.q1')}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                      {t('help.a1')}
                    </p>
                  </div>

                  {/* Q2 */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-150 dark:border-slate-800">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <HelpCircle size={14} className="text-sky-500" /> {t('help.q2')}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                      {t('help.a2')}
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
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('modals.createPropertyTitle')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('modals.createPropertySubtitle')}</p>

            <form onSubmit={handleAddPropertySubmit} className="space-y-4 mt-6">
              <div>
                <label htmlFor="new-property-name" className="block text-[10px] font-bold text-slate-400 uppercase">{t('modals.propertyName')}</label>
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
                <label htmlFor="new-property-address" className="block text-[10px] font-bold text-slate-400 uppercase">{t('modals.streetAddress')}</label>
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
                <label htmlFor="new-property-units" className="block text-[10px] font-bold text-slate-400 uppercase">{t('modals.targetUnitsCount')}</label>
                <input
                  id="new-property-units"
                  type="number"
                  required
                  min="1"
                  value={newPropUnits}
                  onChange={(e) => setNewPropUnits(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">{t('modals.targetUnitsHint')}</p>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={addingProperty}
                  className="flex-1 py-2.5 bg-sky-500 text-slate-950 font-bold rounded-lg hover:bg-sky-400 text-xs uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {addingProperty ? t('modals.creating') : t('modals.createPropertyAsset')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPropertyModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 text-xs font-bold uppercase"
                >
                  {t('common.cancel')}
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
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('properties.addUnit')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('modals.registerUnitSubtitle')}</p>

            <form onSubmit={handleAddUnitSubmit} className="space-y-4 mt-6">
              <div>
                <label htmlFor="new-unit-number" className="block text-[10px] font-bold text-slate-400 uppercase">{t('modals.unitNumber')}</label>
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
                  <label htmlFor="new-unit-bedrooms" className="block text-[10px] font-bold text-slate-400 uppercase">{t('modals.beds')}</label>
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
                  <label htmlFor="new-unit-bathrooms" className="block text-[10px] font-bold text-slate-400 uppercase">{t('modals.baths')}</label>
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
                  <label htmlFor="new-unit-sqft" className="block text-[10px] font-bold text-slate-400 uppercase">{t('modals.sqft')}</label>
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
                <label htmlFor="new-unit-rent" className="block text-[10px] font-bold text-slate-400 uppercase">{t('modals.baseRentEur')}</label>
                <input
                  id="new-unit-rent"
                  type="number"
                  required
                  min="0"
                  value={newUnitBaseRent}
                  onChange={(e) => setNewUnitBaseRent(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                />
                {currency !== 'EUR' && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{t('unitConfig.convertedHint', { amount: formatMoney(newUnitBaseRent) })}</p>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={addingUnit}
                  className="flex-1 py-2.5 bg-sky-500 text-slate-950 font-bold rounded-lg hover:bg-sky-400 text-xs uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {addingUnit ? t('modals.adding') : t('properties.addUnit')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUnitModal(false);
                    setAddUnitPropertyId(null);
                  }}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 text-xs font-bold uppercase"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Tenant Modal */}
      {showAddTenantModal && (
        <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('dashboard.addTenant')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('modals.addTenantSubtitle')}</p>

            <form onSubmit={handleAddTenantSubmit} className="space-y-4 mt-6">
              <div>
                <label htmlFor="new-tenant-unit" className="block text-[10px] font-bold text-slate-400 uppercase">{t('modals.unit')}</label>
                <select
                  id="new-tenant-unit"
                  required
                  value={newTenantUnitId}
                  onChange={(e) => {
                    setNewTenantUnitId(e.target.value);
                    const unit = units.find((u) => u.id === e.target.value);
                    setNewTenantBaseRent(unit?.baseRent ?? 0);
                  }}
                  className="w-full mt-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                >
                  <option value="" disabled>{t('modals.selectVacantUnit')}</option>
                  {units.filter((u) => !u.activeTenant).map((u) => (
                    <option key={u.id} value={u.id}>{t('modals.unitOption', { property: u.propertyName, unit: u.unitNumber })}</option>
                  ))}
                </select>
                {units.filter((u) => !u.activeTenant).length === 0 && (
                  <p className="text-[10px] text-amber-500 mt-1">{t('modals.noVacantUnits')}</p>
                )}
              </div>

              <div>
                <label htmlFor="new-tenant-name" className="block text-[10px] font-bold text-slate-400 uppercase">{t('settings.fullName')}</label>
                <input
                  id="new-tenant-name"
                  type="text"
                  required
                  placeholder="e.g. Jamie Rivera"
                  value={newTenantFullName}
                  onChange={(e) => setNewTenantFullName(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="new-tenant-email" className="block text-[10px] font-bold text-slate-400 uppercase">
                    {t('modals.email')} {newTenantGrantAccess && <span className="text-rose-400">*</span>}
                  </label>
                  <input
                    id="new-tenant-email"
                    type="email"
                    required={newTenantGrantAccess}
                    placeholder="jamie@example.com"
                    value={newTenantEmail}
                    onChange={(e) => setNewTenantEmail(e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="new-tenant-phone" className="block text-[10px] font-bold text-slate-400 uppercase">{t('settings.phone')}</label>
                  <input
                    id="new-tenant-phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={newTenantPhone}
                    onChange={(e) => setNewTenantPhone(e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="new-tenant-lease-start" className="block text-[10px] font-bold text-slate-400 uppercase">{t('dashboard.leaseStart')}</label>
                  <input
                    id="new-tenant-lease-start"
                    type="date"
                    required
                    value={newTenantLeaseStart}
                    onChange={(e) => setNewTenantLeaseStart(e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="new-tenant-lease-end" className="block text-[10px] font-bold text-slate-400 uppercase">{t('dashboard.leaseEnd')}</label>
                  <input
                    id="new-tenant-lease-end"
                    type="date"
                    value={newTenantLeaseEnd}
                    onChange={(e) => setNewTenantLeaseEnd(e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="new-tenant-rent" className="block text-[10px] font-bold text-slate-400 uppercase">{t('modals.baseRentEur')}</label>
                <input
                  id="new-tenant-rent"
                  type="number"
                  required
                  min="0"
                  value={newTenantBaseRent}
                  onChange={(e) => setNewTenantBaseRent(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                />
                {currency !== 'EUR' && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{t('unitConfig.convertedHint', { amount: formatMoney(newTenantBaseRent) })}</p>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                <label htmlFor="new-tenant-grant-access" className="flex items-start gap-2 cursor-pointer">
                  <input
                    id="new-tenant-grant-access"
                    type="checkbox"
                    checked={newTenantGrantAccess}
                    onChange={(e) => setNewTenantGrantAccess(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{t('modals.givePortalAccess')}</span>
                    <span className="block text-[10px] text-slate-400">{t('modals.givePortalAccessHint')}</span>
                  </span>
                </label>

                {newTenantGrantAccess && (
                  <label htmlFor="new-tenant-send-email" className="flex items-start gap-2 cursor-pointer pl-6">
                    <input
                      id="new-tenant-send-email"
                      type="checkbox"
                      checked={newTenantSendEmail}
                      onChange={(e) => setNewTenantSendEmail(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{t('modals.sendInviteEmailNow')}</span>
                      <span className="block text-[10px] text-slate-400">{t('modals.sendInviteEmailHint')}</span>
                    </span>
                  </label>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={addingTenant}
                  className="flex-1 py-2.5 bg-sky-500 text-slate-950 font-bold rounded-lg hover:bg-sky-400 text-xs uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {addingTenant ? t('modals.adding') : t('dashboard.addTenant')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTenantModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 text-xs font-bold uppercase"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Existing Tenant to Portal Modal */}
      {inviteToPortalTenant && (
        <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('modals.grantPortalAccessTitle')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('modals.grantPortalAccessSubtitle')} <span className="font-bold text-slate-700 dark:text-slate-300">{inviteToPortalTenant.name}</span>.
            </p>

            <div className="mt-6 space-y-3">
              <label htmlFor="invite-portal-send-email" className="flex items-start gap-2 cursor-pointer">
                <input
                  id="invite-portal-send-email"
                  type="checkbox"
                  checked={inviteToPortalSendEmail}
                  onChange={(e) => setInviteToPortalSendEmail(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{t('modals.sendInviteEmailNow')}</span>
                  <span className="block text-[10px] text-slate-400">{t('modals.sendInviteEmailHint')}</span>
                </span>
              </label>
            </div>

            <div className="flex gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleConfirmInviteToPortal}
                disabled={invitingToPortal}
                className="flex-1 py-2.5 bg-sky-500 text-slate-950 font-bold rounded-lg hover:bg-sky-400 text-xs uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {invitingToPortal ? t('modals.granting') : t('modals.grantAccess')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setInviteToPortalTenant(null);
                  setInviteToPortalSendEmail(false);
                }}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 text-xs font-bold uppercase"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copyable Invite Link Modal */}
      {actionLinkToShare && (
        <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('modals.portalAccessCreated')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('modals.noEmailSentNote')}
            </p>

            <div className="mt-4 flex gap-2">
              <input
                id="action-link-to-share"
                type="text"
                readOnly
                value={actionLinkToShare}
                onFocus={(e) => e.target.select()}
                className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xxs font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(actionLinkToShare);
                }}
                className="px-4 py-2.5 bg-sky-500 text-slate-950 font-bold rounded-lg hover:bg-sky-400 text-xs uppercase tracking-wider"
              >
                {t('modals.copy')}
              </button>
            </div>

            <div className="flex gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActionLinkToShare(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 text-xs font-bold uppercase"
              >
                {t('modals.done')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Request Modal */}
      {showMyServiceRequests && (
        <MyServiceRequestsModal
          serviceRequests={serviceRequests}
          loading={serviceRequestsLoading}
          onNewRequest={() => {
            setShowMyServiceRequests(false);
            setShowServiceRequestModal(true);
          }}
          onClose={() => setShowMyServiceRequests(false)}
        />
      )}

      {showServiceRequestModal && (
        <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('modals.createServiceTicket')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('modals.serviceTicketSubtitle')}</p>

            <form onSubmit={handleServiceRequestSubmit} className="space-y-4 mt-6">
              <div>
                <label htmlFor="service-request-category" className="block text-[10px] font-bold text-slate-400 uppercase">{t('modals.issueCategory')}</label>
                <select
                  id="service-request-category"
                  value={srCategory}
                  onChange={(e) => setSrCategory(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs"
                >
                  <option value="plumbing">{t('modals.categoryPlumbing')}</option>
                  <option value="electrical">{t('modals.categoryElectrical')}</option>
                  <option value="hvac">{t('modals.categoryHvac')}</option>
                  <option value="appliance">{t('modals.categoryAppliance')}</option>
                  <option value="general">{t('modals.categoryGeneral')}</option>
                </select>
              </div>

              <div>
                <label htmlFor="service-request-description" className="block text-[10px] font-bold text-slate-400 uppercase">{t('modals.detailedDescription')}</label>
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
                <label htmlFor="service-request-priority" className="block text-[10px] font-bold text-slate-400 uppercase">{t('modals.priorityLevel')}</label>
                <select
                  id="service-request-priority"
                  value={srPriority}
                  onChange={(e) => setSrPriority(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs"
                >
                  <option value="low">{t('modals.priorityLow')}</option>
                  <option value="medium">{t('modals.priorityMedium')}</option>
                  <option value="high">{t('modals.priorityHigh')}</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={submittingServiceRequest}
                  className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-500 text-xs uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submittingServiceRequest ? t('modals.submitting') : t('modals.submitServiceTicket')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowServiceRequestModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 text-xs font-bold uppercase"
                >
                  {t('common.cancel')}
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
