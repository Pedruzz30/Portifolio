/*
 * ═══════════════════════════════════════════════════════════
 *  effects/gsapEffects.js — Animações GSAP
 *
 *  Sete efeitos orquestrados com GSAP + ScrollTrigger:
 *
 *  1. loaderMerge      — água sobe e "engole" o loader
 *  2. heroTextReveal   — palavras do h1 emergem uma a uma
 *  3. heroParallax     — camadas do hero em velocidades diferentes
 *  4. statsCounter     — números contam do zero ao entrar no viewport
 *  5. magneticButtons  — botões se inclinam na direção do cursor
 *  6. staggerCards     — cards entram em sequência com spring
 *  7. scrollReveal     — seções emergem no scroll via ScrollTrigger
 *
 *  Dependências (já carregadas no HTML):
 *  - gsap.min.js        (window.gsap)
 *  - ScrollTrigger.min.js (window.ScrollTrigger)
 *
 *  API:
 *    initGsapEffects({ reduceMotion })
 *    → { destroy }
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Inicializa todos os efeitos GSAP do site.
 *
 * @param {Object}  options
 * @param {boolean} [options.reduceMotion=false]
 * @returns {{ destroy: () => void }}
 */
export function initGsapEffects({ reduceMotion = false, isMobile = false } = {}) {
  const gsap          = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  if (!gsap) {
    console.warn('[gsapEffects] GSAP não encontrado. Verifique se gsap.min.js está carregado.');
    return { destroy: () => {} };
  }

  // ScrollTrigger já é registrado em animations.js — não duplicar aqui.


  // Respeita preferência do usuário por movimento reduzido
  if (reduceMotion) {
    // Garante que todos os elementos estejam visíveis mesmo sem animação
    document.querySelectorAll('.js-reveal, .text-reveal span, .stat__value').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return { destroy: () => {} };
  }

  const cleanups = [];

  // ── Registra cada efeito ──────────────────────────────
  // Loader — roda em todos (mobile também precisa do loader sumindo)
  cleanups.push(initLoaderMerge(gsap));
  // Text reveal — roda em todos (leve, só CSS transform)
  cleanups.push(initHeroTextReveal(gsap));
  // Stats counter — roda em todos (leve, só número)
  cleanups.push(initStatsCounter(gsap, ScrollTrigger));
  // Scroll reveal — roda em todos (essencial para UX)
  cleanups.push(initScrollReveal(gsap, ScrollTrigger));
  // Stagger cards — roda em todos (essencial para UX)
  cleanups.push(initStaggerCards(gsap, ScrollTrigger));
  // Parallax — APENAS desktop (causa layout shift no mobile)
  if (!isMobile) {
    cleanups.push(initHeroParallax(gsap, ScrollTrigger));
  }
  // Magnetic buttons — APENAS desktop (não tem hover no mobile)
  if (!isMobile) {
    cleanups.push(initMagneticButtons(gsap));
  }

  return {
    destroy: () => {
      cleanups.forEach(fn => fn && fn());
      ScrollTrigger?.getAll().forEach(st => st.kill());
    },
  };
}

/* ═══════════════════════════════════════════════════════════
   1. LOADER — MERGULHO NA SUPERFÍCIE
   A água sobe do rodapé do loader, engolindo o PH.
   A tela então "mergulha" — o loader desce enquanto o
   hero sobe, como a câmera atravessando a superfície.
   ═══════════════════════════════════════════════════════════ */
