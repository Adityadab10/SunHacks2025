// TranslateText.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const languageOptions = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
];

const TranslateText = () => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [targetLang, setTargetLang] = useState('mr');
  const [translated, setTranslated] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setTranslated('');
    try {
      const res = await axios.post('/api/translate', {
        text,
        targetLang,
      });
      setTranslated(res.data.translatedText);
    } catch (err) {
      setError(err.response?.data?.error || 'Translation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-2">{t('math_summary')}</h2>
      <textarea
        className="w-full border rounded p-2 mb-2"
        rows={3}
        placeholder={t('enter_text')}
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <div className="flex items-center gap-2 mb-2">
        <label htmlFor="targetLang" className="text-sm">{t('select_language')}:</label>
        <select
          id="targetLang"
          value={targetLang}
          onChange={e => setTargetLang(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          {languageOptions.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.label}</option>
          ))}
        </select>
        <button
          onClick={handleTranslate}
          disabled={loading || !text.trim()}
          className="bg-purple-600 text-white px-3 py-1 rounded disabled:bg-purple-300"
        >
          {loading ? <span className="animate-pulse">...</span> : t('translate')}
        </button>
      </div>
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      {translated && (
        <div className="mt-2">
          <strong>{t('translated_text')}:</strong>
          <div className="bg-gray-100 p-2 rounded mt-1">{translated}</div>
        </div>
      )}
    </div>
  );
};

export default TranslateText;
