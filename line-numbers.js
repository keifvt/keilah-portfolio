/* =====================================================================
   line-numbers.js
   Decorative VS-Code-style line-number gutter, pinned to the true left
   edge of the editor-scroll area (not indented inside the centered
   .preview content). One shared gutter reflects whichever pane is
   currently active. Each row's opacity reflects whether real text
   actually sits on that line — lines with content read clearly, empty
   spacing between blocks fades out, like a real editor's gutter next
   to blank lines.

   Desktop & tablet only. Disabled under 640px (see style.css) to keep
   phone layouts uncluttered.
   Additive — does not touch script.js or animations.js.
   ===================================================================== */

(function () {
  const LINE_HEIGHT = 24; // px per numbered row — keep in sync with style.css
  const mobileQuery = window.matchMedia('(max-width: 1024px) and (orientation: portrait), (max-width: 768px)');
  const scrollRoot = document.querySelector('.editor-scroll');
  if (!scrollRoot) return;

  let gutter = null;

  function ensureGutter() {
    if (gutter) return gutter;
    gutter = document.createElement('div');
    gutter.className = 'line-gutter';
    gutter.setAttribute('aria-hidden', 'true');
    scrollRoot.insertBefore(gutter, scrollRoot.firstChild);
    return gutter;
  }

  function activePreview() {
    const pane = document.querySelector('.editor-pane.active');
    return pane ? pane.querySelector(':scope > .preview') : null;
  }

  // Walk every visible text node in the pane and mark which numbered
  // rows its rendered lines fall on (uses Range.getClientRects so
  // wrapped paragraph lines are each accounted for individually).
  function collectTextRows(preview, rowCount) {
    const active = new Array(rowCount).fill(false);
    const top0 = preview.getBoundingClientRect().top;
    const range = document.createRange();

    const walker = document.createTreeWalker(preview, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let node;
    while ((node = walker.nextNode())) {
      range.selectNodeContents(node);
      const rects = range.getClientRects();
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        if (!r.height) continue;
        const top = r.top - top0;
        const bottom = r.bottom - top0;
        let start = Math.floor(top / LINE_HEIGHT);
        let end = Math.ceil(bottom / LINE_HEIGHT) - 1;
        if (start < 0) start = 0;
        if (end > rowCount - 1) end = rowCount - 1;
        for (let row = start; row <= end; row++) active[row] = true;
      }
    }
    return active;
  }

  function render() {
    if (mobileQuery.matches) {
      if (gutter) gutter.innerHTML = '';
      return;
    }

    const preview = activePreview();
    const g = ensureGutter();
    if (!preview) {
      g.innerHTML = '';
      return;
    }

    const cs = getComputedStyle(preview);
    const pt = parseFloat(cs.paddingTop) || 0;
    const pb = parseFloat(cs.paddingBottom) || 0;
    const contentHeight = preview.scrollHeight - pt - pb;
    const rowCount = Math.max(1, Math.ceil(contentHeight / LINE_HEIGHT));
    const textRows = collectTextRows(preview, rowCount);

    g.style.paddingTop = pt + 'px';
    g.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (let i = 0; i < rowCount; i++) {
      const row = document.createElement('span');
      row.textContent = String(i + 1).padStart(2, '0');
      if (textRows[i]) row.classList.add('has-text');
      frag.appendChild(row);
    }
    g.appendChild(frag);
  }

  let raf = null;
  function scheduleRender() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(render);
  }

  /* Re-measure whenever the active pane's content changes size — covers
     the typewriter hero title, scroll-reveal blocks, skill bar fills,
     the generated commit graph, and window resizes. */
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(scheduleRender);
    document.querySelectorAll('.editor-pane .preview').forEach((preview) => ro.observe(preview));
  }

  // Crossing the 640px boundary should show/hide the gutter immediately
  if (mobileQuery.addEventListener) mobileQuery.addEventListener('change', scheduleRender);
  else if (mobileQuery.addListener) mobileQuery.addListener(scheduleRender); // older Safari

  window.addEventListener('load', scheduleRender);
  document.addEventListener('DOMContentLoaded', scheduleRender);
  window.addEventListener('resize', scheduleRender);
  scrollRoot.addEventListener('scroll', scheduleRender, { passive: true });

  // Switching panes (script.js toggles the .active class) should refresh
  const paneObserver = new MutationObserver(scheduleRender);
  document.querySelectorAll('.editor-pane').forEach((pane) => {
    paneObserver.observe(pane, { attributes: true, attributeFilter: ['class'] });
  });
  document.querySelectorAll('.tree-item, .tabs-bar').forEach((el) => {
    el.addEventListener('click', () => setTimeout(scheduleRender, 40));
  });

  // Safety net for slow font/layout settling
  setTimeout(scheduleRender, 150);
  setTimeout(scheduleRender, 500);
})();
