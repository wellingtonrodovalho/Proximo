import React from 'react';
import { 
  Building2, 
  QrCode, 
  KeyRound, 
  ShieldCheck, 
  Settings, 
  PlusCircle, 
  Volume2, 
  VolumeX, 
  RotateCw,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'guest' | 'host' | 'reception' | 'admin';
  setActiveTab: (tab: 'guest' | 'host' | 'reception' | 'admin') => void;
  activeQueueCount: number;
  totalUnitsCount: number;
  pendingRequestsCount: number;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  onOpenSimulate: () => void;
  onOpenQrPlaque: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeQueueCount,
  totalUnitsCount,
  pendingRequestsCount,
  soundEnabled,
  setSoundEnabled,
  onOpenSimulate,
  onOpenQrPlaque,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Logo & Complex Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-xs sm:text-sm tracking-wider flex-shrink-0">
              PRÓX
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight truncate flex items-center gap-1.5">
                  <span className="text-amber-400">PROXIMO</span>
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Portaria Blindada
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Crystal Place Residence • {totalUnitsCount} Unidades
              </p>
            </div>
          </div>

          {/* Role Navigation Tabs */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('guest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'guest'
                  ? 'bg-amber-500 text-slate-950 shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Totem Hóspede</span>
              <span className="sm:hidden">Hóspede</span>
            </button>

            <button
              onClick={() => setActiveTab('host')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'host'
                  ? 'bg-amber-500 text-slate-950 shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span className="hidden sm:inline">Portal do Anfitrião</span>
              <span className="sm:hidden">Anfitrião</span>
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {pendingRequestsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('reception')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'reception'
                  ? 'bg-amber-500 text-slate-950 shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Portaria & Balcão</span>
              <span className="sm:hidden">Portaria</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-amber-500 text-slate-950 shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Síndico / Admin</span>
              <span className="sm:hidden">Admin</span>
            </button>
          </div>

          {/* Quick Actions & Indicators */}
          <div className="flex items-center gap-2">
            {/* Live Queue Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300 font-mono">
                Fila Ativa: <strong className="text-emerald-400">{activeQueueCount}</strong>
              </span>
            </div>

            {/* Print Plaque Button */}
            <button
              onClick={onOpenQrPlaque}
              title="Ver / Imprimir Placa QR do Balcão"
              className="p-2 sm:px-3 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span className="hidden xl:inline">Placa Balcão</span>
            </button>

            {/* Test Simulator Button */}
            <button
              onClick={onOpenSimulate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Simular Hóspede</span>
              <span className="md:hidden">Simular</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Silenciar alertas sonoros' : 'Ativar alertas sonoros'}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
