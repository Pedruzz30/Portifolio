/*
 * ═══════════════════════════════════════════════════════════
 *  effects/oceanLife.js — Vida Oceânica
 *
 *  Quatro efeitos complementares à narrativa de profundidade:
 *
 *  1. Header  — Tensão Superficial (ripples no cursor)
 *  2. About   — Correnteza com Corpo (fios de corrente bezier)
 *  3. Roadmap — Nodes com Vida Própria (DOM: pulso + partícula + onda)
 *  4. Footer  — Abismo que Respira (medusas + respiração radial)
 *
 *  Cada efeito:
 *  - Tem seu próprio canvas/DOM injetado na seção
 *  - Usa IntersectionObserver para pausar/retomar rAF
 *  - Usa ResizeObserver para redimensionar
 *  - Retorna função de cleanup
 *
 *  API pública:
 *    initOceanLife({ header, hero, about, roadmap, footer, projectCards, reduceMotion })
 *    → { destroy }
 * ═══════════════════════════════════════════════════════════
 */

export function initOceanLife({
  header,
  hero,
  about,
  roadmap,
  footer,
  projectCards = [],
  reduceMotion = false,
} = {}) {
  if (reduceMotion) return { destroy: () => {} };

  const cleanups = [];
  const hasHover = window.matchMedia("(hover: hover)").matches;

  if (header) cleanups.push(initSurfaceTension(header, hasHover));
  if (about) cleanups.push(initCurrentStreams(about, hasHover));
  if (roadmap) cleanups.push(initRoadmapLife(roadmap));
  if (footer) cleanups.push(initAbyssBreath(footer));

  return {
    destroy: () => cleanups.forEach((fn) => fn()),
  };
}

/* ═══════════════════════════════════════════════════════════
   HELPER — Cria canvas com padrão do projeto
   ═══════════════════════════════════════════════════════════ */
function createCanvas(parent, zIndex) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = `
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: ${zIndex};
  `;
  parent.appendChild(canvas);
  return canvas;
}

/* ═══════════════════════════════════════════════════════════
   HELPER — IntersectionObserver para pausar/retomar rAF
   ═══════════════════════════════════════════════════════════ */
function createVisibilityObserver(element, onVisible, onHidden) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) onVisible();
      else onHidden();
    },
    { threshold: 0 }
  );
  observer.observe(element);
  return observer;
}

/* ═══════════════════════════════════════════════════════════
   EFEITO 1 — HEADER: TENSÃO SUPERFICIAL
   Ondas circulares (ripples) na posição do cursor.
   ═══════════════════════════════════════════════════════════ */
function initSurfaceTension(header, hasHover) {
  const canvas = createCanvas(header, 0);
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => canvas.remove();

  let W = 0,
    H = 0;
  let rafId = null;
  let visible = false;

  const resize = () => {
    W = canvas.width = header.offsetWidth;
    H = canvas.height = header.offsetHeight;
  };
  resize();

  const resizeObs = new ResizeObserver(resize);
  resizeObs.observe(header);

  const ripples = [];
  let lastRippleTime = 0;

  const onMouseMove = (e) => {
    const now = Date.now();
    if (now - lastRippleTime < 80) return;
    lastRippleTime = now;

    const rect = header.getBoundingClientRect();
    ripples.push({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      r: 0,
      op: 0.25,
    });
    if (ripples.length > 10) ripples.shift();
  };

  if (hasHover) {
    header.addEventListener("mousemove", onMouseMove);
  }

  const draw = () => {
    if (!visible) {
      rafId = null;
      return;
    }

    ctx.clearRect(0, 0, W, H);

    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      rp.r += 1.5;
      rp.op -= 0.25 / (40 / 1.5); // fade over ~40px radius growth

      if (rp.op <= 0 || rp.r > 40) {
        ripples.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${rp.op})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    rafId = requestAnimationFrame(draw);
  };

  const visObs = createVisibilityObserver(
    header,
    () => {
      visible = true;
      if (!rafId) rafId = requestAnimationFrame(draw);
    },
    () => {
      visible = false;
    }
  );

  return () => {
    visible = false;
    if (rafId) cancelAnimationFrame(rafId);
    resizeObs.disconnect();
    visObs.disconnect();
    if (hasHover) header.removeEventListener("mousemove", onMouseMove);
    canvas.remove();
  };
}

/* ═══════════════════════════════════════════════════════════
   EFEITO 2 — ABOUT: CORRENTEZA COM CORPO
   6 fios de corrente fluindo da esquerda para a direita,
   com desvio do cursor e profundidade variável.
   ═══════════════════════════════════════════════════════════ */
