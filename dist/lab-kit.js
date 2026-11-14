/* Shared three-pane shell for the five course-foundation labs.
   Language contract: every user-visible string goes through t(zh,en) and the
   whole pane is re-rendered on `finmodel:langchange`, so Chinese and English
   are both first-class and neither leaves residue in the other. */
(()=>{'use strict';
const W=()=>window.WorkbenchUI;
const esc=s=>W().esc(String(s));
const lang=()=>document.documentElement.getAttribute('data-lang')==='en'?'en':'zh';
const t=(zh,en)=>lang()==='en'&&en!=null?en:zh;
const listeners=[];
document.addEventListener('finmodel:langchange',()=>{for(const fn of listeners){try{fn();}catch(e){console.error(e);}}});
function onLang(fn){listeners.push(fn);return fn;}
const $=s=>document.querySelector(s);
const fmt=(v,d=4)=>Number.isFinite(v)?Number(v.toPrecision(d)).toString():'—';
const pct=(v,d=2)=>Number.isFinite(v)?(v*100).toFixed(d)+'%':'—';
const num=(v,d=4)=>Number.isFinite(v)?Number(v).toFixed(d):'—';
const money=(v,d=2)=>Number.isFinite(v)?Number(v).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const sign=v=>Number.isFinite(v)?(v>=0?'+':'−'):'—';
const pad=n=>String(n).padStart(2,'0');

/* ---------- top tabs, question line and view-level controls ---------- */
function views(host,list,active,onPick){
  const nav=document.createElement('nav');
  let current=active;
  nav.className='lab-tabs';nav.setAttribute('aria-label',t('实验主视图','Experiment views'));
  nav.innerHTML=list.map(([k,zh,en])=>`<button type="button" data-view="${esc(k)}" aria-pressed="${k===active}">${esc(t(zh,en))}</button>`).join('');
  host.after(nav);
  nav.onclick=e=>{const b=e.target.closest('[data-view]');if(b&&b.dataset.view!==current){current=b.dataset.view;onPick(b.dataset.view);}};
  const question=document.createElement('p');question.className='lab-question';nav.after(question);
  const controls=document.createElement('div');controls.className='lab-view-controls';question.after(controls);
  const api={nav,question,controls,setQuestion:(zh,en)=>{question.textContent=t(zh,en);},setActive:k=>nav.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===k))),
    refresh:(list,active)=>{current=active;nav.setAttribute('aria-label',t('实验主视图','Experiment views'));nav.innerHTML=list.map(([k,zh,en])=>`<button type="button" data-view="${esc(k)}" aria-pressed="${k===active}">${esc(t(zh,en))}</button>`).join('');}};
  return api;
}
/* ---------- parameter pane primitives ---------- */
function field({id,zh,en,value,min,max,step,type='number',unit}){
  if(type==='range')return `<label for="lab-${id}"><span>${esc(t(zh,en))}</span><input id="lab-${id}" type="range" min="${min}" max="${max}" step="${step||'any'}" value="${value}"></label>`;
  return `<label for="lab-${id}"><span>${esc(t(zh,en))}${unit?` <small class="lab-unit">${esc(t(...unit))}</small>`:''}</span><input id="lab-${id}" type="number" min="${min??''}" max="${max??''}" step="${step||'any'}" value="${value}"></label>`;
}
function select({id,zh,en,value,options}){
  return `<label for="lab-${id}"><span>${esc(t(zh,en))}</span><select id="lab-${id}">${options.map(([v,z,e])=>`<option value="${esc(v)}"${String(v)===String(value)?' selected':''}>${esc(t(z,e))}</option>`).join('')}</select></label>`;
}
function check({id,zh,en,value}){
  return `<label class="lab-check" for="lab-${id}"><input id="lab-${id}" type="checkbox"${value?' checked':''}><span>${esc(t(zh,en))}</span></label>`;
}
const prose=(zh,en)=>`<p class="lab-prose">${esc(t(zh,en))}</p>`;
const note=(zh,en)=>`<p class="lab-note">${esc(t(zh,en))}</p>`;
const badge=(zh,en,kind='ai')=>`<span class="lab-badge lab-badge-${kind}">${esc(t(zh,en))}</span>`;
function block(titleZh,titleEn,body){return `<section class="lab-block"><h3>${esc(t(titleZh,titleEn))}</h3>${body}</section>`;}
function tasks(items){return `<details class="lab-tasks"><summary>${esc(t('教学任务','Teaching tasks'))}</summary><ol>${items.map(([z,e])=>`<li>${esc(t(z,e))}</li>`).join('')}</ol></details>`;}
function assumptions(summary,detail){
  const box=$('#assumptionSummary');if(box)box.innerHTML=summary.map(s=>`<span>${esc(t(...s))}</span>`).join('');
  const text=$('#assumptions');if(text)text.textContent=t(...detail);
  const det=$('#assumptionDetails');if(det)det.querySelector('summary').textContent=t('查看完整模型假设','Full modelling assumptions');
}

