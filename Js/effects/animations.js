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

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target;

        if (entry.isIntersecting && !el.vanillaTilt) {
          window.VanillaTilt.init(el, {
            max: 15,
            speed: 400,
            glare: true,
            "max-glare": 0.2,
          });
        }
      });
    },
    { threshold: 0.25 }
  );

  items.forEach((card) => observer.observe(card));

  return () => {
    observer.disconnect();
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

  cards.forEach((item) => {
    const img = item.querySelector("img");
    const overlay = item.querySelector(".item-overlay");
    const title = item.querySelector("h4");

    gsap.set([img, overlay, title].filter(Boolean), { clearProps: "all" });
    if (overlay) gsap.set(overlay, { opacity: 0 });
    if (title) gsap.set(title, { y: 20 });

    const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });

    if (img) tl.to(img, { scale: 1.1, duration: 0.45, ease: "power2.out" }, 0);
    if (overlay) tl.to(overlay, { opacity: 1, duration: 0.25 }, 0);
    if (title) tl.to(title, { y: 0, duration: 0.45, ease: "power2.out" }, 0);

    const enter = () => tl.play();
    const leave = () => tl.reverse();

    item.addEventListener("pointerenter", enter);
    item.addEventListener("pointerleave", leave);

    cleanups.push(() => {
      item.removeEventListener("pointerenter", enter);
      item.removeEventListener("pointerleave", leave);
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
  skillsCards = [],
  skillsMetrics = [],
  skillsBadges = [],
  skillsTrackBars = [],
  skillsMeters = [],
}) {
  const revealText = textReveal.filter(Boolean);
  const services = serviceCards.filter(Boolean);
  const portfolio = portfolioItems.filter(Boolean);
  const skillCards = skillsCards.filter(Boolean);
  const skillMetrics = skillsMetrics.filter(Boolean);
  const skillBadges = skillsBadges.filter(Boolean);
  const trackBars = skillsTrackBars.filter(Boolean);
  const meterBars = skillsMeters.filter(Boolean);
  const progressBars = [...trackBars, ...meterBars];

  const cleanups = [];

  const clampProgress = (value) => {
    const numeric = Number.parseFloat(value);
    if (Number.isNaN(numeric)) return 0;
    return Math.min(1, Math.max(0, numeric));
  };

  const fillProgressInstant = (bars) => {
    bars.forEach((bar) => {
      const target = clampProgress(bar.dataset.progress);
      bar.style.width = `${target * 100}%`;
    });
  };

  const showEverything = () => {
    heroContent?.classList.add("visible");
    revealText.forEach((el) => (el.style.transform = "translateY(0)"));
    services.forEach((el) => el.classList.add("visible"));
    portfolio.forEach((el) => el.classList.add("visible"));
    skillCards.forEach((el) => (el.style.opacity = "1"));
    skillMetrics.forEach((el) => (el.style.opacity = "1"));
    skillBadges.forEach((el) => (el.style.opacity = "1"));
    if (textMask) {
      textMask.style.clipPath = "polygon(0 0,100% 0,100% 100%,0 100%)";
    }
    fillProgressInstant(progressBars);
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

  /* TEXT REVEAL */
  if (revealText.length) {
    const tween = gsap.to(revealText, {
      y: 0,
      stagger: 0.07,
      duration: 0.9,
      ease: "power4.out",
      delay: 0.15,
    });
    cleanups.push(() => tween.kill());
  }

  /* MASK */
  if (textMask) {
    const tween = gsap.to(textMask, {
      clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)",
      duration: 1.2,
      delay: 0.4,
      ease: "power3.inOut",
    });
    cleanups.push(() => tween.kill());
  }

  /* SCROLL REVEAL — BATCH */
  if (window.ScrollTrigger) {
    const items = [...services, ...portfolio];

    gsap.set(items, { opacity: 0, y: 40 });

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
        });
      },
    });

     const skillReveals = [...skillCards, ...skillMetrics, ...skillBadges];

    if (skillReveals.length) {
      gsap.set(skillReveals, { opacity: 0, y: 30 });

      ScrollTrigger.batch(skillReveals, {
        start: "top 82%",
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            stagger: 0.08,
            duration: 0.7,
            ease: "power2.out",
            overwrite: "auto",
          });
        },
      });
    }

    const animateBars = (bars) => {
      if (!bars.length) return;

      gsap.set(bars, { width: 0 });

      ScrollTrigger.batch(bars, {
        start: "top 88%",
        once: true,
        onEnter: (batch) => {
          batch.forEach((bar) => {
            const target = clampProgress(bar.dataset.progress);
            gsap.to(bar, {
              width: `${target * 100}%`,
              duration: 0.9,
              ease: "power2.out",
              overwrite: "auto",
            });
          });
        },
      });
    };

    animateBars(progressBars);

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

