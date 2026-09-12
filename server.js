import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { authRouter, requireAuth } from './auth.js';
import { CityCells, cellKeyFor } from './db.js';
import { generateCellData } from './demoData.js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();

app.use(express.json({ limit: '1mb' }));

app.use(
  session({
    name: 'urbandna.sid',
    secret: process.env.SESSION_SECRET || 'urban-dna-dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

// ============================================================
// AUTH API
// ============================================================

app.use('/api/auth', authRouter);

// ============================================================
// CITY DATA API
// ============================================================

app.post('/api/city-data', requireAuth, (req, res) => {
  try {
    const lat = Number(req.body?.lat);
    const lng = Number(req.body?.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({
        error: 'lat and lng are required numbers.',
      });
    }

    const key = cellKeyFor(lat, lng);

    let cell = CityCells.get(key);

    if (!cell) {
      const data = generateCellData(lat, lng);

      cell = CityCells.put({
        key,
        lat,
        lng,
        roadName: data.roadName,
        data,
      });
    }

    return res.json({
      cellKey: cell.cell_key,
      lat: cell.lat,
      lng: cell.lng,
      ...cell.data,
    });
  } catch (err) {
    console.error('city-data error:', err);

    return res.status(500).json({
      error: 'Could not generate city data.',
    });
  }
});

// ============================================================
// NVIDIA AI API
// ============================================================

app.post('/api/urban-ai', requireAuth, async (req, res) => {
  try {
    const { question, cityData, scenario } = req.body || {};

    const apiKey = process.env.NVIDIA_API_KEY;

    const model =
      process.env.NVIDIA_MODEL ||
      'nvidia/nemotron-3-super-120b-a12b';

    if (!apiKey || apiKey === 'YOUR_NVIDIA_API_KEY') {
      return res.status(500).json({
        error: 'NVIDIA_API_KEY is missing in environment variables.',
      });
    }

    const system = `
You are Urban DNA, an urban intelligence and decision-support AI.

Analyze the city as an interconnected system.

Use only supplied measurements as factual data.
Clearly label assumptions and estimates.

Explain:
- WHAT is happening
- WHY it is happening
- How factors interact
- Likely consequences
- Practical interventions

Do not invent live sensor readings.
Do not claim predictions are guaranteed.

Keep responses concise and decision-oriented.
`;

    const user = `
CITY DATA:
${JSON.stringify(cityData || {}, null, 2)}

SCENARIO:
${JSON.stringify(scenario || null, null, 2)}

USER QUESTION:
${question || 'Analyze the selected urban system.'}
`;

    const response = await fetch(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: system,
            },
            {
              role: 'user',
              content: user,
            },
          ],
          temperature: 0.2,
          top_p: 0.7,
          max_tokens: 900,
          stream: false,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.detail ||
          data?.message ||
          'NVIDIA API request failed',
      });
    }

    const answer = data?.choices?.[0]?.message?.content;

    if (!answer) {
      return res.status(502).json({
        error: 'NVIDIA returned no answer.',
      });
    }

    return res.json({
      answer,
      model,
    });
  } catch (error) {
    console.error('Urban AI error:', error);

    return res.status(500).json({
      error: error.message || 'AI request failed.',
    });
  }
});

// ============================================================
// PAGE AUTH GATE
// ============================================================

function pageGate(req, res, next) {
  const publicPaths = [
    '/login.html',
    '/src/login.js',
    '/src/login.css',
    '/favicon.ico',
  ];

  if (
    publicPaths.includes(req.path) ||
    req.path.startsWith('/@vite') ||
    req.path.startsWith('/@id') ||
    req.path.startsWith('/node_modules')
  ) {
    return next();
  }

  if (req.path === '/' || req.path === '/index.html') {
    if (!req.session?.userId) {
      return res.redirect('/login.html');
    }
  }

  return next();
}

app.use(pageGate);

// ============================================================
// START SERVER
// ============================================================

const port = Number(process.env.PORT || 5180);

async function start() {
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      host: '0.0.0.0',
    },
  });

  app.use(vite.middlewares);

  app.listen(port, '0.0.0.0', () => {
    console.log(`Urban DNA running on port ${port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start Urban DNA:', error);
  process.exit(1);
});
