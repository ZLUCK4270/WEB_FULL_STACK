import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Customer } from '../../types/pharmacy';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  Heart,
  History,
  X
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { customers, sales, addCustomer } = usePharmacy();
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState(false);

  // New Customer Form
  const [newCustForm, setNewCustForm] = useState({
    docType: 'DNI' as 'DNI' | 'RUC',
    docNumber: '',
    fullName: '',
    phone: '',
    email: '',
    address: '',
    allergies: '',
    chronicConditions: ''
  });

  const filteredCustomers = customers.filter(c =>
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.docNumber.includes(searchTerm) ||
    c.phone.includes(searchTerm)
  );

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustForm.docNumber || !newCustForm.fullName) {
      alert('Por favor ingrese el número de documento y nombre completo.');
      return;
    }

    addCustomer({
      docType: newCustForm.docType,
      docNumber: newCustForm.docNumber,
      fullName: newCustForm.fullName,
      phone: newCustForm.phone,
      email: newCustForm.email,
      address: newCustForm.address,
      allergies: newCustForm.allergies
        ? newCustForm.allergies.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      chronicConditions: newCustForm.chronicConditions
        ? newCustForm.chronicConditions.split(',').map(s => s.trim()).filter(Boolean)
        : []
    });

    setIsNewCustModalOpen(false);
    setNewCustForm({
      docType: 'DNI',
      docNumber: '',
      fullName: '',
      phone: '',
      email: '',
      address: '',
      allergies: '',
      chronicConditions: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Pacientes & Clientes Frecuentes
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-semibold border border-indigo-300">
                Ficha Farmacoterapéutica
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registro de tratamientos crónicos, control de alergias a fármacos e historial de compras.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewCustModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          + Registrar Nuevo Paciente
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por DNI/RUC, nombre del paciente o teléfono..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60"
          />
        </div>
      </div>

      {/* Customers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map(c => {
          const customerSales = sales.filter(s => s.customerDoc === c.docNumber);

          return (
            <div
              key={c.id}
              className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    {c.fullName}
                  </h4>
                  <div className="text-xs text-slate-500 font-mono">
                    {c.docType}: {c.docNumber}
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {customerSales.length} compras
                </span>
              </div>

              {/* Allergies & Chronic Conditions */}
              <div className="space-y-1.5 text-xs">
                {c.allergies && c.allergies.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Alergias:
                    </span>
                    {c.allergies.map(alg => (
                      <span
                        key={alg}
                        className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      >
                        {alg}
                      </span>
                    ))}
                  </div>
                )}

                {c.chronicConditions && c.chronicConditions.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                      <Heart className="w-3 h-3" /> Tratamiento:
                    </span>
                    {c.chronicConditions.map(cond => (
                      <span
                        key={cond}
                        className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      >
                        {cond}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact info */}
              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{c.phone || 'Sin teléfono'}</span>
                </div>
                {c.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.address}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Nuevo Paciente */}
      {isNewCustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-500" />
                Registrar Ficha de Paciente
              </h3>
              <button
                onClick={() => setIsNewCustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Tipo Doc:
                  </label>
                  <select
                    value={newCustForm.docType}
                    onChange={e => setNewCustForm({ ...newCustForm, docType: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Número de Documento:
                  </label>
                  <input
                    type="text"
                    placeholder="41928374"
                    value={newCustForm.docNumber}
                    onChange={e => setNewCustForm({ ...newCustForm, docNumber: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nombres y Apellidos Completos:
                </label>
                <input
                  type="text"
                  placeholder="María Elena Salazar Ponce"
                  value={newCustForm.fullName}
                  onChange={e => setNewCustForm({ ...newCustForm, fullName: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Teléfono Celular:
                  </label>
                  <input
                    type="text"
                    placeholder="987 654 321"
                    value={newCustForm.phone}
                    onChange={e => setNewCustForm({ ...newCustForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Dirección:
                  </label>
                  <input
                    type="text"
                    placeholder="Av. Brasil 1420"
                    value={newCustForm.address}
                    onChange={e => setNewCustForm({ ...newCustForm, address: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Alergias Medicamentosas (separadas por coma):
                </label>
                <input
                  type="text"
                  placeholder="Penicilina, Sulfa, Aspirina"
                  value={newCustForm.allergies}
                  onChange={e => setNewCustForm({ ...newCustForm, allergies: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Enfermedades / Tratamientos Crónicos:
                </label>
                <input
                  type="text"
                  placeholder="Hipertensión Arterial, Diabetes Tipo 2"
                  value={newCustForm.chronicConditions}
                  onChange={e => setNewCustForm({ ...newCustForm, chronicConditions: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Guardar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
