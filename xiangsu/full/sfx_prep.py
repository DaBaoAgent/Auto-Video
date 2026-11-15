"""sfx_prep.py — 把音效库素材处理成可直接混入的片段（确定性）。

读 sfx_cues.json → out/sfx_prep/NN.wav + out/sfx_prep/manifest.json。

每段：
  1. 用 silencedetect(-30 dB, 0.2 s) 找到开头静音，从静音结束处起剪；
  2. 只取最多 2.0 s（素材短于 2 s 的按原长）；
  3. 常量增益精确统一到 -21 LUFS；只有峰值会超过 limit_db 的个别素材
     （全库仅“划水声”一类）才追加轻度限幅器兜底，其余素材动态不动；
  4. 12 ms 淡入 / 50 ms 淡出。
48 kHz 单声道 16-bit；同一素材重复出现时各条目独立生成，处理完全一致。
"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out', 'sfx_prep')
PLAN = json.load(open(os.path.join(HERE, 'sfx_cues.json'), encoding='utf-8'))
SRC = PLAN['source_dir']
MAXS = float(PLAN.get('clip_max_s', 2.0))
TARGET_I = float(PLAN.get('target_lufs', -21.0))
LIMIT_DB = float(PLAN.get('limit_db', -1.0))

def run(args):
    return subprocess.run(args, capture_output=True, text=True, encoding='utf-8', errors='replace')

def probe_dur(path):
    r = run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
             '-of', 'default=nw=1:nk=1', path])
    return float(r.stdout.strip())

_lead_cache = {}
def lead_silence(path):
    """开头静音时长（秒）：前提是文件以静音开始；否则返回 0。"""
    if path in _lead_cache:
        return _lead_cache[path]
    r = run(['ffmpeg', '-hide_banner', '-nostats', '-i', path,
             '-af', 'silencedetect=noise=-30dB:d=0.2', '-f', 'null', '-'])
    err = r.stderr
    lead = 0.0
    starts = [float(x) for x in re.findall(r'silence_start: ([0-9.]+)', err)]
    ends = [float(x) for x in re.findall(r'silence_end: ([0-9.]+)', err)]
    if starts and starts[0] < 0.05 and ends:
        lead = ends[0]
    _lead_cache[path] = lead
    return lead

def measure(path, ss, dur):
    # 必须先按交付口径下混成单声道再量：立体声→单声道对不相关声道有数 dB 损失，
    # 只量原声道会让成品比目标安静（也免得 TP 闸门按错误的峰值收紧增益）。
    r = run(['ffmpeg', '-hide_banner', '-nostats', '-ss', f'{ss:.4f}', '-t', f'{dur:.4f}',
             '-i', path, '-af', f'aformat=channel_layouts=mono,aresample=48000,'
             f'loudnorm=I={TARGET_I}:TP={LIMIT_DB}:LRA=11:print_format=json',
             '-f', 'null', '-'])
    m = re.search(r'\{[^{}]*"input_i"[^{}]*\}', r.stderr, re.S)
    if not m:
        sys.exit('loudnorm 没有输出 JSON: ' + os.path.basename(path))
    d = json.loads(m.group(0))
    return float(d['input_i']), float(d['input_tp'])

def main():
    os.makedirs(OUT, exist_ok=True)
    manifest = []
    for i, cue in enumerate(PLAN['cues']):
        src = os.path.join(SRC, cue['src'])
        if not os.path.isfile(src):
            sys.exit('缺少音效素材: ' + src)
        dur = probe_dur(src)
        lead = lead_silence(src)
        ln = min(MAXS, max(0.05, dur - lead - 0.01))
        I, TP = measure(src, lead, ln)
        gain = TARGET_I - I
        limited = TP + gain > LIMIT_DB
        fade_out = max(0.0, ln - 0.05)
        out = os.path.join(OUT, f'{i:02d}.wav')
        # 与 measure() 同一条下混/重采样链，否则立体声源的下混矩阵与测量差 3 dB，音量会整体偏低。
        af = (f'aformat=channel_layouts=mono,aresample=48000,'
              f'volume={gain:.3f}dB,')
        if limited:
            af += f'alimiter=limit={LIMIT_DB:.2f}dB:level=false:attack=1:release=60,'
        af += (f'afade=t=in:st=0:d=0.012,'
               f'afade=t=out:st={fade_out:.4f}:d=0.050')
        r = run(['ffmpeg', '-hide_banner', '-nostats', '-y',
                 '-ss', f'{lead:.4f}', '-t', f'{ln:.4f}', '-i', src,
                 '-af', af, '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', out])
        if r.returncode != 0:
            sys.exit(f'生成失败 {i:02d} {cue["src"]}: ' + r.stderr[-400:])
        manifest.append({
            'i': i, 't': cue['t'], 'src': cue['src'], 'why': cue.get('why', ''),
            'lead_s': round(lead, 3), 'len_s': round(ln, 3),
            'input_i': I, 'input_tp': TP, 'gain_db': round(gain, 2),
            'limited': limited, 'wav': os.path.basename(out),
        })
        print(f'{i:02d}  t={cue["t"]:6.2f}  前静音 {lead:5.2f}s  长 {ln:4.2f}s  '
              f'I={I:6.2f}  TP={TP:6.2f}  gain={gain:+5.2f}dB'
              f'{"  限幅" if limited else ""}  {cue["src"]}')
    json.dump({'target_lufs': TARGET_I, 'limit_db': LIMIT_DB,
               'clip_max_s': MAXS, 'cues': manifest},
              open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    print(f'manifest → {os.path.join(OUT, "manifest.json")}  ({len(manifest)} 条)')

if __name__ == '__main__':
    main()
