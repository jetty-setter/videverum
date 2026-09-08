(() => {
  const products = [...document.querySelectorAll('.product[data-product]')];
  if (!products.length) return;

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function setActive(name = 'none') {
    document.body.dataset.active = name;
  }

  products.forEach((product) => {
    const name = product.dataset.product || 'none';
    const windowEl = product.querySelector('.name-window');

    product.addEventListener('pointerenter', () => setActive(name));
    product.addEventListener('focus', () => setActive(name));
    product.addEventListener('pointerleave', () => {
      setActive('none');
      product.style.setProperty('--reveal', '0%');
    });
    product.addEventListener('blur', () => {
      setActive('none');
      product.style.setProperty('--reveal', '0%');
    });

    if (canHover && windowEl) {
      product.addEventListener('pointermove', (event) => {
        const rect = windowEl.getBoundingClientRect();
        const x = Math.min(rect.width, Math.max(0, event.clientX - rect.left));
        product.style.setProperty('--reveal', `${(x / rect.width) * 100}%`);
      });
    }
  });
})();
