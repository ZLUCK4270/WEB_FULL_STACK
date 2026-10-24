import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { useI18n } from '../../i18n/I18nContext';
import {
  Pill,
  ShieldCheck,
  Lock,
  ArrowRight,
  Globe,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Clock,
  Laptop,
  Building2,
  X
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = usePharmacy();
  const { t, language, setLanguage } = useI18n();

  // Form input states start completely empty - no prefilled usernames or passwords
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<'mañana' | 'tarde' | 'noche'>('mañana');
  const [selectedTerminal, setSelectedTerminal] = useState<string>('terminal-01');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showCredentialsHelper, setShowCredentialsHelper] = useState<boolean>(false);

  const handleQuickFill = (user: string, pass: string, shift: 'mañana' | 'tarde' | 'noche') => {
    setUsernameInput(user);
    setPasswordInput(pass);
    setSelectedShift(shift);
    setErrorMessage(null);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUser = usernameInput.trim();
    if (!cleanUser) {
      setErrorMessage(
        language === 'en'
          ? 'Please enter your username, DNI, or ID provided by the administrator.'
          : 'Por favor ingrese su usuario o DNI asignado por la administración.'
      );
      return;
    }

    if (!passwordInput.trim()) {
      setErrorMessage(
        language === 'en'
          ? 'Please enter your password.'
          : 'Por favor ingrese su contraseña de acceso.'
      );
      return;
    }

    setIsSubmitting(true);

    const result = login(cleanUser, passwordInput, selectedShift);

    if (!result.success) {
      setErrorMessage(
        result.error ||
          (language === 'en'
            ? 'Invalid credentials. Please verify with the administrator.'
            : 'Credenciales inválidas. Por favor verifique sus datos con el Administrador.')
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-950/30 via-slate-900/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Header Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Pill className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                Botica Nova Salud
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 font-bold">
                Portal Seguro
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Sistema Integral de Gestión Farmacéutica & Control Sanitario DIGEMID
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium transition cursor-pointer"
            title="Ayuda sobre acceso al sistema"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Soporte de Acceso</span>
          </button>

          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'es' ? '🇪🇸 Español' : '🇺🇸 English'}</span>
          </button>
        </div>
      </header>

      {/* Main Authentication Box */}
      <main className="max-w-md w-full mx-auto my-8 sm:my-auto">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative">
          {/* Card Header */}
          <div className="text-center pb-6 border-b border-slate-800/70">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3 shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Inicio de Sesión
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Ingrese con el usuario y contraseña provistos por la administración.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-950/80 border border-rose-700/80 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <strong className="block font-bold">Error de Acceso:</strong>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Field: Username / DNI */}
            <div>
              <label
                htmlFor="login-username"
                className="text-slate-300 text-xs font-semibold block mb-1.5"
              >
                Usuario o Documento de Identidad (DNI):
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  required
                  value={usernameInput}
                  onChange={e => {
                    setUsernameInput(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Ingrese su usuario o DNI"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700/80 bg-slate-950 text-white text-xs placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium transition"
                />
              </div>
            </div>

            {/* Field: Password */}
            <div>
              <label
                htmlFor="login-password"
                className="text-slate-300 text-xs font-semibold block mb-1.5"
              >
                Contraseña de Acceso:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={passwordInput}
                  onChange={e => {
                    setPasswordInput(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-700/80 bg-slate-950 text-white text-xs placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition p-1 cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Shift & Terminal Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label
                  htmlFor="login-shift"
                  className="text-slate-300 text-xs font-semibold block mb-1.5"
                >
                  Turno Operativo:
                </label>
                <div className="relative">
                  <select
                    id="login-shift"
                    value={selectedShift}
                    onChange={e => setSelectedShift(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-700/80 bg-slate-950 text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium cursor-pointer"
                  >
                    <option value="mañana">🌅 Turno Mañana (07:00 - 15:00)</option>
                    <option value="tarde">🌇 Turno Tarde (15:00 - 23:00)</option>
                    <option value="noche">🌙 Turno Noche (23:00 - 07:00)</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-terminal"
                  className="text-slate-300 text-xs font-semibold block mb-1.5"
                >
                  Punto / Estación:
                </label>
                <div className="relative">
                  <select
                    id="login-terminal"
                    value={selectedTerminal}
                    onChange={e => setSelectedTerminal(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-700/80 bg-slate-950 text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium cursor-pointer"
                  >
                    <option value="terminal-01">Caja 01 - Mostrador Principal</option>
                    <option value="terminal-02">Caja 02 - Dispensación Rápida</option>
                    <option value="terminal-almacen">Terminal Almacén & Recepción</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-950/60 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Validando credenciales...</span>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Collapsible Admin Accounts Directory */}
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowCredentialsHelper(prev => !prev)}
              className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-emerald-400 transition cursor-pointer"
            >
              <span>¿Ver usuarios asignados por la administración?</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-bold">
                {showCredentialsHelper ? 'Ocultar' : 'Consultar (4 perfiles)'}
              </span>
            </button>

            {showCredentialsHelper && (
              <div className="mt-3 p-3 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs space-y-2.5 animate-in fade-in">
                <p className="text-[11px] text-slate-400">
                  Cuentas activas en la base de datos de Botica Nova Salud (insertadas por el Administrador):
                </p>

                <div className="space-y-1.5">
                  {[
                    {
                      user: 'cmendoza',
                      pass: 'regente2026',
                      role: 'Farmacéutico Regente Titular',
                      name: 'Dr. Carlos Mendoza',
                      desc: 'Acceso total + Control DIGEMID'
                    },
                    {
                      user: 'amorales',
                      pass: 'caja2026',
                      role: 'Técnica en Farmacia / Cajera POS',
                      name: 'Ana Morales',
                      desc: 'Punto de venta, caja chica y clientes'
                    },
                    {
                      user: 'rdiaz',
                      pass: 'admin2026',
                      role: 'Administrador General',
                      name: 'Lic. Roberto Díaz',
                      desc: 'Gestión global, personal y auditoría'
                    },
                    {
                      user: 'ltorres',
                      pass: 'almacen2026',
                      role: 'Asistente de Almacén',
                      name: 'Luis Torres',
                      desc: 'Lotes, stock FEFO y recepción'
                    }
                  ].map(acc => (
                    <div
                      key={acc.user}
                      className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                          <span>{acc.name}</span>
                          <span className="text-[10px] text-emerald-400 font-mono">({acc.user})</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {acc.role} • {acc.desc}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleQuickFill(acc.user, acc.pass, 'mañana')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold text-[10px] transition shrink-0 cursor-pointer"
                      >
                        Cargar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Help link */}
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="text-xs text-slate-400 hover:text-emerald-400 underline underline-offset-4 transition cursor-pointer"
            >
              ¿No tiene usuario o necesita alta de nuevo colaborador?
            </button>
          </div>
        </div>

        {/* Security badges below card */}
        <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Acceso Cifrado TLS / SSL
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Auditoría de Turnos en Tiempo Real
          </span>
        </div>
      </main>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative text-slate-200">
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Asignación de Credenciales</h3>
                <p className="text-[11px] text-slate-400">Política de Seguridad DIGEMID</p>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <p>
                Los usuarios, claves y permisos del personal son gestionados e insertados
                exclusivamente por el <strong>Administrador General</strong> o el{' '}
                <strong>Químico Farmacéutico Regente</strong> desde el módulo de{' '}
                <span className="text-emerald-400 font-semibold">
                  Personal, Roles & Permisos
                </span>
                .
              </p>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Procedimiento de alta:
                </div>
                <ul className="list-disc list-inside text-slate-400 space-y-1">
                  <li>El administrador registra su nombre, DNI, rol y clave inicial.</li>
                  <li>Se le asignan los módulos que le corresponden según su cargo.</li>
                  <li>Usted ingresa con las credenciales que la botica le entregó.</li>
                </ul>
              </div>
              <p className="text-slate-400 text-[11px]">
                Si olvidó su contraseña, solicite un restablecimiento a su supervisor inmediato.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center text-xs text-slate-500 py-3 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>Botica Nova Salud S.A.C. • RUC 20601234567 • Lima, Perú</div>
        <div className="text-emerald-500 font-medium flex items-center gap-1.5 justify-center">
          <ShieldCheck className="w-3.5 h-3.5" /> Cumplimiento Normativo DIGEMID & Directiva Sanitaria N° 038-MINSA
        </div>
      </footer>
    </div>
  );
};
