const blurLayer = document.querySelector('.layer-blur');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.body.classList.toggle('reduced-motion', prefersReducedMotion);

if (blurLayer) {
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let smoothX = mouseX;
  let smoothY = mouseY;
  let lastBlurX = '';
  let lastBlurY = '';

  const applyBlurPosition = (x, y) => {
    const nextX = `${((x / window.innerWidth) * 100).toFixed(1)}%`;
    const nextY = `${((y / window.innerHeight) * 100).toFixed(1)}%`;

    if (nextX !== lastBlurX || nextY !== lastBlurY) {
      lastBlurX = nextX;
      lastBlurY = nextY;
      blurLayer.style.setProperty('--x', nextX);
      blurLayer.style.setProperty('--y', nextY);
    }
  };

  applyBlurPosition(mouseX, mouseY);

  if (!prefersReducedMotion) {
    document.addEventListener('pointermove', (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    });

    const animateBlur = () => {
      smoothX += (mouseX - smoothX) * 0.1;
      smoothY += (mouseY - smoothY) * 0.1;
      applyBlurPosition(smoothX, smoothY);
      window.requestAnimationFrame(animateBlur);
    };

    window.requestAnimationFrame(animateBlur);
  } else {
    window.addEventListener('resize', () => {
      mouseX = window.innerWidth / 2;
      mouseY = window.innerHeight / 2;
      applyBlurPosition(mouseX, mouseY);
    });
  }
}

async function bootstrapHeroScene() {
  try {
    const { initHeroScene } = await import('./hero-scene.js');
    initHeroScene();
  } catch (error) {
    console.warn('Hero scene bootstrap failed.', error);
  }
}

if (!prefersReducedMotion) {
  bootstrapHeroScene();
}
