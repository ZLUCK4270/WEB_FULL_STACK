import React from 'react';
import { ARCHITECTURE_LAYERS } from '../data/phase1Data';
import { Award, CheckCircle2, ShieldCheck, Database, Layers, Server, Zap, HelpCircle } from 'lucide-react';

export const TechDecisionsView: React.FC = () => {
  const defenseQnA = [
    {
      q: '¿Por qué separar Next.js (frontend) y NestJS (backend) en vez de usar únicamente los Route Handlers de Next.js?',
      a: '1. Desacoplamiento de dominios: La lógica crítica de control de inventario farmacéutico, bloqueo pesimista de lotes y cron jobs de alertas a las 06:00 AM requiere un proceso de Node.js persistente y de larga duración, incompatible con la naturaleza Serverless efímera de los API routes de Next.js. 2. Arquitectura empresarial modular: NestJS impone el patrón de Inyección de Dependencias (DI) y decoradores tipados que garantizan un código fácil de auditar, probar con Jest y defender ante un jurado.'
    },
    {
      q: '¿Por qué la clave "service_role" de Supabase jamás debe llegar al cliente web?',
      a: 'La clave service_role tiene el poder de evadir completamente todas las políticas de Row Level Security (RLS) en PostgreSQL. Si se incluyese en el bundle de Next.js, cualquier usuario podría inspeccionar el código, extraer la clave y modificar precios o eliminar auditorías. En nuestra arquitectura, el frontend solo utiliza la clave pública "anon" con RLS, y todas las operaciones privilegiadas se canalizan a través de NestJS bajo estrictos Guards.'
    },
    {
      q: '¿Cómo se garantiza que el sistema sea 100% viable y ejecutable con servicios gratuitos?',
      a: 'El stack ha sido diseñado para operar con cero costos operativos: 1. Supabase Free Tier incluye hasta 500MB de base de datos PostgreSQL, 50,000 usuarios activos mensuales y WebSockets Realtime ilimitados para pequeñas y medianas farmacias. 2. Vercel Hobby aloja el frontend Next.js de forma gratuita con CDN global. 3. Render o Railway ofrecen instancias gratuitas/bajas para ejecutar el contenedor NestJS y sus cron jobs.'
    },
    {
      q: '¿Cuál es la ventaja de implementar FEFO en base de datos en lugar de ordenar en memoria en el frontend?',
      a: 'El ordenamiento en memoria en el cliente genera graves condiciones de carrera (Race Conditions) ante múltiples mostradores. Al ejecutar el FEFO dentro de una transacción serializable en PostgreSQL con SELECT FOR UPDATE, el motor bloquea físicamente las tuplas de los lotes seleccionados, garantizando la consistencia ACID de que dos cajeros no venderán el mismo blíster simultáneamente.'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="h-6 w-6 text-emerald-500" />
          Justificación Técnica para la Sustentación ante el Jurado
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Argumentos técnicos sólidos de ingeniería de software, arquitectura de sistemas y viabilidad económica.
        </p>
      </div>

      {/* Capas Arquitectónicas Justificadas */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Justificación por Capas del Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ARCHITECTURE_LAYERS.map((layer, idx) => (
            <div key={idx} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {layer.layer}
                </span>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {layer.technology}
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>Defensa:</strong> {layer.defenseReason}
              </p>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Medidas de Seguridad:</span>
                {layer.securityMeasures.map((m, mi) => (
                  <div key={mi} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{m}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preguntas Frecuentes del Jurado */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-500" />
          Guion de Preguntas Clave & Respuestas para Defensa de Título
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {defenseQnA.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 text-xs">
              <h5 className="font-bold text-slate-900 dark:text-white flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold shrink-0">P{idx + 1}:</span>
                {item.q}
              </h5>
              <p className="text-slate-600 dark:text-slate-300 pl-4 border-l-2 border-emerald-500">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
