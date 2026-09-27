import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  MessageSquare, 
  X, 
  ExternalLink, 
  QrCode, 
  KeyRound, 
  Building2, 
  ShieldCheck, 
  Lock,
  Sparkles
} from 'lucide-react';
import { buildPortalUrl } from '../utils/auth';
import { getWhatsAppDirectUrl } from '../utils/whatsapp';

interface ShareLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  complexName: string;
  currentHostUnitNumber?: string;
}

export const ShareLinksModal: React.FC<ShareLinksModalProps> = ({
  isOpen,
  onClose,
  complexName,
  currentHostUnitNumber,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const guestUrl = buildPortalUrl('guest');
  const hostUrl = buildPortalUrl('host', currentHostUnitNumber);
  const receptionUrl = buildPortalUrl('reception');
  const adminUrl = buildPortalUrl('admin');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const getHostShareMessage = () => {
    return `🏢 *${complexName} - Aplicativo PROXIMO*\n\nPrezado(a) Anfitrião(a),\n\nSegue seu link de acesso ao *Portal do Anfitrião* para participar do rodízio autônomo de hóspedes de balcão:\n\n🔗 ${hostUrl}\n\n🔑 *Acesso Restrito:*\nCadastre seu Nome, E-mail, Telefone (WhatsApp) e Unidade. O Administrador valida e libera seu acesso rapidamente!\n\nPor favor, mantenha sua disponibilidade ativa para receber os chamados em tempo real.`;
  };

  const getReceptionShareMessage = () => {
    return `🏢 *${complexName} - Aplicativo PROXIMO*\n\nLink de acesso operacional para a *Portaria & Balcão 24h*:\n\n🔗 ${receptionUrl}\n\n🔑 *Acesso:*\nSolicite ou entre com seu cadastro validado pela administração.`;
  };

  const getAdminShareMessage = () => {
    return `🏢 *${complexName} - Aplicativo PROXIMO*\n\nLink restrito de gestão para o *Síndico e Administração*:\n\n🔗 ${adminUrl}\n\n🔑 *Acesso:*\nPainel de validação e controle administrativo do condomínio.`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Central de Links e Acessos Restritos</h3>
              <p className="text-xs text-slate-400">
                Somente o Totem do Hóspede é público. Envie os links abaixo para cada perfil com login protegido.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links List */}
        <div className="space-y-4">
          
          {/* 1. HOST PORTAL LINK */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                  <KeyRound className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white">Link do Portal do Anfitrião</h4>
                  <span className="text-[11px] text-slate-400">Enviar para os proprietários/anfitriões</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Cadastro Simples • Validação Admin
              </span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
              <span className="truncate flex-1 select-all">{hostUrl}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => copyToClipboard(hostUrl, 'host-url')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
              >
                {copiedKey === 'host-url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'host-url' ? 'Copiado!' : 'Copiar Link'}</span>
              </button>

              <button
                onClick={() => copyToClipboard(getHostShareMessage(), 'host-msg')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
              >
                {copiedKey === 'host-msg' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'host-msg' ? 'Mensagem Copiada!' : 'Copiar Mensagem Formatada'}</span>
              </button>

              <a
                href={getWhatsAppDirectUrl('', getHostShareMessage())}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors ml-auto"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Enviar via WhatsApp</span>
              </a>
            </div>
          </div>

          {/* 2. RECEPTION / BALCÃO LINK */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                  <Building2 className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white">Link da Portaria & Balcão 24h</h4>
                  <span className="text-[11px] text-slate-400">Para os computadores da recepção física</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                Acesso Equipe • Validação Admin
              </span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
              <span className="truncate flex-1 select-all">{receptionUrl}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => copyToClipboard(receptionUrl, 'rec-url')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
              >
                {copiedKey === 'rec-url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'rec-url' ? 'Copiado!' : 'Copiar Link'}</span>
              </button>

              <button
                onClick={() => copyToClipboard(getReceptionShareMessage(), 'rec-msg')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
              >
                {copiedKey === 'rec-msg' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'rec-msg' ? 'Mensagem Copiada!' : 'Copiar Mensagem'}</span>
              </button>
            </div>
          </div>

          {/* 3. ADMIN PANEL LINK */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white">Link da Administração & Síndico</h4>
                  <span className="text-[11px] text-slate-400">Para o corpo diretivo e auditoria</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Acesso Master • Validação
              </span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
              <span className="truncate flex-1 select-all">{adminUrl}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => copyToClipboard(adminUrl, 'admin-url')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
              >
                {copiedKey === 'admin-url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'admin-url' ? 'Copiado!' : 'Copiar Link'}</span>
              </button>

              <button
                onClick={() => copyToClipboard(getAdminShareMessage(), 'admin-msg')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
              >
                {copiedKey === 'admin-msg' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'admin-msg' ? 'Mensagem Copiada!' : 'Copiar Mensagem'}</span>
              </button>
            </div>
          </div>

          {/* 4. PUBLIC TOTEM LINK */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-slate-800 text-amber-400">
                  <QrCode className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-300">Link Público do Totem (Hóspede)</h4>
                  <span className="text-[10px] text-slate-500">Apenas autoatendimento do hóspede sem acesso aos painéis internos</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                100% Público
              </span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-xs font-mono text-slate-400">
              <span className="truncate flex-1">{guestUrl}</span>
              <button
                onClick={() => copyToClipboard(guestUrl, 'guest-url')}
                className="p-1.5 hover:text-white transition-colors"
              >
                {copiedKey === 'guest-url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
