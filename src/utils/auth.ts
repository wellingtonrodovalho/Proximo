/**
 * Authentication and Role Session Management
 * PROXIMO - Crystal Place Residence
 */

export type UserRole = 'guest' | 'host' | 'reception' | 'admin';

export interface AuthSession {
  role: 'host' | 'reception' | 'admin';
  unitId?: string; // For hosts
  unitNumber?: string;
  userName: string;
  authenticatedAt: string;
}

const AUTH_STORAGE_KEYS = {
  HOST_SESSION: 'proximo_auth_host',
  RECEPTION_SESSION: 'proximo_auth_reception',
  ADMIN_SESSION: 'proximo_auth_admin',
};

// Default passwords
export const DEFAULT_CREDENTIALS = {
  host: {
    defaultPassword: '123',
    hint: 'Número do Apto + Senha (padrão: 123)',
  },
  reception: {
    username: 'portaria',
    password: '242',
    hint: 'Usuário: portaria • Senha: 242',
  },
  admin: {
    username: 'admin',
    password: '302',
    hint: 'Usuário: admin • Senha: 302',
  },
};

export function getStoredSession(role: 'host' | 'reception' | 'admin'): AuthSession | null {
  try {
    const key = role === 'host' 
      ? AUTH_STORAGE_KEYS.HOST_SESSION 
      : role === 'reception' 
        ? AUTH_STORAGE_KEYS.RECEPTION_SESSION 
        : AUTH_STORAGE_KEYS.ADMIN_SESSION;
    
    const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession, remember: boolean = true): void {
  try {
    const key = session.role === 'host' 
      ? AUTH_STORAGE_KEYS.HOST_SESSION 
      : session.role === 'reception' 
        ? AUTH_STORAGE_KEYS.RECEPTION_SESSION 
        : AUTH_STORAGE_KEYS.ADMIN_SESSION;
    
    const serialized = JSON.stringify(session);
    sessionStorage.setItem(key, serialized);
    if (remember) {
      localStorage.setItem(key, serialized);
    }
  } catch (e) {
    console.error('Failed to save auth session', e);
  }
}

export function clearSession(role: 'host' | 'reception' | 'admin'): void {
  try {
    const key = role === 'host' 
      ? AUTH_STORAGE_KEYS.HOST_SESSION 
      : role === 'reception' 
        ? AUTH_STORAGE_KEYS.RECEPTION_SESSION 
        : AUTH_STORAGE_KEYS.ADMIN_SESSION;
    
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
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
  
  // Also check hash
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
