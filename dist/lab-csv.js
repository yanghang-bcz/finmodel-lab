/* Deterministic CSV ingestion and cleaning engine for experiment 02.
   Every step is explicit and logged: nothing is silently repaired, dropped or
   filled, and the log is what the R script reproduces line by line. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.LabCSV=api;})(this,()=>{
'use strict';
const NA_TOKENS=new Set(['','na','n/a','n.a.','null','nil','nan','-','--','—','.','#n/a']);
const DEFAULT_OPTIONS=Object.freeze({delimiter:'auto',dateColumn:0,missing:'drop',outlier:'none',outlierAction:'flag',z:3,iqr:1.5,scale:'decimal',dedupe:true,sort:true,resample:'none',long:false,winsor:.05});
function detectDelimiter(line){const counts=[[',',line.split(',').length],[';',line.split(';').length],['\t',line.split('\t').length]];counts.sort((a,b)=>b[1]-a[1]);return counts[0][1]>1?counts[0][0]:',';}
/* RFC4180-style reader; keeps every row so the audit log can name bad ones. */
function parse(text,{delimiter='auto'}={}){
  if(typeof text!=='string')throw Error('CSV 内容须为文本。/ CSV content must be text.');
  if(text.length>4000000)throw Error('CSV 超过 4MB 上限。/ CSV exceeds the 4 MB limit.');
  let body=text.replace(/^\uFEFF/,'');
  const firstBreak=body.search(/\r?\n/),head=body.slice(0,firstBreak<0?body.length:firstBreak);
  const delim=delimiter==='auto'?detectDelimiter(head):delimiter;
  const rows=[];let row=[],cell='',quoted=false,badQuote=0;
  for(let i=0;i<body.length;i++){
    const c=body[i];
    if(c==='"'){
      if(quoted&&body[i+1]==='"'){cell+='"';i++;}
      else if(quoted){quoted=false;}
      else if(cell.trim()===''){quoted=true;}
      else badQuote++;
    }else if(c===delim&&!quoted){row.push(cell);cell='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&body[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell='';}
    else cell+=c;
  }
  if(quoted)throw Error('CSV 第 '+(rows.length+1)+' 行引号未闭合。/ Unterminated quote in the CSV.');
  row.push(cell);rows.push(row);
  const kept=rows.filter(r=>r.some(x=>String(x).trim()!==''));
  const header=(kept.shift()||[]).map((h,i)=>{const v=String(h).trim().replace(/^"|"$/g,'');return v||'column'+(i+1);});
  return{header,rows:kept.map(r=>{const out=r.slice(0,header.length);while(out.length<header.length)out.push('');return out.map(x=>String(x).trim());}),delimiter:delim,badQuote,lineCount:rows.length};
}
function parseDate(raw){
  const s=String(raw).trim();if(!s)return null;
  let m;
  if((m=/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s)))return iso(+m[1],+m[2],+m[3]);
  if((m=/^(\d{4})(\d{2})(\d{2})$/.exec(s)))return iso(+m[1],+m[2],+m[3]);
  if((m=/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s)))return iso(+m[3],+m[2],+m[1]);
  if((m=/^(\d{4})[-/.](\d{1,2})$/.exec(s)))return iso(+m[1],+m[2],1);
  return null;
  function iso(y,mo,d){if(!(y>=1900&&y<=2200)||!(mo>=1&&mo<=12)||!(d>=1&&d<=31))return null;const t=new Date(Date.UTC(y,mo-1,d));return t.getUTCMonth()!==mo-1||t.getUTCDate()!==d?null:t.toISOString().slice(0,10);}
}
const isMissing=v=>NA_TOKENS.has(String(v).trim().toLowerCase());
function toNumber(raw,{scale='decimal'}={}){
  if(isMissing(raw))return null;
  let s=String(raw).trim().replace(/,/g,'').replace(/\s/g,'');
  let pct=false;
  if(/%$/.test(s)){pct=true;s=s.slice(0,-1);}
  if(!/^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/.test(s))return null;
  const v=Number(s);
  if(!Number.isFinite(v))return null;
  return (pct?v/100:v)/(scale==='percent'?100:1);
}
function monthKey(date){return date.slice(0,7);}
function weekKey(date){const t=Date.parse(date+'T00:00:00Z');const day=(new Date(t).getUTCDay()+6)%7;return new Date(t+(3-day)*86400000).toISOString().slice(0,10);}
function quantileOf(a,p){const x=[...a].sort((u,v)=>u-v),h=(x.length-1)*p,lo=Math.floor(h),hi=Math.min(lo+1,x.length-1);return x[lo]+(x[hi]-x[lo])*(h-lo);}
/* Column diagnostics drive the "before" panel: type, missing share, outliers. */
function profile(header,rows){
  return header.map((name,j)=>{
    const values=rows.map(r=>r[j]),nonEmpty=values.filter(v=>!isMissing(v));
    const dates=nonEmpty.map(parseDate),numeric=nonEmpty.map(v=>toNumber(v));
    const dateOk=nonEmpty.length>0&&dates.every(Boolean),numOk=nonEmpty.length>0&&numeric.every(v=>v!==null);
    return{name,index:j,type:dateOk?'date':numOk?'number':'text',missing:values.length-nonEmpty.length,total:values.length,examples:nonEmpty.slice(0,3)};
  });
}
/* One pass over the raw table. Returns the cleaned matrix plus a step log whose
   entries are structured (`code` + numbers) so the UI can phrase them in either
   language without re-deriving anything. */
