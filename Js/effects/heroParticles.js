/*
 * ═══════════════════════════════════════════════════════════
 *  effects/heroParticles.js — Superfície do Oceano
 *
 *  Injeta dois elementos no hero:
 *  1. <canvas id="heroParticleCanvas"> — partículas de luz
 *     suspensas: bolhinhas brancas subindo lentamente,
 *     mais brilhantes e menores que as do footer (superfície).
 *
 *  2. <div class="hero-surface-waves"> — ondas SVG no topo
 *     do hero, simulando a interface ar/água.
 *
 *  Segue o mesmo padrão de initFooterParticles:
 *  ResizeObserver + rAF loop + { destroy } para cleanup.
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Inicializa as partículas de superfície e ondas no hero.
 *
 * @param {HTMLElement} hero      - Elemento .hero
 * @param {Object}     [options]
 * @param {number}     [options.count=28]         - Quantidade de partículas
 * @param {boolean}    [options.reduceMotion=false]
 * @returns {{ destroy: () => void }}
 */
export function initHeroParticles(hero, {
  count        = 28,
  reduceMotion = false,
} = {}) {
  if (!hero || reduceMotion) return { destroy: () => {} };

  // ── Canvas de partículas ─────────────────────────────────
  const canvas = document.createElement("canvas");
  canvas.id = "heroParticleCanvas";
  canvas.setAttribute("aria-hidden", "true");
  hero.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  // ── Ondas SVG ────────────────────────────────────────────
  // Dois paths SVG sobrepostos criam profundidade nas ondas
  const wavesDiv = document.createElement("div");
  wavesDiv.className = "hero-surface-waves";
  wavesDiv.setAttribute("aria-hidden", "true");
  wavesDiv.innerHTML = `
    <svg viewBox="0 0 1200 52" preserveAspectRatio="none" fill="none"
         xmlns="http://www.w3.org/2000/svg">
      <path d="M0 24 C150 8 300 40 450 24 C600 8 750 40 900 24 C1050 8 1150 36 1200 24 L1200 0 L0 0 Z"
            fill="rgba(255,255,255,0.18)"/>
      <path d="M0 32 C180 16 360 44 540 28 C720 12 900 44 1080 28 C1140 22 1170 30 1200 28 L1200 0 L0 0 Z"
            fill="rgba(255,255,255,0.08)"/>
    </svg>
  `;
  hero.appendChild(wavesDiv);

  // ── Resize ───────────────────────────────────────────────
  const resize = () => {
    canvas.width  = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  };
  resize();

  let resizeObserver = null;
  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(hero);
  }

  // ── Partículas ───────────────────────────────────────────
  // Superfície: partículas brancas (não azuis como no footer),
  // concentradas no terço superior do hero (mais perto da luz).
  const makeParticle = (w, h) => ({
    x:     Math.random() * w,
    // Concentra no terço superior — onde a luz solar chega
    y:     Math.random() * h * 0.65,
    r:     0.6 + Math.random() * 1.8,
    op:    0.08 + Math.random() * 0.32,
    drift: (Math.random() - 0.5) * 0.18,
    speed: 0.04 + Math.random() * 0.10,
    phase: Math.random() * Math.PI * 2,
    pulse: 1.5 + Math.random() * 4,
  });

  const particles = Array.from(
    { length: count },
    () => makeParticle(canvas.width, canvas.height)
  );

  // ── Loop ─────────────────────────────────────────────────
  let rafId = null;
  let t     = 0;

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    t += 0.01;

    for (const p of particles) {
      const pulseOp = p.op * (0.5 + 0.5 * Math.sin(t / p.pulse + p.phase));

      // Núcleo branco — diferente do footer (azul-ciano)
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${pulseOp})`;
      ctx.fill();

      // Halo suave só acima do limiar
      if (pulseOp > 0.15) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${pulseOp * 0.12})`;
        ctx.fill();
      }

      // Movimento: sobe e deriva lateralmente
      p.x += p.drift;
      p.y -= p.speed;

      // Wrap: renasce na base do terço superior
      if (p.y < -4) {
        p.y = canvas.height * 0.65 + 4;
        p.x = Math.random() * canvas.width;
      }
      if (p.x < -4)               p.x = canvas.width + 4;
      if (p.x > canvas.width + 4) p.x = -4;
    }

    rafId = requestAnimationFrame(draw);
  };

  rafId = requestAnimationFrame(draw);

  // ── Cleanup ──────────────────────────────────────────────
  const destroy = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    resizeObserver?.disconnect();
    canvas.remove();
    wavesDiv.remove();
  };

  return { destroy };
}