function initCurrentStreams(about, hasHover) {
  const canvas = createCanvas(about, 1);
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => canvas.remove();

  let W = 0,
    H = 0;
  let rafId = null;
  let visible = false;
  let t = 0;

  const resize = () => {
    W = canvas.width = about.offsetWidth;
    H = canvas.height = about.offsetHeight;
  };
  resize();

  const resizeObs = new ResizeObserver(resize);
  resizeObs.observe(about);

  const mouse = { x: -9999, y: -9999 };

  const onMouseMove = (e) => {
    const rect = about.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  };
  const onMouseLeave = () => {
    mouse.x = -9999;
    mouse.y = -9999;
  };

  if (hasHover) {
    about.addEventListener("mousemove", onMouseMove);
    about.addEventListener("mouseleave", onMouseLeave);
  }

  // 6 fios de corrente com profundidade variável
  const STRAND_COUNT = 6;
  const POINTS_PER_STRAND = 8;

  const strands = Array.from({ length: STRAND_COUNT }, (_, i) => {
    const depth = 0.3 + Math.random() * 0.7;
    const speed = 0.4 + Math.random() * 0.4;
    const baseY = ((i + 1) / (STRAND_COUNT + 1)) * (H || 600);
    const phase = Math.random() * Math.PI * 2;
    const opacity = 0.04 + depth * 0.06;
    const lineWidth = 1 + depth;

    const points = Array.from({ length: POINTS_PER_STRAND }, (_, j) => ({
      x: (j / (POINTS_PER_STRAND - 1)) * (W || 1200),
      y: baseY,
      baseY: baseY,
      phaseOffset: j * 0.8 + phase,
    }));

    return { points, depth, speed, opacity, lineWidth, phase, offsetX: 0 };
  });

  const draw = () => {
    if (!visible) {
      rafId = null;
      return;
    }

    ctx.clearRect(0, 0, W, H);
    t += 0.016;

    for (const strand of strands) {
      strand.offsetX += strand.speed;
      if (strand.offsetX > W / (POINTS_PER_STRAND - 1)) {
        strand.offsetX = 0;
      }

      // Update point positions
      const spacing = W / (POINTS_PER_STRAND - 1);
      for (let j = 0; j < strand.points.length; j++) {
        const p = strand.points[j];
        p.x = j * spacing - strand.offsetX;

        // Wrap: when a point exits right, wrap to left
        if (p.x > W + spacing) p.x -= W + spacing * 2;

        // Vertical oscillation
        const wave = Math.sin(t * 1.2 + p.phaseOffset) * 25 * strand.depth;
        p.y = p.baseY + wave;

        // Cursor deflection
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80 && dist > 0) {
          const force = (80 - dist) / 80;
          p.y += (dy / dist) * force * 30;
        }
      }

      // Draw bezier curve through points
      ctx.beginPath();
      ctx.moveTo(strand.points[0].x, strand.points[0].y);

      for (let j = 0; j < strand.points.length - 1; j++) {
        const curr = strand.points[j];
        const next = strand.points[j + 1];
        const cpx = (curr.x + next.x) / 2;
        const cpy = (curr.y + next.y) / 2;
        ctx.quadraticCurveTo(curr.x, curr.y, cpx, cpy);
      }

      const last = strand.points[strand.points.length - 1];
      ctx.lineTo(last.x, last.y);

      ctx.strokeStyle = `rgba(255,255,255,${strand.opacity})`;
      ctx.lineWidth = strand.lineWidth;
      ctx.stroke();
    }

    rafId = requestAnimationFrame(draw);
  };

  // Recalculate baseY on resize
  const origResize = resize;
  const resizeWithStrands = () => {
    origResize();
    for (let i = 0; i < strands.length; i++) {
      const baseY = ((i + 1) / (STRAND_COUNT + 1)) * H;
      for (const p of strands[i].points) {
        p.baseY = baseY;
      }
    }
  };
  resizeObs.disconnect();
  const resizeObs2 = new ResizeObserver(resizeWithStrands);
  resizeObs2.observe(about);

  const visObs = createVisibilityObserver(
    about,
    () => {
      visible = true;
      if (!rafId) rafId = requestAnimationFrame(draw);
    },
    () => {
      visible = false;
    }
  );

  return () => {
    visible = false;
    if (rafId) cancelAnimationFrame(rafId);
    resizeObs2.disconnect();
    visObs.disconnect();
    if (hasHover) {
      about.removeEventListener("mousemove", onMouseMove);
      about.removeEventListener("mouseleave", onMouseLeave);
    }
    canvas.remove();
  };
}

/* ═══════════════════════════════════════════════════════════
   EFEITO 3 — ROADMAP: NODES COM VIDA PRÓPRIA
   A) Pulso individual nos nodes via CSS
   B) Partícula de luz no rail via CSS animation
   C) Onda de energia no hover dos cards
   ═══════════════════════════════════════════════════════════ */
