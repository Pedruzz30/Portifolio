export function setupRipple({ rippleButtons }) {
  if (!rippleButtons || !rippleButtons.length) return;

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

      button.style.setProperty("--ripple-x", `${x}px`);
      button.style.setProperty("--ripple-y", `${y}px`);

      button.classList.remove("is-rippling");
      void button.offsetWidth;
      button.classList.add("is-rippling");

      setTimeout(() => {
        try {
          button.classList.remove("is-rippling");
        } catch (cleanupError) {
          console.warn("Ripple cleanup ignorado:", cleanupError);
        }
      }, 500);
    } catch (err) {
      console.warn("Ripple ignorado:", err);
    }
  };

  const handleKeydown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    triggerRipple(event);
  };

  rippleButtons.forEach((button) => {
    if (!button) return;
    button.addEventListener("click", triggerRipple);
    button.addEventListener("keydown", handleKeydown);
  });
}
