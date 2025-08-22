// translateRoutes.js
import express from 'express';
import axios from 'axios';
const router = express.Router();

router.post('/translate', async (req, res) => {
  const { text, targetLang } = req.body;
  if (!text || !targetLang) {
    return res.status(400).json({ error: 'Missing text or targetLang' });
  }
  try {
    const response = await axios.post('https://libretranslate.com/translate', {
      q: text,
      source: 'auto',
      target: targetLang,
      format: 'text',
    }, {
      headers: { 'accept': 'application/json' }
    });
    res.json({ translatedText: response.data.translatedText });
  } catch (err) {
    res.status(500).json({ error: err.response?.data?.error || 'Translation failed' });
  }
});

export default router;
