(() => {
  const field = document.querySelector('.field');
  if (!field) return;

  const controls = [...document.querySelectorAll('[data-mode-target]')];
  const modeButtons = [...document.querySelectorAll('.mode')];
  const states = {
    home: document.querySelector('.home-state'),
    rabbit: document.querySelector('.product-state--rabbit'),
    quic: document.querySelector('.product-state--quic'),
  };
  const validModes = new Set(Object.keys(states));

  function setMode(next, { updateHash = true } = {}) {
    if (!validModes.has(next)) next = 'home';
    field.dataset.mode = next;
    delete field.dataset.preview;

    Object.entries(states).forEach(([name, section]) => {
      if (!section) return;
      section.setAttribute('aria-hidden', name === next ? 'false' : 'true');
    });

    modeButtons.forEach((button) => {
      button.setAttribute('aria-pressed', button.dataset.modeTarget === next ? 'true' : 'false');
    });

    if (updateHash) {
      const hash = next === 'home' ? '' : `#${next}`;
      history.replaceState(null, '', `${location.pathname}${location.search}${hash}`);
    }
  }

  controls.forEach((control) => {
    control.addEventListener('click', (event) => {
      if (control.tagName === 'A') event.preventDefault();
      setMode(control.dataset.modeTarget);
    });
  });

  modeButtons.forEach((button) => {
    button.addEventListener('pointerenter', () => {
      if (field.dataset.mode === 'home') field.dataset.preview = button.dataset.modeTarget;
    });
    button.addEventListener('pointerleave', () => {
      delete field.dataset.preview;
    });
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' || event.key === 'ArrowUp') setMode('home');
    if (event.key === 'ArrowLeft') setMode('rabbit');
    if (event.key === 'ArrowRight') setMode('quic');
  });

  window.addEventListener('hashchange', () => {
    const next = location.hash.replace('#', '');
    setMode(next || 'home', { updateHash: false });
  });

  setMode(location.hash.replace('#', '') || 'home', { updateHash: false });
})();
