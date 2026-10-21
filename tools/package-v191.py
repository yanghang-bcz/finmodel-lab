"""Package the existing static app, sources, documentation and test evidence."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parent.parent
files = sorted({p for folder in ['dist', 'tools', 'tests'] for p in (root / folder).rglob('*')
                if p.is_file() and '.DS_Store' not in p.parts and '__pycache__' not in p.parts}
               | set(root.glob('*.md')) | {root / 'portfolio.R'})
manifest = root / 'PACKAGE-MANIFEST-v1.9.1.json'
data = {'version': '1.9.1', 'delivery_date': '2026-10-19',
        'files': [{'path': p.relative_to(root).as_posix(), 'bytes': p.stat().st_size,
                   'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]}
manifest.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
archive = root / 'FinModel-Lab-v1.9.1.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as output:
    for p in files + [manifest]:
        output.write(p, 'FinModel-Lab-v1.9.1/' + p.relative_to(root).as_posix())
with zipfile.ZipFile(archive) as output:
    assert output.testzip() is None
    for entry in data['files']:
        content = output.read('FinModel-Lab-v1.9.1/' + entry['path'])
        assert hashlib.sha256(content).hexdigest() == entry['sha256']
print(f'{archive.name}: {len(files)+1} files, {archive.stat().st_size} bytes; CRC and SHA-256 verified')
