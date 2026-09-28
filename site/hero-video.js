(() => {
  const video = document.querySelector('.hero-video');
  const button = document.querySelector('.motion-control');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = false;
  let inView = true;

  function motionDisabled() {
    return reduced.matches;
  }

  function label() {
    button.textContent = video.paused ? 'Play motion' : 'Pause motion';
  }

  function sync() {
    const disabled = motionDisabled();

    video.hidden = disabled;
    button.hidden = disabled;

    if (disabled || userPaused || !inView || document.hidden) {
      video.pause();
      return;
    }

    if (!video.getAttribute('src')) {
      video.src = video.dataset.src;
    }

    video.play().catch(() => {
      // Mobile browsers can block autoplay in low-power/data-saving modes.
      // Keep the control visible so the visitor can start motion manually.
      label();
    });
  }

  button.addEventListener('click', () => {
    userPaused = !video.paused;
    sync();
  });

  video.addEventListener('play', label);
  video.addEventListener('pause', label);
  video.addEventListener('error', () => {
    video.hidden = true;
    button.hidden = true;
  });

  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    sync();
  }).observe(video.parentElement);

  sync();
})();
