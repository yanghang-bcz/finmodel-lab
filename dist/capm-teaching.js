/* Presentation semantics only: no parameter estimates or inference are recalculated here. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.CAPMTeaching=api;})(this,()=>{
const periods={daily:{label:'每日',short:'日',r:'daily'},weekly:{label:'每周',short:'周',r:'weekly'},monthly:{label:'每月',short:'月',r:'monthly'},annual:{label:'每年',short:'年',r:'annual'}};
const period=f=>{if(!periods[f])throw Error('样本频率未知，不能标注收益单位。');return periods[f];};
function empirical(q,frequency){const u=period(frequency).label,b=q.b,abs=Math.abs(b),near=abs<.05;let sensitivity=near?'估计的一阶线性市场暴露较小':b<0?'样本拟合关系呈反向变化':b>1?'样本中对市场超额收益的敏感度较高':b===1?'样本敏感度约等于1':'样本中对市场超额收益的敏感度相对较低';
const beta=`样本Beta约为${b.toFixed(near?4:2)}：市场超额收益每上升1个百分点，资产超额收益的拟合值平均${b<0?'下降':'上升'}约${abs.toFixed(near?4:2)}个百分点；${sensitivity}。`;
const testable=Number.isFinite(q.pA)&&Number.isFinite(q.seA)&&q.seA>0&&!q.degenerate;const status=!testable?'不可检验：近乎完全拟合导致标准误及t/p推断退化':q.pA<.05?'在经典OLS推断假设下，5%水平拒绝Alpha=0':'在经典OLS推断假设下，5%水平没有足够证据拒绝Alpha=0';
const alpha=`Alpha约为${u}${q.a!==0&&Math.abs(q.a*100)<.005?(q.a*100).toExponential(2):(q.a*100).toFixed(2)}%；${status}。`;
return{beta,alpha,status,category:near?'near-zero':b<0?'negative':b>1?'high':'low',testable,summary:beta+alpha,limit:'Alpha不显著，不代表CAPM已被证明成立。单资产时间序列回归不足以检验整个CAPM；统计关系不等于经济因果。',r2:`R²=${(q.r2*100).toFixed(2)}%：表示本样本资产超额收益变动被该线性拟合解释的比例，不是预测正确率。`};}
function allocation(w){if(w===0)return'全部配置无风险资产。';if(w===1)return'全部配置市场组合。';if(w<1)return`市场组合占${(w*100).toFixed(0)}%，其余${((1-w)*100).toFixed(0)}%配置无风险资产。`;return`借入相当于自有资金${((w-1)*100).toFixed(0)}%的资金，将${(w*100).toFixed(0)}%配置市场组合，属于杠杆投资。假设按设定的无风险利率借款；实际融资利率可能不同。`;}
function theoretical(p,t){let exposure=p.beta<0?`当前理论Beta=${p.beta}，表示反向的市场系统性风险暴露`:p.beta===0?'当前理论Beta=0，表示模型中的市场系统性风险暴露为0':`当前市场系统性风险暴露约为市场组合的${p.beta}倍（不是所有风险的倍数）`;return`${exposure}；模型要求的预期收益率为${(t.expected*100).toFixed(2)}%／年。市场溢价${t.premium>0?'为正，Beta越大，必要收益越高':t.premium<0?'为负，Beta越大，代数必要收益越低':'为0，必要收益等于无风险收益'}，不保证实际收益。`;}
return{period,empirical,allocation,theoretical};});
