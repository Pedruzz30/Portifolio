export function setupRipple({ rippleButtons }) {
  if (!rippleButtons || !rippleButtons.length) return;

  const triggerRipple = (event) => {
    try {
      const button = event.currentTarget;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const isKeyboard =
        typeof event.clientX !== 'number' ||
        typeof event.clientY !== 'number' ||
        (event.clientX === 0 && event.clientY === 0);

      const x = isKeyboard
        ? rect.width / 2
        : event.clientX - rect.left;

      const y = isKeyboard
        ? rect.height / 2
        : event.clientY - rect.top;

      if (Number.isNaN(x) || Number.isNaN(y)) return;

      button.style.setProperty('--ripple-x', `${x}px`);
      button.style.setProperty('--ripple-y', `${y}px`);

      button.classList.remove('is-rippling');
      void button.offsetWidth; // force reflow
      button.classList.add('is-rippling');

      setTimeout(() => {
        button.classList.remove('is-rippling');
      }, 500);
    } catch (err) {
      // ripple nunca pode derrubar o site
      console.warn('Ripple ignorado:', err);
    }
  };

  rippleButtons.forEach((button) => {
    if (!button) return;
    button.addEventListener('click', triggerRipple);
  });
}
