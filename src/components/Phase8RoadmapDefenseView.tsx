import React, { useState } from 'react';
import { SPRINT_WEEKS, JURY_SPEECH_BLOCKS, JURY_QA_CARDS, SprintWeek, JurySpeechBlock } from '../data/phase8RoadmapData';
import { Calendar, Award, DollarSign, Clock, CheckCircle2, ChevronRight, HelpCircle, ShieldCheck, Zap, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';

export const Phase8RoadmapDefenseView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'roadmap_12w' | 'speech_teleprompter' | 'business_roi' | 'qa_flashcards'>('roadmap_12w');
  const [selectedSprintFilter, setSelectedSprintFilter] = useState<string>('all');
  const [activeSpeechIndex, setActiveSpeechIndex] = useState<number>(0);

  const filteredWeeks = selectedSprintFilter === 'all'
    ? SPRINT_WEEKS
    : SPRINT_WEEKS.filter(w => w.sprint.includes(selectedSprintFilter));

  const currentSpeechBlock = JURY_SPEECH_BLOCKS[activeSpeechIndex];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              Fase 8: Planificación & Sustentación Final
            </span>
            <span className="text-xs text-slate-500">Cronograma 12 Semanas + Guion de Título</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500" />
            Cronograma de Implementación (12 Semanas) & Guion de Defensa ante el Jurado
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Estructuración ágil en 6 Sprints, justificación de decisiones técnicas, cálculo de ROI y guion ensayado para la sustentación.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveSubTab('roadmap_12w')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'roadmap_12w'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            Cronograma 12 Semanas
          </button>
          <button
            onClick={() => setActiveSubTab('speech_teleprompter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'speech_teleprompter'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            Guion de Sustentación (5 Min)
          </button>
          <button
            onClick={() => setActiveSubTab('business_roi')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'business_roi'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-blue-500" />
            Valor Comercial & ROI
          </button>
          <button
            onClick={() => setActiveSubTab('qa_flashcards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'qa_flashcards'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
            Preguntas del Jurado
          </button>
        </div>
      </div>

      {/* SUBTAB 1: CRONOGRAMA DE 12 SEMANAS */}
      {activeSubTab === 'roadmap_12w' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Sprint Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Filtrar por Sprint Metodológico:
            </span>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                { id: 'all', label: 'Todas las Semanas (1 a 12)' },
                { id: 'Sprint 1', label: 'Sprint 1 (Sem 1-2)' },
                { id: 'Sprint 2', label: 'Sprint 2 (Sem 3-4)' },
                { id: 'Sprint 3', label: 'Sprint 3 (Sem 5-6)' },
                { id: 'Sprint 4', label: 'Sprint 4 (Sem 7-8)' },
                { id: 'Sprint 5', label: 'Sprint 5 (Sem 9-10)' },
                { id: 'Sprint 6', label: 'Sprint 6 (Sem 11-12)' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSprintFilter(s.id)}
                  className={`px-2.5 py-1 rounded-lg transition font-medium ${
                    selectedSprintFilter === s.id
                      ? 'bg-amber-600 text-white font-semibold shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWeeks.map((week) => (
              <div
                key={week.week}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-sm hover:border-amber-400 dark:hover:border-amber-600 transition"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Semana {week.week}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {week.sprint.split(':')[0]}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {week.phaseTitle}
                  </h4>
                </div>

                {/* Deliverables */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Entregables de la Semana:
                  </span>
                  {week.deliverables.map((d, di) => (
                    <div key={di} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>

                {/* Milestone */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
                  <strong className="text-amber-700 dark:text-amber-300 block text-[11px]">Hito de Control:</strong>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">{week.milestone}</p>
                </div>

                <div className="text-[10px] text-slate-400 italic">
                  <strong>Mitigación:</strong> {week.riskMitigation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2: GUION DE SUSTENTACIÓN TELEPROMPTER */}
      {activeSubTab === 'speech_teleprompter' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Timeline bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {JURY_SPEECH_BLOCKS.map((block, idx) => (
              <button
                key={block.id}
                onClick={() => setActiveSpeechIndex(idx)}
                className={`p-3 rounded-xl border text-left transition ${
                  activeSpeechIndex === idx
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-slate-900 dark:text-white ring-1 ring-emerald-500 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                  {block.timeRange}
                </span>
                <span className="font-bold text-xs line-clamp-1 mt-0.5">
                  {block.title}
                </span>
              </button>
            ))}
          </div>

          {/* Teleprompter Card */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Bloque {activeSpeechIndex + 1} de 5 • Tiempo Estimado: {currentSpeechBlock.timeRange}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {currentSpeechBlock.title}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Rol: {currentSpeechBlock.speakerRole}
              </span>
            </div>

            {/* Script Text */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Palabras Textuales a Pronunciar ante el Jurado:
              </span>
              <p className="text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 font-sans italic">
                "{currentSpeechBlock.script}"
              </p>
            </div>

            {/* Bullet arguments & visual cue */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] block">
                  Puntos Técnicos a Enfatizar:
                </span>
                {currentSpeechBlock.keyArguments.map((arg, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{arg}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-1.5">
                <span className="font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider text-[10px] block">
                  Acción Visual en Pantalla (Demo en Vivo):
                </span>
                <p className="text-amber-800 dark:text-amber-200">
                  {currentSpeechBlock.visualCue}
                </p>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                disabled={activeSpeechIndex === 0}
                onClick={() => setActiveSpeechIndex(prev => Math.max(0, prev - 1))}
                className="px-3 py-1.5 rounded-lg border text-xs font-semibold disabled:opacity-40 transition"
              >
                Anterior
              </button>
              <span className="text-xs text-slate-500">
                Paso {activeSpeechIndex + 1} de {JURY_SPEECH_BLOCKS.length}
              </span>
              <button
                disabled={activeSpeechIndex === JURY_SPEECH_BLOCKS.length - 1}
                onClick={() => setActiveSpeechIndex(prev => Math.min(JURY_SPEECH_BLOCKS.length - 1, prev + 1))}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold disabled:opacity-40 transition"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: VALOR COMERCIAL & RETORNO DE INVERSIÓN (ROI) */}
      {activeSubTab === 'business_roi' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6 shadow-sm animate-fadeIn">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Impacto Económico Demostrable
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              Justificación de Negocio & Retorno de Inversión (ROI)
            </h3>
            <p className="text-xs text-slate-500">
              Métricas cuantitativas que justifican la adopción del software ante el propietario y el jurado examinador.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1">
              <span className="text-xs text-slate-500">Ahorro en Mermas Caducadas</span>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">S/ 3,850/mes</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Erradicación de pérdidas gracias al algoritmo FEFO obligatorio.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-sky-300 dark:border-sky-900 bg-sky-50/50 dark:bg-sky-950/20 space-y-1">
              <span className="text-xs text-slate-500">Ventas Recuperadas</span>
              <div className="text-2xl font-bold text-sky-700 dark:text-sky-300">+22% Facturación</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Eliminación de quiebres imprevistos con alertas a 30/60/90 días.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 space-y-1">
              <span className="text-xs text-slate-500">Tiempo de Atención Mostrador</span>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">-75% Tiempo</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Reducción de 4-6 minutos a solo 45 segundos por transacción.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-purple-300 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20 space-y-1">
              <span className="text-xs text-slate-500">Costo de Servidores Cloud</span>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">$0.00 / mes</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Aprovechamiento integral de Free Tiers de Supabase, Render y Vercel.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Cálculo del Período de Recuperación (Payback Period):
            </h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Considerando que una botica de alta afluencia pierde en promedio <strong>S/ 46,200 anuales</strong> entre medicamentos vencidos no rotados y ventas perdidas por falta de stock, la inversión de implementación se recupera en las primeras <strong>6 semanas</strong> de operación continua.
            </p>
          </div>
        </div>
      )}

      {/* SUBTAB 4: PREGUNTAS CLAVE DEL JURADO */}
      {activeSubTab === 'qa_flashcards' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm animate-fadeIn">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Banco de Respuestas Técnicas
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              Defensa de Preguntas Críticas del Jurado Examinador
            </h3>
            <p className="text-xs text-slate-500">
              Respuestas estructuradas con sustento en patrones de diseño, estándares de seguridad y normativa farmacéutica.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {JURY_QA_CARDS.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 space-y-2 text-xs"
              >
                <div className="flex items-start gap-2 font-bold text-slate-900 dark:text-white">
                  <span className="text-purple-600 shrink-0">P{idx + 1}:</span>
                  <span>{item.q}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 pl-4 border-l-2 border-purple-500 leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
