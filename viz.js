/* ==========================================================================
   viz.js — Visualizações computadas ao vivo no navegador
   --------------------------------------------------------------------------
   Todas as figuras desta apresentação são geradas executando os algoritmos
   de verdade (Lloyd/K-Means, EM para Misturas de Bernoulli, EM para GMM)
   sobre conjuntos sintéticos com semente fixa. Nenhum número exibido é
   fictício: os valores de inércia, silhueta, log-verossimilhança e BIC são
   calculados por este arquivo no momento em que a página abre.
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------------- 1. RNG */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gaussPair(rng) {
    var u = 0, v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    var r = Math.sqrt(-2 * Math.log(u));
    return [r * Math.cos(2 * Math.PI * v), r * Math.sin(2 * Math.PI * v)];
  }
  function randn(rng) { return gaussPair(rng)[0]; }

  /* ------------------------------------------------- 2. Geração de dados */
  // Blobs isotrópicos: centers = [[x,y],...], std escalar ou vetor
  function makeBlobs(rng, centers, nPer, std) {
    var X = [], y = [];
    for (var k = 0; k < centers.length; k++) {
      var s = Array.isArray(std) ? std[k] : std;
      var n = Array.isArray(nPer) ? nPer[k] : nPer;
      for (var i = 0; i < n; i++) {
        X.push([centers[k][0] + randn(rng) * s, centers[k][1] + randn(rng) * s]);
        y.push(k);
      }
    }
    return { X: X, y: y };
  }
  // Aplica transformação linear 2x2 (gera clusters anisotrópicos/inclinados)
  function linearTransform(X, T) {
    return X.map(function (p) {
      return [p[0] * T[0][0] + p[1] * T[1][0], p[0] * T[0][1] + p[1] * T[1][1]];
    });
  }

  /* -------------------------------------------------- 3. Álgebra auxiliar */
  function dist2(a, b) { var dx = a[0] - b[0], dy = a[1] - b[1]; return dx * dx + dy * dy; }
  function distND2(a, b) { var s = 0; for (var d = 0; d < a.length; d++) { var t = a[d] - b[d]; s += t * t; } return s; }
  function logSumExp(arr) {
    var m = -Infinity, i;
    for (i = 0; i < arr.length; i++) if (arr[i] > m) m = arr[i];
    if (m === -Infinity) return -Infinity;
    var s = 0;
    for (i = 0; i < arr.length; i++) s += Math.exp(arr[i] - m);
    return m + Math.log(s);
  }
  function extent(X, idx) {
    var lo = Infinity, hi = -Infinity;
    for (var i = 0; i < X.length; i++) { var v = X[i][idx]; if (v < lo) lo = v; if (v > hi) hi = v; }
    return [lo, hi];
  }

  /* --------------------------------------------- 4. K-Means (Lloyd + ++)  */
  // Semeadura k-means++: p(x) ∝ D(x)^2
  function kmeansppInit(X, K, rng) {
    var n = X.length, centers = [X[Math.floor(rng() * n)].slice()], i, j;
    var D2 = new Array(n).fill(Infinity);
    for (var c = 1; c < K; c++) {
      var tot = 0;
      for (i = 0; i < n; i++) {
        var d = distND2(X[i], centers[c - 1]);
        if (d < D2[i]) D2[i] = d;
        tot += D2[i];
      }
      var target = rng() * tot, acc = 0, pick = n - 1;
      for (i = 0; i < n; i++) { acc += D2[i]; if (acc >= target) { pick = i; break; } }
      centers.push(X[pick].slice());
    }
    return centers;
  }
  function randomInit(X, K, rng) {
    var idx = [], used = {};
    while (idx.length < K) { var i = Math.floor(rng() * X.length); if (!used[i]) { used[i] = 1; idx.push(i); } }
    return idx.map(function (i) { return X[i].slice(); });
  }
  function assign(X, centers) {
    var lab = new Array(X.length), inertia = 0;
    for (var i = 0; i < X.length; i++) {
      var best = 0, bd = Infinity;
      for (var k = 0; k < centers.length; k++) {
        var d = distND2(X[i], centers[k]);
        if (d < bd) { bd = d; best = k; }
      }
      lab[i] = best; inertia += bd;
    }
    return { labels: lab, inertia: inertia };
  }
  function updateCenters(X, labels, K, prev) {
    var D = X[0].length, sums = [], cnt = new Array(K).fill(0), k, d, i;
    for (k = 0; k < K; k++) sums.push(new Array(D).fill(0));
    for (i = 0; i < X.length; i++) {
      cnt[labels[i]]++;
      for (d = 0; d < D; d++) sums[labels[i]][d] += X[i][d];
    }
    var out = [];
    for (k = 0; k < K; k++) {
      if (cnt[k] === 0) { out.push(prev[k].slice()); continue; }   // cluster vazio: mantém
      var c = new Array(D);
      for (d = 0; d < D; d++) c[d] = sums[k][d] / cnt[k];
      out.push(c);
    }
    return out;
  }
  /* Executa Lloyd guardando o histórico de cada iteração (para o slide 11). */
  function kmeansRun(X, K, opts) {
    opts = opts || {};
    var rng = opts.rng || mulberry32(7);
    var centers = opts.centers ? opts.centers.map(function (c) { return c.slice(); })
      : (opts.init === 'random' ? randomInit(X, K, rng) : kmeansppInit(X, K, rng));
    var maxIter = opts.maxIter || 60, tol = opts.tol || 1e-9;
    var history = [], a = assign(X, centers);
    history.push({ centers: centers.map(function (c) { return c.slice(); }), labels: a.labels.slice(), inertia: a.inertia });
    for (var it = 0; it < maxIter; it++) {
      var nc = updateCenters(X, a.labels, K, centers);
      var shift = 0;
      for (var k = 0; k < K; k++) shift += distND2(nc[k], centers[k]);
      centers = nc;
      a = assign(X, centers);
      history.push({ centers: centers.map(function (c) { return c.slice(); }), labels: a.labels.slice(), inertia: a.inertia });
      if (shift <= tol) break;
    }
    return { centers: centers, labels: a.labels, inertia: a.inertia, history: history, nIter: history.length - 1 };
  }
  /* n_init reinicializações independentes; devolve a de menor inércia. */
  function kmeansBest(X, K, nInit, seed, init) {
    var best = null;
    for (var r = 0; r < nInit; r++) {
      var res = kmeansRun(X, K, { rng: mulberry32(seed + r * 977), init: init || 'k-means++' });
      if (!best || res.inertia < best.inertia) best = res;
    }
    return best;
  }

  /* ------------------------------------------- 5. Coeficiente de silhueta */
  // s(i) = (b(i) - a(i)) / max(a(i), b(i)); devolve a média sobre as amostras
  function silhouette(X, labels, K) {
    var n = X.length, i, j, k;
    var counts = new Array(K).fill(0);
    for (i = 0; i < n; i++) counts[labels[i]]++;
    var total = 0, valid = 0;
    for (i = 0; i < n; i++) {
      var sums = new Array(K).fill(0);
      for (j = 0; j < n; j++) { if (i === j) continue; sums[labels[j]] += Math.sqrt(distND2(X[i], X[j])); }
      var own = labels[i];
      if (counts[own] <= 1) continue;
      var ai = sums[own] / (counts[own] - 1), bi = Infinity;
      for (k = 0; k < K; k++) { if (k === own || counts[k] === 0) continue; var m = sums[k] / counts[k]; if (m < bi) bi = m; }
      if (!isFinite(bi)) continue;
      total += (bi - ai) / Math.max(ai, bi); valid++;
    }
    return valid ? total / valid : 0;
  }

  /* ------------------------------- 6. EM para GMM 2-D (covariância full)  */
  function inv2(S) {
    var det = S[0] * S[3] - S[1] * S[2];
    return { det: det, inv: [S[3] / det, -S[1] / det, -S[2] / det, S[0] / det] };
  }
  function logNormal2(x, mu, S) {         // S = [a,b,c,d] linha-maior
    var m = inv2(S);
    var dx = x[0] - mu[0], dy = x[1] - mu[1];
    var q = dx * (m.inv[0] * dx + m.inv[1] * dy) + dy * (m.inv[2] * dx + m.inv[3] * dy);
    return -Math.log(2 * Math.PI) - 0.5 * Math.log(Math.max(m.det, 1e-300)) - 0.5 * q;
  }
  /* MLE restrita de Σ por covariance_type (equivalente ao scikit-learn em 2-D).
     'diag' zera as covariâncias cruzadas, 'spherical' usa trace(Σ)/D e
     'tied' agrupa as componentes na média ponderada Σ = Σ_k π_k Σ_k.        */
  function applyCovConstraint(sigmas, pis, covType, reg) {
    var K = sigmas.length, k;
    if (covType === 'full') return;
    if (covType === 'diag') {
      for (k = 0; k < K; k++) { sigmas[k][1] = 0; sigmas[k][2] = 0; }
    } else if (covType === 'spherical') {
      for (k = 0; k < K; k++) {
        var s = (sigmas[k][0] + sigmas[k][3]) / 2;
        sigmas[k] = [s, 0, 0, s];
      }
    } else if (covType === 'tied') {
      var t = [0, 0, 0, 0];
      for (k = 0; k < K; k++) for (var j = 0; j < 4; j++) t[j] += pis[k] * sigmas[k][j];
      for (k = 0; k < K; k++) sigmas[k] = t.slice();
    }
  }
  /* Número de parâmetros livres de covariância para D dimensões */
  function covParams(covType, K, D) {
    if (covType === 'spherical') return K;
    if (covType === 'diag') return K * D;
    if (covType === 'tied') return D * (D + 1) / 2;
    return K * D * (D + 1) / 2;              // full
  }

  function gmmFit(X, K, opts) {
    opts = opts || {};
    var regCovar = opts.regCovar === undefined ? 1e-6 : opts.regCovar;
    var maxIter = opts.maxIter || 120, tol = opts.tol || 1e-7;
    var covType = opts.covarianceType || 'full';   // full | tied | diag | spherical
    var rng = opts.rng || mulberry32(11), n = X.length, i, k;

    // Inicialização padrão do scikit-learn: responsabilidades vindas do K-Means
    var km = opts.initCenters ? { centers: opts.initCenters } : kmeansBest(X, K, 3, 4242);
    var mus = km.centers.map(function (c) { return c.slice(); });
    var vx = extent(X, 0), vy = extent(X, 1);
    var s0 = Math.pow((vx[1] - vx[0] + vy[1] - vy[0]) / 8, 2);
    var sigmas = [], pis = [];
    for (k = 0; k < K; k++) { sigmas.push([s0, 0, 0, s0]); pis.push(1 / K); }

    var gamma = [], prevLL = -Infinity, ll = -Infinity, history = [];
    for (i = 0; i < n; i++) gamma.push(new Array(K).fill(0));

    for (var it = 0; it < maxIter; it++) {
      /* --- Passo E: responsabilidades γ_nk (normalizadas via log-sum-exp) */
      ll = 0;
      for (i = 0; i < n; i++) {
        var logs = new Array(K);
        for (k = 0; k < K; k++) logs[k] = Math.log(pis[k] + 1e-300) + logNormal2(X[i], mus[k], sigmas[k]);
        var lse = logSumExp(logs);
        ll += lse;
        for (k = 0; k < K; k++) gamma[i][k] = Math.exp(logs[k] - lse);
      }
      history.push({
        mus: mus.map(function (m) { return m.slice(); }),
        sigmas: sigmas.map(function (s) { return s.slice(); }),
        pis: pis.slice(), ll: ll
      });
      if (Math.abs(ll - prevLL) / n < tol) break;
      prevLL = ll;

      /* --- Passo M: N_k, π_k, μ_k, Σ_k ---------------------------------- */
      for (k = 0; k < K; k++) {
        var Nk = 0, mx = 0, my = 0;
        for (i = 0; i < n; i++) { var g = gamma[i][k]; Nk += g; mx += g * X[i][0]; my += g * X[i][1]; }
        Nk = Math.max(Nk, 1e-10);
        pis[k] = Nk / n;
        mus[k] = [mx / Nk, my / Nk];
        var a = 0, b = 0, d = 0;
        for (i = 0; i < n; i++) {
          var gg = gamma[i][k], ux = X[i][0] - mus[k][0], uy = X[i][1] - mus[k][1];
          a += gg * ux * ux; b += gg * ux * uy; d += gg * uy * uy;
        }
        sigmas[k] = [a / Nk + regCovar, b / Nk, b / Nk, d / Nk + regCovar];
      }
      applyCovConstraint(sigmas, pis, covType, regCovar);
    }
    // BIC = -2 ln L + p ln N ; p = (K-1) pesos + K·D médias + parâmetros de covariância
    var p = (K - 1) + K * 2 + covParams(covType, K, 2);
    return {
      mus: mus, sigmas: sigmas, pis: pis, gamma: gamma, logLik: ll, nIter: history.length,
      covarianceType: covType,
      history: history, nParams: p,
      bic: -2 * ll + p * Math.log(n),
      aic: -2 * ll + 2 * p,
      predict: function () {
        return gamma.map(function (g) {
          var bi = 0; for (var k2 = 1; k2 < K; k2++) if (g[k2] > g[bi]) bi = k2; return bi;
        });
      }
    };
  }
  /* n_init reinicializações independentes do EM; devolve a de maior
     log-verossimilhança — equivalente ao parâmetro n_init do scikit-learn.
     Sem isso, tipos de covariância restritos podem parar num ótimo local ruim. */
  function gmmBest(X, K, opts, nInit, seed) {
    opts = opts || {};
    var best = null;
    for (var r = 0; r < (nInit || 5); r++) {
      var o = {}, key;
      for (key in opts) o[key] = opts[key];
      o.initCenters = kmeansRun(X, K, { rng: mulberry32((seed || 900) + r * 57) }).centers;
      var g = gmmFit(X, K, o);
      if (!best || g.logLik > best.logLik) best = g;
    }
    return best;
  }

  // Eixos da elipse de nível a partir da decomposição espectral de Σ
  function ellipseFromCov(S, nStd) {
    var a = S[0], b = S[1], d = S[3];
    var tr = a + d, det = a * d - b * b;
    var disc = Math.sqrt(Math.max(tr * tr / 4 - det, 0));
    var l1 = tr / 2 + disc, l2 = tr / 2 - disc;
    var theta = (b === 0) ? (a >= d ? 0 : Math.PI / 2) : Math.atan2(l1 - a, b);
    return { rx: nStd * Math.sqrt(Math.max(l1, 1e-12)), ry: nStd * Math.sqrt(Math.max(l2, 1e-12)), theta: theta };
  }

  /* --------------------- 7. EM para Misturas de Bernoulli (espaço log)   */
  function bernoulliMixtureFit(X, K, opts) {
    opts = opts || {};
    var rng = opts.rng || mulberry32(3), maxIter = opts.maxIter || 60;
    var alpha = opts.alpha === undefined ? 0.05 : opts.alpha;   // suavização de Laplace
    var n = X.length, D = X[0].length, i, k, d;
    var mus = [], pis = [];
    for (k = 0; k < K; k++) {
      var m = new Array(D);
      for (d = 0; d < D; d++) m[d] = 0.25 + 0.5 * rng();        // ruído em torno de 0,5
      mus.push(m); pis.push(1 / K);
    }
    var snapshots = { 0: mus.map(function (m) { return m.slice(); }) };
    var gamma = [], ll = 0, prev = -Infinity, lls = [];
    for (i = 0; i < n; i++) gamma.push(new Array(K).fill(0));

    for (var it = 1; it <= maxIter; it++) {
      /* Passo E em espaço logarítmico: evita o subfluxo de ∏_d μ^x (1-μ)^(1-x) */
      ll = 0;
      for (i = 0; i < n; i++) {
        var logs = new Array(K);
        for (k = 0; k < K; k++) {
          var lp = Math.log(pis[k] + 1e-300);
          for (d = 0; d < D; d++) {
            lp += X[i][d] ? Math.log(mus[k][d] + 1e-12) : Math.log(1 - mus[k][d] + 1e-12);
          }
          logs[k] = lp;
        }
        var lse = logSumExp(logs); ll += lse;
        for (k = 0; k < K; k++) gamma[i][k] = Math.exp(logs[k] - lse);
      }
      lls.push(ll);
      /* Passo M: N_k = Σ γ ; π_k = N_k/N ; μ_k = (Σ γ x + α)/(N_k + 2α) */
      for (k = 0; k < K; k++) {
        var Nk = 0; for (i = 0; i < n; i++) Nk += gamma[i][k];
        pis[k] = Nk / n;
        for (d = 0; d < D; d++) {
          var s = 0; for (i = 0; i < n; i++) s += gamma[i][k] * X[i][d];
          mus[k][d] = (s + alpha) / (Nk + 2 * alpha);
        }
      }
      if (it === 2 || it === 5) snapshots[it] = mus.map(function (m) { return m.slice(); });
      if (Math.abs(ll - prev) < 1e-6) break;
      prev = ll;
    }
    snapshots.final = mus.map(function (m) { return m.slice(); });
    return { mus: mus, pis: pis, gamma: gamma, logLik: ll, snapshots: snapshots, lls: lls };
  }

  /* ----------------------- 8. Funções auxiliares para os Laboratórios --- */
  function mahalanobisDist2(x, mu, S) {
    var m = inv2(S);
    var dx = x[0] - mu[0], dy = x[1] - mu[1];
    return dx * (m.inv[0] * dx + m.inv[1] * dy) + dy * (m.inv[2] * dx + m.inv[3] * dy);
  }
  function mahalanobisDist(x, mu, S) {
    return Math.sqrt(Math.max(0, mahalanobisDist2(x, mu, S)));
  }

  function distortion1D(pts, mu) {
    var s = 0;
    for (var i = 0; i < pts.length; i++) {
      var d = pts[i] - mu;
      s += d * d;
    }
    return s;
  }

  function evaluateBernoulliLogLik(x, mu) {
    var ll = 0;
    for (var d = 0; d < x.length; d++) {
      var md = Math.max(1e-12, Math.min(1 - 1e-12, mu[d]));
      ll += x[d] ? Math.log(md) : Math.log(1 - md);
    }
    return ll;
  }

  function bicsSweep(X, maxK, types) {
    types = types || ['full', 'tied', 'diag', 'spherical'];
    maxK = maxK || 6;
    var results = [];
    var best = null;
    for (var t = 0; t < types.length; t++) {
      var covType = types[t];
      var curve = [];
      for (var k = 1; k <= maxK; k++) {
        var g = gmmBest(X, k, { covarianceType: covType }, 5, 100 + k * 17);
        var item = { K: k, covType: covType, bic: g.bic, aic: g.aic, ll: g.logLik, p: g.nParams };
        curve.push(item);
        if (!best || g.bic < best.bic) best = item;
      }
      results.push({ covType: covType, curve: curve });
    }
    return { results: results, best: best };
  }

  function kmeans(X, K, opts) {
    opts = opts || {};
    var nInit = opts.nInit || 3;
    var maxIter = opts.maxIter || 30;
    var best = null;
    for (var r = 0; r < nInit; r++) {
      var res = kmeansRun(X, K, { rng: mulberry32(100 + r * 37), maxIter: maxIter, init: 'k-means++' });
      if (!best || res.inertia < best.inertia) best = res;
    }
    return { centroids: best.centers, labels: best.labels, inertia: best.inertia, history: best.history };
  }

  global.MLCore = {
    mulberry32: mulberry32, randn: randn, makeBlobs: makeBlobs, linearTransform: linearTransform,
    dist2: dist2, distND2: distND2, logSumExp: logSumExp, extent: extent,
    kmeans: kmeans, kmeansRun: kmeansRun, kmeansBest: kmeansBest, kmeansppInit: kmeansppInit, randomInit: randomInit,
    assign: assign, updateCenters: updateCenters, silhouette: silhouette,
    gmmFit: gmmFit, gmmBest: gmmBest, logNormal2: logNormal2, inv2: inv2,
    ellipseFromCov: ellipseFromCov, covParams: covParams,
    bernoulliMixtureFit: bernoulliMixtureFit,
    mahalanobisDist2: mahalanobisDist2, mahalanobisDist: mahalanobisDist,
    distortion1D: distortion1D, evaluateBernoulliLogLik: evaluateBernoulliLogLik,
    bicsSweep: bicsSweep
  };
})(window);
