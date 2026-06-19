/* ============================================================
   NEMESIS — GM CONSOLE · GAME DATA (data-driven seed)
   All values sourced from NEMESIS Campaign.docx + the 11 final cards.
   Everything here is the *catalog* / default ruleset. It is editable
   in-app; campaign state (balances, control, decks) lives in state.js.
   ============================================================ */
window.NEMESIS_DATA = {
  meta: {
    patch: "Campaign v1 (Sections 1–15)",
    assetBase: "../assets",          // reuse the main site's assets
    cardBase: "../assets/cards",
    mapImage: "../assets/img/map-hurston.jpg",
    note: "No global win/loss condition — open-ended, multi-season."
  },

  /* ---------- Resources (Section 5) ---------- */
  resources: [
    { key: "resources", name: "Resources", glyph: "▤", color: "#f2a33c", desc: "Supplies — build/maintain structures, buy units, acquire ships, construct facilities." },
    { key: "influence", name: "Influence", glyph: "◈", color: "#7fb7c4", desc: "Sway neutral parties — reinforcements, temporary allies, hidden channels." },
    { key: "intel",     name: "Intel",     glyph: "◉", color: "#b98cff", desc: "Tactical/narrative insight — reveal enemy, trigger power failures, open airlocks." }
  ],

  /* ---------- Seats / roles the admin switches between ---------- */
  seats: [
    { id: "nemesis", name: "NEMESIS Commander", factionId: "nemesis", color: "#f2a33c" },
    { id: "legion",  name: "Legion Commander",  factionId: "legion",  color: "#df2b38" },
    { id: "gm",      name: "Game Master",       factionId: null,      color: "#9498a1" }
  ],

  /* ---------- Factions (Section 2 / 11) ---------- */
  factions: [
    {
      id: "nemesis", name: "NEMESIS", aka: "Synchronizerz", color: "#f2a33c",
      logo: "../assets/img/nemesis-logo.webp",
      passive: { name: "Cybernetic Resilience", desc: "Nemesis Units respawn without limit." },
      trigger: { name: "Shadow Recall", desc: "Once per campaign map: nullify the strategic consequence of one failed Nemesis-Unit mission (GM may impose a narrative cost)." },
      narrativeTrait: { name: "Vanguard Awakening", desc: "After a classified mission chain: unlocks advanced protocols / experimental Nemesis Units (Nemesis Protocol)." },
      startAssets: ["Polaris-class capital ship (no fighter escort)"]
    },
    {
      id: "legion", name: "THE LEGION", aka: null, color: "#df2b38",
      logo: "../assets/img/legion-logo.webp",
      passive: { name: "Corruption Spread", desc: "+1 Resource during Strategic Prep if controlling more facilities than the enemy at turn start." },
      trigger: { name: "Tactical Instability", desc: "Once per campaign map: force the enemy Commander to randomly discard one card before activation." },
      narrativeTrait: { name: "Data Leech", desc: "After raiding a NEMESIS facility: shut down another NEMESIS facility for 2 turns (GM-regulated)." },
      startAssets: []
    }
  ],

  /* ---------- The 8-phase turn loop (Section 9) ---------- */
  phases: [
    { n: 1, key: "map_update",   name: "Campaign Map Update", live: false, summary: "Resolve last turn's missions, update control + facilities, post income & narrative triggers.", actions: ["Post facility income", "Apply mission results", "Tick build & modifier timers"] },
    { n: 2, key: "commander",    name: "Commander Phase",     live: false, summary: "Each Commander picks a draw option; facilities built/upgraded; deployments committed.", actions: ["Choose draw option", "Order facility build/upgrade", "Commit deployments"] },
    { n: 3, key: "armory",       name: "Armory Access",       live: false, summary: "Buy available cards with Resources / Influence / Intel (GM-curated, rotates by phase).", actions: ["Browse Armory", "Purchase cards"] },
    { n: 4, key: "briefing",     name: "Mission Briefing",    live: false, summary: "GM authors the briefing; players enroll; roster, gear & parameters confirmed.", actions: ["Author briefing", "Confirm roster"] },
    { n: 5, key: "prep",         name: "Strategic Preparation", live: false, summary: "Each Commander activates UP TO 2 cards (hard cap); effects recorded as live conditions.", actions: ["Activate up to 2 cards", "GM acknowledge"] },
    { n: 6, key: "execution",    name: "Mission Execution",   live: true,  summary: "Flown LIVE in Star Citizen. The console does not simulate — it only logs.", actions: ["Mark mission in progress", "Log notes (optional)"] },
    { n: 7, key: "debrief",      name: "Debriefing & Results", live: false, summary: "Record outcome + optional objectives; the reward engine applies all meta-state changes.", actions: ["Record outcome", "Apply rewards"] },
    { n: 8, key: "narrative",    name: "Narrative & Events",  live: false, summary: "Classified unlocks, lore advancement, global/time-sensitive campaign events.", actions: ["Unlock classified", "Trigger global events"] }
  ],

  /* ---------- Commander draw options (Phase 2) ---------- */
  drawOptions: [
    { id: "a", label: "+1 Resource & 2 Cards", resource: 1, cards: 2 },
    { id: "b", label: "3 Cards",               resource: 0, cards: 3 }
  ],

  /* ---------- Facilities (Section 12) ---------- */
  facilityTypes: [
    { key: "mining",   name: "Mining Facility",  cost: 4, costType: "resources", buildTurns: 2, incomeType: "resources", incomePerTurn: 1, restrict: "asteroid/resource regions", desc: "+1 Resource per turn." },
    { key: "intel",    name: "Intel Relay Post", cost: 3, costType: "resources", buildTurns: 1, incomeType: "intel",     incomePerTurn: 1, restrict: "any controlled region", desc: "+1 Intel per turn." },
    { key: "trade",    name: "Trading Hub",      cost: 4, costType: "resources", buildTurns: 2, incomeType: "influence", incomePerTurn: 1, restrict: "city/trade regions", desc: "+1 Influence per turn." },
    { key: "barracks", name: "Barracks",         cost: 3, costType: "resources", buildTurns: 1, incomeType: null,        incomePerTurn: 0, restrict: "any controlled region", desc: "-1 Resource cost for Unit Deployment." },
    { key: "hangar",   name: "Hangar Bay",       cost: 5, costType: "resources", buildTurns: 3, incomeType: null,        incomePerTurn: 0, restrict: "any controlled region", desc: "Enables light fighter reinforcements." },
    { key: "sensor",   name: "Sensor Array",     cost: 3, costType: "resources", buildTurns: 2, incomeType: null,        incomePerTurn: 0, restrict: "any controlled region", desc: "Reveals enemy placements before mission start." }
  ],

  /* ---------- Map nodes (seed, faithful to Camp_Map_Hurston.png; admin-editable) ---------- */
  mapNodes: [
    { id: "nemesis-hq",     name: "Hurston · West Sector",   type: "planetary-zone",   x: 30, y: 52, owner: "nemesis", isHQ: true,  supports: ["mining","intel","trade","barracks","hangar","sensor"], bonus: "NEMESIS HQ · Polaris berth" },
    { id: "contested",      name: "Hurston · Front Line",    type: "sector",           x: 50, y: 50, owner: null,      contested: true, supports: ["sensor","barracks"], bonus: "Contested frontier — mission hotspot" },
    { id: "legion-zone",    name: "Hurston · East Sector",   type: "planetary-zone",   x: 70, y: 52, owner: "legion",  isHQ: true,  supports: ["mining","intel","trade","barracks","hangar","sensor"], bonus: "Legion stronghold" },
    { id: "orbital-green",  name: "Orbital Station · Vega",   type: "orbital-facility", x: 52, y: 16, owner: null,      supports: ["intel","trade","sensor"], bonus: "Neutral orbital node — capturable" },
    { id: "node-teal",      name: "Deep Sector · Cyan",      type: "station",          x: 16, y: 80, owner: null,      supports: ["mining","intel"], bonus: "Independent sector node" }
  ],

  /* ---------- Map modifiers (Section 10.6) ---------- */
  mapModifiers: [
    { key: "ion-storm",   name: "Ion Storm",      effect: "blocks-missions", desc: "Blocks missions in the node." },
    { key: "embargo",     name: "Trade Embargo",  effect: "blocks-resources", desc: "Halts resource flow from the node." },
    { key: "quarantine",  name: "Quarantine Zone", effect: "blocks-missions", desc: "No deployment into the node." },
    { key: "uprising",    name: "Uprising",       effect: "contested", desc: "Local revolt destabilises control." },
    { key: "lockdown",    name: "Zone Lockdown",  effect: "blocks-missions", desc: "Temporary full lockdown." }
  ],

  /* ---------- Card categories ---------- */
  cardCategories: [
    { key: "Tactical",                name: "Tactical",                color: "#df2b38", resourceType: "resources" },
    { key: "Infrastructure_Logistics", name: "Infrastructure & Logistics", color: "#f2a33c", resourceType: "resources" },
    { key: "Environmental",           name: "Environmental",           color: "#3a8f5a", resourceType: "influence" },
    { key: "Intel_Deception",         name: "Intel & Deception",       color: "#b98cff", resourceType: "intel" },
    { key: "UnitDeployment",          name: "Unit Deployment",         color: "#7fb7c4", resourceType: "resources" }
  ],

  /* ---------- The 11 final NEMESIS cards (costs flagged 'default' were not clearly printed) ---------- */
  cards: [
    { id: "T01001", name: "F.E.A.R.",          category: "Tactical",                strength: 1,    cost: 1, costDefault: false, rarity: 2, art: "../assets/cards/FEAR_T01001.jpg",                    ability: "The enemy force starts with a 5-minute delay at mission start.", flavor: "Terror strikes before the first shot." },
    { id: "T01002", name: "Suppression Zone",  category: "Tactical",                strength: 2,    cost: 1, costDefault: true,  rarity: 2, art: "../assets/cards/SuppressionZone_T01002.jpg",         ability: "In a selected zone, enemy communications are jammed for the first 5 minutes. Coordination must occur locally.", flavor: null },
    { id: "T01003", name: "No Escape",         category: "Tactical",                strength: 2,    cost: 1, costDefault: false, rarity: 4, art: "../assets/cards/NoEscape_T01003.jpg",                 ability: "Lock all extract / exit points for the enemy team for the last 10 minutes of the mission.", flavor: "The only way out is through us." },
    { id: "T01004", name: "Jammed",            category: "Tactical",                strength: null, cost: 1, costDefault: false, rarity: 1, art: "../assets/cards/Jammed_T01004.jpg",                   ability: "Enemy team cannot use communication devices for the first 3 minutes of the mission.", flavor: null },
    { id: "T01005", name: "Breach Charge",     category: "Tactical",                strength: 1,    cost: 1, costDefault: true,  rarity: 1, art: "../assets/cards/BreachCharge_T01005.jpg",             ability: "A selected locked door is automatically breached at mission start.", flavor: "Walls mean nothing." },
    { id: "T01006", name: "Piercing Strike",   category: "Tactical",                strength: 2,    cost: 1, costDefault: false, rarity: 4, art: "../assets/cards/PiercingStrike_T01006.jpg",          ability: "Select one non-capital, non-gunboat ship scheduled for the mission. That ship is considered destroyed; its crew starts on the planet surface.", flavor: null },
    { id: "T01011", name: "Tactical Strike",   category: "Tactical",                strength: 3,    cost: 2, costDefault: false, rarity: 4, art: "../assets/cards/TacticalStrike_T01011.jpg",          ability: "Destroy one known enemy facility. The enemy may pay 4 Resource to avoid destruction.", flavor: "You won't rebuild what doesn't exist anymore." },
    { id: "INF-01", name: "Double Shift",      category: "Infrastructure_Logistics", strength: 2,   cost: 2, costDefault: false, rarity: 3, art: "../assets/cards/DoubleShift_Infrastructure.jpg",     ability: "All production facilities under your control generate +1 additional Resource this turn. This includes Trade Hubs.", flavor: "War pushes even machines to work overtime." },
    { id: "ENV-01", name: "Null Spiral",       category: "Environmental",           strength: 1,    cost: 3, costDefault: false, rarity: 4, art: "../assets/cards/NullSpiral_Environmental.jpg",       ability: "A spatial anomaly forms in orbit. Any ship entering the zone loses energy output for 20 minutes.", flavor: "Not all voids are empty." },
    { id: "INT-01", name: "Ghost Tap",         category: "Intel_Deception",         strength: null, cost: 3, costDefault: false, rarity: 4, art: "../assets/cards/GhostTap_IntelDeception.jpg",        ability: "Hack into enemy comms and access a live feed of their mission briefing and coordination for the first 5 minutes.", flavor: "Good to know." },
    { id: "UNI-01", name: "Nemesis Dropship",  category: "UnitDeployment",          strength: 4,    cost: 3, costDefault: true,  rarity: 4, art: "../assets/cards/NemesisDropship_UnitDeployment.jpg", ability: "Call in a Nemesis Dropship to deploy 2 Nemesis Units. Nemesis Units have unlimited respawns.", flavor: "We are Nemesis." }
  ],

  /* ---------- Mission briefing template (Section 8) ---------- */
  missionTypes: ["Story", "Bonus", "Facility Defense", "Special Event"],
  respawnRules: [
    { key: "standard",   label: "Standard (X respawns / zones)" },
    { key: "unlimited",  label: "Nemesis Unlimited (Cybernetic Resilience)" },
    { key: "permadeath", label: "Perma-death on fail" },
    { key: "extraction", label: "Extraction-only win" }
  ],

  /* ---------- Ships / units that can be deployed & assigned ---------- */
  unitTypes: [
    { key: "capital",  name: "Capital Ship",  cost: 0, respawn: "n/a" },
    { key: "fighter",  name: "Light Fighter", cost: 2, respawn: "standard" },
    { key: "nemesis",  name: "Nemesis Unit",  cost: 3, respawn: "unlimited" },
    { key: "standard", name: "Standard Unit", cost: 1, respawn: "standard" }
  ]
};
