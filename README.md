# NEMESIS — Star Citizen Org

Recruitment site **and** GM campaign console for the **NEMESIS** Star Citizen organization.
Static, client-side, no build step — same approach as the SC Loadout Optimizer.

- **Site:** https://neom1les.github.io/sc-nemesis/
- **GM Console:** https://neom1les.github.io/sc-nemesis/console/

## Recruitment site
Cinematic single-page site (Hero video, campaign teaser, factions, the operation, **Verse Sitrep**
(dated state-of-the-game block, refresh on each patch), tactical cards carousel, enlist). Dark gunmetal + molten-amber, Zebulon display font, HUD aesthetic.

Join links live in `script.js` → `NEMESIS_CONFIG`. RSI org: https://robertsspaceindustries.com/en/orgs/N3M3S1S (SID `N3M3S1S`).
Discord invite is still a placeholder — the button shows "uplink pending" until it is set.

Content last verified against **Star Citizen Alpha 4.10.1 LIVE** (September 2026): Stanton, Pyro and Nyx open.
Sister project: [SC Central](https://neom1les.github.io/sc-central/) (toolkit, links back to the org).

## GM Console (`/console/`)
A client-side campaign console for the NEMESIS meta-game — drives the full 8-phase turn loop:
Hurston map & territory control, 3-resource economy, facility lifecycle, armory & cards,
mission briefing + debrief reward engine, faction abilities, ships, narrative tracker.
Live Star Citizen missions are **not** simulated — only bracketed (briefing → debrief).

State is saved in the browser (LocalStorage); export/import a campaign as `nemesis-campaign.json`.

## Run locally
```
# Windows
start-console.bat
# macOS / Linux
./start-console.sh
```
…or serve this folder with any static server and open `/` (site) or `/console/`.

## Disclaimer
Unofficial, fan-made Star Citizen project. Not affiliated with, endorsed or approved by
Cloud Imperium Games. Star Citizen® is a trademark of Cloud Imperium Rights.
