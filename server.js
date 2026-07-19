const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  const { systemPrompt, message } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'Missing message' });
  }
  if (!GROQ_API_KEY) {
    return res.status(500).json({
      error: 'Server is missing GROQ_API_KEY. Add it to your .env file (see README).'
    });
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
      return res.status(502).json({ error: 'GenAI provider error', details: data.error?.message });
    }

    const reply = data.choices?.[0]?.message?.content || '';
    res.json({ reply: reply || "I couldn't generate a response for that — try rephrasing." });
  } catch (err) {
    console.error('Server error calling Groq:', err);
    res.status(500).json({ error: 'Failed to reach GenAI provider' });
  }
});

app.listen(PORT, () => {
  console.log(`Pitchside running at http://localhost:${PORT}`);
});