/* ══════════════════════════════════════════════════
   UTIL
══════════════════════════════════════════════════ */
const $  = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp  = (a, b, t) => a + (b - a) * t;

/* ══════════════════════════════════════════════════
   NAV — scroll state & active section
══════════════════════════════════════════════════ */
const navbar   = $('#navbar');
const sections = $$('section[id]');
const navItems = $$('.nav-link-item');

function onScrollNav() {
  navbar.classList.toggle('scrolled', window.scrollY > 40);

  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 160) current = s.id;
  });
  navItems.forEach(a => {
    const t = a.getAttribute('href').replace('#', '');
    a.classList.toggle('active', t === current);
  });
}
window.addEventListener('scroll', onScrollNav, { passive: true });

/* Mobile nav toggle */
const navToggle = $('#navToggle');
const navLinks  = $('#navLinks');
navToggle?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.textContent = open ? '✕' : '☰';
});

/* ══════════════════════════════════════════════════
   SCROLL PROGRESS BAR
══════════════════════════════════════════════════ */
const progressEl = $('#scrollProgress');
function onScrollProgress() {
  const h = document.documentElement;
  const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
  progressEl.style.width = pct + '%';
}
window.addEventListener('scroll', onScrollProgress, { passive: true });

/* ══════════════════════════════════════════════════
   HERO — parallax + logo reveal
══════════════════════════════════════════════════ */
const heroParallax = $('#heroParallax');
const heroWM       = $('#heroLogoWatermark');
const heroGlow     = $('#heroLogoGlow');
const heroRays     = $('#heroLogoRays');
const floatCards   = $$('.float-card');

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function onScrollHero() {
  const y = window.scrollY;

  if (heroParallax) {
    heroParallax.style.transform = `translateY(${-y * 0.18}px)`;
  }

  floatCards.forEach(card => {
    const speed = parseFloat(card.dataset.speed || 0);
    card.style.marginTop = (y * speed * 0.5) + 'px';
  });

  if (heroWM) {
    const p = easeOutCubic(clamp(y / 300, 0, 1));
    heroWM.style.opacity = (p * 0.6).toFixed(3);
    heroWM.style.transform = `scale(${1 + p * 0.15})`;
    if (heroGlow) heroGlow.style.opacity = (p * 0.5).toFixed(3);
    if (heroRays) heroRays.style.opacity = (p * 0.7).toFixed(3);
  }
}
window.addEventListener('scroll', onScrollHero, { passive: true });
onScrollHero();

/* ══════════════════════════════════════════════════
   BIG HEADLINE — wrap children into <span> for mask reveal
══════════════════════════════════════════════════ */
$$('.big-headline .hl-line, .fh-line').forEach(line => {
  // Wrap all text & inline descendants in a single span we can transform
  const html = line.innerHTML;
  line.innerHTML = `<span class="hl-inner">${html}</span>`;
});

const headlineStyle = document.createElement('style');
headlineStyle.textContent = `
  .hl-inner {
    display: inline-block;
    transform: translateY(110%);
    transition: transform 0.9s cubic-bezier(.22,1,.36,1);
  }
  .revealed > .hl-inner,
  .big-headline.revealed .hl-line > .hl-inner,
  .footer-headline.revealed .fh-line > .hl-inner { transform: translateY(0); }
  .big-headline .hl-line:nth-child(1) .hl-inner { transition-delay: 0.05s; }
  .big-headline .hl-line:nth-child(2) .hl-inner { transition-delay: 0.15s; }
  .big-headline .hl-line:nth-child(3) .hl-inner { transition-delay: 0.25s; }
  .big-headline .hl-line:nth-child(4) .hl-inner { transition-delay: 0.35s; }
  .footer-headline .fh-line:nth-child(1) .hl-inner { transition-delay: 0.05s; }
  .footer-headline .fh-line:nth-child(2) .hl-inner { transition-delay: 0.20s; }
  .footer-headline .fh-line:nth-child(3) .hl-inner { transition-delay: 0.35s; }
`;
document.head.appendChild(headlineStyle);

const headlineObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('revealed');
      headlineObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.2 });

$$('.big-headline').forEach(el => headlineObserver.observe(el));
const footerHeadline = $('.footer-headline');
if (footerHeadline) {
  // promote its h2 wrapper so we can add revealed
  const h2 = footerHeadline.querySelector('h2');
  const observerFH = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        footerHeadline.classList.add('revealed');
        observerFH.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  observerFH.observe(footerHeadline);
}

