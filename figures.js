/* ==========================================================================
   figures.js — Camada de desenho (Canvas 2D) das figuras da apresentação
   --------------------------------------------------------------------------
   Cada função registrada em VIZ recebe o <canvas> correspondente e desenha
   o resultado de um algoritmo executado em MLCore (viz.js). Os eixos, as
   legendas e os valores numéricos exibidos vêm sempre do cálculo real.
   ========================================================================== */
(function (global) {
  'use strict';
  var M = global.MLCore;

  /* Paleta do tema claro. Espelha os tokens de styles.css: quando a folha de
     estilo está disponível, os valores são lidos dela para que exista uma
     única fonte de verdade para as cores. */
  function token(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }
  var C = {
    fg: token('--fg', '#1B1917'),
    muted: token('--fg-muted', '#45403B'),
    dim: token('--fg-dim', '#756E68'),
    line: 'rgba(28,25,23,0.14)', lineStrong: 'rgba(28,25,23,0.30)',
    accent: token('--accent', '#B4530A'),
    bg: token('--bg', '#FFFFFF'),
    deep: '#FFFFFF',
    d: [token('--d1', '#B4530A'), token('--d2', '#0C7C7A'),
        token('--d3', '#BC2A53'), token('--d4', '#3B4CA6')],
    gray: '#8A837D',
    /* versões translúcidas das séries, para preenchimentos sobre fundo claro */
    dSoft: ['rgba(180,83,10,0.13)', 'rgba(12,124,122,0.13)',
            'rgba(188,42,83,0.13)', 'rgba(59,76,166,0.13)']
  };
  var MONO = '"IBM Plex Mono", ui-monospace, Menlo, monospace';
  var SANS = '"IBM Plex Sans", -apple-system, "Segoe UI", Roboto, sans-serif';
  var DPR = 2;

  /* ----------------------------------------------------- Plot: helper 2-D */
  function Plot(cv, o) {
    o = o || {};
    this.w = o.w || cv.clientWidth || 400;
    this.h = o.h || 300;
    cv.width = this.w * DPR; cv.height = this.h * DPR;
    cv.style.width = this.w + 'px'; cv.style.height = this.h + 'px';
    var g = cv.getContext('2d');
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    this.g = g;
    this.pad = Object.assign({ l: 34, r: 12, t: 14, b: 30 }, o.pad || {});
    this.setLim(o.xlim || [0, 1], o.ylim || [0, 1], o.equal);
  }
  Plot.prototype.setLim = function (xlim, ylim, equal) {
    this.xlim = xlim.slice(); this.ylim = ylim.slice();
    var iw = this.w - this.pad.l - this.pad.r, ih = this.h - this.pad.t - this.pad.b;
    if (equal) {                       // preserva a proporção geométrica dos dados
      var sx = iw / (xlim[1] - xlim[0]), sy = ih / (ylim[1] - ylim[0]), s = Math.min(sx, sy);
      var cx = (xlim[0] + xlim[1]) / 2, cy = (ylim[0] + ylim[1]) / 2;
      this.xlim = [cx - iw / (2 * s), cx + iw / (2 * s)];
      this.ylim = [cy - ih / (2 * s), cy + ih / (2 * s)];
    }
    this.iw = iw; this.ih = ih;
  };
  Plot.prototype.X = function (x) {
    return this.pad.l + (x - this.xlim[0]) / (this.xlim[1] - this.xlim[0]) * this.iw;
  };
  Plot.prototype.Y = function (y) {
    return this.pad.t + this.ih - (y - this.ylim[0]) / (this.ylim[1] - this.ylim[0]) * this.ih;
  };
  Plot.prototype.S = function (v) {   // escala de comprimento no eixo x
    return v / (this.xlim[1] - this.xlim[0]) * this.iw;
  };
  /* Preenche a área do gráfico avaliando uma função em cada pixel.
     createImageData/putImageData IGNORAM a transformação do contexto, então todo
     o cálculo é feito em pixels de dispositivo (×DPR) e a colagem usa o offset
     do painel já multiplicado pelo mesmo fator.
       valueAt(x, y) -> escalar    colorOf(v, min, max) -> [r, g, b, a]         */
  Plot.prototype.field = function (valueAt, colorOf) {
    var g = this.g;
    var W = Math.round(this.iw * DPR), H = Math.round(this.ih * DPR);
    if (W <= 0 || H <= 0) return;
    var x0 = this.xlim[0], xs = (this.xlim[1] - this.xlim[0]) / W;
    var y1 = this.ylim[1], ys = (this.ylim[1] - this.ylim[0]) / H;
    var vals = new Float64Array(W * H), t = 0, i, j;
    var mn = Infinity, mx = -Infinity;
    for (j = 0; j < H; j++) {
      var yv = y1 - j * ys;
      for (i = 0; i < W; i++) {
        var v = valueAt(x0 + i * xs, yv);
        vals[t++] = v;
        if (v < mn) mn = v;
        if (v > mx) mx = v;
      }
    }
    var img = g.createImageData(W, H), k = 0;
    for (t = 0; t < vals.length; t++) {
      var c = colorOf(vals[t], mn, mx);
      img.data[k++] = c[0]; img.data[k++] = c[1]; img.data[k++] = c[2]; img.data[k++] = c[3];
    }
    g.putImageData(img,
      Math.round((this.pad.l + (this.ox || 0)) * DPR),
      Math.round((this.pad.t + (this.oy || 0)) * DPR));
    // putImageData sobrepõe a moldura desenhada por frame(): redesenha a borda
    g.save();
    g.strokeStyle = C.lineStrong; g.lineWidth = 1;
    g.strokeRect(Math.round(this.pad.l + (this.ox || 0)) + 0.5,
                 Math.round(this.pad.t + (this.oy || 0)) + 0.5,
                 Math.round(this.iw), Math.round(this.ih));
    g.restore();
  };
  Plot.prototype.clip = function () {
    // ox/oy deslocam a área de recorte quando o gráfico é um painel dentro do canvas
    var g = this.g; g.save(); g.beginPath();
    g.rect(this.pad.l + (this.ox || 0), this.pad.t + (this.oy || 0), this.iw, this.ih); g.clip();
  };
  Plot.prototype.unclip = function () { this.g.restore(); };

  /* Moldura com eixos rotulados, grade discreta e marcações numéricas */
  Plot.prototype.frame = function (o) {
    o = o || {};
    var g = this.g, i;
    g.save();
    if (o.grid !== false) {
      g.strokeStyle = 'rgba(28,25,23,0.07)'; g.lineWidth = 1;
      var xt = o.xticks || this.ticks(this.xlim, 5);
      var yt = o.yticks || this.ticks(this.ylim, 4);
      for (i = 0; i < xt.length; i++) {
        var px = Math.round(this.X(xt[i])) + 0.5;
        g.beginPath(); g.moveTo(px, this.pad.t); g.lineTo(px, this.pad.t + this.ih); g.stroke();
      }
      for (i = 0; i < yt.length; i++) {
        var py = Math.round(this.Y(yt[i])) + 0.5;
        g.beginPath(); g.moveTo(this.pad.l, py); g.lineTo(this.pad.l + this.iw, py); g.stroke();
      }
      g.fillStyle = C.dim; g.font = '10px ' + MONO; g.textAlign = 'center'; g.textBaseline = 'top';
      if (o.showTicks !== false) {
        for (i = 0; i < xt.length; i++) g.fillText(fmt(xt[i]), this.X(xt[i]), this.pad.t + this.ih + 6);
        g.textAlign = 'right'; g.textBaseline = 'middle';
        for (i = 0; i < yt.length; i++) g.fillText(fmt(yt[i]), this.pad.l - 6, this.Y(yt[i]));
      }
    }
    g.strokeStyle = C.lineStrong; g.lineWidth = 1;
    g.strokeRect(Math.round(this.pad.l) + 0.5, Math.round(this.pad.t) + 0.5, Math.round(this.iw), Math.round(this.ih));
    if (o.xlabel) {
      g.fillStyle = C.muted; g.font = '10.5px ' + MONO; g.textAlign = 'center'; g.textBaseline = 'bottom';
      g.fillText(o.xlabel, this.pad.l + this.iw / 2, this.h - 1);
    }
    if (o.ylabel) {
      g.save(); g.translate(9, this.pad.t + this.ih / 2); g.rotate(-Math.PI / 2);
      g.fillStyle = C.muted; g.font = '10.5px ' + MONO; g.textAlign = 'center'; g.textBaseline = 'top';
      g.fillText(o.ylabel, 0, 0); g.restore();
    }
    if (o.title) {
      g.fillStyle = C.fg; g.font = '600 11.5px ' + MONO; g.textAlign = 'left'; g.textBaseline = 'top';
      g.fillText(o.title, this.pad.l, 0);
    }
    g.restore();
  };
  Plot.prototype.ticks = function (lim, n) {
    var span = lim[1] - lim[0], step = Math.pow(10, Math.floor(Math.log10(span / n)));
    var err = span / n / step;
    if (err >= 7.5) step *= 10; else if (err >= 3.5) step *= 5; else if (err >= 1.5) step *= 2;
    var out = [], v = Math.ceil(lim[0] / step) * step;
    for (; v <= lim[1] + 1e-9; v += step) out.push(Math.abs(v) < 1e-12 ? 0 : v);
    return out;
  };
  function fmt(v) {
    if (Math.abs(v) >= 10000) return (v / 1000) + 'k';
    return (Math.round(v * 100) / 100).toString();
  }

  Plot.prototype.dot = function (x, y, r, color, alpha) {
    var g = this.g; g.globalAlpha = alpha === undefined ? 0.78 : alpha;
    g.fillStyle = color; g.beginPath(); g.arc(this.X(x), this.Y(y), r, 0, 6.2832); g.fill();
    g.globalAlpha = 1;
  };
  Plot.prototype.cross = function (x, y, size, color) {   // marcador X dos centróides
    var g = this.g, px = this.X(x), py = this.Y(y), s = size;
    g.save(); g.translate(px, py); g.rotate(Math.PI / 4);
    g.strokeStyle = C.deep; g.lineWidth = 6; g.lineCap = 'butt';
    g.beginPath(); g.moveTo(-s, 0); g.lineTo(s, 0); g.moveTo(0, -s); g.lineTo(0, s); g.stroke();
    g.strokeStyle = color; g.lineWidth = 3.4;
    g.beginPath(); g.moveTo(-s, 0); g.lineTo(s, 0); g.moveTo(0, -s); g.lineTo(0, s); g.stroke();
    g.restore();
  };
  Plot.prototype.ring = function (x, y, r, color, lw) {
    var g = this.g; g.strokeStyle = color; g.lineWidth = lw || 2;
    g.beginPath(); g.arc(this.X(x), this.Y(y), r, 0, 6.2832); g.stroke();
  };
  Plot.prototype.ellipse = function (mx, my, rx, ry, theta, stroke, fill, dash) {
    var g = this.g;
    g.save();
    g.translate(this.X(mx), this.Y(my));
    g.rotate(-theta);                              // eixo Y do canvas cresce para baixo
    g.beginPath();
    g.ellipse(0, 0, Math.max(this.S(rx), 0.5), Math.max(this.S(ry), 0.5), 0, 0, 6.2832);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1.6; if (dash) g.setLineDash(dash); g.stroke(); }
    g.restore();
  };
  Plot.prototype.arrow = function (x1, y1, x2, y2, color, lw) {
    var g = this.g, a = this.X(x1), b = this.Y(y1), c = this.X(x2), d = this.Y(y2);
    var ang = Math.atan2(d - b, c - a), len = Math.hypot(c - a, d - b);
    if (len < 4) return;
    var head = Math.min(8, len * 0.42);
    g.save(); g.strokeStyle = color; g.fillStyle = color; g.lineWidth = lw || 1.8; g.lineCap = 'round';
    g.beginPath(); g.moveTo(a, b); g.lineTo(c - Math.cos(ang) * head * 0.8, d - Math.sin(ang) * head * 0.8); g.stroke();
    g.beginPath(); g.moveTo(c, d);
    g.lineTo(c - Math.cos(ang - 0.42) * head, d - Math.sin(ang - 0.42) * head);
    g.lineTo(c - Math.cos(ang + 0.42) * head, d - Math.sin(ang + 0.42) * head);
    g.closePath(); g.fill(); g.restore();
  };
  Plot.prototype.line = function (pts, color, lw, dash) {
    var g = this.g; g.save(); g.strokeStyle = color; g.lineWidth = lw || 2;
    g.lineJoin = 'round'; if (dash) g.setLineDash(dash);
    g.beginPath();
    for (var i = 0; i < pts.length; i++) {
      var px = this.X(pts[i][0]), py = this.Y(pts[i][1]);
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.stroke(); g.restore();
  };
  Plot.prototype.segment = function (x1, y1, x2, y2, color, o) {
    o = o || {};
    var g = this.g; g.save();
    g.strokeStyle = color || C.fg;
    g.lineWidth = o.width || o.lw || 1.5;
    if (o.dash) g.setLineDash(o.dash);
    g.beginPath();
    g.moveTo(this.X(x1), this.Y(y1));
    g.lineTo(this.X(x2), this.Y(y2));
    g.stroke();
    g.restore();
  };
  Plot.prototype.label = function (x, y, txt, color, o) {
    o = o || {};
    var g = this.g; g.save();
    g.font = (o.weight || '') + ' ' + (o.size || 10.5) + 'px ' + (o.mono === false ? SANS : MONO);
    g.textAlign = o.align || 'left'; g.textBaseline = o.baseline || 'middle';
    var px = this.X(x) + (o.dx || 0), py = this.Y(y) + (o.dy || 0);
    if (o.box) {
      var wpx = g.measureText(txt).width;
      g.fillStyle = o.box === true ? 'rgba(255,255,255,0.88)' : o.box;
      var bx = o.align === 'center' ? px - wpx / 2 - 4 : (o.align === 'right' ? px - wpx - 4 : px - 4);
      g.fillRect(bx, py - 8, wpx + 8, 16);
    }
    g.fillStyle = color; g.fillText(txt, px, py); g.restore();
  };
  /* Texto em coordenadas de pixel (para títulos de painel) */
  Plot.prototype.px = function (x, y, txt, color, o) {
    o = o || {};
    var g = this.g; g.save();
    g.font = (o.weight || '') + ' ' + (o.size || 11) + 'px ' + (o.mono === false ? SANS : MONO);
    g.textAlign = o.align || 'left'; g.textBaseline = o.baseline || 'top';
    g.fillStyle = color; g.fillText(txt, x, y); g.restore();
  };

  /* Cria vários painéis dentro de um mesmo canvas */
  function panels(cv, w, h, cols, rows, gapX, gapY, headH) {
    cv.width = w * DPR; cv.height = h * DPR;
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    var g = cv.getContext('2d'); g.setTransform(DPR, 0, 0, DPR, 0, 0);
    var pw = (w - gapX * (cols - 1)) / cols, ph = (h - gapY * (rows - 1)) / rows;
    var list = [];
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      list.push({ x: c * (pw + gapX), y: r * (ph + gapY), w: pw, h: ph });
    }
    return { g: g, cells: list, pw: pw, ph: ph };
  }
  /* Sub-plot dentro de uma célula de painel (compartilha o contexto) */
  function subPlot(g, cell, o) {
    var p = Object.create(Plot.prototype);
    p.g = g; p.w = cell.w; p.h = cell.h;
    p.pad = Object.assign({ l: 26, r: 8, t: 18, b: 20 }, o.pad || {});
    p.ox = cell.x; p.oy = cell.y;
    p.setLim(o.xlim, o.ylim, o.equal);
    // desloca a origem via override dos conversores
    var X = p.X, Y = p.Y, px = p.px;
    p.X = function (v) { return X.call(this, v) + p.ox; };
    p.Y = function (v) { return Y.call(this, v) + p.oy; };
    p.px = function (a, b, t, c, oo) { return px.call(this, a + p.ox, b + p.oy, t, c, oo); };
    var frame = p.frame;
    p.frame = function (opts) {
      g.save(); g.translate(p.ox, p.oy);
      var sx = p.X, sy = p.Y; p.X = X; p.Y = Y;
      var spx = p.px; p.px = px;
      frame.call(p, opts);
      p.X = sx; p.Y = sy; p.px = spx;
      g.restore();
    };
    return p;
  }

  /* ====================================================================== */
  /*  DADOS COMPARTILHADOS — gerados uma única vez com semente fixa          */
  /* ====================================================================== */
  var DATA = {};
  function data(key, build) { if (!DATA[key]) DATA[key] = build(); return DATA[key]; }

  var ANISO_T = [[0.60834549, -0.63667341], [-0.40887718, 0.85253229]];

  function blobs3() {                    // 3 blobs isotrópicos bem separados
    return data('blobs3', function () {
      return M.makeBlobs(M.mulberry32(42), [[-6.5, -6.5], [4.5, 5.0], [5.5, -5.5]], 90, 1.15);
    });
  }
  function blobs4() {                    // 4 blobs — usado no cotovelo/silhueta
    return data('blobs4', function () {
      return M.makeBlobs(M.mulberry32(42), [[-4, -4], [4, 4], [-4, 4], [4, -4]], 100, 0.9);
    });
  }
  function anisoData() {                 // 3 clusters alongados e inclinados
    return data('aniso', function () {
      var b = M.makeBlobs(M.mulberry32(170), [[-4, -4], [0, 0], [4, 4]], 180, 1.0);
      return { X: M.linearTransform(b.X, ANISO_T), y: b.y };
    });
  }
  function overlapData() {               // dois grupos que se tocam (incerteza real)
    return data('overlap', function () {
      return M.makeBlobs(M.mulberry32(21), [[-1.55, 0], [1.55, 0]], 160, 1.0);
    });
  }
  function limitsData() {                // um grupo largo e dois compactos próximos
    return data('limits', function () {
      return M.makeBlobs(M.mulberry32(88), [[0, 0], [3.2, 0.6], [3.6, -1.4]], [300, 45, 45], [2.0, 0.32, 0.32]);
    });
  }
  function digitsData() {                // dígitos 8x8 binarizados com ruído de bit
    return data('digits', function () {
      var P = {
        z: ['00111100', '01100110', '11000011', '11000011', '11000011', '11000011', '01100110', '00111100'],
        u: ['00011000', '00111000', '01011000', '00011000', '00011000', '00011000', '00011000', '01111110'],
        s: ['01111110', '01111110', '00000110', '00001100', '00011000', '00110000', '00110000', '00110000']
      };
      var protos = ['z', 'u', 's'].map(function (k) { return P[k].join('').split('').map(Number); });
      var rng = M.mulberry32(2024), X = [], y = [];
      for (var c = 0; c < 3; c++) for (var i = 0; i < 120; i++) {
        X.push(protos[c].map(function (b) { return rng() < 0.10 ? 1 - b : b; }));
        y.push(c);
      }
      return { X: X, y: y, protos: protos };
    });
  }

  global.FigCore = { Plot: Plot, panels: panels, subPlot: subPlot, C: C, MONO: MONO, SANS: SANS, DPR: DPR,
    blobs3: blobs3, blobs4: blobs4, anisoData: anisoData, overlapData: overlapData,
    limitsData: limitsData, digitsData: digitsData, data: data, ANISO_T: ANISO_T };
})(window);

