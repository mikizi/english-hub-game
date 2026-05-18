(function bootAssets() {
  const MAX_WAIT_MS = 3500;
  const MIN_SHOW_MS = 400;
  const loader = document.getElementById("app-loader");
  const startedAt = performance.now();

  function revealApp() {
    const elapsed = performance.now() - startedAt;
    const wait = Math.max(0, MIN_SHOW_MS - elapsed);

    setTimeout(() => {
      document.body.classList.remove("is-loading");
      document.body.classList.add("app-ready");
      if (loader) loader.setAttribute("hidden", "");
    }, wait);
  }

  async function waitForAssets() {
    const timeout = new Promise((resolve) => setTimeout(resolve, MAX_WAIT_MS));

    const fontsPromise = (async () => {
      if (!document.fonts) return;

      const loads = [
        document.fonts.load('400 1em Rubik'),
        document.fonts.load('700 1em Montserrat'),
        document.fonts.load('400 24px "Material Symbols Outlined"')
      ];

      await Promise.allSettled(loads);
      await document.fonts.ready;
    })();

    const windowPromise =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));

    await Promise.race([Promise.allSettled([fontsPromise, windowPromise]), timeout]);
  }

  waitForAssets().then(revealApp).catch(revealApp);
})();