/* ══════════════════════════════════════════════════
   NAV DROPDOWN — hover estable con delay + bridge
══════════════════════════════════════════════════ */
(() => {
  const hasDrop = document.querySelector('.has-drop');
  if (!hasDrop) return;
  let closeTimer = null;

  const open = () => {
    clearTimeout(closeTimer);
    hasDrop.classList.add('is-open');
  };
  const scheduleClose = () => {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => hasDrop.classList.remove('is-open'), 280);
  };

  hasDrop.addEventListener('mouseenter', open);
  hasDrop.addEventListener('mouseleave', scheduleClose);
  // En clic en el enlace padre, toggle también (mobile + tap)
  const trigger = hasDrop.querySelector('.nav-link-item');
  trigger?.addEventListener('click', (e) => {
    if (window.innerWidth <= 900) {
      e.preventDefault();
      hasDrop.classList.toggle('is-open');
    }
  });
  // Cerrar al hacer clic en cualquier enlace del dropdown
  hasDrop.querySelectorAll('.dropdown a').forEach(a => {
    a.addEventListener('click', () => hasDrop.classList.remove('is-open'));
  });
  // Cerrar con click fuera
  document.addEventListener('click', (e) => {
    if (!hasDrop.contains(e.target)) hasDrop.classList.remove('is-open');
  });
})();

/* ══════════════════════════════════════════════════
   CATEGORÍAS — reveal al entrar en viewport
══════════════════════════════════════════════════ */
(() => {
  const items = document.querySelectorAll('.cat-item, .cat-head');
  if (!items.length || !('IntersectionObserver' in window)) return;
  items.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity .7s var(--ease), transform .7s var(--ease)';
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en, i) => {
      if (en.isIntersecting) {
        setTimeout(() => {
          en.target.style.opacity = '1';
          en.target.style.transform = 'translateY(0)';
        }, i * 60);
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach(el => io.observe(el));
})();

/* ══════════════════════════════════════════════════
   PINNED PHRASE REVEAL
══════════════════════════════════════════════════ */
const phraseSection = $('.reveal-phrase-section');
const phraseEl      = $('#revealPhrase');
const revealBg      = $('#revealBg');

function onScrollPhrase() {
  if (!phraseSection || !phraseEl) return;
  if (window.innerWidth <= 960) {
    $$('#revealPhrase span').forEach(s => s.classList.add('on'));
    return;
  }

  const rect = phraseSection.getBoundingClientRect();
  const total = phraseSection.offsetHeight - window.innerHeight;
  const progress = clamp(-rect.top / total, 0, 1);

  const words = $$('#revealPhrase span');
  const reveal = Math.floor(progress * (words.length + 1));
  words.forEach((s, i) => s.classList.toggle('on', i < reveal));

  if (revealBg) {
    const scale = clamp(progress * 1.4, 0, 1);
    revealBg.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }
}
window.addEventListener('scroll', onScrollPhrase, { passive: true });
onScrollPhrase();

/* ══════════════════════════════════════════════════
   STATS COUNTER
══════════════════════════════════════════════════ */
const statsObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const isFloat = el.dataset.float === '1';
    const duration = 1600;
    const start = performance.now();

    const format = v => {
      if (isFloat) return v.toFixed(1) + suffix;
      if (target >= 1000) {
        return Math.round(v / 1000) + 'k' + suffix;
      }
      return Math.round(v) + suffix;
    };

    function tick(now) {
      const t = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = format(target * eased);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = format(target);
    }
    requestAnimationFrame(tick);
    statsObserver.unobserve(el);
  });
}, { threshold: 0.4 });
$$('.stat-num').forEach(el => statsObserver.observe(el));

/* ══════════════════════════════════════════════════
   CURSOR SPOTLIGHT (desktop only)
══════════════════════════════════════════════════ */
const cursorSpot = $('#cursorSpot');
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let tx = 0, ty = 0, cx = 0, cy = 0;
  document.addEventListener('mousemove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
    document.body.classList.add('has-cursor');
  });
  document.addEventListener('mouseleave', () => {
    document.body.classList.remove('has-cursor');
  });
  (function loop() {
    cx = lerp(cx, tx, 0.14);
    cy = lerp(cy, ty, 0.14);
    cursorSpot.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  })();
}

/* ══════════════════════════════════════════════════
   NEWSLETTER
══════════════════════════════════════════════════ */
const newsletterBtn = $('#newsletterBtn');
newsletterBtn?.addEventListener('click', () => {
  const input = $('#newsletterEmail');
  const email = input.value.trim();
  if (!email || !email.includes('@')) {
    alert('Por favor ingresa un correo válido.');
    return;
  }
  alert(`¡Gracias! "${email}" fue suscrito al newsletter de Fegurd Spa.`);
  input.value = '';
});

/* ══════════════════════════════════════════════════
   REVEAL ELEMENTS on scroll (generic)
══════════════════════════════════════════════════ */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in-view');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });

$$('.svc-card, .prod-card, .tst-card, .about-body, .about-points, .products-sub, .cta-inner > *').forEach(el => {
  el.classList.add('will-reveal');
  revealObserver.observe(el);
});

const genericRevealCSS = document.createElement('style');
genericRevealCSS.textContent = `
  .will-reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity .8s cubic-bezier(.22,1,.36,1), transform .8s cubic-bezier(.22,1,.36,1);
  }
  .will-reveal.in-view { opacity: 1; transform: none; }
`;
document.head.appendChild(genericRevealCSS);
