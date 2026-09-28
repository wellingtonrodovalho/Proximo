import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Key, 
  UserCheck, 
  QrCode, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  ExternalLink,
  Printer,
  Sparkles,
  Lock,
  MessageSquare,
  Phone
} from 'lucide-react';
import { GuestRequest, Unit, SystemConfig, UnitTypology } from '../types';
import { getWhatsAppDirectUrl } from '../utils/whatsapp';

interface ReceptionDeskProps {
  requests: GuestRequest[];
  units: Unit[];
  activeRequest: GuestRequest | null;
  onValidateKeyDelivery: (requestId: string, keyTag: string, notes: string) => void;
  onManualWalkInSubmit: (formData: {
    guestName: string;
    guestDocument: string;
    guestPhone: string;
    guestsCount: number;
    nightsCount: number;
    checkInDate?: string;
    checkOutDate?: string;
    typologyPreferred: UnitTypology | 'Qualquer';
    petFriendly: boolean;
  }) => void;
  onOpenQrPlaque: () => void;
  config: SystemConfig;
}

export const ReceptionDesk: React.FC<ReceptionDeskProps> = ({
  requests,
  units,
  activeRequest,
  onValidateKeyDelivery,
  onManualWalkInSubmit,
  onOpenQrPlaque,
  config,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequestForValidation, setSelectedRequestForValidation] = useState<GuestRequest | null>(null);
  const [keyTagNumber, setKeyTagNumber] = useState('');
  const [receptionNotes, setReceptionNotes] = useState('Documento conferido presencialmente. Cartão de acesso magnético entregue.');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Manual guest input state
  const [manualName, setManualName] = useState('');
  const [manualDoc, setManualDoc] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualGuests, setManualGuests] = useState(2);
  const [manualNights, setManualNights] = useState(2);
  const [manualCheckIn, setManualCheckIn] = useState(() => new Date().toISOString().split('T')[0]);
  const [manualCheckOut, setManualCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });

  const handleManualCheckInChange = (val: string) => {
    setManualCheckIn(val);
    if (!manualCheckOut || manualCheckOut <= val) {
      const next = new Date(val + 'T00:00:00');
      next.setDate(next.getDate() + (manualNights || 1));
      setManualCheckOut(next.toISOString().split('T')[0]);
    } else {
      const diff = Math.max(1, Math.round((new Date(manualCheckOut + 'T00:00:00').getTime() - new Date(val + 'T00:00:00').getTime()) / 86400000));
      setManualNights(diff);
    }
  };

  const handleManualCheckOutChange = (val: string) => {
    if (val <= manualCheckIn) {
      const next = new Date(manualCheckIn + 'T00:00:00');
      next.setDate(next.getDate() + 1);
      setManualCheckOut(next.toISOString().split('T')[0]);
      setManualNights(1);
      return;
    }
    setManualCheckOut(val);
    const diff = Math.max(1, Math.round((new Date(val + 'T00:00:00').getTime() - new Date(manualCheckIn + 'T00:00:00').getTime()) / 86400000));
    setManualNights(diff);
  };

  const handleManualNightsChange = (n: number) => {
    setManualNights(n);
    const next = new Date(manualCheckIn + 'T00:00:00');
    next.setDate(next.getDate() + n);
    setManualCheckOut(next.toISOString().split('T')[0]);
  };

  const filteredRequests = requests.filter(r => 
    r.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.voucherCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.assignedUnitNumber && r.assignedUnitNumber.includes(searchTerm))
  );

  const handleConfirmKeyDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForValidation) return;
    if (!keyTagNumber.trim()) {
      alert('Por favor, informe o número da chave ou cartão magnético entregue.');
      return;
    }
    onValidateKeyDelivery(selectedRequestForValidation.id, keyTagNumber, receptionNotes);
    setSelectedRequestForValidation(null);
    setKeyTagNumber('');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualDoc.trim()) {
      alert('Informe o nome e documento do hóspede.');
      return;
    }

    onManualWalkInSubmit({
      guestName: manualName,
      guestDocument: manualDoc,
      guestPhone: manualPhone || '(Balcão Portaria)',
      guestsCount: manualGuests,
      nightsCount: manualNights,
      checkInDate: manualCheckIn,
      checkOutDate: manualCheckOut,
      typologyPreferred: 'Qualquer',
      petFriendly: false,
    });

    setIsManualModalOpen(false);
    setManualName('');
    setManualDoc('');
    setManualPhone('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* 🛡️ BANNER DA BLINDAGEM DA RECEPÇÃO 🛡️ */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold flex-shrink-0 border border-emerald-500/30">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-1">
                <Lock className="w-3 h-3" />
                BLINDAGEM CONTRA ACUSAÇÕES DE FAVORECIMENTO
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Portaria & Recepção 100% Neutra
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl mt-1 leading-relaxed">
                Este terminal foi projetado para retirar <strong>qualquer decisão discricionária</strong> dos porteiros e recepcionistas. 
                A portaria não escolhe nem altera apartamentos. As locações de balcão são distribuídas estritamente por sistema 
                autônomo e auditável em tempo real.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 flex-shrink-0">
            <button
              onClick={onOpenQrPlaque}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>Ver Placa do Balcão</span>
            </button>
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Hóspede sem Celular</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Counter Flow Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              Monitor de Hóspedes de Balcão em Tempo Real
            </h3>
            <p className="text-xs text-slate-400">
              Acompanhe quem está aguardando anfitrião ou pronto para liberação de chave.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por hóspede, voucher ou apto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Requests List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Voucher</th>
                <th className="py-3 px-4">Hóspede & Documento</th>
                <th className="py-3 px-4">Unidade Alocada (Autônoma)</th>
                <th className="py-3 px-4">Estadia</th>
                <th className="py-3 px-4">Status da Fila</th>
                <th className="py-3 px-4 text-right">Ação da Recepção</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                  
                  {/* Voucher */}
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                    {req.voucherCode}
                  </td>

                  {/* Guest Info */}
                  <td className="py-3.5 px-4">
                    <strong className="text-white block">{req.guestName}</strong>
                    <span className="text-slate-500 text-[11px]">{req.guestDocument} • {req.guestPhone}</span>
                  </td>

                  {/* Assigned Unit */}
                  <td className="py-3.5 px-4">
                    {req.assignedUnitNumber ? (
                      <div>
                        <strong className="text-white text-sm">Apto {req.assignedUnitNumber}</strong>
                        <span className="text-slate-400 text-[11px] block">
                          1 Quarto ({req.assignedUnitBedSummary || 'Cama Casal'}) • {req.assignedUnitBlock}
                        </span>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-slate-400 text-[10px]">
                            Anfitrião: <strong className="text-slate-200">{req.assignedHostName}</strong>
                          </span>
                          {(req.assignedHostWhatsapp || req.assignedHostPhone) && (
                            <a
                              href={getWhatsAppDirectUrl(
                                req.assignedHostWhatsapp || req.assignedHostPhone || '',
                                `Olá ${req.assignedHostName}! Aqui é da Portaria do Crystal Place Residence (App PROXIMO) informando sobre o Voucher ${req.voucherCode} do hóspede ${req.guestName}.`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30 transition-colors"
                              title="Chamar anfitrião no WhatsApp"
                            >
                              <MessageSquare className="w-2.5 h-2.5 text-emerald-400" />
                              <span>WA: {req.assignedHostWhatsapp || req.assignedHostPhone}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">Buscando na fila...</span>
                    )}
                  </td>

                  {/* Stay */}
                  <td className="py-3.5 px-4">
                    <span>{req.guestsCount} pessoa(s)</span>
                    <span className="text-slate-400 block text-[11px]">{req.nightsCount} noites • R$ {req.totalAmount}</span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    {req.status === 'waiting_host' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                        <Clock className="w-3 h-3" />
                        Aguardando Anfitrião (5m)
                      </span>
                    )}
                    {req.status === 'accepted' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Apto Confirmado! Entregar Chave
                      </span>
                    )}
                    {req.status === 'checked_in' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Key className="w-3 h-3" />
                        Check-in Concluído
                      </span>
                    )}
                    {req.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <AlertCircle className="w-3 h-3" />
                        Fila Esgotada
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    {req.status === 'accepted' && (
                      <button
                        onClick={() => setSelectedRequestForValidation(req)}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md"
                      >
                        Validar Documento & Entregar Chave
                      </button>
                    )}
                    {req.status === 'checked_in' && (
                      <span className="text-slate-500 text-[11px] font-mono">
                        Chave entregue • {req.receptionValidationKey || 'Validado'}
                      </span>
                    )}
                    {req.status === 'waiting_host' && (
                      <span className="text-slate-500 text-[11px] italic">
                        Aguardando aceite do anfitrião
                      </span>
                    )}
                  </td>

                </tr>
              ))}

              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-semibold text-slate-400">Nenhuma solicitação de hóspede no momento.</p>
                    <p className="text-xs text-slate-500 mt-1">O balcão está livre aguardando novos atendimentos via QR Code ou cadastro presencial.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* KEY HANDOVER MODAL */}
      {selectedRequestForValidation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Validação de Check-in na Portaria</h3>
                  <span className="text-xs text-slate-400">Voucher Oficial: {selectedRequestForValidation.voucherCode}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequestForValidation(null)}
                className="text-slate-500 hover:text-slate-300 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Hóspede:</span>
                <strong className="text-white">{selectedRequestForValidation.guestName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Documento a Conferir:</span>
                <strong className="text-amber-400 font-mono text-sm">{selectedRequestForValidation.guestDocument}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unidade Definida pelo Sistema:</span>
                <strong className="text-emerald-400 text-sm">
                  Apartamento {selectedRequestForValidation.assignedUnitNumber} ({selectedRequestForValidation.assignedUnitBlock})
                </strong>
              </div>
            </div>

            <form onSubmit={handleConfirmKeyDelivery} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Número da Chave / Cartão Magnético Entregue *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: CHAVE-14 ou TAG-882"
                  value={keyTagNumber}
                  onChange={(e) => setKeyTagNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Observações do Porteiro / Recepcionista
                </label>
                <input
                  type="text"
                  value={receptionNotes}
                  onChange={(e) => setReceptionNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>
                  Esta ação será gravada no <strong>Log de Auditoria Imutável</strong> do condomínio, protegendo a equipe da portaria.
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequestForValidation(null)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Confirmar Entrega de Chave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL WALK-IN MODAL (FOR GUEST WITHOUT SMARTPHONE) */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Cadastrar Hóspede sem Smartphone</h3>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Use esta tela quando o hóspede estiver no balcão sem celular ou sem bateria.
              <strong> Importante:</strong> O funcionário da portaria <em>NÃO escolhe o apartamento</em>. 
              Ao submeter os dados, o sistema aciona estritamente o próximo anfitrião da fila oficial!
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do Hóspede"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">CPF ou Documento *</label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={manualDoc}
                    onChange={(e) => setManualDoc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Check-in and Check-out Date Pickers */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Entrada (Check-in) *
                  </label>
                  <input
                    type="date"
                    required
                    value={manualCheckIn}
                    onChange={(e) => handleManualCheckInChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Saída (Check-out) *
                  </label>
                  <input
                    type="date"
                    required
                    value={manualCheckOut}
                    min={manualCheckIn}
                    onChange={(e) => handleManualCheckOutChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500 [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Pessoas</label>
                  <select
                    value={manualGuests}
                    onChange={(e) => setManualGuests(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} hóspede(s)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Noites ({manualNights} diárias)
                  </label>
                  <select
                    value={manualNights}
                    onChange={(e) => handleManualNightsChange(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {[1, 2, 3, 4, 5, 7, 10].map(n => (
                      <option key={n} value={n}>{n} diária(s)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm transition-all"
                >
                  DISPARAR RODÍZIO AUTOMÁTICO NA FILA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
