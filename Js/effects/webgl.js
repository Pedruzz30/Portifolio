export function initWebGL() {
  // Mantém a mesma assinatura de retorno pra não quebrar o bootstrap
  return { destroy() {} };
}

export function handleWebGLResize() {
  // noop
}
