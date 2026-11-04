/* One-layer LSTM, full backpropagation through each input window, linear readout. */
(function(root, factory) {
  const api = factory(typeof module === 'object' ? require('./timeseries-math') : root.TimeSeriesMath);
  if (typeof module === 'object') module.exports = api;
  else root.TimeSeriesLSTM = api;
})(this, M => {
  'use strict';
  const config = Object.freeze({window:12, hidden:8, epochs:40, patience:6, batch:32, rate:.008, seed:731});
  function forward(weights, input, H) {
    const D = input[0].length, stride = D+H+1, offset = 4*H*stride;
    let h = Array(H).fill(0), c = h.slice();
    const states = [];
    const sigmoid = z => 1/(1+Math.exp(-z));
    for (const x of input) {
      const z = [1,...x,...h], gates = Array(4*H);
      for (let i=0; i<gates.length; i++) {
        let v = 0;
        for (let j=0; j<stride; j++) v += weights[i*stride+j]*z[j];
        gates[i] = i>=3*H ? Math.tanh(v) : sigmoid(v);
      }
      const previous = c;
      c = c.map((v,i) => gates[H+i]*v+gates[i]*gates[3*H+i]);
      h = c.map((v,i) => gates[2*H+i]*Math.tanh(v));
      states.push({z,gates,previous,c});
    }
    return {value:h.reduce((s,v,i)=>s+v*weights[offset+i+1],weights[offset]),h,states};
  }
  function gradient(weights, input, H, actual, result = new Float64Array(weights.length)) {
    const D = input[0].length, stride = D+H+1, offset = 4*H*stride;
    const {value,h,states} = forward(weights,input,H);
    const error = value-actual;
    result[offset] += error;
    let dh = h.map((v,i) => {
      result[offset+i+1] += error*v;
      return error*weights[offset+i+1];
    });
    let dc = Array(H).fill(0);
    for (let t=states.length-1; t>=0; t--) {
      const {z,gates:g,previous,c} = states[t], dg = Array(4*H), next = Array(H).fill(0);
      for (let i=0; i<H; i++) {
        const f=g[H+i], o=g[2*H+i], a=g[3*H+i], u=g[i], tc=Math.tanh(c[i]);
        const memory = dc[i]+dh[i]*o*(1-tc*tc);
        dg[i] = memory*a*u*(1-u);
        dg[H+i] = memory*previous[i]*f*(1-f);
        dg[2*H+i] = dh[i]*tc*o*(1-o);
        dg[3*H+i] = memory*u*(1-a*a);
        dc[i] = memory*f;
      }
      for (let i=0; i<dg.length; i++) {
        for (let j=0; j<stride; j++) result[i*stride+j] += dg[i]*z[j];
        for (let j=0; j<H; j++) next[j] += weights[i*stride+1+D+j]*dg[i];
      }
      dh = next;
    }
    return {loss:error*error/2, gradient:result};
  }
  function training(rows, {target, features, nt, nv, ...settings}, progress = () => {}) {
    const opt = {...config,...settings};
    const {hidden:H, window:W, epochs, patience, batch, rate, seed} = opt;
    if (!Number.isInteger(W) || W < 4 || W > 32 || !Number.isInteger(H) || H < 4 || H > 16 ||
        !Number.isInteger(epochs) || epochs < 1 || epochs > 80 || !features.length ||
        new Set(features).size !== features.length || features.some(j => !rows[0].hasOwnProperty(j)) ||
        nt-W < 20 || nv-nt < 5) throw Error('LSTM 需要有效输入列及至少 20 个训练窗口、5 个验证窗口。');
    const columns = [...features,target];
    const values = columns.map(j => rows.slice(0,nt).map(r=>r[j]));
    const center = values.map(a => a.reduce((s,v)=>s+v,0)/nt);
    const scale = values.map((a,j)=>Math.sqrt(a.reduce((s,v)=>s+(v-center[j])**2,0)/nt));
    if (scale.some(s=>!Number.isFinite(s)||s<=1e-12)) throw Error('LSTM 训练列方差不足，无法标准化。');
    const D = features.length, stride = D+H+1, offset = 4*H*stride, random = M.random(seed);
    const input = rows.slice(0,nv).map(r=>features.map((j,i)=>(r[j]-center[i])/scale[i]));
    const y = rows.slice(0,nv).map(r=>(r[target]-center[D])/scale[D]);
    const w = Float64Array.from({length:offset+H+1}, (_, i) =>
      i < offset && i%stride===0 ? +(i/stride>=H && i/stride<2*H) : (2*random()-1)*Math.sqrt(6/(D+2*H)));
    const m = new Float64Array(w.length), v = new Float64Array(w.length), curve = [];
    const ids = Array.from({length:nt-W}, (_,i)=>W+i);
    const error = (start,end) => {
      let mse = 0;
      for (let t=start; t<end; t++) mse += (forward(w,input.slice(t-W,t),H).value-y[t])**2;
      return mse/(end-start);
    };
    let best, bestLoss = Infinity, bestEpoch = 0, step = 0;
    for (let epoch=1; epoch<=epochs; epoch++) {
      // Shuffle only windows with targets strictly inside the training period.
      for (let i=ids.length-1; i>0; i--) {
        const j=Math.floor(random()*(i+1));
        [ids[i],ids[j]]=[ids[j],ids[i]];
      }
      for (let start=0; start<ids.length; start+=batch) {
        const g = new Float64Array(w.length), end=Math.min(start+batch,ids.length);
        for (let i=start; i<end; i++) {
          const t=ids[i];
          gradient(w,input.slice(t-W,t),H,y[t],g);
        }
        step++;
        for (let i=0; i<w.length; i++) {
          const value=Math.max(-1,Math.min(1,g[i]/(end-start)));
          m[i]=.9*m[i]+.1*value;
          v[i]=.999*v[i]+.001*value*value;
          w[i]-=rate*(m[i]/(1-.9**step))/(Math.sqrt(v[i]/(1-.999**step))+1e-8);
        }
      }
      const validation=error(nt,nv), train=error(W,nt);
      if (!Number.isFinite(validation) || !Number.isFinite(train)) throw Error('LSTM 优化产生非有限损失。');
      const entry={epoch,train,validation};
      curve.push(entry); progress(entry);
      if (validation < bestLoss-1e-6) { best=Array.from(w); bestLoss=validation; bestEpoch=epoch; }
      if (epoch-bestEpoch>=patience) break;
    }
    return {version:'exp05-lstm-1', optimizer:'Adam', target, features, nt, nv, ...opt, bestEpoch, curve, center, scale, weights:best};
  }
  function predict(rows, t, model) {
    const {window:W,hidden:H,features,center,scale,weights} = model, D=features.length;
    if (t<W || t>rows.length) throw Error('LSTM 输入窗口超界。');
    const input=rows.slice(t-W,t).map(r=>features.map((j,i)=>(r[j]-center[i])/scale[i]));
    return center[D]+scale[D]*forward(weights,input,H).value;
  }
  return {config, forward, gradient, training, predict};
});
