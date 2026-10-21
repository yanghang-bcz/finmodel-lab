"""Build the deployed WOFF2 assets from verified official files in a staging directory.
Usage: PYTHONPATH=/tmp/finmodel-font-tools python3 tools/build-font-assets.py /tmp/finmodel-font-sources
"""
from pathlib import Path
import sys,json,shutil,hashlib,tarfile,re
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont
source=Path(sys.argv[1]);root=Path(__file__).resolve().parents[1];fonts=root/'dist/assets/fonts';licenses=root/'dist/assets/licenses';fonts.mkdir(parents=True,exist_ok=True);licenses.mkdir(parents=True,exist_ok=True)
# GB2312's common Chinese repertoire, plus all dynamic/static project text and punctuation.
characters=set(chr(i) for i in range(0x20,0x7f))
for high in range(0xb0,0xf8):
    for low in range(0xa1,0xff):
        try:characters.update(bytes([high,low]).decode('gb2312'))
        except UnicodeDecodeError:pass
for path in (root/'dist').glob('*'):
    if path.suffix in ['.html','.js','.css']:characters.update(path.read_text())
for a,b in [(0x370,0x3ff),(0x2000,0x206f),(0x2070,0x209f),(0x2190,0x22ff),(0x3000,0x303f),(0xff01,0xff60)]:characters.update(chr(i)for i in range(a,b+1))
manifest=[]
def entry(src,dest,method):
    font=TTFont(dest);names=font['name'];data={'file':str(dest.relative_to(root/'dist')),'bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'originalBytes':src.stat().st_size,'originalSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'family':names.getDebugName(1),'subfamily':names.getDebugName(2),'weight':font['OS/2'].usWeightClass,'glyphCount':len(font.getBestCmap()),'processing':method};manifest.append(data);print(data['file'],data['bytes'],data['family'],data['subfamily'],data['weight'],flush=True)
def build(src,name,chars):
    dest=fonts/name;font=TTFont(src)
    if 'bricolage' in name:font=instantiateVariableFont(font,{'opsz':24,'wdth':100,'wght':(400,500,700)},inplace=True)
    options=subset.Options();options.flavor='woff2';options.name_IDs=['*'];options.name_legacy=True;options.name_languages=['*'];options.layout_features=['*'];options.notdef_outline=True
    worker=subset.Subsetter(options=options);worker.populate(unicodes={ord(c)for c in chars});worker.subset(font);font.flavor='woff2';font.save(dest);entry(src,dest,'WOFF2 character subset; full copyright/name/license metadata retained')
latin={chr(i)for i in range(0x20,0x250)}|set('→−×·')
build(source/'bricolage.woff2','bricolage-latin.woff2',latin)
# Keep all project/dynamic text in a small core; the common-Chinese extension is lazy.
actual=''.join(p.read_text()for p in (root/'dist').glob('*')if p.suffix in ['.html','.js','.css'])
core=set(actual)|{chr(i)for i in range(0x20,0x7f)}
def ranges(chars):
    codes=sorted({ord(c)for c in chars});parts=[]
    for code in codes:
        if parts and code==parts[-1][1]+1:parts[-1][1]=code
        else:parts.append([code,code])
    return ','.join('U+%X'%a+('-%X'%b if b!=a else '')for a,b in parts)
faces=[]
for weight,label in [(400,'Regular'),(600,'Medium')]:
    src=source/f'GlowSansSC-Normal-{label}.otf';available=set(TTFont(src).getBestCmap());parts={'core':{c for c in core if ord(c)in available},'common':{c for c in characters-core if ord(c)in available}}
    for kind,chars in parts.items():
        name=f'glow-normal-{weight}-{kind}.woff2';build(src,name,chars)
        faces.append("@font-face{font-family:'Glow Sans SC';src:url('"+name+"') format('woff2');font-style:normal;font-weight:"+str(weight)+";font-display:swap;unicode-range:"+ranges(chars)+"}")
(fonts/'glow-faces.css').write_text('\n'.join(faces))
# Monaspace declares reserved names. Preserve its official binaries unchanged.
for src,name in [('argon.woff2','argon-400.woff2'),('neon-400.woff2','neon-400.woff2'),('neon-500.woff2','neon-500.woff2')]:
    shutil.copyfile(source/src,fonts/name);entry(source/src,fonts/name,'Official static WOFF2, unmodified; reserved font names preserved')
for src,name in [('Bricolage-OFL.txt','Bricolage-OFL.txt'),('Monaspace-OFL.txt','Monaspace-OFL.txt'),('Glow-font-OFL.txt','Glow-Sans-OFL.txt'),('Glow-OFL.txt','Glow-build-MIT.txt')]:shutil.copyfile(source/src,licenses/name)
# Deploy only WOFF2 variants, not duplicate OTF/TTF/WOFF files.
katex=root/'dist/vendor/katex';(katex/'fonts').mkdir(parents=True,exist_ok=True)
with tarfile.open(source/'katex.tgz')as tar:
    for member in tar.getmembers():
        if member.name in ['package/dist/katex.min.js','package/dist/katex.min.css'] or member.name.startswith('package/dist/fonts/')and member.name.endswith('.woff2'):
            dest=katex/Path(member.name).relative_to('package/dist');dest.parent.mkdir(exist_ok=True,parents=True);dest.write_bytes(tar.extractfile(member).read())
        if member.name=='package/LICENSE':(licenses/'KaTeX-MIT.txt').write_bytes(tar.extractfile(member).read())
css=(katex/'katex.min.css').read_text();css=re.sub(r',url\([^)]*\.(?:woff|ttf)\) format\([^)]*\)','',css);css=css.replace('font-display:block','font-display:swap');(katex/'katex.min.css').write_text(css)
manifest.append({'family':'KaTeX','version':json.loads((source/'katex.json').read_text())['tag_name'],'files':[{'file':str(p.relative_to(root/'dist')),'bytes':p.stat().st_size}for p in sorted((katex/'fonts').glob('*.woff2'))]})
(fonts/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
# Verify every actual Chinese interface character against both Chinese faces.
actual=''.join(p.read_text()for p in (root/'dist').glob('*')if p.suffix in ['.html','.js','.css'])
required={ord(c)for c in actual if '\u3400'<=c<='\u9fff'}
for name in ['glow-normal-400-core.woff2','glow-normal-600-core.woff2']:
    missing=required-set(TTFont(fonts/name).getBestCmap());assert not missing,''.join(map(chr,sorted(missing)))
print('PASS all current/dynamic Chinese glyphs covered; common repertoire retained.')

# Preserve original KaTeX font copyright and reserved-name notices alongside OFL.
notices=[]
for file in sorted((katex/"fonts").glob("*.woff2")):
    names=TTFont(file)["name"];notices.append(file.name+"\n"+str(names.getDebugName(0))+"\n"+str(names.getDebugName(13))+"\n")
body=(licenses/"Glow-Sans-OFL.txt").read_text();body=body[body.index("SIL OPEN FONT LICENSE"):]
(licenses/"KaTeX-fonts-OFL.txt").write_text("\n".join(notices)+"\n"+body)
