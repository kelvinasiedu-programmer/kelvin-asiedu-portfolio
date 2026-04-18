const blurLayer = document.querySelector('.layer-blur');
const morphNameEl = document.querySelector('#morph-name');
const morphCounterEl = document.querySelector('#morph-counter');
const morphProgressEl = document.querySelector('.morph-progress span');
const editorialSections = document.querySelectorAll('.editorial-section');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.body.classList.toggle('reduced-motion', prefersReducedMotion);

const setStaticHeroState = () => {
  if (blurLayer) {
    blurLayer.style.setProperty('--x', `${window.innerWidth * 0.5}px`);
    blurLayer.style.setProperty('--y', `${window.innerHeight * 0.2}px`);
  }

  if (morphNameEl) {
    morphNameEl.textContent = 'Interface';
  }

  if (morphCounterEl) {
    morphCounterEl.textContent = '01 / 04';
  }

  if (morphProgressEl) {
    morphProgressEl.style.width = '25%';
  }
};

setStaticHeroState();

if (blurLayer && !prefersReducedMotion) {
  const pointer = {
    currentX: window.innerWidth * 0.5,
    currentY: window.innerHeight * 0.2,
    targetX: window.innerWidth * 0.5,
    targetY: window.innerHeight * 0.2
  };

  let rafId = 0;

  const paint = () => {
    pointer.currentX += (pointer.targetX - pointer.currentX) * 0.12;
    pointer.currentY += (pointer.targetY - pointer.currentY) * 0.12;

    blurLayer.style.setProperty('--x', `${pointer.currentX}px`);
    blurLayer.style.setProperty('--y', `${pointer.currentY}px`);

    if (
      Math.abs(pointer.targetX - pointer.currentX) > 0.1 ||
      Math.abs(pointer.targetY - pointer.currentY) > 0.1
    ) {
      rafId = window.requestAnimationFrame(paint);
    } else {
      rafId = 0;
    }
  };

  const queuePaint = () => {
    if (!rafId) {
      rafId = window.requestAnimationFrame(paint);
    }
  };

  const syncTarget = (clientX, clientY) => {
    pointer.targetX = clientX;
    pointer.targetY = clientY;
    queuePaint();
  };

  window.addEventListener('pointermove', (event) => {
    syncTarget(event.clientX, event.clientY);
  });

  window.addEventListener('resize', () => {
    syncTarget(window.innerWidth * 0.5, window.innerHeight * 0.2);
  });
} else {
  window.addEventListener('resize', setStaticHeroState);
}

if (editorialSections.length) {
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    editorialSections.forEach((section) => {
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

    editorialSections.forEach((section) => {
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
