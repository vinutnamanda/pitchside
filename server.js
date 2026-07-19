// Pitchside — Stadium Companion backend
// Proxies chat requests to Google Gemini (free-tier via Google AI Studio)
// so the API key never touches the browser.

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many requests — please wait a moment and try again.' }
});

app.post('/api/chat', chatLimiter, async (req, res) => {
  const { systemPrompt, message } = req.body || {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Missing or invalid message' });
  }
  if (message.length > 500) {
    return res.status(400).json({ error: 'Message too long (max 500 characters)' });
  }
  if (systemPrompt && (typeof systemPrompt !== 'string' || systemPrompt.length > 2000)) {
    return res.status(400).json({ error: 'Invalid system prompt' });
  }
  if (!GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not configured');
    return res.status(500).json({ error: 'Assistant is temporarily unavailable. Please try again later.' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt || 'You are a helpful stadium assistant.' },
          { role: 'user', content: message }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq API error:', data);
      return res.status(502).json({ error: 'The assistant is temporarily unavailable. Please try again shortly.' });
    }

    const reply = data.choices?.[0]?.message?.content || '';
    res.json({ reply: reply || "I couldn't generate a response for that — try rephrasing." });
  } catch (err) {
    console.error('Server error calling Groq:', err.message);
    res.status(500).json({ error: 'Failed to reach the assistant. Please try again.' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Pitchside running at http://localhost:${PORT}`);
  });
}

module.exports = app;
