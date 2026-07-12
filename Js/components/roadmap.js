/*
 * ═══════════════════════════════════════════════════════════
 *  components/roadmap.js — Stack Roadmap (Progresso de Aprendizado)
 *
 *  Mantém apenas o comportamento funcional da seção:
 *  - calcula o progresso geral
 *  - atualiza barra, texto e pills
 *  - sincroniza aria-expanded dos details
 *
 *  As animações decorativas e reveals por scroll foram removidos.
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
    step.classList.add("is-visible");

    const details = step.querySelector(".stack-roadmap__details");
    const summary = step.querySelector(".stack-roadmap__summary");
    if (!details || !summary) return;

    const update = () => summary.setAttribute("aria-expanded", String(details.open));
    update();

    details.addEventListener("toggle", update);
    detailSummaries.push(details);
    detailHandlers.push(update);
  });

  return {
    destroy: () => {
      detailSummaries.forEach((details, index) => {
        details.removeEventListener("toggle", detailHandlers[index]);
      });
    },
  };
}