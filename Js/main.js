import { finalizeLoader, safeGetComputedStyle } from "./utils/dom.js";
import { setupMenu } from "./components/menu.js";
import { setupScrollUI } from "./components/scroll.js";
import { setupRipple } from "./components/ripple.js";
import { initAnimations } from "./effects/animations.js";
import { setupRoadmap } from "./components/roadmap.js";
import { setupTheme } from "./components/theme.js";

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
    serviceCards: Array.from(document.querySelectorAll(".project-card")),
    portfolioItems: Array.from(document.querySelectorAll(".project-card")),
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

  // SCROLL UI
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

  // THEME TOGGLE
  safelyInit(
    setupTheme,
    { toggleBtn: elements.themeToggle },
    (error) => console.warn("Theme toggle desabilitado:", error)
  );

  // YEAR
  if (elements.year) {
    elements.year.textContent = String(new Date().getFullYear());
  }

  // FAB — Voltar ao topo
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
    fabTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, { signal });
    toggleFab();
  }

  // FORMULÁRIO DE CONTATO — feedback + character counter
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    const textarea  = contactForm.querySelector("#contact-message");
    const counter   = contactForm.querySelector(".contact-form__counter");
    const submitBtn = contactForm.querySelector(".contact-form__submit");
    const label     = submitBtn?.querySelector(".btn__label");
    const MAX       = 500;

    // Character counter
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

    // Form submission — abre client de email com fallback elegante
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // remove feedback anterior
      contactForm.classList.remove("show-success", "show-error");

      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      const originalLabel = label ? label.textContent : "Enviar mensagem";

      // loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add("is-loading");
        if (label) label.textContent = "Enviando…";
      }

      try {
        // Aguarda 800ms para dar feedback visual, então abre o mailto
        await new Promise((r) => setTimeout(r, 800));

        const nome     = contactForm.querySelector("#contact-name")?.value || "";
        const email    = contactForm.querySelector("#contact-email")?.value || "";
        const mensagem = textarea?.value || "";

        const subject  = encodeURIComponent(`Contato do portfólio — ${nome}`);
        const body     = encodeURIComponent(
          `Nome: ${nome}\nEmail: ${email}\n\nMensagem:\n${mensagem}`
        );
        window.location.href =
          `mailto:pedrohhenriquepimenta224@gmail.com?subject=${subject}&body=${body}`;

        contactForm.classList.add("show-success");
        contactForm.reset();
        if (counter) { counter.textContent = `0 / ${MAX}`; counter.classList.remove("is-near-limit","is-at-limit"); }

      } catch {
        contactForm.classList.add("show-error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove("is-loading");
          if (label) label.textContent = originalLabel;
        }
        // esconde feedback após 5s
        setTimeout(() => contactForm.classList.remove("show-success", "show-error"), 5000);
      }
    }, { signal });
  }

  // loader fallback (caso load nunca chegue / algo trave)
  loaderFallbackTimeoutId = window.setTimeout(() => {
    console.warn("Loader finalizado por fallback após timeout.");
    finalizeOnce();
  }, 1500);

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