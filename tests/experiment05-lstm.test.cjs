/* Independent regression checks for the hand-written LSTM and its data boundary. */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const vm = require('node:vm');
const M = require('../dist/timeseries-math');
const L = require('../dist/timeseries-lstm');

const input = [[.4,-.9],[.2,.7],[-.4,.2],[.5,.4]];
const D = 2, H = 4, target = -.37;
const weights = Array.from({length:4*H*(D+H+1)+H+1}, (_,i)=>.2*Math.sin(i+1));
const numerical = w => (L.forward(w,input,H).value-target)**2/2;
const analytic = L.gradient(weights,input,H,target).gradient;
for (let i=0; i<weights.length; i++) {
  const a=weights.slice(), b=weights.slice(), epsilon=1e-5;
  a[i]+=epsilon; b[i]-=epsilon;
  assert.ok(Math.abs((numerical(a)-numerical(b))/(2*epsilon)-analytic[i])<2e-9, 'BPTT coordinate '+i);
}
assert.equal(L.forward(Array(weights.length).fill(0),input,H).value,0);

const {rows} = M.transform(M.generate(),'log');
const {nt,nv} = M.split(rows.length);
const opt={target:0,features:[0,1],nt,nv};
const model=L.training(rows.slice(0,nv),opt);
const poisoned=rows.map((r,i)=>i<nv?r:r.map(x=>1e7+x));
assert.deepEqual(L.training(poisoned,opt),model,'test values must not affect training');
assert.ok(model.curve.length<L.config.epochs,'default schedule early stops');
assert.equal(model.curve.length-model.bestEpoch,L.config.patience);
assert.ok(model.curve[model.bestEpoch-1].validation<model.curve[0].validation);
assert.ok(model.curve.at(-1).train<model.curve[0].train);
assert.throws(()=>L.training(rows,{...opt,features:[]}),/LSTM/);
assert.throws(()=>L.training(rows.map(r=>[0,r[1]]),opt),/标准化/);
assert.throws(()=>L.predict(rows,3,model),/超界/);

const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(require.resolve('../dist/timeseries-weights'),'utf8'),ctx);
const checkpoint=JSON.parse(JSON.stringify(ctx.window.TimeSeriesWeights));
const {trainingHash,...frozen}=checkpoint;
assert.equal(trainingHash,crypto.createHash('sha256').update(JSON.stringify(rows.slice(0,nv))).digest('hex'));
assert.deepEqual(model,frozen);
for (let t=nv; t<rows.length; t++) {
  assert.equal(L.predict(rows,t,model),L.predict(rows.slice(0,t),t,model),'target and later rows excluded');
  assert.equal(L.predict(rows,t,checkpoint),L.predict(rows,t,model));
}

const options={p:1,q:1,armaMode:'manual',armaIC:'BIC',varMode:'manual',varLag:1,varIC:'BIC',train:.7,valid:.15};
const comparison=M.compare(rows,0,[0,1],options);
const futureChanged=rows.map((r,i)=>i<=nv?r:r.map(x=>.2+x));
const altered=M.compare(futureChanged,0,[0,1],options);
for (const name of ['Naive','ARMA','VAR']) {
  const {prediction,rmse,mae}=comparison.models[name];
  const errors=prediction.map((v,i)=>v-comparison.actual[i]);
  assert.equal(prediction.length,rows.length-nv);
  assert.equal(prediction[0],altered.models[name].prediction[0]);
  assert.equal(rmse,Math.sqrt(errors.reduce((s,v)=>s+v**2,0)/errors.length));
  assert.equal(mae,errors.reduce((s,v)=>s+Math.abs(v),0)/errors.length);
}
assert.deepEqual(M.compare(rows.map(r=>[r[0]]),0,[0],options).models.ARMA,comparison.models.ARMA);
assert.ok(M.compare(rows.map(r=>[r[0]]),0,[0],options).models.VAR.error);
console.log('PASS LSTM BPTT, early stopping, default checkpoint, strict test isolation and one-step comparison');
