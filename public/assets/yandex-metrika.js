(() => {
  let initialized = false;

  window.initKononovMetrika = function initKononovMetrika() {
    if (initialized) return;
    initialized = true;
    const source = "https://mc.yandex.ru/metrika/tag.js?id=113393367";
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
    window.ym(113393367, "init", {
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
    window.ym(113393367, "reachGoal", name, params || {});
  };

  window.initKononovMetrika();

  window._tmr = window._tmr || [];
  window._tmr.push({
    id: "3799713",
    type: "pageView",
    start: new Date().getTime(),
  });

  if (!document.getElementById("tmr-code")) {
    const topMailScript = document.createElement("script");
    topMailScript.type = "text/javascript";
    topMailScript.async = true;
    topMailScript.id = "tmr-code";
    topMailScript.src = "https://top-fwz1.mail.ru/js/code.js";
    const firstScript = document.getElementsByTagName("script")[0];
    firstScript.parentNode.insertBefore(topMailScript, firstScript);
  }
})();
