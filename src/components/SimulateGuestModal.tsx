import React, { useState } from 'react';
import { Sparkles, Users, Calendar, X, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { UnitTypology } from '../types';

interface SimulateGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateGuest: (formData: {
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
}

const PRESET_GUESTS = [
  { name: 'Dr. Thiago Medeiros', doc: '381.992.108-44', phone: '(11) 98144-2200', guests: 2, nights: 2, type: '1 Quarto' as const, note: 'Preferência por Cama Queen' },
  { name: 'Carla Beatriz Alencar', doc: '822.401.559-01', phone: '(21) 99877-3311', guests: 3, nights: 3, type: '1 Quarto' as const, note: 'Família (Cama Casal + Sofá-Cama)' },
  { name: 'Eng. Marcelo Queiroz', doc: '119.482.003-88', phone: '(31) 98711-6644', guests: 1, nights: 1, type: '1 Quarto' as const, note: 'Executivo a trabalho' },
];

export const SimulateGuestModal: React.FC<SimulateGuestModalProps> = ({
  isOpen,
  onClose,
  onSimulateGuest,
}) => {
  const [selectedPreset, setSelectedPreset] = useState(0);

  if (!isOpen) return null;

  const current = PRESET_GUESTS[selectedPreset];

  const handleRun = () => {
    const today = new Date().toISOString().split('T')[0];
    const checkOut = new Date(Date.now() + current.nights * 86400000).toISOString().split('T')[0];

    onSimulateGuest({
      guestName: current.name,
      guestDocument: current.doc,
      guestPhone: current.phone,
      guestsCount: current.guests,
      nightsCount: current.nights,
      checkInDate: today,
      checkOutDate: checkOut,
      typologyPreferred: current.type,
      petFriendly: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Simulador de Chegada de Hóspede</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Simule a chegada de um novo cliente no balcão da recepção escaneando o QR Code para testar 
          o acionamento do 1º anfitrião da fila, o cronômetro de 5 minutos, a recusa ou a rotação.
        </p>

        {/* Presets */}
        <div className="space-y-2">
          {PRESET_GUESTS.map((preset, idx) => (
            <div
              key={preset.name}
              onClick={() => setSelectedPreset(idx)}
              className={`p-3.5 rounded-2xl border cursor-pointer text-xs transition-all ${
                selectedPreset === idx
                  ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <strong className="text-white text-sm">{preset.name}</strong>
                <span className="text-slate-500 text-[10px]">{preset.type}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {preset.guests} pessoa(s) • {preset.nights} noite(s) • CPF: {preset.doc}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            O sistema autônomo selecionará instantaneamente a unidade no topo da fila de espera!
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            onClick={handleRun}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <span>Disparar Simulação</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
