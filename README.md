# Kord

Kord is a local-first guitar chord practice app for exploring voicings,
generating playable four-chord loops, and tracking practice coverage over time.

## Current Product

- Chord explorer with root, quality, CAGED-family, accidental spelling, and
  major-key context controls.
- Chord-symbol parser for common aliases such as `Bb7`, `Em7`, `Cmaj7`, `C-`,
  and `Cø7`.
- Four-chord major-key practice generator with strict diatonic and blues-color
  modes.
- CAGED voicing selection by allowed shape family, neck zone, and optional
  switch-practice scoring for smoother chord transitions.
- Timed practice sessions with 5, 10, and 15 minute presets, optional external
  BPM, and confidence tracking.
- Progress coverage by key, chord quality, CAGED family, pitch-class note, and
  recent session history.
- Local-first practice history in IndexedDB, with localStorage and in-memory
  fallbacks plus JSON export/import backups.
- Installable PWA metadata and a production service worker for offline reloads
  after the first successful load.

The first release is major-key-first by design. Minor-key generation, audio
playback, and richer analytics are follow-up layers once the core practice loop
is stable.

## Architecture

Kord is a single-page TanStack Start app:

- `src/routes/index.tsx` owns the main app shell, tabs, practice workflow,
  settings, and progress views.
- `src/lib/music.ts` owns the music-theory model: keys, qualities, CAGED
  voicing templates, progression templates, voicing scoring, and generated
  practice sets.
- `src/lib/practice-storage.ts` owns the browser persistence boundary for saved
  sessions and backup import/export.
- `src/components/FretDiagram.tsx` renders chord diagrams from the voicing model.
- `public/manifest.json` and `public/sw.js` provide the PWA surface.

The app is intentionally client-local for user data. Preferences are stored in
`localStorage`; completed practice sessions flow through IndexedDB first, then
fall back to localStorage or memory if IndexedDB is unavailable.

## Stack

- React 19 with TanStack Start, TanStack Router, and TanStack Query.
- Vite with the TanStack Router plugin, Tailwind CSS 4, and Cloudflare's Vite
  plugin for production Worker builds.
- Biome for formatting/linting, Vitest for unit tests, and TypeScript in strict
  mode.
- Wrangler for Cloudflare deployment.

## Development

```bash
npm install
npm run dev
```

The dev server defaults to port `3000`. Vite will choose the next available port
if needed.

To bind explicitly to localhost:

```bash
npm run dev -- --host 127.0.0.1
```

## Verification

```bash
npm run check
npm run test
./node_modules/.bin/tsc --noEmit
npm run build
```

`npm run check` runs Biome over the configured source files. `npm run test`
runs the Vitest suite, currently focused on the music-theory and practice-set
generation contracts.

## Deployment

```bash
npm run deploy
```

Deployment runs a production build and then `wrangler deploy` using
`wrangler.jsonc`. The service worker is only registered in production builds.
