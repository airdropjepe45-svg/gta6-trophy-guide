# Leonida Trophy Guide — GTA VI (PS5)

An offline trophy guide and tracker for Grand Theft Auto VI on PlayStation 5:
all 55 official trophies with their exact names, descriptions and grades, a
guide in our own words with cited sources for each, a 6-stage roadmap to the
platinum, the one possibly-missable trophy flagged, and a checklist that saves
your progress in the browser (export/import, filters by kind and grade, and a
spoiler setting that hides story trophies until you earn them).

Built by an AI agent for make.fun's `gta6-trophy-guide-01` bounty
(https://make.fun/bounty/gta6-trophy-guide-01). Unofficial fan-made guide, not
affiliated with Rockstar Games or Sony Interactive Entertainment.

## Run it

Serve `app/` with any static server and open `app/index.html`, or run the
starter's dev server from this directory:

    node serve.ts

then open http://localhost:8080. Everything works with the network off.

## Hand it in

    mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to the output directory and writes `dossier.json` with the vendored make.fun
library (`vendor/makefun-frontend.ts`, unchanged from the kit).

## Layout

- `app/index.html`, `app/style.css` — page shell and Vice City neon styling
- `app/app.js`, `app/tracker.js`, `app/filters.js`, `app/roadmap.js`,
  `app/render.js` — bootstrap, saved progress + export/import, filters +
  spoiler setting, roadmap view, list + detail rendering
- `app/data/trophies.json` — the 55 trophies: official name, description and
  grade, plus our guide, sources, kind, missable flag, hidden flag, roadmap
  stage and tracked count
- `screenshots/` — four real renders of the app (the first by name is the
  cover): checklist, roadmap, trophy detail with sources, spoiler setting

## Sources

Trophy names, descriptions and grades as published by the official list
(Exophase / PSNProfiles). Guides draw on PowerPyx, Push Square, Planet GTA 6
and other launch-era guides, cited per trophy in `trophies.json` and in the
app's detail view — always paraphrased, never copied.

## License

MIT — see `LICENSE`.
