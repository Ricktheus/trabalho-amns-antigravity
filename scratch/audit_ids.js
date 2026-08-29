const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const html = fs.readFileSync(path.join(DIR, '..', 'index.html'), 'utf8');

// Parse all IDs in index.html
const allHtmlIds = new Set([...html.matchAll(/(?:^|\s)id=["']([^"']+)["']/g)].map(m => m[1]));
console.log(`Found ${allHtmlIds.size} unique IDs in index.html`);

// Check duplicate IDs properly
const allIdsList = [...html.matchAll(/(?:^|\s)id=["']([^"']+)["']/g)].map(m => m[1]);
const counts = {};
allIdsList.forEach(id => counts[id] = (counts[id] || 0) + 1);
const dups = Object.entries(counts).filter(([k, v]) => v > 1);
console.log('Duplicate IDs in index.html:', dups);

// Check all getElementById in JS
const jsFiles = ['viz.js', 'figures.js', 'labs.js', 'script.js'];
jsFiles.forEach(file => {
  const code = fs.readFileSync(path.join(DIR, '..', file), 'utf8');
  const getById = [...code.matchAll(/getElementById\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g)].map(m => m[1]);
  const missing = getById.filter(id => !allHtmlIds.has(id));
  console.log(`[${file}] getElementById (${getById.length} calls): missing in HTML ->`, missing);
});

// Check all querySelector(#id) in JS
jsFiles.forEach(file => {
  const code = fs.readFileSync(path.join(DIR, '..', file), 'utf8');
  const qsIds = [...code.matchAll(/querySelector(?:All)?\s*\(\s*["'`]#([a-zA-Z0-9_-]+)["'`]\s*\)/g)].map(m => m[1]);
  const missing = qsIds.filter(id => !allHtmlIds.has(id));
  console.log(`[${file}] querySelector(#id) (${qsIds.length} calls): missing in HTML ->`, missing);
});

// Check qc-card, qc-btn, qc-ans
const qcCards = [...html.matchAll(/class=["'][^"']*qc-card[^"']*["']/g)].length;
const qcBtns = [...html.matchAll(/class=["'][^"']*qc-btn[^"']*["']/g)].length;
const qcAns = [...html.matchAll(/class=["'][^"']*qc-ans[^"']*["']/g)].length;
console.log(`Quick-checks: ${qcCards} qc-cards, ${qcBtns} qc-btns, ${qcAns} qc-ans`);

// Check micro-steps
const microSteps = [...html.matchAll(/class=["'][^"']*micro-step[^"']*["']/g)].length;
console.log(`Micro-steps: ${microSteps} found`);
