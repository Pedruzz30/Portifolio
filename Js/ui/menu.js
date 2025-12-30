import { safeGetComputedStyle } from "../utils/dom.js";

export function setupMenu({ menuToggle, menuSpans, navOverlay, navLinks, getCssVar }) {
  if (!menuToggle) return;

  try {
    const spans = menuSpans || [];
    const overlay = navOverlay || null;
    const links = navLinks || [];

    const prefersReducedMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const getColor = (varName, fallback) =>
      (getCssVar && getCssVar(varName)) || safeGetComputedStyle(varName) || fallback;

    const openColor = () => getColor("--accent", "#ff4d4d");
    const closedColor = () => getColor("--text", "#f5f5f5");

    const setA11yState = (isOpen) => {
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      if (overlay) overlay.setAttribute("aria-hidden", String(!isOpen));
    };

    const animateBurger = (isOpen) => {
      if (!spans.length || !window.gsap || prefersReducedMotion) return;

      gsap.killTweensOf(spans);
      gsap.to(spans, {
        backgroundColor: isOpen ? openColor() : closedColor(),
        duration: 0.25,
        overwrite: "auto",
      });

      if (isOpen) {
        if (spans[0]) gsap.to(spans[0], { y: 8, rotate: 45, duration: 0.25, overwrite: "auto" });
        if (spans[1]) gsap.to(spans[1], { y: -8, rotate: -45, duration: 0.25, overwrite: "auto" });
      } else {
        gsap.to(spans, { y: 0, rotate: 0, duration: 0.25, overwrite: "auto" });
      }
    };

    const openMenu = () => {
      menuToggle.classList.add("active");
      document.body.classList.add("menu-open");
      setA11yState(true);
      animateBurger(true);
    };

    const closeMenu = () => {
      if (!menuToggle.classList.contains("active")) return;
      menuToggle.classList.remove("active");
      document.body.classList.remove("menu-open");
      setA11yState(false);
      animateBurger(false);
    };

    const toggleMenu = () => {
      const isOpen = menuToggle.classList.toggle("active");
      document.body.classList.toggle("menu-open", isOpen);
      setA11yState(isOpen);
      animateBurger(isOpen);
    };

    const handleNavLink = (event) => {
      const href = event.currentTarget.getAttribute("href");
      if (!href || !href.startsWith("#")) return;

      event.preventDefault();
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
      closeMenu();
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeMenu();
    };

    // Estado inicial a11y
    setA11yState(menuToggle.classList.contains("active"));

    menuToggle.addEventListener("click", toggleMenu);
    document.addEventListener("keydown", handleKeyDown);

    if (overlay) overlay.addEventListener("click", closeMenu);

    links.forEach((link) => link.addEventListener("click", handleNavLink));

    // cleanup
    const destroy = () => {
      menuToggle.removeEventListener("click", toggleMenu);
      document.removeEventListener("keydown", handleKeyDown);
      if (overlay) overlay.removeEventListener("click", closeMenu);
      links.forEach((link) => link.removeEventListener("click", handleNavLink));
    };

    return { openMenu, closeMenu, toggleMenu, destroy };
  } catch (error) {
    console.error("Falha ao configurar menu:", error);
    return null;
  }
}
