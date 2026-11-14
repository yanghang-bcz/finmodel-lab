/* Experiment02 · workbench descriptor for LabRunner. */
(()=>{'use strict';
const M=DataPrepMath,C=DataPrepCode;
const EXTRA={'备用字段':['备用字段','Spare column'],'备注':['备注','Note']};
const nm=(name,K)=>{const m=(M.ASSET_LABELS&&M.ASSET_LABELS[name])||EXTRA[name];return m?K.t(m[0],m[1]):name;};
const LAB={
  id:'dataprep',cls:'dataprep-lab',global:'DataPrepLab',
  views:M.views,
  defaults:()=>M.cloneDefaults(),
  check:p=>M.check(p),
  basic:false,
  params(p,view,K){
    const asset=[[0,'股票A','Stock A'],[1,'股票B','Stock B'],[2,'债券C','Bond C']];
    let html='';
    if(view==='import')html+=K.select({id:'delimiter',zh:'分隔符',en:'Delimiter',value:p.delimiter,options:M.DELIMS});
    if(view==='dates')html+=K.select({id:'resample',zh:'频率对齐',en:'Frequency alignment',value:p.resample,options:M.RESAMPLE});
    if(view==='missing')html+=K.select({id:'missing',zh:'缺失值策略',en:'Missing-value policy',value:p.missing,options:M.POLICIES});
    if(view==='outlier'){
      html+=K.select({id:'outlier',zh:'异常值规则',en:'Outlier rule',value:p.outlier,options:M.METHODS});
      html+=K.field({id:'k',zh:'阈值倍数',en:'Fence multiplier',value:p.k,min:.1,max:10,step:.1});
      html+=K.select({id:'outlierAction',zh:'处理方式',en:'Treatment',value:p.outlierAction,options:M.ACTIONS});
      html+=K.select({id:'asset',zh:'查看资产',en:'Asset shown',value:p.asset,options:asset});
    }
    if(view==='shape')html+=K.field({id:'bins',zh:'直方图分组',en:'Histogram bins',value:p.bins,min:4,max:40,step:1});
    if(view==='ai')html+=`<p class="lab-note">${K.esc(K.t('每条 AI 建议都要显式接受或拒绝并写明理由；未决策时结果保持基线。','Every AI suggestion must be accepted or rejected with a reason; undecided items leave the result at the baseline.'))}</p>`;
    if(view==='db'){
      html+=K.select({id:'source',zh:'来源类型',en:'Source type',value:p.source,options:M.SOURCES});
      html+=K.select({id:'frequency',zh:'数据频率',en:'Frequency',value:p.frequency,options:M.FREQS});
      html+=K.select({id:'adjust',zh:'复权口径',en:'Adjustment',value:p.adjust,options:M.ADJS});
      html+=`<label for="lab-retrieved"><span>${K.esc(K.t('取数日期（YYYY-MM-DD）','Retrieved (YYYY-MM-DD)'))}</span><input id="lab-retrieved" data-kind="text" type="text" value="${K.esc(p.retrieved)}"></label>`;
      html+=`<label for="lab-dbTable"><span>${K.esc(K.t('表/代码（仅记录，不连接）','Table / ticker (recorded only)'))}</span><input id="lab-dbTable" data-kind="text" type="text" value="${K.esc(p.dbTable||'')}"></label>`;
      html+=`<p class="lab-note">${K.esc(K.t('本页不联网、不连接数据库：它把取数规格落成可复核的元数据与一份待人工执行的 R 模板。','This page never goes online or connects to a database: it turns the request into auditable metadata plus an R template you run yourself.'))}</p>`;
    }
    const area=document.createElement('div');
    html+=`<div class="lab-block"><h3>${K.esc(K.t('数据源','Data source'))}</h3>
      <p class="lab-prose">${K.esc(K.t('内置 36 行故意弄脏的教学样本：混合日期写法、重复日期、缺失单元格、10 倍录入错误、空列与文本列。也可以粘贴你自己的 CSV；文件只在浏览器内处理。','The built-in 36-row teaching sample is deliberately messy: mixed date formats, a duplicated date, missing cells, a ten-fold entry error, an empty column and a free-text column. You can also paste your own CSV; it never leaves the browser.'))}</p>
      <label class="lab-file">${K.esc(K.t('CSV 文本','CSV text'))}<textarea id="lab-csv" class="lab-textarea" data-fml-skip rows="6">${K.esc(p.csv)}</textarea></label>
      <label class="lab-file">${K.esc(K.t('导入本地 CSV','Import a local CSV'))}<input id="lab-file" type="file" accept=".csv,text/csv"></label>
      <p class="lab-source">${K.esc(K.t('来源：合成教学样本 · 许可 CC0-1.0 · 读取日期 2026-11-14','Source: synthetic teaching sample · licence CC0-1.0 · retrieved 2026-11-14'))}</p></div>`;
    return html;
  },
  question(view){
    return {
      import:['读进来的是"数据"还是"文本"？列类型如何决定后续每一步？','Is the file data or text yet? How do column types drive every later step?'],
      dates:['三种日期写法、重复日期与缺月，会让配对错位到什么程度？','How far do three date spellings, a duplicated date and a missing month push the pairs out of step?'],
      missing:['删除、前值填充与补零，分别改变了什么？','What do deletion, carry-forward and zero-filling each change?'],
      outlier:['异常值是应当删除的"错误"，还是需要回源核对的"可疑值"？','Is an outlier an error to delete, or a suspect value to check at source?'],
      shape:['宽表与长表是同一份数据吗？转换前后如何核对？','Are wide and long the same data, and how do you reconcile them?'],
      ai:['AI 的清洗建议，哪一条应当拒绝？理由是什么？','Which AI cleaning suggestion should be rejected, and why?'],
      db:['同一份"月度总收益"从数据库、终端或本地文件取回，怎样证明它们是同一份数据？','Whether the data comes from a database, a terminal or a local file, how do you prove the three extracts are the same data?']
    }[view];
  },
  summary(view){
    return {
      import:[['先看类型','Types first'],['保留原文','Keep the raw text'],['记录来源','Record provenance']],
      dates:[['统一 ISO','Unify to ISO'],['去重','Deduplicate'],['检查缺月','Check gaps']],
      missing:[['删除','Drop'],['前值填充','Carry forward'],['补零有代价','Zero-filling has a cost']],
      outlier:[['先标记','Flag first'],['回源核对','Check at source'],['缩尾压方差','Winsorising compresses variance']],
      shape:[['宽表','Wide'],['长表','Long'],['核对行数','Reconcile counts']],
      ai:[['建议是候选','Suggestions are candidates'],['写明理由','State the reason'],['留痕','Keep the record']],
      db:[['来源可追溯','Traceable source'],['快照与指纹','Snapshot and fingerprint'],['口径先统一','Align the convention first']]
    }[view];
  },
  assumptions(view){
    return {
      import:['列类型由内容推断：全部可解析为日期则为日期列，全部可解析为数值则为数值列，否则按文本处理。空列与自由文本列不参与数值清洗，但会出现在日志里。','Column types are inferred from content: all-parseable dates are a date column, all-parseable numbers are numeric, anything else is text. Empty and free-text columns never enter numeric cleaning, but they do appear in the log.'],
      dates:['日期是主键。规范化后重复日期整行保留第一条，排序保证配对不错位；缺失的月份不会被填补成观测。解析失败立即停止，不静默丢弃。','The date is the key. After normalisation the first row of a duplicated date is kept and sorting keeps pairs aligned; a missing month is never invented as an observation. A parse failure stops the run instead of being dropped silently.'],
      missing:['删除保留真实观测但改变样本量；前值填充保留样本量并制造为零的收益；补零会把缺失当成"没有变化"。三种策略都必须写进清洗日志。','Deletion keeps real observations but changes the sample size; carry-forward keeps the size and manufactures zero returns; zero-filling treats a missing value as "no change". All three must be logged.'],
      outlier:['异常值先标记、再决定处理。z 分数受异常值本身影响，IQR 与 MAD 更稳健；缩尾会压缩方差并改变分位点，删除会减少样本。本样本中的 10 倍录入错误应当回源更正，而不是缩尾。','Flag outliers first, then decide. The z-score is itself distorted by the outlier, while IQR and MAD are robust; winsorising compresses variance and shifts quantiles, and deletion shrinks the sample. The ten-fold entry error here should be corrected at source rather than winsorised.'],
      shape:['宽表每行一个日期、每列一个资产；长表每行一个(日期,资产)观测。两者行数满足 长表行数 = 日期数 × 资产数；reshape 的时间键必须唯一。','Wide has one row per date and one column per asset; long has one row per (date, asset) observation. The row count satisfies long = dates × assets, and the reshape time key must be unique.'],
      ai:['AI 建议只是候选操作。接受的建议会进入管线并改变结果，拒绝的要写明理由；未决策时结果等于基线。用中位数替换 10 倍录入错误会让错误"看起来正常"，这正是要拒绝的理由。','An AI suggestion is only a candidate action. Accepted items enter the pipeline and change the result; rejected ones need a stated reason; undecided items leave the baseline. Replacing a ten-fold entry error with the median makes the error look normal, which is exactly why it must be rejected.'],
      db:['本视图不连接任何数据库或行情终端：它演示"取数规格 → 元数据 → R 模板 → 原始快照指纹"的流程。凭证只放在环境变量或 keyring，不得写入脚本；复权口径、频率与交易日历必须在取数时确定，不能留到建模阶段再猜。','This view connects to no database or market terminal: it demonstrates request → metadata → R template → snapshot fingerprint. Credentials live in environment variables or a keyring, never in the script; adjustment, frequency and the trading calendar must be fixed at extraction time, not guessed later during modelling.']
    }[view];
  },
  compute(p,view){return M.buildView(view,p);},
  chartTitle(q,p,view){return {db:['取数流程与留痕点','Extraction pipeline and audit points'],import:['列类型与缺失','Column types and missing cells'],dates:['月度日历与缺月','Monthly calendar and gaps'],missing:['缺失单元格分布','Missing-cell map'],outlier:['资产取值与围栏','Values and fences'],shape:['宽表与长表的行数','Wide and long row counts'],ai:['AI 建议的影响','Effect of the AI suggestions']}[view];},
  metrics(q,p,view,K){
    if(view==='db')return K.metrics([['处理行数','Rows',String(q.rows)],['资产列','Assets',String(q.assets)],['快照指纹','Snapshot fingerprint',q.fingerprint]]);
    if(view==='import')return K.metrics([['原始行数','Raw rows',String(q.rows)],['列数','Columns',String(q.columns)],['删除行数','Rows dropped',String(q.dropped)]]);
    if(view==='dates')return K.metrics([['有效日期','Valid dates',String(q.rows)],['重复日期','Duplicates',String(q.dupeCount)],['缺月','Missing months',String(q.gaps.length)]]);
    if(view==='missing'){const m=q.missing;return K.metrics([['缺失单元格','Missing cells',String(m.length)],['保留行数','Rows kept',String(q.applied.rows)],['策略','Policy',q.applied.policy]]);}
    if(view==='outlier')return K.metrics([['标记数','Flagged',String(q.allFlags.length)],['规则','Rule',p.outlier.toUpperCase()],['样本行','Rows',String(q.stats[0]?q.stats[0].n:0)]]);
    if(view==='shape')return K.metrics([['宽表行数','Wide rows',String(q.clean.dates.length)],['资产数','Assets',String(q.clean.names.length)],['长表行数','Long rows',String(q.long.length)]]);
    const a=q;return K.metrics([['接受','Accepted',String(a.accepted)],['拒绝','Rejected',String(a.rejected)],['待定','Pending',String(a.pending)]]);
  },
  legend(q,p,view,K){
    if(view==='db')return K.legend([['数据源','Source','#6689a8',false],['频率与复权','Frequency and adjustment','#9b88ac',false],['审计留痕','Audit trail','#659b8a',false]]);
    return K.legend([['数据','Data','#6689a8',false],['缺失/异常','Missing or outlier','#b5816f',true],['基准','Baseline','#b5bfcc',true]]);},
  chart(q,p,view,{svgHost,K}){
    if(view==='db'){
      return K.flow(svgHost(),[
        ['选源','Source',K.t(q.sourceLabel,q.sourceEn)],
        ['凭证','Creds','env'],
        ['快照','Snapshot',q.fingerprint],
        ['标准化','Normalise','ISO / decimal'],
        ['校验','Validate',`${q.rows}×${q.assets}`],
        ['留痕','Log',q.meta.retrieved]],2);
    }
    if(view==='import'){
      const names=q.before.map(c=>c.name),counts=q.before.map(c=>c.missing);
      return K.chart(svgHost(),{yZero:true,xLabel:['列','Column'],yLabel:['缺失单元格','Missing cells'],xTickFormat:v=>String(v).slice(0,6),
        series:[{type:'bar',points:counts.map((v,i)=>[i+1,v]),color:'#b5816f',gap:.6,tip:d=>[`${names[Math.round(d[0])-1]}：${Math.round(d[1])} 个缺失`,'Column '+Math.round(d[0])+': '+Math.round(d[1])+' missing']}],aria:['缺失分布','Missing values']});
    }
    if(view==='dates'){
      return K.chart(svgHost(),{yZero:true,xLabel:['月份序号','Month index'],yLabel:['观测数','Observations'],xTickFormat:v=>String(Math.round(v)),
        series:[{type:'bar',points:q.calendar.map((c,i)=>[i+1,c.present?1:0]),color:'#6689a8',gap:.75,tip:d=>[`${q.calendar[Math.round(d[0])-1].k}：${q.calendar[Math.round(d[0])-1].present?'存在':'缺失'}`,'Month '+q.calendar[Math.round(d[0])-1].k+': '+(q.calendar[Math.round(d[0])-1].present?'present':'missing')]}],
        refs:[{axis:'y',value:1,color:'#659b8a',dash:true}],aria:['月度日历','Monthly calendar']});
    }
    if(view==='missing'){
      const rows=q.applied.clean.matrix.length;
      const per=q.applied.clean.names.map((n,j)=>q.applied.clean.matrix.filter(r=>!Number.isFinite(r[j])).length);
      return K.chart(svgHost(),{yZero:true,xLabel:['列','Column'],yLabel:['缺失单元格','Missing cells'],
        series:[{type:'bar',points:per.map((v,i)=>[i+1,v]),color:'#b5816f',gap:.6,tip:d=>[`${q.applied.clean.names[Math.round(d[0])-1]}：${Math.round(d[1])}`,'Column '+Math.round(d[0])+': '+Math.round(d[1])]}],
        refs:[{axis:'y',value:0,color:'#b9c7cf',dash:false}],aria:['清洗后缺失','Missing after cleaning']});
    }
    if(view==='outlier'){
      const f=q.det.fences.find(x=>x.j===Number(p.asset))||q.det.fences[0];
      const s=q.series[f.j]||[];
      return K.chart(svgHost(),{yZero:false,xLabel:['观测序号','Observation'],yLabel:['取值','Value'],
        series:[{type:'line',points:s.map((v,i)=>[i+1,v]),color:'#6689a8',marker:true,tip:d=>[`第 ${Math.round(d[0])} 个观测：${Number(d[1]).toFixed(3)}`,'Observation '+Math.round(d[0])+': '+Number(d[1]).toFixed(3)]}],
        refs:[{axis:'y',value:f.lo,color:'#b5816f',dash:true,label:['下围栏','lower fence']},{axis:'y',value:f.hi,color:'#b5816f',dash:true,label:['上围栏','upper fence']}],
        aria:['取值与围栏','Values and fences']});
    }
    if(view==='shape'){
      return K.flow(svgHost(),[['宽表','Wide',q.clean.dates.length+' × '+q.clean.names.length],['重整','Reshape',''],['长表','Long',String(q.long.length)],['导出','Export','CSV']],1);
    }
    const marks=q.decisions.map((d,i)=>d.decision==='reject'?[i+1,-1]:d.decision==='accept'?[i+1,1]:[i+1,0]);
    return K.chart(svgHost(),{yZero:true,xLabel:['建议序号','Suggestion index'],yLabel:['决策：拒绝 −1 / 待定 0 / 接受 1','Decision: reject −1 / pending 0 / accept 1'],
      xTickFormat:v=>String(Math.round(v)),series:[{type:'bar',points:marks,color:'#8c80a3',gap:.6,tip:d=>[`${q.decisions[Math.round(d[0])-1].title[0]}：${d[1]>0?'接受':d[1]<0?'拒绝':'待定'}`,'Suggestion '+Math.round(d[0])+': '+(d[1]>0?'accept':d[1]<0?'reject':'pending')]}],
      refs:[{axis:'y',value:0,color:'#b9c7cf',dash:false}],aria:['AI 决策','AI decisions']});
  },
  details(q,p,view,K){
    if(view==='db'){
      const m=q.meta;
      return K.table([['字段','Field'],['值','Value']],[
        [K.t('数据来源','Source'),K.t(m.sourceLabel,m.sourceLabelEn)],[K.t('频率','Frequency'),K.t(m.frequencyLabel,m.frequencyLabelEn)],[K.t('复权口径','Adjustment'),K.t(m.adjustLabel,m.adjustLabelEn)],
        [K.t('取数日期','Retrieved'),m.retrieved],[K.t('表/代码','Table / ticker'),m.table||'—'],
        [K.t('区间','Range'),`${m.from} → ${m.to}`],[K.t('规模','Size'),`${m.rows} × ${m.assets}`],
        [K.t('单位','Unit'),m.unit],[K.t('缺失策略','Missing policy'),m.missingPolicy],[K.t('异常策略','Outlier policy'),m.outlierPolicy],
        [K.t('快照指纹','Snapshot fingerprint'),m.fingerprint],[K.t('许可','Licence'),K.t(m.license[0],m.license[1])]])+
        `<p class="chart-note">${m.notes.map(n=>K.esc(K.t(n[0],n[1]))).join('<br>')}</p>`+
        `<p class="chart-note">${K.esc(K.t('连接模板在左侧 R 代码的"取数规格与元数据"段落里，全部注释、不会自动执行。','The connection template lives in the "Extraction request and metadata" block of the R code on the left; it is fully commented and never runs.'))}</p>`;
    }
    if(view==='import')return K.table([['列','Column'],['类型','Type'],['缺失','Missing']],q.before.map(c=>[nm(c.name,K),c.type,String(c.missing)]))+
      `<p class="chart-note">${K.esc(K.t('分隔符：','Delimiter: '))}${K.esc(q.delimiter)}${K.esc(K.t('；解析后的行数变化记录在清洗日志中。','; every row-count change is recorded in the audit log.'))}</p>`;
    if(view==='dates')return K.table([['日期写法','Spelling'],['条数','Rows']],Object.entries(q.formats).map(([k,v])=>[k,String(v)]))+
      `<p class="chart-note">${K.esc(K.t('重复日期：','Duplicated dates: '))}${q.duplicates.map(d=>d.date).join(', ')||'—'}${K.esc(K.t('；缺月：','; missing months: '))}${q.gaps.join(', ')||'—'}</p>`;
    if(view==='missing')return K.table([['策略','Policy'],['可行','Feasible'],['保留/影响','Rows']],q.policies.map(x=>[x.policy,x.ok?K.t('可行','feasible'):K.t('冲突','conflict'),String(x.ok?x.rows:'—')]));
    if(view==='outlier')return K.table([['资产','Asset'],['围栏下','Lower'],['围栏上','Upper'],['标记','Flagged']],q.det.fences.map(f=>[nm(f.name,K),Number(f.lo).toFixed(3),Number(f.hi).toFixed(3),String(f.count)]));
    if(view==='shape')return K.table([['格式','Layout'],['行数','Rows'],['列数','Columns']],[[K.t('宽表','Wide'),'—',String(q.clean.dates.length),String(q.clean.names.length)],[K.t('长表','Long'),'—',String(q.long.length),'3']]).replace(/<\/table>$/,'</table>')+`<p class="chart-note">${K.esc(K.t('长表预览：','Long preview: '))}${q.preview.slice(0,3).map(r=>r.date+' · '+nm(r.asset,K)+' · '+r.value).join(' | ')}</p>`;
    const rows=q.decisions.map((d,i)=>[K.t(...d.title),K.t(d.verdict==='reject'?'应当拒绝':'应当接受',d.verdict==='reject'?'reject':'accept'),K.t(...d.why)]);
    return K.table([['AI 建议','Suggestion'],['结论','Verdict'],['理由','Reason']],rows)+`<p class="chart-note">${K.esc(K.t('被接受的建议改变了 ','Accepted suggestions changed '))}${q.changed}${K.esc(K.t(' 个单元格。',' cells.'))}</p>`;
  },
  graphKind(view){return {db:['来源与格式','Source and format'],import:['导入与诊断','Import and profiling'],dates:['日期与频率','Dates and frequency'],missing:['缺失值','Missing values'],outlier:['异常值','Outliers'],shape:['宽长表','Wide and long'],ai:['AI 清洗','AI cleaning']}[view];},
  tasks(view,{K}){
    return [['先核对列类型，再决定清洗；任何替换都要能回答"为什么"。','Check column types before cleaning; every replacement must answer "why".'],
      ['把清洗日志与来源元数据一起写进实验报告。','Put the audit log and provenance metadata into the report.'],
      ['复制完整脚本到 RStudio 整段运行，核对保留行数与标记数。','Copy the script into RStudio and check the kept rows and flags.']];
  },
  code:(p,view,mode,lang)=>C.build(p,view,mode,lang),
  onFile:(input,done)=>{const f=input.files&&input.files[0];if(!f)return;if(f.size>4000000){alert('CSV 超过 4MB');return;}f.text().then(done);},
  teacher:['六节对应大纲的"金融市场数据库、数据格式、导入、预处理"与 AI 自动清洗对比。建议顺序：导入诊断 → 日期 → 缺失 → 异常 → 宽长表 → AI 审查。重点是让学生说清楚每种选择的代价，而不是记住一条"最佳实践"。AI 一节必须要求学生指出为什么"用中位数替换 10 倍录入错误"是错的。',
    'The six sections follow the syllabus: market databases, data formats, import and preprocessing, plus the AI cleaning comparison. Recommended order: import → dates → missing → outlier → wide/long → AI review. The goal is for students to state the cost of each choice rather than memorise a best practice. In the AI section they must explain why replacing a ten-fold entry error with the median is wrong.'],
  help:['页面本身不执行 R；每节都会生成可整段运行的基础 R 脚本。CSV 只在浏览器内处理，不上传。右上角可切换中文/English，数值与脚本保持不变。','The page does not run R; every section generates a standalone base-R script. The CSV stays in the browser. The language switch keeps numbers and scripts identical.'],
  practice:['新建 R Script，复制完整脚本整段运行。核对：保留行数、被删除的重复日期条数、缺失值处理后的行数、异常标记条数与长表行数。注意脚本会把 2025-01 记为缺月，但不会替你补一行。','Create a new R Script and run the whole script. Check the kept rows, the dropped duplicate date, the row count after the missing-value policy, the number of flags and the long-format row count. The script reports 2025-01 as a missing month but never invents a row for it.'],
  fileName:'experiment02-data-preparation.R'
};
window.DataPrepWorkbench={mount:()=>LabRunner.mount(LAB)};
})();
