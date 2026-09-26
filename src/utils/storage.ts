import { Unit, UnitTypology, UnitBlock, GuestRequest, AuditLog, SystemConfig } from '../types';
import { createAuditEntry } from './audit';

const STORAGE_KEYS = {
  UNITS: 'rotativo302_units',
  REQUESTS: 'rotativo302_requests',
  AUDIT: 'rotativo302_audit',
  CONFIG: 'rotativo302_config',
  CURRENT_USER_HOST_UNIT: 'rotativo302_current_host_unit',
};

const SAMPLE_OWNERS = [
  { name: 'Dr. Roberto Silveira', email: 'roberto.silveira@email.com', phone: '(11) 98765-4321' },
  { name: 'Dra. Camila Alencar', email: 'camila.alencar@email.com', phone: '(21) 99123-8899' },
  { name: 'Marcos Vinicius Pontes', email: 'mv.pontes@email.com', phone: '(31) 99874-5511' },
  { name: 'Fernanda Meirelles', email: 'fer.meirelles@email.com', phone: '(41) 98452-3300' },
  { name: 'Carlos Eduardo Ramos', email: 'carlos.ramos@email.com', phone: '(81) 97722-1144' },
  { name: 'Juliana Fagundes', email: 'juliana.fagundes@email.com', phone: '(71) 99311-8822' },
  { name: 'Ricardo Albuquerque', email: 'ricardo.albuquerque@email.com', phone: '(61) 98112-9900' },
  { name: 'Beatriz Vasconcelos', email: 'bia.vasconcelos@email.com', phone: '(19) 98833-2211' },
  { name: 'Alexandre Gouveia', email: 'alex.gouveia@email.com', phone: '(85) 99441-3322' },
  { name: 'Patrícia Nogueira', email: 'patricia.nog@email.com', phone: '(48) 98411-7766' },
  { name: 'Lucas Santana Mendes', email: 'lucas.santana@email.com', phone: '(11) 97654-1122' },
  { name: 'Ana Paula Fontana', email: 'ana.fontana@email.com', phone: '(21) 98877-6655' },
];

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
  let queueSeed = 1;

  // Single tower with 302 units (26 floors, 11-12 units per floor)
  for (let floor = 1; floor <= 26; floor++) {
    const unitsPerFloor = floor <= 16 ? 12 : 11;
    for (let u = 1; u <= unitsPerFloor; u++) {
      if (count >= 302) break;
      count++;

      const unitNumber = `${floor}${u < 10 ? '0' + u : u}`;
      const ownerIndex = (count * 7) % SAMPLE_OWNERS.length;
      const owner = SAMPLE_OWNERS[ownerIndex];

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

      // Administrative status (95% enabled by admin, 5% blocked due to maintenance or condo fees)
      const isEligibleByAdmin = count % 19 !== 0;
      const ineligibleReason = !isEligibleByAdmin 
        ? (count % 2 === 0 ? 'Inadimplência de taxa condominial (Art. 14 Convenção)' : 'Vistoria técnica predial pendente')
        : undefined;

      // Host availability: realistic distribution
      const isAvailableByHost = isEligibleByAdmin && (count <= 35 ? count % 2 === 1 : count % 5 === 0);

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
        ownerName: owner.name,
        ownerEmail: owner.email,
        ownerPhone: owner.phone,
        whatsapp: owner.phone, // Forma de contato oficial via WhatsApp
        isEligibleByAdmin,
        ineligibleReason,
        isAvailableByHost,
        queuePosition: isAvailableByHost ? queueSeed++ : 9999,
        totalBookingsCompleted: Math.floor((count * 3) % 15),
        totalCallsReceived: Math.floor((count * 4) % 20),
        totalRejections: Math.floor((count * 2) % 4),
        totalTimeouts: Math.floor(count % 3),
        amenities: ['Wi-Fi 500Mbps', 'Ar Condicionado Dual Inverter', 'Smart TV 55"', 'Cozinha Completa', 'Garagem Coberta'],
        houseRules: ['Não fumante', 'Silêncio após 22h', 'Proibido festas e eventos'],
        photoUrl,
      });
    }
  }

  // Sort initial queue positions
  const availableUnits = units.filter(u => u.isEligibleByAdmin && u.isAvailableByHost);
  availableUnits.forEach((unit, index) => {
    unit.queuePosition = index + 1;
  });

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
      // Ensure data conforms to new constraints: minimum R$ 200 and bed configuration
      const sanitized = parsed.map((u, idx) => ({
        ...u,
        block: 'Torre Única' as const,
        roomsCount: 1 as const,
        typology: '1 Quarto' as const,
        basePrice: Math.max(200, u.basePrice || 200),
        whatsapp: u.whatsapp || u.ownerPhone || '(11) 98765-4321',
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

  // Seed with one sample recent walk-in request for immediate rich UI
  const initial: GuestRequest[] = [
    {
      id: 'req-sample-01',
      voucherCode: 'BAL-7042',
      guestName: 'Dr. Leonardo Castilho',
      guestDocument: '042.891.332-90',
      guestPhone: '(11) 99882-1400',
      guestsCount: 2,
      nightsCount: 3,
      checkInDate: new Date().toISOString().split('T')[0],
      checkOutDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      typologyPreferred: '1 Quarto',
      petFriendly: false,
      status: 'checked_in',
      currentAttemptIndex: 0,
      estimatedWaitMinutes: 2,
      queuePositionAtEntry: 1,
      deviceNotified: true,
      callAttempts: [
        {
          unitId: 'unit-201',
          unitNumber: '201',
          block: 'Torre Única',
          ownerName: 'Dr. Roberto Silveira',
          calledAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          respondedAt: new Date(Date.now() - 3600000 * 2 + 120000).toISOString(),
          outcome: 'accepted',
          responseTimeSeconds: 120,
        },
      ],
      assignedUnitId: 'unit-201',
      assignedUnitNumber: '201',
      assignedUnitBlock: 'Torre Única',
      assignedHostName: 'Dr. Roberto Silveira',
      assignedHostPhone: '(11) 98765-4321',
      assignedUnitBedSummary: '1 Cama Queen + 1 Sofá-Cama',
      expiresAt: new Date().toISOString(),
      totalAmount: 860,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 1.8).toISOString(),
      receptionValidationKey: 'CHV-9921',
      keyDeliveredAt: new Date(Date.now() - 3600000 * 1.8).toISOString(),
      receptionistNotes: 'Documento original RG e CNH checados. Cartão de acesso magnético #14 entregue.',
    },
  ];
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
      'Sistema Autônomo',
      'Sistema Round Robin 302 inicializado com 302 unidades registradas. Portaria configurada em Modo Neutro (sem poder de escolha manual).'
    ),
    createAuditEntry(
      'GUEST_CHECKIN_INITIATED',
      'Hóspede',
      'Hóspede Dr. Leonardo Castilho solicitou aluguel de balcão via QR Code da portaria (Voucher BAL-7042).',
      { voucherCode: 'BAL-7042', guestName: 'Dr. Leonardo Castilho' }
    ),
    createAuditEntry(
      'UNIT_CALLED_ROUND_ROBIN',
      'Sistema Autônomo',
      'Sistema acionou a Unidade 201 (Torre A) por ser a 1ª da fila virtual rotativa.',
      { unitNumber: '201', voucherCode: 'BAL-7042' }
    ),
    createAuditEntry(
      'HOST_ACCEPTED',
      'Anfitrião',
      'Anfitrião Dr. Roberto Silveira aceitou a reserva em 2m00s.',
      { unitNumber: '201', voucherCode: 'BAL-7042' }
    ),
    createAuditEntry(
      'QUEUE_ROTATED_TO_END',
      'Sistema Autônomo',
      'Regra Round Robin executada: Unidade 201 movida automaticamente para o final da fila de disponibilidade.',
      { unitNumber: '201' }
    ),
    createAuditEntry(
      'RECEPTION_KEY_ISSUED',
      'Portaria',
      'Portaria validou documento de Dr. Leonardo Castilho e liberou chave com Chaveiro magnético #14. Zero intervenção na escolha da unidade.',
      { unitNumber: '201', voucherCode: 'BAL-7042' }
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
  return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_HOST_UNIT) || 'unit-101';
}

export function setSelectedHostUnitId(unitId: string): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER_HOST_UNIT, unitId);
}
