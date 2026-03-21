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
import { initAnimations } from "./effects/animations.js";
import { setupRoadmap } from "./components/roadmap.js";
import { setupTheme } from "./components/theme.js";
import { initFooterParticles } from "./effects/footerParticles.js";
import { initHeroParticles } from "./effects/heroParticles.js";

function bootstrap() {
  // AbortController centralizado: controller.abort() cancela TODOS os
  // addEventListener que usam { signal } — uma linha mata tudo. Sem leaks.
  const controller = new AbortController();
  const { signal } = controller;

  // Referências a todos os elementos do DOM que serão usados.
  // Centralizar aqui evita querySelector espalhados pelo código.
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
    hero: document.querySelector(".hero"),
    heroContent: document.querySelector(".hero-content"),
    footer: document.querySelector(".site-footer"),
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

  // Detecta preferência de acessibilidade uma única vez.
  // Passado para cada módulo para que desativem animações quando necessário.
  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Helper para ler CSS custom properties (ex: --wave-slow) do :root
  const getCssVar = (property, fallback = "") =>
    safeGetComputedStyle(property) || fallback;

  // Módulos que retornam { destroy } são registrados aqui.
  // Na saída da página, todos são destruídos em ordem.
  const cleanups = [];

  // Wrapper seguro de inicialização: captura erros de módulos individuais
  // sem travar toda a aplicação. Se um módulo retornar { destroy }, registra.
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

  // Flags para garantir que o loader e os visuais rodem apenas UMA vez,
  // independente de quantos eventos (load, DOMContentLoaded) disparem.
  let loaderFinalized = false;
  let loaderFallbackTimeoutId = null;

  const finalizeOnce = () => {
    if (loaderFinalized) return;
    loaderFinalized = true;

    // Cancela o timeout de fallback se o load aconteceu normalmente
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
      // initAnimations cuida de: reveal do hero, parallax do mouse,
      // bubbles, tilt dos cards e animações de scroll.
      safelyInit(initAnimations, {
        heroContent: elements.heroContent,
        textReveal: elements.textReveal,
        textMask: elements.textMask,
        serviceCards: elements.serviceCards,
        portfolioItems: elements.portfolioItems,
      });
    } finally {
      finalizeOnce(); // loader some após os visuais iniciarem
    }
  };

  // ─── MENU ────────────────────────────────────────────────
  // Hamburger + navegação mobile + fechar ao clicar no overlay
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

  // ─── SCROLL UI ───────────────────────────────────────────
  // Barra de progresso + header comprimido no scroll + active link
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

  // ─── RIPPLE ──────────────────────────────────────────────
  // Efeito de onda ao clicar nos botões .btn--ripple
  safelyInit(
    setupRipple,
    { rippleButtons: elements.rippleButtons, prefersReducedMotion },
    (error) => console.warn("Ripple desabilitado:", error)
  );

  // ─── ROADMAP ─────────────────────────────────────────────
  // Calcula o progresso ponderado e anima os steps ao entrar em view
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

  // ─── THEME TOGGLE ────────────────────────────────────────
  // Alternância claro/escuro com persistência em localStorage
  safelyInit(
    setupTheme,
    { toggleBtn: elements.themeToggle },
    (error) => console.warn("Theme toggle desabilitado:", error)
  );

  const isMobile = window.matchMedia("(max-width: 600px)").matches;

  // ─── HERO PARTICLES ──────────────────────────────────────
  // Partículas de superfície + ondas SVG no hero
  const heroParticleHandle = initHeroParticles(elements.hero, {
    count: isMobile ? 16 : 28,
    reduceMotion: prefersReducedMotion,
  });
  if (heroParticleHandle && typeof heroParticleHandle.destroy === "function") {
    cleanups.push(heroParticleHandle.destroy);
  }

  // ─── FOOTER PARTICLES ────────────────────────────────────
  // Plâncton bioluminescente no fundo do oceano
  const particleCount = isMobile ? 30 : 55;
  const fpHandle = initFooterParticles({
    footer: elements.footer,
    count: particleCount,
    reduceMotion: prefersReducedMotion,
  });
  if (fpHandle && typeof fpHandle.destroy === "function") {
    cleanups.push(fpHandle.destroy);
  }

  // ─── ANO DINÂMICO ────────────────────────────────────────
  // Atualiza o copyright no footer automaticamente todo ano
  if (elements.year) {
    elements.year.textContent = String(new Date().getFullYear());
  }

  // ─── FAB — Voltar ao topo ────────────────────────────────
  // Aparece após 400px de scroll; some ao chegar no topo
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
    toggleFab(); // executa na inicialização para estado correto caso a página carregue scrollada
  }

  // ─── FORMULÁRIO DE CONTATO ───────────────────────────────
  // Contador de caracteres + submissão via mailto + feedback visual
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    const textarea  = contactForm.querySelector("#contact-message");
    const counter   = contactForm.querySelector(".contact-form__counter");
    const submitBtn = contactForm.querySelector(".contact-form__submit");
    const label     = submitBtn?.querySelector(".btn__label");
    const MAX       = 500; // limite de caracteres da mensagem

    // Atualiza o contador ao digitar e muda cor ao se aproximar do limite
    if (textarea && counter) {
      const updateCounter = () => {
        const len = textarea.value.length;
        counter.textContent = `${len} / ${MAX}`;
        counter.classList.toggle("is-near-limit", len >= MAX * 0.8 && len < MAX); // amarelo acima de 80%
        counter.classList.toggle("is-at-limit", len >= MAX);                      // vermelho ao atingir 100%
      };
      textarea.addEventListener("input", updateCounter, { signal });
      updateCounter(); // estado inicial
    }

    // Submissão: 800ms de feedback visual → abre cliente de email
    // Não usa fetch/API — abre o mailto diretamente no cliente do usuário
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Limpa mensagens de feedback anteriores
      contactForm.classList.remove("show-success", "show-error");

      if (!contactForm.checkValidity()) {
        contactForm.reportValidity(); // mostra validação nativa do browser
        return;
      }

      const originalLabel = label ? label.textContent : "Enviar mensagem";

      // Estado de loading: desabilita botão e mostra "Enviando…"
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add("is-loading");
        if (label) label.textContent = "Enviando…";
      }

      try {
        // Pausa artificial para dar feedback visual ao usuário
        await new Promise((r) => setTimeout(r, 800));

        const nome     = contactForm.querySelector("#contact-name")?.value || "";
        const email    = contactForm.querySelector("#contact-email")?.value || "";
        const mensagem = textarea?.value || "";

        // Constrói a URL mailto com os dados do formulário
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
        // Restaura o botão independente de sucesso ou erro
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove("is-loading");
          if (label) label.textContent = originalLabel;
        }
        // Feedback some após 5 segundos
        setTimeout(() => contactForm.classList.remove("show-success", "show-error"), 5000);
      }
    }, { signal });
  }

  // ─── LOADER FALLBACK ─────────────────────────────────────
  // Se o evento "load" nunca disparar (scripts externos lentos, etc.),
  // remove o loader após 1.5s de qualquer jeito.
  loaderFallbackTimeoutId = window.setTimeout(() => {
    console.warn("Loader finalizado por fallback após timeout.");
    finalizeOnce();
  }, 1500);

  // Inicia os visuais após o DOM estar pronto:
  // - Se já carregou: roda imediatamente
  // - Se não: aguarda o evento "load" (imagens, fontes, etc.)
  if (document.readyState === "complete") {
    runVisualsOnce();
  } else {
    window.addEventListener("load", runVisualsOnce, { once: true, signal });
  }

  // ─── CLEANUP AO SAIR DA PÁGINA ───────────────────────────
  // pagehide dispara antes do browser navegar para outra página.
  // Cancela o AbortController (remove todos os listeners) e
  // chama destroy() em cada módulo que registrou um.
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

// ─── INICIALIZAÇÃO SEGURA ────────────────────────────────────
// Tenta iniciar o app; em caso de erro crítico, pelo menos remove o loader
// para o usuário não ficar preso na tela de loading.
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

// Espera o DOMContentLoaded se o HTML ainda não foi parseado,
// caso contrário roda imediatamente (script com defer já garante isso,
// mas esta verificação torna o código robusto em qualquer cenário).
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}