function initRoadmapLife(roadmap) {
  const cleanups = [];

  // ── Inject stylesheet for pulse + rail particle ──────────
  const style = document.createElement("style");
  style.textContent = `
    @keyframes oceanNodePulse {
      0%, 100% { transform: translate(-50%, -50%) scale(1); }
      50% { transform: translate(-50%, -50%) scale(calc(1 + var(--pulse-intensity, 0.08))); }
    }

    .is-pulsing::before {
      animation: oceanNodePulse var(--pulse-duration, 3s) ease-in-out infinite !important;
    }

    @keyframes railParticleTravel {
      0% { top: 0%; }
      100% { top: 100%; }
    }

    .rail-particle {
      position: absolute;
      left: calc(var(--rail-x, 1.45rem) - 2px);
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: rgba(80, 190, 255, 0.90);
      box-shadow: 0 0 8px rgba(80, 190, 255, 0.80), 0 0 16px rgba(80, 190, 255, 0.40);
      animation: railParticleTravel 3s linear infinite;
      pointer-events: none;
      z-index: 2;
    }

    @keyframes oceanNodeWave {
      0% { box-shadow: 0 0 0 5px var(--node-glow), 0 0 14px var(--node-color); }
      50% { box-shadow: 0 0 0 14px var(--node-glow), 0 0 22px var(--node-color); }
      100% { box-shadow: 0 0 0 5px var(--node-glow), 0 0 14px var(--node-color); }
    }

    .node-wave::before {
      animation: oceanNodeWave 400ms ease-out forwards !important;
    }
  `;
  document.head.appendChild(style);
  cleanups.push(() => style.remove());

  // ── Part A: Pulsing nodes ─────────────────────────────────
  const steps = Array.from(roadmap.querySelectorAll(".stack-roadmap__step"));
  steps.forEach((step) => {
    const isNow = step.dataset.status === "now";
    step.style.setProperty("--pulse-intensity", isNow ? "0.15" : "0.08");
    step.style.setProperty(
      "--pulse-duration",
      isNow ? `${2 + Math.random() * 0.5}s` : `${2.5 + Math.random() * 1.5}s`
    );
    step.classList.add("is-pulsing");
  });
  cleanups.push(() => {
    steps.forEach((step) => {
      step.classList.remove("is-pulsing");
      step.style.removeProperty("--pulse-intensity");
      step.style.removeProperty("--pulse-duration");
    });
  });

  // ── Part B: Rail particle ─────────────────────────────────
  const timeline = roadmap.querySelector(".stack-roadmap__timeline");
  if (timeline) {
    const particle = document.createElement("div");
    particle.classList.add("rail-particle");
    particle.setAttribute("aria-hidden", "true");
    timeline.style.position = timeline.style.position || "relative";
    timeline.appendChild(particle);
    cleanups.push(() => particle.remove());
  }

  // ── Part C: Energy wave on card hover ─────────────────────
  const cardHandlers = [];
  steps.forEach((step) => {
    const card = step.querySelector(".stack-roadmap__card");
    if (!card) return;

    const onEnter = () => {
      step.classList.add("node-wave");
    };
    const onAnimEnd = () => {
      step.classList.remove("node-wave");
    };

    card.addEventListener("mouseenter", onEnter);
    step.addEventListener("animationend", onAnimEnd);
    cardHandlers.push({ card, step, onEnter, onAnimEnd });
  });
  cleanups.push(() => {
    cardHandlers.forEach(({ card, step, onEnter, onAnimEnd }) => {
      card.removeEventListener("mouseenter", onEnter);
      step.removeEventListener("animationend", onAnimEnd);
      step.classList.remove("node-wave");
    });
  });

  // IntersectionObserver not needed for CSS-only animations (browser handles it)
  // but we use it to add/remove is-pulsing for GPU savings
  const visObs = createVisibilityObserver(
    roadmap,
    () => steps.forEach((s) => s.classList.add("is-pulsing")),
    () => steps.forEach((s) => s.classList.remove("is-pulsing"))
  );
  cleanups.push(() => visObs.disconnect());

  return () => cleanups.forEach((fn) => fn());
}

/* ═══════════════════════════════════════════════════════════
   EFEITO 4 — FOOTER: ABISMO QUE RESPIRA
   A) Medusas derivando no canvas
   B) Respiração radial via CSS animation
   ═══════════════════════════════════════════════════════════ */
