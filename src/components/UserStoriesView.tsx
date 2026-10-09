import React, { useState } from 'react';
import { USER_STORIES } from '../data/phase1Data';
import { CheckCircle2, Bookmark, Filter, UserCheck, ShieldAlert } from 'lucide-react';

export const UserStoriesView: React.FC = () => {
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  const filteredStories = selectedPriority === 'all'
    ? USER_STORIES
    : USER_STORIES.filter(s => s.priority.includes(selectedPriority));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-emerald-500" />
            Historias de Usuario & Criterios de Aceptación Gherkin
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Especificación formal bajo estándar ágil con criterios de aceptación ejecutables para pruebas automatizadas con Jest y Playwright.
          </p>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Todas las prioridades</option>
            <option value="Alta">Solo Alta (Must Have)</option>
            <option value="Media">Solo Media (Should Have)</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {filteredStories.map((story) => (
          <div
            key={story.id}
            className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm"
          >
            {/* Story Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {story.code}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {story.module}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white ml-1">
                  {story.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                  {story.estimationStoryPoints} SP
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                  story.priority.includes('Alta')
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                }`}>
                  {story.priority}
                </span>
              </div>
            </div>

            {/* Narrative Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-1">
              <div><strong className="text-emerald-700 dark:text-emerald-400">COMO:</strong> {story.narrative.asA}</div>
              <div><strong className="text-emerald-700 dark:text-emerald-400">QUIERO:</strong> {story.narrative.iWant}</div>
              <div><strong className="text-emerald-700 dark:text-emerald-400">PARA QUE:</strong> {story.narrative.soThat}</div>
            </div>

            {/* Gherkin Criteria */}
            <div className="space-y-3 pt-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Criterios de Aceptación (Formato Gherkin BDD)
              </h4>

              <div className="grid grid-cols-1 gap-3">
                {story.acceptanceCriteria.map((crit, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 space-y-2 text-xs"
                  >
                    <div className="font-semibold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900 text-[10px] text-emerald-700 dark:text-emerald-300">
                        {idx + 1}
                      </span>
                      Escenario: {crit.scenario}
                    </div>
                    <div className="pl-6 space-y-1 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      <div><span className="text-purple-600 dark:text-purple-400 font-bold">DADO</span> {crit.given}</div>
                      <div><span className="text-sky-600 dark:text-sky-400 font-bold">CUANDO</span> {crit.when}</div>
                      <div><span className="text-emerald-600 dark:text-emerald-400 font-bold">ENTONCES</span> {crit.then}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
