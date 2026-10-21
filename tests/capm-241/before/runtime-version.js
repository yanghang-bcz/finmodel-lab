/* Read-only runtime receipt; no visible UI, tracking or parameter persistence. */
(()=>{'use strict';const build=window.FINMODEL_BUILD;
if(!build||document.querySelector('meta[name="finmodel-build"]')?.content!==build.buildId)throw Error('FinModel HTML/resource build mismatch');
document.documentElement.dataset.finmodelBuild=build.buildId;
console.info('[FinModel build]',build.buildId,build.assets);
let checking=false;
async function verify(){if(checking||location.protocol==='file:')return;checking=true;try{
 const response=await fetch('build-manifest.json',{cache:'no-store'});if(!response.ok)return;const live=await response.json();
 if(live.buildId!==build.buildId){console.warn('[FinModel] deployment changed; loading current resources');location.reload();}
}catch(error){console.warn('[FinModel] version check unavailable',error.message);}finally{checking=false;}}
window.addEventListener('pageshow',verify);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)verify();});
})();
