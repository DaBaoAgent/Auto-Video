#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""dengju · 03-isometric（等轴 2.5D）短片管线编排。

用法：
  python dengju/scripts/dengju.py new <slug> --title "标题" --episode 013 --src 出稿/013_xxx
  python dengju/scripts/dengju.py cues <slug> --src 出稿/013_xxx [--from 0 --to 30]
  python dengju/scripts/dengju.py audio <slug>
  python dengju/scripts/dengju.py stills <slug> --times 0.3,3.6,9.8,25.4
  python dengju/scripts/dengju.py render <slug>
  python dengju/scripts/dengju.py sheet <slug>
  python dengju/scripts/dengju.py mux <slug>
  python dengju/scripts/dengju.py qa <slug>
  python dengju/scripts/dengju.py publish <slug> [--dest 出稿/013_xxx]
  python dengju/scripts/dengju.py all <slug>
  python dengju/scripts/dengju.py probe <slug>

约定：管线只认 projects/<slug>/cues.json；画面在 index.html + js/；音频素材在 audio/。
样片默认交付到 cues.json 的 source 所在目录（出稿/<编号>_<选题>/）。
"""
import argparse, json, os, re, shutil, subprocess, sys, time
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    try: _s.reconfigure(encoding='utf-8')
    except Exception: pass

ROOT = Path(__file__).resolve().parents[1]          # dengju/
REPO = ROOT.parent                                  # Auto-Video/
PROJECTS = ROOT / 'projects'
PY = sys.executable
FFMPEG = os.environ.get('DJ_FFMPEG', 'ffmpeg')
FFPROBE = os.environ.get('DJ_FFPROBE', 'ffprobe')
NODE = os.environ.get('DJ_NODE', 'node')

def log(msg): print(f'[dengju] {msg}', flush=True)
def die(msg): print(f'[dengju] ERROR: {msg}', file=sys.stderr, flush=True); sys.exit(1)

def proj(slug): return PROJECTS / slug
def cues_path(slug): return proj(slug) / 'cues.json'
def load_cues(slug):
    p = cues_path(slug)
    if not p.exists(): die(f'{p} 不存在，先 new 或写 cues.json')
    return json.loads(p.read_text(encoding='utf-8'))
def save_cues(slug, c):
    cues_path(slug).write_text(json.dumps(c, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def run(cmd, cwd=None, quiet=False):
    log('$ ' + ' '.join(str(x) for x in cmd))
    p = subprocess.run([str(x) for x in cmd], cwd=str(cwd) if cwd else None,
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace')
    if not quiet and p.stdout.strip():
        print(p.stdout.strip()[-4000:])
    if p.returncode != 0:
        die(f'命令失败（exit {p.returncode}）：{cmd[0]}')
    return p.stdout

def ffprobe_json(path):
    out = subprocess.run([FFPROBE, '-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', str(path)],
                         stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8', errors='replace')
    if out.returncode != 0: die(f'ffprobe 失败：{out.stderr[-800:]}')
    return json.loads(out.stdout)

def source_dir(c):
    src = c.get('source', '')
    p = Path(src)
    if not p.is_absolute(): p = REPO / p
    return p.parent if p.suffix else p

def mp4_name(slug, c):
    stem = c.get('deliver_stem') or f"{c.get('episode', slug)}_等距{int(c.get('duration', 30))}秒样片"
    return proj(slug) / 'out' / f'{slug}_iso_{int(c.get("duration", 30))}s.mp4'

# ---------------------------------------------------------------- new
def cmd_new(a):
    slug = a.slug
    p = proj(slug)
    for d in ['audio', 'assets/font', 'frames', 'out', 'js']:
        (p / d).mkdir(parents=True, exist_ok=True)
    font_src = PROJECTS / 'yuren30' / 'assets' / 'font' / 'AlibabaPuHuiTi-3-85-Bold.ttf'
    if font_src.exists() and not (p / 'assets/font' / font_src.name).exists():
        shutil.copy2(font_src, p / 'assets/font' / font_src.name)
    c = {
        'pipeline': 'dengju', 'style': 'mg-styles-15/03-isometric', 'slug': slug,
        'title': a.title, 'episode': a.episode, 'source': a.src or '',
        'deliver_stem': f"{a.episode}_等距{int(a.duration)}秒样片",
        'fps': 30, 'width': 1920, 'height': 1080, 'duration': a.duration,
        'bpm': 112, 'beat0': 0.28, 'captions': [], 'scenes': {}, 'sfx': []
    }
    ref = PROJECTS / 'yuren30'
    if ref.exists():
        for name in ['index.html']:
            if not (p / name).exists(): shutil.copy2(ref / name, p / name)
        if not (p / 'js' / 'render.js').exists():
            for name in ['render.js', 'anim.js', 'world.js']:
                shutil.copy2(ref / 'js' / name, p / 'js' / name)
            log('已复制参考页面与 js/；新选题必须改 js/world.js 的场景文案与坐标')
    if not cues_path(slug).exists(): save_cues(slug, c)
    log(f'工程就位：{p}')

# ---------------------------------------------------------------- cues
CJK = re.compile(r'[\u3400-\u9fff]')
def han_len(s): return len(CJK.findall(s))

def split_by_len(text, maxlen=14):
    parts, cur = [], ''
    for ch in text:
        cur += ch
        if han_len(cur) >= maxlen and (ch in '，。！？、；：,.!?;: ' or han_len(cur) >= maxlen + 2):
            parts.append(cur.strip('，。！？、；：,.!?;: ')); cur = ''
    if cur.strip('，。！？、；：,.!?;: '): parts.append(cur.strip('，。！？、；：,.!?;: '))
    return parts or [text]

def cmd_cues(a):
    c = load_cues(a.slug)
    src = Path(a.src) if a.src else source_dir(c)
    if not src.is_absolute(): src = REPO / src
    review = src / '配音审查.json'
    if not review.exists():
        die(f'{review} 不存在。无 ASR 时先用 analyze_voice.py 测语音块，再手工写 cues.json 的 captions')
    d = json.loads(review.read_text(encoding='utf-8'))
    recs = d.get('asr', {}).get('records', [])
    if not recs: die('配音审查.json 没有 asr.records')
    ov = {}
    ovp = proj(a.slug) / 'cues-overrides.json'
    if ovp.exists(): ov = json.loads(ovp.read_text(encoding='utf-8'))
    repl = ov.get('replace', {})
    def fix(s):
        for k, v in repl.items(): s = s.replace(k, v)
        return re.sub(r'[，。！？、；：,.!?;:]+', '', s).strip()
    t0lim, t1lim = a.start, a.end
    lines = []
    if 'captions' in ov:
        for x in ov['captions']:
            if x['t0'] >= t0lim and x['t1'] <= t1lim + 0.001:
                lines.append({'t0': x['t0'], 't1': x['t1'], 'text': fix(x['text'])})
    else:
        for r in recs:
            s, e = float(r['start']), float(r['end'])
            if e <= t0lim or s >= t1lim: continue
            s, e = max(s, t0lim), min(e, t1lim)
            text = fix(r['text'])
            if not text: continue
            chunks = split_by_len(text, 14)
            n = len(chunks); total = sum(max(1, han_len(x)) for x in chunks)
            cur = s
            for ch in chunks:
                dur = (e - s) * max(1, han_len(ch)) / total
                lines.append({'t0': round(cur, 2), 't1': round(cur + dur, 2), 'text': ch})
                cur += dur
    if lines:
        lines[0]['t0'] = max(t0lim, lines[0]['t0'])
        lines[-1]['t1'] = min(t1lim, max(lines[-1]['t1'], lines[-1]['t0'] + 0.3))
    c['captions'] = lines
    c['source'] = str(src.relative_to(REPO)).replace('\\', '/') if str(src).startswith(str(REPO)) else str(src)
    save_cues(a.slug, c)
    log(f'写入 {len(lines)} 条从句字幕；仍建议人工校对同音字（cues-overrides.json 的 replace）')
    for x in lines[:8]: log(f"  {x['t0']:5.2f}-{x['t1']:5.2f}  {x['text']}")

# ---------------------------------------------------------------- audio
def cmd_audio(a):
    c = load_cues(a.slug)
    p = proj(a.slug); (p / 'audio').mkdir(exist_ok=True)
    src = Path(c['source'])
    if not src.is_absolute(): src = REPO / src
    if src.is_dir():
        for name in ('配音.wav', '配音-新.wav', 'narration.wav'):
            if (src / name).exists(): src = src / name; break
    if not src.exists(): die(f'配音不存在：{src}')
    dur = float(c.get('duration', 30))
    narration = p / 'audio' / 'narration30.wav'
    run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-t', dur,
         '-af', f'highpass=f=70,afade=t=out:st={dur-0.45:.2f}:d=0.45,aresample=48000', '-ac', '2', '-c:a', 'pcm_s16le', narration])
    run([PY, str(ROOT / 'scripts' / 'make_score.py'), str(cues_path(a.slug)), str(p / 'audio' / 'score.wav')])
    run([PY, str(ROOT / 'scripts' / 'mix_audio.py'), str(p), '--score-gain', str(a.score_gain)])
    run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-i', p / 'audio' / 'fullmix_raw.wav',
         '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-c:a', 'pcm_s16le', p / 'audio' / 'fullmix.wav'])
    log(f'音频完成：{p / "audio" / "fullmix.wav"}')

# ---------------------------------------------------------------- render
def cmd_stills(a):
    run([NODE, ROOT / 'scripts' / 'render_frames.mjs', a.slug, '--stills', a.times], cwd=REPO)

def cmd_render(a):
    c = load_cues(a.slug)
    dur = float(c.get('duration', 30))
    end = dur if getattr(a, 'end', None) is None else a.end
    os.environ.setdefault('PC_FMT', 'jpeg')
    os.environ.setdefault('PC_Q', '92')
    run([NODE, ROOT / 'scripts' / 'render_frames.mjs', a.slug, '--dur', str(dur),
         '--from', str(getattr(a, 'start', 0.0)), '--to', str(end)], cwd=REPO)
    p = proj(a.slug)
    run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-framerate', '30', '-i', p / 'frames' / '%04d.jpg',
         '-vf', 'scale=out_color_matrix=bt709:out_range=tv:flags=lanczos,format=yuv420p',
         '-c:v', 'libx264', '-crf', str(a.crf), '-preset', 'slow', '-profile:v', 'high', '-threads', '4',
         '-r', '30', '-movflags', '+faststart', p / 'out' / 'video_only.mp4'])
    log(f'渲染完成：{p / "out" / "video_only.mp4"}')

def cmd_sheet(a):
    p = proj(a.slug)
    sd = p / 'out' / 'stills'
    shots = sorted(sd.glob('t*.jpg')) or sorted(sd.glob('t*.png'))
    if not shots: die('没有静帧，先 stills')
    pick = shots if len(shots) <= 9 else [shots[round(i * (len(shots) - 1) / 8)] for i in range(9)]
    lst = p / 'out' / 'sheet_list.txt'
    lst.write_text('\n'.join(f"file '{s.as_posix()}'" for s in pick), encoding='utf-8')
    reps = max(1, 9 - len(pick))
    list2 = p / 'out' / 'sheet_list2.txt'
    lines = lst.read_text(encoding='utf-8').splitlines()
    for _ in range(reps): lines.append(lines[-1])
    list2.write_text('\n'.join(lines), encoding='utf-8')
    run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list2,
         '-vf', 'scale=640:360,tile=3x3', '-frames:v', '1', '-q:v', '3', p / 'out' / 'contact_sheet.jpg'])
    log(f'拼图：{p / "out" / "contact_sheet.jpg"}')

def cmd_mux(a):
    p = proj(a.slug)
    vid = p / 'out' / 'video_only.mp4'
    aud = p / 'audio' / 'fullmix.wav'
    if not vid.exists(): die(f'{vid} 不存在，先 render')
    if not aud.exists(): die(f'{aud} 不存在，先 audio')
    c = load_cues(a.slug)
    out = mp4_name(a.slug, c)
    run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-i', vid, '-i', aud,
         '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
         '-af', 'volume=-0.2dB', '-shortest', '-movflags', '+faststart', out])
    log(f'封装完成：{out}')

# ---------------------------------------------------------------- qa
def cmd_qa(a):
    c = load_cues(a.slug); p = proj(a.slug)
    mp4 = mp4_name(a.slug, c)
    if not mp4.exists(): die(f'{mp4} 不存在，先 mux')
    info = ffprobe_json(mp4)
    st = next((x for x in info['streams'] if x['codec_type'] == 'video'), {})
    au = next((x for x in info['streams'] if x['codec_type'] == 'audio'), {})
    dur = float(info['format']['duration']); frames = int(st.get('nb_frames', 0))
    fps = st.get('r_frame_rate', '0/1'); num, den = map(int, fps.split('/'))
    fpsv = num / den if den else 0
    checks = []
    checks.append(('时长', abs(dur - c.get('duration', 30)) < 0.02, f'{dur:.3f}s'))
    checks.append(('分辨率', st.get('width') == 1920 and st.get('height') == 1080, f"{st.get('width')}x{st.get('height')}"))
    checks.append(('帧率', abs(fpsv - 30) < 0.01, f'{fpsv:.3f}'))
    checks.append(('帧数', frames == round(dur * 30), str(frames)))
    checks.append(('音轨', au.get('codec_name') == 'aac' and int(au.get('sample_rate', 0)) == 48000, f"{au.get('codec_name')} {au.get('sample_rate')}"))
    q = subprocess.run([FFMPEG, '-hide_banner', '-i', str(mp4), '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace')
    txt = q.stdout
    i_m = re.findall(r'I:\s*(-?\d+\.\d+)\s*LUFS', txt)
    tp_m = re.findall(r'Peak:\s*(-?\d+\.\d+)\s*dBFS', txt)
    lufs = float(i_m[-1]) if i_m else 0.0
    tp = float(tp_m[-1]) if tp_m else 0.0
    checks.append(('响度', abs(lufs + 14) <= 0.5, f'{lufs:.2f} LUFS'))
    checks.append(('真峰值', tp <= -1.4, f'{tp:.2f} dBTP'))
    b = subprocess.run([FFMPEG, '-hide_banner', '-i', str(mp4), '-vf', 'blackdetect=d=0.05:pix_th=0.10', '-f', 'null', '-'],
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace')
    blacks = re.findall(r'black_start:([0-9.]+) black_end:([0-9.]+)', b.stdout)
    tail_ok = all(float(s) > dur - 0.35 for s, e in blacks)
    checks.append(('黑帧', tail_ok, '; '.join(f'{s}-{e}' for s, e in blacks) or '0'))
    ok = all(x[1] for x in checks)
    log('QA ' + ('PASS' if ok else 'FAIL'))
    for name, good, val in checks: print(f'  [{"PASS" if good else "FAIL"}] {name:6s} {val}')
    (p / 'out' / 'qa.json').write_text(json.dumps({'pass': ok, 'checks': [{'name': n, 'pass': g, 'value': v} for n, g, v in checks]}, ensure_ascii=False, indent=2), encoding='utf-8')
    if not ok: sys.exit(2)

# ---------------------------------------------------------------- publish
def cmd_publish(a):
    c = load_cues(a.slug); p = proj(a.slug)
    mp4 = mp4_name(a.slug, c)
    if not mp4.exists(): die(f'{mp4} 不存在，先 mux')
    dest = Path(a.dest) if a.dest else source_dir(c)
    if not dest.is_absolute(): dest = REPO / dest
    dest.mkdir(parents=True, exist_ok=True)
    stem = c.get('deliver_stem') or f"{c.get('episode', a.slug)}_等距{int(c.get('duration', 30))}秒样片"
    out = dest / f'{stem}.mp4'
    shutil.copy2(mp4, out)
    sheet = p / 'out' / 'contact_sheet.jpg'
    if sheet.exists(): shutil.copy2(sheet, dest / f'{stem}_预览.jpg')
    spec = dest / f'{stem}_说明.md'
    if not spec.exists():
        manual = p / 'out' / '交付说明.md'
        if manual.exists():
            shutil.copy2(manual, spec)
        else:
            q = {}
            qp = p / 'out' / 'qa.json'
            if qp.exists(): q = json.loads(qp.read_text(encoding='utf-8'))
            vals = {x['name']: x['value'] for x in q.get('checks', [])}
            spec.write_text(
                f"# {c.get('title', a.slug)} · 等距 2.5D 样片\n\n"
                f"- 成片：`{out.name}`\n- 工程：`dengju/projects/{a.slug}/`\n"
                f"- 时长：{c.get('duration')} 秒 / 1920×1080 / 30fps\n"
                f"- 响度：{vals.get('响度', '见 QA')} / 真峰值：{vals.get('真峰值', '见 QA')}\n"
                f"- 黑帧：{vals.get('黑帧', '见 QA')}\n", encoding='utf-8')
    log(f'已交付：{out}')
    (p / 'out' / 'delivered.json').write_text(json.dumps({'dest': str(dest), 'file': str(out), 'at': time.strftime('%Y-%m-%d %H:%M:%S')}, ensure_ascii=False, indent=2), encoding='utf-8')

def cmd_probe(a):
    p = proj(a.slug)
    if not p.exists(): die(f'{p} 不存在')
    for f in ['cues.json', 'index.html', 'js/world.js', 'audio/narration30.wav', 'audio/score.wav', 'audio/fullmix.wav', 'out/video_only.mp4']:
        q = p / f
        print(f"  {'OK ' if q.exists() else '-- '} {f:28s} {q.stat().st_size if q.exists() else ''}")
    outs = sorted((p / 'out').glob('*.mp4'))
    for q in outs: print(f'  MP4 {q.name}  {q.stat().st_size/1e6:.1f} MB')

def main():
    ap = argparse.ArgumentParser(description='dengju isometric pipeline')
    sub = ap.add_subparsers(dest='cmd', required=True)

    n = sub.add_parser('new'); n.add_argument('slug'); n.add_argument('--title', default='新片'); n.add_argument('--episode', default='EP.000'); n.add_argument('--src', default=''); n.add_argument('--duration', type=float, default=30.0); n.set_defaults(f=cmd_new)
    cu = sub.add_parser('cues'); cu.add_argument('slug'); cu.add_argument('--src', default=''); cu.add_argument('--from', dest='start', type=float, default=0.0); cu.add_argument('--to', dest='end', type=float, default=30.0); cu.set_defaults(f=cmd_cues)
    au = sub.add_parser('audio'); au.add_argument('slug'); au.add_argument('--score-gain', type=float, default=0.46); au.set_defaults(f=cmd_audio)
    st = sub.add_parser('stills'); st.add_argument('slug'); st.add_argument('--times', required=True); st.set_defaults(f=cmd_stills)
    rd = sub.add_parser('render'); rd.add_argument('slug'); rd.add_argument('--from', dest='start', type=float, default=0.0); rd.add_argument('--to', dest='end', type=float, default=None); rd.add_argument('--crf', type=int, default=21); rd.set_defaults(f=cmd_render)
    sh = sub.add_parser('sheet'); sh.add_argument('slug'); sh.set_defaults(f=cmd_sheet)
    mx = sub.add_parser('mux'); mx.add_argument('slug'); mx.set_defaults(f=cmd_mux)
    qa = sub.add_parser('qa'); qa.add_argument('slug'); qa.set_defaults(f=cmd_qa)
    pub = sub.add_parser('publish'); pub.add_argument('slug'); pub.add_argument('--dest', default=''); pub.set_defaults(f=cmd_publish)
    pr = sub.add_parser('probe'); pr.add_argument('slug'); pr.set_defaults(f=cmd_probe)
    al = sub.add_parser('all'); al.add_argument('slug'); al.set_defaults(f=None)

    a = ap.parse_args()
    if a.cmd == 'all':
        base = argparse.Namespace(**{**vars(a), 'score_gain': 0.46, 'start': 0.0, 'end': None, 'crf': 21, 'dest': ''})
        for fn in (cmd_audio, cmd_render, cmd_mux, cmd_qa, cmd_publish):
            fn(base)
    else:
        a.f(a)

if __name__ == '__main__':
    main()
