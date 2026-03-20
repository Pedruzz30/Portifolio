/*
 * ═══════════════════════════════════════════════════════════
 *  effects/footerParticles.js — Plâncton Bioluminescente
 *
 *  Cria partículas flutuantes no canvas do footer simulando
 *  organismos bioluminescentes no fundo do oceano.
 *
 *  API pública:
 *    initFooterParticles({ footer, count, reduceMotion })
 *    → { destroy }
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Inicializa as partículas bioluminescentes no footer.
 *
 * @param {object} options
 * @param {Element} options.footer       - Elemento .site-footer
 * @param {number}  options.count        - Quantidade de partículas
 * @param {boolean} options.reduceMotion - Desabilita animação se true
 * @returns {{ destroy: () => void }}
 */
export function initFooterParticles({ footer, count = 40, reduceMotion = false }) {
  if (!footer || typeof window === "undefined") return { destroy: () => {} };

  // Cria o canvas e injeta no footer
  const canvas = document.createElement("canvas");
  canvas.id = "footerParticleCanvas";
  footer.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy: () => canvas.remove() };

  // Se reduceMotion estiver ativo, usa um estado estático (sem animação)
  let rafId = null;
  let particles = [];
  let running = true;

  // Redimensiona o canvas para cobrir o footer
  const resize = () => {
    canvas.width  = footer.offsetWidth;
    canvas.height = footer.offsetHeight;
  };

  // Gera uma partícula com propriedades aleatórias
  const createParticle = () => {
    const w = canvas.width  || 600;
    const h = canvas.height || 200;
    return {
      x:       Math.random() * w,
      y:       Math.random() * h,
      r:       0.8 + Math.random() * 1.6,     // raio: 0.8–2.4 px
      opacity: 0.15 + Math.random() * 0.55,   // opacidade inicial
      opBase:  0.15 + Math.random() * 0.55,   // base para pulsação
      speedX:  (Math.random() - 0.5) * 0.18,  // deriva horizontal
      speedY:  -0.06 - Math.random() * 0.14,  // sobe levemente
      phase:   Math.random() * Math.PI * 2,   // fase da pulsação
      pulse:   0.008 + Math.random() * 0.012, // velocidade de pulso
      hue:     190 + Math.random() * 30,      // azul-ciano (190–220)
    };
  };

  const init = () => {
    resize();
    particles = Array.from({ length: count }, createParticle);
  };

  // Desenha um frame
  const draw = (timestamp) => {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      // Pulsa a opacidade em torno da base
      p.phase += p.pulse;
      const alpha = p.opBase + Math.sin(p.phase) * 0.2;

      // Move a partícula
      p.x += p.speedX;
      p.y += p.speedY;

      // Rebobina quando sai da tela
      if (p.y < -4)            p.y = canvas.height + 4;
      if (p.x < -4)            p.x = canvas.width + 4;
      if (p.x > canvas.width + 4) p.x = -4;

      // Ponto bioluminescente com halo radial
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.5);
      grad.addColorStop(0,   `hsla(${p.hue}, 90%, 70%, ${Math.min(alpha, 1)})`);
      grad.addColorStop(0.4, `hsla(${p.hue}, 80%, 55%, ${Math.min(alpha * 0.5, 1)})`);
      grad.addColorStop(1,   `hsla(${p.hue}, 70%, 45%, 0)`);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    rafId = requestAnimationFrame(draw);
  };

  // Estado estático para reduceMotion: apenas renderiza uma vez
  const drawStatic = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
      grad.addColorStop(0,   `hsla(${p.hue}, 90%, 70%, ${p.opBase * 0.6})`);
      grad.addColorStop(1,   `hsla(${p.hue}, 70%, 45%, 0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  };

  const resizeObserver = new ResizeObserver(() => {
    resize();
    if (reduceMotion) drawStatic();
  });

  init();

  if (reduceMotion) {
    drawStatic();
  } else {
    rafId = requestAnimationFrame(draw);
  }

  resizeObserver.observe(footer);

  return {
    destroy: () => {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      canvas.remove();
    },
  };
}
