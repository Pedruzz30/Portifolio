import { safeGetComputedStyle } from "../utils/dom.js";

export function setupMenu({
  menuToggle,
  menuSpans,
  navOverlay,
  navLinks,
  getCssVar,
}) {
  if (!menuToggle) return;

  const spans = menuSpans || [];
  const overlay = navOverlay;
  const links = navLinks || [];

  const toggleMenu = () => {
    const isOpen = menuToggle.classList.toggle("active");
    document.body.classList.toggle("menu-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));

    if (!spans.length || !window.gsap) return;

    const openColor =
      getCssVar("--accent") || safeGetComputedStyle("--accent") || "#ff4d4d";
    const closedColor =
      getCssVar("--text") || safeGetComputedStyle("--text") || "#f5f5f5";

    gsap.to(spans, {
      backgroundColor: isOpen ? openColor : closedColor,
      duration: 0.3,
    });

    if (isOpen) {
      if (spans[0]) gsap.to(spans[0], { y: 8, rotate: 45, duration: 0.3 });
      if (spans[1]) gsap.to(spans[1], { y: -8, rotate: -45, duration: 0.3 });
    } else {
      gsap.to(spans, { y: 0, rotate: 0, duration: 0.3 });
    }
  };

  const closeMenu = () => {
    if (!menuToggle.classList.contains("active")) return;
    menuToggle.classList.remove("active");
    document.body.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");

    if (spans.length && window.gsap) {
      const closedColor =
        getCssVar("--text") || safeGetComputedStyle("--text") || "#f5f5f5";
      gsap.to(spans, {
        backgroundColor: closedColor,
        y: 0,
        rotate: 0,
        duration: 0.3,
      });
    }
  };

  const handleNavLink = (event) => {
    const href = event.currentTarget.getAttribute("href");
    if (!href || !href.startsWith("#")) return;
    event.preventDefault();
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: "smooth" });
    closeMenu();
  };

  menuToggle.addEventListener("click", toggleMenu);

  if (overlay) {
    overlay.addEventListener("click", closeMenu);
  }

  if (links.length) {
    links.forEach((link) => {
      link.addEventListener("click", handleNavLink);
    });
  }
}
