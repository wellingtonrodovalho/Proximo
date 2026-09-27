import React, { useState } from 'react';
import {
  FileText,
  Download,
  X,
  CheckCircle,
  KeyRound,
  Building2,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Info,
  BookOpen,
  Share2
} from 'lucide-react';
import { generateManualPdf } from '../utils/generateManualPdf';

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  condoName?: string;
}

export const ManualModal: React.FC<ManualModalProps> = ({
  isOpen,
  onClose,
  condoName = 'Crystal Place Residence',
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'host' | 'reception' | 'admin'>('all');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    try {
      setIsDownloading(true);
      const doc = generateManualPdf({ condoName, totalUnits: 302 });
      doc.save(`Manual_Instrucoes_PROXIMO_${condoName.replace(/\s+/g, '_')}.pdf`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Erro ao gerar PDF', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Manual Oficial de Instruções e Diretrizes
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  PDF Disponível
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {condoName} • Sistema PROXIMO (Round Robin Autônomo)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-lg transition-all ${
                downloadSuccess
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 hover:scale-105 active:scale-95'
              }`}
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>PDF Baixado!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{isDownloading ? 'Gerando...' : 'Baixar Documento PDF'}</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="flex items-center gap-2 p-3 sm:px-6 bg-slate-950 border-b border-slate-800/80 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Visão Geral Completa</span>
          </button>
          <button
            onClick={() => setActiveTab('host')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'host'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-amber-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Nível 1: Anfitrião</span>
          </button>
          <button
            onClick={() => setActiveTab('reception')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'reception'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-blue-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Nível 2: Recepção / Portaria</span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-emerald-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Nível 3: Administrador</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          
          {/* Quick PDF Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white font-bold text-xs sm:text-sm">
                  Documento pronto para impressão ou compartilhamento em PDF
                </p>
                <p className="text-[11px] text-slate-400">
                  Inclui capas, cabeçalhos oficiais do condomínio, assinaturas e formatação executiva.
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadPdf}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Arquivo PDF (.pdf)</span>
            </button>
          </div>

          {/* SECTION 1: ANFITRIÃO */}
          {(activeTab === 'all' || activeTab === 'host') && (
            <div className="bg-slate-950 border border-amber-500/20 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-amber-400 font-black text-base">
                  <KeyRound className="w-5 h-5" />
                  <h3>1. NÍVEL ANFITRIÃO (PROPRIETÁRIO DO APARTAMENTO)</h3>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                  Torre Única (101 a 2004)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">1</span>
                    Como Solicitar Acesso
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    Clique em <strong>"Acesso Restrito"</strong> na barra superior. Digite seu <strong>Nome</strong>, <strong>E-mail</strong>, <strong>WhatsApp</strong> e selecione o Tipo <strong>"Anfitrião"</strong> informando o número do seu apartamento. Seu cadastro entra como pendente e é validado pelo Síndico.
                  </p>
                </div>

                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">2</span>
                    Disponibilidade na Fila Virtual
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    Ative o botão <strong>"Disponível para Hóspedes"</strong> (Verde) quando seu apartamento estiver limpo e pronto. Acompanhe sua posição exata na fila em tempo real (ex: 1º da fila, 5º da fila).
                  </p>
                </div>

                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">3</span>
                    Alerta de Chamado & SLA (180s)
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    Quando um hóspede chegar e sua unidade for a 1ª da fila, você receberá alerta com contagem regressiva de <strong>3 minutos (180s)</strong>. Clique em <strong>ACEITAR</strong> para garantir a hospedagem.
                  </p>
                </div>

                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">4</span>
                    Regra do Round Robin
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    Após aceitar e concluir o check-in, sua unidade é transferida <strong>automaticamente para o fim da fila</strong>, garantindo oportunidade igualitária para todos os 302 apartamentos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: RECEPÇÃO */}
          {(activeTab === 'all' || activeTab === 'reception') && (
            <div className="bg-slate-950 border border-blue-500/20 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-blue-400 font-black text-base">
                  <Building2 className="w-5 h-5" />
                  <h3>2. NÍVEL RECEPÇÃO (PORTARIA & BALCÃO 24H)</h3>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold">
                  Operação Neutra
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-blue-500/5 border border-blue-500/20 p-3 rounded-xl flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-blue-200 leading-relaxed">
                    <strong>Princípio da Neutralidade:</strong> A portaria não tem poder para escolher ou favorecer nenhuma unidade. A distribuição é 100% autônoma pelo sistema através do QR Code e fila virtual.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <strong className="text-white block font-bold">Passo 1: Apresentar QR Code</strong>
                    <p className="text-slate-400">
                      O hóspede aponta a câmera para a Placa QR do balcão ou preenche diretamente no Totem.
                    </p>
                  </div>

                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <strong className="text-white block font-bold">Passo 2: Aguardar Aceite</strong>
                    <p className="text-slate-400">
                      O anfitrião tem 3 minutos para responder. O painel da portaria exibe o progresso em tempo real.
                    </p>
                  </div>

                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <strong className="text-white block font-bold">Passo 3: Conferir & Liberar</strong>
                    <p className="text-slate-400">
                      Conferir o documento com foto do hóspede, entregar a chave sorteada e confirmar no sistema.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: ADMINISTRADOR */}
          {(activeTab === 'all' || activeTab === 'admin') && (
            <div className="bg-slate-950 border border-emerald-500/20 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-base">
                  <ShieldCheck className="w-5 h-5" />
                  <h3>3. NÍVEL ADMINISTRADOR (SÍNDICO & ADMINISTRAÇÃO)</h3>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                  Governança & Auditoria
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Validação Obrigatória de Cadastros
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    Acesse a aba <strong>"Validação de Acessos"</strong> no painel. Confirme os dados do anfitrião ou portaria e clique em <strong>"Validar & Aprovar"</strong>. Há também atalho direto para notificar via WhatsApp.
                  </p>
                </div>

                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Bloqueio Administrativo de Unidades
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    Unidades com débitos condominiais ou em reforma podem ser bloqueadas da fila pelo administrador, com registro compulsório da justificativa no livro de auditoria.
                  </p>
                </div>

                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Livro de Auditoria Digital Imutável
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    Todos os chamados, respostas, recusas, timeouts e entregas de chaves são gravados com hash e carimbo de data/hora para transparência em assembleias.
                  </p>
                </div>

                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-400" />
                    Parâmetros Globais & SLA
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    Configuração do tempo limite de resposta (padrão 180s), piso mínimo de diária (R$ 200,00) e regras da fila de espera.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: CONDOMINIUM RULES */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
            <h4 className="text-white font-bold flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-400" />
              Regras e Diretrizes Gerais do Condomínio
            </h4>
            <ul className="list-disc list-inside text-slate-400 space-y-1">
              <li>Piso Mínimo Obrigatório de <strong>R$ 200,00</strong> por diária para preservar a valorização do empreendimento.</li>
              <li>A fila virtual não pode ser alterada manualmente por nenhum operador.</li>
              <li>Todas as unidades ativas devem manter padrões rígidos de higiene e rouparia pronta para entrada imediata do hóspede.</li>
            </ul>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            Dúvidas sobre o sistema? Consulte o Síndico Geral ou Administração do condomínio.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="flex-1 sm:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Gerando...' : 'Baixar PDF'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
