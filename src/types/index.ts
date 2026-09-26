export type UnitTypology = '1 Quarto';

export type UnitBlock = 'Torre Única';

export interface BedConfig {
  type: 'Cama Casal Queen' | 'Cama Casal Padrão' | 'Cama Solteiro' | 'Sofá-Cama Casal' | 'Bicama Solteiro';
  quantity: number;
}

export interface Unit {
  id: string;
  unitNumber: string; // e.g. "101", "304", "1208"
  block: UnitBlock;
  floor: number;
  roomsCount: 1; // Todos os imóveis do complexo possuem exatamente 1 quarto
  typology: UnitTypology;
  bedsCount: number; // Total number of beds
  bedTypes: BedConfig[]; // Detailed bed types & quantities
  bedSummary: string; // Formatted summary e.g. "1 Queen + 1 Sofá-Cama"
  capacity: number; // max guests
  basePrice: number; // Daily price in R$ for counter walk-ins (MÍNIMO R$ 200,00)
  cleaningFee: number;
  ownerName: string; // Nome do Responsável / Proprietário
  ownerEmail: string; // E-mail do Responsável
  ownerPhone: string; // Telefone
  whatsapp: string; // Forma de contato principal obrigatória (WhatsApp do responsável)
  isEligibleByAdmin: boolean; // Síndico/Admin activation (condo fees up to date, approved)
  ineligibleReason?: string; // Reason if blocked by admin (e.g. "Inadimplência de condomínio", "Manutenção predial")
  isAvailableByHost: boolean; // Host real-time toggle: "Disponível para Balcão Hoje"
  queuePosition: number; // Order in round robin queue (1 = next)
  totalBookingsCompleted: number;
  totalCallsReceived: number;
  totalRejections: number;
  totalTimeouts: number;
  lastAssignedAt?: string;
  amenities: string[];
  houseRules: string[];
  photoUrl: string;
}

export type RequestStatus = 
  | 'waiting_host' 
  | 'accepted' 
  | 'rejected' 
  | 'timeout' 
  | 'checked_in' 
  | 'cancelled';

export interface CallAttempt {
  unitId: string;
  unitNumber: string;
  block: UnitBlock;
  ownerName: string;
  ownerPhone?: string;
  ownerWhatsapp?: string;
  calledAt: string;
  respondedAt?: string;
  outcome: 'pending' | 'accepted' | 'rejected' | 'timeout';
  rejectionReason?: string;
  responseTimeSeconds?: number;
}

export interface GuestRequest {
  id: string;
  voucherCode: string; // e.g. "BAL-8391"
  guestName: string;
  guestDocument: string; // CPF or Passport
  guestPhone: string;
  guestsCount: number;
  nightsCount: number;
  checkInDate: string;
  checkOutDate: string;
  typologyPreferred: string;
  petFriendly: boolean;
  status: RequestStatus;
  currentAttemptIndex: number;
  callAttempts: CallAttempt[];
  assignedUnitId?: string;
  assignedUnitNumber?: string;
  assignedUnitBlock?: UnitBlock;
  assignedHostName?: string;
  assignedHostPhone?: string;
  assignedHostWhatsapp?: string;
  assignedUnitBedSummary?: string;
  expiresAt: string; // ISO string for the 5-minute timer
  estimatedWaitMinutes: number; // Estimated wait time in minutes
  queuePositionAtEntry: number; // Position in queue when added
  deviceNotified: boolean; // Flag indicating host device received instant alert
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  receptionValidationKey?: string;
  keyDeliveredAt?: string;
  receptionistNotes?: string;
}

export type AuditEventType =
  | 'GUEST_CHECKIN_INITIATED'
  | 'UNIT_CALLED_ROUND_ROBIN'
  | 'HOST_ACCEPTED'
  | 'HOST_REJECTED'
  | 'HOST_TIMEOUT_EXPIRED'
  | 'QUEUE_ROTATED_TO_END'
  | 'ADMIN_UNIT_ACTIVATED'
  | 'ADMIN_UNIT_DEACTIVATED'
  | 'HOST_AVAILABILITY_CHANGED'
  | 'HOST_UNIT_REGISTERED'
  | 'HOST_CONTACT_UPDATED'
  | 'RECEPTION_KEY_ISSUED'
  | 'SYSTEM_INITIALIZED';

export interface AuditLog {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  unitId?: string;
  unitNumber?: string;
  guestId?: string;
  guestName?: string;
  voucherCode?: string;
  details: string;
  actor: 'Hóspede' | 'Anfitrião' | 'Portaria' | 'Sistema Autônomo' | 'Síndico/Admin';
  hash: string;
  prevHash: string;
}

export interface SystemConfig {
  complexName: string;
  totalUnitsCount: number;
  timeoutMinutes: number; // default 5 minutes
  demoFastTimeoutSeconds?: number; // for testing (e.g. 30 seconds toggle)
  allowPetFilter: boolean;
  autoReassignOnTimeout: boolean;
  requireDocumentPhoto: boolean;
  soundAlertsEnabled: boolean;
}