function initLoaderMerge(gsap) {
  const loader = document.querySelector('.loader');
  const brand  = document.querySelector('.loader-brand');
  const ring   = document.querySelector('.loader-ring');
  if (!loader) return () => {};

  // Sinaliza que o GSAP assumiu o controle do loader,
  // impedindo que finalizeLoader (dom.js) interfira na animação.
  loader.dataset.state = "gsap";

  // Injeta a camada de água
  const water = document.createElement('div');
  water.setAttribute('aria-hidden', 'true');
  water.style.cssText = `
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 0%;
    background: linear-gradient(180deg,
      rgba(80,190,255,0.12),
      rgba(30,100,200,0.40)
    );
    border-top: 1px solid rgba(80,190,255,0.45);
    pointer-events: none;
    z-index: 1;
  `;
  loader.appendChild(water);

  // Garante que o brand e ring ficam acima da água
  if (brand) brand.style.position = 'relative';
  if (brand) brand.style.zIndex   = '2';
  if (ring)  ring.style.zIndex    = '2';

  // Timeline: espera 800ms → água sobe → PH afunda → loader sai
  const tl = gsap.timeline({ delay: 0.8 });

  // Água subindo — tensão superficial chegando
  tl.to(water, {
    height: '100%',
    duration: 0.85,
    ease: 'power2.inOut',
  });

  // PH afunda junto com a maré
  if (brand) {
    tl.to(brand, {
      y: 12,
      opacity: 0,
      duration: 0.45,
      ease: 'power2.in',
    }, '-=0.55');
  }

  // Anel some
  if (ring) {
    tl.to(ring, {
      scale: 0,
      opacity: 0,
      duration: 0.30,
      ease: 'back.in(2)',
    }, '<');
  }

  // Loader desce — câmera mergulhando
  tl.to(loader, {
    yPercent: 8,
    opacity: 0,
    duration: 0.55,
    ease: 'power3.in',
    onComplete: () => {
      loader.style.display = 'none';
      loader.style.pointerEvents = 'none';
      loader.dataset.state = 'done';
    },
  }, '-=0.10');

  return () => {
    tl.kill();
    water.remove();
  };
}

/* ═══════════════════════════════════════════════════════════
   2. HERO TEXT REVEAL — PALAVRAS EMERGINDO
   Cada <span> dentro do h1.text-reveal emerge de baixo
   para cima, como palavras subindo à superfície da água.
   Usa clipPath via overflow:hidden no wrapper para o
   efeito de "revelar sem aparecer de repente".
   ═══════════════════════════════════════════════════════════ */
function initHeroTextReveal(gsap) {
  const h1 = document.querySelector('#hero-title');
  if (!h1) return () => {};

  // Aguarda o loader terminar (~1.8s) para começar
  const spans = h1.querySelectorAll('span');
  if (!spans.length) return () => {};

  // Wrap cada span em um container overflow:hidden
  spans.forEach(span => {
    const wrapper = document.createElement('span');
    wrapper.style.cssText = 'display: inline-block; overflow: hidden; vertical-align: bottom;';
    span.parentNode.insertBefore(wrapper, span);
    wrapper.appendChild(span);
    gsap.set(span, { y: '105%', opacity: 0 });
  });

  const tl = gsap.timeline({ delay: 1.65 });

  tl.to(spans, {
    y: '0%',
    opacity: 1,
    duration: 0.75,
    ease: 'power3.out',
    stagger: 0.09,
  });

  // Subtítulo e badges entram depois
  const subtitle = document.querySelector('.text-mask');
  const badges   = document.querySelector('.hero-badges');
  const actions  = document.querySelector('.hero-actions');
  const stats    = document.querySelector('.hero-stats');

  if (subtitle) gsap.set(subtitle, { opacity: 0, y: 18 });
  if (badges)   gsap.set(badges,   { opacity: 0, y: 14 });
  if (actions)  gsap.set(actions,  { opacity: 0, y: 14 });
  if (stats)    gsap.set(stats,    { opacity: 0, y: 14 });

  tl.to([subtitle, badges, actions, stats].filter(Boolean), {
    opacity: 1,
    y: 0,
    duration: 0.60,
    ease: 'power2.out',
    stagger: 0.10,
  }, '-=0.30');

  // Imagem do hero entra com scale
  const heroVisual = document.querySelector('.hero-visual');
  if (heroVisual) {
    gsap.set(heroVisual, { opacity: 0, scale: 0.96, x: 18 });
    tl.to(heroVisual, {
      opacity: 1,
      scale: 1,
      x: 0,
      duration: 0.85,
      ease: 'power2.out',
    }, '-=0.70');
  }

  // Painéis flutuantes em stagger
  const panels = document.querySelectorAll('.hero-panel');
  if (panels.length) {
    gsap.set(panels, { opacity: 0, y: 22, x: 10 });
    tl.to(panels, {
      opacity: 1, y: 0, x: 0,
      duration: 0.60,
      ease: 'power2.out',
      stagger: 0.14,
    }, '-=0.55');
  }

  return () => tl.kill();
}

