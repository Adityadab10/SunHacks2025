// LanguageSwitcher.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी', flag: '🇮🇳' },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const handleChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <div className="relative">
      <div className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 transition-colors duration-300 border border-gray-700">
        <Globe className="w-4 h-4 text-gray-300" />
        <select
          value={i18n.language}
          onChange={handleChange}
          className="bg-transparent text-gray-300 text-sm font-medium focus:outline-none cursor-pointer appearance-none pr-2"
        >
          {languages.map(lang => (
            <option 
              key={lang.code} 
              value={lang.code}
              className="bg-gray-800 text-gray-300"
            >
              {lang.flag} {lang.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
