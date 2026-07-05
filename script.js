const isMobileLayout = () => window.matchMedia('(max-width: 1024px) and (orientation: portrait), (max-width: 768px)').matches;

const files = {
  about:            { label: 'about.md',           lang: 'Markdown',   icon: 'ft-md' },
  education:        { label: 'education.json',     lang: 'JSON',       icon: 'ft-json' },
  experience:       { label: 'experience.ts',      lang: 'TypeScript', icon: 'ft-ts' },
  certifications:   { label: 'certifications.yaml',lang: 'YAML',       icon: 'ft-yaml' },
  contact:          { label: 'contact.js',         lang: 'JavaScript', icon: 'ft-contact' },
  'proj-barangay':  { label: 'barangay-website.js',lang: 'JavaScript', icon: 'ft-js' },
  
  
  'proj-pixecured': { label: 'pixecured.js',       lang: 'JavaScript', icon: 'ft-js' },
  'proj-studykart': { label: 'studykart_go!.js',    lang: 'JavaScript', icon: 'ft-js' },
};

  let openTabs = ['about'];
  let activeFile = 'about';

  const tabsBar = document.getElementById('tabsBar');
  const treeItems = document.querySelectorAll('.tree-item');
  const panes = document.querySelectorAll('.editor-pane');
  const statusFile = document.getElementById('statusFile');
  const statusLang = document.getElementById('statusLang');

  function render(){
    tabsBar.innerHTML = '';
    openTabs.forEach(id => {
      const f = files[id];
      const tab = document.createElement('div');
      tab.className = 'tab ' + f.icon + (id === activeFile ? ' active' : '');
      tab.innerHTML = `<i class="codicon codicon-file-code fic"></i><span>${f.label}</span><span class="close" data-close="${id}"><i class="codicon codicon-close"></i></span>`;
      tab.addEventListener('click', (e) => {
        if(e.target.closest('.close')){ closeTab(id); e.stopPropagation(); return; }
        openFile(id);
      });
      tabsBar.appendChild(tab);
    });
    panes.forEach(p => p.classList.toggle('active', p.dataset.pane === activeFile));
    treeItems.forEach(t => t.classList.toggle('active', t.dataset.file === activeFile));
    statusFile.textContent = files[activeFile].label;
    statusLang.textContent = files[activeFile].lang;
  }

  function openFile(id){
    if(!openTabs.includes(id)) openTabs.push(id);
    activeFile = id;
    render();

  
    if (isMobileLayout()) {
      const targetPane = document.querySelector(`.editor-pane[data-pane="${id}"]`);
      if (targetPane) {
        targetPane.scrollIntoView({ behavior: 'smooth' });
        document.getElementById('sidebar').classList.add('collapsed');
      }
    }
  }

  function closeTab(id){
    openTabs = openTabs.filter(t => t !== id);
    if(openTabs.length === 0){ openTabs = ['about']; }
    if(activeFile === id){ activeFile = openTabs[openTabs.length - 1]; }
    render();
  }

  treeItems.forEach(item => item.addEventListener('click', () => openFile(item.dataset.file)));

  document.getElementById('folder-projects').addEventListener('click', function(){
    this.classList.toggle('open');
    document.getElementById('projects-children').classList.toggle('open');
  });

  const sidebar = document.getElementById('sidebar');
  const btnExplorer = document.getElementById('btn-explorer');
  if (isMobileLayout()) {
    sidebar.classList.add('collapsed');
    btnExplorer.classList.remove('active');
  }

  
  btnExplorer.addEventListener('click', function() {
    sidebar.classList.toggle('collapsed');
    this.classList.toggle('active'); 
  });

  const terminal = document.getElementById('terminal');
  function toggleTerminal(){ terminal.classList.toggle('open'); }
  document.getElementById('btn-terminal').addEventListener('click', toggleTerminal);
  document.getElementById('statusTerminal').addEventListener('click', toggleTerminal);
  document.getElementById('closeTerminal').addEventListener('click', toggleTerminal);

  const paletteOverlay = document.getElementById('paletteOverlay');
  const paletteInput = document.getElementById('paletteInput');
  const paletteResults = document.getElementById('paletteResults');

  function openPalette(){
    paletteOverlay.classList.add('open');
    paletteInput.value = '';
    paletteInput.focus();
    renderPalette('');
  }
  function closePalette(){ paletteOverlay.classList.remove('open'); }

  function renderPalette(query){
    paletteResults.innerHTML = '';
    Object.entries(files)
      .filter(([id, f]) => f.label.toLowerCase().includes(query.toLowerCase()))
      .forEach(([id, f]) => {
        const item = document.createElement('div');
        item.className = 'palette-item';
        item.innerHTML = `<i class="codicon codicon-file-code"></i> ${f.label}`;
        item.addEventListener('click', () => { openFile(id); closePalette(); });
        paletteResults.appendChild(item);
      });
  }

  paletteInput.addEventListener('input', (e) => renderPalette(e.target.value));
  document.getElementById('btn-search').addEventListener('click', openPalette);
  paletteOverlay.addEventListener('click', (e) => { if(e.target === paletteOverlay) closePalette(); });

  document.addEventListener('keydown', (e) => {
    if((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'p')){
      e.preventDefault();
      paletteOverlay.classList.contains('open') ? closePalette() : openPalette();
    }
    if(e.key === 'Escape') closePalette();
    if(e.key === '`' && e.ctrlKey){ toggleTerminal(); }
  });

  // Theme toggle — circular reveal via the View Transitions API, from the click point
  const html = document.documentElement;
  const themeLabel = document.getElementById('themeLabel');
  let themeAnimT;

  function applyTheme(next){
    html.setAttribute('data-theme', next);
    themeLabel.textContent = next === 'dark' ? 'Dracula' : 'Alucard';
  }

  // Fallback: no View Transitions support, or the user prefers reduced motion
  function crossfade(next){
    html.classList.add('theme-anim');
    applyTheme(next);
    clearTimeout(themeAnimT);
    themeAnimT = setTimeout(() => html.classList.remove('theme-anim'), 420);
  }

  // Circular wipe expanding from (x, y) — the real page snapshot, clipped, not a fake overlay
  function reveal(next, x, y){
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(() => applyTheme(next));
    vt.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [ `circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)` ] },
        { duration:600, easing:'cubic-bezier(.32,.08,.24,1)', pseudoElement:'::view-transition-new(root)' }
      );
    }).catch(() => {});
  }

  function switchTheme(){
    const isDark = html.getAttribute('data-theme') === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if(reduce || !document.startViewTransition){
      crossfade(nextTheme);
      return;
    }
    const rect = document.querySelector('.window').getBoundingClientRect();
    const x = rect.left;
    const y = rect.bottom;
    reveal(nextTheme, x, y);
  }

  document.getElementById('themeToggle').addEventListener('click', switchTheme);

  // ── Traffic lights: close / minimize / maximize ──
  const macbook = document.querySelector('.macbook');
  const win = document.querySelector('.window');
  const dock = document.getElementById('dock');
  const closedOverlay = document.getElementById('closedOverlay');

  function minimizeWindow(){
    win.classList.add('minimized');
    dock.classList.add('show');
  }
  function restoreWindow(){
    win.classList.remove('minimized');
    dock.classList.remove('show');
  }
  function closeWindow(){
    win.classList.add('closing');
    setTimeout(() => {
      win.classList.add('closed');
      closedOverlay.classList.add('show');
    }, 260);
  }
  function reopenWindow(){
    closedOverlay.classList.remove('show');
    win.classList.remove('closed', 'closing');
  }
  function toggleMaximize(){
    macbook.classList.toggle('maximized');
  }

  // document.getElementById('btnClose').addEventListener('click', closeWindow);
  // document.getElementById('btnMin').addEventListener('click', minimizeWindow);
  // document.getElementById('btnMax').addEventListener('click', toggleMaximize);
  document.getElementById('dockRestore').addEventListener('click', restoreWindow);
  document.getElementById('reopenBtn').addEventListener('click', reopenWindow);

  render();

  // Contact form — opens a prefilled email since this is a static page
  const contactForm = document.getElementById('contactForm');
  if(contactForm){
    contactForm.addEventListener('submit', function(e){
      e.preventDefault();
      const name = document.getElementById('cf-name').value.trim();
      const email = document.getElementById('cf-email').value.trim();
      const subject = document.getElementById('cf-subject').value.trim() || 'Portfolio contact';
      const message = document.getElementById('cf-message').value.trim();
      const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
      const mailto = `mailto:you@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const status = document.getElementById('formStatus');
      status.textContent = '> opening mail client…';
      window.location.href = mailto;
    });
  }

  const scrollContainer = document.querySelector('.editor-scroll');
  
  const scrollObserver = new IntersectionObserver((entries) => {
    if (!isMobileLayout()) return;

    entries.forEach(entry => {
      if (entry.isIntersecting) {
        activeFile = entry.target.dataset.pane;
        
        document.querySelectorAll('.tree-item').forEach(item => {
          item.classList.toggle('active', item.dataset.file === activeFile);
        });
        
        if (files[activeFile]) {
          document.getElementById('statusFile').textContent = files[activeFile].label;
          document.getElementById('statusLang').textContent = files[activeFile].lang;
        }
      }
    });
  }, {
    root: scrollContainer,
    threshold: 0.3 
  });

  document.querySelectorAll('.editor-pane').forEach(pane => {
    scrollObserver.observe(pane);
  });
