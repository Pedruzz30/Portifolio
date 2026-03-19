/*
 * ═══════════════════════════════════════════════════════════
 *  components/theme.js — Toggle de Tema Claro/Escuro
 *
 *  Prioridade: localStorage → prefers-color-scheme → "light"
 *  O tema é aplicado via data-theme="dark" no <html>,
 *  e o darkmode.css sobrescreve os tokens CSS automaticamente.
 * ═══════════════════════════════════════════════════════════
 */

// Chave usada no localStorage para persistir a escolha do usuário
const STORAGE_KEY = "ph-theme";

/**
 * Inicializa o toggle de tema.
 *
 * @param {Object} options
 * @param {HTMLElement} options.toggleBtn - Botão .theme-toggle
 * @returns {{ destroy: Function }}
 */
export function setupTheme({ toggleBtn }) {
  if (!toggleBtn) return { destroy: () => {} };

  const html = document.documentElement;

  // Lê o tema salvo; se não existir, usa a preferência do sistema
  const saved = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initial = saved ?? (prefersDark ? "dark" : "light");

  /**
   * Aplica um tema: define o atributo no <html>, atualiza o aria-label
   * do botão e salva no localStorage.
   */
  const apply = (theme) => {
    html.setAttribute("data-theme", theme);
    toggleBtn.setAttribute("aria-label", theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro");
    localStorage.setItem(STORAGE_KEY, theme);
  };

  // Aplica o tema inicial antes de qualquer interação
  apply(initial);

  // Ao clicar, alterna entre "dark" e "light"
  const handleClick = () => {
    const current = html.getAttribute("data-theme");
    apply(current === "dark" ? "light" : "dark");
  };

  toggleBtn.addEventListener("click", handleClick);

  return {
    // Remove o listener ao destruir (ex: ao sair da página)
    destroy: () => {
      toggleBtn.removeEventListener("click", handleClick);
    },
  };
}
