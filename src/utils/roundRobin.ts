import { Unit, GuestRequest, CallAttempt, AuditLog, SystemConfig } from '../types';
import { createAuditEntry } from './audit';
import { sendDeviceNotification } from './notifications';

export function getEligibleUnitsInQueue(
  allUnits: Unit[],
  filter?: {
    minCapacity?: number;
    typology?: string;
    excludeUnitIds?: string[];
  }
): Unit[] {
  return allUnits
    .filter(u => {
      // Must be enabled by Admin (síndico)
      if (!u.isEligibleByAdmin) return false;
      // Must have enabled availability in real-time
      if (!u.isAvailableByHost) return false;
      // Exclude units already contacted for this request
      if (filter?.excludeUnitIds && filter.excludeUnitIds.includes(u.id)) return false;
      // Capacity check
      if (filter?.minCapacity && u.capacity < filter.minCapacity) return false;

      return true;
    })
    .sort((a, b) => a.queuePosition - b.queuePosition);
}

/**
 * Re-indexes queue positions of all active host units so they are continuous 1..N
 */
export function reindexQueue(units: Unit[]): Unit[] {
  const active = units
    .filter(u => u.isEligibleByAdmin && u.isAvailableByHost)
    .sort((a, b) => a.queuePosition - b.queuePosition);

  const activeIds = new Set(active.map(u => u.id));

  const updatedUnits = units.map(u => {
    if (!activeIds.has(u.id)) {
      return { ...u, queuePosition: 9999 };
    }
    const idx = active.findIndex(a => a.id === u.id);
    return { ...u, queuePosition: idx + 1 };
  });

  return updatedUnits;
}

/**
 * Moves a unit to the end of the round-robin queue after a completed booking
 */
export function rotateUnitToEnd(units: Unit[], unitId: string): Unit[] {
  const target = units.find(u => u.id === unitId);
  if (!target) return units;

  const maxPosition = units
    .filter(u => u.isEligibleByAdmin && u.isAvailableByHost && u.id !== unitId)
    .reduce((max, u) => Math.max(max, u.queuePosition), 0);

  const updatedUnits = units.map(u => {
    if (u.id === unitId) {
      return {
        ...u,
        queuePosition: maxPosition + 1,
        totalBookingsCompleted: u.totalBookingsCompleted + 1,
        lastAssignedAt: new Date().toISOString(),
      };
    }
    return u;
  });

  return reindexQueue(updatedUnits);
}

/**
 * Initiates or advances a guest request to the next unit in the Round Robin queue
 */
export function callNextHostInQueue(
  request: GuestRequest,
  units: Unit[],
  auditLogs: AuditLog[],
  config: SystemConfig,
  useDemoFastTimeout = false
): { updatedRequest: GuestRequest; updatedUnits: Unit[]; updatedLogs: AuditLog[]; calledUnit?: Unit } {
  const alreadyCalledUnitIds = request.callAttempts.map(a => a.unitId);

  const eligibleQueue = getEligibleUnitsInQueue(units, {
    minCapacity: request.guestsCount,
    typology: request.typologyPreferred,
    excludeUnitIds: alreadyCalledUnitIds,
  });

  if (eligibleQueue.length === 0) {
    // No more units available
    const updatedRequest: GuestRequest = {
      ...request,
      status: 'rejected',
      updatedAt: new Date().toISOString(),
    };

    const newLog = createAuditEntry(
      'HOST_REJECTED',
      'Sistema Autônomo',
      `Fila de disponibilidade esgotada para o Voucher ${request.voucherCode}. Todos os anfitriões elegíveis foram consultados ou estão ocupados.`,
      { voucherCode: request.voucherCode, guestName: request.guestName },
      auditLogs
    );

    return {
      updatedRequest,
      updatedUnits: units,
      updatedLogs: [newLog, ...auditLogs],
    };
  }

  const nextUnit = eligibleQueue[0];
  const timeoutMs = (useDemoFastTimeout && config.demoFastTimeoutSeconds ? config.demoFastTimeoutSeconds : config.timeoutMinutes * 60) * 1000;
  const expiresAt = new Date(Date.now() + timeoutMs).toISOString();
  const estimatedWaitMinutes = Math.max(1, Math.round(timeoutMs / 60000));

  const newAttempt: CallAttempt = {
    unitId: nextUnit.id,
    unitNumber: nextUnit.unitNumber,
    block: nextUnit.block,
    ownerName: nextUnit.ownerName,
    ownerPhone: nextUnit.ownerPhone,
    ownerWhatsapp: nextUnit.whatsapp || nextUnit.ownerPhone,
    calledAt: new Date().toISOString(),
    outcome: 'pending',
  };

  const updatedUnits = units.map(u => {
    if (u.id === nextUnit.id) {
      return {
        ...u,
        totalCallsReceived: u.totalCallsReceived + 1,
      };
    }
    return u;
  });

  // DISPATCH IMMEDIATE DEVICE NOTIFICATION TO THE HOST
  sendDeviceNotification({
    title: `🚨 Chamado de Balcão: Apto ${nextUnit.unitNumber} (${nextUnit.block})`,
    body: `É a sua vez no rodízio! Hóspede ${request.guestName} (${request.guestsCount}p, ${request.nightsCount} noites). Responda em até 5 minutos.`,
    tag: `call-${request.voucherCode}`,
    requireInteraction: true,
  });

  const updatedRequest: GuestRequest = {
    ...request,
    status: 'waiting_host',
    assignedUnitId: nextUnit.id,
    assignedUnitNumber: nextUnit.unitNumber,
    assignedUnitBlock: nextUnit.block,
    assignedHostName: nextUnit.ownerName,
    assignedHostPhone: nextUnit.ownerPhone,
    assignedHostWhatsapp: nextUnit.whatsapp || nextUnit.ownerPhone,
    assignedUnitBedSummary: nextUnit.bedSummary,
    estimatedWaitMinutes,
    deviceNotified: true,
    currentAttemptIndex: request.callAttempts.length,
    callAttempts: [...request.callAttempts, newAttempt],
    expiresAt,
    totalAmount: (nextUnit.basePrice * request.nightsCount) + nextUnit.cleaningFee,
    updatedAt: new Date().toISOString(),
  };

  const newLog = createAuditEntry(
    'UNIT_CALLED_ROUND_ROBIN',
    'Sistema Autônomo',
    `Sistema de rodízio acionou a Unidade ${nextUnit.unitNumber} (${nextUnit.block} - Anfitrião: ${nextUnit.ownerName}, Camas: ${nextUnit.bedSummary}) com prazo de ${estimatedWaitMinutes} minutos. Notificação instantânea enviada ao aparelho do anfitrião. Fila posição: #${nextUnit.queuePosition}.`,
    {
      unitId: nextUnit.id,
      unitNumber: nextUnit.unitNumber,
      voucherCode: request.voucherCode,
      guestName: request.guestName,
    },
    auditLogs
  );

  return {
    updatedRequest,
    updatedUnits,
    updatedLogs: [newLog, ...auditLogs],
    calledUnit: nextUnit,
  };
}
