const {spawnSync} = require('node:child_process');
const path = require('node:path');
const root = path.join(__dirname,'..');
for (const test of ['distribution','brand','shapes','reference','editor','dom']) {
  const result=spawnSync(process.execPath,[`tests/${test}.cjs`],{cwd:root,stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status||1);
}
console.log('PASS: all 6 test suites');
