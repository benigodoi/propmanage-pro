/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Theme = 'light' | 'dark';
export type Persona = 'owner' | 'tenant';

export type OwnerScreen = 'dashboard' | 'properties' | 'configure-unit' | 'payments' | 'reports' | 'settings' | 'help';
export type TenantScreen = 'dashboard' | 'property-details' | 'payments' | 'documents' | 'settings' | 'help';

export interface Property {
  id: string;
  name: string;
  address: string;
  unitsCount: number;
  occupancyRate: number;
  monthlyRevenue: number;
  iconType: 'building' | 'house' | 'apartments';
}

export interface LeaseDoc {
  name: string;
  size: string;
  date: string;
  downloadUrl?: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  leaseStart: string;
  leaseEnd: string;
  status: 'Active' | 'Pending' | 'Terminated';
  unitNumber?: string;
  propertyName?: string;
}

export interface UtilityItem {
  id: string;
  name: string;
  amount: number;
}

export interface Unit {
  id: string;
  propertyId: string;
  propertyName: string;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  baseRent: number;
  utilities: UtilityItem[];
  activeTenant?: Tenant;
  leaseDocs?: LeaseDoc[];
}

export interface Payment {
  id: string;
  propertyName: string;
  propertyAddress?: string;
  unitNumber: string;
  tenantName: string;
  tenantEmail?: string;
  managerOrgName?: string;
  month: string;
  totalDue: number;
  baseRent: number;
  utilityCharges: number;
  utilityBreakdown?: UtilityItem[];
  status: 'Paid' | 'Overdue' | 'Pending' | 'Partial';
  datePaid?: string;
  partialAmountPaid?: number;
  breakdown: ('rent' | 'utilities')[];
}

export interface ServiceRequest {
  id: string;
  title: string;
  category: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  dateCreated: string;
  description: string;
}
