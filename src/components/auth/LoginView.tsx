import React, { useState } from 'react';
import {
  Activity,
  Lock,
  UserCheck,
  ShieldCheck,
  ShoppingCart,
  Package,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { useI18n } from '../../i18n/I18nContext';

export const LoginView: React.FC = () => {
  const { login } = usePharmacy();
  const { t } = useI18n();

  const [dni, setDni] = useState('10203040');
  const [password, setPassword] = useState('regente2026');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(dni.trim(), password);
      if (!result.success) {
        setError(result.error || 'Credenciales inválidas. Verifique su DNI y contraseña.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const quickSelectRole = (roleDni: string, rolePass: string) => {
    setDni(roleDni);
    setPassword(rolePass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Left panel: Case Study & System Highlights */}
      <div className="lg:w-7/12 p-8 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-slate-900/50 backdrop-blur-sm">
        <div>
          <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Sistema Web Centralizado · DIGEMID / DIRIS BPA
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-600/30">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                Botica Nova Salud
              </h1>
              <p className="text-sm text-slate-400 font-medium">
                Plataforma Integral de Inventario FEFO, Punto de Venta y Atención Farmacéutica
              </p>
            </div>
          </div>

          <p className="text-slate-300 text-sm lg:text-base leading-relaxed mb-8 max-w-2xl">
            Solución diseñada para optimizar la dispensación farmacéutica en zonas de alta demanda,
            eliminando quiebres de stock mediante alertas automáticas, control estricto de lotes
            FEFO (<em>First-Expire, First-Out</em>) y un Punto de Venta ágil con buscador de
            bioequivalentes DCI.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90">
              <div className="flex items-center gap-2.5 text-teal-400 font-bold text-sm mb-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Despacho FEFO Automatizado
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Descuenta automáticamente del lote más próximo a vencer y bloquea lotes vencidos
                en mostrador.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm mb-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Motor de Alertas y Reposición
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Detección en tiempo real de stock crítico, agotados y vencimientos con generación
                automática de órdenes de compra.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90">
              <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm mb-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Atención Rápida y Sustitutos DCI
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Atajos de teclado, cálculo de vuelto instantáneo y sugerencia de medicamentos
                genéricos o equivalentes en 1 clic.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90">
              <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-sm mb-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Seguridad JWT y Auditoría RBAC
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Permisos granulares por rol (Químico Regente, Cajero, Almacén), bitácora inmutable
                y arqueo de caja por turno.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <span>RUC: 20608941521 · Av. Próceres de la Independencia 2450, Lima</span>
          <span className="text-teal-400 font-semibold">v2.5 Producción · Base de Datos Activa</span>
        </div>
      </div>

      {/* Right panel: Login Form + Quick Role Switcher */}
      <div className="lg:w-5/12 p-8 lg:p-14 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-white">{t('login_title')}</h2>
            <p className="text-sm text-slate-400 mt-1">
              Ingrese con su DNI o seleccione un perfil demostrativo para evaluar el sistema.
            </p>
          </div>

          <div className="mb-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Acceso Rápido por Rol (Demostración del Caso Práctico)
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => quickSelectRole('10203040', 'regente2026')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  dni === '10203040'
                    ? 'bg-teal-500/15 border-teal-500 text-white shadow-sm'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-teal-400 mb-1" />
                <div className="text-xs font-bold">Admin / Q.F.</div>
                <div className="text-[10px] text-slate-400 font-mono">DNI: 10203040</div>
              </button>

              <button
                type="button"
                onClick={() => quickSelectRole('71829304', 'caja2026')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  dni === '71829304'
                    ? 'bg-teal-500/15 border-teal-500 text-white shadow-sm'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <ShoppingCart className="w-4 h-4 text-sky-400 mb-1" />
                <div className="text-xs font-bold">Cajero POS</div>
                <div className="text-[10px] text-slate-400 font-mono">DNI: 71829304</div>
              </button>

              <button
                type="button"
                onClick={() => quickSelectRole('76543210', 'almacen2026')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  dni === '76543210'
                    ? 'bg-teal-500/15 border-teal-500 text-white shadow-sm'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <Package className="w-4 h-4 text-amber-400 mb-1" />
                <div className="text-xs font-bold">Almacén</div>
                <div className="text-[10px] text-slate-400 font-mono">DNI: 76543210</div>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                DNI del Usuario (8 dígitos)
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  maxLength={8}
                  required
                  placeholder="Ej. 10203040"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm font-mono focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Contraseña de Acceso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-sm shadow-lg shadow-teal-600/25 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Autenticando credenciales...' : t('login_btn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
