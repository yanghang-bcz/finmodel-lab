/* Native dialog supplies the focus trap; lifecycle and return focus are shared. */
(()=>{'use strict';const triggers=new WeakMap();let overflow='';
function open(dialog,trigger=document.activeElement){if(dialog.open)return;window.dispatchEvent(new Event('finmodel:modal-open'));triggers.set(dialog,trigger);if(!document.querySelector('dialog[open]')){overflow=document.body.style.overflow;document.body.style.overflow='hidden';}dialog.showModal();dialog.querySelector('button:not(:disabled),a[href],input')?.focus({preventScroll:true});}
for(const dialog of document.querySelectorAll('dialog')){
 dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.style.overflow=overflow;const trigger=triggers.get(dialog);if(trigger?.isConnected)trigger.focus({preventScroll:true});window.ChartInteraction?.clear();});
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
 dialog.querySelector('.dialog-head h2')?.id||(dialog.querySelector('.dialog-head h2').id=dialog.id+'Title');dialog.setAttribute('aria-labelledby',dialog.querySelector('.dialog-head h2').id);
 dialog.querySelectorAll('.dialog-head button').forEach(b=>b.setAttribute('aria-label','关闭'+dialog.querySelector('h2').textContent));
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const dialog=document.querySelector('dialog[open]');if(dialog){e.preventDefault();e.stopImmediatePropagation();dialog.close();}}},true);
window.addEventListener('pagehide',()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
window.ModalUI={open};})();
