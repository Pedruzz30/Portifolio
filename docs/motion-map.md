# Motion Map

Inventario da refatoracao da arquitetura de animacoes CSS/JS.

## Estrutura final

- `css/base/motion-tokens.css`: tokens de movimento (`--ease-out`, `--transition-base`, `--wave-slow`, `--wave-medium`, `--float-distance`).
- `css/shared/shared-motion.css`: keyframes usados por mais de uma area.
- `css/layout/ocean-background.css`: camadas globais animadas do `body` e palco compartilhado About -> Roadmap.
- `css/base/reduced-motion.css`: fallback central para `prefers-reduced-motion: reduce`.
- Keyframes exclusivos ficam proximos do dono: `hero.css`, `about.css`, `roadmap.css`, `contact.css`, `footer.css`, `ui.css`, `premium-cards.css`.
- `css/dev/motion-debug.css`: utilitario opcional, nao importado em producao.

## Zonas oceanicas

`index.html` declara `data-ocean-zone` como contrato semantico de profundidade:

- `surface`: header.
- `mesopelagic`: hero.
- `transition`: about.
- `twilight`: roadmap.
- `transition-twilight`: wrapper fisico compartilhado entre about e roadmap.
- `bathypelagic`: portfolio.
- `abyssal`: contact.
- `floor`: footer.

## Mapa original e destino

| Original | Consumidores antes | Relacao HTML/JS | Diagnostico | Destino final |
|---|---|---|---|---|
| `loading` | declarado em `ui.css`, sem uso real | `.loader-ring` usava `spin` | inconsistencia local | `loader-ring-spin` em `css/components/ui.css` |
| `spin` | `ui.css`, `contact.css` | loader e submit loading | referencia quebrada, sem `@keyframes` | substituido por `loader-ring-spin` e `contact-submit-spin` |
| `headerCausticFloat` | `.header::before` | header | componente | `header-caustic-float` em `ui.css` |
| `biolumDot` | `.nav__link[aria-current]::before` | nav ativa | componente | `nav-biolum-dot-pulse` em `ui.css` |
| `pillDotBiolum` | `.pill-dot`, `.footer-depth-dot` | header/footer | compartilhada | `status-biolum-dot-pulse` em `shared-motion.css` |
| `btnCaustic` | `.btn:hover::before` | botoes | componente | `button-caustic-sweep` em `ui.css` |
| `bioBreath` | `.btn--bio::after` | botoes | componente | `button-biolum-breath` em `ui.css` |
| `scrollShimmer` | `.scroll-progress__bar::after` | scroll UI | componente | `scroll-progress-shimmer` em `ui.css` |
| `shimmerDrift` | `.service-card::after` | sem HTML atual | legado CSS | `card-shimmer-drift` em `ui.css` |
| `glideWave` | `.portfolio-item::before` | sem HTML atual | legado CSS | `portfolio-card-glide-wave` em `ui.css` |
| `raysShift` | `.hero::before` | hero | secao | `hero-rays-shift` em `hero.css` |
| `causticsFloat` | `.hero::after`, `.stack-roadmap::before` | hero/roadmap | compartilhada | `section-caustics-float` em `shared-motion.css` |
| `heroBubbleRise` | `.hero-bubble`; duplicado em `animations.css` | `hero-bubbles.js` cria spans e CSS vars | duplicada | `hero-bubble-rise` em `hero.css` |
| `badgePulse` | `.hero-badge__dot` | hero | secao | `hero-badge-pulse` em `hero.css` |
| `scrollIndicatorBounce` | `.scroll-indicator` | anchor do hero | secao | `hero-scroll-indicator-bounce` em `hero.css` |
| `floatPulse` | `.hero-content__inner`, bloco legado em `shared.css` | hero | secao/legado | `hero-content-float` em `hero.css` |
| `blob` | `.hero-image-wrap`, bloco legado `.hero-image` | imagem do hero | secao | `hero-image-blob` em `hero.css` |
| `seaGlow` | bloco legado `.hero-image::before` | sem HTML atual direto | legado hero | `hero-image-sea-glow` em `hero.css` |
| `waterShimmer` | bloco legado `.hero-image::after` | sem HTML atual direto | legado hero | `hero-water-shimmer` em `hero.css` |
| `tideFlow` | bloco legado `.hero::before` em `shared.css` | sem markup separado atual | legado hero | `hero-tide-flow` em `hero.css` |
| `wavePendulum` | bloco legado `.hero::after` em `shared.css` | sem markup separado atual | legado hero | `hero-wave-pendulum` em `hero.css` |
| `microDrift` | `.hero .hero-current`, `[data-current]` | sem HTML atual | legado hero | `hero-micro-drift` em `hero.css` |
| `panelDrift1`, `panelDrift2` | `.hero-panel:nth-child(...)` | sem HTML atual | legado hero | `hero-panel-drift-primary/secondary` em `hero.css` |
| `oceanGlow` | `body::before`, legado `.skills2-card::after` | body global | global/legado | `ocean-background-glow` em `layout/ocean-background.css` |
| `oceanFlow` | `body::after` | body global | global | `ocean-background-flow` em `layout/ocean-background.css` |
| `deepWaterDrift` | `.stack-roadmap::after`, `.site-footer::after` | roadmap/footer | compartilhada | `section-deep-water-drift` em `shared-motion.css` |
| `footerCaustics` | `.site-footer::before` | footer | layout | `footer-caustics-drift` em `footer.css` |
| `pulseGlow` | roadmap now node, `.skills2-dot` | roadmap/legado skills | compartilhada | `status-pulse-glow` em `shared-motion.css` |
| `cardPulse` | `.stack-roadmap__card` now | roadmap | secao | `roadmap-card-pulse` em `roadmap.css` |
| `currentDrift1`, `currentDrift2` | `.about::before`, `.about-shell::before` | about -> roadmap | correntes locais eram cortadas pelo limite da About | `about-current-drift-primary/secondary` preservados em `layout/ocean-background.css`, aplicados em `.ocean-depth-light::before/::after` |
| `currentTurbulence` | `.about-turbulence` | about | nova camada HTML decorativa | `about-current-turbulence` em `about.css` |
| `currentBreathe` | composto nos keyframes das correntes | about -> roadmap | nao precisava virar outra animacao | preservado como opacidade interna de `about-current-drift-primary/secondary` |
| `feedbackSlideIn` | `.contact-form__feedback` | formulario alterna classes | secao | `contact-feedback-slide-in` em `contact.css` |
| `statusBreathe` | `.project-card--premium[data-status="progress"] .status-dot` | cards do portfolio | componente | `project-status-breathe` em `premium-cards.css` |
| `biolumBreath` | nenhum consumidor | tema escuro | morto | removido |
| `oceanNodePulse`, `railParticleTravel`, `oceanNodeWave` | injetados por JS | `ocean-life.js` | JS-owned | `roadmap-node-pulse`, `roadmap-rail-particle-travel`, `roadmap-node-wave` no mesmo modulo |

