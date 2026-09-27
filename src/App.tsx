/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Radio, ArrowRight, ShieldCheck, Clock, CheckCircle2, Lock, LogOut, Share2 } from 'lucide-react';
import { Unit, GuestRequest, AuditLog, SystemConfig, UnitTypology } from './types';
import { 
  loadUnits, 
  saveUnits, 
  loadRequests, 
  saveRequests, 
  loadAuditLogs, 
  saveAuditLogs, 
  loadConfig, 
  saveConfig, 
  getSelectedHostUnitId, 
  setSelectedHostUnitId,
  generate302Units,
  getDefaultConfig
} from './utils/storage';
import { callNextHostInQueue, rotateUnitToEnd, reindexQueue } from './utils/roundRobin';
import { createAuditEntry } from './utils/audit';
import { playChime } from './utils/audio';
import { 
  UserRole, 
  AccessRole,
  AccessAccount,
  AuthSession, 
  loadAccessAccounts,
  saveAccessAccounts,
  getStoredSession, 
  saveSession,
  clearSession, 
  getRoleFromUrl, 
  getUnitParamFromUrl,
  buildPortalUrl 
} from './utils/auth';

import { Header } from './components/Header';
import { GuestTotem } from './components/GuestTotem';
import { HostPortal } from './components/HostPortal';
import { ReceptionDesk } from './components/ReceptionDesk';
import { AdminPanel } from './components/AdminPanel';
import { PrintableQrModal } from './components/PrintableQrModal';
import { SimulateGuestModal } from './components/SimulateGuestModal';
import { PortalLogin } from './components/PortalLogin';
import { ShareLinksModal } from './components/ShareLinksModal';

