(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.WorkbenchUI=api;})(this,()=>{
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function format(kind,x){if(x===null||!Number.isFinite(x))return '—';const digits={money:2,percent:2,beta:3,correlation:3,greek:6,integer:0}[kind],v=kind==='percent'?x*100:x,threshold=digits===undefined?.0001:.5*10**(-digits),small=v!==0&&Math.abs(v)<threshold;const s=small?v.toExponential(kind==='variance'?4:2):digits===undefined?Number(v.toPrecision(5)).toString():v.toLocaleString('en-US',{minimumFractionDigits:digits,maximumFractionDigits:digits});return s+(kind==='percent'?'%':'');}

function ticks(lo,hi,count=4){if(lo===hi)hi=lo+1;const raw=(hi-lo)/count,base=10**Math.floor(Math.log10(raw)),step=[1,2,2.5,5,10].map(x=>x*base).find(x=>x>=raw)||base*10;let values=[];for(let x=Math.ceil(lo/step)*step;x<=hi+step*1e-9;x+=step)values.push(Math.abs(x)<step*1e-8?0:x);return values;}
return{esc,format,ticks};});
