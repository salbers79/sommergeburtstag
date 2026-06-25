import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  initStore,
  saveRsvp,
  listRsvps,
  listSongs,
  addSong,
  removeSong,
  listInvitees,
  addInvitee,
  removeInvitee,
  isInvited,
} from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

const app = express();
app.set('trust proxy', true);
app.use(express.json());

// Einladungsseite einmal einlesen (für die Vorschau-Tags)
const indexHtml = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');

// --- Eingabe-Helfer ---------------------------------------------------------
const clean = (v, max = 120) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

const escAttr = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// --- Startseite mit dynamischer Link-Vorschau (Open Graph für WhatsApp etc.) -
app.get('/', (req, res) => {
  const proto = (req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http'))
    .split(',')[0]
    .trim();
  const base = `${proto}://${req.headers.host}`;

  // Name aus dem personalisierten Link (?g=Base64) dekodieren
  let name = '';
  const g = req.query.g;
  if (typeof g === 'string') {
    try {
      name = Buffer.from(g, 'base64').toString('utf8').trim().slice(0, 80);
    } catch {
      name = '';
    }
  }

  const title = name
    ? `Einladung für ${name} 🎉`
    : 'Sommergeburtstag von Charlotte & Emilia 🎉';
  const description = name
    ? `${name}, Charlotte & Emilia feiern am 25. Juli 2026 – bist du dabei?`
    : 'Charlotte & Emilia feiern am 25. Juli 2026 ihren Sommergeburtstag. Bist du dabei?';
  const image = `${base}/img/og-preview.jpg`;
  const fullUrl = base + req.originalUrl;

  const tags = `
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Sommergeburtstag">
    <meta property="og:title" content="${escAttr(title)}">
    <meta property="og:description" content="${escAttr(description)}">
    <meta property="og:image" content="${escAttr(image)}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${escAttr(fullUrl)}">
    <meta name="description" content="${escAttr(description)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escAttr(title)}">
    <meta name="twitter:description" content="${escAttr(description)}">
    <meta name="twitter:image" content="${escAttr(image)}">
  `;

  res
    .set('Content-Type', 'text/html; charset=utf-8')
    .send(indexHtml.replace('</head>', `${tags}</head>`));
});

// --- Öffentliche API --------------------------------------------------------
app.post('/api/rsvp', async (req, res) => {
  const name = clean(req.body?.name, 80);
  const attending = Boolean(req.body?.attending);
  if (!name) return res.status(400).json({ error: 'Name fehlt.' });
  // Nur eingeladene Kinder dürfen sich anmelden
  if (!(await isInvited(name))) {
    return res.status(403).json({ error: 'not_invited' });
  }
  await saveRsvp(name, attending);
  res.json({ ok: true });
});

app.get('/api/songs', async (_req, res) => {
  res.json(await listSongs());
});

app.post('/api/songs', async (req, res) => {
  const title = clean(req.body?.title, 120);
  if (!title) return res.status(400).json({ error: 'Titel fehlt.' });
  res.json(await addSong(title));
});

app.delete('/api/songs/:id', async (req, res) => {
  await removeSong(req.params.id);
  res.json({ ok: true });
});

// --- Admin (HTTP Basic Auth) ------------------------------------------------
function adminAuth(req, res, next) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return res
      .status(503)
      .send('ADMIN_PASSWORD ist nicht gesetzt – Admin-Bereich deaktiviert.');
  }
  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    const decoded = Buffer.from(encoded, 'base64').toString();
    const pass = decoded.slice(decoded.indexOf(':') + 1);
    if (pass === password) return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="Sommergeburtstag Admin"');
  res.status(401).send('Anmeldung erforderlich.');
}

app.get('/api/admin/rsvps', adminAuth, async (_req, res) => {
  res.json(await listRsvps());
});

// Gästeliste (eingeladene Kinder) verwalten
app.get('/api/admin/invitees', adminAuth, async (_req, res) => {
  res.json(await listInvitees());
});

app.post('/api/admin/invitees', adminAuth, async (req, res) => {
  const name = clean(req.body?.name, 80);
  if (!name) return res.status(400).json({ error: 'Name fehlt.' });
  res.json(await addInvitee(name));
});

app.delete('/api/admin/invitees/:id', adminAuth, async (req, res) => {
  await removeInvitee(req.params.id);
  res.json({ ok: true });
});

app.get('/admin', adminAuth, (_req, res) => {
  res.sendFile(path.join(publicDir, 'admin.html'));
});

// --- Statische Dateien ------------------------------------------------------
app.use(express.static(publicDir));

// --- Start ------------------------------------------------------------------
const port = process.env.PORT || 3000;
initStore()
  .then(() => {
    app.listen(port, () => console.log(`Server läuft auf Port ${port}`));
  })
  .catch((err) => {
    console.error('Start fehlgeschlagen:', err);
    process.exit(1);
  });
