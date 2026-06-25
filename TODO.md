# TODO – Sommergeburtstag App

Branch: `feature/render-backend`

## Erledigt ✅
- [x] Express-Server mit statischer Auslieferung (`src/server.js`)
- [x] Speicher-Schicht: PostgreSQL (Render) + JSON-Datei-Fallback (lokal) (`src/store.js`)
- [x] RSVP-API (POST `/api/rsvp`) + zentrale Speicherung
- [x] Musikwunsch-API (GET/POST/DELETE `/api/songs`)
- [x] Passwortgeschützte Gästeliste `/admin` (HTTP Basic Auth)
- [x] Einladungsseite an API angebunden (`public/index.html`)
- [x] Hintergrund auf helles Grau umgestellt (globale Vorgabe)
- [x] `render.yaml` (Web-Service + kostenlose PostgreSQL-DB)
- [x] README mit Deploy-Anleitung

## Offen / Ideen 💡
- [ ] Auf GitHub pushen und auf Render als Blueprint deployen
- [ ] `ADMIN_PASSWORD` auf Render setzen
- [ ] Custom Domain `sommerfest.lafete.io` in Render + CNAME beim DNS-Anbieter einrichten
- [ ] Optional: Ort der Veranstaltung serverseitig statt nur lokal speichern
- [ ] Optional: E-Mail-Benachrichtigung an die Eltern bei neuer Zusage
- [ ] Optional: Musikwünsche im Admin-Bereich anzeigen
- [ ] Optional: Doppelte Songwünsche verhindern
