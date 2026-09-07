document.documentElement.classList.add('js');

const body = document.body;
const scenes = [...document.querySelectorAll('[data-scene-target]')];
const reveals = [...document.querySelectorAll('.reveal')];

const sceneObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

  if (visible) {
    body.dataset.scene = visible.target.dataset.sceneTarget || 'intro';
  }
}, {
  threshold: [0.25, 0.45, 0.65],
  rootMargin: '-18% 0px -18% 0px'
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('is-active');
  });
}, { threshold: 0.3 });

scenes.forEach((scene) => sceneObserver.observe(scene));
reveals.forEach((item) => revealObserver.observe(item));

if (scenes[0]) body.dataset.scene = scenes[0].dataset.sceneTarget || 'intro';
