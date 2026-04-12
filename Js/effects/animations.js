/*
 * ═══════════════════════════════════════════════════════════
 *  effects/animations.js — Correnteza Visual
 *
 *  Orquestra todos os efeitos visuais dinâmicos do portfólio:
 *  - Reveal de texto do hero (GSAP + clip-path)
 *  - Scroll reveal de cards ("surfacing from depth")
 *  - Mouse parallax do hero (camadas em profundidade)
 *  - Scroll parallax do hero (elementos na viewport)
 *  - Bolhas ascendentes (geradas dinamicamente)
 *  - VanillaTilt lazy (só ativa quando o card entra na tela)
 *  - Hover nos cards de portfolio (GSAP timeline)
 * ═══════════════════════════════════════════════════════════
 */

// Detecta suporte a hover real (tablets não têm hover, não precisam de tilt)
const canHover = window.matchMedia("(hover: hover)").matches;

// Detecta preferência de acessibilidade uma única vez no módulo
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

// Flag mobile padronizada — mesma breakpoint usada em main.js
const isMobile = window.matchMedia("(max-width: 768px)").matches;

/* =========================
   VANILLA TILT — LAZY INIT
   Inicializa o efeito 3D tilt nos cards apenas quando entram
   no viewport (IntersectionObserver + requestIdleCallback).
   Isso evita que o GSAP pesado inicialize em elementos fora de tela.
========================= */
function initLazyTilt(cards) {
  const items = cards.filter(Boolean);
  // Sem VanillaTilt, sem itens, mobile ou com preferência de sem-movimento: no-op
  if (
    !window.VanillaTilt ||
    !items.length ||
    prefersReducedMotion ||
    isMobile
  ) {
    return () => {};
  }

  // WeakMap: armazena os handles de rAF/idle por elemento sem risco de leak
  const idleHandles = new WeakMap();

  /**
   * Agenda a inicialização do tilt para quando o browser estiver ocioso.
   * requestIdleCallback > setTimeout para não travar frames de animação.
   */
  const scheduleTilt = (el) => {
    if (el.vanillaTilt) return; // já inicializado

    const init = () => {
      idleHandles.delete(el);
      if (el.vanillaTilt) return; // checagem dupla (rAF pode chegar depois)
      window.VanillaTilt.init(el, {
        max: 8, // máximo 8° de rotação
        speed: 600, // velocidade de retorno (ms)
        glare: true,
        "max-glare": 0.12, // brilho sutil, não distrativo
      });
    };

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(init, { timeout: 350 });
      idleHandles.set(el, { type: "idle", id });
    } else {
      const id = window.setTimeout(init, 0); // fallback para browsers sem rIC
      idleHandles.set(el, { type: "timeout", id });
    }
  };

  // Observa cada card: quando 25% aparece na tela, agenda o tilt
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        if (entry.isIntersecting && !el.vanillaTilt) {
          scheduleTilt(el);
          observer.unobserve(el); // para de observar — o tilt vai ser init apenas uma vez
        }
      });
    },
    { threshold: 0.25 },
  );

  items.forEach((card) => observer.observe(card));

  // Cleanup: cancela observações e timers, destrói instâncias de tilt
  return () => {
    observer.disconnect();
    items.forEach((card) => {
      const handle = idleHandles.get(card);
      if (!handle) return;
      if (handle.type === "idle" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(handle.id);
      } else {
        clearTimeout(handle.id);
      }
      idleHandles.delete(card);
    });
    items.forEach((card) => {
      try {
        card.vanillaTilt?.destroy();
      } catch {}
    });
  };
}

