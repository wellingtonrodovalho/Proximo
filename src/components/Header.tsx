import React from 'react';
import { 
  Building2, 
  QrCode, 
  KeyRound, 
  ShieldCheck, 
  Settings, 
  Volume2, 
  VolumeX, 
  Sparkles,
  Lock,
  LogOut,
  Share2,
  ExternalLink,
  UserCheck,
  FileText
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
  onOpenShareLinks: () => void;
  onOpenLogin: (role?: 'host' | 'reception' | 'admin') => void;
  onLogout: () => void;
  onOpenManual?: () => void;
  currentHostUnitNumber?: string;
  authenticatedUserName?: string;
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
  onOpenShareLinks,
  onOpenLogin,
  onLogout,
  onOpenManual,
  currentHostUnitNumber,
  authenticatedUserName,
}) => {
  const isGuestMode = activeTab === 'guest';

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
                
                {isGuestMode ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Totem de Balcão 24h
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    <Lock className="w-3 h-3 mr-1" />
                    Acesso Autenticado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate">
                Crystal Place Residence • Torre Única ({totalUnitsCount} Unidades)
              </p>
            </div>
          </div>

          {/* PUBLIC GUEST KIOSK VIEW: NO INTERNAL TABS */}
          {isGuestMode ? (
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Silenciar alertas sonoros' : 'Ativar alertas sonoros'}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-700"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {/* Discreet Demo Simulator for Evaluation */}
              <button
                onClick={onOpenSimulate}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-all"
                title="Simular chegada de hóspede no balcão para testes"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulador</span>
              </button>

              {/* Instructions Manual PDF Button */}
              {onOpenManual && (
                <button
                  onClick={onOpenManual}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 text-xs font-bold rounded-xl border border-amber-500/30 hover:border-amber-500/50 shadow-sm transition-all"
                  title="Manual Oficial de Instruções em PDF (Anfitrião, Recepção e Administrador)"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Manual (PDF)</span>
                  <span className="sm:hidden">Manual</span>
                </button>
              )}

              {/* Discreet Staff & Host Login Button */}
              <button
                onClick={() => onOpenLogin('host')}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-amber-300 text-xs sm:text-sm font-semibold rounded-xl border border-slate-800 hover:border-amber-500/40 transition-all shadow"
                title="Acesso restrito para Anfitriões, Portaria e Administração"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Acesso Restrito</span>
                <span className="sm:hidden">Entrar</span>
              </button>

            </div>
          ) : (
            /* AUTHENTICATED INTERNAL PORTAL HEADER */
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Active Portal Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                {activeTab === 'host' && (
                  <>
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-slate-400 font-medium hidden sm:inline">Portal do Anfitrião: </span>
                      <strong className="text-white">Apto {currentHostUnitNumber || '101'}</strong>
                    </div>
                  </>
                )}
                {activeTab === 'reception' && (
                  <>
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <div>
                      <strong className="text-white">Portaria & Balcão 24h</strong>
                    </div>
                  </>
                )}
                {activeTab === 'admin' && (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <div>
                      <strong className="text-white">Administração & Síndico</strong>
                    </div>
                  </>
                )}
              </div>

              {/* Share Access Links Button */}
              <button
                onClick={onOpenShareLinks}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition-all"
                title="Compartilhar links específicos com anfitriões ou portaria"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Compartilhar Links</span>
              </button>

              {/* Instructions Manual PDF Button */}
              {onOpenManual && (
                <button
                  onClick={onOpenManual}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white rounded-xl text-xs font-bold border border-amber-500/30 transition-all"
                  title="Manual Oficial de Instruções em PDF"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden lg:inline">Manual (PDF)</span>
                </button>
              )}

              {/* Print Plaque Button (Reception / Admin) */}
              {(activeTab === 'admin' || activeTab === 'reception') && (
                <button
                  onClick={onOpenQrPlaque}
                  title="Ver / Imprimir Placa QR do Balcão"
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Placa Balcão</span>
                </button>
              )}

              {/* Simulator Button */}
              <button
                onClick={onOpenSimulate}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-all"
                title="Simular Hóspede"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </button>

              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Silenciar alertas' : 'Ativar alertas'}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {/* View Public Totem */}
              <button
                onClick={() => setActiveTab('guest')}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition-all"
                title="Ir para a visão pública do Totem do Hóspede"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Ver Totem</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all"
                title="Encerrar sessão protegida"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </button>

            </div>
          )}

        </div>
      </div>
    </header>
  );
};
