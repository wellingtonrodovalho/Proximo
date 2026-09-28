import { Unit, UnitTypology, UnitBlock, GuestRequest, AuditLog, SystemConfig } from '../types';
import { createAuditEntry } from './audit';

const STORAGE_KEYS = {
  UNITS: 'crystal_units_v5',
  REQUESTS: 'crystal_requests_v5',
  AUDIT: 'crystal_audit_v5',
  CONFIG: 'crystal_config_v5',
  CURRENT_USER_HOST_UNIT: 'crystal_current_host_unit_v5',
};

// Purge legacy cache from browser localStorage to ensure Crystal Place layout loads immediately
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
      'rotativo302_units_v3_clean',
      'rotativo302_requests_v3_clean',
      'rotativo302_audit_v3_clean',
      'rotativo302_config_v3_clean',
      'rotativo302_current_host_unit',
      'proximo_access_accounts_v3_clean',
      'crystal_units_v4',
      'crystal_requests_v4',
      'crystal_audit_v4',
      'crystal_config_v4',
      'crystal_current_host_unit_v4',
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

// Active pool hosts seeded to guarantee immediate availability for demo & testing
interface SeedHostConfig {
  ownerName: string;
  managerName?: string;
  managementType: 'anfitriao' | 'co_anfitriao';
  managementRoleTitle: string;
  ownerEmail: string;
  ownerPhone: string;
  whatsapp: string;
  queuePosition: number;
}