/* ==========================================================================
   Renderizadores das figuras — registrados em window.VIZ
   ========================================================================== */
(function (global) {
  'use strict';
  var M = global.MLCore, F = global.FigCore;
  var Plot = F.Plot, panels = F.panels, subPlot = F.subPlot, C = F.C, MONO = F.MONO;
  var VIZ = {};

  function limitsOf(X, m) {
    m = m === undefined ? 0.10 : m;
    var ex = M.extent(X, 0), ey = M.extent(X, 1);
    var px = (ex[1] - ex[0]) * m, py = (ey[1] - ey[0]) * m;
    return { xlim: [ex[0] - px, ex[1] + px], ylim: [ey[0] - py, ey[1] + py] };
  }

  /* ---------------------------------------------------------- SLIDE 02 --- */
  /* Supervisionado (rótulos y_n) versus não supervisionado (z_n oculto)     */
  VIZ['fig-superv'] = function (cv) {
    var d = F.blobs3(), L = limitsOf(d.X, 0.14);
    var P = panels(cv, 662, 372, 2, 1, 22, 0);
    ['sup', 'unsup'].forEach(function (mode, ci) {
      var p = subPlot(P.g, P.cells[ci], { xlim: L.xlim, ylim: L.ylim, equal: true, pad: { l: 28, r: 10, t: 22, b: 26 } });
      p.frame({
        title: ci === 0 ? 'Supervisionado: (x_n , y_n)' : 'Não supervisionado: apenas x_n',
        xlabel: 'x₁', ylabel: 'x₂'
      });
      p.clip();
      for (var i = 0; i < d.X.length; i++) {
        p.dot(d.X[i][0], d.X[i][1], 2.6, mode === 'sup' ? C.d[d.y[i]] : '#8A837D', mode === 'sup' ? 0.82 : 0.80);
      }
      if (mode === 'unsup') {
        // Contornos tracejados = fatores geradores latentes z_k, desconhecidos
        [0, 1, 2].forEach(function (k) {
          var pts = d.X.filter(function (_, i) { return d.y[i] === k; });
          var mx = pts.reduce(function (s, q) { return s + q[0]; }, 0) / pts.length;
          var my = pts.reduce(function (s, q) { return s + q[1]; }, 0) / pts.length;
          p.ellipse(mx, my, 2.9, 2.9, 0, 'rgba(180,83,10,0.75)', null, [5, 4]);
          p.label(mx, my, 'z = ' + (k + 1) + ' ?', C.accent, { align: 'center', size: 10.5, box: true, dy: 0 });
        });
      }
      p.unclip();
    });
    return 'Dois painéis de dispersão sobre o mesmo conjunto de 270 pontos. À esquerda, os pontos são coloridos por rótulos conhecidos y_n em três classes. À direita, todos os pontos são cinzas e três contornos tracejados marcam os grupos latentes z_k que o algoritmo precisa inferir sem rótulos.';
  };

  /* ---------------------------------------------------------- SLIDE 05 --- */
  /* Atribuição rígida (Voronoi) versus responsabilidade contínua γ          */
  VIZ['fig-hardsoft'] = function (cv) {
    var d = F.overlapData(), L = limitsOf(d.X, 0.08);
    var km = M.kmeansBest(d.X, 2, 10, 31);
    var gm = M.gmmBest(d.X, 2, { covarianceType: 'full' }, 8, 1300);
    // ordena as componentes pela coordenada x para que a cor de cada grupo
    // seja a mesma nos dois painéis
    var kmC = km.centers.slice().sort(function (a, b) { return a[0] - b[0]; });
    var ord = gm.mus.map(function (m, i) { return i; })
      .sort(function (a, b) { return gm.mus[a][0] - gm.mus[b][0]; });
    var gMus = ord.map(function (i) { return gm.mus[i]; });
    var gSig = ord.map(function (i) { return gm.sigmas[i]; });
    var gPis = ord.map(function (i) { return gm.pis[i]; });
    var P = panels(cv, 564, 288, 2, 1, 18, 0);

    // -- painel esquerdo: regiões de Voronoi preenchidas (certeza artificial)
    var p1 = subPlot(P.g, P.cells[0], { xlim: L.xlim, ylim: L.ylim, pad: { l: 12, r: 10, t: 20, b: 46 } });
    p1.frame({ title: 'Hard: r_nk ∈ {0,1}', grid: false, xlabel: 'K-Means' });
    p1.clip();
    p1.field(function (x, y) {
      var d0 = M.distND2([x, y], kmC[0]), d1 = M.distND2([x, y], kmC[1]);
      return d0 < d1 ? 0 : 1;                       // devolve 0 ou 1: sem meio-termo
    }, rampTwo);
    for (var i = 0; i < d.X.length; i++) p1.dot(d.X[i][0], d.X[i][1], 2.2, C.fg, 0.30);
    // mediatriz do segmento entre os dois centróides = a fronteira de decisão
    var mx = (kmC[0][0] + kmC[1][0]) / 2, my = (kmC[0][1] + kmC[1][1]) / 2;
    var dx = kmC[1][0] - kmC[0][0], dy = kmC[1][1] - kmC[0][1];
    var L2 = Math.hypot(dx, dy) || 1, span = (p1.ylim[1] - p1.ylim[0]) * 1.6;
    p1.line([[mx - (-dy / L2) * span, my - (dx / L2) * span],
             [mx + (-dy / L2) * span, my + (dx / L2) * span]], C.fg, 1.8, [7, 5]);
    kmC.forEach(function (c) { p1.cross(c[0], c[1], 6, C.accent); });
    p1.unclip();
    (function () {
      var g1 = p1.g, y = p1.pad.t + p1.oy + p1.ih + 12, x = p1.pad.l + p1.ox;
      g1.save();
      g1.strokeStyle = C.fg; g1.lineWidth = 1.8; g1.setLineDash([6, 4]);
      g1.beginPath(); g1.moveTo(x, y); g1.lineTo(x + 26, y); g1.stroke();
      g1.setLineDash([]);
      g1.font = '9.5px ' + MONO; g1.fillStyle = C.muted;
      g1.textBaseline = 'middle'; g1.textAlign = 'left';
      g1.fillText('fronteira rígida — só 0 ou 1, nada entre', x + 32, y);
      g1.restore();
    })();

    // -- painel direito: campo contínuo de responsabilidade γ_n1
    var p2 = subPlot(P.g, P.cells[1], { xlim: L.xlim, ylim: L.ylim, pad: { l: 12, r: 10, t: 20, b: 46 } });
    p2.frame({ title: 'Soft: γ_nk ∈ [0,1]', grid: false, xlabel: 'Mistura gaussiana' });
    p2.clip();
    p2.field(function (x, y) {
      var a = Math.log(gPis[0]) + M.logNormal2([x, y], gMus[0], gSig[0]);
      var b = Math.log(gPis[1]) + M.logNormal2([x, y], gMus[1], gSig[1]);
      return 1 / (1 + Math.exp(b - a));             // γ contínuo em [0,1]
    }, rampTwo);
    for (i = 0; i < d.X.length; i++) p2.dot(d.X[i][0], d.X[i][1], 2.2, C.fg, 0.30);
    gMus.forEach(function (c) { p2.ring(c[0], c[1], 4.5, C.accent, 2); });
    p2.unclip();
    // escala de γ: torna o degradê legível como número, não só como cor
    (function () {
      var g2 = p2.g, bw = Math.min(150, p2.iw - 20), bh = 8;
      var bx = p2.pad.l + p2.ox, by = p2.pad.t + p2.oy + p2.ih + 8;
      for (var i = 0; i <= bw; i++) {
        var c = rampTwo(i / bw);
        g2.fillStyle = 'rgba(' + [c[0] | 0, c[1] | 0, c[2] | 0].join(',') + ',' + (c[3] / 255).toFixed(3) + ')';
        g2.fillRect(bx + i, by, 1.4, bh);
      }
      g2.strokeStyle = C.lineStrong; g2.lineWidth = 1;
      g2.strokeRect(bx + 0.5, by + 0.5, bw, bh);
      g2.font = '9.5px ' + MONO; g2.fillStyle = C.muted; g2.textBaseline = 'top';
      g2.textAlign = 'left';   g2.fillText('γ = 0', bx, by + bh + 4);
      g2.textAlign = 'center'; g2.fillText('0,5', bx + bw / 2, by + bh + 4);
      g2.textAlign = 'right';  g2.fillText('1', bx + bw, by + bh + 4);
    })();
    return 'Dois campos sobre os mesmos dois grupos parcialmente sobrepostos. À esquerda, o K-Means pinta apenas duas cores chapadas separadas por uma fronteira reta. À direita, a mistura gaussiana pinta um degradê contínuo: perto da fronteira a responsabilidade vale cerca de 0,5 e cresce suavemente até 1 no núcleo de cada componente.';
  };
  /* Rampa de duas componentes: interpola do teal (t=0) ao âmbar (t=1).
     Sobre fundo claro, o preenchimento entra com alfa baixo — as duas pontas
     ficam como tintas suaves e o meio, cinza-neutro. */
  function rampTwo(t) {
    return [Math.round(12 + t * 168), Math.round(124 - t * 41), Math.round(122 - t * 112), 78];
  }
  /* Paleta categórica em RGB para os campos de rótulo (células de Voronoi) */
  var CAT_RGB = [[180, 83, 10], [12, 124, 122], [188, 42, 83], [59, 76, 166]];
  function catColor(alpha) {
    return function (v) {
      var c = CAT_RGB[Math.round(v) % CAT_RGB.length];
      return [c[0], c[1], c[2], alpha];
    };
  }

  /* ---------------------------------------------------------- SLIDE 06 --- */
  /* Responsabilidade γ calculada ao vivo conforme x_n se desloca            */
  VIZ['fig-gamma-live'] = function (cv) {
    var st = { t: 0.5 };
    cv._render = function () {
      var mus = [[-2.2, 0], [2.2, 0]], S = [[1.1, 0, 0, 1.1], [1.1, 0, 0, 1.1]], pis = [0.5, 0.5];
      var p = new Plot(cv, { w: 466, h: 198, xlim: [-4.2, 4.2], ylim: [-1.7, 1.7], pad: { l: 12, r: 12, t: 10, b: 32 } });
      var g = p.g;
      g.clearRect(0, 0, p.w, p.h);
      var x = [-3.4 + st.t * 6.8, 0];
      var la = Math.log(pis[0]) + M.logNormal2(x, mus[0], S[0]);
      var lb = Math.log(pis[1]) + M.logNormal2(x, mus[1], S[1]);
      var lse = M.logSumExp([la, lb]);
      var g1 = Math.exp(la - lse), g2 = Math.exp(lb - lse);
      // trilho + componentes
      g.strokeStyle = C.line; g.lineWidth = 1;
      g.beginPath(); g.moveTo(p.X(-3.9), p.Y(0)); g.lineTo(p.X(3.9), p.Y(0)); g.stroke();
      [0, 1].forEach(function (k) {
        p.ellipse(mus[k][0], mus[k][1], 0.72, 0.72, 0, k ? C.d[1] : C.d[0], k ? C.dSoft[1] : C.dSoft[0]);
        p.ellipse(mus[k][0], mus[k][1], 1.42, 1.42, 0, k ? 'rgba(12,124,122,0.45)' : 'rgba(180,83,10,0.45)', null, [4, 4]);
        p.label(mus[k][0], mus[k][1], 'μ' + (k + 1), k ? C.d[1] : C.d[0], { align: 'center', size: 11 });
      });
      // ponto x_n
      g.fillStyle = C.fg; g.beginPath(); g.arc(p.X(x[0]), p.Y(0), 5, 0, 6.2832); g.fill();
      g.strokeStyle = C.deep; g.lineWidth = 1.6; g.stroke();
      p.label(x[0], 0, 'x_n', C.fg, { align: 'center', dy: -16, size: 11 });
      // barras de responsabilidade
      var by = p.h - 20, bw = 190;
      [[g1, C.d[0], 'γ_n1', 14], [g2, C.d[1], 'γ_n2', 14 + bw + 52]].forEach(function (b) {
        g.fillStyle = 'rgba(28,25,23,0.09)'; g.fillRect(b[3], by, bw, 9);
        g.fillStyle = b[1]; g.fillRect(b[3], by, bw * b[0], 9);
        g.fillStyle = C.dim; g.font = '10px ' + MONO; g.textBaseline = 'bottom'; g.textAlign = 'left';
        g.fillText(b[2], b[3], by - 3);
        g.fillStyle = b[1]; g.textAlign = 'right';
        g.fillText(b[0].toFixed(3), b[3] + bw, by - 3);
      });
      var scope = cv.closest ? cv.closest('.slide') : cv.parentNode;
      var out = (scope || cv.parentNode).querySelector('[data-gamma-out]');
      if (out) out.textContent = 'γ_n1 = ' + g1.toFixed(3) + '   ·   γ_n2 = ' + g2.toFixed(3) + '   ·   soma = ' + (g1 + g2).toFixed(3);
    };
    cv._setT = function (v) { st.t = v; cv._render(); };
    cv._render();
    return 'Duas componentes gaussianas de pesos iguais centradas em μ1 e μ2 sobre um trilho horizontal. Um ponto x_n desliza entre elas e duas barras mostram as responsabilidades γ_n1 e γ_n2, que sempre somam 1: 0,5 e 0,5 no ponto médio, aproximando-se de 1 e 0 nos extremos.';
  };

  /* ---------------------------------------------------------- SLIDE 08 --- */
  /* Partição do espaço em células de Voronoi                                */
  VIZ['fig-voronoi'] = function (cv) {
    var d = F.blobs3(), L = limitsOf(d.X, 0.10);
    var km = M.kmeansBest(d.X, 3, 10, 5);
    var p = new Plot(cv, { w: 520, h: 330, xlim: L.xlim, ylim: L.ylim, equal: true, pad: { l: 12, r: 12, t: 12, b: 24 } });
    p.frame({ grid: false, xlabel: 'Cada célula poligonal é a região de domínio de um centróide' });
    p.clip();
    // Rótulo do vizinho mais próximo em cada pixel = célula de Voronoi
    p.field(function (xv, yv) {
      var best = 0, bd = Infinity;
      for (var k = 0; k < 3; k++) {
        var dd = M.distND2([xv, yv], km.centers[k]);
        if (dd < bd) { bd = dd; best = k; }
      }
      return best;
    }, catColor(34));
    for (var n = 0; n < d.X.length; n++) p.dot(d.X[n][0], d.X[n][1], 2.7, C.d[km.labels[n]], 0.85);
    km.centers.forEach(function (c, k) {
      p.cross(c[0], c[1], 7, C.fg);
      p.label(c[0], c[1], 'μ' + (k + 1), C.fg, { dx: 11, dy: -11, size: 11, weight: '600' });
    });
    p.unclip();
    return 'Plano dividido em três células poligonais de Voronoi, cada uma colorida com a cor do seu centróide. Os pontos de dados aparecem coloridos conforme a célula em que caem e cada centróide é marcado com um X.';
  };

  /* ---------------------------------------------------------- SLIDE 09 --- */
  /* Decomposição da inércia: cada ponto ligado ao seu centróide             */
  VIZ['fig-cost'] = function (cv) {
    var d = F.blobs3(), L = limitsOf(d.X, 0.10);
    var km = M.kmeansBest(d.X, 3, 10, 5);
    var p = new Plot(cv, { w: 466, h: 300, xlim: L.xlim, ylim: L.ylim, equal: true, pad: { l: 12, r: 12, t: 12, b: 26 } });
    p.frame({ grid: false, xlabel: 'J = ' + km.inertia.toFixed(1) + '  (soma dos quadrados dos segmentos)' });
    p.clip();
    var g = p.g;
    g.lineWidth = 0.7;
    for (var n = 0; n < d.X.length; n++) {
      var k = km.labels[n];
      g.strokeStyle = C.d[k]; g.globalAlpha = 0.30;
      g.beginPath(); g.moveTo(p.X(d.X[n][0]), p.Y(d.X[n][1]));
      g.lineTo(p.X(km.centers[k][0]), p.Y(km.centers[k][1])); g.stroke();
    }
    g.globalAlpha = 1;
    for (n = 0; n < d.X.length; n++) p.dot(d.X[n][0], d.X[n][1], 2.4, C.d[km.labels[n]], 0.9);
    km.centers.forEach(function (c) { p.cross(c[0], c[1], 7, C.fg); });
    p.unclip();
    return 'Cada ponto é ligado ao seu centróide por um segmento fino. A inércia J é a soma dos quadrados dos comprimentos de todos esses segmentos; o valor calculado aparece no eixo inferior.';
  };

  /* ---------------------------------------------------------- SLIDE 11 --- */
  /* Quatro iterações reais do algoritmo de Lloyd, com setas de deslocamento */
  VIZ['fig-lloyd'] = function (cv) {
    var d = F.data('lloyd', function () {
      return M.makeBlobs(M.mulberry32(9), [[-3.2, -2.0], [5.0, -3.0], [2.0, 3.2]], 90, 1.15);
    });
    var L = limitsOf(d.X, 0.12);
    // Inicialização deliberadamente desfavorável (longe dos grupos reais)
    var run = M.kmeansRun(d.X, 3, { centers: [[-5.5, 4.5], [0.5, -5.5], [6.5, 4.5]] });
    var P = panels(cv, 1120, 336, 4, 1, 16, 0);
    var titles = ['Iteração 0 — μ_k⁰ inicial', 'Iteração 1', 'Iteração 2', 'Iteração 3 — convergido'];
    for (var t = 0; t < 4; t++) {
      var h = run.history[Math.min(t, run.history.length - 1)];
      var nx = run.history[Math.min(t + 1, run.history.length - 1)];
      var p = subPlot(P.g, P.cells[t], { xlim: L.xlim, ylim: L.ylim, equal: true, pad: { l: 10, r: 8, t: 20, b: 24 } });
      p.frame({ title: titles[t], grid: false, xlabel: 'J = ' + h.inertia.toFixed(1) });
      p.clip();
      for (var n = 0; n < d.X.length; n++) p.dot(d.X[n][0], d.X[n][1], 2.4, C.d[h.labels[n]], 0.78);
      for (var k = 0; k < 3; k++) {
        if (t < 3) p.arrow(h.centers[k][0], h.centers[k][1], nx.centers[k][0], nx.centers[k][1], C.fg, 1.6);
        p.cross(h.centers[k][0], h.centers[k][1], 6.5, C.fg);
      }
      p.unclip();
    }
    return 'Sequência de quatro painéis mostrando a mesma nuvem de 270 pontos. Na iteração 0 os três centróides estão longe dos grupos e as setas indicam para onde se moverão. A cada painel os centróides caminham para o centro de massa e a inércia J cai de ' +
      run.history[0].inertia.toFixed(0) + ' para ' + run.history[3].inertia.toFixed(0) + ', estabilizando no último painel.';
  };

  /* ---------------------------------------------------------- SLIDE 12 --- */
  /* Cotovelo (inércia) e silhueta média, ambos calculados para K = 2..8     */
  VIZ['fig-elbow'] = function (cv) {
    var d = F.blobs4();
    var curve = F.data('elbowCurve', function () {
      var out = [];
      for (var K = 2; K <= 8; K++) {
        var km = M.kmeansBest(d.X, K, 10, 1000 + K);
        out.push({ K: K, J: km.inertia, s: M.silhouette(d.X, km.labels, K) });
      }
      return out;
    });
    var P = panels(cv, 662, 300, 2, 1, 26, 0);
    var Js = curve.map(function (c) { return c.J; }), Ss = curve.map(function (c) { return c.s; });
    var best = curve.reduce(function (a, b) { return b.s > a.s ? b : a; });

    var p1 = subPlot(P.g, P.cells[0], { xlim: [1.7, 8.3], ylim: [0, Math.max.apply(null, Js) * 1.1], pad: { l: 42, r: 10, t: 20, b: 30 } });
    p1.frame({ title: 'Método do cotovelo', xlabel: 'número de clusters K', xticks: [2, 3, 4, 5, 6, 7, 8] });
    p1.line(curve.map(function (c) { return [c.K, c.J]; }), C.d[1], 2);
    curve.forEach(function (c) { p1.dot(c.K, c.J, 3.4, C.d[1], 1); });
    p1.ring(best.K, best.J, 6, C.accent, 2);
    p1.label(best.K, best.J, 'cotovelo K=' + best.K, C.accent, { dx: 10, dy: -12, size: 10 });
    p1.px(42, 20, 'inércia J', C.dim, { size: 9.5 });

    var p2 = subPlot(P.g, P.cells[1], { xlim: [1.7, 8.3], ylim: [0, 1], pad: { l: 34, r: 10, t: 20, b: 30 } });
    p2.frame({ title: 'Coeficiente de silhueta', xlabel: 'número de clusters K', xticks: [2, 3, 4, 5, 6, 7, 8], yticks: [0, 0.25, 0.5, 0.75, 1] });
    p2.line(curve.map(function (c) { return [c.K, c.s]; }), C.d[2], 2);
    curve.forEach(function (c) { p2.dot(c.K, c.s, 3.4, C.d[2], 1); });
    p2.ring(best.K, best.s, 6, C.accent, 2);
    p2.label(best.K, best.s, 'máx s = ' + best.s.toFixed(3), C.accent, { dx: 9, dy: -12, size: 10 });
    p2.px(34, 20, 's médio ∈ [-1,1]', C.dim, { size: 9.5 });
    cv._curve = curve;
    return 'Dois gráficos de linha para K de 2 a 8. À esquerda a inércia cai abruptamente até K=4 e depois quase não diminui, formando um cotovelo. À direita a silhueta média sobe até um pico em K=4, com valor ' + best.s.toFixed(3) + ', e decresce em seguida.';
  };

  /* ---------------------------------------------------------- SLIDE 13 --- */
  /* Mínimo local por inicialização aleatória versus semeadura k-means++     */
  VIZ['fig-init'] = function (cv) {
    var d = F.data('init4', function () {
      return M.makeBlobs(M.mulberry32(5), [[-5, 0], [-3.5, 4], [4, 1], [5, -4]], 80, 0.85);
    });
    var L = limitsOf(d.X, 0.10);
    var bad = M.kmeansRun(d.X, 4, { rng: M.mulberry32(386), init: 'random' });
    var good = M.kmeansRun(d.X, 4, { rng: M.mulberry32(531), init: 'k-means++' });
    var P = panels(cv, 662, 286, 2, 1, 20, 0);
    [[bad, "init='random' (mínimo local)"], [good, "init='k-means++'"]].forEach(function (pair, ci) {
      var r = pair[0];
      var p = subPlot(P.g, P.cells[ci], { xlim: L.xlim, ylim: L.ylim, equal: true, pad: { l: 10, r: 8, t: 20, b: 24 } });
      p.frame({ title: pair[1], grid: false, xlabel: 'J = ' + r.inertia.toFixed(1) });
      p.clip();
      for (var n = 0; n < d.X.length; n++) p.dot(d.X[n][0], d.X[n][1], 2.6, C.d[r.labels[n] % 4], 0.8);
      r.centers.forEach(function (c) { p.cross(c[0], c[1], 6.5, C.fg); });
      p.unclip();
    });
    cv._stats = { bad: bad.inertia, good: good.inertia, ratio: bad.inertia / good.inertia };
    return 'Dois painéis com os mesmos quatro grupos. À esquerda, uma inicialização aleatória infeliz funde dois grupos e divide outro, terminando com inércia ' + bad.inertia.toFixed(0) +
      '. À direita, a semeadura k-means++ recupera os quatro grupos corretos com inércia ' + good.inertia.toFixed(0) + '.';
  };

  /* ---------------------------------------------------------- SLIDE 14 --- */
  /* Onde o K-Means falha: anisotropia e densidades desiguais                */
  VIZ['fig-limits'] = function (cv) {
    var a = F.anisoData(), b = F.limitsData();
    var P = panels(cv, 662, 286, 2, 1, 20, 0);
    var kmA = M.kmeansBest(a.X, 3, 10, 7), kmB = M.kmeansBest(b.X, 3, 10, 7);
    [[a, kmA, 'Clusters alongados (anisotrópicos)'], [b, kmB, 'Densidades e tamanhos desiguais']].forEach(function (t, ci) {
      var L = limitsOf(t[0].X, 0.10);
      var p = subPlot(P.g, P.cells[ci], { xlim: L.xlim, ylim: L.ylim, equal: true, pad: { l: 10, r: 8, t: 20, b: 24 } });
      var pur = purity(t[0].y, t[1].labels, 3);
      p.frame({ title: t[2], grid: false, xlabel: 'concordância com os grupos geradores: ' + (pur * 100).toFixed(0) + '%' });
      p.clip();
      for (var n = 0; n < t[0].X.length; n++) p.dot(t[0].X[n][0], t[0].X[n][1], 2.3, C.d[t[1].labels[n]], 0.75);
      t[1].centers.forEach(function (c) { p.cross(c[0], c[1], 6.5, C.fg); });
      p.unclip();
    });
    var sizes = [0, 0, 0];
    kmB.labels.forEach(function (l) { sizes[l]++; });
    cv._stats = { aniso: purity(a.y, kmA.labels, 3), dens: purity(b.y, kmB.labels, 3), sizes: sizes.sort(function (x, y) { return y - x; }) };
    return 'Dois casos em que o K-Means erra. À esquerda, três faixas diagonais alongadas são cortadas transversalmente pelas fronteiras retas. À direita, um grupo largo e dois compactos: o grupo largo é repartido enquanto os compactos são fundidos.';
  };
  /* Fração de pontos cuja atribuição coincide com o grupo gerador dominante */
  function purity(yTrue, yPred, K) {
    var conf = [], i, k;
    for (k = 0; k < K; k++) conf.push(new Array(K).fill(0));
    for (i = 0; i < yTrue.length; i++) conf[yTrue[i]][yPred[i]]++;
    var s = 0;
    for (k = 0; k < K; k++) s += Math.max.apply(null, conf[k]);
    return s / yTrue.length;
  }

  global.VIZ = VIZ;
  global.FigCore.catColor = catColor;
  global.FigUtil = { limitsOf: limitsOf, purity: purity, catColor: catColor };
})(window);

