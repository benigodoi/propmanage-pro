/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Property, Unit, Payment, Tenant, Statement, ServiceRequest } from './types';

export const INITIAL_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    name: 'Oakwood Lofts',
    address: '122 Oak St, Portland, OR',
    unitsCount: 48,
    occupancyRate: 96,
    monthlyRevenue: 112400,
    iconType: 'apartments',
  },
  {
    id: 'prop-2',
    name: 'The Meridian',
    address: '800 Skyline Dr, Portland, OR',
    unitsCount: 24,
    occupancyRate: 100,
    monthlyRevenue: 78200,
    iconType: 'building',
  },
  {
    id: 'prop-3',
    name: 'Westside Hub',
    address: '45 Central Ave, Portland, OR',
    unitsCount: 32,
    occupancyRate: 82,
    monthlyRevenue: 64850,
    iconType: 'building',
  },
  {
    id: 'prop-4',
    name: 'Grove Gardens',
    address: '211 Rosewood Ct, Beaverton, OR',
    unitsCount: 12,
    occupancyRate: 92,
    monthlyRevenue: 57000,
    iconType: 'house',
  },
];

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 't-1',
    name: 'Alex Chen',
    email: 'alex.chen@oakwood.com',
    phone: '+1 (555) 987-6543',
    leaseStart: '2023-01-01',
    leaseEnd: '2024-06-30',
    status: 'Active',
    unitNumber: '402',
    propertyName: 'Oakwood Lofts',
  },
  {
    id: 't-2',
    name: 'Elena Martinez',
    email: 'elena.m@provider.com',
    phone: '+1 (555) 012-3456',
    leaseStart: '2023-10-01',
    leaseEnd: '2024-09-30',
    status: 'Active',
    unitNumber: '4B',
    propertyName: '123 Maple St Apartments',
  },
  {
    id: 't-3',
    name: 'Alex Thompson',
    email: 'alex.t@grandview.com',
    phone: '+1 (555) 234-5678',
    leaseStart: '2023-05-01',
    leaseEnd: '2024-04-30',
    status: 'Active',
    unitNumber: '402B',
    propertyName: 'Grandview Apartments',
  },
  {
    id: 't-4',
    name: 'Jordan Rivera',
    email: 'jordan.r@skyline.com',
    phone: '+1 (555) 345-6789',
    leaseStart: '2022-11-01',
    leaseEnd: '2023-10-31',
    status: 'Active',
    unitNumber: '12A',
    propertyName: 'Skyline Lofts',
  },
  {
    id: 't-5',
    name: 'Sarah Chen',
    email: 'sarah.c@oakwoodheights.com',
    phone: '+1 (555) 456-7890',
    leaseStart: '2023-09-15',
    leaseEnd: '2024-09-14',
    status: 'Active',
    unitNumber: '104',
    propertyName: 'Oakwood Heights',
  },
  {
    id: 't-6',
    name: 'Michael Scott',
    email: 'michael.s@dundermifflin.com',
    phone: '+1 (555) 567-8901',
    leaseStart: '2021-06-01',
    leaseEnd: '2024-05-31',
    status: 'Active',
    unitNumber: '501C',
    propertyName: 'Grandview Apartments',
  },
  {
    id: 't-7',
    name: 'Michael R. Henderson',
    email: 'michael.h@willowcreek.com',
    phone: '+1 (555) 876-5432',
    leaseStart: '2022-10-01',
    leaseEnd: '2023-09-30',
    status: 'Active',
    unitNumber: '405B',
    propertyName: 'Willow Creek Lofts',
  }
];