export default function App() {
  // Global State
  const [units, setUnits] = useState<Unit[]>(() => loadUnits());
  const [requests, setRequests] = useState<GuestRequest[]>(() => loadRequests());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadAuditLogs());
  const [config, setConfig] = useState<SystemConfig>(() => loadConfig());

  // Access Accounts & Auth Session State
  const [accessAccounts, setAccessAccounts] = useState<AccessAccount[]>(() => loadAccessAccounts());
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());

  const [activeTab, setActiveTab] = useState<'guest' | 'host' | 'reception' | 'admin'>(() => {
    const urlRole = getRoleFromUrl();
    const stored = getStoredSession();
    if (urlRole !== 'guest' && stored && (stored.role === urlRole || stored.role === 'admin')) {
      return urlRole;
    }
    return 'guest';
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(() => {
    const urlRole = getRoleFromUrl();
    const stored = getStoredSession();
    if (urlRole !== 'guest' && !stored) return true;
    return false;
  });

  const [loginTargetRole, setLoginTargetRole] = useState<AccessRole>(() => {
    const urlRole = getRoleFromUrl();
    if (urlRole === 'host' || urlRole === 'reception' || urlRole === 'admin') return urlRole;
    return 'host';
  });

  const [isShareLinksOpen, setIsShareLinksOpen] = useState<boolean>(false);

  const [currentHostUnitId, setCurrentHostUnitId] = useState<string>(() => {
    const stored = getStoredSession();
    if (stored?.unitId) return stored.unitId;
    return getSelectedHostUnitId();
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isQrPlaqueOpen, setIsQrPlaqueOpen] = useState<boolean>(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState<boolean>(false);

  // Active in-progress request for the Totem and Host alert
  const activeRequest = requests.find(r => r.status === 'waiting_host' || r.status === 'accepted') || null;

  // Sync access accounts to storage
  useEffect(() => {
    saveAccessAccounts(accessAccounts);
  }, [accessAccounts]);

  const updateUrlForRole = useCallback((role: 'guest' | 'host' | 'reception' | 'admin', unitNumber?: string) => {
    if (typeof window === 'undefined') return;
    const url = buildPortalUrl(role, unitNumber);
    window.history.replaceState({}, '', url);
  }, []);

  const handleOpenLogin = useCallback((role: AccessRole = 'host') => {
    setLoginTargetRole(role);
    setIsLoginModalOpen(true);
  }, []);

  const handleLoginSuccess = useCallback((newSession: AuthSession) => {
    setSession(newSession);
    saveSession(newSession);
    if (newSession.unitId) {
      setCurrentHostUnitId(newSession.unitId);
    }
    setActiveTab(newSession.role);
    setIsLoginModalOpen(false);
    updateUrlForRole(newSession.role, newSession.unitNumber);
  }, [updateUrlForRole]);

  const handleLogout = useCallback(() => {
    clearSession();
    setSession(null);
    setActiveTab('guest');
    updateUrlForRole('guest');
  }, [updateUrlForRole]);

  const handleTabChange = useCallback((tab: 'guest' | 'host' | 'reception' | 'admin') => {
    if (tab === 'guest') {
      setActiveTab('guest');
      updateUrlForRole('guest');
      return;
    }
    if (session && (session.role === tab || session.role === 'admin')) {
      setActiveTab(tab);
      updateUrlForRole(tab, session.unitNumber);
    } else {
      handleOpenLogin(tab);
    }
  }, [session, handleOpenLogin, updateUrlForRole]);

  // Handle request for new access (Nome, Email, Telefone, Tipo de Acesso)
  const handleRequestAccess = useCallback((newAccData: Omit<AccessAccount, 'id' | 'status' | 'requestedAt'>) => {
    const newAccount: AccessAccount = {
      ...newAccData,
      id: `acc-${Date.now()}`,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    setAccessAccounts(prev => [newAccount, ...prev]);

    const actorType: 'Anfitrião' | 'Portaria' | 'Síndico/Admin' = 
      newAccount.role === 'admin' ? 'Síndico/Admin' : newAccount.role === 'reception' ? 'Portaria' : 'Anfitrião';

    const log = createAuditEntry(
      'ACCESS_REQUEST_CREATED',
      actorType,
      `Solicitação de acesso cadastrada: ${newAccount.name} (${newAccount.role}${newAccount.unitNumber ? ` - Apto ${newAccount.unitNumber}` : ''}). E-mail: ${newAccount.email}, Tel: ${newAccount.phone}. Pendente de validação pelo Administrador.`,
      { unitNumber: newAccount.unitNumber },
      auditLogs
    );
    setAuditLogs(prev => [log, ...prev]);
  }, [auditLogs]);

  // Admin approves account
  const handleApproveAccount = useCallback((accountId: string) => {
    setAccessAccounts(prev => prev.map(a => {
      if (a.id === accountId) {
        return {
          ...a,
          status: 'approved',
          approvedAt: new Date().toISOString(),
          approvedBy: 'Administrador / Síndico',
        };
      }
      return a;
    }));

    const target = accessAccounts.find(a => a.id === accountId);
    if (target) {
      const log = createAuditEntry(
        'ACCESS_ACCOUNT_APPROVED',
        'Síndico/Admin',
        `Cadastro de acesso validado e aprovado: ${target.name} (${target.role}${target.unitNumber ? ` - Apto ${target.unitNumber}` : ''}). Acesso liberado no sistema.`,
        { unitNumber: target.unitNumber },
        auditLogs
      );
      setAuditLogs(prev => [log, ...prev]);
    }
  }, [accessAccounts, auditLogs]);

  // Admin rejects account
  const handleRejectAccount = useCallback((accountId: string) => {
    setAccessAccounts(prev => prev.map(a => {
      if (a.id === accountId) {
        return {
          ...a,
          status: 'rejected',
        };
      }
      return a;
    }));

    const target = accessAccounts.find(a => a.id === accountId);
    if (target) {
      const log = createAuditEntry(
        'ACCESS_ACCOUNT_REJECTED',
        'Síndico/Admin',
        `Cadastro de acesso recusado: ${target.name} (${target.role}).`,
        { unitNumber: target.unitNumber },
        auditLogs
      );
      setAuditLogs(prev => [log, ...prev]);
    }
  }, [accessAccounts, auditLogs]);

  // Sync current host unit id to storage
  useEffect(() => {
    setSelectedHostUnitId(currentHostUnitId);
  }, [currentHostUnitId]);

  // Sync state changes to storage
  useEffect(() => {
    saveUnits(units);
  }, [units]);

  useEffect(() => {
    saveRequests(requests);
  }, [requests]);

  useEffect(() => {
    saveAuditLogs(auditLogs);
  }, [auditLogs]);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  // Audio helper respecting user preference
  const triggerAudio = useCallback((type: 'incoming_call' | 'accepted' | 'rejected' | 'timeout' | 'click' | 'step') => {
    if (soundEnabled) {
      playChime(type);
    }
  }, [soundEnabled]);

  // 1. GUEST SUBMITS WALK-IN REQUEST (FROM QR CODE TOTEM OR RECEPTION)
  const handleGuestSubmit = useCallback((formData: {
    guestName: string;
    guestDocument: string;
    guestPhone: string;
    guestsCount: number;
    nightsCount: number;
    typologyPreferred: UnitTypology | 'Qualquer';
    petFriendly: boolean;
  }) => {
    const voucherCode = 'BAL-' + Math.floor(1000 + Math.random() * 9000);
    const initialRequest: GuestRequest = {
      id: 'req-' + Date.now(),
      voucherCode,
      guestName: formData.guestName,
      guestDocument: formData.guestDocument,
      guestPhone: formData.guestPhone,
      guestsCount: formData.guestsCount,
      nightsCount: formData.nightsCount,
      checkInDate: new Date().toISOString().split('T')[0],
      checkOutDate: new Date(Date.now() + formData.nightsCount * 86400000).toISOString().split('T')[0],
      typologyPreferred: formData.typologyPreferred,
      petFriendly: formData.petFriendly,
      status: 'waiting_host',
      currentAttemptIndex: 0,
      callAttempts: [],
      queuePositionAtEntry: 1,
      estimatedWaitMinutes: config.timeoutMinutes,
      deviceNotified: true,
      expiresAt: new Date().toISOString(),
      totalAmount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Log the guest arrival event
    const guestLog = createAuditEntry(
      'GUEST_CHECKIN_INITIATED',
      'Hóspede',
      `Hóspede ${formData.guestName} (${formData.guestDocument}) iniciou solicitação de balcão via QR Code para ${formData.guestsCount} pessoa(s), ${formData.nightsCount} noite(s) (Voucher ${voucherCode}).`,
      { voucherCode, guestName: formData.guestName },
      auditLogs
    );

    // Call first eligible host in the Round Robin queue
    const { updatedRequest, updatedUnits, updatedLogs, calledUnit } = callNextHostInQueue(
      initialRequest,
      units,
      [guestLog, ...auditLogs],
      config
    );

    setUnits(updatedUnits);
    setRequests(prev => [updatedRequest, ...prev]);
    setAuditLogs(updatedLogs);

    if (calledUnit) {
      // Auto switch host portal to this unit so the reviewer/user can inspect or respond easily
      setCurrentHostUnitId(calledUnit.id);
      triggerAudio('incoming_call');
    }
  }, [units, auditLogs, config, triggerAudio]);

  // 2. HOST ACCEPTS BOOKING (SEALS THE DEAL & ROTATES TO BACK OF QUEUE)
  const handleHostAccept = useCallback((requestId: string, unitId: string) => {
    const targetReq = requests.find(r => r.id === requestId);
    const targetUnit = units.find(u => u.id === unitId);
    if (!targetReq || !targetUnit) return;

    // 1. Move accepted unit to the end of the round robin queue!
    const rotatedUnits = rotateUnitToEnd(units, unitId);

    // 2. Mark request as accepted
    const updatedAttempts = targetReq.callAttempts.map(att => {
      if (att.unitId === unitId && att.outcome === 'pending') {
        const responseTimeSeconds = Math.max(1, Math.round((Date.now() - new Date(att.calledAt).getTime()) / 1000));
        return {
          ...att,
          outcome: 'accepted' as const,
          respondedAt: new Date().toISOString(),
          responseTimeSeconds,
        };
      }
      return att;
    });

    const updatedRequest: GuestRequest = {
      ...targetReq,
      status: 'accepted',
      callAttempts: updatedAttempts,
      assignedUnitId: targetUnit.id,
      assignedUnitNumber: targetUnit.unitNumber,
      assignedUnitBlock: targetUnit.block,
      assignedHostName: targetUnit.ownerName,
      assignedHostPhone: targetUnit.ownerPhone,
      assignedHostWhatsapp: targetUnit.whatsapp || targetUnit.ownerPhone,
      updatedAt: new Date().toISOString(),
    };

    // 3. Log Host Accepted & Queue Rotated
    const logAccepted = createAuditEntry(
      'HOST_ACCEPTED',
      'Anfitrião',
      `Anfitrião ${targetUnit.ownerName} aceitou a hospedagem do Voucher ${targetReq.voucherCode} para o Apto ${targetUnit.unitNumber} (${targetUnit.block}).`,
      { unitId: targetUnit.id, unitNumber: targetUnit.unitNumber, voucherCode: targetReq.voucherCode, guestName: targetReq.guestName },
      auditLogs
    );

    const logRotation = createAuditEntry(
      'QUEUE_ROTATED_TO_END',
      'Sistema Autônomo',
      `Regra Round Robin executada: Apto ${targetUnit.unitNumber} completou locação e foi reposicionado no final da fila de balcão (Nova posição: #${rotatedUnits.find(u => u.id === unitId)?.queuePosition || 'N'}).`,
      { unitId: targetUnit.id, unitNumber: targetUnit.unitNumber, voucherCode: targetReq.voucherCode },
      [logAccepted, ...auditLogs]
    );

    setUnits(rotatedUnits);
    setRequests(prev => prev.map(r => r.id === requestId ? updatedRequest : r));
    setAuditLogs([logRotation, logAccepted, ...auditLogs]);

    triggerAudio('accepted');
  }, [requests, units, auditLogs, triggerAudio]);

  // 3. HOST REJECTS (PASSES TO NEXT IN QUEUE IMMEDIATELY)
  const handleHostReject = useCallback((requestId: string, unitId: string, reason: string) => {
    const targetReq = requests.find(r => r.id === requestId);
    const targetUnit = units.find(u => u.id === unitId);
    if (!targetReq || !targetUnit) return;

    // Update target unit stats
    const modifiedUnits = units.map(u => {
      if (u.id === unitId) {
        return {
          ...u,
          totalRejections: u.totalRejections + 1,
        };
      }
      return u;
    });

    // Mark attempt as rejected
    const updatedAttempts = targetReq.callAttempts.map(att => {
      if (att.unitId === unitId && att.outcome === 'pending') {
        const responseTimeSeconds = Math.max(1, Math.round((Date.now() - new Date(att.calledAt).getTime()) / 1000));
        return {
          ...att,
          outcome: 'rejected' as const,
          rejectionReason: reason,
          respondedAt: new Date().toISOString(),
          responseTimeSeconds,
        };
      }
      return att;
    });

    const requestWithRejection: GuestRequest = {
      ...targetReq,
      callAttempts: updatedAttempts,
      updatedAt: new Date().toISOString(),
    };

    const logReject = createAuditEntry(
      'HOST_REJECTED',
      'Anfitrião',
      `Anfitrião ${targetUnit.ownerName} (Apto ${targetUnit.unitNumber}) recusou o chamado do Voucher ${targetReq.voucherCode}. Motivo: "${reason}". Passando a vez automaticamente para o próximo da fila.`,
      { unitId: targetUnit.id, unitNumber: targetUnit.unitNumber, voucherCode: targetReq.voucherCode, guestName: targetReq.guestName },
      auditLogs
    );

    // Immediately summon the next host in the queue!
    const { updatedRequest, updatedUnits, updatedLogs, calledUnit } = callNextHostInQueue(
      requestWithRejection,
      modifiedUnits,
      [logReject, ...auditLogs],
      config
    );

    setUnits(updatedUnits);
    setRequests(prev => prev.map(r => r.id === requestId ? updatedRequest : r));
    setAuditLogs(updatedLogs);

    if (calledUnit) {
      setCurrentHostUnitId(calledUnit.id);
    }
    triggerAudio('rejected');
  }, [requests, units, auditLogs, config, triggerAudio]);

  // 4. HOST TIMEOUT (5 MINUTES EXPIRED WITH NO RESPONSE -> AUTO PASSES TO NEXT)
  const handleHostTimeout = useCallback((requestId: string) => {
    const targetReq = requests.find(r => r.id === requestId);
    if (!targetReq || targetReq.status !== 'waiting_host') return;

    const currentAttempt = targetReq.callAttempts[targetReq.callAttempts.length - 1];
    const unitId = currentAttempt?.unitId || targetReq.assignedUnitId;
    const targetUnit = units.find(u => u.id === unitId);

    // Update target unit timeouts
    const modifiedUnits = units.map(u => {
      if (u.id === unitId) {
        return {
          ...u,
          totalTimeouts: u.totalTimeouts + 1,
        };
      }
      return u;
    });

    // Mark current attempt as timeout
    const updatedAttempts = targetReq.callAttempts.map((att, idx) => {
      if (idx === targetReq.callAttempts.length - 1 && att.outcome === 'pending') {
        return {
          ...att,
          outcome: 'timeout' as const,
          respondedAt: new Date().toISOString(),
          rejectionReason: `Prazo limite de ${config.timeoutMinutes} minutos esgotado sem resposta.`,
          responseTimeSeconds: config.timeoutMinutes * 60,
        };
      }
      return att;
    });

    const requestWithTimeout: GuestRequest = {
      ...targetReq,
      callAttempts: updatedAttempts,
      updatedAt: new Date().toISOString(),
    };

    const logTimeout = createAuditEntry(
      'HOST_TIMEOUT_EXPIRED',
      'Sistema Autônomo',
      `Prazo de ${config.timeoutMinutes} minutos esgotado sem resposta da Unidade ${targetUnit?.unitNumber || 'N/A'} para o Voucher ${targetReq.voucherCode}. Rotacionando automaticamente para o próximo anfitrião da fila.`,
      { unitId: targetUnit?.id, unitNumber: targetUnit?.unitNumber, voucherCode: targetReq.voucherCode, guestName: targetReq.guestName },
      auditLogs
    );

    // Automatically call the next host in the queue!
    const { updatedRequest, updatedUnits, updatedLogs, calledUnit } = callNextHostInQueue(
      requestWithTimeout,
      modifiedUnits,
      [logTimeout, ...auditLogs],
      config
    );

    setUnits(updatedUnits);
    setRequests(prev => prev.map(r => r.id === requestId ? updatedRequest : r));
    setAuditLogs(updatedLogs);

    if (calledUnit) {
      setCurrentHostUnitId(calledUnit.id);
    }
    triggerAudio('timeout');
  }, [requests, units, auditLogs, config, triggerAudio]);

  // 5. HOST ENABLES / DISABLES REAL-TIME AVAILABILITY
  const handleToggleAvailability = useCallback((unitId: string, isAvailable: boolean) => {
    const targetUnit = units.find(u => u.id === unitId);
    if (!targetUnit) return;

    const updated = units.map(u => {
      if (u.id === unitId) {
        return {
          ...u,
          isAvailableByHost: isAvailable,
        };
      }
      return u;
    });

    const reindexed = reindexQueue(updated);

    const log = createAuditEntry(
      'HOST_AVAILABILITY_CHANGED',
      'Anfitrião',
      `Anfitrião ${targetUnit.ownerName} alterou a disponibilidade do Apto ${targetUnit.unitNumber} para ${isAvailable ? 'HABILITADO NO RODÍZIO' : 'INATIVO'}.`,
      { unitId, unitNumber: targetUnit.unitNumber },
      auditLogs
    );

    setUnits(reindexed);
    setAuditLogs([log, ...auditLogs]);
  }, [units, auditLogs]);

  // 6. ADMIN ENABLES / BLOCKS UNIT FROM THE 302-UNIT ROSTER
  const handleToggleUnitAdminEligibility = useCallback((unitId: string, isEligible: boolean, reason?: string) => {
    const targetUnit = units.find(u => u.id === unitId);
    if (!targetUnit) return;

    const updated = units.map(u => {
      if (u.id === unitId) {
        return {
          ...u,
          isEligibleByAdmin: isEligible,
          ineligibleReason: isEligible ? undefined : (reason || 'Bloqueio administrativo'),
          isAvailableByHost: isEligible ? u.isAvailableByHost : false,
        };
      }
      return u;
    });

    const reindexed = reindexQueue(updated);

    const log = createAuditEntry(
      isEligible ? 'ADMIN_UNIT_ACTIVATED' : 'ADMIN_UNIT_DEACTIVATED',
      'Síndico/Admin',
      isEligible 
        ? `Administração ativou o Apto ${targetUnit.unitNumber} (${targetUnit.block}) para participar do sistema de rodízio.`
        : `Administração bloqueou o Apto ${targetUnit.unitNumber} (${targetUnit.block}) do sistema de rodízio. Motivo: "${reason}".`,
      { unitId, unitNumber: targetUnit.unitNumber },
      auditLogs
    );

    setUnits(reindexed);
    setAuditLogs([log, ...auditLogs]);
  }, [units, auditLogs]);

  // 7. RECEPTION DELIVERS KEY TO GUEST (WITHOUT MANUAL UNIT SELECTION)
  const handleValidateKeyDelivery = useCallback((requestId: string, keyTag: string, notes: string) => {
    const targetReq = requests.find(r => r.id === requestId);
    if (!targetReq) return;

    const updatedRequest: GuestRequest = {
      ...targetReq,
      status: 'checked_in',
      receptionValidationKey: keyTag,
      receptionistNotes: notes,
      keyDeliveredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const log = createAuditEntry(
      'RECEPTION_KEY_ISSUED',
      'Portaria',
      `Portaria conferiu presencialmente documento de ${targetReq.guestName} e entregou chave/tag [${keyTag}] do Apto ${targetReq.assignedUnitNumber} (${targetReq.assignedUnitBlock}). Unidade definida estritamente pelo algoritmo.`,
      { 
        voucherCode: targetReq.voucherCode, 
        unitId: targetReq.assignedUnitId, 
        unitNumber: targetReq.assignedUnitNumber,
        guestName: targetReq.guestName 
      },
      auditLogs
    );

    setRequests(prev => prev.map(r => r.id === requestId ? updatedRequest : r));
    setAuditLogs([log, ...auditLogs]);
    triggerAudio('accepted');
  }, [requests, auditLogs, triggerAudio]);

  // 8. UPDATE UNIT SETTINGS & CONTACT
  const handleUpdateUnit = useCallback((updatedUnit: Unit) => {
    setUnits(prev => {
      const updated = prev.map(u => u.id === updatedUnit.id ? updatedUnit : u);
      return reindexQueue(updated);
    });

    const log = createAuditEntry(
      'HOST_CONTACT_UPDATED',
      'Anfitrião',
      `Responsável ${updatedUnit.ownerName} atualizou o cadastro do Apto ${updatedUnit.unitNumber} (${updatedUnit.block}). WhatsApp: ${updatedUnit.whatsapp}, Diária: R$ ${updatedUnit.basePrice}, Camas: ${updatedUnit.bedSummary}.`,
      { unitId: updatedUnit.id, unitNumber: updatedUnit.unitNumber },
      auditLogs
    );
    setAuditLogs(prev => [log, ...prev]);
  }, [auditLogs]);

  // 8b. REGISTER NEW HOST UNIT & WHATSAPP CONTACT
  const handleRegisterUnit = useCallback((newUnitData: Unit) => {
    // Check if unit number and block already exists
    const existingIndex = units.findIndex(
      u => u.id === newUnitData.id || (u.unitNumber === newUnitData.unitNumber && u.block === newUnitData.block)
    );

    let updatedList: Unit[];
    let isNew = false;
    let finalUnitId = newUnitData.id;

    if (existingIndex >= 0) {
      finalUnitId = units[existingIndex].id;
      updatedList = units.map((u, i) => i === existingIndex ? { ...u, ...newUnitData, id: u.id } : u);
    } else {
      isNew = true;
      updatedList = [newUnitData, ...units];
    }

    const reindexed = reindexQueue(updatedList);
    setUnits(reindexed);
    setCurrentHostUnitId(finalUnitId);

    const log = createAuditEntry(
      isNew ? 'HOST_UNIT_REGISTERED' : 'HOST_CONTACT_UPDATED',
      'Anfitrião',
      isNew
        ? `Novo cadastro de unidade realizado pelo responsável ${newUnitData.ownerName}: Apto ${newUnitData.unitNumber} (${newUnitData.block}). WhatsApp de contato: ${newUnitData.whatsapp}. Diária: R$ ${newUnitData.basePrice}.`
        : `Responsável ${newUnitData.ownerName} atualizou dados do Apto ${newUnitData.unitNumber} (${newUnitData.block}). WhatsApp: ${newUnitData.whatsapp}.`,
      { unitId: finalUnitId, unitNumber: newUnitData.unitNumber },
      auditLogs
    );
    setAuditLogs(prev => [log, ...prev]);
    triggerAudio('accepted');
  }, [units, auditLogs, triggerAudio]);

  // 9. CANCEL GUEST REQUEST
  const handleCancelRequest = useCallback((requestId: string) => {
    setRequests(prev => prev.filter(r => r.id !== requestId));
  }, []);

  // 10. SYSTEM RESET TO INITIAL PRISTINE DATA
  const handleResetSystemData = useCallback(() => {
    if (confirm('Tem certeza que deseja restaurar as 302 unidades e redefinir o sistema para o padrão de fábrica?')) {
      const freshUnits = generate302Units();
      const freshConfig = getDefaultConfig();
      setUnits(freshUnits);
      setConfig(freshConfig);
      setRequests([]);
      const freshLog = createAuditEntry(
        'SYSTEM_INITIALIZED',
        'Síndico/Admin',
        'Sistema restaurado para parâmetros padrão com 302 unidades registradas e integridade resetada.',
        {},
        []
      );
      setAuditLogs([freshLog]);
      alert('Sistema restaurado com sucesso!');
    }
  }, []);

  const activeQueueCount = units.filter(u => u.isEligibleByAdmin && u.isAvailableByHost).length;
  const pendingRequestsCount = requests.filter(r => r.status === 'waiting_host').length;
  const currentUnit = units.find(u => u.id === currentHostUnitId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Navigation & Role Switcher */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        activeQueueCount={activeQueueCount}
        totalUnitsCount={units.length}
        pendingRequestsCount={pendingRequestsCount}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onOpenSimulate={() => setIsSimulateModalOpen(true)}
        onOpenQrPlaque={() => setIsQrPlaqueOpen(true)}
        onOpenShareLinks={() => setIsShareLinksOpen(true)}
        onOpenLogin={(role) => handleOpenLogin(role || 'host')}
        onLogout={handleLogout}
        currentHostUnitNumber={currentUnit?.unitNumber}
        authenticatedUserName={session?.userName}
      />

      {/* Active Assignment Live Notification Bar */}
      {activeRequest && activeRequest.status === 'waiting_host' && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-4 py-2.5 font-medium shadow-lg animate-pulse-subtle border-b border-amber-400">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
              <Bell className="w-4 h-4 text-slate-950 animate-bounce" />
              <span>
                <strong>Notificação em Tempo Real no Dispositivo:</strong> Hóspede <strong>{activeRequest.guestName}</strong> atribuído ao <strong>Apto {activeRequest.assignedUnitNumber}</strong> ({activeRequest.assignedHostName}). 
                {activeRequest.estimatedWaitMinutes && (
                  <span className="ml-1 opacity-90">Tempo estimado de espera: ~{activeRequest.estimatedWaitMinutes} min.</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (activeRequest.assignedUnitId) {
                    setCurrentHostUnitId(activeRequest.assignedUnitId);
                  }
                  setActiveTab('host');
                }}
                className="bg-slate-950 text-amber-300 hover:text-white px-3 py-1 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition-all hover:scale-105"
              >
                <span>Responder no Painel do Anfitrião</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content by Role */}
      <main className="flex-1 pb-16">
        {activeTab === 'guest' && (
          <GuestTotem
            units={units}
            activeRequest={activeRequest}
            onSubmitRequest={handleGuestSubmit}
            onCancelRequest={handleCancelRequest}
            onSimulateTimeout={handleHostTimeout}
            onSimulateAccept={(reqId) => {
              const req = requests.find(r => r.id === reqId);
              if (req && req.assignedUnitId) {
                handleHostAccept(reqId, req.assignedUnitId);
              }
            }}
            onSimulateReject={(reqId) => {
              const req = requests.find(r => r.id === reqId);
              if (req && req.assignedUnitId) {
                handleHostReject(reqId, req.assignedUnitId, 'Recusa rápida de demonstração');
              }
            }}
            config={config}
          />
        )}

        {activeTab === 'host' && (
          <HostPortal
            units={units}
            activeRequest={activeRequest}
            currentHostUnitId={currentHostUnitId}
            setCurrentHostUnitId={setCurrentHostUnitId}
            onToggleAvailability={handleToggleAvailability}
            onUpdateUnit={handleUpdateUnit}
            onRegisterUnit={handleRegisterUnit}
            onHostAccept={handleHostAccept}
            onHostReject={handleHostReject}
            config={config}
          />
        )}

        {activeTab === 'reception' && (
          <ReceptionDesk
            requests={requests}
            units={units}
            activeRequest={activeRequest}
            onValidateKeyDelivery={handleValidateKeyDelivery}
            onManualWalkInSubmit={handleGuestSubmit}
            onOpenQrPlaque={() => setIsQrPlaqueOpen(true)}
            config={config}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            units={units}
            auditLogs={auditLogs}
            requests={requests}
            config={config}
            onToggleUnitAdminEligibility={handleToggleUnitAdminEligibility}
            onUpdateConfig={setConfig}
            onResetSystemData={handleResetSystemData}
            accessAccounts={accessAccounts}
            onApproveAccount={handleApproveAccount}
            onRejectAccount={handleRejectAccount}
          />
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-amber-400 font-bold tracking-wide">PROXIMO</strong> • <strong className="text-slate-200">Crystal Place Residence</strong> • Gestão de Balcão e Rodízio (Torre Única • 302 Unidades)
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-medium">Portaria 100% Blindada</span>
            <span>•</span>
            <span>Algoritmo Round Robin Auditável</span>
          </div>
        </div>
      </footer>

      {/* Printable Counter QR Plaque Modal */}
      <PrintableQrModal
        isOpen={isQrPlaqueOpen}
        onClose={() => setIsQrPlaqueOpen(false)}
        complexName={config.complexName}
      />

      {/* Walk-in Simulator Modal */}
      <SimulateGuestModal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        onSimulateGuest={handleGuestSubmit}
      />

      {/* Simple Access Modal (Nome, Email, Telefone, Tipo de Acesso + Validação Admin) */}
      <PortalLogin
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        accounts={accessAccounts}
        units={units}
        onRequestAccess={handleRequestAccess}
        onLoginSuccess={handleLoginSuccess}
        initialRole={loginTargetRole}
      />

      {/* Share Links Modal */}
      <ShareLinksModal
        isOpen={isShareLinksOpen}
        onClose={() => setIsShareLinksOpen(false)}
        complexName={config.complexName}
        currentHostUnitNumber={currentUnit?.unitNumber}
      />

    </div>
  );
}