/* ---------- R code pane ---------- */
function blocksHTML(blocks,active,onPick){
  let n=0;
  const html=blocks.map(b=>`<div class="logic-block" data-logic="${esc(b.key)}">${b.lines.map((line,i)=>`<button class="code-line${b.key===active?' selected':''}" data-semantic="${esc(b.key)}" data-line="${i}"><span class="num">${++n}</span><code>${W().colorCode(line)}</code></button>`).join('')}</div>`).join('');
  return html;
}
function code(blocks,active,onChange){
  const host=$('#code');const scroll=host.scrollTop;
  host.innerHTML=blocksHTML(blocks,active);
  host.scrollTop=scroll;
  host.querySelectorAll('[data-semantic]').forEach(btn=>{btn.onclick=()=>{const key=btn.dataset.semantic;if(key===active)return;if(onChange)onChange(key);else{code(blocks,key);}};});
  explain(blocks.find(b=>b.key===active)||blocks[0]);
  return active;
}
function explain(b){
  if(!b)return;
  const host=$('#explanation');
  const pair=v=>Array.isArray(v)?t(v[0],v[1]):(v==null?'':String(v));
  const title=pair(b.title),action=pair(b.action),value=pair(b.value),econ=pair(b.economic||b.explain);
  host.innerHTML=`<h3>${esc(title)}</h3><p>${esc(action||econ)}</p><div class="formula"></div>${value?`<p class="current-value">${esc(value)}</p>`:''}${b.economic?`<p class="economic">${esc(t('金融含义：','Finance meaning: '))}${esc(econ)}</p>`:''}`;
  if(b.formula&&window.katex){try{window.katex.render(b.formula,host.querySelector('.formula'),{throwOnError:false,displayMode:false});}catch{host.querySelector('.formula').textContent=b.formula;}}
  return host;
}

