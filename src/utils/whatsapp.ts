/**
 * WhatsApp & Multi-Channel Notification Formatting Utilities
 * Handles phone cleaning, resilient formatting, validation, and direct deep links
 */

export function cleanPhoneDigits(raw: string): string {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');
  // If user entered leading 0 (e.g. 062999991234 or 011...), strip it
  if (digits.length >= 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
}

/**
 * Resilient phone formatter for Brazilian phone numbers:
 * - Accepts local digits (e.g., 62999991609 or 11987654321)
 * - Accepts numbers with country code (e.g., 5562999991609 or +55 62 ...)
 * - Never truncates digits unexpectedly
 */
export function formatWhatsApp(raw: string): string {
  if (!raw) return '';
  let digits = cleanPhoneDigits(raw);

  // If starts with Brazilian country code 55 and has more than 11 digits, strip 55 for local formatting
  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.slice(2);
  }

  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    // Landline or incomplete mobile: (XX) XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11) {
    // Standard 9-digit Brazilian mobile: (XX) 9XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  // Extra digits (e.g. international format)
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)} ${digits.slice(11)}`;
}

export function isValidWhatsApp(phone: string): boolean {
  if (!phone) return false;
  let digits = cleanPhoneDigits(phone);
  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.slice(2);
  }
  // Valid Brazilian numbers:
  // 10 digits (landline: DDD + 8 digits)
  // 11 digits (mobile: DDD + 9 digits)
  if (digits.length === 10 || digits.length === 11) return true;
  return false;
}

export function getCleanInternationalPhone(phone: string): string {
  let digits = cleanPhoneDigits(phone);
  if (!digits) return '';

  // If local Brazilian number (10 or 11 digits), prepend Brazil country code 55
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }
  return digits;
}

export function getWhatsAppDirectUrl(phone: string, text?: string): string {
  const digits = getCleanInternationalPhone(phone);
  if (!digits) return '';

  const encodedMsg = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${digits}${encodedMsg}`;
}

export function getOfficialHostNotificationMessage(
  unitNumber: string,
  block: string,
  ownerName: string
): string {
  return `🏢 *CRYSTAL PLACE RESIDENCE - APLICATIVO GIROGO*\n\nOlá, *${ownerName}*!\nEsta é uma mensagem oficial de validação do canal de WhatsApp para o *Apto ${unitNumber}* (${block}).\n\nO sistema autônomo de rodízio da portaria enviará alertas imediatos por este canal sempre que houver um hóspede de balcão alocado para você!`;
}

export function getReservationHostNotificationMessage(params: {
  voucherCode: string;
  guestName: string;
  guestDocument: string;
  guestPhone: string;
  unitNumber: string;
  floor: number | string;
  hostName: string;
  guestsCount: number;
  nightsCount: number;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  guestNotes?: string;
  portalUrl?: string;
}): string {
  const {
    voucherCode,
    guestName,
    guestDocument,
    guestPhone,
    unitNumber,
    floor,
    hostName,
    guestsCount,
    nightsCount,
    checkInDate,
    checkOutDate,
    totalAmount,
    guestNotes,
    portalUrl,
  } = params;

  const url = portalUrl || (typeof window !== 'undefined' ? `${window.location.origin}/?role=host` : 'https://proximo-access.app');

  const notesSection = guestNotes ? `• Observações do Hóspede: *"${guestNotes}"*\n` : '';

  return `🚨 *CHAMADO DA PORTARIA - CRYSTAL PLACE RESIDENCE* 🚨\n\n` +
    `Olá, *${hostName}*!\n` +
    `É a sua vez no rodízio de balcão para o *Apto ${unitNumber}* (${floor}º Andar)!\n\n` +
    `📋 *Resumo da Solicitação (Voucher ${voucherCode}):*\n` +
    `• Hóspede: *${guestName}*\n` +
    `• Documento: ${guestDocument}\n` +
    `• Telefone: ${guestPhone}\n` +
    `• Ocupantes: *${guestsCount} pessoa(s)*\n` +
    `• Estadia: *${nightsCount} diária(s)* (${checkInDate} até ${checkOutDate})\n` +
    `• Rendimento Estimado: *R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n` +
    notesSection +
    `\n⏱️ *Prazo Regulamentar:* Você tem *5 minutos* para aceitar no painel antes de rotacionar para o próximo anfitrião.\n\n` +
    `👉 *Acesse o Portal do Anfitrião para Responder:* \n${url}`;
}

export function getEmailHostNotification(params: {
  voucherCode: string;
  guestName: string;
  unitNumber: string;
  hostName: string;
  hostEmail: string;
  nightsCount: number;
  totalAmount: number;
  guestNotes?: string;
  portalUrl?: string;
}): { subject: string; body: string; mailtoUrl: string } {
  const subject = `[CHAMADO PORTARIA] Novo Hóspede para o Apto ${params.unitNumber} - Voucher ${params.voucherCode}`;
  const notesText = params.guestNotes ? `• Observações do Solicitante: "${params.guestNotes}"\n` : '';

  const body = `Prezado(a) ${params.hostName},\n\n` +
    `Informamos que há um hóspede de balcão aguardando confirmação para o seu apartamento (Apto ${params.unitNumber} - Crystal Place Residence).\n\n` +
    `• Voucher: ${params.voucherCode}\n` +
    `• Hóspede: ${params.guestName}\n` +
    `• Diárias: ${params.nightsCount} noite(s)\n` +
    `• Valor Total Previsto: R$ ${params.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
    notesText +
    `\nPor favor, acesse o Portal do Anfitrião em até 5 minutos para aceitar ou recusar a reserva.\n\n` +
    `Portal do Anfitrião: ${params.portalUrl || 'https://girogo.app'}\n\n` +
    `Atenciosamente,\nPortaria 24h & Sistema GiroGo`;

  const mailtoUrl = `mailto:${params.hostEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { subject, body, mailtoUrl };
}

export function getSmsHostNotification(params: {
  voucherCode: string;
  guestName: string;
  unitNumber: string;
  nightsCount: number;
  totalAmount: number;
  phone: string;
  guestNotes?: string;
}): { text: string; smsUrl: string } {
  const notesPart = params.guestNotes ? ` Obs: ${params.guestNotes.slice(0, 30)}` : '';
  const text = `Crystal Place: Chamado de balcao para o Apto ${params.unitNumber}! Hospede ${params.guestName} (${params.nightsCount} noites, R$ ${params.totalAmount.toFixed(0)}).${notesPart} Acesse o portal em ate 5min para aceitar. Voucher ${params.voucherCode}`;
  const smsUrl = `sms:${cleanPhoneDigits(params.phone)}?body=${encodeURIComponent(text)}`;
  return { text, smsUrl };
}
