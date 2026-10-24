import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Language } from '../i18n/translations';
import { User, ShieldCheck, Mail, CreditCard, Globe, CheckCircle2, X, Lock, Building, Save } from 'lucide-react';

export const UserProfileModal: React.FC = () => {
  const {
    isProfileModalOpen,
    setIsProfileModalOpen,
    userProfile,
    updateUserProfile,
    language,
    t
  } = useI18n();

  const [selectedLang, setSelectedLang] = useState<Language>(language);
  const [showSavedFeedback, setShowSavedFeedback] = useState<boolean>(false);

  if (!isProfileModalOpen) return null;

  const handleSave = () => {
    updateUserProfile({ preferredLanguage: selectedLang });
    setShowSavedFeedback(true);
    setTimeout(() => {
      setShowSavedFeedback(false);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => setIsProfileModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
            CM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('user_profile')}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {t('active_session')}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {userProfile.department}
            </p>
          </div>
        </div>

        {/* User Details Grid */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                Nombre Completo
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                {userProfile.fullName}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                {t('security_level')}
              </span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-300 block">
                {t('user_role_admin')} (SuperAdmin)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                {t('user_dni')}
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 block font-mono">
                {userProfile.dni}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                {t('user_email')}
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 block truncate">
                {userProfile.email}
              </span>
            </div>
          </div>

          {/* Language Preference Section */}
          <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  {t('user_lang_pref')}
                </label>
              </div>
              <span className="text-[10px] text-slate-500">
                Almacenado en <code>users_profile</code>
              </span>
            </div>

            {/* Language Selection Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedLang('es')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-medium border transition ${
                  selectedLang === 'es'
                    ? 'bg-white dark:bg-slate-900 border-indigo-600 text-indigo-700 dark:text-indigo-300 shadow-sm font-bold ring-2 ring-indigo-500/20'
                    : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <span className="text-base">🇪🇸</span>
                <span>{t('lang_spanish')}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedLang('en')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-medium border transition ${
                  selectedLang === 'en'
                    ? 'bg-white dark:bg-slate-900 border-indigo-600 text-indigo-700 dark:text-indigo-300 shadow-sm font-bold ring-2 ring-indigo-500/20'
                    : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <span className="text-base">🇺🇸</span>
                <span>{t('lang_english')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feedback message */}
        {showSavedFeedback && (
          <div className="mb-4 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t('saved_successfully')}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Sincronización RLS Supabase</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cerrar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-98 shadow-md shadow-indigo-600/20 transition"
            >
              <Save className="w-3.5 h-3.5" />
              {t('save_preferences')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
