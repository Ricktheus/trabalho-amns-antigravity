const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const htmlPath = path.join(DIR, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

console.log('=== 1. ANALYZING HTML STRUCTURE ===');
// Match real HTML id attributes (ensuring word boundary \bid="...")
const idMatches = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]);
const idCounts = {};
idMatches.forEach(id => idCounts[id] = (idCounts[id] || 0) + 1);
const duplicates = Object.entries(idCounts).filter(([k, v]) => v > 1);
console.log('Duplicate IDs in index.html:', duplicates);

// Check slides
const slideMatches = [...html.matchAll(/<section[^>]*\bclass=["'][^"']*slide[^"']*["'][^>]*\bid=["']([^"']+)["']/g)].map(m => m[1]);
console.log(`Found ${slideMatches.length} slides:`);
for (let i = 1; i <= 73; i++) {
  const expectedId = 'slide-' + String(i).padStart(2, '0');
  if (!slideMatches.includes(expectedId)) {
    console.warn(`Missing expected slide: ${expectedId}`);
  }
}

// Check data-lab
const labsInHtml = [...html.matchAll(/data-lab=["']([^"']+)["']/g)].map(m => m[1]);
console.log(`Found ${labsInHtml.length} data-lab usages (${new Set(labsInHtml).size} unique)`);

// Check data-viz
const vizInHtml = [...html.matchAll(/data-viz=["']([^"']+)["']/g)].map(m => m[1]);
console.log(`Found ${vizInHtml.length} data-viz usages (${new Set(vizInHtml).size} unique):`, [...new Set(vizInHtml)]);

console.log('\n=== 2. CHECKING LABS (labs.js) ===');
const labsCode = fs.readFileSync(path.join(DIR, '..', 'labs.js'), 'utf8');
const registeredLabs = [...labsCode.matchAll(/register\s*\(\s*["']([^"']+)["']/g)].map(m => m[1]);
console.log(`Registered labs in labs.js (${registeredLabs.length}):`, registeredLabs);

const missingLabs = [...new Set(labsInHtml)].filter(l => !registeredLabs.includes(l));
console.log('data-lab in HTML but missing in labs.js:', missingLabs);

const unusedLabs = registeredLabs.filter(l => !labsInHtml.includes(l));
console.log('Registered in labs.js but not in HTML:', unusedLabs);

console.log('\n=== 3. CHECKING FIGURES (figures.js) ===');
const figuresCode = fs.readFileSync(path.join(DIR, '..', 'figures.js'), 'utf8');
const registeredViz = [...figuresCode.matchAll(/VIZ\[\s*["']([^"']+)["']\s*\]\s*=/g)].map(m => m[1]);
console.log(`Registered VIZ in figures.js (${registeredViz.length}):`, registeredViz);

const missingViz = [...new Set(vizInHtml)].filter(v => !registeredViz.includes(v));
console.log('data-viz in HTML but missing in figures.js:', missingViz);

const unusedViz = registeredViz.filter(v => !vizInHtml.includes(v));
console.log('Registered in figures.js but not in HTML:', unusedViz);

console.log('\n=== 4. CHECKING DATA-OUT IN HTML VS FILLCOMPUTED IN SCRIPT.JS ===');
const dataOuts = [...html.matchAll(/data-out=["']([^"']+)["']/g)].map(m => m[1]);
console.log('Found data-out in HTML:', [...new Set(dataOuts)]);

console.log('\n=== 5. CHECKING QUICK-CHECKS (Perguntas Rápidas) ===');
const qcContainers = [...html.matchAll(/class=["'][^"']*quick-check[^"']*["']/g)];
console.log(`Found ${qcContainers.length} quick-check containers in HTML`);
// Check if qc buttons have valid data-correct or choices
const qcChoices = [...html.matchAll(/<button[^>]*class=["'][^"']*qc-opt[^"']*["'][^>]*>/g)];
console.log(`Found ${qcChoices.length} qc-opt buttons`);

console.log('\n=== 6. CHECKING MODAL AND OVERLAYS ===');
['help-modal', 'glossary-modal', 'overview-modal', 'notes-window'].forEach(m => {
  console.log(`Checking ${m}:`, html.includes(`id="${m}"`) ? 'EXISTS' : 'MISSING');
});
