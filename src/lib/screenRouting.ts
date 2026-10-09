/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { OwnerScreen, Persona, TenantScreen } from '../types';

// Maps in-app screen state to/from the browser URL. The URL is the source
// of truth (so back/forward and refresh work); App.tsx's screen state is
// just a mirror of it, kept in sync via these pure functions.

export interface ScreenRouteContext {
  unitId?: string;
}

export function screenToPath(
  persona: Persona,
  screen: OwnerScreen | TenantScreen,
  ctx?: ScreenRouteContext,
): string {
  if (persona === 'owner') {
    switch (screen as OwnerScreen) {
      case 'dashboard': return '/';
      case 'properties': return '/properties';
      case 'configure-unit':
        return ctx?.unitId ? `/units/${encodeURIComponent(ctx.unitId)}` : '/properties';
      case 'payments': return '/payments';
      case 'service-requests': return '/service-requests';
      case 'reports': return '/reports';
      case 'settings': return '/settings';
      case 'help': return '/help';
      default: return '/';
    }
  }

  switch (screen as TenantScreen) {
    case 'dashboard': return '/';
    case 'property-details': return '/property-details';
    case 'payments': return '/payments';
    case 'documents': return '/documents';
    case 'settings': return '/settings';
    case 'help': return '/help';
    default: return '/';
  }
}

export interface ResolvedScreen {
  screen: OwnerScreen | TenantScreen;
  unitId?: string;
}

export function pathToScreen(persona: Persona, pathname: string): ResolvedScreen {
  const segments = pathname.split('/').filter(Boolean).map(decodeURIComponent);

  if (persona === 'owner') {
    if (segments.length === 0) return { screen: 'dashboard' };
    if (segments[0] === 'units' && segments.length >= 2) {
      return { screen: 'configure-unit', unitId: segments[1] };
    }
    const owner: OwnerScreen[] = ['dashboard', 'properties', 'payments', 'service-requests', 'reports', 'settings', 'help'];
    const match = owner.find((s) => s === segments[0]);
    return { screen: match ?? 'dashboard' };
  }

  if (segments.length === 0) return { screen: 'dashboard' };
  const tenant: TenantScreen[] = ['dashboard', 'property-details', 'payments', 'documents', 'settings', 'help'];
  const match = tenant.find((s) => s === segments[0]);
  return { screen: match ?? 'dashboard' };
}
