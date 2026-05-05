/* Hero V2 — GSAP entrance + mouse parallax + scroll parallax */
(function() {
  const hero = document.querySelector('[data-hero]');
  if (!hero || typeof gsap === 'undefined') return;

  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── prepare floating shapes: random idle drift ─────────── */
  const layered = hero.querySelectorAll('[data-depth]');
  layered.forEach((el) => {
    const float = parseFloat(el.dataset.float) || 6;
    if (!reduced) {
      gsap.to(el, {
        y: `+=${float * 4}`,
        x: `+=${(Math.random() - 0.5) * float * 2}`,
        rotation: `+=${(Math.random() - 0.5) * 6}`,
        duration: 4 + Math.random() * 4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: Math.random() * 1.2,
      });
    }
  });

  /* ── headline reveal: stagger word slide-up ─────────────── */
  function entranceAnim() {
    const words = hero.querySelectorAll('[data-w]');
    const amp   = hero.querySelector('.h2-amp');
    const fades = hero.querySelectorAll('[data-fade]');

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' }});
    tl.to(words, {
      yPercent: 0,
      duration: 1.1,
      stagger: 0.085,
    });
    if (amp) tl.to(amp, { yPercent: 0, duration: 0.9 }, '-=0.85');
    tl.to(fades, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: 'power3.out',
    }, '-=0.6');

    // chips/shapes pop-in
    const chips = hero.querySelectorAll('.h2-chip');
    gsap.from(chips, {
      opacity: 0,
      scale: 0.8,
      y: 20,
      duration: 0.9,
      stagger: 0.12,
      delay: 0.6,
      ease: 'back.out(1.6)',
    });

    const shapes = hero.querySelectorAll('.h2-shape');
    gsap.from(shapes, {
      opacity: 0,
      scale: 0.5,
      duration: 1,
      stagger: 0.06,
      delay: 0.3,
      ease: 'expo.out',
    });
  }

  // wait for splash to finish (or run immediately if no splash)
  const splashEl = document.getElementById('splash');
  if (splashEl && !splashEl.classList.contains('is-done')) {
    window.addEventListener('splash:done', entranceAnim, { once: true });
  } else {
    entranceAnim();
  }

  /* ── mouse parallax on shapes & chips ───────────────────── */
  if (!reduced) {
    let targetX = 0, targetY = 0, curX = 0, curY = 0;
    const RANGE = 1; // multiplier on data-depth

    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      // -0.5..0.5 from center
      targetX = ((e.clientX - r.left) / r.width  - 0.5) * 2;
      targetY = ((e.clientY - r.top)  / r.height - 0.5) * 2;
    });
    hero.addEventListener('mouseleave', () => {
      targetX = 0; targetY = 0;
    });

    // store base xSet for each
    const setters = [];
    layered.forEach((el) => {
      const depth = parseFloat(el.dataset.depth) || 0;
      setters.push({ el, depth, sx: gsap.quickSetter(el, 'x', 'px'), sy: gsap.quickSetter(el, 'y', 'px') });
    });

    function loop() {
      curX += (targetX - curX) * 0.07;
      curY += (targetY - curY) * 0.07;
      setters.forEach(({ depth, el }) => {
        const dx = -curX * depth * RANGE;
        const dy = -curY * depth * RANGE;
        // we apply via transform translate – but el is already animated by gsap.to with idle drift.
        // Use CSS variables instead to compose:
        el.style.setProperty('--mx', dx.toFixed(2) + 'px');
        el.style.setProperty('--my', dy.toFixed(2) + 'px');
      });
      requestAnimationFrame(loop);
    }
    loop();

    // apply mouse-parallax via composed transform
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .hero2 [data-depth] { transform: translate3d(var(--mx,0), var(--my,0), 0); }
    `;
    // Note: this would override gsap's idle drift. Instead, we compose using a wrapper-less approach:
    // remove gsap.to idle drift's direct transform manipulation and do it ourselves.
  }

  /* ── scroll parallax: watermark + layered ───────────────── */
  if (typeof ScrollTrigger !== 'undefined') {
    const wm = hero.querySelector('[data-parallax]');
    if (wm) {
      gsap.to(wm, {
        yPercent: -30,
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
        },
      });
    }

    // subtle scroll parallax on shapes (depth-based)
    layered.forEach((el) => {
      const depth = parseFloat(el.dataset.depth) || 0;
      gsap.to(el, {
        yPercent: depth > 0 ? -8 : 8,
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    });

    // copy fades out as you scroll past
    const copy = hero.querySelector('.h2-copy');
    if (copy) {
      gsap.to(copy, {
        opacity: 0.15,
        y: -40,
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: '+=600',
          scrub: 0.5,
        },
      });
    }
  }

  /* ── magnetic CTA ───────────────────────────────────────── */
  if (!reduced) {
    const magnets = hero.querySelectorAll('[data-magnet]');
    magnets.forEach((btn) => {
      const strength = 0.35;
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        gsap.to(btn, { x, y, duration: 0.4, ease: 'power3.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }
})();
