import React, { useState } from 'react';
import { 
  Bell, 
  MessageSquare, 
  Mail, 
  Smartphone, 
  ExternalLink, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  Clock, 
  Edit3, 
  Volume2, 
  Copy, 
  Check, 
  ShieldCheck,
  Send,
  AlertCircle
} from 'lucide-react';
import { GuestRequest, Unit } from '../types';
import { playChime } from '../utils/audio';
import { 
  requestDeviceNotificationPermission, 
  getDeviceNotificationPermission, 
  sendDeviceNotification 
} from '../utils/notifications';
import { 
  getWhatsAppDirectUrl, 
  getReservationHostNotificationMessage, 
  getEmailHostNotification, 
  getSmsHostNotification 
} from '../utils/whatsapp';

interface DispatchNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: GuestRequest | null;
  unit: Unit | null;
  onOpenHostPortal: (unitId: string) => void;
  onOpenEditUnit: (unit: Unit) => void;
}

export const DispatchNotificationModal: React.FC<DispatchNotificationModalProps> = ({
  isOpen,
  onClose,
  request,
  unit,
  onOpenHostPortal,
  onOpenEditUnit,
}) => {
  const [activeChannelTab, setActiveChannelTab] = useState<'whatsapp' | 'email' | 'sms' | 'push'>('whatsapp');
  const [copiedText, setCopiedText] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>(() => getDeviceNotificationPermission());

  if (!isOpen || !request || !unit) return null;

  const targetPhone = unit.whatsapp || unit.ownerPhone || '(62) 99999-1609';
  const targetEmail = unit.ownerEmail || 'wellington.1609@crystalplace.com';
  const targetName = unit.managerName || unit.ownerName || 'Wellington Rodovalho';

  // WhatsApp Message
  const waMessage = getReservationHostNotificationMessage({
    voucherCode: request.voucherCode,
    guestName: request.guestName,
    guestDocument: request.guestDocument,
    guestPhone: request.guestPhone,
    unitNumber: unit.unitNumber,
    floor: unit.floor,
    hostName: targetName,
    guestsCount: request.guestsCount,
    nightsCount: request.nightsCount,
    checkInDate: request.checkInDate,
    checkOutDate: request.checkOutDate,
    totalAmount: request.totalAmount,
  });
  const waUrl = getWhatsAppDirectUrl(targetPhone, waMessage);

  // Email
  const emailData = getEmailHostNotification({
    voucherCode: request.voucherCode,
    guestName: request.guestName,
    unitNumber: unit.unitNumber,
    hostName: targetName,
    hostEmail: targetEmail,
    nightsCount: request.nightsCount,
    totalAmount: request.totalAmount,
  });

  // SMS
  const smsData = getSmsHostNotification({
    voucherCode: request.voucherCode,
    guestName: request.guestName,
    unitNumber: unit.unitNumber,
    nightsCount: request.nightsCount,
    totalAmount: request.totalAmount,
    phone: targetPhone,
  });

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleEnablePush = async () => {
    const res = await requestDeviceNotificationPermission();
    setNotifPermission(res);
    if (res === 'granted') {
      sendDeviceNotification({
        title: `🚨 Chamado de Balcão: Apto ${unit.unitNumber}`,
        body: `É a sua vez no rodízio! Hóspede ${request.guestName} (${request.guestsCount}p, ${request.nightsCount} noites). Responda em até 5 minutos no portal.`,
        tag: `call-${request.voucherCode}`,
      });
      playChime('incoming_call');
    }
  };

  const handleTestSound = () => {
    playChime('incoming_call');
    sendDeviceNotification({
      title: `🚨 Teste de Alarme: Apto ${unit.unitNumber}`,
      body: `Hóspede aguardando no balcão do Crystal Place Residence. Toque de chamada ativo!`,
      tag: 'test-sound',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shadow-inner">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  Notificação Multicanal Disparada
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Voucher {request.voucherCode}</span>
              </div>
              <h3 className="text-xl font-black text-white mt-0.5">
                Chamado Enviado ao Anfitrião do Apto {unit.unitNumber}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Banner */}
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="text-slate-400">Destinatário do Chamado:</div>
            <div className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
              <span>{targetName}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Apto {unit.unitNumber} ({unit.floor}º Andar)
              </span>
            </div>
            <div className="text-slate-400 mt-1 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-emerald-400 font-semibold">WA: {targetPhone}</span>
              <span>•</span>
              <span className="text-blue-400 font-semibold">{targetEmail}</span>
            </div>
          </div>

          {/* Quick Edit if Phone is Wrong */}
          <button
            onClick={() => {
              onClose();
              onOpenEditUnit(unit);
            }}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 transition-all flex items-center gap-1.5 self-start sm:self-center"
            title="Clique para corrigir o número de WhatsApp ou dados da unidade"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editar Meu WhatsApp / Cadastro</span>
          </button>
        </div>

        {/* Explanation: How the host is notified */}
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Como o anfitrião é notificado no Crystal Place?</strong> O sistema opera de forma autônoma e dispara <strong>4 canais simultâneos</strong>: WhatsApp oficial com link de 1 clique, E-mail com resumo formal, SMS de segurança e Alarme sonoro + Push no navegador/celular.
          </div>
        </div>

        {/* Channel Switcher Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveChannelTab('whatsapp')}
            className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
              activeChannelTab === 'whatsapp'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>1. WhatsApp</span>
          </button>

          <button
            onClick={() => setActiveChannelTab('email')}
            className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
              activeChannelTab === 'email'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500 shadow-md'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4 text-blue-400" />
            <span>2. E-mail</span>
          </button>

          <button
            onClick={() => setActiveChannelTab('sms')}
            className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
              activeChannelTab === 'sms'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500 shadow-md'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4 text-purple-400" />
            <span>3. SMS</span>
          </button>

          <button
            onClick={() => setActiveChannelTab('push')}
            className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
              activeChannelTab === 'push'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span>4. Som & Push</span>
          </button>
        </div>

        {/* Tab 1: WhatsApp Channel */}
        {activeChannelTab === 'whatsapp' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Número do WhatsApp Destino:</span>
              <strong className="text-emerald-400 font-mono text-sm">{targetPhone}</strong>
            </div>

            {/* WhatsApp Message Preview Box */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-emerald-500/30 text-xs font-sans text-slate-200 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto font-mono">
              {waMessage}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Abrir Mensagem no WhatsApp Agora</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => handleCopyMessage(waMessage)}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copiedText ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              Ao clicar no botão verde, o WhatsApp Web ou aplicativo abre com o texto 100% preenchido pronto para envio.
            </p>
          </div>
        )}

        {/* Tab 2: Email Channel */}
        {activeChannelTab === 'email' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">E-mail Cadastrado do Responsável:</span>
              <strong className="text-blue-400 font-mono text-sm">{targetEmail}</strong>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-blue-500/30 text-xs text-slate-200 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto">
              <div className="pb-2 mb-2 border-b border-slate-800 text-slate-400 font-mono">
                <strong>Assunto:</strong> {emailData.subject}
              </div>
              {emailData.body}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={emailData.mailtoUrl}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <Mail className="w-4 h-4" />
                <span>Abrir no Seu Programa de E-mail</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => handleCopyMessage(emailData.body)}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copiedText ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: SMS Channel */}
        {activeChannelTab === 'sms' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Telefone / Celular Destino:</span>
              <strong className="text-purple-400 font-mono text-sm">{targetPhone}</strong>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-purple-500/30 text-xs text-slate-200 font-mono leading-relaxed">
              {smsData.text}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={smsData.smsUrl}
                className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <Smartphone className="w-4 h-4" />
                <span>Disparar SMS no Celular</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => handleCopyMessage(smsData.text)}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copiedText ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Push Web & Audio Sound Alarm */}
        {activeChannelTab === 'push' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950 rounded-2xl border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  Notificações no Navegador / Smartphone
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  notifPermission === 'granted'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {notifPermission === 'granted' ? 'Permitido no Aparelho' : 'Pendente de Permissão'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Permita as notificações no navegador para que seu computador ou smartphone toque e exiba banners mesmo com a aba em segundo plano.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {notifPermission !== 'granted' ? (
                <button
                  onClick={handleEnablePush}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  <Bell className="w-4 h-4" />
                  <span>Ativar Notificações no Aparelho</span>
                </button>
              ) : (
                <button
                  onClick={handleTestSound}
                  className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Testar Alarme Sonoro do Chamado</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Prazo de resposta regulamentar: <strong>5 minutos</strong></span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
            >
              Fechar
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenHostPortal(unit.id);
              }}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <span>Responder no Portal do Anfitrião</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