/* =========================
   PORTFOLIO HOVER — ELITE
   Anima o glow, badge de status e tags ao passar o mouse
   usando GSAP timeline (play/reverse), mais suave que CSS puro.
========================= */
function initPortfolioHover(items) {
  const cards = items.filter(Boolean);
  // Só em dispositivos com hover real + GSAP disponível
  if (!cards.length || !window.gsap || !canHover || prefersReducedMotion) {
    return () => {};
  }

  const cleanups = [];

  cards.forEach((card) => {
    // Seleciona os elementos animados dentro do card
    const glow = card.querySelector(".project-card__glow"); // halo de luz
    const score = card.querySelector(".project-card__status"); // badge de status
    const meta = card.querySelectorAll(".project-tag"); // tecnologias usadas

    const targets = [glow, score, ...meta].filter(Boolean);
    gsap.set(targets, { clearProps: "all" }); // reset inicial

    // Timeline pausada: play() no enter, reverse() no leave
    const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });

    if (glow)
      tl.to(glow, { opacity: 1, duration: 0.45, ease: "power2.out" }, 0);
    if (score) tl.to(score, { y: -4, duration: 0.35, ease: "power2.out" }, 0);
    if (meta.length)
      tl.to(
        meta,
        { y: -2, stagger: 0.04, duration: 0.35, ease: "power2.out" },
        0,
      );

    const enter = () => tl.play();
    const leave = () => tl.reverse();

    card.addEventListener("pointerenter", enter);
    card.addEventListener("pointerleave", leave);

    cleanups.push(() => {
      card.removeEventListener("pointerenter", enter);
      card.removeEventListener("pointerleave", leave);
      tl.kill(); // libera memória da timeline
    });
  });

  return () => cleanups.forEach((fn) => fn());
}

/* =========================
   HERO MOUSE PARALLAX
   Camadas em profundidades distintas respondem ao cursor.
   gsap.quickTo() cria funções de animação contínua — mais
   performático que criar novas tweens a cada mousemove.

   Profundidade das camadas (por deslocamento):
   orbs (32px) > visual (18px) > panels (10px)
   Camada mais distante = maior deslocamento.
========================= */
function initHeroParallax(hero) {
  if (!hero || prefersReducedMotion || !canHover || !window.gsap)
    return () => {};

  const orbs = hero.querySelector(".hero-orbs");
  const visual = hero.querySelector(".hero-visual");

  if (!visual) return () => {};

  // quickTo cria uma função de animação contínua sem criar novas tweens a cada frame
  const orbsX = orbs
    ? gsap.quickTo(orbs, "x", { duration: 0.7, ease: "power2.out" })
    : null;
  const orbsY = orbs
    ? gsap.quickTo(orbs, "y", { duration: 0.7, ease: "power2.out" })
    : null;
  const visualX = visual
    ? gsap.quickTo(visual, "x", { duration: 0.9, ease: "power2.out" })
    : null;
  const visualY = visual
    ? gsap.quickTo(visual, "y", { duration: 0.9, ease: "power2.out" })
    : null;

  const onMove = (e) => {
    const rect = hero.getBoundingClientRect();
    // Normaliza o cursor para -0.5 → +0.5 relativo ao centro do hero
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    orbsX?.(x * 50); // Mais vida = maior amplitude no parallax
    orbsY?.(y * 30);

    visualX?.(x * 25);
    visualY?.(y * 15);
  };

  // Ao sair: todos voltam para a posição original (0, 0)
  const onLeave = () => {
    orbsX?.(0);
    orbsY?.(0);
    visualX?.(0);
    visualY?.(0);
  };

  hero.addEventListener("mousemove", onMove);
  hero.addEventListener("mouseleave", onLeave);

  return () => {
    hero.removeEventListener("mousemove", onMove);
    hero.removeEventListener("mouseleave", onLeave);
    gsap.set([orbs, visual].filter(Boolean), { x: 0, y: 0 });
  };
}

