/*
 * GSAP effects orchestrator.
 * This module is now the single owner of runtime motion.
 */

export function initGsapEffects({ reduceMotion = false, isMobile = false } = {}) {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  if (!gsap) {
    console.warn("[gsapEffects] GSAP nao encontrado.");
    revealStaticState();
    return { destroy: () => {} };
  }

  if (ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  if (reduceMotion) {
    revealStaticState();
    return { destroy: () => {} };
  }

  const cleanups = [];

  cleanups.push(initLoaderMerge(gsap));
  cleanups.push(initHeroTextReveal(gsap));
  cleanups.push(initHeroBubbles({ isMobile }));
  cleanups.push(initStatsCounter(gsap, ScrollTrigger));
  cleanups.push(initScrollReveal(gsap, ScrollTrigger));
  cleanups.push(initStaggerCards(gsap, ScrollTrigger));

  if (!isMobile) {
    cleanups.push(initLazyTilt());
    cleanups.push(initPortfolioHover(gsap));
    cleanups.push(initHeroParallax(gsap, ScrollTrigger));
    cleanups.push(initMagneticButtons(gsap));

  }

  return {
    destroy: () => {
      [...cleanups].reverse().forEach((fn) => {
        try {
          fn?.();
        } catch (error) {
          console.warn("[gsapEffects] cleanup ignorado:", error);
        }
      });
    },
  };
}

function revealStaticState() {
  document.querySelector(".hero-content")?.classList.add("visible");

  const heroMask = document.querySelector(".text-mask");
  if (heroMask) {
    heroMask.style.clipPath = "polygon(0 0,100% 0,100% 100%,0 100%)";
    heroMask.style.opacity = "1";
    heroMask.style.transform = "none";
  }

  document.querySelectorAll("#hero-title span").forEach((span) => {
    if (span.dataset.heroRevealWrapper === "true") return;
    span.style.opacity = "1";
    span.style.transform = "translateY(0)";
  });

  document
    .querySelectorAll(
      [
        ".hero-badges",
        ".hero-actions",
        ".hero-stats",
        ".hero-visual",
        ".logo",
        ".nav__list",
        ".about-text",
        ".about-skills-side",
        ".about-value-item",
        ".stack-roadmap__highlight",
        ".contact-form",
        ".contact-chip",
        ".project-card",
        ".tech-item",
        ".js-reveal",
        ".stat__value",
      ].join(", "),
    )
    .forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
      el.style.filter = "none";
    });

  document.querySelectorAll(".stack-roadmap__step").forEach((step) => {
    step.classList.add("is-visible");
  });

  const progressFill = document.querySelector(".stack-roadmap__progress-fill");
  if (progressFill) {
    progressFill.style.transformOrigin = "left";
    progressFill.style.transform = "scaleX(1)";
  }
}

function initLoaderMerge(gsap) {
  const loader = document.querySelector(".loader");
  const brand = document.querySelector(".loader-brand");
  const ring = document.querySelector(".loader-ring");
  if (!loader) return () => {};

  loader.dataset.state = "gsap";

  const water = document.createElement("div");
  water.setAttribute("aria-hidden", "true");
  water.style.cssText = `
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 0%;
    background: linear-gradient(180deg,
      rgba(80,190,255,0.12),
      rgba(30,100,200,0.40)
    );
    border-top: 1px solid rgba(80,190,255,0.45);
    pointer-events: none;
    z-index: 1;
  `;
  loader.appendChild(water);

  if (brand) {
    brand.style.position = "relative";
    brand.style.zIndex = "2";
  }
  if (ring) {
    ring.style.zIndex = "2";
  }

  const tl = gsap.timeline({ delay: 0.5 });

  tl.to(water, {
    height: "100%",
    duration: 0.85,
    ease: "power2.inOut",
  });

  if (brand) {
    tl.to(
      brand,
      {
        y: 12,
        opacity: 0,
        duration: 0.45,
        ease: "power2.in",
      },
      "-=0.55",
    );
  }

  if (ring) {
    tl.to(
      ring,
      {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: "back.in(2)",
      },
      "<",
    );
  }

  tl.to(
    loader,
    {
      yPercent: 8,
      opacity: 0,
      duration: 0.55,
      ease: "power3.in",
      onComplete: () => {
        loader.style.display = "none";
        loader.style.pointerEvents = "none";
        loader.dataset.state = "done";
      },
    },
    "-=0.10",
  );

  return () => {
    tl.kill();
    water.remove();
  };
}

