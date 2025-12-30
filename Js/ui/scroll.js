export function setupScrollUI({ header, scrollProgress, scrollButtons, prefersReducedMotion }) {
  try {
    let rafId = null;
    const root = document.documentElement;
    const reduceMotion =
      typeof prefersReducedMotion === "boolean"
        ? prefersReducedMotion
        : window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const getHeaderOffset = () => {
      const fromCss = parseFloat(getComputedStyle(root).getPropertyValue("--header-offset"));
      if (Number.isFinite(fromCss)) return fromCss;
      return header?.getBoundingClientRect().height || 0;
    };

    const updateHeaderOffset = () => {
      if (!header) return;
      const height = header.getBoundingClientRect().height || header.offsetHeight || 0;
      const offsetValue = Math.round(height + 12);
      root.style.setProperty("--header-offset", `${offsetValue}px`);
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
      header.classList.toggle("scrolled", window.scrollY > 50);
    };

    const updateScrollProgress = () => {
      if (!scrollProgress) return;

      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      scrollProgress.style.width = `${progress}%`;
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

    if (scrollButtons && scrollButtons.length) {
      scrollButtons.forEach((button) => {
        if (!button) return;
        button.addEventListener("click", handleScrollTo);
      });
    }

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    // primeira “pintada” na UI
    updateHeaderOffset();
    updateHeaderOnScroll();
    updateScrollProgress();

    // retorno com cleanup  
    const destroy = () => {
      if (scrollButtons && scrollButtons.length) {
        scrollButtons.forEach((button) => {
          if (!button) return;
          button.removeEventListener("click", handleScrollTo);
        });
      }
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
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
