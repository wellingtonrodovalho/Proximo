import React, { useState, useEffect } from 'react';
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
import { ProximoLogo } from './ProximoLogo';
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
  initialMode?: 'request' | 'login';
}

export const PortalLogin: React.FC<PortalLoginProps> = ({
  isOpen,
  onClose,
  accounts,
  units,
  onRequestAccess,
  onLoginSuccess,
  initialRole = 'host',
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'request' | 'login'>(initialMode);
  
  // Registration Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<AccessRole>(initialRole);
  const [managementType, setManagementType] = useState<'anfitriao' | 'co_anfitriao'>('anfitriao');
  const [unitNumber, setUnitNumber] = useState('');

  // Login Form
  const [searchCredential, setSearchCredential] = useState('');

  // Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'login');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialMode]);

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
      managementType: role === 'host' ? managementType : undefined,
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

    // Find unit if host or admin with unit
    let unitId: string | undefined;
    if (account.unitNumber) {
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
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <ProximoLogo variant="full" size="lg" theme="dark" />
          </div>
          <div className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">
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

            {/* If Host: Choose Management Role (Anfitrião ou Co-Anfitrião) */}
            {role === 'host' && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Tipo de Administração da Unidade
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManagementType('anfitriao')}
                    className={`p-2 rounded-lg text-xs font-bold border transition-all text-center ${
                      managementType === 'anfitriao'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Anfitrião (Proprietário)
                  </button>
                  <button
                    type="button"
                    onClick={() => setManagementType('co_anfitriao')}
                    className={`p-2 rounded-lg text-xs font-bold border transition-all text-center ${
                      managementType === 'co_anfitriao'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Co-Anfitrião (Administrador)
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  As unidades do Crystal Place podem ser geridas diretamente pelo Proprietário ou por Administrador/Co-Anfitrião.
                </span>
              </div>
            )}

            {/* If Host OR Admin: Optional Apartment Number */}
            {(role === 'host' || role === 'admin') && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Número do Apartamento (Crystal Place)</span>
                  {role === 'admin' && (
                    <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      O Admin também pode ser Anfitrião
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required={role === 'host'}
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  placeholder={role === 'admin' ? "Ex: 1609 (opcional se for também anfitrião)" : "Ex: 200, 201, 1609, 1701, 2512..."}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {role === 'admin' 
                    ? 'Como Administrador, se você possui ou administra unidades no condomínio (ex: 1609, 1701), informe para participar também como anfitrião.' 
                    : 'Crystal Place tem 312 unidades habitacionais do 2º ao 25º andar (13 un./andar, iniciando em 200, 201, 202... até 2512). Unidades final 3 têm 35m² e demais têm 33m².'}
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
            <form onSubmit={handleDirectLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Seu E-mail ou Telefone Cadastrado</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  autoComplete="off"
                  value={searchCredential}
                  onChange={(e) => setSearchCredential(e.target.value)}
                  placeholder="Digite seu e-mail ou telefone..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-medium"
                />
                <span className="text-[11px] text-slate-500 mt-1.5 block">
                  Informe o e-mail ou número de telefone/WhatsApp cadastrado na administração.
                </span>
              </div>

              {/* Explicit Privacy Guarantee: No accounts shown publicly */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-slate-300 font-bold block text-[11px]">
                    Validação Privada & Sigilosa
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Nenhuma lista de contas ou anfitriões é exibida nesta tela. O acesso é liberado exclusivamente após a validação do seu e-mail ou telefone previamente aprovado pelo administrador.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Entrar no Sistema</span>
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
