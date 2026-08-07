/*
 * ═══════════════════════════════════════════════════════════
 *  effects/depth-gauge.js — Marcadores de profundidade
 *
 *  Dirige dois elementos temáticos ligados ao scroll:
 *   1. .depth-gauge  → medidor lateral fixo. A profundidade é
 *      interpolada entre as zonas (data-depth) conforme a linha
 *      de sonda (centro da viewport) desce pelo documento, então
 *      o número e a zona ficam sempre coerentes entre si.
 *   2. .depth-tag    → uma etiqueta ("500 m · Zona de Transição")
 *      injetada antes do eyebrow de cada seção, revelada no scroll.
 *
 *  rAF único por frame, leituras de layout antes das escritas.
 *  Acessibilidade: sob reduced-motion as etiquetas já nascem
 *  visíveis e as transições do CSS ficam desligadas.
 * ═══════════════════════════════════════════════════════════
 */

const ZONE_NAMES = {
  surface: "Superfície",
  mesopelagic: "Zona Mesopelágica",
  transition: "Zona de Transição",
  twilight: "Zona Crepuscular",
  bathypelagic: "Zona Batipelágica",
  abyssal: "Zona Abissal",
  floor: "Fundo do Oceano",
};

export function setupDepthGauge({
  gauge,
  sections,
  prefersReducedMotion = false,
  signal,
} = {}) {
  const points = (sections || [])
    .map((el) => {
      const depth = parseFloat(el.getAttribute("data-depth"));
      if (!Number.isFinite(depth)) return null;
      return { el, depth, zone: el.getAttribute("data-ocean-zone") || "" };
    })
    .filter(Boolean);

  if (points.length < 2) return { destroy: () => {} };

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));

  // ── 1. Etiquetas por seção ────────────────────────────────
  const tags = [];
  let tagObserver = null;

  const revealAllTags = () => tags.forEach((t) => t.classList.add("is-visible"));

  points.forEach(({ el, depth, zone }) => {
    // Só seções de conteúdo ganham etiqueta (o rodapé já tem a sua).
    if (!el.hasAttribute("data-section")) return;

    const eyebrow = el.querySelector(
      ".section-eyebrow, .contact-eyebrow, .stack-roadmap__eyebrow",
    );
    if (!eyebrow?.parentElement) return;

    const tag = document.createElement("div");
    tag.className = "depth-tag";
    tag.setAttribute("aria-hidden", "true");
    tag.dataset.zone = zone;

    const value = document.createElement("span");
    value.className = "depth-tag__value";
    value.textContent = `${depth} m`;

    const sep = document.createElement("span");
    sep.className = "depth-tag__sep";
    sep.textContent = "·";

    const name = document.createElement("span");
    name.className = "depth-tag__zone";
    name.textContent = ZONE_NAMES[zone] || zone;

    tag.append(value, sep, name);
    eyebrow.parentElement.insertBefore(tag, eyebrow);
    tags.push(tag);
  });

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealAllTags();
  } else {
    tagObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    tags.forEach((tag) => tagObserver.observe(tag));
  }

  // ── 2. Medidor lateral ────────────────────────────────────
  const valueEl = gauge?.querySelector(".depth-gauge__value");
  const zoneEl = gauge?.querySelector(".depth-gauge__zone");
  const fillEl = gauge?.querySelector(".depth-gauge__fill");
  const markerEl = gauge?.querySelector(".depth-gauge__marker");

  let rafId = null;
  let lastDepth = null;
  let lastZone = null;
  let lastProgress = null;

  const update = () => {
    rafId = null;
    if (!gauge) return;

    // ── leituras ──
    const probe = window.scrollY + window.innerHeight * 0.5;
    const tops = points.map(
      (p) => p.el.getBoundingClientRect().top + window.scrollY,
    );

    // ── cálculo ──
    let idx = 0;
    for (let i = 0; i < tops.length; i += 1) {
      if (tops[i] <= probe) idx = i;
    }

    const cur = points[idx];
    const next = points[idx + 1];

    let depth = cur.depth;
    if (next) {
      const span = tops[idx + 1] - tops[idx];
      const t = span > 0 ? clamp((probe - tops[idx]) / span, 0, 1) : 0;
      depth = lerp(cur.depth, next.depth, t);
    }

    const first = tops[0];
    const last = tops[tops.length - 1];
    const progress =
      last > first ? clamp((probe - first) / (last - first), 0, 1) : 0;

    const roundedDepth = Math.round(depth / 10) * 10;
    const quantProgress = Math.round(progress * 1000) / 1000;

    // ── escritas ──
    if (roundedDepth !== lastDepth) {
      lastDepth = roundedDepth;
      if (valueEl) valueEl.textContent = `${roundedDepth.toLocaleString("pt-BR")} m`;
    }

    if (cur.zone !== lastZone) {
      lastZone = cur.zone;
      if (zoneEl) zoneEl.textContent = ZONE_NAMES[cur.zone] || cur.zone;
      gauge.dataset.zone = cur.zone;
    }

    if (quantProgress !== lastProgress) {
      lastProgress = quantProgress;
      if (fillEl) fillEl.style.transform = `scaleY(${quantProgress})`;
      if (markerEl) markerEl.style.top = `${quantProgress * 100}%`;
    }
  };

  const scheduleUpdate = () => {
    if (rafId) return;
    rafId = window.requestAnimationFrame(update);
  };

  const listenerOptions = signal ? { passive: true, signal } : { passive: true };
  window.addEventListener("scroll", scheduleUpdate, listenerOptions);
  window.addEventListener("resize", scheduleUpdate, listenerOptions);

  update();

  return {
    destroy: () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (rafId) window.cancelAnimationFrame(rafId);
      tagObserver?.disconnect();
      tags.forEach((tag) => tag.remove());
    },
  };
}
