import io, subprocess, sys, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
src = io.open('toon.ts', encoding='utf-8').read()
mark = '// ==== LAO BODY BEGIN'
if mark in src:
    src = src[:src.index(mark)]
body = io.open('lao_body.ts', encoding='utf-8').read()
io.open('toon.build.ts', 'w', encoding='utf-8').write(src + '\n' + mark + '\n' + body + '\n// ==== LAO BODY END\n')
r = subprocess.run(['node', '../claude-animated-shorts/node_modules/esbuild/bin/esbuild', 'toon.build.ts',
                    '--bundle', '--format=iife', '--global-name=TOON', '--outfile=lib/toon.js'],
                   capture_output=True, text=True, encoding='utf-8', errors='replace')
print((r.stdout or '').strip())
print((r.stderr or '').strip())
sys.exit(r.returncode)
