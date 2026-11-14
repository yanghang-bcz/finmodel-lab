/* Experiment02 · financial data cleaning. Deterministic messy sample, explicit
   cleaning pipeline and audit trail. The CSV engine is shared with experiment 01's
   kit (LabCSV); every number the page shows is produced here and reproduced by the
   generated base-R script. Nothing is a market quote: all prices are synthetic. */
(function(root,factory){
  const csv=typeof module==='object'?require('./lab-csv'):root.LabCSV;
  const st=typeof module==='object'?require('./lab-stats'):root.LabStats;
  const api=factory(csv,st);
  if(typeof module==='object')module.exports=api;else root.DataPrepMath=api;
})(this,(CSV,S)=>{
'use strict';
const views=[['import','导入与列诊断','Import & profiling'],['dates','日期与频率对齐','Dates & frequency'],['missing','缺失值策略','Missing values'],['outlier','异常值识别','Outliers'],['shape','宽长表与合并','Wide, long & joins'],['ai','AI 清洗对比','AI cleaning compared'],['db','数据库与格式','Databases & formats']];
const ASSET_LABELS={'股票A':['股票A','Stock A'],'股票B':['股票B','Stock B'],'债券C':['债券C','Bond C']};
const AI_KEYS=['typo','zero','drop','naive','long','clamp'];
const DEFAULT_AI=Object.freeze(AI_KEYS.reduce((o,k)=>(o[k]=Object.freeze({decision:'pending',reason:''}),o),{}));
const SOURCES=[['file','本地文件 CSV / xlsx','Local file'],['db','数据库（RODBC / DBI）','Database (RODBC / DBI)'],['api','行情 API / 终端（quantmod / WindR）','Market API / terminal']];
const FREQS=[['daily','日度','Daily'],['weekly','周度','Weekly'],['monthly','月度','Monthly']];
const ADJS=[['raw','未复权原始价','Unadjusted'],['split','仅拆分调整','Split-adjusted'],['total','含股息总收益','Total return']];
const defaults=Object.freeze({csv:'',delimiter:'auto',missing:'drop',outlier:'iqr',outlierAction:'flag',k:1.5,asset:0,resample:'month',bins:12,seed:20261114,ai:DEFAULT_AI,source:'db',frequency:'monthly',adjust:'total',retrieved:'2026-11-14',dbTable:'prices'});
const SAMPLE_META=Object.freeze({license:'CC0-1.0',retrieved:'2026-11-14',rows:36,assets:3,missing:3,duplicates:1,typo:1,emptyColumns:1,textColumns:1});
const NOTE_BY_INDEX={0:'首次录入',5:'来源：教学数据库',17:'数值待复核',22:'口径调整',30:'期末核对'};
const r2=v=>Number(v.toFixed(2)),r3=v=>Number(v.toFixed(3));
function monthEnd(i){return new Date(Date.UTC(2024,i+1,0)).toISOString().slice(0,10);}
function fmtRaw(iso,i){const [y,m,d]=iso.split('-');if(i%3===1)return y+'/'+Number(m)+'/'+Number(d);if(i%3===2)return y+m+d;return iso;}
/* The built-in messy sample: 36 monthly rows, 35 unique months (2025-01 is a real
   calendar gap), one duplicated date, three missing cells, one 10x typo, one empty
   column, one free-text column and three synthetic assets. */
function sampleCSV(){
  const lines=['date,股票A,股票B,债券C,备用字段,备注'];
  const cell=v=>v===null?'':String(v);
  for(let i=0;i<36;i++){
    if(i===12)continue;                                   /* 2025-01 gap */
    const iso=monthEnd(i);
    const a=i===20?'N/A':r2(10*(1+.006*i+.03*Math.sin(i*.9)));
    let b=r3(1.2*(1+.004*i+.05*Math.sin(i*1.3+.4)));
    if(i===26)b=null;                                     /* missing cell */
    if(i===17)b=r3(b*10);                                 /* 10x typo */
    const c=i===13?null:r3(100*(1+.0008*i+.004*Math.sin(i*.5+1)));
    lines.push([fmtRaw(iso,i),cell(a),cell(b),cell(c),'',NOTE_BY_INDEX[i]||''].join(','));
    if(i===2)lines.push(['2024/3/31',cell(a),r3(b*1.004+.002),cell(c),'','重复录入'].join(','));
  }
  return lines.join('\n');
}
const SAMPLE=sampleCSV();
const DEFAULTS={...defaults,csv:SAMPLE};
function cloneDefaults(){return{...DEFAULTS,ai:AI_KEYS.reduce((o,k)=>(o[k]={...DEFAULT_AI[k]},o),{})};}
const DELIMS=[['auto','自动检测','Detect automatically'],[',','逗号 ,','Comma ,'],[';','分号 ;','Semicolon ;'],['\t','制表符 Tab','Tab']];
const POLICIES=[['reject','拒绝并报错','Reject with an error'],['drop','删除整行','Drop the row'],['ffill','用前值填充','Carry the previous value'],['zero','用 0 填充','Fill with zero']];
const METHODS=[['z','z 分数','z-score'],['iqr','四分位距 IQR','IQR fences'],['mad','中位数绝对偏差 MAD','MAD fences']];
const ACTIONS=[['flag','只标记','Flag only'],['winsorize','缩尾处理','Winsorize'],['drop','删除整行','Drop the row']];
const RESAMPLE=[['none','原始频率','Native frequency'],['month','按月对齐','Align to month'],['week','按周对齐','Align to week']];
function check(p){
  if(typeof p.csv!=='string'||!p.csv.trim())throw Error('CSV 文本不能为空，请粘贴数据或导入文件。');
  if(p.csv.length>4000000)throw Error('CSV 超过 4MB 上限，请先拆分文件。');
  if(!DELIMS.some(d=>d[0]===p.delimiter))throw Error('分隔符只能选择自动、逗号、分号或制表符。');
  if(!POLICIES.some(d=>d[0]===p.missing))throw Error('缺失值策略只能是拒绝、删除整行、前值填充或 0 填充。');
  if(!METHODS.some(d=>d[0]===p.outlier))throw Error('异常值方法只能是 z 分数、IQR 或 MAD。');
  if(!ACTIONS.some(d=>d[0]===p.outlierAction))throw Error('异常值处理只能是标记、缩尾或删除整行。');
  if(!Number.isFinite(p.k)||p.k<.1||p.k>10)throw Error('阈值倍数须为 0.1 到 10 之间的数值。');
  if(!Number.isInteger(p.asset)||p.asset<0||p.asset>2)throw Error('资产序号须为 0、1 或 2。');
  if(!Number.isInteger(p.bins)||p.bins<4||p.bins>40)throw Error('直方图分组须为 4 到 40 之间的整数。');
  if(!Number.isInteger(p.seed)||p.seed<1||p.seed>99999999)throw Error('随机种子须为 1 到 99999999 之间的整数。');
  if(!p.ai||typeof p.ai!=='object')throw Error('AI 建议状态缺失，请刷新页面。');
  for(const key of AI_KEYS){
    const d=p.ai[key];if(!d)throw Error('AI 建议状态不完整，请刷新页面。');
    if(!['accept','reject','pending'].includes(d.decision))throw Error('AI 建议的决策只能是接受、拒绝或待定。');
    if(d.decision!=='pending'&&!String(d.reason||'').trim())throw Error('AI 建议"'+AI_SUGGESTIONS.find(s=>s.key===key).title[0]+'"：接受或拒绝都必须填写理由。');
    if(String(d.reason||'').length>240)throw Error('AI 建议的理由不能超过 240 个字符。');
  }
  return true;
}
/* ---------- shared cleaning entry points ---------- */
function cleanWith(p,overrides={}){
  return CSV.clean(p.csv,{delimiter:p.delimiter,dedupe:true,sort:true,outlier:'none',...overrides});
}
function colStats(clean){
  const {names,matrix}=clean;
  return names.map((name,j)=>{
    const v=matrix.map(r=>r[j]).filter(Number.isFinite);
    const stats={name,index:j,mean:v.length?S.mean(v):NaN,sd:v.length>1?S.sd(v):NaN,min:v.length?Math.min(...v):NaN,max:v.length?Math.max(...v):NaN,n:v.length,missing:matrix.length-v.length};
    if(v.length>=8){
      stats.q1=CSV.quantileOf(v,.25);stats.q3=CSV.quantileOf(v,.75);stats.iqr=stats.q3-stats.q1;
      stats.median=CSV.quantileOf(v,.5);stats.mad=CSV.quantileOf(v.map(x=>Math.abs(x-stats.median)),.5)*1.4826;
    }
    return stats;
  });
}
const logEntry=(clean,code)=>clean.log.find(x=>x.code===code)||null;
function formatOf(raw){
  if(/^\d{4}-\d{2}-\d{2}$/.test(raw))return 'iso';
  if(/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(raw))return 'slash';
  if(/^\d{8}$/.test(raw))return 'compact';
  return 'other';
}
function monthKeysBetween(from,to){
  const out=[];let y=+from.slice(0,4),m=+from.slice(5,7);const ey=+to.slice(0,4),em=+to.slice(5,7);
  while(y<ey||(y===ey&&m<=em)){out.push(y+'-'+String(m).padStart(2,'0'));m++;if(m>12){m=1;y++;}}
  return out;
}
/* ---------- 1. import and column diagnostics ---------- */
function importView(p){
  const clean=cleanWith(p,{missing:'drop'});
  const before=clean.profileBefore,after=colStats(clean),types={date:0,number:0,text:0};
  before.forEach(c=>types[c.type]++);
  return{clean,before,after,types,delimiter:clean.source.delimiter,rows:clean.source.rows,columns:clean.source.columns,path:clean.summary,dropped:clean.summary.dropped,
    flow:[['read_csv','读取 CSV'],['profile','列类型诊断'],['dates','日期规范化'],['missing','缺失处理'],['outlier','异常值识别'],['shape','宽长转换']]};
}
/* ---------- 2. dates and frequency alignment ---------- */
function datesView(p){
  const parsed=CSV.parse(p.csv,{delimiter:p.delimiter});
  const raw=parsed.rows.map((r,i)=>({row:i+2,raw:String(r[0]).trim(),date:CSV.parseDate(r[0]),values:r.slice(1,4)}));
  const formats={iso:0,slash:0,compact:0,other:0};raw.forEach(r=>formats[formatOf(r.raw)]++);
  const byDate=new Map();for(const r of raw){if(!r.date)continue;if(!byDate.has(r.date))byDate.set(r.date,[]);byDate.get(r.date).push(r);}
  const duplicates=[...byDate.entries()].filter(([,list])=>list.length>1).map(([date,list])=>({date,list}));
  const clean=cleanWith(p,{missing:'ffill'});
  const month=cleanWith(p,{missing:'ffill',resample:'month'});
  const week=cleanWith(p,{missing:'ffill',resample:'week'});
  const from=clean.dates[0],to=clean.dates[clean.dates.length-1];
  const expected=monthKeysBetween(from,to),present=new Set(clean.dates.map(d=>d.slice(0,7)));
  const gaps=expected.filter(k=>!present.has(k));
  const calendar=expected.map(k=>{const y=+k.slice(0,4),m=+k.slice(5,7);const iso=clean.dates.find(d=>d.slice(0,7)===k)||k+'-01';return{k,year:y,month:m,date:iso,present:present.has(k),duplicate:duplicates.some(d=>d.date.slice(0,7)===k)};});
  return{raw,formats,duplicates,clean,month,week,gaps,calendar,expected:expected.length,rows:clean.dates.length,dupeCount:clean.summary.duplicates,
    log:{dedupe:logEntry(clean,'dedupe'),resample:logEntry(month,'resample')}};
}
/* ---------- 3. missing values: policy and explicit cost ---------- */
function policyStats(p,policy){
  try{
    const clean=cleanWith(p,{missing:policy});
    const dropped=logEntry(clean,'missing.drop'),fill=logEntry(clean,'missing.fill');
    return{policy,ok:true,clean,rows:clean.dates.length,means:colStats(clean).map(c=>c.mean),sds:colStats(clean).map(c=>c.sd),
      dropped:dropped?dropped.dropped:0,carried:fill?fill.carried:0,zeroed:fill?fill.zeroed:0,
      zeros:clean.matrix.flat().filter(v=>v===0).length,error:null};
  }catch(e){return{policy,ok:false,clean:null,rows:0,means:[],sds:[],dropped:0,carried:0,zeroed:0,zeros:0,error:e.message};}
}
function missingView(p){
  const base=cleanWith(p,{missing:'ffill'});
  const missing=base.missingCells.map(c=>({...c,col:base.names.indexOf(c.column)}));
  const policies=POLICIES.map(([key])=>policyStats(p,key));
  const applied=policies.find(x=>x.policy===p.missing);
  return{base,missing,policies,applied,names:base.names,dates:base.dates,matrix:base.matrix,
    mapBefore:base.matrix.map((row,i)=>row.map((v,j)=>({i,j,date:base.dates[i],asset:base.names[j],missing:v===null}))).flat()};
}
/* ---------- 4. outliers: three rules, three actions ---------- */
function detectOutliers(clean,{method='iqr',k=1.5,action='flag'}={}){
  const matrix=clean.matrix.map(r=>r.slice()),{names,dates}=clean,fences=[],flags=[];
  names.forEach((name,j)=>{
    const col=matrix.map(r=>r[j]).filter(Number.isFinite);
    const f={name,j,mean:col.length?S.mean(col):NaN,sd:col.length>1?S.sd(col):NaN,q1:NaN,q3:NaN,median:NaN,iqr:NaN,mad:NaN,lo:NaN,hi:NaN,count:0,skipped:false};
    if(col.length<8){f.skipped=true;fences.push(f);return;}
    f.q1=CSV.quantileOf(col,.25);f.q3=CSV.quantileOf(col,.75);f.iqr=f.q3-f.q1;f.median=CSV.quantileOf(col,.5);
    f.mad=CSV.quantileOf(col.map(v=>Math.abs(v-f.median)),.5)*1.4826;
    if(method==='z'){if(!(f.sd>0)){f.skipped=true;fences.push(f);return;}f.lo=f.mean-k*f.sd;f.hi=f.mean+k*f.sd;}
    else if(method==='iqr'){if(!(f.iqr>0)){f.skipped=true;fences.push(f);return;}f.lo=f.q1-k*f.iqr;f.hi=f.q3+k*f.iqr;}
    else{if(!(f.mad>0)){f.skipped=true;fences.push(f);return;}f.lo=f.median-k*f.mad;f.hi=f.median+k*f.mad;}
    matrix.forEach((row,i)=>{const v=row[j];if(!Number.isFinite(v))return;if(v<f.lo||v>f.hi){f.count++;flags.push({row:i,col:j,date:dates[i],name,value:v,score:Math.max((v-f.q3)/(k*Math.max(f.iqr,1e-12)),(f.q1-v)/(k*Math.max(f.iqr,1e-12))),side:v>f.hi?'hi':'lo'});}});
    fences.push(f);
  });
  const after=matrix.map(r=>r.slice());let winsorized=0,dropped=0;
  if(action==='winsorize')for(const fl of flags){const f=fences[fl.col];const v=after[fl.row][fl.col];const next=Math.min(f.hi,Math.max(f.lo,v));if(next!==v){after[fl.row][fl.col]=next;winsorized++;}}
  const dropRows=new Set(flags.map(f=>f.row));
  const keptDates=dates.filter((_,i)=>action!=='drop'||!dropRows.has(i));
  const keptMatrix=after.filter((_,i)=>action!=='drop'||!dropRows.has(i));
  if(action==='drop')dropped=dropRows.size;
  return{fences,flags,matrix:after,dates:keptDates,rows:keptDates.length,winsorized,dropped,method,k,action,
    byAsset:fences.map(f=>({name:f.name,lo:f.lo,hi:f.hi,count:f.count,skipped:f.skipped}))};
}
function outlierView(p){
  const clean=cleanWith(p,{missing:'drop'});
  const det=detectOutliers(clean,{method:p.outlier,k:p.k,action:p.outlierAction});
  const selected=Math.min(p.asset,clean.names.length-1);
  const stats=colStats({names:clean.names,matrix:det.matrix});
  return{clean,det,selected,stats,flags:det.flags.filter(f=>f.col===selected),allFlags:det.flags,
    series:clean.dates.map((d,i)=>({date:d,x:i+1,before:clean.matrix[i][selected],after:det.matrix[i]?det.matrix[i][selected]:null}))};
}
/* ---------- 5. wide, long and joins ---------- */
function shapeView(p){
  const clean=cleanWith(p,{missing:'drop'});
  const n=clean.dates.length,names=clean.names,dates=clean.dates;
  const long=dates.flatMap((d,i)=>names.map((name,j)=>({date:d,asset:name,value:clean.matrix[i][j]})));
  const left=[],right=[];
  for(let i=0;i<n;i++)(i%2===0?left:right).push(dates[i]);
  const leftSet=new Set(left),rightSet=new Set(right);
  const inner=dates.filter(d=>leftSet.has(d)&&rightSet.has(d));
  const full=dates.filter(d=>leftSet.has(d)||rightSet.has(d));
  const csv=CSV.toCSV({dates,names,matrix:clean.matrix});
  return{clean,wide:{dates,names,matrix:clean.matrix},long,left,right,inner,full,csv,exportLines:csv.split('\n').filter(Boolean).length,
    rename:names.map((name,j)=>({from:name,to:'V'+(j+1)})),preview:long.slice(0,9)};
}
/* ---------- 6. AI suggestions versus the rule pipeline ---------- */
const AI_SUGGESTIONS=[
  {key:'typo',title:['自动把极端最大值替换为该列中位数','Replace the extreme maximum with the column median'],effect:['用中位数抹平 10 倍录入错误','Smooth the 10x entry error into the median'],verdict:'reject',
   why:['12.52 是 1.252 的 10 倍录入错误，应回源更正，而不是把错误值变成"看起来正常"的中位数。','12.52 is 1.252 times ten: fix the source instead of turning the bad value into a plausible-looking median.']},
  {key:'zero',title:['把缺失单元格填为 0','Fill missing cells with zero'],effect:['把缺失当成真实的 0','Treat missing as a genuine zero'],verdict:'reject',
   why:['价格不可能是 0；用 0 填充会制造 -100% 的假收益。','A price cannot be zero; zero-filling manufactures a fake -100% return.']},
  {key:'drop',title:['删除所有含缺失值的整行','Drop every row containing a missing cell'],effect:['样本量下降，但口径一致','Fewer rows, a consistent basis'],verdict:'reject',
   why:['只有在缺失完全随机时才可接受；必须报告删除比例与影响。','This is only acceptable if missingness is completely random; report the share dropped.']},
  {key:'naive',title:['日期直接交给 as.Date 默认格式','Hand dates to as.Date with the default format'],effect:['混合格式会静默变成 NA','Mixed formats silently become NA'],verdict:'reject',
   why:['本样本混合了 ISO、斜杠与紧凑三种格式，默认解析会产生 NA；必须显式回退格式。','The sample mixes ISO, slash and compact formats, so the default parse yields NA; explicit fallbacks are required.']},
  {key:'long',title:['把宽表转换为长表用于建模','Reshape the wide table into long format for modelling'],effect:['只改变形状，不改变数值','Shape-only change, values untouched'],verdict:'accept',
   why:['长表是输出形状，日期与数值一一对应，可接受。','Long format is an output shape; dates and values still map one-to-one.']},
  {key:'clamp',title:['对所有价格做均值 ±3 倍标准差截断','Clamp every price to mean ± 3 standard deviations'],effect:['把趋势端点也一并压平','Flattens trend endpoints as well'],verdict:'reject',
   why:['价格水平带有趋势，3σ 截断会误伤趋势端点；异常值检测应作用于收益率。','Price levels trend, so 3-sigma clipping damages trend endpoints; outlier tests belong on returns.']}
];
function aiRun(p){
  const base=cleanWith(p,{missing:'ffill'});
  let dates=[...base.dates],matrix=base.matrix.map(r=>r.slice()),names=[...base.names];
  const baseCopy=matrix.map(r=>r.slice()),baseDates=[...dates];
  const missing=base.missingCells.map(c=>({...c,col:names.indexOf(c.column)}));
  const changes=[],log=[];let changed=0;
  const accept=k=>p.ai&&p.ai[k]&&p.ai[k].decision==='accept';
  log.push({code:'base',rows:dates.length,missing:missing.length});
  if(accept('typo')){
    let best=null;
    names.forEach((name,j)=>{
      const col=matrix.map(r=>r[j]).filter(Number.isFinite);if(col.length<8)return;
      const med=CSV.quantileOf(col,.5),mad=CSV.quantileOf(col.map(v=>Math.abs(v-med)),.5)*1.4826;
      if(!(mad>0))return;
      matrix.forEach((row,i)=>{const v=row[j];if(!Number.isFinite(v))return;const score=Math.abs(v-med)/mad;if(!best||score>best.score)best={row:i,col:j,score,value:v,med,name};});
    });
    if(best){matrix[best.row][best.col]=best.med;changed++;changes.push({date:dates[best.row],name:best.name,before:best.value,after:best.med,key:'typo'});log.push({code:'typo',row:best.row+1,col:best.col+1,before:best.value,after:best.med});}
  }
  if(accept('zero')){
    let n=0;
    for(const cell of missing){const i=dates.indexOf(cell.date);if(i<0)continue;matrix[i][cell.col]=0;changed++;n++;changes.push({date:cell.date,name:cell.column,before:null,after:0,key:'zero'});}
    log.push({code:'zero',cells:n});
  }
  if(accept('drop')){
    const dropDates=new Set(missing.map(c=>c.date));const keep=dates.map(d=>!dropDates.has(d));
    matrix=matrix.filter((_,i)=>keep[i]);dates=dates.filter((_,i)=>keep[i]);changed+=keep.filter(x=>!x).length;
    log.push({code:'drop',rows:keep.filter(x=>!x).length});
  }
  if(accept('clamp')){
    let n=0;
    names.forEach((name,j)=>{
      const col=matrix.map(r=>r[j]).filter(Number.isFinite);if(col.length<2)return;
      const lo=S.mean(col)-3*S.sd(col),hi=S.mean(col)+3*S.sd(col);
      matrix.forEach((row,i)=>{const v=row[j];if(!Number.isFinite(v))return;const next=Math.min(hi,Math.max(lo,v));if(next!==v){matrix[i][j]=next;changed++;n++;changes.push({date:dates[i],name,before:v,after:next,key:'clamp'});}});
    });
    log.push({code:'clamp',cells:n});
  }
  if(accept('naive')){
    const naiveN=base.dates.length; /* reported, never executed: would turn mixed formats into NA */
    log.push({code:'naive',datesAtRisk:naiveN});
  }
  if(accept('long'))log.push({code:'long',rows:dates.length*names.length});
  const stats=j=>{const v=matrix.map(r=>r[j]).filter(Number.isFinite);return{n:v.length,mean:v.length?S.mean(v):NaN,sd:v.length>1?S.sd(v):NaN,min:v.length?Math.min(...v):NaN,max:v.length?Math.max(...v):NaN};};
  const baseStats=colStats(base),resultStats=colStats({names,matrix});
  const decisions=AI_SUGGESTIONS.map(s=>({...s,decision:p.ai[s.key].decision,reason:String(p.ai[s.key].reason||'').trim()}));
  return{base,names,dates,matrix,baseCopy,baseDates,missing,changes,changed,log,baseStats,resultStats,decisions,
    accepted:decisions.filter(d=>d.decision==='accept').length,rejected:decisions.filter(d=>d.decision==='reject').length,pending:decisions.filter(d=>d.decision==='pending').length,
    statsFor:j=>stats(j),meta:{...SAMPLE_META,rowsRaw:base.summary.rawRows,rowsClean:dates.length,columns:base.summary.assets+3}};
}
/* ---------- 6. 数据来源、格式与可追溯性 ---------- */
/* 这一节不联网：它把"取数规格"变成一份可复核的元数据与一套待人工执行的 R 模板，
   并说明为什么脚本里不能写死账号、为什么必须保存原始快照。 */
function dbView(p){
  const clean=cleanWith(p,{missing:'ffill'});
  const source=SOURCES.find(x=>x[0]===p.source)||SOURCES[0];
  const freq=FREQS.find(x=>x[0]===p.frequency)||FREQS[2];
  const adj=ADJS.find(x=>x[0]===p.adjust)||ADJS[2];
  const names=clean.names,dates=clean.dates,matrix=clean.matrix;
  /* 快照指纹：对整张清理后的表做确定性哈希，用于核对"这份文件就是当时那份"。 */
  const body=[names.join(','),...matrix.map((r,i)=>[dates[i],...r.map(v=>Number.isFinite(v)?v.toFixed(8):'')].join(','))].join('\n');
  let hash=2166136261;
  for(let i=0;i<body.length;i++)hash=Math.imul(hash^(body.charCodeAt(i)&0xff),16777619);
  const fingerprint=(hash>>>0).toString(16).padStart(8,'0');
  const formats={iso:0,slash:0,compact:0,other:0};
  clean.rawRowsSource?null:null;
  const meta={
    source:source[0],sourceLabel:source[1],sourceLabelEn:source[2],frequency:freq[0],frequencyLabel:freq[1],frequencyLabelEn:freq[2],adjust:adj[0],adjustLabel:adj[1],adjustLabelEn:adj[2],
    retrieved:p.retrieved,table:p.dbTable||'',rows:dates.length,assets:names.length,
    from:dates[0],to:dates[dates.length-1],unit:'decimal simple returns',
    missingPolicy:p.missing,outlierPolicy:`${p.outlier}/${p.outlierAction}`,
    fingerprint,license:['使用者自行确认（本页不代为声明）','User-confirmed (this page asserts no licence)'],
    notes:[
      ['凭证只能放在环境变量或 keyring 中，脚本里不得出现账号密码','Credentials belong in environment variables or a keyring; never put accounts or passwords in a script'],
      ['原始快照与清洗日志一起归档，指纹用于核对是否同一份数据','Archive the raw snapshot together with the cleaning log; the fingerprint shows whether two runs used the same file'],
      ['复权口径与频率必须与建模口径一致，否则收益率不可比','Adjustment and frequency must match the modelling convention, otherwise returns are not comparable'],
      ['跨源对齐要先统一交易日历与复权方式，再做日期配对','Align the trading calendar and adjustment before pairing dates across sources']
    ]
  };
  const rTemplate=[
    '# 取数模板（本页不执行；凭证从环境变量读取）',
    'if (meta$source == "db") {',
    '  # con <- DBI::dbConnect(odbc::odbc(), dsn = Sys.getenv("FML_DSN"))',
    '  # raw <- DBI::dbGetQuery(con, "select trade_date, asset, close from prices where trade_date between ? and ?",',
    '  #   params = list(start, end))',
    '  # DBI::dbDisconnect(con)',
    '}',
    'if (meta$source == "api") {',
    '  # quantmod::getSymbols("000001.SS", from = start, to = end, auto.assign = TRUE)',
    '}',
    'if (meta$source == "file") {',
    '  # raw <- read.csv(file.choose(), fileEncoding = "UTF-8")',
    '}',
    '# 存档：原始快照 + 元数据 + 指纹',
    '# write.csv(raw, "data/raw-snapshot.csv", row.names = FALSE)',
    '# tools::md5sum("data/raw-snapshot.csv")'
  ];
  return{clean,meta,rTemplate,sourceLabel:source[1],sourceEn:source[2],freqLabel:freq[1],freqEn:freq[2],adjLabel:adj[1],adjEn:adj[2],
    fingerprint,rows:dates.length,assets:names.length,from:dates[0],to:dates[dates.length-1],
    formats,flow:[['source','选择数据源'],['auth','凭证与权限'],['snapshot','保存原始快照'],['normalize','格式标准化'],['validate','校验与配对'],['log','元数据留痕']]};
}
/* ---------- view dispatch used by the workbench ---------- */
function buildView(view,p){
  check(p);
  if(view==='import')return importView(p);
  if(view==='dates')return datesView(p);
  if(view==='missing')return missingView(p);
  if(view==='outlier')return outlierView(p);
  if(view==='shape')return shapeView(p);
  if(view==='db')return dbView(p);
  return aiRun(p);
}
return{defaults,SOURCES,FREQS,ADJS,cloneDefaults,check,views,dbView,ASSET_LABELS,AI_KEYS,AI_SUGGESTIONS,DELIMS,POLICIES,METHODS,ACTIONS,RESAMPLE,
  sampleCSV,SAMPLE,SAMPLE_META,importView,datesView,missingView,outlierView,shapeView,aiRun,detectOutliers,colStats,buildView,
  formatOf,monthKeysBetween,logEntry};
});
