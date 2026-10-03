(() => {
  const enhance = () => {
    const track = document.querySelector('.review-rail');
    if (!track || track.dataset.carouselReady === 'true') return;

    track.dataset.carouselReady = 'true';
    track.setAttribute('role', 'region');
    track.setAttribute('aria-label', 'Отзывы покупательниц');
    track.setAttribute('tabindex', '0');

    const controls = document.createElement('div');
    controls.className = 'review-carousel-controls';
    controls.innerHTML = [
      '<span class="review-carousel-hint">Листайте отзывы вправо</span>',
      '<button type="button" class="review-carousel-prev" aria-label="Предыдущий отзыв">←</button>',
      '<button type="button" class="review-carousel-next" aria-label="Следующий отзыв">→</button>'
    ].join('');

    track.parentNode.insertBefore(controls, track);
    const previous = controls.querySelector('.review-carousel-prev');
    const next = controls.querySelector('.review-carousel-next');

    const step = () => {
      const card = track.querySelector('.review-card');
      if (!card) return track.clientWidth * 0.9;
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      return card.getBoundingClientRect().width + gap;
    };

    const update = () => {
      const end = track.scrollWidth - track.clientWidth;
      previous.disabled = track.scrollLeft <= 3;
      next.disabled = track.scrollLeft >= end - 3;
    };

    previous.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    requestAnimationFrame(update);
  };

  const start = () => {
    enhance();
    new MutationObserver(enhance).observe(document.documentElement, { childList: true, subtree: true });
  };

  if (document.readyState === 'complete') {
    window.setTimeout(start, 1200);
  } else {
    window.addEventListener('load', () => window.setTimeout(start, 1200), { once: true });
  }
})();
