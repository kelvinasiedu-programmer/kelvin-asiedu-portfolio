const blurLayer = document.querySelector('.layer-blur');
const dotNavs = Array.from(document.querySelectorAll('.dot-nav'));
const portfolioSections = document.querySelectorAll('.portfolio-section');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const sceneCount = 4;

document.body.classList.toggle('reduced-motion', prefersReducedMotion);

function syncMorphUi(index = 0) {
  const safeIndex = Math.max(0, Math.min(index, sceneCount - 1));
  dotNavs.forEach((dotNav, dotIndex) => {
    dotNav.classList.toggle('active', dotIndex === safeIndex);
  });
}

syncMorphUi(0);

window.addEventListener('portfolio:morphchange', (event) => {
  const index = Number.isFinite(event.detail?.index) ? event.detail.index : 0;
  syncMorphUi(index);
});

dotNavs.forEach((dotNav) => {
  dotNav.addEventListener('click', () => {
    const targetIndex = Number.parseInt(dotNav.dataset.idx ?? '0', 10);

    window.dispatchEvent(
      new CustomEvent('portfolio:request-morph', {
        detail: {
          index: Number.isNaN(targetIndex) ? 0 : targetIndex
        }
      })
    );
  });
});

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

if (portfolioSections.length) {
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    portfolioSections.forEach((section) => {
      section.classList.add('is-visible');
    });
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12
      }
    );

    portfolioSections.forEach((section) => {
      revealObserver.observe(section);
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