/* =========================
   SCROLL PARALLAX — Hero
   Camadas deslizam a velocidades distintas conforme o usuário rola.
   ScrollTrigger + scrub cria o efeito de "profundidade" no scroll.
========================= */
function initHeroScrollParallax(hero) {
  if (!hero || prefersReducedMotion || !window.gsap || !window.ScrollTrigger)
    return () => {};

  const visual = hero.querySelector(".hero-visual");
  const content = hero.querySelector(".hero-content");

  const tls = [];

  if (visual) {
    const tl = gsap.to(visual, {
      yPercent: 18, // move 18% da própria altura para cima ao scrollar
      ease: "none", // linear — o ScrollTrigger controla o timing via scrub
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: 0.8, // delay de 0.8s para suavizar (quanto maior, mais "borrachudo")
      },
    });
    tls.push(tl);
  }

  if (content) {
    const tl = gsap.to(content, {
      yPercent: 10,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: 0.5,
      },
    });
    tls.push(tl);
  }

  // scrollTrigger.kill() limpa observers e tweens do ScrollTrigger
  return () => tls.forEach((t) => t.scrollTrigger?.kill());
}

/* =========================
   HERO BUBBLES — bolhas ascendentes geradas dinamicamente
   Cria um <div class="hero-bubbles"> com 9 <span>s animados.
   Cada bolha tem: tamanho, posição horizontal, duração e
   fase (delay negativo) aleatórios — nunca dois iguais.
   aria-hidden="true": decorativo, invisível para leitores de tela.
========================= */
function initHeroBubbles(hero) {
  if (!hero || prefersReducedMotion) return () => {};

  const container = document.createElement("div");
  container.className = "hero-bubbles";
  container.setAttribute("aria-hidden", "true"); // decorativo, ignora leitores de tela
  hero.appendChild(container);

  // Um pouco mais de bolhas para trazer mais vida ao fundo
  const BUBBLE_COUNT = isMobile ? 8 : 18;

  for (let i = 0; i < BUBBLE_COUNT; i++) {
    const bubble = document.createElement("span");
    bubble.className = "hero-bubble";

    const size = 8 + Math.random() * 20; // diâmetro: 8–28px
    const left = 5 + Math.random() * 88; // posição X: 5–93% (evita bordas)
    const duration = 7 + Math.random() * 6; // tempo de subida: 7–13s
    const delay = Math.random() * duration; // fase aleatória → bolhas dessincronizadas

    // Trajetória em S: drift2 é o inverso proporcional de drift1
    const drift1 = (Math.random() < 0.5 ? 1 : -1) * (8 + Math.random() * 16);
    const drift2 = -drift1 * (0.5 + Math.random() * 0.6);

    bubble.style.width = size + "px";
    bubble.style.height = size + "px";
    bubble.style.left = left + "%";
    bubble.style.animationDuration = duration + "s";
    bubble.style.animationDelay = "-" + delay + "s";
    bubble.style.setProperty("--bubble-drift", drift1.toFixed(1) + "px");
    bubble.style.setProperty("--bubble-drift-2", drift2.toFixed(1) + "px");

    container.appendChild(bubble);
  }

  // Cleanup: remove o container do DOM
  return () => container.remove();
}

/* =========================
   MAIN ANIMATIONS — PONTO DE ENTRADA
   Exportado para main.js. Orquestra todos os efeitos acima.
========================= */
/**
 * Inicializa todas as animações do portfólio.
 *
 * @param {Object} options
 * @param {HTMLElement} options.heroContent     - Container .hero-content
 * @param {HTMLElement[]} options.textReveal    - Spans de .text-reveal
 * @param {HTMLElement} options.textMask        - Elemento .text-mask
 * @param {HTMLElement[]} options.serviceCards  - Cards de serviço/projetos
 * @param {HTMLElement[]} options.portfolioItems - Items do portfolio
 */
