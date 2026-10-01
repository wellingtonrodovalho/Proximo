import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  MessageSquare, 
  User, 
  Building, 
  DollarSign, 
  Bed, 
  Phone, 
  Mail, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Unit, BedConfig } from '../types';
import { 
  cleanPhoneDigits, 
  formatWhatsApp, 
  isValidWhatsApp, 
  getWhatsAppDirectUrl, 
  getOfficialHostNotificationMessage 
} from '../utils/whatsapp';
import { playChime } from '../utils/audio';

interface EditUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: Unit | null;
  onSaveUnit: (updatedUnit: Unit) => void;
  onUpdateAccountProfile?: (profile: { name: string; phone: string; email: string }) => void;
}

const AVAILABLE_BED_TYPES: BedConfig['type'][] = [
  'Cama Casal Queen',
  'Cama Casal Padrão',
  'Cama Solteiro',
  'Sofá-Cama Casal',
  'Bicama Solteiro',
];

export const EditUnitModal: React.FC<EditUnitModalProps> = ({
  isOpen,
  onClose,
  unit,
  onSaveUnit,
  onUpdateAccountProfile,
}) => {
  if (!isOpen || !unit) return null;

  const [ownerName, setOwnerName] = useState<string>(unit.ownerName || unit.managerName || '');
  const [managementType, setManagementType] = useState<'anfitriao' | 'co_anfitriao'>(
    unit.managementType || 'anfitriao'
  );
  const [whatsapp, setWhatsapp] = useState<string>(unit.whatsapp || unit.ownerPhone || '');
  const [email, setEmail] = useState<string>(unit.ownerEmail || '');
  const [unitNumber, setUnitNumber] = useState<string>(unit.unitNumber || '');
  const [floor, setFloor] = useState<number | string>(unit.floor || 1);
  const [basePrice, setBasePrice] = useState<number>(Math.max(200, unit.basePrice || 220));
  const [cleaningFee, setCleaningFee] = useState<number>(unit.cleaningFee || 80);
  const [capacity, setCapacity] = useState<number>(unit.capacity || 2);
  const [bedTypes, setBedTypes] = useState<BedConfig[]>(
    unit.bedTypes && unit.bedTypes.length > 0
      ? unit.bedTypes
      : [{ type: 'Cama Casal Queen', quantity: 1 }]
  );

  const [whatsappError, setWhatsappError] = useState<string>('');
  const [priceError, setPriceError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (unit) {
      setOwnerName(unit.ownerName || unit.managerName || '');
      setManagementType(unit.managementType || 'anfitriao');
      setWhatsapp(unit.whatsapp || unit.ownerPhone || '');
      setEmail(unit.ownerEmail || '');
      setUnitNumber(unit.unitNumber || '');
      setFloor(unit.floor || 1);
      setBasePrice(Math.max(200, unit.basePrice || 220));
      setCleaningFee(unit.cleaningFee || 80);
      setCapacity(unit.capacity || 2);
      setBedTypes(
        unit.bedTypes && unit.bedTypes.length > 0
          ? unit.bedTypes
          : [{ type: 'Cama Casal Queen', quantity: 1 }]
      );
      setWhatsappError('');
      setPriceError('');
      setSuccessMsg('');
    }
  }, [unit, isOpen]);

  const handleBedQuantityChange = (type: BedConfig['type'], quantity: number) => {
    let updated: BedConfig[];
    if (quantity <= 0) {
      updated = bedTypes.filter(b => b.type !== type);
    } else {
      const exists = bedTypes.some(b => b.type === type);
      if (exists) {
        updated = bedTypes.map(b => (b.type === type ? { ...b, quantity } : b));
      } else {
        updated = [...bedTypes, { type, quantity }];
      }
    }
    if (updated.length === 0) {
      updated = [{ type: 'Cama Casal Queen', quantity: 1 }];
    }
    setBedTypes(updated);
  };

  const calculateTotalBeds = (beds: BedConfig[]): number => {
    return beds.reduce((sum, b) => sum + b.quantity, 0);
  };

  const generateBedSummary = (beds: BedConfig[]): string => {
    return beds.map(b => `${b.quantity} ${b.type.replace('Cama ', '')}`).join(' + ');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!ownerName.trim()) {
      alert('Por favor, informe o nome do responsável.');
      return;
    }

    if (!whatsapp.trim()) {
      setWhatsappError('O WhatsApp é obrigatório para notificações da portaria.');
      return;
    }

    if (!isValidWhatsApp(whatsapp)) {
      setWhatsappError('Por favor, digite um número de WhatsApp válido com DDD (ex: (62) 99999-1609).');
      return;
    }
    setWhatsappError('');

    if (Number(basePrice) < 200) {
      setPriceError('A diária mínima é de R$ 200,00 conforme regulamento condominial.');
      return;
    }
    setPriceError('');

    const cleanNum = unitNumber.trim() || unit.unitNumber;
    const isFinal3 = cleanNum.endsWith('03') || cleanNum.endsWith('3');
    const area = isFinal3 ? 35 : 33;
    const bedsCount = calculateTotalBeds(bedTypes);
    const bedSummary = generateBedSummary(bedTypes);

    const updatedUnit: Unit = {
      ...unit,
      unitNumber: cleanNum,
      floor: Number(floor) || 1,
      area,
      ownerName: ownerName.trim(),
      managerName: managementType === 'co_anfitriao' ? ownerName.trim() : undefined,
      managementType,
      managementRoleTitle:
        managementType === 'co_anfitriao'
          ? 'Co-Anfitrião (Administrador)'
          : 'Anfitrião (Proprietário)',
      whatsapp: whatsapp.trim(),
      ownerPhone: whatsapp.trim(),
      ownerEmail: email.trim(),
      basePrice: Number(basePrice),
      cleaningFee: Number(cleaningFee),
      capacity: Number(capacity),
      bedsCount,
      bedTypes,
      bedSummary,
    };

    onSaveUnit(updatedUnit);

    if (onUpdateAccountProfile) {
      onUpdateAccountProfile({
        name: ownerName.trim(),
        phone: whatsapp.trim(),
        email: email.trim(),
      });
    }

    setSuccessMsg('Cadastro e WhatsApp atualizados com sucesso!');
    playChime('accepted');

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const waTestUrl = getWhatsAppDirectUrl(
    whatsapp,
    getOfficialHostNotificationMessage(unitNumber || unit.unitNumber, 'Torre Única', ownerName)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                Ajustes da Unidade & Contato
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Apto {unit.unitNumber} ({unit.floor}º Andar)
              </span>
            </div>
            <h3 className="text-xl font-black text-white mt-1">
              Editar Cadastro do Anfitrião & WhatsApp
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-300">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* SEÇÃO 1: RESPONSÁVEL & WHATSAPP */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
            <div className="text-xs font-bold text-white flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                <span>1. Titular & Forma de Contato (WhatsApp)</span>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                Obrigatório para Notificações
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome Completo do Responsável *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Wellington Rodovalho"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tipo de Gestão da Unidade
                </label>
                <select
                  value={managementType}
                  onChange={(e) => setManagementType(e.target.value as 'anfitriao' | 'co_anfitriao')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="anfitriao">Anfitrião (Proprietário do Imóvel)</option>
                  <option value="co_anfitriao">Co-Anfitrião (Administrador / Gestor)</option>
                </select>
              </div>

              {/* WhatsApp Field with Live Test */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <MessageSquare className="w-3.5 h-3.5" />
                    WhatsApp para Chamados *
                  </span>
                  {isValidWhatsApp(whatsapp) && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                      <Check className="w-3 h-3" /> Válido
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  placeholder="(62) 99999-1609 ou (11) 98765-4321"
                  value={whatsapp}
                  onChange={(e) => {
                    const formatted = formatWhatsApp(e.target.value);
                    setWhatsapp(formatted);
                    if (!isValidWhatsApp(formatted)) {
                      setWhatsappError('Digite o DDD e número completo (ex: (62) 99999-1609)');
                    } else {
                      setWhatsappError('');
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono font-bold"
                />
                {whatsappError ? (
                  <span className="text-xs text-rose-400 mt-1 block">{whatsappError}</span>
                ) : (
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Recebe chamados de balcão e avisos instantâneos.
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  E-mail para Notificações & Repasses
                </label>
                <input
                  type="email"
                  placeholder="wellington@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Recebe comprovantes formais da portaria.
                </span>
              </div>
            </div>

            {/* Test WhatsApp Link */}
            {isValidWhatsApp(whatsapp) && (
              <div className="pt-2">
                <a
                  href={waTestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Testar Envio de Mensagem para Meu WhatsApp</span>
                  <ExternalLink className="w-3 h-3 text-emerald-400" />
                </a>
              </div>
            )}
          </div>

          {/* SEÇÃO 2: IDENTIFICAÇÃO DO IMÓVEL (CRYSTAL PLACE - 25 ANDARES) */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
            <div className="text-xs font-bold text-white flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-400" />
                <span>2. Identificação da Unidade</span>
              </div>
              <span className="text-[10px] text-slate-400">Torre Única • 25 Andares</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Apartamento *
                </label>
                <input
                  type="text"
                  required
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {unitNumber.endsWith('03') || unitNumber.endsWith('3') ? 'Final 3: 35 m²' : 'Final regular: 33 m²'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Andar (1 a 25) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  required
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Diária de Balcão (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 text-sm">R$</span>
                  <input
                    type="number"
                    min={200}
                    step={5}
                    required
                    value={basePrice}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setBasePrice(v);
                      if (v < 200) setPriceError('Diária mínima de R$ 200,00.');
                      else setPriceError('');
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
                {priceError && <span className="text-xs text-rose-400 mt-1 block">{priceError}</span>}
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: CAMAS & CAPACIDADE */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-white flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Bed className="w-4 h-4 text-amber-400" />
                <span>3. Disposição de Camas & Capacidade (1 Quarto)</span>
              </div>
              <span className="text-xs font-bold text-amber-400">
                {calculateTotalBeds(bedTypes)} cama(s) • Max {capacity} pessoas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AVAILABLE_BED_TYPES.map((type) => {
                const conf = bedTypes.find((b) => b.type === type);
                const qty = conf ? conf.quantity : 0;

                return (
                  <div
                    key={type}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      qty > 0 ? 'bg-amber-500/10 border-amber-500/40 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-xs font-semibold">{type}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleBedQuantityChange(type, Math.max(0, qty - 1))}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-mono font-bold text-xs">{qty}</span>
                      <button
                        type="button"
                        onClick={() => handleBedQuantityChange(type, qty + 1)}
                        className="w-6 h-6 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-4 pt-1">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Capacidade Máxima de Hóspedes
                </label>
                <select
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} pessoa(s)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Resumo das Camas
                </label>
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-amber-300 truncate">
                  {generateBedSummary(bedTypes)}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Cadastro & Atualizar WhatsApp</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