const SEED_ACTIVE_HOSTS: Record<string, SeedHostConfig> = {
  // 1º da fila: Wellington Rodovalho - Proprietário da unidade 1609 (16º andar)
  '1609': {
    ownerName: 'Wellington Rodovalho',
    managerName: 'Wellington Rodovalho',
    managementType: 'anfitriao',
    managementRoleTitle: 'Anfitrião (Proprietário)',
    ownerEmail: 'Wellington.Rodovalho@gmail.com',
    ownerPhone: '(62) 99999-0001',
    whatsapp: '(62) 99999-0001',
    queuePosition: 1,
  },
  // 2º da fila: Wellington Rodovalho - Administra (Co-Anfitrião) a Unidade 1701 (17º andar)
  '1701': {
    ownerName: 'Proprietário Unidade 1701',
    managerName: 'Wellington Rodovalho',
    managementType: 'co_anfitriao',
    managementRoleTitle: 'Co-Anfitrião (Administrador)',
    ownerEmail: 'Wellington.Rodovalho@gmail.com',
    ownerPhone: '(62) 99999-0001',
    whatsapp: '(62) 99999-0001',
    queuePosition: 2,
  },
  '103': {
    ownerName: 'Dra. Mariana Castro',
    managementType: 'anfitriao',
    managementRoleTitle: 'Anfitrião (Proprietário)',
    ownerEmail: 'mariana.castro@crystalplace.com',
    ownerPhone: '(62) 99911-1003',
    whatsapp: '(62) 99911-1003',
    queuePosition: 3,
  },
  '201': {
    ownerName: 'Carlos Eduardo Mendes',
    managementType: 'co_anfitriao',
    managementRoleTitle: 'Co-Anfitrião (Administrador)',
    ownerEmail: 'carlos.mendes@crystalplace.com',
    ownerPhone: '(62) 99922-2001',
    whatsapp: '(62) 99922-2001',
    queuePosition: 4,
  },
  '303': {
    ownerName: 'Roberto Farias',
    managementType: 'anfitriao',
    managementRoleTitle: 'Anfitrião (Proprietário)',
    ownerEmail: 'roberto.farias@crystalplace.com',
    ownerPhone: '(62) 99933-3003',
    whatsapp: '(62) 99933-3003',
    queuePosition: 5,
  },
  '502': {
    ownerName: 'Juliana Paes de Barros',
    managementType: 'anfitriao',
    managementRoleTitle: 'Anfitrião (Proprietário)',
    ownerEmail: 'juliana.paes@crystalplace.com',
    ownerPhone: '(62) 99955-5002',
    whatsapp: '(62) 99955-5002',
    queuePosition: 6,
  },
  '703': {
    ownerName: 'Fernando Albuquerque',
    managementType: 'co_anfitriao',
    managementRoleTitle: 'Co-Anfitrião (Administrador)',
    ownerEmail: 'fernando.albuquerque@crystalplace.com',
    ownerPhone: '(62) 99977-7003',
    whatsapp: '(62) 99977-7003',
    queuePosition: 7,
  },
  '901': {
    ownerName: 'Patrícia Nogueira',
    managementType: 'anfitriao',
    managementRoleTitle: 'Anfitrião (Proprietário)',
    ownerEmail: 'patricia.nogueira@crystalplace.com',
    ownerPhone: '(62) 99999-9001',
    whatsapp: '(62) 99999-9001',
    queuePosition: 8,
  },
  '1203': {
    ownerName: 'Lucas Vasconcelos',
    managementType: 'anfitriao',
    managementRoleTitle: 'Anfitrião (Proprietário)',
    ownerEmail: 'lucas.vasconcelos@crystalplace.com',
    ownerPhone: '(62) 99912-1203',
    whatsapp: '(62) 99912-1203',
    queuePosition: 9,
  },
  '1402': {
    ownerName: 'Beatriz Vasques',
    managementType: 'co_anfitriao',
    managementRoleTitle: 'Co-Anfitrião (Administrador)',
    ownerEmail: 'beatriz.vasques@crystalplace.com',
    ownerPhone: '(62) 99914-1402',
    whatsapp: '(62) 99914-1402',
    queuePosition: 10,
  },
  '1803': {
    ownerName: 'Guilherme Siqueira',
    managementType: 'anfitriao',
    managementRoleTitle: 'Anfitrião (Proprietário)',
    ownerEmail: 'guilherme.siqueira@crystalplace.com',
    ownerPhone: '(62) 99918-1803',
    whatsapp: '(62) 99918-1803',
    queuePosition: 11,
  },
  '2001': {
    ownerName: 'Camila Drummond',
    managementType: 'anfitriao',
    managementRoleTitle: 'Anfitrião (Proprietário)',
    ownerEmail: 'camila.drummond@crystalplace.com',
    ownerPhone: '(62) 99920-2001',
    whatsapp: '(62) 99920-2001',
    queuePosition: 12,
  },
  '2203': {
    ownerName: 'Thiago Esteves',
    managementType: 'co_anfitriao',
    managementRoleTitle: 'Co-Anfitrião (Administrador)',
    ownerEmail: 'thiago.esteves@crystalplace.com',
    ownerPhone: '(62) 99922-2203',
    whatsapp: '(62) 99922-2203',
    queuePosition: 13,
  },
  '2501': {
    ownerName: 'Daniela Meirelles',
    managementType: 'anfitriao',
    managementRoleTitle: 'Anfitrião (Proprietário)',
    ownerEmail: 'daniela.meirelles@crystalplace.com',
    ownerPhone: '(62) 99925-2501',
    whatsapp: '(62) 99925-2501',
    queuePosition: 14,
  },
};

/**
 * Generates all units of Crystal Place Residence:
 * - 25 andares (1º ao 25º)
 * - 13 unidades por andar (01 a 13)
 * - Unidades final 3 possuem 35 m²
 * - Demais unidades possuem 33 m²
 * - Unidade 1609: Proprietário Wellington Rodovalho (Anfitrião) - Fila #1 (Ativo)
 * - Unidade 1701: Co-Anfitrião (Administrador) Wellington Rodovalho - Fila #2 (Ativo)
 * - Fila com anfitriões participantes ativos para atendimento imediato de balcão
 */
