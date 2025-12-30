export function setupScrollUI({ header, scrollProgress, scrollButtons }) {
  const updateHeaderOnScroll = () => {
    const scrolled = window.scrollY > 50;
    if (header) {
      header.classList.toggle('scrolled', scrolled);
    }
  };

  const updateScrollProgress = () => {
    if (!scrollProgress) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = `${progress}%`;
  };

  const handleScrollTo = (event) => {
    const targetSelector = event.currentTarget.getAttribute('data-scroll');
    if (!targetSelector) return;

    const target = document.querySelector(targetSelector);
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth' });
  };

  if (scrollButtons && scrollButtons.length) {
    scrollButtons.forEach((button) => {
      button.addEventListener('click', handleScrollTo);
    });
  }

  window.addEventListener(
    'scroll',
    () => {
      updateHeaderOnScroll();
      updateScrollProgress();
    },
    { passive: true }
  );

  window.addEventListener('resize', updateScrollProgress);

  updateHeaderOnScroll();
  updateScrollProgress();

  return { updateHeaderOnScroll, updateScrollProgress };
}