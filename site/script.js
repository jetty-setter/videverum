(() => {
  const stage = document.querySelector('.stage');
  if (!stage) return;

  const controls = [...document.querySelectorAll('[data-view-target]')];
  const views = {
    origin: document.querySelector('.state--origin'),
    rabbit: document.querySelector('.state--rabbit'),
    quic: document.querySelector('.state--quic'),
  };
  const validViews = new Set(Object.keys(views));

  function setView(next, { updateHash = true } = {}) {
    if (!validViews.has(next)) next = 'origin';
    stage.dataset.view = next;

    Object.entries(views).forEach(([name, section]) => {
      if (!section) return;
      section.setAttribute('aria-hidden', name === next ? 'false' : 'true');
    });

    controls.forEach((control) => {
      const active = control.dataset.viewTarget === next;
      if (control.matches('.mark-hit')) {
        control.setAttribute('aria-pressed', active ? 'true' : 'false');
      }
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
    if (event.key === 'Escape' || event.key === 'ArrowUp') setView('origin');
    if (event.key === 'ArrowLeft') setView('rabbit');
    if (event.key === 'ArrowRight') setView('quic');
  });

  window.addEventListener('hashchange', () => {
    const next = location.hash.replace('#', '');
    setView(next || 'origin', { updateHash: false });
  });

  setView(location.hash.replace('#', '') || 'origin', { updateHash: false });
})();