export const INITIAL_UNITS: Unit[] = [
  {
    id: 'u-1',
    propertyId: 'prop-1',
    propertyName: 'Oakwood Lofts',
    unitNumber: '402',
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1100,
    baseRent: 2300,
    utilities: [
      { id: 'util-1', name: 'Electricity', amount: 110 },
      { id: 'util-2', name: 'Water & Sewage', amount: 40 },
    ],
    activeTenant: INITIAL_TENANTS[0],
    leaseDocs: [
      { name: 'Master Lease Agreement', size: '2.4 MB', date: 'Jul 12, 2023' },
      { name: 'Building Rules & Regs', size: '1.1 MB', date: 'Jan 2023' },
      { name: 'Insurance Certificate', size: '450 KB', date: 'Jul 2024' },
    ],
  },
  {
    id: 'u-2',
    propertyId: 'prop-1',
    propertyName: 'Oakwood Lofts',
    unitNumber: '4B',
    bedrooms: 2,
    bathrooms: 1,
    sqft: 850,
    baseRent: 1850,
    utilities: [
      { id: 'util-3', name: 'Electricity', amount: 120 },
      { id: 'util-4', name: 'Garbage Collection', amount: 25 },
      { id: 'util-5', name: 'Water & Sewage', amount: 45 },
    ],
    activeTenant: INITIAL_TENANTS[1], // Elena Martinez
    leaseDocs: [
      { name: 'Lease_Agreement_4B.pdf', size: '2.4 MB', date: 'Jul 12, 2023' },
      { name: 'Inspection_Report_Sep23.pdf', size: '1.1 MB', date: 'Jan 2023' },
      { name: 'Renters_Insurance_Proof.pdf', size: '450 KB', date: 'Jul 2024' },
    ],
  },
  {
    id: 'u-3',
    propertyId: 'prop-1',
    propertyName: 'Oakwood Lofts',
    unitNumber: '204',
    bedrooms: 1,
    bathrooms: 1,
    sqft: 720,
    baseRent: 1650,
    utilities: [
      { id: 'util-6', name: 'Electricity', amount: 95 },
      { id: 'util-7', name: 'Garbage Collection', amount: 20 },
    ],
    activeTenant: {
      id: 't-8',
      name: 'Alex Rivera',
      email: 'alex.rivera@oakwood.com',
      phone: '+1 (555) 765-4321',
      leaseStart: '2023-02-01',
      leaseEnd: '2024-01-31',
      status: 'Active',
      unitNumber: '204',
      propertyName: 'Oakwood Lofts',
    },
    leaseDocs: [
      { name: 'Lease_Agreement_204.pdf', size: '1.9 MB', date: 'Feb 01, 2023' },
    ],
  },
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    propertyName: 'Grandview Apartments',
    unitNumber: '402B',
    tenantName: 'Alex Thompson',
    month: 'November 2023',
    totalDue: 2450.00,
    baseRent: 2200.00,
    utilityCharges: 250.00,
    status: 'Paid',
    datePaid: 'Nov 02, 2023',
    breakdown: ['rent', 'utilities'],
  },
  {
    id: 'pay-2',
    propertyName: 'Skyline Lofts',
    unitNumber: '12A',
    tenantName: 'Jordan Rivera',
    month: 'November 2023',
    totalDue: 3100.00,
    baseRent: 3100.00,
    utilityCharges: 0.00,
    status: 'Overdue',
    breakdown: ['rent'],
  },
  {
    id: 'pay-3',
    propertyName: 'Oakwood Heights',
    unitNumber: '104',
    tenantName: 'Sarah Chen',
    month: 'November 2023',
    totalDue: 1850.00,
    baseRent: 1650.00,
    utilityCharges: 200.00,
    status: 'Pending',
    breakdown: ['rent', 'utilities'],
  },
  {
    id: 'pay-4',
    propertyName: 'Grandview Apartments',
    unitNumber: '501C',
    tenantName: 'Michael Scott',
    month: 'November 2023',
    totalDue: 2200.00,
    baseRent: 2200.00,
    utilityCharges: 0.00,
    status: 'Partial',
    partialAmountPaid: 1000.00,
    datePaid: 'Nov 05, 2023',
    breakdown: ['rent'],
  },
  {
    id: 'pay-5',
    propertyName: 'Oakwood Lofts',
    unitNumber: '402',
    tenantName: 'Alex Chen',
    month: 'October 2023',
    totalDue: 2450.00,
    baseRent: 2300.00,
    utilityCharges: 150.00,
    status: 'Paid',
    datePaid: 'Sep 02, 2023',
    breakdown: ['rent', 'utilities'],
  },
];

export const INITIAL_SERVICE_REQUESTS: ServiceRequest[] = [
  {
    id: 'sr-1',
    title: 'AC Unit blowing warm air',
    category: 'HVAC',
    status: 'Pending',
    dateCreated: '2026-07-15',
    description: 'The AC unit in the master bedroom has stopped cooling. It is blowing room temperature air.',
  },
];

export const INITIAL_STATEMENTS: Statement[] = [
  {
    statementNo: 'INV-2023-10-405B',
    billingPeriod: 'Oct 1 - Oct 31, 2023',
    dateIssued: 'Oct 01, 2023',
    datePaid: 'Oct 03, 2023',
    tenantName: 'Michael R. Henderson',
    tenantEmail: 'michael.h@willowcreek.com',
    tenantAddress: '4522 Riverbank Way, Portland OR 97201',
    unitNumber: '405B',
    propertyName: 'Willow Creek Lofts',
    propertyAddress: '4522 Riverbank Way, Portland, OR 97201',
    managerName: 'Alex Thompson',
    managerAddress: '1248 Skyline Tower, Suite 400',
    managerEmail: 'contact@promanagepro.com',
    items: [
      {
        description: 'Base Residential Rent (October 2023 Occupancy)',
        quantity: 1,
        unitPrice: 1200.00,
        amount: 1200.00,
      },
      {
        description: 'Utilities (Water & Sewer) (Metered Usage: 450 Gal)',
        quantity: 1,
        unitPrice: 40.00,
        amount: 40.00,
      },
      {
        description: 'Utilities (Electricity) (Prorated shared common area charge)',
        quantity: 1,
        unitPrice: 85.00,
        amount: 85.00,
      },
    ],
    notes: 'Thank you for your prompt payment. This receipt confirms that your account is in good standing. Please keep this document for your records. Next billing cycle starts Nov 1, 2023.',
  },
];

// Helper to save state in local storage for high-fidelity interactive experience
export function getSavedState<T>(key: string, initialValue: T): T {
  try {
    const saved = localStorage.getItem(`promanage_${key}`);
    return saved ? JSON.parse(saved) : initialValue;
  } catch (e) {
    return initialValue;
  }
}

export function saveState<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`promanage_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save state to localStorage:', e);
  }
}
