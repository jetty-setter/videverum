(() => {
  const video = document.querySelector('.hero-video');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let inView = true;

  function motionDisabled() {
    return reduced.matches;
  }

  function sync() {
    const disabled = motionDisabled();
    video.hidden = disabled;

    if (disabled || !inView || document.hidden) {
      video.pause();
      return;
    }

    if (!video.getAttribute('src')) {
      video.src = video.dataset.src;
    }

    video.playbackRate = 0.8;
    video.play().catch(() => {
      video.hidden = true;
    });
  }

  video.addEventListener('loadedmetadata', () => {
    video.playbackRate = 0.8;
  });

  video.addEventListener('error', () => {
    video.hidden = true;
  });

  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    sync();
  }).observe(video.parentElement);

  sync();
})();
