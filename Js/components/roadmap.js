/*
 * ═══════════════════════════════════════════════════════════
 *  components/roadmap.js — Stack Roadmap (Progresso de Aprendizado)
 *
 *  Calcula o progresso geral do roadmap usando pesos por status:
 *    "now"      → 100% (etapa atual, aprendendo agora)
 *    "progress" → 65%  (em andamento, parcialmente dominado)
 *    "next"     → 35%  (próxima etapa, planejada)
 *    "future"   → 15%  (horizonte distante, apenas mapeado)
 *
 *  Isso evita mostrar "0%" em etapas planejadas — o mapeamento
 *  em si já representa progresso real de planejamento.
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Inicializa o roadmap: calcula progresso, anima a barra
 * e revela os steps conforme entram no viewport.
 *
 * @param {Object} options
 * @param {HTMLElement} options.section          - Seção .stack-roadmap
 * @param {HTMLElement[]} options.steps          - Elementos .stack-roadmap__step
 * @param {HTMLElement} options.progressFill     - Barra de progresso (width animado)
 * @param {HTMLElement} options.progressValue    - Texto com o percentual (ex: "68%")
 * @param {HTMLElement} options.progressCaption  - Texto descritivo (ex: "2 de 6 etapas")
 * @param {HTMLElement[]} options.progressSteps  - Pills de status da barra
 * @param {boolean} options.prefersReducedMotion
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

  // Peso de cada status: quanto cada etapa contribui para o progresso total
  const statusWeights = {
    now: 1,        // 100% — estou nisso agora
    progress: 0.65, // 65% — avancei, mas ainda tenho a aprender
    next: 0.35,    // 35% — já planejei e entendo o que é
    future: 0.15,  // 15% — está no radar, mas ainda distante
  };

  // Statuses que contam como "em andamento" para o caption
  const activeStatuses = new Set(["now", "progress"]);

  const totalSteps = steps.length;

  // Soma os pesos de todas as etapas para calcular o percentual ponderado
  const score = steps.reduce((sum, step) => {
    const weight = statusWeights[step.dataset.status] ?? 0;
    return sum + weight;
  }, 0);

  // Percentual inteiro: score / totalSteps * 100
  const percent = Math.round((score / totalSteps) * 100);

  // Contagem de etapas "ativas" (now + progress)
  const activeCount = steps.filter((step) => activeStatuses.has(step.dataset.status)).length;

  // Atualiza o valor numérico visível (ex: "68%")
  if (progressValue) {
    progressValue.textContent = `${percent}%`;
  }

  // Atualiza o texto descritivo (ex: "2 de 6 etapas em andamento")
  if (progressCaption) {
    progressCaption.textContent = `${activeCount} de ${totalSteps} etapas em andamento`;
  }

  // Destaca as pills de status até activeCount (as que estão ativas ficam com is-active)
  if (progressSteps.length) {
    progressSteps.forEach((step, index) => {
      step.classList.toggle("is-active", index < activeCount);
    });
  }

  // Anima a barra de progresso para o percentual calculado.
  // Com reduceMotion: aplica imediatamente sem transição CSS.
  // Sem reduceMotion: duplo rAF garante que o browser confirme o estado inicial (0%)
  // antes de aplicar o valor final — sem isso, a transição CSS pode não disparar
  // se o primeiro frame ainda não tiver pintado o valor inicial da folha de estilo.
  if (progressFill) {
    if (prefersReducedMotion) {
      progressFill.style.width = `${percent}%`;
    } else {
      requestAnimationFrame(() => {
        // Força reflow para garantir que width: 0% do CSS seja committed
        void progressFill.offsetWidth;
        requestAnimationFrame(() => {
          progressFill.style.width = `${percent}%`;
        });
      });
    }
  }

  // ── Acessibilidade: aria-expanded nos detalhes ──────────
  // Cada step tem um <details> expansível. Sincroniza aria-expanded
  // no <summary> ao abrir/fechar para leitores de tela saberem o estado.
  const detailSummaries = [];
  const detailHandlers = [];

  steps.forEach((step) => {
    const details = step.querySelector(".stack-roadmap__details");
    const summary = step.querySelector(".stack-roadmap__summary");
    if (!details || !summary) return;

    const update = () => summary.setAttribute("aria-expanded", String(details.open));
    update(); // estado inicial
    details.addEventListener("toggle", update);
    detailSummaries.push(details);
    detailHandlers.push(update);
  });

  // Com reduceMotion: todos os steps ficam visíveis imediatamente
  if (prefersReducedMotion) {
    steps.forEach((step) => step.classList.add("is-visible"));
    return {
      destroy: () => {
        detailSummaries.forEach((details, index) =>
          details.removeEventListener("toggle", detailHandlers[index])
        );
      },
    };
  }

  // ── Reveal por scroll (IntersectionObserver) ────────────
  // Cada step começa invisível (opacity:0, translateY) e recebe
  // a classe "is-visible" quando 20% do elemento entra no viewport.
  // unobserve() após a entrada: sem custo de CPU em elementos já visíveis.
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target); // para de observar após revelar
        }
      });
    },
    { threshold: 0.2 } // 20% visível já é suficiente para disparar
  );

  steps.forEach((step) => observer.observe(step));

  return {
    destroy: () => {
      observer.disconnect();
      detailSummaries.forEach((details, index) =>
        details.removeEventListener("toggle", detailHandlers[index])
      );
    },
  };
}