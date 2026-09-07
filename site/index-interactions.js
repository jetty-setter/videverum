const body = document.body;
const context = document.querySelector('.context');
const kicker = document.querySelector('.context-kicker');
const title = document.querySelector('.context-title');
const copy = document.querySelector('.context-body');
const productItems = [...document.querySelectorAll('.product-item')];
const aboutDialog = document.querySelector('#about-dialog');
const aboutTrigger = document.querySelector('.about-trigger');
const closeDialog = document.querySelector('.close-dialog');

const defaultContext = {
  mode: 'default',
  kicker: 'VideVerum',
  title: 'Different products. Their own direction.',
  body: 'VideVerum is an independent software company built to give distinct applications a shared home without forcing them into the same category, audience, or identity.'
};

const contexts = {
  rabbit: {
    mode: 'rabbit',
    kicker: 'Public application',
    title: 'Made for getting a little lost.',
    body: 'RabbitHole is built around curiosity and discovery: follow whatever catches your attention and see where it leads.'
  },
  quic: {
    mode: 'quic',
    kicker: 'Research software',
    title: 'Bring the experiment into focus.',
    body: 'QuicLens supports RT-QuIC and neurodegenerative disease studies with assay review, data interpretation, and experimental context in one workspace.'
  }
};

function renderContext(next) {
  body.dataset.mode = next.mode;
  if (!context) return;

  context.classList.remove('is-changing');
  void context.offsetWidth;
  kicker.textContent = next.kicker;
  title.textContent = next.title;
  copy.textContent = next.body;
  context.classList.add('is-changing');
}

function activate(item) {
  const key = item?.dataset.product;
  renderContext(contexts[key] || defaultContext);
}

productItems.forEach((item) => {
  item.addEventListener('mouseenter', () => activate(item));
  item.addEventListener('focus', () => activate(item));
  item.addEventListener('mouseleave', () => {
    if (!document.activeElement?.classList?.contains('product-item')) {
      renderContext(defaultContext);
    }
  });
  item.addEventListener('blur', () => renderContext(defaultContext));
});

aboutTrigger?.addEventListener('click', () => aboutDialog?.showModal());
closeDialog?.addEventListener('click', () => aboutDialog?.close());
aboutDialog?.addEventListener('click', (event) => {
  if (event.target === aboutDialog) aboutDialog.close();
});

renderContext(defaultContext);
