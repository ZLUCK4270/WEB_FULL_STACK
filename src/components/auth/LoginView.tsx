import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { useI18n } from '../../i18n/I18nContext';
import { StaffUser } from '../../types/pharmacy';
import {
  Pill,
  ShieldCheck,
  UserCheck,
  Lock,
  ArrowRight,
  Globe,
  CheckCircle2,
  Sparkles,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  Laptop,
  KeyRound,
  ShieldAlert
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { staffUsers, login } = usePharmacy();
  const { t, language, setLanguage } = useI18n();

  // Form input states (Asking specifically for Name/Username, Password, Shift, Terminal)
  const [usernameInput, setUsernameInput] = useState<string>('cmendoza');
  const [passwordInput, setPasswordInput] = useState<string>('regente2026');
  const [selectedShift, setSelectedShift] = useState<'mañana' | 'tarde' | 'noche'>('mañana');
  const [selectedTerminal, setSelectedTerminal] = useState<string>('terminal-01');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  const handleQuickFill = (user: StaffUser) => {
    setUsernameInput(user.username || user.dni);
    setPasswordInput(user.password || '1234');
    setSelectedShift(user.activeShift);
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!usernameInput.trim()) {
      setErrorMessage('Por favor ingrese su nombre de usuario, DNI o identificador.');
      return;
    }

    if (!passwordInput.trim()) {
      setErrorMessage('Por favor ingrese su contraseña o clave de acceso.');
      return;
    }

    setIsSubmitting(true);

    const result = login(usernameInput.trim(), passwordInput, selectedShift);

    if (!result.success) {
      setErrorMessage(result.error || 'Credenciales inválidas.');
      setIsSubmitting(false);
    }
    // If success, state in PharmacyProvider updates and App switches to main view automatically
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans">
      {/* Top Bar with Language Selector & Pharmacy Brand */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
            <Pill className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                {t('app_title')}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                v2.6 Operativa
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Sistema de Gestión Farmacéutica & Control de Acceso por Roles (RBAC)
            </p>
          </div>
        </div>

        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-bold transition shadow-sm"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>{language === 'es' ? '🇪🇸 Español' : '🇺🇸 English'}</span>
        </button>
      </div>

      {/* Main Authentication Grid */}
      <div className="max-w-5xl w-full mx-auto my-auto py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Context, Security & Quick Demo Accounts (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              Autenticación & Turno Operativo
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              Ingreso Seguro de Colaboradores
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed">
              Cada colaborador dispone de módulos específicos según sus atribuciones sanitarias y de tesorería (Buenas Prácticas de Oficina Farmacéutica - DIGEMID).
            </p>

            {/* Quick-Fill Cards to make evaluation instantaneous */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Cuentas Registradas (Clic para autocompletar):
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  Demostración de Roles
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                {staffUsers.map(user => {
                  const isSelected = usernameInput.toLowerCase() === user.username.toLowerCase() || usernameInput === user.dni;

                  return (
                    <div
                      key={user.id}
                      onClick={() => handleQuickFill(user)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-left ${
                        isSelected
                          ? 'bg-emerald-950/60 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 text-white ${
                          user.role === 'regente'
                            ? 'bg-emerald-600'
                            : user.role === 'admin'
                            ? 'bg-blue-600'
                            : user.role === 'cajero'
                            ? 'bg-purple-600'
                            : 'bg-amber-600'
                        }`}>
                          {user.avatarInitials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-white truncate">
                            {user.name}
                          </div>
                          <div className="text-[11px] text-emerald-400 truncate">
                            {user.roleTitle}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono font-bold block">
                          @{user.username}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {user.allowedTabs.length} módulos
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Credentials Input Form (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-400" />
                Identificación de Colaborador
              </h2>
              <p className="text-xs text-slate-400">
                Ingrese su usuario/nombre y contraseña asignada para iniciar el turno operativo.
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-700/80 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Error de autenticación:</strong>
                  {errorMessage}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field 1: Usuario / Nombre / DNI */}
              <div>
                <label className="text-slate-300 text-xs font-semibold block mb-1">
                  Nombre de Usuario, DNI o Nombre de Colaborador:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={e => {
                      setUsernameInput(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Ej: cmendoza, amorales, rdiaz, ltorres o su DNI"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>Usuarios válidos: cmendoza | amorales | rdiaz | ltorres</span>
                </div>
              </div>

              {/* Field 2: Contraseña */}
              <div>
                <label className="text-slate-300 text-xs font-semibold block mb-1">
                  Contraseña o Clave Secreta de Acceso:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={e => {
                      setPasswordInput(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Ingrese su contraseña"
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition p-1"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Nota: Puede usar la clave asignada o la clave de prueba rápida <strong className="text-emerald-400">1234</strong>
                </div>
              </div>

              {/* Field 3 & 4: Shift & Terminal in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Shift Selector */}
                <div>
                  <label className="text-slate-300 text-xs font-semibold block mb-1">
                    Turno de Trabajo Asignado:
                  </label>
                  <select
                    value={selectedShift}
                    onChange={e => setSelectedShift(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                  >
                    <option value="mañana">🌅 Turno Mañana (07:00 - 15:00)</option>
                    <option value="tarde">🌇 Turno Tarde (15:00 - 23:00)</option>
                    <option value="noche">🌙 Turno Noche (23:00 - 07:00)</option>
                  </select>
                </div>

                {/* Terminal Selector */}
                <div>
                  <label className="text-slate-300 text-xs font-semibold block mb-1">
                    Estación / Punto Asignado:
                  </label>
                  <select
                    value={selectedTerminal}
                    onChange={e => setSelectedTerminal(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                  >
                    <option value="terminal-01">Caja 01 - Mostrador Principal</option>
                    <option value="terminal-02">Caja 02 - Dispensación Rápida</option>
                    <option value="terminal-almacen">Terminal Almacén & Recepción</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-sm shadow-xl shadow-emerald-950/60 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Validar Credenciales & Iniciar Turno</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-6xl w-full mx-auto text-center text-xs text-slate-500 py-3 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>Botica Nova Salud S.A.C. • RUC 20601234567 • Lima, Perú</div>
        <div className="text-emerald-500 font-medium flex items-center gap-1.5 justify-center">
          <ShieldCheck className="w-3.5 h-3.5" /> Cumplimiento Normativo DIGEMID & Directiva Sanitaria
        </div>
      </div>
    </div>
  );
};
