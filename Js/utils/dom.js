// Utility helpers
export function safeGetComputedStyle(property) {
  const root = document.documentElement;
  return getComputedStyle(root).getPropertyValue(property).trim();
}

export function finalizeLoader(loader) {
  if (!loader) return;

  try {
    if (loader.dataset?.state === "done") return;

    loader.dataset.state = "done";
    loader.style.opacity = "0";
    loader.style.visibility = "hidden";
    loader.style.pointerEvents = "none";

    const cleanup = () => {
      loader.removeEventListener("transitionend", onFadeOutEnd);
      loader.style.display = "none";
    };

    const onFadeOutEnd = (event) => {
      if (event.target !== loader || event.propertyName !== "opacity") return;
      cleanup();
    };

    loader.addEventListener("transitionend", onFadeOutEnd);
    setTimeout(cleanup, 800);
  } catch (error) {
    console.warn("Falha ao finalizar loader:", error);
    loader.style.display = "none";
  }
}