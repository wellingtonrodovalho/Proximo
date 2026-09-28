import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  ToggleLeft, 
  ToggleRight, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Home, 
  ShieldCheck, 
  Bell, 
  Settings, 
  History, 
  ChevronRight,
  UserCheck,
  Calendar,
  Sparkles,
  Info,
  Bed,
  Layers,
  Smartphone,
  Check,
  MessageSquare,
  ExternalLink,
  PlusCircle,
  Phone,
  User,
  Send,
  Building,
  ShieldAlert
} from 'lucide-react';
import { Unit, GuestRequest, SystemConfig, BedConfig, UnitBlock } from '../types';
import { playChime } from '../utils/audio';
import { 
  requestDeviceNotificationPermission, 
  getDeviceNotificationPermission, 
  sendDeviceNotification,
  isNotificationSupported
} from '../utils/notifications';
import { 
  formatWhatsApp, 
  isValidWhatsApp, 
  getWhatsAppDirectUrl, 
  getOfficialHostNotificationMessage 
} from '../utils/whatsapp';

interface HostPortalProps {
  units: Unit[];
  activeRequest: GuestRequest | null;
  currentHostUnitId: string;
  setCurrentHostUnitId: (unitId: string) => void;
  onToggleAvailability: (unitId: string, isAvailable: boolean) => void;
  onUpdateUnit: (updatedUnit: Unit) => void;
  onRegisterUnit?: (newUnit: Unit) => void;
  onHostAccept: (requestId: string, unitId: string) => void;
  onHostReject: (requestId: string, unitId: string, reason: string) => void;
  config: SystemConfig;
}

const AVAILABLE_BED_TYPES: BedConfig['type'][] = [
  'Cama Casal Queen',
  'Cama Casal Padrão',
  'Cama Solteiro',
  'Sofá-Cama Casal',
  'Bicama Solteiro',
];

