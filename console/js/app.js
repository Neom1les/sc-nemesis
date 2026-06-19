/* ============================================================
   NEMESIS — GM CONSOLE · app (full render + interaction engine)
   ============================================================ */
(function () {
  "use strict";
  const D = window.NEMESIS_DATA, S = window.Store;
  const el = id => document.getElementById(id);
  const c = () => S.get();
  const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  let view = "phases", cardTab = "catalog";

  const stars = n => "★".repeat(n || 0) + "☆".repeat(Math.max(0, 4 - (n || 0)));
  const cat = k => D.cardCategories.find(x => x.key === k) || { name: k, color: "#fff", resourceType: "resources" };
  const activeFactionId = () => { const s = D.seats.find(x => x.id === c().meta.activeSeat); return s ? s.factionId : null; };
  const esc = s => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* ---------- toast / modal ---------- */
  let toastT;
  function toast(msg, err) { const t = el("toast"); t.textContent = msg; t.hidden = false; t.classList.toggle("err", !!err); clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2600); }
  function openModal(html) { el("modalBox").innerHTML = html; el("modal").hidden = false; }
  function closeModal() { el("modal").hidden = true; }
  function res(r) { return r.ok ? true : (toast(r.msg || "Not possible", true), false); }

  /* ---------- boot ---------- */
  function boot() {
    const b = el("boot"), f = el("bootFill"), lg = el("bootLog");
    if (reduce) { b.classList.add("done"); return; }
    const lines = ["// MOUNTING CAMPAIGN LEDGER", "// LOADING HURSTON THEATER", "// SYNC FACTION REGISTRY", "// CONSOLE ONLINE"];
    let p = 0, i = 0;
    const t = setInterval(() => { p = Math.min(100, p + Math.random() * 30); f.style.width = p + "%"; const w = Math.floor(p / 100 * lines.length); while (i < w && i < lines.length) { lg.textContent = lines[i]; i++; } if (p >= 100) { clearInterval(t); lg.textContent = lines[lines.length - 1]; setTimeout(() => b.classList.add("done"), 450); } }, 220);
  }

  /* ---------- chrome ---------- */
  function renderChrome() {
    const C = c(), ph = D.phases[C.meta.phase - 1];
    el("turnNum").textContent = C.meta.turn;
    el("phaseNum").textContent = C.meta.phase + " · " + ph.name.toUpperCase();
    el("phaseChip").classList.toggle("live", ph.live);
    el("wallets").innerHTML = D.factions.map(f => { const w = C.factions[f.id]; return `<div class="wallet wallet--${f.id}"><span class="fc">${f.name}</span>` + D.resources.map(r => `<span class="res" title="${r.name}"><span class="g" style="color:${r.color}">${r.glyph}</span>${w[r.key]}</span>`).join("") + `</div>`; }).join("");
    el("seatBtns").innerHTML = D.seats.map(s => `<button class="seat ${C.meta.activeSeat === s.id ? "active" : ""}" data-seat="${s.id}" data-action="seat" data-seatid="${s.id}">${s.name.replace(" Commander", "")}</button>`).join("");
  }

  /* ---------- nav ---------- */
  const NAV = [{ sep: "Campaign" }, { v: "phases", ico: "◵", label: "Turn Flow" }, { v: "map", ico: "◉", label: "Hurston Map" }, { v: "forces", ico: "⬣", label: "Forces & Economy" }, { sep: "Assets" }, { v: "cards", ico: "▤", label: "Cards & Armory" }, { v: "missions", ico: "✶", label: "Missions" }, { v: "narrative", ico: "❖", label: "Narrative" }, { sep: "System" }, { v: "log", ico: "≡", label: "Audit Log" }];
  function renderNav() { el("nav").innerHTML = NAV.map(n => n.sep ? `<div class="nav__sep">${n.sep}</div>` : `<a href="#${n.v}" class="${view === n.v ? "active" : ""}" data-action="nav" data-view="${n.v}"><span class="ico">${n.ico}</span><span>${n.label}</span></a>`).join(""); }

  /* ============================================================ VIEWS */
  const VIEWS = { phases: viewPhases, map: viewMap, forces: viewForces, cards: viewCards, missions: viewMissions, narrative: viewNarrative, log: viewLog };
  function renderView() { const fn = VIEWS[view]; el("view").innerHTML = fn ? fn() : "—"; }

  /* ---- TURN FLOW ---- */
  function viewPhases() {
    const C = c(), cur = C.meta.phase, ph = D.phases[cur - 1];
    const stepper = D.phases.map(p => `<div class="step ${p.live ? "live" : ""} ${p.n < cur ? "done" : ""} ${p.n === cur ? "current" : ""}" data-action="setphase" data-n="${p.n}"><span class="n">PH ${p.n}</span><b>${p.name}</b></div>`).join("");
    return `<div class="vh"><span class="ey">Campaign · Turn ${C.meta.turn}</span><h1>Turn Flow</h1><p>Run the campaign through all 8 phases. "Complete phase" advances the loop and fires the phase automation (income, timers, card draw).</p></div>
      <div class="stepper">${stepper}</div>
      <div class="phasecard ${ph.live ? "live" : ""}"><div class="pc-no">PHASE ${ph.n} / 8 ${ph.live ? '· <span class="chip live">LIVE IN STAR CITIZEN</span>' : ""}</div>
      <h2>${ph.name}</h2><p class="pc-sum">${ph.summary}</p>${phaseActions(ph)}
      <div class="pc-foot"><div class="actlist">${ph.actions.map(a => `<div class="a">${a}</div>`).join("")}</div>
      <button class="btn btn--primary btn--big" data-action="advance">${cur >= 8 ? "Next turn ▸" : "Complete phase ▸"}</button></div></div>`;
  }
  function phaseActions(ph) {
    const C = c();
    if (ph.key === "map_update") return `<div class="pc-actions"><span class="chip ok">Income posted · timers ticked</span><button class="btn" data-action="nav" data-view="map">Map</button><button class="btn" data-action="nav" data-view="forces">Economy</button></div>`;
    if (ph.key === "commander") return `<div class="pc-actions">` + D.factions.map(f => { const w = C.factions[f.id], done = w.drawChosen; return `<div class="panel" style="flex:1;min-width:230px"><b style="color:${f.color}">${f.name}</b><div style="margin-top:.5rem;display:flex;gap:.4rem;flex-wrap:wrap">` + D.drawOptions.map(o => `<button class="btn ${done === o.id ? "btn--primary" : ""}" data-action="draw" data-f="${f.id}" data-opt="${o.id}" ${done ? "disabled" : ""}>${o.label}</button>`).join("") + `</div><div class="muted mono" style="font-size:.72rem;margin-top:.45rem">Deck ${w.deck.length} · Hand ${w.hand.length}${done ? " · chosen " + done.toUpperCase() : ""}</div><button class="btn" style="margin-top:.5rem;padding:.3rem .6rem;font-size:.72rem" data-action="nav" data-view="map">Build facilities →</button></div>`; }).join("") + `</div>`;
    if (ph.key === "armory") return `<div class="pc-actions"><button class="btn btn--primary" data-action="navcards" data-tab="armory">To the Armory →</button></div>`;
    if (ph.key === "briefing") return `<div class="pc-actions"><button class="btn btn--primary" data-action="nav" data-view="missions">Create briefing →</button></div>`;
    if (ph.key === "prep") {
      const fid = activeFactionId();
      if (!fid) return `<div class="pc-actions"><span class="muted">Select a faction seat above to activate cards.</span></div>`;
      const hand = C.factions[fid].hand, act = C.factions[fid].activated || [];
      if (!hand.length) return `<div class="pc-actions"><span class="muted">No cards in hand — draw during the Commander Phase.</span></div>`;
      return `<div class="muted" style="margin-top:.8rem">Activate up to 2 cards for the mission (${act.length}/2) — consumed on debrief:</div><div class="cardgrid" style="margin-top:.6rem">` + hand.map(id => { const t = S.helpers.cardTemplate(id); if (!t) return ""; const on = act.includes(id); return `<figure class="gcard" style="${on ? "outline:2px solid var(--amber)" : ""}" data-action="activate" data-f="${fid}" data-id="${id}"><img src="${t.art}" loading="lazy"/><figcaption class="meta"><b>${t.name}</b><span class="sub">${on ? '<span class="amber">ACTIVE</span>' : "tap"}<span class="stars">${stars(t.rarity)}</span></span></figcaption></figure>`; }).join("") + `</div>`;
    }
    if (ph.key === "execution") return `<div class="pc-actions"><span class="chip live">Flown live in Star Citizen — the console only logs</span><button class="btn" data-action="logmark" data-msg="Mission marked in progress">Mark as in progress</button></div>`;
    if (ph.key === "debrief") { const pub = C.missions.filter(m => m.status !== "resolved"); return `<div class="pc-actions">${pub.length ? pub.map(m => `<button class="btn btn--primary" data-action="debrief" data-id="${m.id}">Debrief: ${m.id}</button>`).join("") : '<span class="muted">No open missions — create one in the Missions tab.</span>'}</div>`; }
    if (ph.key === "narrative") return `<div class="pc-actions">` + D.factions.map(f => `<button class="btn" data-action="unlocktrait" data-f="${f.id}" ${c().factions[f.id].traitUnlocked ? "disabled" : ""}>${f.name}: ${f.narrativeTrait.name}</button>`).join("") + `<button class="btn" data-action="nav" data-view="narrative">Narrative tracker →</button></div>`;
    return "";
  }

  /* ---- MAP ---- */
  function viewMap() {
    const C = c();
    const nodes = D.mapNodes.map(n => { const st = C.map[n.id], fac = st.facility ? C.facilities.find(f => f.id === st.facility) : null; return `<div class="node ${st.owner || ""} ${st.contested ? "contested" : ""} ${fac ? "has-fac" : ""}" style="left:${n.x}%;top:${n.y}%" data-action="node" data-node="${n.id}" title="${n.name}">${n.isHQ ? "★" : "●"}<span class="lab">${n.name}</span></div>`; }).join("");
    return `<div class="vh"><span class="ey">Strategic Layer</span><h1>Hurston Theater</h1><p>Click a node for control, facility lifecycle and modifiers. ★ HQ · ⬢ Facility.</p></div><div class="mapwrap"><img src="${D.meta.mapImage}" alt="Hurston map"/>${nodes}</div>`;
  }
  function nodeModal(id) {
    const C = c(), n = D.mapNodes.find(x => x.id === id), st = C.map[id];
    const fac = st.facility ? C.facilities.find(f => f.id === st.facility) : null;
    let facHtml;
    if (fac) {
      const t = S.helpers.facilityType(fac.type), def = fac.defenderShipId ? C.ships.find(s => s.id === fac.defenderShipId) : null;
      facHtml = `<div class="panel"><div style="display:flex;justify-content:space-between;align-items:center"><b>${t.name} · L${fac.level}</b><span class="chip ${fac.status === "operational" ? "ok" : ""}">${fac.status}${fac.status === "building" ? " · " + fac.buildTurnsLeft + "T" : ""}${fac.status === "shutdown" ? " · " + fac.shutdownTurnsLeft + "T" : ""}</span></div>
        <div class="muted" style="font-size:.85rem;margin:.3rem 0">${t.desc}</div>
        <div class="muted mono" style="font-size:.74rem">Defender: ${def ? def.name : "— undefended"}</div>
        <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.6rem">
          <button class="btn" style="padding:.3rem .6rem;font-size:.72rem" data-action="upgradefac" data-id="${fac.id}">Upgrade (${2 * fac.level} Res)</button>
          <button class="btn" style="padding:.3rem .6rem;font-size:.72rem" data-action="assigndef" data-id="${fac.id}">Defender</button>
          <button class="btn" style="padding:.3rem .6rem;font-size:.72rem" data-action="facstatus" data-id="${fac.id}" data-st="sabotaged">Sabotage</button>
          <button class="btn" style="padding:.3rem .6rem;font-size:.72rem" data-action="facstatus" data-id="${fac.id}" data-st="destroyed">Destroy</button>
        </div></div>`;
    } else if (st.owner) facHtml = `<label class="fl">Build facility (owner: ${st.owner})</label><div style="display:flex;gap:.5rem"><select class="fi" id="facSel">${D.facilityTypes.map(t => `<option value="${t.key}">${t.name} — ${t.cost} Res, ${t.buildTurns}T</option>`).join("")}</select><button class="btn btn--primary" data-action="buildfac" data-node="${id}">Build</button></div>`;
    else facHtml = `<p class="muted">Neutral region — take control first.</p>`;
    const ownerBtns = D.factions.map(f => `<button class="btn ${st.owner === f.id ? "btn--primary" : ""}" data-action="setowner" data-node="${id}" data-f="${f.id}">${f.name}</button>`).join("") + `<button class="btn ${!st.owner ? "btn--primary" : ""}" data-action="setowner" data-node="${id}" data-f="">Neutral</button>` + `<button class="btn" data-action="contest" data-node="${id}">${st.contested ? "Contested ✓" : "Contested"}</button>`;
    const mods = (st.modifiers || []).map((m, i) => `<span class="chip" data-action="rmmod" data-node="${id}" data-i="${i}" style="cursor:pointer" title="remove">${m.name} · ${m.turnsLeft}T ✕</span>`).join(" ") || '<span class="muted">none</span>';
    return `<button class="modal__close" data-action="closemodal">×</button><h3>${n.name}</h3><div class="muted mono" style="font-size:.7rem;margin-bottom:.8rem">${n.type} · ${n.bonus || ""}</div>
      <label class="fl">Control</label><div style="display:flex;gap:.4rem;flex-wrap:wrap">${ownerBtns}</div>
      <div style="margin-top:1rem">${facHtml}</div>
      <label class="fl" style="margin-top:1rem">Modifiers</label><div>${mods}</div>
      <div style="display:flex;gap:.5rem;margin-top:.4rem"><select class="fi" id="modSel">${D.mapModifiers.map(m => `<option value="${m.key}">${m.name}</option>`).join("")}</select><input class="fi" id="modTurns" type="number" value="2" min="1" style="width:74px"/><button class="btn" data-action="addmod" data-node="${id}">+ Modifier</button></div>`;
  }
  function assignDefModal(facId) {
    const C = c(), f = C.facilities.find(x => x.id === facId);
    const ships = C.ships.filter(s => s.owner === f.owner);
    return `<button class="modal__close" data-action="closemodal">×</button><h3>Assign defender</h3>
      <p class="muted">An assigned ship defends the facility (otherwise the attacker gets the advantage).</p>
      <div style="display:flex;flex-direction:column;gap:.4rem;margin-top:.6rem">
        ${ships.map(s => `<button class="btn" data-action="setdef" data-fac="${facId}" data-ship="${s.id}">${s.name} <span class="muted">(${s.type})</span></button>`).join("") || '<span class="muted">No ships — add them in the Forces tab.</span>'}
        <button class="btn" data-action="setdef" data-fac="${facId}" data-ship="">— Clear defender</button>
      </div>`;
  }

  /* ---- FORCES ---- */
  function viewForces() {
    const C = c();
    const cards = D.factions.map(f => {
      const w = C.factions[f.id];
      const resHtml = D.resources.map(r => `<div class="resbox"><div class="v" style="color:${r.color}">${w[r.key]}</div><div class="l">${r.name}</div><div class="adj"><button data-action="adj" data-f="${f.id}" data-res="${r.key}" data-d="-1">−</button><button data-action="adj" data-f="${f.id}" data-res="${r.key}" data-d="1">+</button></div></div>`).join("");
      const facs = C.facilities.filter(x => x.owner === f.id);
      const facHtml = facs.length ? facs.map(x => { const t = S.helpers.facilityType(x.type); return `<li>${t.name} <span class="muted">L${x.level} · ${x.status}${x.status === "building" ? " " + x.buildTurnsLeft + "T" : ""}</span></li>`; }).join("") : '<li class="muted">—</li>';
      const ships = C.ships.filter(s => s.owner === f.id);
      const shipHtml = ships.map(s => `<li>${s.name} <span class="muted">(${s.type}, ${s.assignment})</span> <span class="chip" data-action="rmship" data-id="${s.id}" style="cursor:pointer">✕</span></li>`).join("") || '<li class="muted">—</li>';
      const traitBtn = w.traitUnlocked
        ? (f.id === "legion" ? `<button class="btn" data-action="dataleech" style="padding:.2rem .55rem;font-size:.7rem">Data Leech</button>` : '<span class="chip ok">unlocked</span>')
        : `<button class="btn" data-action="unlocktrait" data-f="${f.id}" style="padding:.2rem .55rem;font-size:.7rem">unlock</button>`;
      return `<div class="fcard ${f.id}"><h3>${f.name}</h3><div class="muted mono" style="font-size:.7rem">${f.aka ? "aka " + f.aka : "&nbsp;"}</div>
        <div class="resrow">${resHtml}</div>
        <div class="muted" style="font-size:.86rem"><b>Passive:</b> ${f.passive.name} — ${f.passive.desc}</div>
        <div class="muted" style="font-size:.86rem;margin-top:.4rem"><b>Trigger:</b> ${f.trigger.name} ${w.triggerUsed ? '<span class="chip">spent</span>' : `<button class="btn" data-action="trigger" data-f="${f.id}" style="padding:.2rem .55rem;font-size:.7rem">use</button>`}</div>
        <div class="muted" style="font-size:.86rem;margin-top:.4rem"><b>Narrative Trait:</b> ${f.narrativeTrait.name} ${traitBtn}</div>
        <div class="muted" style="font-size:.86rem;margin-top:.5rem"><b>Facilities:</b><ul style="margin:.2rem 0 .4rem 1.1rem">${facHtml}</ul><b>Ships:</b> <button class="btn" data-action="addship" data-f="${f.id}" style="padding:.1rem .45rem;font-size:.68rem">+ add</button><ul style="margin:.2rem 0 0 1.1rem">${shipHtml}</ul></div></div>`;
    }).join("");
    return `<div class="vh"><span class="ey">Order of Battle</span><h1>Forces & Economy</h1><p>Resource wallets, faction abilities (with effect), facilities and the ship roster.</p></div><div class="grid g2">${cards}</div>`;
  }

  /* ---- CARDS & ARMORY ---- */
  function gcard(t) { const k = cat(t.category); return `<figure class="gcard" data-action="card" data-id="${t.id}"><img src="${t.art}" alt="${t.name}" loading="lazy"/><figcaption class="meta"><b>${t.name}</b><span class="sub"><span style="color:${k.color}">${k.name}</span><span class="stars">${stars(t.rarity)}</span></span></figcaption></figure>`; }
  function viewCards() {
    const C = c(), fid = activeFactionId();
    const tabs = `<div class="pc-actions" style="margin-bottom:1rem">
      <button class="btn ${cardTab === "catalog" ? "btn--primary" : ""}" data-action="cardtab" data-tab="catalog">Catalog</button>
      <button class="btn ${cardTab === "armory" ? "btn--primary" : ""}" data-action="cardtab" data-tab="armory">Armory (buy)</button>
      <button class="btn ${cardTab === "hand" ? "btn--primary" : ""}" data-action="cardtab" data-tab="hand">Hand${fid ? " · " + (fid === "nemesis" ? "NEMESIS" : "Legion") : ""}</button></div>`;
    let body;
    if (cardTab === "catalog") body = `<div class="cardgrid">${D.cards.map(t => gcard(t)).join("")}</div>`;
    else if (cardTab === "armory") {
      if (!fid) body = '<p class="muted">Select a faction seat above to buy.</p>';
      else { const stock = C.armory || D.cards.map(x => x.id); body = `<p class="muted">Buying for <b style="color:${fid === "nemesis" ? "var(--amber)" : "var(--crimson)"}">${fid.toUpperCase()}</b> — cost in the matching resource (Barracks lowers unit cost).</p><div class="cardgrid">` + stock.map(id => { const t = S.helpers.cardTemplate(id); if (!t) return ""; const k = cat(t.category); const cost = S.helpers.cardCost(t, fid); return `<figure class="gcard"><img src="${t.art}" alt="${t.name}" data-action="card" data-id="${t.id}" loading="lazy"/><figcaption class="meta"><b>${t.name}</b><span class="sub"><span style="color:${k.color}">${cost} ${k.resourceType}</span><span class="stars">${stars(t.rarity)}</span></span><button class="btn btn--primary" style="width:100%;margin-top:.4rem;padding:.35rem;font-size:.74rem" data-action="buycard" data-f="${fid}" data-id="${t.id}">Buy</button></figcaption></figure>`; }).join("") + `</div>`; }
    } else {
      if (!fid) body = '<p class="muted">Select a faction seat above.</p>';
      else { const hand = C.factions[fid].hand, dis = C.factions[fid].discard; body = (hand.length ? `<div class="cardgrid">${hand.map(id => { const t = S.helpers.cardTemplate(id); return t ? gcard(t) : ""; }).join("")}</div>` : '<p class="muted">No cards in hand.</p>') + (dis.length ? `<div class="vh" style="margin-top:1.4rem"><h1 style="font-size:1.1rem">Discard (${dis.length})</h1></div><div class="muted mono" style="font-size:.8rem">${dis.map(id => (S.helpers.cardTemplate(id) || {}).name).join(" · ")}</div>` : ""); }
    }
    return `<div class="vh"><span class="ey">The Armory</span><h1>Cards & Armory</h1></div>${tabs}${body}`;
  }
  function cardModal(id) { const t = S.helpers.cardTemplate(id), k = cat(t.category); return `<button class="modal__close" data-action="closemodal">×</button><div style="display:flex;gap:1.1rem;flex-wrap:wrap"><img src="${t.art}" style="width:170px;border-radius:8px" alt="${t.name}"/><div style="flex:1;min-width:200px"><h3>${t.name}</h3><div class="mono" style="font-size:.7rem;color:${k.color};letter-spacing:.08em">${k.name} · ${t.id}</div><div style="margin:.5rem 0"><span class="stars">${stars(t.rarity)}</span></div><p>${t.ability}</p>${t.flavor ? `<p class="muted" style="font-style:italic;margin-top:.4rem">"${t.flavor}"</p>` : ""}<div class="muted mono" style="font-size:.78rem;margin-top:.7rem">Strength ${t.strength ?? "—"} · Cost ${t.cost} ${k.resourceType}${t.costDefault ? " (default)" : ""}</div></div></div>`; }

  /* ---- MISSIONS ---- */
  function viewMissions() {
    const C = c();
    const rows = C.missions.length ? C.missions.map(m => `<tr><td class="mono">${m.id}</td><td>${esc(m.title)}</td><td><span class="chip">${m.type}</span></td><td><span class="chip" style="text-transform:uppercase">${m.actor}</span></td><td>${m.status === "resolved" ? `<span class="chip ${m.result.outcome === "success" ? "ok" : ""}">${m.result.outcome}</span>` : m.status}</td><td>${m.status !== "resolved" ? `<button class="btn" style="padding:.2rem .5rem;font-size:.7rem" data-action="debrief" data-id="${m.id}">Debrief</button>` : ""} <span class="chip" data-action="delmission" data-id="${m.id}" style="cursor:pointer">✕</span></td></tr>`).join("") : `<tr><td colspan="6" class="muted">No missions yet.</td></tr>`;
    return `<div class="vh"><span class="ey">Section 8 · Operations</span><h1>Missions</h1><p>Create a briefing → fly it live in SC → debrief (the reward engine applies the outcome).</p></div>
      <div class="grid g2"><div class="panel"><h3 style="font-family:var(--display)">Briefing Builder</h3>
        <label class="fl">Mission ID</label><input class="fi" id="mId" placeholder="OP-W4R-BOT"/>
        <label class="fl">Title</label><input class="fi" id="mTitle" placeholder="Operation …"/>
        <div style="display:flex;gap:.6rem"><div style="flex:1"><label class="fl">Type</label><select class="fi" id="mType">${D.missionTypes.map(t => `<option>${t}</option>`).join("")}</select></div><div style="flex:1"><label class="fl">Actor</label><select class="fi" id="mActor">${D.factions.map(f => `<option value="${f.id}">${f.name}</option>`).join("")}</select></div></div>
        <label class="fl">Target region</label><select class="fi" id="mNode"><option value="">— none —</option>${D.mapNodes.map(n => `<option value="${n.id}">${n.name}</option>`).join("")}</select>
        <label class="fl">Primary objective</label><textarea class="fi" id="mObj"></textarea>
        <label class="fl">Respawn rule</label><select class="fi" id="mResp">${D.respawnRules.map(r => `<option value="${r.key}">${r.label}</option>`).join("")}</select>
        <label class="fl">Reward (note)</label><input class="fi" id="mRew" placeholder="e.g. +3 Resources, region claim"/>
        <div style="margin-top:1rem"><button class="btn btn--primary" data-action="createbriefing">Publish briefing</button></div></div>
      <div class="panel"><h3 style="font-family:var(--display)">Mission Register</h3><table><thead><tr><th>ID</th><th>Title</th><th>Type</th><th>Actor</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }
  function debriefModal(id) {
    const m = c().missions.find(x => x.id === id); if (!m) return "";
    const numF = (lbl, base) => `<div class="resbox" style="text-align:left"><div class="l">${lbl}</div><div style="display:flex;gap:.3rem;margin-top:.2rem">R<input class="fi" id="${base}_r" type="number" value="0" style="width:48px;padding:.2rem"/>I<input class="fi" id="${base}_i" type="number" value="0" style="width:48px;padding:.2rem"/>Int<input class="fi" id="${base}_x" type="number" value="0" style="width:48px;padding:.2rem"/></div></div>`;
    return `<button class="modal__close" data-action="closemodal">×</button><h3>Debrief · ${m.id}</h3>
      <div class="muted mono" style="font-size:.72rem;margin-bottom:.6rem">${esc(m.title)} · actor ${m.actor} · target ${m.targetNode || "—"} · type ${m.type}</div>
      <label class="fl">Outcome</label><div style="display:flex;gap:1rem"><label><input type="radio" name="dbout" value="success" checked> Success</label><label><input type="radio" name="dbout" value="fail"> Failure</label></div>
      <label class="fl">On failure</label><label class="muted" style="font-size:.85rem"><input type="checkbox" id="dbflip"/> Hand region to the enemy (otherwise → neutral)</label>
      <label class="fl">Resource reward (delta)</label><div class="resrow">${numF("NEMESIS", "dbN")}${numF("LEGION", "dbL")}</div>
      <label class="muted" style="font-size:.85rem"><input type="checkbox" id="dbclass"/> +1 classified progress (story chain)</label>
      <label class="fl">Notes</label><textarea class="fi" id="dbnotes" placeholder="optional objectives met, surviving assets …"></textarea>
      <div style="margin-top:1rem;display:flex;gap:.5rem"><button class="btn btn--primary" data-action="resolvemission" data-id="${m.id}">Resolve & apply</button><button class="btn" data-action="closemodal">Cancel</button></div>`;
  }

  /* ---- NARRATIVE ---- */
  function viewNarrative() {
    const C = c(), N = C.narrative;
    const story = C.missions.filter(m => m.type === "Story").map(m => `<li>${m.id} — ${esc(m.title)} ${N.completedStory.includes(m.id) ? '<span class="chip ok">completed</span>' : '<span class="chip">open</span>'}</li>`).join("") || '<li class="muted">No story missions.</li>';
    const events = N.globalEvents.length ? N.globalEvents.map(e => `<li>${esc(e.text)} ${e.turnsLeft ? `<span class="chip">${e.turnsLeft}T</span>` : ""} <span class="chip" data-action="rmevent" data-id="${e.id}" style="cursor:pointer">✕</span></li>`).join("") : '<li class="muted">No active events.</li>';
    return `<div class="vh"><span class="ey">Continuity</span><h1>Narrative</h1><p>Story progress, the classified chain and global events.</p></div>
      <div class="grid g2"><div class="panel"><h3 style="font-family:var(--display)">Story Missions</h3><ul style="margin-left:1.1rem">${story}</ul>
        <div class="muted mono" style="margin-top:.8rem;font-size:.8rem">Classified chain progress: <b class="amber">${N.classifiedProgress}</b></div></div>
      <div class="panel"><h3 style="font-family:var(--display)">Global Events</h3><ul style="margin-left:1.1rem">${events}</ul>
        <div style="display:flex;gap:.5rem;margin-top:.7rem"><input class="fi" id="evText" placeholder="event description"/><input class="fi" id="evTurns" type="number" value="0" min="0" style="width:74px" title="duration in turns (0 = permanent)"/><button class="btn" data-action="addevent">+</button></div></div></div>`;
  }

  /* ---- LOG ---- */
  function viewLog() {
    const C = c();
    const rows = C.log.length ? C.log.map(l => `<div class="logrow"><span class="tg">T${l.turn}·P${l.phase}</span><span class="ac">${l.action}</span><span>${esc(l.detail)}</span></div>`).join("") : '<p class="muted">No entries yet.</p>';
    return `<div class="vh"><span class="ey">Continuity</span><h1>Audit Log</h1></div><div class="panel">${rows}</div>`;
  }

  /* ============================================================ EVENTS */
  function go(v) { view = v; renderNav(); renderView(); el("view").scrollTop = 0; }
  const val = id => { const e = el(id); return e ? e.value : ""; };
  const num = id => { const e = el(id); return e ? (+e.value || 0) : 0; };

  document.addEventListener("click", e => {
    const t = e.target.closest("[data-action]"); if (!t) return;
    const a = t.dataset.action, d = t.dataset;
    switch (a) {
      case "nav": return go(d.view);
      case "navcards": cardTab = d.tab; return go("cards");
      case "cardtab": cardTab = d.tab; return renderView();
      case "seat": return S.actions.setSeat(d.seatid || d.seat);
      case "advance": S.actions.advancePhase(); return toast("Phase " + c().meta.phase + " · " + D.phases[c().meta.phase - 1].name);
      case "setphase": return S.actions.setPhase(+d.n);
      case "draw": S.actions.chooseDraw(d.f, d.opt); return toast(d.f.toUpperCase() + " drew");
      case "adj": return S.actions.adjust(d.f, d.res, +d.d);
      case "trigger": { const r = S.actions.useTrigger(d.f); return r && r.ok === false ? toast(r.msg, true) : toast("Trigger used"); }
      case "unlocktrait": return S.actions.unlockTrait(d.f);
      case "dataleech": return openDataLeech();
      case "node": return openModal(nodeModal(d.node));
      case "card": return openModal(cardModal(d.id));
      case "closemodal": return closeModal();
      case "setowner": S.actions.setNodeOwner(d.node, d.f || null); return openModal(nodeModal(d.node));
      case "contest": S.actions.toggleContested(d.node); return openModal(nodeModal(d.node));
      case "buildfac": { const r = S.actions.buildFacility(c().map[d.node].owner, d.node, el("facSel").value); res(r); return openModal(nodeModal(d.node)); }
      case "upgradefac": { res(S.actions.upgradeFacility(d.id)); const fac = c().facilities.find(f => f.id === d.id); return openModal(nodeModal(fac.nodeId)); }
      case "assigndef": return openModal(assignDefModal(d.id));
      case "setdef": { const fac = c().facilities.find(f => f.id === d.fac); S.actions.assignDefender(d.fac, d.ship || null); toast(d.ship ? "Defender assigned" : "Defender cleared"); return openModal(nodeModal(fac.nodeId)); }
      case "facstatus": { const fac = c().facilities.find(f => f.id === d.id); const node = fac.nodeId; S.actions.setFacilityStatus(d.id, d.st, d.st === "shutdown" ? 2 : 0); toast("Facility " + d.st); return openModal(nodeModal(node)); }
      case "addmod": { S.actions.addModifier(d.node, el("modSel").value, num("modTurns") || 2); return openModal(nodeModal(d.node)); }
      case "rmmod": { S.actions.removeModifier(d.node, +d.i); return openModal(nodeModal(d.node)); }
      case "buycard": return res(S.actions.buyCard(d.f, d.id)) && toast("Card bought");
      case "activate": { const r = S.actions.toggleActivate(d.f, d.id); if (r && r.ok === false) toast(r.msg, true); return; }
      case "addship": return openAddShip(d.f);
      case "rmship": return S.actions.removeShip(d.id);
      case "logmark": S.actions.log("mission", d.msg); return toast(d.msg);
      case "createbriefing": return createBriefing();
      case "debrief": return openModal(debriefModal(d.id));
      case "resolvemission": return resolveMission(d.id);
      case "delmission": if (confirm("Delete mission?")) S.actions.deleteMission(d.id); return;
      case "addevent": { const txt = val("evText").trim(); if (txt) { S.actions.addGlobalEvent(txt, num("evTurns")); renderView(); } return; }
      case "rmevent": return S.actions.removeGlobalEvent(d.id);
    }
  });

  function openDataLeech() {
    const facs = c().facilities.filter(f => f.owner === "nemesis" && f.status === "operational");
    if (!facs.length) return toast("No NEMESIS facility to target", true);
    openModal(`<button class="modal__close" data-action="closemodal">×</button><h3>Data Leech</h3><p class="muted">Shut down a NEMESIS facility for 2 turns:</p><div style="display:flex;flex-direction:column;gap:.4rem;margin-top:.6rem">${facs.map(f => { const t = S.helpers.facilityType(f.type); return `<button class="btn" data-action="doleech" data-id="${f.id}">${t.name} @ ${f.nodeId}</button>`; }).join("")}</div>`);
  }
  function openAddShip(fid) {
    openModal(`<button class="modal__close" data-action="closemodal">×</button><h3>Add ship / unit</h3>
      <label class="fl">Name</label><input class="fi" id="shName" placeholder="e.g. Nemesis Prowler"/>
      <label class="fl">Type</label><select class="fi" id="shType">${D.unitTypes.map(u => `<option value="${u.key}">${u.name}</option>`).join("")}</select>
      <div style="margin-top:1rem"><button class="btn btn--primary" data-action="confirmship" data-f="${fid}">Add</button></div>`);
  }

  document.addEventListener("click", e => {
    const t = e.target.closest("[data-action]"); if (!t) return;
    const a = t.dataset.action, d = t.dataset;
    if (a === "doleech") { res(S.actions.dataLeech(d.id)); toast("Data Leech activated"); return closeModal(); }
    if (a === "confirmship") { const name = val("shName") || "Unit", type = val("shType"); S.actions.addShip(name, type, d.f, null); toast("Ship added"); return closeModal(); }
  });

  function createBriefing() {
    const m = S.actions.createMission({ id: val("mId"), title: val("mTitle"), type: val("mType"), actor: val("mActor"), targetNode: val("mNode"), objective: val("mObj"), respawn: val("mResp"), reward: val("mRew") });
    toast("Briefing " + m.id + " published"); renderView();
  }
  function resolveMission(id) {
    const box = el("modalBox");
    const outcome = (box.querySelector('input[name="dbout"]:checked') || {}).value || "success";
    const opts = { outcome, flipOnFail: el("dbflip") && el("dbflip").checked, classifiedAdvance: el("dbclass") && el("dbclass").checked, notes: val("dbnotes"),
      resDelta: { nemesis: { resources: num("dbN_r"), influence: num("dbN_i"), intel: num("dbN_x") }, legion: { resources: num("dbL_r"), influence: num("dbL_i"), intel: num("dbL_x") } } };
    res(S.actions.resolveMission(id, opts)); closeModal(); toast("Mission resolved · " + outcome); go("missions");
  }

  /* ---------- init ---------- */
  function render() { renderChrome(); renderNav(); renderView(); }
  S.subscribe(() => { renderChrome(); renderView(); });
  el("btnExport").onclick = () => { S.exportJSON(); toast("Campaign exported"); };
  el("btnImport").onclick = () => el("fileImport").click();
  el("fileImport").onchange = e => { if (e.target.files[0]) S.importJSON(e.target.files[0]).then(() => toast("Campaign imported")).catch(() => toast("Import failed", true)); };
  el("btnReset").onclick = () => { if (confirm("Reset the entire campaign?")) { S.reset(); toast("Campaign reset"); } };
  boot(); render();
})();
