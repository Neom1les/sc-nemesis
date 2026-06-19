/* ============================================================
   NEMESIS // site behaviour
   ============================================================ */

/* ┌──────────────────────────────────────────────────────────┐
   │  EDIT YOUR JOIN LINKS HERE — replace the two URLs below.   │
   └──────────────────────────────────────────────────────────┘ */
const NEMESIS_CONFIG = {
  discordInvite: "https://discord.gg/CHANGE-ME",                       // ← your Discord invite
  rsiOrgUrl:     "https://robertsspaceindustries.com/orgs/CHANGE-ME",  // ← your RSI Spectrum org
};

(() => {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* reveal helper (declared early so the scroll handler can call it) */
  const revealEls = $$(".reveal");
  const revealInView = () => {
    for (const el of revealEls) {
      if (el.classList.contains("in")) continue;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92 && r.bottom > 0) el.classList.add("in");
    }
  };

  /* ---------- wire join links ---------- */
  const wire = (el, url) => {
    if (!el) return;
    const live = url && !/CHANGE-ME/.test(url);
    el.href = live ? url : "#enlist";
    if (!live) {
      el.title = "Set this link in script.js → NEMESIS_CONFIG";
      el.addEventListener("click", (e) => {
        if (!live) { e.preventDefault();
          el.classList.add("shake");
          setTimeout(() => el.classList.remove("shake"), 500);
        }
      });
    }
  };
  wire($("#joinDiscord"), NEMESIS_CONFIG.discordInvite);
  wire($("#joinRsi"), NEMESIS_CONFIG.rsiOrgUrl);

  /* ---------- boot sequence ---------- */
  const boot = $("#boot"), fill = $("#bootFill"), log = $("#bootLog");
  const lines = [
    "// ESTABLISHING SECURE UPLINK",
    "// DECRYPTING DOSSIER · ONYX",
    "// NEMESIS PROTOCOL · ONLINE",
    "// WELCOME, OPERATIVE",
  ];
  if (reduce) { boot && boot.classList.add("done"); }
  else if (boot) {
    let p = 0, li = 0;
    const tick = setInterval(() => {
      p = Math.min(100, p + Math.random() * 26);
      fill.style.width = p + "%";
      const want = Math.floor((p / 100) * lines.length);
      while (li < want && li < lines.length) { log.innerHTML = `<span>${lines[li]}</span>`; li++; }
      if (p >= 100) {
        clearInterval(tick);
        log.innerHTML = `<span>${lines[lines.length - 1]}</span>`;
        setTimeout(() => boot.classList.add("done"), 520);
      }
    }, 230);
  }

  /* ---------- nav: scroll state + mobile ---------- */
  const nav = $("#nav"), burger = $("#burger"), links = $("#navLinks");
  const onScroll = () => { nav.classList.toggle("scrolled", window.scrollY > 40); revealInView(); };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  burger?.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
  });
  $$("#navLinks a").forEach(a => a.addEventListener("click", () => {
    links.classList.remove("open"); burger?.setAttribute("aria-expanded", "false");
  }));

  /* ---------- reveal on scroll (IO primary + robust fallback) ---------- */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("in"));
  }
  // safety net: cover environments where IO callbacks don't fire reliably
  window.addEventListener("load", () => requestAnimationFrame(revealInView));
  revealInView();

  /* ---------- roster counters ---------- */
  const counters = $$(".num[data-count]");
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, target = +el.dataset.count, suffix = el.dataset.suffix || "";
      const dur = 1400, t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      cio.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach(el => cio.observe(el));

  /* ---------- coverflow card carousel (works regardless of reduced-motion) ---------- */
  const cf = $("#coverflow");
  if (cf) {
    const stage = $("#cfStage");
    const cards = $$(".cf-card", stage);
    const dotsWrap = $("#cfDots");
    const N = cards.length;
    let active = Math.floor(N / 2);

    cards.forEach((_, i) => {
      const d = document.createElement("button");
      d.className = "cf-dot"; d.type = "button"; d.setAttribute("aria-label", `Show card ${i + 1}`);
      d.addEventListener("click", () => go(i));
      dotsWrap.appendChild(d);
    });
    const dots = $$(".cf-dot", dotsWrap);

    function layout() {
      cards.forEach((card, i) => {
        const off = i - active, a = Math.abs(off);
        const x = off * 168, rot = off * -24, tz = a === 0 ? 0 : -a * 150;
        const scale = a === 0 ? 1.08 : Math.max(0.6, 0.82 - (a - 1) * 0.14);
        const op = a > 1 ? 0 : (a === 0 ? 1 : 0.82);  // show only 3: centre + 2 neighbours
        card.style.transform = `translate(-50%,-50%) translateX(${x}px) translateZ(${tz}px) rotateY(${rot}deg) scale(${scale})`;
        card.style.zIndex = String(100 - a);
        card.style.opacity = String(op);
        card.style.filter = a === 0 ? "none" : `brightness(${Math.max(0.45, 0.85 - (a - 1) * 0.22)})`;
        card.style.pointerEvents = op === 0 ? "none" : "auto";
        card.classList.toggle("is-active", off === 0);
      });
      dots.forEach((d, i) => d.classList.toggle("is-active", i === active));
    }
    function go(i) { active = Math.max(0, Math.min(N - 1, i)); layout(); }

    let downX = null, dragged = false;
    const px = e => (e.touches ? e.touches[0].clientX : e.clientX);
    cards.forEach((card, i) => card.addEventListener("click", () => { if (i !== active && !dragged) go(i); }));
    $("#cfNext")?.addEventListener("click", () => go(active + 1));
    $("#cfPrev")?.addEventListener("click", () => go(active - 1));
    cf.addEventListener("pointerdown", e => { downX = px(e); dragged = false; });
    window.addEventListener("pointermove", e => { if (downX === null) return; if (Math.abs(px(e) - downX) > 8) dragged = true; });
    window.addEventListener("pointerup", e => { if (downX === null) return; const dx = px(e) - downX; downX = null; if (dx <= -50) go(active + 1); else if (dx >= 50) go(active - 1); });
    cf.tabIndex = 0;
    cf.addEventListener("keydown", e => {
      if (e.key === "ArrowRight") { e.preventDefault(); go(active + 1); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); go(active - 1); }
    });
    layout();
    window.addEventListener("resize", layout);
  }

  /* ---------- hero cinematic video crossfade ---------- */
  const hVids = $$(".hero__video");
  if (hVids.length > 1) {
    const ready = v => v.readyState >= 3 || v.videoWidth > 0;
    let vi = 0;
    setInterval(() => {
      const n = (vi + 1) % hVids.length;
      if (n === vi || !ready(hVids[n])) return;   // skip layers not yet loaded
      hVids[vi].classList.remove("is-active");
      hVids[n].classList.add("is-active");
      vi = n;
    }, 6500);
  }

  if (reduce) return; /* skip motion-heavy ambient effects below */

  /* ---------- hero parallax (mouse) ---------- */
  const heroBg = $("#heroBg");
  const hero = $("#hero");
  if (heroBg && hero) {
    hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX / r.width - .5), y = (e.clientY / r.height - .5);
      heroBg.style.transform = `translate3d(${x * -18}px, ${y * -18}px, 0) scale(1.06)`;
    });
    hero.addEventListener("mouseleave", () => { heroBg.style.transform = ""; });
  }

  /* ---------- scroll parallax (bg layers) ---------- */
  const plx = $$("[data-parallax]");
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const vh = window.innerHeight;
      plx.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const off = (r.top + r.height / 2 - vh / 2) / vh;
        if (el.id === "heroBg") return; // hero handled by mouse
        el.style.transform = `translate3d(0, ${off * 40}px, 0) scale(1.16)`;
      });
      ticking = false;
    });
  }, { passive: true });
})();
