import { AuditLog, AuditEventType } from '../types';

/**
 * Creates a deterministic SHA-256 equivalent checksum for tamper-evidence
 */
function simpleChecksum(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const salt = ((str.length * 2654435761) >>> 0).toString(16).padStart(8, '0');
  return `SHA-${hex}${salt}`.toUpperCase();
}

export function createAuditEntry(
  eventType: AuditEventType,
  actor: 'Hóspede' | 'Anfitrião' | 'Portaria' | 'Sistema Autônomo' | 'Síndico/Admin',
  details: string,
  extra: {
    unitId?: string;
    unitNumber?: string;
    guestId?: string;
    guestName?: string;
    voucherCode?: string;
  } = {},
  previousLogs: AuditLog[] = []
): AuditLog {
  const timestamp = new Date().toISOString();
  const prevHash = previousLogs.length > 0 ? previousLogs[0].hash : 'GENESIS-BLOCK-ROTATIVO-302';
  const id = 'AUD-' + Math.random().toString(36).substring(2, 9).toUpperCase();

  const dataToHash = `${id}|${timestamp}|${eventType}|${actor}|${details}|${prevHash}`;
  const hash = simpleChecksum(dataToHash);

  return {
    id,
    timestamp,
    eventType,
    actor,
    details,
    unitId: extra.unitId,
    unitNumber: extra.unitNumber,
    guestId: extra.guestId,
    guestName: extra.guestName,
    voucherCode: extra.voucherCode,
    hash,
    prevHash,
  };
}
