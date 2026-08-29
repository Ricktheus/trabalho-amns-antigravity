/* ==========================================================================
   script.js — Navegação, notas do apresentador, visão geral e acessibilidade
   ========================================================================== */
(function () {
  'use strict';

  var MEMBERS = {
    0: { nome: 'Bloco 0', bloco: 'Nivelamento e fundamentos matemáticos', janela: 'Introdução' },
    1: { nome: 'Bloco 1', bloco: 'Fundamentos e variáveis latentes', janela: '00:00–15:00' },
    2: { nome: 'Bloco 2', bloco: 'K-Means clustering', janela: '15:00–30:00' },
    3: { nome: 'Bloco 3', bloco: 'Misturas de Bernoulli e EM', janela: '30:00–45:00' },
    4: { nome: 'Bloco 4', bloco: 'GMM, demonstração e comparação', janela: '45:00–60:00' }
  };

  var slides = [], current = 0, stage, wrap;

  /* ------------------------------------------------------- 1. Escala 16:9 */
  function fit() {
    var pad = 0.965;
    var s = Math.min(window.innerWidth / 1280, window.innerHeight / 720) * pad;
    stage.style.transform = 'scale(' + s + ')';
  }

  /* ---------------------------- 2. Cabeçalho e rodapé gerados por slide */
  function decorate() {
    slides.forEach(function (sl, i) {
      var n = i + 1, mid = sl.dataset.memberId || '1', m = MEMBERS[mid] || MEMBERS[1];
      var isAprof = sl.dataset.type === 'aprofundamento';
      sl.setAttribute('data-member-id', mid);
      sl.setAttribute('role', 'group');
      sl.setAttribute('aria-roledescription', 'slide');
      sl.setAttribute('aria-label', 'Slide ' + n + ' de ' + slides.length + ': ' + title(sl));

      if (!sl.classList.contains('cover')) {
        var k = document.createElement('div');
        k.className = 'kicker';
        k.innerHTML = '<span class="member-bar" aria-hidden="true"></span>' +
          '<span class="who">' + m.nome + '</span>' +
          '<span class="sep">/</span><span>' + m.bloco + '</span>' +
          '<span class="sep">/</span><span class="time">' + (sl.dataset.time || '') + '</span>' +
          '<span class="badge-slide ' + (isAprof ? 'badge-aprof' : 'badge-nucleo') + '">' +
            (isAprof ? 'Aprofundamento' : 'Núcleo · 60 min') +
          '</span>';
        sl.insertBefore(k, sl.firstChild);
        var t = sl.querySelector('.s-title');
        if (t) {
          var rule = document.createElement('div');
          rule.className = 's-rule'; rule.setAttribute('aria-hidden', 'true');
          t.parentNode.insertBefore(rule, t.nextSibling);
        }
      }
      var f = document.createElement('footer');
      f.className = 's-foot';
      f.innerHTML = '<span class="ref">' + (sl.dataset.ref || '') + '</span>' +
        '<span class="pg">' + String(n).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0') + '</span>';
      sl.appendChild(f);
      setupMicroSteps(sl);
    });
  }
  function title(sl) {
    var h = sl.querySelector('.s-title, h1');
    return h ? h.textContent.replace(/\s+/g, ' ').trim() : 'Slide';
  }

  /* ------------------------------------------------ 2b. Micro-passos */
  function setupMicroSteps(sl) {
    var steps = sl.querySelectorAll('.micro-step');
    if (steps.length === 0) return;
    for (var i = 1; i < steps.length; i++) {
      steps[i].classList.add('is-locked');
    }
    var ctrl = sl.querySelector('.step-controls');
    if (!ctrl) {
      ctrl = document.createElement('div');
      ctrl.className = 'step-controls';
      ctrl.innerHTML =
        '<button type="button" class="btn btn-primary btn-step-next">Passo seguinte (Espaço)</button>' +
        '<button type="button" class="btn btn-step-all">Revelar todos</button>' +
        '<span class="step-count"></span>';
      var parent = steps[0].parentNode;
      parent.appendChild(ctrl);
    }
    var btnNext = ctrl.querySelector('.btn-step-next');
    var btnAll = ctrl.querySelector('.btn-step-all');
    if (btnNext) btnNext.addEventListener('click', function () { advanceMicroStep(sl); });
    if (btnAll) btnAll.addEventListener('click', function () {
      if (btnAll.dataset.mode === 'reset') resetMicroSteps(sl);
      else revealAllSteps(sl);
    });
    updateStepControls(sl);
  }
  function advanceMicroStep(sl) {
    sl = sl || slides[current];
    var locked = sl.querySelectorAll('.micro-step.is-locked');
    if (locked.length > 0) {
      locked[0].classList.remove('is-locked');
      updateStepControls(sl);
      return true; // consumiu o passo
    }
    return false; // todos já estavam revelados
  }
  function revealAllSteps(sl) {
    sl = sl || slides[current];
    var locked = sl.querySelectorAll('.micro-step.is-locked');
    for (var i = 0; i < locked.length; i++) locked[i].classList.remove('is-locked');
    updateStepControls(sl);
  }
  /* Ao (re)entrar no slide a demonstração recomeça do primeiro passo. Sem isto,
     voltar a um slide já percorrido deixava tudo revelado e os botões pareciam
     não fazer nada. */
  function resetMicroSteps(sl) {
    var steps = sl.querySelectorAll('.micro-step');
    for (var i = 1; i < steps.length; i++) steps[i].classList.add('is-locked');
    if (steps.length) steps[0].classList.remove('is-locked');
    updateStepControls(sl);
  }
  /* Rótulo dos botões e contador "passo n de N": o estado fica visível. */
  function updateStepControls(sl) {
    var ctrl = sl.querySelector('.step-controls');
    if (!ctrl) return;
    var total = sl.querySelectorAll('.micro-step').length;
    var locked = sl.querySelectorAll('.micro-step.is-locked').length;
    var shown = total - locked;
    var counter = ctrl.querySelector('.step-count');
    if (counter) counter.textContent = 'passo ' + shown + ' de ' + total;
    var btnNext = ctrl.querySelector('.btn-step-next');
    var btnAll = ctrl.querySelector('.btn-step-all');
    if (btnNext) btnNext.disabled = locked === 0;
    if (btnAll) btnAll.textContent = locked === 0 ? 'Recomeçar' : 'Revelar todos';
    if (btnAll) btnAll.dataset.mode = locked === 0 ? 'reset' : 'all';
  }

  /* --------------------------------------------------- 2d. Tema claro/escuro */
  var THEME_KEY = 'vld-tema';
  var theme = 'light';

  function readStoredTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function storeTheme(t) {
    try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* modo privado */ }
  }

  /* Troca os tokens no <html>. Todo o CSS já lê esses tokens; só os desenhos em
     Canvas precisam ser refeitos, porque leram as cores uma vez ao iniciar. */
  function applyTheme(t, redraw) {
    theme = (t === 'dark') ? 'dark' : 'light';
    var root = document.documentElement;
    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    storeTheme(theme);

    var btn = document.getElementById('btn-theme');
    if (btn) {
      var dark = theme === 'dark';
      btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
      var icon = btn.querySelector('.theme-icon');
      var label = btn.querySelector('.theme-label');
      if (icon) icon.textContent = dark ? '◑' : '◐';
      if (label) label.textContent = dark ? 'Tema claro' : 'Tema escuro';
    }

    // as cores dos gráficos foram lidas dos tokens uma vez, ao carregar:
    // relê-las agora é o que faz o Canvas acompanhar a troca de tema
    if (window.FigCore && window.FigCore.readTheme) window.FigCore.readTheme();
    if (redraw === false) return;      // no arranque, quem desenha é o init()
    renderFigures();
    if (window.LAB && slides[current]) window.LAB.onSlideEnter(slides[current]);
    var live = document.getElementById('live');
    if (live) live.textContent = 'Tema ' + (theme === 'dark' ? 'escuro' : 'claro') + ' ativado.';
  }
  function toggleTheme() { applyTheme(theme === 'dark' ? 'light' : 'dark'); }

  /* -------------------------------------------------------- 3. Navegação */
  function show(i, push) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (window.LAB && slides[current]) window.LAB.onSlideLeave(slides[current]);
    slides[current].classList.remove('is-active');
    current = i;
    slides[current].classList.add('is-active');

    var n = current + 1;
    document.getElementById('counter').innerHTML = 'Slide <b>' + n + '</b> de ' + slides.length;
    document.getElementById('progressfill').style.width = (n / slides.length * 100) + '%';
    var mid = slides[current].dataset.memberId || '1';
    var m = MEMBERS[mid] || MEMBERS[1];
    document.getElementById('member-now').textContent = m.nome + ' · ' + m.janela;
    document.getElementById('btn-prev').disabled = current === 0;
    document.getElementById('btn-next').disabled = current === slides.length - 1;
    document.getElementById('live').textContent = 'Slide ' + n + ' de ' + slides.length + ': ' + title(slides[current]);

    fillNotes();
    markOverview();
    if (push !== false) history.replaceState(null, '', '#slide-' + String(n).padStart(2, '0'));
    resetMicroSteps(slides[current]);
    var cv = slides[current].querySelector('canvas[data-viz]');
    if (cv && cv._render) cv._render();
    if (window.LAB) window.LAB.onSlideEnter(slides[current]);
    if (window.renderMathInElement && !document.body.classList.contains('no-katex')) {
      try { window.renderMathInElement(slides[current], KATEX_OPTS); } catch (e) {}
    }
  }
  function next() { show(current + 1); }
  function prev() { show(current - 1); }

  /* -------------------------------------- 4. Notas do apresentador (tecla N) */
  function fillNotes() {
    var sl = slides[current];
    var src = sl.querySelector('.slide-notes');
    var mid = sl.dataset.memberId || '1';
    var m = MEMBERS[mid] || MEMBERS[1];
    document.getElementById('np-head').textContent =
      'Slide ' + (current + 1) + ' · ' + m.nome + ' · ' + (sl.dataset.time || '');
    document.getElementById('np-title').textContent = title(sl);
    document.getElementById('notes-body').innerHTML = src ? src.innerHTML : '<p>Sem notas.</p>';
    var nb = document.getElementById('notes-body');
    if (window.renderMathInElement && !document.body.classList.contains('no-katex')) {
      try { window.renderMathInElement(nb, KATEX_OPTS); } catch (e) { degradeIn(nb); }
    } else if (document.body.classList.contains('no-katex')) {
      degradeIn(nb);
    }
  }
  function toggleNotes(force) {
    var on = force === undefined ? !document.body.classList.contains('notes-open') : force;
    document.body.classList.toggle('notes-open', on);
    document.getElementById('btn-notes').setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  /* --------------------------------------------- 5. Visão geral (tecla O) */
  function buildOverview() {
    var grid = document.getElementById('ov-grid');
    if (!grid) return;
    grid.innerHTML = '';
    slides.forEach(function (sl, i) {
      var mid = sl.dataset.memberId || '1';
      var m = MEMBERS[mid] || MEMBERS[1];
      var isAprof = sl.dataset.type === 'aprofundamento';
      var b = document.createElement('button');
      b.className = 'ov-card'; b.type = 'button';
      b.setAttribute('data-member-id', mid);
      b.setAttribute('data-type', isAprof ? 'aprofundamento' : 'nucleo');
      b.innerHTML = '<span class="n">' + String(i + 1).padStart(2, '0') +
        ' <span style="opacity:0.75;font-size:9px">[' + (isAprof ? 'APROF' : 'NÚCLEO') + ']</span></span>' +
        '<span class="t">' + title(sl) + '</span>' +
        '<span class="w">' + m.nome + ' · ' + (sl.dataset.time || '') + '</span>';
      b.addEventListener('click', function () { show(i); overlay('overview', false); });
      grid.appendChild(b);
    });

    var filterBtns = document.querySelectorAll('.ov-filter-btn');
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (x) { x.classList.remove('active'); });
        btn.classList.add('active');
        var f = btn.dataset.filter;
        var cards = grid.querySelectorAll('.ov-card');
        for (var c = 0; c < cards.length; c++) {
          if (f === 'all') cards[c].hidden = false;
          else if (f === 'nucleo') cards[c].hidden = cards[c].dataset.type !== 'nucleo';
          else if (f === 'aprof') cards[c].hidden = cards[c].dataset.type !== 'aprofundamento';
        }
      });
    });
  }
  function markOverview() {
    var cards = document.querySelectorAll('.ov-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].setAttribute('aria-current', i === current ? 'true' : 'false');
    }
  }
  function overlay(id, on) {
    var el = document.getElementById(id);
    if (!el) return;
    var isOpen = el.classList.contains('open');
    var want = on === undefined ? !isOpen : on;
    document.querySelectorAll('.overlay').forEach(function (o) { o.classList.remove('open'); });
    if (want) {
      el.classList.add('open');
      var closeBtn = el.querySelector('.ov-close');
      if (closeBtn) closeBtn.focus();
      renderMath(el);
    }
  }

  /* --------------------------------------------------------- 6. Teclado */
  var typed = '';
  function onKey(e) {
    if (e.target.matches('input, textarea, select')) return;
    var k = e.key;
    if (k >= '0' && k <= '9') { typed += k; return; }
    if (k === 'Enter' && typed) { show(parseInt(typed, 10) - 1); typed = ''; e.preventDefault(); return; }
    typed = '';
    switch (k) {
      case ' ': case 'Spacebar': case 'ArrowDown':
        if (advanceMicroStep()) { e.preventDefault(); break; }
        next(); e.preventDefault(); break;
      case 'ArrowRight': case 'PageDown':
        next(); e.preventDefault(); break;
      case 'ArrowLeft': case 'PageUp':
        prev(); e.preventDefault(); break;
      case 'Home': show(0); e.preventDefault(); break;
      case 'End': show(slides.length - 1); e.preventDefault(); break;
      case 'n': case 'N': toggleNotes(); break;
      case 'o': case 'O': overlay('overview'); break;
      case 'g': case 'G': overlay('glossary'); break;
      case 'f': case 'F': fullscreen(); break;
      case 't': case 'T': toggleTheme(); break;
      case 'c': case 'C': document.body.classList.toggle('chrome-hidden'); break;
      case '?': case 'h': case 'H': overlay('help'); break;
      case 'Escape':
        if (document.querySelector('.overlay.open')) {
          overlay('overview', false); overlay('help', false); overlay('glossary', false);
        } else if (document.body.classList.contains('notes-open')) {
          toggleNotes(false);
        }
        break;
    }
  }
  function fullscreen() {
    var d = document;
    if (!d.fullscreenElement && d.documentElement.requestFullscreen) {
      d.documentElement.requestFullscreen().catch(function () { });
    } else if (d.exitFullscreen && d.fullscreenElement) {
      d.exitFullscreen().catch(function () { });
    }
  }

  /* --------------------------------------------------------- 7. Fórmulas */
  var KATEX_OPTS = {
    delimiters: [
      { left: '\\[', right: '\\]', display: true },
      { left: '$$', right: '$$', display: true },
      { left: '\\(', right: '\\)', display: false },
      { left: '$', right: '$', display: false }
    ],
    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
    throwOnError: false
  };

  function renderMath(target) {
    if (!window.renderMathInElement) return;
    try {
      if (target) {
        window.renderMathInElement(target, KATEX_OPTS);
        return;
      }
      window.renderMathInElement(document.body, KATEX_OPTS);
    } catch (e) {
      console.warn('KaTeX render warning:', e);
    }
  }

  /* ------------------------------------------------------------------------
     Alternativa sem rede: converte LaTeX em texto Unicode legível.
     Não é uma renderização fiel — é uma degradação para que a apresentação
     continue apresentável quando o KaTeX não pôde ser carregado.
     ------------------------------------------------------------------------ */
  var SYM = {
    alpha:'α', beta:'β', gamma:'γ', delta:'δ', epsilon:'ε', varepsilon:'ε', theta:'θ',
    mu:'μ', pi:'π', sigma:'σ', tau:'τ', phi:'φ', lambda:'λ', omega:'ω',
    Gamma:'Γ', Delta:'Δ', Theta:'Θ', Lambda:'Λ', Sigma:'Σ', Phi:'Φ', Omega:'Ω',
    sum:'Σ', prod:'Π', infty:'∞', partial:'∂', nabla:'∇', propto:'∝',
    in:'∈', notin:'∉', subset:'⊂', forall:'∀', exists:'∃', equiv:'≡',
    to:'→', rightarrow:'→', leftarrow:'←', Longrightarrow:'⟹', longrightarrow:'⟶',
    implies:'⟹', iff:'⟺', mapsto:'↦',
    le:'≤', leq:'≤', ge:'≥', geq:'≥', neq:'≠', approx:'≈', sim:'~',
    times:'×', cdot:'·', cdots:'···', ldots:'...', dots:'...', pm:'±',
    lVert:'‖', rVert:'‖', lvert:'|', rvert:'|', mid:' | '
  };
  var KEEP = ['ln','log','exp','max','min','arg','det','sin','cos','diag','cov'];
  var UNWRAP = ['text','mathrm','mathbf','boldsymbol','mathcal','mathbb','mathsf','mathit',
                'operatorname\\*?','textstyle','displaystyle','hat','bar','vec','tilde'];
  var BARE = /\\(?:boldsymbol|mathbf|mathrm|mathcal|mathbb|mathsf|mathit|textstyle|displaystyle)(?![a-zA-Z])(?!\s*\{)/g;

  function group(s, i) {
    while (i < s.length && /\s/.test(s[i])) i++;          // tolera quebras de linha
    if (s[i] !== '{') return null;
    var d = 0;
    for (var j = i; j < s.length; j++) {
      if (s[j] === '{') d++;
      else if (s[j] === '}') { d--; if (d === 0) return { body: s.slice(i + 1, j), end: j + 1 }; }
    }
    return null;
  }
  function replaceCmd(s, cmd, nArgs, fn) {
    var re = new RegExp('\\\\(?:' + cmd + ')(?![a-zA-Z])\\s*(?=\\{)'), m, guard = 0;
    while ((m = s.match(re)) && guard++ < 400) {
      var start = m.index, i = start + m[0].length, args = [], g;
      for (var a = 0; a < nArgs; a++) {
        g = group(s, i);
        if (!g) break;
        args.push(g.body); i = g.end;
      }
      if (args.length < nArgs) break;
      s = s.slice(0, start) + fn.apply(null, args) + s.slice(i);
    }
    return s;
  }
  function texToText(src) {
    var s = src, guard;
    // 1. chaves literais protegidas antes de qualquer limpeza
    s = s.replace(/\\\{/g, '\u0001').replace(/\\\}/g, '\u0002');
    // 2. espaçadores primeiro, para não colarem no comando seguinte
    s = s.replace(/\\qquad(?![a-zA-Z])/g, '   ').replace(/\\quad(?![a-zA-Z])/g, '  ')
         .replace(/\\[,;:!>]/g, ' ').replace(/\\ /g, ' ');
    // 3. ambientes e quebras de linha
    s = s.replace(/\\begin\{[a-z*]+\}/g, '').replace(/\\end\{[a-z*]+\}/g, '');
    s = s.replace(/\\\\/g, ' ; ').replace(/&/g, ' ');
    // 4. símbolos conhecidos numa única varredura, ANTES de desembrulhar:
    //    evita que \mathbf{x}\mid\mathbf{z} vire "xmidz" ao colar comandos
    s = s.replace(/\\([a-zA-Z]+)\*?/g, function (all, name) {
      return SYM.hasOwnProperty(name) ? SYM[name] : (KEEP.indexOf(name) >= 0 ? ' ' + name + ' ' : all);
    });
    // 5. \underbrace{A}_{anotação} -> A  (a anotação vira ruído em texto puro)
    guard = 0;
    while (/\\underbrace\s*\{/.test(s) && guard++ < 20) {
      var mu = s.match(/\\underbrace\s*(?=\{)/);
      var g1 = group(s, mu.index + mu[0].length);
      if (!g1) break;
      var rest = g1.end, tail = s.slice(rest);
      var sub = tail.match(/^\s*_/);
      if (sub) { var g2 = group(s, rest + sub[0].length); if (g2) rest = g2.end; }
      s = s.slice(0, mu.index) + g1.body + s.slice(rest);
    }
    // 6. frações e invólucros tipográficos
    guard = 0;
    while (/\\t?frac(?![a-zA-Z])/.test(s) && guard++ < 60) {
      var bf = s;
      s = replaceCmd(s, 't?frac', 2, function (a, b) { return '(' + a + ')/(' + b + ')'; });
      if (s === bf) break;
    }
    guard = 0;
    while (guard++ < 60) {
      var prev = s;
      UNWRAP.forEach(function (c) { s = replaceCmd(s, c, 1, function (a) { return a; }); });
      s = s.replace(BARE, '');
      if (s === prev) break;
    }
    s = s.replace(/\\(?:left|right|bigg?|Bigg?)(?![a-zA-Z])\s*/g, '');
    // 7. expoentes e índices
    guard = 0;
    while (/[\^_]\s*\{/.test(s) && guard++ < 300) {
      var m2 = s.match(/[\^_]\s*(?=\{)/);
      var g3 = group(s, m2.index + m2[0].length);
      if (!g3) break;
      var body = g3.body.trim();
      s = s.slice(0, m2.index) + s[m2.index] + (body.length > 1 ? '(' + body + ')' : body) + s.slice(g3.end);
    }
    // 8. resíduos: qualquer comando desconhecido perde a barra
    s = s.replace(/\\([a-zA-Z]+)\*?/g, '$1');
    s = s.replace(/\\/g, '').replace(/[{}]/g, '');
    s = s.replace(/\u0001/g, '{').replace(/\u0002/g, '}');
    // respiro antes dos grandes operadores, para não colarem no termo anterior
    s = s.replace(/([A-Za-z0-9)\]])([ΣΠ])/g, '$1 $2');
    return s.replace(/[ \t]+/g, ' ').replace(/\s+([,;)])/g, '$1').trim();
  }

  var mathDegraded = false;
  function degradeMath() {
    document.body.classList.add('no-katex');
    if (mathDegraded) return;
    mathDegraded = true;
    /* Onde existe uma transcrição .plain escrita à mão, ela substitui o bloco
       .tex correspondente; onde não existe, o próprio LaTeX é convertido em
       texto legível por degradeIn — nunca se esconde conteúdo sem reposição. */
    document.querySelectorAll('.plain').forEach(function (pl) {
      pl.style.display = 'block';
      var prev = pl.previousElementSibling;
      if (prev && prev.classList.contains('tex')) prev.style.display = 'none';
    });
    var roots = [document.getElementById('stage')];
    document.querySelectorAll('.overlay').forEach(function (o) { roots.push(o); });
    roots.forEach(function (root) { degradeIn(root); });
  }
  /* Percorre nós de texto e troca \(...\) e \[...\] pelo texto convertido */
  function degradeIn(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!/\\[([]/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        if (n.parentNode.closest('.plain, script, style')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      var parts = node.nodeValue.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/);
      if (parts.length < 2) return;
      var frag = document.createDocumentFragment();
      parts.forEach(function (part) {
        var m = part.match(/^\\\[([\s\S]*)\\\]$/) || part.match(/^\\\(([\s\S]*)\\\)$/);
        if (m) {
          var span = document.createElement('span');
          span.className = 'tex-fallback';
          span.textContent = texToText(m[1]);
          frag.appendChild(span);
        } else if (part) {
          frag.appendChild(document.createTextNode(part));
        }
      });
      node.parentNode.replaceChild(frag, node);
    });
  }

  /* ------------------------------------- 8. Figuras calculadas no navegador */
  function renderFigures() {
    if (window.FigCore && window.FigCore.readTheme) window.FigCore.readTheme();
    var list = document.querySelectorAll('canvas[data-viz]');
    for (var i = 0; i < list.length; i++) {
      var cv = list[i], name = cv.dataset.viz;
      var fn = window.VIZ && window.VIZ[name];
      if (!fn) { console.warn('Figura não registrada:', name); continue; }
      try {
        var alt = fn(cv);
        cv.setAttribute('role', 'img');
        if (alt) cv.setAttribute('aria-label', alt);
        var desc = cv.parentNode.querySelector('[data-alt-target]');
        if (desc && alt) desc.textContent = alt;
      } catch (err) {
        console.error('Falha ao desenhar', name, err);
        var f = document.createElement('p');
        f.className = 'note-box';
        f.textContent = 'Figura indisponível neste navegador.';
        cv.parentNode.insertBefore(f, cv);
      }
    }
    fillComputed();
  }

  /* Injeta nos textos os valores realmente calculados pelas figuras */
  function fillComputed() {
    var q = function (sel) { return document.querySelector(sel); };
    var num = function (sel, v, dec) {
      var el = q(sel); if (el && v !== undefined && v !== null) el.textContent = fmt(v, dec);
    };
    var fmt = function (v, dec) {
      return typeof v === 'number' ? v.toFixed(dec === undefined ? 1 : dec) : v;
    };
    var elbow = q('canvas[data-viz="fig-elbow"]');
    if (elbow && elbow._curve) {
      var best = elbow._curve.reduce(function (a, b) { return b.s > a.s ? b : a; });
      num('[data-out="sil-max"]', best.s, 3);
      num('[data-out="sil-k"]', best.K, 0);
      var j2 = elbow._curve[0].J, j4 = elbow._curve[2].J, j8 = elbow._curve[6].J;
      num('[data-out="J2"]', j2, 0); num('[data-out="J4"]', j4, 0); num('[data-out="J8"]', j8, 0);
    }
    var init = q('canvas[data-viz="fig-init"]');
    if (init && init._stats) {
      num('[data-out="J-bad"]', init._stats.bad, 0);
      num('[data-out="J-good"]', init._stats.good, 0);
      num('[data-out="J-ratio"]', (init._stats.ratio - 1) * 100, 0);
    }
    var lim = q('canvas[data-viz="fig-limits"]');
    if (lim && lim._stats) {
      num('[data-out="pur-aniso"]', lim._stats.aniso * 100, 0);
      num('[data-out="pur-dens"]', lim._stats.dens * 100, 0);
      var ds = q('[data-out="dens-sizes"]');
      if (ds && lim._stats.sizes) ds.textContent = lim._stats.sizes.join('/');
    }
    var bem = q('canvas[data-viz="fig-bern-em"]');
    if (bem && bem._stats) {
      num('[data-out="bern-ll"]', bem._stats.logLik, 1);
      num('[data-out="bern-it"]', bem._stats.iters, 0);
      num('[data-out="bern-n"]', bem._stats.N, 0);
    }
    var uf = q('canvas[data-viz="fig-underflow"]');
    if (uf && uf._stats) {
      num('[data-out="uf-d"]', uf._stats.dCross, 0);
      var e = q('[data-out="uf-prod"]');
      if (e) e.textContent = uf._stats.prod784 === 0 ? '0 (exatamente zero em float64)' : uf._stats.prod784.toExponential(2);
    }
    var cmp = q('canvas[data-viz="fig-compare"]');
    if (cmp && cmp._stats) {
      var s = cmp._stats;
      num('[data-out="cmp-J"]', s.inertia, 1);
      num('[data-out="cmp-bic"]', s.bic, 0);
      num('[data-out="cmp-ll"]', s.logLik, 1);
      num('[data-out="cmp-km-pur"]', s.kmPurity * 100, 0);
      num('[data-out="cmp-gm-pur"]', s.gmPurity * 100, 0);
      num('[data-out="cmp-n"]', s.N, 0);
      num('[data-out="cmp-it"]', s.iters, 0);
      var tb = q('[data-out="cmp-proba"]');
      if (tb) {
        tb.innerHTML = s.uncertain.map(function (u) {
          return '<tr><td class="rowlab">(' + u.x[0].toFixed(2) + ', ' + u.x[1].toFixed(2) + ')</td>' +
            u.gamma.map(function (g) {
              return '<td' + (g > 0.5 ? ' class="one"' : '') + '>' + g.toFixed(3) + '</td>';
            }).join('') + '</tr>';
        }).join('');
      }
    }
    var cov = q('canvas[data-viz="fig-covtypes"]');
    if (cov && cov._stats) {
      var tb2 = q('[data-out="cov-table"]');
      if (tb2) {
        tb2.innerHTML = cov._stats.fits.map(function (f) {
          var win = f.type === cov._stats.best;
          return '<tr' + (win ? ' class="row-best"' : '') + '><td class="rowlab">' + f.type + '</td><td>' + f.p + '</td><td>' +
            f.ll.toFixed(1) + '</td><td' + (win ? ' class="one"' : '') + '>' + f.bic.toFixed(0) +
            (win ? ' <span class="best-tag">menor BIC</span>' : '') + '</td></tr>';
        }).join('');
      }
      var bn = q('[data-out="cov-best"]');
      if (bn) bn.textContent = cov._stats.best;
    }
    var gem = q('canvas[data-viz="fig-gmm-em"]');
    if (gem && gem._stats) {
      num('[data-out="em-it"]', gem._stats.iters, 0);
      num('[data-out="em-ll0"]', gem._stats.ll0, 1);
      num('[data-out="em-llf"]', gem._stats.llf, 1);
    }
  }

  /* --------------------------------------------------------------- 9. Abas */
  function wireTabs() {
    document.querySelectorAll('.tabs').forEach(function (tabs) {
      tabs.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-tab]');
        if (!b) return;
        var group = tabs.parentNode;
        tabs.querySelectorAll('button[data-tab]').forEach(function (x) {
          x.setAttribute('aria-selected', x === b ? 'true' : 'false');
        });
        group.querySelectorAll('.tabpanel').forEach(function (p) {
          p.hidden = p.dataset.panel !== b.dataset.tab;
        });
      });
    });
  }

  /* ---------------------------------------------------------- 10. Arranque */
  function init() {
    stage = document.getElementById('stage');
    wrap = document.getElementById('stage-wrap');
    slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
    // o tema escolhido na sessão anterior vale desde o primeiro quadro
    applyTheme(readStoredTheme() || 'light', false);
    decorate();
    buildOverview();
    wireTabs();
    fit();
    window.addEventListener('resize', fit);
    document.addEventListener('keydown', onKey);
    document.getElementById('btn-next').addEventListener('click', next);
    document.getElementById('btn-prev').addEventListener('click', prev);
    document.getElementById('btn-notes').addEventListener('click', function () { toggleNotes(); });
    document.getElementById('btn-overview').addEventListener('click', function () { overlay('overview'); });
    var btnGlossary = document.getElementById('btn-glossary');
    if (btnGlossary) btnGlossary.addEventListener('click', function () { overlay('glossary'); });
    document.getElementById('btn-help').addEventListener('click', function () { overlay('help'); });
    document.getElementById('btn-full').addEventListener('click', fullscreen);
    var btnTheme = document.getElementById('btn-theme');
    if (btnTheme) btnTheme.addEventListener('click', toggleTheme);
    document.querySelectorAll('.ov-close').forEach(function (b) {
      b.addEventListener('click', function () { overlay(b.dataset.close, false); });
    });
    document.querySelector('.np-close').addEventListener('click', function () { toggleNotes(false); });

    // controle interativo da responsabilidade γ (slide 06)
    var sl = document.getElementById('gamma-slider');
    if (sl) sl.addEventListener('input', function () {
      var cv = document.querySelector('canvas[data-viz="fig-gamma-live"]');
      if (cv && cv._setT) cv._setT(parseFloat(sl.value));
    });

    var hash = (location.hash.match(/slide-(\d+)/) || [])[1];
    show(hash ? parseInt(hash, 10) - 1 : 0, false);

    // O KaTeX pode chegar depois; as figuras não dependem dele.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(renderFigures).catch(renderFigures);
    } else {
      renderFigures();
    }
    renderMath();
    window.addEventListener('katex-ready', function () { renderMath(); });
    window.addEventListener('load', function () { renderMath(); });
    var kChecks = 0;
    var kInterval = setInterval(function () {
      kChecks++;
      if (window.renderMathInElement) {
        renderMath();
        clearInterval(kInterval);
      } else if (kChecks > 25) {
        clearInterval(kInterval);
        degradeMath();
      }
    }, 200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
