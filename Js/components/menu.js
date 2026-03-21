/*
 * ═══════════════════════════════════════════════════════════
 *  components/menu.js — Navegação Mobile
 *
 *  Funcionalidades:
 *  - Hamburger → X com animação GSAP
 *  - Overlay escuro ao abrir
 *  - Links smooth-scroll com offset do header fixo
 *  - Fechar com tecla Escape (a11y)
 *  - aria-expanded e aria-label atualizados dinamicamente
 * ═══════════════════════════════════════════════════════════
 */

import { safeGetComputedStyle } from "../utils/dom.js";

/**
 * Configura o menu mobile.
 *
 * @param {Object} options
 * @param {HTMLElement} options.header        - Elemento .header (para calcular offset)
 * @param {HTMLElement} options.menuToggle    - Botão hamburger
 * @param {HTMLElement[]} options.menuSpans   - Os <span>s do hamburger (viram X)
 * @param {HTMLElement} options.navOverlay    - Overlay semitransparente
 * @param {HTMLElement[]} options.navLinks    - Links da nav (#secao)
 * @param {Function} options.getCssVar        - Helper para ler CSS vars
 * @param {boolean} options.prefersReducedMotion
 */
export function setupMenu({
  header,
  menuToggle,
  menuSpans,
  navOverlay,
  navLinks,
  getCssVar,
  prefersReducedMotion,
}) {
  if (!menuToggle) return;

  try {
    const spans = menuSpans || [];
    const overlay = navOverlay || null;
    const links = navLinks || [];
    const root = document.documentElement;

    // Resolve prefersReducedMotion: aceita boolean explícito ou detecta via matchMedia
    const reduceMotion =
      typeof prefersReducedMotion === "boolean"
        ? prefersReducedMotion
        : window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    // Lê cores dos tokens CSS para animar os spans do hamburger
    const getColor = (varName, fallback) =>
      (getCssVar && getCssVar(varName)) || safeGetComputedStyle(varName) || fallback;

    const openColor   = () => getColor("--accent", "#ff4d4d");    // spans viram X: cor de acento
    const closedColor = () => getColor("--text", "#f5f5f5");      // spans voltam: cor de texto

    /**
     * Calcula o offset do header para scroll preciso.
     * Lê primeiro o token CSS --header-offset (source of truth),
     * com fallback para getBoundingClientRect().
     */
    const getScrollOffset = () => {
      const fromCss = parseFloat(getComputedStyle(root).getPropertyValue("--header-offset"));
      if (Number.isFinite(fromCss)) return fromCss;
      return header?.getBoundingClientRect().height || 0;
    };

    /**
     * Faz scroll suave até um elemento, compensando a altura do header fixo.
     * Math.max(targetTop, 0) evita scroll negativo no topo da página.
     */
    const scrollWithOffset = (target) => {
      if (!target) return;

      const offset = getScrollOffset();
      const targetTop = target.getBoundingClientRect().top + window.pageYOffset - offset;

      window.scrollTo({
        top: Math.max(targetTop, 0),
        behavior: reduceMotion ? "auto" : "smooth",
      });
    };

    /**
     * Atualiza os atributos ARIA do botão e do overlay.
     * aria-expanded: informa leitores de tela se o menu está aberto.
     * aria-hidden no overlay: oculta de leitores quando fechado.
     */
    const setA11yState = (isOpen) => {
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
      if (overlay) overlay.setAttribute("aria-hidden", String(!isOpen));
    };

    /**
     * Anima os spans do hamburger:
     * - Aberto: span[0] desce 8px e rota 45° | span[1] sobe 8px e rota -45° → forma X
     * - Fechado: ambos voltam para y:0, rotate:0
     * Se GSAP não estiver disponível ou reduceMotion, pula a animação.
     */
    const animateBurger = (isOpen) => {
      if (!spans.length || !window.gsap || reduceMotion) return;

      gsap.killTweensOf(spans); // cancela animação anterior antes de iniciar nova
      gsap.to(spans, {
        backgroundColor: isOpen ? openColor() : closedColor(),
        duration: 0.25,
        overwrite: "auto",
      });

      if (isOpen) {
        if (spans[0]) gsap.to(spans[0], { y: 8, rotate: 45, duration: 0.25, overwrite: "auto" });
        if (spans[1]) gsap.to(spans[1], { y: -8, rotate: -45, duration: 0.25, overwrite: "auto" });
      } else {
        gsap.to(spans, { y: 0, rotate: 0, duration: 0.25, overwrite: "auto" });
      }
    };

    // ── Estado do menu ──────────────────────────────────────

    const openMenu = () => {
      menuToggle.classList.add("active");
      document.body.classList.add("menu-open"); // .menu-open no body exibe o overlay via CSS
      setA11yState(true);
      animateBurger(true);
    };

    const closeMenu = () => {
      if (!menuToggle.classList.contains("active")) return; // já está fechado
      menuToggle.classList.remove("active");
      document.body.classList.remove("menu-open");
      setA11yState(false);
      animateBurger(false);
    };

    const toggleMenu = () => {
      const isOpen = menuToggle.classList.toggle("active");
      document.body.classList.toggle("menu-open", isOpen);
      setA11yState(isOpen);
      animateBurger(isOpen);
    };

    /**
     * Ao clicar em um link de navegação (#hash):
     * 1. Previne o comportamento padrão (jump instantâneo)
     * 2. Faz scroll suave com offset
     * 3. Fecha o menu mobile
     */
    const handleNavLink = (event) => {
      const href = event.currentTarget.getAttribute("href");
      if (!href || !href.startsWith("#")) return;

      event.preventDefault();
      const target = document.querySelector(href);
      if (target) scrollWithOffset(target);
      closeMenu();
    };

    // Fecha o menu com Escape — requisito de acessibilidade (WCAG 2.5.3)
    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeMenu();
    };

    // Define estado a11y inicial (caso o menu já esteja aberto ao carregar)
    setA11yState(menuToggle.classList.contains("active"));

    // Registra todos os listeners
    menuToggle.addEventListener("click", toggleMenu);
    document.addEventListener("keydown", handleKeyDown);

    if (overlay) overlay.addEventListener("click", closeMenu);

    links.forEach((link) => link.addEventListener("click", handleNavLink));

    // Remove todos os listeners ao destruir o módulo
    const destroy = () => {
      menuToggle.removeEventListener("click", toggleMenu);
      document.removeEventListener("keydown", handleKeyDown);
      if (overlay) overlay.removeEventListener("click", closeMenu);
      links.forEach((link) => link.removeEventListener("click", handleNavLink));
    };

    return { openMenu, closeMenu, toggleMenu, destroy };
  } catch (error) {
    console.error("Falha ao configurar menu:", error);
    return null;
  }
}