export function generateCrystalPlaceUnits(): Unit[] {
  const units: Unit[] = [];
  const block: UnitBlock = 'Torre Única';
  let counter = 0;

  for (let floor = 1; floor <= 25; floor++) {
    for (let u = 1; u <= 13; u++) {
      counter++;
      const unitNumber = `${floor}${u < 10 ? '0' + u : u}`;
      
      // As unidades com final 3 (coluna 03) têm 35m², as demais são de 33m²
      const isFinal3 = u === 3;
      const area = isFinal3 ? 35 : 33;

      const seedHost = SEED_ACTIVE_HOSTS[unitNumber];
      const isWellington1609 = unitNumber === '1609';
      const isWellington1701 = unitNumber === '1701';

      let ownerName = seedHost ? seedHost.ownerName : '';
      let managerName = seedHost ? seedHost.managerName : undefined;
      let managementType = seedHost ? seedHost.managementType : undefined;
      let managementRoleTitle = seedHost ? seedHost.managementRoleTitle : undefined;
      let ownerEmail = seedHost ? seedHost.ownerEmail : '';
      let ownerPhone = seedHost ? seedHost.ownerPhone : '';
      let whatsapp = seedHost ? seedHost.whatsapp : '';
      const isAvailableByHost = Boolean(seedHost);
      const queuePosition = seedHost ? seedHost.queuePosition : 9999;

      // Todos os imóveis possuem 1 quarto
      const typology: UnitTypology = '1 Quarto';
      const roomsCount = 1 as const;

      // Distribuição de camas conforme planta e capacidade
      // Unidades Wellington comportam até 4 pessoas (1 Queen + 1 Sofá-Cama)
      let bedsCount = 1;
      let bedTypes: Unit['bedTypes'] = [{ type: 'Cama Casal Queen', quantity: 1 }];
      let bedSummary = '1 Cama Queen';
      let capacity = 2;
      let basePrice = 220; // Mínimo R$ 200,00

      if (isWellington1609 || isWellington1701 || isFinal3) {
        bedsCount = 2;
        bedTypes = [
          { type: 'Cama Casal Queen', quantity: 1 },
          { type: 'Sofá-Cama Casal', quantity: 1 },
        ];
        bedSummary = '1 Cama Queen + 1 Sofá-Cama';
        capacity = 4;
        basePrice = isFinal3 ? 260 : 230;
      } else if (counter % 3 === 0) {
        bedsCount = 2;
        bedTypes = [
          { type: 'Cama Casal Padrão', quantity: 1 },
          { type: 'Bicama Solteiro', quantity: 1 },
        ];
        bedSummary = '1 Cama Casal + 1 Bicama Solteiro';
        capacity = 3;
        basePrice = 240;
      } else if (counter % 3 === 1) {
        bedsCount = 2;
        bedTypes = [
          { type: 'Cama Solteiro', quantity: 2 },
        ];
        bedSummary = '2 Camas Solteiro';
        capacity = 2;
        basePrice = 210;
      } else {
        bedsCount = 1;
        bedTypes = [{ type: 'Cama Casal Queen', quantity: 1 }];
        bedSummary = '1 Cama Casal Queen';
        capacity = 2;
        basePrice = 220;
      }

      // Andares altos (>= 20) contam com vista panorâmica da cidade
      if (floor >= 20) {
        basePrice += 40;
      }

      const isEligibleByAdmin = true;
      const photoUrl = UNIT_PHOTOS[counter % UNIT_PHOTOS.length];

      units.push({
        id: `unit-${unitNumber}`,
        unitNumber,
        block,
        floor,
        area,
        roomsCount,
        typology,
        bedsCount,
        bedTypes,
        bedSummary,
        capacity,
        basePrice,
        cleaningFee: 80,
        ownerName,
        managerName,
        managementType,
        managementRoleTitle,
        ownerEmail,
        ownerPhone,
        whatsapp,
        isEligibleByAdmin,
        isAvailableByHost,
        queuePosition,
        totalBookingsCompleted: 0,
        totalCallsReceived: 0,
        totalRejections: 0,
        totalTimeouts: 0,
        amenities: [
          'Wi-Fi 500Mbps', 
          'Ar Condicionado Dual Inverter', 
          'Smart TV 55"', 
          'Cozinha Completa', 
          'Garagem Coberta', 
          'Piscina & Sauna'
        ],
        houseRules: [
          'Não fumante', 
          'Silêncio após 22h', 
          'Proibido festas e eventos', 
          'Check-in facilitado 24h na recepção'
        ],
        photoUrl,
      });
    }
  }

  return units;
}

