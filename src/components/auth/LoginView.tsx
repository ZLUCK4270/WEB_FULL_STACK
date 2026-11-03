import React, { useState } from 'react';
import {
  Activity,
  Lock,
  UserCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Layers,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { useI18n } from '../../i18n/I18nContext';
import { useCursorGlow } from '../../hooks/useMotion';

export const LoginView: React.FC = () => {
  const { login } = usePharmacy();
  const { t } = useI18n();
  useCursorGlow();

  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorTick, setErrorTick] = useState(0);
  const [loading, setLoading] = useState(false);

  const showError = (message: string) => {
    setError(message);
    setErrorTick((n) => n + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanDni = dni.trim();
    if (!cleanDni) {
      showError('Por favor, ingrese su número de DNI.');
      return;
    }

    if (!password) {
      showError('Por favor, ingrese su contraseña.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(cleanDni, password);
      if (!result.success) {
        showError(result.error || 'Credenciales inválidas. Verifique su DNI y contraseña.');
      }
    } catch (err: any) {
      showError(err.message || 'Error de conexión con el servidor de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row relative overflow-hidden">
      {/* Luces de fondo difuminadas */}
      <div
        data-parallax="1"
        className="m-float absolute -top-40 -left-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"
      />
      <div
        data-parallax="-0.8"
        className="m-float-alt absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"
      />

      {/* Panel Izquierdo: Presentación Institucional y Cumplimiento Normativo */}
      <div className="lg:w-7/12 p-8 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-slate-900/50 backdrop-blur-sm">
        <div data-stagger="90">
          <div
            data-reveal="up"
            className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-wider mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Sistema Web Centralizado · DIGEMID / DIRIS BPA
          </div>

          <div data-reveal="up" className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-600/30">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                Botica Nova Salud
              </h1>
              <p className="text-sm text-slate-400 font-medium">
                Gestión Integral de Farmacia: Inventario FEFO, Ventas POS y Control de Personal
              </p>
            </div>
          </div>

          <p data-reveal="up" className="text-slate-300 text-sm lg:text-base leading-relaxed mb-8 max-w-2xl">
            Solución tecnológica diseñada para optimizar los procesos de dispensación, control de
            inventario y atención al paciente en zonas comerciales de alta rotación, garantizando
            seguridad de la información y cumplimiento de Buenas Prácticas de Almacenamiento (BPA).
          </p>

          <div data-stagger="110" className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <div data-reveal="up" data-spotlight className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90">
              <div className="flex items-center gap-2.5 text-teal-400 font-bold text-sm mb-1">
                <Layers className="w-4 h-4 shrink-0" />
                Despacho FEFO Estricto
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prioriza automáticamente los lotes más próximos a caducar y bloquea productos vencidos.
              </p>
            </div>

            <div data-reveal="up" data-spotlight className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm mb-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Alertas de Reposición Automáticas
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Supervisión continua de quiebres de stock y generación ágil de órdenes de reabastecimiento.
              </p>
            </div>

            <div data-reveal="up" data-spotlight className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90">
              <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm mb-1">
                <Zap className="w-4 h-4 shrink-0" />
                Punto de Venta Ultra Rápido
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Búsqueda por DCI / Principio Activo, sugerencia de genéricos y cálculo instantáneo de vuelto.
              </p>
            </div>

            <div data-reveal="up" data-spotlight className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90">
              <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-sm mb-1">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                Control de Acceso RBAC & Auditoría
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Permisos asignados por el administrador para nuevos empleados (Admin, Cajero, Almacén).
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <span>RUC: 20608941521 · Av. Próceres de la Independencia 2450, Lima</span>
          <span className="text-teal-400 font-semibold">v2.5 Producción · Servidor Activo</span>
        </div>
      </div>

      {/* Panel Derecho: Formulario de Login Estándar y Seguro */}
      <div className="lg:w-5/12 p-8 lg:p-14 flex flex-col justify-center">
        <div data-reveal="left" className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-white">{t('login_title')}</h2>
            <p className="text-sm text-slate-400 mt-2">
              Ingrese su DNI y contraseña personal asignada por la administración de la botica.
            </p>
          </div>

          {error && (
            <div
              key={errorTick}
              role="alert"
              className="m-shake mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs font-medium leading-relaxed"
            >
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                DNI del Empleado (8 dígitos)
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  maxLength={8}
                  required
                  autoFocus
                  placeholder="Ingrese su número de DNI"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm font-mono placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-300">
                  Contraseña de Acceso
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Ingrese su contraseña"
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              data-magnetic="0.18"
              data-ripple
              className="m-gradient-flow w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-teal-600/25 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Autenticando credenciales...</span>
                </>
              ) : (
                <span>{t('login_btn')}</span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-300">Seguridad Institucional:</span> Las cuentas y rangos de acceso son gestionados centralizadamente por el Administrador General desde el módulo de Personal.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
