import { finalizeLoader, safeGetComputedStyle } from "./utils/dom.js";
import { setupMenu } from "./Ui/menu.js";
import { setupScrollUI } from "./Ui/scroll.js";
import { setupRipple } from "./Ui/ripple.js";
import { initAnimations } from "./effects/animations.js";
import { initWebGL, handleWebGLResize } from "./effects/webgl.js";

function bootstrap() {
  const elements = {
    loader: document.querySelector(".loader"),
    header: document.querySelector(".header"),
    navOverlay: document.querySelector(".nav-overlay"),
    navLinks: document.querySelectorAll(".nav__link"),
    scrollProgress: document.querySelector(".scroll-progress__bar"),
    menuToggle: document.querySelector(".menu-toggle"),
    menuSpans: document.querySelectorAll(".menu-toggle span"),
    textReveal: document.querySelectorAll(".text-reveal span"),
    textMask: document.querySelector(".text-mask"),
    heroContent: document.querySelector(".hero-content"),
    serviceCards: document.querySelectorAll(".service-card"),
    portfolioItems: document.querySelectorAll(".portfolio-item"),
    webGLCanvas: document.getElementById("webgl-canvas"),
    rippleButtons: document.querySelectorAll(".btn--ripple"),
    scrollButtons: document.querySelectorAll("[data-scroll]"),
    year: document.getElementById("year"),
  };

  const getCssVar = (property) => safeGetComputedStyle(property);

  const safelyInit = (fn, args, onError = null) => {
    try {
      fn(args);
    } catch (error) {
      if (onError) {
        onError(error);
      } else {
        console.warn("Inicialização ignorada:", error);
      }
    }
  };

  const startAnimations = () =>
    safelyInit(initAnimations, {
      heroContent: elements.heroContent,
      textReveal: elements.textReveal,
      textMask: elements.textMask,
      serviceCards: elements.serviceCards,
      portfolioItems: elements.portfolioItems,
    });

  const startWebGL = () =>
    safelyInit(
      initWebGL,
      {
        webGLCanvas: elements.webGLCanvas,
        getCssVar,
      },
      (error) => console.error("Falha ao iniciar WebGL:", error)
    );

  const runVisualsWithLoader = () => {
    try {
      startAnimations();
      startWebGL();
    } finally {
      finalizeLoader(elements.loader);
    }
  };

  try {
    setupMenu({
      menuToggle: elements.menuToggle,
      menuSpans: elements.menuSpans,
      navOverlay: elements.navOverlay,
      navLinks: elements.navLinks,
      getCssVar,
    });
  } catch (error) {
    console.error("Falha ao iniciar menu:", error);
  }

  try {
    setupScrollUI({
      header: elements.header,
      scrollProgress: elements.scrollProgress,
      scrollButtons: elements.scrollButtons,
    });
  } catch (error) {
    console.error("Falha ao iniciar scroll UI:", error);
  }

  try {
    setupRipple({ rippleButtons: elements.rippleButtons });
  } catch (error) {
    console.warn("Ripple desabilitado:", error);
  }

  if (elements.year) {
    elements.year.textContent = new Date().getFullYear();
  }

  const hideLoader = () => finalizeLoader(elements.loader);

  if (document.readyState === "complete") {
    runVisualsWithLoader();
  } else {
    window.addEventListener("load", runVisualsWithLoader, { once: true });
  }

  setTimeout(hideLoader, 2500);

  window.addEventListener("resize", () => {
    try {
      handleWebGLResize();
    } catch (error) {
      console.warn("Resize WebGL ignorado:", error);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    try {
      bootstrap();
    } catch (error) {
      console.error("Falha crítica na inicialização:", error);
      finalizeLoader(document.querySelector(".loader"));
    }
  });
} else {
  try {
    bootstrap();
  } catch (error) {
    console.error("Falha crítica na inicialização:", error);
    finalizeLoader(document.querySelector(".loader"));
  }
}