## Removidos sem migracao

Confirmados sem consumidor CSS/JS/HTML antes da remocao de `css/utilities/animations.css`:

`btnPulse`, `haloPulse`, `blobClip`, `wrapGlowPulse`, `wrapGlow`, `seaGlowBtn`, `seaWave`, `oceanPendulum`, `ripplePulse`, `bubbleRise`, `oceanSheen`, `footerSurfaceGlow`, `footerDeepSweep`, `footerPlankton`, `oceanSurface`, `causticsDrift`, `waveFlow`, `floatDrift`, `portfolioCaustic`, `surfaceEntry`.

## Relacoes JS

- `js/effects/hero-bubbles.js` cria `.hero-bubbles > .hero-bubble`, define `--bubble-drift`, `--bubble-drift-2`, `animationDuration` e `animationDelay`. O movimento visual fica em `@keyframes hero-bubble-rise` no `hero.css`.
- `js/effects/ocean-life.js` injeta keyframes do roadmap dinamico no runtime: `roadmap-node-pulse`, `roadmap-rail-particle-travel`, `roadmap-node-wave`.
- `js/effects/gsapEffects.js` continua como orquestrador GSAP; a geracao de bolhas saiu para modulo focado.
- `js/main.js` aplica `.is-in-view` no footer via `IntersectionObserver`, destravando `animation-play-state` de `.site-footer::before/::after` somente quando a secao entra na viewport.
- `js/effects/footerParticles.js` e responsavel pelo canvas `#footerParticleCanvas`; `ocean-life.js` nao concentra efeitos do footer.
- `js/effects/animations.js` era legado sem importacao atual e foi removido.

## Transicao About -> Roadmap

- `index.html` envolve `.about` e `.stack-roadmap` em `.ocean-depth-stage--about-roadmap`.
- `.ocean-depth-light` e o unico palco fisico da transicao; ele e irmao das secoes, nao pseudo-elemento interno da About.
- A assinatura visual original foi preservada: `108deg` em `.ocean-depth-light::before` e `95deg` em `.ocean-depth-light::after`, com os mesmos tempos de `14s` e `19s`.
- A fase nao reinicia porque as duas correntes originais rodam em pseudo-elementos do mesmo palco compartilhado.
- O background base da transicao vive no palco compartilhado; `.about` e `.stack-roadmap` ficam transparentes para nao cobrir a luz.
- Stacking final: palco/background -> `.ocean-depth-light` (`z-index: 1`) -> secoes/overlays locais (`z-index: 2`) -> conteudo interno.
- A profundidade e simulada por `mask-image` vertical: entrada suave na About, presenca no limite e difusao progressiva dentro do Roadmap.
- Dark mode ajusta apenas variaveis de opacidade/blur no wrapper.
- Reduced motion e lite mode pausam a animacao e preservam a camada estatica com fade.

## Problemas encontrados

- `spin` era usado por loader e submit sem existir.
- `heroBubbleRise` estava duplicado em `hero.css` e `utilities/animations.css`.
- `css/utilities/animations.css` misturava keyframes vivos, aliases, duplicatas e mortos.
- `prefers-reduced-motion` estava espalhado por varios arquivos.
- Comentarios ainda apontavam para `animations.css` ou nomes antigos.
- `sections/shared.css` continha regras completas de Hero; esse vazamento foi removido e os estilos ativos de badge/chip ficaram em `hero.css`.
- A luz oceânica About -> Roadmap deixou de ser local da About e passou para `.ocean-depth-light`; `.about-turbulence` continua local e e considerada em `reduced-motion.css` e `lite-mode.css`.

## Validacao esperada

- `rg` nao deve encontrar `css/utilities/animations.css` importado.
- `rg` nao deve encontrar `spin` como animation name.
- `rg "@keyframes"` deve mostrar keyframes em arquivos donos ou compartilhados.
- `rg "is-in-view"` deve mostrar o contrato do footer em CSS e JS.
- `node --check` deve passar para os modulos JS.
- Navegacao visual deve manter hero, roadmap, portfolio, contact e footer sem mudanca intencional de timing/easing.
