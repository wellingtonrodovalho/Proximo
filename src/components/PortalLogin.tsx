import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  Building2, 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Unit } from '../types';
import { DEFAULT_CREDENTIALS, AuthSession, saveSession } from '../utils/auth';

interface PortalLoginProps {
  initialRole: 'host' | 'reception' | 'admin';
  units: Unit[];
  initialUnitNumber?: string | null;
  onSuccess: (session: AuthSession) => void;
  onCancel: () => void;
}

export const PortalLogin: React.FC<PortalLoginProps> = ({
  initialRole,
  units,
  initialUnitNumber,
  onSuccess,
  onCancel,
}) => {
  const [selectedRole, setSelectedRole] = useState<'host' | 'reception' | 'admin'>(initialRole);
  
  // Host state
  const [unitNumber, setUnitNumber] = useState<string>(initialUnitNumber || '');
  const [hostPassword, setHostPassword] = useState<string>('');
  
  // Staff state (Reception / Admin)
  const [username, setUsername] = useState<string>(
    initialRole === 'admin' ? DEFAULT_CREDENTIALS.admin.username : DEFAULT_CREDENTIALS.reception.username
  );
  const [password, setPassword] = useState<string>('');
  
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Handle Role change
  const handleRoleChange = (role: 'host' | 'reception' | 'admin') => {
    setSelectedRole(role);
    setErrorMsg(null);
    if (role === 'admin') {
      setUsername(DEFAULT_CREDENTIALS.admin.username);
    } else if (role === 'reception') {
      setUsername(DEFAULT_CREDENTIALS.reception.username);
    }
  };

  // Submit Host Login
  const handleHostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanNum = unitNumber.trim();
    if (!cleanNum) {
      setErrorMsg('Informe o número do apartamento (ex: 101, 304).');
      return;
    }

    // Find unit
    const matchedUnit = units.find(u => u.unitNumber === cleanNum);
    if (!matchedUnit) {
      setErrorMsg(`Apartamento ${cleanNum} não foi encontrado na Torre Única do Crystal Place Residence.`);
      return;
    }

    // Check password: allow default '123' or 'anfitriao123' or matchedUnit.id or cleanNum
    const valid = hostPassword === DEFAULT_CREDENTIALS.host.defaultPassword || 
                  hostPassword.toLowerCase() === 'anfitriao123' ||
                  hostPassword === cleanNum;

    if (!valid && hostPassword !== '') {
      setErrorMsg('Senha incorreta. A senha padrão do anfitrião é 123.');
      return;
    }

    const session: AuthSession = {
      role: 'host',
      unitId: matchedUnit.id,
      unitNumber: matchedUnit.unitNumber,
      userName: matchedUnit.ownerName || `Proprietário Apto ${cleanNum}`,
      authenticatedAt: new Date().toISOString(),
    };

    saveSession(session, rememberMe);
    onSuccess(session);
  };

  // Submit Reception Login
  const handleReceptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validUser = username.trim().toLowerCase() === DEFAULT_CREDENTIALS.reception.username;
    const validPass = password === DEFAULT_CREDENTIALS.reception.password || 
                      password === 'portaria123' || 
                      password === '123';

    if (!validUser || !validPass) {
      setErrorMsg(`Credenciais inválidas para Portaria. Utilize usuário "${DEFAULT_CREDENTIALS.reception.username}" e senha "${DEFAULT_CREDENTIALS.reception.password}".`);
      return;
    }

    const session: AuthSession = {
      role: 'reception',
      userName: 'Operador de Portaria 24h',
      authenticatedAt: new Date().toISOString(),
    };

    saveSession(session, rememberMe);
    onSuccess(session);
  };

  // Submit Admin Login
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validUser = username.trim().toLowerCase() === DEFAULT_CREDENTIALS.admin.username;
    const validPass = password === DEFAULT_CREDENTIALS.admin.password || 
                      password === 'admin123' || 
                      password === '302302';

    if (!validUser || !validPass) {
      setErrorMsg(`Credenciais inválidas para Administração. Utilize usuário "${DEFAULT_CREDENTIALS.admin.username}" e senha "${DEFAULT_CREDENTIALS.admin.password}".`);
      return;
    }

    const session: AuthSession = {
      role: 'admin',
      userName: 'Administração Geral / Síndico',
      authenticatedAt: new Date().toISOString(),
    };

    saveSession(session, rememberMe);
    onSuccess(session);
  };

  // Quick fill helper
  const handleQuickFill = (role: 'host' | 'reception' | 'admin') => {
    setErrorMsg(null);
    if (role === 'host') {
      const sample = units[0]?.unitNumber || '101';
      setUnitNumber(sample);
      setHostPassword(DEFAULT_CREDENTIALS.host.defaultPassword);
    } else if (role === 'reception') {
      setUsername(DEFAULT_CREDENTIALS.reception.username);
      setPassword(DEFAULT_CREDENTIALS.reception.password);
    } else {
      setUsername(DEFAULT_CREDENTIALS.admin.username);
      setPassword(DEFAULT_CREDENTIALS.admin.password);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative selection:bg-amber-500 selection:text-slate-950">
      
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Back to Guest Totem Button */}
        <button
          onClick={onCancel}
          className="mb-4 text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors group px-2 py-1 rounded-lg hover:bg-slate-900 w-fit"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar ao Totem do Hóspede (Público)</span>
        </button>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-1">
              {selectedRole === 'host' && <KeyRound className="w-6 h-6" />}
              {selectedRole === 'reception' && <Building2 className="w-6 h-6" />}
              {selectedRole === 'admin' && <ShieldCheck className="w-6 h-6" />}
            </div>

            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              Área Restrita • Crystal Place Residence
            </div>

            <h2 className="text-2xl font-black text-white">
              {selectedRole === 'host' && 'Portal do Anfitrião'}
              {selectedRole === 'reception' && 'Portaria & Balcão 24h'}
              {selectedRole === 'admin' && 'Administração & Síndico'}
            </h2>

            <p className="text-xs text-slate-400">
              {selectedRole === 'host' && 'Acesso exclusivo para proprietários e anfitriões de unidades.'}
              {selectedRole === 'reception' && 'Acesso operacional para recepcionistas e portaria física.'}
              {selectedRole === 'admin' && 'Acesso executivo para síndico, conselho e auditoria do rodízio.'}
            </p>
          </div>

          {/* Role selector tabs within login */}
          <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => handleRoleChange('host')}
              className={`py-2 px-1 rounded-lg font-medium transition-all text-center ${
                selectedRole === 'host'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Anfitrião
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('reception')}
              className={`py-2 px-1 rounded-lg font-medium transition-all text-center ${
                selectedRole === 'reception'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Portaria
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('admin')}
              className={`py-2 px-1 rounded-lg font-medium transition-all text-center ${
                selectedRole === 'admin'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Administrador
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* HOST FORM */}
          {selectedRole === 'host' && (
            <form onSubmit={handleHostSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Número do Apartamento (Torre Única)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    placeholder="Ex: 101, 204, 802..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-medium">
                    Torre Única
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Senha de Acesso do Anfitrião</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? 'Ocultar' : 'Mostrar'}</span>
                  </button>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={hostPassword}
                  onChange={(e) => setHostPassword(e.target.value)}
                  placeholder="Senha (padrão: 123)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
                  />
                  <span>Lembrar meu apartamento</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleQuickFill('host')}
                  className="text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Preencher teste (Apto 101)</span>
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <span>Acessar Portal do Anfitrião</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* RECEPTION FORM */}
          {selectedRole === 'reception' && (
            <form onSubmit={handleReceptionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Usuário da Portaria
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Usuário (portaria)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Senha Operacional</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? 'Ocultar' : 'Mostrar'}</span>
                  </button>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha (padrão: 242)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
                  />
                  <span>Lembrar neste terminal</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleQuickFill('reception')}
                  className="text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Preencher credencial</span>
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <span>Acessar Painel da Portaria</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ADMIN FORM */}
          {selectedRole === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Usuário Administrador / Síndico
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Usuário (admin)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Senha de Administrador</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? 'Ocultar' : 'Mostrar'}</span>
                  </button>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha (padrão: 302)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
                  />
                  <span>Lembrar credencial</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin')}
                  className="text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Preencher credencial</span>
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <span>Acessar Painel de Administração</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Credential Hints Box */}
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-300 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Credenciais Padrão do Sistema:</span>
            </div>
            <div className="grid grid-cols-1 gap-1 text-slate-400 pl-4 border-l border-slate-800">
              <div>• <strong>Anfitrião:</strong> Qualquer Apto (ex: 101, 204) + Senha: <code className="text-amber-300">123</code></div>
              <div>• <strong>Portaria:</strong> Usuário: <code className="text-amber-300">portaria</code> • Senha: <code className="text-amber-300">242</code></div>
              <div>• <strong>Administrador:</strong> Usuário: <code className="text-amber-300">admin</code> • Senha: <code className="text-amber-300">302</code></div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
