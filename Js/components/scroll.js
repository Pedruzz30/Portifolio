/*
 * ═══════════════════════════════════════════════════════════
 *  components/scroll.js — UI de Scroll
 *
 *  Responsabilidades:
 *  1. Barra de progresso de scroll (.scroll-progress__bar)
 *  2. Classe "scrolled" no header após 50px de scroll
 *  3. CSS var --header-offset sincronizado com a altura real do header
 *  4. Links de navegação ativos (aria-current="page")
 *  5. Botões [data-scroll="#target"] que fazem smooth-scroll com offset
 *
 *  Otimização: um único requestAnimationFrame acumula todos os updates
 *  por frame, evitando múltiplas repaints por evento de scroll.
 *
 *  Ordem de operações no rAF:
 *  TODAS as leituras de layout primeiro → TODAS as escritas depois.
 *  Isso evita layout thrashing (reflow duplo por frame).
 * ═══════════════════════════════════════════════════════════
 */
 
/**
 * Inicializa toda a UI relacionada ao scroll.
 *
 * @param {Object}       options
 * @param {HTMLElement}  options.header                   - Elemento .header fixo
 * @param {HTMLElement}  options.scrollProgress           - Elemento .scroll-progress__bar
 * @param {HTMLElement[]} options.scrollButtons           - Elementos [data-scroll]
 * @param {boolean}      [options.prefersReducedMotion]   - FIX 8: parâmetro opcional
 * @param {HTMLElement[]} options.navLinks                - Links da nav para active state
 */