export function initAnimations({
  heroContent,
  textReveal = [],
  textMask,
  serviceCards = [],
  portfolioItems = [],
}) {
  const revealText = textReveal.filter(Boolean);
  const services = serviceCards.filter(Boolean);
  const portfolio = portfolioItems.filter(Boolean);

  const cleanups = [];

  /**
   * Fallback: exibe tudo de imediato sem animação.
   * Usado quando: reduceMotion ativo OU GSAP não disponível.
   */
  const showEverything = () => {
    heroContent?.classList.add("visible");
    revealText.forEach((el) => (el.style.transform = "translateY(0)"));
    services.forEach((el) => el.classList.add("visible"));
    portfolio.forEach((el) => el.classList.add("visible"));
    if (textMask) {
      textMask.style.clipPath = "polygon(0 0,100% 0,100% 100%,0 100%)";
    }
  };

  // Sem animação: mostra tudo e sai
  if (prefersReducedMotion || !window.gsap) {
    showEverything();
    return { destroy: () => {} };
  }

  if (window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  // ── HERO CONTENT ────────────────────────────────────────
  // O heroContent começa com opacity:0 e translateY(20px) no CSS.
  // Adicionar "visible" ativa a transição CSS declarada em hero.css.
  heroContent?.classList.add("visible");

  // ── TEXT REVEAL + MASK ──────────────────────────────────
  // Os spans de .text-reveal começam em translateY(100%) — escondidos.
  // A timeline sobe cada span com stagger para a posição original (y:0).
  // textMask usa clip-path: polygon de 0 largura até cobrir o texto.
  const introTimeline = gsap.timeline({
    defaults: { overwrite: "auto", force3D: true }, // force3D: composição GPU
  });

  if (revealText.length) {
    introTimeline.to(
      revealText,
      {
        y: 0,
        stagger: 0.09, // cada span começa 90ms após o anterior
        duration: 1.0,
        ease: "power4.out", // desaceleração forte = sensação de peso
      },
      0.15, // começa 150ms após o início da timeline
    );
  }

  if (textMask) {
    introTimeline.to(
      textMask,
      {
        clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)", // abre da esquerda para a direita
        duration: 1.2,
        ease: "power3.inOut",
      },
      0.35, // começa depois do texto começar a revelar
    );
  }

  cleanups.push(() => introTimeline.kill());

  // ── SCROLL REVEAL — DEPTH (surfacing from below) ────────
  // Cards começam "submersos": turvo (blur), comprimido (scale 0.97), invisível.
  // Ao entrar em view, "surfaceiam" para o estado normal com stagger.
  if (window.ScrollTrigger) {
    const items = [...services, ...portfolio];

    // Estado inicial: objetos submersos
    gsap.set(items, {
      opacity: 0,
      y: 55,
      scale: 0.97,
      filter: "blur(4px)",
      force3D: true,
      willChange: "transform, opacity, filter",
    });

    ScrollTrigger.batch(items, {
      start: "top 84%", // dispara quando o card está 84% descido na viewport
      once: true, // só anima uma vez por elemento
      onEnter: (batch) => {
        batch.forEach((el) => el.classList.add("visible"));
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          stagger: 0.1, // 100ms entre cada card
          duration: 0.9,
          ease: "power3.out",
          overwrite: "auto",
          // Remove willChange após a animação: libera memória de composição GPU
          onComplete: () =>
            gsap.set(batch, { clearProps: "willChange,filter" }),
        });
      },
    });

    try {
      ScrollTrigger.refresh(); // recalcula posições após layout completo
    } catch {}
  } else {
    showEverything(); // GSAP disponível mas sem ScrollTrigger: mostra tudo
  }

  // ── EFEITOS DO HERO ─────────────────────────────────────

  const hero = document.querySelector(".hero");

  const destroyParallax = initHeroParallax(hero); // mouse parallax
  cleanups.push(destroyParallax);

  const destroyScrollParallax = initHeroScrollParallax(hero); // scroll parallax
  cleanups.push(destroyScrollParallax);

  const destroyBubbles = initHeroBubbles(hero); // bolhas ascendentes
  cleanups.push(destroyBubbles);

  const destroyTilt = initLazyTilt(services); // tilt 3D nos cards
  cleanups.push(destroyTilt);

  const destroyHover = initPortfolioHover(portfolio); // hover nos cards
  cleanups.push(destroyHover);

  return {
    destroy: () => cleanups.forEach((fn) => fn()),
  };
}
