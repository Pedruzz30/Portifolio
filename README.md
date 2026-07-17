# Pedro Henrique | Portfolio

Portfolio pessoal de Pedro Henrique, estudante de Engenharia de Software com foco em back-end Java. O projeto e uma pagina estatica sem etapa de build, organizada para manter HTML, CSS, JavaScript e assets em responsabilidades separadas.

## Estrutura

```text
.
├── index.html
├── assets/
│   ├── images/
│   │   └── minhaFoto.jpeg
│   └── icons/
│       ├── social/
│       └── technologies/
├── css/
│   ├── main.css
│   ├── base/
│   ├── layout/
│   ├── components/
│   ├── sections/
│   ├── themes/
│   ├── utilities/
│   └── compat/
└── js/
    ├── main.js
    ├── compat/
    ├── components/
    ├── effects/
    ├── modules/
    └── utils/
```

## Responsabilidades

- `index.html`: estrutura semantica, metadados, textos, links e imports.
- `assets/images`: imagens de conteudo.
- `assets/icons/social`: icones de canais sociais.
- `assets/icons/technologies`: icones de tecnologias.
- `css/main.css`: orquestra os imports CSS na ordem correta.
- `css/base`: variaveis e base global.
- `css/layout`: containers e estruturas compartilhadas.
- `css/components`: componentes reutilizaveis.
- `css/sections`: estilos de secoes como hero, about, roadmap, portfolio e contact.
- `css/themes`: tema escuro.
- `css/utilities`: helpers, keyframes e responsividade.
- `css/compat`: fallback de modo leve para WebViews/reduced motion.
- `js/main.js`: inicializa e coordena os modulos.
- `js/compat`: scripts que precisam rodar antes do CSS.
- `js/components`: comportamento de componentes reutilizaveis.
- `js/effects`: animacoes, GSAP e efeitos canvas.
- `js/modules`: funcionalidades de pagina, como formulario e FAB.
- `js/utils`: funcoes utilitarias.

## Como rodar

Por usar JavaScript ES Modules, abra o projeto por um servidor local:

```bash
python -m http.server 4173 --bind 127.0.0.1
```

Acesse:

```text
http://127.0.0.1:4173/index.html
```

## Bibliotecas

- GSAP 3.11.4 via CDN.
- ScrollTrigger 3.11.4 via CDN.
- Canvas API nativa.
- JavaScript ES Modules nativo do navegador.

Nao ha Vite, Webpack, Parcel, npm ou processo de build. O deploy pode ser feito diretamente no GitHub Pages a partir da raiz do projeto.

## Como criar uma nova secao

1. Adicione a estrutura semantica da secao em `index.html`.
2. Crie um arquivo CSS em `css/sections/nome-da-secao.css`.
3. Importe esse arquivo em `css/main.css` na posicao correta da cascata.
4. Se a secao precisar de comportamento, crie um modulo em `js/modules/`.
5. Inicialize o modulo em `js/main.js`.

## Cuidados com caminhos

Use caminhos relativos a partir do HTML:

```text
./css/main.css
./js/main.js
./assets/images/minhaFoto.jpeg
./assets/icons/social/SVG-email.png
./assets/icons/technologies/JAVA-SVG.png
```

O GitHub Pages diferencia maiusculas e minusculas, entao mantenha `css`, `js` e `assets` em minusculo.
