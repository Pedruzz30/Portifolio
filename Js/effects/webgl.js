/*
 * ═══════════════════════════════════════════════════════════
 *  effects/webgl.js — Placeholder WebGL
 *
 *  Este arquivo existe para manter a assinatura de importação
 *  estável em main.js. O WebGL foi removido/adiado, mas o módulo
 *  permanece para não quebrar o sistema de módulos.
 *
 *  Se quiser implementar um fundo WebGL no futuro,
 *  é aqui que ele vai viver.
 * ═══════════════════════════════════════════════════════════
 */

/**
 * No-op: retorna a interface { destroy } esperada pelo bootstrap,
 * mas não faz nada. Seguro chamar sem efeitos colaterais.
 */
export function initWebGL() {
  return { destroy() {} };
}

/**
 * No-op: mantido para compatibilidade com chamadas de resize.
 */
export function handleWebGLResize() {
  // sem implementação
}