export const HostPortal: React.FC<HostPortalProps> = ({
  units,
  activeRequest,
  currentHostUnitId,
  setCurrentHostUnitId,
  onToggleAvailability,
  onUpdateUnit,
  onRegisterUnit,
  onHostAccept,
  onHostReject,
  config,
}) => {
  const currentUnit = units.find(u => u.id === currentHostUnitId) || units[0];

  const [activeTab, setActiveTab] = useState<'queue' | 'settings' | 'history'>('queue');
  const [rejectReasonModalOpen, setRejectReasonModalOpen] = useState(false);
  const [selectedRejectReason, setSelectedRejectReason] = useState('Perfil do hóspede incompatível com as regras');
  const [customRejectReason, setCustomRejectReason] = useState('');

  // Notification permission state
  const [notifPermission, setNotifPermission] = useState<string>('default');

  useEffect(() => {
    setNotifPermission(getDeviceNotificationPermission());
  }, []);

  // Editable unit and responsible person settings (Tab 2)
  const [ownerName, setOwnerName] = useState<string>(currentUnit?.ownerName || '');
  const [ownerWhatsapp, setOwnerWhatsapp] = useState<string>(currentUnit?.whatsapp || currentUnit?.ownerPhone || '');
  const [ownerEmail, setOwnerEmail] = useState<string>(currentUnit?.ownerEmail || '');
  const [unitNumber, setUnitNumber] = useState<string>(currentUnit?.unitNumber || '');
  const [floor, setFloor] = useState<string | number>(currentUnit?.floor || 1);
  const [basePrice, setBasePrice] = useState<number>(Math.max(200, currentUnit?.basePrice || 220));
  const [cleaningFee, setCleaningFee] = useState<number>(currentUnit?.cleaningFee || 80);
  const [capacity, setCapacity] = useState<number>(currentUnit?.capacity || 2);
  const [priceError, setPriceError] = useState<string>('');
  const [whatsappError, setWhatsappError] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Bed configuration state
  const [bedTypes, setBedTypes] = useState<BedConfig[]>(
    currentUnit?.bedTypes || [{ type: 'Cama Casal Queen', quantity: 1 }]
  );

  // Sync state when selected unit changes
  useEffect(() => {
    if (currentUnit) {
      setOwnerName(currentUnit.ownerName || '');
      setOwnerWhatsapp(currentUnit.whatsapp || currentUnit.ownerPhone || '');
      setOwnerEmail(currentUnit.ownerEmail || '');
      setUnitNumber(currentUnit.unitNumber || '');
      setFloor(currentUnit.floor || 1);
      setBasePrice(Math.max(200, currentUnit.basePrice || 220));
      setCleaningFee(currentUnit.cleaningFee || 80);
      setCapacity(currentUnit.capacity || 2);
      setBedTypes(currentUnit.bedTypes && currentUnit.bedTypes.length > 0
        ? currentUnit.bedTypes
        : [{ type: 'Cama Casal Queen', quantity: 1 }]);
      setPriceError('');
      setWhatsappError('');
      setSaveSuccessMsg('');
    }
  }, [currentUnit?.id]);

  // Modal State for Registering a New Unit
  const [isNewUnitModalOpen, setIsNewUnitModalOpen] = useState(false);
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerWhatsapp, setNewOwnerWhatsapp] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newUnitNumber, setNewUnitNumber] = useState('');
  const [newFloor, setNewFloor] = useState<string | number>('');
  const [newBasePrice, setNewBasePrice] = useState<number>(220);
  const [newCleaningFee, setNewCleaningFee] = useState<number>(80);
  const [newCapacity, setNewCapacity] = useState<number>(2);
  const [newBedTypes, setNewBedTypes] = useState<BedConfig[]>([
    { type: 'Cama Casal Queen', quantity: 1 }
  ]);
  const [newEnableImmediately, setNewEnableImmediately] = useState<boolean>(true);
  const [newPriceError, setNewPriceError] = useState<string>('');
  const [newWhatsappError, setNewWhatsappError] = useState<string>('');

  // Request browser device notification permission
  const handleEnableNotifications = async () => {
    const res = await requestDeviceNotificationPermission();
    setNotifPermission(res);
    if (res === 'granted') {
      sendDeviceNotification({
        title: '🔔 Notificações Ativadas com Sucesso!',
        body: `Você receberá alertas imediatos neste aparelho quando a portaria acionar o Apto ${currentUnit?.unitNumber}.`,
        tag: 'setup-test',
      });
      playChime('accepted');
    }
  };

  const handleTestDeviceNotification = () => {
    sendDeviceNotification({
      title: `🚨 Teste de Chamado: Apto ${currentUnit?.unitNumber}`,
      body: 'Toque de alerta e notificação imediata funcionando perfeitamente no seu dispositivo!',
      tag: 'device-test',
    });
    playChime('incoming_call');
  };

  // Check if there is an active incoming call directed specifically to this host unit!
  const isTargetOfActiveCall = 
    activeRequest && 
    activeRequest.status === 'waiting_host' && 
    activeRequest.assignedUnitId === currentUnit?.id;

  // Audio alarm when target of active call
  useEffect(() => {
    if (isTargetOfActiveCall) {
      playChime('incoming_call');
    }
  }, [isTargetOfActiveCall]);

  // Countdown timer for incoming call
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  useEffect(() => {
    if (!isTargetOfActiveCall || !activeRequest) return;

    const tick = () => {
      const now = Date.now();
      const expires = new Date(activeRequest.expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));
      setSecondsRemaining(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isTargetOfActiveCall, activeRequest?.expiresAt]);

  const activeQueueUnits = units
    .filter(u => u.isEligibleByAdmin && u.isAvailableByHost)
    .sort((a, b) => a.queuePosition - b.queuePosition);

  const myPositionInQueue = currentUnit?.isAvailableByHost 
    ? activeQueueUnits.findIndex(u => u.id === currentUnit.id) + 1
    : null;

  // Bed configuration helpers
  const handleBedQuantityChange = (type: BedConfig['type'], quantity: number) => {
    let updated: BedConfig[];
    if (quantity <= 0) {
      updated = bedTypes.filter(b => b.type !== type);
    } else {
      const exists = bedTypes.some(b => b.type === type);
      if (exists) {
        updated = bedTypes.map(b => b.type === type ? { ...b, quantity } : b);
      } else {
        updated = [...bedTypes, { type, quantity }];
      }
    }
    if (updated.length === 0) {
      updated = [{ type: 'Cama Casal Queen', quantity: 1 }];
    }
    setBedTypes(updated);
  };

  const handleNewBedQuantityChange = (type: BedConfig['type'], quantity: number) => {
    let updated: BedConfig[];
    if (quantity <= 0) {
      updated = newBedTypes.filter(b => b.type !== type);
    } else {
      const exists = newBedTypes.some(b => b.type === type);
      if (exists) {
        updated = newBedTypes.map(b => b.type === type ? { ...b, quantity } : b);
      } else {
        updated = [...newBedTypes, { type, quantity }];
      }
    }
    if (updated.length === 0) {
      updated = [{ type: 'Cama Casal Queen', quantity: 1 }];
    }
    setNewBedTypes(updated);
  };

  const calculateTotalBeds = (beds: BedConfig[]): number => {
    return beds.reduce((sum, b) => sum + b.quantity, 0);
  };

  const generateBedSummary = (beds: BedConfig[]): string => {
    return beds.map(b => `${b.quantity} ${b.type.replace('Cama ', '')}`).join(' + ');
  };

  // Save changes to current unit (including responsible person, floor and WhatsApp!)
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUnit) return;

    // Validate price: diárias apenas a partir de R$ 200,00
    if (Number(basePrice) < 200) {
      setPriceError('O regulamento condominial estipula que a diária mínima é de R$ 200,00 + taxa de limpeza.');
      return;
    }
    setPriceError('');

    // Validate WhatsApp
    if (!ownerWhatsapp.trim()) {
      setWhatsappError('O número de WhatsApp do responsável é obrigatório para notificações da portaria.');
      return;
    }
    if (!isValidWhatsApp(ownerWhatsapp)) {
      setWhatsappError('Por favor, digite um número de WhatsApp válido com DDD (ex: (11) 98765-4321).');
      return;
    }
    setWhatsappError('');

    const bedsCount = calculateTotalBeds(bedTypes);
    const bedSummary = generateBedSummary(bedTypes);

    const updatedUnit: Unit = {
      ...currentUnit,
      unitNumber: unitNumber.trim() || currentUnit.unitNumber,
      block: 'Torre Única',
      floor: Number(floor) || 1,
      ownerName: ownerName.trim() || currentUnit.ownerName,
      ownerPhone: ownerWhatsapp.trim(),
      whatsapp: ownerWhatsapp.trim(),
      ownerEmail: ownerEmail.trim(),
      roomsCount: 1, // Todos os imóveis do complexo possuem exatamente 1 quarto
      typology: '1 Quarto',
      basePrice: Number(basePrice),
      cleaningFee: Number(cleaningFee),
      capacity: Number(capacity),
      bedsCount,
      bedTypes,
      bedSummary,
    };

    onUpdateUnit(updatedUnit);
    setSaveSuccessMsg(`Dados do responsável e da unidade Apto ${updatedUnit.unitNumber} (${updatedUnit.floor}º Andar) atualizados com sucesso!`);
    playChime('accepted');

    setTimeout(() => {
      setSaveSuccessMsg('');
    }, 5000);
  };

  // Submit new unit registration
  const handleRegisterNewUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newOwnerName.trim()) {
      alert('Por favor, informe o nome do responsável pela unidade.');
      return;
    }

    if (!newUnitNumber.trim()) {
      alert('Por favor, informe o número da unidade / apartamento (ex: 304).');
      return;
    }

    if (!newOwnerWhatsapp.trim()) {
      setNewWhatsappError('O WhatsApp de contato é obrigatório.');
      return;
    }

    if (!isValidWhatsApp(newOwnerWhatsapp)) {
      setNewWhatsappError('Digite um número de WhatsApp válido com DDD (ex: (11) 98765-4321).');
      return;
    }
    setNewWhatsappError('');

    if (Number(newBasePrice) < 200) {
      setNewPriceError('A diária mínima é de R$ 200,00 conforme regulamento.');
      return;
    }
    setNewPriceError('');

    const bedsCount = calculateTotalBeds(newBedTypes);
    const bedSummary = generateBedSummary(newBedTypes);

    const cleanUnitNumber = newUnitNumber.trim();
    const isFinal3 = cleanUnitNumber.endsWith('03') || cleanUnitNumber.endsWith('3');
    const area = isFinal3 ? 35 : 33;

    const newUnitId = `unit-${cleanUnitNumber}`;
    const newUnit: Unit = {
      id: newUnitId,
      unitNumber: cleanUnitNumber,
      block: 'Torre Única',
      floor: Number(newFloor) || 1,
      area,
      roomsCount: 1,
      typology: '1 Quarto',
      managementType: 'anfitriao',
      managementRoleTitle: 'Anfitrião (Proprietário)',
      bedsCount,
      bedTypes: newBedTypes,
      bedSummary,
      capacity: Number(newCapacity) || 2,
      basePrice: Number(newBasePrice),
      cleaningFee: Number(newCleaningFee),
      ownerName: newOwnerName.trim(),
      ownerEmail: newOwnerEmail.trim() || `${newOwnerName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      ownerPhone: newOwnerWhatsapp.trim(),
      whatsapp: newOwnerWhatsapp.trim(),
      isEligibleByAdmin: true,
      isAvailableByHost: newEnableImmediately,
      queuePosition: newEnableImmediately ? 1 : 9999,
      totalBookingsCompleted: 0,
      totalCallsReceived: 0,
      totalRejections: 0,
      totalTimeouts: 0,
      amenities: ['Wi-Fi 500Mbps', 'Ar Condicionado', 'Smart TV', 'Cozinha Completa', 'Garagem Coberta'],
      houseRules: ['Não fumante', 'Silêncio após 22h', 'Proibido festas'],
      photoUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    };

    if (onRegisterUnit) {
      onRegisterUnit(newUnit);
    } else {
      onUpdateUnit(newUnit);
    }

    setIsNewUnitModalOpen(false);
    // Reset form fields
    setNewOwnerName('');
    setNewOwnerWhatsapp('');
    setNewOwnerEmail('');
    setNewUnitNumber('');
    setNewFloor('');
    setNewBasePrice(220);
    setNewCleaningFee(80);

    alert(`Unidade Apto ${newUnit.unitNumber} (${newUnit.floor}º Andar - Torre Única) cadastrada com sucesso pelo responsável ${newUnit.ownerName}! WhatsApp: ${newUnit.whatsapp}`);
  };

  const handleConfirmReject = () => {
    if (!activeRequest || !currentUnit) return;
    const finalReason = selectedRejectReason === 'Outro' && customRejectReason 
      ? customRejectReason 
      : selectedRejectReason;
    
    onHostReject(activeRequest.id, currentUnit.id, finalReason);
    setRejectReasonModalOpen(false);
  };

  // WhatsApp quick url for current unit
  const currentWhatsAppUrl = getWhatsAppDirectUrl(
    currentUnit?.whatsapp || currentUnit?.ownerPhone || '',
    getOfficialHostNotificationMessage(currentUnit?.unitNumber || '', 'Torre Única', currentUnit?.ownerName || '')
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      {/* Top Bar: Unit Switcher, Responsible Person, WhatsApp & Quick Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl flex-shrink-0 border border-amber-500/30">
            <KeyRound className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Portal do Proprietário</span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-amber-300 border border-slate-700">
                🏢 Crystal Place • {currentUnit?.floor}º Andar
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                1 Quarto Padrão
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-emerald-400" />
                WhatsApp Conectado
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs text-slate-400 font-semibold mr-1">Minhas Unidades:</span>
              <button
                onClick={() => setCurrentHostUnitId('unit-1609')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  currentHostUnitId === 'unit-1609'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 font-black'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/50 hover:text-white'
                }`}
                title="Acessar Apto 1609 como Proprietário / Anfitrião"
              >
                <span>Apto 1609</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/25 font-normal">16º Andar • 33m² • Proprietário</span>
              </button>

              <button
                onClick={() => setCurrentHostUnitId('unit-1701')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  currentHostUnitId === 'unit-1701'
                    ? 'bg-blue-500 text-white border-blue-400 shadow-md shadow-blue-500/20 font-black'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-blue-500/50 hover:text-white'
                }`}
                title="Acessar Apto 1701 como Co-Anfitrião / Administrador"
              >
                <span>Apto 1701</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/25 font-normal">17º Andar • 33m² • Co-Anfitrião</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-3">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white">
                  Apartamento {currentUnit?.unitNumber}
                </h2>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {currentUnit?.floor}º Andar
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                  currentUnit?.area === 35 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  📐 {currentUnit?.area || (currentUnit?.unitNumber?.endsWith('03') ? 35 : 33)}m² {currentUnit?.area === 35 ? '(Final 3)' : ''}
                </span>
                {currentUnit?.managementType === 'co_anfitriao' ? (
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                    Co-Anfitrião (Administrador)
                  </span>
                ) : currentUnit?.ownerName ? (
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    Anfitrião (Proprietário)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-slate-800/80 text-slate-400 border border-slate-700">
                    Aguardando Credenciamento
                  </span>
                )}
              </div>

              {/* Unit Dropdown Switcher with all 25 floors */}
              <select
                value={currentHostUnitId}
                onChange={(e) => setCurrentHostUnitId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                title="Trocar de Unidade para Gerenciar"
              >
                {units.map(u => (
                  <option key={u.id} value={u.id}>
                    Apto {u.unitNumber} ({u.floor}º Andar • {u.area}m²) {u.ownerName ? `• ${u.managementRoleTitle || (u.managementType === 'co_anfitriao' ? 'Co-Anfitrião' : 'Proprietário')}: ${u.ownerName}` : '• Sem anfitrião credenciado'}
                  </option>
                ))}
              </select>

              {/* Button to Register a New Unit */}
              <button
                onClick={() => setIsNewUnitModalOpen(true)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Cadastrar Minha Unidade</span>
              </button>
            </div>

            {/* Responsible Person & WhatsApp Contact Details */}
            <div className="text-xs text-slate-400 mt-2 flex flex-wrap items-center gap-3">
              {currentUnit?.ownerName ? (
                <>
                  <div className="flex items-center gap-1.5 text-slate-200">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {currentUnit?.managementType === 'co_anfitriao' ? 'Administrador / Co-Anfitrião' : 'Responsável / Proprietário'}: 
                      <strong className="text-white font-semibold ml-1">{currentUnit.managerName || currentUnit.ownerName}</strong>
                    </span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5 text-emerald-300 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp: {currentUnit.whatsapp || currentUnit.ownerPhone}</span>
                    {currentWhatsAppUrl && (
                      <a
                        href={currentWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Testar conversa no WhatsApp com o responsável"
                        className="ml-1 text-emerald-400 hover:text-emerald-200 hover:underline flex items-center gap-0.5 text-[10px]"
                      >
                        <span>Testar</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-400 italic">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sem anfitrião credenciado para esta unidade.</span>
                </div>
              )}
              <span>•</span>
              <span className="text-amber-400 font-medium">🛏️ {currentUnit?.bedSummary || `${currentUnit?.bedsCount || 1} Cama`}</span>
              <span>•</span>
              <span className="text-slate-300 font-medium">R$ {currentUnit?.basePrice}/dia + R$ {currentUnit?.cleaningFee} limpeza</span>
            </div>
          </div>
        </div>

        {/* Real-Time Availability Switch */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 flex-shrink-0">
          <div>
            <div className="text-xs text-slate-400 font-medium">Disponibilidade Balcão Hoje</div>
            <div className="text-sm font-bold mt-0.5 flex items-center gap-2">
              {currentUnit?.isAvailableByHost ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400">HABILITADO NO RODÍZIO</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                  <span className="text-slate-400">INATIVO (NÃO RECEBE HÓSPEDES)</span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => onToggleAvailability(currentUnit.id, !currentUnit.isAvailableByHost)}
            disabled={!currentUnit?.isEligibleByAdmin}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              currentUnit?.isAvailableByHost
                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
            } ${!currentUnit?.isEligibleByAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {currentUnit?.isAvailableByHost ? (
              <>
                <ToggleRight className="w-5 h-5 text-rose-400" />
                <span>Pausar Minha Disponibilidade</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5 text-slate-950" />
                <span>Habilitar para Balcão Agora</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 🔔 REAL-TIME DEVICE NOTIFICATION & WHATSAPP STATUS BANNER 🔔 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            notifPermission === 'granted' 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Canais de Notificação Imediata do Responsável</span>
              {notifPermission === 'granted' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Push Ativo
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Push Pendente
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-emerald-400" />
                WhatsApp {currentUnit?.whatsapp || currentUnit?.ownerPhone}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Receba notificação push imediata, toque sonoro e avisos no WhatsApp cadastrado assim que um hóspede de balcão for alocado para sua unidade.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {currentWhatsAppUrl && (
            <a
              href={currentWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-white font-semibold text-xs rounded-xl border border-emerald-500/30 transition-colors flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Testar Alerta no WhatsApp</span>
            </a>
          )}

          {notifPermission !== 'granted' ? (
            <button
              onClick={handleEnableNotifications}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Bell className="w-4 h-4" />
              <span>Ativar Alertas no Aparelho</span>
            </button>
          ) : (
            <button
              onClick={handleTestDeviceNotification}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Testar Som do Chamado</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Block Notice if applicable */}
      {!currentUnit?.isEligibleByAdmin && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 text-xs text-rose-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <div>
            <strong>Unidade Bloqueada pelo Síndico/Administração:</strong> {currentUnit?.ineligibleReason || 'Pendência cadastral ou condominial'}. 
            Regularize com a administração para retornar à fila rotativa.
          </div>
        </div>
      )}

      {/* 🚨 LIVE DISPATCHER INCOMING CALL ALERT (URGENT CARD) 🚨 */}
      {isTargetOfActiveCall && activeRequest && (
        <div className="bg-gradient-to-r from-amber-500/20 via-amber-600/30 to-amber-500/20 border-2 border-amber-400 rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-pulse-subtle overflow-hidden">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-amber-500/30">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-lg animate-bounce">
                <Bell className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded-md border border-amber-500/30">
                  Chamada da Portaria • É A SUA VEZ!
                </span>
                <h3 className="text-2xl font-black text-white mt-1">
                  Novo Hóspede de Balcão Aguardando Resposta
                </h3>
              </div>
            </div>

            {/* Countdown Ring */}
            <div className="flex items-center gap-3 bg-slate-950/90 px-5 py-3 rounded-2xl border border-amber-500/40">
              <Clock className="w-6 h-6 text-amber-400" />
              <div>
                <span className="text-[11px] text-slate-400 block uppercase font-bold">Tempo para Responder</span>
                <span className="font-mono text-2xl font-extrabold text-amber-400">
                  {Math.floor(secondsRemaining / 60)}:{(secondsRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Guest Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 my-6 bg-slate-950/80 p-5 rounded-2xl border border-amber-500/20 text-sm">
            <div>
              <span className="text-slate-400 text-xs block">Nome do Hóspede</span>
              <strong className="text-white text-base">{activeRequest.guestName}</strong>
              <span className="text-slate-500 text-xs block">{activeRequest.guestDocument} • Tel: {activeRequest.guestPhone}</span>
            </div>
            <div>
              <span className="text-slate-400 text-xs block">Ocupantes & Período</span>
              <strong className="text-white text-base">
                {activeRequest.guestsCount} pessoa(s) • {activeRequest.nightsCount} noite(s)
              </strong>
              <span className="text-slate-400 text-xs block">
                {activeRequest.petFriendly ? '🐾 Com animal de estimação' : 'Sem animais'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-xs block">Acomodação</span>
              <strong className="text-amber-300 text-sm block">1 Quarto (Torre Única)</strong>
              <span className="text-slate-400 text-xs">{currentUnit?.bedSummary}</span>
            </div>
            <div>
              <span className="text-slate-400 text-xs block">Rendimento Estimado</span>
              <strong className="text-emerald-400 text-xl font-extrabold">
                R$ {activeRequest.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
              <span className="text-slate-500 text-[10px] block">
                (R$ {currentUnit?.basePrice}/dia x {activeRequest.nightsCount}d + R$ {currentUnit?.cleaningFee} limpeza)
              </span>
            </div>
          </div>

          {/* WhatsApp Alert Notice */}
          <div className="bg-slate-950/90 rounded-2xl p-4 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-6">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <span className="text-emerald-300 font-bold block">Notificação Direcionada ao Responsável</span>
                <span className="text-slate-300">
                  Responsável: <strong>{currentUnit?.ownerName}</strong> • WhatsApp: <strong>{currentUnit?.whatsapp || currentUnit?.ownerPhone}</strong> (Apto {currentUnit?.unitNumber} - {currentUnit?.floor}º Andar)
                </span>
              </div>
            </div>
            {currentWhatsAppUrl && (
              <a
                href={getWhatsAppDirectUrl(
                  currentUnit?.whatsapp || currentUnit?.ownerPhone || '',
                  `Olá ${currentUnit?.ownerName}! Novo hóspede de balcão ${activeRequest.guestName} (${activeRequest.guestsCount} pessoas, ${activeRequest.nightsCount} noites) alocado para o Apto ${currentUnit?.unitNumber} (${currentUnit?.floor}º Andar). Responda em até 5 minutos no painel!`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold rounded-xl border border-emerald-500/30 flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>Abrir Mensagem no WhatsApp</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Explanation of the Round Robin Rule */}
          <div className="text-xs text-amber-200/90 mb-6 flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>
              Ao <strong>Aceitar</strong>, a reserva é concretizada e sua unidade irá para o final da fila de rodízio. 
              Ao <strong>Recusar</strong> ou se o tempo esgotar, a vez é repassada imediatamente para o próximo anfitrião.
            </span>
          </div>

          {/* Decision Buttons with Optional Justification Field */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Justificativa da Resposta / Observação para a Portaria (Opcional):</span>
                <span className="text-[11px] text-slate-500 font-normal">Não obrigatório</span>
              </label>
              <input
                type="text"
                value={customRejectReason}
                onChange={(e) => setCustomRejectReason(e.target.value)}
                placeholder="Ex: Apartamento preparado e higienizado com chave pronta / ou motivo se for recusar..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => onHostAccept(activeRequest.id, currentUnit.id)}
                className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-500/20 text-base flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>ACEITAR HOSPEDAGEM (CONCRETIZAR)</span>
              </button>
              <button
                onClick={() => {
                  if (customRejectReason.trim()) {
                    onHostReject(activeRequest.id, currentUnit.id, customRejectReason.trim());
                  } else {
                    setRejectReasonModalOpen(true);
                  }
                }}
                className="py-4 px-6 bg-slate-950 hover:bg-slate-900 text-rose-400 border border-rose-500/30 hover:border-rose-500 font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>RECUSAR HOSPEDAGEM</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab('queue')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'queue'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Status na Fila Virtual</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Cadastro da Unidade & WhatsApp</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Histórico & Métricas</span>
        </button>
      </div>

      {/* TAB 1: QUEUE STATUS */}
      {activeTab === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Position Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Posição no Rodízio de Balcão
            </span>
            <div className="flex items-baseline gap-2">
              {currentUnit?.isAvailableByHost && myPositionInQueue ? (
                <>
                  <span className="text-5xl font-black text-amber-400">#{myPositionInQueue}</span>
                  <span className="text-sm text-slate-400 font-medium">
                    de {activeQueueUnits.length} anfitriões ativos
                  </span>
                </>
              ) : (
                <span className="text-xl font-bold text-slate-500">Fora da Fila (Inativo)</span>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {myPositionInQueue === 1
                ? `🌟 Você é o 1º da fila! Quando o próximo hóspede de balcão chegar na portaria, seu WhatsApp (${currentUnit?.whatsapp || currentUnit?.ownerPhone}) e aparelho serão notificados imediatamente.`
                : currentUnit?.isAvailableByHost
                ? `Há ${myPositionInQueue ? myPositionInQueue - 1 : 0} anfitrião(ões) antes de você. A fila avança conforme os hóspedes de balcão chegam.`
                : 'Para receber hóspedes de balcão e começar a faturar, ative o botão de disponibilidade acima.'}
            </p>

            <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Locações Concluídas</span>
                <strong className="text-white text-base">{currentUnit?.totalBookingsCompleted}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Chamadas Recebidas</span>
                <strong className="text-white text-base">{currentUnit?.totalCallsReceived}</strong>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>Canal WhatsApp:</span>
              <strong className="text-emerald-400">{currentUnit?.whatsapp || currentUnit?.ownerPhone}</strong>
            </div>
          </div>

          {/* Current Live Queue Preview */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Ordem Atual da Fila Rotativa ({activeQueueUnits.length} Unidades Prontas)
              </h3>
              <span className="text-xs text-slate-400">Distribuição Auditada</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {activeQueueUnits.slice(0, 12).map((unit, idx) => {
                const isMe = unit.id === currentUnit.id;
                return (
                  <div
                    key={unit.id}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                      isMe
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        idx === 0 
                          ? 'bg-amber-500 text-slate-950' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-white text-sm">Apto {unit.unitNumber}</strong> 
                          <span className="text-amber-400 font-medium">({unit.floor}º Andar)</span>
                          {isMe && <span className="font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded text-[10px]">(Sua Unidade)</span>}
                        </div>
                        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                          <span>Responsável: <strong className="text-slate-300">{unit.ownerName}</strong></span>
                          <span>•</span>
                          <span className="text-emerald-400 font-medium">WA: {unit.whatsapp || unit.ownerPhone}</span>
                          <span>•</span>
                          <span>1 Quarto ({unit.bedSummary})</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold">R$ {unit.basePrice}/dia</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-slate-400 text-[11px] block">
                        {idx === 0 ? '🔥 Próximo da vez' : `${idx} na frente`}
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        {unit.totalBookingsCompleted} locações
                      </span>
                    </div>
                  </div>
                );
              })}
              {activeQueueUnits.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Nenhum anfitrião ativo na fila neste momento. Seja o primeiro ativando sua unidade!
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: UNIT & RESPONSIBLE REGISTRATION + WHATSAPP CONTACT + ANDAR LIVRE + DIÁRIA (>= R$ 200) + CAMAS */}
      {activeTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl max-w-4xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                Cadastro da Unidade & Forma de Contato (WhatsApp)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Cadastre e atualize a titularidade do responsável, número do WhatsApp para notificações da portaria, 
                andar da unidade (campo livre), valores de diária (mínimo de R$ 200,00) e camas do Apto <strong>{currentUnit?.unitNumber}</strong>.
              </p>
            </div>

            <button
              onClick={() => setIsNewUnitModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 self-start sm:self-center flex-shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cadastrar Outra Unidade</span>
            </button>
          </div>

          {saveSuccessMsg && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-300">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6">
            
            {/* SEÇÃO 1: RESPONSÁVEL & FORMA DE CONTATO (WHATSAPP) */}
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>1. Dados do Responsável & Forma de Contato (WhatsApp)</span>
                </div>
                <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                  Obrigatório para Chamadas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome do Responsável */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome Completo do Responsável *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ex: Wellington Rodovalho"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Proprietário ou procurador cadastrado na administração.
                  </span>
                </div>

                {/* Forma de Contato (WhatsApp) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Forma de Contato: WhatsApp *
                    </span>
                    {isValidWhatsApp(ownerWhatsapp) && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <Check className="w-3 h-3" /> Válido
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="(11) 98765-4321"
                      value={ownerWhatsapp}
                      onChange={(e) => {
                        const formatted = formatWhatsApp(e.target.value);
                        setOwnerWhatsapp(formatted);
                        if (!isValidWhatsApp(formatted)) {
                          setWhatsappError('Insira o DDD e número completo (ex: (11) 98765-4321)');
                        } else {
                          setWhatsappError('');
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  {whatsappError ? (
                    <span className="text-xs text-rose-400 mt-1 block">{whatsappError}</span>
                  ) : (
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Recebe notificações automáticas e alertas imediatos de balcão.
                    </span>
                  )}
                </div>

                {/* E-mail do Responsável */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    E-mail do Responsável
                  </label>
                  <input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Para recibos de repasses e demonstrativos do rodízio.
                  </span>
                </div>

                {/* Test WhatsApp Link Button */}
                <div className="flex flex-col justify-end">
                  <a
                    href={getWhatsAppDirectUrl(
                      ownerWhatsapp,
                      getOfficialHostNotificationMessage(unitNumber || currentUnit?.unitNumber, 'Torre Única', ownerName)
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      isValidWhatsApp(ownerWhatsapp)
                        ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-900 text-slate-600 border border-slate-800 pointer-events-none'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>💬 Testar Envio de Mensagem no WhatsApp</span>
                    <ExternalLink className="w-3 h-3 text-emerald-400" />
                  </a>
                  <span className="text-[11px] text-slate-500 mt-1 block text-center">
                    Abre a janela do WhatsApp Web ou aplicativo oficial para teste.
                  </span>
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: IDENTIFICAÇÃO DA UNIDADE (TORRE ÚNICA & ANDAR LIVRE) */}
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Building className="w-4 h-4 text-amber-400" />
                  <span>2. Identificação da Unidade (Torre Única & Andar Livre)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    🏢 Torre Única
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300">
                    Tipologia: 1 Quarto
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Número do Apartamento */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Número do Apartamento *
                  </label>
                  <input
                    type="text"
                    required
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 font-mono font-bold"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Ex: 304, 702, 1205</span>
                </div>

                {/* Andar - CAMPO LIVRE DIGITÁVEL PELO ANFITRIÃO */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Andar da Unidade *</span>
                    <span className="text-amber-400 text-[10px] font-normal">Campo Livre</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="Ex: 5, 12, 18, 26..."
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 font-mono font-bold"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Digite livremente o andar do seu apartamento.
                  </span>
                </div>

                {/* Torre - Condomínio de Torre Única */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Torre do Empreendimento
                  </label>
                  <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-300 text-sm font-semibold flex items-center gap-2">
                    <Building className="w-4 h-4 text-amber-400" />
                    <span>Torre Única (Crystal Place Residence)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    O Crystal Place Residence possui torre única.
                  </span>
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: DIÁRIA DE BALCÃO (MÍNIMO R$ 200,00) E TAXA DE LIMPEZA */}
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  <span>3. Valores de Diária & Taxa de Limpeza</span>
                </div>
                <span className="text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-semibold">
                  Mínimo R$ 200,00 Obrigatório
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Diária de Balcão (R$) * <span className="text-amber-400 font-bold">(Mínimo R$ 200,00)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 text-sm">R$</span>
                    <input
                      type="number"
                      min={200}
                      max={3000}
                      step={5}
                      required
                      value={basePrice}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setBasePrice(val);
                        if (val < 200) {
                          setPriceError('A diária deve ser de no mínimo R$ 200,00 conforme regulamento.');
                        } else {
                          setPriceError('');
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 font-bold"
                    />
                  </div>
                  {priceError ? (
                    <span className="text-xs text-rose-400 mt-1 block">{priceError}</span>
                  ) : (
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Piso mínimo estipulado pelo condomínio: R$ 200,00 por pernoite.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Taxa Única de Limpeza (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 text-sm">R$</span>
                    <input
                      type="number"
                      min={0}
                      max={500}
                      step={10}
                      value={cleaningFee}
                      onChange={(e) => setCleaningFee(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 font-bold"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Cobrada uma única vez por estadia do hóspede.
                  </span>
                </div>
              </div>
            </div>

            {/* SEÇÃO 4: CONFIGURAÇÃO DE CAMAS (1 QUARTO) */}
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Bed className="w-4 h-4 text-amber-400" />
                    <span>4. Número de Camas e Tipos (1 Quarto)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Defina com precisão a disposição de camas para apresentação no balcão da portaria.
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total de Camas</span>
                  <span className="text-lg font-black text-amber-400">
                    {calculateTotalBeds(bedTypes)} cama(s)
                  </span>
                </div>
              </div>

              {/* Bed Types Selector Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AVAILABLE_BED_TYPES.map(type => {
                  const currentConfig = bedTypes.find(b => b.type === type);
                  const qty = currentConfig ? currentConfig.quantity : 0;

                  return (
                    <div
                      key={type}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                        qty > 0
                          ? 'bg-amber-500/10 border-amber-500/40 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs text-white">{type}</div>
                        <div className="text-[11px] text-slate-500">
                          {type.includes('Casal') || type.includes('Queen') ? 'Até 2 pessoas' : '1 pessoa'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleBedQuantityChange(type, Math.max(0, qty - 1))}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center transition-colors"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-mono font-bold text-xs text-white">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleBedQuantityChange(type, qty + 1)}
                          className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Capacity Selector & Bed Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Capacidade Máxima Recomendada
                  </label>
                  <select
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} pessoa(s)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Resumo Gerado para o Balcão
                  </label>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-xs text-amber-400 font-bold flex items-center h-[42px]">
                    1 Quarto • {generateBedSummary(bedTypes)}
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="submit"
                className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-xl shadow-amber-500/20 flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                <span>Salvar Cadastro da Unidade & WhatsApp</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: HISTORY & METRICS */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">
                Rendimento e Histórico do Apto {currentUnit?.unitNumber} ({currentUnit?.floor}º Andar - Torre Única)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Responsável cadastrado: <strong className="text-slate-200">{currentUnit?.ownerName}</strong> • WhatsApp: <strong className="text-emerald-400">{currentUnit?.whatsapp || currentUnit?.ownerPhone}</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Locações Concretizadas</span>
              <span className="text-2xl font-black text-emerald-400">{currentUnit?.totalBookingsCompleted}</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Total de Chamadas</span>
              <span className="text-2xl font-black text-white">{currentUnit?.totalCallsReceived}</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Recusas por Perfil</span>
              <span className="text-2xl font-black text-rose-400">{currentUnit?.totalRejections}</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Timeouts (Sem resposta em 5m)</span>
              <span className="text-2xl font-black text-amber-400">{currentUnit?.totalTimeouts}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400">
            <strong className="text-slate-200 block mb-1">Princípio da Rotatividade:</strong>
            Sempre que uma locação é aceita por você, o sistema registra a operação e posiciona seu apartamento no final da fila. 
            Isso garante oportunidade igual para todos os anfitriões e co-anfitriões credenciados que participam do pool de balcão do Crystal Place Residence (App PROXIMO).
          </div>
        </div>
      )}

      {/* 🚀 MODAL: CADASTRAR NOVA UNIDADE (TORRE ÚNICA & ANDAR LIVRE) 🚀 */}
      {isNewUnitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-8">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Cadastrar Nova Unidade & Responsável
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cadastre seu apartamento no Crystal Place Residence (Torre Única) para participar do rodízio PROXIMO.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewUnitModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterNewUnitSubmit} className="space-y-5">
              
              {/* Titular e Contato */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  1. Responsável & WhatsApp de Contato
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nome Completo do Responsável *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Eduardo Silva"
                      value={newOwnerName}
                      onChange={(e) => setNewOwnerName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        Forma de Contato (WhatsApp) *
                      </span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="(11) 98765-4321"
                      value={newOwnerWhatsapp}
                      onChange={(e) => {
                        const formatted = formatWhatsApp(e.target.value);
                        setNewOwnerWhatsapp(formatted);
                        if (!isValidWhatsApp(formatted)) {
                          setNewWhatsappError('Insira DDD e número (ex: (11) 98765-4321)');
                        } else {
                          setNewWhatsappError('');
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    {newWhatsappError && (
                      <span className="text-[11px] text-rose-400 mt-0.5 block">{newWhatsappError}</span>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      E-mail do Responsável
                    </label>
                    <input
                      type="email"
                      placeholder="responsavel@email.com"
                      value={newOwnerEmail}
                      onChange={(e) => setNewOwnerEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Dados do Imóvel: Torre Única & Andar Livre */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    2. Localização da Unidade
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      🏢 Torre Única
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                      1 Quarto
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Apto / Número da Unidade *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 804, 1502, 2201"
                      value={newUnitNumber}
                      onChange={(e) => setNewUnitNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Identificação da porta</span>
                  </div>

                  {/* ANDAR LIVRE DIGITÁVEL */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                      <span>Andar *</span>
                      <span className="text-amber-400 text-[10px] font-normal">Campo Livre</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      placeholder="Ex: 5, 8, 14, 22..."
                      value={newFloor}
                      onChange={(e) => setNewFloor(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Digite o andar da sua unidade</span>
                  </div>
                </div>
              </div>

              {/* Valores & Camas */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  3. Diária de Balcão & Distribuição de Camas
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Diária de Balcão * (Mínimo R$ 200)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-slate-500 text-xs">R$</span>
                      <input
                        type="number"
                        min={200}
                        required
                        value={newBasePrice}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setNewBasePrice(val);
                          if (val < 200) {
                            setNewPriceError('Diária mínima de R$ 200,00 obrigatória.');
                          } else {
                            setNewPriceError('');
                          }
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    {newPriceError && <span className="text-[11px] text-rose-400 block mt-0.5">{newPriceError}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Taxa de Limpeza (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-slate-500 text-xs">R$</span>
                      <input
                        type="number"
                        min={0}
                        value={newCleaningFee}
                        onChange={(e) => setNewCleaningFee(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Camas */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Configuração de Camas (1 Quarto):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {AVAILABLE_BED_TYPES.map(type => {
                      const currentConfig = newBedTypes.find(b => b.type === type);
                      const qty = currentConfig ? currentConfig.quantity : 0;
                      return (
                        <div key={type} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-slate-300">{type}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleNewBedQuantityChange(type, Math.max(0, qty - 1))}
                              className="w-5 h-5 rounded bg-slate-800 text-white font-bold flex items-center justify-center text-xs"
                            >
                              -
                            </button>
                            <span className="w-4 text-center font-mono font-bold text-white text-xs">{qty}</span>
                            <button
                              type="button"
                              onClick={() => handleNewBedQuantityChange(type, qty + 1)}
                              className="w-5 h-5 rounded bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Immediate Availability Checkbox */}
                <label className="flex items-center gap-2.5 pt-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={newEnableImmediately}
                    onChange={(e) => setNewEnableImmediately(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700"
                  />
                  <span>Habilitar para balcão imediatamente (já entrar na fila virtual de rodízio)</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewUnitModalOpen(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20"
                >
                  Confirmar Cadastro da Unidade
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectReasonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-400" />
              Recusar Hospedagem de Balcão
            </h3>
            <p className="text-xs text-slate-400">
              Informe o motivo da recusa. A vez será repassada imediatamente para o próximo anfitrião da fila de espera.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Motivo da recusa / Justificativa:</span>
                  <span className="text-[10px] text-slate-500 font-normal">Não obrigatório</span>
                </label>
                <input
                  type="text"
                  placeholder="Justificativa rápida (opcional)..."
                  value={customRejectReason}
                  onChange={(e) => setCustomRejectReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="text-[11px] text-slate-400 font-semibold pt-1">
                Ou selecione uma opção rápida:
              </div>

              {[
                'Ocupado de última hora / Uso próprio',
                'Unidade em manutenção emergencial',
                'Perfil do hóspede incompatível com as regras',
                'Divergência de valores ou noites',
              ].map(reason => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                    selectedRejectReason === reason
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    value={reason}
                    checked={selectedRejectReason === reason}
                    onChange={(e) => setSelectedRejectReason(e.target.value)}
                    className="text-amber-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3 pt-3">
              <button
                onClick={() => setRejectReasonModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-700"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl text-xs"
              >
                Confirmar Recusa e Passar a Vez
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
