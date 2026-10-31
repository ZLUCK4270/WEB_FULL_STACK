import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  X
} from 'lucide-react';
import type { Customer } from '../../types/pharmacy';

export const CustomersView: React.FC = () => {
  const { customers, loadCustomers, createCustomer } = usePharmacy();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isNewOpen, setIsNewOpen] = useState<boolean>(false);
  const [form, setForm] = useState({
    tipoDocumento: 'DNI' as 'DNI' | 'RUC',
    numeroDocumento: '',
    nombreCompleto: '',
    telefono: '',
    correo: '',
    direccion: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtered = customers.filter((c) => {
    const t = searchTerm.toLowerCase().trim();
    if (!t) return true;
    return (
      c.nombreCompleto.toLowerCase().includes(t) ||
      c.numeroDocumento.includes(t) ||
      (c.telefono && c.telefono.includes(t))
    );
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.numeroDocumento.trim() || !form.nombreCompleto.trim()) {
      setError('Número de documento y nombre completo son obligatorios.');
      return;
    }
    const result = await createCustomer({
      tipoDocumento: form.tipoDocumento,
      numeroDocumento: form.numeroDocumento.trim(),
      nombreCompleto: form.nombreCompleto.trim(),
      telefono: form.telefono.trim(),
      correo: form.correo.trim(),
      direccion: form.direccion.trim()
    });
    if (result.success) {
      setIsNewOpen(false);
      setForm({ tipoDocumento: 'DNI', numeroDocumento: '', nombreCompleto: '', telefono: '', correo: '', direccion: '' });
      setFeedback('Cliente registrado. Ya puede asociarse a una venta en el punto de venta.');
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setError(result.error || 'Error al registrar cliente');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" /> Clientes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Fichas de clientes. Opcional en cada venta; se asocia desde el punto de venta.
          </p>
        </div>
        <button
          onClick={() => setIsNewOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
        >
          <UserPlus className="w-4 h-4" /> Nuevo cliente
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between animate-in fade-in">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-600 hover:text-emerald-800 font-bold">Cerrar</button>
        </div>
      )}

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 dark:text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o documento…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            No se encontraron clientes.
          </div>
        ) : (
          filtered.map((c: Customer) => (
            <div key={c.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white leading-snug">{c.nombreCompleto}</h4>
                  <div className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {c.tipoDocumento}: {c.numeroDocumento}
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {c.telefono && (
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /><span>{c.telefono}</span></div>
                )}
                {c.correo && (
                  <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /><span>{c.correo}</span></div>
                )}
                {c.direccion && (
                  <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" /><span>{c.direccion}</span></div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isNewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-500" /> Registrar cliente
              </h3>
              <button onClick={() => setIsNewOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>
            {error && (
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-3 h-3 shrink-0" /> {error}
              </div>
            )}
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Tipo doc:</label>
                  <select value={form.tipoDocumento} onChange={(e) => setForm({ ...form, tipoDocumento: e.target.value as 'DNI' | 'RUC' })} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Número:</label>
                  <input type="text" value={form.numeroDocumento} onChange={(e) => setForm({ ...form, numeroDocumento: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono" required />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nombres y apellidos:</label>
                <input type="text" value={form.nombreCompleto} onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Teléfono:</label>
                  <input type="text" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Correo:</label>
                  <input type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Dirección:</label>
                <input type="text" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
              </div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setIsNewOpen(false)} className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold">Guardar cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
