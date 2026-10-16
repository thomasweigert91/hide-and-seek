# 🥷 Hide & Seek

Ein Echtzeit-Multiplayer-Versteckspiel für zwei Spieler im Browser. Ein **Sucher** (👁️) jagt einen **Verstecker** (🥷) über ein zufällig generiertes Spielfeld – unter Nebel des Krieges, mit rutschigem Eis, zähem Schlamm und Zeit-Items.

Das Projekt ist ein npm-Workspaces-Monorepo aus einem **Next.js**-Frontend, einem **NestJS**-Backend mit **Socket.IO** und einem gemeinsamen **Drizzle ORM**-Datenbankpaket.

---

## Inhaltsverzeichnis

- [Spielprinzip](#spielprinzip)
- [Features](#features)
- [Tech-Stack](#tech-stack)
- [Projektstruktur](#projektstruktur)
- [Voraussetzungen](#voraussetzungen)
- [Installation](#installation)
- [Konfiguration](#konfiguration)
- [Entwicklung starten](#entwicklung-starten)
- [Verfügbare Skripte](#verfügbare-skripte)
- [Architektur](#architektur)
- [Socket.IO-Events](#socketio-events)
- [Datenbank](#datenbank)
- [Tests & Linting](#tests--linting)
- [Bekannte Einschränkungen](#bekannte-einschränkungen)

---

## Spielprinzip

1. Ein Spieler erstellt in der Lobby einen Raum (Name + Spielfeldgröße) und wird automatisch zum **Sucher**.
2. Ein zweiter Spieler tritt über die Raumliste oder einen geteilten Einladungslink bei und wird zum **Verstecker**.
3. Sobald beide Spieler im Raum sind, startet die Runde:
   - Der Sucher startet oben links `(0, 0)`, der Verstecker unten rechts.
   - Bewegt wird mit den **Pfeiltasten** (↑ ↓ ← →).
   - Jeder Spieler sieht nur die Felder in seinem direkten Umfeld (Sichtradius 1, also ein 3×3-Bereich). Der Rest des Feldes liegt im Nebel.
4. **Siegbedingungen:**
   - 👁️ Der **Sucher gewinnt**, wenn er auf dasselbe Feld wie der Verstecker gelangt.
   - 🥷 Der **Verstecker gewinnt**, wenn der Timer (Start: 60 Sekunden) abläuft.
   - Verlässt ein Spieler eine laufende Partie, gewinnt der verbleibende Spieler.
5. Nach Spielende kann über **„Nochmal spielen“** eine neue Runde gestartet werden – dabei werden die Rollen getauscht und eine neue Karte generiert.

### Feldtypen

| Feld | Darstellung | Wirkung |
| --- | --- | --- |
| **Boden** (`FLOOR`) | dunkles Schachbrettmuster | normal begehbar |
| **Wand** (`WALL`) | hellgrau | blockiert die Bewegung |
| **Eis** (`ICE`) | bläulich | der Spieler rutscht in Bewegungsrichtung weiter (alle 200 ms ein Feld), bis er auf Nicht-Eis, eine Wand oder den Rand trifft |
| **Schlamm** (`MUD`) | braun | der Spieler steckt nach dem Betreten 1,2 Sekunden fest |

Die Karte wird zufällig erzeugt (ca. 15 % Wände, 7 % Eis, 8 % Schlamm). Die Startbereiche (je 2×2 Felder) bleiben frei, und per Breitensuche wird sichergestellt, dass ein Weg zwischen beiden Startpunkten existiert.

### Items

Auf jeder Karte liegen **3 Zeit-Items** (⏱️). Wer eines einsammelt, beeinflusst den Timer:

- **Sucher:** +10 Sekunden
- **Verstecker:** −10 Sekunden (mindestens 1 Sekunde bleibt übrig)

Items sind – wie die Spieler – nur innerhalb des eigenen Sichtradius sichtbar.

### Spielfeldgrößen

| Größe | Bezeichnung |
| --- | --- |
| 8 × 8 | Compact |
| 10 × 10 | Standard (Default) |
| 12 × 12 | Medium |
| 15 × 15 | Large |

---

## Features

- 🏠 **Live-Lobby** mit Raumliste, Status (wartet / im Spiel) und Spielerzahl – aktualisiert in Echtzeit
- 🔗 **Einladungslink** zum Kopieren für den Raum-Host
- 🎲 **Prozedural generierte Karten** mit garantiertem Lösungsweg
- 🌫️ **Fog of War** – jeder Spieler sieht nur sein Umfeld
- 🧊 **Spezialfelder** (Eis, Schlamm) und ⏱️ **Zeit-Items**
- ⏲️ **Server-seitiger Timer** und serverseitige Spiellogik (autoritativer Server)
- 🔁 **Restart mit Rollentausch**
- 🔊 **Soundeffekte** für Schritte und Item-Pickups (via Howler.js)
- 🔐 Login-/Registrierungsseite mit **Supabase Auth** (in Vorbereitung)

---

## Tech-Stack

| Bereich | Technologien |
| --- | --- |
| **Frontend** | [Next.js 16](https://nextjs.org) (App Router), React 19, React Compiler, [Tailwind CSS 4](https://tailwindcss.com), [Zustand](https://zustand-demo.pmnd.rs/) (State), [socket.io-client](https://socket.io), [Howler.js](https://howlerjs.com) (Audio), [Supabase JS](https://supabase.com/docs/reference/javascript) (Auth) |
| **Backend** | [NestJS 12](https://nestjs.com), `@nestjs/websockets` + [Socket.IO](https://socket.io) |
| **Datenbank** | PostgreSQL (z. B. [Supabase](https://supabase.com)), [Drizzle ORM](https://orm.drizzle.team) + drizzle-kit, `postgres` (postgres.js) |
| **Tooling** | npm Workspaces, TypeScript, concurrently, Jest, oxlint, Prettier, ESLint |

---

## Projektstruktur

```
hide-and-seek/
├── backend/                     # NestJS-Server (Spiellogik + WebSockets)
│   ├── src/
│   │   ├── main.ts              # Bootstrap, lauscht auf PORT (Default 8000)
│   │   ├── app.module.ts
│   │   └── events/
│   │       ├── events.gateway.ts   # Socket.IO-Gateway: Lobby, Räume, Timer, Moves
│   │       └── events.service.ts   # Spielzustand, Kartengenerierung, Bewegung, Items
│   └── test/                    # E2E-Tests
│
├── frontend/                    # Next.js-Client
│   ├── public/sounds/           # Soundeffekte (footstep.ogg, pickupCoin.wav)
│   └── src/
│       ├── app/
│       │   ├── page.tsx                 # Lobby / Raumübersicht
│       │   ├── lobby/[roomId]/page.tsx  # Spielraum
│       │   └── login/page.tsx           # Login / Registrierung (Supabase)
│       ├── components/
│       │   ├── CreateRoomForm.tsx
│       │   ├── RoomList.tsx
│       │   ├── GameBoard.tsx    # Spielfeld inkl. Fog of War
│       │   └── Tile.tsx         # Einzelnes Feld (Terrain + Item)
│       ├── hooks/
│       │   ├── useKeyboardMovement.ts   # Pfeiltasten → "move"-Event
│       │   └── useGameSounds.ts         # Schrittgeräusche
│       ├── lib/
│       │   ├── sound.ts         # Howler-Sounds
│       │   └── supabase.ts      # Supabase-Client
│       └── store/
│           └── useGameStore.ts  # Zustand-Store inkl. Socket-Verbindung
│
├── packages/
│   └── db/                      # @hide-and-seek/db – geteiltes Drizzle-Paket
│       ├── src/
│       │   ├── client.ts        # Lazy-initialisierter DB-Client
│       │   ├── schema/          # Tabellen-Definitionen
│       │   └── test-connection.ts
│       ├── drizzle/             # Generierte SQL-Migrationen
│       └── drizzle.config.ts
│
├── .env.example                 # Vorlage für die Datenbank-URL
└── package.json                 # Root: Workspaces + Sammel-Skripte
```

---

## Voraussetzungen

- **Node.js** (aktuelle LTS-Version, mindestens 20)
- **npm** (mit Workspaces-Unterstützung, ab v7)
- Optional: eine **PostgreSQL**-Datenbank (lokal oder Supabase) – nur für das DB-Paket und die geplanten Account-Features. Das eigentliche Spiel läuft komplett im Speicher des Backends und benötigt keine Datenbank.
- Optional: ein **Supabase**-Projekt für Login/Registrierung

---

## Installation

```bash
git clone https://github.com/thomasweigert91/hide-and-seek.git
cd hide-and-seek
npm install
```

`npm install` im Root-Verzeichnis installiert die Abhängigkeiten aller Workspaces (`backend`, `frontend`, `packages/*`).

---

## Konfiguration

### Datenbank (`packages/db`)

Kopiere die Vorlage und trage deine Verbindungs-URL ein:

```bash
cp .env.example packages/db/.env
```

```env
# Lokale Datenbank
DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres"

# Supabase – Direktverbindung (Port 5432)
# DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Supabase – Transaction Pooler (Port 6543)
# DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
```

> Die DB-Skripte laden die `.env` über `dotenv` aus dem Arbeitsverzeichnis des Pakets. Da die Root-Skripte mit `--prefix packages/db` laufen, gehört die Datei nach `packages/db/.env`.

### Frontend (`frontend/.env.local`)

| Variable | Beschreibung | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_SOCKET_URL` | URL des Backend-Socket-Servers | `http://localhost:8000` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL deines Supabase-Projekts | Platzhalter |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Öffentlicher Anon-Key des Supabase-Projekts | Platzhalter |

### Backend

| Variable | Beschreibung | Default |
| --- | --- | --- |
| `PORT` | Port des NestJS-Servers | `8000` |

Der Server lauscht auf `0.0.0.0`, ist also auch im lokalen Netzwerk erreichbar. So kann z. B. ein zweites Gerät mitspielen, wenn `NEXT_PUBLIC_SOCKET_URL` auf die LAN-IP des Rechners zeigt.

---

## Entwicklung starten

Alles auf einmal (DB-Paket im Watch-Mode, Backend und Frontend):

```bash
npm run dev
```

Danach:

- **Frontend:** http://localhost:3000
- **Backend / Socket.IO:** http://localhost:8000

Zum Testen einfach zwei Browserfenster öffnen: In einem einen Raum erstellen, im anderen über die Raumliste beitreten.

Einzelne Teile lassen sich auch separat starten:

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

```bash
npm run dev:db
```

---

## Verfügbare Skripte

### Root

| Skript | Beschreibung |
| --- | --- |
| `npm run dev` | Startet DB-Paket, Backend und Frontend parallel (via `concurrently`) |
| `npm run dev:backend` | Nur das Backend im Watch-Mode |
| `npm run dev:frontend` | Nur das Frontend (Next.js Dev-Server) |
| `npm run dev:db` | Kompiliert das DB-Paket im Watch-Mode |
| `npm run build` | Baut DB-Paket, Backend und Frontend nacheinander |
| `npm run db:test` | Testet die Verbindung zur Datenbank |
| `npm run db:generate` | Generiert SQL-Migrationen aus dem Drizzle-Schema |
| `npm run db:push` | Überträgt das Schema direkt in die Datenbank |
| `npm run db:migrate` | Führt die generierten Migrationen aus |
| `npm run db:studio` | Öffnet Drizzle Studio zur Datenbankansicht |

### Backend (`backend/`)

| Skript | Beschreibung |
| --- | --- |
| `npm run start:dev` | Dev-Server mit Watch-Mode |
| `npm run start:debug` | Dev-Server mit Debugger |
| `npm run build` / `npm run start:prod` | Production-Build bzw. -Start |
| `npm run test` / `test:watch` / `test:cov` | Unit-Tests (Jest) |
| `npm run test:e2e` | End-to-End-Tests |
| `npm run lint` | Linting mit oxlint |
| `npm run format` | Formatierung mit Prettier |

### Frontend (`frontend/`)

| Skript | Beschreibung |
| --- | --- |
| `npm run dev` | Next.js Dev-Server |
| `npm run build` / `npm run start` | Production-Build bzw. -Start |
| `npm run lint` | Linting mit ESLint |

---

## Architektur

```
┌─────────────────────────┐        Socket.IO         ┌──────────────────────────────┐
│  Frontend (Next.js)     │  ─────── move ────────▶  │  Backend (NestJS)            │
│                         │                          │                              │
│  useGameStore (Zustand) │  ◀── gameState/timer ──  │  EventsGateway               │
│  GameBoard / Tile       │                          │   ├─ Räume & Lobby (Map)     │
│  Fog of War (Client)    │                          │   ├─ Timer pro Raum          │
└─────────────────────────┘                          │   └─ Move-Lock pro Spieler   │
                                                     │  EventsService               │
                                                     │   ├─ Kartengenerierung + BFS │
                                                     │   ├─ Bewegung, Eis, Schlamm  │
                                                     │   └─ Items & Fang-Prüfung    │
                                                     └──────────────────────────────┘
```

- **Autoritativer Server:** Die gesamte Spiellogik (Bewegung, Kollisionen, Items, Timer, Siegbedingungen) läuft im Backend. Der Client sendet nur Bewegungsrichtungen und rendert den empfangenen Zustand.
- **In-Memory-Zustand:** Räume und Spielstände werden in `Map`s im Backend gehalten. Ein Neustart des Servers setzt alle Räume zurück.
- **Move-Lock:** Solange eine Bewegung noch verarbeitet wird (z. B. Rutschen auf Eis oder Feststecken im Schlamm), werden weitere Eingaben desselben Spielers ignoriert.
- **Fog of War:** Der Sichtradius wird im Client (`GameBoard.tsx`) berechnet.

---

## Socket.IO-Events

### Client → Server

| Event | Payload | Beschreibung |
| --- | --- | --- |
| `createRoom` | `{ roomId?, roomName, gridSize }` | Erstellt einen Raum; der Ersteller wird Sucher |
| `joinRoom` | `{ roomId }` | Tritt einem Raum bei; der Beitretende wird Verstecker, das Spiel startet |
| `move` | `{ direction: "UP" \| "DOWN" \| "LEFT" \| "RIGHT" }` | Bewegt die eigene Figur |
| `restart` | – | Neue Runde mit getauschten Rollen (benötigt zwei Spieler) |
| `leaveRoom` | – | Verlässt den Raum |

### Server → Client

| Event | Payload | Beschreibung |
| --- | --- | --- |
| `roomsList` | `RoomInfo[]` | Aktuelle Raumliste (an alle verbundenen Clients) |
| `roleAssigned` | `{ role, roomId }` | Zugewiesene Rolle (`SEEKER` / `HIDER`) |
| `gameStarted` | `GameState` | Initialer Spielzustand einer neuen Runde |
| `gameState` | `GameState` | Aktualisierter Spielzustand nach jedem Schritt bzw. bei Spielende |
| `timer` | `{ timeRemaining }` | Sekündliches Timer-Update |
| `itemCollected` | `{ role, itemType, pos }` | Ein Item wurde eingesammelt |
| `playerLeft` | `{ message }` | Gegner hat das Spiel verlassen |
| `error` | `{ message }` | Fehler (z. B. Raum voll / existiert nicht) |

### `GameState`

```ts
type GameState = {
  status: "WAITING" | "RUNNING" | "FINISHED";
  gridSize: number;
  seekerPos: { x: number; y: number };
  hiderPos: { x: number; y: number };
  timeRemaining: number;
  winner: "SEEKER" | "HIDER" | null;
  terrain: ("FLOOR" | "WALL" | "ICE" | "MUD")[][];
  items: ("TIME" | null)[][];
};
```

---

## Datenbank

Das Paket `@hide-and-seek/db` stellt einen geteilten Drizzle-Client und das Schema bereit:

```ts
import { db, users, eq } from "@hide-and-seek/db";

const user = await db.select().from(users).where(eq(users.email, "a@b.de"));
```

- Der Client wird **lazy** beim ersten Zugriff initialisiert und nutzt `DATABASE_URL`.
- `prepare: false` ist gesetzt, damit der Supabase Transaction Pooler (Port 6543) funktioniert.
- Aktuelles Schema: Tabelle `users` (`id`, `name`, `email`, `created_at`, `updated_at`).

Typischer Workflow bei Schema-Änderungen:

```bash
npm run db:generate
```

```bash
npm run db:migrate
```

---

## Tests & Linting

```bash
npm run test --prefix backend
```

```bash
npm run test:e2e --prefix backend
```

```bash
npm run lint --prefix backend
```

```bash
npm run lint --prefix frontend
```

---

## Bekannte Einschränkungen

- Räume und Spielstände liegen nur im Speicher des Backends und gehen bei einem Neustart verloren.
- Die Login-Seite (`/login`) ist noch nicht mit der Lobby bzw. dem Spiel verknüpft; Datenbank und Auth werden vom Spiel aktuell nicht verwendet.
- CORS ist im Gateway für alle Origins (`*`) geöffnet – für ein Production-Deployment sollte das eingeschränkt werden.
- Steuerung aktuell nur per Tastatur (keine Touch-Steuerung für Mobilgeräte).
