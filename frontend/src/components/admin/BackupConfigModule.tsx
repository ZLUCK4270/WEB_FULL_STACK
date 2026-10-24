import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { BackupScope, BackupFrequency, BackupDestination } from '../../types/pharmacy';
import { validateBackupJson, BackupDataPayload, formatBytes } from '../../utils/backupService';
import {
  Database,
  Download,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  Sliders,
  FileCode,
  FileCheck,
  Trash2,
  Upload,
  AlertTriangle,
  Play,
  Save,
  Layers,
  ChevronRight,
  ExternalLink,
  Info,
  Check,
  Server,
  Package,
  ShoppingCart,
  Banknote,
  Eye,
  X
} from 'lucide-react';

export const BackupConfigModule: React.FC = () => {
  const {
    products,
    batches,
    sales,
    cashRegister,
    customers,
    currentUser,
    systemDate,
    backupConfig,
    backupHistory,
    updateBackupConfig,
    executeManualBackup,
    executeScheduledBackupNow,
    downloadBackupRecord,
    deleteBackupRecord,
    restoreFromBackup
  } = usePharmacy();

  // Local draft state for schedule form
  const [enabled, setEnabled] = useState<boolean>(backupConfig.enabled);
  const [frequency, setFrequency] = useState<BackupFrequency>(backupConfig.frequency);
  const [scheduledTime, setScheduledTime] = useState<string>(backupConfig.scheduledTime || '23:00');
  const [includeInventory, setIncludeInventory] = useState<boolean>(backupConfig.includeInventory);
  const [includeSales, setIncludeSales] = useState<boolean>(backupConfig.includeSales);
  const [includeCashRegister, setIncludeCashRegister] = useState<boolean>(backupConfig.includeCashRegister);
  const [includeCustomers, setIncludeCustomers] = useState<boolean>(backupConfig.includeCustomers);
  const [autoDownload, setAutoDownload] = useState<boolean>(backupConfig.autoDownload);
  const [retentionCopies, setRetentionCopies] = useState<number>(backupConfig.retentionCopies || 14);
  const [destination, setDestination] = useState<BackupDestination>(backupConfig.destination || 'local_vault');
  const [notifyOnCompletion, setNotifyOnCompletion] = useState<boolean>(backupConfig.notifyOnCompletion);

  // Status feedback
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [previewRecord, setPreviewRecord] = useState<any | null>(null);

  // Restore state
  const [restoreModalData, setRestoreModalData] = useState<BackupDataPayload | null>(null);
  const [restoreFileName, setRestoreFileName] = useState<string>('');
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const activeStockUnits = batches.reduce((acc, b) => acc + (b.status === 'active' ? b.stock : 0), 0);
  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateBackupConfig({
      enabled,
      frequency,
      scheduledTime,
      includeInventory,
      includeSales,
      includeCashRegister,
      includeCustomers,
      autoDownload,
      retentionCopies,
      destination,
      notifyOnCompletion
    });

    setStatusMessage({
      text: '¡Configuración de respaldos programados guardada correctamente en el sistema!',
      type: 'success'
    });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleManualBackup = (scope: BackupScope) => {
    setIsGenerating(true);
    setTimeout(() => {
      const record = executeManualBackup(scope, true);
      setIsGenerating(false);
      setStatusMessage({
        text: `Copia de seguridad manual "${record.filename}" generada y descargada exitosamente (${record.formattedSize}).`,
        type: 'success'
      });
      setTimeout(() => setStatusMessage(null), 6000);
    }, 400);
  };

  const handleRunScheduledNow = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const record = executeScheduledBackupNow();
      setIsGenerating(false);
      setStatusMessage({
        text: `Ejecución programada simulada con éxito: Archivo "${record.filename}" guardado en la bitácora del sistema.`,
        type: 'info'
      });
      setTimeout(() => setStatusMessage(null), 6000);
    }, 500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFileName(file.name);
    setRestoreError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = validateBackupJson(content);
      if (!result.valid || !result.data) {
        setRestoreError(result.error || 'Archivo inválido.');
        setRestoreModalData(null);
      } else {
        setRestoreModalData(result.data);
      }
    };
    reader.onerror = () => {
      setRestoreError('Error al leer el archivo desde su equipo.');
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    if (!restoreModalData) return;
    const res = restoreFromBackup(restoreModalData);
    if (res.success) {
      setStatusMessage({
        text: `Base de datos restaurada con éxito desde "${restoreFileName}".`,
        type: 'success'
      });
      setRestoreModalData(null);
      setRestoreFileName('');
      setTimeout(() => setStatusMessage(null), 6000);
    } else {
      setRestoreError(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Feedback Toast Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border shadow-sm transition animate-in fade-in duration-300 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
              : 'bg-blue-50 dark:bg-blue-950/80 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner: Status & Live Database Snapshot */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Database className="w-64 h-64 text-emerald-400" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Auditoría DIGEMID & Ciberseguridad
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                backupConfig.enabled
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                  : 'bg-amber-500/20 border-amber-400/40 text-amber-300'
              }`}>
                {backupConfig.enabled ? '● Programación Automática Activa' : '○ Respaldos Automáticos Pausados'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Database className="w-8 h-8 text-emerald-400 shrink-0" />
              Respaldos de Base de Datos & Copias de Seguridad
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Programe copias de seguridad automáticas periódicas del inventario de medicamentos, lotes FEFO y transacciones de ventas, o ejecute una descarga manual directa en formato JSON estructurado con verificación de integridad.
            </p>
          </div>

          {/* Quick Metrics of Active Database */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1">
                <Package className="w-3 h-3 text-emerald-400" />
                Catálogo & Lotes
              </span>
              <div className="text-lg font-black text-emerald-300">
                {products.length} prod. / {batches.length} lotes
              </div>
              <span className="text-[10px] text-slate-400">
                {activeStockUnits} unidades en stock
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1">
                <ShoppingCart className="w-3 h-3 text-cyan-400" />
                Transacciones
              </span>
              <div className="text-lg font-black text-cyan-300">
                {sales.length} ventas
              </div>
              <span className="text-[10px] text-slate-400">
                S/ {totalRevenue.toFixed(2)} acumulado
              </span>
            </div>

            <div className="space-y-0.5 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                Próxima Ejecución
              </span>
              <div className="text-sm font-extrabold text-amber-300">
                {backupConfig.enabled ? backupConfig.nextRunTimestamp : 'No programado'}
              </div>
              <span className="text-[10px] text-slate-400">
                Hora: {backupConfig.scheduledTime} hrs
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Zone: Manual Download Cards & Scheduled Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (7 Cols): Automatic Scheduling Configuration */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Programación Automática de Copias de Seguridad
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure la periodicidad, horario y entidades de base de datos a respaldar.
                </p>
              </div>
            </div>

            {/* Master Toggle */}
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-5">
            {/* Frequency Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                Frecuencia del Respaldo Automático:
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'daily', label: 'Diario (Cierre)', desc: 'Recomendado DIGEMID' },
                  { id: 'every_12h', label: 'Cada 12 Horas', desc: 'Cambio de turno' },
                  { id: 'every_6h', label: 'Cada 6 Horas', desc: 'Alta afluencia POS' },
                  { id: 'weekly', label: 'Semanal', desc: 'Cada 7 días' },
                  { id: 'on_cash_close', label: 'Al Cerrar Caja', desc: 'Con arqueo físico' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFrequency(item.id as BackupFrequency)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      frequency === item.id
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-600 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold">{item.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Scheduled Time & Days */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  Hora Programada de Ejecución:
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                  disabled={frequency === 'on_cash_close'}
                />
                <span className="text-[10px] text-slate-400">
                  {frequency === 'on_cash_close'
                    ? 'Disparado automáticamente al cerrar turno de caja.'
                    : 'Hora fija para disparo nocturno o rotativo.'}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
                  Política de Retención:
                </label>
                <select
                  value={retentionCopies}
                  onChange={(e) => setRetentionCopies(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value={7}>Conservar últimos 7 respaldos</option>
                  <option value={14}>Conservar últimos 14 respaldos (Recomendado)</option>
                  <option value={30}>Conservar últimos 30 respaldos (Mensual)</option>
                  <option value={60}>Conservar últimos 60 respaldos</option>
                </select>
                <span className="text-[10px] text-slate-400">
                  Las copias más antiguas se rotan automáticamente.
                </span>
              </div>
            </div>

            {/* Scope: Entities to Include */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                Módulos & Datos a Respaldar en el Archivo:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={includeInventory}
                    onChange={(e) => setIncludeInventory(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Inventario & Lotes FEFO
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Productos, códigos DCI, lotes, vencimientos y mermas.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={includeSales}
                    onChange={(e) => setIncludeSales(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Ventas & Facturación POS
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Boletas, facturas, tickets, medios de pago e importes IGV.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={includeCashRegister}
                    onChange={(e) => setIncludeCashRegister(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Movimientos de Caja & Arqueos
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Saldos de apertura, ingresos, egresos y comprobantes.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={includeCustomers}
                    onChange={(e) => setIncludeCustomers(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Directorio de Pacientes & Proveedores
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Fichas con DNI, alergias y condiciones crónicas.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Storage Destination & Notification Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-indigo-500" />
                  Destino de Almacenamiento:
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value as BackupDestination)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="local_vault">Bóveda Local Segura (Navegador/IndexedDB)</option>
                  <option value="browser_download">Descarga Automática Inmediata (.JSON)</option>
                  <option value="cloud_mirror">Bóveda Híbrida (Local + Espejo Seguro)</option>
                </select>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={autoDownload}
                    onChange={(e) => setAutoDownload(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Disparar descarga directa al ejecutarse
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={notifyOnCompletion}
                    onChange={(e) => setNotifyOnCompletion(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Enviar alerta push de confirmación
                  </span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
              <button
                type="button"
                onClick={handleRunScheduledNow}
                disabled={isGenerating}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition active:scale-95 cursor-pointer"
                title="Ejecutar el proceso programado en este instante"
              >
                <Play className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Ejecutar Programación Ahora</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-2 transition shadow-sm active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Configuración</span>
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN (5 Cols): Manual Download Cards & Restore */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Manual Download Options Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Descarga Manual de Respaldo
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Exporte instantáneamente la base de datos completa o por módulos a su computadora.
                </p>
              </div>
            </div>

            {/* Primary Manual Download Button: Full Backup */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-600" />
                  Copia Completa de Seguridad
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  Recomendado
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Incluye Inventario completo, Lotes FEFO, Historial de Ventas, Arqueo de Caja y Directorio de Clientes.
              </p>
              <button
                type="button"
                onClick={() => handleManualBackup('all')}
                disabled={isGenerating}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isGenerating ? 'Generando Respaldo...' : 'Descargar Respaldo Completo (.JSON)'}</span>
              </button>
            </div>

            {/* Granular Manual Download Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleManualBackup('inventory_only')}
                disabled={isGenerating}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/40 text-left transition group active:scale-95 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition" />
                </div>
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  Solo Inventario & FEFO
                </div>
                <div className="text-[10px] text-slate-400">
                  {products.length} productos / {batches.length} lotes
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleManualBackup('sales_only')}
                disabled={isGenerating}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500 bg-slate-50 dark:bg-slate-800/40 text-left transition group active:scale-95 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <ShoppingCart className="w-4 h-4 text-cyan-600" />
                  <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-600 transition" />
                </div>
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  Solo Ventas & Facturación
                </div>
                <div className="text-[10px] text-slate-400">
                  {sales.length} transacciones registradas
                </div>
              </button>
            </div>
          </div>

          {/* Database Restore / Import Utility Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Validación & Restauración
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cargue un archivo `.json` de respaldo previo para inspección o restauración.
                </p>
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
              <input
                type="file"
                id="restore-file-input"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="restore-file-input"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-6 h-6 text-slate-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Seleccionar archivo de respaldo (.json)
                </span>
                <span className="text-[10px] text-slate-400">
                  Verificación automática de firma SHA-256 e integridad
                </span>
              </label>
            </div>

            {restoreError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{restoreError}</span>
              </div>
            )}

            {restoreModalData && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-600">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Archivo Válido Detectado
                  </span>
                  <span className="text-slate-400 text-[10px]">{restoreModalData.metadata.backupVersion}</span>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <div><strong>Archivo:</strong> {restoreFileName}</div>
                  <div><strong>Fecha:</strong> {new Date(restoreModalData.metadata.timestamp).toLocaleString('es-PE')}</div>
                  <div><strong>Ámbito:</strong> {restoreModalData.metadata.scope}</div>
                  <div><strong>Productos:</strong> {restoreModalData.summary.totalProducts || 0} | <strong>Ventas:</strong> {restoreModalData.summary.totalSales || 0}</div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    Checksum: {restoreModalData.metadata.checksum}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmRestore}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs transition cursor-pointer"
                  >
                    Confirmar Restauración
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRestoreModalData(null);
                      setRestoreFileName('');
                    }}
                    className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BACKUP AUDIT LOG & HISTORY TABLE (Bitácora de Auditoría DIGEMID) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Bitácora de Auditoría de Copias de Seguridad
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {backupHistory.length} registros
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Historial cronológico de respaldos automáticos y manuales con firma de integridad digital.
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Retención activa: <strong>{retentionCopies} copias</strong>
          </div>
        </div>

        {backupHistory.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No se han registrado copias de seguridad previas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <tr>
                  <th className="py-3 px-4 font-bold rounded-l-xl">Archivo & Fecha</th>
                  <th className="py-3 px-4 font-bold">Tipo</th>
                  <th className="py-3 px-4 font-bold">Ámbito</th>
                  <th className="py-3 px-4 font-bold">Registros</th>
                  <th className="py-3 px-4 font-bold">Tamaño</th>
                  <th className="py-3 px-4 font-bold">Checksum SHA-256</th>
                  <th className="py-3 px-4 font-bold text-right rounded-r-xl">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {backupHistory.map((bkp) => {
                  return (
                    <tr key={bkp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <FileCode className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[220px] font-mono text-[11px]" title={bkp.filename}>
                            {bkp.filename}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(bkp.timestamp).toLocaleString('es-PE')} • Por: {bkp.createdBy}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          bkp.type === 'automatic'
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {bkp.type === 'automatic' ? 'Programado' : 'Manual'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {bkp.scope === 'all'
                          ? 'Completo (Inv + Ventas)'
                          : bkp.scope === 'inventory_only'
                          ? 'Inventario & FEFO'
                          : 'Ventas & Facturación'}
                      </td>

                      <td className="py-3.5 px-4 text-[11px]">
                        <span className="text-emerald-600 font-bold">{bkp.recordCounts.products}P</span> /{' '}
                        <span className="text-teal-600 font-bold">{bkp.recordCounts.batches}L</span> /{' '}
                        <span className="text-cyan-600 font-bold">{bkp.recordCounts.sales}V</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {bkp.formattedSize}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" title={bkp.checksum}>
                          {bkp.checksum.substring(0, 16)}...
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => downloadBackupRecord(bkp.id)}
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 transition cursor-pointer"
                            title="Descargar este archivo a su computadora"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setPreviewRecord(bkp)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                            title="Inspeccionar metadatos y contenido"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteBackupRecord(bkp.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Eliminar de la bitácora"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Inspection Modal */}
      {previewRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Inspección de Respaldo: {previewRecord.filename}
                </h3>
              </div>
              <button
                onClick={() => setPreviewRecord(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Tipo:</span>
                <strong>{previewRecord.type}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Tamaño:</span>
                <strong>{previewRecord.formattedSize}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Productos:</span>
                <strong>{previewRecord.recordCounts.products}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Ventas:</span>
                <strong>{previewRecord.recordCounts.sales}</strong>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-[11px] leading-relaxed">
              <pre>{previewRecord.payloadJson || JSON.stringify(previewRecord, null, 2)}</pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400 font-mono">
                Checksum: {previewRecord.checksum}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    downloadBackupRecord(previewRecord.id);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-500 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar Copia
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewRecord(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
