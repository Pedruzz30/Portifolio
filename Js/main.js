import { safeGetComputedStyle } from "./utils/dom.js";
import { setupMenu } from "./ui/menu.js";
import { setupScrollUI } from "./ui/scroll.js";
import { setupRipple } from "./ui/ripple.js";
import { initAnimations } from "./effects/animations.js";
import { initWebGL, handleWebGLResize } from "./effects/webgl.js";

document.addEventListener("DOMContentLoaded", () => {
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
  };

  const getCssVar = (property) => safeGetComputedStyle(property);

  const startAnimations = () =>
    initAnimations({
      heroContent: elements.heroContent,
      textReveal: elements.textReveal,
      textMask: elements.textMask,
      serviceCards: elements.serviceCards,
      portfolioItems: elements.portfolioItems,
    });

  const startWebGL = () =>
    initWebGL({
      webGLCanvas: elements.webGLCanvas,
      getCssVar,
    });

  function initLoader() {
    window.addEventListener("load", () => {
      if (!elements.loader || !window.gsap) {
        if (elements.loader) {
          elements.loader.style.opacity = "0";
          elements.loader.style.visibility = "hidden";
          elements.loader.style.display = "none";
        }
        startAnimations();
        startWebGL();
        return;
      }

      gsap.to(elements.loader, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
          elements.loader.style.display = "none";
          startAnimations();
          startWebGL();
        },
      });
    });
  }

  initLoader();
  setupMenu({
    menuToggle: elements.menuToggle,
    menuSpans: elements.menuSpans,
    navOverlay: elements.navOverlay,
    navLinks: elements.navLinks,
    getCssVar,
  });
  setupScrollUI({
    header: elements.header,
    scrollProgress: elements.scrollProgress,
    scrollButtons: elements.scrollButtons,
  });
  setupRipple({ rippleButtons: elements.rippleButtons });

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  window.addEventListener("resize", handleWebGLResize);
});
