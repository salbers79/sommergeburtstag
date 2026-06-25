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

### Eigene Domain: `sommergeburtstag.lafete.io`

1. Im Render-Service unter **Settings → Custom Domains** → `sommergeburtstag.lafete.io` hinzufügen.
2. Render zeigt einen Zielwert an. Beim DNS-Anbieter der Domain `lafete.io` einen
   **CNAME**-Eintrag anlegen:
   `sommergeburtstag` → `<dein-service>.onrender.com` (genauer Zielwert siehe Render).
3. Render stellt automatisch ein TLS-Zertifikat aus, sobald das DNS aufgelöst wird.

Der Link-Generator im Admin-Bereich nutzt die aufgerufene Domain automatisch,
erzeugt also nach der Umstellung Links wie `https://sommergeburtstag.lafete.io/?g=…`.

## Umgebungsvariablen

| Variable         | Beschreibung                                              |
|------------------|----------------------------------------------------------|
| `ADMIN_PASSWORD` | Passwort für `/admin` (Pflicht für den Admin-Bereich).   |
| `DATABASE_URL`   | PostgreSQL-Verbindung. Fehlt sie → lokale JSON-Datei.     |
| `PORT`           | Port (Render setzt das automatisch).                     |
| `DATA_DIR`       | Ordner für die JSON-Datei im Fallback (Standard: `data`).|
