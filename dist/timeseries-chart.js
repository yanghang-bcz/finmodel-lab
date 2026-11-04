/* One accessible SVG per view. The shared chart controller owns tooltip state. */
window.TimeSeriesChart = (host, tip) => {
  const {esc, ticks} = WorkbenchUI;
  const colors = ['#6b818f','#896c9d','#4e8980','#a8784d','#587da4'];
  const interaction = ChartInteraction.create((text,mode) => {
    tip.hidden = !text;
    tip.dataset.state = mode;
    if (text) {
      tip.innerHTML = '<button type="button" aria-label="关闭详情">×</button>' + esc(text);
      tip.querySelector('button').onclick = () => interaction.clear();
    }
  });
  const fmt = x => Number(x.toPrecision(4)).toString();
  function draw({series, labels, unit, xLabel, bars = false, bands = [], references = [], origin, mark = []}) {
    interaction.clear();
    interaction.redraw(() => false);
    const W=660,H=300,L=76,R=21,T=19,B=52;
    const n = labels.length;
    const values = series.flatMap(s => s.values.filter(Number.isFinite))
      .concat(bands.flatMap(b => [...b.lower,...b.upper].filter(Number.isFinite)),references.map(r=>r.value),bars?[0]:[]);
    if (!values.length) { host.textContent='当前没有可绘制结果。'; return; }
    const min=Math.min(...values),max=Math.max(...values),pad=(max-min)*.08||Math.max(.001,Math.abs(max)*.05);
    const lo=min-pad,hi=max+pad, y=v=>T+(hi-v)/(hi-lo)*(H-T-B);
    const step=(W-L-R)/(bars?n:Math.max(1,n-1));
    const x=i=>L+(bars?i+.5:n===1?.5:i)*step;
    const guides=ticks(lo,hi,4).map(v=>'<path class="ts-grid" d="M'+L+','+y(v)+'H'+(W-R)+'"/>'+
      '<text x="'+(L-9)+'" y="'+(y(v)+4)+'" text-anchor="end">'+fmt(v)+'</text>').join('');
    const xTicks = bars && n<=8 ? labels.map((_,i)=>i) : [...new Set([0,Math.floor((n-1)/3),Math.floor(2*(n-1)/3),n-1])];
    const dates=xTicks.map(i=>'<text x="'+x(i)+'" y="'+(H-B+19)+'" text-anchor="'+(!bars&&i===0?'start':!bars&&i===n-1?'end':'middle')+'">'+esc(labels[i])+'</text>').join('');
    const coord=(i,v)=>x(i).toFixed(2)+','+y(v).toFixed(2);
    const intervals=bands.map(b=>{
      const ids=b.lower.map((v,i)=>Number.isFinite(v)?i:null).filter(i=>i!==null);
      if (!ids.length) return '';
      if (ids.length===1) {
        const i=ids[0];
        return '<path d="M'+coord(i,b.lower[i])+'L'+coord(i,b.upper[i])+'" stroke="#896c9d" stroke-width="'+(b.alpha>.2?7:13)+'" opacity="'+b.alpha+'"/>';
      }
      const points=ids.map(i=>coord(i,b.lower[i])).concat(ids.slice().reverse().map(i=>coord(i,b.upper[i])));
      return '<polygon points="'+points.join(' ')+'" fill="#896c9d" opacity="'+b.alpha+'"/>';
    }).join('');
    const ref = references.map(r=>'<path d="M'+L+','+y(r.value)+'H'+(W-R)+'" stroke="#8e829e" stroke-dasharray="4 4" fill="none"/>').join('');
    const boundary = origin === undefined ? '' : '<path d="M'+x(origin)+','+T+'V'+(H-B)+'" stroke="#7e7490" stroke-dasharray="4 5"/>'+
      '<text x="'+(x(origin)-4)+'" y="'+(T+12)+'" text-anchor="end">预测起点</text>';
    const lines=series.map((s,j)=>{
      const color=s.color||colors[j%colors.length];
      if (bars) return s.values.map((v,i)=>!Number.isFinite(v)?'':
        '<rect x="'+(x(i)-Math.min(30,step*.29))+'" y="'+Math.min(y(v),y(0))+'" width="'+Math.min(60,step*.58)+'" height="'+Math.abs(y(v)-y(0))+'" rx="2" fill="'+(s.barColors?.[i]||color)+'"/>').join('');
      let d='',continuation=false;
      s.values.forEach((v,i)=>{
        if (!Number.isFinite(v)) { continuation=false; return; }
        d+=(continuation?'L':'M')+coord(i,v);
        continuation=true;
      });
      return '<path d="'+d+'" stroke="'+color+'" fill="none" stroke-width="2.3" '+(s.dash?'stroke-dasharray="'+s.dash+'"':'')+'/>'+
        (s.points||s.values.filter(Number.isFinite).length===1 ? s.values.map((v,i)=>Number.isFinite(v)?
          '<circle cx="'+x(i)+'" cy="'+y(v)+'" r="3" fill="'+color+'"/>':'').join('') : '');
    }).join('');
    const points=labels.flatMap((label,i)=>{
      const entries=series.filter(s=>Number.isFinite(s.values[i]));
      if (!entries.length) return [];
      const hint=label+' · '+entries.map(s=>s.name+' '+fmt(s.values[i])).concat(
        bands.flatMap(b=>Number.isFinite(b.lower[i])?[b.name+' ['+fmt(b.lower[i])+', '+fmt(b.upper[i])+']']:[]),
        mark[i] ? [mark[i]] : []).join(' · ')+' '+unit;
      return [{i,hint}];
    });
    const hit=points.map(({i,hint},j)=>'<rect class="ts-hit" data-point="'+j+'" aria-label="'+esc(hint)+'" role="button" tabindex="'+
      (points.length<=30 || j%Math.ceil(points.length/18)===0?'0':'-1')+'" x="'+Math.max(L-6,x(i)-Math.max(3,step/2))+
      '" y="'+T+'" width="'+Math.max(6,step)+'" height="'+(H-T-B)+'"/>').join('');
    host.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" role="group" aria-label="'+esc(unit+' / '+xLabel)+'">'+guides+
      '<path class="ts-axis" d="M'+L+','+T+'V'+(H-B)+'H'+(W-R)+'"/>'+intervals+ref+boundary+lines+dates+
      '<text x="'+L+'" y="13">'+esc(unit)+'</text><text x="'+((L+W-R)/2)+'" y="'+(H-6)+'" text-anchor="middle">'+esc(xLabel)+'</text>'+hit+'</svg>';
    host.querySelectorAll('[data-point]').forEach(el=>interaction.bind(el,points[Number(el.dataset.point)].hint));
  }
  return {draw, clear:()=>interaction.clear(), colors};
};
