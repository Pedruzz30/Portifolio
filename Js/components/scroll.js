export function setupScrollUI({
  header,
  scrollProgress,      // esperado: elemento ".scroll-progress__bar"
  scrollButtons,
  prefersReducedMotion,
  navLinks,
}) {
  try {
    let rafId = null;
    const root = document.documentElement;

    let resizeObserver = null;
    let lastHeaderOffset = null;
    let lastScrolled = null;
    let lastProgress = null;
    let activeLink = null;
    let sectionObserver = null;

    const reduceMotion =
      typeof prefersReducedMotion === "boolean"
        ? prefersReducedMotion
        : window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const getHeaderOffset = () => {
      const raw = getComputedStyle(root).getPropertyValue("--header-offset");
      const fromCss = parseFloat(raw);
      if (Number.isFinite(fromCss)) return fromCss;
      return header?.getBoundingClientRect().height || 0;
    };

    const updateHeaderOffset = () => {
      if (!header) return;

      const height = header.getBoundingClientRect().height || header.offsetHeight || 0;
      const offsetValue = Math.round(height + 12);

      if (offsetValue === lastHeaderOffset) return;
      lastHeaderOffset = offsetValue;

      root.style.setProperty("--header-offset", `${offsetValue}px`);
      refreshSectionObserver();
    };

    const scrollWithOffset = (target) => {
      if (!target) return;

      const offset = getHeaderOffset();
      const targetTop = target.getBoundingClientRect().top + window.pageYOffset - offset;

      window.scrollTo({
        top: Math.max(targetTop, 0),
        behavior: reduceMotion ? "auto" : "smooth",
      });
    };

    const updateHeaderOnScroll = () => {
      if (!header) return;

      const isScrolled = window.scrollY > 50;
      if (isScrolled === lastScrolled) return;
      lastScrolled = isScrolled;

      header.classList.toggle("scrolled", isScrolled);
    };

    const updateScrollProgress = () => {
      if (!scrollProgress) return;

      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      // progresso 0..1 com clamp
      const rawProgress = docHeight > 0 ? scrollTop / docHeight : 0;
      const clamped = Math.max(0, Math.min(rawProgress, 1));

      // quantiza pra evitar updates inúteis e “tremidinhas”
      const quantized = Math.round(clamped * 1000) / 1000; // 0.001
      if (quantized === lastProgress) return;
      lastProgress = quantized;

      // garante que o scaleX cresça da esquerda pra direita
      scrollProgress.style.transformOrigin = "left";
      scrollProgress.style.transform = `scaleX(${quantized})`;
    };

    const setActiveLink = (link) => {
      if (!link || link === activeLink) return;

      if (activeLink) {
        activeLink.removeAttribute("aria-current");
      }

      link.setAttribute("aria-current", "page");
      activeLink = link;
    };

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

    const refreshSectionObserver = () => {
      if (!("IntersectionObserver" in window)) return;

      const targets = getNavTargets();
      if (!targets.length) return;

      if (sectionObserver) {
        sectionObserver.disconnect();
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

    const scheduleUpdate = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        updateHeaderOffset();
        updateHeaderOnScroll();
        updateScrollProgress();
      });
    };

    const handleScrollTo = (event) => {
      const btn = event.currentTarget;
      if (!btn) return;

      const targetSelector = btn.getAttribute("data-scroll");
      if (!targetSelector) return;

      const target = document.querySelector(targetSelector);
      if (!target) return;

      scrollWithOffset(target);
    };

    // binds
    if (scrollButtons && scrollButtons.length) {
      scrollButtons.forEach((button) => {
        if (!button) return;
        button.addEventListener("click", handleScrollTo);
      });
    }

    if (header && "ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(() => scheduleUpdate());
      resizeObserver.observe(header);
    }

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    // primeira “pintada”
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
