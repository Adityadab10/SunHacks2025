import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [showLanguages, setShowLanguages] = useState(false);

  const languages = {
    en: 'English',
    hi: 'हिंदी',
    mr: 'मराठी'
  };

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('preferredLanguage', langCode);
    setShowLanguages(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowLanguages(!showLanguages)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-300 hover:text-white transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm">{languages[i18n.language] || languages.en}</span>
      </button>

      <AnimatePresence>
        {showLanguages && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-36 bg-gray-800/95 backdrop-blur-sm rounded-xl border border-gray-700/50 py-2 shadow-xl"
          >
            {Object.entries(languages).map(([code, name]) => (
              <button
                key={code}
                onClick={() => handleLanguageChange(code)}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#74AA9C]/20 transition-colors"
              >
                {i18n.language === code && (
                  <Check className="w-4 h-4 text-[#74AA9C]" />
                )}
                <span className={i18n.language === code ? "text-[#74AA9C]" : ""}>
                  {name}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSelector;
