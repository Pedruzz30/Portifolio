/*
 * Hero bubbles
 * Cria as bolhas decorativas consumidas pelo keyframe `hero-bubble-rise`.
 */

export function initHeroBubbles({ isMobile = false } = {}) {
  const hero = document.querySelector(".hero");
  if (!hero) return () => {};

  hero.querySelector(".hero-bubbles")?.remove();

  const container = document.createElement("div");
  container.className = "hero-bubbles";
  container.setAttribute("aria-hidden", "true");
  hero.appendChild(container);

  const bubbleCount = isMobile ? 8 : 18;

  for (let i = 0; i < bubbleCount; i += 1) {
    const bubble = document.createElement("span");
    bubble.className = "hero-bubble";

    const size = 8 + Math.random() * 20;
    const left = 5 + Math.random() * 88;
    const duration = 7 + Math.random() * 6;
    const delay = Math.random() * duration;
    const drift1 = (Math.random() < 0.5 ? 1 : -1) * (8 + Math.random() * 16);
    const drift2 = -drift1 * (0.5 + Math.random() * 0.6);

    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${left}%`;
    bubble.style.animationDuration = `${duration}s`;
    bubble.style.animationDelay = `-${delay}s`;
    bubble.style.setProperty("--bubble-drift", `${drift1.toFixed(1)}px`);
    bubble.style.setProperty("--bubble-drift-2", `${drift2.toFixed(1)}px`);

    container.appendChild(bubble);
  }

  return () => container.remove();
}
