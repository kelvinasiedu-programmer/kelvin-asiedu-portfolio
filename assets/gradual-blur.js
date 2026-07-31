/**
 * Gradual blur - a layered blur that ramps up toward the bottom of the hero.
 *
 * Adapted from the React "GradualBlur" component (github.com/ansh-dhanani) to this
 * site's stack: no React, no bundler, no dependencies. The component's listed `mathjs`
 * dependency is not required; the original only ever used `Math.pow`.
 *
 * The effect is a stack of layers, each with a stronger `backdrop-filter` and a
 * `mask-image` window exposing only its own band, so the blur ramps smoothly instead of
 * stepping.
 *
 * Why the hero and not the project cards: `backdrop-filter` blurs whatever is painted
 * behind it, and the subpages sit on a smooth gradient. Blurring a smooth gradient
 * returns the same gradient - measured at 0.000 mean pixel change on the cards, and
 * still imperceptible at seven times this strength. The hero has the Three.js canvas
 * behind it, which is real detail, so the effect is visible there and nowhere else.
 *
 * Progressive enhancement: the overlay is created here rather than authored into the
 * markup, so without JavaScript the page renders exactly as before. It is decorative and
 * hidden from assistive technology.
 */

const LAYERS = 5;
const STRENGTH = 1.6;
const HEIGHT = "22vh";

/** Smoothstep, so the ramp eases rather than stepping linearly. */
const curve = (p) => p * p * (3 - 2 * p);

function buildLayers() {
  const fragment = document.createDocumentFragment();
  const step = 100 / LAYERS;

  for (let i = 1; i <= LAYERS; i += 1) {
    const progress = curve(i / LAYERS);
    const blur = 0.0625 * (progress * LAYERS + 1) * STRENGTH;

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
    fragment.appendChild(layer);
  }
  return fragment;
}

function mount() {
  // `backdrop-filter` is the whole effect; without it these would be empty divs.
  const supported =
    CSS.supports("backdrop-filter", "blur(1px)") ||
    CSS.supports("-webkit-backdrop-filter", "blur(1px)");
  if (!supported) return;

  // Only where there is something to blur: the hero canvas lives on the landing page.
  const anchor = document.querySelector(".grain-overlay");
  if (!document.body.classList.contains("landing-page") || !anchor) return;
  if (document.querySelector(".gradual-blur")) return;

  const overlay = document.createElement("div");
  overlay.className = "gradual-blur";
  overlay.setAttribute("aria-hidden", "true");
  overlay.style.height = HEIGHT;
  overlay.appendChild(buildLayers());

  // After the grain overlay so it composites above the canvas, but the stylesheet keeps
  // it below the UI layer: this must never blur the hero text.
  anchor.insertAdjacentElement("afterend", overlay);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
} else {
  mount();
}
