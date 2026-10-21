// Deterministic build: source modules, deployed bundles, HTML URLs and manifest agree.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..','dist'),check=process.argv.includes('--check'),changes=[];
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function output(name,body){const file=path.join(root,name);if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==body){changes.push(name);if(!check)fs.writeFileSync(file,body);}}
const bundles={
 'portfolio-bundle.js':['runtime-version.js','chart-interaction.js','experiments-config.js','modal-ui.js','math.js','chart-scale.js','teaching.js','lessons.js','vendor/katex/katex.min.js','typography.js','exploration.js','classroom-ui.js','app.js','portfolio-multi-math.js','portfolio-csv.js','portfolio-multi-code.js','portfolio-ux.js','portfolio-multi-ui.js'],
 'experiments-bundle.js':['runtime-version.js','chart-interaction.js','experiments-config.js','modal-ui.js','vendor/katex/katex.min.js','experiment-math.js','iv-math.js','iv-code.js','hedge-math.js','hedge-code.js','bs-lesson.js','experiment-lessons.js','workbench-ui.js','lesson-presentation.js','financial-charts.js','iv-workbench.js','hedge-workbench.js','teaching-ux-data.js','teaching-ux-charts.js','zero-friction-data.js','teaching-ux.js','capm-math.js','capm-code.js','capm-teaching.js','capm-workbench.js','experiments.js']
};
const generated={};for(const[name,files]of Object.entries(bundles)){const bundle=files.map(file=>`\n/* Source: ${file} */\n${fs.readFileSync(path.join(root,file),'utf8')}\n;`).join('\n');generated[name]=bundle;output(name,bundle);}
const assets={};for(const name of fs.readdirSync(root).sort())if(/\.(js|css)$/.test(name)&&name!=='build-info.js')assets[name]=sha(generated[name]??fs.readFileSync(path.join(root,name)));
const buildId='2.4.1-capm-ux.'+sha(JSON.stringify(assets)).slice(0,16),info={version:'2.4.1-capm-ux',buildId,assets};
const buildInfo='window.FINMODEL_BUILD=Object.freeze('+JSON.stringify(info)+');\n';output('build-info.js',buildInfo);assets['build-info.js']=sha(buildInfo);
for(const name of ['index.html','experiments.html']){
 let html=fs.readFileSync(path.join(root,name),'utf8').replace(/<meta name="finmodel-build"[^>]*>/g,'').replace(/<script src="build-info\.js[^\"]*"><\/script>/g,'');
 html=html.replace('</head>',`<meta name="finmodel-build" content="${buildId}"></head>`);
 html=html.replace(/(<script src=")((?:portfolio|experiments)-bundle\.js)/,`<script src="build-info.js?v=${assets['build-info.js'].slice(0,16)}"></script>$1$2`);
 html=html.replace(/((?:href|src)=")([^"?]+)(?:\?[^\"]*)?(")/g,(all,prefix,url,end)=>{const file=path.join(root,url);if(!/\.(css|js)$/.test(url)||!fs.existsSync(file))return all;const hash=assets[url]||sha(fs.readFileSync(file));return prefix+url+'?v='+hash.slice(0,16)+end;});
 output(name,html);assets[name]=sha(html);
}
output('build-manifest.json',JSON.stringify({...info,assets},null,2)+'\n');
if(check&&changes.length){console.error('STALE deployment artifacts:',changes.join(', '));process.exit(1);}
console.log(buildId+(check?' verified':' built')+'; changed: '+(changes.join(', ')||'none'));
