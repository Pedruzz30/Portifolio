/*
 * ═══════════════════════════════════════════════════════════
 *  components/ripple.js — Efeito Onda (Ripple)
 *
 *  Simula a onda que se expande ao clicar num botão,
 *  como uma bolha explodindo na superfície da água.
 *
 *  Técnica: CSS puro para a animação (::after no btn--ripple),
 *  JS apenas posiciona --ripple-x e --ripple-y onde o clique ocorreu
 *  e adiciona/remove a classe "is-rippling" para disparar/resetar.
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Inicializa o efeito ripple em botões .btn--ripple.
 *
 * @param {Object} options
 * @param {HTMLElement[]} options.rippleButtons
 * @param {boolean} options.prefersReducedMotion - Desativa se true
 */
export function setupRipple({ rippleButtons, prefersReducedMotion }) {
  if (!rippleButtons || !rippleButtons.length) return;

  const reduceMotion =
    typeof prefersReducedMotion === "boolean"
      ? prefersReducedMotion
      : window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  // Respeita preferência de acessibilidade
  if (reduceMotion) {
    return { destroy: () => {} };
  }

  // WeakMap: associa cada botão com seu timeout de limpeza,
  // sem risco de memory leak (GC pode coletar o botão normalmente).
  const timers = new WeakMap();

  /**
   * Posiciona e dispara o ripple em (x, y) relativo ao botão.
   * Void trick (void button.offsetWidth) força reflow para resetar
   * a animação CSS — sem isso, cliques rápidos não reativam o ripple.
   */
  const startRipple = (button, x, y) => {
    button.style.setProperty("--ripple-x", `${x}px`);
    button.style.setProperty("--ripple-y", `${y}px`);

    // Reset: remove a classe antes de reflow, depois readiciona
    button.classList.remove("is-rippling");
    void button.offsetWidth; // força reflow — reinicia a animação CSS
    button.classList.add("is-rippling");

    // Cancela timeout anterior se o usuário clicar rápido
    const prev = timers.get(button);
    if (prev) clearTimeout(prev);

    // Remove a classe após 500ms (duração da animação CSS)
    const t = setTimeout(() => {
      button.classList.remove("is-rippling");
      timers.delete(button);
    }, 500);

    timers.set(button, t);
  };

  /**
   * Calcula a posição do ripple a partir do evento.
   * Para eventos de teclado (Enter/Space), o ripple nasce no centro.
   * Para cliques de mouse/touch, nasce exatamente onde o cursor está.
   */
  const triggerRipple = (event) => {
    try {
      const button = event.currentTarget;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      if (!rect.width || !rect.height) return; // botão não visível

      // Detecta se o evento veio do teclado (sem coordenadas de cursor)
      const isKeyboard =
        event.type === "keydown" ||
        typeof event.clientX !== "number" ||
        typeof event.clientY !== "number" ||
        (event.clientX === 0 && event.clientY === 0);

      const x = isKeyboard ? rect.width / 2  : event.clientX - rect.left;
      const y = isKeyboard ? rect.height / 2 : event.clientY - rect.top;

      if (!Number.isFinite(x) || !Number.isFinite(y)) return;

      startRipple(button, x, y);
    } catch (err) {
      console.warn("Ripple ignorado:", err);
    }
  };

  /**
   * Handler específico para teclado (Enter e Space).
   * - Evita ripple duplicado em <button> nativo: keydown + click dispara duas vezes
   * - Para elementos não-button, previne o scroll da página no Space
   */
  const handleKeydown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    const tag = event.currentTarget?.tagName;
    const isNativeButton = tag === "BUTTON";

    if (!isNativeButton) event.preventDefault();

    triggerRipple(event);
  };

  rippleButtons.forEach((button) => {
    if (!button) return;

    // pointerdown é mais responsivo que click (dispara ao pressionar, não ao soltar)
    button.addEventListener("pointerdown", triggerRipple, { passive: true });
    button.addEventListener("keydown", handleKeydown);
  });

  return {
    destroy: () => {
      rippleButtons.forEach((button) => {
        if (!button) return;
        button.removeEventListener("pointerdown", triggerRipple);
        button.removeEventListener("keydown", handleKeydown);
        // Limpa timers pendentes para não criar "is-rippling" tardio
        const prev = timers.get(button);
        if (prev) clearTimeout(prev);
        timers.delete(button);
      });
    },
  };
}