/* ═══════════════════════════════════════════════════════════
   3. HERO PARALLAX — CAMADAS EM PROFUNDIDADES DIFERENTES
   Elementos do hero se movem em velocidades diferentes
   durante o scroll, criando ilusão de profundidade real.
   Quanto maior o yPercent, mais "próximo" da câmera.
   ═══════════════════════════════════════════════════════════ */
function initHeroParallax(gsap, ScrollTrigger) {
  if (!ScrollTrigger) return () => {};

  const hero = document.querySelector('.hero');
  if (!hero) return () => {};

  const triggers = [];

  // Imagem — camada mais próxima, move mais rápido
  const heroImage = document.querySelector('.hero-image-wrap');
  if (heroImage) {
    triggers.push(ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: 1.2,
      onUpdate: self => {
        gsap.set(heroImage, { y: self.progress * 90 });
      },
    }));
  }

  // Conteúdo de texto — camada intermediária
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    triggers.push(ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: 1.5,
      onUpdate: self => {
        gsap.set(heroContent, { y: self.progress * 55 });
      },
    }));
  }

  // Painéis flutuantes — camada do meio
  const panels = document.querySelector('.floating-panels');
  if (panels) {
    triggers.push(ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: 1.8,
      onUpdate: self => {
        gsap.set(panels, { y: self.progress * 35 });
      },
    }));
  }

  // Scroll indicator some ao rolar
  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (scrollIndicator) {
    triggers.push(ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: '20% top',
      scrub: true,
      onUpdate: self => {
        gsap.set(scrollIndicator, { opacity: 1 - self.progress * 2 });
      },
    }));
  }

  return () => triggers.forEach(t => t.kill());
}

/* ═══════════════════════════════════════════════════════════
   4. STATS COUNTER — NÚMEROS CONTANDO AO ENTRAR NO VIEWPORT
   Quando as stats entram na tela, os valores numéricos
   contam do zero até o valor alvo. "Java" e textos não
   numéricos aparecem com fade simples.
   ═══════════════════════════════════════════════════════════ */
function initStatsCounter(gsap, ScrollTrigger) {
  const statsContainer = document.querySelector('.hero-stats');
  if (!statsContainer || !ScrollTrigger) return () => {};

  const stats = statsContainer.querySelectorAll('.stat');
  const triggers = [];

  stats.forEach(stat => {
    const valueEl = stat.querySelector('.stat__value');
    if (!valueEl) return;

    const raw     = valueEl.textContent.trim();
    const numeric = parseFloat(raw.replace(/[^0-9.]/g, ''));
    const suffix  = raw.replace(/[0-9.]/g, '').trim(); // ex: "+" em "4+"
    const isYear  = numeric >= 2000 && numeric <= 2100;

    if (!isNaN(numeric)) {
      gsap.set(valueEl, { opacity: 0 });

      triggers.push(ScrollTrigger.create({
        trigger: stat,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          const obj = { val: isYear ? numeric - 4 : 0 };
          gsap.set(valueEl, { opacity: 1 });
          gsap.to(obj, {
            val: numeric,
            duration: isYear ? 1.6 : 1.2,
            ease: 'power2.out',
            onUpdate() {
              valueEl.textContent = Math.round(obj.val) + suffix;
            },
          });
        },
      }));
    } else {
      // Texto não numérico — fade in
      gsap.set(valueEl, { opacity: 0, y: 8 });
      triggers.push(ScrollTrigger.create({
        trigger: stat,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          gsap.to(valueEl, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
        },
      }));
    }
  });

  return () => triggers.forEach(t => t.kill());
}

