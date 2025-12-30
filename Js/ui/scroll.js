export function setupScrollUI({ header, scrollProgress, scrollButtons }) {
  try {
    let rafId = null;

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

      target.scrollIntoView({ behavior: "smooth" });
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
    updateHeaderOnScroll();
    updateScrollProgress();

    // retorno com cleanup (muito útil)
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
