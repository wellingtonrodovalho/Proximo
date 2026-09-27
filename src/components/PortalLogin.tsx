import React, { useState } from 'react';
import { 
  Lock, 
  UserCheck, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Building2, 
  ShieldCheck, 
  Send, 
  Phone, 
  Mail, 
  User, 
  Sparkles,
  Check
} from 'lucide-react';
import { AccessAccount, AccessRole, AuthSession, saveSession } from '../utils/auth';
import { Unit } from '../types';

interface PortalLoginProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccessAccount[];
  units: Unit[];
  onRequestAccess: (account: Omit<AccessAccount, 'id' | 'status' | 'requestedAt'>) => void;
  onLoginSuccess: (session: AuthSession) => void;
  initialRole?: AccessRole;
}

export const PortalLogin: React.FC<PortalLoginProps> = ({
  isOpen,
  onClose,
  accounts,
  units,
  onRequestAccess,
  onLoginSuccess,
  initialRole = 'host',
}) => {
  const [mode, setMode] = useState<'request' | 'login'>('request');
  
  // Registration Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<AccessRole>(initialRole);
  const [unitNumber, setUnitNumber] = useState('');

  // Login Form
  const [searchCredential, setSearchCredential] = useState('');

  // Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanEmail || !cleanPhone) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios (Nome, E-mail e Telefone).');
      return;
    }

    if (role === 'host' && !unitNumber.trim()) {
      setErrorMsg('Para acesso de Anfitrião, informe o número do apartamento (ex: 101, 304).');
      return;
    }

    // Check if email already registered
    const existing = accounts.find(
      a => a.email.toLowerCase() === cleanEmail || a.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')
    );

    if (existing) {
      if (existing.status === 'pending') {
        setErrorMsg('Este e-mail/telefone já possui um cadastro pendente de validação pelo Administrador.');
        return;
      }
      if (existing.status === 'approved') {
        setErrorMsg('Este cadastro já foi aprovado! Clique na aba "Já Tenho Cadastro" para entrar.');
        return;
      }
    }

    onRequestAccess({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      role,
      unitNumber: role === 'host' ? unitNumber.trim() : undefined,
    });

    setSuccessMsg('Solicitação enviada com sucesso! O cadastro está pendente de validação pelo Administrador/Síndico.');
    setName('');
    setEmail('');
    setPhone('');
    setUnitNumber('');
  };

  const handleDirectLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const term = searchCredential.trim().toLowerCase();
    const cleanDigits = term.replace(/\D/g, '');

    if (!term) {
      setErrorMsg('Informe seu e-mail ou telefone cadastrado.');
      return;
    }

    const account = accounts.find(a => 
      a.email.toLowerCase() === term || 
      (cleanDigits && a.phone.replace(/\D/g, '') === cleanDigits) ||
      a.name.toLowerCase().includes(term)
    );

    if (!account) {
      setErrorMsg('Nenhum cadastro encontrado com esses dados. Por favor, solicite seu acesso na aba "Solicitar Acesso".');
      return;
    }

    if (account.status === 'pending') {
      setErrorMsg(`O cadastro de ${account.name} ainda está PENDENTE de validação pelo Administrador.`);
      return;
    }

    if (account.status === 'rejected') {
      setErrorMsg(`O cadastro de ${account.name} foi recusado pela administração do condomínio.`);
      return;
    }

    // Find unit if host
    let unitId: string | undefined;
    if (account.role === 'host' && account.unitNumber) {
      const match = units.find(u => u.unitNumber === account.unitNumber);
      unitId = match?.id;
    }

    const session: AuthSession = {
      role: account.role,
      accountId: account.id,
      unitId,
      unitNumber: account.unitNumber,
      userName: account.name,
      userEmail: account.email,
      userPhone: account.phone,
      authenticatedAt: new Date().toISOString(),
    };

    saveSession(session);
    onLoginSuccess(session);
  };

  const handleQuickLogin = (account: AccessAccount) => {
    let unitId: string | undefined;
    if (account.role === 'host' && account.unitNumber) {
      const match = units.find(u => u.unitNumber === account.unitNumber);
      unitId = match?.id;
    }

    const session: AuthSession = {
      role: account.role,
      accountId: account.id,
      unitId,
      unitNumber: account.unitNumber,
      userName: account.name,
      userEmail: account.email,
      userPhone: account.phone,
      authenticatedAt: new Date().toISOString(),
    };

    saveSession(session);
    onLoginSuccess(session);
  };

  const approvedAccounts = accounts.filter(a => a.status === 'approved');

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative max-h-[92vh] overflow-y-auto">
        
        {/* Back Button */}
        <button
          onClick={onClose}
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors group px-2 py-1 rounded-lg hover:bg-slate-800 w-fit"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar ao Totem do Hóspede</span>
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-1">
            <Lock className="w-6 h-6" />
          </div>
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            Área Restrita • Crystal Place Residence
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Acesso Restrito da Equipe
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Cadastre seus dados para validação da administração ou entre com cadastro aprovado.
          </p>
        </div>

        {/* Tab switch between Request and Login */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => { setMode('request'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 px-3 rounded-xl font-bold transition-all text-center flex items-center justify-center gap-2 ${
              mode === 'request'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Solicitar Acesso</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 px-3 rounded-xl font-bold transition-all text-center flex items-center justify-center gap-2 ${
              mode === 'login'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Já Tenho Cadastro</span>
          </button>
        </div>

        {/* Feedback messages */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* MODE 1: SIMPLE REQUEST FORM (Nome, Email, Telefone, Tipo de Acesso) */}
        {mode === 'request' && (
          <form onSubmit={handleRegister} className="space-y-4">
            
            {/* Nome */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Nome Completo</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Wellington Rodovalho"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>E-mail</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: seuemail@exemplo.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Telefone / WhatsApp */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Telefone (WhatsApp)</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: (62) 99999-8888"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* Tipo de Acesso */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tipo de Acesso Desejado
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('host')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center flex flex-col items-center gap-1 transition-all ${
                    role === 'host'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300 shadow'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Anfitrião</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('reception')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center flex flex-col items-center gap-1 transition-all ${
                    role === 'reception'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300 shadow'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Portaria</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center flex flex-col items-center gap-1 transition-all ${
                    role === 'admin'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300 shadow'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin</span>
                </button>
              </div>
            </div>

            {/* If Host: Apartment Number */}
            {role === 'host' && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Número do Apartamento na Torre Única
                </label>
                <input
                  type="text"
                  required
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  placeholder="Ex: 101, 204, 302..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Informe a unidade que você administra no condomínio.
                </span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Cadastro para Validação do Admin</span>
            </button>

            <div className="text-[11px] text-center text-slate-500 flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>O Administrador recebe e valida o cadastro no painel.</span>
            </div>
          </form>
        )}

        {/* MODE 2: DIRECT LOGIN WITH APPROVED ACCOUNT */}
        {mode === 'login' && (
          <div className="space-y-4">
            <form onSubmit={handleDirectLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Seu E-mail ou Telefone Cadastrado
                </label>
                <input
                  type="text"
                  required
                  value={searchCredential}
                  onChange={(e) => setSearchCredential(e.target.value)}
                  placeholder="Digite seu e-mail ou telefone..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Entrar no Sistema</span>
              </button>
            </form>

            {/* Quick Demo Access Badges */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                <span>Contas Validadas / Aprovadas:</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                  {approvedAccounts.length} ativas
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {approvedAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => handleQuickLogin(acc)}
                    className="w-full p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 rounded-xl text-left transition-all flex items-center justify-between group"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-amber-300 flex items-center gap-1.5 truncate">
                        <span>{acc.name}</span>
                        {acc.unitNumber && (
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 rounded">
                            Apto {acc.unitNumber}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {acc.role === 'admin' ? 'Administrador / Síndico' : acc.role === 'reception' ? 'Portaria 24h' : 'Anfitrião'} • {acc.email}
                      </div>
                    </div>

                    <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
                      <span>Acessar</span>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
