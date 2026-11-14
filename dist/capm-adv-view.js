/* Experiment09 拓展视图：高阶矩 CAPM（课件 9.1 advanced CAPM）。 */
(()=>{'use strict';
const K=window.LabKit,M=()=>window.CAPMHMMath,$=s=>document.querySelector(s),t=(zh,en)=>K.t(zh,en);
const state={p:{...window.CAPMHMMath.defaults},built:null,last:null};
function controls(){
  const p=state.p;let host=$('#capmAdvControls');
  if(!host){host=document.createElement('section');host.id='capmAdvControls';$('#inputs').append(host);
    host.addEventListener('input',()=>{if(read())paint();});
    host.addEventListener('change',()=>{if(read())paint();});}
  host.innerHTML=`<h3>${K.esc(t('高阶矩 CAPM 参数','Higher-moment CAPM settings'))}</h3>
    <p class="lab-note">${K.esc(t('除市场 beta 外，把协偏度与协峰度也作为横截面定价因子；比较 2/3/4 阶矩模型。','Beyond market beta, coskewness and cokurtosis also enter the cross-section; compare the 2-, 3- and 4-moment models.'))}</p>
    ${K.field({id:'assets',zh:'资产数',en:'Assets',value:p.assets,min:8,max:60,step:2})}
    ${K.field({id:'months',zh:'月份数',en:'Months',value:p.months,min:60,max:300,step:12})}
    ${K.field({id:'gamma3',zh:'协偏度溢价系数',en:'Coskewness premium',value:p.gamma3,min:0,max:1.5,step:.05})}
    ${K.field({id:'gamma4',zh:'协峰度溢价系数',en:'Cokurtosis premium',value:p.gamma4,min:-1,max:1.5,step:.05})}
    ${K.field({id:'seed',zh:'随机种子',en:'Random seed',value:p.seed,min:1,max:99999999,step:1})}
    ${K.tasks([['先预测：加入协偏度后横截面 R² 会大幅上升还是只小幅上升？','Predict first: will adding coskewness raise the cross-sectional R² a lot or a little?'],
      ['把 gamma3 调到 0，观察协偏度系数与 t 值是否回到不显著。','Set gamma3 to zero and watch the coskewness coefficient and t-stat lose significance.'],
      ['把资产数调到 8，说明为什么这时 R² 不能再当作模型选择依据。','Set assets to 8 and explain why R² can no longer choose the model there.']])}`;
  sync();return host;
}
function sync(){for(const [k,v] of Object.entries(state.p)){const el=$('#lab-'+k);if(el&&document.activeElement!==el)el.value=v;}}
function read(){
  const next={...state.p};
  for(const el of $('#capmAdvControls').querySelectorAll('input')){
    const id=el.id.replace(/^lab-/,''),v=Number(el.value);
    if(el.value.trim()===''||!Number.isFinite(v)){$('#validation').textContent=t('请输入有效数值。','Enter a valid number.');return null;}
    next[id]=v;
  }
  try{M().check(next);}catch(e){$('#validation').textContent=e.message;return null;}
  state.p=next;return next;
}
function renderCode(){
  if(!state.built)return;
  const blocks=state.built.blocks;
  let n=0;
  $('#code').innerHTML=blocks.map(b=>`<div class="logic-block">${b.lines.map((l,i)=>`<button class="code-line" data-hm-code="${b.key}" data-line="${i}"><span class="num">${++n}</span><code>${WorkbenchUI.colorCode(l)}</code></button>`).join('')}</div>`).join('');
  const first=blocks[0];
  $('#explanation').innerHTML=`<h3>${K.esc(first.title)}</h3><p>${K.esc(first.explain)}</p>`;
  if(first.formula&&window.katex){const div=document.createElement('div');div.className='formula';$('#explanation').append(div);try{katex.render(first.formula,div,{throwOnError:false});}catch{}}
  $('#code').onclick=e=>{const btn=e.target.closest('[data-hm-code]');if(!btn)return;const b=blocks.find(x=>x.key===btn.dataset.hmCode);if(!b)return;$('#explanation').innerHTML=`<h3>${K.esc(b.title)}</h3><p>${K.esc(b.explain)}</p>`;};
}
function paint(){
  const p=state.p;
  const native=$('#capmPlot');if(native)native.hidden=true;
  let plot=$('#capmAdvPlot');
  if(!plot){plot=document.createElement('div');plot.id='capmAdvPlot';document.querySelector('#chartHost').append(plot);}
  plot.hidden=false;
  plot.innerHTML='<div class="chart-host single-chart"><div class="chart-frame"><h3></h3><div class="svg-host"></div></div></div>';
  const svg=plot.querySelector('.svg-host'),title=plot.querySelector('h3');
  title.textContent=t('横截面：平均超额收益 vs 拟合值','Cross-section: mean excess return against fitted value');
  try{
    const q=M().crossSection(p);state.last=q;
    const m4=q.models[2];
    K.chart(svg,{xLabel:['拟合值（4 阶矩模型）','Fitted (4-moment)'],yLabel:['平均超额收益','Mean excess return'],
      series:[{type:'scatter',points:q.meanEx.map((v,i)=>[m4.fitted[i],v]),color:'#6689a8',radius:3.4,tip:d=>[`拟合 ${K.pct(d[0],3)}；实际 ${K.pct(d[1],3)}`,'fitted '+K.pct(d[0],3)+'; actual '+K.pct(d[1],3)]},
        {type:'line',points:[[Math.min(...m4.fitted),Math.min(...m4.fitted)],[Math.max(...m4.fitted),Math.max(...m4.fitted)]],color:'#9b88ac',dash:true}],
      aria:['横截面拟合','Cross-sectional fit']});
    K.metrics([['2 阶矩 R²','2-moment R²',K.pct(q.models[0].r2,1)],['3 阶矩 R²','3-moment R²',K.pct(q.models[1].r2,1)],['4 阶矩 R²','4-moment R²',K.pct(m4.r2,1)]]);
    K.legend([['资产','Asset','#6689a8',false],['45° 参照','45° reference','#9b88ac',true]]);
    K.details(K.table([['模型','Model'],['β 价格','β price'],['协偏度','Coskewness'],['协峰度','Cokurtosis'],['R²','R²']],[
      [t('2 阶矩','2-moment'),q.models[0].lambda[0].toFixed(4),'—','—',K.pct(q.models[0].r2,1)],
      [t('3 阶矩','3-moment'),q.models[1].lambda[0].toFixed(4),q.models[1].lambda[1].toFixed(4),'—',K.pct(q.models[1].r2,1)],
      [t('4 阶矩','4-moment'),m4.lambda[0].toFixed(4),m4.lambda[1].toFixed(4),m4.lambda[2].toFixed(4),K.pct(m4.r2,1)]])+
      `<p class="chart-note">${K.esc(t('括号内为 t 值：','t-statistics in brackets: '))}${m4.t.map(v=>v.toFixed(2)).join(', ')}${K.esc(t('；真值溢价系数 gamma3=','; true premium gamma3='))}${p.gamma3}${K.esc(t('、gamma4=','; gamma4='))}${p.gamma4}${K.esc(t('。横截面只有几十个资产，R² 随因子增加必然上升，需结合调整 R² 与系数显著性判断。','. With only a few dozen assets R² must rise as factors are added; judge with adjusted R² and coefficient significance.'))}</p>`);
    $('#validation').textContent='';
    state.built=M().build('hm',p,q,K.lang());
    renderCode();
    return state.built;
  }catch(e){$('#validation').textContent=e.message;svg.innerHTML='';return null;}
}
function render({p,mode,onBuilt}){
  controls();
  const host=$('#capmAdvControls');
  for(const el of $('#inputs').children)if(el!==host)el.hidden=true;
  host.hidden=false;
  const out=paint();
  if(out&&onBuilt)onBuilt(out);
  return out;
}
window.CAPMAdvView={render,state};
})();