export function setupScrollUI({
  header,
  scrollProgress,
  scrollButtons,
  prefersReducedMotion,
  navLinks,
}) {
  let rafId          = null; // ID do requestAnimationFrame pendente
  let resizeObserver = null;
  let sectionObserver = null;
 


  // Estados memoizados: evitam writes redundantes no DOM
  let lastHeaderOffset = null;
  let lastScrolled     = null;
  let lastProgress     = null;
  let activeLink       = null;
 


  // Cache dos nav targets — não mudam após inicialização
  // FIX 5: calculado uma única vez, não a cada resize
  let navTargetsCache  = null;
 
  const root = document.documentElement;
 
  const reduceMotion =
    typeof prefersReducedMotion === "boolean"
      ? prefersReducedMotion
      : window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
 

  // FIX 2: transformOrigin definido uma única vez na inicialização,
  // não a cada frame dentro de updateScrollProgress
  if (scrollProgress) {
    scrollProgress.style.transformOrigin = "left";
  }
 

























  /**
   * Lê --header-offset do CSS (source of truth).
   * Fallback para getBoundingClientRect() se a var não estiver definida.
   */
  const getHeaderOffset = () => {
    const raw = getComputedStyle(root).getPropertyValue("--header-offset");
    const fromCss = parseFloat(raw);
    if (Number.isFinite(fromCss)) return fromCss;
    return header?.getBoundingClientRect().height ?? 0;
  };
 
  /**
   * Scroll com offset: compensa o header fixo para que a seção
   * não fique escondida atrás dele ao navegar por âncoras.
   */
  const scrollWithOffset = (target) => {
    if (!target) return;
 
    const offset    = getHeaderOffset();
    // FIX 3: window.scrollY no lugar do depreciado window.pageYOffset
    const targetTop = target.getBoundingClientRect().top + window.scrollY - offset;
 
    window.scrollTo({
      top:      Math.max(targetTop, 0),
      behavior: reduceMotion ? "auto" : "smooth",
    });





  };
 
  /**
   * Marca o link de navegação ativo com aria-current="page".
   * Remove o atributo do link anterior antes de marcar o novo.
   */
  const setActiveLink = (link) => {
    if (!link || link === activeLink) return;
    activeLink?.removeAttribute("aria-current");
    link.setAttribute("aria-current", "page");
    activeLink = link;
  };
 
  /**
   * Mapeia os navLinks para seus targets no DOM.
   * FIX 5: resultado cacheado — targets não mudam após init.
   * Links sem href de âncora ou cujo target não existe são ignorados.
   */
  const getNavTargets = () => {
    if (navTargetsCache) return navTargetsCache;
    if (!navLinks?.length) return [];
 
    navTargetsCache = navLinks
      .map((link) => {
        if (!link) return null;
        const href = link.getAttribute("href");
        if (!href?.startsWith("#")) return null;
        const target = document.querySelector(href);
        if (!target) return null;
        return { link, target };
      })
      .filter(Boolean);
 
    return navTargetsCache;
  };
 
  /**
   * Cria/recria o IntersectionObserver que atualiza o link ativo.
   * rootMargin negativo no topo (-headerOffset) garante que a seção
   * só seja considerada "ativa" quando ultrapassar o header fixo.
   * rootMargin -55% na base reduz a zona para o terço superior da tela.
   */
  const refreshSectionObserver = () => {
    if (!("IntersectionObserver" in window)) return;
 
    const targets = getNavTargets();
    if (!targets.length) return;
 
    sectionObserver?.disconnect();
    sectionObserver = null;
 
    const offset = getHeaderOffset();
 
    sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const matched = targets.find((item) => item.target === entry.target);
          if (matched) setActiveLink(matched.link);
        });
      },
      {
        rootMargin: `-${Math.round(offset)}px 0px -55% 0px`,
        threshold:  0.1,
      }
    );
 
    targets.forEach((item) => sectionObserver.observe(item.target));
  };
 
  /**
   * FIX 1: rAF com leituras separadas das escritas.
   *
   * Padrão correto para evitar layout thrashing:
   *   FASE 1 — leituras  (getBoundingClientRect, scrollY, scrollHeight…)
   *   FASE 2 — escritas  (style.setProperty, classList, style.transform…)
   *
   * Misturar leituras e escritas força o browser a recalcular o layout
   * a cada leitura após uma escrita — reflow duplo (ou mais) por frame.
   */
  const scheduleUpdate = () => {
    if (rafId) return; // já tem um frame agendado
    rafId = window.requestAnimationFrame(() => {
      rafId = null;
 
      // ── FASE 1: todas as leituras de layout ──────────────
      const headerHeight  = header
        ? (header.getBoundingClientRect().height || header.offsetHeight || 0)
        : 0;
      const isScrolled    = window.scrollY > 50;
      const scrollTop     = window.scrollY;
      const docHeight     = root.scrollHeight - window.innerHeight;
 
      // ── FASE 2: todas as escritas no DOM ─────────────────
 
      // -- header offset --
      if (header) {
        const offsetValue = Math.round(headerHeight + 12);
        if (offsetValue !== lastHeaderOffset) {
          lastHeaderOffset = offsetValue;
          root.style.setProperty("--header-offset", `${offsetValue}px`);
          refreshSectionObserver();
        }
      }
 
      // -- classe scrolled --
      if (header && isScrolled !== lastScrolled) {
        lastScrolled = isScrolled;
        header.classList.toggle("scrolled", isScrolled);
      }
 
      // -- barra de progresso --
      if (scrollProgress) {
        const rawProgress = docHeight > 0 ? scrollTop / docHeight : 0;
        const clamped     = Math.max(0, Math.min(rawProgress, 1));
        // FIX 7: quantização a 2 casas — suficiente para barra de progresso visual
        const quantized   = Math.round(clamped * 100) / 100;
        if (quantized !== lastProgress) {
          lastProgress = quantized;
          scrollProgress.style.transform = `scaleX(${quantized})`;
        }
      }
    });
  };
 
  /**
   * Handler dos botões [data-scroll="#target"].
   * Lê o seletor do atributo e faz scroll com offset.
   */
  const handleScrollTo = (event) => {
    const btn = event.currentTarget;
    if (!btn) return;
 
    const targetSelector = btn.getAttribute("data-scroll");
    if (!targetSelector) return;
 
    const target = document.querySelector(targetSelector);
    if (!target) return;
 
    scrollWithOffset(target);
  };
 
  // ── Registra listeners ──────────────────────────────────
 
  scrollButtons?.forEach((button) => {
    button?.addEventListener("click", handleScrollTo);
  });
 

















  if (header && "ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() => scheduleUpdate());
    resizeObserver.observe(header);
  }
 
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  // FIX 4: passive: true no resize — não bloqueia o thread principal em mobile
  window.addEventListener("resize", scheduleUpdate, { passive: true });
 
  // Estado inicial: roda imediatamente ao inicializar
  scheduleUpdate();
  refreshSectionObserver();
 
  // ── Cleanup ─────────────────────────────────────────────
  const destroy = () => {
    scrollButtons?.forEach((button) => {
      button?.removeEventListener("click", handleScrollTo);
    });
 
    window.removeEventListener("scroll", scheduleUpdate);
    window.removeEventListener("resize", scheduleUpdate);
 
    resizeObserver?.disconnect();
    resizeObserver = null;
 
    sectionObserver?.disconnect();
    sectionObserver = null;
 





    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
 
    // Limpa o cache de targets ao destruir
    navTargetsCache = null;













  };
 
  return { destroy };
 
  // FIX 6: try/catch externo removido — erros de inicialização agora
  // sobem naturalmente para o caller (main.js), onde devem ser tratados.
  // Um catch que retorna null silenciosamente é mais perigoso do que
  // deixar o erro aparecer: o caller chamaria .destroy() em null e quebraria.
}