function initAbyssBreath(footer) {
  const cleanups = [];

  // ── Part B: Breathing div (CSS animation — no rAF) ────────
  const breathStyle = document.createElement("style");
  breathStyle.textContent = `
    @keyframes abyssBreath {
      0%, 100% { opacity: 0.03; }
      50% { opacity: 0.10; }
    }
    .footer-breath {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: radial-gradient(ellipse at 50% 100%, rgba(80,190,255,0.5), transparent 60%);
      animation: abyssBreath 8s ease-in-out infinite;
      z-index: 0;
    }
  `;
  document.head.appendChild(breathStyle);
  cleanups.push(() => breathStyle.remove());

  const breathDiv = document.createElement("div");
  breathDiv.classList.add("footer-breath");
  breathDiv.setAttribute("aria-hidden", "true");
  footer.appendChild(breathDiv);
  cleanups.push(() => breathDiv.remove());

  // ── Part A: Jellyfish canvas ──────────────────────────────
  // z-index 0 for breath, footerParticleCanvas is z-index 1, content is z-index 2
  // Use z-index 0 for jellyfish canvas (between breath and plankton)
  const canvas = createCanvas(footer, 0);
  canvas.style.zIndex = "0";
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    cleanups.push(() => canvas.remove());
    return () => cleanups.forEach((fn) => fn());
  }

  let W = 0,
    H = 0;
  let rafId = null;
  let visible = false;
  let t = 0;

  const resize = () => {
    W = canvas.width = footer.offsetWidth;
    H = canvas.height = footer.offsetHeight;
  };
  resize();

  const resizeObs = new ResizeObserver(resize);
  resizeObs.observe(footer);

  // 3 jellyfish
  const jellies = Array.from({ length: 3 }, () => {
    const capRadius = 20 + Math.random() * 15;
    const tentacleCount = 6 + Math.floor(Math.random() * 3);
    return {
      x: Math.random() * (W || 800),
      y: Math.random() * (H || 300),
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.3,
      capRadius,
      tentacleCount,
      tentacleLen: 20 + Math.random() * 20,
      pulseCycle: 3 + Math.random() * 2,
      pulsePhase: Math.random() * Math.PI * 2,
      opacity: 0.12 + Math.random() * 0.08,
    };
  });

  const drawJelly = (j) => {
    const pulseScale = 0.9 + 0.2 * (0.5 + 0.5 * Math.sin((t * Math.PI * 2) / j.pulseCycle + j.pulsePhase));
    const cr = j.capRadius * pulseScale;
    const op = j.opacity;

    ctx.save();
    ctx.translate(j.x, j.y);

    // Cap (semi-ellipse)
    ctx.beginPath();
    ctx.ellipse(0, 0, cr, cr * 0.65, 0, Math.PI, 0);
    ctx.fillStyle = `rgba(80,190,255,${op})`;
    ctx.fill();

    // Inner glow
    ctx.beginPath();
    ctx.ellipse(0, -cr * 0.15, cr * 0.5, cr * 0.3, 0, Math.PI, 0);
    ctx.fillStyle = `rgba(120,220,255,${op * 0.5})`;
    ctx.fill();

    // Tentacles
    const tentOp = op / 2;
    const baseWidth = cr * 2;
    for (let i = 0; i < j.tentacleCount; i++) {
      const tx = -baseWidth / 2 + (i / (j.tentacleCount - 1)) * baseWidth;
      const len = j.tentacleLen * (0.7 + 0.3 * Math.sin(t * 2 + i * 1.3 + j.pulsePhase));

      ctx.beginPath();
      ctx.moveTo(tx, 0);

      // Wavy tentacle using quadratic curves
      const waveMid = Math.sin(t * 3 + i * 0.9 + j.pulsePhase) * 8;
      ctx.quadraticCurveTo(tx + waveMid, len * 0.5, tx + waveMid * 0.5, len);

      ctx.strokeStyle = `rgba(45,226,230,${tentOp})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    ctx.restore();
  };

  const draw = () => {
    if (!visible) {
      rafId = null;
      return;
    }

    ctx.clearRect(0, 0, W, H);
    t += 0.016;

    for (const j of jellies) {
      // Drift movement
      j.x += j.vx;
      j.y += j.vy + Math.sin(t * 0.5 + j.pulsePhase) * 0.15;

      // Wrap around edges
      if (j.x < -50) j.x = W + 50;
      if (j.x > W + 50) j.x = -50;
      if (j.y < -50) j.y = H + 50;
      if (j.y > H + 50) j.y = -50;

      drawJelly(j);
    }

    rafId = requestAnimationFrame(draw);
  };

  const visObs = createVisibilityObserver(
    footer,
    () => {
      visible = true;
      if (!rafId) rafId = requestAnimationFrame(draw);
    },
    () => {
      visible = false;
    }
  );

  cleanups.push(() => {
    visible = false;
    if (rafId) cancelAnimationFrame(rafId);
    resizeObs.disconnect();
    visObs.disconnect();
    canvas.remove();
  });

  return () => cleanups.forEach((fn) => fn());
}
