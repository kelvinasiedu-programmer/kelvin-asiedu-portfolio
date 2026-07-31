/**
 * GradualBlur - a faithful vanilla port of the React Bits component.
 *
 * Original: github.com/ansh-dhanani. Ported to this site's stack (no React, no bundler,
 * no dependencies). The component's listed `mathjs` dependency is not real; the original
 * only ever calls `Math.pow`.
 *
 * The layer maths, curve functions, presets and defaults below match the original
 * exactly, including the four-stop mask gradient (`transparent, black, black,
 * transparent`) whose second `black` stop gives each layer a plateau at full opacity
 * before it fades. Dropping that stop, as an earlier version of this file did, narrows
 * every band and visibly weakens the ramp.
 *
 * Usage is declarative, since there is no JSX here. Any element carrying
 * `data-gradual-blur` gets an overlay; props map to `data-*` attributes:
 *
 *   <div data-gradual-blur data-position="bottom" data-strength="2"
 *        data-div-count="5" data-curve="bezier" data-exponential="true"></div>
 *
 * Or call mountGradualBlur(el, { ...props }) directly.
 *
 * ONE ADDITION beyond the original API: `tint`. `backdrop-filter` blurs whatever is
 * painted behind an element, so on a flat or smoothly-graded background it has nothing
 * to act on - measured at 0.000 mean pixel change on this site's project cards, and
 * still nothing at seven times the strength. `tint` gives each layer its own gradient so
 * the ramp itself is visible there. It is not part of the upstream component and is
 * unnecessary anywhere with real detail behind it, such as the hero canvas.
 */

const DEFAULT_CONFIG = {
  position: "bottom",
  strength: 2,
  height: "6rem",
  width: null,
  divCount: 5,
  exponential: false,
  zIndex: 1000,
  animated: false,
  duration: "0.3s",
  easing: "ease-out",
  opacity: 1,
  curve: "linear",
  responsive: false,
  target: "parent",
  hoverIntensity: null,
  tint: null,
  className: "",
  onAnimationComplete: null,
};

const PRESETS = {
  top: { position: "top", height: "6rem" },
  bottom: { position: "bottom", height: "6rem" },
  left: { position: "left", height: "6rem" },
  right: { position: "right", height: "6rem" },
  subtle: { height: "4rem", strength: 1, opacity: 0.8, divCount: 3 },
  intense: { height: "10rem", strength: 4, divCount: 8, exponential: true },
  smooth: { height: "8rem", curve: "bezier", divCount: 10 },
  sharp: { height: "5rem", curve: "linear", divCount: 4 },
  header: { position: "top", height: "8rem", curve: "ease-out" },
  footer: { position: "bottom", height: "8rem", curve: "ease-out" },
  sidebar: { position: "left", height: "6rem", strength: 2.5 },
  "page-header": { position: "top", height: "10rem", target: "page", strength: 3 },
  "page-footer": { position: "bottom", height: "10rem", target: "page", strength: 3 },
};

const CURVE_FUNCTIONS = {
  linear: (p) => p,
  bezier: (p) => p * p * (3 - 2 * p),
  "ease-in": (p) => p * p,
  "ease-out": (p) => 1 - Math.pow(1 - p, 2),
  "ease-in-out": (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
};

const GRADIENT_DIRECTION = {
  top: "to top",
  bottom: "to bottom",
  left: "to left",
  right: "to right",
};

const mergeConfigs = (...configs) => Object.assign({}, ...configs);

const debounce = (fn, wait) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
};

/** Read `data-*` props off the host element, coercing to the types the config expects. */
function readDataProps(el) {
  const d = el.dataset;
  const props = {};
  const num = (v) => (v === undefined || v === "" ? undefined : Number(v));
  const bool = (v) => (v === undefined ? undefined : v !== "false");

  if (d.preset) props.preset = d.preset;
  if (d.position) props.position = d.position;
  if (d.height) props.height = d.height;
  if (d.width) props.width = d.width;
  if (d.curve) props.curve = d.curve;
  if (d.duration) props.duration = d.duration;
  if (d.easing) props.easing = d.easing;
  if (d.target) props.target = d.target;
  if (d.tint) props.tint = d.tint;
  if (d.className) props.className = d.className;
  if (d.strength !== undefined) props.strength = num(d.strength);
  if (d.divCount !== undefined) props.divCount = num(d.divCount);
  if (d.opacity !== undefined) props.opacity = num(d.opacity);
  if (d.zIndex !== undefined) props.zIndex = num(d.zIndex);
  if (d.hoverIntensity !== undefined) props.hoverIntensity = num(d.hoverIntensity);
  if (d.exponential !== undefined) props.exponential = bool(d.exponential);
  if (d.responsive !== undefined) props.responsive = bool(d.responsive);
  if (d.animated !== undefined) props.animated = d.animated === "scroll" ? "scroll" : bool(d.animated);
  return props;
}

/** Responsive override lookup, matching the original's mobile/tablet/desktop keys. */
function responsiveValue(config, key) {
  if (!config.responsive) return config[key];
  const capped = key[0].toUpperCase() + key.slice(1);
  const w = window.innerWidth;
  if (w <= 480 && config[`mobile${capped}`]) return config[`mobile${capped}`];
  if (w <= 768 && config[`tablet${capped}`]) return config[`tablet${capped}`];
  if (w <= 1024 && config[`desktop${capped}`]) return config[`desktop${capped}`];
  return config[key];
}

