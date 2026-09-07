document.documentElement.classList.add('js');

const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];

function activate(product, options = {}) {
  const { focus = false, updateHash = true } = options;
  const targetTab = tabs.find((tab) => tab.dataset.product === product) || tabs[0];
  if (!targetTab) return;

  tabs.forEach((tab) => {
    const selected = tab === targetTab;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });

  panels.forEach((panel) => {
    const active = panel.dataset.product === targetTab.dataset.product;
    panel.classList.toggle('is-active', active);
    panel.hidden = !active;
  });

  if (updateHash && history.replaceState) {
    history.replaceState(null, '', `#${targetTab.dataset.product}`);
  }
  if (focus) targetTab.focus();
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activate(tab.dataset.product));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();

    let nextIndex = index;
    if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    else nextIndex = (index - 1 + tabs.length) % tabs.length;

    activate(tabs[nextIndex].dataset.product, { focus: true });
  });
});

const hashProduct = location.hash.replace('#', '');
activate(tabs.some((tab) => tab.dataset.product === hashProduct) ? hashProduct : tabs[0]?.dataset.product, { updateHash: false });
