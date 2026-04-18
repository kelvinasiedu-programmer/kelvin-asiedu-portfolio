import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const shapeNames = ['Interface', 'System', 'Signal', 'Flow'];

export function initHeroScene() {
  const container = document.querySelector('#three-container');
  const heroSection = document.querySelector('.hero');
  const morphNameEl = document.querySelector('#morph-name');
  const morphCounterEl = document.querySelector('#morph-counter');
  const progressBarEl = document.querySelector('.morph-progress span');

  if (!container || !morphNameEl || !morphCounterEl) {
    return;
  }

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.replaceChildren(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0e0e);

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 5;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.85;
  controls.enableDamping = true;

  const ambientLight = new THREE.AmbientLight(0xf3e7d0, 1.6);
  const pointLight = new THREE.PointLight(0xc4a882, 18, 16, 1.8);
  pointLight.position.set(2.5, 3, 4.5);
  const rimLight = new THREE.PointLight(0x8b7355, 10, 18, 1.8);
  rimLight.position.set(-3.5, -1.25, 3.25);
  scene.add(ambientLight, pointLight, rimLight);

  const material = new THREE.MeshPhysicalMaterial({
    color: 0xd8c1a2,
    emissive: 0x221912,
    emissiveIntensity: 0.35,
    metalness: 0.18,
    roughness: 0.3,
    clearcoat: 0.7,
    transmission: 0.08,
    opacity: 0.96,
    transparent: true
  });

  const geometry = new THREE.TorusKnotGeometry(1, 0.28, 220, 28, 2, 5);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  let activeShapeIndex = 0;
  let lastShapeSwapAt = 0;
  let elapsed = 0;
  let lastFrameAt = 0;
  let frameId = 0;
  let isRunning = false;
  let isDisposed = false;
  let isPageVisible = !document.hidden;
  let isHeroVisible = true;
  let hasCompletedMotion = false;
  let heroObserver;
  const maxAnimatedDuration = 12;

  const updateLabel = (index) => {
    const displayIndex = `${index + 1}`.padStart(2, '0');
    const totalCount = `${shapeNames.length}`.padStart(2, '0');
    morphNameEl.textContent = shapeNames[index];
    morphCounterEl.textContent = `${displayIndex} / ${totalCount}`;
    if (progressBarEl) {
      progressBarEl.style.width = `${((index + 1) / shapeNames.length) * 100}%`;
    }
  };

  updateLabel(activeShapeIndex);

  const renderFrame = (timestamp) => {
    if (!isRunning || isDisposed) {
      return;
    }

    if (!lastFrameAt) {
      lastFrameAt = timestamp;
    }

    const delta = Math.min((timestamp - lastFrameAt) / 1000, 0.05);
    lastFrameAt = timestamp;
    elapsed += delta;

    if (elapsed - lastShapeSwapAt > 2.4) {
      activeShapeIndex = (activeShapeIndex + 1) % shapeNames.length;
      lastShapeSwapAt = elapsed;
      updateLabel(activeShapeIndex);
    }

    mesh.rotation.x = elapsed * 0.18;
    mesh.rotation.y = elapsed * 0.22;
    mesh.position.y = Math.sin(elapsed * 0.7) * 0.08;

    controls.update();
    renderer.render(scene, camera);

    if (elapsed >= maxAnimatedDuration) {
      hasCompletedMotion = true;
      controls.autoRotate = false;
      stopRenderLoop();
      return;
    }

    frameId = window.requestAnimationFrame(renderFrame);
  };

  const startRenderLoop = () => {
    if (isRunning || isDisposed) {
      return;
    }

    isRunning = true;
    lastFrameAt = 0;
    frameId = window.requestAnimationFrame(renderFrame);
  };

  const stopRenderLoop = () => {
    if (!isRunning) {
      return;
    }

    isRunning = false;

    if (frameId) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }
  };

  const syncRenderState = () => {
    if (isDisposed) {
      return;
    }

    if (hasCompletedMotion) {
      stopRenderLoop();
      return;
    }

    if (isPageVisible && isHeroVisible) {
      startRenderLoop();
      return;
    }

    stopRenderLoop();
  };

  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (!isRunning && !isDisposed) {
      renderer.render(scene, camera);
    }
  };

  const handleVisibilityChange = () => {
    isPageVisible = !document.hidden;
    syncRenderState();
  };

  const cleanup = () => {
    if (isDisposed) {
      return;
    }

    isDisposed = true;
    stopRenderLoop();
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    heroObserver?.disconnect();
    controls.dispose();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  };

  if (heroSection && 'IntersectionObserver' in window) {
    heroObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        isHeroVisible = Boolean(entry?.isIntersecting);
        syncRenderState();
      },
      {
        threshold: 0.2
      }
    );

    heroObserver.observe(heroSection);
  }

  window.addEventListener('resize', handleResize);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', cleanup, { once: true });
  renderer.render(scene, camera);
  syncRenderState();
}
