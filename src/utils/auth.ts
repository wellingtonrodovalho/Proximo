/**
 * Authentication and Access Management
 * PROXIMO - Crystal Place Residence
 */

export type UserRole = 'guest' | 'host' | 'reception' | 'admin';
export type AccessRole = 'host' | 'reception' | 'admin';
export type AccessStatus = 'pending' | 'approved' | 'rejected';
export type ManagementType = 'anfitriao' | 'co_anfitriao';

export interface AccessAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AccessRole;
  managementType?: ManagementType; // Anfitrião (Proprietário) ou Co-Anfitrião (Administrador)
  unitNumber?: string;
  managedUnits?: string[]; // Multiple units managed by the same person
  status: AccessStatus;
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface AuthSession {
  role: AccessRole;
  accountId?: string;
  unitId?: string;
  unitNumber?: string;
  managedUnits?: string[];
  managementType?: ManagementType;
  userName: string;
  userEmail: string;
  userPhone: string;
  authenticatedAt: string;
}

const STORAGE_KEYS = {
  SESSION: 'proximo_auth_session',
  ACCOUNTS: 'proximo_access_accounts_crystal_v5',
};

// Purge old account cache to guarantee clean state
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('proximo_access_accounts_v1');
    localStorage.removeItem('proximo_access_accounts_clean_v1');
    localStorage.removeItem('proximo_access_accounts_pristine_v2');
    localStorage.removeItem('proximo_access_accounts_v3_clean');
    localStorage.removeItem('proximo_access_accounts_crystal_v4');
  } catch (e) {
    // Ignore restricted storage contexts
  }
}

// Seed master accounts:
// Wellington Rodovalho:
// - Administrador Geral
// - Proprietário da unidade 1609 no 16º andar (Anfitrião)
// - Administra a Unidade 1701 no 17º andar (Co-Anfitrião / Administrador)
export const INITIAL_ACCOUNTS: AccessAccount[] = [
  {
    id: 'acc-admin',
    name: 'Wellington Rodovalho',
    email: 'Wellington.Rodovalho@gmail.com',
    phone: '(62) 99999-0001',
    role: 'admin',
    managementType: 'anfitriao',
    unitNumber: '1609',
    managedUnits: ['1609', '1701'],
    status: 'approved',
    requestedAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    approvedBy: 'Sistema Master',
  },
  {
    id: 'acc-host-1609',
    name: 'Wellington Rodovalho (Proprietário)',
    email: 'wellington.1609@crystalplace.com',
    phone: '(62) 99999-1609',
    role: 'host',
    managementType: 'anfitriao',
    unitNumber: '1609',
    managedUnits: ['1609'],
    status: 'approved',
    requestedAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    approvedBy: 'Wellington Rodovalho',
  },
  {
    id: 'acc-host-1701',
    name: 'Wellington Rodovalho (Co-Anfitrião)',
    email: 'wellington.1701@crystalplace.com',
    phone: '(62) 99999-1701',
    role: 'host',
    managementType: 'co_anfitriao',
    unitNumber: '1701',
    managedUnits: ['1701'],
    status: 'approved',
    requestedAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    approvedBy: 'Wellington Rodovalho',
  },
  {
    id: 'acc-reception',
    name: 'Portaria & Balcão 24h',
    email: 'portaria@crystalplace.com',
    phone: '(62) 3000-0000',
    role: 'reception',
    status: 'approved',
    requestedAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    approvedBy: 'Wellington Rodovalho',
  }
];

export function loadAccessAccounts(): AccessAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (!raw) {
      saveAccessAccounts(INITIAL_ACCOUNTS);
      return INITIAL_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ACCOUNTS;
  } catch {
    return INITIAL_ACCOUNTS;
  }
}

export function saveAccessAccounts(accounts: AccessAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save access accounts', e);
  }
}

export function getStoredSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.SESSION) || localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession): void {
  try {
    const serialized = JSON.stringify(session);
    sessionStorage.setItem(STORAGE_KEYS.SESSION, serialized);
    localStorage.setItem(STORAGE_KEYS.SESSION, serialized);
  } catch (e) {
    console.error('Failed to save session', e);
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  } catch (e) {
    console.error('Failed to clear session', e);
  }
}

export function getRoleFromUrl(): UserRole {
  if (typeof window === 'undefined') return 'guest';
  const params = new URLSearchParams(window.location.search);
  const portal = params.get('portal') || params.get('area') || params.get('role');
  
  if (portal === 'anfitriao' || portal === 'host' || portal === 'proprietario') return 'host';
  if (portal === 'portaria' || portal === 'reception' || portal === 'balcao') return 'reception';
  if (portal === 'admin' || portal === 'administracao' || portal === 'sindico') return 'admin';
  
  const hash = window.location.hash.toLowerCase();
  if (hash.includes('anfitriao') || hash.includes('host')) return 'host';
  if (hash.includes('portaria') || hash.includes('reception')) return 'reception';
  if (hash.includes('admin') || hash.includes('sindico')) return 'admin';

  return 'guest';
}

export function getUnitParamFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('apto') || params.get('unit') || params.get('apartamento');
}

export function buildPortalUrl(role: UserRole, unitNumber?: string): string {
  if (typeof window === 'undefined') return '';
  const base = window.location.origin + window.location.pathname;
  if (role === 'guest') return base;
  
  const portalName = role === 'host' ? 'anfitriao' : role === 'reception' ? 'portaria' : 'admin';
  let url = `${base}?portal=${portalName}`;
  if (role === 'host' && unitNumber) {
    url += `&apto=${encodeURIComponent(unitNumber)}`;
  }
  return url;
}
