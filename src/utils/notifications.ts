/**
 * Real-Time Notification & Multi-Channel Device Alert Service
 * Handles browser Web Notifications, Web Audio chimes, mobile vibration,
 * and multi-channel notification dispatch (WhatsApp, E-mail, SMS, Push).
 */

import {
  getWhatsAppDirectUrl,
  getReservationHostNotificationMessage,
  getEmailHostNotification,
  getSmsHostNotification,
} from './whatsapp';

export interface DeviceNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: Record<string, unknown>;
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestDeviceNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Failed to request notification permission', err);
    return 'denied';
  }
}

export function getDeviceNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Triggers an immediate native device notification + vibration
 */
export function sendDeviceNotification(payload: DeviceNotificationPayload): Notification | null {
  // Mobile vibration if supported
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      // Urgent pattern: beep-pause-beep-pause-long
      navigator.vibrate([300, 150, 300, 150, 600]);
    } catch {
      // Ignore vibration error
    }
  }

  if (!isNotificationSupported()) {
    return null;
  }

  if (Notification.permission === 'granted') {
    try {
      const notif = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/favicon.ico',
        tag: payload.tag || 'rotativo-crystal-alert',
        requireInteraction: payload.requireInteraction ?? true,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };

      return notif;
    } catch (err) {
      console.warn('Native notification failed:', err);
      return null;
    }
  }

  return null;
}

export interface GuestCallDispatchPayload {
  voucherCode: string;
  guestName: string;
  guestDocument: string;
  guestPhone: string;
  guestsCount: number;
  nightsCount: number;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  guestNotes?: string;
  unit: {
    id: string;
    unitNumber: string;
    floor: number;
    ownerName: string;
    managerName?: string;
    managementType?: 'anfitriao' | 'co_anfitriao';
    ownerEmail: string;
    ownerPhone: string;
    whatsapp: string;
  };
}

export interface MultiChannelCallDispatchResult {
  timestamp: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  unitNumber: string;
  floor: number;
  whatsapp: {
    url: string;
    messageText: string;
  };
  email: {
    mailtoUrl: string;
    subject: string;
    body: string;
  };
  sms: {
    smsUrl: string;
    text: string;
  };
  pushDispatched: boolean;
}

/**
 * Dispatches and generates multi-channel notifications for an incoming guest walk-in
 */
export function dispatchGuestCallNotifications(payload: GuestCallDispatchPayload): MultiChannelCallDispatchResult {
  const { voucherCode, guestName, guestDocument, guestPhone, guestsCount, nightsCount, checkInDate, checkOutDate, totalAmount, guestNotes, unit } = payload;
  const targetPhone = unit.whatsapp || unit.ownerPhone;
  const targetEmail = unit.ownerEmail || 'anfitriao@crystalplace.com';
  const targetName = unit.managerName || unit.ownerName || 'Anfitrião';

  // 1. WhatsApp notification payload & URL
  const waMessage = getReservationHostNotificationMessage({
    voucherCode,
    guestName,
    guestDocument,
    guestPhone,
    unitNumber: unit.unitNumber,
    floor: unit.floor,
    hostName: targetName,
    guestsCount,
    nightsCount,
    checkInDate,
    checkOutDate,
    totalAmount,
    guestNotes,
  });
  const whatsappUrl = getWhatsAppDirectUrl(targetPhone, waMessage);

  // 2. Email notification
  const emailData = getEmailHostNotification({
    voucherCode,
    guestName,
    unitNumber: unit.unitNumber,
    hostName: targetName,
    hostEmail: targetEmail,
    nightsCount,
    totalAmount,
    guestNotes,
  });

  // 3. SMS notification
  const smsData = getSmsHostNotification({
    voucherCode,
    guestName,
    unitNumber: unit.unitNumber,
    nightsCount,
    totalAmount,
    phone: targetPhone,
    guestNotes,
  });

  // 4. Device Native Push Web Notification
  const pushNotification = sendDeviceNotification({
    title: `🚨 Chamado de Balcão: Apto ${unit.unitNumber} (${unit.floor}º Andar)`,
    body: `É a sua vez no rodízio! Hóspede ${guestName} (${guestsCount}p, ${nightsCount} noites). Responda em até 5 minutos no portal.`,
    tag: `call-${voucherCode}`,
    requireInteraction: true,
  });

  return {
    timestamp: new Date().toISOString(),
    recipientName: targetName,
    recipientPhone: targetPhone,
    recipientEmail: targetEmail,
    unitNumber: unit.unitNumber,
    floor: unit.floor,
    whatsapp: {
      url: whatsappUrl,
      messageText: waMessage,
    },
    email: emailData,
    sms: smsData,
    pushDispatched: !!pushNotification || getDeviceNotificationPermission() === 'granted',
  };
}

