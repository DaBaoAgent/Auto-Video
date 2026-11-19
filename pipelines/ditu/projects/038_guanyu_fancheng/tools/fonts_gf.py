"""Fonts for the film (gitignored, re-fetched here). All SIL Open Font License 1.1.
- Barlow Condensed Regular / Medium / SemiBold from github.com/google/fonts
- Noto Sans SC 500 / 700, subset to exactly the Chinese the film draws (voice/cues.json + voice/texts.json),
  through the Google Fonts CSS API (&text=); run again whenever either file changes.
usage (library root): .venv/bin/python -I films/guanyu-fancheng/tools/fonts_gf.py films/guanyu-fancheng
"""
import json, os, re, sys, time, urllib.parse, urllib.request
D = sys.argv[1]; F = os.path.join(D, 'fonts'); os.makedirs(F, exist_ok=True)
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36'}


def get(u):
    for k in range(4):
        try:
            return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=90).read()
        except Exception as e:
            if k == 3:
                raise
            print('retry', k + 1, e)
            time.sleep(3)


for w, ext in (('Regular', 'ttf'), ('Medium', 'woff2'), ('SemiBold', 'woff2')):
    p = os.path.join(F, f'BarlowCondensed-{w}.{ext}')
    if not os.path.exists(p) or os.path.getsize(p) < 1000:
        open(p, 'wb').write(get(f'https://github.com/google/fonts/raw/main/ofl/barlowcondensed/BarlowCondensed-{w}.{ext}'))
subs = json.load(open(os.path.join(D, 'voice', 'cues.json'), encoding='utf-8'))
texts = json.load(open(os.path.join(D, 'voice', 'texts.json'), encoding='utf-8'))
chars = set(''.join(s['zh'] for s in subs))
chars |= set(''.join(t for t in texts))
chars |= set('，。、·—：；？！0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')
txt = urllib.parse.quote(''.join(sorted(c for c in chars if c.strip())))
for w in (500, 700):
    p = os.path.join(F, f'NotoSansSC-{w}-sub.woff2')
    if os.path.exists(p):
        continue
    css = get(f'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@{w}&text={txt}').decode()
    open(p, 'wb').write(get(re.search(r'url\((https://[^)]+)\)', css).group(1)))
print('fonts ok:', len(chars), 'subset characters')
