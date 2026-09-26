import React, { useState, useEffect } from 'react';
import { QrCode, Printer, X, ShieldCheck, Sparkles, Building2, Lock } from 'lucide-react';
import { generateQrDataUrl } from '../utils/qr';

interface PrintableQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  complexName: string;
}

export const PrintableQrModal: React.FC<PrintableQrModalProps> = ({
  isOpen,
  onClose,
  complexName,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Use current window location or direct guest URL
      const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://rotativo302.condo.app';
      generateQrDataUrl(currentUrl).then(setQrUrl);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Placa de Balcão Oficial (Totem QR)</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The Printable Card itself */}
        <div 
          id="printable-plaque" 
          className="bg-white text-slate-950 p-8 rounded-3xl text-center shadow-xl border-4 border-amber-500 space-y-4"
        >
          <div className="flex items-center justify-center gap-2 text-amber-600 font-black text-sm uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>{complexName}</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
            ALUGUEL IMEDIATO DE BALCÃO
          </h2>

          <p className="text-xs text-slate-600 max-w-xs mx-auto">
            Aponte a câmera do seu celular para o QR Code abaixo para solicitar sua acomodação em segundos.
          </p>

          <div className="py-2 flex justify-center">
            {qrUrl ? (
              <img 
                src={qrUrl} 
                alt="QR Code Recepção" 
                className="w-56 h-56 border-2 border-slate-200 rounded-2xl p-2 shadow-inner" 
              />
            ) : (
              <div className="w-56 h-56 bg-slate-100 rounded-2xl flex items-center justify-center">
                <QrCode className="w-16 h-16 text-slate-400" />
              </div>
            )}
          </div>

          <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-left text-[11px] text-slate-700 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-slate-900">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              SISTEMA DE EQUIDADE CONDOPROTECT
            </div>
            <p>
              • Atendimento 100% autônomo via <strong>Fila Rotativa Imparcial (Round Robin)</strong>.
            </p>
            <p>
              • A portaria não possui interface para escolha manual de apartamentos.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Placa para o Balcão</span>
          </button>
          <button
            onClick={onClose}
            className="py-3 px-5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-700"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
