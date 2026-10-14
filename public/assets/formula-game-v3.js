(() => {
  const visited = new Set();

  const enhanceSnapshot = () => {
    const section = document.querySelector('#formula');
    if (!section || section.dataset.gameReady === 'true') return;
    section.dataset.gameReady = 'true';

    const ledger = section.querySelector('.formula-ledger');
    const trigger = section.querySelector(':scope > .outline-button');

    if (ledger && !section.querySelector('.formula-compact-summary')) {
      const summary = document.createElement('div');
      summary.className = 'formula-compact-summary';
      summary.innerHTML = '<span>5</span> компонентов · точные дозировки с этикетки';
      ledger.parentNode.insertBefore(summary, ledger);
    }

    if (trigger) {
      if (!section.querySelector('.formula-game-subhint')) {
        const hint = document.createElement('span');
        hint.className = 'formula-game-subhint';
        hint.textContent = 'Нажимайте компоненты и открывайте их по одному';
        trigger.insertAdjacentElement('afterend', hint);
      }
    }
  };

  const indexOfButton = (button) => {
    const orbit = button.className.match(/orbit-(\d)/);
    if (orbit) return Number(orbit[1]);
    const nav = button.closest('.formula-nav');
    return nav ? [...nav.querySelectorAll('button')].indexOf(button) : -1;
  };

  const updateGame = (dialog) => {
    const dots = dialog.querySelectorAll('.formula-game-dot');
    dots.forEach((dot, index) => dot.classList.toggle('is-seen', visited.has(index)));
    dialog.querySelectorAll('.orbit-item').forEach((button, index) => button.classList.toggle('game-seen', visited.has(index)));
    dialog.querySelectorAll('.formula-nav button').forEach((button, index) => button.classList.toggle('game-seen', visited.has(index)));

    const message = dialog.querySelector('.formula-game-message');
    if (message) {
      message.textContent = visited.size === 0
        ? 'Выберите первый компонент'
        : visited.size < 5
          ? `Открыто ${visited.size} из 5 · осталось ${5 - visited.size}`
          : 'Все компоненты открыты';
    }

    let complete = dialog.querySelector('.formula-complete-card');
    if (visited.size === 5 && !complete) {
      complete = document.createElement('div');
      complete.className = 'formula-complete-card';
      complete.innerHTML = '<small>Формула собрана ✦</small><strong>5 компонентов в одном ритуале</strong><span>Суточная порция по этикетке · 2 капсулы</span>';
      const legal = dialog.querySelector('.formula-legal');
      (legal?.parentNode || dialog).insertBefore(complete, legal || null);
    }
  };

  const enhanceDialog = () => {
    const dialog = document.querySelector('.formula-dialog');
    if (!dialog) return;

    const info = dialog.querySelector('.formula-info');
    const progress = dialog.querySelector('.formula-progress');
    if (info && progress && !dialog.querySelector('.formula-game-dots')) {
      const dots = document.createElement('div');
      dots.className = 'formula-game-dots';
      dots.setAttribute('aria-hidden', 'true');
      dots.innerHTML = Array.from({ length: 5 }, (_, index) => `<i class="formula-game-dot" data-step="${index}"></i>`).join('');
      progress.insertAdjacentElement('afterend', dots);

      const message = document.createElement('p');
      message.className = 'formula-game-message';
      dots.insertAdjacentElement('afterend', message);
    }

    dialog.querySelectorAll('.orbit-item, .formula-nav button').forEach((button) => {
      if (button.dataset.gameBound === 'true') return;
      button.dataset.gameBound = 'true';
      button.addEventListener('click', () => {
        const index = indexOfButton(button);
        if (index >= 0) visited.add(index);
        updateGame(dialog);
      });
    });

    updateGame(dialog);
  };

  const enhance = () => {
    enhanceSnapshot();
    enhanceDialog();
  };

  let scheduled = false;
  const scheduleEnhance = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      enhance();
    });
  };

  const start = () => {
    enhance();
    new MutationObserver(scheduleEnhance).observe(document.documentElement, { childList: true, subtree: true });
  };

  if (document.readyState === 'complete') {
    window.setTimeout(start, 1200);
  } else {
    window.addEventListener('load', () => window.setTimeout(start, 1200), { once: true });
  }
})();
