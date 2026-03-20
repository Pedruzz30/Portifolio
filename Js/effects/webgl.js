/*
 * ═══════════════════════════════════════════════════════════
 *  effects/webgl.js — Placeholder WebGL
 *
 *  Mantém a assinatura de importação estável em main.js.
 *  O WebGL foi removido/adiado — este módulo existe para que
 *  o bootstrap não precise de guards ou imports condicionais.
 *
 *  Para implementar um fundo WebGL no futuro, substitua os
 *  no-ops abaixo pela lógica real. A interface { destroy }
 *  deve ser preservada para o lifecycle do bootstrap.
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Inicializa (ou simula) o contexto WebGL do hero.
 *
 * @returns {{ destroy: () => void }} Interface de lifecycle —
 *   chame destroy() ao desmontar a página para liberar recursos.
 *   No estado atual, destroy() é um no-op seguro.
 */
export function initWebGL() {
  return { destroy() {} };
}

/**
 * Notifica o contexto WebGL sobre mudanças de tamanho da viewport.
 * No estado atual é um no-op — quando o WebGL for implementado,
 * deverá chamar gl.viewport() com as novas dimensões.
 *
 * @param {number} _width  - Largura da viewport em pixels
 * @param {number} _height - Altura da viewport em pixels
 */
export function handleWebGLResize(_width, _height) {
  // no-op intencional — ver comentário do módulo
}