/* ==========================================================================
   labs.js — Laboratórios interativos e controles dos slides autodidáticos
   --------------------------------------------------------------------------
   Implementa os laboratórios interativos, decodificadores e simuladores que
   permitem ao aluno manipular parâmetros, testar hipóteses e ver os
   efeitos imediatos na matemática e nos gráficos.
   Gerencia o ciclo de vida (start / stop) para evitar vazamento de rAF.
   ========================================================================== */
(function (global) {
  'use strict';
  var M = global.MLCore;
  var F = global.FigCore;
  var C = F ? F.C : {
    fg: '#1B1917', muted: '#45403B', dim: '#756E68',
    line: 'rgba(28,25,23,0.14)', lineStrong: 'rgba(28,25,23,0.30)',
    accent: '#B4530A', bg: '#FFFFFF', deep: '#FFFFFF',
    d: ['#B4530A', '#0C7C7A', '#BC2A53', '#3B4CA6'],
    dSoft: ['rgba(180,83,10,0.13)', 'rgba(12,124,122,0.13)',
            'rgba(188,42,83,0.13)', 'rgba(59,76,166,0.13)']
  };
  var MONO = '"IBM Plex Mono", ui-monospace, Menlo, monospace';

  var LAB = {
    registry: {},
    instances: {},

    register: function (name, def) {
      this.registry[name] = def;
    },

    /* A instância vive no próprio elemento, não numa tabela indexada pelo nome
       do laboratório: o mesmo laboratório pode aparecer em mais de um slide
       (`lab-bayes-numbers`, nos slides 06 e 18) e uma tabela por nome deixava o
       segundo container em branco para sempre. */
    onSlideEnter: function (slideEl) {
      if (!slideEl) return;
      var containers = slideEl.querySelectorAll('[data-lab]');
      for (var i = 0; i < containers.length; i++) {
        var el = containers[i];
        var name = el.dataset.lab;
        var def = this.registry[name];
        if (!def) continue;

        var inst = el.__labInst;
        if (!inst) {
          inst = {
            name: name,
            el: el,
            def: def,
            state: {},
            rafId: null,
            intervalId: null,
            listeners: []
          };
          el.__labInst = inst;
          this.instances[name] = inst;   // mantido para inspeção no console
          if (def.build) def.build(inst);
        }
        if (def.start) def.start(inst);
      }
    },

    onSlideLeave: function (slideEl) {
      if (!slideEl) return;
      var containers = slideEl.querySelectorAll('[data-lab]');
      for (var i = 0; i < containers.length; i++) {
        var inst = containers[i].__labInst;
        if (inst) {
          if (inst.rafId) { cancelAnimationFrame(inst.rafId); inst.rafId = null; }
          if (inst.intervalId) { clearInterval(inst.intervalId); inst.intervalId = null; }
          if (inst.def.stop) inst.def.stop(inst);
        }
      }
    }
  };

  /* Helper para criar canvas dimensionado */
  function setupCanvas(cv, w, h) {
    var dpr = window.devicePixelRatio || 2;
    cv.width = w * dpr;
    cv.height = h * dpr;
    cv.style.width = w + 'px';
    cv.style.height = h + 'px';
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  /* Helper universal para renderizar LaTeX matemático com KaTeX ou fallback limpo */
  function tex(str, display) {
    if (window.katex && typeof window.katex.renderToString === 'function') {
      try {
        return window.katex.renderToString(str, {
          displayMode: !!display,
          throwOnError: false
        });
      } catch (e) {}
    }
    return '<span class="tex-fallback">' + str + '</span>';
  }

  function renderMathEl(el) {
    if (!el) return;
    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(el, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '\\[', right: '\\]', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false }
          ],
          throwOnError: false
        });
      } catch (e) {}
    }
  }

  /* =========================================================================
     1. LAB: DECODIFICADOR DE NOTAÇÃO (Slide 02)
     ========================================================================= */
  LAB.register('lab-decoder', {
    build: function (inst) {
      var symbols = [
        {
          rawSym: '\\sum_{n=1}^N',
          nome: 'Somatório',
          trad: 'Some os termos, com \\(n\\) variando de 1 até \\(N\\).',
          ex: 'Se \\(\\mathbf{x} = [2, 5, 8]\\), \\(\\sum_{n=1}^3 x_n = 2 + 5 + 8 = 15\\).',
          onde: 'Inércia \\(J\\), cálculo da média \\(\\boldsymbol\\mu\\), marginalização \\(p(\\mathbf{x})\\).'
        },
        {
          rawSym: '\\prod_{d=1}^D',
          nome: 'Produtório',
          trad: 'Multiplique os termos, com \\(d\\) variando de 1 até \\(D\\).',
          ex: 'Se \\(\\mathbf{p} = [0.8, 0.5]\\), \\(\\prod_{d=1}^2 p_d = 0.8 \\times 0.5 = 0.40\\).',
          onde: 'Densidade conjunta de Bernoulli e Naive Bayes.'
        },
        {
          rawSym: 'x_{nd} \\; / \\; \\mathbf{x}_n',
          nome: 'Subscritos e Vetores',
          trad: '\\(\\mathbf{x}_n\\) é o vetor da amostra \\(n\\); \\(x_{nd}\\) é a dimensão \\(d\\) dessa amostra.',
          ex: '\\(\\mathbf{x}_4 = (1.75\\text{m}, 80\\text{kg}) \\implies x_{4,1} = 1.75\\), \\(x_{4,2} = 80\\).',
          onde: 'Todas as matrizes de dados \\(X\\).'
        },
        {
          rawSym: '\\mathbf{x} \\in \\mathbb{R}^D \\; / \\; \\{0,1\\}^D',
          nome: 'Pertencimento ao Espaço',
          trad: '\\(\\mathbf{x}\\) pertence a um espaço de dimensão \\(D\\): real contínuo (\\(\\mathbb{R}^D\\)) ou binário (\\(\\{0,1\\}^D\\)).',
          ex: 'Em \\(\\mathbb{R}^2\\), \\(\\mathbf{x} = (3.14, -2.5)\\). Em \\(\\{0,1\\}^4\\), \\(\\mathbf{x} = (1, 0, 1, 1)\\).',
          onde: 'Decide se usamos K-Means/GMM (contínuo) ou Bernoulli (discreto).'
        },
        {
          rawSym: 'p(\\mathbf{x} \\mid \\mathbf{z})',
          nome: 'Condicional (dado que)',
          trad: 'Probabilidade de observar \\(\\mathbf{x}\\), dado que já sabemos que a latente é \\(\\mathbf{z}\\).',
          ex: '\\(p(\\text{febre} \\mid \\text{gripe})\\): probabilidade de ter febre sabendo que o paciente tem gripe.',
          onde: 'Verossimilhança de cada componente gerador.'
        },
        {
          rawSym: '\\arg\\min_k f(k)',
          nome: 'Argumento do Mínimo',
          trad: 'Não devolve o valor numérico mínimo da função, mas sim o índice \\(k\\) que atinge esse mínimo.',
          ex: 'Se \\(f(1)=10, f(2)=3, f(3)=8 \\implies \\min f = 3\\), mas \\(\\arg\\min_k f(k) = 2\\).',
          onde: 'Atribuição do centróide mais próximo no K-Means: \\(r_{nk} = \\arg\\min_j \\|\\mathbf{x}_n - \\boldsymbol\\mu_j\\|^2\\).'
        },
        {
          rawSym: '\\mathbf{x}^\\top \\text{ (Transposta)}',
          symRender: '\\mathbf{x}^\\top',
          nome: 'Vetor Linha vs Coluna',
          trad: 'Transforma vetor coluna em vetor linha (ou vice-versa), permitindo produto escalar \\(\\mathbf{x}^\\top \\mathbf{y}\\).',
          ex: 'Se \\(\\mathbf{x} = [2, 3]^\\top\\) e \\(\\mathbf{y} = [4, 5]^\\top \\implies \\mathbf{x}^\\top \\mathbf{y} = 2\\times 4 + 3\\times 5 = 23\\).',
          onde: 'Formas quadráticas da Gaussiana e distância de Mahalanobis.'
        },
        {
          rawSym: '\\mathbf{x}, \\boldsymbol\\mu, \\boldsymbol\\Sigma',
          nome: 'Negrito: Vetores e Matrizes',
          trad: 'Símbolos em negrito representam estruturas com múltiplos valores (vetores/matrizes), nunca um escalar simples.',
          ex: '\\(x\\) escalar = 4.2; \\(\\mathbf{x}\\) vetor = (4.2, 1.8, 9.0); \\(\\boldsymbol\\Sigma\\) matriz de covariância.',
          onde: 'Toda a álgebra linear e multivariada.'
        }
      ];

      var wrap = inst.el;
      wrap.innerHTML =
        '<div class="decoder-layout">' +
          '<div class="decoder-menu" role="tablist"></div>' +
          '<div class="decoder-display">' +
            '<div class="dec-sym"></div>' +
            '<div class="dec-nome"></div>' +
            '<div class="dec-box dec-trad"><b>Em português comum:</b> <span></span></div>' +
            '<div class="dec-box dec-ex"><b>Exemplo com números:</b> <span></span></div>' +
            '<div class="dec-box dec-onde"><b>Onde aparece neste trabalho:</b> <span></span></div>' +
          '</div>' +
        '</div>';

      var menu = wrap.querySelector('.decoder-menu');
      var symEl = wrap.querySelector('.dec-sym');
      var nomeEl = wrap.querySelector('.dec-nome');
      var tradSpan = wrap.querySelector('.dec-trad span');
      var exSpan = wrap.querySelector('.dec-ex span');
      var ondeSpan = wrap.querySelector('.dec-onde span');

      function update(idx) {
        var item = symbols[idx];
        symEl.innerHTML = tex(item.symRender || item.rawSym, true);
        nomeEl.textContent = item.nome;
        tradSpan.innerHTML = item.trad;
        exSpan.innerHTML = item.ex;
        ondeSpan.innerHTML = item.onde;
        renderMathEl(tradSpan);
        renderMathEl(exSpan);
        renderMathEl(ondeSpan);

        var btns = menu.querySelectorAll('.dec-btn');
        for (var i = 0; i < btns.length; i++) {
          btns[i].classList.toggle('active', i === idx);
          btns[i].setAttribute('aria-selected', i === idx ? 'true' : 'false');
        }
      }

      symbols.forEach(function (item, idx) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'dec-btn' + (idx === 0 ? ' active' : '');
        b.setAttribute('role', 'tab');
        b.innerHTML = '<span class="dec-btn-tex">' + tex(item.symRender || item.rawSym) + '</span>' +
          '<span style="font-size:11px;font-family:var(--sans)">' + item.nome + '</span>';
        b.addEventListener('click', function () { update(idx); });
        menu.appendChild(b);
      });

      selectSymbol_or_update:
      update(0);
      inst.state.update = update;
    },
    start: function (inst) {
      if (inst.state.update) inst.state.update(0);
    }
  });

  /* =========================================================================
     1b. LAB: ÁLGEBRA LINEAR 101 — PRODUTO INTERNO E NORMAS (Slide 03)
     ========================================================================= */
  LAB.register('lab-linear-algebra', {
    build: function (inst) {
      inst.el.innerHTML =
        '<div class="lab-grid-2">' +
          '<div class="lab-panel">' +
            '<div class="lab-title">Vetores 2-D (ajuste as componentes com os sliders):</div>' +
            '<div class="slider-row"><label>Vetor \\(\\mathbf{x}_1\\):</label><input type="range" class="s-x1" min="-4" max="4" step="0.5" value="3"><span class="v-x1">3.0</span></div>' +
            '<div class="slider-row"><label>Vetor \\(\\mathbf{x}_2\\):</label><input type="range" class="s-x2" min="-4" max="4" step="0.5" value="2"><span class="v-x2">2.0</span></div>' +
            '<div class="slider-row"><label>Vetor \\(\\mathbf{y}_1\\):</label><input type="range" class="s-y1" min="-4" max="4" step="0.5" value="1"><span class="v-y1">1.0</span></div>' +
            '<div class="slider-row"><label>Vetor \\(\\mathbf{y}_2\\):</label><input type="range" class="s-y2" min="-4" max="4" step="0.5" value="3"><span class="v-y2">3.0</span></div>' +
            '<div class="lab-stats-box la-stats">' +
              '<div><b>Transposta \\(\\mathbf{x}^\\top\\):</b> <span class="out-xt">[3.0, 2.0]</span></div>' +
              '<div><b>Produto Escalar \\(\\mathbf{x}^\\top \\mathbf{y}\\):</b> <span class="out-dot" style="color:var(--accent);font-weight:600">9.0</span></div>' +
              '<div><b>Norma Euclidiana \\(\\|\\mathbf{x}\\|\\):</b> <span class="out-normx">3.61</span> &nbsp;|&nbsp; <b>\\(\\|\\mathbf{y}\\|\\):</b> <span class="out-normy">3.16</span></div>' +
              '<div><b>Distância Euclidiana \\(\\|\\mathbf{x}-\\mathbf{y}\\|\\):</b> <span class="out-dist" style="color:var(--m2);font-weight:600">2.24</span></div>' +
              '<div><b>Ângulo \\(\\cos \\theta\\):</b> <span class="out-cos">0.79</span> (\\(\\theta \\approx\\) <span class="out-ang">37.9°</span>)</div>' +
            '</div>' +
          '</div>' +
          '<div class="lab-panel" style="align-items:center">' +
            '<canvas width="460" height="260" class="la-canvas"></canvas>' +
            '<div class="lab-caption">Plano 2-D: Vetor \\(\\mathbf{x}\\) (amarelo), Vetor \\(\\mathbf{y}\\) (ciano) e vetor diferença \\(\\mathbf{x}-\\mathbf{y}\\) (tracejado).</div>' +
          '</div>' +
        '</div>';

      var cv = inst.el.querySelector('.la-canvas');
      var ctx = setupCanvas(cv, 460, 260);

      var sx1 = inst.el.querySelector('.s-x1');
      var sx2 = inst.el.querySelector('.s-x2');
      var sy1 = inst.el.querySelector('.s-y1');
      var sy2 = inst.el.querySelector('.s-y2');

      var vx1 = inst.el.querySelector('.v-x1');
      var vx2 = inst.el.querySelector('.v-x2');
      var vy1 = inst.el.querySelector('.v-y1');
      var vy2 = inst.el.querySelector('.v-y2');

      var outXt = inst.el.querySelector('.out-xt');
      var outDot = inst.el.querySelector('.out-dot');
      var outNormX = inst.el.querySelector('.out-normx');
      var outNormY = inst.el.querySelector('.out-normy');
      var outDist = inst.el.querySelector('.out-dist');
      var outCos = inst.el.querySelector('.out-cos');
      var outAng = inst.el.querySelector('.out-ang');

      renderMathEl(inst.el.querySelector('.la-stats'));

      function update() {
        var x1 = parseFloat(sx1.value);
        var x2 = parseFloat(sx2.value);
        var y1 = parseFloat(sy1.value);
        var y2 = parseFloat(sy2.value);

        vx1.textContent = x1.toFixed(1);
        vx2.textContent = x2.toFixed(1);
        vy1.textContent = y1.toFixed(1);
        vy2.textContent = y2.toFixed(1);

        var dot = x1 * y1 + x2 * y2;
        var normX = Math.sqrt(x1 * x1 + x2 * x2);
        var normY = Math.sqrt(y1 * y1 + y2 * y2);
        var dist = Math.sqrt((x1 - y1) * (x1 - y1) + (x2 - y2) * (x2 - y2));
        var cosTheta = (normX > 0 && normY > 0) ? Math.max(-1, Math.min(1, dot / (normX * normY))) : 1;
        var angleDeg = (Math.acos(cosTheta) * 180 / Math.PI);

        outXt.textContent = '[' + x1.toFixed(1) + ', ' + x2.toFixed(1) + ']';
        outDot.textContent = dot.toFixed(2) + ' (' + x1.toFixed(1) + '×' + y1.toFixed(1) + ' + ' + x2.toFixed(1) + '×' + y2.toFixed(1) + ')';
        outNormX.textContent = normX.toFixed(2);
        outNormY.textContent = normY.toFixed(2);
        outDist.textContent = dist.toFixed(2);
        outCos.textContent = cosTheta.toFixed(3);
        outAng.textContent = angleDeg.toFixed(1) + '°';

        ctx.clearRect(0, 0, 460, 260);
        var p = new F.Plot(cv, { w: 460, h: 260, xlim: [-5, 5], ylim: [-5, 5], equal: true, pad: { l: 20, r: 10, t: 15, b: 20 } });
        p.frame({ grid: true, zero: true });
        p.clip();

        // Linha tracejada diferença (x - y)
        p.segment(y1, y2, x1, x2, C.dim, { width: 1.5, dash: [4, 4] });

        // Vetor x (d1/accent)
        p.arrow(0, 0, x1, x2, C.d[0], { width: 2.5 });
        p.dot(x1, x2, 4.5, C.d[0]);
        p.label(x1, x2, ' x (' + x1.toFixed(1) + ', ' + x2.toFixed(1) + ')', C.d[0], { size: 11, box: true, dx: 10 });

        // Vetor y (d2/cyan)
        p.arrow(0, 0, y1, y2, C.d[1], { width: 2.5 });
        p.dot(y1, y2, 4.5, C.d[1]);
        p.label(y1, y2, ' y (' + y1.toFixed(1) + ', ' + y2.toFixed(1) + ')', C.d[1], { size: 11, box: true, dx: 10 });

        p.unclip();
      }

      sx1.addEventListener('input', update);
      sx2.addEventListener('input', update);
      sy1.addEventListener('input', update);
      sy2.addEventListener('input', update);

      inst.state.update = update;
    },
    start: function (inst) {
      if (inst.state.update) inst.state.update();
    }
  });

  /* =========================================================================
     2. LAB: REVISÃO RELÂMPAGO DE ESTATÍSTICA (Slide 03)
     ========================================================================= */
  LAB.register('lab-review-stats', {
    build: function (inst) {
      inst.el.innerHTML =
        '<div class="lab-grid-2">' +
          '<div class="lab-panel">' +
            '<div class="lab-title">Conjunto de 5 amostras 1-D (ajuste os valores):</div>' +
            '<div class="slider-row"><label>x₁</label><input type="range" class="s-x" data-idx="0" min="0" max="10" step="0.5" value="2"><span class="v-x">2.0</span></div>' +
            '<div class="slider-row"><label>x₂</label><input type="range" class="s-x" data-idx="1" min="0" max="10" step="0.5" value="3"><span class="v-x">3.0</span></div>' +
            '<div class="slider-row"><label>x₃</label><input type="range" class="s-x" data-idx="2" min="0" max="10" step="0.5" value="5"><span class="v-x">5.0</span></div>' +
            '<div class="slider-row"><label>x₄</label><input type="range" class="s-x" data-idx="3" min="0" max="10" step="0.5" value="7"><span class="v-x">7.0</span></div>' +
            '<div class="slider-row"><label>x₅</label><input type="range" class="s-x" data-idx="4" min="0" max="10" step="0.5" value="8"><span class="v-x">8.0</span></div>' +
            '<div class="lab-stats-box" style="margin-top:12px">' +
              '<div>Média <b>μ = (∑x)/N</b>: <span class="out-mean" style="color:var(--accent)">5.00</span></div>' +
              '<div>Variância <b>σ² = ∑(x−μ)²/N</b>: <span class="out-var" style="color:var(--m2)">5.60</span></div>' +
              '<div>Desvio padrão <b>σ = √σ²</b>: <span class="out-std" style="color:var(--m4)">2.37</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="lab-panel" style="display:flex;flex-direction:column;align-items:center">' +
            '<canvas class="stats-cv" width="460" height="230"></canvas>' +
            '<p class="lab-caption">Pontos na reta (dourado), média central (linha vertical) e curva gaussiana correspondente 𝒩(μ, σ²).</p>' +
          '</div>' +
        '</div>';

      var cv = inst.el.querySelector('.stats-cv');
      var ctx = setupCanvas(cv, 460, 230);
      var inputs = inst.el.querySelectorAll('.s-x');
      var valsDisplay = inst.el.querySelectorAll('.v-x');
      var outMean = inst.el.querySelector('.out-mean');
      var outVar = inst.el.querySelector('.out-var');
      var outStd = inst.el.querySelector('.out-std');

      function update() {
        var pts = [];
        for (var i = 0; i < inputs.length; i++) {
          var v = parseFloat(inputs[i].value);
          pts.push(v);
          valsDisplay[i].textContent = v.toFixed(1);
        }
        var N = pts.length;
        var mean = pts.reduce(function (a, b) { return a + b; }, 0) / N;
        var vari = pts.reduce(function (a, b) { var d = b - mean; return a + d * d; }, 0) / N;
        vari = Math.max(vari, 0.05);
        var std = Math.sqrt(vari);

        outMean.textContent = mean.toFixed(2);
        outVar.textContent = vari.toFixed(2);
        outStd.textContent = std.toFixed(2);

        // Desenhar no canvas
        ctx.clearRect(0, 0, 460, 230);
        var p = new F.Plot(cv, { w: 460, h: 230, xlim: [-1, 11], ylim: [0, 0.45], pad: { l: 30, r: 15, t: 20, b: 30 } });
        p.frame({ xlabel: 'x', ylabel: 'densidade p(x)' });
        p.clip();

        // Curva Gaussiana
        var curve = [];
        var normConst = 1 / (std * Math.sqrt(2 * Math.PI));
        for (var x = -1; x <= 11; x += 0.1) {
          var y = normConst * Math.exp(-0.5 * Math.pow((x - mean) / std, 2));
          curve.push([x, y]);
        }
        p.line(curve, C.d[1], 2.2);

        // Linha da média
        p.line([[mean, 0], [mean, 0.42]], C.accent, 1.8, [4, 4]);
        p.label(mean, 0.42, 'μ = ' + mean.toFixed(1), C.accent, { align: 'center', box: true });

        // Pontos na base
        pts.forEach(function (x) {
          p.dot(x, 0.02, 5.5, C.accent, 0.9);
        });
        p.unclip();
      }

      for (var i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener('input', update);
      }
      inst.state.update = update;
    },
    start: function (inst) {
      if (inst.state.update) inst.state.update();
    }
  });

  /* =========================================================================
     3. LAB: PROBABILIDADE CONDICIONAL E BAYES (Slide 04)
     ========================================================================= */
  LAB.register('lab-bayes-intro', {
    build: function (inst) {
      inst.el.innerHTML =
        '<div class="lab-grid-2">' +
          '<div class="lab-panel">' +
            '<div class="lab-title">Cenário: sintoma S com duas causas possíveis</div>' +
            '<div class="slider-row"><label>Prior π₁ = p(Gripe)</label><input type="range" class="s-pi" min="0.05" max="0.95" step="0.05" value="0.30"><span class="v-pi">0.30</span></div>' +
            '<div class="slider-row"><label>p(Sintoma | Gripe)</label><input type="range" class="s-l1" min="0.1" max="0.99" step="0.05" value="0.80"><span class="v-l1">0.80</span></div>' +
            '<div class="slider-row"><label>p(Sintoma | Alergia)</label><input type="range" class="s-l2" min="0.1" max="0.99" step="0.05" value="0.20"><span class="v-l2">0.20</span></div>' +
            '<div class="lab-stats-box" style="margin-top:14px;font-size:12.5px">' +
              '<div>Evidência Total <b>p(S) = π₁·p(S|Gripe) + π₂·p(S|Alergia)</b>: <br><span class="out-ev" style="color:var(--fg);font-family:var(--mono)">0.30×0.80 + 0.70×0.20 = 0.380</span></div>' +
              '<div style="margin-top:8px">Posterior Bayesiano <b>p(Gripe | Sintoma)</b>: <br><span class="out-post" style="color:var(--accent);font-size:15px;font-weight:600">(0.30×0.80) / 0.380 = 63.2%</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="lab-panel" style="display:flex;flex-direction:column;align-items:center">' +
            '<canvas class="bayes-cv" width="460" height="210"></canvas>' +
            '<p class="lab-caption">Visualização da Partição: O sintoma seleciona uma fatia da população e inverte a probabilidade.</p>' +
          '</div>' +
        '</div>';

      var cv = inst.el.querySelector('.bayes-cv');
      var ctx = setupCanvas(cv, 460, 210);
      var sPi = inst.el.querySelector('.s-pi');
      var sL1 = inst.el.querySelector('.s-l1');
      var sL2 = inst.el.querySelector('.s-l2');
      var vPi = inst.el.querySelector('.v-pi');
      var vL1 = inst.el.querySelector('.v-l1');
      var vL2 = inst.el.querySelector('.v-l2');
      var outEv = inst.el.querySelector('.out-ev');
      var outPost = inst.el.querySelector('.out-post');

      function update() {
        var pi1 = parseFloat(sPi.value);
        var pi2 = 1 - pi1;
        var l1 = parseFloat(sL1.value);
        var l2 = parseFloat(sL2.value);

        vPi.textContent = pi1.toFixed(2);
        vL1.textContent = l1.toFixed(2);
        vL2.textContent = l2.toFixed(2);

        var num1 = pi1 * l1;
        var num2 = pi2 * l2;
        var ev = num1 + num2;
        var post1 = num1 / ev;
        var post2 = num2 / ev;

        outEv.innerHTML = pi1.toFixed(2) + '×' + l1.toFixed(2) + ' + ' + pi2.toFixed(2) + '×' + l2.toFixed(2) + ' = <b>' + ev.toFixed(3) + '</b>';
        outPost.innerHTML = '(' + num1.toFixed(3) + ') / ' + ev.toFixed(3) + ' = <b>' + (post1 * 100).toFixed(1) + '% Gripe</b> (' + (post2 * 100).toFixed(1) + '% Alergia)';

        // Desenho visual de barras
        ctx.clearRect(0, 0, 460, 210);
        ctx.font = '11px ' + MONO;

        // Barra 1: População total
        ctx.fillStyle = C.muted;
        ctx.fillText('1. População inicial (Priors π₁ e π₂):', 20, 25);
        ctx.fillStyle = C.d[0]; ctx.fillRect(20, 35, 420 * pi1, 26);
        ctx.fillStyle = C.d[1]; ctx.fillRect(20 + 420 * pi1, 35, 420 * pi2, 26);
        ctx.fillStyle = C.deep;
        ctx.fillText('Gripe ' + (pi1 * 100).toFixed(0) + '%', 26, 52);
        ctx.fillText('Alergia ' + (pi2 * 100).toFixed(0) + '%', 26 + 420 * pi1, 52);

        // Barra 2: Quem apresenta o sintoma (Evidência)
        ctx.fillStyle = C.muted;
        ctx.fillText('2. Quem tem o sintoma (π_k × p(S|k)):', 20, 95);
        ctx.fillStyle = 'rgba(28,25,23,0.07)'; ctx.fillRect(20, 105, 420, 26);
        ctx.fillStyle = C.d[0]; ctx.fillRect(20, 105, 420 * num1, 26);
        ctx.fillStyle = C.d[1]; ctx.fillRect(20 + 420 * num1, 105, 420 * num2, 26);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText((num1 * 100).toFixed(1) + '%', 26, 122);
        ctx.fillText((num2 * 100).toFixed(1) + '%', 26 + 420 * num1, 122);

        // Barra 3: Normalizado (Posterior γ)
        ctx.fillStyle = C.muted;
        ctx.fillText('3. Probabilidade a Posteriori p(Gripe | Sintoma) [= γ₁]:', 20, 165);
        ctx.fillStyle = C.d[0]; ctx.fillRect(20, 175, 420 * post1, 30);
        ctx.fillStyle = C.d[1]; ctx.fillRect(20 + 420 * post1, 175, 420 * post2, 30);
        ctx.fillStyle = C.deep;
        ctx.font = 'bold 12px ' + MONO;
        ctx.fillText('Gripe: ' + (post1 * 100).toFixed(1) + '%', 26, 195);
        ctx.fillText('Alergia: ' + (post2 * 100).toFixed(1) + '%', 26 + 420 * post1, 195);
      }

      sPi.addEventListener('input', update);
      sL1.addEventListener('input', update);
      sL2.addEventListener('input', update);
      inst.state.update = update;
    },
    start: function (inst) {
      if (inst.state.update) inst.state.update();
    }
  });

  /* =========================================================================
     4. LAB: MÁQUINA GERADORA (Slide 07)
     ========================================================================= */
  LAB.register('lab-generative-machine', {
    build: function (inst) {
      inst.el.innerHTML =
        '<div class="lab-grid-2">' +
          '<div class="lab-panel">' +
            '<div class="lab-title">Processo Generativo: p(x) = ∑_z p(z) p(x|z)</div>' +
            '<div class="node accent" style="margin-bottom:10px">' +
              '<b>Passo 1:</b> Sorteia componente <code>z ~ Cat(π)</code><br>' +
              '<b>Passo 2:</b> Sorteia amostra <code>x ~ 𝒩(μ_z, σ_z²)</code>' +
            '</div>' +
            '<div class="lab-btn-row">' +
              '<button type="button" class="btn btn-gen-1">🎲 Sortear 1 ponto</button>' +
              '<button type="button" class="btn btn-gen-50">⚡ Sortear 50 pontos</button>' +
              '<button type="button" class="btn btn-gen-auto">▶ Animar</button>' +
              '<button type="button" class="btn btn-gen-clear">Limpar</button>' +
            '</div>' +
            '<div class="lab-stats-box" style="margin-top:12px">' +
              '<div>Total de pontos gerados: <b class="gen-count" style="color:var(--accent)">0</b></div>' +
              '<div class="gen-last-log" style="font-size:12px;color:var(--fg-dim);margin-top:4px">Clique em "Sortear 1 ponto" para ver o passo a passo.</div>' +
            '</div>' +
          '</div>' +
          '<div class="lab-panel" style="display:flex;flex-direction:column;align-items:center">' +
            '<canvas class="gen-cv" width="460" height="240"></canvas>' +
            '<p class="lab-caption">Conforme N cresce, o histograma empírico converge exatamente para a densidade contínua da mistura.</p>' +
          '</div>' +
        '</div>';

      var cv = inst.el.querySelector('.gen-cv');
      var ctx = setupCanvas(cv, 460, 240);
      var btn1 = inst.el.querySelector('.btn-gen-1');
      var btn50 = inst.el.querySelector('.btn-gen-50');
      var btnAuto = inst.el.querySelector('.btn-gen-auto');
      var btnClear = inst.el.querySelector('.btn-gen-clear');
      var outCount = inst.el.querySelector('.gen-count');
      var outLog = inst.el.querySelector('.gen-last-log');

      var pis = [0.4, 0.6];
      var mus = [-3.0, 3.0];
      var sigmas = [1.2, 1.6];
      var points = [];
      var isRunning = false;
      var rng = M.mulberry32(12345);

      function sampleOne() {
        var u = rng();
        var z = u < pis[0] ? 0 : 1;
        var r = M.randn(rng);
        var x = mus[z] + r * sigmas[z];
        points.push({ x: x, z: z });
        outCount.textContent = points.length;
        outLog.innerHTML = 'Último: z = <b>' + (z + 1) + '</b> (' + (z === 0 ? 'Cluster Amarelo' : 'Cluster Ciano') + ') ⟹ x = <b>' + x.toFixed(2) + '</b>';
      }

      function draw() {
        ctx.clearRect(0, 0, 460, 240);
        var p = new F.Plot(cv, { w: 460, h: 240, xlim: [-8, 8], ylim: [0, 0.25], pad: { l: 28, r: 10, t: 15, b: 25 } });
        p.frame({ xlabel: 'x', ylabel: 'p(x)' });
        p.clip();

        // 1. Curva Teórica da Mistura p(x) = π₁𝒩₁ + π₂𝒩₂
        var curve = [];
        for (var x = -8; x <= 8; x += 0.1) {
          var y1 = (1 / (sigmas[0] * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mus[0]) / sigmas[0], 2));
          var y2 = (1 / (sigmas[1] * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mus[1]) / sigmas[1], 2));
          var yTot = pis[0] * y1 + pis[1] * y2;
          curve.push([x, yTot]);
        }
        p.line(curve, C.fg, 2.0);

        // 2. Histograma dos pontos acumulados
        if (points.length > 0) {
          var bins = 32;
          var bMin = -8, bMax = 8;
          var bWidth = (bMax - bMin) / bins;
          var counts = new Array(bins).fill(0);
          points.forEach(function (pt) {
            var bIdx = Math.floor((pt.x - bMin) / bWidth);
            if (bIdx >= 0 && bIdx < bins) counts[bIdx]++;
          });
          var maxDensity = points.length * bWidth;
          for (var b = 0; b < bins; b++) {
            var density = counts[b] / maxDensity;
            var bx = bMin + b * bWidth;
            var px = p.X(bx);
            var py = p.Y(density);
            var pw = p.S(bWidth);
            var ph = p.Y(0) - py;
            ctx.fillStyle = 'rgba(180, 83, 10, 0.42)';
            ctx.fillRect(px + 1, py, pw - 2, ph);
          }

          // Últimos pontos desenhados no rodapé
          var recent = points.slice(-30);
          recent.forEach(function (pt) {
            p.dot(pt.x, 0.008, 3.5, C.d[pt.z], 0.85);
          });
        }
        p.unclip();
      }

      btn1.addEventListener('click', function () { sampleOne(); draw(); });
      btn50.addEventListener('click', function () { for (var i = 0; i < 50; i++) sampleOne(); draw(); });
      btnClear.addEventListener('click', function () { points = []; outCount.textContent = '0'; outLog.textContent = 'Limpo.'; draw(); });

      function loop() {
        if (!isRunning) return;
        sampleOne();
        sampleOne();
        draw();
        inst.rafId = requestAnimationFrame(loop);
      }

      btnAuto.addEventListener('click', function () {
        isRunning = !isRunning;
        btnAuto.textContent = isRunning ? '⏸ Pausar' : '▶ Animar';
        if (isRunning) loop();
      });

      inst.state.draw = draw;
      inst.def.stop = function () {
        isRunning = false;
        btnAuto.textContent = '▶ Animar';
      };
    },
    start: function (inst) {
      if (inst.state.draw) inst.state.draw();
    }
  });

  /* =========================================================================
     5. LAB: 1-DE-K NA PRÁTICA (Slide 09)
     ========================================================================= */
  LAB.register('lab-one-hot', {
    build: function (inst) {
      inst.el.innerHTML =
        '<div class="lab-panel" style="max-width:800px;margin:0 auto">' +
          '<div class="lab-title">Clique num componente para ativar o vetor 1-de-K (z ∈ {0,1}⁴):</div>' +
          '<div class="onehot-selector" style="display:flex;gap:16px;justify-content:center;margin:16px 0">' +
            '<button type="button" class="btn btn-oh active" data-k="0">Componente 1 (k=1)</button>' +
            '<button type="button" class="btn btn-oh" data-k="1">Componente 2 (k=2)</button>' +
            '<button type="button" class="btn btn-oh" data-k="2">Componente 3 (k=3)</button>' +
            '<button type="button" class="btn btn-oh" data-k="3">Componente 4 (k=4)</button>' +
          '</div>' +
          '<div class="onehot-display" style="display:flex;gap:12px;justify-content:center;align-items:center;margin:18px 0"></div>' +
          '<div class="formula big" style="text-align:center">' +
            '<span class="formula-label">Colapso Algébrico do Produto</span>' +
            '<div class="oh-math" style="font-family:var(--mono);font-size:16px;color:var(--fg);padding:8px 0"></div>' +
          '</div>' +
          '<p class="lab-caption" style="text-align:center;margin-top:10px">Qualquer número elevado a 0 é 1 (π_j⁰ = 1). Portanto, todos os fatores inativos viram 1 e sobra apenas o peso π_k do componente ativo!</p>' +
        '</div>';

      var btns = inst.el.querySelectorAll('.btn-oh');
      var dispVec = inst.el.querySelector('.onehot-display');
      var dispMath = inst.el.querySelector('.oh-math');

      function setK(activeK) {
        btns.forEach(function (b, i) { b.classList.toggle('active', i === activeK); });

        // Desenha as células
        var vecHtml = '';
        for (var k = 0; k < 4; k++) {
          var isActive = k === activeK;
          vecHtml +=
            '<div style="text-align:center">' +
              '<div class="cell' + (isActive ? ' on' : '') + '" style="font-size:22px;padding:10px 18px;border:1px solid ' + (isActive ? 'var(--accent)' : 'var(--line-strong)') + ';background:' + (isActive ? 'var(--accent-soft)' : 'var(--surface)') + ';color:' + (isActive ? 'var(--accent)' : 'var(--fg-dim)') + '">' + (isActive ? '1' : '0') + '</div>' +
              '<div class="lbl" style="font-family:var(--mono);font-size:11px;color:var(--fg-dim);margin-top:4px">z_' + (k + 1) + '</div>' +
            '</div>';
        }
        dispVec.innerHTML = vecHtml;

        // Fórmula expandida
        var terms = [];
        for (k = 0; k < 4; k++) {
          terms.push('π_' + (k + 1) + '<sup>' + (k === activeK ? '1' : '0') + '</sup>');
        }
        var simplify = [];
        for (k = 0; k < 4; k++) {
          simplify.push(k === activeK ? 'π_' + (k + 1) : '1');
        }

        dispMath.innerHTML =
          'p(z) = ' + terms.join(' · ') + '<br>' +
          '<span style="color:var(--fg-dim);font-size:14px">⟶ ' + simplify.join(' · ') + '</span> ⟶ <b style="color:var(--accent);font-size:18px">π_' + (activeK + 1) + '</b>';
      }

      btns.forEach(function (b, i) {
        b.addEventListener('click', function () { setK(i); });
      });

      setK(0);
    }
  });

  /* =========================================================================
     6. LAB: BAYES COM NÚMEROS (Slide 12)
     ========================================================================= */
  LAB.register('lab-bayes-numbers', {
    build: function (inst) {
      inst.el.innerHTML =
        '<div class="lab-grid-2" style="grid-template-columns:1fr 440px">' +
          '<div class="lab-panel">' +
            '<div class="lab-title">Cálculo de ' + tex('\\gamma_{nk}') + ' passo a passo para a amostra ' + tex('x_n') + '</div>' +
            '<div class="slider-row" style="margin:6px 0 2px">' +
              '<label style="flex:0 0 150px">Posição de x_n:</label>' +
              '<input type="range" class="s-xpos" min="-4" max="4" step="0.1" value="0.5" style="flex:1">' +
              '<span class="v-xpos" style="flex:0 0 54px;text-align:right">0.50</span>' +
            '</div>' +
            '<table class="binmat" style="width:100%;font-size:12.5px">' +
              '<thead>' +
                '<tr>' +
                  '<th style="text-align:left">Componente</th>' +
                  '<th>Prior ' + tex('\\pi_k') + '</th>' +
                  '<th>Verossimilhança ' + tex('p(x_n \\mid \\theta_k)') + '</th>' +
                  '<th>Numerador</th>' +
                  '<th>Responsabilidade ' + tex('\\gamma_{nk}') + '</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody class="tb-bayes-body"></tbody>' +
            '</table>' +
            '<div class="formula sm" style="margin-top:2px">' +
              '<span class="out-bayes-sum" style="font-family:var(--mono);font-size:12.5px;color:var(--fg);line-height:1.75"></span>' +
            '</div>' +
          '</div>' +
          '<div class="lab-panel" style="display:flex;flex-direction:column;align-items:center">' +
            '<canvas class="bayes-num-cv" width="410" height="300"></canvas>' +
            '<p class="lab-caption">Em cima, as duas densidades ponderadas ' + tex('\\pi_k\\, p(x \\mid \\theta_k)') +
            ' lidas em ' + tex('x_n') + '. Embaixo, as mesmas duas alturas normalizadas para somar 1.</p>' +
          '</div>' +
        '</div>';

      var sX = inst.el.querySelector('.s-xpos');
      var vX = inst.el.querySelector('.v-xpos');
      var tbody = inst.el.querySelector('.tb-bayes-body');
      var outSum = inst.el.querySelector('.out-bayes-sum');
      var cv = inst.el.querySelector('.bayes-num-cv');
      var ctx = setupCanvas(cv, 410, 300);

      var comps = [
        { mu: -1.5, sigma: 1.0, pi: 0.5 },
        { mu: 1.5, sigma: 1.0, pi: 0.5 }
      ];
      function weighted(k, x) {
        var c = comps[k];
        return c.pi * (1 / (c.sigma * Math.sqrt(2 * Math.PI))) *
               Math.exp(-0.5 * Math.pow((x - c.mu) / c.sigma, 2));
      }

      function draw(x, num1, num2, g1, g2) {
        ctx.clearRect(0, 0, 410, 300);

        /* Painel de cima: as duas densidades ponderadas e a leitura em x_n */
        var top = F.subPlot(ctx, { x: 0, y: 0, w: 410, h: 208 },
          { xlim: [-4.6, 4.6], ylim: [0, 0.235], pad: { l: 44, r: 12, t: 14, b: 30 } });
        top.frame({ xlabel: 'x', ylabel: 'densidade ponderada' });
        top.clip();
        for (var k = 0; k < 2; k++) {
          var curve = [];
          for (var xx = -4.6; xx <= 4.6; xx += 0.05) curve.push([xx, weighted(k, xx)]);
          top.line(curve, C.d[k], 2);
        }
        top.segment(-4.6, num1, x, num1, C.d[0], { width: 1, dash: [3, 3] });
        top.segment(-4.6, num2, x, num2, C.d[1], { width: 1, dash: [3, 3] });
        top.segment(x, 0, x, 0.235, C.fg, { width: 1.4, dash: [4, 3] });
        top.dot(x, num1, 5, C.d[0]);
        top.dot(x, num2, 5, C.d[1]);
        top.label(x, 0.222, 'x_n = ' + x.toFixed(2), C.fg,
                  { size: 11, box: true, align: x > 1.2 ? 'right' : 'left', dx: x > 1.2 ? -6 : 6 });
        top.unclip();

        /* Painel de baixo: a normalização — as duas alturas viram uma barra 0–100% */
        var bx = 44, bw = 410 - 44 - 12, by = 248, bh = 28;
        ctx.save();
        ctx.fillStyle = C.muted; ctx.font = '10.5px ' + MONO;
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillText('÷ p(x_n), o denominador comum:', bx, by - 10);
        ctx.fillStyle = C.d[0]; ctx.fillRect(bx, by, bw * g1, bh);
        ctx.fillStyle = C.d[1]; ctx.fillRect(bx + bw * g1, by, bw * g2, bh);
        ctx.fillStyle = '#FFFFFF'; ctx.font = '600 12px ' + MONO; ctx.textBaseline = 'middle';
        ctx.fillText((g1 * 100).toFixed(1) + '%', bx + 9, by + bh / 2);
        ctx.textAlign = 'right';
        ctx.fillText((g2 * 100).toFixed(1) + '%', bx + bw - 9, by + bh / 2);
        ctx.restore();
      }

      function update() {
        var x = parseFloat(sX.value);
        vX.textContent = x.toFixed(2);

        var num1 = weighted(0, x), num2 = weighted(1, x);
        var denom = num1 + num2;
        var g1 = num1 / denom, g2 = num2 / denom;

        tbody.innerHTML =
          '<tr>' +
            '<td class="rowlab" style="color:var(--d1)">k = 1 · μ₁ = −1.5</td>' +
            '<td>' + comps[0].pi.toFixed(2) + '</td>' +
            '<td>' + (num1 / comps[0].pi).toFixed(4) + '</td>' +
            '<td style="color:var(--d1)">' + num1.toFixed(4) + '</td>' +
            '<td class="one" style="font-size:14px;font-weight:600">' + g1.toFixed(3) + ' (' + (g1 * 100).toFixed(1) + '%)</td>' +
          '</tr>' +
          '<tr>' +
            '<td class="rowlab" style="color:var(--d2)">k = 2 · μ₂ = +1.5</td>' +
            '<td>' + comps[1].pi.toFixed(2) + '</td>' +
            '<td>' + (num2 / comps[1].pi).toFixed(4) + '</td>' +
            '<td style="color:var(--d2)">' + num2.toFixed(4) + '</td>' +
            '<td class="one" style="font-size:14px;font-weight:600">' + g2.toFixed(3) + ' (' + (g2 * 100).toFixed(1) + '%)</td>' +
          '</tr>';

        outSum.innerHTML =
          'p(x_n) = ' + num1.toFixed(4) + ' + ' + num2.toFixed(4) + ' = <b>' + denom.toFixed(4) + '</b>' +
          '  <span style="color:var(--fg-dim)">← o denominador comum</span><br>' +
          'γ_n1 + γ_n2 = ' + g1.toFixed(3) + ' + ' + g2.toFixed(3) + ' = <b>1.000</b>' +
          '  <span style="color:var(--fg-dim)">← soma unitária garantida</span>';

        draw(x, num1, num2, g1, g2);
      }

      sX.addEventListener('input', update);
      inst.state.update = update;
    },
    start: function (inst) {
      if (inst.state.update) inst.state.update();
    }
  });

  LAB.register('lab-j-by-hand', {
    build: function (inst) {
      inst.el.innerHTML =
        '<div class="lab-grid-2">' +
          '<div class="lab-panel">' +
            '<div class="lab-title">6 pontos fixos: {1, 2, 3} (Grupo 1) e {7, 8, 9} (Grupo 2)</div>' +
            '<div class="slider-row"><label style="color:var(--d1)">Centróide μ₁</label><input type="range" class="s-mu1" min="0" max="6" step="0.2" value="1.0"><span class="v-mu1">1.0</span></div>' +
            '<div class="slider-row"><label style="color:var(--d2)">Centróide μ₂</label><input type="range" class="s-mu2" min="4" max="10" step="0.2" value="9.0"><span class="v-mu2">9.0</span></div>' +
            '<div class="lab-stats-box" style="margin-top:12px">' +
              '<div>Inércia total <b>J = ∑ (x_n − μ_k)²</b>: <span class="out-j-total" style="color:var(--accent);font-size:16px;font-weight:600">--</span></div>' +
              '<div class="j-hint" style="font-size:12px;color:var(--fg-dim);margin-top:4px">Coloque μ₁ = 2.0 (média de 1,2,3) e μ₂ = 8.0 (média de 7,8,9) para atingir o mínimo global J = 4.0!</div>' +
            '</div>' +
          '</div>' +
          '<div class="lab-panel">' +
            '<table class="binmat" style="width:100%;font-size:12px">' +
              '<thead><tr><th>Amostra x_n</th><th>Grupo k</th><th>Distância (x−μ)</th><th>Quadrado (x−μ)²</th></tr></thead>' +
              '<tbody class="tb-j-body"></tbody>' +
            '</table>' +
          '</div>' +
        '</div>';

      var sMu1 = inst.el.querySelector('.s-mu1');
      var sMu2 = inst.el.querySelector('.s-mu2');
      var vMu1 = inst.el.querySelector('.v-mu1');
      var vMu2 = inst.el.querySelector('.v-mu2');
      var outJ = inst.el.querySelector('.out-j-total');
      var tbody = inst.el.querySelector('.tb-j-body');

      var pts = [1, 2, 3, 7, 8, 9];

      function update() {
        var m1 = parseFloat(sMu1.value);
        var m2 = parseFloat(sMu2.value);
        vMu1.textContent = m1.toFixed(1);
        vMu2.textContent = m2.toFixed(1);

        var totalJ = 0;
        var rowsHtml = '';
        pts.forEach(function (x, i) {
          var k = i < 3 ? 1 : 2;
          var mu = k === 1 ? m1 : m2;
          var diff = x - mu;
          var diff2 = diff * diff;
          totalJ += diff2;
          rowsHtml +=
            '<tr>' +
              '<td class="rowlab">x_' + (i + 1) + ' = ' + x + '</td>' +
              '<td style="color:' + (k === 1 ? 'var(--d1)' : 'var(--d2)') + '">k = ' + k + '</td>' +
              '<td>' + diff.toFixed(1) + '</td>' +
              '<td style="font-weight:600;color:var(--accent)">' + diff2.toFixed(2) + '</td>' +
            '</tr>';
        });

        tbody.innerHTML = rowsHtml;
        outJ.textContent = totalJ.toFixed(2);
      }

      sMu1.addEventListener('input', update);
      sMu2.addEventListener('input', update);
      inst.state.update = update;
    },
    start: function (inst) {
      if (inst.state.update) inst.state.update();
    }
  });

  /* =========================================================================
     8. LAB: LLOYD MEIO-PASSO A MEIO-PASSO (Slide 18)
     ========================================================================= */
  LAB.register('lab-lloyd-half', {
    build: function (inst) {
      inst.el.innerHTML =
        '<div class="lab-grid-2">' +
          '<div class="lab-panel">' +
            '<div class="lab-title">Execução Passo a Passo do K-Means:</div>' +
            '<div class="lab-btn-row">' +
              '<button type="button" class="btn btn-lloyd-assign">1. Passo Atribuir (r_{nk})</button>' +
              '<button type="button" class="btn btn-lloyd-update" disabled>2. Passo Atualizar (μ_k)</button>' +
              '<button type="button" class="btn btn-lloyd-reset">Reiniciar</button>' +
            '</div>' +
            '<div class="lab-stats-box" style="margin-top:14px">' +
              '<div>Fase Atual: <b class="lloyd-phase" style="color:var(--accent)">Inicial (Pronto para Atribuir)</b></div>' +
              '<div>Iteração: <span class="lloyd-iter">0</span> &nbsp;·&nbsp; Inércia J: <span class="lloyd-j" style="color:var(--m2);font-weight:600">--</span></div>' +
            '</div>' +
            '<p class="lab-caption" style="margin-top:8px">Observe como J é recomputado após cada metade do ciclo e nunca sobe.</p>' +
          '</div>' +
          '<div class="lab-panel" style="display:flex;flex-direction:column;align-items:center">' +
            '<canvas class="lloyd-cv" width="460" height="240"></canvas>' +
          '</div>' +
        '</div>';

      var cv = inst.el.querySelector('.lloyd-cv');
      var ctx = setupCanvas(cv, 460, 240);
      var btnAssign = inst.el.querySelector('.btn-lloyd-assign');
      var btnUpdate = inst.el.querySelector('.btn-lloyd-update');
      var btnReset = inst.el.querySelector('.btn-lloyd-reset');
      var outPhase = inst.el.querySelector('.lloyd-phase');
      var outIter = inst.el.querySelector('.lloyd-iter');
      var outJ = inst.el.querySelector('.lloyd-j');

      var pts = [
        [-3.0, -2.0], [-2.5, -3.0], [-3.5, -2.5], [-2.0, -2.0],
        [3.0, 3.0], [2.5, 3.5], [3.5, 2.5], [2.0, 3.0]
      ];
      var K = 2;
      var centers = [[-1.0, 3.0], [1.0, -3.0]]; // Centróides iniciais ruins
      var labels = new Array(pts.length).fill(0);
      var iter = 0;
      var nextStep = 'assign'; // 'assign' | 'update'

      function computeJ() {
        var J = 0;
        for (var i = 0; i < pts.length; i++) {
          J += M.distND2(pts[i], centers[labels[i]]);
        }
        return J;
      }

      function draw() {
        ctx.clearRect(0, 0, 460, 240);
        var p = new F.Plot(cv, { w: 460, h: 240, xlim: [-5, 5], ylim: [-5, 5], equal: true, pad: { l: 20, r: 10, t: 15, b: 20 } });
        p.frame({ grid: true });
        p.clip();

        // Linhas de conexão dos pontos ao centróide atribuído
        for (var i = 0; i < pts.length; i++) {
          var c = centers[labels[i]];
          p.line([pts[i], c], 'rgba(28,25,23,0.22)', 1, [3, 3]);
          p.dot(pts[i][0], pts[i][1], 5, C.d[labels[i]], 0.9);
        }

        // Centróides
        centers.forEach(function (c, k) {
          p.cross(c[0], c[1], 8, C.d[k]);
          p.label(c[0], c[1], ' μ_' + (k + 1), C.fg, { size: 11, box: true, dx: 10 });
        });

        p.unclip();
      }

      function doAssign() {
        var res = M.assign(pts, centers);
        labels = res.labels;
        var J = computeJ();
        outJ.textContent = J.toFixed(2);
        outPhase.textContent = 'Atribuição feita (r_{nk} atualizado)';
        nextStep = 'update';
        btnAssign.disabled = true;
        btnUpdate.disabled = false;
        draw();
      }

      function doUpdate() {
        centers = M.updateCenters(pts, labels, K, centers);
        iter++;
        var J = computeJ();
        outJ.textContent = J.toFixed(2);
        outIter.textContent = iter;
        outPhase.textContent = 'Atualização feita (μ_k recalculado como média)';
        nextStep = 'assign';
        btnAssign.disabled = false;
        btnUpdate.disabled = true;
        draw();
      }

      function reset() {
        centers = [[-1.0, 3.0], [1.0, -3.0]];
        labels = new Array(pts.length).fill(0);
        iter = 0;
        nextStep = 'assign';
        btnAssign.disabled = false;
        btnUpdate.disabled = true;
        outPhase.textContent = 'Inicial (Pronto para Atribuir)';
        outIter.textContent = '0';
        outJ.textContent = computeJ().toFixed(2);
        draw();
      }

      btnAssign.addEventListener('click', doAssign);
      btnUpdate.addEventListener('click', doUpdate);
      btnReset.addEventListener('click', reset);

      inst.state.reset = reset;
    },
    start: function (inst) {
      if (inst.state.reset) inst.state.reset();
    }
  });

  /* =========================================================================
     9. LAB: POR QUE A MÉDIA? (Slide 19)
     ========================================================================= */
  LAB.register('lab-parabola-mean', {
    build: function (inst) {
      inst.el.innerHTML =
        '<div class="lab-grid-2">' +
          '<div class="lab-panel">' +
            '<div class="lab-title">Derivação: Minimizando J(μ) = ∑_{i=1}^N (x_i − μ)²</div>' +
            '<div class="node accent" style="font-size:13px;line-height:1.6">' +
              '1. Derivada: <code>dJ/dμ = ∑ 2(x_i − μ)(−1) = −2 ∑ (x_i − μ)</code><br>' +
              '2. Igualando a zero: <code>−2 (∑ x_i − N·μ) = 0</code><br>' +
              '3. Isolando μ: <code>N·μ = ∑ x_i ⟹ μ = (1/N) ∑ x_i</code> (a média aritmética!)' +
            '</div>' +
            '<div class="slider-row" style="margin-top:14px"><label>Testar μ:</label><input type="range" class="s-test-mu" min="0" max="10" step="0.1" value="3.0"><span class="v-test-mu">3.0</span></div>' +
            '<div class="lab-stats-box" style="margin-top:10px">' +
              '<div>Pontos dados: <b>{2, 4, 9}</b> (N=3, Média x̄ = <b>5.0</b>)</div>' +
              '<div>Valor de J(μ): <span class="out-parab-j" style="color:var(--accent);font-weight:600">--</span></div>' +
              '<div>Derivada dJ/dμ: <span class="out-parab-grad" style="color:var(--m2)">--</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="lab-panel" style="display:flex;flex-direction:column;align-items:center">' +
            '<canvas class="parab-cv" width="460" height="230"></canvas>' +
            '<p class="lab-caption">A curva J(μ) é estritamente uma parábola com concavidade para cima. O vértice (mínimo global) ocorre exatamente na média x̄.</p>' +
          '</div>' +
        '</div>';

      var cv = inst.el.querySelector('.parab-cv');
      var ctx = setupCanvas(cv, 460, 230);
      var sMu = inst.el.querySelector('.s-test-mu');
      var vMu = inst.el.querySelector('.v-test-mu');
      var outJ = inst.el.querySelector('.out-parab-j');
      var outGrad = inst.el.querySelector('.out-parab-grad');

      var pts = [2, 4, 9];
      var mean = 5.0;

      function update() {
        var mu = parseFloat(sMu.value);
        vMu.textContent = mu.toFixed(1);

        var J = M.distortion1D(pts, mu);
        var grad = -2 * pts.reduce(function (s, x) { return s + (x - mu); }, 0);

        outJ.textContent = J.toFixed(2) + (Math.abs(mu - mean) < 0.05 ? ' (MÍNIMO GLOBAL!)' : '');
        outGrad.textContent = grad.toFixed(2) + (Math.abs(grad) < 0.1 ? ' (Zero!)' : '');

        ctx.clearRect(0, 0, 460, 230);
        var p = new F.Plot(cv, { w: 460, h: 230, xlim: [0, 10], ylim: [20, 120], pad: { l: 30, r: 15, t: 15, b: 25 } });
        p.frame({ xlabel: 'μ', ylabel: 'J(μ)' });
        p.clip();

        // Parábola
        var curve = [];
        for (var m = 0; m <= 10; m += 0.2) {
          curve.push([m, M.distortion1D(pts, m)]);
        }
        p.line(curve, C.d[1], 2);

        // Vértice na média x̄ = 5.0
        p.line([[mean, 20], [mean, 120]], C.accent, 1.2, [4, 4]);
        p.dot(mean, M.distortion1D(pts, mean), 5, C.accent);
        p.label(mean, 28, 'x̄ = 5.0', C.accent, { align: 'center', box: true });

        // Ponto atual testado
        p.dot(mu, J, 6.5, C.fg);
        p.label(mu, J + 10, 'μ = ' + mu.toFixed(1), C.fg, { align: 'center', box: true });

        p.unclip();
      }

      sMu.addEventListener('input', update);
      inst.state.update = update;
    },
    start: function (inst) {
      if (inst.state.update) inst.state.update();
    }
  });

  /* =========================================================================
     10. LAB: LABORATÓRIO DO K (Slide 22)
     ========================================================================= */
  LAB.register('lab-k-explorer', {
    build: function (inst) {
      inst.el.innerHTML =
        '<div class="lab-grid-2">' +
          '<div class="lab-panel">' +
            '<div class="lab-title">Ajuste K e veja a partição e métricas em tempo real:</div>' +
            '<div class="slider-row" style="margin:12px 0">' +
              '<label>Número de Clusters K:</label>' +
              '<input type="range" class="s-k-val" min="1" max="8" step="1" value="4" style="flex:1">' +
              '<span class="v-k-val" style="width:40px;text-align:right;font-weight:600;color:var(--accent)">4</span>' +
            '</div>' +
            '<div class="lab-stats-box">' +
              '<div>Inércia <b>J(K)</b>: <span class="out-k-j" style="color:var(--accent);font-weight:600">--</span></div>' +
              '<div>Silhueta Média <b>s(K)</b>: <span class="out-k-sil" style="color:var(--m2);font-weight:600">--</span></div>' +
            '</div>' +
            '<p class="lab-caption" style="margin-top:10px">Dataset sintético com 4 grupos verdadeiros. Observe como o pico da silhueta identifica K=4 com precisão.</p>' +
          '</div>' +
          '<div class="lab-panel" style="display:flex;flex-direction:column;align-items:center">' +
            '<canvas class="k-cv" width="460" height="240"></canvas>' +
          '</div>' +
        '</div>';

      var cv = inst.el.querySelector('.k-cv');
      var ctx = setupCanvas(cv, 460, 240);
      var sK = inst.el.querySelector('.s-k-val');
      var vK = inst.el.querySelector('.v-k-val');
      var outJ = inst.el.querySelector('.out-k-j');
      var outSil = inst.el.querySelector('.out-k-sil');

      var dataObj = F.blobs4();
      var X = dataObj.X;

      function update() {
        var K = parseInt(sK.value, 10);
        vK.textContent = K;

        var km = M.kmeansBest(X, K, 5, 42);
        var sil = K > 1 ? M.silhouette(X, km.labels, K) : 0;

        outJ.textContent = km.inertia.toFixed(1);
        outSil.textContent = K > 1 ? sil.toFixed(3) : 'Indefinida (K=1)';

        ctx.clearRect(0, 0, 460, 240);
        var p = new F.Plot(cv, { w: 460, h: 240, xlim: [-7, 7], ylim: [-7, 7], equal: true, pad: { l: 20, r: 10, t: 15, b: 20 } });
        p.frame({ grid: true });
        p.clip();

        // Pontos coloridos pelo cluster
        for (var i = 0; i < X.length; i++) {
          p.dot(X[i][0], X[i][1], 3.2, C.d[km.labels[i] % C.d.length], 0.85);
        }

        // Centróides
        km.centers.forEach(function (c, k) {
          p.cross(c[0], c[1], 7, C.fg);
        });

        p.unclip();
      }

      sK.addEventListener('input', update);
      inst.state.update = update;
    },
    start: function (inst) {
      if (inst.state.update) inst.state.update();
    }
  });

  /* =========================================================================
     11. LAB: ROLETA DO K-MEANS++ (Slide 24)
     ========================================================================= */
  LAB.register('lab-kmeans-plusplus', {
    build: function (inst) {
      inst.el.innerHTML =
        '<div class="lab-grid-2">' +
          '<div class="lab-panel">' +
            '<div class="lab-title">Semeadura Probabilística: p(x) ∝ D(x)²</div>' +
            '<div class="lab-btn-row">' +
              '<button type="button" class="btn btn-kmpp-spin">🎯 Sortear Próximo Centróide</button>' +
              '<button type="button" class="btn btn-kmpp-reset">Reiniciar</button>' +
            '</div>' +
            '<div class="lab-stats-box" style="margin-top:14px">' +
              '<div>Centróides Escolhidos: <b class="kmpp-count" style="color:var(--accent)">1 / 4</b></div>' +
              '<div class="kmpp-log" style="font-size:12px;color:var(--fg-dim);margin-top:4px">O primeiro centróide foi sorteado uniformemente. O próximo favorece pontos distantes!</div>' +
            '</div>' +
          '</div>' +
          '<div class="lab-panel" style="display:flex;flex-direction:column;align-items:center">' +
            '<canvas class="kmpp-cv" width="460" height="240"></canvas>' +
            '<p class="lab-caption">O mapa de calor ilustra D(x)²: regiões amarelas têm alta probabilidade de abrigar o próximo centro.</p>' +
          '</div>' +
        '</div>';

      var cv = inst.el.querySelector('.kmpp-cv');
      var ctx = setupCanvas(cv, 460, 240);
      var btnSpin = inst.el.querySelector('.btn-kmpp-spin');
      var btnReset = inst.el.querySelector('.btn-kmpp-reset');
      var outCount = inst.el.querySelector('.kmpp-count');
      var outLog = inst.el.querySelector('.kmpp-log');

      var dataObj = F.blobs4();
      var X = dataObj.X;
      var K = 4;
      var centers = [];
      var rng = M.mulberry32(777);

      function initFirst() {
        centers = [X[Math.floor(rng() * X.length)].slice()];
        outCount.textContent = centers.length + ' / ' + K;
        outLog.textContent = 'Centróide 1 sorteado uniformemente.';
        btnSpin.disabled = false;
        draw();
      }

      function spinNext() {
        if (centers.length >= K) return;
        var n = X.length;
        var D2 = [];
        var tot = 0;
        for (var i = 0; i < n; i++) {
          var minD = Infinity;
          for (var c = 0; c < centers.length; c++) {
            var d = M.distND2(X[i], centers[c]);
            if (d < minD) minD = d;
          }
          D2.push(minD);
          tot += minD;
        }

        var target = rng() * tot;
        var acc = 0, pick = n - 1;
        for (i = 0; i < n; i++) {
          acc += D2[i];
          if (acc >= target) { pick = i; break; }
        }
        centers.push(X[pick].slice());
        outCount.textContent = centers.length + ' / ' + K;
        outLog.textContent = 'Centróide ' + centers.length + ' sorteado com probabilidade ∝ D²!';
        if (centers.length >= K) btnSpin.disabled = true;
        draw();
      }

      function draw() {
        ctx.clearRect(0, 0, 460, 240);
        var p = new F.Plot(cv, { w: 460, h: 240, xlim: [-7, 7], ylim: [-7, 7], equal: true, pad: { l: 20, r: 10, t: 15, b: 20 } });
        p.frame({ grid: true });
        p.clip();

        // Calcula distâncias mínimas para colorir pontos
        var maxD = 0;
        var dists = X.map(function (pt) {
          var md = Infinity;
          centers.forEach(function (c) {
            var d = M.distND2(pt, c);
            if (d < md) md = d;
          });
          if (md > maxD) maxD = md;
          return md;
        });

        // Desenha pontos iluminados pela distância ao quadrado
        for (var i = 0; i < X.length; i++) {
          var normD = maxD > 0 ? dists[i] / maxD : 0;
          p.dot(X[i][0], X[i][1], 3.5, normD > 0.4 ? C.accent : C.dim, 0.4 + 0.6 * normD);
        }

        // Desenha centróides
        centers.forEach(function (c, k) {
          p.cross(c[0], c[1], 8, C.fg);
          p.ring(c[0], c[1], 12, C.d[k], 2);
        });

        p.unclip();
      }

      btnSpin.addEventListener('click', spinNext);
      btnReset.addEventListener('click', initFirst);

      inst.state.initFirst = initFirst;
    },
    start: function (inst) {
      if (inst.state.initFirst) inst.state.initFirst();
    }
  });

  /* =========================================================================
     11b. LAB: K-MEANS EM IMAGENS — QUANTIZAÇÃO DE CORES (Slide 38)
     ========================================================================= */
  LAB.register('lab-image-quantization', {
    build: function (inst) {
      inst.el.innerHTML =
        '<div class="lab-grid-2">' +
          '<div class="lab-panel">' +
            '<div class="lab-title">Quantização e Compressão de Imagens via K-Means</div>' +
            '<p style="font-size:12.5px;color:var(--fg-muted);margin:0">Cada pixel é um vetor 3-D em RGB: \\(\\mathbf{x}_n = (R_n, G_n, B_n) \\in [0, 255]^3\\). O K-Means agrupa os pixels em \\(K\\) centróides de cores e substitui cada pixel pela sua cor mais próxima.</p>' +
            '<div class="slider-row"><label>Número de Cores (K):</label><input type="range" class="s-k" min="2" max="16" step="1" value="4"><span class="v-k">4</span></div>' +
            '<div class="lab-btn-row">' +
              '<button type="button" class="btn btn-sample-sunset active">Pôr do Sol (Gradiente)</button>' +
              '<button type="button" class="btn btn-sample-mario">Pixel Art 16×16</button>' +
            '</div>' +
            '<div class="lab-stats-box iq-stats">' +
              '<div><b>Cores Originais:</b> 256 cores (24 bits/pixel = 16.7M possíveis)</div>' +
              '<div><b>Cores Quantizadas:</b> <span class="out-k-colors" style="color:var(--accent);font-weight:600">4</span> cores centróides</div>' +
              '<div><b>Armazenamento da Paleta:</b> <span class="out-bpp" style="color:var(--m2);font-weight:600">2 bits/pixel</span> (Redução de 91.7% no mapa de índices!)</div>' +
              '<div class="palette-swatches" style="display:flex;gap:6px;margin-top:4px"></div>' +
            '</div>' +
          '</div>' +
          '<div class="lab-panel" style="align-items:center">' +
            '<div style="display:flex;gap:16px;justify-content:center;align-items:center">' +
              '<div style="text-align:center"><div style="font-size:11px;color:var(--fg-dim);font-family:var(--mono);margin-bottom:4px">Original (24 bits)</div><canvas width="160" height="160" class="cv-orig"></canvas></div>' +
              '<div style="text-align:center"><div style="font-size:11px;color:var(--accent);font-family:var(--mono);margin-bottom:4px">Quantizada (K-Means)</div><canvas width="160" height="160" class="cv-quant"></canvas></div>' +
            '</div>' +
            '<div class="lab-caption">À esquerda, imagem contínua em RGB. À direita, imagem reconstruída projetando todos os pixels nos \\(K\\) centróides de cor.</div>' +
          '</div>' +
        '</div>';

      var cvOrig = inst.el.querySelector('.cv-orig');
      var cvQuant = inst.el.querySelector('.cv-quant');
      var ctxOrig = setupCanvas(cvOrig, 160, 160);
      var ctxQuant = setupCanvas(cvQuant, 160, 160);

      var sK = inst.el.querySelector('.s-k');
      var vK = inst.el.querySelector('.v-k');
      var outKColors = inst.el.querySelector('.out-k-colors');
      var outBpp = inst.el.querySelector('.out-bpp');
      var swatches = inst.el.querySelector('.palette-swatches');

      var btnSunset = inst.el.querySelector('.btn-sample-sunset');
      var btnMario = inst.el.querySelector('.btn-sample-mario');

      renderMathEl(inst.el.querySelector('.lab-panel'));

      var currentType = 'sunset';
      var N = 16;
      var pixels = [];

      function generatePixels() {
        pixels = [];
        for (var r = 0; r < N; r++) {
          for (var c = 0; c < N; c++) {
            if (currentType === 'sunset') {
              var red = Math.floor(255 * (1 - r / N * 0.5));
              var green = Math.floor(80 + 140 * Math.sin(c / N * Math.PI) * (1 - r / N));
              var blue = Math.floor(180 * (r / N) + 40 * (1 - c / N));
              pixels.push([red, green, blue]);
            } else {
              var isBorder = (r === 0 || r === 15 || c === 0 || c === 15);
              var isCenter = (r >= 5 && r <= 10 && c >= 5 && c <= 10);
              var isCap = (r >= 2 && r <= 7 && c >= 3 && c <= 12);
              if (isCenter) pixels.push([240, 230, 180]);
              else if (isCap) pixels.push([220, 40, 40]);
              else if (isBorder) pixels.push([30, 30, 40]);
              else pixels.push([70, 140, 240]);
            }
          }
        }
      }

      function update() {
        var K = parseInt(sK.value, 10);
        vK.textContent = K;
        outKColors.textContent = K;
        var bpp = Math.ceil(Math.log2(K));
        var reduction = ((1 - bpp / 24) * 100).toFixed(1);
        outBpp.textContent = bpp + ' bits/pixel (Redução de ' + reduction + '%)';

        // Desenhar original
        var imgOrig = ctxOrig.createImageData(N, N);
        for (var i = 0; i < pixels.length; i++) {
          imgOrig.data[i * 4 + 0] = pixels[i][0];
          imgOrig.data[i * 4 + 1] = pixels[i][1];
          imgOrig.data[i * 4 + 2] = pixels[i][2];
          imgOrig.data[i * 4 + 3] = 255;
        }

        var tcv = document.createElement('canvas');
        tcv.width = N; tcv.height = N;
        tcv.getContext('2d').putImageData(imgOrig, 0, 0);
        ctxOrig.imageSmoothingEnabled = false;
        ctxOrig.drawImage(tcv, 0, 0, 160, 160);

        // Executar K-Means 3D nas cores
        var km = M.kmeans(pixels, K, { nInit: 5, maxIter: 20 });
        var imgQuant = ctxQuant.createImageData(N, N);
        for (var j = 0; j < pixels.length; j++) {
          var cluster = km.labels[j];
          var centroid = km.centroids[cluster];
          imgQuant.data[j * 4 + 0] = Math.round(centroid[0]);
          imgQuant.data[j * 4 + 1] = Math.round(centroid[1]);
          imgQuant.data[j * 4 + 2] = Math.round(centroid[2]);
          imgQuant.data[j * 4 + 3] = 255;
        }
        var tcvQ = document.createElement('canvas');
        tcvQ.width = N; tcvQ.height = N;
        tcvQ.getContext('2d').putImageData(imgQuant, 0, 0);
        ctxQuant.imageSmoothingEnabled = false;
        ctxQuant.drawImage(tcvQ, 0, 0, 160, 160);

        // Renderizar paleta de cores
        swatches.innerHTML = km.centroids.map(function (c) {
          var rgb = 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')';
          return '<span style="display:inline-block;width:22px;height:14px;background:' + rgb + ';border:1px solid rgba(255,255,255,0.3);border-radius:2px" title="' + rgb + '"></span>';
        }).join('');
      }

      btnSunset.addEventListener('click', function () {
        currentType = 'sunset';
        btnSunset.classList.add('active');
        btnMario.classList.remove('active');
        generatePixels();
        update();
      });

      btnMario.addEventListener('click', function () {
        currentType = 'mario';
        btnMario.classList.add('active');
        btnSunset.classList.remove('active');
        generatePixels();
        update();
      });

      sK.addEventListener('input', update);

      generatePixels();
      inst.state.update = update;
    },
    start: function (inst) {
      if (inst.state.update) inst.state.update();
    }
  });

  /* =========================================================================
     12. LAB: PINTE UM DÍGITO (Slide 28)
     ========================================================================= */
  LAB.register('lab-paint-digit', {
    build: function (inst) {
      inst.el.innerHTML =
        '<div class="lab-grid-2">' +
          '<div class="lab-panel">' +
            '<div class="lab-title">Pinte os pixels na grade 8×8 (clique ou arraste):</div>' +
            '<div class="digit-grid" style="display:grid;grid-template-columns:repeat(8, 26px);gap:3px;margin:12px 0"></div>' +
            '<div class="lab-btn-row">' +
              '<button type="button" class="btn btn-p-0">Preset 0</button>' +
              '<button type="button" class="btn btn-p-1">Preset 1</button>' +
              '<button type="button" class="btn btn-p-7">Preset 7</button>' +
              '<button type="button" class="btn btn-p-clear">Limpar</button>' +
            '</div>' +
          '</div>' +
          '<div class="lab-panel">' +
            '<div class="lab-title">Reconhecimento Probabilístico (Mistura de Bernoulli):</div>' +
            '<div class="lab-stats-box" style="margin-top:10px">' +
              '<div class="digit-res-row"><b>Componente 1 ("0"):</b> <div class="prog-bar"><div class="prog-fill f1"></div></div> <span class="g-v1">--</span></div>' +
              '<div class="digit-res-row" style="margin-top:8px"><b>Componente 2 ("1"):</b> <div class="prog-bar"><div class="prog-fill f2"></div></div> <span class="g-v2">--</span></div>' +
              '<div class="digit-res-row" style="margin-top:8px"><b>Componente 3 ("7"):</b> <div class="prog-bar"><div class="prog-fill f3"></div></div> <span class="g-v3">--</span></div>' +
            '</div>' +
            '<div class="formula sm" style="margin-top:14px">' +
              '<span class="formula-label">Veredito do Modelo</span>' +
              '<div class="digit-verdict" style="font-family:var(--mono);font-size:15px;color:var(--accent);font-weight:600">--</div>' +
            '</div>' +
          '</div>' +
        '</div>';

      var gridEl = inst.el.querySelector('.digit-grid');
      var f1 = inst.el.querySelector('.f1');
      var f2 = inst.el.querySelector('.f2');
      var f3 = inst.el.querySelector('.f3');
      var gv1 = inst.el.querySelector('.g-v1');
      var gv2 = inst.el.querySelector('.g-v2');
      var gv3 = inst.el.querySelector('.g-v3');
      var verdict = inst.el.querySelector('.digit-verdict');

      var btnP0 = inst.el.querySelector('.btn-p-0');
      var btnP1 = inst.el.querySelector('.btn-p-1');
      var btnP7 = inst.el.querySelector('.btn-p-7');
      var btnClr = inst.el.querySelector('.btn-p-clear');

      var pixels = new Array(64).fill(0);
      var cells = [];

      // Carrega os protótipos de Bernoulli do dataset de dígitos
      var dData = F.digitsData();
      var protos = dData.protos; // 3 protótipos 8x8 de 64 bits

      for (var i = 0; i < 64; i++) {
        var cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.idx = i;
        cell.style.cssText = 'width:26px;height:26px;background:var(--surface);border:1px solid var(--line-strong);cursor:pointer;border-radius:2px;';
        gridEl.appendChild(cell);
        cells.push(cell);
      }

      var isMouseDown = false;
      gridEl.addEventListener('mousedown', function (e) {
        isMouseDown = true;
        toggleCell(e);
      });
      window.addEventListener('mouseup', function () { isMouseDown = false; });
      gridEl.addEventListener('mouseover', function (e) {
        if (isMouseDown) toggleCell(e, true);
      });

      function toggleCell(e, onlySet) {
        var t = e.target;
        if (!t || !t.classList.contains('grid-cell')) return;
        var idx = parseInt(t.dataset.idx, 10);
        if (onlySet) pixels[idx] = 1;
        else pixels[idx] = pixels[idx] ? 0 : 1;
        renderGrid();
        evaluate();
      }

      function renderGrid() {
        for (var i = 0; i < 64; i++) {
          cells[i].style.background = pixels[i] ? 'var(--accent)' : 'var(--surface)';
        }
      }

      function evaluate() {
        var pis = [1 / 3, 1 / 3, 1 / 3];
        var logLiks = [];
        for (var k = 0; k < 3; k++) {
          var ll = Math.log(pis[k]);
          for (var d = 0; d < 64; d++) {
            var mu = protos[k][d] ? 0.90 : 0.10; // suavizado
            ll += pixels[d] ? Math.log(mu) : Math.log(1 - mu);
          }
          logLiks.push(ll);
        }
        var lse = M.logSumExp(logLiks);
        var gammas = logLiks.map(function (l) { return Math.exp(l - lse); });

        f1.style.width = (gammas[0] * 100) + '%';
        f2.style.width = (gammas[1] * 100) + '%';
        f3.style.width = (gammas[2] * 100) + '%';

        gv1.textContent = (gammas[0] * 100).toFixed(1) + '%';
        gv2.textContent = (gammas[1] * 100).toFixed(1) + '%';
        gv3.textContent = (gammas[2] * 100).toFixed(1) + '%';

        var bestK = 0;
        if (gammas[1] > gammas[bestK]) bestK = 1;
        if (gammas[2] > gammas[bestK]) bestK = 2;

        var names = ['Dígito 0', 'Dígito 1', 'Dígito 7'];
        verdict.textContent = names[bestK] + ' (' + (gammas[bestK] * 100).toFixed(1) + '% de confiança)';
      }

      btnP0.addEventListener('click', function () { pixels = protos[0].slice(); renderGrid(); evaluate(); });
      btnP1.addEventListener('click', function () { pixels = protos[1].slice(); renderGrid(); evaluate(); });
      btnP7.addEventListener('click', function () { pixels = protos[2].slice(); renderGrid(); evaluate(); });
      btnClr.addEventListener('click', function () { pixels.fill(0); renderGrid(); evaluate(); });

      // Inicia com o preset 0
      pixels = protos[0].slice();
      renderGrid();
      evaluate();
    }
  });

  /* =========================================================================
     13. LAB: POR QUE O LOG ATRAPALHA (Slide 30)
     ========================================================================= */
  LAB.register('lab-log-issue', {
    build: function (inst) {
      inst.el.innerHTML =
        '<div class="lab-panel" style="max-width:800px;margin:0 auto">' +
          '<div class="lab-title">A Obstrução Algébrica: ln(a + b) ≠ ln(a) + ln(b)</div>' +
          '<div class="slider-row" style="margin:14px 0"><label>Termo a:</label><input type="range" class="s-log-a" min="1" max="20" step="1" value="2"><span class="v-log-a">2</span></div>' +
          '<div class="slider-row" style="margin:14px 0"><label>Termo b:</label><input type="range" class="s-log-b" min="1" max="20" step="1" value="8"><span class="v-log-b">8</span></div>' +
          '<div class="lab-grid-2" style="margin-top:16px">' +
            '<div class="node accent" style="text-align:center">' +
              '<div class="n-title">Logaritmo da Soma: ln(a + b)</div>' +
              '<div class="out-log-sum" style="font-size:20px;font-weight:600;padding:8px 0">ln(10) ≈ 2.303</div>' +
              '<div style="font-size:12px;color:var(--fg-muted)">O somatório fica PRESO dentro do logaritmo.</div>' +
            '</div>' +
            '<div class="node dim" style="text-align:center">' +
              '<div class="n-title">Soma dos Logaritmos: ln(a) + ln(b)</div>' +
              '<div class="out-sum-log" style="font-size:20px;font-weight:600;padding:8px 0">0.693 + 2.079 = 2.773</div>' +
              '<div style="font-size:12px;color:var(--m3)">≠ ln(a + b)! O logaritmo NÃO distribui na soma!</div>' +
            '</div>' +
          '</div>' +
          '<p class="lab-caption" style="text-align:center;margin-top:14px">É por isso que a derivada ∂/∂θ ln(∑ π_k p(x|θ_k)) gera um acoplamento mútuo intratável onde cada parâmetro depende de todos os outros.</p>' +
        '</div>';

      var sA = inst.el.querySelector('.s-log-a');
      var sB = inst.el.querySelector('.s-log-b');
      var vA = inst.el.querySelector('.v-log-a');
      var vB = inst.el.querySelector('.v-log-b');
      var outLogSum = inst.el.querySelector('.out-log-sum');
      var outSumLog = inst.el.querySelector('.out-sum-log');

      function update() {
        var a = parseFloat(sA.value);
        var b = parseFloat(sB.value);
        vA.textContent = a;
        vB.textContent = b;

        var logSum = Math.log(a + b);
        var sumLog = Math.log(a) + Math.log(b);

        outLogSum.textContent = 'ln(' + (a + b) + ') = ' + logSum.toFixed(3);
        outSumLog.textContent = Math.log(a).toFixed(3) + ' + ' + Math.log(b).toFixed(3) + ' = ' + sumLog.toFixed(3);
      }

      sA.addEventListener('input', update);
      sB.addEventListener('input', update);
      inst.state.update = update;
    },
    start: function (inst) {
      if (inst.state.update) inst.state.update();
    }
  });

  /* =========================================================================
     14. LAB: EM PASSO A PASSO EM 6 AMOSTRAS (Slide 32)
     ========================================================================= */
  LAB.register('lab-em-toy', {
    build: function (inst) {
      inst.el.innerHTML =
        '<div class="lab-grid-2">' +
          '<div class="lab-panel">' +
            '<div class="lab-title">EM para Bernoulli em 6 Amostras de 4 bits:</div>' +
            '<div class="lab-btn-row">' +
              '<button type="button" class="btn btn-em-e">1. Executar Passo E (γ)</button>' +
              '<button type="button" class="btn btn-em-m" disabled>2. Executar Passo M (μ, π)</button>' +
              '<button type="button" class="btn btn-em-rst">Reiniciar</button>' +
            '</div>' +
            '<div class="lab-stats-box" style="margin-top:14px">' +
              '<div>Fase: <b class="em-toy-phase" style="color:var(--accent)">Inicial</b></div>' +
              '<div>Parâmetros Componente 1: <span class="em-p1" style="color:var(--d1)">--</span></div>' +
              '<div>Parâmetros Componente 2: <span class="em-p2" style="color:var(--d2)">--</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="lab-panel">' +
            '<table class="binmat" style="width:100%;font-size:12px">' +
              '<thead><tr><th>Amostra x_n</th><th>Bits</th><th>γ_{n1}</th><th>γ_{n2}</th></tr></thead>' +
              '<tbody class="tb-em-toy-body"></tbody>' +
            '</table>' +
          '</div>' +
        '</div>';

      var btnE = inst.el.querySelector('.btn-em-e');
      var btnM = inst.el.querySelector('.btn-em-m');
      var btnRst = inst.el.querySelector('.btn-em-rst');
      var outPhase = inst.el.querySelector('.em-toy-phase');
      var outP1 = inst.el.querySelector('.em-p1');
      var outP2 = inst.el.querySelector('.em-p2');
      var tbody = inst.el.querySelector('.tb-em-toy-body');

      var X = [
        [1, 1, 0, 0], [1, 1, 0, 0], [1, 0, 0, 0],
        [0, 0, 1, 1], [0, 0, 1, 1], [0, 0, 0, 1]
      ];
      var K = 2;
      var pis = [0.5, 0.5];
      var mus = [
        [0.6, 0.6, 0.4, 0.4],
        [0.4, 0.4, 0.6, 0.6]
      ];
      var gamma = X.map(function () { return [0.5, 0.5]; });

      function renderTable() {
        var rows = '';
        X.forEach(function (x, i) {
          rows +=
            '<tr>' +
              '<td class="rowlab">x_' + (i + 1) + '</td>' +
              '<td>[' + x.join(', ') + ']</td>' +
              '<td style="color:var(--d1);font-weight:600">' + gamma[i][0].toFixed(3) + '</td>' +
              '<td style="color:var(--d2);font-weight:600">' + gamma[i][1].toFixed(3) + '</td>' +
            '</tr>';
        });
        tbody.innerHTML = rows;
        outP1.textContent = 'π₁ = ' + pis[0].toFixed(2) + ' | μ₁ = [' + mus[0].map(function (v) { return v.toFixed(2); }).join(', ') + ']';
        outP2.textContent = 'π₂ = ' + pis[1].toFixed(2) + ' | μ₂ = [' + mus[1].map(function (v) { return v.toFixed(2); }).join(', ') + ']';
      }

      function doE() {
        for (var i = 0; i < X.length; i++) {
          var l1 = Math.log(pis[0]) + M.evaluateBernoulliLogLik(X[i], mus[0]);
          var l2 = Math.log(pis[1]) + M.evaluateBernoulliLogLik(X[i], mus[1]);
          var lse = M.logSumExp([l1, l2]);
          gamma[i][0] = Math.exp(l1 - lse);
          gamma[i][1] = Math.exp(l2 - lse);
        }
        outPhase.textContent = 'Passo E concluído (Responsabilidades γ recalculadas)';
        btnE.disabled = true;
        btnM.disabled = false;
        renderTable();
      }

      function doM() {
        for (var k = 0; k < K; k++) {
          var Nk = 0;
          for (var i = 0; i < X.length; i++) Nk += gamma[i][k];
          pis[k] = Nk / X.length;
          for (var d = 0; d < 4; d++) {
            var sum = 0;
            for (i = 0; i < X.length; i++) sum += gamma[i][k] * X[i][d];
            mus[k][d] = (sum + 0.05) / (Nk + 0.1); // Laplace
          }
        }
        outPhase.textContent = 'Passo M concluído (Pesos π e protótipos μ atualizados)';
        btnE.disabled = false;
        btnM.disabled = true;
        renderTable();
      }

      function reset() {
        pis = [0.5, 0.5];
        mus = [
          [0.6, 0.6, 0.4, 0.4],
          [0.4, 0.4, 0.6, 0.6]
        ];
        gamma = X.map(function () { return [0.5, 0.5]; });
        outPhase.textContent = 'Inicial';
        btnE.disabled = false;
        btnM.disabled = true;
        renderTable();
      }

      btnE.addEventListener('click', doE);
      btnM.addEventListener('click', doM);
      btnRst.addEventListener('click', reset);

      inst.state.reset = reset;
    },
    start: function (inst) {
      if (inst.state.reset) inst.state.reset();
    }
  });

  /* =========================================================================
     15. LAB: POR QUE LN P NUNCA CAI (Slide 33)
     ========================================================================= */
  LAB.register('lab-em-bound', {
    build: function (inst) {
      inst.el.innerHTML =
        '<div class="lab-panel" style="max-width:820px;margin:0 auto">' +
          '<div class="lab-title">Decomposição Fundamental: ln p(X) = ℒ(q, θ) + KL(q ∥ p(Z|X, θ))</div>' +
          '<div class="lab-btn-row" style="justify-content:center;margin:14px 0">' +
            '<button type="button" class="btn btn-bound-step">▶ Próximo Passo do EM</button>' +
            '<button type="button" class="btn btn-bound-rst">Reiniciar</button>' +
          '</div>' +
          '<div class="bound-visual" style="display:flex;flex-direction:column;gap:12px;margin:18px 0"></div>' +
          '<div class="node accent bound-exp" style="font-size:13px;line-height:1.5;text-align:center"></div>' +
        '</div>';

      var btnStep = inst.el.querySelector('.btn-bound-step');
      var btnRst = inst.el.querySelector('.btn-bound-rst');
      var vis = inst.el.querySelector('.bound-visual');
      var exp = inst.el.querySelector('.bound-exp');

      var step = 0; // 0: Init, 1: E-step, 2: M-step, 3: E-step 2

      function render() {
        var lVal = step === 0 ? 50 : (step === 1 ? 75 : (step === 2 ? 88 : 96));
        var klVal = step === 0 ? 25 : (step === 1 ? 0 : (step === 2 ? 8 : 0));
        var total = lVal + klVal;

        vis.innerHTML =
          '<div style="display:flex;align-items:center;gap:10px">' +
            '<span style="width:140px;font-family:var(--mono);font-size:12px;color:var(--fg)">ln p(X | θ): ' + total + '</span>' +
            '<div style="flex:1;height:32px;background:rgba(28,25,23,0.06);display:flex;border:1px solid var(--line-strong);border-radius:3px;overflow:hidden">' +
              '<div style="width:' + (lVal / 1.1) + '%;background:var(--accent);display:flex;align-items:center;justify-content:center;color:var(--deep);font-weight:600;font-size:12px;font-family:var(--mono)">ℒ(q, θ) = ' + lVal + '</div>' +
              '<div style="width:' + (klVal / 1.1) + '%;background:var(--m3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:12px;font-family:var(--mono)">' + (klVal > 0 ? 'KL = ' + klVal : '') + '</div>' +
            '</div>' +
          '</div>';

        if (step === 0) {
          exp.innerHTML = '<b>Estado Inicial:</b> Temos parâmetros θ^(t). A cota ℒ está abaixo de ln p, e KL > 0 mede a folga entre elas.';
        } else if (step === 1) {
          exp.innerHTML = '<b>Passo E:</b> Definimos q(Z) = p(Z|X, θ^(t)). Isso <b>ZERA</b> a divergência KL (KL = 0). A cota ℒ agora <b>iguala</b> exatamente ln p(X|θ^(t))!';
        } else if (step === 2) {
          exp.innerHTML = '<b>Passo M:</b> Maximizamos ℒ(q, θ) em relação a θ, obtendo θ^(t+1). Como ℒ subiu e a nova divergência KL é sempre ≥ 0, <b>ln p(X) é garantido de subir!</b>';
        } else {
          exp.innerHTML = '<b>Próximo Passo E:</b> Zera novamente o novo KL, elevando a cota ℒ ao novo patamar mais alto de ln p(X). O ciclo nunca faz a verossimilhança cair.';
        }
      }

      btnStep.addEventListener('click', function () {
        step = (step + 1) % 4;
        render();
      });
      btnRst.addEventListener('click', function () {
        step = 0;
        render();
      });

      render();
    }
  });

  /* =========================================================================
     16. LAB: UNDERFLOW AO VIVO (Slide 36)
     ========================================================================= */
  LAB.register('lab-underflow', {
    build: function (inst) {
      inst.el.innerHTML =
        '<div class="lab-panel" style="max-width:820px;margin:0 auto">' +
          '<div class="lab-title">Multiplicação Direta (float64) vs Espaço Logarítmico:</div>' +
          '<div class="slider-row" style="margin:14px 0"><label>Dimensão D (pixels):</label><input type="range" class="s-uf-d" min="10" max="784" step="10" value="100"><span class="v-uf-d">100</span></div>' +
          '<div class="slider-row" style="margin:14px 0"><label>Probabilidade média p:</label><input type="range" class="s-uf-p" min="0.05" max="0.50" step="0.05" value="0.10"><span class="v-uf-p">0.10</span></div>' +
          '<div class="lab-grid-2" style="margin-top:16px">' +
            '<div class="node dim" style="border-color:var(--m3)">' +
              '<div class="n-title" style="color:var(--m3)">Multiplicação Direta ∏ p_d</div>' +
              '<div class="out-uf-direct" style="font-size:18px;font-family:var(--mono);padding:8px 0">--</div>' +
              '<div class="out-uf-warn" style="font-size:12px;color:var(--m3)"></div>' +
            '</div>' +
            '<div class="node accent">' +
              '<div class="n-title">Espaço Logarítmico ∑ ln(p_d)</div>' +
              '<div class="out-uf-log" style="font-size:18px;font-family:var(--mono);color:var(--accent);padding:8px 0">--</div>' +
              '<div style="font-size:12px;color:var(--fg-muted)">Perfeita estabilidade numérica, sem arredondar para zero!</div>' +
            '</div>' +
          '</div>' +
        '</div>';

      var sD = inst.el.querySelector('.s-uf-d');
      var sP = inst.el.querySelector('.s-uf-p');
      var vD = inst.el.querySelector('.v-uf-d');
      var vP = inst.el.querySelector('.v-uf-p');
      var outDirect = inst.el.querySelector('.out-uf-direct');
      var outWarn = inst.el.querySelector('.out-uf-warn');
      var outLog = inst.el.querySelector('.out-uf-log');

      function update() {
        var D = parseInt(sD.value, 10);
        var p = parseFloat(sP.value);
        vD.textContent = D;
        vP.textContent = p.toFixed(2);

        var logVal = D * Math.log(p);
        var directVal = Math.pow(p, D);

        outLog.textContent = logVal.toFixed(2) + ' (log-espaço)';

        if (directVal === 0 || !isFinite(directVal) || logVal < -708) {
          outDirect.textContent = '0.0000000000000000e+00';
          outWarn.textContent = '⚠️ UNDERFLOW! Abaixo de 10⁻³⁰⁸ o float64 colapsa em zero absoluto!';
        } else {
          outDirect.textContent = directVal.toExponential(4);
          outWarn.textContent = 'Representável, mas próximo do limite de subfluxo.';
        }
      }

      sD.addEventListener('input', update);
      sP.addEventListener('input', update);
      inst.state.update = update;
    },
    start: function (inst) {
      if (inst.state.update) inst.state.update();
    }
  });

  /* =========================================================================
     17. LAB: LABORATÓRIO DA COVARIÂNCIA (Slide 39)
     ========================================================================= */
  LAB.register('lab-covariance', {
    build: function (inst) {
      inst.el.innerHTML =
        '<div class="lab-grid-2">' +
          '<div class="lab-panel">' +
            '<div class="lab-title">Ajuste os parâmetros da matriz Σ:</div>' +
            '<div class="slider-row"><label>Desvio σ₁ (eixo X):</label><input type="range" class="s-cov-s1" min="0.5" max="3.0" step="0.1" value="2.0"><span class="v-cov-s1">2.0</span></div>' +
            '<div class="slider-row"><label>Desvio σ₂ (eixo Y):</label><input type="range" class="s-cov-s2" min="0.5" max="3.0" step="0.1" value="1.0"><span class="v-cov-s2">1.0</span></div>' +
            '<div class="slider-row"><label>Correlação ρ:</label><input type="range" class="s-cov-rho" min="-0.95" max="0.95" step="0.05" value="0.70"><span class="v-cov-rho">0.70</span></div>' +
            '<div class="lab-stats-box" style="margin-top:10px">' +
              '<div>Matriz de Covariância <b>Σ</b>:</div>' +
              '<div class="cov-mat-disp" style="font-family:var(--mono);font-size:13px;padding:4px 0"></div>' +
              '<div style="font-size:12px;color:var(--fg-dim);margin-top:4px">Determinante |Σ| = <b class="cov-det">--</b></div>' +
            '</div>' +
          '</div>' +
          '<div class="lab-panel" style="display:flex;flex-direction:column;align-items:center">' +
            '<canvas class="cov-cv" width="460" height="240"></canvas>' +
            '<p class="lab-caption">Elipse de 2 desvios-padrão (cobre ~95% dos pontos) e os eixos principais (autovetores de Σ).</p>' +
          '</div>' +
        '</div>';

      var cv = inst.el.querySelector('.cov-cv');
      var ctx = setupCanvas(cv, 460, 240);
      var sS1 = inst.el.querySelector('.s-cov-s1');
      var sS2 = inst.el.querySelector('.s-cov-s2');
      var sRho = inst.el.querySelector('.s-cov-rho');
      var vS1 = inst.el.querySelector('.v-cov-s1');
      var vS2 = inst.el.querySelector('.v-cov-s2');
      var vRho = inst.el.querySelector('.v-cov-rho');
      var matDisp = inst.el.querySelector('.cov-mat-disp');
      var detDisp = inst.el.querySelector('.cov-det');

      function update() {
        var s1 = parseFloat(sS1.value);
        var s2 = parseFloat(sS2.value);
        var rho = parseFloat(sRho.value);

        vS1.textContent = s1.toFixed(1);
        vS2.textContent = s2.toFixed(1);
        vRho.textContent = rho.toFixed(2);

        var a = s1 * s1;
        var b = rho * s1 * s2;
        var d = s2 * s2;
        var S = [a, b, b, d];
        var det = a * d - b * b;

        matDisp.innerHTML = '[ ' + a.toFixed(2) + ', &nbsp;' + b.toFixed(2) + ' ]<br>[ ' + b.toFixed(2) + ', &nbsp;' + d.toFixed(2) + ' ]';
        detDisp.textContent = det.toFixed(3);

        ctx.clearRect(0, 0, 460, 240);
        var p = new F.Plot(cv, { w: 460, h: 240, xlim: [-6, 6], ylim: [-6, 6], equal: true, pad: { l: 20, r: 10, t: 15, b: 20 } });
        p.frame({ grid: true });
        p.clip();

        var el = M.ellipseFromCov(S, 2.0);
        p.ellipse(0, 0, el.rx, el.ry, el.theta, C.accent, 'rgba(180, 83, 10, 0.13)');

        // Eixos principais (autovetores)
        var cos = Math.cos(-el.theta);
        var sin = Math.sin(-el.theta);
        p.arrow(0, 0, cos * el.rx, sin * el.rx, C.d[1], 2);
        p.arrow(0, 0, -sin * el.ry, cos * el.ry, C.d[2], 2);

        p.dot(0, 0, 4, C.fg);
        p.unclip();
      }

      sS1.addEventListener('input', update);
      sS2.addEventListener('input', update);
      sRho.addEventListener('input', update);
      inst.state.update = update;
    },
    start: function (inst) {
      if (inst.state.update) inst.state.update();
    }
  });

  /* =========================================================================
     18. LAB: MAHALANOBIS VS EUCLIDIANA (Slide 40)
     ========================================================================= */
  LAB.register('lab-mahalanobis', {
    build: function (inst) {
      inst.el.innerHTML =
        '<div class="lab-grid-2">' +
          '<div class="lab-panel">' +
            '<div class="lab-title">Mova o ponto probe (x₁, x₂) e compare as distâncias:</div>' +
            '<div class="slider-row"><label>Posição x₁:</label><input type="range" class="s-mah-x" min="-4" max="4" step="0.2" value="2.5"><span class="v-mah-x">2.5</span></div>' +
            '<div class="slider-row"><label>Posição x₂:</label><input type="range" class="s-mah-y" min="-4" max="4" step="0.2" value="1.0"><span class="v-mah-y">1.0</span></div>' +
            '<div class="lab-stats-box" style="margin-top:14px">' +
              '<div>Distância Euclidiana <b>‖x − μ‖</b>: <span class="out-d-euc" style="color:var(--fg);font-size:15px;font-weight:600">--</span></div>' +
              '<div style="margin-top:6px">Distância de Mahalanobis <b>d_M(x, μ, Σ)</b>: <span class="out-d-mah" style="color:var(--accent);font-size:16px;font-weight:600">--</span></div>' +
            '</div>' +
            '<p class="lab-caption" style="margin-top:10px">Pontos ao longo do eixo maior da elipse têm baixa distância de Mahalanobis mesmo estando longe em linha reta!</p>' +
          '</div>' +
          '<div class="lab-panel" style="display:flex;flex-direction:column;align-items:center">' +
            '<canvas class="mah-cv" width="460" height="240"></canvas>' +
          '</div>' +
        '</div>';

      var cv = inst.el.querySelector('.mah-cv');
      var ctx = setupCanvas(cv, 460, 240);
      var sX = inst.el.querySelector('.s-mah-x');
      var sY = inst.el.querySelector('.s-mah-y');
      var vX = inst.el.querySelector('.v-mah-x');
      var vY = inst.el.querySelector('.v-mah-y');
      var outEuc = inst.el.querySelector('.out-d-euc');
      var outMah = inst.el.querySelector('.out-d-mah');

      var mu = [0, 0];
      var S = [3.0, 1.8, 1.8, 1.5]; // Elipse inclinada

      function update() {
        var x = parseFloat(sX.value);
        var y = parseFloat(sY.value);
        vX.textContent = x.toFixed(1);
        vY.textContent = y.toFixed(1);

        var pt = [x, y];
        var dEuc = Math.hypot(x - mu[0], y - mu[1]);
        var dMah = M.mahalanobisDist(pt, mu, S);

        outEuc.textContent = dEuc.toFixed(2);
        outMah.textContent = dMah.toFixed(2) + (dMah > 3.0 ? ' (Outlier estatístico!)' : ' (Típico do cluster)');

        ctx.clearRect(0, 0, 460, 240);
        var p = new F.Plot(cv, { w: 460, h: 240, xlim: [-5, 5], ylim: [-5, 5], equal: true, pad: { l: 20, r: 10, t: 15, b: 20 } });
        p.frame({ grid: true });
        p.clip();

        // Elipses de 1, 2 e 3 sigmas de Mahalanobis
        [1.0, 2.0, 3.0].forEach(function (ns) {
          var el = M.ellipseFromCov(S, ns);
          p.ellipse(0, 0, el.rx, el.ry, el.theta, 'rgba(28,25,23,0.28)', ns === 1.0 ? 'rgba(180,83,10,0.10)' : null);
        });

        // Linha euclidiana reta
        p.line([[0, 0], pt], C.d[1], 1.5, [4, 4]);

        // Centro e Probe
        p.dot(0, 0, 4, C.fg);
        p.dot(x, y, 6, C.accent);
        p.label(x, y, ' x (' + x.toFixed(1) + ', ' + y.toFixed(1) + ')', C.fg, { size: 11, box: true, dx: 10 });

        p.unclip();
      }

      sX.addEventListener('input', update);
      sY.addEventListener('input', update);
      inst.state.update = update;
    },
    start: function (inst) {
      if (inst.state.update) inst.state.update();
    }
  });

  /* =========================================================================
     19. LAB: EM-GMM ANIMADO (Slide 42)
     ========================================================================= */
  LAB.register('lab-gmm-animated', {
    build: function (inst) {
      inst.el.innerHTML =
        '<div class="lab-grid-2">' +
          '<div class="lab-panel">' +
            '<div class="lab-title">Animação da Convergência do GMM (Passo a Passo):</div>' +
            '<div class="lab-btn-row">' +
              '<button type="button" class="btn btn-gmm-play">▶ Play</button>' +
              '<button type="button" class="btn btn-gmm-step">Passo +1</button>' +
              '<button type="button" class="btn btn-gmm-rst">Reiniciar</button>' +
            '</div>' +
            '<div class="lab-stats-box" style="margin-top:14px">' +
              '<div>Iteração: <b class="gmm-anim-it" style="color:var(--accent)">0 / --</b></div>' +
              '<div>Log-Verossimilhança ln L: <span class="gmm-anim-ll" style="color:var(--m2);font-weight:600">--</span></div>' +
            '</div>' +
            '<p class="lab-caption" style="margin-top:10px">As gaussianas começam esféricas e vão se alongando e alinhando com a anisotropia dos dados.</p>' +
          '</div>' +
          '<div class="lab-panel" style="display:flex;flex-direction:column;align-items:center">' +
            '<canvas class="gmm-anim-cv" width="460" height="240"></canvas>' +
          '</div>' +
        '</div>';

      var cv = inst.el.querySelector('.gmm-anim-cv');
      var ctx = setupCanvas(cv, 460, 240);
      var btnPlay = inst.el.querySelector('.btn-gmm-play');
      var btnStep = inst.el.querySelector('.btn-gmm-step');
      var btnRst = inst.el.querySelector('.btn-gmm-rst');
      var outIt = inst.el.querySelector('.gmm-anim-it');
      var outLL = inst.el.querySelector('.gmm-anim-ll');

      var aniso = F.anisoData();
      var X = aniso.X;
      var gmm = M.gmmFit(X, 3, { maxIter: 30 });
      var hist = gmm.history;
      var curIdx = 0;
      var isPlaying = false;

      function draw() {
        var h = hist[curIdx];
        outIt.textContent = curIdx + ' / ' + (hist.length - 1);
        outLL.textContent = h.ll.toFixed(1);

        ctx.clearRect(0, 0, 460, 240);
        var p = new F.Plot(cv, { w: 460, h: 240, xlim: [-8, 8], ylim: [-8, 8], equal: true, pad: { l: 20, r: 10, t: 15, b: 20 } });
        p.frame({ grid: true });
        p.clip();

        // Pontos
        for (var i = 0; i < X.length; i++) {
          p.dot(X[i][0], X[i][1], 2.5, C.dim, 0.6);
        }

        // Elipses das 3 componentes
        for (var k = 0; k < 3; k++) {
          var el = M.ellipseFromCov(h.sigmas[k], 2.0);
          p.ellipse(h.mus[k][0], h.mus[k][1], el.rx, el.ry, el.theta, C.d[k], 'rgba(233,180,76,0.1)');
          p.dot(h.mus[k][0], h.mus[k][1], 4, C.fg);
        }

        p.unclip();
      }

      function next() {
        if (curIdx < hist.length - 1) {
          curIdx++;
          draw();
        } else {
          isPlaying = false;
          btnPlay.textContent = '▶ Play';
        }
      }

      function loop() {
        if (!isPlaying) return;
        next();
        inst.intervalId = setTimeout(loop, 400);
      }

      btnPlay.addEventListener('click', function () {
        isPlaying = !isPlaying;
        btnPlay.textContent = isPlaying ? '⏸ Pausar' : '▶ Play';
        if (isPlaying) loop();
      });
      btnStep.addEventListener('click', function () {
        isPlaying = false;
        btnPlay.textContent = '▶ Play';
        next();
      });
      btnRst.addEventListener('click', function () {
        isPlaying = false;
        btnPlay.textContent = '▶ Play';
        curIdx = 0;
        draw();
      });

      inst.state.draw = draw;
      inst.def.stop = function () {
        isPlaying = false;
        btnPlay.textContent = '▶ Play';
      };
    },
    start: function (inst) {
      if (inst.state.draw) inst.state.draw();
    }
  });

  /* =========================================================================
     20. LAB: ESCOLHER O MODELO / BIC (Slide 44)
     ========================================================================= */
  LAB.register('lab-bic-explorer', {
    build: function (inst) {
      inst.el.innerHTML =
        '<div class="lab-grid-2">' +
          '<div class="lab-panel">' +
            '<div class="lab-title">Varredura de Modelos (Penalização BIC/AIC):</div>' +
            '<div class="slider-row" style="margin:12px 0">' +
              '<label>Tipo de Covariância:</label>' +
              '<select class="s-bic-type" style="background:var(--surface);color:var(--fg);border:1px solid var(--line-strong);padding:5px 8px;font-family:var(--mono)">' +
                '<option value="full">full (elipses livres)</option>' +
                '<option value="tied" selected>tied (elipses idênticas)</option>' +
                '<option value="diag">diag (eixos coordenados)</option>' +
                '<option value="spherical">spherical (círculos)</option>' +
              '</select>' +
            '</div>' +
            '<div class="lab-stats-box">' +
              '<div>Melhor Modelo Segundo BIC: <b class="bic-best" style="color:var(--accent)">--</b></div>' +
              '<div class="bic-info" style="font-size:12px;color:var(--fg-dim);margin-top:6px">BIC penaliza p·ln(N). Modelos excessivamente complexos são punidos com aumento no BIC.</div>' +
            '</div>' +
          '</div>' +
          '<div class="lab-panel" style="display:flex;flex-direction:column;align-items:center">' +
            '<canvas class="bic-cv" width="460" height="240"></canvas>' +
            '<p class="lab-caption">Curva de BIC vs K: O ponto mais baixo (mínimo de BIC) é o modelo estatisticamente ótimo.</p>' +
          '</div>' +
        '</div>';

      var cv = inst.el.querySelector('.bic-cv');
      var ctx = setupCanvas(cv, 460, 240);
      var sType = inst.el.querySelector('.s-bic-type');
      var outBest = inst.el.querySelector('.bic-best');

      var aniso = F.anisoData();
      var sweep = M.bicsSweep(aniso.X, 6);

      function draw() {
        var selectedType = sType.value;
        var curveData = sweep.results.find(function (r) { return r.covType === selectedType; }).curve;

        outBest.textContent = sweep.best.covType.toUpperCase() + ' com K = ' + sweep.best.K + ' (BIC = ' + sweep.best.bic.toFixed(0) + ')';

        ctx.clearRect(0, 0, 460, 240);
        var bics = curveData.map(function (c) { return c.bic; });
        var minB = Math.min.apply(null, bics) - 50;
        var maxB = Math.max.apply(null, bics) + 50;

        var p = new F.Plot(cv, { w: 460, h: 240, xlim: [0.5, 6.5], ylim: [minB, maxB], pad: { l: 45, r: 15, t: 15, b: 25 } });
        p.frame({ xlabel: 'Número de Componentes K', ylabel: 'Score BIC (menor é melhor)' });
        p.clip();

        var pts = curveData.map(function (c) { return [c.K, c.bic]; });
        p.line(pts, C.accent, 2);

        curveData.forEach(function (c) {
          var isBest = c.K === sweep.best.K && selectedType === sweep.best.covType;
          p.dot(c.K, c.bic, isBest ? 6 : 4, isBest ? C.accent : C.d[1]);
          p.label(c.K, c.bic - (maxB - minB) * 0.06, c.bic.toFixed(0), isBest ? C.accent : C.fg_dim, { size: 10, align: 'center' });
        });

        p.unclip();
      }

      sType.addEventListener('change', draw);
      inst.state.draw = draw;
    },
    start: function (inst) {
      if (inst.state.draw) inst.state.draw();
    }
  });

  /* =========================================================================
     21. LAB: DETECÇÃO DE ANOMALIA (Slide 48)
     ========================================================================= */
  LAB.register('lab-anomaly', {
    build: function (inst) {
      inst.el.innerHTML =
        '<div class="lab-grid-2">' +
          '<div class="lab-panel">' +
            '<div class="lab-title">Arraste a amostra de teste x_probe e ajuste o limiar τ:</div>' +
            '<div class="slider-row"><label>Posição x₁:</label><input type="range" class="s-anom-x" min="-6" max="6" step="0.2" value="4.5"><span class="v-anom-x">4.5</span></div>' +
            '<div class="slider-row"><label>Posição x₂:</label><input type="range" class="s-anom-y" min="-6" max="6" step="0.2" value="-3.0"><span class="v-anom-y">-3.0</span></div>' +
            '<div class="slider-row"><label>Limiar ln(τ):</label><input type="range" class="s-anom-tau" min="-16" max="-3" step="0.5" value="-9.0"><span class="v-anom-tau">-9.0</span></div>' +
            '<div class="lab-stats-box" style="margin-top:10px">' +
              '<div>Log-Densidade <b>ln p(x_probe)</b>: <span class="out-probe-ll" style="font-family:var(--mono);font-weight:600">--</span></div>' +
              '<div class="anom-alert-box" style="margin-top:8px;padding:8px;border-radius:3px;text-align:center;font-weight:600;font-family:var(--mono)">--</div>' +
            '</div>' +
          '</div>' +
          '<div class="lab-panel" style="display:flex;flex-direction:column;align-items:center">' +
            '<canvas class="anom-cv" width="460" height="250"></canvas>' +
            '<div class="legend" style="margin-top:9px;justify-content:center">' +
              '<span><i style="background:#EFC6AF"></i>normal: p(x) ≥ τ (mais escuro = mais denso)</span>' +
              '<span><i style="background:#FBF0F0;border:1px solid var(--line-strong)"></i>anomalia: p(x) &lt; τ</span>' +
              '<span><i class="line" style="background:var(--d3)"></i>fronteira p(x) = τ</span>' +
            '</div>' +
            '<p class="lab-caption">Mover <b>ln(τ)</b> desloca a fronteira: quanto maior o limiar, maior a área do plano classificada como anomalia.</p>' +
          '</div>' +
        '</div>';

      var cv = inst.el.querySelector('.anom-cv');
      var ctx = setupCanvas(cv, 460, 250);
      var sX = inst.el.querySelector('.s-anom-x');
      var sY = inst.el.querySelector('.s-anom-y');
      var sTau = inst.el.querySelector('.s-anom-tau');
      var vX = inst.el.querySelector('.v-anom-x');
      var vY = inst.el.querySelector('.v-anom-y');
      var vTau = inst.el.querySelector('.v-anom-tau');
      var outLL = inst.el.querySelector('.out-probe-ll');
      var alertBox = inst.el.querySelector('.anom-alert-box');

      var aniso = F.anisoData();
      var X = aniso.X;
      var gmm = M.gmmFit(X, 3, { maxIter: 30 });

      function evaluateDensity(pt) {
        var logs = [];
        for (var k = 0; k < 3; k++) {
          logs.push(Math.log(gmm.pis[k]) + M.logNormal2(pt, gmm.mus[k], gmm.sigmas[k]));
        }
        return M.logSumExp(logs);
      }

      function update() {
        var x = parseFloat(sX.value);
        var y = parseFloat(sY.value);
        var tau = parseFloat(sTau.value);

        vX.textContent = x.toFixed(1);
        vY.textContent = y.toFixed(1);
        vTau.textContent = tau.toFixed(1);

        var pt = [x, y];
        var logP = evaluateDensity(pt);
        outLL.textContent = logP.toFixed(2);

        var isAnomaly = logP < tau;
        if (isAnomaly) {
          alertBox.style.background = 'rgba(188, 42, 83, 0.10)';
          alertBox.style.color = 'var(--m3)';
          alertBox.style.border = '1px solid var(--m3)';
          alertBox.textContent = '🚨 ALERTA: ANOMALIA DETECTADA! (ln p < ln τ)';
        } else {
          alertBox.style.background = 'rgba(12, 124, 122, 0.10)';
          alertBox.style.color = 'var(--m2)';
          alertBox.style.border = '1px solid var(--m2)';
          alertBox.textContent = '✓ PADRÃO NORMAL (ln p ≥ ln τ)';
        }

        ctx.clearRect(0, 0, 460, 250);
        var p = new F.Plot(cv, { w: 460, h: 250, xlim: [-7, 7], ylim: [-7, 7], equal: true, pad: { l: 22, r: 10, t: 14, b: 22 } });

        /* A região de anomalia é todo ponto do plano cuja densidade cai abaixo
           do limiar. Desenhá-la é o que dá efeito visível ao slider ln(τ):
           antes, mover τ só trocava o texto do alerta. */
        var BAND = 0.085;                   // meia-espessura da curva de nível
        p.field(function (gx, gy) {
          return evaluateDensity([gx, gy]) - tau;    // zero exatamente na fronteira
        }, function (v) {
          if (Math.abs(v) < BAND) return [188, 42, 83, 255];      // curva p(x) = τ
          if (v > 0) {                    // região normal, sombreada pela densidade
            var t = Math.min(1, v / 6);
            return [Math.round(247 - 8 * t), Math.round(245 - 47 * t), Math.round(240 - 86 * t), 255];
          }
          var a = Math.min(1, -v / 5);    // região de anomalia, rosa muito claro
          return [Math.round(252 - 2 * a), Math.round(244 - 14 * a), Math.round(244 - 16 * a), 255];
        });
        p.frame({ grid: true });
        p.clip();

        // Dados normais
        for (var i = 0; i < X.length; i++) {
          p.dot(X[i][0], X[i][1], 2.2, C.dim, 0.55);
        }

        // Elipses do modelo
        for (var k = 0; k < 3; k++) {
          var el = M.ellipseFromCov(gmm.sigmas[k], 2.0);
          p.ellipse(gmm.mus[k][0], gmm.mus[k][1], el.rx, el.ry, el.theta, C.accent, null);
        }

        // Probe Point
        p.dot(x, y, 6.5, isAnomaly ? C.d[2] : C.d[1]);
        p.ring(x, y, 11, isAnomaly ? C.d[2] : C.d[1], 2);
        p.label(x, y, ' probe (' + x.toFixed(1) + ', ' + y.toFixed(1) + ')', isAnomaly ? C.d[2] : C.fg, { size: 11, box: true, dx: 14 });

        p.unclip();
      }

      sX.addEventListener('input', update);
      sY.addEventListener('input', update);
      sTau.addEventListener('input', update);
      inst.state.update = update;
    },
    start: function (inst) {
      if (inst.state.update) inst.state.update();
    }
  });

  global.LAB = LAB;
})(window);
