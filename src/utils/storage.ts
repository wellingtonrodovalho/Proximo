import { Unit, UnitTypology, UnitBlock, GuestRequest, AuditLog, SystemConfig } from '../types';
import { createAuditEntry } from './audit';

const STORAGE_KEYS = {
  UNITS: 'rotativo302_units_v3_clean',
  REQUESTS: 'rotativo302_requests_v3_clean',
  AUDIT: 'rotativo302_audit_v3_clean',
  CONFIG: 'rotativo302_config_v3_clean',
  CURRENT_USER_HOST_UNIT: 'rotativo302_current_host_unit',
};

// Purge legacy and mock data from browser localStorage to guarantee completely clean database
if (typeof window !== 'undefined') {
  try {
    [
      'rotativo302_units',
      'rotativo302_requests',
      'rotativo302_audit',
      'rotativo302_config',
      'proximo_access_accounts_v1',
      'rotativo302_units_clean_v1',
      'rotativo302_requests_clean_v1',
      'rotativo302_audit_clean_v1',
      'rotativo302_config_clean_v1',
      'proximo_access_accounts_clean_v1',
      'rotativo302_units_pristine_v2',
      'rotativo302_requests_pristine_v2',
      'rotativo302_audit_pristine_v2',
      'rotativo302_config_pristine_v2',
      'proximo_access_accounts_pristine_v2',
    ].forEach(k => {
      localStorage.removeItem(k);
    });
  } catch (e) {
    // Ignore storage errors in restricted contexts
  }
}

const UNIT_PHOTOS: string[] = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1502005229762-ae1b46a36f90?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
];

export function generate302Units(): Unit[] {
  const units: Unit[] = [];
  const block: UnitBlock = 'Torre Única';
  let count = 0;

  // Single tower with 302 units (26 floors, 11-12 units per floor)
  // All units start clean with NO mock owners.
  // Owners are only registered when an actual host requests access and is accredited by the administrator.
  // Exception: Unit 302 is pre-assigned to Wellington Rodovalho (Admin/Síndico & Anfitrião).
  for (let floor = 1; floor <= 26; floor++) {
    const unitsPerFloor = floor <= 16 ? 12 : 11;
    for (let u = 1; u <= unitsPerFloor; u++) {
      if (count >= 302) break;
      count++;

      const unitNumber = `${floor}${u < 10 ? '0' + u : u}`;
      const isWellingtonUnit = unitNumber === '302';

      // Clean state: no mock owners or fake data
      const ownerName = isWellingtonUnit ? 'Wellington Rodovalho' : '';
      const ownerEmail = isWellingtonUnit ? 'Wellington.Rodovalho@gmail.com' : '';
      const ownerPhone = isWellingtonUnit ? '(62) 99999-0001' : '';
      const whatsapp = isWellingtonUnit ? '(62) 99999-0001' : '';

      // Todos os imóveis do complexo possuem exatamente 1 quarto
      const typology: UnitTypology = '1 Quarto';
      const roomsCount = 1 as const;

      // Distribuição de camas (número e tipos de camas)
      let bedsCount = 1;
      let bedTypes: Unit['bedTypes'] = [{ type: 'Cama Casal Queen', quantity: 1 }];
      let bedSummary = '1 Cama Queen';
      let capacity = 2;
      let basePrice = 220; // Mínimo R$ 200,00 obrigatório

      if (count % 4 === 0) {
        // 1 Queen + 1 Sofá-Cama Casal
        bedsCount = 2;
        bedTypes = [
          { type: 'Cama Casal Queen', quantity: 1 },
          { type: 'Sofá-Cama Casal', quantity: 1 },
        ];
        bedSummary = '1 Cama Queen + 1 Sofá-Cama';
        capacity = 4;
        basePrice = 280;
      } else if (count % 4 === 1) {
        // 1 Cama Casal Padrão + 1 Bicama Solteiro
        bedsCount = 2;
        bedTypes = [
          { type: 'Cama Casal Padrão', quantity: 1 },
          { type: 'Bicama Solteiro', quantity: 1 },
        ];
        bedSummary = '1 Cama Casal + 1 Bicama Solteiro';
        capacity = 3;
        basePrice = 240;
      } else if (count % 4 === 2) {
        // 2 Camas Solteiro + 1 Sofá-Cama
        bedsCount = 3;
        bedTypes = [
          { type: 'Cama Solteiro', quantity: 2 },
          { type: 'Sofá-Cama Casal', quantity: 1 },
        ];
        bedSummary = '2 Camas Solteiro + 1 Sofá-Cama';
        capacity = 4;
        basePrice = 260;
      } else {
        // 1 Cama Casal Queen Luxo
        bedsCount = 1;
        bedTypes = [{ type: 'Cama Casal Queen', quantity: 1 }];
        bedSummary = '1 Cama Casal Queen';
        capacity = 2;
        basePrice = 210;
      }

      // Andares altos têm vista privilegiada (preço balcão maior, sempre >= 200)
      if (floor >= 20) {
        basePrice += 60;
      }

      // Administrative status: all units start eligible by default in clean state
      const isEligibleByAdmin = true;
      const ineligibleReason = undefined;

      // Host availability: starts FALSE (0 hosts in queue) until an accredited host enables availability
      const isAvailableByHost = false;

      const photoUrl = UNIT_PHOTOS[count % UNIT_PHOTOS.length];

      units.push({
        id: `unit-${unitNumber}`,
        unitNumber,
        block,
        floor,
        roomsCount,
        typology,
        bedsCount,
        bedTypes,
        bedSummary,
        capacity,
        basePrice,
        cleaningFee: 80,
        ownerName,
        ownerEmail,
        ownerPhone,
        whatsapp,
        isEligibleByAdmin,
        ineligibleReason,
        isAvailableByHost,
        queuePosition: 9999,
        totalBookingsCompleted: 0,
        totalCallsReceived: 0,
        totalRejections: 0,
        totalTimeouts: 0,
        amenities: ['Wi-Fi 500Mbps', 'Ar Condicionado Dual Inverter', 'Smart TV 55"', 'Cozinha Completa', 'Garagem Coberta'],
        houseRules: ['Não fumante', 'Silêncio após 22h', 'Proibido festas e eventos'],
        photoUrl,
      });
    }
  }

  return units;
}

