/* Fegurd splash intro — auto-plays once per session */
(function() {
  const splash = document.getElementById('splash');
  if (!splash) return;

  const skipBtn = document.getElementById('splashSkip');
  const bar     = document.getElementById('splashBar');
  const tagSpans = splash.querySelectorAll('.splash-tag span');

  const TOTAL_MS  = 3200;   // duration of splash
  const FADE_MS   = 850;    // out fade duration

  // animate letters
  tagSpans.forEach((s, i) => {
    s.style.animationDelay = (1.0 + i * 0.04) + 's';
  });

  document.body.classList.add('splash-active');

  let startTs   = performance.now();
  let finished  = false;
  let raf;

  function tick(now) {
    const t = Math.min(1, (now - startTs) / TOTAL_MS);
    if (bar) bar.style.width = (t * 100).toFixed(1) + '%';
    if (t < 1) {
      raf = requestAnimationFrame(tick);
    } else {
      end();
    }
  }
  raf = requestAnimationFrame(tick);

  function end() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    splash.classList.add('is-out');
    document.body.classList.remove('splash-active');
    setTimeout(() => {
      splash.classList.add('is-done');
      // trigger hero entrance
      window.dispatchEvent(new CustomEvent('splash:done'));
    }, FADE_MS);
  }

  skipBtn && skipBtn.addEventListener('click', end);

  // safety: if anything stalls, kill splash after 6s
  setTimeout(() => { if (!finished) end(); }, 6000);
})();
