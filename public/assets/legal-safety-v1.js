(() => {
  const product = {
    shelfLife: "1 год с даты изготовления",
  };

  const safeReviews = [
    "Принимаю уже месяц. Выбрала этот комплекс под свои потребности; формат понятный и удобный. Планирую заказать снова 🤍",
    "Инозитол принимаю не первый год. В этом комплексе мне нравятся понятный состав и удобный формат капсул — один из моих постоянных продуктов.",
    "Заказываю продукцию KONONOV уже не первый раз. Всё нравится, формат удобный. Инозитол тоже понравился — буду брать ещё!",
    "Муж порекомендовал бренд KONONOV. Берём уже не первый раз — всё удобно и понятно. Очень довольна выбором!",
    "Муж посоветовал попробовать KONONOV. Теперь берём не первый раз — продукт удобно вписался в мою ежедневную рутину.",
    "Инозитол принимаю уже несколько недель. Удобный формат стал приятной частью моей ежедневной рутины 🤍",
    "Очень довольна инозитолом: удобный формат, всё понятно по составу и способу применения.",
    "Принимаю уже не первую неделю. Удобно: капсулы легко вписались в утренний режим. Баночка почти закончилась — планирую брать ещё!",
  ];

  const addWarning = () => {
    if (document.querySelector(".bad-warning")) return;
    const anchor = document.querySelector(".confidence-strip") || document.querySelector(".hero");
    if (!anchor) return;
    const warning = document.createElement("section");
    warning.className = "bad-warning";
    warning.setAttribute("aria-label", "Обязательная информация о продукте");
    warning.innerHTML = `
      <span>i</span>
      <div><strong>Биологически активная добавка к пище. Не является лекарственным средством.</strong><p>Есть противопоказания. Перед применением рекомендуется проконсультироваться с врачом.</p></div>
      <a href="#product-passport">Документы и маркировка</a>`;
    anchor.insertAdjacentElement("afterend", warning);
  };

  const sanitizeReviews = () => {
    const reviews = document.querySelector(".reviews");
    if (reviews && reviews.dataset.safeCopy !== "true") {
      reviews.querySelectorAll(".review-card blockquote").forEach((quote, index) => {
        if (safeReviews[index]) quote.textContent = `«${safeReviews[index]}»`;
      });
      const heading = reviews.querySelector(".reviews-heading h2");
      if (heading) heading.innerHTML = `Отзывы о выборе<br><i>KONONOV.</i>`;
      const count = reviews.querySelector(".rating-summary > b");
      if (count) count.remove();
      const disclaimer = reviews.querySelector(".review-disclaimer");
      if (disclaimer) disclaimer.textContent = "Отзывы отражают личное мнение покупателей о продукте и опыте заказа. БАД не является лекарственным средством; результаты индивидуальны.";
      reviews.dataset.safeCopy = "true";
    }
    const navReview = document.querySelector('nav a[href="#reviews"]');
    if (navReview) {
      navReview.href = "#reviews";
      if (navReview.textContent !== "Отзывы") navReview.textContent = "Отзывы";
    }
    const rating = document.querySelector(".hero-rating-link");
    if (rating) {
      rating.href = "#reviews";
      rating.setAttribute("aria-label", "Перейти к отзывам покупателей");
      const markup = `<span>★★★★★</span><strong>4,9</strong><i>Отзывы покупателей</i>`;
      if (rating.innerHTML !== markup) rating.innerHTML = markup;
    }
  };

  const addProductPassport = () => {
    if (document.querySelector("#product-passport")) return;
    const source = document.querySelector(".wellness-quiz");
    if (!source) return;
    source.id = "product-passport";
    source.className = "legal-passport section-shell";
    source.innerHTML = `
      <div class="passport-head">
        <div class="section-kicker"><span>06</span> Проверено до покупки</div>
        <h2>Паспорт <i>продукта.</i></h2>
      </div>
      <details class="passport-disclosure">
        <summary>
          <span class="passport-open-label">Раскрыть паспорт продукта</span>
          <span class="passport-close-label">Скрыть паспорт продукта</span>
          <i aria-hidden="true">＋</i>
        </summary>
        <div class="passport-content">
          <div class="passport-grid">
            <article class="passport-item"><small>Статус продукта</small><strong>Биологически активная добавка к пище</strong><p>Не является лекарственным средством и не предназначена для лечения заболеваний.</p></article>
            <article class="passport-item"><small>Срок и условия хранения</small><strong>${product.shelfLife}</strong><p>Хранить в сухом, защищённом от солнца и недоступном для детей месте при температуре не выше 25 °C.</p></article>
            <article class="passport-item passport-honest"><small>Проверка подлинности</small><strong>Честный знак</strong><p>Найдите код маркировки на упаковке и проверьте товар через приложение «Честный знак».</p></article>
            <article class="passport-item passport-standards"><small>Маркировка и стандарты</small><div class="passport-badges" aria-label="СГР, HACCP, ISO и GMP"><img src="/assets/badge-sgr.svg" alt="СГР"><img src="/assets/badge-haccp.svg" alt="HACCP"><img src="/assets/badge-iso.svg" alt="ISO"><img src="/assets/badge-gmp.svg" alt="GMP"></div></article>
          </div>
          <div class="passport-doc">
            <span class="passport-doc-mark" aria-hidden="true">PDF</span>
            <div><small>Официальный документ</small><strong>Свидетельство о государственной регистрации</strong><p>Русскоязычная страница · 1,6 МБ</p></div>
            <a href="/documents/kononov-sgr-russian.pdf" target="_blank" rel="noreferrer">Открыть документ <span aria-hidden="true">↗</span></a>
          </div>
          <div class="passport-foot"><span>Противопоказания: индивидуальная непереносимость компонентов, беременность, кормление грудью.</span><a href="#label">Посмотреть полную этикетку</a></div>
        </div>
      </details>`;
  };

  const fixLegalSectionNumbers = () => {
    const sections = [
      [".formula-snapshot", "01"], [".offers", "02"], [".trust", "03"], [".reviews", "04"],
      [".story", "05"], [".ritual-band", "06"], [".legal-passport", "07"], [".faq", "08"],
    ];
    sections.forEach(([selector, number]) => {
      const marker = document.querySelector(`${selector} .section-kicker > span`);
      if (marker) marker.textContent = number;
    });
    const ritual = document.querySelector(".ritual-band .eyebrow");
    if (ritual) ritual.textContent = "06 · Ваш ежедневный ритуал";
  };

  const improveFooter = () => {
    const footer = document.querySelector("main > footer, body > footer:not(.legal-footer)");
    if (!footer) return;
    const disclaimer = footer.querySelector(":scope > p");
    if (disclaimer) {
      disclaimer.textContent = "БАД. Не является лекарственным средством. Есть противопоказания. Перед применением рекомендуется проконсультироваться с врачом.";
    }
    footer.querySelectorAll('a[href="#privacy"], a[href="/oferta.html#section-6"]').forEach((link) => {
      link.href = "/privacy.html";
    });
    if (footer.querySelector(".seller-card")) return;
    const card = document.createElement("div");
    card.className = "seller-card";
    card.innerHTML = `
      <span><strong>Продавец</strong><br>ИП Кононов Даниил Денисович</span>
      <span><strong>ИНН</strong> 761602617907<br><strong>ОГРНИП</strong> 324762700001925</span>
      <span><a href="tel:+79159972810">+7 915 997-28-10</a><br><a href="mailto:daniil.kononov.2606@mail.ru">daniil.kononov.2606@mail.ru</a></span>`;
    footer.appendChild(card);
  };

  const improveOrderLegal = () => {
    const sheet = document.querySelector(".order-sheet");
    if (sheet) {
      const consent = sheet.querySelector(".consent-row > span");
      if (consent && consent.dataset.legalReady !== "true") {
        consent.dataset.legalReady = "true";
        consent.innerHTML = `Даю отдельное <a href="/privacy.html#consent" target="_blank">согласие на обработку персональных данных</a>. С <a href="/oferta.html" target="_blank">офертой</a> ознакомлен(а).`;
      }
      if (!sheet.querySelector(".order-legal-note")) {
        const note = document.createElement("p");
        note.className = "order-legal-note";
        note.innerHTML = `<strong>БАД. Не является лекарственным средством.</strong><br>Перед применением рекомендуется проконсультироваться с врачом.`;
        const submit = sheet.querySelector(".submit-order");
        submit?.insertAdjacentElement("beforebegin", note);
      }
    }
    document.querySelectorAll(".chat-intro .consent-row > span").forEach((consent) => {
      if (consent.dataset.legalReady === "true") return;
      consent.dataset.legalReady = "true";
      consent.innerHTML = `Даю отдельное <a href="/privacy.html#consent" target="_blank">согласие на обработку персональных данных</a> для ответа в чате.`;
    });
  };

  const boot = () => {
    sanitizeReviews();
    addProductPassport();
    fixLegalSectionNumbers();
    improveFooter();
    improveOrderLegal();
  };

  const observer = new MutationObserver(() => {
    improveOrderLegal();
    sanitizeReviews();
  });
  const start = () => window.setTimeout(() => {
    boot();
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }, 2600);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
