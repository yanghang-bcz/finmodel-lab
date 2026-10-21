/* One state machine for every chart. Hover never changes explicit selection. */
(()=>{'use strict';const controllers=new Set();let motion=0,lastX,lastY;document.addEventListener('pointermove',e=>{if(e.clientX!==lastX||e.clientY!==lastY){motion++;lastX=e.clientX;lastY=e.clientY;}},true);
function create(render){let hoveredItem=null,selectedItem=null,redrawMotion=-1,hoverTarget=null;
 function paint(){render(selectedItem||hoveredItem,selectedItem?'pinned':hoveredItem?'preview':'closed');}
 const api={
  enter(key,target=null){hoverTarget=target;if(hoveredItem!==key){hoveredItem=key;if(!selectedItem)paint();}},leave(key){if(hoveredItem===key){hoveredItem=null;hoverTarget=null;if(!selectedItem)paint();}},
  clearPreview(){if(hoveredItem){hoveredItem=null;hoverTarget=null;if(!selectedItem)paint();}},
  checkPointer(target){if(hoverTarget&&(!hoverTarget.isConnected||!hoverTarget.contains(target)))api.clearPreview();},
  toggle(key){hoveredItem=null;selectedItem=selectedItem===key?null:key;paint();},
  select(key){hoveredItem=null;selectedItem=key;paint();},
  clear(){hoveredItem=selectedItem=null;hoverTarget=null;paint();},
  redraw(valid=()=>true){redrawMotion=motion;hoveredItem=null;hoverTarget=null;if(selectedItem&&!valid(selectedItem))selectedItem=null;paint();},
  bind(el,key,onSelect){el.onpointerenter=el.onpointermove=e=>{if(e.pointerType==='mouse'&&motion>redrawMotion)api.enter(key,el);};el.onpointerleave=el.onpointercancel=()=>api.leave(key);
   el.onfocus=()=>api.enter(key,el);el.onblur=()=>api.leave(key);
   el.onclick=e=>{e.stopPropagation();api.toggle(key);if(selectedItem===key)onSelect?.(key);};
   el.onkeydown=e=>{if(['Enter',' '].includes(e.key)&&el.tagName.toLowerCase()!=='button'){e.preventDefault();el.click();}};},
  get state(){return{hoveredItem,selectedItem};},destroy(){api.clear();controllers.delete(api);}
 };controllers.add(api);return api;}
function clear(){controllers.forEach(c=>c.clear());}
// A removed SVG target, lost pointer, or background tab must never strand a preview.
document.addEventListener('pointermove',e=>controllers.forEach(c=>c.checkPointer(e.target)),true);
document.addEventListener('pointercancel',()=>controllers.forEach(c=>c.clearPreview()),true);
document.addEventListener('pointerout',e=>{if(!e.relatedTarget)controllers.forEach(c=>c.clearPreview());},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
window.addEventListener('blur',()=>controllers.forEach(c=>c.clearPreview()));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]')&&[...controllers].some(c=>c.state.hoveredItem||c.state.selectedItem)){clear();e.preventDefault();e.stopImmediatePropagation();}},true);
for(const event of ['pagehide','pageshow','hashchange','finmodel:modal-open'])window.addEventListener(event,clear);
window.ChartInteraction={create,clear};})();
