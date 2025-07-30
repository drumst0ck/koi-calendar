'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

const locales = ['es', 'en', 'fr'] as const;

interface LanguageSelectorProps {
  currentLocale: string;
}

export default function LanguageSelector({ currentLocale }: LanguageSelectorProps) {
  const t = useTranslations('language');
  const [isOpen, setIsOpen] = useState(false);

  const changeLanguage = (locale: string) => {
    // Set cookie for locale
    document.cookie = `locale=${locale}; path=/; max-age=31536000`; // 1 year
    // Reload page to apply new locale
    window.location.reload();
  };

  const getLanguageName = (locale: string) => {
    switch (locale) {
      case 'es': return t('spanish');
      case 'en': return t('english');
      case 'fr': return t('french');
      default: return locale;
    }
  };

  const getFlag = (locale: string) => {
    switch (locale) {
      case 'es': return '🇪🇸';
      case 'en': return '🇺🇸';
      case 'fr': return '🇫🇷';
      default: return '🌐';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors border border-gray-600/30 hover:border-cyan-400/30"
      >
        <span className="text-lg">{getFlag(currentLocale)}</span>
        <span className="text-sm text-gray-300">{getLanguageName(currentLocale)}</span>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-gray-800/95 backdrop-blur-sm border border-gray-600/30 rounded-lg shadow-xl z-50 min-w-[150px]">
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => {
                changeLanguage(locale);
                setIsOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-700/50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                locale === currentLocale ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-300'
              }`}
            >
              <span className="text-lg">{getFlag(locale)}</span>
              <span className="text-sm">{getLanguageName(locale)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}