function clean(text,options={}){
  const o={...DEFAULT_OPTIONS,...options};
  const parsed=parse(text,{delimiter:o.delimiter});
  const headers=parsed.header,rows=parsed.rows,log=[];
  if(headers.length<2)throw Error('至少需要两列：日期列与一个数值列。/ At least two columns are required.');
  const profileBefore=profile(headers,rows);
  log.push({code:'parse',rows:rows.length,columns:headers.length,delimiter:parsed.delimiter,quoted:parsed.badQuote});
  if(!Number.isInteger(o.dateColumn)||o.dateColumn<0||o.dateColumn>=headers.length)throw Error('日期列索引超出范围。/ Date column index out of range.');
  const valueCols=headers.map((n,i)=>i).filter(i=>i!==o.dateColumn&&profileBefore[i].type!=='text');
  const textCols=headers.map((n,i)=>i).filter(i=>i!==o.dateColumn&&profileBefore[i].type==='text');
  if(!valueCols.length)throw Error('除日期列外没有可识别的数值列。/ No numeric column besides the date column.');
  /* 1. dates */
  const badDates=[];
  let work=rows.map((r,i)=>{const date=parseDate(r[o.dateColumn]);if(!date)badDates.push({row:i+2,raw:r[o.dateColumn]});return{date,raw:r,index:i+2};});
  if(badDates.length)throw Error('第 '+(badDates[0].row)+' 行的日期无法解析：'+(badDates[0].raw||'（空）')+'。请先修正或在清洗日志中核对格式。/ Unparseable date on data row '+badDates[0].row+'.');
  log.push({code:'dates',count:work.length,column:headers[o.dateColumn]});
  /* 2. duplicates */
  let duplicates=0;
  if(o.dedupe){const seen=new Set();work=work.filter(w=>{if(seen.has(w.date)){duplicates++;return false;}seen.add(w.date);return true;});}
  if(duplicates)log.push({code:'dedupe',dropped:duplicates});
  /* 3. sort */
  if(o.sort)work=[...work].sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
  if(o.sort)log.push({code:'sort'});
  /* 4. resample to the last observation of each calendar period */
  if(o.resample!=='none'){
    const key=w=>o.resample==='month'?monthKey(w.date):weekKey(w.date);
    const groups=new Map();
    for(const w of work){const k=key(w);if(!groups.has(k)||groups.get(k).date<w.date)groups.set(k,w);}
    const before=work.length;work=[...groups.values()].sort((a,b)=>a.date<b.date?-1:1);
    log.push({code:'resample',mode:o.resample,from:before,to:work.length});
  }
  /* 5. numeric conversion, missing policy, then outliers */
  const missingCells=[];
  let matrix=work.map(w=>valueCols.map((j,k)=>{
    const v=toNumber(w.raw[j],{scale:o.scale});
    if(v===null)missingCells.push({date:w.date,column:headers[j]});
    return v;
  }));
  if(missingCells.length&&o.missing==='reject')throw Error('存在 '+(missingCells.length)+' 个缺失值（首个：'+missingCells[0].date+' · '+missingCells[0].column+'）。请选择删除或前值填充策略。/ '+missingCells.length+' missing values found.');
  if(missingCells.length)log.push({code:'missing',count:missingCells.length,strategy:o.missing,first:missingCells[0]&&{date:missingCells[0].date,column:missingCells[0].column}});
  const datesBeforeMissing=work.map(w=>w.date);
  if(missingCells.length&&o.missing==='drop'){
    const keep=matrix.map(r=>r.every(v=>v!==null));
    matrix=matrix.filter((_,i)=>keep[i]);work=work.filter((_,i)=>keep[i]);
    log.push({code:'missing.drop',dropped:keep.filter(x=>!x).length});
  }else if(missingCells.length&&(o.missing==='ffill'||o.missing==='zero')){
    let carried=0,zeroed=0;
    for(let i=0;i<matrix.length;i++)for(let j=0;j<matrix[i].length;j++)if(matrix[i][j]===null){
      if(o.missing==='ffill'&&i>0&&matrix[i-1][j]!==null){matrix[i][j]=matrix[i-1][j];carried++;}
      else{matrix[i][j]=0;zeroed++;}
    }
    log.push({code:'missing.fill',carried,zeroed});
  }
  /* 6. outliers, flagged as (row,column) pairs before any action */
  const flags=[];
  if(o.outlier!=='none'){
    const n=matrix.length;
    for(let j=0;j<valueCols.length;j++){
      const col=matrix.map(r=>r[j]).filter(v=>Number.isFinite(v));
      if(col.length<8)continue;
      const m=col.reduce((s,v)=>s+v,0)/col.length,sd=Math.sqrt(col.reduce((s,v)=>s+(v-m)**2,0)/(col.length-1));
      const q1=quantileOf(col,.25),q3=quantileOf(col,.75),iqr=q3-q1,med=quantileOf(col,.5),mad=quantileOf(col.map(v=>Math.abs(v-med)),.5)*1.4826;
      for(let i=0;i<n;i++){
        const v=matrix[i][j];if(!Number.isFinite(v))continue;
        let score=null;
        if(o.outlier==='z'&&sd>0)score=Math.abs(v-m)/sd;
        if(o.outlier==='iqr'&&iqr>0)score=Math.max((v-q3)/(o.iqr*iqr),(q1-v)/(o.iqr*iqr));
        if(o.outlier==='mad'&&mad>0)score=Math.abs(v-med)/(o.iqr*mad);
        if(score!==null&&score>1)flags.push({row:i,column:j,value:v,score,date:work[i].date});
      }
    }
    log.push({code:'outlier',method:o.outlier,count:flags.length});
    if(flags.length&&o.outlierAction==='winsorize'){
      const byCol=new Map();for(const f of flags){if(!byCol.has(f.column))byCol.set(f.column,[]);byCol.get(f.column).push(f.row);}
      for(const [j,list] of byCol){const col=matrix.map(r=>r[j]).filter(Number.isFinite).sort((a,b)=>a-b);const lo=quantileOf(col,o.winsor),hi=quantileOf(col,1-o.winsor);for(const i of list)matrix[i][j]=Math.min(hi,Math.max(lo,matrix[i][j]));}
      log.push({code:'outlier.winsor',count:flags.length,winsor:o.winsor});
    }else if(flags.length&&o.outlierAction==='drop'){
      const drop=new Set(flags.map(f=>f.row));
      matrix=matrix.filter((_,i)=>!drop.has(i));work=work.filter((_,i)=>!drop.has(i));
      log.push({code:'outlier.drop',dropped:drop.size});
    }
  }
  /* 7. long format is an output shape, never a second source of truth */
  const names=valueCols.map(j=>headers[j]);
  let long=null;
  if(o.long)long=work.flatMap((w,i)=>names.map((name,j)=>({date:w.date,asset:name,value:matrix[i][j]})));
  const dates=work.map(w=>w.date);
  const summary={rawRows:rows.length,keptRows:matrix.length,dropped:rows.length-matrix.length,duplicates,missing:missingCells.length,outliers:flags.length,assets:names.length,from:dates[0]||null,to:dates[dates.length-1]||null,textColumns:textCols.map(j=>headers[j])};
  return{names,dates,matrix,long,flags,missingCells,log,summary,profileBefore,profileAfter:valueCols.map((j,k)=>({name:headers[j],missing:matrix.filter(r=>!Number.isFinite(r[k])).length,total:matrix.length})),source:{delimiter:parsed.delimiter,rows:rows.length,columns:headers.length,badQuote:parsed.badQuote,skippedDates:badDates.length,datesBeforeMissing}};
}
/* Convert a cleaned matrix back to wide CSV text (export and R hand-off). */
function toCSV({names,dates,matrix},dateName='date'){
  const lines=[[dateName,...names].join(',')];
  matrix.forEach((r,i)=>lines.push([dates[i],...r.map(v=>Number.isFinite(v)?String(v):'')].join(',')));
  return lines.join('\n')+'\n';
}
/* Simple returns from a wide price matrix, ready for the diagnostics panel. */
function returnsOf(matrix){
  return matrix.slice(1).map((row,i)=>row.map((v,j)=>matrix[i][j]>0&&Number.isFinite(v)?v/matrix[i][j]-1:null));
}
return{parse,parseDate,toNumber,isMissing,profile,clean,toCSV,returnsOf,quantileOf,monthKey,weekKey,DEFAULT_OPTIONS,NA_TOKENS:[...NA_TOKENS]};});
