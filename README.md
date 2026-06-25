# Sommergeburtstag 🎉

Einladungs-App zum Sommergeburtstag von Charlotte & Emilia (25. Juli 2026).
Node.js/Express-App mit zentraler Sammlung von Zu-/Absagen (RSVP) und Musikwünschen.

## Funktionen

- **Einladungskarte** (`/`) mit Countdown, persönlicher Begrüßung über Link-Parameter,
  RSVP-Buttons und Musikwunsch-Liste.
- **Zentrale Speicherung**: RSVPs und Songwünsche landen auf dem Server (für alle sichtbar),
  nicht nur im Browser des Gastes.
- **Gästeliste** (`/admin`) – passwortgeschützt, zeigt alle Antworten mit Statistik.
- **Link-Generator** für personalisierte Einladungslinks.

## Lokal starten

```bash
npm install
npm run dev        # oder: npm start
```

Läuft auf http://localhost:3000. Ohne `DATABASE_URL` werden die Daten in
`data/db.json` gespeichert (ideal zum lokalen Testen).

Admin-Bereich testen:

```bash
ADMIN_PASSWORD=geheim npm start
```

Dann `http://localhost:3000/admin` öffnen (Benutzername beliebig, Passwort = `geheim`).

## Deployment auf Render.com

1. Repo zu GitHub pushen.
2. Auf Render **New → Blueprint** wählen und das Repo auswählen –
   `render.yaml` legt Web-Service **und** eine kostenlose PostgreSQL-Datenbank an.
3. Beim Anlegen nach dem Wert für **`ADMIN_PASSWORD`** fragen lassen und ein Passwort setzen.
4. Fertig – die App ist unter der Render-URL erreichbar, die Gästeliste unter `…/admin`.

`DATABASE_URL` wird automatisch aus der angelegten Datenbank verbunden.

## Umgebungsvariablen

| Variable         | Beschreibung                                              |
|------------------|----------------------------------------------------------|
| `ADMIN_PASSWORD` | Passwort für `/admin` (Pflicht für den Admin-Bereich).   |
| `DATABASE_URL`   | PostgreSQL-Verbindung. Fehlt sie → lokale JSON-Datei.     |
| `PORT`           | Port (Render setzt das automatisch).                     |
| `DATA_DIR`       | Ordner für die JSON-Datei im Fallback (Standard: `data`).|
