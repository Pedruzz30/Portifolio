document.addEventListener('DOMContentLoaded', () => {
  const loader = document.querySelector('.loader');
  const menuToggle = document.querySelector('.menu-toggle');
  const spans = menuToggle.querySelectorAll('span');
  const header = document.querySelector('.header');
  const textReveal = document.querySelectorAll('.text-reveal span');
  const textMask = document.querySelector('.text-mask');
  const serviceCards = document.querySelectorAll('.service-card');
  const portfolioItems = document.querySelectorAll('.portfolio-item');

  window.addEventListener('load', () => {
    gsap.to(loader, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        loader.style.display = 'none';
        initAnimations();
        initWebGL();
      }
    });
  });

  function initAnimations() {
    // Menu
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      document.body.classList.toggle('menu-open');
      const active = menuToggle.classList.contains('active');
      gsap.to(spans, {
        backgroundColor: active ? 'var(--accent)' : 'var(--text)',
        y: 0,
        rotate: 0,
        duration: 0.3
      });
      if (active) {
        gsap.to(spans[0], { y: 8, rotate: 45, duration: 0.3 });
        gsap.to(spans[1], { y: -8, rotate: -45, duration: 0.3 });
      }
    });

    // Reveal de texto
    gsap.registerPlugin(ScrollTrigger);
    textReveal.forEach(span => {
      gsap.to(span, {
        y: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: span.parentElement,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      });
    });

    // Máscara de texto
    gsap.to(textMask, {
      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
      duration: 1.5,
      delay: 0.5,
      ease: 'power3.inOut'
    });

    // Tilt
    VanillaTilt.init(serviceCards, {
      max: 15,
      speed: 400,
      glare: true,
      "max-glare": 0.2
    });

    // Portfólio
    portfolioItems.forEach(item => {
      const img = item.querySelector('img');
      const overlay = item.querySelector('.item-overlay');
      const title = item.querySelector('h4');
      item.addEventListener('mouseenter', () => {
        gsap.to(img, { scale: 1.1, duration: 0.5 });
        gsap.to(overlay, { opacity: 1, duration: 0.3 });
        gsap.to(title, { y: 0, duration: 0.5 });
      });
      item.addEventListener('mouseleave', () => {
        gsap.to(img, { scale: 1, duration: 0.5 });
        gsap.to(overlay, { opacity: 0, duration: 0.3 });
        gsap.to(title, { y: 20, duration: 0.5 });
      });
    });

    // Scroll do header
    window.addEventListener('scroll', () => {
      header.style.backgroundColor = window.scrollY > 50 ? 'rgba(15, 15, 15, 0.9)' : 'transparent';
    });
  }

  function initWebGL() {
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(1, 1, 1);
    scene.add(ambient);
    scene.add(directional);

    const geometry = new THREE.IcosahedronGeometry(1.5, 2);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff4d4d,
      metalness: 0.7,
      roughness: 0.2
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    camera.position.z = 5;

    function animate() {
      requestAnimationFrame(animate);
      mesh.rotation.x += 0.005;
      mesh.rotation.y += 0.01;
      renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    });
  }
});