/* ═══════════════════════════════════════════════════════════
   5. MAGNETIC BUTTONS — INCLINAM NA DIREÇÃO DO CURSOR
   Botões com as classes .btn--depth, .btn--surface e
   .btn--bio se movem levemente na direção do cursor
   quando ele está perto. Voltam com spring elastic.
   ═══════════════════════════════════════════════════════════ */
function initMagneticButtons(gsap) {
  const hasHover = window.matchMedia('(hover: hover)').matches;
  if (!hasHover) return () => {};

  const buttons = document.querySelectorAll('.btn--depth, .btn--surface, .btn--bio, .btn--ghost');
  const handlers = [];

  buttons.forEach(btn => {
    const onMove = e => {
      const r  = btn.getBoundingClientRect();
      const cx = r.left + r.width  / 2;
      const cy = r.top  + r.height / 2;
      const dx = (e.clientX - cx) * 0.28;
      const dy = (e.clientY - cy) * 0.28;

      gsap.to(btn, {
        x: dx, y: dy,
        duration: 0.35,
        ease: 'power2.out',
      });
    };

    const onLeave = () => {
      gsap.to(btn, {
        x: 0, y: 0,
        duration: 0.65,
        ease: 'elastic.out(1, 0.45)',
      });
    };

    // Ripple no click
    const onClick = e => {
      const r      = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.setAttribute('aria-hidden', 'true');
      ripple.style.cssText = `
        position: absolute;
        left: ${e.clientX - r.left}px;
        top:  ${e.clientY - r.top}px;
        width: 0; height: 0;
        border-radius: 50%;
        background: rgba(255,255,255,0.14);
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 1;
      `;
      btn.appendChild(ripple);
      gsap.to(ripple, {
        width: Math.max(r.width, r.height) * 2.5,
        height: Math.max(r.width, r.height) * 2.5,
        opacity: 0,
        duration: 0.65,
        ease: 'power2.out',
        onComplete: () => ripple.remove(),
      });
    };

    btn.addEventListener('mousemove',  onMove);
    btn.addEventListener('mouseleave', onLeave);
    btn.addEventListener('click',      onClick);

    handlers.push({ btn, onMove, onLeave, onClick });
  });

  return () => {
    handlers.forEach(({ btn, onMove, onLeave, onClick }) => {
      btn.removeEventListener('mousemove',  onMove);
      btn.removeEventListener('mouseleave', onLeave);
      btn.removeEventListener('click',      onClick);
      gsap.set(btn, { x: 0, y: 0 });
    });
  };
}

/* ═══════════════════════════════════════════════════════════
   6. STAGGER CARDS — PORTFÓLIO E ROADMAP
   Cards entram em sequência com spring ao entrar no
   viewport. Portfólio: vertical (emergindo do fundo).
   Roadmap: lateral alternado (corrente lateral).
   ═══════════════════════════════════════════════════════════ */
