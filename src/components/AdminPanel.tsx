import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Settings, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Download, 
  RotateCcw, 
  BarChart3, 
  Users, 
  TrendingUp, 
  Hash, 
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Shield,
  Layers,
  MessageSquare,
  UserCheck,
  Mail,
  Phone,
  KeyRound,
  Send,
  Trash2
} from 'lucide-react';
import { Unit, AuditLog, GuestRequest, SystemConfig, UnitBlock } from '../types';
import { getWhatsAppDirectUrl } from '../utils/whatsapp';
import { AccessAccount } from '../utils/auth';

interface AdminPanelProps {
  units: Unit[];
  auditLogs: AuditLog[];
  requests: GuestRequest[];
  config: SystemConfig;
  onToggleUnitAdminEligibility: (unitId: string, isEligible: boolean, reason?: string) => void;
  onUpdateConfig: (config: SystemConfig) => void;
  onResetSystemData: () => void;
  accessAccounts?: AccessAccount[];
  onApproveAccount?: (accountId: string) => void;
  onRejectAccount?: (accountId: string) => void;
  onOpenManual?: () => void;
  onEditUnit?: (unit: Unit) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  units,
  auditLogs,
  requests,
  config,
  onToggleUnitAdminEligibility,
  onUpdateConfig,
  onResetSystemData,
  accessAccounts = [],
  onApproveAccount,
  onRejectAccount,
  onOpenManual,
  onEditUnit,
}) => {
  const [activeTab, setActiveTab] = useState<'units' | 'queue' | 'accounts' | 'audit' | 'metrics' | 'settings'>('units');
  const [searchUnit, setSearchUnit] = useState('');
  const [filterBlock, setFilterBlock] = useState<string>('all');
  const [filterFloor, setFilterFloor] = useState<string>('all');
  const [filterManagement, setFilterManagement] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active_queue' | 'inactive_host' | 'blocked_admin'>('all');
  const [filterAccountStatus, setFilterAccountStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Deactivation modal state
  const [deactivatingUnit, setDeactivatingUnit] = useState<Unit | null>(null);
  const [deactivateReason, setDeactivateReason] = useState('Inadimplência de taxa condominial');

  // Search in audit logs
  const [auditSearch, setAuditSearch] = useState('');

  // Units calculations
  const totalUnits = units.length;
  const eligibleByAdminUnits = units.filter(u => u.isEligibleByAdmin);
  const activeInQueueUnits = units
    .filter(u => u.isEligibleByAdmin && u.isAvailableByHost)
    .sort((a, b) => a.queuePosition - b.queuePosition);
  const blockedByAdminCount = totalUnits - eligibleByAdminUnits.length;
  const totalBookingsCompleted = units.reduce((acc, u) => acc + u.totalBookingsCompleted, 0);

  // Filtered units
  const filteredUnits = units.filter(u => {
    const matchesSearch = 
      u.unitNumber.includes(searchUnit) ||
      u.ownerName.toLowerCase().includes(searchUnit.toLowerCase()) ||
      u.block.toLowerCase().includes(searchUnit.toLowerCase());

    if (!matchesSearch) return false;

    if (filterBlock !== 'all' && u.block !== filterBlock) return false;
    if (filterFloor !== 'all' && String(u.floor) !== filterFloor) return false;
    if (filterManagement === 'anfitriao' && u.managementType !== 'anfitriao') return false;
    if (filterManagement === 'co_anfitriao' && u.managementType !== 'co_anfitriao') return false;
    if (filterManagement === 'pending' && u.ownerName) return false;

    if (filterStatus === 'active_queue' && (!u.isEligibleByAdmin || !u.isAvailableByHost)) return false;
    if (filterStatus === 'inactive_host' && (!u.isEligibleByAdmin || u.isAvailableByHost)) return false;
    if (filterStatus === 'blocked_admin' && u.isEligibleByAdmin) return false;

    return true;
  });

  // Filtered audit logs
  const filteredAuditLogs = auditLogs.filter(log => 
    log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.eventType.toLowerCase().includes(auditSearch.toLowerCase()) ||
    (log.voucherCode && log.voucherCode.toLowerCase().includes(auditSearch.toLowerCase())) ||
    (log.unitNumber && log.unitNumber.includes(auditSearch))
  );

  const handleConfirmDeactivate = () => {
    if (!deactivatingUnit) return;
    onToggleUnitAdminEligibility(deactivatingUnit.id, false, deactivateReason);
    setDeactivatingUnit(null);
  };

  const exportAuditCsv = () => {
    const headers = ['ID', 'Data/Hora', 'Evento', 'Ator', 'Unidade', 'Voucher', 'Detalhes', 'Hash Integridade'];
    const rows = auditLogs.map(l => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.eventType}"`,
      `"${l.actor}"`,
      `"${l.unitNumber || '-'}"`,
      `"${l.voucherCode || '-'}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.hash}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_crystal_place_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            Painel da Administração Condominial
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Gestão e Auditoria • Crystal Place Residence
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Monitore as unidades organizadas em 25 andares (13 unidades por andar), com gestão por Anfitrião ou Co-Anfitrião (Administrador), 
            ative ou inative condôminos no rodízio e consulte a auditoria para integridade total.
          </p>
          {onOpenManual && (
            <div className="mt-3">
              <button
                onClick={onOpenManual}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Manual de Instruções em PDF (Todos os Níveis)</span>
              </button>
            </div>
          )}
        </div>

        {/* Global Stats Grid - 312 Unidades (2º ao 25º Andar) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Estrutura</span>
            <span className="text-lg font-black text-white">312 Unidades</span>
            <span className="text-[10px] text-amber-400 block font-medium">2º ao 25º Andar (13/andar)</span>
          </div>
          <div className="text-center px-2 border-l border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Fila Hoje</span>
            <span className="text-lg font-black text-emerald-400">{activeInQueueUnits.length} ativos</span>
            <span className="text-[10px] text-slate-500 block font-medium">No pool rotativo</span>
          </div>
          <div className="text-center px-2 border-l border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Bloqueados</span>
            <span className="text-lg font-black text-rose-400">{blockedByAdminCount}</span>
            <span className="text-[10px] text-slate-500 block font-medium">Restrição admin</span>
          </div>
          <div className="text-center px-2 border-l border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Locações</span>
            <span className="text-lg font-black text-amber-400">{totalBookingsCompleted}</span>
            <span className="text-[10px] text-slate-500 block font-medium">Concluídas</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2 sm:gap-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('units')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'units'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Gestão das Unidades</span>
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'queue'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Fila Virtual do Rodízio ({activeInQueueUnits.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('accounts')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'accounts'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Validação de Acessos</span>
          {accessAccounts.filter(a => a.status === 'pending').length > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500 text-slate-950 animate-pulse">
              {accessAccounts.filter(a => a.status === 'pending').length} pendente(s)
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'audit'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Trilha de Auditoria Imutável</span>
        </button>

        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'metrics'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Métricas de Equidade</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'settings'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Regras do Sistema</span>
        </button>
      </div>

      {/* TAB 1: 302 UNITS ROSTER & ACTIVATION */}
      {activeTab === 'units' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar apto ou condômino..."
                  value={searchUnit}
                  onChange={(e) => setSearchUnit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Complex Badge */}
              <div className="bg-slate-950 border border-slate-800 text-amber-300 font-semibold text-xs rounded-xl px-3 py-2 flex items-center gap-1.5 flex-shrink-0">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Crystal Place</span>
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
              >
                <option value="all">Todos os Status</option>
                <option value="active_queue">Ativos na Fila Hoje</option>
                <option value="inactive_host">Pausados pelo Anfitrião</option>
                <option value="blocked_admin">Bloqueados pelo Síndico</option>
              </select>

              {/* Floor Filter (24 Andares: 2º ao 25º) */}
              <select
                value={filterFloor}
                onChange={(e) => setFilterFloor(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
              >
                <option value="all">Todos os Andares (2º ao 25º)</option>
                {Array.from({ length: 24 }, (_, i) => i + 2).map(f => (
                  <option key={f} value={String(f)}>
                    {f}º Andar {f === 16 ? '(Apto 1609 - Wellington)' : f === 17 ? '(Apto 1701 - Wellington)' : ''}
                  </option>
                ))}
              </select>

              {/* Management Type Filter */}
              <select
                value={filterManagement}
                onChange={(e) => setFilterManagement(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
              >
                <option value="all">Todas as Gestões</option>
                <option value="anfitriao">Anfitrião (Proprietário)</option>
                <option value="co_anfitriao">Co-Anfitrião (Administrador)</option>
                <option value="pending">Aguardando Credenciamento</option>
              </select>
            </div>

            <div className="text-xs text-slate-400 flex items-center">
              Mostrando <strong className="text-white mx-1">{filteredUnits.length}</strong> unidades filtradas
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-[580px] overflow-y-auto pr-1">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4">Unidade</th>
                  <th className="py-3 px-4">Andar & Metragem</th>
                  <th className="py-3 px-4">Tipologia</th>
                  <th className="py-3 px-4">Gestão & Contato</th>
                  <th className="py-3 px-4">Disponibilidade Balcão</th>
                  <th className="py-3 px-4">Posição Fila</th>
                  <th className="py-3 px-4">Locações</th>
                  <th className="py-3 px-4 text-right">Permissão do Síndico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUnits.map((unit) => {
                  const isInQueue = unit.isEligibleByAdmin && unit.isAvailableByHost;
                  const isFinal3 = unit.unitNumber.endsWith('03') || unit.unitNumber.endsWith('3') || unit.area === 35;
                  const unitArea = unit.area || (isFinal3 ? 35 : 33);
                  return (
                    <tr key={unit.id} className="hover:bg-slate-800/30 transition-colors">
                      
                      <td className="py-3 px-4">
                        <strong className="text-white font-mono text-sm">Apto {unit.unitNumber}</strong>
                        <span className="text-slate-500 text-[10px] block">Torre Única</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-white font-mono font-bold text-xs">{unit.floor}º Andar</span>
                        <div className="mt-0.5">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            isFinal3 
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {unitArea}m² {isFinal3 ? '• Final 3' : ''}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-white">{unit.typology}</span>
                        <span className="text-amber-400 text-[10px] block font-mono">🛏️ {unit.bedSummary || `${unit.bedsCount} cama(s)`}</span>
                        <span className="text-slate-500 text-[10px] block">Cap: {unit.capacity}p • R$ {unit.basePrice}/dia</span>
                      </td>

                      <td className="py-3 px-4">
                        {unit.ownerName ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <strong className="text-slate-200 block">{unit.managerName || unit.ownerName}</strong>
                              {unit.managementType === 'co_anfitriao' ? (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                                  Co-Anfitrião (Admin)
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                  Anfitrião (Proprietário)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-slate-400 text-[10px]">{unit.whatsapp || unit.ownerPhone}</span>
                              {(unit.whatsapp || unit.ownerPhone) && (
                                <a
                                  href={getWhatsAppDirectUrl(
                                    unit.whatsapp || unit.ownerPhone,
                                    `Olá ${unit.managerName || unit.ownerName}! Contato da administração do Crystal Place Residence (App PROXIMO) referente ao Apto ${unit.unitNumber} (${unit.floor}º Andar).`
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-0.5 text-[9px] bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20"
                                  title="Abrir conversa no WhatsApp"
                                >
                                  <MessageSquare className="w-2.5 h-2.5" />
                                  <span>WA</span>
                                </a>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-500 italic text-xs">
                            Sem anfitrião credenciado
                          </span>
                        )}
                      </td>

                      {/* Host availability */}
                      <td className="py-3 px-4">
                        {unit.isAvailableByHost ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Disponível Hoje
                          </span>
                        ) : !unit.ownerName ? (
                          <span className="text-slate-600 text-[11px]">
                            Aguardando credenciamento
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">
                            Inativo pelo anfitrião
                          </span>
                        )}
                      </td>

                      {/* Queue position */}
                      <td className="py-3 px-4">
                        {isInQueue ? (
                          <span className="font-mono font-bold text-amber-400">
                            #{unit.queuePosition}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Bookings */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white">{unit.totalBookingsCompleted}</span>
                      </td>

                      {/* Admin Toggle & Edit */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {onEditUnit && (
                          <button
                            onClick={() => onEditUnit(unit)}
                            className="mr-1.5 px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg text-[11px] font-semibold border border-amber-500/30 transition-colors"
                            title="Editar cadastro da unidade e WhatsApp"
                          >
                            Editar
                          </button>
                        )}
                        {unit.isEligibleByAdmin ? (
                          <button
                            onClick={() => setDeactivatingUnit(unit)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-lg text-[11px] font-semibold border border-slate-700 hover:border-rose-500/30 transition-colors"
                          >
                            Habilitado (Bloquear)
                          </button>
                        ) : (
                          <button
                            onClick={() => onToggleUnitAdminEligibility(unit.id, true)}
                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-emerald-500/20 text-rose-400 hover:text-emerald-400 rounded-lg text-[11px] font-semibold border border-rose-500/20 hover:border-emerald-500/30 transition-colors"
                            title={unit.ineligibleReason}
                          >
                            Bloqueado (Ativar)
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: VIRTUAL QUEUE INSPECTOR */}
      {activeTab === 'queue' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Fila Virtual Rotativa em Tempo Real
              </h3>
              <p className="text-xs text-slate-400">
                Ordem exata e imutável em que os anfitriões serão chamados para os próximos hóspedes de balcão.
              </p>
            </div>
            <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-semibold border border-emerald-500/20 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{activeInQueueUnits.length} Anfitriões em Espera</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeInQueueUnits.map((unit, idx) => (
              <div
                key={unit.id}
                className={`p-4 rounded-2xl border transition-all ${
                  idx === 0
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                    idx === 0 
                      ? 'bg-amber-500 text-slate-950' 
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {idx === 0 ? '🔥 #1 DA VEZ' : `#${idx + 1} na Fila`}
                  </span>
                  <span className="text-xs text-slate-500">{unit.block}</span>
                </div>

                <div className="text-lg font-black text-white">
                  Apartamento {unit.unitNumber}
                </div>
                <div className="text-xs text-slate-400 mb-3">
                  1 Quarto • 🛏️ {unit.bedSummary} • {unit.managementType === 'co_anfitriao' ? `Co-Anfitrião: ${unit.managerName || unit.ownerName}` : `Anfitrião: ${unit.ownerName}`}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Diária Balcão:</span>
                  <strong className="text-emerald-400">R$ {unit.basePrice}</strong>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                  <span>Locações concluídas:</span>
                  <strong className="text-white">{unit.totalBookingsCompleted}</strong>
                </div>
              </div>
            ))}

            {activeInQueueUnits.length === 0 && (
              <div className="col-span-3 text-center py-12 text-slate-500 text-sm">
                Nenhum anfitrião ativo na fila neste momento. Habilite unidades no painel do anfitrião ou na lista geral.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TRILHA DE AUDITORIA IMUTÁVEL (BLINDAGEM) */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  Registro de Auditoria Imutável (Anti-Favorecimento)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Integridade Criptográfica
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Todas as chegadas de hóspedes, acionamentos de anfitriões, timeouts de 5 minutos e entregas de chaves são carimbadas com hash encadeado.
              </p>
            </div>

            <button
              onClick={exportAuditCsv}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors self-start sm:self-auto"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Exportar Relatório (CSV)</span>
            </button>
          </div>

          {/* Audit Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Filtrar eventos por voucher, apto ou texto..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Log Stream */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredAuditLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-colors text-xs space-y-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString('pt-BR')} • {new Date(log.timestamp).toLocaleDateString('pt-BR')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.actor === 'Portaria'
                        ? 'bg-blue-500/20 text-blue-400'
                        : log.actor === 'Anfitrião'
                        ? 'bg-amber-500/20 text-amber-400'
                        : log.actor === 'Hóspede'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {log.actor}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      [{log.eventType}]
                    </span>
                  </div>

                  <span className="font-mono text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    Hash: {log.hash.slice(0, 16)}...
                  </span>
                </div>

                <div className="text-slate-200 font-medium leading-relaxed">
                  {log.details}
                </div>

                {log.voucherCode && (
                  <div className="text-[11px] text-amber-400 font-mono">
                    Voucher: {log.voucherCode} {log.unitNumber && `• Apto ${log.unitNumber}`}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 4: FAIRNESS METRICS */}
      {activeTab === 'metrics' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            Índices de Equidade e Não-Favorecimento
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 block">Índice de Distribuição Equitativa</span>
              <div className="text-3xl font-black text-emerald-400">98.4%</div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Todas as unidades participantes recebem turnos estritamente balanceados pela fila rotativa.
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 block">Tempo Médio de Resposta dos Anfitriões</span>
              <div className="text-3xl font-black text-amber-400">1m 45s</div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Dentro do limite tolerado de 5 minutos antes da rotação automática.
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 block">Taxa de Concretização de Balcão</span>
              <div className="text-3xl font-black text-blue-400">89.2%</div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Hóspedes que chegam na recepção e concluem a estadia sem atrito.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SYSTEM RULES & SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl max-w-2xl space-y-6">
          <h3 className="text-lg font-bold text-white">Configurações Gerais do Rodízio PROXIMO • Crystal Place Residence</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Tempo Limite para o Anfitrião Responder (Minutos)
              </label>
              <input
                type="number"
                min="1"
                max="15"
                value={config.timeoutMinutes}
                onChange={(e) => onUpdateConfig({ ...config, timeoutMinutes: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Padrão regulamentar: 5 minutos. Se o anfitrião não responder, o sistema passa para o próximo.
              </span>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">
                Zona de Manutenção e Reset
              </h4>
              <button
                onClick={onResetSystemData}
                className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-xl border border-rose-500/30 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir Toda a Base de Dados e Redefinir Sistema</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ACCOUNTS VALIDATION */}
      {activeTab === 'accounts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <UserCheck className="w-4 h-4" />
                <span>Validação e Liberação de Cadastros</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Controle de Acessos ao Sistema
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                O Administrador/Síndico valida quem tem autorização para gerenciar unidades, operar a portaria ou administrar o sistema.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
              <button
                onClick={() => setFilterAccountStatus('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  filterAccountStatus === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos ({accessAccounts.length})
              </button>
              <button
                onClick={() => setFilterAccountStatus('pending')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  filterAccountStatus === 'pending'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-amber-400 hover:text-white'
                }`}
              >
                <span>Pendentes</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400/20 text-[10px]">
                  {accessAccounts.filter(a => a.status === 'pending').length}
                </span>
              </button>
              <button
                onClick={() => setFilterAccountStatus('approved')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  filterAccountStatus === 'approved'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-emerald-400 hover:text-white'
                }`}
              >
                Aprovados ({accessAccounts.filter(a => a.status === 'approved').length})
              </button>
              <button
                onClick={() => setFilterAccountStatus('rejected')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  filterAccountStatus === 'rejected'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-rose-400 hover:text-white'
                }`}
              >
                Rejeitados ({accessAccounts.filter(a => a.status === 'rejected').length})
              </button>
            </div>
          </div>

          {/* Accounts List */}
          <div className="space-y-3">
            {accessAccounts
              .filter(a => filterAccountStatus === 'all' || a.status === filterAccountStatus)
              .map((acc) => {
                const phoneDigits = acc.phone.replace(/\D/g, '');
                const waUrl = `https://wa.me/55${phoneDigits}?text=${encodeURIComponent(
                  `Olá ${acc.name}! Seu cadastro de acesso ao sistema PROXIMO (Crystal Place Residence) como ${
                    acc.role === 'host' ? `Anfitrião da Unidade ${acc.unitNumber}` : acc.role === 'reception' ? 'Portaria e Balcão 24h' : 'Administração'
                  } foi ${acc.status === 'approved' ? 'VALIDADO E LIBERADO' : 'analisado'} pelo Administrador.`
                )}`;

                return (
                  <div
                    key={acc.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      acc.status === 'pending'
                        ? 'bg-amber-500/5 border-amber-500/30'
                        : acc.status === 'approved'
                          ? 'bg-slate-950 border-slate-800'
                          : 'bg-rose-500/5 border-rose-500/20 opacity-75'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-white">
                          {acc.name}
                        </span>
                        
                        {/* Role badge */}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          acc.role === 'host'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                            : acc.role === 'reception'
                              ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                              : 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                        }`}>
                          {acc.role === 'host' && <KeyRound className="w-3 h-3" />}
                          {acc.role === 'reception' && <Building2 className="w-3 h-3" />}
                          {acc.role === 'admin' && <ShieldCheck className="w-3 h-3" />}
                          <span>
                            {acc.role === 'host' ? `Anfitrião (Apto ${acc.unitNumber || 'Não inf.'})` : acc.role === 'reception' ? 'Portaria & Balcão' : 'Administrador / Síndico'}
                          </span>
                        </span>

                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          acc.status === 'pending'
                            ? 'bg-amber-500 text-slate-950 animate-pulse'
                            : acc.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {acc.status === 'pending' && <Clock className="w-3 h-3" />}
                          {acc.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                          {acc.status === 'rejected' && <XCircle className="w-3 h-3" />}
                          <span>
                            {acc.status === 'pending' ? 'Pendente de Validação' : acc.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                          </span>
                        </span>
                      </div>

                      {/* Contact & Date Details */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span>{acc.email}</span>
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>{acc.phone}</span>
                        </span>
                        {acc.id === 'acc-admin' ? (
                          <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Administrador Master • Acesso Ativo
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            Solicitado em: {new Date(acc.requestedAt).toLocaleString('pt-BR')}
                          </span>
                        )}
                        {acc.approvedBy && acc.id !== 'acc-admin' && (
                          <span className="text-[11px] text-emerald-400">
                            Validado por: {acc.approvedBy}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                      {acc.status === 'pending' && (
                        <>
                          <button
                            onClick={() => onApproveAccount?.(acc.id)}
                            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all hover:scale-105"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Validar & Aprovar</span>
                          </button>
                          <button
                            onClick={() => onRejectAccount?.(acc.id)}
                            className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold rounded-xl text-xs transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Rejeitar</span>
                          </button>
                        </>
                      )}

                      {acc.status === 'approved' && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          title="Enviar confirmação de validação pelo WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Avisar no WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}

            {accessAccounts.filter(a => filterAccountStatus === 'all' || a.status === filterAccountStatus).length === 0 && (
              <div className="text-center py-12 text-slate-500 bg-slate-950 rounded-2xl border border-slate-800/80">
                <UserCheck className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-medium">Nenhum cadastro encontrado neste filtro.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DEACTIVATE REASON MODAL */}
      {deactivatingUnit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Bloquear Unidade {deactivatingUnit.unitNumber} do Rodízio
            </h3>
            <p className="text-xs text-slate-400">
              Selecione o motivo da inativação administrativa para registrar em ata e na trilha de auditoria:
            </p>

            <select
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-amber-500"
            >
              <option value="Inadimplência de taxa condominial">Inadimplência de taxa condominial</option>
              <option value="Obras e reformas em andamento">Obras e reformas em andamento</option>
              <option value="Vistoria técnica predial pendente">Vistoria técnica predial pendente</option>
              <option value="Punição por descumprimento de regras do condomínio">Punição disciplinar (Regras)</option>
              <option value="Solicitação expressa do proprietário">Solicitação expressa do proprietário</option>
            </select>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeactivatingUnit(null)}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeactivate}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl text-xs"
              >
                Confirmar Bloqueio
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
