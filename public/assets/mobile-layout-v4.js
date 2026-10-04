(() => {
  const root = document.documentElement;
  const mobileAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const update = () => {
    root.classList.toggle("mobile-ui", mobileAgent || window.innerWidth <= 820 || screen.width <= 820);
  };
  update();
  window.addEventListener("resize", update, { passive: true });
  window.addEventListener("orientationchange", update, { passive: true });

  const updateButtonLabel = (button, label) => {
    if (!button) return;
    const textNode = Array.from(button.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
    if (textNode) textNode.nodeValue = `${label} `;
  };

  const refreshHero = () => {
    const hero = document.querySelector(".hero");
    if (!hero) return;

    const eyebrow = hero.querySelector(".hero-copy > .eyebrow");
    const title = hero.querySelector(".hero-copy > h1");
    const lead = hero.querySelector(".hero-lead");

    if (eyebrow) eyebrow.textContent = "Мио- и D-хиро-инозитол · 90 капсул";
    if (title && title.textContent.replace(/\s+/g, "") !== "ИнозитолKONONOV.") {
      title.innerHTML = "Инозитол<br><em>KONONOV.</em>";
    }
    if (lead) {
      lead.textContent = "Мио- и D-хиро-инозитол с фолиевой кислотой, витамином D3 и марганцем.";
    }

    if (lead && !hero.querySelector(".hero-facts")) {
      const facts = document.createElement("div");
      facts.className = "hero-facts";
      facts.setAttribute("aria-label", "Кратко о продукте");
      facts.innerHTML = `
        <span><b>1 400 мг</b><small>в суточной порции</small></span>
        <span><b>2 капсулы</b><small>в день</small></span>
        <span><b>1 месяц</b><small>курс по этикетке</small></span>
      `;
      lead.insertAdjacentElement("afterend", facts);
    }

    updateButtonLabel(hero.querySelector(".primary-button"), "Выбрать курс");
    updateButtonLabel(hero.querySelector(".text-button"), "Состав и дозировки");

    const stage = hero.querySelector(".bottle-stage");
    const ingredients = stage ? Array.from(stage.querySelectorAll(".flying-ingredient")) : [];
    if (stage && ingredients.length && !stage.dataset.mobileIngredients) {
      stage.dataset.mobileIngredients = "ready";
      stage.classList.add("mobile-ingredients-ready");

      const note = stage.querySelector(".drag-note");
      if (note) note.innerHTML = "<span>↔</span> вращайте · нажмите";

      let active = -1;
      let timer = 0;
      const showIngredient = (next) => {
        ingredients.forEach((item) => {
          item.classList.remove("mobile-visible", "mobile-leaving");
        });
        active = (next + ingredients.length) % ingredients.length;
        // Restart the CSS flight even when the same item is selected again.
        void ingredients[active].offsetWidth;
        ingredients[active].classList.add("mobile-visible");
      };
      const schedule = () => {
        window.clearInterval(timer);
        timer = window.setInterval(() => showIngredient(active + 1), 3250);
      };

      showIngredient(0);
      schedule();
      stage.addEventListener("click", () => {
        showIngredient(active + 1);
        schedule();
      });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) window.clearInterval(timer);
        else schedule();
      });
    }
  };

  // Wait until React has finished attaching to the server HTML. The visible
  // copy already matches the final version, so this delay only enables the
  // optional interactive enhancements and cannot cause a text flash.
  const startHeroEnhancement = () => window.setTimeout(refreshHero, 1800);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startHeroEnhancement, { once: true });
  } else {
    startHeroEnhancement();
  }
})();
