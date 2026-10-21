"""Archive the audited existing project, excluding historical ZIPs and private metadata."""
from pathlib import Path
import hashlib
import json
import zipfile
root = Path(__file__).resolve().parent.parent
files = sorted({p for folder in ['dist', 'tools', 'tests'] for p in (root / folder).rglob('*')
    if p.is_file() and '.DS_Store' not in p.parts and '__pycache__' not in p.parts}
    | set(root.glob('*.md')) | {root / 'portfolio.R'})
manifest = root / 'PACKAGE-MANIFEST-audit-20261019.json'
manifest.write_text(json.dumps({'buildId': json.loads((root/'dist/build-manifest.json').read_text())['buildId'],
    'files': [{'path': p.relative_to(root).as_posix(), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]}, ensure_ascii=False, indent=2))
archive = root / 'FinModel-Lab-audit-20261019.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for p in files + [manifest]:
        z.write(p, 'FinModel-Lab-audit-20261019/' + p.relative_to(root).as_posix())
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    for entry in json.loads(manifest.read_text())['files']:
        assert hashlib.sha256(z.read('FinModel-Lab-audit-20261019/'+entry['path'])).hexdigest() == entry['sha256']
print(f'{archive.name}: {archive.stat().st_size} bytes; all CRC and SHA-256 checks passed')
