import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Users, 
  Calendar, 
  Home, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Phone, 
  CreditCard, 
  MapPin, 
  Dog, 
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Download,
  Share2,
  Bed,
  Check,
  Bell,
  Smartphone,
  Ticket
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Unit, GuestRequest, SystemConfig, UnitTypology } from '../types';
import { generateQrDataUrl } from '../utils/qr';

interface GuestTotemProps {
  units: Unit[];
  activeRequest: GuestRequest | null;
  onSubmitRequest: (formData: {
    guestName: string;
    guestDocument: string;
    guestPhone: string;
    guestsCount: number;
    nightsCount: number;
    typologyPreferred: UnitTypology | 'Qualquer';
    petFriendly: boolean;
  }) => void;
  onCancelRequest: (requestId: string) => void;
  onSimulateTimeout: (requestId: string) => void;
  onSimulateAccept: (requestId: string) => void;
  onSimulateReject: (requestId: string) => void;
  config: SystemConfig;
}

export const GuestTotem: React.FC<GuestTotemProps> = ({
  units,
  activeRequest,
  onSubmitRequest,
  onCancelRequest,
  onSimulateTimeout,
  onSimulateAccept,
  onSimulateReject,
  config,
}) => {
  // Form State
  const [guestName, setGuestName] = useState('');
  const [guestDocument, setGuestDocument] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestsCount, setGuestsCount] = useState<number>(2);
  const [nightsCount, setNightsCount] = useState<number>(2);
  const [bedPreference, setBedPreference] = useState<string>('Qualquer');
  const [petFriendly, setPetFriendly] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Countdown timer state
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);

  // Generate QR for accepted voucher
  useEffect(() => {
    if (activeRequest && (activeRequest.status === 'accepted' || activeRequest.status === 'checked_in')) {
      generateQrDataUrl(`ROTATIVO302:${activeRequest.voucherCode}:${activeRequest.assignedUnitNumber}`)
        .then(setQrDataUrl);
      
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [activeRequest?.status, activeRequest?.voucherCode, activeRequest?.assignedUnitNumber]);

  // Countdown clock effect for waiting_host
  useEffect(() => {
    if (!activeRequest || activeRequest.status !== 'waiting_host') return;

    const updateTimer = () => {
      const now = Date.now();
      const expires = new Date(activeRequest.expiresAt).getTime();
      const diffSec = Math.max(0, Math.floor((expires - now) / 1000));
      setTimeLeftSeconds(diffSec);

      if (diffSec <= 0 && activeRequest.status === 'waiting_host') {
        // Automatically trigger timeout transition
        onSimulateTimeout(activeRequest.id);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeRequest?.expiresAt, activeRequest?.status, activeRequest?.id, onSimulateTimeout]);

  // Available units stats
  const eligibleUnits = units.filter(u => u.isEligibleByAdmin && u.isAvailableByHost);
  const minPrice = eligibleUnits.length > 0 
    ? Math.max(200, Math.min(...eligibleUnits.map(u => u.basePrice)))
    : 200;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestDocument.trim() || !guestPhone.trim()) {
      alert('Por favor, preencha seu nome, documento e telefone.');
      return;
    }

    onSubmitRequest({
      guestName,
      guestDocument,
      guestPhone,
      guestsCount,
      nightsCount,
      typologyPreferred: '1 Quarto',
      petFriendly,
    });
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 1. ACCEPTED OR CHECKED IN STATE
  if (activeRequest && (activeRequest.status === 'accepted' || activeRequest.status === 'checked_in')) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Status Badge */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Hospedagem Confirmada
                </span>
                <h2 className="text-2xl font-bold text-white">
                  Reserva Concretizada!
                </h2>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Voucher Oficial</span>
              <span className="font-mono text-lg font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                {activeRequest.voucherCode}
              </span>
            </div>
          </div>

          {/* Unit & Booking Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Unidade Alocada (1 Quarto)</span>
                  <div className="text-3xl font-extrabold text-white mt-1">
                    Apartamento {activeRequest.assignedUnitNumber}
                  </div>
                  <div className="text-sm text-slate-300 font-medium">
                    {activeRequest.assignedUnitBlock} • Crystal Place Residence
                  </div>
                  {activeRequest.assignedUnitBedSummary && (
                    <div className="text-xs text-amber-400 mt-1 flex items-center gap-1 font-semibold">
                      <Bed className="w-3.5 h-3.5" />
                      <span>{activeRequest.assignedUnitBedSummary}</span>
                    </div>
                  )}
                </div>
                <div className="px-3 py-1.5 bg-slate-800 text-amber-400 rounded-xl text-xs font-semibold border border-slate-700">
                  Fila Rotativa Imparcial
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80 text-sm">
                <div>
                  <span className="text-slate-500 text-xs block">Titular da Reserva</span>
                  <strong className="text-slate-200">{activeRequest.guestName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Documento (CPF/Passaporte)</span>
                  <strong className="text-slate-200">{activeRequest.guestDocument}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Ocupantes & Estadia</span>
                  <strong className="text-slate-200">
                    {activeRequest.guestsCount} pessoa(s) • {activeRequest.nightsCount} noite(s)
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Valor Total Balcão</span>
                  <strong className="text-emerald-400 text-base">
                    R$ {activeRequest.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              {activeRequest.assignedHostName && (
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-amber-400" />
                    <span>Responsável pela Unidade: <strong className="text-slate-200">{activeRequest.assignedHostName}</strong></span>
                  </div>
                  <div className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    WhatsApp: {activeRequest.assignedHostWhatsapp || activeRequest.assignedHostPhone}
                  </div>
                </div>
              )}
            </div>

            {/* Reception Validation QR */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-semibold text-slate-400 mb-2">Apresente na Recepção</span>
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="QR Code Voucher" 
                  className="w-36 h-36 rounded-xl bg-white p-2 shadow-inner"
                />
              ) : (
                <div className="w-36 h-36 bg-slate-900 rounded-xl flex items-center justify-center text-slate-600">
                  <QrCode className="w-12 h-12" />
                </div>
              )}
              <span className="text-[11px] text-slate-400 mt-3 font-mono">
                Chave: {activeRequest.voucherCode}
              </span>
            </div>
          </div>

          {/* Next Steps Instructions for Blindagem */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 mb-8">
            <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4" />
              Instruções de Acesso na Portaria (Regra 100% Imparcial)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dirija-se ao balcão da recepção agora. Apresente seu documento original com foto e este voucher na tela. 
              O atendente da portaria validará sua identidade e entregará a chave/cartão de acesso cadastrado para o <strong>Apto {activeRequest.assignedUnitNumber} (1 Quarto)</strong>. 
              A portaria não tem autoridade para alterar sua unidade alocada.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.print()}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Imprimir / Salvar Voucher
            </button>
            <button
              onClick={() => onCancelRequest(activeRequest.id)}
              className="py-3 px-6 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-sm font-semibold transition-colors"
            >
              Novo Atendimento
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. WAITING FOR HOST / RADAR SEARCH STATE + CONFIRMATION CARD & ESTIMATED WAIT TIME
  if (activeRequest && activeRequest.status === 'waiting_host') {
    const currentAttempt = activeRequest.callAttempts[activeRequest.callAttempts.length - 1];
    const totalPossibleSeconds = config.timeoutMinutes * 60;
    const progressPercent = Math.max(0, Math.min(100, (timeLeftSeconds / totalPossibleSeconds) * 100));

    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        
        {/* Confirmation of Queue Entry Card */}
        <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Solicitação Registrada com Sucesso via QR Code
                </span>
                <h3 className="text-lg font-bold text-white">
                  Comprovante de Entrada na Fila Virtual
                </h3>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Voucher</span>
              <span className="font-mono text-base font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                {activeRequest.voucherCode}
              </span>
            </div>
          </div>

          {/* Real-time Estimated Wait Time Callout */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block font-medium">Tempo Estimado de Espera</span>
              <div className="text-xl font-black text-amber-400 mt-1 flex items-center justify-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Até 5 minutos</span>
              </div>
              <span className="text-[10px] text-slate-500">Resposta da unidade da vez</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block font-medium">Notificação Enviada</span>
              <div className="text-base font-bold text-emerald-400 mt-1 flex items-center justify-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                <span>No Aparelho do Anfitrião</span>
              </div>
              <span className="text-[10px] text-slate-500">Alerta sonoro imediato</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block font-medium">Tipologia Solicitada</span>
              <div className="text-base font-bold text-white mt-1">
                1 Quarto
              </div>
              <span className="text-[10px] text-slate-500">{activeRequest.guestsCount} pessoa(s) • {activeRequest.nightsCount} noite(s)</span>
            </div>
          </div>

          {/* Stepper tracker */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 mb-6">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="flex flex-col items-center">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-xs mb-1">
                  ✓
                </span>
                <span className="font-semibold text-emerald-400 text-[11px]">1. Entrada na Fila</span>
                <span className="text-[10px] text-slate-500">QR Code escaneado</span>
              </div>

              <div className="flex flex-col items-center">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs mb-1 animate-pulse">
                  2
                </span>
                <span className="font-semibold text-amber-300 text-[11px]">2. Chamada do Anfitrião</span>
                <span className="text-[10px] text-slate-400 font-mono">{formatSeconds(timeLeftSeconds)}</span>
              </div>

              <div className="flex flex-col items-center opacity-50">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 font-bold flex items-center justify-center text-xs mb-1">
                  3
                </span>
                <span className="font-semibold text-slate-400 text-[11px]">3. Retirada de Chave</span>
                <span className="text-[10px] text-slate-600">Balcão da portaria</span>
              </div>
            </div>
          </div>

          {/* Target Unit & Live Radar Bar */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Tentativa #{activeRequest.callAttempts.length} da Fila</span>
              <span className="text-amber-400 font-mono">Tempo restante: {formatSeconds(timeLeftSeconds)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-white">
                  Apto {currentAttempt ? currentAttempt.unitNumber : activeRequest.assignedUnitNumber} (1 Quarto)
                </div>
                <div className="text-xs text-slate-400">
                  {currentAttempt ? currentAttempt.block : activeRequest.assignedUnitBlock} • Anfitrião: {currentAttempt?.ownerName || activeRequest.assignedHostName}
                  {activeRequest.assignedUnitBedSummary && ` • 🛏️ ${activeRequest.assignedUnitBedSummary}`}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Estadia Total</span>
                <span className="text-base font-bold text-emerald-400">
                  R$ {activeRequest.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Reassurance Note */}
          <div className="text-xs text-slate-400 bg-slate-800/40 p-3.5 rounded-xl border border-slate-800 mt-4 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Garantia de Não Favorecimento:</strong> O anfitrião tem 5 minutos para aceitar. Se não responder ou recusar, 
              o sistema repassa sua solicitação imediatamente para a próxima unidade da fila rotativa.
            </span>
          </div>

          {/* Quick Simulation Tools for Demo & Testing */}
          <div className="pt-4 mt-4 border-t border-slate-800/80">
            <div className="text-xs text-slate-500 font-semibold mb-2 uppercase tracking-wider text-center">
              Controles de Teste / Demonstração Rápida
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => onSimulateAccept(activeRequest.id)}
                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/30 transition-colors"
              >
                Simular Anfitrião Aceitando
              </button>
              <button
                onClick={() => onSimulateReject(activeRequest.id)}
                className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-semibold rounded-lg border border-rose-500/30 transition-colors"
              >
                Simular Recusa (Pula para Próximo)
              </button>
              <button
                onClick={() => onSimulateTimeout(activeRequest.id)}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-semibold rounded-lg border border-amber-500/30 transition-colors"
              >
                Simular Esgotamento 5 min
              </button>
              <button
                onClick={() => onCancelRequest(activeRequest.id)}
                className="px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-slate-200 text-xs rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // 3. REJECTED / ALL UNITS BUSY STATE
  if (activeRequest && activeRequest.status === 'rejected') {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Nenhuma Unidade Disponível no Momento
          </h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Todos os anfitriões cadastrados foram consultados através da fila rotativa e estão ocupados ou indisponíveis no momento.
          </p>
          <div className="bg-slate-950 p-4 rounded-xl text-left border border-slate-800 text-xs text-slate-400 mb-6 space-y-1">
            <div className="font-semibold text-slate-300">Histórico de tentativas da fila:</div>
            {activeRequest.callAttempts.map((attempt, idx) => (
              <div key={idx} className="flex justify-between py-1 border-b border-slate-900 last:border-0">
                <span>Unidade {attempt.unitNumber} ({attempt.block})</span>
                <span className="text-rose-400 font-mono">
                  {attempt.outcome === 'timeout' ? 'Tempo expirado (5m)' : attempt.rejectionReason || 'Recusado'}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => onCancelRequest(activeRequest.id)}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // 4. DEFAULT SCREEN: GUEST WALK-IN REQUEST FORM
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero Card */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Totem Virtual de Balcão • Acesso Direto
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Aluguel Imediato de Balcão
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Sistema 100% autônomo e auditado do <strong>Crystal Place Residence</strong> (App <strong>PROXIMO</strong>). Todas as unidades possuem <strong>1 Quarto</strong> completo em Torre Única. 
          Sua solicitação é encaminhada automaticamente com notificação imediata no aparelho do próximo anfitrião.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Form */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Step 1: Guest Personal Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                1. Dados do Hóspede Titular
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Carlos da Silva"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    CPF ou Passaporte *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={guestDocument}
                    onChange={(e) => setGuestDocument(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    WhatsApp / Celular com DDD *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(11) 98765-4321"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Stay Parameters */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                2. Parâmetros da Hospedagem (Todos 1 Quarto)
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Número de Pessoas
                  </label>
                  <select
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'pessoa' : 'pessoas'}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Número de Noites
                  </label>
                  <select
                    value={nightsCount}
                    onChange={(e) => setNightsCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {[1, 2, 3, 4, 5, 7, 10, 15, 30].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'diária (hoje)' : 'diárias'}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Standard 1-Bedroom Layout Info & Bed Preference */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>Preferência de Distribuição de Camas (1 Quarto)</span>
                  <span className="text-[11px] text-amber-400 font-normal">Crystal Place • 1 Quarto</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    'Qualquer Configuração',
                    'Cama Queen',
                    'Cama + Sofá-Cama',
                    'Camas de Solteiro',
                  ].map((pref) => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => setBedPreference(pref)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center flex items-center justify-center gap-1.5 ${
                        bedPreference === pref
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <Bed className="w-3.5 h-3.5" />
                      <span>{pref}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pet Friendly */}
              <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={petFriendly}
                  onChange={(e) => setPetFriendly(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700"
                />
                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <Dog className="w-4 h-4 text-amber-400" />
                  <span>Estou viajando com animal de estimação (Pet Friendly)</span>
                </div>
              </label>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>ENTRAR NA FILA E NOTIFICAR 1º ANFITRIÃO</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

          </form>
        </div>

        {/* Sidebar Info & Trust Guarantees */}
        <div className="space-y-6">
          
          {/* Transparency Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              Garantia de Imparcialidade
            </div>
            <h4 className="text-base font-bold text-white">
              Como funciona o Rodízio Crystal Place?
            </h4>
            <ul className="text-xs text-slate-400 space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">1</span>
                <span>O sistema consulta a fila virtual dos anfitriões com disponibilidade imediata.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">2</span>
                <span>O 1º da fila recebe <strong>notificação imediata em seu aparelho</strong> com som de chamada e tem até 5 minutos para responder.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">3</span>
                <span>Se aceitar, a unidade é alocada e vai para o final da fila. Se recusar ou não responder em 5 min, a vez passa automaticamente para o próximo.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">4</span>
                <span>A portaria apenas valida seu documento e entrega a chave. Decisão 100% neutra.</span>
              </li>
            </ul>
          </div>

          {/* Pricing Estimation Pill (Minimum R$ 200) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <span className="text-xs text-slate-400 block mb-1">Diárias Balcão a partir de</span>
            <div className="text-2xl font-black text-amber-400">
              R$ {minPrice.toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ noite + limpeza</span>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              {eligibleUnits.length} anfitriões com disponibilidade imediata aguardando na fila hoje.
            </div>
          </div>

          {/* Complex Location */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <strong className="text-slate-300 block">Crystal Place Residence</strong>
              Recepção Central • 24 Horas • Torre Única • 1 Quarto
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
