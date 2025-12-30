// Utility helpers
export function safeGetComputedStyle(property) {
  const root = document.documentElement;
  return getComputedStyle(root).getPropertyValue(property).trim();
}