(() => {
  const world = document.querySelector('.world');
  if (!world) return;

  const controls = [...document.querySelectorAll('[data-view-target]')];
  const views = {
    origin: document.querySelector('.view--origin'),
    rabbit: document.querySelector('.view--rabbit'),
    quic: document.querySelector('.view--quic'),
  };

  const validViews = new Set(Object.keys(views));

  function setView(next, { updateHash = true } = {}) {
    if (!validViews.has(next)) next = 'origin';
    world.dataset.view = next;

    Object.entries(views).forEach(([name, section]) => {
      if (!section) return;
      section.setAttribute('aria-hidden', name === next ? 'false' : 'true');
    });

    controls.forEach((control) => {
      if (control.classList.contains('identity')) return;
      control.setAttribute('aria-pressed', control.dataset.viewTarget === next ? 'true' : 'false');
    });

    if (updateHash) {
      const hash = next === 'origin' ? '' : `#${next}`;
      history.replaceState(null, '', `${location.pathname}${location.search}${hash}`);
    }
  }

  controls.forEach((control) => {
    control.addEventListener('click', () => setView(control.dataset.viewTarget));
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setView('origin');
    if (event.key === 'ArrowLeft') setView('rabbit');
    if (event.key === 'ArrowRight') setView('quic');
  });

  window.addEventListener('hashchange', () => {
    const next = location.hash.replace('#', '');
    setView(next || 'origin', { updateHash: false });
  });

  setView(location.hash.replace('#', '') || 'origin', { updateHash: false });
})();
