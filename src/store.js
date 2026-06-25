// Speicher-Schicht: Postgres wenn DATABASE_URL gesetzt ist (Render),
// sonst eine lokale JSON-Datei (einfaches lokales Entwickeln ohne DB).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const usePg = Boolean(process.env.DATABASE_URL);

let pgPool = null;

// ---------------------------------------------------------------------------
// JSON-Datei-Fallback (lokal)
// ---------------------------------------------------------------------------
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const jsonFile = path.join(dataDir, 'db.json');

function readJson() {
  try {
    const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    data.invitees = data.invitees || [];
    return data;
  } catch {
    return { rsvps: [], songs: [], invitees: [] };
  }
}

function writeJson(data) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
export async function initStore() {
  if (usePg) {
    const { default: pg } = await import('pg');
    pgPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS rsvps (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        attending BOOLEAN NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS songs (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS invitees (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    console.log('Store: PostgreSQL bereit.');
  } else {
    if (!fs.existsSync(jsonFile)) writeJson({ rsvps: [], songs: [], invitees: [] });
    console.log(`Store: JSON-Datei (${jsonFile}).`);
  }
}

// ---------------------------------------------------------------------------
// RSVP
// ---------------------------------------------------------------------------
// Eine Zusage/Absage pro Name (case-insensitive) – neuere Antwort ersetzt ältere.
export async function saveRsvp(name, attending) {
  if (usePg) {
    await pgPool.query(
      'DELETE FROM rsvps WHERE lower(name) = lower($1)',
      [name],
    );
    await pgPool.query(
      'INSERT INTO rsvps (name, attending) VALUES ($1, $2)',
      [name, attending],
    );
    return;
  }
  const db = readJson();
  db.rsvps = db.rsvps.filter((r) => r.name.toLowerCase() !== name.toLowerCase());
  db.rsvps.push({ name, attending, created_at: new Date().toISOString() });
  writeJson(db);
}

export async function listRsvps() {
  if (usePg) {
    const { rows } = await pgPool.query(
      'SELECT name, attending, created_at FROM rsvps ORDER BY created_at DESC',
    );
    return rows;
  }
  return readJson().rsvps.slice().reverse();
}

// ---------------------------------------------------------------------------
// Songwünsche
// ---------------------------------------------------------------------------
export async function listSongs() {
  if (usePg) {
    const { rows } = await pgPool.query(
      'SELECT id, title FROM songs ORDER BY created_at ASC',
    );
    return rows;
  }
  return readJson().songs;
}

export async function addSong(title) {
  if (usePg) {
    const { rows } = await pgPool.query(
      'INSERT INTO songs (title) VALUES ($1) RETURNING id, title',
      [title],
    );
    return rows[0];
  }
  const db = readJson();
  const id = (db.songs.at(-1)?.id || 0) + 1;
  const song = { id, title };
  db.songs.push(song);
  writeJson(db);
  return song;
}

export async function removeSong(id) {
  if (usePg) {
    await pgPool.query('DELETE FROM songs WHERE id = $1', [id]);
    return;
  }
  const db = readJson();
  db.songs = db.songs.filter((s) => s.id !== Number(id));
  writeJson(db);
}

// ---------------------------------------------------------------------------
// Eingeladene Kinder (Gästeliste / Whitelist)
// ---------------------------------------------------------------------------
export async function listInvitees() {
  if (usePg) {
    const { rows } = await pgPool.query(
      'SELECT id, name FROM invitees ORDER BY lower(name) ASC',
    );
    return rows;
  }
  return readJson()
    .invitees.slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

// Fügt einen Namen hinzu (ignoriert Duplikate, case-insensitive).
export async function addInvitee(name) {
  if (usePg) {
    const exists = await pgPool.query(
      'SELECT id, name FROM invitees WHERE lower(name) = lower($1)',
      [name],
    );
    if (exists.rows.length) return exists.rows[0];
    const { rows } = await pgPool.query(
      'INSERT INTO invitees (name) VALUES ($1) RETURNING id, name',
      [name],
    );
    return rows[0];
  }
  const db = readJson();
  const found = db.invitees.find(
    (i) => i.name.toLowerCase() === name.toLowerCase(),
  );
  if (found) return found;
  const id = (db.invitees.at(-1)?.id || 0) + 1;
  const invitee = { id, name };
  db.invitees.push(invitee);
  writeJson(db);
  return invitee;
}

export async function removeInvitee(id) {
  if (usePg) {
    await pgPool.query('DELETE FROM invitees WHERE id = $1', [id]);
    return;
  }
  const db = readJson();
  db.invitees = db.invitees.filter((i) => i.id !== Number(id));
  writeJson(db);
}

// Prüft, ob ein Name auf der Gästeliste steht (case-insensitive).
export async function isInvited(name) {
  if (usePg) {
    const { rows } = await pgPool.query(
      'SELECT 1 FROM invitees WHERE lower(name) = lower($1) LIMIT 1',
      [name],
    );
    return rows.length > 0;
  }
  return readJson().invitees.some(
    (i) => i.name.toLowerCase() === name.toLowerCase(),
  );
}
