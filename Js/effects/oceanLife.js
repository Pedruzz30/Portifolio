/*
 * ═══════════════════════════════════════════════════════════
 *  effects/oceanLife.js — Vida do Oceano
 *
 *  Quatro efeitos que adicionam vida à narrativa oceânica:
 *
 *  1. Cardume (Flocking)
 *     Peixinhos com comportamento de flocking real:
 *     separação, coesão e alinhamento. Fogem do cursor.
 *     Vivem no hero, mas podem ser ativados em qualquer seção.
 *
 *  2. Ondas de perturbação (Ripples)
 *     A cada movimento do cursor, uma onda circular se forma
 *     naquela posição, expande e desaparece — como um dedo
 *     tocando a superfície da água.
 *
 *  3. Parallax de profundidade
 *     Três camadas de partículas subindo em velocidades
 *     diferentes. As mais "distantes" sobem mais devagar.
 *     Reage ao scroll para intensificar o efeito de mergulho.
 *
 *  4. Bolhas nos cards do portfólio
 *     No mouseenter, bolhas emergem da base do card com
 *     trajetória em S e somem gradualmente — como um objeto
 *     submerso perturbado liberando ar.
 *
 *  Padrão do projeto:
 *  - Respeita prefersReducedMotion
 *  - Retorna { destroy } para cleanup no pagehide
 *  - Usa ResizeObserver para redimensionar o canvas
 *  - Não usa will-change além do necessário
 * ═══════════════════════════════════════════════════════════
 */
 
/**
 * Inicializa todos os efeitos de vida oceânica.
 *
 * @param {Object}      options
 * @param {HTMLElement} options.hero          - Elemento .hero (canvas do cardume + ripples)
 * @param {HTMLElement} options.main          - Elemento <main> (parallax de profundidade)
 * @param {HTMLElement[]} options.projectCards - Cards .project-card (bolhas no hover)
 * @param {boolean}     [options.reduceMotion=false]
 * @returns {{ destroy: () => void }}
 */
export function initOceanLife({
  hero,
  main,
  projectCards = [],
  reduceMotion  = false,
} = {}) {
  if (reduceMotion) return { destroy: () => {} };
 
  const cleanups = [];
 
  // ── 1. Cardume + Ripples no Hero ───────────────────────
  if (hero) {
    cleanups.push(initFlock(hero));
  }
 
  // ── 2. Parallax de profundidade no <main> ──────────────
  if (main) {
    cleanups.push(initParallaxLayers(main));
  }
 
  // ── 3. Bolhas nos cards do portfólio ───────────────────
  const cards = projectCards.filter(Boolean);
  if (cards.length) {
    cleanups.push(initCardBubbles(cards));
  }
 
  return {
    destroy: () => cleanups.forEach(fn => fn()),
  };
}
 
/* ═══════════════════════════════════════════════════════════
   EFEITO 1 — CARDUME + ONDAS DE PERTURBAÇÃO
   Canvas injetado no hero. Peixinhos com flocking real
   que fogem do cursor. Ondas circulares a cada mousemove.
   ═══════════════════════════════════════════════════════════ */
