export function setupRipple({ rippleButtons, prefersReducedMotion }) {
  if (!rippleButtons || !rippleButtons.length) return;

  const reduceMotion =
    typeof prefersReducedMotion === "boolean"
      ? prefersReducedMotion
      : window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  if (reduceMotion) {
    return { destroy: () => {} };
  }

  const timers = new WeakMap(); // timeout por botão

  const startRipple = (button, x, y) => {
    button.style.setProperty("--ripple-x", `${x}px`);
    button.style.setProperty("--ripple-y", `${y}px`);

    // reset da animação
    button.classList.remove("is-rippling");
    void button.offsetWidth;
    button.classList.add("is-rippling");

    // limpa timeout anterior, se existir
    const prev = timers.get(button);
    if (prev) clearTimeout(prev);

    const t = setTimeout(() => {
      button.classList.remove("is-rippling");
      timers.delete(button);
    }, 500);

    timers.set(button, t);
  };

  const triggerRipple = (event) => {
    try {
      const button = event.currentTarget;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const isKeyboard =
        event.type === "keydown" ||
        typeof event.clientX !== "number" ||
        typeof event.clientY !== "number" ||
        (event.clientX === 0 && event.clientY === 0);

      const x = isKeyboard ? rect.width / 2 : event.clientX - rect.left;
      const y = isKeyboard ? rect.height / 2 : event.clientY - rect.top;

      if (!Number.isFinite(x) || !Number.isFinite(y)) return;

      startRipple(button, x, y);
    } catch (err) {
      console.warn("Ripple ignorado:", err);
    }
  };

  const handleKeydown = (event) => {
    // Enter e Space
    if (event.key !== "Enter" && event.key !== " ") return;

    // evita ripple duplicado (keydown + click) em elementos que já disparam click no teclado
    const tag = event.currentTarget?.tagName;
    const isNativeButton = tag === "BUTTON";

    if (!isNativeButton) event.preventDefault();

    triggerRipple(event);
  };

  rippleButtons.forEach((button) => {
    if (!button) return;

    // pointerdown é mais “instantâneo”
    button.addEventListener("pointerdown", triggerRipple, { passive: true });
    button.addEventListener("keydown", handleKeydown);
  });

   return {
    destroy: () => {
      rippleButtons.forEach((button) => {
        if (!button) return;
        button.removeEventListener("pointerdown", triggerRipple);
        button.removeEventListener("keydown", handleKeydown);
        const prev = timers.get(button);
        if (prev) clearTimeout(prev);
        timers.delete(button);
      });
    },
  };
}

