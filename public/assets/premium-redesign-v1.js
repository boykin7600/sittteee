(() => {
  // The two contextual contact links share this one destination.
  const MANAGER_URL = "https://t.me/kononovmanager";

  const addProductProtection = () => {
    const trust = document.querySelector(".trust");
    if (!trust || document.getElementById("protection")) return;
    const section = document.createElement("section");
    section.id = "protection";
    section.className = "product-protection";
    section.setAttribute("aria-labelledby", "protection-title");
    section.innerHTML = `
      <div class="protection-heading"><p class="protection-eyebrow">Упаковка KONONOV / 3 уровня защиты</p>
        <h2 id="protection-title">Защита<br><em>в каждой детали.</em></h2>
        <p class="protection-intro">Мембрана, контроль вскрытия и защитная крышка — коротко о самой упаковке.</p></div>
      <div class="protection-layout">
        <figure class="protection-visual"><img src="/assets/product-protection.jpg" width="960" height="1280" loading="lazy" decoding="async" alt="Крышка и защитная мембрана под ней — детали упаковки инозитола KONONOV"><figcaption><span>KONONOV / Детали упаковки</span><span>Крышка · мембрана · флакон</span></figcaption></figure>
        <div class="protection-details">
          <article class="protection-feature"><span class="protection-index">01 / Герметичность</span><h3>Защитная мембрана</h3><p>Дополнительная герметичная защита под крышкой.</p></article>
          <article class="protection-feature"><span class="protection-index">02 / До первого открытия</span><h3>Контроль вскрытия</h3><p>Упаковка позволяет определить, открывался ли продукт ранее.</p></article>
          <article class="protection-feature"><span class="protection-index">03 / Конструкция крышки</span><h3>Защита от детей</h3><p>Защитная конструкция крышки от случайного открытия детьми.</p><small>Храните продукт в недоступном для детей месте.</small></article>
        </div>
      </div>`;
    trust.insertAdjacentElement("afterend", section);
    const nav = document.querySelector(".site-header nav");
    if (nav && !nav.querySelector('a[href="#protection"]')) {
      const anchor = document.createElement("a");
      anchor.href = "#protection";
      anchor.textContent = "Защита";
      nav.appendChild(anchor);
    }
  };

  const addManagerContact = () => {
    const link = () => {
      const anchor = document.createElement("a");
      anchor.className = "manager-link";
      anchor.href = MANAGER_URL;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.innerHTML = 'Написать менеджеру <svg class="ui-arrow ui-arrow-up-right" aria-hidden="true" viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></svg>';
      anchor.setAttribute("aria-label", "Написать менеджеру в Telegram — откроется в новой вкладке");
      return anchor;
    };
    const offers = document.querySelector(".offers");
    if (offers && !offers.querySelector(".manager-contact")) {
      const contact = document.createElement("aside");
      contact.className = "manager-contact manager-contact-order";
      contact.innerHTML = '<div><h3>Нужна помощь с выбором?</h3><p>Ответим на вопросы о продукте и оформлении заказа.</p></div>';
      contact.appendChild(link());
      offers.appendChild(contact);
    }
    const closing = document.querySelector(".closing-cta");
    if (closing && !document.querySelector(".manager-contact-end")) {
      const contact = document.createElement("section");
      contact.className = "manager-contact manager-contact-end";
      contact.setAttribute("aria-labelledby", "manager-heading");
      contact.innerHTML = '<div><p class="manager-eyebrow">На связи / Telegram</p><h2 id="manager-heading">Остались <em>вопросы?</em></h2><p>Расскажем о составе, приёме и доставке. Поможем оформить заказ.</p></div>';
      contact.appendChild(link());
      closing.insertAdjacentElement("afterend", contact);
    }
  };

  const addConfidenceStrip = (hero) => {
    if (!hero || document.querySelector(".confidence-strip")) return;
    const strip = document.createElement("section");
    strip.className = "confidence-strip";
    strip.setAttribute("aria-label", "Преимущества покупки");
    strip.innerHTML = `
      <div class="confidence-item"><i>01</i><div><strong>Понятный состав</strong><span>Дозировки открыты до покупки</span></div></div>
      <div class="confidence-item"><i>02</i><div><strong>Понятный курс</strong><span>90 капсул · один месяц по этикетке</span></div></div>
      <div class="confidence-item"><i>03</i><div><strong>Защищённая оплата</strong><span>Переход на страницу Robokassa</span></div></div>
      <div class="confidence-item"><i>04</i><div><strong>Связь с менеджером</strong><span>Уточним адрес и детали доставки</span></div></div>
    `;
    hero.insertAdjacentElement("afterend", strip);
  };

  const improveHeroDecision = (hero) => {
    if (!hero) return;
    const eyebrow = hero.querySelector(".hero-copy > .eyebrow");
    const title = hero.querySelector(".hero-copy > h1");
    const lead = hero.querySelector(".hero-lead");
    if (eyebrow) eyebrow.textContent = "Мио- и D-хиро-инозитол · 90 капсул";
    if (title) title.innerHTML = "Инозитол<br><em>KONONOV.</em>";
    if (lead) lead.textContent = "Мио- и D-хиро-инозитол с фолиевой кислотой, витамином D3 и марганцем.";
    if (lead && !hero.querySelector(".hero-rating-link")) {
      const rating = document.createElement("a");
      rating.className = "hero-rating-link";
      rating.href = "#reviews";
      rating.setAttribute("aria-label", "Перейти к отзывам покупателей");
      rating.innerHTML = `<span>★★★★★</span><strong>4,9</strong><i>Отзывы покупателей</i>`;
      lead.insertAdjacentElement("beforebegin", rating);
    }

    const price = hero.querySelector(".hero-price");
    if (price && price.dataset.honestPrice !== "true") {
      price.dataset.honestPrice = "true";
      price.querySelector("s")?.remove();
      const note = price.querySelector("span");
      if (note) note.textContent = "≈ 60 ₽ в день";
    }
  };

  const reorderStory = () => {
    const formula = document.querySelector(".formula-snapshot");
    const offers = document.querySelector(".offers");
    const trust = document.querySelector(".trust");
    const reviews = document.querySelector(".reviews");
    if (!formula || !offers) return;

    formula.insertAdjacentElement("afterend", offers);
    if (trust) offers.insertAdjacentElement("afterend", trust);
    if (reviews && trust) trust.insertAdjacentElement("afterend", reviews);

    const heading = offers.querySelector(".offers-heading p");
    if (heading) heading.textContent = "Выберите удобный запас. Для трёх банок доставка уже включена.";
  };

  const fixSectionNumbers = () => {
    const sections = [
      [".formula-snapshot", "01"],
      [".offers", "02"],
      [".trust", "03"],
      [".reviews", "04"],
      [".story", "05"],
      [".ritual-band", "06"],
      [".wellness-quiz", "07"],
      [".faq", "08"],
    ];
    sections.forEach(([selector, number]) => {
      const marker = document.querySelector(`${selector} .section-kicker > span`);
      if (marker) marker.textContent = number;
    });
    const ritualLabel = document.querySelector(".ritual-band .eyebrow");
    if (ritualLabel) ritualLabel.textContent = "06 · Ваш ежедневный ритуал";
  };

  const improveOffers = () => {
    const offers = document.querySelector(".offers");
    if (!offers || offers.dataset.clearPricing === "true") return;
    offers.dataset.clearPricing = "true";

    const cards = Array.from(offers.querySelectorAll(".offer-card"));
    const notes = ["≈ 60 ₽ в день", "Экономия 199 ₽", "Экономия 398 ₽ + доставка"];
    const perBottle = ["1 799 ₽ за банку", "1 700 ₽ за банку", "1 666 ₽ за банку"];
    cards.forEach((card, index) => {
      card.querySelector(".offer-price > span")?.remove();
      const small = card.querySelector(".offer-price small");
      if (small) small.textContent = notes[index] || "";
      const detail = card.querySelector(".offer-detail");
      if (detail && !card.querySelector(".per-bottle")) {
        const value = document.createElement("span");
        value.className = "per-bottle";
        value.textContent = perBottle[index] || "";
        detail.insertAdjacentElement("afterend", value);
      }
    });

    const grid = offers.querySelector(".offer-grid");
    if (grid) {
      grid.id = "order-options";
      if (window.location.hash === "#order-options") {
        requestAnimationFrame(() => grid.scrollIntoView({ block: "start", behavior: "auto" }));
      }
    }
    if (grid && !offers.querySelector(".purchase-path")) {
      const path = document.createElement("div");
      path.className = "purchase-path";
      path.innerHTML = `
        <p><strong>Покупка без сюрпризов</strong><span>Три коротких шага — и заказ у менеджера.</span></p>
        <ol>
          <li><i>1</i><span><b>Оставляете данные</b><small>Имя, телефон, город и адрес</small></span></li>
          <li><i>2</i><span><b>Оплачиваете онлайн</b><small>На защищённой странице</small></span></li>
          <li><i>3</i><span><b>Уточняем доставку</b><small>Менеджер свяжется с вами</small></span></li>
        </ol>
      `;
      grid.insertAdjacentElement("afterend", path);
    }
  };

  const improveCheckout = () => {
    const sheet = document.querySelector(".order-sheet");
    if (!sheet || sheet.querySelector(".checkout-steps")) return;
    const description = sheet.querySelector('[data-slot="sheet-description"]');
    if (!description) return;
    const steps = document.createElement("div");
    steps.className = "checkout-steps";
    steps.innerHTML = `<span class="active"><i>1</i>Данные</span><b></b><span><i>2</i>Оплата</span><b></b><span><i>3</i>Подтверждение</span>`;
    description.insertAdjacentElement("afterend", steps);
  };

  const addUsefulFaq = () => {
    const list = document.querySelector(".faq-list");
    if (!list || list.querySelector('[data-extra-faq="manager"]')) return;
    const item = document.createElement("details");
    item.dataset.extraFaq = "manager";
    item.innerHTML = `<summary>Что будет после оформления?<span>＋</span></summary><p>Вы перейдёте к защищённой оплате. После подтверждения заказа менеджер свяжется с вами, уточнит адрес и сообщит детали доставки.</p>`;
    list.insertAdjacentElement("afterbegin", item);
  };

  const connectAnalyticsGoals = () => {
    if (document.documentElement.dataset.analyticsGoals === "ready") return;
    document.documentElement.dataset.analyticsGoals = "ready";
    document.addEventListener("click", (event) => {
      const target = event.target.closest?.("button, a");
      if (!target) return;
      if (target.matches(".header-order, .hero .primary-button, .offer-card button, .closing-cta .primary-button, .mobile-buy-bar button")) {
        window.kononovGoal?.("order_open", { source: target.className || target.textContent.trim() });
      }
      if (target.matches(".formula-snapshot .outline-button, .formula-ledger button, .hero .text-button")) {
        window.kononovGoal?.("formula_open");
      }
      if (target.matches(".chat-launcher")) window.kononovGoal?.("support_open");
    }, { passive: true });

    const reviews = document.querySelector(".reviews");
    if (reviews) {
      const observer = new IntersectionObserver((entries) => {
        if (!entries[0]?.isIntersecting) return;
        window.kononovGoal?.("reviews_view");
        observer.disconnect();
      }, { threshold: .3 });
      observer.observe(reviews);
    }
  };

  const addNavigationAids = () => {
    if (!document.querySelector(".skip-link")) {
      const skip = document.createElement("a");
      skip.className = "skip-link";
      skip.href = "#formula";
      skip.textContent = "Перейти к содержанию";
      document.body.prepend(skip);
    }

    if (!document.querySelector(".reading-progress")) {
      const progress = document.createElement("div");
      progress.className = "reading-progress";
      progress.setAttribute("aria-hidden", "true");
      progress.innerHTML = "<i></i>";
      document.body.appendChild(progress);
      let scheduled = false;
      const update = () => {
        const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
        progress.firstElementChild.style.transform = `scaleX(${Math.min(1, scrollY / max)})`;
        scheduled = false;
      };
      addEventListener("scroll", () => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(update);
      }, { passive: true });
      update();
    }
  };

  const addGentleReveals = () => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = document.querySelectorAll(
      ".section-shell, .ritual-band, .closing-cta, .confidence-strip"
    );
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8%", threshold: .08 });
    targets.forEach((target) => {
      target.classList.add("reveal-ready");
      observer.observe(target);
    });
  };

  const makeImagesEfficient = () => {
    document.querySelectorAll("img").forEach((img) => {
      img.decoding = "async";
      if (!img.closest(".hero-product") && !img.closest(".offer-card")) img.loading = "lazy";
      if (!img.getAttribute("width") && img.naturalWidth) img.setAttribute("width", img.naturalWidth);
      if (!img.getAttribute("height") && img.naturalHeight) img.setAttribute("height", img.naturalHeight);
    });
  };

  const fixLegalLinks = () => {
    document.querySelectorAll('footer a[href="#privacy"], footer a[href="/oferta.html#section-6"]').forEach((link) => {
      link.href = "/privacy.html";
    });
  };

  const addMobileBuyBar = () => {
    if (document.querySelector(".mobile-buy-bar")) return;
    const bar = document.createElement("div");
    bar.className = "mobile-buy-bar";
    bar.innerHTML = `<span><small>Курс на 1 месяц</small><strong>1 799 ₽</strong></span><button type="button">Выбрать</button>`;
    bar.querySelector("button").addEventListener("click", () => {
      const button = document.querySelector(".offers .offer-card button") || document.querySelector(".hero .primary-button");
      if (button) button.click();
      else document.querySelector("#order")?.scrollIntoView({ behavior: "smooth" });
    });
    document.body.appendChild(bar);
  };

  const fixInteractiveScene = () => {
    const hero = document.querySelector(".hero");
    const product = document.querySelector(".hero-product");
    const stage = document.querySelector(".hero-product .bottle-stage");
    if (!hero || !product || !stage) return;

    const suspendWhenInvisible = new IntersectionObserver((entries) => {
      const visible = entries[0]?.isIntersecting;
      stage.classList.toggle("scene-paused", !visible);
      stage.querySelectorAll("canvas").forEach((canvas) => {
        canvas.style.visibility = visible ? "visible" : "hidden";
      });
    }, { rootMargin: "160px 0px" });
    suspendWhenInvisible.observe(hero);
  };

  const boot = () => {
    const hero = document.querySelector(".hero");
    addConfidenceStrip(hero);
    improveHeroDecision(hero);
    reorderStory();
    fixSectionNumbers();
    improveOffers();
    addProductProtection();
    addManagerContact();
    makeImagesEfficient();
    fixLegalLinks();
    addMobileBuyBar();
    fixInteractiveScene();
    addUsefulFaq();
    improveCheckout();
    connectAnalyticsGoals();
    addNavigationAids();
    addGentleReveals();
  };

  // The React entry is an async module. DOMContentLoaded can fire before its
  // hydration commit on a slow connection, so mutating server HTML from a
  // timeout can produce React error #418. Run only after window.load and two
  // paint frames; this changes timing only, not layout or behavior.
  const startAfterHydration = () => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(boot));
  };
  if (document.readyState === "complete") {
    startAfterHydration();
  } else {
    window.addEventListener("load", startAfterHydration, { once: true });
  }

  const checkoutObserver = new MutationObserver(() => improveCheckout());
  checkoutObserver.observe(document.documentElement, { childList: true, subtree: true });
})();