function initFlock(hero) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = `
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 4;
  `;
  hero.appendChild(canvas);
 
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  let rafId = null;
  let t = 0;
 
  const mouse = { x: -9999, y: -9999 };
 
  // ── Resize ─────────────────────────────────────────────
  const resize = () => {
    W = canvas.width  = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
  };
  resize();
 
  let resizeObserver = null;
  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(hero);
  }
 
  // ── Cardume ────────────────────────────────────────────
  const FISH_COUNT = 48;
 
  const flock = Array.from({ length: FISH_COUNT }, () => ({
    x:     Math.random() * window.innerWidth,
    y:     Math.random() * (window.innerHeight * 0.6) + 60,
    vx:    (Math.random() - 0.5) * 1.2,
    vy:    (Math.random() - 0.5) * 0.8,
    size:  2.2 + Math.random() * 2,
    phase: Math.random() * Math.PI * 2,
    depth: 0.4 + Math.random() * 0.6,
  }));
 
  const updateFlock = () => {
    flock.forEach(f => {
      let ax = 0, ay = 0;
      let sepX = 0, sepY = 0, sepN = 0;
      let cohX = 0, cohY = 0, cohN = 0;
      let aliVx = 0, aliVy = 0, aliN = 0;
 
      flock.forEach(n => {
        if (n === f) return;
        const dx = n.x - f.x;
        const dy = n.y - f.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
 
        // Separação — evita colisão
        if (d < 30 && d > 0) {
          sepX -= dx / d;
          sepY -= dy / d;
          sepN++;
        }
 
        // Coesão + alinhamento
        if (d < 85) {
          cohX  += n.x;  cohY  += n.y;  cohN++;
          aliVx += n.vx; aliVy += n.vy; aliN++;
        }
      });
 
      if (sepN) { ax += (sepX / sepN) * 0.08; ay += (sepY / sepN) * 0.08; }
      if (cohN) { ax += (cohX / cohN - f.x) * 0.0014; ay += (cohY / cohN - f.y) * 0.0014; }
      if (aliN) { ax += (aliVx / aliN - f.vx) * 0.055; ay += (aliVy / aliN - f.vy) * 0.055; }
 
      // Fuga do cursor
      const cdx = f.x - mouse.x;
      const cdy = f.y - mouse.y;
      const cd  = Math.sqrt(cdx * cdx + cdy * cdy);
      if (cd < 100 && cd > 0) {
        const force = (100 - cd) / 100;
        ax += (cdx / cd) * force * 0.40;
        ay += (cdy / cd) * force * 0.40;
      }
 
      // Atração suave ao centro do hero
      ax += (W * 0.5 - f.x) * 0.00025;
      ay += (H * 0.4 - f.y) * 0.00025;
 
      // Limita velocidade
      f.vx = Math.max(-2.4, Math.min(2.4, f.vx + ax));
      f.vy = Math.max(-1.8, Math.min(1.8, f.vy + ay));
      f.x += f.vx;
      f.y += f.vy;
 
      // Wrap nas bordas
      if (f.x < -10)    f.x = W + 10;
      if (f.x > W + 10) f.x = -10;
      if (f.y < 40)        f.y = 40;
      if (f.y > H - 80)    f.y = H - 80;
    });
  };
 
  const drawFish = (f) => {
    const angle  = Math.atan2(f.vy, f.vx);
    const wobble = Math.sin(t * 4 + f.phase) * 0.14;
    const op     = 0.28 + f.depth * 0.45;
    const sz     = f.size * f.depth;
    const r      = Math.round(80  + f.depth * 80);
    const g      = Math.round(170 + f.depth * 40);
 
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(angle + wobble);
 
    // Corpo
    ctx.beginPath();
    ctx.ellipse(0, 0, sz * 2.2, sz * 0.85, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},${g},255,${op})`;
    ctx.fill();
 
    // Cauda
    ctx.beginPath();
    ctx.moveTo(-sz * 1.8, 0);
    ctx.lineTo(-sz * 3.0, -sz * 1.1);
    ctx.lineTo(-sz * 3.0,  sz * 1.1);
    ctx.closePath();
    ctx.fill();
 
    ctx.restore();
  };
 
  // ── Ondas de perturbação ────────────────────────────────
  const ripples = [];
  let lastRipple = 0;
 
  const onMouseMove = (e) => {
    const now = Date.now();
    if (now - lastRipple < 75) return; // throttle: 1 onda a cada 75ms
    lastRipple = now;
 
    const rect = hero.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
 
    mouse.x = x;
    mouse.y = y;
 
    ripples.push({ x, y, r: 0, op: 0.32 });
    if (ripples.length > 14) ripples.shift();
  };
 
  const onMouseLeave = () => {
    mouse.x = -9999;
    mouse.y = -9999;
  };
 
  hero.addEventListener('mousemove',  onMouseMove);
  hero.addEventListener('mouseleave', onMouseLeave);
 
  // ── Loop ────────────────────────────────────────────────
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    t += 0.016;
 
    // Flocking
    updateFlock();
    flock.forEach(drawFish);
 
    // Ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      rp.r  += 2.5;
      rp.op -= 0.016;
      if (rp.op <= 0) { ripples.splice(i, 1); continue; }
 
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(180,230,255,${rp.op})`;
      ctx.lineWidth   = 1;
      ctx.stroke();
    }
 
    rafId = requestAnimationFrame(draw);
  };
 
  rafId = requestAnimationFrame(draw);
 
  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    resizeObserver?.disconnect();
    hero.removeEventListener('mousemove',  onMouseMove);
    hero.removeEventListener('mouseleave', onMouseLeave);
    canvas.remove();
  };
}
 
/* ═══════════════════════════════════════════════════════════
   EFEITO 2 — PARALLAX DE PROFUNDIDADE
   Canvas injetado no <main>. Três camadas de partículas
   subindo em velocidades diferentes. Reage ao scroll.
   ═══════════════════════════════════════════════════════════ */
