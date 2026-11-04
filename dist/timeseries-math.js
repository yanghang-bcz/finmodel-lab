/* Experiment 05: shared samples, finite-sample tests and conditional forecasting. */
(function(root, factory) {
  const api = factory(typeof module === 'object' ? require('./reg-math') : root.RegMath);
  if (typeof module === 'object') module.exports = api;
  else root.TimeSeriesMath = api;
})(this, Reg => {
  'use strict';
  const defaults = Object.freeze({seed: 52027, n: 720, ar: .42, cross: .32, noise: .012});
  const sum = a => a.reduce((s, x) => s + x, 0);
  const mean = a => sum(a) / a.length;
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };
  function integer(x, lo, hi, label) {
    if (!Number.isInteger(x) || x < lo || x > hi) throw Error(label + '范围为 ' + lo + '–' + hi + ' 的整数。');
  }
  function random(seed) {
    return () => (seed = seed * 16807 % 2147483647) / 2147483647;
  }
  function generate({seed, n, ar, cross, noise} = defaults) {
    integer(seed, 1, 2147483646, '种子');
    integer(n, 120, 1600, '样本量');
    if (!(Math.abs(ar) <= .75 && Math.abs(cross) <= .75 && noise >= .001 && noise <= .05)) {
      throw Error('要求 |自回归|、|跨变量系数| ≤ 0.75，扰动标准差在 0.001–0.05 之间。');
    }
    const uniform = random(seed);
    const normal = () => Math.sqrt(-2 * Math.log(uniform())) * Math.cos(2 * Math.PI * uniform());
    let market = 0, sector = 0, macro = 0;
    const prices = [100, 100, 100], rows = [], dates = [];
    for (let i = -100; i <= n; i++) {
      const next = [.0003 + ar * market, .0003 + .24 * sector + cross * market, .0002 + .55 * macro + .14 * sector];
      [market, sector, macro] = next.map(x => x + noise * normal());
      if (i < 0) continue;
      [market, sector, macro].forEach((r, j) => { prices[j] *= Math.exp(r); });
      rows.push(prices.slice());
      dates.push('t=' + i);
    }
    return {rows, dates, names: ['市场', '行业', '金融因子'], kind: 'price', frequency: '模拟期', synthetic: true, warnings: [], lost: 0};
  }
  function validate(y, minimum = 30) {
    if (y.length < minimum || y.some(x => !Number.isFinite(x))) throw Error('至少需要 ' + minimum + ' 期有效观测。');
    const scale = sd(y);
    if (!Number.isFinite(scale) || scale <= 1e-12 * Math.max(1, Math.abs(mean(y)))) throw Error('常数、近似常数或尺度异常，无法可靠估计。');
  }
  function importData(text, {date, columns, kind, unit, frequency, missing, acceptGaps}) {
    if (text.length > 2e6) throw Error('CSV 限制为 2 MB。');
    const table = Reg.csvTable(text);
    const ids = [date, ...columns].map(name => table.names.indexOf(name));
    if (!columns.length || columns.length > 3 || ids.includes(-1) || new Set(ids).size !== ids.length) {
      throw Error('请明确选择日期和 1–3 个不同的数值列。');
    }
    if (!['price', 'simple', 'log', 'numeric'].includes(kind) || !['decimal', 'percent'].includes(unit) ||
        (unit === 'percent' && !['simple', 'log'].includes(kind))) throw Error('百分数转换仅适用于收益率列。');
    if (!['daily', 'weekly', 'monthly', 'annual', 'observed'].includes(frequency)) throw Error('请选择频率。');
    integer(table.rows.length, 40, 2000, 'CSV 行数');
    const seen = new Set(), warnings = [];
    let lost = 0, outOfOrder = false, previous = '';
    const parsed = [];
    table.rows.forEach((r, i) => {
      const day = r[ids[0]].trim(), instant = Date.parse(day);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(instant) ||
          new Date(instant).toISOString().slice(0, 10) !== day) throw Error('第 ' + (i + 2) + ' 行日期无效，须用 YYYY-MM-DD。');
      if (seen.has(day)) throw Error('重复日期 ' + day + '，请先核对。');
      seen.add(day);
      if (day < previous) outOfOrder = true;
      previous = day;
      const cells = ids.slice(1).map(j => r[j].trim());
      if (cells.some(x => /^(?:NA|N\/A|null)?$/i.test(x))) {
        if (missing !== 'drop') throw Error(day + ' 存在缺失值。可在检查对齐后明确选择删除整行。');
        lost++;
        return;
      }
      const values = cells.map(x => {
        if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(x)) throw Error(day + ' 存在非数值。');
        const v = Number(x) / (unit === 'percent' ? 100 : 1);
        if (!Number.isFinite(v) || (kind === 'price' && v <= 0) || (kind === 'simple' && v < -1)) {
          throw Error(day + ' 数值越界。请核对单位、正价格及简单收益率下限。');
        }
        return v;
      });
      parsed.push({day, values});
    });
    parsed.sort((a, b) => a.day.localeCompare(b.day));
    if (outOfOrder) warnings.push('整行已按日期排序，保留各列同期配对。');
    if (lost) warnings.push('已按选择删除 ' + lost + ' 个缺失日期的整行。');
    const periods = parsed.map(({day}) => ({
      daily: Date.parse(day) / 86400000,
      weekly: Math.floor((Date.parse(day) / 86400000 + 3) / 7),
      monthly: Number(day.slice(0, 4)) * 12 + Number(day.slice(5, 7)),
      annual: Number(day.slice(0, 4))
    })[frequency]);
    if (frequency !== 'observed' && new Set(periods).size !== periods.length) throw Error('同一声明周期有多行，请核对频率。');
    const gaps = frequency === 'observed' || periods.some((x, i) => i && x - periods[i - 1] !== 1);
    if (gaps && !acceptGaps) throw Error('日期间隔不规则或存在缺期。核对后可确认按相邻观测建模。');
    if (gaps) warnings.push('按相邻观测计期，时间间隔可能不同。跨缺期的价格收益覆盖整个间隔。');
    const rows = parsed.map(x => x.values);
    for (let j = 0; j < columns.length; j++) {
      const y = rows.map(r => r[j]);
      validate(y, 40);
      const m = mean(y), s = sd(y);
      if (y.some(x => Math.abs(x - m) > 8 * s || (['simple', 'log'].includes(kind) && Math.abs(x) > .5))) {
        warnings.push(columns[j] + ' 有极端观测，请核对单位和原数据。观测保留。');
      }
    }
    return {rows, dates: parsed.map(x => x.day), names: columns, kind, frequency, warnings, lost};
  }
  function transform(data, form) {
    if (data.kind !== 'price' || form === 'price') return {...data, form: data.kind};
    if (!['simple', 'log'].includes(form)) throw Error('收益率口径无效。');
    const rows = data.rows.slice(1).map((r, i) => r.map((p, j) => {
      const prev = data.rows[i][j];
      return form === 'simple' ? p / prev - 1 : Math.log(p) - Math.log(prev);
    }));
    return {...data, form, rows, dates: data.dates.slice(1)};
  }

  function regression(X, y) {
    const scales = X[0].map((_, j) => Math.sqrt(mean(X.map(r => r[j] ** 2))));
    if (scales.some(s => !Number.isFinite(s) || s <= 0)) throw Error('设计矩阵退化。');
    const fit = Reg.qr(X.map(r => r.map((v, j) => v / scales[j])), y);
    if (fit.rank !== scales.length || y.length <= fit.rank) throw Error('共线或自由度不足。');
    const coef = fit.coef.map((v, j) => v / scales[j]);
    const fitted = X.map(r => dot(r, coef)), residual = y.map((v, i) => v - fitted[i]);
    const rss = dot(residual, residual), df = y.length - fit.rank;
    // Diagonal of (X'X)^-1 via R^-1 and the QR pivot permutation.
    const inverse = scales.map((_, j) => fit.back(scales.map((_, i) => +(i === j))));
    const se = scales.map((s, j) => {
      const k = fit.perm.indexOf(j);
      return Math.sqrt(rss / df * sum(inverse.map(c => c[k] ** 2))) / s;
    });
    return {coef, residual, fitted, rss, df, se};
  }
  function correlogram(y, lag = 24) {
    validate(y, 10);
    lag = Math.min(lag, y.length - 1);
    const m = mean(y), a = y.map(v => v - m), den = dot(a, a);
    const acf = Array.from({length: lag + 1}, (_, k) => dot(a.slice(k), a) / den);
    const pacf = [1];
    let phi = [], variance = 1;
    for (let k = 1; k <= lag; k++) {
      const v = (acf[k] - dot(phi, acf.slice(1, k).reverse())) / variance;
      phi = phi.map((x, i) => x - v * phi[k - 2 - i]).concat(v);
      variance *= 1 - v * v;
      pacf.push(v);
    }
    return {acf, pacf, band: 1.96 / Math.sqrt(y.length)};
  }
  // urca::ur.df tau critical values, indexed by length of the first difference.
  const adfCritical = {
    none: [-1.95, -1.95, -1.95, -1.95, -1.95],
    drift: [-2.93, -2.89, -2.88, -2.87, -2.86],
    trend: [-3.50, -3.45, -3.43, -3.42, -3.41]
  };
  function stationarity(y, type, lag, trend) {
    validate(y);
    integer(lag, 0, 12, 'ADF 滞后');
    if (!Object.hasOwn(adfCritical, type)) throw Error('ADF 设定无效。');
    const d = y.slice(1).map((v, i) => v - y[i]), Y = d.slice(lag);
    const X = Y.map((_, i) => {
      const t = i + lag;
      return [y[t], ...(type === 'none' ? [] : [1]), ...(type === 'trend' ? [t + 1] : []),
        ...Array.from({length: lag}, (_, j) => d[t - j - 1])];
    });
    const fit = regression(X, Y);
    if (!(fit.se[0] > 0)) throw Error('ADF 回归残差方差退化。');
    const tau = fit.coef[0] / fit.se[0];
    const critical = adfCritical[type][[50, 100, 250, 500].filter(n => d.length >= n).length];
    const n = y.length, bw = Math.floor(4 * (n / 100) ** .25);
    const e = regression(y.map((_, i) => trend ? [1, i + 1] : [1]), y).residual;
    let lrv = dot(e, e) / n, partial = 0, numerator = 0;
    for (let k = 1; k <= bw; k++) lrv += 2 * (1 - k / (bw + 1)) * dot(e.slice(k), e) / n;
    for (const v of e) { partial += v; numerator += partial ** 2; }
    if (!(lrv > dot(y, y) / n * Number.EPSILON ** 2)) throw Error('KPSS 长期方差退化。');
    const kpss = numerator / n ** 2 / lrv, kCritical = trend ? .146 : .463;
    return {tau, critical, kpss, kCritical, bw, adfReject: tau < critical, kpssReject: kpss > kCritical};
  }

  function reflection(raw) {
    let a = [];
    for (const z of raw) {
      const k = .995 * Math.tanh(z);
      a = a.map((v, j) => v - k * a[a.length - 1 - j]).concat(k);
    }
    return a;
  }
  function residuals(y, mu, ar, ma, burn) {
    const e = Array(y.length).fill(0);
    for (let t = burn; t < y.length; t++) {
      let v = y[t] - mu;
      for (let j = 0; j < ar.length; j++) v -= ar[j] * (y[t - j - 1] - mu);
      for (let j = 0; j < ma.length && t - j - 1 >= burn; j++) v -= ma[j] * e[t - j - 1];
      e[t] = v;
    }
    return e;
  }
  function optimize(fn, start) {
    let x = start.slice(), f = fn(x), H = x.map((_, i) => x.map((__, j) => +(i === j)));
    const gradient = v => v.map((z, i) => {
      const d = 1e-5 * Math.max(1, Math.abs(z)), a = v.slice(), b = v.slice();
      a[i] += d; b[i] -= d;
      return (fn(a) - fn(b)) / (2 * d);
    });
    let g = gradient(x);
    for (let it = 0; it < 220; it++) {
      if (Math.max(...g.map(Math.abs)) < 2e-7) return {x, f, it};
      let d = H.map(r => -dot(r, g)), slope = dot(d, g);
      if (!(slope < 0)) { d = g.map(v => -v); slope = -dot(g, g); }
      let step = 1, next, value;
      while (step > 1e-11) {
        next = x.map((v, j) => v + step * d[j]);
        value = fn(next);
        if (Number.isFinite(value) && value <= f + 1e-4 * step * slope) break;
        step /= 2;
      }
      if (step <= 1e-11) return null;
      const ng = gradient(next), s = next.map((v, j) => v - x[j]), y = ng.map((v, j) => v - g[j]);
      const sy = dot(s, y), Hy = H.map(r => dot(r, y));
      if (sy > 1e-16) {
        const factor = (1 + dot(y, Hy) / sy) / sy;
        H = H.map((r, i) => r.map((v, j) => v + factor * s[i] * s[j] - (Hy[i] * s[j] + s[i] * Hy[j]) / sy));
      }
      x = next; g = ng; f = value;
    }
    return null;
  }
  function arma(y, p, q, burn = 5) {
    integer(p, 0, 5, 'AR 阶数'); integer(q, 0, 5, 'MA 阶数');
    validate(y, Math.max(30, burn + 5 * (p + q + 2)));
    const m = mean(y), s = sd(y), z = y.map(v => (v - m) / s), n = y.length - burn;
    function profile(x) {
      const ar = reflection(x.slice(0, p)), ma = reflection(x.slice(p)).map(v => -v);
      const e = residuals(z, 0, ar, ma, burn);
      // e(mu) = e(0) - mu * sensitivity, so the conditional mean has an exact least-squares solution.
      const sensitivity = Array(z.length).fill(0);
      const constant = 1 - sum(ar);
      for (let t = burn; t < z.length; t++) {
        let v = constant;
        for (let j = 0; j < q && t - j - 1 >= burn; j++) v -= ma[j] * sensitivity[t - j - 1];
        sensitivity[t] = v;
      }
      const center = dot(e,sensitivity) / dot(sensitivity,sensitivity);
      const f = sum(e.map((v,i) => (v - center * sensitivity[i]) ** 2)) / n;
      return {center, ar, ma, f};
    }
    const start = Array(p + q).fill(0);
    const second = start.map((_, i) => i === 0 ? .4 : 0);
    let attempts;
    if (p === 1 && q === 0) {
      // With no MA recursion this is the bounded intercept-and-slope least-squares solution.
      const lagged = z.slice(burn-1,-1), response = z.slice(burn);
      const a = mean(lagged), b = mean(response), centered = lagged.map(v=>v-a);
      const slope = dot(centered,response.map(v=>v-b)) / dot(centered,centered);
      const x = [Math.atanh(Math.max(-1+1e-12,Math.min(1-1e-12,slope/.995)))];
      attempts = [{x,f:profile(x).f,it:0}];
    } else {
      attempts = start.length
        ? [start, second].map(x => optimize(v => profile(v).f, x)).filter(Boolean).sort((a,b) => a.f-b.f)
        : [{x:start, f:profile(start).f, it:0}];
    }
    if (!attempts.length || !Number.isFinite(attempts[0].f) || attempts[0].f <= 1e-14) {
      throw Error('ARMA 未收敛或创新方差退化。可降低阶数。');
    }
    const {x, f, it} = attempts[0], {center, ar, ma} = profile(x);
    const mu = m + s * center, sigma2 = f * s ** 2, logLik = -n / 2 * (Math.log(2 * Math.PI * sigma2) + 1);
    const k = p + q + 2;
    return {p, q, burn, mu, ar, ma, sigma2, logLik, it, boundary: x.some(v => Math.abs(v) > 3),
      residual: residuals(y, mu, ar, ma, burn), AIC: -2 * logLik + 2 * k,
      AICc: -2 * logLik + 2 * k + 2 * k * (k + 1) / (n - k - 1), BIC: -2 * logLik + Math.log(n) * k};
  }
  function selectARMA(y, options, grid) {
    const {p, q, armaMode, armaIC} = options;
    if (!grid && armaMode === 'manual') return {fit: arma(y, p, q), candidates: []};
    const candidates = [];
    let best = null, manual = null;
    for (let i = 0; i <= 3; i++) for (let j = 0; j <= 3; j++) {
      try {
        const f = arma(y, i, j);
        const {AIC, AICc, BIC} = f;
        candidates.push({p: i, q: j, AIC, AICc, BIC});
        if (!best || f[armaIC] < best[armaIC]) best = f;
        if (i === p && j === q) manual = f;
      } catch (e) { candidates.push({p: i, q: j, error: e.message}); }
    }
    const fit = armaMode === 'auto' ? best : manual || arma(y, p, q);
    if (!fit) throw Error('没有有效的 ARMA 候选模型。');
    return {fit, candidates};
  }
  function armaNext(y, e, t, fit) {
    let v = fit.mu;
    for (let j = 0; j < fit.ar.length; j++) v += fit.ar[j] * (y[t - j - 1] - fit.mu);
    for (let j = 0; j < fit.ma.length; j++) v += fit.ma[j] * e[t - j - 1];
    return v;
  }
  function forecastARMA(y, fit, horizon) {
    const history = y.slice(), e = fit.residual.slice(), psi = [1];
    let variance = 0;
    return Array.from({length: horizon}, (_, i) => {
      const value = armaNext(history, e, history.length, fit);
      history.push(value); e.push(0);
      if (i) psi.push((fit.ma[i - 1] || 0) + sum(fit.ar.map((v, j) => v * (psi[i - j - 1] || 0))));
      variance += fit.sigma2 * psi[i] ** 2;
      const s = Math.sqrt(variance);
      return {value, lo80: value - 1.281551565545 * s, hi80: value + 1.281551565545 * s,
        lo95: value - 1.95996398454 * s, hi95: value + 1.95996398454 * s};
    });
  }
  function chiTail(stat, df) {
    const x = stat / 2;
    if (x === 0) return 1;
    let p = Math.exp(-x), a = 1;
    if (df % 2) {
      // Chi-square(1) survival: regularized gamma(1/2, x).
      const z = Math.sqrt(x), t = 1 / (1 + .3275911 * z);
      p = (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x);
      a = .5;
    }
    let term = a === .5 ? 2 * Math.sqrt(x / Math.PI) * Math.exp(-x) : x * Math.exp(-x);
    for (; a < df / 2; a++) { p += term; term *= x / (a + 1); }
    return Math.min(1, p);
  }
  function ljung(fit, lag) {
    const e = fit.residual.slice(fit.burn), df = lag - fit.p - fit.q;
    if (df <= 0 || lag >= e.length) return {df, p: null, Q: null};
    const {acf} = correlogram(e, lag), n = e.length;
    const Q = n * (n + 2) * sum(acf.slice(1).map((r, j) => r ** 2 / (n - j - 1)));
    return {df, Q, p: chiTail(Q, df)};
  }

  const varDesign = (rows, t, p) => [1, ...rows.slice(t - p, t).reverse().flat()];
  function logDet(cov) {
    const L = cov.map(r => r.map(() => 0));
    for (let i = 0; i < cov.length; i++) for (let j = 0; j <= i; j++) {
      const v = cov[i][j] - dot(L[i].slice(0,j), L[j].slice(0,j));
      if (i === j && !(v > cov[i][i] * 1e-10 && v > 0)) throw Error('VAR 残差协方差退化。');
      L[i][j] = i === j ? Math.sqrt(v) : v / L[j][j];
    }
    return 2 * sum(L.map((r, j) => Math.log(r[j])));
  }
  function varFit(rows, p, start = p) {
    integer(p, 1, 5, 'VAR 滞后');
    const m = rows[0].length, n = rows.length - start, k = 1 + m * p;
    if (m < 2 || m > 3 || n < Math.max(30, 3 * k)) throw Error('VAR 需要 2–3 个变量及充足观测。');
    rows[0].forEach((_, j) => validate(rows.map(r => r[j])));
    const X = rows.slice(start).map((_, i) => varDesign(rows, i + start, p));
    const fits = rows[0].map((_, j) => regression(X, rows.slice(start).map(r => r[j])));
    const cov = fits.map(a => fits.map(b => dot(a.residual, b.residual) / n));
    const ld = logDet(cov);
    return {p, m, n, X, start, fits, cov, coef: fits.map(f => f.coef),
      AIC: ld + 2 * m * k / n, BIC: ld + Math.log(n) * m * k / n, HQ: ld + 2 * Math.log(Math.log(n)) * m * k / n};
  }
  function selectVAR(rows, {varMode, varLag, varIC}, grid = false) {
    if (!grid && varMode === 'manual') return {fit: varFit(rows, varLag), candidates: []};
    const candidates = [];
    let best;
    for (let p = 1; p <= 5; p++) {
      try {
        const {AIC, BIC, HQ} = varFit(rows, p, 5), c = {p, AIC, BIC, HQ};
        candidates.push(c);
        if (!best || c[varIC] < best[varIC]) best = c;
      } catch (e) { candidates.push({p, error: e.message}); }
    }
    if (varMode === 'auto' && !best) throw Error('没有有效的 VAR 候选模型。');
    return {fit: varFit(rows, varMode === 'auto' ? best.p : varLag), candidates};
  }
  function varNext(rows, t, fit) {
    const X = varDesign(rows, t, fit.p);
    return fit.coef.map(c => dot(X, c));
  }
  function forecastVAR(rows, fit, horizon) {
    const history = rows.slice();
    return Array.from({length: horizon}, () => {
      const next = varNext(history, history.length, fit);
      history.push(next);
      return next;
    });
  }
  function roots(fit) {
    const {coef, m, p} = fit, d = m * p;
    const A = coef.map(c => c.slice(1));
    for (let i = m; i < d; i++) A.push(Array.from({length:d}, (_, j) => +(j === i-m)));
    // Faddeev–LeVerrier characteristic coefficients of the companion matrix.
    const I = A.map((r,i) => r.map((_,j) => +(i === j)));
    let B = I, poly = [1];
    for (let k = 1; k <= d; k++) {
      const C = A.map(r => r.map((_, j) => r.reduce((s,v,i) => s+v*B[i][j],0)));
      const c = -sum(C.map((r,i) => r[i])) / k;
      poly.push(c);
      B = C.map((r,i) => r.map((v,j) => v + c*I[i][j]));
    }
    const zero = [];
    while (poly.length > 1 && poly.at(-1) === 0) { poly.pop(); zero.push({re:0, im:0, abs:0}); }
    const n = poly.length - 1, radius = Math.max(1, ...poly.slice(1).map((x,i) => 2 * Math.abs(x) ** (1/(i+1))));
    let z = Array.from({length:n}, (_, i) => [radius * Math.cos((i+.3)*2*Math.PI/n), radius * Math.sin((i+.3)*2*Math.PI/n)]);
    for (let step = 0; step < 350 && n; step++) {
      let delta = 0;
      z = z.map(([x,y], i) => {
        let u = 1, v = 0, a = 1, b = 0;
        for (const c of poly.slice(1)) [u,v] = [u*x-v*y+c,u*y+v*x];
        z.forEach(([r,s],j) => { if (i !== j) [a,b] = [a*(x-r)-b*(y-s), a*(y-s)+b*(x-r)]; });
        const den = a*a+b*b, dx = (u*a+v*b)/den, dy = (v*a-u*b)/den;
        delta = Math.max(delta, Math.hypot(dx,dy));
        return [x-dx,y-dy];
      });
      if (delta < 1e-9) return zero.concat(z.map(([re,im]) => ({re,im,abs:Math.hypot(re,im)})));
    }
    if (!n) return zero;
    throw Error('伴随矩阵特征根求解未收敛。');
  }
  function granger(rows, fit, from, to) {
    if (from === to || !fit.fits[to] || from < 0 || from >= fit.m) throw Error('请选择不同的检验方向。');
    const {p,m,X,start} = fit, full = fit.fits[to];
    const reduced = regression(X.map(r => r.filter((_, j) => j === 0 || (j-1) % m !== from)),
      rows.slice(start).map(r => r[to]));
    const F = Math.max(0, (reduced.rss - full.rss) / p) / (full.rss / full.df);
    return {F, df1:p, df2:full.df, p: fTail(F,p,full.df)};
  }
  function fTail(F, d1, d2) {
    const z = d2 / (d2 + d1 * F), a = d2/2, b = d1/2;
    // Lanczos log-gamma and modified Lentz incomplete beta continued fraction.
    function lg(x) {
      if (x < 1) return lg(x+1)-Math.log(x);
      const coefficients = [676.5203681218851,-1259.1392167224028,771.3234287776531,-176.6150291621406,
        12.507343278686905,-.13857109526572012,9.984369578019572e-6,1.5056327351493116e-7];
      const t = x+6.5;
      return .5*Math.log(2*Math.PI)+(x-.5)*Math.log(t)-t+Math.log(.9999999999998099+
        sum(coefficients.map((v,i) => v/(x+i))));
    }
    function beta(x, p, q) {
      if (x <= 0 || x >= 1) return x;
      if (x > (p+1)/(p+q+2)) return 1-beta(1-x,q,p);
      let c = 1, d = 1/(1-(p+q)*x/(p+1)), h = d;
      const safe = y => Math.abs(y)<1e-300 ? 1e-300 : y;
      for (let j=1; j<=300; j++) {
        const k = p+2*j;
        const coeffs = [j*(q-j)*x/((k-1)*k), -(p+j)*(p+q+j)*x/(k*(k+1))];
        let delta;
        for (const coeff of coeffs) {
          d = 1/safe(1+coeff*d); c = safe(1+coeff/c); delta = c*d; h *= delta;
        }
        if (Math.abs(delta-1)<3e-14) break;
      }
      return h/p*Math.exp(lg(p+q)-lg(p)-lg(q)+p*Math.log(x)+q*Math.log1p(-x));
    }
    return Math.max(0, Math.min(1, beta(z,a,b)));
  }
  function split(n, train = .7, valid = .15) {
    // Round away floating point error at exact percentage cut points.
    const nt = Math.floor(n*train+1e-10), nv = Math.floor(n*(train+valid)+1e-10);
    if (!(nt >= 30 && nv-nt >= 5 && n-nv >= 5)) throw Error('划分需至少 30 期训练、5 期验证、5 期测试。');
    return {nt, nv};
  }
  function compare(rows, target, vars, options) {
    const {nt,nv} = split(rows.length,options.train,options.valid);
    const y = rows.map(r => r[target]), mult = rows.map(r => vars.map(j => r[j]));
    const actual = y.slice(nv), models = {};
    function model(name, fn) {
      try {
        const prediction = fn();
        if (prediction.length !== actual.length || prediction.some(v => !Number.isFinite(v))) throw Error('预测日期未完整对齐。');
        models[name] = {...Reg.metrics(actual,prediction), prediction};
      } catch (e) { models[name] = {error:e.message}; }
    }
    let armaModel, varModel;
    model('Naive', () => y.slice(nv-1,-1));
    model('ARMA', () => {
      armaModel = selectARMA(y.slice(0,nt),options).fit;
      const e = residuals(y,armaModel.mu,armaModel.ar,armaModel.ma,armaModel.burn);
      return actual.map((_,i) => armaNext(y,e,nv+i,armaModel));
    });
    model('VAR', () => {
      const j = vars.indexOf(target);
      if (j < 0 || vars.length < 2) throw Error('VAR 比较需要含目标列的 2–3 个变量。');
      varModel = selectVAR(mult.slice(0,nt),options).fit;
      return actual.map((_,i) => varNext(mult,nv+i,varModel)[j]);
    });
    return {nt,nv,actual,models,armaModel,varModel};
  }
  return {defaults, random, generate, validate, importData, transform, correlogram, stationarity,
    arma, selectARMA, forecastARMA, ljung, varFit, selectVAR, forecastVAR, roots, granger, split, compare};
});
