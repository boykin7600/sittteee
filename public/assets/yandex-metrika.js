(() => {
  let initialized = false;

  window.initKononovMetrika = function initKononovMetrika() {
    if (initialized) return;
    initialized = true;
    const source = "https://mc.yandex.ru/metrika/tag.js?id=113331571";
    window.ym = window.ym || function () {
      (window.ym.a = window.ym.a || []).push(arguments);
    };
    window.ym.l = 1 * new Date();
    if (!Array.from(document.scripts).some((script) => script.src === source)) {
      const script = document.createElement("script");
      script.async = true;
      script.src = source;
      document.head.appendChild(script);
    }
    window.ym(113331571, "init", {
      ssr: true,
      webvisor: true,
      clickmap: true,
      ecommerce: "dataLayer",
      referrer: document.referrer,
      url: location.href,
      accurateTrackBounce: true,
      trackLinks: true,
    });
  };

  window.kononovGoal = function (name, params) {
    if (!initialized || typeof window.ym !== "function") return;
    window.ym(113331571, "reachGoal", name, params || {});
  };

  if (localStorage.getItem("kononov_analytics_consent") === "accepted") {
    window.initKononovMetrika();
  }
})();
