/*
 * ═══════════════════════════════════════════════════════════
 *  modules/dive-transition.js — Mergulho ao clicar
 *
 *  Qualquer elemento com [data-dive] e um href de âncora ganha,
 *  no clique, uma animação de mergulho em vez do salto seco:
 *   1. o gatilho despenca (.is-diving — visual definido no CSS
 *      por tipo: .scroll-indicator vs .btn)
 *   2. um splash em anel se expande no ponto do clique
 *   3. um véu de submersão varre a tela (sensação de afundar)
 *   4. só então a página rola suave até o alvo do href
 *
 *  Acessibilidade: com prefers-reduced-motion o efeito é pulado
 *  e o scroll acontece imediatamente. Como são <a href="#...">,
 *  o Enter do teclado já dispara o mesmo handler de click.
 * ═══════════════════════════════════════════════════════════
 */

export function setupDiveTransition({
  triggers = [],
  header,
  prefersReducedMotion = false,
  signal,
} = {}) {
  const list = triggers.filter(Boolean);
  if (!list.length) return { destroy: () => {} };

  const root = document.documentElement;

  // Lê o offset do header fixo (mesma fonte de verdade do scroll.js).
  const getHeaderOffset = () => {
    const raw = getComputedStyle(root).getPropertyValue("--header-offset");
    const parsed = parseFloat(raw);
    if (Number.isFinite(parsed)) return parsed;
    return header?.getBoundingClientRect().height ?? 0;
  };

  const scrollToTarget = (selector, behavior) => {
    if (!selector || !selector.startsWith("#")) return;
    const target = document.querySelector(selector);
    if (!target) return;
    const offset = getHeaderOffset();
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(top, 0), behavior });
  };

  let diving = false;
  const timers = new Set();

  const later = (fn, delay) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, delay);
    timers.add(id);
    return id;
  };

  // Splash em anel: elemento próprio (fixed) centrado no gatilho —
  // evita conflito com ::before/::after já usados por .btn--ripple.
  const spawnSplash = (el) => {
    const rect = el.getBoundingClientRect();
    const splash = document.createElement("span");
    splash.className = "dive-splash";
    splash.setAttribute("aria-hidden", "true");
    splash.style.left = `${rect.left + rect.width / 2}px`;
    splash.style.top = `${rect.top + rect.height / 2}px`;
    document.body.appendChild(splash);
    splash.addEventListener("animationend", () => splash.remove(), { once: true });
    later(() => splash.remove(), 900);
  };

  const onActivate = (el) => (event) => {
    event.preventDefault();

    const targetSelector = el.getAttribute("href") || "";

    if (prefersReducedMotion) {
      scrollToTarget(targetSelector, "smooth");
      return;
    }

    if (diving) return;
    diving = true;

    // Véu de submersão em cima de tudo (decorativo, não bloqueia clique).
    const veil = document.createElement("div");
    veil.className = "dive-veil";
    veil.setAttribute("aria-hidden", "true");
    document.body.appendChild(veil);

    el.classList.add("is-diving");
    spawnSplash(el);

    // Força reflow para a animação partir do estado inicial.
    void veil.offsetWidth;
    veil.classList.add("is-active");

    // Desce quando a submersão já começou — dá o tempo do "afundar".
    later(() => scrollToTarget(targetSelector, "smooth"), 240);

    // Limpeza ao fim da onda; animationend é o caminho normal,
    // o timer é só uma rede de segurança caso o evento não dispare.
    const finish = () => {
      if (!diving) return;
      diving = false;
      el.classList.remove("is-diving");
      veil.remove();
    };

    veil.addEventListener("animationend", finish, { once: true });
    later(finish, 1200);
  };

  const clickOptions = signal ? { signal } : undefined;
  const handlers = list.map((el) => {
    const handler = onActivate(el);
    el.addEventListener("click", handler, clickOptions);
    return { el, handler };
  });

  return {
    destroy: () => {
      timers.forEach((id) => clearTimeout(id));
      timers.clear();
      handlers.forEach(({ el, handler }) => {
        el.removeEventListener("click", handler);
        el.classList.remove("is-diving");
      });
      document
        .querySelectorAll(".dive-veil, .dive-splash")
        .forEach((node) => node.remove());
    },
  };
}
