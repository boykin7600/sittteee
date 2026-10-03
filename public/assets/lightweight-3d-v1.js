(() => {
  const init = () => {
    const stage = document.querySelector(".hero-product .bottle-stage");
    if (!stage || stage.dataset.lightweight3d === "ready") return;
    stage.dataset.lightweight3d = "ready";

    let active = false;
    const tilt = (clientX, clientY) => {
      const rect = stage.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, (clientX - rect.left) / rect.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (clientY - rect.top) / rect.height * 2 - 1));
      stage.style.setProperty("--bottle-ry", `${(x * 13).toFixed(2)}deg`);
      stage.style.setProperty("--bottle-rx", `${(-y * 5).toFixed(2)}deg`);
    };

    stage.addEventListener("pointerdown", (event) => {
      active = true;
      stage.classList.add("is-tilting");
      stage.setPointerCapture?.(event.pointerId);
      tilt(event.clientX, event.clientY);
    });
    stage.addEventListener("pointermove", (event) => {
      if (active || event.pointerType === "mouse") tilt(event.clientX, event.clientY);
    });
    const release = () => {
      active = false;
      stage.classList.remove("is-tilting");
      stage.style.setProperty("--bottle-ry", "-4deg");
      stage.style.setProperty("--bottle-rx", "-1deg");
    };
    stage.addEventListener("pointerup", release);
    stage.addEventListener("pointercancel", release);
    stage.addEventListener("pointerleave", () => { if (!active) release(); });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
  setTimeout(init, 700);
})();