// Backward compatibility alias
export const generate302Units = generateCrystalPlaceUnits;

export function getDefaultConfig(): SystemConfig {
  return {
    complexName: 'Crystal Place Residence',
    totalFloors: 25,
    unitsPerFloor: 13,
    timeoutMinutes: 5,
    demoFastTimeoutSeconds: 45,
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
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].floor !== undefined) {
        const activeCount = parsed.filter(u => u.isEligibleByAdmin && u.isAvailableByHost).length;
        
        // If loaded data has no active units or missing Wellington setup, self-heal
        if (activeCount === 0 || !parsed.some(u => u.unitNumber === '1609' && u.isAvailableByHost)) {
          const fresh = generateCrystalPlaceUnits();
          saveUnits(fresh);
          return fresh;
        }

        return parsed.map((u, idx) => {
          const uNum = parseInt(u.unitNumber.slice(-2), 10);
          const isFinal3 = uNum === 3 || u.unitNumber.endsWith('03');
          const area = u.area || (isFinal3 ? 35 : 33);
          return {
            ...u,
            area,
            block: 'Torre Única' as const,
            roomsCount: 1 as const,
            typology: '1 Quarto' as const,
            basePrice: Math.max(200, u.basePrice || 200),
            whatsapp: u.whatsapp || u.ownerPhone || '(62) 99999-0001',
            bedsCount: u.bedsCount || (idx % 2 === 0 ? 2 : 1),
            bedSummary: u.bedSummary || (idx % 2 === 0 ? '1 Cama Queen + 1 Sofá-Cama' : '1 Cama Casal Queen'),
          };
        });
      }
    }
  } catch (e) {
    console.error('Failed to load units from storage', e);
  }
  const initial = generateCrystalPlaceUnits();
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
        estimatedWaitMinutes: r.estimatedWaitMinutes || 5,
        queuePositionAtEntry: r.queuePositionAtEntry || 1,
        deviceNotified: r.deviceNotified ?? true,
        assignedUnitBedSummary: r.assignedUnitBedSummary || '1 Cama Casal Queen',
      }));
    }
  } catch (e) {
    console.error('Failed to load requests from storage', e);
  }

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
      'Sistema PROXIMO inicializado no Crystal Place Residence (25 andares, 13 unidades por andar). Fila virtual neutra e transparente ativa com unidades 1609 (Anfitrião) e 1701 (Co-Anfitrião).'
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
    localStorage.removeItem('proximo_access_accounts_crystal_v5');
    localStorage.removeItem('proximo_auth_session');
    sessionStorage.clear();
    const freshUnits = generateCrystalPlaceUnits();
    saveUnits(freshUnits);
    saveRequests([]);
    saveAuditLogs([
      createAuditEntry(
        'SYSTEM_INITIALIZED',
        'Síndico/Admin',
        'Sistema limpo e inicializado no Crystal Place Residence (25 andares, 13 unidades por andar). Fila ativa pronta para recebimento de hóspedes.'
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
      parsed.complexName = 'Crystal Place Residence';
      parsed.totalFloors = 25;
      parsed.unitsPerFloor = 13;
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
  return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_HOST_UNIT) || 'unit-1609';
}

export function setSelectedHostUnitId(unitId: string): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER_HOST_UNIT, unitId);
}
