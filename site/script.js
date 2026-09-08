(() => {
  const crossing = document.querySelector('.crossing');
  if (!crossing) return;

  const controls = [...document.querySelectorAll('[data-view-target]')];
  const productControls = [...document.querySelectorAll('.vector')];
  const details = {
    rabbit: document.querySelector('.detail--rabbit'),
    quic: document.querySelector('.detail--quic'),
  };

  const validViews = new Set(['home', 'rabbit', 'quic']);

  function setView(next, { updateHash = true } = {}) {
    if (!validViews.has(next)) next = 'home';
    crossing.dataset.view = next;

    Object.entries(details).forEach(([name, section]) => {
      if (!section) return;
      section.setAttribute('aria-hidden', name === next ? 'false' : 'true');
    });

    productControls.forEach((control) => {
      control.setAttribute('aria-pressed', control.dataset.viewTarget === next ? 'true' : 'false');
    });

    if (updateHash) {
      const hash = next === 'home' ? '' : `#${next}`;
      history.replaceState(null, '', `${location.pathname}${location.search}${hash}`);
    }
  }

  controls.forEach((control) => {
    control.addEventListener('click', (event) => {
      if (control.matches('a')) event.preventDefault();
      setView(control.dataset.viewTarget);
    });
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' || event.key === 'ArrowUp') setView('home');
    if (event.key === 'ArrowLeft') setView('rabbit');
    if (event.key === 'ArrowRight') setView('quic');
  });

  window.addEventListener('hashchange', () => {
    const next = location.hash.replace('#', '');
    setView(next || 'home', { updateHash: false });
  });

  setView(location.hash.replace('#', '') || 'home', { updateHash: false });
})();