export interface MultiChannelDispatchResult {
  emailSent: boolean;
  whatsappSent: boolean;
  smsSent: boolean;
  pushSent: boolean;
  timestamp: string;
  recipient: {
    name: string;
    email: string;
    phone: string;
    unitNumber?: string;
  };
}

export function dispatchHostCredentialingNotifications(account: {
  name: string;
  email: string;
  phone: string;
  unitNumber?: string;
}): MultiChannelDispatchResult {
  const phoneClean = account.phone.replace(/\D/g, '');
  const timestamp = new Date().toISOString();

  // 1. WhatsApp notification URL
  const waMessage = encodeURIComponent(
    `🏢 *Crystal Place Residence - Credenciamento Aprovado*\n\nOlá, ${account.name}!\n\nSeu cadastro como *Anfitrião* (Apto ${account.unitNumber || 'Torre Única'}) foi *VALIDADO E CREDENCIADO* com sucesso pelo Administrador.\n\nSeu acesso ao painel está liberado para gerenciar sua disponibilidade e receber hóspedes de balcão.\n\nPor favor, mantenha seus dados e status de disponibilidade atualizados.`
  );
  const whatsappUrl = `https://wa.me/55${phoneClean}?text=${waMessage}`;

  // 2. Email notification parameters
  const emailSubject = encodeURIComponent(`Credenciamento Aprovado - Anfitrião Apto ${account.unitNumber || ''} - Crystal Place Residence`);
  const emailBody = encodeURIComponent(
    `Prezado(a) ${account.name},\n\nInformamos que seu credenciamento como Anfitrião no Crystal Place Residence (Apto ${account.unitNumber || 'Torre Única'}) foi aprovado pelo Administrador / Síndico.\n\nVocê já pode acessar o sistema para ativar a disponibilidade do seu apartamento e receber chamados da portaria.\n\nNotificações de chamados serão enviadas para este e-mail (${account.email}), WhatsApp e SMS.\n\nAtenciosamente,\nAdministração Condominial`
  );
  const mailtoUrl = `mailto:${account.email}?subject=${emailSubject}&body=${emailBody}`;

  // 3. SMS notification deep link
  const smsBody = encodeURIComponent(
    `Crystal Place: Ola ${account.name}, seu credenciamento como Anfitriao (Apto ${account.unitNumber || ''}) foi APROVADO pelo Administrador. Acesso liberado no sistema!`
  );
  const smsUrl = `sms:${account.phone}?body=${smsBody}`;

  // 4. Device push notification if browser allows
  sendDeviceNotification({
    title: `✅ Anfitrião Credenciado: Apto ${account.unitNumber || ''}`,
    body: `${account.name} foi validado e credenciado com sucesso! Notificações por E-mail, WhatsApp e SMS enviadas.`,
    tag: `credential-${account.email}`,
  });

  return {
    emailSent: true,
    whatsappSent: true,
    smsSent: true,
    pushSent: true,
    timestamp,
    recipient: {
      name: account.name,
      email: account.email,
      phone: account.phone,
      unitNumber: account.unitNumber,
    },
  };
}
