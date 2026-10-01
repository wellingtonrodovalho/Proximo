/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Radio, ArrowRight, ShieldCheck, Clock, CheckCircle2, Lock, LogOut, Share2, Edit3, MessageSquare } from 'lucide-react';
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
  getDefaultConfig,
  clearAllTestData
} from './utils/storage';
import { callNextHostInQueue, rotateUnitToEnd, reindexQueue } from './utils/roundRobin';
import { createAuditEntry } from './utils/audit';
import { playChime } from './utils/audio';
import { dispatchHostCredentialingNotifications, dispatchGuestCallNotifications } from './utils/notifications';
import { 
  UserRole, 
  AccessRole,
  AccessAccount,
  INITIAL_ACCOUNTS,
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
import { ManualModal } from './components/ManualModal';
import { DispatchNotificationModal } from './components/DispatchNotificationModal';
import { EditUnitModal } from './components/EditUnitModal';
import { GiroGoLogo } from './components/GiroGoLogo';

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
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);

  // Multi-channel dispatch popup state
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [dispatchedCallRequest, setDispatchedCallRequest] = useState<GuestRequest | null>(null);
  const [dispatchedCallUnit, setDispatchedCallUnit] = useState<Unit | null>(null);

  // Quick unit edit modal state
  const [isEditUnitModalOpen, setIsEditUnitModalOpen] = useState<boolean>(false);
  const [unitToEdit, setUnitToEdit] = useState<Unit | null>(null);

  // Active in-progress request for the Totem and Host alert
  const activeRequest = requests.find(r => r.status === 'waiting_host' || r.status === 'accepted' || r.status === 'rejected') || null;

  // Sync access accounts to storage
  useEffect(() => {
    saveAccessAccounts(accessAccounts);
  }, [accessAccounts]);

  // Persist units to storage
  useEffect(() => {
    saveUnits(units);
  }, [units]);

  // Cross-tab real-time sync with BroadcastChannel and storage events
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('girogo_cross_tab_sync');
        bc.onmessage = (event) => {
          const msg = event.data;
          if (msg && msg.type) {
            // Instantly refresh state from storage
            const freshRequests = loadRequests();
            const freshUnits = loadUnits();
            const freshLogs = loadAuditLogs();
            setRequests(freshRequests);
            setUnits(freshUnits);
            setAuditLogs(freshLogs);

            if (msg.type === 'NEW_WALK_IN_REQUEST') {
              if (soundEnabled) {
                playChime('incoming_call');
              }
              if (msg.calledUnitId) {
                setCurrentHostUnitId(msg.calledUnitId);
              }
            }
          }
        };
      }
    } catch {
      // Ignore BroadcastChannel errors in restricted contexts
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key && (e.key.includes('rotativo302') || e.key.includes('girogo'))) {
        setRequests(loadRequests());
        setUnits(loadUnits());
        setAuditLogs(loadAuditLogs());
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [soundEnabled]);

  const broadcastSync = useCallback((payload: Record<string, unknown>) => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('girogo_cross_tab_sync');
        bc.postMessage(payload);
        bc.close();
      }
    } catch {
      // Ignore
    }
  }, []);

  const updateUrlForRole = useCallback((role: 'guest' | 'host' | 'reception' | 'admin') => {
    if (typeof window === 'undefined') return;
    const url = buildPortalUrl(role);
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
    updateUrlForRole(newSession.role);
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
      updateUrlForRole(tab);
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
    let approvedTarget: AccessAccount | undefined;

    setAccessAccounts(prev => prev.map(a => {
      if (a.id === accountId) {
        approvedTarget = {
          ...a,
          status: 'approved',
          approvedAt: new Date().toISOString(),
          approvedBy: 'Administrador / Síndico',
        };
        return approvedTarget;
      }
      return a;
    }));

    const target = approvedTarget || accessAccounts.find(a => a.id === accountId);
    if (target) {
      // 1. Dispatch Multi-Channel Notifications (Email, WhatsApp, SMS, Push)
      const dispatchResult = dispatchHostCredentialingNotifications({
        name: target.name,
        email: target.email,
        phone: target.phone,
        unitNumber: target.unitNumber,
      });

      // 2. If it's a host account and unit exists, link the unit to the owner
      if (target.unitNumber) {
        setUnits(prev => prev.map(u => {
          if (u.unitNumber === target?.unitNumber) {
            return {
              ...u,
              ownerName: target.name,
              ownerEmail: target.email,
              ownerPhone: target.phone,
              whatsapp: target.phone,
              isEligibleByAdmin: true,
            };
          }
          return u;
        }));
      }

      // 3. Register Audit Entry with multi-channel dispatch details
      const log = createAuditEntry(
        'ACCESS_ACCOUNT_APPROVED',
        'Síndico/Admin',
        `Credenciamento aprovado: ${target.name} (${target.role}${target.unitNumber ? ` - Apto ${target.unitNumber}` : ''}). Notificações enviadas com sucesso via E-mail (${target.email}), WhatsApp (${target.phone}) e SMS.`,
        { unitNumber: target.unitNumber },
        auditLogs
      );
      setAuditLogs(prev => [log, ...prev]);

      alert(`✅ Credenciamento aprovado com sucesso!\n\nNotificações automáticas enviadas para ${target.name}:\n• E-mail: ${target.email}\n• WhatsApp: ${target.phone}\n• SMS: ${target.phone}`);
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
    checkInDate?: string;
    checkOutDate?: string;
    typologyPreferred: UnitTypology | 'Qualquer';
    petFriendly: boolean;
    guestNotes?: string;
  }) => {
    const voucherCode = 'BAL-' + Math.floor(1000 + Math.random() * 9000);
    const todayStr = new Date().toISOString().split('T')[0];
    const checkInDate = formData.checkInDate || todayStr;
    const checkOutDate = formData.checkOutDate || new Date(new Date(checkInDate + 'T00:00:00').getTime() + (formData.nightsCount || 1) * 86400000).toISOString().split('T')[0];

    const initialRequest: GuestRequest = {
      id: 'req-' + Date.now(),
      voucherCode,
      guestName: formData.guestName,
      guestDocument: formData.guestDocument,
      guestPhone: formData.guestPhone,
      guestsCount: formData.guestsCount,
      nightsCount: formData.nightsCount,
      checkInDate,
      checkOutDate,
      typologyPreferred: formData.typologyPreferred,
      petFriendly: formData.petFriendly,
      guestNotes: formData.guestNotes?.trim() ? formData.guestNotes.trim() : undefined,
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
    const notesLog = formData.guestNotes ? ` Obs: "${formData.guestNotes}".` : '';
    const guestLog = createAuditEntry(
      'GUEST_CHECKIN_INITIATED',
      'Hóspede',
      `Hóspede ${formData.guestName} (${formData.guestDocument}) iniciou solicitação de balcão via QR Code para ${formData.guestsCount} pessoa(s), ${formData.nightsCount} noite(s) (Voucher ${voucherCode}).${notesLog}`,
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

      // Dispatch real multi-channel notification and open confirmation popup
      dispatchGuestCallNotifications({
        voucherCode: updatedRequest.voucherCode,
        guestName: updatedRequest.guestName,
        guestDocument: updatedRequest.guestDocument,
        guestPhone: updatedRequest.guestPhone,
        guestsCount: updatedRequest.guestsCount,
        nightsCount: updatedRequest.nightsCount,
        checkInDate: updatedRequest.checkInDate,
        checkOutDate: updatedRequest.checkOutDate,
        totalAmount: updatedRequest.totalAmount,
        guestNotes: updatedRequest.guestNotes,
        unit: {
          id: calledUnit.id,
          unitNumber: calledUnit.unitNumber,
          floor: calledUnit.floor,
          ownerName: calledUnit.ownerName,
          managerName: calledUnit.managerName,
          managementType: calledUnit.managementType,
          ownerEmail: calledUnit.ownerEmail,
          ownerPhone: calledUnit.ownerPhone,
          whatsapp: calledUnit.whatsapp || calledUnit.ownerPhone,
        }
      });

      setDispatchedCallRequest(updatedRequest);
      setDispatchedCallUnit(calledUnit);
      setIsDispatchModalOpen(true);

      // Broadcast to other open tabs (e.g. Admin or Host Portal) in real time
      broadcastSync({
        type: 'NEW_WALK_IN_REQUEST',
        requestId: updatedRequest.id,
        calledUnitId: calledUnit.id,
      });
    }
  }, [units, auditLogs, config, triggerAudio, broadcastSync]);

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
      `Regra de rodízio executada: Apto ${targetUnit.unitNumber} completou locação e foi reposicionado no final da fila de balcão (Nova posição: #${rotatedUnits.find(u => u.id === unitId)?.queuePosition || 'N'}).`,
      { unitId: targetUnit.id, unitNumber: targetUnit.unitNumber, voucherCode: targetReq.voucherCode },
      [logAccepted, ...auditLogs]
    );

    setUnits(rotatedUnits);
    setRequests(prev => prev.map(r => r.id === requestId ? updatedRequest : r));
    setAuditLogs([logRotation, logAccepted, ...auditLogs]);

    triggerAudio('accepted');
    broadcastSync({ type: 'REQUEST_ACCEPTED', requestId });
  }, [requests, units, auditLogs, triggerAudio, broadcastSync]);

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
    const cleanPhone = updatedUnit.whatsapp || updatedUnit.ownerPhone || '';

    setUnits(prev => {
      const updated = prev.map(u => u.id === updatedUnit.id ? updatedUnit : u);
      const reindexed = reindexQueue(updated);
      saveUnits(reindexed);
      return reindexed;
    });

    // Also sync the contact updates into accessAccounts and current session
    setAccessAccounts(prev => {
      const updatedAccs = prev.map(acc => {
        if (
          acc.unitNumber === updatedUnit.unitNumber ||
          (acc.managedUnits && acc.managedUnits.includes(updatedUnit.unitNumber)) ||
          (session && acc.id === session.accountId) ||
          (session && acc.email && session.userEmail && acc.email.toLowerCase() === session.userEmail.toLowerCase())
        ) {
          return {
            ...acc,
            phone: cleanPhone || acc.phone,
            name: updatedUnit.ownerName || acc.name,
            email: updatedUnit.ownerEmail || acc.email,
          };
        }
        return acc;
      });
      saveAccessAccounts(updatedAccs);
      return updatedAccs;
    });

    if (session) {
      const updatedSession: AuthSession = {
        ...session,
        userName: updatedUnit.ownerName || session.userName,
        userPhone: cleanPhone || session.userPhone,
        userEmail: updatedUnit.ownerEmail || session.userEmail,
      };
      setSession(updatedSession);
      saveSession(updatedSession);
    }

    const log = createAuditEntry(
      'HOST_CONTACT_UPDATED',
      'Anfitrião',
      `Responsável ${updatedUnit.ownerName} atualizou o cadastro do Apto ${updatedUnit.unitNumber} (${updatedUnit.block}). WhatsApp: ${updatedUnit.whatsapp}, Diária: R$ ${updatedUnit.basePrice}, Camas: ${updatedUnit.bedSummary}.`,
      { unitId: updatedUnit.id, unitNumber: updatedUnit.unitNumber },
      auditLogs
    );
    setAuditLogs(prev => [log, ...prev]);
  }, [auditLogs, session]);

  // Sync profile edits across accounts and units
  const handleUpdateAccountProfile = useCallback((profile: { name: string; phone: string; email: string }) => {
    setAccessAccounts(prev => {
      const updatedAccs = prev.map(acc => {
        if (
          (session && acc.id === session.accountId) ||
          (session && acc.email && session.userEmail && acc.email.toLowerCase() === session.userEmail.toLowerCase()) ||
          (acc.name && acc.name.includes('Wellington'))
        ) {
          return {
            ...acc,
            name: profile.name || acc.name,
            phone: profile.phone || acc.phone,
            email: profile.email || acc.email,
          };
        }
        return acc;
      });
      saveAccessAccounts(updatedAccs);
      return updatedAccs;
    });

    if (session) {
      const updatedSession: AuthSession = {
        ...session,
        userName: profile.name,
        userPhone: profile.phone,
        userEmail: profile.email,
      };
      setSession(updatedSession);
      saveSession(updatedSession);
    }

    // Also update current unit and Wellington units
    setUnits(prev => {
      const updatedUnits = prev.map(u => {
        if (
          u.id === currentHostUnitId || 
          (u.ownerName && u.ownerName.includes('Wellington')) ||
          (u.managerName && u.managerName.includes('Wellington'))
        ) {
          return {
            ...u,
            ownerName: profile.name || u.ownerName,
            whatsapp: profile.phone || u.whatsapp,
            ownerPhone: profile.phone || u.ownerPhone,
            ownerEmail: profile.email || u.ownerEmail,
          };
        }
        return u;
      });
      saveUnits(updatedUnits);
      return updatedUnits;
    });
  }, [session, currentHostUnitId]);

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

  // 9b. ENSURE ACTIVE UNITS IN QUEUE (Wellington 1609 & 1701 + pool)
  const handleEnsureActiveUnits = useCallback(() => {
    setUnits(prev => {
      const updated = prev.map(u => {
        if (u.unitNumber === '1609') {
          return { ...u, isEligibleByAdmin: true, isAvailableByHost: true, queuePosition: 1 };
        }
        if (u.unitNumber === '1701') {
          return { ...u, isEligibleByAdmin: true, isAvailableByHost: true, queuePosition: 2 };
        }
        return u;
      });
      const reindexed = reindexQueue(updated);
      saveUnits(reindexed);
      return reindexed;
    });
  }, []);

  // 10. SYSTEM RESET TO INITIAL PRISTINE DATA
  const handleResetSystemData = useCallback(() => {
    if (confirm('Tem certeza que deseja excluir todos os dados e redefinir o sistema para o estado limpo? Todas as informações de testes e registros serão apagadas.')) {
      clearAllTestData();
      const freshUnits = generate302Units();
      const freshConfig = getDefaultConfig();
      setUnits(freshUnits);
      setConfig(freshConfig);
      setRequests([]);
      setAccessAccounts(INITIAL_ACCOUNTS);
      saveAccessAccounts(INITIAL_ACCOUNTS);
      clearSession();
      setSession(null);
      const freshLog = createAuditEntry(
        'SYSTEM_INITIALIZED',
        'Síndico/Admin',
        'Base de dados limpa com sucesso no Crystal Place Residence. Todas as informações de teste foram excluídas.',
        {},
        []
      );
      setAuditLogs([freshLog]);
      alert('Base de dados limpa com sucesso! Todas as informações anteriores foram excluídas e o sistema está pronto para uso real.');
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
        onOpenManual={() => setIsManualModalOpen(true)}
        onOpenEditCurrentUnit={() => {
          setUnitToEdit(currentUnit || units[0]);
          setIsEditUnitModalOpen(true);
        }}
        currentHostUnitNumber={currentUnit?.unitNumber}
        authenticatedUserName={session?.userName}
      />

      {/* Active Assignment Live Notification Bar */}
      {activeRequest && activeRequest.status === 'waiting_host' && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-4 py-2.5 font-medium shadow-lg animate-pulse-subtle border-b border-amber-400">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
              <Bell className="w-4 h-4 text-slate-950 animate-bounce" />
              <span>
                <strong>Notificação Multicanal no Dispositivo:</strong> Hóspede <strong>{activeRequest.guestName}</strong> atribuído ao <strong>Apto {activeRequest.assignedUnitNumber}</strong> ({activeRequest.assignedHostName}). 
                {activeRequest.estimatedWaitMinutes && (
                  <span className="ml-1 opacity-90">Tempo regulamentar: ~{activeRequest.estimatedWaitMinutes} min.</span>
                )}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  const calledUnit = units.find(u => u.id === activeRequest.assignedUnitId) || null;
                  setDispatchedCallRequest(activeRequest);
                  setDispatchedCallUnit(calledUnit);
                  setIsDispatchModalOpen(true);
                }}
                className="bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition-all"
                title="Ver notificações geradas para WhatsApp, E-mail e SMS"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
                <span>Ver Notificação do Anfitrião</span>
              </button>

              <button
                onClick={() => {
                  const calledUnit = units.find(u => u.id === activeRequest.assignedUnitId) || currentUnit || units[0];
                  setUnitToEdit(calledUnit);
                  setIsEditUnitModalOpen(true);
                }}
                className="bg-slate-900/90 hover:bg-slate-900 text-amber-300 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition-all border border-amber-400/40"
                title="Corrigir WhatsApp e dados da unidade"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Corrigir WhatsApp</span>
              </button>

              <button
                onClick={() => {
                  if (activeRequest.assignedUnitId) {
                    setCurrentHostUnitId(activeRequest.assignedUnitId);
                  }
                  setActiveTab('host');
                }}
                className="bg-slate-950 text-amber-300 hover:text-white px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow transition-all hover:scale-105"
              >
                <span>Responder no Painel</span>
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
            onEnsureActiveUnits={handleEnsureActiveUnits}
            onOpenDispatchModal={() => {
              const calledUnit = units.find(u => u.id === activeRequest?.assignedUnitId) || null;
              setDispatchedCallRequest(activeRequest);
              setDispatchedCallUnit(calledUnit);
              setIsDispatchModalOpen(true);
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
            onUpdateAccountProfile={handleUpdateAccountProfile}
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
            onOpenManual={() => setIsManualModalOpen(true)}
            onEditUnit={(u) => {
              setUnitToEdit(u);
              setIsEditUnitModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-[#0c2244] bg-[#040b18]/95 py-4 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <GiroGoLogo variant="badge" size="sm" theme="dark" />
            <span className="text-slate-400">
              • <strong className="text-slate-200">Crystal Place Residence</strong> • Rodízio e Fila Virtual de Anfitriões
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-teal-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              Portaria 100% Blindada
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">SLA 5 Minutos</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Distribuição Imparcial e Auditada</span>
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
        currentUserName={session?.userName}
        onOpenManual={() => setIsManualModalOpen(true)}
        onTestGenericLogin={() => {
          handleLogout();
          setLoginTargetRole('host');
          setIsLoginModalOpen(true);
        }}
      />

      {/* Official Instructions Manual PDF Modal */}
      <ManualModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        condoName={config.complexName}
      />

      {/* Multi-Channel Notification Dispatch Popup */}
      <DispatchNotificationModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        request={dispatchedCallRequest}
        unit={dispatchedCallUnit}
        onOpenHostPortal={(unitId) => {
          setCurrentHostUnitId(unitId);
          setActiveTab('host');
        }}
        onOpenEditUnit={(u) => {
          setUnitToEdit(u);
          setIsEditUnitModalOpen(true);
        }}
      />

      {/* Quick Unit & Host Cadastros Edit Modal */}
      <EditUnitModal
        isOpen={isEditUnitModalOpen}
        onClose={() => setIsEditUnitModalOpen(false)}
        unit={unitToEdit || currentUnit || units[0]}
        onSaveUnit={handleUpdateUnit}
        onUpdateAccountProfile={handleUpdateAccountProfile}
      />

    </div>
  );
}
