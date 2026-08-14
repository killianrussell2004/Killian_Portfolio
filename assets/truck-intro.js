// ============================================================
// Scroll-driven 3D truck intro.
// Rotates from a 3/4 angle into side profile, translates across
// the screen, and scales slightly — driven purely by scroll
// position through a tall wrapper section. Real geometry (your
// GLB), no rust/paint effect — authored paint colour as-is.
// ============================================================
function initTruckIntro(opts) {
  const {
    sectionId,
    canvasId,
    glbPath = 'assets/ford-ranger.glb',
    rotateFromDeg = 42,
    rotateToDeg = 0,
    xFrom = 1.6,
    xTo = -1.1,
    scaleFrom = 1.15,
    scaleTo = 0.85,
    onProgress = null
  } = opts;

  if (typeof THREE === 'undefined') return;
  const section = document.getElementById(sectionId);
  const canvas = document.getElementById(canvasId);
  if (!section || !canvas) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let progress = reducedMotion ? 0.5 : 0;

  function computeProgress() {
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = rect.height - vh;
    let p = total > 0 ? (-rect.top) / total : 0;
    p = Math.min(1, Math.max(0, p));
    progress = p;
    if (onProgress) onProgress(p);
  }

  if (!reducedMotion) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => { computeProgress(); ticking = false; });
        ticking = true;
      }
    });
    computeProgress();
  } else if (onProgress) {
    onProgress(progress);
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 2.4, 8.2);
  camera.lookAt(0, 1.1, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  scene.add(new THREE.HemisphereLight(0xBFD9FF, 0x0A1116, 0.75));
  scene.add(new THREE.AmbientLight(0xFFFFFF, 0.3));
  const dirLight = new THREE.DirectionalLight(0xFFFFFF, 1.3);
  dirLight.position.set(4, 6, 5);
  scene.add(dirLight);
  const rimLight = new THREE.DirectionalLight(0x5B9BFF, 0.35);
  rimLight.position.set(-5, 3, -4);
  scene.add(rimLight);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(3.8, 32),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  scene.add(ground);

  const truckGroup = new THREE.Group();
  scene.add(truckGroup);

  const dracoLoader = new THREE.DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
  const gltfLoader = new THREE.GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);

  gltfLoader.load(glbPath, (gltf) => {
    const model = gltf.scene;
    const rawBox = new THREE.Box3().setFromObject(model);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    const targetLength = 6.3;
    const scale = targetLength / Math.max(rawSize.x, rawSize.z);
    model.scale.setScalar(scale);
    model.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(model);
    model.position.x -= (box.min.x + box.max.x) / 2;
    model.position.z -= (box.min.z + box.max.z) / 2;
    model.position.y -= box.min.y;
    truckGroup.add(model);
  }, undefined, (err) => { console.error('Truck model failed to load:', err); });

  const rotFrom = THREE.MathUtils.degToRad(rotateFromDeg);
  const rotTo = THREE.MathUtils.degToRad(rotateToDeg);

  function frame() {
    requestAnimationFrame(frame);
    resize();
    const p = progress;
    truckGroup.rotation.y = rotFrom + (rotTo - rotFrom) * p;
    truckGroup.position.x = xFrom + (xTo - xFrom) * p;
    const s = scaleFrom + (scaleTo - scaleFrom) * p;
    truckGroup.scale.set(s, s, s);
    renderer.render(scene, camera);
  }
  frame();
}
