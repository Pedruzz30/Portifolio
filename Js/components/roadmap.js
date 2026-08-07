/*
 * ═══════════════════════════════════════════════════════════
 *  components/roadmap.js — Stack Roadmap (Progresso de Aprendizado)
 *
 *  Mantém apenas o comportamento funcional da seção:
 *  - calcula o progresso geral
 *  - atualiza barra, texto e pills
 *  - sincroniza aria-expanded dos details
 *
 *  - revela os steps em cascata conforme entram na viewport
 *    (fallback: mostra todos de uma vez sem IO ou com reduced-motion)
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Inicializa o roadmap e atualiza os estados visuais estáticos.
 *
 * @param {Object} options
 * @param {HTMLElement} options.section         - Seção .stack-roadmap
 * @param {HTMLElement[]} options.steps         - Elementos .stack-roadmap__step
 * @param {HTMLElement} options.progressFill    - Barra de progresso
 * @param {HTMLElement} options.progressValue   - Texto com o percentual
 * @param {HTMLElement} options.progressCaption - Texto descritivo
 * @param {HTMLElement[]} options.progressSteps - Pills da barra
 */
export function setupRoadmap({
  section,
  steps = [],
  progressFill,
  progressValue,
  progressCaption,
  progressSteps = [],
  prefersReducedMotion = false,
}) {
  if (!section || !steps.length) {
    return { destroy: () => {} };
  }

  const statusWeights = {
    now: 1,
    progress: 0.65,
    next: 0.35,
    future: 0.15,
  };

  const activeStatuses = new Set(["now", "progress"]);
  const totalSteps = steps.length;

  const score = steps.reduce((sum, step) => {
    const weight = statusWeights[step.dataset.status] ?? 0;
    return sum + weight;
  }, 0);

  const percent = Math.round((score / totalSteps) * 100);
  const activeCount = steps.filter((step) => activeStatuses.has(step.dataset.status)).length;

  if (progressValue) {
    progressValue.textContent = `${percent}%`;
  }

  if (progressCaption) {
    progressCaption.textContent = `${activeCount} de ${totalSteps} etapas em andamento`;
  }

  if (progressSteps.length) {
    progressSteps.forEach((step, index) => {
      step.classList.toggle("is-active", index < activeCount);
    });
  }

  if (progressFill) {
    const scale = Math.max(0, Math.min(percent / 100, 1));
    progressFill.style.transformOrigin = "left center";
    progressFill.style.transform = `scaleX(${scale})`;
  }

  const detailSummaries = [];
  const detailHandlers = [];

  steps.forEach((step) => {
    const details = step.querySelector(".stack-roadmap__details");
    const summary = step.querySelector(".stack-roadmap__summary");
    if (!details || !summary) return;

    const update = () => summary.setAttribute("aria-expanded", String(details.open));
    update();

    details.addEventListener("toggle", update);
    detailSummaries.push(details);
    detailHandlers.push(update);
  });

  // Reveal em cascata: cada step ganha .is-visible ao entrar na viewport.
  // O transition de opacity/transform mora no CSS (.stack-roadmap__step).
  // Fallback (sem IO ou reduced-motion): revela todos imediatamente.
  let stepObserver = null;
  const canObserve = !prefersReducedMotion && "IntersectionObserver" in window;

  if (!canObserve) {
    steps.forEach((step) => step.classList.add("is-visible"));
  } else {
    stepObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );
    steps.forEach((step) => stepObserver.observe(step));
  }

  return {
    destroy: () => {
      stepObserver?.disconnect();
      detailSummaries.forEach((details, index) => {
        details.removeEventListener("toggle", detailHandlers[index]);
      });
    },
  };
}