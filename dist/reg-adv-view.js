/* Experiment04 拓展视图：优化理论与方法（4+5 第四节）与经济计量分析（第二节）。 */
(()=>{'use strict';
const K=window.LabKit,$=s=>document.querySelector(s),t=(zh,en)=>K.t(zh,en);
const O=()=>window.RegOptMath,E=()=>window.RegEconMath;
const state={view:'opt',opt:{...window.RegOptMath.defaults},econ:{...window.RegEconMath.defaults},
  optMode:'lp',econMode:'logit',built:null,last:null,mode:'full'};
function controls(){
  const view=state.view;let host=$('#regAdvControls');
  if(!host){host=document.createElement('section');host.id='regAdvControls';$('#inputs').append(host);
    host.addEventListener('input',()=>{if(read())paint();});
    host.addEventListener('change',()=>{if(read())paint();});
    host.addEventListener('click',e=>{const b=e.target.closest('[data-adv-mode]');if(b){
      if(state.view==='opt')state.optMode=b.dataset.advMode;else state.econMode=b.dataset.advMode;
      controls();paint();}});
  }
  const p=view==='opt'?state.opt:state.econ;
  const modes=view==='opt'?[['lp','线性规划'],['gp','目标规划'],['nlp','非线性规划']]:[['logit','二元选择'],['kmeans','聚类'],['pca','因子分析']];
  const mode=view==='opt'?state.optMode:state.econMode;
  let body='';
  if(view==='opt'&&mode==='lp')body=K.field({id:'c1',zh:'目标系数 c₁',en:'Objective c₁',value:p.c1,step:.5})+K.field({id:'c2',zh:'目标系数 c₂',en:'Objective c₂',value:p.c2,step:.5})+
    K.field({id:'a11',zh:'约束1 · x₁ 系数',en:'Constraint 1 · x₁',value:p.a11,min:0,step:.5})+K.field({id:'a12',zh:'约束1 · x₂ 系数',en:'Constraint 1 · x₂',value:p.a12,min:0,step:.5})+
    K.field({id:'b1',zh:'约束1 · 右端项',en:'Constraint 1 · RHS',value:p.b1,min:.5,step:.5})+K.field({id:'a21',zh:'约束2 · x₁ 系数',en:'Constraint 2 · x₁',value:p.a21,min:0,step:.5})+
    K.field({id:'a22',zh:'约束2 · x₂ 系数',en:'Constraint 2 · x₂',value:p.a22,min:0,step:.5})+K.field({id:'b2',zh:'约束2 · 右端项',en:'Constraint 2 · RHS',value:p.b2,min:.5,step:.5});
  if(view==='opt'&&mode==='gp')body=K.field({id:'g1',zh:'目标 1 的目标值',en:'Goal 1 target',value:p.g1,min:1,step:5})+K.field({id:'g2',zh:'目标 2 的目标值',en:'Goal 2 target',value:p.g2,min:1,step:5})+
    K.field({id:'w1',zh:'目标 1 权重',en:'Goal 1 weight',value:p.w1,min:.1,step:.1})+K.field({id:'w2',zh:'目标 2 权重',en:'Goal 2 weight',value:p.w2,min:.1,step:.1})+
    K.field({id:'xlo',zh:'决策变量下限',en:'Lower bound',value:p.xlo,step:5})+K.field({id:'xhi',zh:'决策变量上限',en:'Upper bound',value:p.xhi,step:5});
  if(view==='opt'&&mode==='nlp')body=K.field({id:'rho',zh:'罚项强度 ρ',en:'Penalty ρ',value:p.rho,min:1,max:200,step:1})+K.field({id:'target',zh:'约束 x+y ≥',en:'Constraint x+y ≥',value:p.target,step:.5})+
    K.field({id:'x0',zh:'初始 x',en:'Initial x',value:p.x0,min:-1,max:3,step:.5})+K.field({id:'y0',zh:'初始 y',en:'Initial y',value:p.y0,min:-1,max:3,step:.5})+
    K.field({id:'steps',zh:'迭代步数',en:'Steps',value:p.steps,min:1,max:200,step:1});
  if(view==='econ'&&mode==='logit')body=K.field({id:'n',zh:'样本量',en:'Sample size',value:p.n,min:80,max:800,step:20})+K.field({id:'b0',zh:'真实 β₀',en:'True β₀',value:p.b0,min:-2,max:2,step:.1})+
    K.field({id:'b1',zh:'真实 β₁',en:'True β₁',value:p.b1,min:.1,max:4,step:.1})+K.field({id:'noise',zh:'潜在变量噪声',en:'Latent noise',value:p.noise,min:.1,max:2,step:.1})+
    K.field({id:'seed',zh:'随机种子',en:'Random seed',value:p.seed,min:1,max:99999999,step:1});
  if(view==='econ'&&mode==='kmeans')body=K.field({id:'points',zh:'样本量',en:'Sample size',value:p.points,min:40,max:300,step:10})+K.field({id:'k',zh:'聚类数 k',en:'Clusters k',value:p.k,min:2,max:5,step:1})+
    K.field({id:'seed',zh:'随机种子',en:'Random seed',value:p.seed,min:1,max:99999999,step:1});
  if(view==='econ'&&mode==='pca')body=K.field({id:'factors',zh:'变量数',en:'Variables',value:p.factors,min:3,max:8,step:1})+K.field({id:'obs',zh:'观测数',en:'Observations',value:p.obs,min:60,max:400,step:20})+
    K.field({id:'kappa',zh:'公共因子强度',en:'Common-factor strength',value:p.kappa,min:0,max:.98,step:.02})+K.field({id:'seed',zh:'随机种子',en:'Random seed',value:p.seed,min:1,max:99999999,step:1});
  host.innerHTML=`<h3>${K.esc(view==='opt'?t('优化方法参数','Optimization settings'):t('计量模型参数','Econometric settings'))}</h3>
    <div class="lab-view-controls" style="padding:0 0 8px">${modes.map(([k,l])=>`<button type="button" data-adv-mode="${k}" aria-pressed="${k===mode}">${K.esc(t(l,{lp:'Linear programming',gp:'Goal programming',nlp:'Nonlinear programming',logit:'Binary choice',kmeans:'Clustering',pca:'Factor analysis'}[k]))}</button>`).join('')}</div>
    ${body}
    ${K.tasks(view==='opt'?[['先手算一个顶点，再用单纯形表核对。','Work out one vertex by hand and check it against the simplex tableau.'],
      ['把目标系数 c₁ 调小，观察最优顶点何时切换。','Lower c₁ and watch when the optimal vertex switches.'],
      ['把 ρ 从 10 调到 200，观察最终点是否更贴近约束边界。','Raise ρ from 10 to 200 and see whether the final point moves onto the constraint boundary.']]
      :[['先预测：probit 的系数应该比 logit 大还是小？','Predict first: should the probit coefficient be larger or smaller than the logit one?'],
        ['把噪声调大，观察 McFadden 伪 R² 与命中率如何下降。','Increase the noise and watch McFadden pseudo-R² and the hit rate fall.'],
        ['改变聚类数 k，说明组内平方和为什么一定下降。','Change the number of clusters and explain why within-cluster SS must fall.']])}`;
  sync();return host;
}
function sync(){const p=state.view==='opt'?state.opt:state.econ;for(const [k,v] of Object.entries(p)){const el=$('#lab-'+k);if(el&&document.activeElement!==el)el.value=v;}}
function read(){
  const view=state.view,next={...state.view==='opt'?state.opt:state.econ};
  for(const el of $('#regAdvControls').querySelectorAll('input')){
    const id=el.id.replace(/^lab-/,'');const v=Number(el.value);
    if(el.value.trim()===''||!Number.isFinite(v)){$('#validation').textContent=t('请输入有效数值。','Enter a valid number.');return null;}
    next[id]=v;
  }
  try{(view==='opt'?O():E()).check(next);}catch(e){$('#validation').textContent=e.message;return null;}
  if(view==='opt')state.opt=next;else state.econ=next;
  return next;
}
function paint(){
  const view=state.view,mode=view==='opt'?state.optMode:state.econMode,p=view==='opt'?state.opt:state.econ;
  const host=$('#regPlot')||document.querySelector('#chartHost');
  host.innerHTML='<div class="chart-host single-chart"><div class="chart-frame"><h3></h3><div class="svg-host"></div></div></div>';
  const svg=host.querySelector('.svg-host'),title=host.querySelector('h3');
  try{
    let q;
    if(view==='opt'&&mode==='lp'){
      q=O().lp(p);state.last=q;
      title.textContent=t('可行域、顶点与最优解','Feasible region, vertices and the optimum');
      const x1max=Math.max(p.b1/p.a11,p.b2/p.a21,1)*1.15;
      const line=(A,B)=>({type:'line',points:[[0,B],[x1max,Math.max(0,B-A*x1max)]]});
      K.chart(svg,{xLabel:['x₁','x₁'],yLabel:['x₂','x₂'],yZero:true,xTicks:4,yTicks:4,
        series:[line(p.a11/p.a12,p.b1/p.a12),line(p.a21/p.a22,p.b2/p.a22),
          {type:'scatter',points:q.feasible.map(v=>[v.x1,v.x2]),color:'#659b8a',radius:5},
          {type:'scatter',points:[[q.x[0],q.x[1]]],color:'#b5816f',radius:8,tip:()=>[`最优：(${q.x[0].toFixed(2)}, ${q.x[1].toFixed(2)})，z=${q.z.toFixed(2)}`,`Optimum: (${q.x[0].toFixed(2)}, ${q.x[1].toFixed(2)}), z=${q.z.toFixed(2)}`]}],
        aria:['线性规划可行域','LP feasible region']});
      K.metrics([['最优目标 z','Optimal z',q.z.toFixed(3)],['单纯形迭代','Simplex iterations',String(q.iterations)],['最优解','Optimum',`(${q.x[0].toFixed(2)}, ${q.x[1].toFixed(2)})`]]);
      K.legend([['约束1','Constraint 1','#6689a8',false],['约束2','Constraint 2','#9b88ac',false],['可行顶点','Feasible vertex','#659b8a',false],['最优解','Optimum','#b5816f',false]]);
      K.details(K.table([['迭代','Iter'],['基变量','Basis'],['目标值 z','Objective']],q.trace.map(tr=>[String(tr.iter),tr.basis.map(b=>b<2?'x'+(b+1):'s'+(b-1)).join(', '),tr.z.toFixed(4)]))+
        `<p class="chart-note">${K.esc(t('入基取目标行最负系数，出基用最小比值检验；两约束交点与坐标轴交点共同构成可行顶点。','The entering column is the most negative objective coefficient and the leaving row uses the minimum ratio; the constraint intersection and the axis intercepts form the feasible vertices.'))}</p>`);
      state.built=O().build('lp',p,q,K.lang());
    }else if(view==='opt'&&mode==='gp'){
      q=O().gp(p);state.last=q;
      title.textContent=t('加权偏差代价与折中点','Weighted deviation cost and the compromise point');
      K.chart(svg,{xLabel:['决策变量 x','Decision x'],yLabel:['加权偏差','Weighted deviation'],
        series:[{type:'line',points:q.curve.map(c=>[c.v,c.c]),color:'#6689a8',tip:d=>[`x=${d[0].toFixed(0)}：代价 ${d[1].toFixed(1)}`,'x='+d[0].toFixed(0)+': cost '+d[1].toFixed(1)]}],
        refs:[{axis:'x',value:q.x,color:'#b5816f',label:['折中解','compromise']},{axis:'x',value:p.g1,color:'#9b88ac',dash:true},{axis:'x',value:p.g2,color:'#9b88ac',dash:true}],
        aria:['目标规划代价','Goal-programming cost']});
      K.metrics([['折中解 x*','Compromise x*',q.x.toFixed(2)],['加权偏差','Weighted deviation',q.cost.toFixed(2)],['目标数','Goals','2']]);
      K.legend([['加权偏差','Weighted deviation','#6689a8',false],['折中解','Compromise','#b5816f',false],['目标值','Goals','#9b88ac',true]]);
      K.details(K.table([['目标','Goal'],['目标值','Target'],['实现值','Achieved'],['d⁺','d⁺'],['d⁻','d⁻']],q.dev.map(d=>[t('目标','Goal')+' '+(q.dev.indexOf(d)+1),d.g.toFixed(1),d.achieved.toFixed(2),d.dPlus.toFixed(2),d.dMinus.toFixed(2)]))+
        `<p class="chart-note">${K.esc(t('一维加权绝对偏差的最小值落在加权中位数上；权重越大，解越靠近该目标。','The one-dimensional weighted absolute deviation is minimised at the weighted median; a larger weight pulls the solution towards that goal.'))}</p>`);
      state.built=O().build('gp',p,q,K.lang());
    }else if(view==='opt'&&mode==='nlp'){
      q=O().nlp(p);state.last=q;
      title.textContent=t('梯度下降路径与约束边界','Gradient-descent path and the constraint boundary');
      K.chart(svg,{xLabel:['x','x'],yLabel:['y','y'],yZero:true,
        series:[{type:'line',points:q.path.map(v=>[v.x,v.y]),color:'#6689a8',marker:true,tip:d=>[`(${d[0].toFixed(2)}, ${d[1].toFixed(2)})`,'('+d[0].toFixed(2)+', '+d[1].toFixed(2)+')']},
          {type:'line',points:[[-0.5,p.target+0.5],[2.5,p.target-2.5]],color:'#9b88ac',dash:true}],
        aria:['梯度下降路径','Gradient-descent path']});
      K.metrics([['最终点 x','Final x',q.x.toFixed(3)],['最终点 y','Final y',q.y.toFixed(3)],['梯度范数','Gradient norm',q.gradient.toExponential(2)]]);
      K.legend([['迭代路径','Path','#6689a8',false],['约束边界','Constraint','#9b88ac',true]]);
      K.details(K.table([['项目','Item'],['数值','Value']],[
        [t('目标函数值','Objective'),q.f.toExponential(3)],[t('约束余量 x+y−target','Constraint slack'),q.constraint.toFixed(4)],
        [t('罚项强度 ρ','Penalty ρ'),String(q.penalty)],[t('迭代步数','Steps'),String(q.path.length-1)]])+
        `<p class="chart-note">${K.esc(t('罚函数法把约束变成目标的一部分：ρ 越大越贴近硬约束，但梯度尺度变大、收敛更慢。','The penalty method folds the constraint into the objective: a larger ρ approaches a hard constraint but scales the gradient and slows convergence.'))}</p>`);
      state.built=O().build('nlp',p,q,K.lang());
    }else if(view==='econ'&&mode==='logit'){
      q=E().binary(p);state.last=q;
      title.textContent=t('Logit 与 Probit 拟合概率','Logit and probit fitted probabilities');
      K.chart(svg,{xLabel:['x','x'],yLabel:['P(y=1)','P(y=1)'],yZero:false,
        series:[{type:'scatter',points:q.rows.map(r=>[r.x,r.y]),color:'#c9d3da',radius:2.4,opacity:.6},
          {type:'line',points:q.logit.curve.map(c=>[c.x,c.p]),color:'#6689a8'},
          {type:'line',points:q.probit.curve.map(c=>[c.x,c.p]),color:'#9b88ac',dash:true}],
        aria:['二元选择拟合','Binary-choice fit']});
      K.metrics([['Logit β₁','Logit β₁',q.logit.beta[1].toFixed(3)],['Probit β₁','Probit β₁',q.probit.beta[1].toFixed(3)],['McFadden R²','McFadden R²',q.logit.mcfadden.toFixed(3)]]);
      K.legend([['样本点','Observations','#c9d3da',false],['Logit','Logit','#6689a8',false],['Probit','Probit','#9b88ac',true]]);
      K.details(K.table([['模型','Model'],['β₀','β₀'],['β₁','β₁'],['伪 R²','Pseudo R²'],['命中率','Hit rate']],[
        ['Logit',q.logit.beta[0].toFixed(3),q.logit.beta[1].toFixed(3),q.logit.mcfadden.toFixed(3),K.pct(q.logit.hit,1)],
        ['Probit',q.probit.beta[0].toFixed(3),q.probit.beta[1].toFixed(3),q.probit.mcfadden.toFixed(3),K.pct(q.probit.hit,1)]])+
        `<p class="chart-note">${K.esc(t('真值 β₀,β₁ 已用于生成潜在变量；Logit 与 Probit 的系数尺度不同，不能直接比大小。','The true β₀ and β₁ generate the latent variable; logit and probit coefficients live on different scales and cannot be compared directly.'))}</p>`);
      state.built=E().build('logit',p,q,K.lang());
    }else if(view==='econ'&&mode==='kmeans'){
      q=E().cluster(p);state.last=q;
      title.textContent=t('聚类结果与中心','Cluster assignments and centres');
      const colors=['#6689a8','#9b88ac','#659b8a','#b5816f','#7f9182'];
      const series=Array.from({length:q.k},(_,j)=>({type:'scatter',points:q.rows.filter((_,i)=>q.assign[i]===j).map(r=>[r.x,r.y]),color:colors[j%5],radius:3.2}));
      series.push({type:'scatter',points:q.centroids.map(c=>[c[0],c[1]]),color:'#293e4d',radius:7,opacity:1});
      K.chart(svg,{xLabel:['x','x'],yLabel:['y','y'],yZero:true,series,aria:['聚类散点','Cluster scatter']});
      K.metrics([['组内平方和','Within-cluster SS',q.wss.toFixed(2)],['迭代次数','Iterations',String(q.iters)],['各组规模','Cluster sizes',q.counts.join(' / ')]]);
      K.legend(Array.from({length:q.k},(_,j)=>[t('组','Cluster')+' '+(j+1),'Cluster '+(j+1),colors[j%5],false]).concat([['中心','Centres','#293e4d',false]]));
      K.details(K.table([['组','Cluster'],['样本数','Size'],['中心 x','Centre x'],['中心 y','Centre y']],q.centroids.map((c,j)=>[String(j+1),String(q.counts[j]),c[0].toFixed(3),c[1].toFixed(3)]))+
        `<p class="chart-note">${K.esc(t('k-means 的结果依赖初始中心；k 增大时组内平方和必然下降，不能用它来选择 k。','k-means depends on the initial centres; within-cluster SS must fall as k grows, so it cannot choose k.'))}</p>`);
      state.built=E().build('kmeans',p,q,K.lang());
    }else{
      q=E().factors(p);state.last=q;
      title.textContent=t('碎石图与累计解释方差','Scree plot and cumulative explained variance');
      K.chart(svg,{xLabel:['主成分','Component'],yLabel:['解释方差比例','Explained share'],xTickFormat:v=>String(Math.round(v)),
        series:[{type:'bar',points:q.explained.map((v,i)=>[i+1,v]),color:'#6689a8',gap:.6,tip:d=>[`PC${Math.round(d[0])}：${K.pct(d[1],1)}`,'PC'+Math.round(d[0])+': '+K.pct(d[1],1)]},
          {type:'line',points:q.cumulative.map((v,i)=>[i+1,v]),color:'#9b88ac'}],
        aria:['碎石图','Scree plot']});
      K.metrics([['PC1 解释比例','PC1 share',K.pct(q.explained[0],1)],['前两个累计','First two cumulative',K.pct(q.cumulative[1],1)],['变量数','Variables',String(q.k)]]);
      K.legend([['各主成分','Components','#6689a8',false],['累计','Cumulative','#9b88ac',false]]);
      K.details(K.table([['主成分','Component'],['特征值','Eigenvalue'],['解释比例','Share'],['累计','Cumulative']],q.eigenvalues.map((v,i)=>['PC'+(i+1),v.toFixed(3),K.pct(q.explained[i],1),K.pct(q.cumulative[i],1)]))+
        `<p class="chart-note">${K.esc(t('主成分按方差排序；保留几个因子要结合碎石图拐点与经济含义，而不是机械地取特征值大于 1。','Components are ordered by variance; how many to keep needs both the scree elbow and an economic reading, not a mechanical eigenvalue rule.'))}</p>`);
      state.built=E().build('pca',p,q,K.lang());
    }
    $('#validation').textContent='';
    return state.built;
  }catch(e){$('#validation').textContent=e.message;svg.innerHTML='';return null;}
}
function render({view,mode,onBuilt}){
  state.view=view;state.mode=mode;
  controls();
  const host=$('#regAdvControls');
  for(const el of $('#inputs').children)if(el!==host)el.hidden=true;
  host.hidden=false;host.classList.remove('hidden');
  const out=paint();
  if(out&&onBuilt)onBuilt(out);
  return out;
}
window.RegAdvView={render,state};
})();
