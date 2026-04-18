import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const shapeNames = ['Interface', 'System', 'Signal', 'Flow'];
const PARTICLE_COUNT = 25000;

export function initHeroScene() {
  const container = document.querySelector('#three-container');
  const heroSection = document.querySelector('.hero');

  if (!container || container.dataset.sceneMounted === 'true') {
    return;
  }

  container.dataset.sceneMounted = 'true';

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 2.5;
  renderer.powerPreference = 'high-performance';
  container.replaceChildren(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0e0e);
  scene.fog = new THREE.FogExp2(0x0e0e0e, 0.02);

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 5);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.04;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.4;
  controls.enableZoom = false;
  controls.enablePan = false;

  const ambient = new THREE.AmbientLight(0xffeedd, 3);
  scene.add(ambient);

  const keyLight = new THREE.PointLight(0xc4a882, 15, 50);
  keyLight.position.set(3, 3, 4);
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0x4a6fa5, 8, 50);
  fillLight.position.set(-4, -2, 3);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0x8b7355, 10, 50);
  rimLight.position.set(0, 4, -3);
  scene.add(rimLight);

  const frontLight = new THREE.PointLight(0xffffff, 12, 40);
  frontLight.position.set(0, 0, 6);
  scene.add(frontLight);

  const bottomLight = new THREE.PointLight(0xc4a882, 8, 40);
  bottomLight.position.set(0, -3, 3);
  scene.add(bottomLight);

  function publishMorphState(index, progress) {
    window.dispatchEvent(
      new CustomEvent('portfolio:morphchange', {
        detail: {
          index,
          progress
        }
      })
    );
  }

  function sampleGeometry(geometry, count) {
    const sampledPositions = new Float32Array(count * 3);
    const positionAttribute = geometry.attributes.position;
    const indexAttribute = geometry.index;
    const triangles = [];
    const areas = [];
    const vertexA = new THREE.Vector3();
    const vertexB = new THREE.Vector3();
    const vertexC = new THREE.Vector3();
    let totalArea = 0;

    const triangleCount = indexAttribute ? indexAttribute.count / 3 : positionAttribute.count / 3;

    for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
      let a;
      let b;
      let c;

      if (indexAttribute) {
        a = indexAttribute.getX(triangleIndex * 3);
        b = indexAttribute.getX(triangleIndex * 3 + 1);
        c = indexAttribute.getX(triangleIndex * 3 + 2);
      } else {
        a = triangleIndex * 3;
        b = triangleIndex * 3 + 1;
        c = triangleIndex * 3 + 2;
      }

      vertexA.fromBufferAttribute(positionAttribute, a);
      vertexB.fromBufferAttribute(positionAttribute, b);
      vertexC.fromBufferAttribute(positionAttribute, c);

      const area = new THREE.Triangle(vertexA.clone(), vertexB.clone(), vertexC.clone()).getArea();
      areas.push(area);
      totalArea += area;
      triangles.push([vertexA.clone(), vertexB.clone(), vertexC.clone()]);
    }

    for (let index = 0; index < count; index += 1) {
      let sample = Math.random() * totalArea;
      let triangleOffset = 0;

      for (let areaIndex = 0; areaIndex < areas.length; areaIndex += 1) {
        sample -= areas[areaIndex];
        if (sample <= 0) {
          triangleOffset = areaIndex;
          break;
        }
      }

      const triangle = triangles[triangleOffset];
      let u = Math.random();
      let v = Math.random();

      if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }

      const w = 1 - u - v;

      sampledPositions[index * 3] = triangle[0].x * w + triangle[1].x * u + triangle[2].x * v;
      sampledPositions[index * 3 + 1] = triangle[0].y * w + triangle[1].y * u + triangle[2].y * v;
      sampledPositions[index * 3 + 2] = triangle[0].z * w + triangle[1].z * u + triangle[2].z * v;
    }

    return sampledPositions;
  }

  function makeDodecahedron() {
    const geometry = new THREE.DodecahedronGeometry(1.2, 1);
    const nonIndexedGeometry = geometry.toNonIndexed();
    const indexedGeometry = new THREE.BufferGeometry();
    const indexArray = [];

    indexedGeometry.setAttribute('position', nonIndexedGeometry.attributes.position);

    for (let index = 0; index < nonIndexedGeometry.attributes.position.count; index += 1) {
      indexArray.push(index);
    }

    indexedGeometry.setIndex(indexArray);
    return sampleGeometry(indexedGeometry, PARTICLE_COUNT);
  }

  function makeHeart() {
    const positions = new Float32Array(PARTICLE_COUNT * 3);

    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const t = Math.random() * Math.PI * 2;
      const s = Math.random() * Math.PI;
      const scatter = 0.03;
      const heartX = 16 * Math.pow(Math.sin(t), 3) / 16;
      const heartY = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16;
      const depth = Math.sin(s) * 0.5;

      positions[index * 3] = heartX + (Math.random() - 0.5) * scatter;
      positions[index * 3 + 1] = heartY + (Math.random() - 0.5) * scatter;
      positions[index * 3 + 2] = depth + (Math.random() - 0.5) * scatter;
    }

    return positions;
  }

  function makeDiamond() {
    const yOffset = 0.35;
    const topGeometry = new THREE.ConeGeometry(1.4, 0.9, 8);
    const bottomGeometry = new THREE.ConeGeometry(1.4, 2, 8);
    const topIndices = [];
    const bottomIndices = [];

    topGeometry.translate(0, 0.45 + yOffset, 0);
    bottomGeometry.rotateX(Math.PI);
    bottomGeometry.translate(0, -1 + yOffset, 0);

    const topNonIndexedGeometry = topGeometry.toNonIndexed();
    const bottomNonIndexedGeometry = bottomGeometry.toNonIndexed();
    const topIndexedGeometry = new THREE.BufferGeometry();
    const bottomIndexedGeometry = new THREE.BufferGeometry();

    topIndexedGeometry.setAttribute('position', topNonIndexedGeometry.attributes.position);
    bottomIndexedGeometry.setAttribute('position', bottomNonIndexedGeometry.attributes.position);

    for (let index = 0; index < topNonIndexedGeometry.attributes.position.count; index += 1) {
      topIndices.push(index);
    }

    for (let index = 0; index < bottomNonIndexedGeometry.attributes.position.count; index += 1) {
      bottomIndices.push(index);
    }

    topIndexedGeometry.setIndex(topIndices);
    bottomIndexedGeometry.setIndex(bottomIndices);

    const topCount = Math.floor(PARTICLE_COUNT * 0.4);
    const bottomCount = PARTICLE_COUNT - topCount;
    const topPoints = sampleGeometry(topIndexedGeometry, topCount);
    const bottomPoints = sampleGeometry(bottomIndexedGeometry, bottomCount);
    const positions = new Float32Array(PARTICLE_COUNT * 3);

    positions.set(topPoints);

    for (let index = 0; index < bottomCount * 3; index += 1) {
      positions[topCount * 3 + index] = bottomPoints[index];
    }

    return positions;
  }

  function makeHelix() {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const helixCount = PARTICLE_COUNT / 2;

    for (let helixIndex = 0; helixIndex < 2; helixIndex += 1) {
      const offset = helixIndex * Math.PI;

      for (let index = 0; index < helixCount; index += 1) {
        const positionIndex = (helixIndex * helixCount + index) * 3;
        const t = (index / helixCount) * Math.PI * 6 - Math.PI * 3;
        const radius = 0.6;

        positions[positionIndex] = radius * Math.cos(t + offset) + (Math.random() - 0.5) * 0.04;
        positions[positionIndex + 1] = t * 0.25 + (Math.random() - 0.5) * 0.04;
        positions[positionIndex + 2] = radius * Math.sin(t + offset) + (Math.random() - 0.5) * 0.04;

        if (index % 200 < 10 && helixIndex === 0) {
          const rungIndex = Math.floor(index / 200) * 200;
          const rungAngle = (rungIndex / helixCount) * Math.PI * 6 - Math.PI * 3;
          const fraction = (index % 200) / 10;

          positions[positionIndex] =
            radius * Math.cos(rungAngle) * (1 - fraction) +
            radius * Math.cos(rungAngle + Math.PI) * fraction;
          positions[positionIndex + 2] =
            radius * Math.sin(rungAngle) * (1 - fraction) +
            radius * Math.sin(rungAngle + Math.PI) * fraction;
        }
      }
    }

    return positions;
  }

  const shapes = [makeDodecahedron(), makeHeart(), makeDiamond(), makeHelix()];

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);
  const randoms = new Float32Array(PARTICLE_COUNT);
  const firstColor = new THREE.Color(0xf0d9b5);
  const secondColor = new THREE.Color(0xd4a574);
  const thirdColor = new THREE.Color(0x7eb8e0);

  positions.set(shapes[0]);

  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    const ratio = index / PARTICLE_COUNT;
    const color =
      ratio < 0.5
        ? firstColor.clone().lerp(secondColor, ratio * 2)
        : secondColor.clone().lerp(thirdColor, (ratio - 0.5) * 2);

    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
    sizes[index] = 0.012 + Math.random() * 0.02;
    randoms[index] = Math.random();
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uMorph: { value: 0 },
      uMouse3D: { value: new THREE.Vector3(0, 0, 0) },
      uMouseActive: { value: 0 }
    },
    vertexShader: `
      attribute float aSize;
      attribute float aRandom;
      varying vec3 vColor;
      varying float vAlpha;
      uniform float uTime;
      uniform float uPixelRatio;
      uniform float uMorph;
      uniform vec3 uMouse3D;
      uniform float uMouseActive;

      void main() {
        vColor = color;
        vec3 pos = position;

        float breath = sin(uTime * 0.5 + aRandom * 6.28) * 0.02;
        pos += normalize(pos) * breath;

        float scatter = sin(uMorph * 3.14159) * 0.3;
        pos += normalize(pos + vec3(0.001)) * scatter * aRandom;

        vec3 toParticle = pos - uMouse3D;
        float xyDist = length(toParticle.xy);
        float fullDist = length(toParticle);
        float mouseRadius = 1.4;
        float influence = 1.0 - smoothstep(0.0, mouseRadius, xyDist);
        influence = influence * influence * uMouseActive;

        if (influence > 0.001) {
          vec3 pushDir = fullDist > 0.001 ? normalize(toParticle) : vec3(0.0, 1.0, 0.0);
          float pushStrength = influence * 0.3;
          pos += pushDir * pushStrength;

          float swirlSpeed = uTime * 2.0 + aRandom * 6.28;
          float swirlStrength = influence * 0.25;
          vec2 radial = pos.xy - uMouse3D.xy;
          float angle = swirlStrength * (1.0 + sin(swirlSpeed) * 0.3);
          float cosA = cos(angle);
          float sinA = sin(angle);
          vec2 rotated = vec2(
            radial.x * cosA - radial.y * sinA,
            radial.x * sinA + radial.y * cosA
          );
          pos.xy = uMouse3D.xy + rotated;
          pos.z += sin(swirlSpeed * 0.7 + aRandom * 3.14) * influence * 0.15;

          float jitter = sin(uTime * 4.0 + aRandom * 18.0) * 0.02 * influence;
          pos += pushDir * jitter;
        }

        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = aSize * uPixelRatio * 500.0 / -mvPos.z;
        gl_PointSize = max(gl_PointSize, 1.5);
        gl_Position = projectionMatrix * mvPos;
        vAlpha = 0.85 + 0.15 * (1.0 - smoothstep(0.0, 10.0, -mvPos.z));
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        float distanceFromCenter = length(gl_PointCoord - vec2(0.5));
        if (distanceFromCenter > 0.5) {
          discard;
        }

        float alpha = smoothstep(0.5, 0.0, distanceFromCenter) * vAlpha;
        vec3 brightColor = vColor * 2.2 + 0.15;
        gl_FragColor = vec4(brightColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  const raycaster = new THREE.Raycaster();
  const mouseNdc = new THREE.Vector2(9999, 9999);
  const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const intersectPoint = new THREE.Vector3();
  const inverseMatrix = new THREE.Matrix4();
  const localMouse = new THREE.Vector3();
  const clock = new THREE.Clock();
  const morphDuration = 2.5;
  const morphInterval = 5;
  const maxAnimatedDuration = Number.POSITIVE_INFINITY;
  let currentShape = 0;
  let targetShape = 0;
  let isMorphing = false;
  let morphStartTime = 0;
  let lastMorphAt = 0;
  let isPageVisible = !document.hidden;
  let isHeroVisible = true;
  let isDisposed = false;
  let isRunning = false;
  let frameId = 0;
  let heroObserver;
  let mouseOnScreen = false;
  let mouseActiveSmooth = 0;

  function easeInOutCubic(value) {
    return value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2;
  }

  function startMorph(nextShape) {
    if (isDisposed || isMorphing || nextShape === currentShape) {
      return;
    }

    targetShape = nextShape;
    isMorphing = true;
    morphStartTime = clock.getElapsedTime();
  }

  function handleMorphRequest(event) {
    const requestedIndex = Number.parseInt(String(event.detail?.index ?? '0'), 10);
    startMorph(Number.isNaN(requestedIndex) ? 0 : requestedIndex);
  }

  function handlePointerMove(event) {
    mouseNdc.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouseNdc.y = -(event.clientY / window.innerHeight) * 2 + 1;
    mouseOnScreen = true;
  }

  function handlePointerLeave() {
    mouseNdc.set(9999, 9999);
    mouseOnScreen = false;
  }

  function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    material.uniforms.uPixelRatio.value = renderer.getPixelRatio();

    if (!isRunning && !isDisposed) {
      renderer.render(scene, camera);
    }
  }

  function stopRenderLoop() {
    if (!isRunning) {
      return;
    }

    isRunning = false;

    if (frameId) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }
  }

  function syncRenderState() {
    if (isDisposed) {
      return;
    }

    if (!isPageVisible || !isHeroVisible) {
      stopRenderLoop();
      return;
    }

    if (isRunning) {
      return;
    }

    isRunning = true;
    frameId = window.requestAnimationFrame(animate);
  }

  function handleVisibilityChange() {
    isPageVisible = !document.hidden;
    syncRenderState();
  }

  function cleanup() {
    if (isDisposed) {
      return;
    }

    isDisposed = true;
    stopRenderLoop();
    heroObserver?.disconnect();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerleave', handlePointerLeave);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('portfolio:request-morph', handleMorphRequest);
    controls.dispose();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    container.dataset.sceneMounted = 'false';
  }

  function animate() {
    if (!isRunning || isDisposed) {
      return;
    }

    const elapsed = clock.getElapsedTime();
    material.uniforms.uTime.value = elapsed;

    const mouseTarget = mouseOnScreen ? 1 : 0;
    mouseActiveSmooth += (mouseTarget - mouseActiveSmooth) * 0.08;
    material.uniforms.uMouseActive.value = mouseActiveSmooth;

    raycaster.setFromCamera(mouseNdc, camera);
    raycaster.ray.intersectPlane(mousePlane, intersectPoint);
    inverseMatrix.copy(particles.matrixWorld).invert();
    localMouse.copy(intersectPoint).applyMatrix4(inverseMatrix);
    material.uniforms.uMouse3D.value.copy(localMouse);

    if (!isMorphing && elapsed - lastMorphAt >= morphInterval) {
      startMorph((currentShape + 1) % shapes.length);
    }

    if (isMorphing) {
      const rawProgress = Math.min((elapsed - morphStartTime) / morphDuration, 1);
      const morphProgress = easeInOutCubic(rawProgress);
      const sourcePositions = shapes[currentShape];
      const targetPositions = shapes[targetShape];
      const positionArray = geometry.attributes.position.array;

      material.uniforms.uMorph.value = morphProgress;

      for (let index = 0; index < positionArray.length; index += 1) {
        positionArray[index] =
          sourcePositions[index] + (targetPositions[index] - sourcePositions[index]) * morphProgress;
      }

      geometry.attributes.position.needsUpdate = true;
      publishMorphState(currentShape, 0);

      if (rawProgress >= 1) {
        isMorphing = false;
        currentShape = targetShape;
        lastMorphAt = elapsed;
        material.uniforms.uMorph.value = 0;
        publishMorphState(currentShape, 0);
      }
    } else {
      const cycleProgress = Math.min(((elapsed - lastMorphAt) / morphInterval) * 100, 100);
      publishMorphState(currentShape, cycleProgress);
    }

    particles.rotation.y = elapsed * 0.05;
    particles.position.y = Math.sin(elapsed * 0.3) * 0.05;

    const sinTime = Math.sin(elapsed * 0.2);
    const cosTime = Math.cos(elapsed * 0.2);
    keyLight.position.x = sinTime * 4;
    keyLight.position.z = cosTime * 4;

    controls.update();
    renderer.render(scene, camera);

    if (elapsed >= maxAnimatedDuration) {
      stopRenderLoop();
      return;
    }

    frameId = window.requestAnimationFrame(animate);
  }

  if (heroSection && 'IntersectionObserver' in window) {
    heroObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isHeroVisible = Boolean(entry?.isIntersecting);
        syncRenderState();
      },
      {
        threshold: 0.12
      }
    );

    heroObserver.observe(heroSection);
  }

  publishMorphState(0, 0);
  renderer.render(scene, camera);

  document.addEventListener('visibilitychange', handleVisibilityChange);
  document.addEventListener('pointermove', handlePointerMove);
  document.addEventListener('pointerleave', handlePointerLeave);
  window.addEventListener('resize', handleResize);
  window.addEventListener('portfolio:request-morph', handleMorphRequest);
  window.addEventListener('pagehide', cleanup, { once: true });

  syncRenderState();
}