function initHeroTextReveal(gsap) {
  const h1 = document.querySelector("#hero-title");
  const heroContent = document.querySelector(".hero-content");
  heroContent?.classList.add("visible");

  if (!h1) return () => {};

  const rawWords = Array.from(
    h1.querySelectorAll('span:not([data-hero-reveal-wrapper="true"])'),
  );
  if (!rawWords.length) return () => {};

  rawWords.forEach((span) => {
    span.dataset.heroRevealWord = "true";

    if (span.parentElement?.dataset.heroRevealWrapper === "true") {
      return;
    }

    const wrapper = document.createElement("span");
    wrapper.dataset.heroRevealWrapper = "true";
    wrapper.style.cssText =
      "display:inline-block;overflow:hidden;vertical-align:bottom;";
    span.parentNode.insertBefore(wrapper, span);
    wrapper.appendChild(span);
  });

  const words = Array.from(
    h1.querySelectorAll('span[data-hero-reveal-word="true"]'),
  );
  if (!words.length) return () => {};

  const subtitle = document.querySelector(".text-mask");
  const badges = document.querySelector(".hero-badges");
  const actions = document.querySelector(".hero-actions");
  const stats = document.querySelector(".hero-stats");
  const logo = document.querySelector(".logo");
  const navList = document.querySelector(".nav__list");
  const heroVisual =
    document.querySelector(".hero-visual__inner") ||
    document.querySelector(".hero-visual");

  gsap.set(words, { y: "105%", opacity: 0 });
  if (subtitle) gsap.set(subtitle, { opacity: 0, y: 18 });
  if (badges) gsap.set(badges, { opacity: 0, y: 14 });
  if (actions) gsap.set(actions, { opacity: 0, y: 14 });
  if (stats) gsap.set(stats, { opacity: 0, y: 14 });
  if (logo) gsap.set(logo, { opacity: 0, y: -15 });
  if (navList) gsap.set(navList, { opacity: 0, y: -15 });
  if (heroVisual) gsap.set(heroVisual, { opacity: 0, scale: 0.97, x: 14 });

  const tl = gsap.timeline({ delay: 1.3, defaults: { overwrite: "auto" } });

  tl.to(words, {
    y: "0%",
    opacity: 1,
    duration: 0.75,
    ease: "power3.out",
    stagger: 0.09,
  });

  tl.to(
    [subtitle, badges, actions, stats].filter(Boolean),
    {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power2.out",
      stagger: 0.1,
    },
    "-=0.30",
  );

  tl.to(
    [logo, navList].filter(Boolean),
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out",
      stagger: 0.1,
      clearProps: "all",
    },
    0,
  );

  if (heroVisual) {
    tl.to(
      heroVisual,
      {
        opacity: 1,
        scale: 1,
        x: 0,
        duration: 0.82,
        ease: "power2.out",
        clearProps: "opacity,transform",
      },
      "-=0.68",
    );
  }

  return () => tl.kill();
}

