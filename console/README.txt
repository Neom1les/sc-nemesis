NEMESIS — GM CONSOLE  (Foundation v1)
=====================================

A client-side campaign console for the NEMESIS meta-game.
Same architecture as the SC Loadout Optimizer: static web app,
local server to launch, all state in the browser.

HOW TO START
------------
Windows:   double-click  Website\start-console.bat
Mac/Linux: run           ./Website/start-console.sh
Opens at http://localhost:8765/console/

(Or serve the Website folder with any static server and open /console/.)

WHAT'S IN IT
------------
- Turn Flow      — the guided 8-phase campaign loop (advance to run automation)
- Hurston Map    — clickable nodes: control, facilities, modifiers
- Forces & Economy — 3-resource wallets, faction abilities, ships
- Cards & Armory — the 11 NEMESIS cards (catalog + hand)
- Missions       — Section-8 briefing builder + register
- Audit Log      — every action recorded

DATA & STATE
------------
- Game catalog (editable): console/js/game-data.js
- Campaign state: saved automatically in your browser (LocalStorage)
- Export / Import a campaign as nemesis-campaign.json  (top-right icons ⤓ ⤒)
- Reset: top-right ⟲

NEXT BUILD STAGES
-----------------
Armory purchase flow · card activation wired into missions ·
debrief reward-engine · faction-ability automation · multi-season ·
(optional) cloud backend for true remote multi-seat.
