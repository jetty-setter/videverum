document.documentElement.classList.add('js');

const body = document.body;
const scenes = [...document.querySelectorAll('.scene[data-scene-color]')];
const reveals = [...document.querySelectorAll('.scene-reveal')];
const depthItems = [...document.querySelectorAll('[data-depth]')];
const focusItems = [...document.querySelectorAll('[data-focus]')];
const introLinks = [...document.querySelectorAll('.intro-products a')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smoothstep = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

function hexToRgb(hex) {
  const value = hex.replace('#', '').trim();
  const normalized = value.length === 3
    ? value.split('').map((char) => char + char).join('')
    : value;
  const int = Number.parseInt(normalized, 16);
  if (!Number.isFinite(int)) return { r: 11, g: 11, b: 14 };
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255
  };
}

function mixColor(a, b, amount) {
  const t = clamp(amount);
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t)
  };
}

function rgbString(color) {
  return `rgb(${color.r} ${color.g} ${color.b})`;
}

const sceneData = scenes.map((scene) => ({
  element: scene,
  color: hexToRgb(scene.dataset.sceneColor || '#0b0b0e'),
  name: scene.dataset.sceneName || ''
}));

let anchors = [];
let frameRequested = false;
let previewColor = null;
let previewAmount = 0;

function measure() {
  anchors = sceneData.map(({ element }) => ({
    top: element.offsetTop,
    center: element.offsetTop + element.offsetHeight * 0.5
  }));
  requestRender();
}

function currentSceneColor() {
  if (!sceneData.length) return hexToRgb('#0b0b0e');
  const position = window.scrollY + window.innerHeight * 0.5;

  if (position <= anchors[0].center) return sceneData[0].color;

  for (let index = 0; index < anchors.length - 1; index += 1) {
    const start = anchors[index].center;
    const end = anchors[index + 1].center;
    if (position <= end) {
      const progress = smoothstep((position - start) / Math.max(1, end - start));
      return mixColor(sceneData[index].color, sceneData[index + 1].color, progress);
    }
  }

  return sceneData[sceneData.length - 1].color;
}

function updateDepth() {
  if (reducedMotion.matches) {
    depthItems.forEach((item) => item.style.setProperty('--parallax-y', '0px'));
    return;
  }

  const viewportCenter = window.innerHeight * 0.5;
  depthItems.forEach((item) => {
    const scene = item.closest('.scene');
    if (!scene) return;
    const rect = scene.getBoundingClientRect();
    const sceneCenter = rect.top + rect.height * 0.5;
    const progress = clamp((viewportCenter - sceneCenter) / Math.max(window.innerHeight, 1), -1, 1);
    const depth = Number.parseFloat(item.dataset.depth || '0');
    const offset = progress * depth;
    item.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`);
  });
}

function updateFocus() {
  if (reducedMotion.matches) {
    focusItems.forEach((item) => {
      item.style.setProperty('--focus-blur', '0px');
      item.style.setProperty('--focus-opacity', '1');
    });
    return;
  }

  const viewportCenter = window.innerHeight * 0.5;
  focusItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    const itemCenter = rect.top + rect.height * 0.5;
    const distance = Math.abs(itemCenter - viewportCenter);
    const focus = clamp(1 - distance / Math.max(window.innerHeight * 0.72, 1));
    const blur = (1 - focus) * 4.5;
    const opacity = 0.42 + focus * 0.58;
    item.style.setProperty('--focus-blur', `${blur.toFixed(2)}px`);
    item.style.setProperty('--focus-opacity', opacity.toFixed(3));
  });
}

function render() {
  frameRequested = false;
  let color = currentSceneColor();

  if (previewColor && previewAmount > 0) {
    color = mixColor(color, previewColor, previewAmount);
  }

  body.style.setProperty('--scene-bg', rgbString(color));
  updateDepth();
  updateFocus();
}

function requestRender() {
  if (frameRequested) return;
  frameRequested = true;
  window.requestAnimationFrame(render);
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('is-active');
  });
}, {
  threshold: 0.18,
  rootMargin: '-8% 0px -8% 0px'
});

reveals.forEach((item) => revealObserver.observe(item));

const previewColors = [sceneData[1]?.color, sceneData[2]?.color];
introLinks.forEach((link, index) => {
  const color = previewColors[index];
  if (!color) return;

  link.addEventListener('mouseenter', () => {
    previewColor = color;
    previewAmount = 0.24;
    requestRender();
  });
  link.addEventListener('focus', () => {
    previewColor = color;
    previewAmount = 0.24;
    requestRender();
  });
  link.addEventListener('mouseleave', () => {
    previewColor = null;
    previewAmount = 0;
    requestRender();
  });
  link.addEventListener('blur', () => {
    previewColor = null;
    previewAmount = 0;
    requestRender();
  });
});

window.addEventListener('scroll', requestRender, { passive: true });
window.addEventListener('resize', measure);
reducedMotion.addEventListener?.('change', requestRender);

measure();
