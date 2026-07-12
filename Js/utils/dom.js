/*
 * ═══════════════════════════════════════════════════════════
 *  utils/dom.js — Utilitários do DOM
 *  Funções puras e reutilizáveis que lidam com o DOM.
 *  Sem estado, sem efeitos colaterais — fáceis de testar.
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Lê o valor de uma CSS custom property (variável CSS) do :root.
 * Útil para passar tokens de design (cores, durações) para o JS
 * sem hardcodar valores que já existem no CSS.
 *
 * @param {string} property - Nome da variável, ex: "--accent"
 * @returns {string} Valor da variável, já com .trim() aplicado
 */
export function safeGetComputedStyle(property) {
  const root = document.documentElement;
  return getComputedStyle(root).getPropertyValue(property).trim();
}

/**
 * Remove o loader de tela cheia após o site estar pronto.
 *
 * Estratégia em 3 etapas para evitar flash ou loader preso:
 *  1. Marca data-state="done" como idempotente (chamadas repetidas são ignoradas)
 *  2. Aplica opacity: 0 + visibility: hidden via style inline (transição CSS)
 *  3. Remove do layout com display: none após a transição OU após 800ms (segurança)
 *
 * @param {HTMLElement|null} loader - Elemento .loader
 */
export function finalizeLoader(loader) {
  if (!loader) return;

  try {
    // Idempotente: se já foi finalizado, não faz nada
    if (loader.dataset?.state === "done") return;

    // Permite que outro sistema (ex: GSAP) assuma o controle do loader
    if (loader.dataset?.state === "gsap") return;

    loader.dataset.state = "done";
    loader.style.opacity = "0";
    loader.style.visibility = "hidden";
    loader.style.pointerEvents = "none";

    // Limpa o listener após uso (evita acumulação em hot-reloads)
    const cleanup = () => {
      loader.removeEventListener("transitionend", onFadeOutEnd);
      loader.style.display = "none";
    };

    // Aguarda o fim da transição de opacity para remover do layout.
    // event.target === loader garante que não reagimos a transições de filhos.
    const onFadeOutEnd = (event) => {
      if (event.target !== loader || event.propertyName !== "opacity") return;
      cleanup();
    };

    loader.addEventListener("transitionend", onFadeOutEnd);

    // Fallback: se a transição não disparar (elemento oculto, etc.),
    // remove o display após 800ms de qualquer jeito.
    setTimeout(cleanup, 800);
  } catch (error) {
    console.warn("Falha ao finalizar loader:", error);
    loader.style.display = "none"; // modo de sobrevivência
  }
}
