/**
 * Gradual blur - a layered edge treatment.
 *
 * Adapted from the React "GradualBlur" component (github.com/ansh-dhanani) to this
 * site's stack: vanilla JS and CSS, no React, no bundler, no dependencies. The
 * component's listed `mathjs` dependency is not real; the original only uses `Math.pow`.
 *
 * Two mounts, because the two surfaces need different mechanisms:
 *
 *   Hero    - `backdrop-filter` over the Three.js canvas. There is real detail behind
 *             it, so blurring the backdrop works: measured 0.876 mean pixel change in
 *             the affected band against a 0.039 noise floor.
 *
 *   Cards   - the subpages sit on a smooth gradient, and blurring a smooth gradient
 *             returns the same gradient (measured 0.000, and still nothing at seven
 *             times the strength). So here each layer carries its own gradient and the
 *             ramp is what produces the visible soft edge. `backdrop-filter` is kept on
 *             the layers so the effect also softens anything textured that ends up
 *             behind a card later, but it is not what you are seeing today.
 *
 * Progressive enhancement throughout: overlays are created here rather than authored
 * into the markup, so without JavaScript every page renders exactly as before. Purely
 * decorative, so hidden from assistive technology.
 */

const CURVE = (p) => p * p * (3 - 2 * p); // smoothstep: eases rather than stepping

/**
 * Build a stack of layers whose blur ramps along `direction`.
 * `tint` optionally gives each layer its own gradient, for backgrounds with no detail.
 */
function buildLayers({ count, strength, tint = null }) {
  const fragment = document.createDocumentFragment();
  const step = 100 / count;

  for (let i = 1; i <= count; i += 1) {
    const progress = CURVE(i / count);
    const blur = 0.0625 * (progress * count + 1) * strength;

    // Soft shoulders either side of each band so neighbouring layers overlap and blend
    // instead of banding.
    const start = Math.round((step * i - step) * 10) / 10;
    const full = Math.round(step * i * 10) / 10;
    const fadeOut = Math.round((step * i + step) * 10) / 10;

    let stops = `transparent ${start}%, black ${full}%`;
    if (fadeOut <= 100) stops += `, transparent ${fadeOut}%`;

    const layer = document.createElement("div");
    layer.className = "gradual-blur-layer";
    layer.style.backdropFilter = `blur(${blur.toFixed(3)}rem)`;
    layer.style.webkitBackdropFilter = `blur(${blur.toFixed(3)}rem)`;
    layer.style.maskImage = `linear-gradient(to bottom, ${stops})`;
    layer.style.webkitMaskImage = `linear-gradient(to bottom, ${stops})`;

    if (tint) {
      // Each layer deepens slightly, so the stack reads as a ramp rather than a wash.
      const alpha = (progress * tint.alpha).toFixed(3);
      layer.style.background = `linear-gradient(to bottom, transparent, ${tint.color.replace(
        "ALPHA",
        alpha
      )})`;
    }

    fragment.appendChild(layer);
  }
  return fragment;
}

function overlay(height, layers) {
  const el = document.createElement("div");
  el.className = "gradual-blur";
  el.setAttribute("aria-hidden", "true");
  el.style.height = height;
  el.appendChild(layers);
  return el;
}

function mount() {
  // `backdrop-filter` is central to the hero variant; without it those layers are empty.
  const supported =
    CSS.supports("backdrop-filter", "blur(1px)") ||
    CSS.supports("-webkit-backdrop-filter", "blur(1px)");

  // Hero: blur the canvas behind it. Sits above the scene, below .ui-layer, so it never
  // touches the hero text.
  const anchor = document.querySelector(".grain-overlay");
  if (supported && document.body.classList.contains("landing-page") && anchor) {
    if (!document.querySelector(".gradual-blur")) {
      anchor.insertAdjacentElement(
        "afterend",
        overlay("22vh", buildLayers({ count: 5, strength: 1.6 }))
      );
    }
  }

  // Project cards: the ramp is carried by the layers themselves. The tint resolves to
  // the card's own background colour, so the bottom edge softens into the card rather
  // than introducing a new colour.
  document.querySelectorAll(".project-entry").forEach((card) => {
    if (card.querySelector(".gradual-blur")) return;
    card.appendChild(
      overlay(
        "4.5rem",
        buildLayers({
          count: 4,
          strength: 1.1,
          tint: { color: "rgba(20, 20, 20, ALPHA)", alpha: 0.5 },
        })
      )
    );
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
} else {
  mount();
}