/* ---------- model pane pieces ---------- */
const metrics=items=>{const host=$('#metrics');host.innerHTML=items.map(([z,e,v])=>`<div><span>${esc(t(z,e))}</span><b>${esc(v)}</b></div>`).join('');return host;};
function table(headers,rows,{classes={},caption}={}){
  return `<table>${caption?`<caption>${esc(t(...caption))}</caption>`:''}<thead><tr>${headers.map(h=>`<th scope="col">${esc(t(...h))}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr${r.cls?` class="${r.cls}"`:''}>${(Array.isArray(r)?r:r.cells).map((c,i)=>i===0?`<th scope="row">${c}</th>`:`<td${classes[i]?` class="${classes[i]}"`:''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function legend(items){const host=$('#legend');host.innerHTML=items.map(([z,e,color,dash])=>`<span><i style="--legend-color:${color};--legend-style:${dash?'dashed':'solid'}"></i>${esc(t(z,e))}</span>`).join('');return host;}
const details=html=>{const host=$('#details');host.innerHTML=html;return host;};
const graphKind=(zh,en)=>{const el=$('#graphKind');if(el)el.textContent=t(zh,en);};

/* ---------- chart engine: one SVG contract for every new lab ---------- */
let controller=null;
function tip(){let el=document.querySelector('#labTip');if(el&&el.isConnected)return el;el=document.createElement('div');el.id='labTip';el.className='chart-tooltip';el.hidden=true;const host=document.querySelector('#chartHost')||document.querySelector('.model-panel')||document.body;host.append(el);return el;}
function interaction(){
  if(controller)return controller;
  controller=window.ChartInteraction.create((key,mode)=>{
    const el=tip();
    if(!key){el.hidden=true;el.dataset.mode='closed';return;}
    el.hidden=false;el.dataset.mode=mode;
    el.innerHTML=(mode==='pinned'?`<button id="labTipClose" aria-label="${esc(t('关闭详情','Close details'))}">×</button>`:'')+key;
    if(mode==='pinned')el.querySelector('#labTipClose').onclick=()=>controller.clear();
  });
  return controller;
}
const PALETTE=['#6689a8','#9b88ac','#659b8a','#4e718e','#b5816f','#7f9182'];
/* ticks are computed on the padded domain, so labels always sit inside the plot */
function niceTicks(lo,hi,count=5){
  if(!Number.isFinite(lo)||!Number.isFinite(hi)||lo===hi)return [lo];
  const raw=(hi-lo)/count,base=10**Math.floor(Math.log10(raw)),step=[1,2,2.5,5,10].map(x=>x*base).find(x=>x>=raw)||base*10;
  const out=[];for(let x=Math.ceil(lo/step)*step;x<=hi+step*1e-9;x+=step)out.push(Math.abs(x)<step*1e-8?0:x);return out;
}
function chart(host,spec){
  const W0=600,H=385,l=66,r=20,tp=18,b=52;
  const series=(spec.series||[]).filter(s=>s.points&&s.points.length);
  if(!series.length){host.innerHTML='';return null;}
  const xs=series.flatMap(s=>s.points.map(p=>p[0])),ys=series.flatMap(s=>s.points.map(p=>p[1]));
  const refs=spec.refs||[];
  let xlo=Math.min(...xs),xhi=Math.max(...xs),ylo=Math.min(...ys),yhi=Math.max(...ys);
  for(const rf of refs)if(rf.axis==='y'&&Number.isFinite(rf.value)){ylo=Math.min(ylo,rf.value);yhi=Math.max(yhi,rf.value);}
  if(!Number.isFinite(xlo)||!Number.isFinite(ylo)){host.innerHTML='';return null;}
  if(spec.xDomain){[xlo,xhi]=spec.xDomain;}else{const d=(xhi-xlo)||Math.abs(xlo)||1;xlo-=d*.04;xhi+=d*.04;}
  if(spec.yDomain){[ylo,yhi]=spec.yDomain;}else{const d=(yhi-ylo)||Math.abs(ylo)||1;ylo-=d*.10;yhi+=d*.10;}
  if(spec.yZero){ylo=Math.min(ylo,0);yhi=Math.max(yhi,0);}
  const sx=x=>l+(x-xlo)/(xhi-xlo||1)*(W0-l-r),sy=y=>H-b-(y-ylo)/(yhi-ylo||1)*(H-b-tp);
  const xf=spec.xTickFormat||(v=>fmt(v,4)),yf=spec.yTickFormat||(v=>fmt(v,3));
  const xt=niceTicks(xlo,xhi,spec.xTicks||5),yt=niceTicks(ylo,yhi,spec.yTicks||5);
  const marks=[];
  let svg=`<svg viewBox="0 0 ${W0} ${H}" role="img" aria-label="${esc(t(...(spec.aria||[spec.title||'图表','Chart'])))}">`;
  for(const bd of spec.bands||[]){const x0=sx(bd.from),x1=sx(bd.to);svg+=`<rect x="${Math.min(x0,x1)}" y="${tp}" width="${Math.abs(x1-x0)}" height="${H-b-tp}" fill="${bd.color||'#eef3f6'}" opacity=".75"/>`;}
  for(const v of yt)svg+=`<path class="chart-grid" d="M${l},${sy(v)}H${W0-r}"/><text x="${l-8}" y="${sy(v)+4}" text-anchor="end">${esc(yf(v))}</text>`;
  for(const v of xt)svg+=`<text x="${sx(v)}" y="${H-b+18}" text-anchor="middle">${esc(xf(v))}</text>`;
  svg+=`<path d="M${l},${H-b}H${W0-r}" stroke="#b9c7cf" fill="none"/>`;
  if(spec.yZero&&ylo<0&&yhi>0)svg+=`<path d="M${l},${sy(0)}H${W0-r}" stroke="#c3ced5" stroke-dasharray="3 3" fill="none"/>`;
  for(const rf of refs){
    if(rf.axis==='x')svg+=`<path d="M${sx(rf.value)},${tp}V${H-b}" stroke="${rf.color||'#9b88ac'}" stroke-dasharray="${rf.dash===false?'':'4 4'}" fill="none"/>`;
    else svg+=`<path d="M${l},${sy(rf.value)}H${W0-r}" stroke="${rf.color||'#9b88ac'}" stroke-dasharray="${rf.dash===false?'':'4 4'}" fill="none"/>`;
  }
  series.forEach((s,si)=>{
    const color=s.color||PALETTE[si%PALETTE.length];
    if(s.type==='bar'){
      const gapX=s.points.length>1?Math.abs(s.points[1][0]-s.points[0][0]):(xhi-xlo)/10;
      const w=s.width||Math.max(1.2,Math.abs(sx(s.points[0][0]+gapX)-sx(s.points[0][0]))*(s.gap??.82));
      s.points.forEach((p,i)=>{
        svg+=`<rect class="lab-bar" data-series="${si}" x="${sx(p[0])-w/2}" y="${Math.min(sy(0),sy(p[1]))}" width="${w}" height="${Math.max(1,Math.abs(sy(p[1])-sy(0)))}" fill="${color}" opacity="${s.opacity??.9}" tabindex="0" role="button" aria-label="${esc(s.tip?t(...s.tip(p)):yf(p[1]))}"/>`;
        if(s.tip)marks.push({sel:`rect.lab-bar[data-series="${si}"]`,i:marks.filter(m=>m.sel===`rect.lab-bar[data-series="${si}"]`).length,html:t(...s.tip(p))});
      });
    }else if(s.type==='scatter'||s.type==='points'){
      s.points.forEach((p,i)=>{
        svg+=`<circle class="lab-point" data-series="${si}" cx="${sx(p[0])}" cy="${sy(p[1])}" r="${s.radius||3.4}" fill="${color}" opacity="${s.opacity??.85}" tabindex="0" role="button" aria-label="${esc(s.tip?t(...s.tip(p)):fmt(p[1]))}"/>`;
        if(s.tip)marks.push({sel:`circle.lab-point[data-series="${si}"]`,i:marks.filter(m=>m.sel===`circle.lab-point[data-series="${si}"]`).length,html:t(...s.tip(p))});
      });

    }else{
      let d='';
      s.points.forEach((p,i)=>{const X=sx(p[0]),Y=sy(p[1]);d+=i===0?`M${X},${Y}`:s.type==='step'?`H${X}V${Y}`:`L${X},${Y}`;});
      if(s.type==='area'&&s.points.length)d+=`L${sx(s.points[s.points.length-1][0])},${sy(s.zero??0)}L${sx(s.points[0][0])},${sy(s.zero??0)}Z`;
      svg+=`<path class="lab-line" d="${d}" fill="${s.type==='area'?(s.fill||'#e8eef2'):'none'}" stroke="${s.type==='area'?'none':color}" stroke-width="${s.width||2}" stroke-dasharray="${s.dash?'5 4':''}" stroke-linejoin="round" stroke-linecap="round"/>`;
      if(s.tip){const stride=Math.max(1,Math.ceil(s.points.length/120));s.points.forEach((p,i)=>{if(i%stride)return;svg+=`<circle class="lab-hit" cx="${sx(p[0])}" cy="${sy(p[1])}" r="4.5" fill="${color}" opacity="0" tabindex="0" role="button" aria-label="${esc(t(...s.tip(p)))}"/>`;marks.push({sel:`circle.lab-hit[data-series="${si}"]`,i:marks.filter(m=>m.sel===`circle.lab-hit[data-series="${si}"]`).length,html:t(...s.tip(p))});});}
    }
  });
  for(const rf of refs)if(rf.label)svg+=`<text x="${rf.axis==='y'?l+6:sx(rf.value)+4}" y="${rf.axis==='y'?sy(rf.value)-5:tp+10}" fill="${rf.color||'#9b88ac'}" font-size="11">${esc(t(rf.label[0],rf.label[1]))}</text>`;
  if(spec.xLabel)svg+=`<text class="axis-caption" x="${(l+W0-r)/2}" y="${H-12}" text-anchor="middle">${esc(t(...spec.xLabel))}</text>`;
  if(spec.yLabel)svg+=`<text class="axis-caption" transform="translate(16 ${(tp+H-b)/2}) rotate(-90)" text-anchor="middle">${esc(t(...spec.yLabel))}</text>`;
  host.innerHTML=svg+'</svg>';
  const ctrl=interaction();ctrl.clear();
  if(marks.length){
    const groups=new Map();
    for(const m of marks){if(!groups.has(m.sel))groups.set(m.sel,[]);groups.get(m.sel).push(m);}
    for(const [sel,list] of groups){host.querySelectorAll(sel).forEach((el,i)=>{const m=list[i];if(m)ctrl.bind(el,m.html);});}
  }
  return{sx,sy,xt,yt,host};
}
/* Dependency-free pipeline diagram used by 01 and 02. */
function flow(host,steps,active){
  const n=steps.length,w=600,h=Math.min(200,86+18*Math.ceil(n/3)),bw=(600-40-(n-1)*10)/n;
  let svg=`<svg viewBox="0 0 600 ${h}" role="img" aria-label="${esc(t('处理流程','Pipeline'))}">`;
  steps.forEach((st,i)=>{
    const x=20+i*(bw+10),y=30,on=i===active;
    svg+=`<rect x="${x}" y="${y}" width="${bw}" height="70" rx="10" fill="${on?'#e9e8f1':'#f4f7f9'}" stroke="${on?'#8c80a3':'#dce5e9'}"/>`;
    svg+=`<text x="${x+bw/2}" y="${y+26}" text-anchor="middle" font-size="12" fill="${on?'#4b4166':'#596e7c'}">${esc(t(st[0],st[1]))}</text>`;
    if(st[2])svg+=`<text x="${x+bw/2}" y="${y+48}" text-anchor="middle" font-size="11" fill="#7d8f9b">${esc(st[2])}</text>`;
    if(i<n-1)svg+=`<path d="M${x+bw+1},${y+35}h8" stroke="#b9c7cf" stroke-width="1.5" marker-end="url(#labArrow)"/>`;
  });
  svg+=`<defs><marker id="labArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="#b9c7cf"/></marker></defs>`;
  svg+=`<text x="300" y="${h-14}" text-anchor="middle" font-size="11" fill="#7d8f9b">${esc(t('当前步骤高亮；每一步都在清洗日志中留痕','The current step is highlighted; every step is logged'))}</text></svg>`;
  host.innerHTML=svg;return host;
}

/* ---------- page chrome: dialogs, copy, splitter, projector ---------- */
const toast=text=>{const el=$('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2600);};
function info(title,body){$('#infoTitle').textContent=title;$('#infoBody').textContent=body;window.ModalUI.open($('#infoDialog'));}
function download(name,text){const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function chrome({getCode,onReset,onMode,teacher,help,practice,fileName}){
  for(const id of ['#catalog','#catalogMobile']){const b=$(id);if(b)b.onclick=()=>window.ModalUI.open($('#catalogDialog'));}
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
  $('#help').onclick=()=>info(t('帮助与资源','Help & resources'),t(...help));
  $('#teacher').onclick=()=>info(t('教师提示','Teacher notes'),t(...teacher));
  $('#copy').onclick=async()=>{
    const text=getCode();
    try{await navigator.clipboard.writeText(text);toast(t('已复制完整 R 代码，可在 RStudio 整段运行','Full R code copied — run it end to end in RStudio'));}
    catch{download(fileName||'finmodel-lab.R',text);toast(t('剪贴板不可用，已下载 R 脚本','Clipboard unavailable — the R script was downloaded'));}
  };
  document.querySelectorAll('[data-code-mode]').forEach(b=>b.onclick=()=>{if(b.disabled)return;onMode(b.dataset.codeMode);});
  let practiceBtn=$('#rStudioPractice');
  if(!practiceBtn){practiceBtn=document.createElement('button');practiceBtn.id='rStudioPractice';practiceBtn.textContent=t('RStudio 实践','RStudio practice');$('.code-toolbar').append(practiceBtn);}
  practiceBtn.onclick=()=>info(t('在 RStudio 实践','Practice in RStudio'),t(...practice));
  $('#projector').onclick=()=>{const on=!document.body.classList.contains('projector');document.body.classList.toggle('projector',on);$('#projector').setAttribute('aria-pressed',String(on));};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]')){document.body.classList.remove('projector');$('#projector').setAttribute('aria-pressed','false');}});
  const splitter=$('#splitter');let share=62;
  const resize=v=>{share=Math.max(40,Math.min(75,v));$('.code-regions').style.setProperty('--code-fr',share+'fr');$('.code-regions').style.setProperty('--explain-fr',(100-share)+'fr');splitter.setAttribute('aria-valuenow',share);};
  splitter.onkeydown=e=>{if(['ArrowUp','ArrowDown','Home','End'].includes(e.key)){e.preventDefault();resize(e.key==='Home'?40:e.key==='End'?75:share+(e.key==='ArrowDown'?2:-2));}};
  splitter.onpointerdown=e=>{splitter.setPointerCapture(e.pointerId);const y=e.clientY,start=share,h=$('.code-regions').clientHeight;splitter.onpointermove=ev=>resize(start+(ev.clientY-y)/h*100);splitter.onpointerup=()=>{splitter.onpointermove=null;};};
  $('#reset').onclick=()=>onReset();
  if($('#assumptionDetails'))$('#assumptionDetails').ontoggle=()=>{const s=$('#assumptionDetails summary');s.textContent=$('#assumptionDetails').open?t('收起完整模型假设','Hide full assumptions'):t('查看完整模型假设','Full modelling assumptions');};
}
function modeButtons(mode,{basic=true}={}){
  document.querySelectorAll('[data-code-mode]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.codeMode===mode));if(b.dataset.codeMode==='basic')b.disabled=!basic;});
}
const notice=text=>{$('#codeNotice').textContent=text;};
const view=()=>({nav:0});
/* The mount contract every lab honours: body flag, course chrome, hidden quiz. */
function start(id,cls){
  window.CourseExperiments.mount(id);
  document.body.classList.add(cls);
  const learning=document.querySelector('.learning');if(learning)learning.hidden=true;
  document.querySelectorAll('[data-code-mode]').forEach(b=>{if(b.dataset.codeMode==='basic')b.disabled=true;});
  window.ChartInteraction?.clear();
}
window.LabKit={t,lang,onLang,esc,fmt,pct,num,money,sign,pad,views,field,select,check,prose,note,badge,block,tasks,assumptions,code,explain,metrics,table,legend,details,graphKind,chart,flow,toast,info,download,chrome,modeButtons,notice,start,interaction};
})();
