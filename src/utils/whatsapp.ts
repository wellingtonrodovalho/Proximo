/**
 * WhatsApp utilities for format, validation and direct click-to-chat links
 */

export function cleanPhoneDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function formatWhatsApp(raw: string): string {
  const digits = cleanPhoneDigits(raw);
  
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // 11 digits (mobile with 9)
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function isValidWhatsApp(phone: string): boolean {
  const digits = cleanPhoneDigits(phone);
  // Valid Brazilian numbers: 10 digits (landline) or 11 digits (mobile)
  // or with country code 55: 12 or 13 digits
  return digits.length === 10 || digits.length === 11 || (digits.startsWith('55') && (digits.length === 12 || digits.length === 13));
}

export function getWhatsAppDirectUrl(phone: string, text?: string): string {
  let digits = cleanPhoneDigits(phone);
  if (!digits) return '';

  // If local Brazilian number (10 or 11 digits), prepend Brazil country code 55
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }

  const encodedMsg = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${digits}${encodedMsg}`;
}

export function getOfficialHostNotificationMessage(unitNumber: string, block: string, ownerName: string): string {
  return `Olá ${ownerName}! Esta é uma mensagem de teste do aplicativo PROXIMO (Portaria do Crystal Place Residence) para validar seu canal de WhatsApp no Apto ${unitNumber} (${block}). O sistema autônomo de rodízio enviará avisos imediatos por aqui quando houver hóspede de balcão!`;
}
