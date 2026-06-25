import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  initStore,
  saveRsvp,
  listRsvps,
  listSongs,
  addSong,
  removeSong,
} from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

const app = express();
app.use(express.json());

// --- Eingabe-Helfer ---------------------------------------------------------
const clean = (v, max = 120) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

// --- Öffentliche API --------------------------------------------------------
app.post('/api/rsvp', async (req, res) => {
  const name = clean(req.body?.name, 80);
  const attending = Boolean(req.body?.attending);
  if (!name) return res.status(400).json({ error: 'Name fehlt.' });
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
