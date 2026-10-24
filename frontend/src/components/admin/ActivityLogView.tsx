import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { ActivityActionCategory, ActivitySeverity, ActivityLogEntry } from '../../types/pharmacy';
import {
  Activity,
  Search,
  Filter,
  ShoppingCart,
  Package,
  ShieldCheck,
  Banknote,
  Lock,
  Database,
  Download,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Info,
  Calendar,
  Layers,
  ArrowUpDown,
  RefreshCw,
  PlusCircle,
  Eye,
  X,
  FileSpreadsheet,
  FileCode,
  Sparkles
} from 'lucide-react';

export const ActivityLogView: React.FC = () => {
  const {
    activityLogs,
    logActivity,
    currentUser,
    staffUsers,
    systemDate,
    addQuickSale,
    adjustBatchStock,
    batches
  } = usePharmacy();

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY'>('ALL');

  // Inspection modal
  const [inspectEntry, setInspectEntry] = useState<ActivityLogEntry | null>(null);
  const [simulationToast, setSimulationToast] = useState<string | null>(null);

  // Filter computation
  const filteredLogs = useMemo(() => {
    return activityLogs.filter((entry) => {
      // Category filter
      if (selectedCategory !== 'ALL' && entry.category !== selectedCategory) {
        return false;
      }
      // Severity filter
      if (selectedSeverity !== 'ALL' && entry.severity !== selectedSeverity) {
        return false;
      }
      // User filter
      if (selectedUser !== 'ALL' && entry.userId !== selectedUser) {
        return false;
      }
      // Date filter
      if (dateFilter === 'TODAY' && entry.dateFormatted !== systemDate) {
        return false;
      }
      // Search query (action, description, userName, receipt, product, etc.)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesAction = entry.action.toLowerCase().includes(query);
        const matchesDesc = entry.description.toLowerCase().includes(query);
        const matchesUser = entry.userName.toLowerCase().includes(query);
        const matchesReceipt = entry.metadata?.receiptNumber?.toLowerCase().includes(query);
        const matchesProd = entry.metadata?.productName?.toLowerCase().includes(query);
        const matchesBatch = entry.metadata?.batchCode?.toLowerCase().includes(query);

        if (!matchesAction && !matchesDesc && !matchesUser && !matchesReceipt && !matchesProd && !matchesBatch) {
          return false;
        }
      }

      return true;
    });
  }, [activityLogs, selectedCategory, selectedSeverity, selectedUser, dateFilter, searchQuery, systemDate]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = activityLogs.length;
    const ventas = activityLogs.filter((l) => l.category === 'VENTA').length;
    const inventario = activityLogs.filter((l) => l.category === 'INVENTARIO').length;
    const permisos = activityLogs.filter((l) => l.category === 'PERMISOS').length;
    const caja = activityLogs.filter((l) => l.category === 'CAJA').length;
    const seguridad = activityLogs.filter((l) => l.category === 'SEGURIDAD' || l.category === 'RESPALDO').length;
    return { total, ventas, inventario, permisos, caja, seguridad };
  }, [activityLogs]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Fecha', 'Hora', 'Categoría', 'Acción', 'Descripción', 'Usuario', 'Rol', 'Severidad', 'Detalles'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.dateFormatted,
      l.timeFormatted,
      l.category,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${l.description.replace(/"/g, '""')}"`,
      `"${l.userName}"`,
      `"${l.userRoleTitle}"`,
      l.severity,
      `"${JSON.stringify(l.metadata || {}).replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `log_actividades_trazabilidad_${systemDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Quick Action Simulation (To watch real-time updates)
  const triggerSimulatedAction = (type: 'sale' | 'stock' | 'permission') => {
    if (type === 'sale') {
      const sale = addQuickSale();
      setSimulationToast(`¡Venta rápida registrada en tiempo real! Boleta: ${sale.receiptNumber}`);
    } else if (type === 'stock') {
      const targetBatch = batches[0];
      if (targetBatch) {
        adjustBatchStock(targetBatch.id, -1, 'Merma preventiva por inspección visual de lote');
        setSimulationToast(`¡Ajuste de inventario registrado en tiempo real en lote ${targetBatch.batchCode}!`);
      }
    } else if (type === 'permission') {
      logActivity({
        category: 'PERMISOS',
        action: 'Auditoría de Matriz de Accesos',
        description: `Verificación periódica de matriz de roles ejecutada por ${currentUser.name}. Cumplimiento con POE-04 DIGEMID.`,
        severity: 'info',
        metadata: {
          affectedUser: 'Todos los colaboradores',
          reason: 'Control rutinario de seguridad informática'
        }
      });
      setSimulationToast('¡Acción de auditoría de permisos registrada en el log en tiempo real!');
    }

    setTimeout(() => setSimulationToast(null), 4000);
  };

  const getCategoryBadge = (category: ActivityActionCategory) => {
    switch (category) {
      case 'VENTA':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          icon: ShoppingCart,
          color: 'text-emerald-600'
        };
      case 'INVENTARIO':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          icon: Package,
          color: 'text-blue-600'
        };
      case 'PERMISOS':
        return {
          bg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          icon: ShieldCheck,
          color: 'text-purple-600'
        };
      case 'CAJA':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          icon: Banknote,
          color: 'text-amber-600'
        };
      case 'SEGURIDAD':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          icon: Lock,
          color: 'text-rose-600'
        };
      case 'RESPALDO':
        return {
          bg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
          icon: Database,
          color: 'text-indigo-600'
        };
    }
  };

  const getSeverityBadge = (severity: ActivitySeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300';
      case 'warning':
        return 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300';
      case 'success':
        return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300';
      case 'info':
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert for Simulation feedback */}
      {simulationToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/90 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center justify-between shadow-md animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{simulationToast}</span>
          </div>
          <button onClick={() => setSimulationToast(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <Activity className="w-64 h-64 text-purple-400" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Auditoría & Trazabilidad Sanitaria DIGEMID
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Trazabilidad en Tiempo Real Activa
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Activity className="w-8 h-8 text-purple-400 shrink-0" />
              Log de Actividades & Acciones Críticas
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Monitoreo continuo e inmutable de operaciones críticas: emisión de comprobantes, ajustes de stock y mermas de almacén, reconfiguración de permisos de personal y movimientos de caja.
            </p>
          </div>

          {/* Quick Simulation Trigger Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block sm:inline">
              Simular Acción Crítica:
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => triggerSimulatedAction('sale')}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] transition active:scale-95 cursor-pointer shadow-xs"
                title="Generar venta rápida para ver el log actualizarse en vivo"
              >
                + Venta POS
              </button>

              <button
                type="button"
                onClick={() => triggerSimulatedAction('stock')}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[11px] transition active:scale-95 cursor-pointer shadow-xs"
                title="Descontar stock de lote por merma para ver el log en vivo"
              >
                - Merma Stock
              </button>

              <button
                type="button"
                onClick={() => triggerSimulatedAction('permission')}
                className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-[11px] transition active:scale-95 cursor-pointer shadow-xs"
                title="Registrar auditoría de permisos"
              >
                🛡️ Permisos
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Eventos
          </span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {stats.total}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">100% auditables</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block flex items-center gap-1">
            <ShoppingCart className="w-3 h-3" /> Ventas POS
          </span>
          <div className="text-xl font-black text-emerald-600 mt-1">
            {stats.ventas}
          </div>
          <span className="text-[10px] text-slate-400">Comprobantes</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block flex items-center gap-1">
            <Package className="w-3 h-3" /> Inventario & FEFO
          </span>
          <div className="text-xl font-black text-blue-600 mt-1">
            {stats.inventario}
          </div>
          <span className="text-[10px] text-slate-400">Lotes & Mermas</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Permisos RBAC
          </span>
          <div className="text-xl font-black text-purple-600 mt-1">
            {stats.permisos}
          </div>
          <span className="text-[10px] text-slate-400">Reconfiguraciones</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block flex items-center gap-1">
            <Banknote className="w-3 h-3" /> Caja & Arqueos
          </span>
          <div className="text-xl font-black text-amber-600 mt-1">
            {stats.caja}
          </div>
          <span className="text-[10px] text-slate-400">Flujos de efectivo</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block flex items-center gap-1">
            <Database className="w-3 h-3" /> Seguridad / BD
          </span>
          <div className="text-xl font-black text-indigo-600 mt-1">
            {stats.seguridad}
          </div>
          <span className="text-[10px] text-slate-400">Backups & Sesiones</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por acción, descripción, colaborador, comprobante (#B001...), medicamento o lote..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Selectors: User & Date */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="ALL">Todos los Colaboradores</option>
              {staffUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.roleTitle})
                </option>
              ))}
            </select>

            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="ALL">Todas las Severidades</option>
              <option value="success">Solo Éxito</option>
              <option value="info">Solo Informativo</option>
              <option value="warning">Solo Advertencias</option>
              <option value="critical">Solo Crítico</option>
            </select>

            <button
              type="button"
              onClick={() => setDateFilter(dateFilter === 'ALL' ? 'TODAY' : 'ALL')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                dateFilter === 'TODAY'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{dateFilter === 'TODAY' ? 'Solo Hoy' : 'Todas las Fechas'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-purple-600 dark:hover:bg-purple-600 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="Descargar registro de trazabilidad en CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Category Chips Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase">Categoría:</span>
          {[
            { id: 'ALL', label: 'Todos los Registros', icon: Activity },
            { id: 'VENTA', label: 'Ventas POS', icon: ShoppingCart },
            { id: 'INVENTARIO', label: 'Inventario & Lotes', icon: Package },
            { id: 'PERMISOS', label: 'Permisos & RBAC', icon: ShieldCheck },
            { id: 'CAJA', label: 'Caja & Arqueo', icon: Banknote },
            { id: 'SEGURIDAD', label: 'Seguridad', icon: Lock },
            { id: 'RESPALDO', label: 'Respaldos', icon: Database }
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer select-none ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-purple-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed & Timeline of Log Entries */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span>
            Mostrando <strong>{filteredLogs.length}</strong> eventos de auditoría (orden cronológico inverso):
          </span>
          <span className="text-[11px]">
            Fecha operativa activa: <strong>{systemDate}</strong>
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
            <Activity className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
              No se encontraron acciones con los filtros seleccionados
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Intente ajustar el término de búsqueda o seleccione otra categoría en los filtros superiores.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedSeverity('ALL');
                setSelectedUser('ALL');
                setDateFilter('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredLogs.map((entry) => {
              const catInfo = getCategoryBadge(entry.category);
              const CatIcon = catInfo.icon;
              const severityClass = getSeverityBadge(entry.severity);

              return (
                <div
                  key={entry.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-purple-300 dark:hover:border-purple-800 transition group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  {/* Left: Icon & Main Information */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${catInfo.bg}`}
                    >
                      <CatIcon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      {/* Top Header of the entry: Badges and Title */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {entry.action}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${catInfo.bg}`}
                        >
                          {entry.category}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${severityClass}`}
                        >
                          {entry.severity.toUpperCase()}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                        {entry.description}
                      </p>

                      {/* Metadata Chips Box */}
                      {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {entry.metadata.receiptNumber && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                              Doc: {entry.metadata.receiptNumber}
                            </span>
                          )}
                          {entry.metadata.totalAmount !== undefined && (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] border border-emerald-200 dark:border-emerald-800">
                              S/ {entry.metadata.totalAmount.toFixed(2)}
                            </span>
                          )}
                          {entry.metadata.productName && (
                            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] border border-blue-200 dark:border-blue-800">
                              Prod: {entry.metadata.productName}
                            </span>
                          )}
                          {entry.metadata.batchCode && (
                            <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] border border-indigo-200 dark:border-indigo-800">
                              Lote: {entry.metadata.batchCode}
                            </span>
                          )}
                          {entry.metadata.stockDelta !== undefined && (
                            <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-[10px] border border-amber-200 dark:border-amber-800">
                              Delta: {entry.metadata.stockDelta > 0 ? `+${entry.metadata.stockDelta}` : entry.metadata.stockDelta} uds
                            </span>
                          )}
                          {entry.metadata.affectedUser && (
                            <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[10px] border border-purple-200 dark:border-purple-800">
                              Usuario: {entry.metadata.affectedUser}
                            </span>
                          )}
                          {entry.metadata.reason && (
                            <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[10px] border border-rose-200 dark:border-rose-800">
                              Motivo: {entry.metadata.reason}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: User Information & Timestamp */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <strong className="text-slate-800 dark:text-slate-200 font-bold">{entry.userName}</strong>
                    </div>

                    <div className="text-[11px] text-slate-400 font-medium">
                      {entry.userRoleTitle}
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{entry.dateFormatted} • {entry.timeFormatted}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setInspectEntry(entry)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950 text-slate-600 dark:text-slate-300 hover:text-purple-600 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer mt-1"
                      title="Ver inspección técnica del log"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspeccionar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Technical Inspection Modal */}
      {inspectEntry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Detalle Técnico de Trazabilidad: {inspectEntry.id}
                </h3>
              </div>
              <button
                onClick={() => setInspectEntry(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Acción:</span>
                <strong className="text-slate-800 dark:text-slate-200">{inspectEntry.action}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Categoría:</span>
                <strong className="text-purple-600">{inspectEntry.category}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Colaborador:</span>
                <span>{inspectEntry.userName} ({inspectEntry.userId})</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Fecha y Hora:</span>
                <span>{inspectEntry.dateFormatted} a las {inspectEntry.timeFormatted}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">
                Cuerpo del Evento:
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                {inspectEntry.description}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">
                Metadatos Estructurados (JSON):
              </span>
              <div className="bg-slate-950 text-emerald-400 p-3 rounded-xl font-mono text-[11px] max-h-40 overflow-y-auto">
                <pre>{JSON.stringify(inspectEntry.metadata || {}, null, 2)}</pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectEntry(null)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer"
              >
                Cerrar Inspección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
