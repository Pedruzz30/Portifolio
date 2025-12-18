document.addEventListener('DOMContentLoaded', () => {
    // Configurações globais
    const config = {
        debug: true,
        scrollSensitivity: 0.1,
        animationDuration: 0.5
    };

    // Elementos globais
    const elements = {
        loader: document.querySelector('.loader'),
        menuToggle: document.querySelector('.menu-toggle'),
        header: document.querySelector('.header'),
        textReveal: document.querySelectorAll('.text-reveal span'),
        textMask: document.querySelector('.text-mask'),
        serviceCards: document.querySelectorAll('.service-card'),
        portfolioItems: document.querySelectorAll('.portfolio-item'),
        webGLCanvas: document.getElementById('webgl-canvas')
    };

    // Estado da aplicação
    const appState = {
        isMenuOpen: false,
        scrollPosition: 0,
        webGLInitialized: false
    };

    // Inicialização principal
    function init() {
        setupEventListeners();
        initLoader();
        
        if (config.debug) {
            console.log('Aplicação inicializada');
        }
    }

    // Configura listeners de eventos
    function setupEventListeners() {
        // Menu toggle
        elements.menuToggle.addEventListener('click', toggleMenu);

        // Scroll events
        window.addEventListener('scroll', handleScroll);

        // Resize events
        window.addEventListener('resize', handleResize);
    }

    // Animação do loader
    function initLoader() {
        window.addEventListener('load', () => {
            gsap.to(elements.loader, {
                opacity: 0,
                duration: config.animationDuration,
                onComplete: () => {
                    elements.loader.style.display = 'none';
                    initAnimations();
                    initWebGL();
                }
            });
        });
    }

    // Controle do menu mobile
    function toggleMenu() {
        appState.isMenuOpen = !appState.isMenuOpen;
        document.body.classList.toggle('menu-open', appState.isMenuOpen);
        elements.menuToggle.classList.toggle('active', appState.isMenuOpen);

        // Animação dos spans do menu
        const menuSpans = elements.menuToggle.querySelectorAll('span');
        const menuColor = appState.isMenuOpen ? getComputedStyle(document.documentElement).getPropertyValue('--accent') : getComputedStyle(document.documentElement).getPropertyValue('--text');
        
        gsap.to(menuSpans, {
            backgroundColor: menuColor,
            duration: config.animationDuration
        });

        if (appState.isMenuOpen) {
            gsap.to(menuSpans[0], { y: 8, rotate: 45, duration: config.animationDuration });
            gsap.to(menuSpans[1], { y: -8, rotate: -45, duration: config.animationDuration });
        } else {
            gsap.to(menuSpans, { y: 0, rotate: 0, duration: config.animationDuration });
        }
    }

    // Controle de scroll
    function handleScroll() {
        appState.scrollPosition = window.scrollY;
        
        // Header effect
        if (appState.scrollPosition > 50) {
            elements.header.style.backgroundColor = 'rgba(15, 15, 15, 0.9)';
        } else {
            elements.header.style.backgroundColor = 'transparent';
        }
    }

    // Tratamento de resize
    function handleResize() {
        if (appState.webGLInitialized && elements.webGLCanvas) {
            // Atualiza cena WebGL
            camera.aspect = elements.webGLCanvas.clientWidth / elements.webGLCanvas.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(elements.webGLCanvas.clientWidth, elements.webGLCanvas.clientHeight);
        }
    }

    // Inicialização das animações
    function initAnimations() {
        gsap.registerPlugin(ScrollTrigger);

        // Text reveal animation
        elements.textReveal.forEach(char => {
            gsap.to(char, {
                y: 0,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: char.parentElement,
                    start: 'top 80%',
                    toggleActions: 'play none none none'
                }
            });
        });

        // Text mask animation
        gsap.to(elements.textMask, {
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
            duration: 1.5,
            delay: 0.5,
            ease: 'power3.inOut'
        });

        // Service cards tilt effect
        if (typeof VanillaTilt !== 'undefined') {
            VanillaTilt.init(elements.serviceCards, {
                max: 15,
                speed: 400,
                glare: true,
                "max-glare": 0.2
            });
        }

        // Portfolio items hover effect
        elements.portfolioItems.forEach(item => {
            const img = item.querySelector('img');
            const overlay = item.querySelector('.item-overlay');
            const title = item.querySelector('h4');
            
            item.addEventListener('mouseenter', () => {
                gsap.to(img, { scale: 1.1, duration: config.animationDuration });
                gsap.to(overlay, { opacity: 1, duration: config.animationDuration });
                gsap.to(title, { y: 0, duration: config.animationDuration });
            });
            
            item.addEventListener('mouseleave', () => {
                gsap.to(img, { scale: 1, duration: config.animationDuration });
                gsap.to(overlay, { opacity: 0, duration: config.animationDuration });
                gsap.to(title, { y: 20, duration: config.animationDuration });
            });
        });
    }

    // WebGL/Three.js initialization
    let scene, camera, renderer, mesh;
    function initWebGL() {
        if (!elements.webGLCanvas) {
            if (config.debug) console.warn('Canvas WebGL não encontrado');
            return;
        }

        try {
            // Inicializa cena
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(
                75,
                elements.webGLCanvas.clientWidth / elements.webGLCanvas.clientHeight,
                0.1,
                1000
            );
            
            renderer = new THREE.WebGLRenderer({
                canvas: elements.webGLCanvas,
                antialias: true,
                alpha: true
            });
            
            renderer.setSize(elements.webGLCanvas.clientWidth, elements.webGLCanvas.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            
            // Configura iluminação
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(1, 1, 1);
            scene.add(directionalLight);
            
            // Cria objeto 3D
            const geometry = new THREE.IcosahedronGeometry(1.5, 2);
            const material = new THREE.MeshStandardMaterial({
                color: 0xff4d4d,
                metalness: 0.7,
                roughness: 0.2
            });
            
            mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);
            
            camera.position.z = 5;
            
            // Inicia animação
            animateWebGL();
            appState.webGLInitialized = true;
            
            if (config.debug) console.log('WebGL inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar WebGL:', error);
            elements.webGLCanvas.style.display = 'none';
        }
    }

    // Animação WebGL
    function animateWebGL() {
        if (!appState.webGLInitialized) return;
        
        requestAnimationFrame(animateWebGL);
        mesh.rotation.x += 0.005;
        mesh.rotation.y += 0.01;
        renderer.render(scene, camera);
    }

    // Inicia a aplicação
    init();
});