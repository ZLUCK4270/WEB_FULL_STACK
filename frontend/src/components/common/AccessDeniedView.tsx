import React from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { useI18n } from '../../i18n/I18nContext';
import { getDefaultTabForUser } from '../../types/pharmacy';
import {
  ShieldAlert,
  Lock,
  ArrowLeft,
  UserCheck,
  CheckCircle2,
  XCircle,
  LogOut,
  AlertTriangle
} from 'lucide-react';

interface AccessDeniedViewProps {
  attemptedTab: string;
  onNavigate: (tabId: string) => void;
  onOpenSidebar?: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  attemptedTab,
  onNavigate,
  onOpenSidebar
}) => {
  const { currentUser, staffUsers, logout } = usePharmacy();
  const { t } = useI18n();

  const tabLabels: { [key: string]: { title: string; requiredRoles: string[]; reason: string } } = {
    dashboard: {
      title: 'Panel General Ejecutivo & Financiero',
      requiredRoles: ['Farmacéutico Regente', 'Administrador General'],
      reason: 'El módulo contiene métricas financieras de margen bruto, flujo de ingresos proyectados y utilidades netas del negocio.'
    },
    pos: {
      title: 'Punto de Venta (POS) & Dispensación',
      requiredRoles: ['Farmacéutico Regente', 'Administrador General', 'Técnica en Farmacia / Cajera'],
      reason: 'La dispensación de medicamentos y emisión de boletas/facturas electrónicas SUNAT exige certificación en atención al cliente o regencia.'
    },
    inventory: {
      title: 'Inventario Maestro & Lotes FEFO',
      requiredRoles: ['Farmacéutico Regente', 'Administrador General', 'Asistente de Almacén y Logística'],
      reason: 'El ingreso de lotes, cuarentena DIGEMID y ajuste de mermas está restringido al equipo de almacén y regencia sanitaria.'
    },
    cash: {
      title: 'Caja & Arqueo de Turno',
      requiredRoles: ['Farmacéutico Regente', 'Administrador General', 'Técnica en Farmacia / Cajera'],
      reason: 'El arqueo físico y gaveta de caudales en efectivo está restringido al personal autorizado de cobro y administración.'
    },
    purchases: {
      title: 'Compras & Droguerías',
      requiredRoles: ['Farmacéutico Regente', 'Administrador General', 'Asistente de Almacén y Logística'],
      reason: 'La emisión de órdenes de compra y recepción de guías de remisión mayoristas requiere permisos de adquisiciones o almacén.'
    },
    customers: {
      title: 'Fichas de Pacientes & Historial',
      requiredRoles: ['Farmacéutico Regente', 'Administrador General', 'Técnica en Farmacia / Cajera'],
      reason: 'Los datos de pacientes y recetas médicas retenidas están protegidos por confidencialidad clínica y venta de mostrador.'
    },
    staff: {
      title: 'Personal, Roles & Matriz de Permisos',
      requiredRoles: ['Administrador General', 'Farmacéutico Regente'],
      reason: 'La gestión de personal, asignación de turnos y modificación de credenciales es de uso exclusivo de la gerencia general.'
    },
    reports: {
      title: 'Libros Oficiales DIGEMID & SUNAT',
      requiredRoles: ['Farmacéutico Regente Titular (CQFP)'],
      reason: 'Los libros de control de sustancias psicotrópicas y estupefacientes exigen firma legal de Químico Farmacéutico con colegiatura vigente.'
    }
  };

  const moduleInfo = tabLabels[attemptedTab] || {
    title: `Módulo (${attemptedTab})`,
    requiredRoles: ['Administrador General', 'Farmacéutico Regente'],
    reason: 'Su perfil actual no dispone de los permisos requeridos para este apartado.'
  };

  const defaultHomeTab = getDefaultTabForUser(currentUser);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6 text-center sm:text-left">
        {/* Top Alert Banner */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
            <ShieldAlert className="w-9 h-9" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800 mb-1">
              <Lock className="w-3.5 h-3.5" />
              Seguridad RBAC • Acceso Restringido
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              No tiene autorización para acceder a "{moduleInfo.title}"
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Control de acceso según el Manual de Buenas Prácticas de Oficina Farmacéutica (BPOF - DIGEMID).
            </p>
          </div>
        </div>

        {/* Current Collaborator Context */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Colaborador en Sesión Actual:
            </span>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center font-bold text-sm">
                {currentUser.avatarInitials}
              </div>
              <div>
                <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {currentUser.name}
                </div>
                <div className="text-rose-600 dark:text-rose-400 font-semibold">
                  {currentUser.roleTitle}
                </div>
                <div className="text-slate-400 text-[11px]">
                  Turno: {currentUser.activeShift} • DNI: {currentUser.dni}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Roles con Autorización para este módulo:
            </span>
            <div className="space-y-1.5">
              {moduleInfo.requiredRoles.map((roleName, idx) => (
                <div key={idx} className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{roleName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Explanation Reason */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Norma Sanitaria & Política de Seguridad:</span>
            {moduleInfo.reason}
          </div>
        </div>

        {/* Allowed Modules for this user */}
        <div className="space-y-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium block">
            Módulos autorizados para su perfil actual ({currentUser.allowedTabs.length}):
          </span>
          <div className="flex flex-wrap gap-2">
            {currentUser.allowedTabs.map(tab => (
              <button
                key={tab}
                onClick={() => onNavigate(tab)}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 font-bold transition text-xs capitalize flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Ir a {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => onNavigate(defaultHomeTab)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a mi módulo principal ({defaultHomeTab.toUpperCase()})</span>
          </button>

          <button
            onClick={logout}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Cerrar Sesión & Cambiar de Usuario</span>
          </button>
        </div>
      </div>
    </div>
  );
};
