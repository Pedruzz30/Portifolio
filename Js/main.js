/*
 * ═══════════════════════════════════════════════════════════
 *  main.js — Ponto de Entrada do Portfólio
 *
 *  Padrão usado: bootstrap() centralizado com AbortController.
 *  Todas as funcionalidades são inicializadas aqui e recebem
 *  um { signal } compartilhado — ao abortar, TODOS os listeners
 *  são removidos de uma vez, sem precisar rastrear cada um.
 * ═══════════════════════════════════════════════════════════
 */

import { finalizeLoader, safeGetComputedStyle } from "./utils/dom.js";
import { setupMenu } from "./components/menu.js";
import { setupScrollUI } from "./components/scroll.js";
import { setupRipple } from "./components/ripple.js";
import { setupRoadmap } from "./components/roadmap.js";
import { setupTheme } from "./components/theme.js";
import { initFooterParticles } from "./effects/footerParticles.js";
import { initHeroParticles } from "./effects/heroParticles.js";
import { initOceanLife } from "./effects/oceanLife.js";
import { initGsapEffects } from "./effects/gsapEffects.js";

function bootstrap() {
  const controller = new AbortController();
  const { signal } = controller;

  const elements = {
    loader: document.querySelector(".loader"),
    header: document.querySelector(".header"),
    navOverlay: document.querySelector(".nav-overlay"),
    navLinks: Array.from(document.querySelectorAll(".nav__link")),
    scrollProgress: document.querySelector(".scroll-progress__bar"),
    menuToggle: document.querySelector(".menu-toggle"),
    menuSpans: Array.from(document.querySelectorAll(".menu-toggle span")),
    hero: document.querySelector(".hero"),
    footer: document.querySelector(".site-footer"),
    projectCards: Array.from(document.querySelectorAll(".project-card")),
    rippleButtons: Array.from(document.querySelectorAll(".btn--ripple")),
    scrollButtons: Array.from(document.querySelectorAll("[data-scroll]")),
    year: document.getElementById("year"),
    themeToggle: document.querySelector(".theme-toggle"),
    roadmapSection: document.querySelector(".stack-roadmap"),
    roadmapSteps: Array.from(document.querySelectorAll(".stack-roadmap__step")),
    roadmapProgressFill: document.querySelector(".stack-roadmap__progress-fill"),
    roadmapProgressValue: document.querySelector("[data-roadmap-value]"),
    roadmapProgressCaption: document.querySelector("[data-roadmap-caption]"),
    roadmapProgressSteps: Array.from(document.querySelectorAll(".stack-roadmap__progress-step")),
  };

  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile =
    window.matchMedia &&
    window.matchMedia("(max-width: 768px)").matches;

  const getCssVar = (property, fallback = "") =>
    safeGetComputedStyle(property) || fallback;

  const cleanups = [];

  const safelyInit = (fn, args, onError = null) => {
    try {
      const handle = fn(args);
      if (handle && typeof handle.destroy === "function") {
        cleanups.push(handle.destroy);
      }
      return handle;
    } catch (error) {
      if (onError) onError(error);
      else console.warn("Inicialização ignorada:", error);
      return null;
    }
  };

  let loaderFinalized = false;
  let loaderFallbackTimeoutId = null;

  const finalizeOnce = () => {
    if (loaderFinalized) return;
    loaderFinalized = true;

    if (loaderFallbackTimeoutId) {
      clearTimeout(loaderFallbackTimeoutId);
      loaderFallbackTimeoutId = null;
    }

    try {
      finalizeLoader(elements.loader);
    } catch (e) {
      console.warn("finalizeLoader falhou (ignorado):", e);
    }
  };

  let visualsStarted = false;
  const runVisualsOnce = () => {
    if (visualsStarted) return;
    visualsStarted = true;

    try {
      safelyInit(
        initGsapEffects,
        {
          reduceMotion: prefersReducedMotion,
          isMobile,
        },
        (error) => console.warn("GSAP effects desabilitado:", error)
      );
    } finally {
      finalizeOnce();
    }
  };

  safelyInit(
    setupMenu,
    {
      header: elements.header,
      menuToggle: elements.menuToggle,
      menuSpans: elements.menuSpans,
      navOverlay: elements.navOverlay,
      navLinks: elements.navLinks,
      getCssVar,
      prefersReducedMotion,
    },
    (error) => console.error("Falha ao iniciar menu:", error)
  );

  safelyInit(
    setupScrollUI,
    {
      header: elements.header,
      scrollProgress: elements.scrollProgress,
      scrollButtons: elements.scrollButtons,
      prefersReducedMotion,
      navLinks: elements.navLinks,
    },
    (error) => console.error("Falha ao iniciar scroll UI:", error)
  );

  safelyInit(
    setupRipple,
    { rippleButtons: elements.rippleButtons, prefersReducedMotion },
    (error) => console.warn("Ripple desabilitado:", error)
  );

  safelyInit(
    setupRoadmap,
    {
      section: elements.roadmapSection,
      steps: elements.roadmapSteps,
      progressFill: elements.roadmapProgressFill,
      progressValue: elements.roadmapProgressValue,
      progressCaption: elements.roadmapProgressCaption,
      progressSteps: elements.roadmapProgressSteps,
      prefersReducedMotion,
    },
    (error) => console.warn("Roadmap desabilitado:", error)
  );

  safelyInit(
    setupTheme,
    { toggleBtn: elements.themeToggle },
    (error) => console.warn("Theme toggle desabilitado:", error)
  );

  safelyInit(
    (options) => initHeroParticles(elements.hero, options),
    {
      count: isMobile ? 16 : 28,
      reduceMotion: prefersReducedMotion,
    },
    (error) => console.warn("Hero particles desabilitado:", error)
  );

  safelyInit(
    initFooterParticles,
    {
      footer: elements.footer,
      count: isMobile ? 30 : 55,
      reduceMotion: prefersReducedMotion,
    },
    (error) => console.warn("Footer particles desabilitado:", error)
  );

  safelyInit(
    initOceanLife,
    {
      header: elements.header,
      hero: elements.hero,
      about: document.querySelector(".about"),
      roadmap: elements.roadmapSection,
      footer: elements.footer,
      projectCards: elements.projectCards,
      reduceMotion: prefersReducedMotion,
      isMobile,
    },
    (error) => console.warn("OceanLife desabilitado:", error)
  );

  if (elements.year) {
    elements.year.textContent = String(new Date().getFullYear());
  }

  const fabTop = document.getElementById("fab-top");
  if (fabTop) {
    const toggleFab = () => {
      if (window.scrollY > 400) {
        fabTop.classList.add("is-visible");
      } else {
        fabTop.classList.remove("is-visible");
      }
    };

    window.addEventListener("scroll", toggleFab, { passive: true, signal });
    fabTop.addEventListener(
      "click",
      () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      { signal }
    );
    toggleFab();
  }

  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    const textarea = contactForm.querySelector("#contact-message");
    const counter = contactForm.querySelector(".contact-form__counter");
    const submitBtn = contactForm.querySelector(".contact-form__submit");
    const label = submitBtn?.querySelector(".btn__label");
    const MAX = 500;

    if (textarea && counter) {
      const updateCounter = () => {
        const len = textarea.value.length;
        counter.textContent = `${len} / ${MAX}`;
        counter.classList.toggle("is-near-limit", len >= MAX * 0.8 && len < MAX);
        counter.classList.toggle("is-at-limit", len >= MAX);
      };
      textarea.addEventListener("input", updateCounter, { signal });
      updateCounter();
    }

    contactForm.addEventListener(
      "submit",
      async (e) => {
        e.preventDefault();
        contactForm.classList.remove("show-success", "show-error");

        if (!contactForm.checkValidity()) {
          contactForm.reportValidity();
          return;
        }

        const originalLabel = label ? label.textContent : "Enviar mensagem";

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.classList.add("is-loading");
          if (label) label.textContent = "Abrindo e-mail…";
        }

        try {
          await new Promise((r) => setTimeout(r, 800));

          const nome = contactForm.querySelector("#contact-name")?.value || "";
          const email = contactForm.querySelector("#contact-email")?.value || "";
          const mensagem = textarea?.value || "";

          const subject = encodeURIComponent(`Contato do portfólio — ${nome}`);
          const body = encodeURIComponent(
            `Nome: ${nome}\nEmail: ${email}\n\nMensagem:\n${mensagem}`
          );

          contactForm.classList.add("show-success");
          window.location.href =
            `mailto:pedrohhenriquepimenta224@gmail.com?subject=${subject}&body=${body}`;
        } catch {
          contactForm.classList.add("show-error");
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove("is-loading");
            if (label) label.textContent = originalLabel;
          }
          setTimeout(() => {
            contactForm.classList.remove("show-success", "show-error");
          }, 5000);
        }
      },
      { signal }
    );
  }

  loaderFallbackTimeoutId = window.setTimeout(() => {
    console.warn("[boot] fallback timeout fired — loader may be stuck");
    finalizeOnce();
  }, 1500);

  if (document.readyState === "complete") {
    runVisualsOnce();
  } else {
    window.addEventListener("load", runVisualsOnce, { once: true, signal });
  }

  window.addEventListener(
    "pagehide",
    () => {
      try {
        controller.abort();
      } catch {}

      for (const destroy of cleanups) {
        try {
          destroy();
        } catch (e) {
          console.warn("Cleanup ignorado:", e);
        }
      }

      finalizeOnce();
    },
    { once: true }
  );

  return {
    destroy: () => {
      controller.abort();
      for (const destroy of cleanups) destroy();
      finalizeOnce();
    },
  };
}

const start = () => {
  try {
    bootstrap();
  } catch (error) {
    console.error("Falha crítica na inicialização:", error);
    try {
      finalizeLoader(document.querySelector(".loader"));
    } catch {}
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}
