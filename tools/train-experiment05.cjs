/* Run from any directory with Node.js. Regenerates the default synthetic-data checkpoint. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Math05 = require('../dist/timeseries-math');
const LSTM = require('../dist/timeseries-lstm');
const {rows} = Math05.transform(Math05.generate(), 'log');
const {nt,nv} = Math05.split(rows.length);
const permitted = rows.slice(0,nv);
const model = LSTM.training(permitted, {target:0,features:[0,1],nt,nv});
const trainingHash = crypto.createHash('sha256').update(JSON.stringify(permitted)).digest('hex');
const result = '/* Reproduce with tools/train-experiment05.cjs. Only training/validation rows used. */\n' +
  'window.TimeSeriesWeights = ' + JSON.stringify({...model,trainingHash}) + ';\n';
const destination = path.join(__dirname,'../dist/timeseries-weights.js');
if (process.argv.includes('--check')) {
  if (fs.readFileSync(destination,'utf8') !== result) throw Error('Default LSTM checkpoint does not match the current data and training code.');
} else fs.writeFileSync(destination,result);
console.log(JSON.stringify({trainingHash,nt,validation:nv-nt,epochs:model.curve.length,bestEpoch:model.bestEpoch}));
