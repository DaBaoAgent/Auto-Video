#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""shouhui —— 「逐帧手绘 / 线条沸腾」短片管线（封装 mg-styles-15 / 05-cel-boil）

用法（在仓库根执行）：
    python shouhui/scripts/shouhui.py new    <slug> --title 标题
    python shouhui/scripts/shouhui.py probe  <slug>
    python shouhui/scripts/shouhui.py audio  <slug>          # 切配音 → 合成音效 → 混音归一
    python shouhui/scripts/shouhui.py stills <slug> --times 1,3,5
    python shouhui/scripts/shouhui.py render <slug>          # 全片渲染（含音轨）
    python shouhui/scripts/shouhui.py qa     <slug>          # 规格/黑帧/响度/真峰值
    python shouhui/scripts/shouhui.py all    <slug>

输入契约：shouhui/projects/<slug>/film.json + js/scene.js + audio/cues.json
依赖：node（vendor/mg-styles-15 已 npm install）、ffmpeg、Edge（无头渲染）
"""
import json, os, re, shutil, subprocess, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SH = os.path.join(ROOT, 'shouhui')
VENDOR = os.path.join(ROOT, 'vendor', 'mg-styles-15')
EDGE = os.environ.get('MG_CHROME', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')


def P(slug):
    return os.path.join(SH, 'projects', slug)


def load(slug):
    with open(os.path.join(P(slug), 'film.json'), encoding='utf-8') as f:
        return json.load(f)


def run(cmd, **kw):
    print('  $', ' '.join(cmd) if isinstance(cmd, list) else cmd)
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        print(r.stdout[-2000:]); print(r.stderr[-2000:])
        raise SystemExit(f'失败：{cmd[0] if isinstance(cmd, list) else cmd}')
    return r


def probe_dur(path):
    r = run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', path])
    return float(r.stdout.strip())


def cmd_new(slug, title='未命名'):
    dst = P(slug)
    if os.path.exists(dst):
        raise SystemExit(f'{dst} 已存在')
    tpl = P('012_shangzhouwang')
    shutil.copytree(tpl, dst, ignore=shutil.ignore_patterns('out', 'audio/*.wav', '*.log'))
    fj = load(slug)
    fj['slug'], fj['title'] = slug, title
    with open(os.path.join(dst, 'film.json'), 'w', encoding='utf-8') as f:
        json.dump(fj, f, ensure_ascii=False, indent=2)
    print(f'→ 新工程 {dst}\n  改 js/scene.js（画面）与 audio/cues.json（音效点）后跑 audio / render')


def cmd_audio(slug):
    fj = load(slug)
    d = P(slug)
    os.makedirs(os.path.join(d, 'audio'), exist_ok=True)
    src = fj['source']['voice']
    vin = float(fj['source'].get('voice_in', 0.0))
    dur = float(fj['render']['duration'])
    narr = os.path.join(d, fj['audio']['narration'])
    print('[1/3] 切配音')
    run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{vin}', '-t', f'{dur}', '-i', src,
         '-af', f'afade=t=in:st=0:d=0.02,afade=t=out:st={dur-0.1:.2f}:d=0.10,highpass=f=70',
         '-ar', '48000', '-ac', '1', narr])
    print('[2/3] 合成音效床')
    sfx = os.path.join(d, fj['audio']['sfx'])
    run([sys.executable, os.path.join(SH, 'scripts', 'sfx_build.py'),
         os.path.join(d, fj['audio']['sfx_cues']), sfx, str(dur)])
    print('[3/3] 混音 + 归一')
    mix = os.path.join(d, fj['audio']['mix'])
    bgm = fj['audio'].get('bgm')
    ins = ['-i', narr, '-i', sfx] + (['-i', bgm] if bgm else [])
    if bgm:
        fc = (f"[0:a]volume=1.0[na];[1:a]volume={fj['audio'].get('sfx_gain', 0.55)}[sfx];"
              f"[2:a]atrim=0:{dur},asetpts=N/SR/TB,volume={fj['audio'].get('bgm_gain', 0.18)},"
              f"afade=t=in:st=0:d=0.6,afade=t=out:st={dur-1.4:.2f}:d=1.4[bg];"
              f"[na][sfx][bg]amix=inputs=3:duration=first:dropout_transition=0:normalize=0[m];"
              f"[m]loudnorm=I={fj['audio']['target_lufs']}:TP=-1.0:LRA=11[out]")
    else:
        fc = (f"[0:a]volume=1.0[na];[1:a]volume={fj['audio'].get('sfx_gain', 0.55)}[sfx];"
              f"[na][sfx]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[m];"
              f"[m]loudnorm=I={fj['audio']['target_lufs']}:TP=-1.0:LRA=11[out]")
    run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', fc, '-map', '[out]',
         '-ar', '48000', '-ac', '2', mix])
    # 复核响度，差得多就补一次增益 + 限峰
    lufs = measure_lufs(mix)
    tgt = float(fj['audio']['target_lufs'])
    if abs(lufs - tgt) > 0.4:
        gain = tgt - lufs
        tmp = mix.replace('.wav', '.tmp.wav')
        run(['ffmpeg', '-v', 'error', '-y', '-i', mix, '-af',
             f'volume={gain:.2f}dB,alimiter=limit=0.891:level=false', '-ar', '48000', tmp])
        os.replace(tmp, mix)
        lufs = measure_lufs(mix)
    print(f'  → {mix}  {lufs:.1f} LUFS')


def measure_lufs(path):
    r = subprocess.run(['ffmpeg', '-v', 'info', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True)
    m = re.search(r'I:\s+(-?[\d.]+) LUFS', r.stderr.split('Summary:')[-1])
    return float(m.group(1)) if m else float('nan')


def env():
    e = dict(os.environ)
    e.update({'MG_VENDOR': VENDOR, 'MG_SITE': '', 'MG_GPU_ARGS': '--disable-gpu --no-sandbox', 'MG_CHROME': EDGE})
    return e


def cmd_stills(slug, times):
    d = P(slug); e = env(); e['MG_SITE'] = d
    run(['node', os.path.join(SH, 'scripts', 'render.mjs'), d, '--stills', times], env=e)


def cmd_render(slug):
    fj = load(slug); d = P(slug); e = env(); e['MG_SITE'] = d
    out = os.path.join(d, 'out', fj.get('out_name', f"{fj['slug']}.mp4"))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    run(['node', os.path.join(SH, 'scripts', 'render.mjs'), d, '--out', out,
         '--audio', os.path.join(d, fj['audio']['mix']),
         '--fps', str(fj['render']['fps']), '--duration', str(fj['render']['duration']),
         '--crf', str(fj['render'].get('crf', 18))], env=e)
    print('  →', out)
    return out


def cmd_qa(slug):
    fj = load(slug); d = P(slug)
    out = os.path.join(d, 'out', fj.get('out_name', f"{fj['slug']}.mp4"))
    r = run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate,nb_frames',
             '-show_entries', 'format=duration,size', '-of', 'json', out])
    info = json.loads(r.stdout)
    v = next(s for s in info['streams'] if s['codec_type'] == 'video')
    a = next((s for s in info['streams'] if s['codec_type'] == 'audio'), None)
    dur = float(info['format']['duration']); fps = eval(v['r_frame_rate'])
    checks = [
        ('分辨率', f"{v['width']}x{v['height']}", v['width'] == fj['render']['width'] and v['height'] == fj['render']['height']),
        ('帧率', f'{fps:g}', abs(fps - fj['render']['fps']) < 0.01),
        ('时长', f'{dur:.3f}s', abs(dur - fj['render']['duration']) < 0.05),
        ('帧数', v.get('nb_frames'), v.get('nb_frames') == str(int(fj['render']['duration'] * fj['render']['fps']))),
        ('音轨', a['codec_type'] if a else '无', bool(a)),
    ]
    lufs = measure_lufs(out)
    checks.append(('响度', f'{lufs:.1f} LUFS', abs(lufs - float(fj['audio']['target_lufs'])) <= 0.7))
    rb = subprocess.run(['ffmpeg', '-v', 'info', '-i', out, '-vf', 'blackdetect=d=0.06:pix_th=0.06', '-an', '-f', 'null', '-'],
                        capture_output=True, text=True)
    blacks = len(re.findall(r'black_start', rb.stderr))
    checks.append(('黑帧', f'{blacks} 段', blacks == 0))
    ok = True
    for name, val, good in checks:
        print(f"  {'PASS' if good else 'FAIL'}  {name:<6}{val}")
        ok = ok and good
    raise SystemExit(0 if ok else 1)


def cmd_probe(slug):
    d = P(slug); fj = load(slug)
    print(f"{fj['title']}  ({fj['slug']} · {fj.get('style')})")
    for rel in ['film.json', 'js/scene.js', fj['audio']['cues'] if 'cues' in fj['audio'] else 'audio/cues.json',
                fj['audio']['narration'], fj['audio']['sfx'], fj['audio']['mix'], 'out/' + fj.get('out_name', slug + '.mp4')]:
        p = os.path.join(d, rel)
        print(f"  {'✓' if os.path.exists(p) else '·'} {rel}" + (f"  {os.path.getsize(p)/1024:.0f} KB" if os.path.exists(p) else ''))


def main():
    if len(sys.argv) < 3:
        print(__doc__); raise SystemExit(1)
    cmd, slug = sys.argv[1], sys.argv[2]
    rest = sys.argv[3:]
    if not os.path.isdir(VENDOR):
        raise SystemExit(f'缺 vendor：{VENDOR}（先 git clone mg-styles-15 并 npm install）')
    if cmd == 'new':
        title = rest[rest.index('--title') + 1] if '--title' in rest else '未命名'
        cmd_new(slug, title)
    elif cmd == 'audio':
        cmd_audio(slug)
    elif cmd == 'stills':
        t = rest[rest.index('--times') + 1] if '--times' in rest else '1,3,5,7,9'
        cmd_stills(slug, t)
    elif cmd == 'render':
        cmd_render(slug)
    elif cmd == 'qa':
        cmd_qa(slug)
    elif cmd == 'probe':
        cmd_probe(slug)
    elif cmd == 'all':
        cmd_audio(slug); cmd_render(slug); cmd_qa(slug)
    else:
        print(__doc__); raise SystemExit(1)


if __name__ == '__main__':
    main()
