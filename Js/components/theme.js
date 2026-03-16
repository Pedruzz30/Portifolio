const STORAGE_KEY = "ph-theme";

export function setupTheme({ toggleBtn }) {
  if (!toggleBtn) return { destroy: () => {} };

  const html = document.documentElement;

  const saved = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initial = saved ?? (prefersDark ? "dark" : "light");

  const apply = (theme) => {
    html.setAttribute("data-theme", theme);
    toggleBtn.setAttribute("aria-label", theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro");
    localStorage.setItem(STORAGE_KEY, theme);
  };

  apply(initial);

  const handleClick = () => {
    const current = html.getAttribute("data-theme");
    apply(current === "dark" ? "light" : "dark");
  };

  toggleBtn.addEventListener("click", handleClick);

  return {
    destroy: () => {
      toggleBtn.removeEventListener("click", handleClick);
    },
  };
}