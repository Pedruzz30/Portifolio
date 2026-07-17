export function setupFloatingAction({ button, signal, threshold = 400 } = {}) {
  if (!button) return { destroy: () => {} };

  const toggleVisibility = () => {
    button.classList.toggle("is-visible", window.scrollY > threshold);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollOptions = signal
    ? { passive: true, signal }
    : { passive: true };
  const clickOptions = signal ? { signal } : undefined;

  window.addEventListener("scroll", toggleVisibility, scrollOptions);
  button.addEventListener("click", scrollToTop, clickOptions);
  toggleVisibility();

  return {
    destroy: () => {
      window.removeEventListener("scroll", toggleVisibility);
      button.removeEventListener("click", scrollToTop);
    },
  };
}
