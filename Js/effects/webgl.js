let webGLState = {
  scene: null,
  camera: null,
  renderer: null,
  mesh: null,
  canvas: null,
  initialized: false,
  rafId: null,
  getCssVar: null,
};

function animateWebGL() {
  if (!webGLState.initialized) return;

  webGLState.rafId = requestAnimationFrame(animateWebGL);

  if (webGLState.mesh) {
    webGLState.mesh.rotation.x += 0.005;
    webGLState.mesh.rotation.y += 0.01;
  }

  if (webGLState.renderer && webGLState.scene && webGLState.camera) {
    webGLState.renderer.render(webGLState.scene, webGLState.camera);
  }
}

export function initWebGL({ webGLCanvas, getCssVar }) {
  if (!webGLCanvas || !window.THREE) return;

  webGLState.canvas = webGLCanvas;
  webGLState.getCssVar = getCssVar;

  try {
    const w = webGLCanvas.clientWidth || 1;
    const h = webGLCanvas.clientHeight || 1;

    webGLState.scene = new THREE.Scene();
    webGLState.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);

    webGLState.renderer = new THREE.WebGLRenderer({
      canvas: webGLCanvas,
      antialias: true,
      alpha: true,
    });

    webGLState.renderer.setSize(w, h);
    webGLState.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    webGLState.scene.add(ambientLight, directionalLight);

    const geometry = new THREE.IcosahedronGeometry(1.5, 2);

    const accent = getCssVar ? getCssVar('--accent') : null;
    const material = new THREE.MeshStandardMaterial({
      color: accent || 0xff4d4d,
      metalness: 0.7,
      roughness: 0.2,
    });

    webGLState.mesh = new THREE.Mesh(geometry, material);
    webGLState.scene.add(webGLState.mesh);

    webGLState.camera.position.z = 5;
    webGLState.initialized = true;

    animateWebGL();
  } catch (error) {
    console.error('Erro ao inicializar WebGL:', error);
    if (webGLCanvas) webGLCanvas.style.display = 'none';
  }
}

export function handleWebGLResize() {
  if (!webGLState.initialized || !webGLState.canvas) return;
  if (!webGLState.camera || !webGLState.renderer) return;

  const w = webGLState.canvas.clientWidth || 1;
  const h = webGLState.canvas.clientHeight || 1;

  webGLState.camera.aspect = w / h;
  webGLState.camera.updateProjectionMatrix();
  webGLState.renderer.setSize(w, h);
}