(() => {
  const quiz = document.querySelector('#quiz');
  const loading = document.querySelector('#quiz-loading');
  const result = document.querySelector('#result');
  const form = document.querySelector('#quiz-form');
  const steps = [...document.querySelectorAll('.quiz-step')];
  const progressLabel = document.querySelector('#progress-label');
  const progressBar = document.querySelector('#progress-bar');
  const backButton = document.querySelector('#back-step');
  const nextButton = document.querySelector('#next-step');
  const message = document.querySelector('#form-message');
  let currentStep = 0;
  let transitioning = false;
  let openingQuiz = false;
  let resultObserversReady = false;
  const hero = document.querySelector('.hero');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const siteHeader = document.querySelector('.site-header');
  const updateHeaderScrollState = () => siteHeader.classList.toggle('is-scrolled', window.scrollY > 32);
  updateHeaderScrollState();
  window.addEventListener('scroll', updateHeaderScrollState, { passive: true });
  const focusHeading = (element) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const heading = element.querySelector('h2');
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  };

  const showStep = (index, direction = 1) => {
    currentStep = index;
    steps.forEach((step, stepIndex) => { step.hidden = stepIndex !== index; });
    progressLabel.textContent = `Вопрос 0${index + 1} / 0${steps.length}`;
    progressBar.style.width = `${((index + 1) / steps.length) * 100}%`;
    backButton.hidden = index === 0;
    nextButton.firstChild.textContent = index === steps.length - 1 ? 'Отправить ответы ' : 'Продолжить ';
    message.textContent = '';
    quiz.dataset.step = String(index + 1);
    document.querySelector('.visual-number').textContent = `0${index + 1}`;
    steps[index].classList.remove('step-enter', 'step-back', 'step-out');
    steps[index].classList.add(direction < 0 ? 'step-back' : 'step-enter');
    const legend = steps[index].querySelector('legend');
    legend.tabIndex = -1;
    legend.focus({ preventScroll: true });
    const image = document.querySelector('#context-image');
    image.src = index === 2 ? '../assets/label-wrap.webp' : '../assets/bottle-front.webp';
    image.alt = index === 2 ? 'Развёрнутая этикетка Инозитол KONONOV' : 'Банка Инозитол KONONOV';
    document.querySelector('#context-caption').textContent = index === 2 ? 'Сведения на этикетке' : 'KONONOV · 90 капсул';
  };

  const transitionTo = (index) => {
    if (transitioning) return;
    transitioning = true;
    nextButton.disabled = true;
    backButton.disabled = true;
    const direction = index < currentStep ? -1 : 1;
    steps[currentStep].classList.add('step-out');
    window.setTimeout(() => {
      steps[currentStep].classList.remove('step-out');
      showStep(index, direction);
      nextButton.disabled = false;
      backButton.disabled = false;
      transitioning = false;
    }, reducedMotion.matches ? 0 : 160);
  };

  const openQuiz = () => {
    if (openingQuiz) return;
    document.body.classList.add('quiz-active');
    const morphFromHero = !hero.hidden && !reducedMotion.matches;
    form.reset();
    nextButton.disabled = false;
    loading.hidden = true;
    document.querySelector('#lead-success').hidden = true;
    document.querySelector('#contact-error').textContent = '';
    result.hidden = true;
    quiz.hidden = morphFromHero;
    showStep(0);
    quiz.classList.remove('screen-enter', 'hero-next');
    if (morphFromHero) {
      openingQuiz = true;
      document.querySelector('#start-quiz').disabled = true;
      hero.classList.add('hero-transition');
      window.setTimeout(() => {
        hero.hidden = true;
        hero.classList.remove('hero-transition');
        document.body.classList.remove('opening-view');
        quiz.hidden = false;
        void quiz.offsetWidth;
        quiz.classList.add('hero-next');
        document.querySelector('#start-quiz').disabled = false;
        openingQuiz = false;
        focusHeading(quiz);
      }, 420);
      return;
    }
    hero.hidden = true;
    document.body.classList.remove('opening-view');
    quiz.hidden = false;
    quiz.classList.add('screen-enter');
    focusHeading(quiz);
  };

  const getAnswers = () => ({
    age: form.elements.age.value,
    wellbeing: form.elements.wellbeing.value,
    reason: form.elements.reason.value,
    focus: form.elements.focus.value,
  });

  const sectionOrder = ['composition', 'package', 'usage', 'documents', 'purchase'];
  const answerSectionMaps = {
    wellbeing: { steady: 'composition', attention: 'usage', exploring: 'composition' },
    reason: { women: 'usage', understand: 'composition', considering: 'purchase', curious: 'composition' },
    focus: { basics: 'composition', product: 'package', personal: 'usage' },
  };

  const setupResultMotion = () => {
    if (resultObserversReady) return;
    resultObserversReady = true;
    const revealItems = result.querySelectorAll('.result-section-heading, .info-card, .result-additional h3, .result-cta');
    const sticky = document.querySelector('#result-sticky');
    const resultHero = document.querySelector('#result-hero');
    const purchaseSection = document.querySelector('[data-section="purchase"]');
    if (!reducedMotion.matches && 'IntersectionObserver' in window) {
      revealItems.forEach(item => item.classList.add('result-reveal'));
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12 });
      revealItems.forEach(item => revealObserver.observe(item));

      let hasSeenHero = false;
      let heroVisible = true;
      let purchaseVisible = false;
      const syncSticky = () => { sticky.hidden = !hasSeenHero || heroVisible || purchaseVisible; };
      const heroObserver = new IntersectionObserver(([entry]) => {
        heroVisible = entry.isIntersecting;
        if (entry.isIntersecting) hasSeenHero = true;
        syncSticky();
      }, { threshold: 0.05 });
      const purchaseObserver = new IntersectionObserver(([entry]) => {
        purchaseVisible = entry.isIntersecting;
        syncSticky();
      }, { threshold: 0.12 });
      heroObserver.observe(resultHero);
      purchaseObserver.observe(purchaseSection);
    } else {
      revealItems.forEach(item => item.classList.add('is-visible'));
    }
  };

  const renderResult = (answers = {}) => {
    const cards = [...result.querySelectorAll('.info-card')];
    const primary = document.querySelector('#result-primary');
    const additionalWrap = document.querySelector('#result-additional-wrap');
    const additional = document.querySelector('#result-additional');
    const hasAnswers = Boolean(answers.age || answers.wellbeing || answers.reason || answers.focus);
    const promoted = [...new Set(Object.entries(answerSectionMaps)
      .map(([key, map]) => map[answers[key]])
      .filter(Boolean))];
    const visiblePrimary = hasAnswers && promoted.length
      ? promoted.map(section => cards.find(card => card.dataset.section === section)).filter(Boolean)
      : [...cards].sort((a, b) => sectionOrder.indexOf(a.dataset.section) - sectionOrder.indexOf(b.dataset.section));
    const visibleAdditional = hasAnswers
      ? [...cards].filter(card => !visiblePrimary.includes(card)).sort((a, b) => sectionOrder.indexOf(a.dataset.section) - sectionOrder.indexOf(b.dataset.section))
      : [];
    visiblePrimary.forEach(card => card.classList.add('is-priority'));
    visibleAdditional.forEach(card => card.classList.remove('is-priority'));
    primary.replaceChildren(...visiblePrimary);
    additional.replaceChildren(...visibleAdditional);
    additionalWrap.hidden = visibleAdditional.length === 0;
    result.dataset.format = answers.focus === 'basics' || answers.focus === 'overview' ? 'short' : 'detailed';
    quiz.hidden = true;
    document.body.classList.remove('quiz-active');
    result.hidden = false;
    hero.hidden = true;
    setupResultMotion();
    result.classList.remove('screen-enter');
    void result.offsetWidth;
    result.classList.add('screen-enter');
    focusHeading(result);
  };

  document.querySelector('#start-quiz').addEventListener('click', openQuiz);
  document.querySelector('#skip-quiz').addEventListener('click', () => {
    document.body.classList.remove('opening-view');
    renderResult({ format: 'detailed' });
  });
  document.querySelector('#skip-contact').addEventListener('click', () => renderResult(getAnswers()));

  const contactError = document.querySelector('#contact-error');
  const submitLead = async () => {
    const contact = form.elements.contact.value.trim();
    const consent = form.elements.consent.checked;
    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const phoneDigits = contact.replace(/\D/g, '');
    const looksLikePhone = phoneDigits.length >= 10 && phoneDigits.length <= 15;
    if (contact && !looksLikeEmail && !looksLikePhone) {
      contactError.textContent = 'Введите корректный телефон или адрес e-mail.';
      form.elements.contact.focus();
      return;
    }
    if (!consent) {
      contactError.textContent = 'Чтобы передать ответы команде, отметьте согласие. Или откройте информацию без отправки.';
      form.elements.consent.focus();
      return;
    }

    contactError.textContent = '';
    document.querySelector('#loading-description').textContent = contact
      ? 'Передаём ответы менеджеру вместе с вашим контактом и собираем выбранные разделы.'
      : 'Передаём команде только ответы — без телефона и почты — и собираем выбранные разделы.';
    nextButton.disabled = true;
    quiz.hidden = true;
    loading.hidden = false;
    focusHeading(loading);
    try {
      const response = await fetch('/api/quiz-leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          quizId: 'inositol-prelanding-v1',
          contact,
          consent,
          answers: getAnswers(),
        }),
      });
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(location.hostname === '127.0.0.1' || location.hostname === 'localhost'
          ? 'В локальном предпросмотре отправка заявок не подключена.'
          : 'Сервис отправки временно недоступен. Ответы не отправлены — попробуйте позже.');
      }
      let payload;
      try {
        payload = await response.json();
      } catch {
        throw new Error('Сервис отправки вернул некорректный ответ. Ответы не отправлены — попробуйте позже.');
      }
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Не удалось отправить анкету.');
      loading.hidden = true;
      const leadSuccess = document.querySelector('#lead-success');
      leadSuccess.textContent = contact
        ? 'Спасибо, ответы отправлены менеджерам. Они смогут связаться с вами по указанному контакту.'
        : 'Спасибо, ответы отправлены команде без контакта. Ответить вам напрямую не получится.';
      leadSuccess.hidden = false;
      renderResult(getAnswers());
    } catch (error) {
      loading.hidden = true;
      quiz.hidden = false;
      contactError.textContent = error.message || 'Не удалось отправить анкету. Попробуйте ещё раз или откройте информацию без контакта.';
      nextButton.disabled = false;
      form.elements.contact.focus();
    }
  };

  nextButton.addEventListener('click', () => {
    if (transitioning) return;
    if (currentStep === steps.length - 1) {
      submitLead();
      return;
    }
    const selected = steps[currentStep].querySelector('input:checked');
    if (!selected) {
      message.textContent = 'Выберите один вариант, чтобы продолжить.';
      steps[currentStep].querySelector('input').focus();
      return;
    }
    transitionTo(currentStep + 1);
  });

  backButton.addEventListener('click', () => {
    if (currentStep > 0) transitionTo(currentStep - 1);
  });
  form.addEventListener('submit', event => { event.preventDefault(); nextButton.click(); });

  document.querySelector('.brand').addEventListener('click', () => {
    document.body.classList.add('opening-view');
    hero.hidden = false;
    quiz.hidden = true;
    loading.hidden = true;
    result.hidden = true;
  });

  const product = document.querySelector('.hero-product');
  product.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || reducedMotion.matches) return;
    const rect = product.getBoundingClientRect();
    product.style.setProperty('--px', `${((event.clientX - rect.left) / rect.width - .5) * 5}px`);
    product.style.setProperty('--py', `${((event.clientY - rect.top) / rect.height - .5) * 5}px`);
  });
  product.addEventListener('pointerleave', () => {
    product.style.setProperty('--px', '0px');
    product.style.setProperty('--py', '0px');
  });

  form.addEventListener('change', () => {
    message.textContent = '';
    document.querySelector('#contact-error').textContent = '';
  });

  const dialog = document.querySelector('#label-dialog');
  document.querySelector('[data-dialog="label-dialog"]').addEventListener('click', () => dialog.showModal());
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
})();