function initStaggerCards(gsap, ScrollTrigger) {
  if (!ScrollTrigger) return () => {};

  const triggers = [];

  // ── Cards do portfólio ────────────────────────────────
  const portfolioGrid = document.querySelector('.portfolio-grid');
  if (portfolioGrid) {
    const cards = portfolioGrid.querySelectorAll('.project-card');
    gsap.set(cards, { opacity: 0, y: 40, scale: 0.97 });

    triggers.push(ScrollTrigger.create({
      trigger: portfolioGrid,
      start: 'top 82%',
      once: true,
      onEnter: () => {
        gsap.to(cards, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.65,
          ease: 'power3.out',
          stagger: {
            each: 0.12,
            from: 'start',
          },
        });
      },
    }));
  }

  // ── Steps do roadmap ─────────────────────────────────
  const roadmapTimeline = document.querySelector('.stack-roadmap__timeline');
  if (roadmapTimeline) {
    const steps = roadmapTimeline.querySelectorAll('.stack-roadmap__step');

    steps.forEach((step, i) => {
      // Alterna: par entra da esquerda, ímpar da direita
      const fromX = i % 2 === 0 ? -28 : 28;
      gsap.set(step, { opacity: 0, x: fromX, y: 16 });

      triggers.push(ScrollTrigger.create({
        trigger: step,
        start: 'top 86%',
        once: true,
        onEnter: () => {
          gsap.to(step, {
            opacity: 1, x: 0, y: 0,
            duration: 0.60,
            ease: 'power2.out',
          });
        },
      }));
    });
  }

  // ── Tech items do about ───────────────────────────────
  const techGrid = document.querySelector('.tech-grid');
  if (techGrid) {
    const items = techGrid.querySelectorAll('.tech-item');
    gsap.set(items, { opacity: 0, scale: 0.88, y: 14 });

    triggers.push(ScrollTrigger.create({
      trigger: techGrid,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(items, {
          opacity: 1, scale: 1, y: 0,
          duration: 0.45,
          ease: 'back.out(1.4)',
          stagger: {
            each: 0.055,
            from: 'start',
          },
        });
      },
    }));
  }

  return () => triggers.forEach(t => t.kill());
}

/* ═══════════════════════════════════════════════════════════
   7. SCROLL REVEAL — SEÇÕES EMERGINDO NO SCROLL
   Cada seção tem uma "assinatura" de entrada diferente,
   coerente com a profundidade oceânica:
   - About:    sobe (corrente ascendente)
   - Roadmap:  fade + scale (emergindo da escuridão)
   - Portfolio: sobe + slight rotate (objetos flutuando)
   - Contact:  fade (abissal — aparece lentamente)
   Headings e parágrafos têm stagger próprio.
   ═══════════════════════════════════════════════════════════ */