function initParallaxLayers(main) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = `
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    opacity: 0.55;
  `;
  document.body.appendChild(canvas);
 
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  let rafId = null;
  let t = 0;
 
  const resize = () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });
 
  // Três camadas de profundidade
  const layers = [
    // Camada distante — pequena, lenta, transparente
    Array.from({ length: 14 }, () => ({
      x:     Math.random() * window.innerWidth,
      y:     Math.random() * window.innerHeight,
      r:     0.8 + Math.random() * 1.2,
      speed: 0.12,
      op:    0.10 + Math.random() * 0.08,
      phase: Math.random() * Math.PI * 2,
    })),
    // Camada média
    Array.from({ length: 9 }, () => ({
      x:     Math.random() * window.innerWidth,
      y:     Math.random() * window.innerHeight,
      r:     1.5 + Math.random() * 2,
      speed: 0.24,
      op:    0.16 + Math.random() * 0.10,
      phase: Math.random() * Math.PI * 2,
    })),
    // Camada próxima — grande, rápida, mais visível
    Array.from({ length: 5 }, () => ({
      x:     Math.random() * window.innerWidth,
      y:     Math.random() * window.innerHeight,
      r:     2.5 + Math.random() * 3,
      speed: 0.42,
      op:    0.22 + Math.random() * 0.12,
      phase: Math.random() * Math.PI * 2,
    })),
  ];
 
  // Scroll velocity
  let scrollVel = 0;
  let lastScroll = window.scrollY;
 
  const onScroll = () => {
    const current = window.scrollY;
    scrollVel = (current - lastScroll) * 0.4;
    lastScroll = current;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
 
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    t += 0.012;
 
    // Decai o scroll velocity
    scrollVel *= 0.92;
 
    layers.forEach((layer, li) => {
      const depthFactor = (li + 1) / layers.length;
 
      layer.forEach(p => {
        // Sobe sozinho + reage ao scroll
        p.y -= p.speed + scrollVel * depthFactor;
        // Drift lateral orgânico
        p.x += Math.sin(t * 0.4 + p.phase) * 0.18;
 
        // Wrap: renasce no fundo quando sai pelo topo
        if (p.y < -10) {
          p.y = H + 10;
          p.x = Math.random() * W;
        }
        if (p.x < -10)    p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
 
        // Pulso de opacidade
        const pulseOp = p.op * (0.6 + 0.4 * Math.sin(t * 1.5 + p.phase));
 
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100,210,255,${pulseOp})`;
        ctx.fill();
      });
    });
 
    rafId = requestAnimationFrame(draw);
  };
 
  rafId = requestAnimationFrame(draw);
 
  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    window.removeEventListener('scroll', onScroll);
    canvas.remove();
  };
}
 
/* ═══════════════════════════════════════════════════════════
   EFEITO 3 — BOLHAS NOS CARDS DO PORTFÓLIO
   Canvas global para bolhas. No mouseenter de cada card,
   7 bolhas emergem da base com trajetória em S.
   ═══════════════════════════════════════════════════════════ */
function initCardBubbles(cards) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = `
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 999;
  `;
  document.body.appendChild(canvas);
 
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  let rafId = null;
 
  const resize = () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });
 
  const bubbles = [];
 
  /**
   * Spawna bolhas na base de um card.
   * @param {HTMLElement} card
   */
  const spawnBubbles = (card) => {
    const rect = card.getBoundingClientRect();
    const cx   = rect.left + rect.width / 2;
    const cy   = rect.bottom;
 
    for (let i = 0; i < 7; i++) {
      bubbles.push({
        x:      cx + (Math.random() - 0.5) * rect.width * 0.65,
        y:      cy,
        vy:     -(0.9 + Math.random() * 1.5),
        vx:     (Math.random() - 0.5) * 0.5,
        r:      2.2 + Math.random() * 4,
        op:     0.45 + Math.random() * 0.30,
        life:   1.0,
        decay:  0.007 + Math.random() * 0.006,
        driftA: Math.random() * Math.PI * 2,  // fase do drift lateral
        driftF: 1.5 + Math.random() * 1.5,    // frequência do drift
      });
    }
  };
 
  // Registra eventos nos cards
  const handlers = cards.map(card => {
    const fn = () => spawnBubbles(card);
    card.addEventListener('mouseenter', fn);
    return { card, fn };
  });
 
  // Loop
  let t = 0;
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    t += 0.016;
 
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
 
      b.life -= b.decay;
      if (b.life <= 0) { bubbles.splice(i, 1); continue; }
 
      // Movimento: sobe com drift lateral em S
      b.y  += b.vy;
      b.x  += b.vx + Math.sin(t * b.driftF + b.driftA) * 0.32;
 
      // Desacelera levemente ao subir
      b.vy *= 0.995;
 
      const currentOp = b.op * b.life;
 
      // Círculo da bolha
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(180,230,255,${currentOp})`;
      ctx.lineWidth   = 1;
      ctx.stroke();
 
      // Brilho interno — reflexo de luz
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.28, b.y - b.r * 0.28, b.r * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.32 * b.life})`;
      ctx.fill();
    }
 
    rafId = requestAnimationFrame(draw);
  };
 
  rafId = requestAnimationFrame(draw);
 
  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    handlers.forEach(({ card, fn }) => card.removeEventListener('mouseenter', fn));
    canvas.remove();
  };
}