function initHeroBubbles({ isMobile }) {
  const hero = document.querySelector(".hero");
  if (!hero) return () => {};

  hero.querySelector(".hero-bubbles")?.remove();

  const container = document.createElement("div");
  container.className = "hero-bubbles";
  container.setAttribute("aria-hidden", "true");
  hero.appendChild(container);

  const bubbleCount = isMobile ? 8 : 18;

  for (let i = 0; i < bubbleCount; i += 1) {
    const bubble = document.createElement("span");
    bubble.className = "hero-bubble";

    const size = 8 + Math.random() * 20;
    const left = 5 + Math.random() * 88;
    const duration = 7 + Math.random() * 6;
    const delay = Math.random() * duration;
    const drift1 = (Math.random() < 0.5 ? 1 : -1) * (8 + Math.random() * 16);
    const drift2 = -drift1 * (0.5 + Math.random() * 0.6);

    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${left}%`;
    bubble.style.animationDuration = `${duration}s`;
    bubble.style.animationDelay = `-${delay}s`;
    bubble.style.setProperty("--bubble-drift", `${drift1.toFixed(1)}px`);
    bubble.style.setProperty("--bubble-drift-2", `${drift2.toFixed(1)}px`);

    container.appendChild(bubble);
  }

  return () => container.remove();
}

function initHeroParallax(gsap, ScrollTrigger) {
  if (!ScrollTrigger) return () => {};

  const hero = document.querySelector(".hero");
  if (!hero) return () => {};

  const heroVisual = document.querySelector(".hero-visual");
  const heroContent = document.querySelector(".hero-content");
  const scrollIndicator = document.querySelector(".scroll-indicator");

  if (!heroVisual && !heroContent && !scrollIndicator) return () => {};

  const tl = gsap.timeline({
    defaults: { ease: "none", overwrite: "auto" },
    scrollTrigger: {
      trigger: hero,
      start: "top top",
      end: "bottom top",
      scrub: 0.45,
      invalidateOnRefresh: true,
      fastScrollEnd: true,
    },
  });

  if (heroVisual) {
    tl.to(heroVisual, { yPercent: 12 }, 0);
  }

  if (heroContent) {
    tl.to(heroContent, { yPercent: 6 }, 0);
  }

  if (scrollIndicator) {
    tl.to(
      scrollIndicator,
      {
        opacity: 0,
        yPercent: 35,
        duration: 0.32,
      },
      0,
    );
  }

  return () => {
    tl.scrollTrigger?.kill();
    tl.kill();
    if (heroVisual) gsap.set(heroVisual, { clearProps: "transform" });
    if (heroContent) gsap.set(heroContent, { clearProps: "transform" });
    if (scrollIndicator) {
      gsap.set(scrollIndicator, { clearProps: "opacity,transform" });
    }
  };
}

function initStatsCounter(gsap, ScrollTrigger) {
  const statsContainer = document.querySelector(".hero-stats");
  if (!statsContainer || !ScrollTrigger) return () => {};

  const stats = statsContainer.querySelectorAll(".stat");
  const triggers = [];
  const tweens = [];

  stats.forEach((stat) => {
    const valueEl = stat.querySelector(".stat__value");
    if (!valueEl) return;

    const raw = valueEl.textContent.trim();
    const numeric = parseFloat(raw.replace(/[^0-9.]/g, ""));
    const suffix = raw.replace(/[0-9.]/g, "").trim();
    const isYear = numeric >= 2000 && numeric <= 2100;

    if (!Number.isNaN(numeric)) {
      gsap.set(valueEl, { opacity: 0 });
      triggers.push(
        ScrollTrigger.create({
          trigger: stat,
          start: "top 88%",
          once: true,
          onEnter: () => {
            const state = { value: isYear ? numeric - 4 : 0 };
            gsap.set(valueEl, { opacity: 1 });
            const tween = gsap.to(state, {
              value: numeric,
              duration: isYear ? 1.6 : 1.2,
              ease: "power2.out",
              onUpdate() {
                valueEl.textContent = Math.round(state.value) + suffix;
              },
            });
            tweens.push(tween);
          },
        }),
      );
      return;
    }

    gsap.set(valueEl, { opacity: 0, y: 8 });
    triggers.push(
      ScrollTrigger.create({
        trigger: stat,
        start: "top 88%",
        once: true,
        onEnter: () => {
          const tween = gsap.to(valueEl, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
          });
          tweens.push(tween);
        },
      }),
    );
  });

  return () => {
    triggers.forEach((trigger) => trigger.kill());
    tweens.forEach((tween) => tween.kill());
  };
}

function initMagneticButtons(gsap) {
  const hasHover = window.matchMedia("(hover: hover)").matches;
  if (!hasHover) return () => {};

  const buttons = Array.from(
    document.querySelectorAll(
      ".btn--depth, .btn--surface, .btn--bio, .btn--ghost, .btn--hero-primary, .btn--hero-secondary",
    ),
  );
  if (!buttons.length) return () => {};

  const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));
  const tracked = [];

  const ensureMotionWrapper = (button) => {
    const existing = Array.from(button.children).find((child) =>
      child.classList?.contains("btn__motion"),
    );
    if (existing) return existing;

    const motion = document.createElement("span");
    motion.className = "btn__motion";

    Array.from(button.childNodes).forEach((node) => {
      motion.appendChild(node);
    });

    button.appendChild(motion);
    return motion;
  };

  const refreshActiveRects = () => {
    tracked.forEach((entry) => {
      if (!entry.active) return;
      entry.rect = entry.button.getBoundingClientRect();
    });
  };

  buttons.forEach((button) => {
    const motionTarget = ensureMotionWrapper(button);
    const entry = {
      button,
      motionTarget,
      rect: null,
      active: false,
    };

    const xTo = gsap.quickTo(motionTarget, "x", {
      duration: 0.28,
      ease: "power3.out",
    });
    const yTo = gsap.quickTo(motionTarget, "y", {
      duration: 0.28,
      ease: "power3.out",
    });

    const updateRect = () => {
      entry.rect = button.getBoundingClientRect();
    };

    const onEnter = () => {
      entry.active = true;
      updateRect();
    };

    const onMove = (event) => {
      if (!entry.rect) updateRect();

      const { left, top, width, height } = entry.rect;
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const maxX = width * 0.16;
      const maxY = height * 0.22;
      const dx = clamp((event.clientX - centerX) * 0.18, maxX);
      const dy = clamp((event.clientY - centerY) * 0.18, maxY);

      xTo(dx);
      yTo(dy);
    };

    const onLeave = () => {
      entry.active = false;
      entry.rect = null;
      gsap.to(motionTarget, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.5)",
        overwrite: "auto",
      });
    };

    button.addEventListener("pointerenter", onEnter);
    button.addEventListener("pointermove", onMove);
    button.addEventListener("pointerleave", onLeave);

    tracked.push({
      ...entry,
      onEnter,
      onMove,
      onLeave,
    });
  });

  window.addEventListener("resize", refreshActiveRects, { passive: true });
  window.addEventListener("scroll", refreshActiveRects, { passive: true });

  return () => {
    window.removeEventListener("resize", refreshActiveRects);
    window.removeEventListener("scroll", refreshActiveRects);

    tracked.forEach(({ button, motionTarget, onEnter, onMove, onLeave }) => {
      button.removeEventListener("pointerenter", onEnter);
      button.removeEventListener("pointermove", onMove);
      button.removeEventListener("pointerleave", onLeave);
      gsap.set(motionTarget, { clearProps: "transform" });
    });
  };
}

function initStaggerCards(gsap, ScrollTrigger) {
  if (!ScrollTrigger) return () => {};

  const triggers = [];
  const tweens = [];

  const portfolioGrid = document.querySelector(".portfolio-grid");
  if (portfolioGrid) {
    const cards = portfolioGrid.querySelectorAll(".project-card");
    gsap.set(cards, { opacity: 0, y: 40, scale: 0.97 });

    triggers.push(
      ScrollTrigger.create({
        trigger: portfolioGrid,
        start: "top 82%",
        once: true,
        onEnter: () => {
          const tween = gsap.to(cards, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.65,
            ease: "power3.out",
            stagger: {
              each: 0.12,
              from: "start",
            },
          });
          tweens.push(tween);
        },
      }),
    );
  }

  const techGrid = document.querySelector(".tech-grid");
  if (techGrid) {
    const items = techGrid.querySelectorAll(".tech-item");
    gsap.set(items, { opacity: 0, scale: 0.88, y: 14 });

    triggers.push(
      ScrollTrigger.create({
        trigger: techGrid,
        start: "top 85%",
        once: true,
        onEnter: () => {
          const tween = gsap.to(items, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.45,
            ease: "back.out(1.4)",
            stagger: {
              each: 0.055,
              from: "start",
            },
          });
          tweens.push(tween);
        },
      }),
    );
  }

  return () => {
    triggers.forEach((trigger) => trigger.kill());
    tweens.forEach((tween) => tween.kill());
  };
}

function initLazyTilt() {
  const hasHover = window.matchMedia("(hover: hover)").matches;
  const items = Array.from(
    document.querySelectorAll(
      ".project-card__plane, .stack-roadmap__card-plane",
    ),
  );

  if (!window.VanillaTilt || !items.length || !hasHover) {
    return () => {};
  }

  const idleHandles = new WeakMap();

  const scheduleTilt = (element) => {
    if (element.vanillaTilt) return;

    const init = () => {
      idleHandles.delete(element);
      if (element.vanillaTilt) return;
      window.VanillaTilt.init(element, {
        max: 7,
        speed: 560,
        glare: true,
        "max-glare": 0.1,
      });
    };

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(init, { timeout: 350 });
      idleHandles.set(element, { type: "idle", id });
      return;
    }

    const id = window.setTimeout(init, 0);
    idleHandles.set(element, { type: "timeout", id });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const element = entry.target;
        if (!entry.isIntersecting || element.vanillaTilt) return;
        scheduleTilt(element);
        observer.unobserve(element);
      });
    },
    { threshold: 0.25 },
  );

  items.forEach((item) => observer.observe(item));

  return () => {
    observer.disconnect();
    items.forEach((item) => {
      const handle = idleHandles.get(item);
      if (!handle) return;
      if (handle.type === "idle" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(handle.id);
      } else {
        window.clearTimeout(handle.id);
      }
      idleHandles.delete(item);
    });
    items.forEach((item) => {
      try {
        item.vanillaTilt?.destroy();
      } catch {}
    });
  };
}

function initPortfolioHover(gsap) {
  const canHover = window.matchMedia("(hover: hover)").matches;
  const cards = Array.from(document.querySelectorAll(".project-card"));
  if (!cards.length || !canHover) return () => {};

  const cleanups = [];

  cards.forEach((card) => {
    const glow = card.querySelector(".project-card__glow");
    const status = card.querySelector(".project-card__status");
    const tags = card.querySelectorAll(".project-tag");
    const targets = [glow, status, ...tags].filter(Boolean);

    gsap.set(targets, { clearProps: "all" });

    const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });

    if (glow) {
      tl.to(glow, { opacity: 1, duration: 0.45, ease: "power2.out" }, 0);
    }
    if (status) {
      tl.to(status, { y: -4, duration: 0.35, ease: "power2.out" }, 0);
    }
    if (tags.length) {
      tl.to(
        tags,
        { y: -2, stagger: 0.04, duration: 0.35, ease: "power2.out" },
        0,
      );
    }

    const onEnter = () => tl.play();
    const onLeave = () => tl.reverse();

    card.addEventListener("pointerenter", onEnter);
    card.addEventListener("pointerleave", onLeave);

    cleanups.push(() => {
      card.removeEventListener("pointerenter", onEnter);
      card.removeEventListener("pointerleave", onLeave);
      tl.kill();
    });
  });

  return () => cleanups.forEach((fn) => fn());
}

function initCursorGlow(gsap) {
  const hasHover = window.matchMedia("(hover: hover)").matches;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (!hasHover || prefersReducedMotion) return () => {};

  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  glow.setAttribute("aria-hidden", "true");
  // position: fixed removes the element from document flow so GSAP transforms
  // (translate X/Y to cursor position) don't inflate scrollHeight and cause
  // extra scroll at the bottom of the page.
  glow.style.cssText = "position:fixed;top:0;left:0;pointer-events:none;z-index:9999;";
  document.body.appendChild(glow);

  const xTo = gsap.quickTo(glow, "x", { duration: 0.2, ease: "power3.out" });
  const yTo = gsap.quickTo(glow, "y", { duration: 0.2, ease: "power3.out" });

  const onMove = (event) => {
    xTo(event.clientX - 20);
    yTo(event.clientY - 20);
  };

  const interactives = document.querySelectorAll(
    "a, button, .btn, .theme-toggle, input, textarea, .contact-chip, .project-card, .stack-roadmap__card, .tech-item",
  );

  const onHover = () => glow.classList.add("is-hovering");
  const onLeave = () => glow.classList.remove("is-hovering");

  interactives.forEach((element) => {
    element.addEventListener("mouseenter", onHover);
    element.addEventListener("mouseleave", onLeave);
  });

  window.addEventListener("mousemove", onMove);

  return () => {
    window.removeEventListener("mousemove", onMove);
    interactives.forEach((element) => {
      element.removeEventListener("mouseenter", onHover);
      element.removeEventListener("mouseleave", onLeave);
    });
    glow.remove();
  };
}

function initScrollReveal(gsap, ScrollTrigger) {
  if (!ScrollTrigger) return () => {};

  const triggers = [];
  const animations = [];

  const revealSectionHeader = (header) => {
    if (!header) return;

    const eyebrow = header.querySelector(
      ".section-eyebrow, .stack-roadmap__eyebrow, .contact-eyebrow, .portfolio-header .section-eyebrow",
    );
    const heading = header.querySelector("h2");
    const sub = header.querySelector("p:not(.section-eyebrow):not(.stack-roadmap__eyebrow):not(.contact-eyebrow)");

    if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: 12 });
    if (heading) gsap.set(heading, { opacity: 0, y: 20 });
    if (sub) gsap.set(sub, { opacity: 0, y: 16 });

    triggers.push(
      ScrollTrigger.create({
        trigger: header,
        start: "top 85%",
        once: true,
        onEnter: () => {
          const tl = gsap.timeline();
          animations.push(tl);

          if (eyebrow) {
            tl.to(eyebrow, {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: "power2.out",
            });
          }
          if (heading) {
            tl.to(
              heading,
              { opacity: 1, y: 0, duration: 0.65, ease: "power3.out" },
              "-=0.25",
            );
          }
          if (sub) {
            tl.to(
              sub,
              { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" },
              "-=0.35",
            );
          }
        },
      }),
    );
  };

  const about = document.querySelector(".about");
  if (about) {
    revealSectionHeader(about.querySelector(".about-header"));

    const aboutText = about.querySelector(".about-text");
    const aboutSide = about.querySelector(".about-skills-side");

    if (aboutText) {
      gsap.set(aboutText, { opacity: 0, y: 32 });
      triggers.push(
        ScrollTrigger.create({
          trigger: aboutText,
          start: "top 84%",
          once: true,
          onEnter: () => {
            animations.push(
              gsap.to(aboutText, {
                opacity: 1,
                y: 0,
                duration: 0.7,
                ease: "power2.out",
              }),
            );
          },
        }),
      );
    }

    if (aboutSide) {
      gsap.set(aboutSide, { opacity: 0, y: 32 });
      triggers.push(
        ScrollTrigger.create({
          trigger: aboutSide,
          start: "top 84%",
          once: true,
          onEnter: () => {
            animations.push(
              gsap.to(aboutSide, {
                opacity: 1,
                y: 0,
                duration: 0.7,
                ease: "power2.out",
                delay: 0.1,
              }),
            );
          },
        }),
      );
    }

    const valueItems = about.querySelectorAll(".about-value-item");
    if (valueItems.length) {
      gsap.set(valueItems, { opacity: 0, x: -16 });
      triggers.push(
        ScrollTrigger.create({
          trigger: valueItems[0],
          start: "top 88%",
          once: true,
          onEnter: () => {
            animations.push(
              gsap.to(valueItems, {
                opacity: 1,
                x: 0,
                duration: 0.45,
                ease: "power2.out",
                stagger: 0.08,
              }),
            );
          },
        }),
      );
    }
  }

  const roadmap = document.querySelector(".stack-roadmap");
  if (roadmap) {
    revealSectionHeader(roadmap.querySelector(".stack-roadmap__heading"));

    const progressFill = roadmap.querySelector(".stack-roadmap__progress-fill");
    if (progressFill) {
      gsap.set(progressFill, { scaleX: 0, transformOrigin: "left" });
      triggers.push(
        ScrollTrigger.create({
          trigger: progressFill,
          start: "top 88%",
          once: true,
          onEnter: () => {
            animations.push(
              gsap.to(progressFill, {
                scaleX: 1,
                duration: 1.2,
                ease: "power2.out",
                delay: 0.3,
              }),
            );
          },
        }),
      );
    }

    const highlights = roadmap.querySelectorAll(".stack-roadmap__highlight");
    if (highlights.length) {
      gsap.set(highlights, { opacity: 0, y: 20 });
      triggers.push(
        ScrollTrigger.create({
          trigger: highlights[0],
          start: "top 86%",
          once: true,
          onEnter: () => {
            animations.push(
              gsap.to(highlights, {
                opacity: 1,
                y: 0,
                duration: 0.55,
                ease: "power2.out",
                stagger: 0.1,
              }),
            );
          },
        }),
      );
    }
  }

  const portfolio = document.querySelector(".portfolio");
  if (portfolio) {
    revealSectionHeader(portfolio.querySelector(".portfolio-header"));
  }

  const contact = document.querySelector(".contact");
  if (contact) {
    revealSectionHeader(contact.querySelector(".contact-header"));

    const form = contact.querySelector(".contact-form");
    if (form) {
      gsap.set(form, { opacity: 0, y: 28 });
      triggers.push(
        ScrollTrigger.create({
          trigger: form,
          start: "top 86%",
          once: true,
          onEnter: () => {
            animations.push(
              gsap.to(form, {
                opacity: 1,
                y: 0,
                duration: 0.65,
                ease: "power2.out",
              }),
            );
          },
        }),
      );
    }

    const chips = contact.querySelectorAll(".contact-chip");
    if (chips.length) {
      gsap.set(chips, { opacity: 0, x: -18 });
      triggers.push(
        ScrollTrigger.create({
          trigger: chips[0],
          start: "top 88%",
          once: true,
          onEnter: () => {
            animations.push(
              gsap.to(chips, {
                opacity: 1,
                x: 0,
                duration: 0.5,
                ease: "power2.out",
                stagger: 0.09,
              }),
            );
          },
        }),
      );
    }
  }

  document.querySelectorAll(".js-reveal").forEach((element) => {
    gsap.set(element, { opacity: 0, y: 22 });
    triggers.push(
      ScrollTrigger.create({
        trigger: element,
        start: "top 88%",
        once: true,
        onEnter: () => {
          animations.push(
            gsap.to(element, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: "power2.out",
            }),
          );
        },
      }),
    );
  });

  return () => {
    triggers.forEach((trigger) => trigger.kill());
    animations.forEach((animation) => animation.kill());
  };
}
