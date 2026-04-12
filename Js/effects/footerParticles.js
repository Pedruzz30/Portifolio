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
export function initFooterParticles({
  footer,
  count = 65,
  reduceMotion = false,
}) {
  // Mais plâncton
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
    canvas.width = footer.offsetWidth;
    canvas.height = footer.offsetHeight;
  };

  // Gera uma partícula com propriedades aleatórias
  const createParticle = () => {
    const w = canvas.width || 600;
    const h = canvas.height || 200;
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1.5 + Math.random() * 2.5, // medusas maiores no escuro
      opacity: 0.4 + Math.random() * 0.6, // brilho base muito mais intenso
      opBase: 0.4 + Math.random() * 0.6,
      speedX: (Math.random() - 0.5) * 0.25, // mais vivas
      speedY: -0.1 - Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2, // fase da pulsação
      pulse: 0.012 + Math.random() * 0.02, // piscam mais rápido
      hue: 190 + Math.random() * 30, // azul-ciano (190–220)
    };
  };

  const init = () => {
    resize();
    particles = Array.from({ length: count }, createParticle);
  };

  let isVisible = false;
  const observer = new IntersectionObserver(
    (entries) => {
      isVisible = entries[0].isIntersecting;
      if (isVisible && running && !reduceMotion && !rafId) {
        rafId = requestAnimationFrame(draw);
      }
    },
    { threshold: 0 },
  );
  observer.observe(footer);

  // Desenha um frame
  const draw = (timestamp) => {
    if (!running || !isVisible) {
      rafId = null;
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      // Pulsa a opacidade em torno da base
      p.phase += p.pulse;
      const alpha = p.opBase + Math.sin(p.phase) * 0.2;

      // Move a partícula
      p.x += p.speedX;
      p.y += p.speedY;

      // Rebobina quando sai da tela
      if (p.y < -4) p.y = canvas.height + 4;
      if (p.x < -4) p.x = canvas.width + 4;
      if (p.x > canvas.width + 4) p.x = -4;

      // Ponto bioluminescente com halo radial
      const glowRadius = p.r * 4.5; // Expande muito mais a luz em volta da partícula
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
      // Centro quase branco e puro, clareando o núcleo da medusa
      grad.addColorStop(0, `hsla(${p.hue}, 100%, 80%, ${Math.min(alpha, 1)})`);
      grad.addColorStop(
        0.3,
        `hsla(${p.hue}, 90%, 60%, ${Math.min(alpha * 0.6, 1)})`,
      );
      grad.addColorStop(1, `hsla(${p.hue}, 80%, 40%, 0)`);

      ctx.beginPath();
      ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    rafId = requestAnimationFrame(draw);
  };

  // Estado estático para reduceMotion: apenas renderiza uma vez
  const drawStatic = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      const glowRadius = p.r * 4;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
      grad.addColorStop(
        0,
        `hsla(${p.hue}, 100%, 80%, ${Math.min(p.opBase * 0.8, 1)})`,
      );
      grad.addColorStop(1, `hsla(${p.hue}, 80%, 40%, 0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
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
      observer.disconnect();
      canvas.remove();
    },
  };
}
