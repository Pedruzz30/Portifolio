function startScrollDebug() {
  const result = document.createElement("pre");
  result.id = "scroll-debug";
  result.className = "scroll-debug-panel";
  document.body.appendChild(result);

  const samples = [];
  const footer = document.querySelector(".site-footer");
  let index = 0;
  let lastY = window.scrollY;

  const tick = () => {
    window.scrollBy(0, 1200);

    samples.push({
      i: index,
      scrollY: window.scrollY,
      maxScroll: document.documentElement.scrollHeight - window.innerHeight,
      footerTop: footer ? footer.getBoundingClientRect().top : null,
      footerBottom: footer ? footer.getBoundingClientRect().bottom : null,
      deltaFromLast: window.scrollY - lastY,
      innerHeight: window.innerHeight,
      docHeight: document.documentElement.scrollHeight,
    });

    lastY = window.scrollY;
    index += 1;

    if (index < 40) {
      window.setTimeout(tick, 120);
      return;
    }

    result.textContent = JSON.stringify(samples, null, 2);
    document.documentElement.setAttribute("data-scroll-debug-ready", "true");
  };

  window.setTimeout(tick, 3000);
}

window.addEventListener("load", startScrollDebug, { once: true });
