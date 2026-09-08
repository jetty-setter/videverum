(() => {
  const stage = document.querySelector('.type-stage');
  const products = [...document.querySelectorAll('.product[data-product]')];
  if (!stage || !products.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setActive(name = 'none') {
    stage.dataset.active = name;
  }

  products.forEach((product) => {
    const name = product.dataset.product;

    product.addEventListener('pointerenter', () => setActive(name));
    product.addEventListener('focus', () => setActive(name));
    product.addEventListener('pointerleave', () => setActive('none'));
    product.addEventListener('blur', () => setActive('none'));
  });

  if (!reduceMotion) {
    stage.addEventListener('pointermove', (event) => {
      const rect = stage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      stage.style.setProperty('--mx', `${x * 18}px`);
      stage.style.setProperty('--my', `${y * 18}px`);
    });

    stage.addEventListener('pointerleave', () => {
      stage.style.setProperty('--mx', '0px');
      stage.style.setProperty('--my', '0px');
    });
  }
})();
