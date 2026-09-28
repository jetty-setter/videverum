(() => {
  const video = document.querySelector('.hero-video');
  const button = document.querySelector('.motion-control');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 700px)');
  let userPaused = false, inView = true;
  const still = () => reduced.matches || mobile.matches;
  function label() { button.textContent = video.paused ? 'Play motion' : 'Pause motion'; }
  function sync() {
    video.hidden = still();
    button.hidden = still();
    if (still() || userPaused || !inView || document.hidden) { video.pause(); return; }
    if (!video.getAttribute('src')) video.src = video.dataset.src;
    video.play().catch(label);
  }
  button.addEventListener('click', () => { userPaused = !video.paused; sync(); });
  video.addEventListener('play', label);
  video.addEventListener('pause', label);
  video.addEventListener('error', () => { video.hidden = true; button.hidden = true; });
  reduced.addEventListener('change', sync);
  mobile.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }).observe(video.parentElement);
  sync();
})();