/* ==========================================================================
   figures.js (parte 2) — Bernoulli, EM e Gaussian Mixture Models
   ========================================================================== */
(function (global) {
  'use strict';
  var M = global.MLCore, F = global.FigCore, VIZ = global.VIZ, U = global.FigUtil;
  var Plot = F.Plot, panels = F.panels, subPlot = F.subPlot, C = F.C, MONO = F.MONO;

  /* Ajuste da mistura de Bernoulli reaproveitado pelos slides 16, 19 e 20 */
  function bernFit() {
    return F.data('bernFit', function () {
      var d = F.digitsData();
      return { d: d, fit: M.bernoulliMixtureFit(d.X, 3, { rng: M.mulberry32(7) }) };
    });
  }
  /* Desenha um vetor μ_k de 64 dimensões como uma imagem 8x8 em tons de cinza */
  function drawMu(g, mu, x, y, cell) {
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
      var v = mu[r * 8 + c];                  // v = p(pixel aceso | componente k)
      var t = Math.round(255 * (1 - v));      // 1 → preto, 0 → branco
      g.fillStyle = 'rgb(' + t + ',' + t + ',' + t + ')';
      g.fillRect(x + c * cell, y + r * cell, cell + 0.5, cell + 0.5);
    }
    g.strokeStyle = 'rgba(28,25,23,0.22)'; g.lineWidth = 1;
    g.strokeRect(x + 0.5, y + 0.5, 8 * cell, 8 * cell);
  }

  /* ---------------------------------------------------------- SLIDE 16 --- */
  /* Um componente de Bernoulli: μ_k como mapa de probabilidades por pixel   */
  VIZ['fig-bern-mu'] = function (cv) {
    var B = bernFit(), mus = B.fit.snapshots.final;
    // escolhe a componente cujo protótipo é o dígito zero (mais pixels ativos na borda)
    var k = 0, bestScore = -1;
    mus.forEach(function (m, i) {
      var s = m[8 * 3 + 0] + m[8 * 3 + 7] + m[8 * 4 + 0] + m[8 * 4 + 7];   // laterais acesas
      if (s > bestScore) { bestScore = s; k = i; }
    });
    var mu = mus[k], w = 466, h = 252, cell = 25;
    cv.width = w * F.DPR; cv.height = h * F.DPR;
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    var g = cv.getContext('2d'); g.setTransform(F.DPR, 0, 0, F.DPR, 0, 0);
    var gx = 6, gy = 26;
    drawMu(g, mu, gx, gy, cell);
    g.fillStyle = C.dim; g.font = '10px ' + MONO; g.textBaseline = 'bottom';
    g.fillText('μ_k  (8 × 8 = 64 dimensões)', gx, gy - 7);

    // Barras: probabilidade de alguns bits específicos, com os valores reais
    var picks = [[3, 0], [3, 3], [0, 0], [1, 4]];
    var bx = gx + 8 * cell + 26, bw = 128;
    g.fillText('μ_kd = p(x_d = 1 | z_k = 1)', bx, gy - 7);
    picks.forEach(function (rc, i) {
      var idx = rc[0] * 8 + rc[1], v = mu[idx], yy = gy + 16 + i * 46;
      g.fillStyle = C.muted; g.font = '10.5px ' + MONO; g.textBaseline = 'alphabetic';
      g.fillText('d = ' + (idx + 1) + '  (lin ' + (rc[0] + 1) + ', col ' + (rc[1] + 1) + ')', bx, yy);
      g.fillStyle = 'rgba(28,25,23,0.09)'; g.fillRect(bx, yy + 5, bw, 8);
      g.fillStyle = v > 0.5 ? C.accent : C.d[1]; g.fillRect(bx, yy + 5, bw * v, 8);
      g.fillStyle = C.fg; g.font = '10.5px ' + MONO;
      g.fillText(v.toFixed(3), bx + bw + 9, yy + 13);
      // destaque do pixel correspondente na imagem
      g.strokeStyle = C.accent; g.lineWidth = 1.6;
      g.strokeRect(gx + rc[1] * cell + 0.5, gy + rc[0] * cell + 0.5, cell, cell);
    });
    return 'Protótipo de 8 por 8 em tons de cinza correspondente a uma componente de Bernoulli, com quatro pixels destacados. Ao lado, barras horizontais mostram o valor exato de μ_kd de cada pixel destacado, entre 0 e 1.';
  };

  /* ---------------------------------------------------------- SLIDE 19 --- */
  /* Evolução real dos protótipos μ_k ao longo das iterações do EM           */
  VIZ['fig-bern-em'] = function (cv) {
    var B = bernFit(), snaps = B.fit.snapshots;
    var keys = ['0', '2', '5', 'final'];
    var heads = ['Iteração 0 (ruído)', 'Iteração 2', 'Iteração 5', 'Convergência EM'];
    var cell = 12, gridPx = 8 * cell, gapX = 26, gapY = 16, labW = 58, headH = 24;
    var w = labW + 4 * gridPx + 3 * gapX + 18, h = headH + 3 * gridPx + 2 * gapY;
    cv.width = w * F.DPR; cv.height = h * F.DPR;
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    var g = cv.getContext('2d'); g.setTransform(F.DPR, 0, 0, F.DPR, 0, 0);
    g.font = '10px ' + MONO; g.textBaseline = 'bottom';
    keys.forEach(function (key, ci) {
      var x = labW + ci * (gridPx + gapX);
      g.fillStyle = ci === 3 ? C.accent : C.dim;
      g.textAlign = 'center';
      g.fillText(heads[ci], x + gridPx / 2, headH - 8);
      for (var k = 0; k < 3; k++) {
        drawMu(g, snaps[key][k], x, headH + k * (gridPx + gapY), cell);
      }
    });
    g.textAlign = 'left'; g.textBaseline = 'middle';
    for (var k = 0; k < 3; k++) {
      g.fillStyle = C.muted; g.font = '10px ' + MONO;
      g.fillText('k = ' + (k + 1), 0, headH + k * (gridPx + gapY) + gridPx / 2 - 7);
      g.fillStyle = C.dim;
      g.fillText('π=' + B.fit.pis[k].toFixed(2), 0, headH + k * (gridPx + gapY) + gridPx / 2 + 8);
    }
    cv._stats = { logLik: B.fit.logLik, iters: B.fit.lls.length, N: B.d.X.length };
    return 'Grade de três linhas por quatro colunas de imagens 8 por 8. Na primeira coluna os três vetores μ_k são manchas cinzentas aleatórias. Da esquerda para a direita os traços se definem até que, na coluna de convergência, aparecem os protótipos nítidos dos dígitos um, zero e sete, obtidos sem nenhum rótulo.';
  };

  /* ---------------------------------------------------------- SLIDE 20 --- */
  /* Subfluxo numérico: o produto ∏ μ^x (1-μ)^(1-x) colapsa para zero        */
  VIZ['fig-underflow'] = function (cv) {
    var B = bernFit(), d = F.digitsData();
    // log-verossimilhança média por dimensão, medida no modelo já ajustado
    var mu = B.fit.snapshots.final[0], x = d.X[0], sum = 0;
    for (var i = 0; i < 64; i++) sum += x[i] ? Math.log(mu[i] + 1e-12) : Math.log(1 - mu[i] + 1e-12);
    var perDim = sum / 64;                      // valor real medido (nats por dimensão)
    var log10PerDim = perDim / Math.LN10;
    var p = new Plot(cv, { w: 466, h: 214, xlim: [0, 800], ylim: [-620, 20], pad: { l: 46, r: 12, t: 18, b: 30 } });
    p.frame({ xlabel: 'dimensão d acumulada', yticks: [0, -150, -308, -450, -600], xticks: [0, 200, 400, 600, 800] });
    p.px(46, 2, 'log₁₀ do produto acumulado', C.dim, { size: 9.5 });
    // trecho medido (D = 64, dados reais) e extrapolação até D = 784
    p.line([[0, 0], [64, 64 * log10PerDim]], C.d[1], 2.4);
    p.line([[64, 64 * log10PerDim], [800, 800 * log10PerDim]], C.d[1], 1.6, [5, 4]);
    // piso do ponto flutuante de dupla precisão
    p.line([[0, -308], [800, -308]], C.d[2], 1.4, [3, 3]);
    p.label(800, -308, 'menor double ≈ 10⁻³⁰⁸', C.d[2], { align: 'right', dy: -9, size: 9.5 });
    var dCross = -308 / log10PerDim;
    p.ring(dCross, -308, 5, C.accent, 2);
    p.label(dCross, -308, 'zera em d ≈ ' + Math.round(dCross), C.accent, { dx: 8, dy: 16, size: 10 });
    p.label(64, 64 * log10PerDim, 'medido (D=64)', C.d[1], { dx: 7, dy: -10, size: 9.5 });
    cv._stats = { perDim: perDim, log10PerDim: log10PerDim, dCross: dCross, prod784: Math.pow(10, 784 * log10PerDim) };
    return 'Gráfico do logaritmo decimal do produto acumulado de verossimilhanças em função do número de dimensões. A reta desce continuamente e cruza o piso de representação do ponto flutuante de dupla precisão, marcado em 10 elevado a menos 308, por volta da dimensão ' + Math.round(dCross) + '.';
  };

  /* ---------------------------------------------------------- SLIDE 22 --- */
  /* Densidade p(x) de uma mistura gaussiana e suas elipses de covariância   */
  VIZ['fig-gmm-density'] = function (cv) {
    var a = F.anisoData(), L = U.limitsOf(a.X, 0.08);
    var gm = M.gmmBest(a.X, 3, { covarianceType: 'full' }, 10, 900);
    var p = new Plot(cv, { w: 520, h: 306, xlim: L.xlim, ylim: L.ylim, equal: true, pad: { l: 12, r: 12, t: 12, b: 26 } });
    p.frame({ grid: false, xlabel: 'p(x) = Σ_k π_k N(x | μ_k, Σ_k)   —   ln L = ' + gm.logLik.toFixed(1) });
    p.clip();
    // Mapa da densidade da mistura avaliado pixel a pixel
    p.field(function (xv, yv) {
      var ls = [];
      for (var k = 0; k < 3; k++) ls.push(Math.log(gm.pis[k]) + M.logNormal2([xv, yv], gm.mus[k], gm.sigmas[k]));
      return Math.exp(M.logSumExp(ls));
    }, function (v, mn, mx) {
      var t = Math.pow(v / (mx || 1), 0.42);        // gama < 1 realça as caudas
      // tinta âmbar sobre papel: a opacidade cresce com a densidade
      return [180, 83, 10, Math.round(12 + t * 216)];
    });
    for (var n = 0; n < a.X.length; n++) p.dot(a.X[n][0], a.X[n][1], 1.7, C.fg, 0.35);
    gm.mus.forEach(function (m, k) {
      var e = M.ellipseFromCov(gm.sigmas[k], 2);
      p.ellipse(m[0], m[1], e.rx, e.ry, e.theta, 'rgba(27,25,23,0.75)', null);
      p.ring(m[0], m[1], 3, C.fg, 2);
    });
    p.unclip();
    return 'Mapa de calor da densidade da mistura sobre três faixas diagonais de pontos. As regiões claras marcam alta densidade e três elipses brancas de dois desvios-padrão contornam cada componente, alinhadas com a inclinação dos dados.';
  };

  /* ---------------------------------------------------------- SLIDE 23 --- */
  /* Três instantes do EM: inicialização, iteração intermediária e convergência */
  VIZ['fig-gmm-em'] = function (cv) {
    var a = F.anisoData(), L = U.limitsOf(a.X, 0.08);
    var gm = M.gmmBest(a.X, 3, { covarianceType: 'full' }, 10, 900);
    var H = gm.history, pick = [0, 3, H.length - 1];
    var P = panels(cv, 760, 262, 3, 1, 18, 0);
    pick.forEach(function (hi, ci) {
      var h = H[Math.min(hi, H.length - 1)];
      var p = subPlot(P.g, P.cells[ci], { xlim: L.xlim, ylim: L.ylim, equal: true, pad: { l: 8, r: 8, t: 20, b: 24 } });
      p.frame({
        title: ci === 0 ? 'Iteração 1 (após 1º Passo E)' : (ci === 1 ? 'Iteração ' + (hi + 1) : 'Convergência (' + H.length + ' iterações)'),
        grid: false, xlabel: 'ln L = ' + h.ll.toFixed(1)
      });
      p.clip();
      for (var n = 0; n < a.X.length; n++) p.dot(a.X[n][0], a.X[n][1], 1.9, C.gray, 0.5);
      h.mus.forEach(function (m, k) {
        var e = M.ellipseFromCov(h.sigmas[k], 2);
        p.ellipse(m[0], m[1], e.rx, e.ry, e.theta, C.d[k], C.dSoft[k % 4]);
        p.ring(m[0], m[1], 2.6, C.d[k], 2);
      });
      p.unclip();
    });
    cv._stats = { iters: H.length, ll0: H[0].ll, llf: H[H.length - 1].ll };
    return 'Três painéis da mesma nuvem de pontos. No primeiro, as elipses das componentes são circulares e largas. No segundo já se alongam na direção dos dados. No terceiro, as três elipses envolvem exatamente as três faixas e a log-verossimilhança sobe de ' + H[0].ll.toFixed(0) + ' para ' + H[H.length - 1].ll.toFixed(0) + '.';
  };

  /* ---------------------------------------------------------- SLIDE 24 --- */
  /* As quatro geometrias de covariance_type, cada uma com um ajuste real    */
  VIZ['fig-covtypes'] = function (cv) {
    var a = F.anisoData(), L = U.limitsOf(a.X, 0.08);
    var types = ['spherical', 'diag', 'tied', 'full'];
    var fits = F.data('covFits', function () {
      return types.map(function (t) { return M.gmmBest(a.X, 3, { covarianceType: t }, 10, 900); });
    });
    var best = fits.reduce(function (p, q) { return q.bic < p.bic ? q : p; });
    var P = panels(cv, 1120, 226, 4, 1, 18, 0);
    var forms = ['Σ_k = σ²_k I   círculos', 'Σ_k = diag(σ²_k1, σ²_k2)', 'Σ_k = Σ   compartilhada', 'Σ_k completa   livre'];
    fits.forEach(function (gm, ci) {
      var p = subPlot(P.g, P.cells[ci], { xlim: L.xlim, ylim: L.ylim, equal: true, pad: { l: 8, r: 8, t: 34, b: 24 } });
      var isBest = gm === best;
      p.frame({
        title: "'" + types[ci] + "'" + (isBest ? '  ← menor BIC' : ''),
        grid: false,
        xlabel: 'p = ' + gm.nParams + ' params · BIC = ' + gm.bic.toFixed(0)
      });
      p.px(p.pad.l, 14, forms[ci], C.dim, { size: 9.5 });
      p.clip();
      for (var n = 0; n < a.X.length; n++) p.dot(a.X[n][0], a.X[n][1], 1.8, C.gray, 0.45);
      gm.mus.forEach(function (m, k) {
        var e = M.ellipseFromCov(gm.sigmas[k], 2);
        p.ellipse(m[0], m[1], e.rx, e.ry, e.theta, isBest ? C.accent : C.d[1], isBest ? C.dSoft[0] : 'rgba(12,124,122,0.07)');
        p.ring(m[0], m[1], 2.4, C.fg, 1.6);
      });
      p.unclip();
    });
    cv._stats = { fits: fits.map(function (g, i) { return { type: types[i], p: g.nParams, bic: g.bic, ll: g.logLik }; }), best: best.covarianceType };
    return 'Quatro painéis com o mesmo conjunto de pontos, cada um ajustado com um covariance_type diferente. Em spherical as elipses são círculos; em diag são elipses alinhadas aos eixos; em tied as três componentes compartilham a mesma elipse inclinada; em full cada componente tem forma e inclinação próprias.';
  };

  /* ---------------------------------------------------------- SLIDE 25 --- */
  /* Comparação direta K-Means (rígido) versus GMM (probabilístico)          */
  VIZ['fig-compare'] = function (cv) {
    var a = F.anisoData(), L = U.limitsOf(a.X, 0.06);
    var km = M.kmeansBest(a.X, 3, 10, 7);
    var gm = M.gmmBest(a.X, 3, { covarianceType: 'full' }, 10, 900);
    var gl = gm.predict();
    var P = panels(cv, 1080, 322, 2, 1, 26, 0);

    /* --- Painel 1: K-Means com células de Voronoi e centróides ---------- */
    var p1 = subPlot(P.g, P.cells[0], { xlim: L.xlim, ylim: L.ylim, equal: true, pad: { l: 10, r: 10, t: 22, b: 26 } });
    p1.frame({
      title: "KMeans(n_clusters=3, init='k-means++')",
      grid: false,
      xlabel: 'fronteiras retas · J = ' + km.inertia.toFixed(1) + ' · concordância ' + (U.purity(a.y, km.labels, 3) * 100).toFixed(0) + '%'
    });
    p1.clip();
    p1.field(function (xv, yv) {
      var bk = 0, bd = Infinity;
      for (var k = 0; k < 3; k++) {
        var dd = M.distND2([xv, yv], km.centers[k]);
        if (dd < bd) { bd = dd; bk = k; }
      }
      return bk;
    }, F.catColor(32));
    for (var n = 0; n < a.X.length; n++) p1.dot(a.X[n][0], a.X[n][1], 2.1, C.d[km.labels[n]], 0.8);
    km.centers.forEach(function (c) { p1.cross(c[0], c[1], 7, C.fg); });
    p1.unclip();

    /* --- Painel 2: GMM com elipses de 2 desvios e médias ---------------- */
    var p2 = subPlot(P.g, P.cells[1], { xlim: L.xlim, ylim: L.ylim, equal: true, pad: { l: 10, r: 10, t: 22, b: 26 } });
    p2.frame({
      title: "GaussianMixture(n_components=3, covariance_type='full')",
      grid: false,
      xlabel: 'elipses inclinadas · BIC = ' + gm.bic.toFixed(0) + ' · concordância ' + (U.purity(a.y, gl, 3) * 100).toFixed(0) + '%'
    });
    p2.clip();
    for (n = 0; n < a.X.length; n++) {
      // opacidade proporcional à confiança max_k γ_nk: pontos incertos ficam pálidos
      var conf = Math.max.apply(null, gm.gamma[n]);
      p2.dot(a.X[n][0], a.X[n][1], 2.1, C.d[gl[n]], 0.20 + 0.62 * conf);
    }
    gm.mus.forEach(function (m, k) {
      var e = M.ellipseFromCov(gm.sigmas[k], 2);
      p2.ellipse(m[0], m[1], e.rx, e.ry, e.theta, '#6D3FC4', 'rgba(109,63,196,0.10)');
      p2.ring(m[0], m[1], 3.4, C.fg, 2.2);
    });
    // destaca as amostras de fronteira (baixa confiança)
    var unc = gm.gamma.map(function (gg, i2) { return [Math.max.apply(null, gg), i2]; })
      .sort(function (x1, x2) { return x1[0] - x2[0]; }).slice(0, 3);
    unc.forEach(function (u) { p2.ring(a.X[u[1]][0], a.X[u[1]][1], 6, C.accent, 1.6); });
    p2.unclip();

    cv._stats = {
      inertia: km.inertia, bic: gm.bic, logLik: gm.logLik, nParams: gm.nParams, iters: gm.nIter,
      kmPurity: U.purity(a.y, km.labels, 3), gmPurity: U.purity(a.y, gl, 3), N: a.X.length,
      uncertain: unc.map(function (u) { return { x: a.X[u[1]], gamma: gm.gamma[u[1]] }; }),
      weights: gm.pis
    };
    return 'Dois painéis lado a lado sobre os mesmos 540 pontos formando três faixas diagonais. À esquerda, o K-Means colore o fundo com três regiões retas que atravessam as faixas, misturando os grupos. À direita, o modelo de mistura gaussiana desenha três elipses inclinadas que acompanham exatamente as faixas, e os pontos de fronteira aparecem circulados.';
  };
})(window);
