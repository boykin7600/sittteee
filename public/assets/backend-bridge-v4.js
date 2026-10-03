(function () {
  "use strict";

  var originalFetch = window.fetch.bind(window);
  window.fetch = function () {
    var args = arguments;
    return originalFetch.apply(window, args).then(function (response) {
      var input = args[0];
      var url = typeof input === "string" ? input : (input && input.url) || "";
      if (response.ok && /\/api\/orders(?:\?|$)/.test(url)) {
        response.clone().json().then(function (payload) {
          if (payload && payload.orderId && window.kononovGoal) {
            window.kononovGoal("order_created", { orderId: payload.orderId });
          }
          if (payload && payload.orderId) {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
              event: "order_created",
              ecommerce: { transaction_id: payload.orderId },
            });
          }
          if (payload && payload.paymentUrl) {
            window.setTimeout(function () {
              window.location.assign(payload.paymentUrl);
            }, 250);
          }
        }).catch(function () {});
      }
      return response;
    });
  };

  var paymentState = new URLSearchParams(window.location.search).get("payment");
  if (paymentState) {
    window.setTimeout(function () {
      var message = paymentState === "success"
        ? "Оплата прошла успешно. Спасибо! Мы уже получили подтверждение."
        : paymentState === "checking"
          ? "Платёж принят и проверяется. Подтверждение появится у менеджера автоматически."
          : "Оплата не завершена. Заказ сохранён — вы сможете попробовать ещё раз.";
      window.alert(message);
      history.replaceState({}, "", window.location.pathname + window.location.hash);
    }, 500);
  }

  function refreshPaymentCopy() {
    var note = document.querySelector(".payment-note");
    if (!note) {
      var paragraphs = document.querySelectorAll(".order-sheet p");
      Array.prototype.some.call(paragraphs, function (paragraph) {
        if (paragraph.textContent.indexOf("Оплата будет подключена") === -1) return false;
        note = paragraph;
        return true;
      });
    }
    if (note) {
      var paymentCopy = "После оформления вы перейдёте на защищённую страницу оплаты Robokassa.";
      if (note.textContent !== paymentCopy) note.textContent = paymentCopy;
    }
  }

  function simplifyOrderForm() {
    var sheet = document.querySelector(".order-sheet");
    if (!sheet || sheet.dataset.simplified === "true") return;
    sheet.dataset.simplified = "true";

    ["postalCode", "street", "house", "apartment"].forEach(function (name) {
      var input = sheet.querySelector('[name="' + name + '"]');
      if (!input) return;
      var label = input.closest("label");
      if (label) label.remove();
      else input.remove();
    });

    sheet.querySelectorAll(".form-row").forEach(function (row) {
      if (!row.querySelector("label, input, select, textarea")) row.remove();
      else if (row.querySelectorAll("label").length === 1) row.classList.add("single-field-row");
    });

    var description = sheet.querySelector('[data-slot="sheet-description"]');
    if (description) {
      description.textContent = "Оставьте имя, телефон и город. Менеджер уточнит полный адрес и детали доставки.";
    }

    var city = sheet.querySelector('[name="city"]');
    if (city) city.placeholder = "Ваш город";
    var comment = sheet.querySelector('[name="comment"]');
    if (comment) comment.placeholder = "Пожелания к заказу — необязательно";
  }

  var formObserver = new MutationObserver(function (mutations) {
    var hasAddedNodes = mutations.some(function (mutation) {
      return mutation.addedNodes && mutation.addedNodes.length;
    });
    if (hasAddedNodes) {
      simplifyOrderForm();
      refreshPaymentCopy();
    }
  });
  formObserver.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      window.setTimeout(refreshPaymentCopy, 1200);
      window.setTimeout(simplifyOrderForm, 1200);
    }, { once: true });
  } else {
    window.setTimeout(refreshPaymentCopy, 1200);
    window.setTimeout(simplifyOrderForm, 1200);
  }

  function sessionId() {
    var existing = localStorage.getItem("kononov_session");
    if (existing) return existing;
    var created = crypto.randomUUID();
    localStorage.setItem("kononov_session", created);
    return created;
  }

  function send(type, meta) {
    if (localStorage.getItem("kononov_analytics_consent") !== "accepted") return;
    fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: sessionId(), type: type, meta: meta || {} }),
      keepalive: true,
    }).catch(function () {});
  }

  document.addEventListener("click", function (event) {
    var support = event.target.closest && event.target.closest(".chat-launcher");
    if (support && !support.classList.contains("is-open")) {
      send("support_clicked");
    }

    var orderEntry = event.target.closest && event.target.closest(
      ".header-order, .hero .primary-button, .closing-cta .primary-button"
    );
    if (orderEntry) send("order_clicked");
  }, { passive: true });
})();
