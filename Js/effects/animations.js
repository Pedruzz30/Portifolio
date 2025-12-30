function initTilt(serviceCards) {
  if (!window.VanillaTilt || !serviceCards || !serviceCards.length) return;

  VanillaTilt.init(serviceCards, {
    max: 15,
    speed: 400,
    glare: true,
    'max-glare': 0.2,
  });
}

function initPortfolioHover(portfolioItems) {
  if (!portfolioItems || !portfolioItems.length || !window.gsap) return;

  portfolioItems.forEach((item) => {
     if (!item) return;

    const img = item.querySelector('img');
    const overlay = item.querySelector('.item-overlay');
    const title = item.querySelector('h4');

    item.addEventListener('mouseenter', () => {
      if (img) gsap.to(img, { scale: 1.1, duration: 0.5 });
      if (overlay) gsap.to(overlay, { opacity: 1, duration: 0.3 });
      if (title) gsap.to(title, { y: 0, duration: 0.5 });
    });

    item.addEventListener('mouseleave', () => {
      if (img) gsap.to(img, { scale: 1, duration: 0.5 });
      if (overlay) gsap.to(overlay, { opacity: 0, duration: 0.3 });
      if (title) gsap.to(title, { y: 20, duration: 0.5 });
    });
  });
}

export function initAnimations({ heroContent, textReveal, textMask, serviceCards, portfolioItems }) {
  const revealText = textReveal || [];
  const services = serviceCards || [];
  const portfolio = portfolioItems || [];

  try {
    const hasTargets =
      heroContent || revealText.length || textMask || services.length || portfolio.length;
    if (!hasTargets) return;

    if (!window.gsap) {
      if (heroContent) heroContent.classList.add("visible");

      revealText.forEach((span) => {
        if (span) span.style.transform = "translateY(0)";
      });

      if (textMask) {
        textMask.style.clipPath = "polygon(0 0, 100% 0, 100% 100%, 0 100%)";
      }

      services.forEach((card) => card.classList.add("visible"));
      portfolio.forEach((item) => item.classList.add("visible"));
      return;
    }

    if (window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
    }

    if (heroContent) {
      heroContent.classList.add("visible");
    }

    if (revealText.length) {
      gsap.to(revealText, {
        y: 0,
        stagger: 0.1,
        duration: 1,
        ease: "power4.out",
        delay: 0.2,
      });
    }

    if (textMask) {
      gsap.to(textMask, {
        clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
        duration: 1.5,
        delay: 0.6,
        ease: "power3.inOut",
      });
    }

    if (window.ScrollTrigger) {
      const revealItems = [...services, ...portfolio].filter(Boolean);

      revealItems.forEach((el, index) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top 80%",
          once: true,
          onEnter: () => {
            el.classList.add("visible");
            gsap.fromTo(
              el,
              { opacity: 0, y: 50 },
              {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power2.out",
                delay: index * 0.05,
              }
            );
          },
        });
      });
    } else {
      services.forEach((card) => card.classList.add("visible"));
      portfolio.forEach((item) => item.classList.add("visible"));
    }

    initTilt(services);
    initPortfolioHover(portfolio);
  } catch (error) {
    console.warn("Animações desativadas por segurança:", error);
    if (heroContent) heroContent.classList.add("visible");
    revealText.forEach((span) => {
      if (span) span.style.transform = "translateY(0)";
    });
    services.forEach((card) => card.classList.add("visible"));
    portfolio.forEach((item) => item.classList.add("visible"));
    if (textMask) {
      textMask.style.clipPath = "polygon(0 0, 100% 0, 100% 100%, 0 100%)";
    }
  }
}