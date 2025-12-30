// JS/main.js

function safeGetComputedStyle(property) {
  const root = document.documentElement;
  return getComputedStyle(root).getPropertyValue(property).trim();
}

document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    loader: document.querySelector('.loader'),
    header: document.querySelector('.header'),
    navOverlay: document.querySelector('.nav-overlay'),
    navLinks: document.querySelectorAll('.nav__link'),
    scrollProgress: document.querySelector('.scroll-progress__bar'),
    menuToggle: document.querySelector('.menu-toggle'),
    menuSpans: document.querySelectorAll('.menu-toggle span'),
    textReveal: document.querySelectorAll('.text-reveal span'),
    textMask: document.querySelector('.text-mask'),
    heroContent: document.querySelector('.hero-content'),
    serviceCards: document.querySelectorAll('.service-card'),
    portfolioItems: document.querySelectorAll('.portfolio-item'),
    webGLCanvas: document.getElementById('webgl-canvas'),
    rippleButtons: document.querySelectorAll('.btn--ripple'),
    scrollButtons: document.querySelectorAll('[data-scroll]'),
  };

  const webGLState = {
    scene: null,
    camera: null,
    renderer: null,
    mesh: null,
    initialized: false,
    rafId: null,
  };

   initLoader();
  bindEvents();
  updateHeaderOnScroll();
  updateScrollProgress();

  function bindEvents() {
    if (elements.menuToggle) {
      elements.menuToggle.addEventListener('click', handleMenuToggle);
    }

    if (elements.navOverlay) {
      elements.navOverlay.addEventListener('click', closeMenu);
    }

    if (elements.navLinks.length) {
      elements.navLinks.forEach((link) => {
        link.addEventListener('click', handleNavLink);
      });
    }

    if (elements.rippleButtons.length) {
      elements.rippleButtons.forEach((button) => {
        button.addEventListener('click', handleRipple);
      });
    }

    if (elements.scrollButtons.length) {
      elements.scrollButtons.forEach((button) => {
        button.addEventListener('click', handleScrollTo);
      });
    }

     window.addEventListener('scroll', () => {
      updateHeaderOnScroll();
      updateScrollProgress();
    }, { passive: true });
    window.addEventListener('resize', handleWebGLResize);
  }

  function initLoader() {
    window.addEventListener('load', () => {
      // Se não tiver loader ou GSAP, só inicia direto
      if (!elements.loader || !window.gsap) {
        if (elements.loader) {
          elements.loader.style.opacity = '0';
          elements.loader.style.visibility = 'hidden';
          elements.loader.style.display = 'none';
        }
        initAnimations();
        initWebGL();
        return;
      }

      gsap.to(elements.loader, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
          elements.loader.style.display = 'none';
          initAnimations();
          initWebGL();
        },
      });
    });
  }

  function handleMenuToggle() {
    if (!elements.menuToggle) return;

    const isOpen = elements.menuToggle.classList.toggle('active');
    document.body.classList.toggle('menu-open', isOpen);
    elements.menuToggle.setAttribute('aria-expanded', String(isOpen));

    if (!elements.menuSpans.length || !window.gsap) return;

    const openColor = safeGetComputedStyle('--accent') || '#ff4d4d';
    const closedColor = safeGetComputedStyle('--text') || '#f5f5f5';

    gsap.to(elements.menuSpans, {
      backgroundColor: isOpen ? openColor : closedColor,
      duration: 0.3,
    });

    if (isOpen) {
      if (elements.menuSpans[0]) gsap.to(elements.menuSpans[0], { y: 8, rotate: 45, duration: 0.3 });
      if (elements.menuSpans[1]) gsap.to(elements.menuSpans[1], { y: -8, rotate: -45, duration: 0.3 });
    } else {
      gsap.to(elements.menuSpans, { y: 0, rotate: 0, duration: 0.3 });
    }
  }

  function closeMenu() {
    if (!elements.menuToggle || !elements.menuToggle.classList.contains('active')) return;
    elements.menuToggle.classList.remove('active');
    document.body.classList.remove('menu-open');
    elements.menuToggle.setAttribute('aria-expanded', 'false');
    if (elements.menuSpans.length && window.gsap) {
      gsap.to(elements.menuSpans, { backgroundColor: safeGetComputedStyle('--text') || '#f5f5f5', y: 0, rotate: 0, duration: 0.3 });
    }
  }

  function handleNavLink(event) {
    const href = event.currentTarget.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    event.preventDefault();
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
    closeMenu();
  }

  function handleRipple(event) {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const isKeyboard = event.clientX === 0 && event.clientY === 0;
    const x = isKeyboard ? rect.width / 2 : event.clientX - rect.left;
    const y = isKeyboard ? rect.height / 2 : event.clientY - rect.top;

    button.style.setProperty('--ripple-x', `${x}px`);
    button.style.setProperty('--ripple-y', `${y}px`);

    button.classList.add('is-rippling');
    setTimeout(() => {
      button.classList.remove('is-rippling');
    }, 420);
  }

  function handleScrollTo(event) {
    const targetSelector = event.currentTarget.getAttribute('data-scroll');
    if (!targetSelector) return;

    const target = document.querySelector(targetSelector);
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth' });
  }

  function updateHeaderOnScroll() {
    const scrolled = window.scrollY > 50;
    if (elements.header) {
      elements.header.classList.toggle('scrolled', scrolled);
    }
  }

  function updateScrollProgress() {
    if (!elements.scrollProgress) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    elements.scrollProgress.style.width = `${progress}%`;
  }

  function initAnimations() {
    if (!window.gsap) {
      // Sem GSAP: pelo menos deixa a hero aparecer
      if (elements.heroContent) elements.heroContent.classList.add('visible');
      elements.textReveal.forEach((span) => {
        if (span) span.style.transform = 'translateY(0)';
      });
      if (elements.textMask) {
        elements.textMask.style.clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
      }
      elements.serviceCards.forEach((c) => c.classList.add('visible'));
      elements.portfolioItems.forEach((p) => p.classList.add('visible'));
      return;
    }

    // Plugins
    if (window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
    }

    // Hero visível (fallback pro CSS que usa .visible)
    if (elements.heroContent) {
      elements.heroContent.classList.add('visible');
    }

    // Texto principal: entra de baixo pra cima
    if (elements.textReveal.length) {
      gsap.to(elements.textReveal, {
        y: 0,
        stagger: 0.1,
        duration: 1,
        ease: 'power4.out',
        delay: 0.2,
      });
    }

    // Máscara de texto
    if (elements.textMask) {
      gsap.to(elements.textMask, {
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
        duration: 1.5,
        delay: 0.6,
        ease: 'power3.inOut',
      });
    }

    // Revelar cards/itens no scroll
    if (window.ScrollTrigger) {
      const revealItems = [...elements.serviceCards, ...elements.portfolioItems].filter(Boolean);

      revealItems.forEach((el, index) => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 80%',
          once: true, // garante que só acontece 1 vez
          onEnter: () => {
            el.classList.add('visible');
            gsap.fromTo(
              el,
              { opacity: 0, y: 50 },
              {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power2.out',
                delay: index * 0.05,
              }
            );
          },
        });
      });
    } else {
      // Sem ScrollTrigger, mostra tudo de boa
      elements.serviceCards.forEach((c) => c.classList.add('visible'));
      elements.portfolioItems.forEach((p) => p.classList.add('visible'));
    }

    initTilt();
    initPortfolioHover();
  }

  function initTilt() {
    if (!window.VanillaTilt || !elements.serviceCards.length) return;

    VanillaTilt.init(elements.serviceCards, {
      max: 15,
      speed: 400,
      glare: true,
      'max-glare': 0.2,
    });
  }

  function initPortfolioHover() {
    if (!elements.portfolioItems.length || !window.gsap) return;

    elements.portfolioItems.forEach((item) => {
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

  function initWebGL() {
    if (!elements.webGLCanvas || !window.THREE) return;

    try {
      const w = elements.webGLCanvas.clientWidth || 1;
      const h = elements.webGLCanvas.clientHeight || 1;

      webGLState.scene = new THREE.Scene();
      webGLState.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);

      webGLState.renderer = new THREE.WebGLRenderer({
        canvas: elements.webGLCanvas,
        antialias: true,
        alpha: true,
      });

      webGLState.renderer.setSize(w, h);
      webGLState.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1);
      webGLState.scene.add(ambientLight, directionalLight);

      const geometry = new THREE.IcosahedronGeometry(1.5, 2);

      // Pega sua cor de accent do CSS, se existir.
      // Se não der certo, cai no fallback.
      const accent = safeGetComputedStyle('--accent');
      const material = new THREE.MeshStandardMaterial({
        color: accent || 0xff4d4d,
        metalness: 0.7,
        roughness: 0.2,
      });

      webGLState.mesh = new THREE.Mesh(geometry, material);
      webGLState.scene.add(webGLState.mesh);

      webGLState.camera.position.z = 5;
      webGLState.initialized = true;

      animateWebGL();
    } catch (error) {
      console.error('Erro ao inicializar WebGL:', error);
      if (elements.webGLCanvas) elements.webGLCanvas.style.display = 'none';
    }
  }

  function animateWebGL() {
    if (!webGLState.initialized) return;

    webGLState.rafId = requestAnimationFrame(animateWebGL);

    if (webGLState.mesh) {
      webGLState.mesh.rotation.x += 0.005;
      webGLState.mesh.rotation.y += 0.01;
    }

    if (webGLState.renderer && webGLState.scene && webGLState.camera) {
      webGLState.renderer.render(webGLState.scene, webGLState.camera);
    }
  }

  function handleWebGLResize() {
    if (!webGLState.initialized || !elements.webGLCanvas) return;
    if (!webGLState.camera || !webGLState.renderer) return;

    const w = elements.webGLCanvas.clientWidth || 1;
    const h = elements.webGLCanvas.clientHeight || 1;

    webGLState.camera.aspect = w / h;
    webGLState.camera.updateProjectionMatrix();
    webGLState.renderer.setSize(w, h);
  }

  // Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

});