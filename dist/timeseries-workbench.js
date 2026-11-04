/* Experiment 05 uses the existing three-pane workbench and course navigation. */
(() => {
  'use strict';
  const M=TimeSeriesMath,L=TimeSeriesLSTM,R=TimeSeriesR,$=s=>document.querySelector(s),{esc}=WorkbenchUI;
  const defaults={form:'log',target:0,stationChart:'series',adf:'drift',adfLag:2,kpss:'level',
    p:1,q:1,armaMode:'manual',armaIC:'BIC',armaChart:'forecast',diagnostic:15,horizon:10,
    varLag:1,varMode:'manual',varIC:'BIC',varChart:'forecast',vars:[0,1],varPlot:'all',from:0,to:1,
    compareChart:'rmse',train:.7,valid:.15,features:[0,1],window:12,hidden:8,epochs:40};
  const views=[
    ['station','01 平稳性与数据','为什么金融价格与收益率的平稳性表现可能不同？'],
    ['arma','02 ARMA 建模','一个变量的历史信息能预测多少未来变化？'],
    ['var','03 VAR 与 Granger','其他变量的过去能否改善对目标的预测？'],
    ['compare','04 预测模型比较','LSTM 在同一段测试期比传统模型预测得更好吗？']
  ];
  const formulas={
    data:String.raw`R_t=P_t/P_{t-1}-1,\quad r_t=\log P_t-\log P_{t-1}`,
    adf:String.raw`\Delta y_t=a+bt+\gamma y_{t-1}+\sum_{j=1}^{k}\delta_j\Delta y_{t-j}+u_t`,
    kpss:String.raw`\mathrm{KPSS}=\frac{\sum_{t=1}^n S_t^2}{n^2\hat{\sigma}_{LR}^2}`,
    acf:String.raw`\hat{\rho}_k=\frac{\sum_{t=k+1}^n (y_t-\bar y)(y_{t-k}-\bar y)}{\sum_{t=1}^n (y_t-\bar y)^2}`,
    arma:String.raw`y_t-\mu=\sum_i\phi_i(y_{t-i}-\mu)+\varepsilon_t+\sum_j\theta_j\varepsilon_{t-j}`,
    order:String.raw`\mathrm{AIC}=-2\ell+2k,\quad \mathrm{BIC}=-2\ell+k\log n`,
    forecast:String.raw`\operatorname{Var}(e_{T+h})=\hat\sigma^2\sum_{i=0}^{h-1}\psi_i^2`,
    var:String.raw`y_t=c+\sum_{\ell=1}^p A_\ell y_{t-\ell}+u_t`,
    roots:String.raw`\max_j |\lambda_j(A_{\mathrm{comp}})|<1`,
    granger:String.raw`F=\frac{(RSS_R-RSS_U)/p}{RSS_U/(n-1-mp)}`,
    joint:String.raw`\hat y_{T+h|T}=c+\sum_{\ell=1}^{p} A_\ell\hat y_{T+h-\ell|T}`,
    split:String.raw`X_t=(y_{t-W},\ldots,y_{t-1})`,
    lstm:String.raw`c_t=f_t\odot c_{t-1}+i_t\odot g_t,\quad h_t=o_t\odot\tanh(c_t)`,
    scores:String.raw`\mathrm{RMSE}=\sqrt{\operatorname{mean}(e_t^2)},\quad \mathrm{MAE}=\operatorname{mean}(|e_t|)`
  };
  const lineNotes=[
    [/raw\[-1.*\/raw/,'简单收益使用相邻价格的比率减 1。'],
    [/Y <- log\(raw/,'对数收益等于相邻价格对数之差。'],
    [/tau <-/,'用滞后水平项的估计系数除以其标准误，再和单位根专用临界值比较。'],
    [/lrv <- lrv/,'Bartlett 权重随滞后阶数线性递减。'],
    [/partial <- pacf/,'PACF 度量移除中间滞后的线性关系。'],
    [/k <- \.995/,'反射系数由 tanh 映射至 (−.995, .995)。'],
    [/v <- v - ar/,'AR 系数乘以过去偏离模型均值的观测。'],
    [/v <- v - ma/,'回推创新时减去过去创新对条件均值的贡献。'],
    [/logLik <-/,'条件高斯对数似然由最优创新均方与有效样本数得到。'],
    [/se <- sqrt\(fit\$sigma2/,'预测误差方差累计各未来创新的响应平方。'],
    [/fit <- lm.fit\(X,Y/,'每个内生变量作为一个方程的响应，共享同一滞后设计。'],
    [/Sigma <- crossprod/,'残差叉积除以共同有效样本数，得到 ML 口径协方差。'],
    [/eigen\(A/,'对伴随矩阵直接求特征值，复根也参与取模。'],
    [/restricted <-/,'仅删除指定来源变量的全部滞后，保留其他解释变量与相同日期。'],
    [/nt <- floor/,'按时间切分。此索引前的观测用于拟合。'],
    [/model\$window,t-1L/,'窗口末期为目标前一期，隐藏状态和记忆在窗口开始置零。'],
    [/x <- \(Y\[k,/,'仅使用训练区保存的中心与尺度来转换输入。'],
    [/memory <- plogis/,'遗忘门保留旧记忆，输入门控制新增候选记忆。'],
    [/model\$center\[D\+1L\]/,'线性输出反标准化，恢复原目标单位。']
  ];
  const fmt=(v,d=5)=>Number.isFinite(v)?Number(v.toPrecision(d)).toString():'—';
  const metric=(label,value)=>'<div><span>'+esc(label)+'</span><b>'+esc(value)+'</b></div>';
  const table=(headers,rows)=>'<div class="ts-table"><table><thead><tr>'+headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join('')+
    '</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  const disclosure=(title,body)=>'<details><summary>'+esc(title)+'</summary>'+body+'</details>';
  const bool=x=>x?'拒绝':'未拒绝';
  function dataId({names,dates,rows,kind,frequency}) {
    const source=JSON.stringify([names,dates,rows,kind,frequency]);
    let hash=2166136261;
    for (let i=0;i<source.length;i++) hash=Math.imul(hash^source.charCodeAt(i),16777619);
    return (hash>>>0).toString(16).padStart(8,'0');
  }

  function mount() {
    CourseExperiments.mount('timeseries');
    const body=document.body;
    body.classList.add('ts-workbench');
    $('.learning').hidden=true;
    $('#assumptionDetails').hidden=true;
    let gen={...M.defaults},data=M.generate(gen),datasetId=dataId(data),opt=structuredClone(defaults),view='station';
    let importedTable=null,fileText='',fileVersion=0,worker=null,learned=null,attempted=null,runInfo='',progress=null;
    let cache=new Map(),built=null,activeBlock='adf',activeLine=null,codeMode='full',last=null,share=62;
    const seenComparisons=new Set();
    const tabs=document.createElement('nav');
    tabs.id='tsViews'; tabs.setAttribute('aria-label','实验05主视图');
    tabs.innerHTML=views.map(([k,n])=>'<button type="button" data-ts-view="'+k+'">'+n+'</button>').join('');
    $('.model-panel .panel-head').after(tabs);
    const question=document.createElement('p');
    question.id='tsQuestion'; tabs.after(question);
    const controls=document.createElement('div');
    controls.id='tsControls'; question.after(controls);
    $('#chartHost').innerHTML='<h3 id="tsPlotTitle"></h3><div id="tsPlot"></div><div id="tsTip" class="chart-tooltip" hidden></div>';
    const chart=TimeSeriesChart($('#tsPlot'),$('#tsTip'));
    const nav=document.createElement('nav');
    nav.id='tsCodeNav'; nav.setAttribute('aria-label','R 代码段'); $('.code-toolbar').after(nav);
    const dataBox=document.createElement('details');
    dataBox.id='tsData';
    dataBox.innerHTML='<summary>合成数据与本地 CSV</summary><p id="tsSource"></p>'+
      '<form id="tsGen"><div id="tsGenFields"></div><button>生成合成数据</button></form>'+
      '<form id="tsCSV"><p>宽表中每行是同一日期。请选择同频数值列。不同来源须先按实际可用日期对齐。文件留在当前浏览器。</p>'+
      '<label>CSV 文件<input id="tsFile" type="file" accept=".csv,text/csv"></label><div id="tsColumns"></div>'+
      '<label>列类型<select id="tsKind"><option value="price">价格</option><option value="simple">简单收益率</option>'+
      '<option value="log">对数收益率</option><option value="numeric">其他数值</option></select></label>'+
      '<label>单位<select id="tsUnit"><option value="decimal">小数 / 原值</option><option value="percent">百分数数值 ÷100</option></select></label>'+
      '<label>频率<select id="tsFrequency"><option value="daily">日历日</option><option value="weekly">自然周</option>'+
      '<option value="monthly">自然月</option><option value="annual">年度</option><option value="observed">相邻观测 / 交易期</option></select></label>'+
      '<label>缺失处理<select id="tsMissing"><option value="reject">拒绝缺失值</option><option value="drop">确认删除缺失整行</option></select></label>'+
      '<label class="ts-check"><input type="checkbox" id="tsAccept">确认间隔不规则时按相邻观测建模</label>'+
      '<button id="tsImport" disabled>确认导入</button></form><p id="tsDataError" role="status"></p>';
    $('#inputs').after(dataBox);
    const chartChoices={
      station:[['series','时间序列'],['acf','ACF'],['pacf','PACF']],
      arma:[['forecast','预测'],['criteria','定阶准则'],['residual','标准化残差'],['resacf','残差 ACF']],
      var:[['forecast','联合预测'],['criteria','定阶准则'],['granger','Granger 方向']],
      compare:[['rmse','RMSE'],['mae','MAE'],['prediction','实际与预测'],['errors','预测误差'],['loss','训练与验证损失']]
    };
    const option=(v,l,selected,raw=false)=>'<option value="'+esc(v)+'" '+(raw?'data-fml-skip ':'')+(String(v)===String(selected)?'selected':'')+'>'+esc(l)+'</option>';
    const select=(id,values,value)=>'<select id="ts-'+id+'" data-opt="'+id+'">'+values.map(([v,l])=>option(v,l,value,!data.synthetic && ['target','from','to','varPlot'].includes(id) && v!=='all')).join('')+'</select>';
    const field=(id,label,values)=>'<label>'+label+select(id,values,opt[id])+'</label>';
    const number=(id,label,value,min,max,step=1)=>'<label>'+label+'<input data-opt="'+id+'" id="ts-'+id+
      '" type="number" value="'+value+'" min="'+min+'" max="'+max+'" step="'+step+'" required></label>';
    const checks=(key,caption,ids)=>'<fieldset class="ts-choice"><legend>'+caption+
      '</legend><div class="ts-chips">'+data.names.map((name,i)=>
      '<label class="ts-chip"><input type="checkbox" data-list="'+key+'" value="'+i+'" '+(ids.includes(i)?'checked':'')+
      '><span'+(data.synthetic?'':' data-fml-skip')+'>'+esc(name)+'</span></label>').join('')+'</div></fieldset>';
    const genFields=()=>$('#tsGenFields').innerHTML=number('seed','随机种子',gen.seed,1,2147483646)+
      number('n','收益样本量',gen.n,120,1600)+number('ar','市场 AR(1) 系数',gen.ar,-.75,.75,.01)+
      number('cross','市场 → 行业滞后系数',gen.cross,-.75,.75,.01)+number('noise','创新标准差',gen.noise,.001,.05,.001);
    genFields();
    function settings() {
      const names=data.names.map((n,i)=>[i,n]), vars=opt.vars.map(i=>[i,data.names[i]]);
      let html=field('target','目标序列',names);
      if (data.kind==='price') html+=field('form','序列尺度',[['price','原始价格'],['simple','简单收益率'],['log','对数收益率']]);
      if (view==='station') html+=field('adf','ADF 确定性项',[['none','无'],['drift','截距'],['trend','截距与趋势']])+
        number('adfLag','ADF 滞后差分数',opt.adfLag,0,12)+field('kpss','KPSS 原假设',[['level','水平平稳'],['trend','趋势平稳']]);
      if (view==='arma' || view==='compare') {
        const armaFields=field('armaMode','ARMA 定阶',[['manual','手动'],['auto','自动']])+
          (opt.armaMode==='manual'?number('p','AR 阶数 p',opt.p,0,5)+number('q','MA 阶数 q',opt.q,0,5):'')+
          (opt.armaMode==='auto' || view==='arma'&&opt.armaChart==='criteria' ? field('armaIC','ARMA 准则',[['AIC','AIC'],['AICc','AICc'],['BIC','BIC']]):'');
        html+=view==='arma'?armaFields:disclosure('ARMA 设置',armaFields);
      }
      if (view==='var' || view==='compare') {
        const varFields=checks('vars','VAR 内生变量',opt.vars)+field('varMode','VAR 定阶',[['manual','手动'],['auto','自动']])+
          (opt.varMode==='manual'?number('varLag','VAR 滞后阶数',opt.varLag,1,5):'')+
          (opt.varMode==='auto' || view==='var'&&opt.varChart==='criteria'?field('varIC','VAR 准则',[['AIC','AIC'],['BIC','BIC'],['HQ','HQ']]):'');
        html+=view==='var'?varFields:disclosure('VAR 设置',varFields);
      }
      if (view==='arma' || view==='var') html+=number('horizon','未来预测期数',opt.horizon,1,40);
      if (view==='arma') html+=disclosure('ARMA 诊断与估计',number('diagnostic','Ljung–Box 滞后 L',opt.diagnostic,1,30)+
        '<p>常均值 μ。条件高斯估计统一将前五期创新置零，不纳入似然。</p>');
      if (view==='var' && vars.length>=2) html+=opt.varChart==='granger'?
        field('from','来源变量',vars)+field('to','响应变量',vars.filter(([i])=>i!==opt.from)):
        field('varPlot','预测展示',[['all','所有 VAR 变量'],...vars]);
      if (view==='compare') html+='<p class="ts-muted">预测跨度：共同滚动一期</p>'+
        number('train','训练比例',opt.train,.5,.85,.01)+number('valid','验证比例',opt.valid,.05,.3,.01)+
        disclosure('LSTM 输入与训练',checks('features','输入变量',opt.features)+
          number('window','输入窗口',opt.window,4,32)+number('hidden','隐藏单元',opt.hidden,4,16)+
          number('epochs','最大训练轮数',opt.epochs,1,80)+
          '<p>Adam · 学习率 0.008 · 批量 32 · 耐心 6 轮 · 种子 731</p>')+
        '<div class="ts-train"><button type="button" id="tsTrain">训练 LSTM</button> <button type="button" id="tsCancel">取消训练</button>'+
        '<p id="tsTrainStatus" role="status"></p></div>';
      const open=[...$('#inputs').querySelectorAll('details')].map(d=>d.open);
      $('#inputs').innerHTML=html;
      $('#inputs').querySelectorAll('details').forEach((d,i)=>d.open=!!open[i]);
      if (view==='compare') { $('#tsTrain').onclick=train; $('#tsCancel').onclick=()=>{stop('训练已取消。'); draw();}; }
    }
    function clearData(next, target=0) {
      stop('');
      data=next; datasetId=dataId(data);
      opt.target=target; opt.form=data.kind==='price'?'log':data.kind;
      opt.vars=[target,...data.names.map((_,i)=>i).filter(i=>i!==target).slice(0,1)].sort((a,b)=>a-b);
      opt.features=opt.vars.slice(); opt.from=opt.vars[0];opt.to=opt.vars[1];opt.varPlot='all';
      learned=null;attempted=null;cache=new Map();seenComparisons.clear();
      settings(); draw();
    }
    function readyData() { return M.transform(data,opt.form); }
    function cached(key, fn) {
      const id=JSON.stringify(key);
      if (!cache.has(id)) {
        if (cache.size>=20) cache.delete(cache.keys().next().value);
        cache.set(id,fn());
      }
      return cache.get(id);
    }
    const armaKey=()=>[opt.armaMode,opt.armaIC,opt.p,opt.q];
    const varKey=()=>[opt.vars,opt.varMode,opt.varIC,opt.varLag];
    function weightKey() { return JSON.stringify([opt.form,opt.target,opt.features,opt.train,opt.valid,opt.window,opt.hidden,opt.epochs]); }
    function weights() {
      if (learned?.key===weightKey()) return learned.model;
      if (attempted!==weightKey() && data.synthetic && Object.keys(M.defaults).every(k=>gen[k]===M.defaults[k]) &&
          weightKey()===JSON.stringify(['log',0,[0,1],.7,.15,12,8,40])) return TimeSeriesWeights;
      return null;
    }
    function stop(message) {
      if (worker) worker.terminate();
      worker=null; progress=null; runInfo=message;
    }
    function trainStatus() {
      if (view!=='compare') return;
      const model=weights(), text=worker ? (progress?'训练第 '+progress.epoch+' 轮 · 验证 MSE '+fmt(progress.validation):'训练已启动…') :
        runInfo || (model ? (model===TimeSeriesWeights?'已载入默认冻结权重':'已训练并冻结权重')+
          ' · 采用第 '+model.bestEpoch+' 轮，共 '+model.curve.length+' 轮' : '当前设置需要训练权重');
      $('#tsTrain').disabled=!!worker;
      $('#tsCancel').hidden=!worker;
      $('#tsTrainStatus').textContent=text;
    }
    function train() {
      const d=readyData(), key=weightKey();
      try {
        attempted=key;learned=null;
        const {nt,nv}=M.split(d.rows.length,opt.train,opt.valid);
        if (!opt.features.length) throw Error('请至少选择一个 LSTM 输入变量。');
        const hashes=window.FINMODEL_BUILD.assets;
        const w=new Worker('timeseries-worker.js?v='+hashes['timeseries-worker.js'].slice(0,16));
        worker=w; runInfo='';progress=null;draw();
        const failed=message=>{stop('训练失败：'+message); draw();};
        w.onerror=e=>{if(worker===w) failed(e.message||'无法加载训练程序。');};
        w.onmessage=({data:message})=>{
          if (worker!==w || key!==weightKey()) return;
          if (message.entry) { progress=message.entry;trainStatus(); }
          if (message.error) failed(message.error);
          if (message.model) { learned={key,model:{...message.model,datasetId}};stop('');draw(); }
        };
        w.postMessage({hashes,rows:d.rows.slice(0,nv),options:{nt,nv,target:opt.target,features:opt.features,
          window:opt.window,hidden:opt.hidden,epochs:opt.epochs}});
      } catch(e) { stop('训练失败：'+e.message);draw(); }
    }

    const unit=d=>({price:'价格原值',log:'对数收益（小数）',simple:'简单收益（小数）',numeric:'原始单位'})[d.form];
    const legend=labels=>$('#legend').innerHTML=labels.map(([text,color])=>
      '<span class="ts-legend"><i style="background:'+color+'"></i>'+esc(text)+'</span>').join('');
    const plot=(title,settings)=>{
      $('#tsPlotTitle').textContent=title;
      chart.draw(settings);
    };
    const metricRow=(...pairs)=>$('#metrics').innerHTML=pairs.map(([label,value])=>metric(label,value)).join('');
    const detail=(html)=>$('#details').innerHTML=html;
    const safeTxt=s=>'<p>'+esc(s)+'</p>';
    const criterion=(rows,ic,format,d)=>{
      const valid=rows.filter(c=>Number.isFinite(c[ic]));
      if (valid.length) plot(ic+' · 相同估计日期', {series:[{name:ic,values:valid.map(c=>c[ic])}],
        labels:valid.map(format),unit:ic,xLabel:'候选阶数',bars:true});
      detail(safeTxt('准则越小越好。不同惩罚可能选出不同阶数，有限样本选择存在不确定性。')+
        disclosure('全部候选与失败状态',table(['阶数','准则','状态'],
          rows.map(c=>[format(c),fmt(c[ic]),c.error||'成功'])))+
        safeTxt('当前样本：'+d.rows.length+' 期'));
    };
    function station(d,y) {
      const q=cached([d.form,opt.target,opt.adf,opt.adfLag,opt.kpss],()=>M.stationarity(y,opt.adf,opt.adfLag,opt.kpss==='trend'));
      const kind=opt.stationChart;
      metricRow(['ADF τ · '+bool(q.adfReject),fmt(q.tau)],['KPSS · '+bool(q.kpssReject),fmt(q.kpss)]);
      const interpretations={
        'true,false':'当前结果与所选平稳性假设较为一致。',
        'false,true':'当前证据提示需进一步检查单位根或其他非平稳形式。'
      };
      let extras='';
      if (kind==='series') plot(data.names[opt.target]+' · '+unit(d),{series:[{name:data.names[opt.target],values:y}],
        labels:d.dates,unit:unit(d),xLabel:data.synthetic?'模拟观测期':'观察日期'});
      else {
        const q=cached(['acf',d.form,opt.target],()=>M.correlogram(y));
        plot(kind.toUpperCase()+' · '+data.names[opt.target],{series:[{name:kind.toUpperCase(),values:q[kind].slice(1)}],
          labels:q[kind].slice(1).map((_,i)=>i+1),unit:'相关系数',xLabel:'滞后（观测期）',bars:true,references:[{value:q.band},{value:-q.band}]});
        extras=safeTxt('虚线为白噪声近似下的点态 ±1.96/√n 参考线。截断与拖尾提供定阶线索，仍需比较估计与残差。');
      }
      detail(safeTxt(interpretations[[q.adfReject,q.kpssReject].join(',')]||
        '两项检验给出不同信号。样本量、趋势设定、结构变化、检验功效及滞后／带宽选择都可能影响结果。')+
        disclosure('检验口径与临界值',table(['检验','原假设','5% 临界值','滞后 / 带宽'],[
          ['ADF','存在单位根',q.critical,opt.adfLag],['KPSS',opt.kpss==='trend'?'趋势平稳':'水平平稳',q.kCritical,q.bw]])+
          safeTxt('ADF 使用 ur.df 的 τ 临界值口径，KPSS 使用 Bartlett 长期方差及短带宽。趋势和单位根描述不同机制，收益率也需要检验。'))+extras);
      return q;
    }
    function arma(d,y) {
      const kind=opt.armaChart, q=cached(['a',d.form,opt.target,...armaKey(),kind==='criteria'],
        ()=>M.selectARMA(y,opt,kind==='criteria')), f=q.fit;
      const h=M.forecastARMA(y,f,opt.horizon), test=M.ljung(f,opt.diagnostic);
      metricRow(['当前模型','ARMA('+f.p+','+f.q+')'],['未来第 1 期',fmt(h[0].value)]);
      if (kind==='criteria') criterion(q.candidates,opt.armaIC,c=>'('+c.p+','+c.q+')',d);
      else if (kind==='residual' || kind==='resacf') {
        const e=f.residual.slice(f.burn).map(x=>x/Math.sqrt(f.sigma2));
        if (kind==='residual') plot('标准化残差',{series:[{name:'残差 / σ',values:e}],labels:d.dates.slice(f.burn),unit:'残差 / σ',xLabel:'观察期',references:[{value:0}]});
        else {
          const c=M.correlogram(e);
          plot('残差 ACF',{series:[{name:'ACF',values:c.acf.slice(1)}],labels:c.acf.slice(1).map((_,i)=>i+1),unit:'相关系数',xLabel:'滞后（观测期）',bars:true,
            references:[{value:c.band},{value:-c.band}]});
        }
        detail(safeTxt(test.p===null?'Ljung–Box 自由度不合法，请选 L > p+q。':
          'Ljung–Box Q = '+fmt(test.Q)+'，df = '+test.df+'，p = '+fmt(test.p)+
          '。残差是未解释的部分。未拒绝只能说明所选滞后的线性相关证据不足。'));
      } else {
        const history=y.slice(-64), n=history.length, blanks=Array(n).fill(null);
        const labels=d.dates.slice(-n).concat(h.map((_,i)=>'未来 '+(i+1)));
        const bounds=(key)=>blanks.concat(h.map(r=>r[key]));
        plot('已观察序列与未来预测',{series:[{name:'历史观测',values:history},
          {name:'ARMA 点预测',values:blanks.slice(1).concat(history.at(-1),h.map(r=>r.value)),points:true}],
          labels,unit:unit(d),xLabel:'观测期与未来期',origin:n-1,bands:[
            {name:'95% 区间',lower:bounds('lo95'),upper:bounds('hi95'),alpha:.15},
            {name:'80% 区间',lower:bounds('lo80'),upper:bounds('hi80'),alpha:.26}]});
        legend([['历史',chart.colors[0]],['点预测',chart.colors[1]],['80% / 95% 预测区间','#cbbbd5']]);
        detail(safeTxt('区间基于条件高斯创新，随预测期数传播，条件于已估参数。以未来观测期标记时间。'));
      }
      $('#details').insertAdjacentHTML('beforeend',safeTxt('AR 使用过去观测偏离均值的信息。MA 使用过去的创新，与移动平均平滑含义不同。')+
        (f.boundary?safeTxt('估计接近反射系数约束边界，参数解释与模型选择需谨慎。'):'')+
        disclosure('系数、似然和预测表',table(['参数','估计'],[
          ['μ',fmt(f.mu)],...f.ar.map((v,i)=>['φ'+(i+1),fmt(v)]),...f.ma.map((v,i)=>['θ'+(i+1),fmt(v)]),['σ²',fmt(f.sigma2)],
          ...['logLik','AIC','AICc','BIC'].map(k=>[k,fmt(f[k])])])+
          safeTxt('有效估计样本 '+(y.length-f.burn)+'。AR/MA 多项式由反射系数约束，近边界或阶数选择后不展示常规 Wald 显著性。')+
          table(['未来期','点预测','80% 下 / 上','95% 下 / 上'],h.map((r,i)=>[i+1,fmt(r.value),fmt(r.lo80)+' / '+fmt(r.hi80),fmt(r.lo95)+' / '+fmt(r.hi95)]))));
      return {q,forecast:h,test};
    }
    function varView(d) {
      const kind=opt.varChart, v=d.rows.map(r=>opt.vars.map(i=>r[i]));
      if (opt.vars.length<2) throw Error('VAR 需要至少两个同期变量。请选择额外变量或导入多变量 CSV。');
      const result=cached(['v',d.form,...varKey(),kind==='criteria'],()=>{
        const q=M.selectVAR(v,opt,kind==='criteria'), f=q.fit, names=opt.vars.map(i=>data.names[i]);
        const roots=M.roots(f), max=Math.max(...roots.map(r=>r.abs));
        const tests=names.flatMap((_,from)=>names.flatMap((__,to)=>from===to?[]:[{from,to,...M.granger(v,f,from,to)}]));
        return {q,names,roots,max,tests};
      });
      const {q,names,roots,max,tests}=result,f=q.fit, h=M.forecastVAR(v,f,opt.horizon);
      if (h.flat().some(x=>!Number.isFinite(x))) throw Error('联合预测超出有限数值范围，请检查稳定性或缩短跨度。');
      metricRow(['当前模型','VAR('+f.p+')'],[max<1?'稳定 · 最大特征值模':'不稳定 · 最大特征值模',fmt(max)]);
      if (kind==='criteria') criterion(q.candidates,opt.varIC,c=>String(c.p),d);
      else if (kind==='granger') {
        $('#tsPlotTitle').textContent='Granger 条件预测关系';
        $('#tsPlot').innerHTML='<div class="ts-directions">'+tests.map(({from,to,p})=>{
          const a=opt.vars[from],b=opt.vars[to],active=a===opt.from&&b===opt.to;
          return '<button type="button" data-direction="'+a+','+b+'" aria-pressed="'+active+'"><span>'+esc(names[from])+
            ' → '+esc(names[to])+'</span><b class="'+(p<.05?'ts-significant':'')+'">'+'p = '+fmt(p)+'</b><small>'+(p<.05?'有额外预测信息':'证据不足')+'</small></button>';
        }).join('')+'</div>';
        $('#tsPlot').querySelectorAll('[data-direction]').forEach(btn=>btn.onclick=()=>{
          [opt.from,opt.to]=btn.dataset.direction.split(',').map(Number);settings();draw();
        });
        const t=tests.find(t=>opt.vars[t.from]===opt.from&&opt.vars[t.to]===opt.to)||tests[0];
        detail(safeTxt(names[t.from]+' → '+names[t.to]+' · F('+t.df1+', '+t.df2+') = '+fmt(t.F)+'，p = '+fmt(t.p)+
          '。'+(t.p<.05?'当前设定下，来源变量的滞后提供额外预测信息。':'当前设定下，额外预测信息的证据不足。'))+
          safeTxt('检验原假设为来源变量的 p 个滞后系数联合为零。经典 F 参考依赖模型及误差假设，结构性因果需要额外识别。'));
      } else {
        const ids=opt.varPlot==='all'?names.map((_,i)=>i):[opt.vars.indexOf(opt.varPlot)];
        const history=v.slice(-45),n=history.length, labels=d.dates.slice(-n).concat(h.map((_,i)=>'未来 '+(i+1)));
        const series=ids.flatMap(i=>[{name:names[i]+' · 历史',values:history.map(r=>r[i]),color:chart.colors[i+1]},
          {name:names[i]+' · 预测',values:Array(n-1).fill(null).concat(history.at(-1)[i],h.map(r=>r[i])),color:chart.colors[i+1],dash:'6 3',points:true}]);
        plot('VAR 联合多期点预测',{series,labels,unit:unit(d),xLabel:'观测期与未来期',origin:n-1});
        legend(ids.map(i=>[names[i],chart.colors[i+1]]).concat([['虚线为未来预测','#7e7490']]));
        detail(safeTxt('每个方程同时使用自身与系统中其他变量的滞后。未来各变量联合递推。'));
      }
      const terms=['截距',...Array.from({length:f.p},(_,i)=>names.map(name=>name+' L'+(i+1))).flat()];
      $('#details').insertAdjacentHTML('beforeend',
        (max>=1?safeTxt('伴随矩阵存在模 ≥1 的特征值。长期预测和常规平稳 VAR 推断需谨慎。'):'')+
        disclosure('系数、协方差、稳定性与预测表',safeTxt('逐方程 OLS，共同有效样本 '+f.n+'，残差协方差按 UᵀU/n。')+
          table(['解释变量',...names],terms.map((term,j)=>[term,...f.coef.map(a=>fmt(a[j]))]))+
          table(['协方差',...names],f.cov.map((r,j)=>[names[j],...r.map(x=>fmt(x))]))+
          table(['实部','虚部','模'],roots.map(r=>[fmt(r.re),fmt(r.im),fmt(r.abs)]))+
          table(['未来期',...names],h.map((r,i)=>[i+1,...r.map(x=>fmt(x))]))+
          disclosure('拟合值与残差 · 最后 5 期',table(['日期',...names.map(n=>n+' 拟合'),...names.map(n=>n+' 残差')],
            f.fits[0].residual.slice(-5).map((_,i)=>[d.dates.at(i-5),...f.fits.map(a=>fmt(a.fitted.at(i-5))),...f.fits.map(a=>fmt(a.residual.at(i-5)))])))));
      return {...result,forecast:h};
    }
    function compare(d) {
      const key=['c',d.form,opt.target,opt.train,opt.valid,...armaKey(),...varKey()];
      seenComparisons.add(JSON.stringify([...key,weightKey()]));
      const q=cached(key,()=>M.compare(d.rows,opt.target,opt.vars,opt)), model=weights();
      const models={...q.models};
      if (model) {
        try {
          const prediction=q.actual.map((_,i)=>L.predict(d.rows,q.nv+i,model));
          if (prediction.some(v=>!Number.isFinite(v))) throw Error('LSTM 预测包含无效值。');
          const errors=prediction.map((v,i)=>v-q.actual[i]), n=errors.length;
          models.LSTM={prediction,rmse:Math.sqrt(errors.reduce((s,v)=>s+v*v,0)/n),mae:errors.reduce((s,v)=>s+Math.abs(v),0)/n};
        } catch(e) { models.LSTM={error:e.message}; }
      } else models.LSTM={error:worker?'训练中':runInfo||'当前数据与设置没有匹配权重'};
      const names=Object.keys(models), valid=names.filter(k=>!models[k].error), kind=opt.compareChart;
      const measure=kind==='mae'?'mae':'rmse', sorted=valid.slice().sort((a,b)=>models[a][measure]-models[b][measure]);
      const best=sorted[0], second=sorted[1];
      metricRow([measure.toUpperCase()+' 最低',best+' · '+fmt(models[best][measure])],['训练 / 验证 / 测试',
        q.nt+' / '+(q.nv-q.nt)+' / '+q.actual.length]);
      if (kind==='rmse'||kind==='mae') plot('共同测试日期 · 一期 '+kind.toUpperCase()+' · '+valid.length+' 个可用模型',{
        series:[{name:kind.toUpperCase(),values:valid.map(k=>models[k][kind]),barColors:valid.map(k=>chart.colors[names.indexOf(k)+1])}],
        labels:valid,unit:unit(d),xLabel:'模型',bars:true});
      else if (kind==='loss') {
        if (model) {
          plot('LSTM · 训练与验证 MSE',{series:[{name:'训练',values:model.curve.map(x=>x.train)},
            {name:'验证',values:model.curve.map(x=>x.validation)}],labels:model.curve.map(x=>x.epoch),
            unit:'标准化 MSE',xLabel:'训练轮次',mark:model.curve.map(x=>x.epoch===model.bestEpoch?'恢复此轮权重':'')});
          legend([['训练',chart.colors[0]],['验证',chart.colors[1]]]);
        } else { $('#tsPlotTitle').textContent='LSTM 训练记录';$('#tsPlot').textContent=models.LSTM.error; }
      } else {
        const series=valid.map(k=>({name:k,color:chart.colors[names.indexOf(k)+1],
          values:models[k].prediction.map((v,i)=>kind==='errors'?q.actual[i]-v:v),
          dash:['Naive','VAR'].includes(k)?'5 3':''}));
        if (kind==='prediction') series.unshift({name:'实际值',values:q.actual,color:chart.colors[0]});
        plot(kind==='errors'?'一期预测误差（实际 − 预测）':'共同测试日期 · 实际与一期预测',{
          series,labels:d.dates.slice(q.nv),unit:unit(d),xLabel:'测试观测期',references:kind==='errors'?[{value:0}]:[]});
        legend(series.map(s=>[s.name,s.color]));
      }
      detail(safeTxt((second?'当前 '+measure.toUpperCase()+' 最低的是 '+best+'，与次低 '+second+' 相差 '+
        fmt(models[second][measure]-models[best][measure])+'。':'当前仅 '+best+' 有可比较结果。')+
        ' 结论只描述本样本。ARMA 使用目标历史，VAR 和 LSTM 可使用不同的多变量信息。')+
        safeTxt('参数只用训练期拟合，LSTM 用随后验证期早停。测试期每个目标日前只使用已观测历史。'+
          (seenComparisons.size>1?' 已在本次会话重复查看不同设定的留出结果，适合作为探索性比较。':''))+
        disclosure('指标、模型状态与日期',table(['模型','RMSE','MAE','状态'],names.map(k=>
          [k,fmt(models[k].rmse),fmt(models[k].mae),models[k].error||'日期完整对齐']))+
          safeTxt('目标 '+data.names[opt.target]+'，测试 '+d.dates[q.nv]+' 至 '+d.dates.at(-1)+'，共 '+q.actual.length+' 期。方向命中也需交易成本与执行假设才能讨论经济表现。')+
          (model?safeTxt('LSTM '+model.version+' · '+model.window+' 期窗口 · '+model.hidden+' 个隐藏单元 · 输入 '+
            model.features.map(i=>data.names[i]).join('、')+' · 最佳轮 '+model.bestEpoch+' / 实跑 '+model.curve.length+'。')+
            safeTxt('数据版本 '+datasetId+' · '+unit(d)+' · 训练 '+d.dates[0]+' 至 '+d.dates[q.nt-1]+
              ' · 验证 '+d.dates[q.nt]+' 至 '+d.dates[q.nv-1]+'。'):'')+
          (q.armaModel?safeTxt('训练期 ARMA('+q.armaModel.p+','+q.armaModel.q+')'):'')+
          (q.varModel?safeTxt('训练期 VAR('+q.varModel.p+') · '+opt.vars.map(i=>data.names[i]).join('、')):'')));
      trainStatus();
      return {...q,models,model};
    }

    const coreBlock={station:'adf',arma:'arma',var:'var',compare:'split'};
    function scrollToBlock(id) {
      const pane=$('#code'), block=document.getElementById('ts-code-'+id);
      if (block) pane.scrollTop+=block.getBoundingClientRect().top-pane.getBoundingClientRect().top;
    }
    function renderCode() {
      $('#copy').disabled=!built;
      if (!built) { nav.innerHTML='';$('#code').innerHTML='';$('#explanation').textContent='当前模型没有可复现的有效输出。';return; }
      if (!built.blocks.some(b=>b.id===activeBlock)) {activeBlock=built.blocks[0].id;activeLine=null;}
      nav.innerHTML=built.blocks.map(b=>'<button type="button" data-block="'+b.id+'">'+esc(b.title)+'</button>').join('');
      const shown=codeMode==='full'?built.blocks:built.blocks.filter(b=>b.id===activeBlock);
      let count=0;
      $('#code').innerHTML=shown.map(b=>'<section class="logic-block" id="ts-code-'+b.id+'">'+
        b.code.split('\n').map((line,i)=>{
          count++;
          const key=b.id+':'+i;
          const original=WorkbenchUI.colorCode(line||' '), translated=FML_TIMESERIES_I18N.comment(line);
          const source=translated===line ? original : '<span class="ts-comment-en">'+original+
            '</span><span class="ts-comment-zh">'+WorkbenchUI.colorCode(translated)+'</span>';
          return '<button type="button" class="code-line" data-line="'+key+'" data-block="'+b.id+'"><span class="line-number">'+count+
            '</span><code data-fml-skip>'+source+'</code></button>';
        }).join('')+'</section>').join('');
      explain(activeBlock,activeLine);
    }
    function explain(id,line) {
      if (!built) return;
      activeBlock=id;activeLine=line;
      const b=built.blocks.find(x=>x.id===id), source=line?b.code.split('\n')[Number(line.split(':')[1])]:'';
      const note=lineNotes.find(([pattern])=>pattern.test(source||''))?.[1];
      $('#explanation').innerHTML='<h3>'+esc(b.title)+'</h3><p>'+esc(note||b.text)+'</p>'+
        (formulas[id]?'<div id="tsFormula"></div>':'');
      if (formulas[id]) katex.render(formulas[id],$('#tsFormula'),{throwOnError:false});
      nav.querySelectorAll('button').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.block===id)));
      $('#code').querySelector('.ts-selected')?.classList.remove('ts-selected');
      const button=line?$('#code [data-line="'+line+'"]'):null;
      if (button) button.classList.add('ts-selected');
    }
    function draw(focusCore=false) {
      const d=readyData(), {form, target}=opt, scroll=$('#code').scrollTop;
      const key=view+'Chart';
      chart.clear();
      tabs.querySelectorAll('button').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.tsView===view)));
      question.textContent=views.find(([k])=>k===view)[2];
      controls.innerHTML='<label>主图 '+select(key,chartChoices[view],opt[key])+'</label>';
      body.dataset.tsSource=data.synthetic?'synthetic':'csv';
      $('#graphKind').textContent=data.synthetic?'合成数据':'本地 CSV';
      const sourceNotes=[data.synthetic?'合成金融时间序列，非真实市场行情。':'本地 CSV，仅在本机处理。',
        data.frequency+' · 当前有效 '+d.rows.length+' 期 · 清洗损失 '+data.lost+' 行',
        ...(data.kind==='price'&&form!=='price'?['转换首期损失 1 行。']:[]),...data.warnings];
      $('#tsSource').innerHTML=sourceNotes.map(note=>'<span>'+esc(note)+'</span>').join(' ');
      $('#assumptionSummary').innerHTML='<span>'+esc(unit(d))+'</span><span>'+esc(data.frequency)+' · '+d.rows.length+' 期</span>'+
        (data.synthetic?'<span>合成金融时间序列，非真实市场行情。</span>':'<span>清洗损失 '+data.lost+' 行</span>');
      $('#validation').textContent='';$('#legend').textContent='';
      $('#tsPlotTitle').textContent='';$('#tsPlot').textContent='';detail('');
      try {
        const y=d.rows.map(r=>r[target]);
        M.validate(y);
        last=view==='station'?station(d,y):view==='arma'?arma(d,y):view==='var'?varView(d):compare(d);
        built=R.build(view,data,{...opt,chart:opt[key]},last.model,last.models);
      } catch(e) {
        last=built=null;$('#validation').textContent=e.message;metricRow(['当前设定','结果不可用']);
        $('#tsPlotTitle').textContent='当前设定无法计算';$('#tsPlot').textContent=e.message;
        detail('');$('#legend').textContent='';trainStatus();
      }
      renderCode();
      $('#code').scrollTop=scroll;
      if (focusCore) scrollToBlock(activeBlock);
    }
    function update(e) {
      const el=e.target, id=el.dataset.opt, list=el.dataset.list;
      if (!id&&!list) return;
      const old=weightKey();
      if (list) {
        opt[list]=[...$('#inputs').querySelectorAll('[data-list="'+list+'"]:checked')].map(x=>Number(x.value));
        if (list==='vars') {
          opt.from=opt.vars[0];opt.to=opt.vars[1];opt.varPlot='all';
        }
      } else {
        const number=el.type==='number'||['target','from','to'].includes(id)||id==='varPlot'&&el.value!=='all';
        if (el.type==='number' && !el.checkValidity()) {
          el.value=opt[id]; $('#validation').textContent='请输入 '+el.min+'–'+el.max+' 范围内的值。'; return;
        }
        opt[id]=number?Number(el.value):el.value;
        if (id==='from'&&opt.from===opt.to) opt.to=opt.vars.find(j=>j!==opt.from);
      }
      if (old!==weightKey()) { stop('');attempted=null; }
      const focused=list && document.activeElement===el;
      settings();draw();
      if (focused) $('#inputs [data-list="'+list+'"][value="'+el.value+'"]')?.focus({preventScroll:true});
    }
    $('#inputs').onchange=controls.onchange=update;
    tabs.onclick=e=>{
      const id=e.target.dataset.tsView;
      if (!id||id===view) return;
      view=id;activeBlock=coreBlock[id];activeLine=null;$('#code').scrollTop=0;
      settings();draw(true);
    };
    nav.onclick=e=>{
      const id=e.target.dataset.block;
      if (!id) return;
      if (codeMode==='basic') {activeBlock=id;activeLine=null;renderCode();}
      else {
        explain(id,null);
        scrollToBlock(id);
      }
    };
    $('#code').onclick=e=>{
      const el=e.target.closest('[data-line]');
      if (el) explain(el.dataset.block,el.dataset.line);
    };
    $('.code-toolbar').addEventListener('click',e=>{
      if (!e.target.dataset.codeMode) return;
      codeMode=e.target.dataset.codeMode;
      $('.code-toolbar').querySelectorAll('[data-code-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.codeMode===codeMode)));
      renderCode();$('#code').scrollTop=0;
    });
    $('#tsGen').onsubmit=e=>{
      e.preventDefault();
      try {
        const next=Object.fromEntries(Object.keys(gen).map(k=>[k,Number($('#ts-'+k).value)])), d=M.generate(next);
        gen=next;$('#tsDataError').textContent='';clearData(d);
      } catch(error) { $('#tsDataError').textContent=error.message; }
    };
    $('#tsFile').onchange=async e=>{
      const file=e.target.files[0], v=++fileVersion;
      importedTable=null;fileText='';$('#tsImport').disabled=true;$('#tsColumns').textContent='';$('#tsDataError').textContent='';
      if (!file) return;
      try {
        if (file.size>2e6) throw Error('CSV 限制为 2 MB。');
        const text=await file.text();
        if (v!==fileVersion) return;
        importedTable=RegMath.csvTable(text);
        fileText=text;
        const choices=option('','请选择','')+importedTable.names.map(n=>option(n,n,'',true)).join('');
        $('#tsColumns').innerHTML='<label>日期列<select id="tsDate" required>'+choices+
          '</select></label><label>预测目标<select id="tsTarget" required>'+choices+
          '</select></label><fieldset><legend>额外数值列（最多两个）</legend>'+
          importedTable.names.map((n,i)=>'<label class="ts-check"><input type="checkbox" data-csv-column="'+i+'"><span data-fml-skip>'+esc(n)+'</span></label>').join('')+'</fieldset>';
        function syncColumns() {
          const reserved=[$('#tsDate').value,$('#tsTarget').value];
          $('#tsColumns').querySelectorAll('[data-csv-column]').forEach(x=>{
            x.disabled=reserved.includes(importedTable.names[Number(x.dataset.csvColumn)]);
            if (x.disabled) x.checked=false;
          });
        }
        $('#tsDate').onchange=$('#tsTarget').onchange=syncColumns;
        $('#tsImport').disabled=false;
      } catch(error) { if (v===fileVersion) $('#tsDataError').textContent=error.message; }
    };
    $('#tsCSV').onsubmit=e=>{
      e.preventDefault();
      if (!importedTable) return;
      try {
        const additional=[...$('#tsColumns').querySelectorAll('[data-csv-column]:checked')]
          .map(x=>importedTable.names[Number(x.dataset.csvColumn)]);
        const columns=[$('#tsTarget').value,...additional];
        const next=M.importData(fileText,{date:$('#tsDate').value,columns,kind:$('#tsKind').value,unit:$('#tsUnit').value,
          frequency:$('#tsFrequency').value,missing:$('#tsMissing').value,acceptGaps:$('#tsAccept').checked});
        $('#tsDataError').textContent='已确认 '+next.rows.length+' 个同期日期。'; clearData(next);
      } catch(error) { $('#tsDataError').textContent=error.message; }
    };
    function info(title,text) { $('#infoTitle').textContent=title;$('#infoBody').textContent=text;ModalUI.open($('#infoDialog')); }
    for (const id of ['#catalog','#catalogMobile']) $(id).onclick=()=>ModalUI.open($('#catalogDialog'));
    document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
    $('#help').onclick=()=>info('实验 05 · 自由探索','任意切换四个视图。先对照价格与收益率，再观察定阶、残差、联合预测与测试误差。CSV 宽表只在浏览器内处理。');
    $('#teacher').onclick=()=>info('约 12 分钟课堂演示','3 分钟比较价格和收益率的 ADF/KPSS，3 分钟 ARMA 诊断与预测区间，3 分钟比较双向 Granger，3 分钟在共同留出期比较模型并复制 R。');
    const practice=document.createElement('button');
    practice.id='rStudioPractice';practice.textContent='RStudio 实践';$('.code-toolbar').append(practice);
    practice.onclick=()=>info('RStudio · 运行当前完整脚本','复制代码并粘贴到新的 R Script，全选运行。脚本只依赖 Base R，内含当前数据和设定。已有 LSTM 模型时含冻结权重推断。');
    $('#copy').onclick=async()=>{
      if (!built) return;
      try { await navigator.clipboard.writeText(built.script);$('#toast').textContent='已复制完整 R 代码'; }
      catch { $('#toast').textContent='复制权限不可用，请在完整代码视图中选择所需内容。'; }
      const toast=$('#toast');toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1800);
    };
    $('#projector').onclick=()=>{
      const on=body.classList.toggle('projector');
      $('#projector').setAttribute('aria-pressed',String(on));chart.clear();
    };
    const resize=v=>{
      share=Math.max(40,Math.min(75,v));$('#splitter').setAttribute('aria-valuenow',String(Math.round(share)));
      $('.code-regions').style.setProperty('--code-fr',share+'fr');$('.code-regions').style.setProperty('--explain-fr',100-share+'fr');
    };
    $('#splitter').onkeydown=e=>{if (['ArrowDown','ArrowUp'].includes(e.key)) {e.preventDefault();resize(share+(e.key==='ArrowDown'?2:-2));}};
    $('#splitter').onpointerdown=e=>{
      const el=e.currentTarget,y=e.clientY,start=share,h=$('.code-regions').clientHeight;
      el.setPointerCapture(e.pointerId);el.onpointermove=event=>resize(start+100*(event.clientY-y)/h);
      el.onlostpointercapture=()=>el.onpointermove=null;
    };
    $('#reset').onclick=()=>{
      gen={...M.defaults};opt=structuredClone(defaults);genFields();
      fileVersion++;importedTable=null;fileText='';$('#tsCSV').reset();$('#tsColumns').textContent='';
      $('#tsImport').disabled=true;$('#tsDataError').textContent='';
      activeBlock='data';activeLine=null;clearData(M.generate(gen));
    };
    window.TimeSeriesLab={snapshot:()=>structuredClone({view,opt,data,last,script:built?.script,status:runInfo})};
    settings();draw(true);
  }
  window.TimeSeriesWorkbench={mount};
})();
