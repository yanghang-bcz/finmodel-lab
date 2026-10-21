// Mutate only an isolated copy: stale source must fail verification before serving.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),assert=require('node:assert/strict');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'finmodel-build-audit-'));
try{fs.mkdirSync(path.join(temp,'tools'));fs.cpSync('dist',path.join(temp,'dist'),{recursive:true});fs.copyFileSync('tools/build-workbench.cjs',path.join(temp,'tools/build-workbench.cjs'));
const run=(...args)=>cp.spawnSync(process.execPath,[path.join(temp,'tools/build-workbench.cjs'),...args],{encoding:'utf8'});
assert.equal(run('--check').status,0,'checked-in deployment agrees');
fs.appendFileSync(path.join(temp,'dist/chart-interaction.js'),'\n/* isolated stale-source probe */\n');
const stale=run('--check');assert.equal(stale.status,1);assert(stale.stderr.includes('STALE deployment artifacts'));
assert.equal(run().status,0,'rebuild succeeds');assert.equal(run('--check').status,0,'rebuild agrees');
const manifest=JSON.parse(fs.readFileSync(path.join(temp,'dist/build-manifest.json')));for(const file of ['index.html','experiments.html']){const html=fs.readFileSync(path.join(temp,'dist',file),'utf8');assert(html.includes(manifest.buildId));assert(html.includes('build-info.js?v='));}
console.log('PASS deployed integrity; stale source rejected; rebuilt HTML/bundles/version match; live files untouched');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
