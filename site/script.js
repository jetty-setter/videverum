(() => {
  const products = [...document.querySelectorAll('[data-product]')];
  if (!products.length) return;

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!canHover) return;

  products.forEach((product) => {
    product.addEventListener('pointermove', (event) => {
      const rect = product.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
      product.style.setProperty('--sweep-x', `${(x / rect.width) * 100}%`);
    });

    product.addEventListener('pointerleave', () => {
      product.style.setProperty('--sweep-x', '0%');
    });
  });
})();
