(() => {
  const workspace = document.querySelector('.workspace');
  const list = document.querySelector('.product-list');
  const products = [...document.querySelectorAll('.product[data-product]')];
  if (!workspace || !list || !products.length) return;

  function setActive(product) {
    if (!product) {
      workspace.dataset.active = 'none';
      return;
    }

    workspace.dataset.active = product.dataset.product || 'none';

    const listRect = list.getBoundingClientRect();
    const productRect = product.getBoundingClientRect();
    const center = productRect.top - listRect.top + productRect.height / 2;
    list.style.setProperty('--focus-y', `${center}px`);
  }

  products.forEach((product) => {
    product.addEventListener('pointerenter', () => setActive(product));
    product.addEventListener('focus', () => setActive(product));
    product.addEventListener('pointerleave', () => setActive(null));
    product.addEventListener('blur', () => setActive(null));
  });

  window.addEventListener('resize', () => {
    const activeName = workspace.dataset.active;
    if (!activeName || activeName === 'none') return;
    const active = products.find((product) => product.dataset.product === activeName);
    if (active) setActive(active);
  });
})();
