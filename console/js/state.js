/* ============================================================
   NEMESIS — GM CONSOLE · STATE ENGINE (full)
   Persistent campaign ledger: LocalStorage + JSON export/import,
   reactive pub/sub, and the complete rule engine — 8-phase loop,
   economy, armory, deck/activation, facility lifecycle, map control,
   faction abilities, ships/units, missions + reward engine, narrative.
   ============================================================ */
(function () {
  "use strict";
  const D = window.NEMESIS_DATA;
  const KEY = "nemesis-campaign-v1";
  const listeners = new Set();
  const uid = (p) => (p || "X") + Math.random().toString(36).slice(2, 8);

  /* ---------- fresh campaign ---------- */
  function freshCampaign() {
    const factions = {};
    D.factions.forEach(f => {
      factions[f.id] = { resources: 0, influence: 0, intel: 0, triggerUsed: false, traitUnlocked: false,
        deck: [], hand: [], discard: [], drawChosen: null, activated: [] };
    });
    const map = {};
    D.mapNodes.forEach(n => { map[n.id] = { owner: n.owner || null, contested: !!n.contested, facility: null, modifiers: [] }; });
    return {
      version: 2,
      meta: { turn: 1, phase: 1, activeSeat: "gm", createdAt: new Date().toISOString() },
      factions, map,
      facilities: [],
      ships: [{ id: "polaris", name: "Polaris", type: "capital", owner: "nemesis", nodeId: "nemesis-hq", assignment: "reserve", assignedFacilityId: null, surviving: true }],
      missions: [],
      narrative: { completedStory: [], classifiedProgress: 0, globalEvents: [] },
      armory: null,   // null = full catalog buyable; else array of card ids GM-curated
      log: []
    };
  }

  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  let campaign = migrate(load()) || freshCampaign();

  function migrate(c) {
    if (!c) return null;
    // forward-compat: ensure new fields exist on older saves
    if (!c.narrative) c.narrative = { completedStory: [], classifiedProgress: 0, globalEvents: [] };
    if (c.armory === undefined) c.armory = null;
    Object.values(c.factions || {}).forEach(f => { if (!f.activated) f.activated = []; });
    return c;
  }

  function save() { try { localStorage.setItem(KEY, JSON.stringify(campaign)); } catch (e) {} }
  function notify() { save(); listeners.forEach(fn => fn(campaign)); }
  function log(action, detail) {
    campaign.log.unshift({ t: new Date().toISOString(), turn: campaign.meta.turn, phase: campaign.meta.phase, action, detail: detail || "" });
    if (campaign.log.length > 800) campaign.log.length = 800;
  }

  /* ---------- helpers ---------- */
  const faction = id => campaign.factions[id];
  const facilityType = key => D.facilityTypes.find(f => f.key === key);
  const cardTemplate = id => D.cards.find(c => c.id === id);
  const cardCat = key => D.cardCategories.find(c => c.key === key) || { resourceType: "resources" };
  const enemyOf = id => (id === "nemesis" ? "legion" : "nemesis");
  const countFacilities = owner => campaign.facilities.filter(f => f.owner === owner && f.status === "operational").length;
  function cardCost(t, factionId) {
    let cost = t.cost || 0;
    if (t.category === "UnitDeployment" && campaign.facilities.some(f => f.owner === factionId && f.type === "barracks" && f.status === "operational")) cost = Math.max(0, cost - 1);
    return cost;
  }

  /* ---------- ECONOMY ---------- */
  function adjust(factionId, key, delta, reason) {
    const f = faction(factionId); if (!f) return;
    f[key] = Math.max(0, (f[key] || 0) + delta);
    log("economy", `${factionId} ${delta >= 0 ? "+" : ""}${delta} ${key}${reason ? " — " + reason : ""}`);
    notify();
  }
  function postIncome() {
    campaign.facilities.forEach(f => {
      if (f.status !== "operational") return;
      const t = facilityType(f.type);
      if (t && t.incomeType && t.incomePerTurn) faction(f.owner)[t.incomeType] += t.incomePerTurn;
    });
    if (countFacilities("legion") > countFacilities("nemesis")) { faction("legion").resources += 1; log("passive", "Legion Corruption Spread +1 Resource"); }
    log("income", "Facility income posted · turn " + campaign.meta.turn);
  }
  function tickTimers() {
    campaign.facilities.forEach(f => {
      if (f.status === "building") { f.buildTurnsLeft -= 1; if (f.buildTurnsLeft <= 0) { f.status = "operational"; log("facility", `${f.type} operational @ ${f.nodeId}`); } }
      else if (f.status === "shutdown") { f.shutdownTurnsLeft -= 1; if (f.shutdownTurnsLeft <= 0) { f.status = "operational"; log("facility", `${f.type} back online @ ${f.nodeId}`); } }
    });
    Object.values(campaign.map).forEach(node => { node.modifiers = (node.modifiers || []).map(m => ({ ...m, turnsLeft: m.turnsLeft - 1 })).filter(m => m.turnsLeft > 0); });
  }

  /* ---------- PHASE ENGINE ---------- */
  function runPhaseAutomation(phaseN) {
    if (phaseN === 1) { tickTimers(); postIncome(); }
    if (phaseN === 2) { Object.values(campaign.factions).forEach(f => { f.drawChosen = null; }); }
    if (phaseN === 6) { /* execution: nothing automatic */ }
  }
  function advancePhase() {
    let { turn, phase } = campaign.meta;
    if (phase >= 8) { turn += 1; phase = 1; log("turn", "Advanced to turn " + turn); Object.values(campaign.factions).forEach(f => f.activated = []); }
    else phase += 1;
    campaign.meta.turn = turn; campaign.meta.phase = phase;
    log("phase", "Phase " + phase + " · " + (D.phases[phase - 1] || {}).name);
    runPhaseAutomation(phase); notify();
  }
  function setPhase(n) { campaign.meta.phase = Math.min(8, Math.max(1, n)); notify(); }
  function setSeat(id) { campaign.meta.activeSeat = id; notify(); }

  /* ---------- DECK / DRAW ---------- */
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function buildStarterDeck(factionId) { faction(factionId).deck = shuffle(D.cards.map(c => c.id)); log("deck", factionId + " starter deck built"); notify(); }
  function drawCards(factionId, n) { const f = faction(factionId); for (let i = 0; i < n; i++) { if (!f.deck.length) f.deck = shuffle(D.cards.map(c => c.id)); f.hand.push(f.deck.shift()); } }
  function chooseDraw(factionId, optionId) {
    const opt = D.drawOptions.find(o => o.id === optionId); const f = faction(factionId);
    if (!opt || f.drawChosen) return;
    if (!f.deck.length && !f.hand.length) f.deck = shuffle(D.cards.map(c => c.id));
    if (opt.resource) f.resources += opt.resource;
    drawCards(factionId, opt.cards); f.drawChosen = optionId;
    log("draw", `${factionId} draw ${optionId}: ${opt.label}`); notify();
  }

  /* ---------- ARMORY ---------- */
  function buyCard(factionId, cardId) {
    const t = cardTemplate(cardId); if (!t) return { ok: false, msg: "Unknown card" };
    if (campaign.armory && !campaign.armory.includes(cardId)) return { ok: false, msg: "Not stocked in Armory" };
    const rtype = cardCat(t.category).resourceType, cost = cardCost(t, factionId);
    if (faction(factionId)[rtype] < cost) return { ok: false, msg: "Not enough " + rtype };
    faction(factionId)[rtype] -= cost; faction(factionId).hand.push(cardId);
    log("armory", `${factionId} bought ${t.name} (-${cost} ${rtype})`); notify();
    return { ok: true };
  }
  function setArmory(ids) { campaign.armory = ids; log("armory", "Armory inventory curated (" + (ids ? ids.length : "all") + ")"); notify(); }

  /* ---------- CARD ACTIVATION (Phase 5, max 2) ---------- */
  function toggleActivate(factionId, cardId) {
    const f = faction(factionId); if (!f.activated) f.activated = [];
    const i = f.activated.indexOf(cardId);
    if (i >= 0) { f.activated.splice(i, 1); log("prep", factionId + " deactivated " + cardId); }
    else { if (f.activated.length >= 2) return { ok: false, msg: "Max 2 cards per mission" }; f.activated.push(cardId); log("prep", factionId + " activated " + cardId); }
    notify(); return { ok: true };
  }

  /* ---------- FACILITIES ---------- */
  function buildFacility(factionId, nodeId, typeKey) {
    const node = campaign.map[nodeId], t = facilityType(typeKey);
    if (!node || !t) return { ok: false, msg: "Invalid" };
    if (node.owner !== factionId) return { ok: false, msg: "Region not controlled" };
    if (node.facility) return { ok: false, msg: "One facility per region" };
    if (faction(factionId).resources < t.cost) return { ok: false, msg: "Not enough Resources" };
    faction(factionId).resources -= t.cost;
    const f = { id: uid("F"), type: typeKey, nodeId, owner: factionId, status: "building", buildTurnsLeft: t.buildTurns, shutdownTurnsLeft: 0, defenderShipId: null, level: 1 };
    campaign.facilities.push(f); node.facility = f.id;
    log("facility", `${factionId} build ${t.name} @ ${nodeId} (-${t.cost} Res, ${t.buildTurns}T)`); notify();
    return { ok: true };
  }
  function upgradeFacility(facId) {
    const f = campaign.facilities.find(x => x.id === facId); if (!f || f.status !== "operational") return { ok: false, msg: "Must be operational" };
    const cost = 2 * f.level;
    if (faction(f.owner).resources < cost) return { ok: false, msg: "Not enough Resources (" + cost + ")" };
    faction(f.owner).resources -= cost; f.level += 1; log("facility", `${f.type} upgraded to L${f.level} (-${cost} Res)`); notify(); return { ok: true };
  }
  function assignDefender(facId, shipId) {
    const f = campaign.facilities.find(x => x.id === facId); if (!f) return;
    const prev = campaign.ships.find(s => s.assignedFacilityId === facId); if (prev) { prev.assignedFacilityId = null; prev.assignment = "reserve"; }
    f.defenderShipId = shipId || null;
    if (shipId) { const s = campaign.ships.find(x => x.id === shipId); if (s) { s.assignedFacilityId = facId; s.assignment = "facility-defense"; s.nodeId = f.nodeId; } }
    log("facility", `${f.type} defender ${shipId ? "assigned" : "cleared"}`); notify();
  }
  function setFacilityStatus(facId, status, turns) {
    const f = campaign.facilities.find(x => x.id === facId); if (!f) return;
    if (status === "destroyed") { const node = campaign.map[f.nodeId]; if (node) node.facility = null; campaign.facilities = campaign.facilities.filter(x => x.id !== facId); log("facility", `${f.type} destroyed @ ${f.nodeId}`); }
    else { f.status = status; if (status === "shutdown") f.shutdownTurnsLeft = turns || 2; log("facility", `${f.type} ${status}${turns ? " " + turns + "T" : ""}`); }
    notify();
  }

  /* ---------- MAP ---------- */
  function setNodeOwner(nodeId, factionId) { const n = campaign.map[nodeId]; if (!n) return; n.owner = factionId; n.contested = false; log("map", `${nodeId} → ${factionId || "neutral"}`); notify(); }
  function toggleContested(nodeId) { const n = campaign.map[nodeId]; if (n) { n.contested = !n.contested; notify(); } }
  function addModifier(nodeId, key, turns) { const n = campaign.map[nodeId], m = D.mapModifiers.find(x => x.key === key); if (!n || !m) return; n.modifiers.push({ key, name: m.name, effect: m.effect, turnsLeft: turns }); log("modifier", `${m.name} @ ${nodeId} ${turns}T`); notify(); }
  function removeModifier(nodeId, idx) { const n = campaign.map[nodeId]; if (n && n.modifiers[idx]) { n.modifiers.splice(idx, 1); notify(); } }

  /* ---------- FACTION ABILITIES ---------- */
  function useTrigger(factionId) {
    const f = faction(factionId); if (!f || f.triggerUsed) return { ok: false, msg: "Already used this map" };
    f.triggerUsed = true;
    if (factionId === "legion") {
      const e = faction("nemesis");
      if (e.hand.length) { const i = Math.floor(Math.random() * e.hand.length); const c = e.hand.splice(i, 1)[0]; e.discard.push(c); log("ability", "Tactical Instability — NEMESIS forced to discard " + c); }
      else log("ability", "Tactical Instability used (enemy hand empty)");
    } else {
      log("ability", "Shadow Recall armed — next failed Nemesis-Unit mission consequence is nullified (GM)");
    }
    notify(); return { ok: true };
  }
  function unlockTrait(factionId) { const f = faction(factionId); if (f) { f.traitUnlocked = true; log("ability", factionId + " unlocked Narrative Trait"); notify(); } }
  function dataLeech(targetFacId) { // Legion narrative trait
    if (!faction("legion").traitUnlocked) return { ok: false, msg: "Data Leech not unlocked" };
    const f = campaign.facilities.find(x => x.id === targetFacId && x.owner === "nemesis"); if (!f) return { ok: false, msg: "Target must be a NEMESIS facility" };
    f.status = "shutdown"; f.shutdownTurnsLeft = 2; log("ability", "Data Leech — NEMESIS " + f.type + " shut down 2T"); notify(); return { ok: true };
  }

  /* ---------- SHIPS / UNITS ---------- */
  function addShip(name, type, owner, nodeId) { campaign.ships.push({ id: uid("S"), name: name || type, type, owner, nodeId: nodeId || null, assignment: "reserve", assignedFacilityId: null, surviving: true }); log("ship", `${owner} added ${name || type}`); notify(); }
  function deployShip(shipId, nodeId) { const s = campaign.ships.find(x => x.id === shipId); if (s) { s.nodeId = nodeId; s.assignment = "deployed"; log("ship", `${s.name} → ${nodeId}`); notify(); } }
  function removeShip(shipId) { const s = campaign.ships.find(x => x.id === shipId); if (s && s.assignedFacilityId) { const f = campaign.facilities.find(x => x.id === s.assignedFacilityId); if (f) f.defenderShipId = null; } campaign.ships = campaign.ships.filter(x => x.id !== shipId); notify(); }

  /* ---------- MISSIONS + REWARD ENGINE ---------- */
  function createMission(b) {
    const actor = b.actor || "nemesis";
    const m = { id: (b.id || uid("OP")).toUpperCase(), title: b.title || "Untitled Operation", type: b.type || "Story",
      actor, targetNode: b.targetNode || null, targetFacility: b.targetFacility || null,
      objective: b.objective || "", secondary: b.secondary || "", optional: b.optional || "",
      respawn: b.respawn || "standard", reward: b.reward || "", narrativeIntro: b.narrativeIntro || "",
      status: "published",
      activated: { nemesis: [...(faction("nemesis").activated || [])], legion: [...(faction("legion").activated || [])] },
      result: null };
    campaign.missions.unshift(m); log("mission", "Briefing published: " + m.id); notify(); return m;
  }
  function setMissionStatus(id, status) { const m = campaign.missions.find(x => x.id === id); if (m) { m.status = status; log("mission", m.id + " → " + status); notify(); } }

  // The bridge from live outcome back to meta-state. All deltas GM-supplied/overridable.
  function resolveMission(id, opts) {
    const m = campaign.missions.find(x => x.id === id); if (!m) return { ok: false, msg: "Mission not found" };
    const o = opts || {}, outcome = o.outcome || "success", actor = m.actor || "nemesis", enemy = enemyOf(actor);
    // 1) resource payouts (per-faction deltas from the debrief form)
    if (o.resDelta) Object.keys(o.resDelta).forEach(fid => { ["resources", "influence", "intel"].forEach(r => { const d = +o.resDelta[fid][r] || 0; if (d) faction(fid)[r] = Math.max(0, faction(fid)[r] + d); }); });
    // 2) territory shift on the target node
    if (m.targetNode && o.applyTerritory !== false) {
      const node = campaign.map[m.targetNode];
      if (node) {
        if (outcome === "success") { node.owner = actor; node.contested = false; }
        else { if (o.flipOnFail) node.owner = enemy; else if (node.owner === actor) node.owner = null; node.contested = false; }
        log("map", `${m.targetNode} ${outcome === "success" ? "claimed by " + actor : "lost by " + actor}`);
      }
    }
    // 3) facility outcome
    if (m.targetFacility) {
      const f = campaign.facilities.find(x => x.id === m.targetFacility);
      if (f) {
        const held = (m.type === "Facility Defense") ? (outcome === "success") : (outcome !== "success");
        if (!held) setFacilityStatus(f.id, "destroyed");
      }
    }
    // 4) used activated cards → discard (unless persistent), clear activation
    ["nemesis", "legion"].forEach(fid => {
      (m.activated[fid] || []).forEach(cid => {
        const t = cardTemplate(cid); const f = faction(fid);
        if (!(t && t.persistent)) { const i = f.hand.indexOf(cid); if (i >= 0) { f.hand.splice(i, 1); f.discard.push(cid); } }
      });
      faction(fid).activated = [];
    });
    // 5) card unlocks
    (o.unlockCards || []).forEach(cid => { faction(actor).hand.push(cid); log("armory", "Unlocked " + cid); });
    // 6) narrative
    if (m.type === "Story" && outcome === "success" && !campaign.narrative.completedStory.includes(m.id)) campaign.narrative.completedStory.push(m.id);
    if (o.classifiedAdvance) campaign.narrative.classifiedProgress += 1;
    m.result = { outcome, optionalsMet: o.optionalsMet || [], surviving: o.surviving || [], resolvedAtTurn: campaign.meta.turn, notes: o.notes || "" };
    m.status = "resolved";
    log("mission", `Resolved ${m.id}: ${outcome.toUpperCase()}`); notify();
    return { ok: true };
  }
  function deleteMission(id) { campaign.missions = campaign.missions.filter(x => x.id !== id); notify(); }

  /* ---------- NARRATIVE ---------- */
  function addGlobalEvent(text, turns) { campaign.narrative.globalEvents.unshift({ id: uid("E"), text, turnsLeft: turns || 0, createdTurn: campaign.meta.turn }); log("event", text); notify(); }
  function removeGlobalEvent(id) { campaign.narrative.globalEvents = campaign.narrative.globalEvents.filter(e => e.id !== id); notify(); }

  /* ---------- IMPORT / EXPORT / RESET ---------- */
  function exportJSON() { const blob = new Blob([JSON.stringify(campaign, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "nemesis-campaign.json"; a.click(); URL.revokeObjectURL(url); }
  function importJSON(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => { try { campaign = migrate(JSON.parse(r.result)); log("system", "Campaign imported"); notify(); res(true); } catch (e) { rej(e); } }; r.readAsText(file); }); }
  function reset() { campaign = freshCampaign(); log("system", "Campaign reset"); notify(); }

  /* ---------- public API ---------- */
  window.Store = {
    get: () => campaign,
    subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); },
    actions: {
      advancePhase, setPhase, setSeat,
      adjust, postIncome, tickTimers,
      chooseDraw, buildStarterDeck, drawCards,
      buyCard, setArmory, toggleActivate,
      buildFacility, upgradeFacility, assignDefender, setFacilityStatus,
      setNodeOwner, toggleContested, addModifier, removeModifier,
      useTrigger, unlockTrait, dataLeech,
      addShip, deployShip, removeShip,
      createMission, setMissionStatus, resolveMission, deleteMission,
      addGlobalEvent, removeGlobalEvent,
      log: (a, d) => { log(a, d); notify(); },
      mutate: fn => { fn(campaign); notify(); }
    },
    exportJSON, importJSON, reset,
    helpers: { faction, facilityType, cardTemplate, cardCat, cardCost, countFacilities, enemyOf }
  };
})();
