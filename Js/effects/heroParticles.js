/*
 * Hero particles rendered on a single canvas.
 */

export function initHeroParticles(
  hero,
  {
    count = 45,
    reduceMotion = false,
  } = {},
) {
  if (!hero || reduceMotion) return { destroy: () => {} };

  const canvas = document.createElement("canvas");
  canvas.id = "heroParticleCanvas";
  canvas.setAttribute("aria-hidden", "true");
  hero.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return { destroy: () => {} };
  }

  const resize = () => {
    canvas.width = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  };
  resize();

  let resizeObserver = null;
  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(hero);
  }

  const makeParticle = (width, height) => ({
    x: Math.random() * width,
    y: Math.random() * height * 0.65,
    r: 0.8 + Math.random() * 2.2,
    op: 0.15 + Math.random() * 0.45,
    drift: (Math.random() - 0.5) * 0.25,
    speed: 0.06 + Math.random() * 0.15,
    phase: Math.random() * Math.PI * 2,
    pulse: 1.0 + Math.random() * 3,
  });

  const particles = Array.from({ length: count }, () =>
    makeParticle(canvas.width, canvas.height),
  );

  let rafId = null;
  let t = 0;
  let isVisible = false;

  const observer = new IntersectionObserver(
    (entries) => {
      isVisible = entries[0]?.isIntersecting ?? false;
      if (isVisible && !rafId) {
        rafId = requestAnimationFrame(draw);
      }
    },
    { threshold: 0 },
  );
  observer.observe(hero);

  const draw = () => {
    if (!isVisible) {
      rafId = null;
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    t += 0.01;

    for (const particle of particles) {
      const pulseOpacity =
        particle.op * (0.5 + 0.5 * Math.sin(t / particle.pulse + particle.phase));

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${pulseOpacity})`;
      ctx.fill();

      if (pulseOpacity > 0.15) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${pulseOpacity * 0.12})`;
        ctx.fill();
      }

      particle.x += particle.drift;
      particle.y -= particle.speed;

      if (particle.y < -4) {
        particle.y = canvas.height * 0.65 + 4;
        particle.x = Math.random() * canvas.width;
      }
      if (particle.x < -4) particle.x = canvas.width + 4;
      if (particle.x > canvas.width + 4) particle.x = -4;
    }

    rafId = requestAnimationFrame(draw);
  };

  rafId = requestAnimationFrame(draw);

  const destroy = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    resizeObserver?.disconnect();
    observer.disconnect();
    canvas.remove();
  };

  return { destroy };
}
