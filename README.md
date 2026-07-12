# Pedro Henrique | Portfólio

Portfólio pessoal de Pedro Henrique, estudante de Engenharia de Software com foco em desenvolvimento back-end Java. A página apresenta minha trajetória, stack de estudos, projetos práticos, canais de contato e um roadmap de evolução para atuar como desenvolvedor Java Júnior.

## Acesse

Deploy previsto via GitHub Pages:

```text
https://pedruzz30.github.io/Portifolio/
```

## Sobre o projeto

Este portfólio foi construído como uma página estática, com foco em performance, responsividade e uma experiência visual própria. O conteúdo destaca minha base em Java, Spring Boot, APIs REST, JPA/Hibernate, MongoDB, SQL, Git/GitHub e boas práticas de código.

## Funcionalidades

- Hero com apresentação profissional e foto.
- Seção "Sobre mim" com foco em back-end Java.
- Roadmap de estudos em Java com progresso visual.
- Cards de projetos com links para repositórios.
- Formulário de contato via `mailto:`.
- Atalhos para GitHub, LinkedIn, email e WhatsApp.
- Tema claro/escuro.
- Animações com GSAP e efeitos visuais em canvas.
- Layout responsivo para desktop, tablet e mobile.
- Metatags de SEO, Open Graph, Twitter Card e dados estruturados.

## Tecnologias

- HTML5
- CSS3 modular
- JavaScript ES Modules
- GSAP
- ScrollTrigger
- Canvas API
- GitHub Pages

## Estrutura

```text
.
├── index.html
├── Css/
│   ├── main.css
│   ├── tokens.css
│   ├── hero.css
│   ├── about.css
│   ├── roadmap.css
│   ├── portifolio.css
│   └── ...
├── Js/
│   ├── main.js
│   ├── components/
│   ├── effects/
│   └── utils/
└── assets/
    ├── minhaFoto.jpeg
    ├── SVG/
    └── SVG-Linguagens/
```

## Como rodar localmente

Por usar módulos JavaScript, o ideal é abrir o projeto por um servidor local.

Com Python:

```bash
python -m http.server 4173 --bind 127.0.0.1
```

Depois acesse:

```text
http://127.0.0.1:4173/index.html
```

Também é possível usar uma extensão como Live Server no VS Code.

## Publicação

Este projeto pode ser publicado diretamente pelo GitHub Pages, sem etapa de build.

Passos básicos:

```bash
git add -A
git commit -m "Publish portfolio"
git push
```

Depois, ative o GitHub Pages nas configurações do repositório, usando a branch principal e a raiz do projeto.

## Próximas melhorias

- Adicionar currículo em PDF.
- Destacar um projeto Spring Boot completo como projeto principal.
- Adicionar links de demonstração para projetos publicados.
- Melhorar os READMEs dos repositórios linkados.
- Integrar formulário com envio real usando Formspree, EmailJS ou backend próprio.
- Rodar Lighthouse após o deploy e ajustar performance, SEO e acessibilidade.

## Contato

- GitHub: [Pedruzz30](https://github.com/Pedruzz30)
- LinkedIn: [Pedro Henrique](https://www.linkedin.com/in/pedro-henrique-1a883634a)
- Email: [pedrohhenriquepimenta224@gmail.com](mailto:pedrohhenriquepimenta224@gmail.com)
- WhatsApp: [Enviar mensagem](https://wa.me/5524999423102)