export function getDefaultConfig(): SystemConfig {
  return {
    complexName: 'Crystal Place Residence',
    totalUnitsCount: 302,
    timeoutMinutes: 5,
    demoFastTimeoutSeconds: 45, // optional fast mode toggle for easy demo
    allowPetFilter: true,
    autoReassignOnTimeout: true,
    requireDocumentPhoto: true,
    soundAlertsEnabled: true,
  };
}

export function loadUnits(): Unit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.UNITS);
    if (raw) {
      const parsed: Unit[] = JSON.parse(raw);
      // Ensure data conforms to constraints: minimum R$ 200 and bed configuration
      const sanitized = parsed.map((u, idx) => ({
        ...u,
        block: 'Torre Única' as const,
        roomsCount: 1 as const,
        typology: '1 Quarto' as const,
        basePrice: Math.max(200, u.basePrice || 200),
        whatsapp: u.whatsapp || u.ownerPhone || '(62) 99999-0001',
        bedsCount: u.bedsCount || (idx % 2 === 0 ? 2 : 1),
        bedSummary: u.bedSummary || (idx % 2 === 0 ? '1 Cama Queen + 1 Sofá-Cama' : '1 Cama Casal Queen'),
        bedTypes: u.bedTypes && u.bedTypes.length > 0 ? u.bedTypes : [
          { type: 'Cama Casal Queen' as const, quantity: 1 },
          ...(idx % 2 === 0 ? [{ type: 'Sofá-Cama Casal' as const, quantity: 1 }] : []),
        ],
      }));
      return sanitized;
    }
  } catch (e) {
    console.error('Failed to load units from storage', e);
  }
  const initial = generate302Units();
  saveUnits(initial);
  return initial;
}

export function saveUnits(units: Unit[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
  } catch (e) {
    console.error('Failed to save units to storage', e);
  }
}

export function loadRequests(): GuestRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    if (raw) {
      const parsed: GuestRequest[] = JSON.parse(raw);
      return parsed.map(r => ({
        ...r,
        estimatedWaitMinutes: r.estimatedWaitMinutes || 3,
        queuePositionAtEntry: r.queuePositionAtEntry || 1,
        deviceNotified: r.deviceNotified ?? true,
        assignedUnitBedSummary: r.assignedUnitBedSummary || '1 Cama Casal Queen',
      }));
    }
  } catch (e) {
    console.error('Failed to load requests from storage', e);
  }

  // Clean test state: starts with 0 requests
  const initial: GuestRequest[] = [];
  saveRequests(initial);
  return initial;
}

export function saveRequests(requests: GuestRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  } catch (e) {
    console.error('Failed to save requests to storage', e);
  }
}

export function loadAuditLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load audit logs from storage', e);
  }
  const initial = [
    createAuditEntry(
      'SYSTEM_INITIALIZED',
      'Síndico/Admin',
      'Sistema PROXIMO inicializado no Crystal Place Residence. Fila virtual neutra e transparente ativa.'
    ),
  ];
  saveAuditLogs(initial);
  return initial;
}

export function saveAuditLogs(logs: AuditLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save audit logs', e);
  }
}

export function clearAllTestData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.UNITS);
    localStorage.removeItem(STORAGE_KEYS.REQUESTS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT);
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
    localStorage.removeItem('proximo_access_accounts_v3_clean');
    localStorage.removeItem('proximo_auth_session');
    sessionStorage.clear();
    const freshUnits = generate302Units();
    saveUnits(freshUnits);
    saveRequests([]);
    saveAuditLogs([
      createAuditEntry(
        'SYSTEM_INITIALIZED',
        'Síndico/Admin',
        'Sistema limpo e inicializado no Crystal Place Residence. Nenhuma solicitação pendente.'
      ),
    ]);
  } catch (e) {
    console.error('Failed to clear test data', e);
  }
}

export function loadConfig(): SystemConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) {
      const parsed: SystemConfig = JSON.parse(raw);
      if (parsed.complexName !== 'Crystal Place Residence') {
        parsed.complexName = 'Crystal Place Residence';
        saveConfig(parsed);
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load config', e);
  }
  const initial = getDefaultConfig();
  saveConfig(initial);
  return initial;
}

export function saveConfig(config: SystemConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config', e);
  }
}

export function getSelectedHostUnitId(): string {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_HOST_UNIT) || 'unit-302';
}

export function setSelectedHostUnitId(unitId: string): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER_HOST_UNIT, unitId);
}
