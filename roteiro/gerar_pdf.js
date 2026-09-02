/* Imprime roteiro/roteiro.html em roteiro-apresentacao.pdf (A4, numeração no rodapé). */
const { chromium } = require('playwright');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.join(__dirname, 'roteiro.html'), { waitUntil: 'load' });
  await page.pdf({
    path: path.join(RAIZ, 'roteiro-apresentacao.pdf'),
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate:
      '<div style="width:100%;font-size:8px;font-family:Arial,sans-serif;color:#9aa0a8;' +
      'padding:0 15mm;display:flex;justify-content:space-between">' +
      '<span>Roteiro de fala · Variáveis Latentes Discretas</span>' +
      '<span class="pageNumber"></span></div>',
    margin: { top: '17mm', right: '15mm', bottom: '15mm', left: '15mm' },
  });
  await browser.close();
  console.log('roteiro-apresentacao.pdf gerado');
})();
