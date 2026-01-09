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
    if (prefersReducedMotion) {
      progressFill.style.width = `${percent}%`;
    } else {
      requestAnimationFrame(() => {
        progressFill.style.width = `${percent}%`;
      });
    }
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

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
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