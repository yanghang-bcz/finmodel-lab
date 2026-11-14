/* Shared driver for the course-foundation labs (02/03/10/12).
   A lab supplies a descriptor; the runner owns the page chrome, the language
   contract, the parameter pane, validation, the code pane and the copy button. */
(()=>{'use strict';
const K=window.LabKit,$=s=>document.querySelector(s);
function mount(lab){
  K.start(lab.id,lab.cls);
  let p=lab.defaults(),view=lab.views[0][0],mode='full',active=null,built=null,q=null;
  $('#chartHost').className='chart-host single-chart';
  $('#chartHost').innerHTML='<div class="chart-frame"><h3></h3><div class="svg-host"></div></div>';
  const svgHost=()=>$('#chartHost .svg-host'),frameTitle=()=>$('#chartHost .chart-frame h3');
  const tabs=K.views($('.model-panel .panel-head'),lab.views,view,k=>{view=k;active=null;render(true);});
  const env={...K,K,svgHost,frameTitle,go:k=>{view=k;render(true);},setView:k=>{view=k;}};
  function paramsHTML(){
    $('#inputs').innerHTML=lab.params(p,view,env)+
      (lab.tasks?K.tasks(lab.tasks(view,env)):K.tasks([['先预测再改参数，把差异写进实验记录。','Predict first, then change a parameter and record the difference.'],['复制完整 R 脚本到 RStudio 整段运行，核对与本页一致的数值。','Copy the full script into RStudio and check the numbers against this page.']]));
  }
  function readParams(){
    const next={...p};
    for(const el of $('#inputs').querySelectorAll('input,select,textarea')){
      const id=el.id.replace(/^lab-/,'');
      if(el.type==='file')continue;
      if(el.type==='checkbox'){next[id]=el.checked;continue;}
      if(el.tagName==='TEXTAREA'||el.dataset.kind==='text'){next[id]=el.value;continue;}
      if(el.tagName==='SELECT'){next[id]=/^-?\d+(\.\d+)?$/.test(el.value)?Number(el.value):el.value;continue;}
      if(el.value.trim()==='')throw Error(K.t('请输入数值：','Enter a number: ')+el.closest('label').querySelector('span').textContent);
      next[id]=Number(el.value);
    }
    lab.check(next);
    return next;
  }
  function render(rebuild=false){
    if(rebuild)paramsHTML();
    try{p=readParams();$('#validation').textContent='';}
    catch(e){$('#validation').textContent=e.message;return;}
    tabs.refresh(lab.views,view);
    const question=lab.question(view,env);
    tabs.setQuestion(question[0],question[1]);
    tabs.setActive(view);
    K.assumptions(lab.summary(view,env),lab.assumptions(view,env));
    try{q=lab.compute(p,view,env);}catch(e){$('#validation').textContent=e.message;return;}
    try{lab.metrics(q,p,view,env);}catch(e){}
    try{frameTitle().textContent=K.t(...lab.chartTitle(q,p,view,env));lab.chart(q,p,view,env);}catch(e){svgHost().innerHTML=`<p class="lab-note" style="padding:16px">${K.esc(e.message)}</p>`;}
    try{lab.legend(q,p,view,env);}catch(e){}
    try{K.details(lab.details(q,p,view,env));}catch(e){$('#details').textContent=e.message;}
    const kind=lab.graphKind(view,env);K.graphKind(kind[0],kind[1]);
    built=lab.code(p,view,mode,K.lang());
    if(!built.blocks.some(b=>b.key===active))active=built.blocks[0].key;
    active=K.code(built.blocks,active,key=>{active=key;renderCode();});
    K.modeButtons(mode,{basic:lab.basic!==false});
    K.notice(mode==='basic'?K.t('关键逻辑：可独立运行的最小脚本','Key logic: the smallest standalone script'):K.t('完整脚本：含检查、输出与绘图','Full script: checks, output and plotting'));
    return q;
  }
  function renderCode(){
    if(!built)return;
    active=K.code(built.blocks,active,key=>{active=key;renderCode();});
  }
  K.onLang(()=>render(true));
  $('#inputs').addEventListener('input',()=>render(false));
  $('#inputs').addEventListener('change',e=>{
    if(e.target.type==='file'&&lab.onFile){lab.onFile(e.target,text=>{p={...p,csv:text};render(true);});return;}
    render(false);
  });
  K.chrome({
    getCode:()=>lab.code(p,view,'full',K.lang()).code,
    onReset:()=>{p=lab.defaults();active=null;render(true);},
    onMode:m=>{mode=m;render(false);},
    teacher:lab.teacher,help:lab.help,practice:lab.practice,fileName:lab.fileName
  });
  render(true);
  window[lab.global]={snapshot:()=>({lab:lab.id,view,p:JSON.parse(JSON.stringify(p)),mode,code:lab.code(p,view,'full',K.lang()).code.slice(0,120)})};
}
window.LabRunner={mount};
})();
