// translateRoutes.js
import express from 'express';
import axios from 'axios';
const router = express.Router();

// Supported language codes
const SUPPORTED_LANGUAGES = {
  en: 'English',
  hi: 'Hindi',
  mr: 'Marathi',
  fr: 'French'
};

// Validate language code
const isValidLanguage = (langCode) => {
  return Object.keys(SUPPORTED_LANGUAGES).includes(langCode);
};

router.post('/translate', async (req, res) => {
  const { text, targetLang } = req.body;

  // Input validation
  if (!text?.trim()) {
    return res.status(400).json({ 
      success: false,
      error: 'Text is required' 
    });
  }

  if (!targetLang) {
    return res.status(400).json({ 
      success: false,
      error: 'Target language is required' 
    });
  }

  if (!isValidLanguage(targetLang)) {
    return res.status(400).json({ 
      success: false,
      error: `Invalid target language. Supported languages: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}` 
    });
  }

  try {
    const response = await axios.post('https://d4df5616e56e.ngrok-free.app/translate', {
      q: text,
      source: 'auto',
      target: targetLang,
      format: 'text',
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    // Successful response
    res.json({
      success: true,
      data: {
        originalText: text,
        translatedText: response.data.translatedText,
        fromLanguage: response.data.detectedLanguage?.language || 'auto',
        toLanguage: targetLang,
        languageName: SUPPORTED_LANGUAGES[targetLang]
      }
    });

  } catch (err) {
    console.error('Translation error:', err.message);
    
    // Handle different types of errors
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        error: 'Translation service timeout'
      });
    }

    if (err.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.'
      });
    }

    if (err.response?.data?.error) {
      return res.status(400).json({
        success: false,
        error: err.response.data.error
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      error: 'Translation service error. Please try again later.'
    });
  }
});

export default router;
