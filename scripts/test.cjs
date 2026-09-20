const {spawnSync} = require('node:child_process');
const path = require('node:path');
const root = path.join(__dirname,'..');
const suites=['distribution','brand','shapes','reference','editor','dom','photo-upload','interaction','brand-transitions','palette','brand-ui','multi-photo'];
for (const test of suites) {
  const result=spawnSync(process.execPath,[`tests/${test}.cjs`],{cwd:root,stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status||1);
}
console.log(`PASS: all ${suites.length} test suites`);
