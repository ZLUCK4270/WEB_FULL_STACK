import React, { useState, useEffect, useRef } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { isTabAllowedForUser } from '../../types/pharmacy';
import { downloadSqlScript } from '../../utils/sqlScript';
import {
  Search,
  X,
  Pill,
  ShoppingCart,
  Package,
  Banknote,
  Users,
  ShieldCheck,
  FileText,
  Database,
  Activity,
  FileCode,
  BellRing,
  ArrowRight,
  Sparkles,
  Command,
  Download
} from 'lucide-react';

interface QuickCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: string) => void;
}

export const QuickCommandPalette: React.FC<QuickCommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const { products, customers, currentUser, batches } = usePharmacy();
  const [query, setQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  // All available system modules
  const allModules = [
    { id: 'dashboard', name: 'Panel Ejecutivo & Métricas', desc: 'Tendencias, ventas diarias y gráficos Recharts', icon: Sparkles },
    { id: 'pos', name: 'Punto de Venta (POS)', desc: 'Dispensación rápida con asignación automática FEFO', icon: ShoppingCart },
    { id: 'inventory', name: 'Inventario & Lotes FEFO', desc: 'Control de caducidades, mermas y exportación Excel/PDF', icon: Package },
    { id: 'cash', name: 'Caja & Arqueo', desc: 'Apertura de turno, movimientos de efectivo y cuadre', icon: Banknote },
    { id: 'customers', name: 'Pacientes & Clientes', desc: 'Fichas médicas, historial de compras y alergias', icon: Users },
    { id: 'alerts', name: 'Alertas Sanitarias', desc: 'Vencimientos críticos <30d y quiebres de stock', icon: BellRing },
    { id: 'staff', name: 'Personal & Permisos (RBAC)', desc: 'Alta de colaboradores, claves y asignación de módulos', icon: ShieldCheck },
    { id: 'reports', name: 'Reportes DIGEMID', desc: 'Libros oficiales sanitarios y psicotrópicos', icon: FileText },
    { id: 'backups', name: 'Respaldos & Base de Datos', desc: 'Copias automáticas y restauración de base de datos', icon: Database },
    { id: 'audit', name: 'Log de Actividades', desc: 'Trazabilidad y auditoría continua en tiempo real', icon: Activity },
    { id: 'sql', name: 'Scripts SQL & INSERT JOIN', desc: 'Tablas DDL, datos de semilla e inserciones relacionales', icon: FileCode }
  ];

  // Filter modules allowed for the current user matching query
  const matchingModules = allModules.filter(
    m =>
      isTabAllowedForUser(currentUser, m.id) &&
      (cleanQuery === '' ||
        m.name.toLowerCase().includes(cleanQuery) ||
        m.desc.toLowerCase().includes(cleanQuery))
  );

  // Filter products matching query
  const matchingProducts = cleanQuery
    ? products
        .filter(
          p =>
            p.name.toLowerCase().includes(cleanQuery) ||
            p.genericName.toLowerCase().includes(cleanQuery) ||
            p.code.toLowerCase().includes(cleanQuery)
        )
        .slice(0, 5)
    : [];

  // Filter customers matching query
  const matchingCustomers = cleanQuery
    ? customers
        .filter(
          c =>
            c.fullName.toLowerCase().includes(cleanQuery) ||
            c.docNumber.includes(cleanQuery)
        )
        .slice(0, 3)
    : [];

  const handleSelectModule = (tabId: string) => {
    onNavigate(tabId);
    onClose();
  };

  const handleSelectProduct = (product: any) => {
    // Navigate to POS or inventory
    if (isTabAllowedForUser(currentUser, 'pos')) {
      onNavigate('pos');
    } else {
      onNavigate('inventory');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden mt-6 sm:mt-0 flex flex-col max-h-[85vh]">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="¿Qué desea buscar? (Ej: Paracetamol, Caja, Ventas, Juan...)"
            className="w-full bg-transparent text-sm sm:text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 font-mono font-bold">
              ESC
            </kbd>
          )}
          <button
            type="button"
            onClick={onClose}
            className="sm:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto p-4 space-y-5 flex-1 divide-y divide-slate-100 dark:divide-slate-800/60">
          {/* Section: Products */}
          {matchingProducts.length > 0 && (
            <div className="space-y-2 pt-2 first:pt-0">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 px-2">
                <Pill className="w-3.5 h-3.5" />
                Medicamentos Encontrados ({matchingProducts.length})
              </span>
              <div className="space-y-1">
                {matchingProducts.map(p => {
                  const productBatches = batches.filter(
                    b => b.productId === p.id && b.status === 'active'
                  );
                  const totalStock = productBatches.reduce((acc, b) => acc + b.stock, 0);

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProduct(p)}
                      className="w-full p-2.5 rounded-2xl hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800 transition flex items-center justify-between text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {p.code.replace('MED-', '')}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                            {p.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {p.genericName} • {p.presentation}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 block">
                          S/ {p.unitPrice.toFixed(2)}
                        </span>
                        <span
                          className={`text-[10px] font-semibold ${
                            totalStock > p.minStock
                              ? 'text-slate-400'
                              : 'text-rose-500 font-bold'
                          }`}
                        >
                          Stock: {totalStock} und.
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Patients & Customers */}
          {matchingCustomers.length > 0 && (
            <div className="space-y-2 pt-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 px-2">
                <Users className="w-3.5 h-3.5" />
                Pacientes & Clientes ({matchingCustomers.length})
              </span>
              <div className="space-y-1">
                {matchingCustomers.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectModule('customers')}
                    className="w-full p-2.5 rounded-2xl hover:bg-indigo-50/70 dark:hover:bg-indigo-950/30 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition flex items-center justify-between text-left cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {c.fullName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {c.docType}: {c.docNumber} • Tel: {c.phone}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section: Modules & Pages */}
          <div className="space-y-2 pt-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-2 flex items-center justify-between">
              <span>Módulos del Sistema</span>
              {cleanQuery && <span>Coincidencias: {matchingModules.length}</span>}
            </span>

            {matchingModules.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No se encontraron módulos autorizados para &quot;{query}&quot;.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matchingModules.map(m => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectModule(m.id)}
                      className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition text-left cursor-pointer group flex items-start gap-3"
                    >
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 truncate">
                          {m.name}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">
                          {m.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer info in Command Palette */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Búsqueda instantánea en toda la botica</span>
          <div className="flex items-center gap-2">
            <span>Presione <kbd className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border text-[10px]">ESC</kbd> para salir</span>
          </div>
        </div>
      </div>
    </div>
  );
};
