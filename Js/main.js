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
import { initOceanLife } from "./effects/ocean-life.js";
import { initGsapEffects } from "./effects/gsapEffects.js";
import { setupContactForm } from "./modules/contact-form.js";
import { setupFloatingAction } from "./modules/floating-action.js";

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
    fabTop: document.getElementById("fab-top"),
    contactForm: document.getElementById("contact-form"),
  };

  // O script síncrono no <head> calcula window.__portfolioCompat antes
  // do CSS carregar. Aqui apenas consolidamos a decisão para o runtime:
  // html.is-lite-mode desliga GSAP/ScrollTrigger, canvases, parallax e
  // efeitos de mouse, preservando a página estática e navegável.
  const root = document.documentElement;
  const compat = window.__portfolioCompat || {};
  const isInAppBrowser =
    root.classList.contains("is-in-app-browser") ||
    Boolean(compat.isInAppBrowser);
  const isLiteMode =
    root.classList.contains("is-lite-mode") ||
    isInAppBrowser ||
    Boolean(compat.isLiteMode);

  if (isInAppBrowser) root.classList.add("is-in-app-browser");
  if (isLiteMode) root.classList.add("is-lite-mode");

  const prefersReducedMotion =
    isLiteMode ||
    (window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches);
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
    setupInViewClass,
    { element: elements.footer, className: "is-in-view" },
    (error) => console.warn("Estado in-view do footer desabilitado:", error)
  );

  safelyInit(
    initOceanLife,
    {
      header: elements.header,
      about: document.querySelector(".about"),
      roadmap: elements.roadmapSection,
      reduceMotion: prefersReducedMotion,
      isMobile,
    },
    (error) => console.warn("OceanLife desabilitado:", error)
  );

  if (elements.year) {
    elements.year.textContent = String(new Date().getFullYear());
  }

  safelyInit(
    setupFloatingAction,
    { button: elements.fabTop, signal },
    (error) => console.warn("FAB de topo desabilitado:", error)
  );

  safelyInit(
    setupContactForm,
    { form: elements.contactForm, signal },
    (error) => console.warn("Formulário de contato desabilitado:", error)
  );

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

function setupInViewClass({ element, className = "is-in-view" } = {}) {
  if (!element) return { destroy: () => {} };

  if (!("IntersectionObserver" in window)) {
    element.classList.add(className);
    return {
      destroy: () => element.classList.remove(className),
    };
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      element.classList.toggle(className, entry?.isIntersecting ?? false);
    },
    { threshold: 0 },
  );

  observer.observe(element);

  return {
    destroy: () => {
      observer.disconnect();
      element.classList.remove(className);
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
