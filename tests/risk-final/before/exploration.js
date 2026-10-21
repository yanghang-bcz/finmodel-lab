/* A single exploration state machine; all finance is delegated to FinMath. */
(function(root){
'use strict';
const snapshot=p=>Object.freeze({...p});
const idle=()=>({phase:'Idle',origin:null,baseline:null,baseResult:null,current:null,result:null,prediction:null,changed:false,studentSelected:false,task:'correlation'});
function start(p,origin=p,task='correlation'){FinMath.model(p);const base=snapshot(p);return{phase:'Predict',origin:snapshot(origin),baseline:base,baseResult:FinMath.portfolio(base),current:base,result:FinMath.portfolio(base),prediction:null,changed:false,studentSelected:false,task};}
function transition(s,event){switch(event.type){
case 'START':if(s.phase!=='Idle')throw Error('Use RESTART for an active session');return start(event.params,event.params,event.task||'correlation');
case 'RESTART':if(!active(s))throw Error('Cannot restart Idle');return start(event.params||s.current,s.origin,s.task);
case 'CHOOSE':if(s.phase!=='Predict'||!(s.task==='efficiency'?['yes','no']:['down','same','up']).includes(event.value))throw Error('Choose only during Predict');return{...s,prediction:event.value};
case 'CONFIRM':if(s.phase!=='Predict'||!s.prediction||(s.task==='correlation'&&s.baseline.rho<=-1))throw Error('Prediction and reducible baseline required');return{...s,phase:'Experiment',studentSelected:false};
case 'CHANGE':{if(s.phase!=='Experiment')throw Error('Parameters locked outside Experiment');const p=event.params;if((s.task==='efficiency'?['rho','mu1','mu2','s1','s2']:['w','mu1','mu2','s1','s2']).some(k=>p[k]!==s.baseline[k]))throw Error('Fixed parameters changed');if(s.task==='correlation'&&(p.rho>s.baseline.rho||p.rho< -1))throw RangeError('Only reduce correlation from baseline');const current=snapshot(p);return{...s,current,result:FinMath.portfolio(current),changed:s.task==='efficiency'?p.w!==s.baseline.w:p.rho<s.baseline.rho};}
case 'EXPLAIN':if(!canExplain(s))throw Error('Lower correlation before Explain');return{...s,phase:'Explain'};
case 'REEXPERIMENT':if(s.phase!=='Explain')throw Error('Reexperiment only after Explain');return{...s,phase:'Experiment',current:s.baseline,result:s.baseResult,changed:false,studentSelected:false};
case 'SELECT_CODE':return{...s,studentSelected:true};
case 'EXIT':return idle();
default:throw Error('Unknown exploration event');}}
const active=s=>s.phase!=='Idle',canCompare=s=>['Experiment','Explain'].includes(s.phase)&&s.changed,canExplain=s=>s.phase==='Experiment'&&s.changed;
function editable(s,key){return s.phase==='Idle'||(s.phase==='Experiment'&&key===(s.task==='efficiency'?'w':'rho'));}
root.FinExplore={idle,transition,active,canCompare,canExplain,editable};if(typeof module!=='undefined')module.exports=root.FinExplore;
})(typeof window!=='undefined'?window:globalThis);