function initScrollReveal(gsap, ScrollTrigger) {
  if (!ScrollTrigger) return () => {};

  const triggers = [];

  // ── Helper: revela header de seção ───────────────────
  const revealSectionHeader = (header, config = {}) => {
    if (!header) return;
    const eyebrow = header.querySelector('.section-eyebrow, .stack-roadmap__eyebrow, .contact-eyebrow, .portfolio-header .section-eyebrow');
    const heading = header.querySelector('h2');
    const sub     = header.querySelector('p:not(.section-eyebrow)');

    if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: 12 });
    if (heading) gsap.set(heading, { opacity: 0, y: 20 });
    if (sub)     gsap.set(sub,     { opacity: 0, y: 16 });

    triggers.push(ScrollTrigger.create({
      trigger: header,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        const tl = gsap.timeline();
        if (eyebrow) tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.50, ease: 'power2.out' });
        if (heading) tl.to(heading, { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' }, '-=0.25');
        if (sub)     tl.to(sub,     { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, '-=0.35');
      },
    }));
  };

  // ── ABOUT ─────────────────────────────────────────────
  const about = document.querySelector('.about');
  if (about) {
    revealSectionHeader(about.querySelector('.about-header'));

    // Texto e side entram em paralelo
    const aboutText = about.querySelector('.about-text');
    const aboutSide = about.querySelector('.about-skills-side');

    if (aboutText) {
      gsap.set(aboutText, { opacity: 0, y: 32 });
      triggers.push(ScrollTrigger.create({
        trigger: aboutText,
        start: 'top 84%',
        once: true,
        onEnter: () => gsap.to(aboutText, { opacity: 1, y: 0, duration: 0.70, ease: 'power2.out' }),
      }));
    }

    if (aboutSide) {
      gsap.set(aboutSide, { opacity: 0, y: 32 });
      triggers.push(ScrollTrigger.create({
        trigger: aboutSide,
        start: 'top 84%',
        once: true,
        onEnter: () => gsap.to(aboutSide, { opacity: 1, y: 0, duration: 0.70, ease: 'power2.out', delay: 0.10 }),
      }));
    }

    // Value items com stagger
    const valueItems = about.querySelectorAll('.about-value-item');
    if (valueItems.length) {
      gsap.set(valueItems, { opacity: 0, x: -16 });
      triggers.push(ScrollTrigger.create({
        trigger: valueItems[0],
        start: 'top 88%',
        once: true,
        onEnter: () => gsap.to(valueItems, {
          opacity: 1, x: 0, duration: 0.45, ease: 'power2.out', stagger: 0.08,
        }),
      }));
    }
  }

  // ── ROADMAP ───────────────────────────────────────────
  const roadmap = document.querySelector('.stack-roadmap');
  if (roadmap) {
    revealSectionHeader(roadmap.querySelector('.stack-roadmap__heading'));

    // Progress bar anima ao entrar
    const progressFill = roadmap.querySelector('.stack-roadmap__progress-fill');
    if (progressFill) {
      const targetWidth = progressFill.style.width || progressFill.getAttribute('style')?.match(/width:\s*([^;]+)/)?.[1] || '0%';
      gsap.set(progressFill, { scaleX: 0, transformOrigin: 'left' });
      triggers.push(ScrollTrigger.create({
        trigger: progressFill,
        start: 'top 88%',
        once: true,
        onEnter: () => gsap.to(progressFill, {
          scaleX: 1, duration: 1.2, ease: 'power2.out', delay: 0.3,
        }),
      }));
    }

    // Highlights
    const highlights = roadmap.querySelectorAll('.stack-roadmap__highlight');
    if (highlights.length) {
      gsap.set(highlights, { opacity: 0, y: 20 });
      triggers.push(ScrollTrigger.create({
        trigger: highlights[0],
        start: 'top 86%',
        once: true,
        onEnter: () => gsap.to(highlights, {
          opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', stagger: 0.10,
        }),
      }));
    }
  }

  // ── PORTFOLIO ─────────────────────────────────────────
  const portfolio = document.querySelector('.portfolio');
  if (portfolio) {
    revealSectionHeader(portfolio.querySelector('.portfolio-header'));
  }

  // ── CONTACT ───────────────────────────────────────────
  const contact = document.querySelector('.contact');
  if (contact) {
    revealSectionHeader(contact.querySelector('.contact-header'));

    // Formulário
    const form = contact.querySelector('.contact-form');
    if (form) {
      gsap.set(form, { opacity: 0, y: 28 });
      triggers.push(ScrollTrigger.create({
        trigger: form,
        start: 'top 86%',
        once: true,
        onEnter: () => gsap.to(form, { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out' }),
      }));
    }

    // Chips de contato em stagger
    const chips = contact.querySelectorAll('.contact-chip');
    if (chips.length) {
      gsap.set(chips, { opacity: 0, x: -18 });
      triggers.push(ScrollTrigger.create({
        trigger: chips[0],
        start: 'top 88%',
        once: true,
        onEnter: () => gsap.to(chips, {
          opacity: 1, x: 0, duration: 0.50, ease: 'power2.out', stagger: 0.09,
        }),
      }));
    }
  }

  // ── Elementos genéricos com .js-reveal ───────────────
  // Para qualquer elemento que queira revelar via scroll
  // sem configuração específica — basta adicionar .js-reveal no HTML
  const revealEls = document.querySelectorAll('.js-reveal');
  revealEls.forEach(el => {
    gsap.set(el, { opacity: 0, y: 22 });
    triggers.push(ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.60, ease: 'power2.out' }),
    }));
  });

  return () => triggers.forEach(t => t.kill());
}