function buildLayers(config, hovered) {
  const fragment = document.createDocumentFragment();
  const increment = 100 / config.divCount;
  const strength =
    hovered && config.hoverIntensity ? config.strength * config.hoverIntensity : config.strength;
  const curveFunc = CURVE_FUNCTIONS[config.curve] || CURVE_FUNCTIONS.linear;
  const direction = GRADIENT_DIRECTION[config.position] || "to bottom";

  for (let i = 1; i <= config.divCount; i += 1) {
    const progress = curveFunc(i / config.divCount);

    const blurValue = config.exponential
      ? Math.pow(2, progress * 4) * 0.0625 * strength
      : 0.0625 * (progress * config.divCount + 1) * strength;

    // Four stops, as upstream: a plateau at full opacity between p2 and p3 before the
    // fade to p4. The plateau is what makes neighbouring layers overlap smoothly.
    const p1 = Math.round((increment * i - increment) * 10) / 10;
    const p2 = Math.round(increment * i * 10) / 10;
    const p3 = Math.round((increment * i + increment) * 10) / 10;
    const p4 = Math.round((increment * i + increment * 2) * 10) / 10;

    let gradient = `transparent ${p1}%, black ${p2}%`;
    if (p3 <= 100) gradient += `, black ${p3}%`;
    if (p4 <= 100) gradient += `, transparent ${p4}%`;

    const layer = document.createElement("div");
    layer.style.position = "absolute";
    layer.style.inset = "0";
    layer.style.maskImage = `linear-gradient(${direction}, ${gradient})`;
    layer.style.webkitMaskImage = `linear-gradient(${direction}, ${gradient})`;
    layer.style.backdropFilter = `blur(${blurValue.toFixed(3)}rem)`;
    layer.style.webkitBackdropFilter = `blur(${blurValue.toFixed(3)}rem)`;
    layer.style.opacity = String(config.opacity);
    if (config.animated && config.animated !== "scroll") {
      layer.style.transition = `backdrop-filter ${config.duration} ${config.easing}`;
    }
    if (config.tint) {
      // Not upstream: see the note at the top of this file.
      layer.style.background = `linear-gradient(${direction}, transparent, ${config.tint})`;
    }
    fragment.appendChild(layer);
  }
  return fragment;
}

function applyContainerStyle(container, config, visible) {
  const isVertical = config.position === "top" || config.position === "bottom";
  const isHorizontal = config.position === "left" || config.position === "right";
  const isPage = config.target === "page";
  const height = responsiveValue(config, "height");
  const width = responsiveValue(config, "width");

  const s = container.style;
  s.position = isPage ? "fixed" : "absolute";
  s.pointerEvents = config.hoverIntensity ? "auto" : "none";
  // Only claim `opacity` when the reveal actually needs it. Upstream always writes it,
  // which is harmless in React but here an inline value outranks any stylesheet rule -
  // silently killing CSS-driven states such as the cards' hover ramp.
  if (config.animated) {
    s.opacity = visible ? "1" : "0";
    s.transition = `opacity ${config.duration} ${config.easing}`;
  }
  s.zIndex = String(isPage ? config.zIndex + 100 : config.zIndex);

  if (isVertical) {
    s.height = height;
    s.width = width || "100%";
    s.left = "0";
    s.right = "0";
    s.top = config.position === "top" ? "0" : "";
    s.bottom = config.position === "bottom" ? "0" : "";
  } else if (isHorizontal) {
    s.width = width || height;
    s.height = "100%";
    s.top = "0";
    s.bottom = "0";
    s.left = config.position === "left" ? "0" : "";
    s.right = config.position === "right" ? "0" : "";
  }
}

export function mountGradualBlur(host, props = {}) {
  const preset = props.preset && PRESETS[props.preset] ? PRESETS[props.preset] : {};
  const config = mergeConfigs(DEFAULT_CONFIG, preset, props);

  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true"); // decorative
  container.className = [
    "gradual-blur",
    config.target === "page" ? "gradual-blur-page" : "gradual-blur-parent",
    config.className,
  ]
    .filter(Boolean)
    .join(" ");

  const inner = document.createElement("div");
  inner.className = "gradual-blur-inner";
  container.appendChild(inner);

  let hovered = false;
  const render = () => {
    inner.replaceChildren(buildLayers(config, hovered));
  };

  // `animated: 'scroll'` starts hidden and reveals on intersection, as upstream.
  let visible = config.animated !== "scroll";
  applyContainerStyle(container, config, visible);
  render();

  if (config.hoverIntensity) {
    container.addEventListener("mouseenter", () => {
      hovered = true;
      render();
    });
    container.addEventListener("mouseleave", () => {
      hovered = false;
      render();
    });
  }

  if (config.responsive) {
    window.addEventListener(
      "resize",
      debounce(() => applyContainerStyle(container, config, visible), 100)
    );
  }

  host.appendChild(container);

  if (config.animated === "scroll" && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        applyContainerStyle(container, config, visible);
        if (visible && config.onAnimationComplete) {
          setTimeout(config.onAnimationComplete, parseFloat(config.duration) * 1000);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(container);
  }

  return container;
}

function autoMount() {
  document.querySelectorAll("[data-gradual-blur]").forEach((host) => {
    if (host.querySelector(":scope > .gradual-blur")) return;
    mountGradualBlur(host, readDataProps(host));
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoMount, { once: true });
} else {
  autoMount();
}

export { PRESETS, CURVE_FUNCTIONS };
