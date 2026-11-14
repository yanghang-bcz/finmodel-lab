/* Experiment01 workbench: seven language parts sharing the three-pane shell. */
(()=>{'use strict';
const M=RBasicMath,C=RBasicCode,K=LabKit,$=s=>document.querySelector(s);
const {t,esc,fmt,pct}=K;
const VIEW_KEYS=M.views.map(v=>v[0]);
function mount(){
  K.start('rbasic','rbasic-lab');
  let p={...M.defaults},view='env',mode='full',active=null,built=null,q=null,focus='data.frame';
  $('#chartHost').className='chart-host single-chart';
  $('#chartHost').innerHTML='<div class="chart-frame"><h3></h3><div class="svg-host"></div></div>';
  const frameTitle=()=>$('#chartHost .chart-frame h3');
  const svgHost=()=>$('#chartHost .svg-host');
  const tabs=K.views($('.model-panel .panel-head'),M.views,view,k=>{view=k;active=null;render(true);});
  const questions={
    env:['脚本从哪里开始？环境、目录与种子如何保证复现？','Where does the script start, and how do environment, folders and seed make it reproducible?'],
    struct:['同一组数值放进向量、矩阵、列表、数据框，会有什么不同？','How does one set of numbers behave inside a vector, matrix, list and data frame?'],
    index:['缺失值和逻辑索引如何改变一次简单计算？','How do missing values and logical indexing change a simple calculation?'],
    func:['函数、循环和向量化写法，结果为什么相同而代码不同？','Why do a function, a loop and vectorised code agree on the number but differ in code?'],
    plot:['基础绘图能先告诉我们关于收益分布的什么信息？','What can base graphics tell us about a return distribution first?'],
    pkg:['为什么"先声明依赖、再检查是否可用"比直接安装更可靠？','Why is declaring and checking dependencies safer than installing on the fly?'],
    ai:['AI 生成的代码看起来能跑，为什么还需要逐条审查？','The generated code runs — why does it still need item-by-item review?']
  };
  const params={
    env:()=>K.select({id:'step',zh:'流程步骤',en:'Pipeline step',value:p.step,options:M.STEPS.map((s,i)=>[i+1,s[0]+'／'+s[1],s[1]])}),
    struct:()=>K.select({id:'struct',zh:'重点容器',en:'Focus container',value:focus,options:[['vector','向量','Vector'],['matrix','矩阵','Matrix'],['list','列表','List'],['data.frame','数据框','Data frame']]})+
      K.field({id:'length',zh:'向量长度',en:'Vector length',value:p.length,min:4,max:24,step:1})+
      K.field({id:'rows',zh:'矩阵行数',en:'Matrix rows',value:p.rows,min:1,max:p.length-1,step:1}),
    index:()=>K.field({id:'naAt',zh:'缺失起始位置',en:'First missing position',value:p.naAt,min:1,max:p.length,step:1})+
      K.field({id:'na',zh:'缺失个数',en:'Missing count',value:p.na,min:1,max:3,step:1})+
      K.field({id:'length',zh:'向量长度',en:'Vector length',value:p.length,min:6,max:24,step:1}),
    func:()=>K.field({id:'n',zh:'样本量 n',en:'Sample size n',value:p.n,min:20,max:1200,step:1})+
      K.field({id:'draws',zh:'重复次数 B',en:'Replications B',value:p.draws,min:10,max:1000,step:1})+
      K.field({id:'mu',zh:'真实均值 μ',en:'True mean μ',value:p.mu,step:.001})+
      K.field({id:'sigma',zh:'标准差 σ',en:'Standard deviation σ',value:p.sigma,min:.001,step:.001})+
      K.field({id:'seed',zh:'随机种子',en:'Random seed',value:p.seed,min:1,max:99999999,step:1}),
    plot:()=>K.field({id:'n',zh:'收益样本量',en:'Return sample size',value:p.n,min:20,max:1200,step:1})+
      K.field({id:'bins',zh:'直方图分组',en:'Histogram bins',value:p.bins,min:4,max:40,step:1})+
      K.select({id:'kind',zh:'图形类型',en:'Plot type',value:p.kind,options:[['hist','直方图 + 正态密度','Histogram + normal density'],['qq','QQ 图','QQ plot'],['box','箱线图','Box plot'],['series','时间序列','Time series']]}),
    pkg:()=>K.prose('先声明、再检查、按需安装、记录版本；课堂上不要默认联网安装。','Declare, check, install only if needed, then record the version — never let a classroom script install silently.'),
    ai:()=>K.prose('草稿由 AI 生成，结论必须由学生逐条审查、运行验证并留痕。','The draft comes from an AI; the conclusion must be reviewed item by item, executed and recorded by the student.')
  };
  const summary={
    env:[['自检先行','Check first'],['相对路径','Relative paths'],['固定种子','Fixed seed']],
    struct:[['同一数据','One dataset'],['四种容器','Four containers'],['类型先于数值','Type before value']],
    index:[['NA 不是 0','NA is not 0'],['显式删除','Explicit deletion'],['填补要报告','Report imputations']],
    func:[['函数封装','Functions'],['循环 vs 向量化','Loop vs vectorised'],['收敛而非单调','Convergence, not monotone']],
    plot:[['先看图','Look first'],['密度叠加','Density overlay'],['厚尾判断','Fat-tail check']],
    pkg:[['声明依赖','Declare'],['检查可用','Check'],['记录版本','Record versions']],
    ai:[['草稿','Draft'],['审查','Review'],['留痕','Record']]
  };
  const assumptions={
    env:['R 脚本的复现依赖 R 版本、包版本、随机种子与输入数据四者一致。本页演示的是脚本结构；页面本身不执行 R。','Reproducing an R script requires the same R version, package versions, seed and input data. This page demonstrates script structure; the page itself does not run R.'],
    struct:['向量只能是一种原子类型；矩阵是带 dim 的向量；数据框是等长列的列表；列表的每个元素可以是任意对象。页面中的数值全部为固定合成数据。','A vector has one atomic type; a matrix is a vector with a dim attribute; a data frame is a list of equal-length columns; list elements can be anything. All numbers here are fixed synthetic data.'],
    index:['NA 表示未知，不参与任何未经声明的计算；na.rm = TRUE 是显式删除，会改变样本量与口径。中位数填补只有在缺失机制可接受时才是合理近似。','NA means unknown and enters no undeclared arithmetic; na.rm = TRUE is an explicit deletion that changes sample size and basis. Median imputation is only defensible when the missingness mechanism allows it.'],
    func:[['循环与向量化在同一随机流下给出相同结果；本页嵌入的是确定性样本，因此 R 与网页逐项一致。','Loop and vectorised code agree under the same random stream; this page embeds a deterministic sample so R and the page agree item by item.'],['累计均值的收敛是概率意义下的收敛，路径不会单调贴近真值；1.96 SE 带只是显示参照，不是覆盖率检验。','Convergence of the running mean is probabilistic and need not be monotone; the 1.96 SE band is a display reference, not a coverage test.']][0],
    plot:['收益序列为固定种子的合成数据，不代表任何真实行情；偏度与峰度采用无偏样本公式（e1071 type 2），与 R 脚本一致。','The return series is synthetic with a fixed seed and is not a market quote; skewness and kurtosis use the unbiased sample formulas (e1071 type 2), matching the R script.'],
    pkg:['基础包随 R 安装；额外包需要显式安装。脚本先检查 requireNamespace，避免在课堂环境里静默联网或静默降级。','Base packages ship with R; extra packages need explicit installation. The script checks requireNamespace first so it never silently downloads or degrades.'],
    ai:['AI 生成代码属于待审查草稿。审查要点包括缺失值、量纲与频率、可移植路径、命名冲突与结果校验；审查记录应写进实验报告。','AI-generated code is a draft pending review: missing values, units and frequency, portable paths, naming collisions and result checks. The review record belongs in the lab report.']
  };
  function paramHTML(){
    const body=params[view]();
    $('#inputs').innerHTML=body+K.tasks([
      [questions[view][0],questions[view][1]],
      ['先预测结果，再改参数验证；把差异写进实验记录。','Predict first, then change a parameter and record the difference.'],
      ['复制完整 R 脚本到 RStudio 整段运行，核对与本页一致的数值。','Copy the full script into RStudio and check the numbers against this page.']
    ]);
  }
  function readParams(){
    const next={...p};
    for(const el of $('#inputs').querySelectorAll('input,select')){
      const id=el.id.replace(/^lab-/,'');
      if(el.type==='checkbox')continue;
      if(id==='struct'){focus=el.value;continue;}
      if(id==='kind'||id==='step'){next[id]=el.value;continue;}
      const v=Number(el.value);
      if(el.value.trim()===''){throw Error(t('请输入数值：','Enter a number: ')+el.closest('label').querySelector('span').textContent);}
      next[id]=v;
    }
    M.check(next);
    return next;
  }
  function barsFor(values,{color}){
    const pts=[];
    values.forEach((v,i)=>pts.push([i+1,Number.isFinite(v)?v:0]));
    return{type:'bar',points:pts,color,gap:.72,tip:d=>{
      const i=Math.round(d[0])-1,v=values[i];
      return[`位置 ${i+1}：${v===null?'NA':fmt(v,6)}`,v===null?'Position '+(i+1)+': NA':'Position '+(i+1)+': '+fmt(v,6)];
    }};
  }
  function naPoints(values,color){
    const pts=[];values.forEach((v,i)=>{if(v===null)pts.push([i+1,0]);});return{type:'scatter',points:pts,color,radius:6,tip:d=>[`位置 ${Math.round(d[0])} 是缺失值 NA`,'Position '+Math.round(d[0])+' is a missing value (NA)']};
  }
  function structDiagram(s){
    const cells=[],W=600,H=385;
    let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('数据结构示意','Data structure diagram'))}">`;
    const title=(x,y,text)=>`<text x="${x}" y="${y}" font-size="12" fill="#566d7c">${esc(text)}</text>`;
    const box=(x,y,w,h,fill,stroke)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${fill}" stroke="${stroke}"/>`;
    const on=k=>focus===k;
    /* vector: one row, wraps at 8 */
    let y=34;
    svg+=title(20,y-10,'vector  length = '+s.vector.length+'  typeof = "double"');
    const cw=Math.min(58,(560-7*6)/Math.min(8,s.vector.length)),per=Math.min(8,s.vector.length);
    s.vector.forEach((v,i)=>{
      const r=Math.floor(i/per),c=i%per,x=20+c*(cw+6),yy=y+r*40;
      svg+=box(x,yy,cw,32,on('vector')?'#e9edf4':'#f4f7f9',on('vector')?'#8c80a3':'#dce5e9');
      svg+=`<text x="${x+cw/2}" y="${yy+21}" text-anchor="middle" font-size="11" fill="#4b5f6e">${v}</text>`;
      svg+=`<text x="${x+cw/2}" y="${yy+43}" text-anchor="middle" font-size="9" fill="#8a9ca6">[${i+1}]</text>`;
    });
    y+=Math.ceil(s.vector.length/per)*40+26;
    /* matrix */
    svg+=title(20,y-8,`matrix  ${s.rows} × ${s.cols}  dim = c(${s.rows}, ${s.cols})`);
    const mw=Math.min(58,(560-(s.cols-1)*6)/s.cols);
    for(let r=0;r<s.rows;r++)for(let c=0;c<s.cols;c++){
      const cell=s.cells.find(x=>x.r===r&&x.c===c);const x=20+c*(mw+6),yy=y+r*34;
      svg+=box(x,yy,mw,28,on('matrix')?'#f0ecef':'#f7f9fa',on('matrix')?'#b09fb4':'#e3e9ed');
      if(cell)svg+=`<text x="${x+mw/2}" y="${yy+19}" text-anchor="middle" font-size="11" fill="#4b5f6e">${cell.value}</text>`;
    }
    y+=s.rows*34+26;
    /* data frame + list side by side */
    const half=280;
    svg+=title(20,y-8,`data.frame  ${s.df.length} × 3`);
    const fw=(half-20)/3;
    s.frameCols.forEach((c,i)=>{svg+=box(20+i*fw,y,fw-4,26,on('data.frame')?'#e9edf4':'#f1f4f6','#dce5e9');svg+=`<text x="${20+i*fw+(fw-4)/2}" y="${y+17}" text-anchor="middle" font-size="10" fill="#4b5f6e">${esc(c.name)}</text>`;svg+=`<text x="${20+i*fw+(fw-4)/2}" y="${y-10}" text-anchor="middle" font-size="9" fill="#8a9ca6">${c.type}</text>`;});
    s.df.forEach((row,r)=>{const yy=y+30+r*26;const vals=[row.date,row.ret,row.price];vals.forEach((v,i)=>{svg+=box(20+i*fw,yy,fw-4,22,on('data.frame')?'#f2eff4':'#fafbfc','#e3e9ed');svg+=`<text x="${20+i*fw+(fw-4)/2}" y="${yy+15}" text-anchor="middle" font-size="10" fill="#4b5f6e">${esc(String(v))}</text>`;});});
    svg+=title(320,y-8,'list  3 elements');
    s.list.forEach((item,i)=>{const yy=y+i*34;svg+=box(320,yy,260,28,on('list')?'#eef1ea':'#f6f8f9',on('list')?'#9aa885':'#e3e9ed');svg+=`<text x="330" y="${yy+18}" font-size="10" fill="#5b6f7d">${esc('$ '+item.key)} · ${esc(item.type)}</text>`;});
    svg+=`<text x="300" y="${H-12}" text-anchor="middle" font-size="10" fill="#8a9ca6">${esc(t('高亮框为当前重点容器；四者共用同一组数值','The highlighted frame is the focus; all four share one set of numbers'))}</text>`;
    svg+='</svg>';
    svgHost().innerHTML=svg;
  }
  function boxPlot(g){
    const W=600,H=385,l=60,r=20,top=30,bot=60;
    const lo=Math.min(g.five.min,g.fences.lo),hi=Math.max(g.five.max,g.fences.hi);
    const pad=(hi-lo)*.06||.01,x0=lo-pad,x1=hi+pad;
    const sx=v=>l+(v-x0)/(x1-x0)*(W-l-r),y=(top+H-bot)/2;
    let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('箱线图','Box plot'))}">`;
    for(let i=0;i<=5;i++){const v=x0+(x1-x0)*i/5;svg+=`<path class="chart-grid" d="M${sx(v)},${top}V${H-bot}"/><text x="${sx(v)}" y="${H-bot+18}" text-anchor="middle">${esc(fmt(v,3))}</text>`;}
    svg+=`<path d="M${sx(lo)},${y}H${sx(g.five.min)}" stroke="#8c9ba6"/><path d="M${sx(g.five.min)},${y-14}V${y+14}" stroke="#8c9ba6"/>`;
    svg+=`<path d="M${sx(g.five.max)},${y}H${sx(hi)}" stroke="#8c9ba6"/><path d="M${sx(g.five.max)},${y-14}V${y+14}" stroke="#8c9ba6"/>`;
    svg+=`<rect x="${sx(g.five.q1)}" y="${y-26}" width="${sx(g.five.q3)-sx(g.five.q1)}" height="52" fill="#e6eef2" stroke="#6689a8" rx="3"/>`;
    svg+=`<path d="M${sx(g.five.median)},${y-26}V${y+26}" stroke="#4e718e" stroke-width="2.5"/>`;
    const out=g.returns.filter(v=>v<g.fences.lo||v>g.fences.hi);
    svg+=out.map(v=>`<circle cx="${sx(v)}" cy="${y}" r="4" fill="#b5816f" opacity=".8"><title>${esc(fmt(v,4))}</title></circle>`).join('');
    [['min',g.five.min],['Q1',g.five.q1],['median',g.five.median],['Q3',g.five.q3],['max',g.five.max]].forEach(([k,v],i)=>{svg+=`<text x="${sx(v)}" y="${y+52+(i%2)*14}" text-anchor="middle" font-size="10" fill="#7a8b96">${k} ${esc(fmt(v,3))}</text>`;});
    svg+=`<text x="${(l+W-r)/2}" y="${H-12}" text-anchor="middle" font-size="10" fill="#8a9ca6">${esc(t('虚线外为 1.5 IQR 规则标出的点，共 ','Points outside the 1.5 IQR fences: '))}${out.length}</text>`;
    svg+='</svg>';
    svgHost().innerHTML=svg;
  }
  function packageFlow(){
    const steps=[['声明依赖','Declare'],['检查可用','Check'],['按需安装','Install if needed'],['加载使用','Load'],['记录版本','Record version']];
    K.flow(svgHost(),steps.map((s,i)=>[s[0],s[1],i===1?'requireNamespace':i===4?'sessionInfo':null]),1);
  }
  function aiFlow(){
    const steps=[['AI 生成草稿','AI draft'],['人工审查','Human review'],['运行验证','Execute'],['记录留痕','Record']];
    K.flow(svgHost(),steps.map((s,i)=>[s[0],s[1],i===0?'draft':null]),1);
  }
  function chart(){
    if(view==='env'){
      frameTitle().textContent=t('会话工作流 · 当前步骤高亮','Session workflow · current step highlighted');
      const w=M.workspace(p);
      K.flow(svgHost(),w.steps.map((s,i)=>[s[0],s[1],null]),w.step);
    }else if(view==='struct'){
      frameTitle().textContent=t('四种容器的结构对照','Structure of the four containers');
      structDiagram(q);
    }else if(view==='index'){
      frameTitle().textContent=t('向量取值与缺失位置','Vector values and missing positions');
      K.chart(svgHost(),{yZero:true,yLabel:['取值','Value'],xLabel:['元素位置','Element position'],
        series:[barsFor(q.vector,'#6689a8'),naPoints(q.vector,'#b5816f')],
        refs:[{axis:'y',value:q.median,color:'#9b88ac',label:['中位数','median']}],
        aria:['向量取值与缺失位置','Vector values and missing positions']});
    }else if(view==='func'){
      frameTitle().textContent=t('累计均值与 ±1.96 SE 带','Running mean with the ±1.96 SE band');
      const mc=q,pts=(arr)=>arr.map((v,i)=>[i+1,v]);
      K.chart(svgHost(),{yLabel:['累计均值','Running mean'],xLabel:['重复次数 b','Replication b'],yZero:false,
        series:[{type:'line',points:pts(mc.running.map(v=>v)),color:'#6689a8',tip:d=>[`第 ${Math.round(d[0])} 次：${fmt(d[1],6)}`,'b = '+Math.round(d[0])+': '+fmt(d[1],6)]},
          {type:'line',points:pts(mc.running.map((v,i)=>mc.mu+mc.band[i])),color:'#9b88ac',dash:true,width:1.4},
          {type:'line',points:pts(mc.running.map((v,i)=>mc.mu-mc.band[i])),color:'#9b88ac',dash:true,width:1.4}],
        refs:[{axis:'y',value:mc.mu,color:'#659b8a',dash:false,label:['真值 μ','true μ']}],
        aria:['累计均值收敛路径','Running-mean convergence path']});
    }else if(view==='plot'){
      const kind=p.kind;
      if(kind==='box'){frameTitle().textContent=t('箱线图与 1.5 IQR 围栏','Box plot and the 1.5 IQR fences');boxPlot(q);}
      else if(kind==='qq'){frameTitle().textContent=t('QQ 图：样本分位 vs 正态分位','QQ plot: sample vs normal quantiles');
        K.chart(svgHost(),{xLabel:['标准正态分位','Standard normal quantile'],yLabel:['样本收益','Sample return'],yZero:true,
          series:[{type:'scatter',points:q.qq.map(d=>[d.x,d.y]),color:'#6689a8',radius:3.2,tip:d=>[`z = ${fmt(d[0],3)}；r = ${pct(d[1])}`,'z = '+fmt(d[0],3)+'; r = '+pct(d[1])]},
            {type:'line',points:[[q.qq[0].x,q.mean+q.sd*q.qq[0].x],[q.qq.at(-1).x,q.mean+q.sd*q.qq.at(-1).x]],color:'#659b8a',dash:true}],
          aria:['QQ 图','QQ plot']});}
      else if(kind==='series'){frameTitle().textContent=t('合成月度收益序列','Synthetic monthly return series');
        K.chart(svgHost(),{xLabel:['月份','Month'],yLabel:['简单收益','Simple return'],yZero:true,
          series:[{type:'line',points:q.series.map(d=>[d.x,d.y]),color:'#6689a8',tip:d=>[`第 ${d[0]} 月：${pct(d[1])}`,'Month '+d[0]+': '+pct(d[1])]}],
          refs:[{axis:'y',value:0,color:'#b9c7cf',dash:false}],aria:['合成收益序列','Synthetic return series']});}
      else{frameTitle().textContent=t('直方图与同参数正态密度','Histogram with the matching normal density');
        K.chart(svgHost(),{yZero:true,xLabel:['收益率','Return'],yLabel:['频数','Count'],
          series:[{type:'bar',points:q.bins.map(b=>[b.x,b.y]),color:'#6689a8',gap:.92,tip:d=>[`区间中心 ${pct(d[0])}：${Math.round(d[1])} 个观测`,'Bin centre '+pct(d[0])+': '+Math.round(d[1])+' observations']},
            {type:'line',points:q.density.map(b=>[b.x,b.y]),color:'#9b88ac',width:2}],
          aria:['收益直方图','Return histogram']});}
    }else if(view==='pkg'){
      frameTitle().textContent=t('依赖处理流程','Dependency workflow');packageFlow();
    }else{
      frameTitle().textContent=t('AI 辅助编程流程','AI-assisted coding workflow');aiFlow();
    }
  }
  function model(){
    if(view==='env'){
      const w=M.workspace(p);
      K.metrics([['当前步骤','Current step',`${w.step+1} / ${w.steps.length}`],['工作目录','Working directory','finmodel-lab'],['目录','Folders',String(w.dirs.length)]]);
      K.legend([['脚本步骤','Script step','#8c80a3',false],['尚未执行','Not yet','#b9c7cf',false]]);
      K.details(K.table([['项目','Item'],['输出','Output']],[
        ['getwd()',w.dirs[0]+'/ …'],
        ['sessionInfo()',t('R 版本与已加载包','R version and loaded packages')],
        ['set.seed()',String(w.seed)],
        [t('脚本拆分','Script split'),w.files.join(' · ')]
      ]));
      K.graphKind('R 会话 · 合成示例','R session · synthetic example');
    }else if(view==='struct'){
      const s=q;
      K.metrics([['元素个数','Elements',String(s.vector.length)],['矩阵形状','Matrix shape',`${s.rows} × ${s.cols}`],['列表元素','List elements',String(s.list.length)]]);
      K.legend([['向量','Vector','#6689a8',false],['矩阵','Matrix','#b09fb4',false],['数据框','Data frame','#8c80a3',false],['列表','List','#9aa885',false]]);
      K.details(K.table([['对象','Object'],['class()'],['str() 摘要','str() summary']],[
        ['v','double',`length ${s.vector.length}`],
        ['m','matrix',`dim ${s.rows} ${s.cols}`],
        ['l','list',`${s.list.length} elements`],
        ['df','data.frame',`${s.df.length} obs. of 3 variables`]
      ]));
      K.graphKind('数据结构 · 同一组数值','Data structures · one dataset');
    }else if(view==='index'){
      K.metrics([['mean(x)','mean(x)',q.meanWithNa===null?'NA':fmt(q.meanWithNa,6)],['mean(x, na.rm)','mean(x, na.rm)',fmt(q.meanNaRm,6)],['缺失个数','Missing',String(q.naCount)]]);
      K.legend([['非缺失取值','Non-missing','#6689a8',false],['NA 位置','NA position','#b5816f',false],['中位数','Median','#9b88ac',true]]);
      K.details(K.table([['表达式','Expression'],['结果','Result']],[
        ['sum(is.na(x))',String(q.naCount)],
        ['which(is.na(x))',q.naIdx.join(', ')],
        [`x[x > ${q.threshold}]`,`${q.above} `+t('个元素','elements')],
        ['median(x, na.rm = TRUE)',fmt(q.median,6)],
        [t('填补后均值','Filled mean'),fmt((q.meanNaRm*q.clean.length+q.median*q.naCount)/q.n,6)]
      ]));
      K.graphKind('索引与缺失 · 合成向量','Indexing and NA · synthetic vector');
    }else if(view==='func'){
      const mc=q;
      K.metrics([['累计均值终点','Final running mean',fmt(mc.final,6)],['单次标准误','SE per replication',fmt(mc.se,6)],['循环迭代总数','Loop iterations',String(mc.loopCost)]]);
      K.legend([['累计均值','Running mean','#6689a8',false],['±1.96 SE 带','±1.96 SE band','#9b88ac',true],['真值 μ','True μ','#659b8a',false]]);
      K.details(K.table([['统计量','Statistic'],['数值','Value']],[
        [t('真值 μ','True μ'),fmt(mc.mu,6)],
        [t('重复次数 B','Replications B'),String(mc.draws_n)],
        ['SE = σ/√n',fmt(mc.se,6)],
        [t('落在显示带内的比例','Share inside the display band'),pct(mc.coverage,1)]
      ])+`<p class="chart-note">${esc(t('累计均值高度自相关，带内比例不能当覆盖率检验。','The running mean is strongly autocorrelated, so that share is not a coverage test.'))}</p>`);
      K.graphKind('编程计算 · 确定性样本','Computation · deterministic sample');
    }else if(view==='plot'){
      const g=q;
      K.metrics([['均值','Mean',pct(g.mean)],['标准差','Std. dev.',pct(g.sd)],['超额峰度','Excess kurtosis',fmt(g.kurt,3)]]);
      K.legend([['收益样本','Return sample','#6689a8',false],['正态参照','Normal reference','#9b88ac',true]]);
      K.details(K.table([['统计量','Statistic'],['数值','Value']],[
        [t('偏度','Skewness'),fmt(g.skew,4)],
        [t('超额峰度','Excess kurtosis'),fmt(g.kurt,4)],
        [t('1.5 IQR 下围栏','Lower 1.5 IQR fence'),pct(g.fences.lo)],
        [t('1.5 IQR 上围栏','Upper 1.5 IQR fence'),pct(g.fences.hi)],
        [t('围栏外点数','Points outside the fences'),String(g.outliers)]
      ])+`<p class="chart-note">${esc(t('固定种子的合成收益，共 ','Synthetic returns from a fixed seed, n = '))}${g.returns.length}${esc(t(' 个观测。',' observations.'))}</p>`);
      K.graphKind('基础绘图 · 合成收益','Base graphics · synthetic returns');
    }else if(view==='pkg'){
      const installed=M.PACKAGES.filter(x=>x.base),extra=M.PACKAGES.filter(x=>!x.base);
      K.metrics([['基础包','Base packages',String(installed.length)],['额外包','Extra packages',String(extra.length)],['安装策略','Install policy',t('按需','On demand')]]);
      K.legend([['随 R 安装','Ships with R','#659b8a',false],['需要安装','Requires install','#b5816f',true]]);
      K.details(K.table([['包','Package'],['用途','Role'],['状态','Status']],M.PACKAGES.map(x=>[x.name,t(...x.role),x.base?t('随 R 安装','Built in'):t('需要安装','Extra')])));
      K.graphKind('程序包 · 依赖流程','Packages · dependency workflow');
    }else{
      K.metrics([['审查条目','Review items',String(q.checks)],['年化口径 252','Annualised × 252',fmt(q.annual,4)],['按月口径 12','Monthly × 12',fmt(q.monthly,4)]]);
      K.legend([['草稿问题','Draft issue','#b5816f',true],['审查后','Reviewed','#659b8a',false]]);
      K.details(K.table([['审查项','Review item'],['结论','Verdict']],M.AI_REVIEW.map(r=>[t(r.zh,r.en),t('已修正','Fixed')]))+`<p class="chart-note">${esc(t('审查结论需写进实验报告；本页只演示审查过程。','The verdict belongs in the lab report; this page only demonstrates the review.'))}</p>`);
      K.graphKind('AI 辅助编程 · 审查流程','AI-assisted coding · review');
    }
  }
  function code(){
    built=C.build(p,view,mode,K.lang());
    if(!built.blocks.some(b=>b.key===active))active=built.blocks[0].key;
    active=K.code(built.blocks,active,key=>{active=key;code();});
    K.modeButtons(mode,{basic:true});
    K.notice(mode==='basic'?t('关键逻辑：可独立运行的最小脚本','Key logic: the smallest standalone script'):t('完整脚本：含检查、输出与绘图','Full script: checks, output and plotting'));
  }
  function render(rebuildParams=false){
    if(rebuildParams)paramHTML();
    try{p=readParams();$('#validation').textContent='';}
    catch(e){$('#validation').textContent=e.message;return;}
    tabs.refresh(M.views,view);
    tabs.setQuestion(...questions[view]);
    tabs.setActive(view);
    K.assumptions(summary[view],assumptions[view]);
    q=view==='env'?M.workspace(p):view==='struct'?M.structures(p):view==='index'?M.indexing(p):view==='func'?M.monteCarlo(p):view==='plot'?M.graphicsData(p):view==='pkg'?{checks:0}:M.ai(p);
    model();chart();code();
  }
  K.onLang(()=>render(true));
  $('#inputs').addEventListener('input',()=>render(false));
  $('#inputs').addEventListener('change',()=>render(false));
  K.chrome({
    getCode:()=>C.build(p,view,'full',K.lang()).code,
    onReset:()=>{p={...M.defaults};focus='data.frame';active=null;render(true);},
    onMode:m=>{mode=m;render(false);},
    teacher:['七个小节对应大纲的"R 工作环境、数据结构、常用命令、图形制作、编程计算、常用程序包"与 AI 辅助编程。建议顺序：环境 → 数据结构 → 索引 → 计算 → 图形 → 程序包 → AI 审查。每一节先让学生预测输出，再运行脚本核对。AI 一节务必让学生指出草稿的三处缺陷，而不是直接接受生成结果。',
      'The seven sections follow the syllabus: workspace, data structures, common commands, graphics, computation, packages and AI-assisted coding. Recommended order: workspace → structures → indexing → computation → graphics → packages → AI review. Have students predict the output before running the script. In the AI section they must name the three defects of the draft rather than accept it.'],
    help:['页面本身不执行 R。每节的完整脚本可复制到 RStudio 整段运行，只依赖 base R。左侧代码按"逻辑块"分组，点击任意一行查看该语句的作用、公式与金融含义。右上角可切换中文/English，数值与脚本在切换时保持不变。',
      'The page does not run R. Each section produces a standalone base-R script you can paste into RStudio. The left pane groups code into logic blocks; click any line to see its role, formula and meaning. The language switch keeps numbers and scripts identical.'],
    practice:['新建 R Script，复制完整脚本并整段运行。依次核对：length/typeof 与网页一致；mean(x) 为 NA 而 mean(x, na.rm = TRUE) 有数值；累计均值终点与网页显示一致；plot 类函数的输出与网页图形同形。最后把 sessionInfo() 的输出附到实验报告。',
      'Create a new R Script, paste the whole script and run it. Check in order: length/typeof match the page; mean(x) is NA while mean(x, na.rm = TRUE) returns a number; the final running mean matches; the base plots have the same shape. Attach the sessionInfo() output to the report.'],
    fileName:'experiment01-r-basics.R'
  });
  render(true);
  window.RBasicLab={snapshot:()=>({model:'rbasic',view,p,mode,code:C.build(p,view,'full',K.lang()).code.slice(0,80)})};
}
window.RBasicWorkbench={mount};
})();
