import { finalizeLoader, safeGetComputedStyle } from "./utils/dom.js";
import { setupMenu } from "./ui/menu.js";
import { setupScrollUI } from "./ui/scroll.js";
import { setupRipple } from "./ui/ripple.js";
import { initAnimations } from "./effects/animations.js";
import { setupRoadmap } from "./ui/roadmap.js";

function bootstrap() {
  // abort controller para matar TODOS listeners de uma vez
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
    textReveal: Array.from(document.querySelectorAll(".text-reveal span")),
    textMask: document.querySelector(".text-mask"),
    heroContent: document.querySelector(".hero-content"),
    serviceCards: Array.from(document.querySelectorAll(".service-card")),
    portfolioItems: Array.from(document.querySelectorAll(".p2-card")),
    rippleButtons: Array.from(document.querySelectorAll(".btn--ripple")),
    scrollButtons: Array.from(document.querySelectorAll("[data-scroll]")),
    year: document.getElementById("year"),
     roadmapSection: document.querySelector(".stack-roadmap"),
    roadmapSteps: Array.from(document.querySelectorAll(".stack-roadmap__step")),
    roadmapProgressFill: document.querySelector(".stack-roadmap__progress-fill"),
    roadmapProgressValue: document.querySelector("[data-roadmap-value]"),
    roadmapProgressCaption: document.querySelector("[data-roadmap-caption]"),
    roadmapProgressSteps: Array.from(document.querySelectorAll(".stack-roadmap__progress-step")),
  };

  // reduz motion centralizado (p/ usar em módulos se quiser)
  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // helper de css var
  const getCssVar = (property, fallback = "") =>
    safeGetComputedStyle(property) || fallback;

  // lista de cleanups (caso módulos retornem destroy)
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

  // loader finalize only once
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

  // visuals run only once
  let visualsStarted = false;
  const runVisualsOnce = () => {
    if (visualsStarted) return;
    visualsStarted = true;

    try {
      safelyInit(initAnimations, {
        heroContent: elements.heroContent,
        textReveal: elements.textReveal,
        textMask: elements.textMask,
        serviceCards: elements.serviceCards,
        portfolioItems: elements.portfolioItems,
      });
    } finally {
      finalizeOnce();
    }
  };

  // MENU
  safelyInit(
    setupMenu,
    {
      menuToggle: elements.menuToggle,
      menuSpans: elements.menuSpans,
      navOverlay: elements.navOverlay,
      navLinks: elements.navLinks,
      getCssVar,
      prefersReducedMotion,
    },
    (error) => console.error("Falha ao iniciar menu:", error)
  );

  // SCROLL UI
  safelyInit(
    setupScrollUI,
    {
      header: elements.header,
      scrollProgress: elements.scrollProgress,
      scrollButtons: elements.scrollButtons,
      prefersReducedMotion,
    },
    (error) => console.error("Falha ao iniciar scroll UI:", error)
  );

  // RIPPLE
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

  // YEAR
  if (elements.year) {
    elements.year.textContent = String(new Date().getFullYear());
  }

  // loader fallback (caso load nunca chegue / algo trave)
  loaderFallbackTimeoutId = window.setTimeout(() => {
    console.warn("Loader finalizado por fallback após timeout.");
    finalizeOnce();
  }, 3500);

  // start visuals: se já carregou, roda; senão no load (once)
  if (document.readyState === "complete") {
    runVisualsOnce();
  } else {
    window.addEventListener("load", runVisualsOnce, { once: true, signal });
  }

  // Cleanup automático ao sair da página (evita leaks)
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

// bootstrap seguro
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

