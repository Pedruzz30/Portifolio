const canHover = window.matchMedia("(hover: hover)").matches;
const prefersReducedMotion =
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* =========================
   VANILLA TILT — LAZY INIT
========================= */
function initLazyTilt(cards) {
  const items = cards.filter(Boolean);
  if (!window.VanillaTilt || !items.length || prefersReducedMotion) {
    return () => {};
  }

  const idleHandles = new WeakMap();

  const scheduleTilt = (el) => {
    if (el.vanillaTilt) return;
    const init = () => {
      idleHandles.delete(el);
      if (el.vanillaTilt) return;
      window.VanillaTilt.init(el, {
        max: 8,
        speed: 600,
        glare: true,
        "max-glare": 0.12,
      });
    };

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(init, { timeout: 350 });
      idleHandles.set(el, { type: "idle", id });
    } else {
      const id = window.setTimeout(init, 0);
      idleHandles.set(el, { type: "timeout", id });
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        if (entry.isIntersecting && !el.vanillaTilt) {
          scheduleTilt(el);
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.25 }
  );

  items.forEach((card) => observer.observe(card));

  return () => {
    observer.disconnect();
    items.forEach((card) => {
      const handle = idleHandles.get(card);
      if (!handle) return;
      if (handle.type === "idle" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(handle.id);
      } else {
        clearTimeout(handle.id);
      }
      idleHandles.delete(card);
    });
    items.forEach((card) => {
      try {
        card.vanillaTilt?.destroy();
      } catch {}
    });
  };
}

/* =========================
   PORTFOLIO HOVER — ELITE
========================= */
function initPortfolioHover(items) {
  const cards = items.filter(Boolean);
  if (!cards.length || !window.gsap || !canHover || prefersReducedMotion) {
    return () => {};
  }

  const cleanups = [];

  cards.forEach((card) => {
    const glow = card.querySelector(".project-card__glow");
    const score = card.querySelector(".project-card__status");
    const meta = card.querySelectorAll(".project-tag");

    const targets = [glow, score, ...meta].filter(Boolean);
    gsap.set(targets, { clearProps: "all" });

    const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });

    if (glow) tl.to(glow, { opacity: 1, duration: 0.45, ease: "power2.out" }, 0);
    if (score) tl.to(score, { y: -4, duration: 0.35, ease: "power2.out" }, 0);
    if (meta.length) tl.to(meta, { y: -2, duration: 0.35, stagger: 0.04, ease: "power2.out" }, 0);

    const enter = () => tl.play();
    const leave = () => tl.reverse();

    card.addEventListener("pointerenter", enter);
    card.addEventListener("pointerleave", leave);

    cleanups.push(() => {
      card.removeEventListener("pointerenter", enter);
      card.removeEventListener("pointerleave", leave);
      tl.kill();
    });
  });

  return () => cleanups.forEach((fn) => fn());
}

/* =========================
   HERO MOUSE PARALLAX
   Camadas em profundidades distintas respondem ao cursor
========================= */
function initHeroParallax(hero) {
  if (!hero || prefersReducedMotion || !canHover || !window.gsap) return () => {};

  const orbs    = hero.querySelector(".hero-orbs");
  const panels  = hero.querySelector(".floating-panels");
  const visual  = hero.querySelector(".hero-visual");

  if (!orbs) return () => {};

  // quickTo cria uma função de animação contínua sem criar novas tweens a cada frame
  const orbsX   = gsap.quickTo(orbs,   "x", { duration: 0.9, ease: "power1.out" });
  const orbsY   = gsap.quickTo(orbs,   "y", { duration: 0.9, ease: "power1.out" });
  const panelsX = panels ? gsap.quickTo(panels, "x", { duration: 1.4, ease: "power1.out" }) : null;
  const panelsY = panels ? gsap.quickTo(panels, "y", { duration: 1.4, ease: "power1.out" }) : null;
  const visualX = visual ? gsap.quickTo(visual, "x", { duration: 1.1, ease: "power1.out" }) : null;
  const visualY = visual ? gsap.quickTo(visual, "y", { duration: 1.1, ease: "power1.out" }) : null;

  const onMove = (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;  // -0.5 → +0.5
    const y = (e.clientY - rect.top)  / rect.height - 0.5;

    // Orbs: camada mais profunda — movimento maior
    orbsX(x * 32);
    orbsY(y * 18);

    // Visual: velocidade intermediária
    visualX?.(x * 18);
    visualY?.(y * 10);

    // Panels: camada "mais próxima" do viewer — movimento menor (parallax inverso)
    panelsX?.(x * 10);
    panelsY?.(y * 6);
  };

  const onLeave = () => {
    orbsX(0);   orbsY(0);
    visualX?.(0); visualY?.(0);
    panelsX?.(0); panelsY?.(0);
  };

  hero.addEventListener("mousemove", onMove);
  hero.addEventListener("mouseleave", onLeave);

  return () => {
    hero.removeEventListener("mousemove", onMove);
    hero.removeEventListener("mouseleave", onLeave);
    gsap.set([orbs, visual, panels].filter(Boolean), { x: 0, y: 0 });
  };
}

