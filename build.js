/* ==========================================================================
   build.js — Gera a versão de arquivo único da apresentação.
   --------------------------------------------------------------------------
   Lê index.html e embute styles.css, viz.js, figures.js e script.js dentro
   do próprio HTML, produzindo `apresentacao.html`: um arquivo que pode ser
   baixado sozinho, enviado por e-mail ou copiado num pen drive e continua
   funcionando ao ser aberto com dois cliques.

   Uso:  node build.js
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const read = f => fs.readFileSync(path.join(DIR, f), 'utf8');

/* Uma sequência "</script" dentro do código encerraria a tag prematuramente.
   Escapar a barra preserva o significado em JavaScript e desarma o parser. */
const safe = code => code.replace(/<\/script/gi, '<\\/script');

let html = read('index.html');

// 1. folha de estilo -> <style>
const css = read('styles.css');
html = html.replace(
  '<link rel="stylesheet" href="styles.css">',
  () => '<style>\n/* ===== styles.css (embutido) ===== */\n' + css + '\n</style>'
);

// 2. scripts locais -> <script> inline, preservando a ordem de carregamento
['viz.js', 'figures.js', 'labs.js', 'script.js'].forEach(function (file) {
  const tag = '<script src="' + file + '"></script>';
  if (html.indexOf(tag) === -1) throw new Error('tag não encontrada para ' + file);
  html = html.replace(tag,
    () => '<script>\n/* ===== ' + file + ' (embutido) ===== */\n' + safe(read(file)) + '\n</script>');
});

// 3. aviso de proveniência no topo do arquivo gerado
html = html.replace('<!doctype html>',
  '<!doctype html>\n<!--\n  Versão de arquivo único, gerada por `node build.js`.\n' +
  '  NÃO EDITE ESTE ARQUIVO: edite index.html, styles.css, viz.js, figures.js, labs.js\n' +
  '  ou script.js e rode o build novamente.\n-->');

const match = html.match(/<link rel="stylesheet" href="styles\.css">|<script src="(viz|figures|labs|script)\.js">/);
if (match) {
  throw new Error('sobrou referência a arquivo local no HTML gerado: ' + match[0]);
}

fs.writeFileSync(path.join(DIR, 'apresentacao.html'), html);
const kb = n => (n / 1024).toFixed(0) + ' KB';
console.log('apresentacao.html gerado  ·  ' + kb(Buffer.byteLength(html)) +
            '  (index ' + kb(Buffer.byteLength(read('index.html'))) + ' + css/js embutidos)');
