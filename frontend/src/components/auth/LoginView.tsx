import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Lock, ArrowRight, Eye, EyeOff, AlertCircle, HelpCircle } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = usePharmacy();

  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUser = usernameInput.trim();
    if (!cleanUser) {
      setErrorMessage('Por favor ingrese su usuario o DNI asignado por la administración.');
      return;
    }
    if (!passwordInput.trim()) {
      setErrorMessage('Por favor ingrese su contraseña de acceso.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(cleanUser, passwordInput);
      if (!result.success) {
        setErrorMessage(result.error || 'Credenciales inválidas. Verifique sus datos con el administrador.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-950/30 via-slate-900/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <header className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                Botica Nova Salud
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 font-bold">
                Acceso Seguro
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Sistema de gestión de inventario, ventas y atención al cliente.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowPassword(false)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium transition cursor-pointer"
          title="Ayuda sobre acceso al sistema"
        >
          <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Soporte de acceso</span>
        </button>
      </header>

      <main className="max-w-md w-full mx-auto my-8 sm:my-auto">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative">
          <div className="text-center pb-6 border-b border-slate-800/70">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3 shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">Inicio de Sesión</h1>
            <p className="text-xs text-slate-400 mt-1">
              Ingrese con el DNI y contraseña provistos por la administración.
            </p>
          </div>

          {errorMessage && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-950/80 border border-rose-700/80 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <strong className="block font-bold">Error de acceso:</strong> {errorMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-username" className="text-slate-300 text-xs font-semibold block mb-1.5">
                DNI / Usuario:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  required
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Ingrese su DNI"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700/80 bg-slate-950 text-white text-sm placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="text-slate-300 text-xs font-semibold block mb-1.5">
                Contraseña:
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-700/80 bg-slate-950 text-white text-sm placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition p-1 cursor-pointer"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-950/60 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>Validando credenciales...</span>
              ) : (
                <>
                  <span>Ingresar al sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center text-[11px] text-slate-500">
            Botica Nova Salud S.A.C. • Sistema de Gestión Farmacéutica
          </div>
        </div>
      </main>

      <footer className="max-w-6xl w-full mx-auto text-center text-xs text-slate-500 py-3 border-t border-slate-900">
        Acceso cifrado. Las contraseñas se almacenan hasheadas (bcrypt) y todas las acciones quedan registradas en auditoría.
      </footer>
    </div>
  );
};