/* =========================
   SCROLL PARALLAX — Hero
   Camadas deslizam a velocidades distintas conforme o scroll
========================= */
function initHeroScrollParallax(hero) {
  if (!hero || prefersReducedMotion || !window.gsap || !window.ScrollTrigger) return () => {};

  const visual  = hero.querySelector(".hero-visual");
  const panels  = hero.querySelector(".floating-panels");
  const content = hero.querySelector(".hero-content");

  const tls = [];

  if (visual) {
    const tl = gsap.to(visual, {
      yPercent: 18,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: 0.8,
      },
    });
    tls.push(tl);
  }

  if (panels) {
    const tl = gsap.to(panels, {
      yPercent: -14,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: 1.2,
      },
    });
    tls.push(tl);
  }

  if (content) {
    const tl = gsap.to(content, {
      yPercent: 10,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: 0.5,
      },
    });
    tls.push(tl);
  }

  return () => tls.forEach((t) => t.scrollTrigger?.kill());
}

/* =========================
   HERO BUBBLES — bolhas ascendentes geradas em JS
========================= */
function initHeroBubbles(hero) {
  if (!hero || prefersReducedMotion) return () => {};

  const container = document.createElement("div");
  container.className = "hero-bubbles";
  container.setAttribute("aria-hidden", "true");
  hero.appendChild(container);

  const BUBBLE_COUNT = 9;

  for (let i = 0; i < BUBBLE_COUNT; i++) {
    const bubble = document.createElement("span");
    bubble.className = "hero-bubble";

    const size     = 3 + Math.random() * 9;           // 3–12px
    const left     = 8  + Math.random() * 84;          // 8–92%
    const duration = 9  + Math.random() * 18;          // 9–27s
    const delay    = Math.random() * duration;          // fase aleatória
    const drift    = (Math.random() - 0.5) * 50;       // -25 → +25px

    bubble.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${left}%;
      --bubble-drift: ${drift}px;
      animation-duration: ${duration}s;
      animation-delay: -${delay}s;
    `;

    container.appendChild(bubble);
  }

  return () => container.remove();
}

/* =========================
   MAIN ANIMATIONS — ULTIMATE
========================= */
export function initAnimations({
  heroContent,
  textReveal = [],
  textMask,
  serviceCards = [],
  portfolioItems = [],
}) {
  const revealText = textReveal.filter(Boolean);
  const services   = serviceCards.filter(Boolean);
  const portfolio  = portfolioItems.filter(Boolean);

  const cleanups = [];

  const showEverything = () => {
    heroContent?.classList.add("visible");
    revealText.forEach((el) => (el.style.transform = "translateY(0)"));
    services.forEach((el) => el.classList.add("visible"));
    portfolio.forEach((el) => el.classList.add("visible"));
    if (textMask) {
      textMask.style.clipPath = "polygon(0 0,100% 0,100% 100%,0 100%)";
    }
    if (typeof window.fillProgressInstant === "function") {
      window.fillProgressInstant();
    }
  };

  if (prefersReducedMotion || !window.gsap) {
    showEverything();
    return { destroy: () => {} };
  }

  if (window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* HERO INIT */
  heroContent?.classList.add("visible");

  /* TEXT REVEAL + MASK */
  const introTimeline = gsap.timeline({
    defaults: { overwrite: "auto", force3D: true },
  });

  if (revealText.length) {
    introTimeline.to(
      revealText,
      {
        y: 0,
        stagger: 0.09,
        duration: 1.0,
        ease: "power4.out",
      },
      0.15
    );
  }

  if (textMask) {
    introTimeline.to(
      textMask,
      {
        clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)",
        duration: 1.2,
        ease: "power3.inOut",
      },
      0.35
    );
  }

  cleanups.push(() => introTimeline.kill());

  /* SCROLL REVEAL — DEPTH (surfacing from below) */
  if (window.ScrollTrigger) {
    const items = [...services, ...portfolio];

    // Estado inicial: objetos submersos — turvo, comprimido, invisível
    gsap.set(items, {
      opacity: 0,
      y: 55,
      scale: 0.97,
      filter: "blur(4px)",
      force3D: true,
      willChange: "transform, opacity, filter",
    });

    ScrollTrigger.batch(items, {
      start: "top 84%",
      once: true,
      onEnter: (batch) => {
        batch.forEach((el) => el.classList.add("visible"));
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          stagger: 0.10,
          duration: 0.90,
          ease: "power3.out",
          overwrite: "auto",
          onComplete: () => gsap.set(batch, { clearProps: "willChange,filter" }),
        });
      },
    });

    try {
      ScrollTrigger.refresh();
    } catch {}
  } else {
    showEverything();
  }

  /* HERO MOUSE PARALLAX */
  const hero = document.querySelector(".hero");
  const destroyParallax = initHeroParallax(hero);
  cleanups.push(destroyParallax);

  /* HERO SCROLL PARALLAX */
  const destroyScrollParallax = initHeroScrollParallax(hero);
  cleanups.push(destroyScrollParallax);

  /* HERO BUBBLES */
  const destroyBubbles = initHeroBubbles(hero);
  cleanups.push(destroyBubbles);

  /* TILT (LAZY) */
  const destroyTilt = initLazyTilt(services);
  cleanups.push(destroyTilt);

  /* HOVER */
  const destroyHover = initPortfolioHover(portfolio);
  cleanups.push(destroyHover);

  return {
    destroy: () => cleanups.forEach((fn) => fn()),
  };
}

