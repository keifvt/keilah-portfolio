/* =====================================================================
   animations.js
   Motion controller for keilah-portfolio. Additive — does not touch
   script.js. Handles:
     1. Scroll/tab-switch reveal for .reveal elements
     2. Skill bar fill-on-view
     3. Generated commit-style activity graph
     4. Mouse-tracked tilt on .tilt cards
   All effects are skipped/instant under prefers-reduced-motion.
   ===================================================================== */

(function () {
  const reduceMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scrollRoot = document.querySelector('.editor-scroll');

  /* ---------- helpers ---------- */
  function isInView(el) {
    const r = el.getBoundingClientRect();
    const rootRect = scrollRoot
      ? scrollRoot.getBoundingClientRect()
      : { top: 0, bottom: window.innerHeight };
    return r.top < rootRect.bottom - 30 && r.bottom > rootRect.top + 30;
  }

  /* ---------- build the commit-style activity graph once ---------- */
  function buildContribGraph() {
    const grid = document.getElementById('contribGrid');
    if (!grid || grid.dataset.built) return;
    grid.dataset.built = '1';

    const weeks = 18, days = 7;
    let i = 0;
    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < days; d++) {
        const cell = document.createElement('div');
        cell.className = 'contrib-cell';
        // Weighted so most days show *some* activity, matching a habitual builder
        const roll = Math.random();
        const level = roll < 0.12 ? 0 : roll < 0.42 ? 1 : roll < 0.7 ? 2 : roll < 0.9 ? 3 : 4;
        cell.dataset.l = level;
        cell.style.setProperty('--i', i);
        grid.appendChild(cell);
        i++;
      }
    }
  }

  /* ---------- hero title typewriter ---------- */
  function typeHeroTitle() {
    const h1 = document.getElementById('heroTitle');
    if (!h1) return;
    const target = h1.querySelector('.type-target');
    if (!target || target.dataset.typed) return;
    target.dataset.typed = '1';

    const segments = [
      { text: 'Engineering ', em: false },
      { text: 'intelligent, scalable systems', em: true },
      { text: '.', em: false },
    ];

    if (reduceMotion) {
      target.innerHTML = segments
        .map((s) => (s.em ? '<em>' + s.text + '</em>' : s.text))
        .join('');
      return;
    }

    const cursor = document.createElement('span');
    cursor.className = 'type-cursor';
    target.appendChild(cursor);

    let si = 0, ci = 0, emEl = null;

    function tick() {
      if (si >= segments.length) return; // done — cursor keeps blinking in place
      const seg = segments[si];
      if (ci === 0) {
        emEl = seg.em ? document.createElement('em') : null;
        if (emEl) target.insertBefore(emEl, cursor);
      }
      const node = document.createTextNode(seg.text[ci]);
      if (emEl) emEl.appendChild(node);
      else target.insertBefore(node, cursor);

      ci++;
      if (ci >= seg.text.length) {
        si++;
        ci = 0;
      }
      setTimeout(tick, 32 + Math.random() * 26);
    }
    tick();
  }

  /* ---------- main reveal pass ---------- */
  function checkReveal() {
    document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => {
      if (reduceMotion || isInView(el)) {
        el.classList.add('is-visible');
        if (el.id === 'heroTitle') typeHeroTitle();
      }
    });

    document.querySelectorAll('.skill-fill:not(.filled)').forEach((el) => {
      const bar = el.closest('.skill-bar');
      if (!bar) return;
      if (reduceMotion || isInView(bar)) {
        el.classList.add('filled');
        el.style.width = (el.dataset.level || '0') + '%';
      }
    });

    document.querySelectorAll('.contrib-grid:not(.seen)').forEach((grid) => {
      if (reduceMotion || isInView(grid)) grid.classList.add('seen');
    });
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      checkReveal();
      ticking = false;
    });
  }

  /* ---------- wire up triggers ---------- */
  buildContribGraph();
  checkReveal();

  window.addEventListener('load', checkReveal);
  document.addEventListener('DOMContentLoaded', checkReveal);
  window.addEventListener('resize', onScroll);
  if (scrollRoot) scrollRoot.addEventListener('scroll', onScroll, { passive: true });

  // Re-check whenever a tab/file is opened (script.js toggles .active via class)
  const paneObserver = new MutationObserver(checkReveal);
  document.querySelectorAll('.editor-pane').forEach((pane) => {
    paneObserver.observe(pane, { attributes: true, attributeFilter: ['class'] });
  });

  // Also catch clicks on tree items / tabs directly, in case layout settles late
  document.querySelectorAll('.tree-item, .tabs-bar').forEach((el) => {
    el.addEventListener('click', () => setTimeout(checkReveal, 30));
  });

  // Safety net for slow font/layout settling
  setTimeout(checkReveal, 120);
  setTimeout(checkReveal, 400);

  /* ---------- tilt on cards ---------- */
  if (!reduceMotion) {
    document.querySelectorAll('.tilt').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          'perspective(600px) rotateX(' + (-y * 7).toFixed(2) + 'deg) ' +
          'rotateY(' + (x * 7).toFixed(2) + 'deg) translateY(-2px)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }
})();
