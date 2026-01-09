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
        max: 15,
        speed: 400,
        glare: true,
        "max-glare": 0.2,
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
    const glow = card.querySelector(".p2-glow");
    const lines = card.querySelector(".p2-lines");
    const score = card.querySelector(".p2-score");
    const meta = card.querySelectorAll(".p2-pill");

    const targets = [glow, lines, score, ...meta].filter(Boolean);
    gsap.set(targets, { clearProps: "all" });

    const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });

    if (glow) tl.to(glow, { filter: "blur(14px)", opacity: 1, duration: 0.45, ease: "power2.out" }, 0);
    if (lines) tl.to(lines, { opacity: 0.8, duration: 0.35, ease: "power2.out" }, 0);
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
  const services = serviceCards.filter(Boolean);
  const portfolio = portfolioItems.filter(Boolean);

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

  /* HERO */
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
        stagger: 0.07,
        duration: 0.9,
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
        duration: 1.1,
        ease: "power3.inOut",
      },
      0.3
    );
  }

  cleanups.push(() => introTimeline.kill());

  /* SCROLL REVEAL — BATCH */
  if (window.ScrollTrigger) {
    const items = [...services, ...portfolio];

    gsap.set(items, { opacity: 0, y: 40, force3D: true, willChange: "transform, opacity" });

    ScrollTrigger.batch(items, {
      start: "top 82%",
      once: true,
      onEnter: (batch) => {
        batch.forEach((el) => el.classList.add("visible"));
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          duration: 0.7,
          ease: "power2.out",
          overwrite: "auto",
          onComplete: () => gsap.set(batch, { clearProps: "willChange" }),
        });
      },
    });

    try {
      ScrollTrigger.refresh();
    } catch {}
  } else {
    showEverything();
  }

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

