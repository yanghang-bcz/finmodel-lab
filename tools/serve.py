"""One absolute deployment root, deterministic build, explicit runtime identity."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import json
import os
import shutil
import subprocess
import sys
from urllib.parse import urlsplit

PROJECT = Path(__file__).resolve().parent.parent
ROOT = PROJECT / 'dist'

class PreviewServer(ThreadingHTTPServer):
    request_queue_size = 128

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        if Path(urlsplit(self.path).path).suffix in ('', '.html', '.js', '.css', '.json'):
            self.send_header('Cache-Control', 'no-store, max-age=0')
        self.send_header('X-FinModel-Build', self.server.build_id)
        super().end_headers()

    def do_GET(self):
        if urlsplit(self.path).path == '/__finmodel__/status':
            data = json.dumps({'pid': os.getpid(), 'projectRoot': str(PROJECT),
                'documentRoot': str(ROOT), 'buildId': self.server.build_id,
                'startCommand': f'python3 "{PROJECT / "tools/serve.py"}"'}, ensure_ascii=False).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        super().do_GET()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8765)
    args = parser.parse_args()
    node = shutil.which('node')
    if not node:
        sys.exit('Node.js is required to verify deployment before starting.')
    subprocess.run([node, str(PROJECT / 'tools/build-workbench.cjs')], check=True)
    manifest = json.loads((ROOT / 'build-manifest.json').read_text())
    try:
        server = PreviewServer(('127.0.0.1', args.port), partial(Handler, directory=str(ROOT)))
    except OSError as error:
        sys.exit(f'Cannot bind 127.0.0.1:{args.port}: {error}. Inspect the existing listener; do not start another copy.')
    server.build_id = manifest['buildId']
    print(f'FinModel Lab {server.build_id}\nPID: {os.getpid()}\nProject: {PROJECT}\nDocument root: {ROOT}\nhttp://127.0.0.1:{args.port}/', flush=True)
    with server:
        server.serve_forever()
