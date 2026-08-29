const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const html = fs.readFileSync(path.join(DIR, '..', 'index.html'), 'utf8');
const scriptCode = fs.readFileSync(path.join(DIR, '..', 'script.js'), 'utf8');
const labsCode = fs.readFileSync(path.join(DIR, '..', 'labs.js'), 'utf8');

const dataOutInHtml = new Set([...html.matchAll(/data-out=["']([^"']+)["']/g)].map(m => m[1]));
const dataOutInScript = new Set([...scriptCode.matchAll(/data-out=["']([^"']+)["']/g)].map(m => m[1]));
const dataOutInLabs = new Set([...labsCode.matchAll(/data-out=["']([^"']+)["']/g)].map(m => m[1]));

console.log('data-out in HTML:', [...dataOutInHtml]);
console.log('data-out in script.js:', [...dataOutInScript]);
console.log('data-out in labs.js:', [...dataOutInLabs]);

const allHandled = new Set([...dataOutInScript, ...dataOutInLabs]);
const inHtmlNotHandled = [...dataOutInHtml].filter(d => !allHandled.has(d));
console.log('In HTML but NOT handled in script.js/labs.js:', inHtmlNotHandled);

const inScriptNotHtml = [...dataOutInScript].filter(d => !dataOutInHtml.has(d));
console.log('In script.js but NOT in HTML:', inScriptNotHtml);
