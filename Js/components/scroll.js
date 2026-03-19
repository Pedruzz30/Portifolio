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
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Inicializa toda a UI relacionada ao scroll.
 *
 * @param {Object} options
 * @param {HTMLElement} options.header          - Elemento .header fixo
 * @param {HTMLElement} options.scrollProgress  - Elemento .scroll-progress__bar
 * @param {HTMLElement[]} options.scrollButtons - Elementos [data-scroll]
 * @param {boolean} options.prefersReducedMotion
 * @param {HTMLElement[]} options.navLinks      - Links da nav para active state
 */
export function setupScrollUI({
  header,
  scrollProgress,      // esperado: elemento ".scroll-progress__bar"
  scrollButtons,
  prefersReducedMotion,
  navLinks,
}) {
  try {
    let rafId = null; // ID do requestAnimationFrame pendente

    const root = document.documentElement;

    // Estados memoizados: evitam updates redundantes no DOM
    let resizeObserver = null;
    let lastHeaderOffset = null;  // última altura do header aplicada
    let lastScrolled = null;      // último estado de "scrolled"
    let lastProgress = null;      // último valor de progresso (0..1)
    let activeLink = null;        // link atualmente marcado como ativo
    let sectionObserver = null;   // IntersectionObserver para links ativos

    const reduceMotion =
      typeof prefersReducedMotion === "boolean"
        ? prefersReducedMotion
        : window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    /**
     * Lê --header-offset do CSS (source of truth).
     * Fallback para getBoundingClientRect() se a var não estiver definida.
     */
    const getHeaderOffset = () => {
      const raw = getComputedStyle(root).getPropertyValue("--header-offset");
      const fromCss = parseFloat(raw);
      if (Number.isFinite(fromCss)) return fromCss;
      return header?.getBoundingClientRect().height || 0;
    };

    /**
     * Mede a altura real do header e atualiza --header-offset no :root.
     * Só atualiza se o valor mudou (evita reflow desnecessário).
     * Após mudar, recria o IntersectionObserver de seções com a nova margem.
     */
    const updateHeaderOffset = () => {
      if (!header) return;

      const height = header.getBoundingClientRect().height || header.offsetHeight || 0;
      const offsetValue = Math.round(height + 12); // +12px de respiro

      if (offsetValue === lastHeaderOffset) return; // sem mudança, sem DOM write
      lastHeaderOffset = offsetValue;

      root.style.setProperty("--header-offset", `${offsetValue}px`);
      refreshSectionObserver(); // atualiza o rootMargin do IntersectionObserver
    };

    /**
     * Scroll com offset: compensa o header fixo para que a seção
     * não fique escondida atrás dele ao navegar por âncoras.
     */
    const scrollWithOffset = (target) => {
      if (!target) return;

      const offset = getHeaderOffset();
      const targetTop = target.getBoundingClientRect().top + window.pageYOffset - offset;

      window.scrollTo({
        top: Math.max(targetTop, 0),
        behavior: reduceMotion ? "auto" : "smooth",
      });
    };

    /**
     * Adiciona/remove .scrolled no header.
     * .scrolled = padding menor + fundo mais opaco (ver components.css).
     * Memoizado: só altera o DOM se o estado mudou.
     */
    const updateHeaderOnScroll = () => {
      if (!header) return;

      const isScrolled = window.scrollY > 50;
      if (isScrolled === lastScrolled) return;
      lastScrolled = isScrolled;

      header.classList.toggle("scrolled", isScrolled);
    };

    /**
     * Atualiza a barra de progresso via scaleX (mais performático que width).
     * Quantização a 0.001: evita updates por diferenças de 0.0001 (sub-pixel).
     */
    const updateScrollProgress = () => {
      if (!scrollProgress) return;

      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      // Progresso 0..1 com clamp para não ultrapassar limites
      const rawProgress = docHeight > 0 ? scrollTop / docHeight : 0;
      const clamped = Math.max(0, Math.min(rawProgress, 1));

      // Quantiza: evita updates inúteis e "tremedeiras" sub-pixel
      const quantized = Math.round(clamped * 1000) / 1000;
      if (quantized === lastProgress) return;
      lastProgress = quantized;

      // scaleX cresce da esquerda (origin: left, definido no CSS)
      scrollProgress.style.transformOrigin = "left";
      scrollProgress.style.transform = `scaleX(${quantized})`;
    };

    /**
     * Marca o link de navegação ativo com aria-current="page".
     * Remove o atributo do link anterior antes de marcar o novo.
     */
    const setActiveLink = (link) => {
      if (!link || link === activeLink) return;

      if (activeLink) {
        activeLink.removeAttribute("aria-current");
      }

      link.setAttribute("aria-current", "page");
      activeLink = link;
    };

    /**
     * Mapeia os navLinks para seus targets no DOM.
     * Links que não têm href de âncora ou cujo target não existe são ignorados.
     */
    const getNavTargets = () => {
      if (!navLinks || !navLinks.length) return [];

      return navLinks
        .map((link) => {
          if (!link) return null;
          const href = link.getAttribute("href");
          if (!href || !href.startsWith("#")) return null;
          const target = document.querySelector(href);
          if (!target) return null;
          return { link, target };
        })
        .filter(Boolean);
    };

    /**
     * Cria/recria o IntersectionObserver que atualiza o link ativo.
     * rootMargin negativo no topo (-headerOffset) garante que a seção
     * só seja considerada "ativa" quando ultrapassar o header fixo.
     * rootMargin -55% na base reduz a zona para apenas o terço superior da tela.
     */
    const refreshSectionObserver = () => {
      if (!("IntersectionObserver" in window)) return;

      const targets = getNavTargets();
      if (!targets.length) return;

      if (sectionObserver) {
        sectionObserver.disconnect(); // para de observar as seções antigas
        sectionObserver = null;
      }

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
          threshold: 0.1,
        }
      );

      targets.forEach((item) => sectionObserver.observe(item.target));
    };

    /**
     * Agenda uma atualização no próximo frame de animação.
     * rafId previne múltiplos rAFs pendentes: se o evento de scroll
     * dispara 60x/s, só 1 update por frame é executado.
     */
    const scheduleUpdate = () => {
      if (rafId) return; // já tem um frame agendado
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        updateHeaderOffset();
        updateHeaderOnScroll();
        updateScrollProgress();
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

    if (scrollButtons && scrollButtons.length) {
      scrollButtons.forEach((button) => {
        if (!button) return;
        button.addEventListener("click", handleScrollTo);
      });
    }

    // ResizeObserver no header: quando o header muda de tamanho
    // (ex: ao colapsar em mobile), atualiza --header-offset
    if (header && "ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(() => scheduleUpdate());
      resizeObserver.observe(header);
    }

    window.addEventListener("scroll", scheduleUpdate, { passive: true }); // passive: não bloqueia o scroll
    window.addEventListener("resize", scheduleUpdate);

    // Estado inicial: roda imediatamente ao inicializar
    updateHeaderOffset();
    updateHeaderOnScroll();
    updateScrollProgress();
    refreshSectionObserver();

    const destroy = () => {
      if (scrollButtons && scrollButtons.length) {
        scrollButtons.forEach((button) => {
          if (!button) return;
          button.removeEventListener("click", handleScrollTo);
        });
      }

      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);

      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }

      if (sectionObserver) {
        sectionObserver.disconnect();
        sectionObserver = null;
      }

      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    return { updateHeaderOnScroll, updateScrollProgress, destroy };
  } catch (error) {
    console.error("Scroll UI ignorado:", error);
    return null;
  }
}
