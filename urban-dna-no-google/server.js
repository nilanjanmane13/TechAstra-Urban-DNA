import express from 'express';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
app.use(express.json({ limit: '1mb' }));

app.post('/api/urban-ai', async (req, res) => {
  try {
    const { question, cityData, scenario } = req.body || {};
    const apiKey = process.env.NVIDIA_API_KEY;
    const model = process.env.NVIDIA_MODEL || 'nvidia/nemotron-3-super-120b-a12b';

    if (!apiKey || apiKey === 'YOUR_NVIDIA_API_KEY') {
      return res.status(500).json({ error: 'NVIDIA_API_KEY is missing in .env.local' });
    }

    const system = `You are Urban DNA, an urban intelligence and decision-support AI.
Analyze a connected city as a system. Use only the supplied data as factual measurements; clearly label estimates or assumptions.
Your job is to explain WHAT is happening, WHY it is happening, HOW factors interact, and WHAT could happen under a proposed intervention.
Prioritize practical, concise recommendations for city operators.
Do not invent live sensor data. Never claim that a prediction is guaranteed.
Return plain text with these headings when useful: Assessment, Key Drivers, Predicted Consequences, Recommendation.`;

    const user = `CITY DATA:
${JSON.stringify(cityData || {}, null, 2)}

SCENARIO:
${JSON.stringify(scenario || null, null, 2)}

USER QUESTION:
${question || 'Analyze the selected corridor.'}`;

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 1.0,
        top_p: 0.95,
        reasoning_effort: 'low',
        max_tokens: 900,
        stream: false
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.detail || data?.message || 'NVIDIA API request failed',
        details: data
      });
    }

    const answer = data?.choices?.[0]?.message?.content;
    if (!answer) return res.status(502).json({ error: 'NVIDIA returned no answer.' });

    res.json({ answer, model });
  } catch (error) {
    console.error('Urban AI error:', error);
    res.status(500).json({ error: error.message || 'AI request failed.' });
  }
});

const vite = await createViteServer({
  server: { middlewareMode: true, host: '127.0.0.1', port: 5180 }
});
app.use(vite.middlewares);

app.listen(5180, '127.0.0.1', () => {
  console.log('Urban DNA running at http://127.0.0.1:5180/');
});
