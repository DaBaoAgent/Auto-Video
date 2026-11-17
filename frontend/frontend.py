"""frontend —— 可选前端闭环：一个选题走到封面 + 发布信息。

任何一条管线都能挂这个模块（不挂 peiyin 的克隆音色也能走）：

    01 选题 → 02 文案 → 03 免费 TTS 配音（带 srt）→ 04 该风格管线出片 → 05 fengmian 封面 + 发布信息

用法：
    python frontend/frontend.py check
    python frontend/frontend.py plan  --pipeline pencil --topic "敦煌藏经洞怎么被发现的"
    python frontend/frontend.py run   --pipeline pencil --topic "敦煌藏经洞怎么被发现的" --title "敦煌藏经洞"
    python frontend/frontend.py run   --pipeline pencil --topic "…" --script 稿子.md --voice-engine sapi

约定：
  - 每个任务落在 frontend/jobs/<日期-序号-片名>/，01–06 编号对齐阶段，中间产物归子目录。
  - 配音优先 edge-tts（联网免费）；没有 edge-tts 或断网时退到 Windows SAPI（离线免费）。
  - 04 渲染按 frontend/targets.json 声明的命令执行；没声明的管线只出「交接包 + 下一步命令」，不假装跑过。
  - 05 一律交给仓库内的 fengmian（最后一道模块），不在 frontend 里重复实现封面。

退出码：0 完成；2 参数问题；3 缺文案（给了提示稿）；4 该管线未声明渲染命令（已出交接包）；5 发布环节失败。
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HERE = Path(__file__).resolve().parent
JOBS = HERE / "jobs"
FENGMian = ROOT / "fengmian"
PROMPT = HERE / "prompts" / "script.md"

STAGE_ORDER = ["01", "02", "03", "04", "05"]


def utf8() -> None:
    for s in (sys.stdout, sys.stderr):
        try:
            s.reconfigure(encoding="utf-8")
        except Exception:
            pass


def jread(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def catalog() -> list[dict]:
    return jread(ROOT / "catalog" / "pipelines.json")["pipelines"]


def find_pipeline(pid: str) -> dict:
    for p in catalog():
        if p["id"] == pid:
            return p
    sys.exit(f"catalog 里没有管线 {pid}")


def targets() -> dict:
    return jread(HERE / "targets.json")["pipelines"]


def slugify(text: str, fallback: str = "job") -> str:
    s = re.sub(r"[\\/:*?\"<>|]+", "", text).strip()
    s = re.sub(r"\s+", "-", s)
    s = s[:40] or fallback
    return s


def new_job(title: str) -> Path:
    JOBS.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M")
    base = f"{stamp}-{slugify(title)}"
    d = JOBS / base
    n = 2
    while d.exists():
        d = JOBS / f"{base}-{n}"
        n += 1
    d.mkdir(parents=True)
    return d


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + "\n", encoding="utf-8")
    print(f"  ✓ {path.relative_to(ROOT)}")


def plain_text(md: str) -> str:
    """把文案 md 压成能念的纯文本：去标题、列表符、强调、链接。"""
    t = re.sub(r"```.*?```", "", md, flags=re.S)
    t = re.sub(r"^#{1,6}\s*", "", t, flags=re.M)
    t = re.sub(r"^[>\-\*\+]\s*", "", t, flags=re.M)
    t = re.sub(r"\!\[.*?\]\(.*?\)", "", t)
    t = re.sub(r"\[(.+?)\]\(.*?\)", r"\1", t)
    t = re.sub(r"[*_`~]+", "", t)
    t = re.sub(r"\n{2,}", "\n", t)
    return t.strip()


# ---------------------------------------------------------------- 01 选题
def stage_topic(job: Path, p: dict, args) -> int:
    topic = args.topic.strip()
    chars = max(120, int(args.duration * 4.4))
    body = f"""# 选题 · {topic}

| 项 | 值 |
|---|---|
| 管线 | `{p['id']}` · {p['name_zh']}（{p['name_en']}） |
| 目标时长 | {args.duration} 秒 |
| 口播字数 | 约 {chars} 字（按 4.4 字/秒估） |
| 受众 | {args.audience} |
| 画幅 | {p.get('aspect') or '按管线默认'} |

## 这一条只讲一件事

{topic}

## 结构（写文案时照这个走）

1. 3 秒钩子：把最反常的那句放最前，不铺背景。
2. 中段 3 个事实：每条一个数字或一个具体场景，不并列形容词。
3. 收尾一句：落在「这件事跟看的人有什么关系」，不喊口号。

## 交付清单（本任务走完会有什么）

- `02-文案.md` 口播稿
- `03-配音.mp3` + `03-字幕.srt`（免费 TTS）
- `04-成片/` 该风格管线产物
- `05-发布/` 两张封面提示词（4:3 / 3:4）+ `发布信息.txt`
"""
    write(job / "01-选题.md", body)
    write(job / "01-选题.json", json.dumps({
        "pipeline": p["id"], "topic": topic, "duration": args.duration,
        "audience": args.audience, "chars_hint": chars,
        "created": datetime.now().isoformat(timespec="seconds"),
    }, ensure_ascii=False, indent=2))
    return 0


# ---------------------------------------------------------------- 02 文案
def llm_script(topic: str, p: dict, args) -> str | None:
    base = os.environ.get("AV_LLM_BASE", "").rstrip("/")
    key = os.environ.get("AV_LLM_KEY", "")
    model = os.environ.get("AV_LLM_MODEL", "gpt-4o-mini")
    if not base:
        return None
    import urllib.request

    sysmsg = PROMPT.read_text(encoding="utf-8") if PROMPT.exists() else "写一段中文口播稿。"
    sysmsg = sysmsg.replace("{{TOPIC}}", topic).replace("{{SECONDS}}", str(args.duration))
    sysmsg = sysmsg.replace("{{CHARS}}", str(max(120, int(args.duration * 4.4))))
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": sysmsg},
            {"role": "user", "content": f"选题：{topic}\n管线风格：{p['name_zh']}（{p['tagline']}）"},
        ],
        "temperature": 0.7,
    }
    req = urllib.request.Request(
        base + "/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", **({"Authorization": f"Bearer {key}"} if key else {})},
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        data = json.loads(r.read().decode("utf-8"))
    return data["choices"][0]["message"]["content"].strip()


def stage_script(job: Path, p: dict, args) -> int:
    if args.script:
        src = Path(args.script)
        if not src.is_absolute():
            src = ROOT / src
        if not src.exists():
            sys.exit(f"文案不存在：{src}")
        text = src.read_text(encoding="utf-8")
        write(job / "02-文案.md", text)
        write(job / "02-文案.txt", plain_text(text))
        return 0

    if os.environ.get("AV_LLM_BASE"):
        text = llm_script(args.topic.strip(), p, args)
        if text:
            write(job / "02-文案.md", text)
            write(job / "02-文案.txt", plain_text(text))
            return 0

    tpl = PROMPT.read_text(encoding="utf-8") if PROMPT.exists() else "# 口播稿\n\n{{TOPIC}}\n"
    filled = (tpl.replace("{{TOPIC}}", args.topic.strip())
                 .replace("{{SECONDS}}", str(args.duration))
                 .replace("{{CHARS}}", str(max(120, int(args.duration * 4.4))))
                 .replace("{{STYLE}}", f"{p['name_zh']}（{p['tagline']}）"))
    write(job / "02-文案-待写.md", filled)
    print("\n没有现成文案，也没配 LLM 接口（AV_LLM_BASE / AV_LLM_KEY / AV_LLM_MODEL）。")
    print(f"照 {Path('02-文案-待写.md')} 的提纲要写好后另存为 02-文案.md，再跑：")
    print(f"  python frontend/frontend.py run --pipeline {p['id']} --topic \"{args.topic}\" --job \"{job}\" --stages 03,04,05")
    return 3


# ---------------------------------------------------------------- 03 配音
def ffprobe_seconds(path: Path) -> float:
    exe = shutil.which("ffprobe") or shutil.which("ffprobe.exe")
    if not exe:
        return 0.0
    out = subprocess.run([exe, "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", str(path)], capture_output=True, text=True)
    try:
        return float(out.stdout.strip())
    except ValueError:
        return 0.0


def ts(sec: float, sep: str = ",") -> str:
    h = int(sec // 3600)
    m = int(sec % 3600 // 60)
    s = sec % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".", sep)


def srt_from_words(words: list[dict], max_chars: int = 20) -> str:
    cues, cur = [], []
    for w in words:
        cur.append(w)
        text = "".join(x["text"] for x in cur)
        if re.search(r"[。！？!?；;：:，,、]", w["text"]) or len(text) >= max_chars:
            start = cur[0]["offset"] / 10_000_000
            end = (cur[-1]["offset"] + cur[-1]["duration"]) / 10_000_000
            cues.append((start, end, text))
            cur = []
    if cur:
        start = cur[0]["offset"] / 10_000_000
        end = (cur[-1]["offset"] + cur[-1]["duration"]) / 10_000_000
        cues.append((start, end, "".join(x["text"] for x in cur)))
    lines = []
    for i, (a, b, text) in enumerate(cues, start=1):
        lines.append(f"{i}\n{ts(a)} --> {ts(b)}\n{text}\n")
    return "\n".join(lines)


def voice_edge(text: str, mp3: Path, srt: Path, voice: str, rate: str) -> bool:
    try:
        import asyncio
        import edge_tts
    except ImportError:
        print("  没有 edge-tts（pip install edge-tts 后可用），改用 Windows SAPI")
        return False

    async def go() -> list[dict]:
        comm = edge_tts.Communicate(text, voice, rate=rate)
        words: list[dict] = []
        with open(mp3, "wb") as f:
            async for chunk in comm.stream():
                if chunk["type"] == "audio":
                    f.write(chunk["data"])
                elif chunk["type"] in ("WordBoundary", "SentenceBoundary"):
                    words.append({"offset": chunk["offset"], "duration": chunk["duration"],
                                  "text": chunk["text"]})
        return words

    try:
        words = asyncio.run(go())
    except Exception as exc:
        print(f"  edge-tts 失败（{exc}），改用 Windows SAPI")
        return False
    srt.write_text(srt_from_words(words), encoding="utf-8")
    return True


def voice_sapi(text: str, mp3: Path, srt: Path, voice: str) -> bool:
    ps = shutil.which("powershell") or shutil.which("pwsh")
    if not ps:
        print("  没有 PowerShell，SAPI 也不可用")
        return False
    wav = mp3.with_suffix(".wav")
    txt = mp3.with_suffix(".txt")
    txt.write_text(text, encoding="utf-8")
    ps1 = mp3.with_suffix(".ps1")
    body = (
        "Add-Type -AssemblyName System.Speech\n"
        "$t = [IO.File]::ReadAllText('" + str(txt).replace("'", "''") + "', [Text.Encoding]::UTF8)\n"
        "$s = New-Object System.Speech.Synthesis.SpeechSynthesizer\n"
        f"try {{ $s.SelectVoice('{voice}') }} catch {{ }}\n"
        "$s.SetOutputToWaveFile('" + str(wav).replace("'", "''") + "')\n"
        "$s.Speak($t)\n$s.Dispose()\n"
    )
    ps1.write_text(body, encoding="utf-8")
    rc = subprocess.run([ps, "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(ps1)],
                        capture_output=True, text=True, encoding="utf-8", errors="replace")
    if rc.returncode != 0 or not wav.exists():
        print("  SAPI 合成失败：" + (rc.stderr or "").strip()[:200])
        return False
    ff = shutil.which("ffmpeg") or shutil.which("ffmpeg.exe")
    if not ff:
        print("  没有 ffmpeg，无法把 wav 转 mp3")
        return False
    subprocess.run([ff, "-y", "-loglevel", "error", "-i", str(wav), "-codec:a", "libmp3lame",
                    "-q:a", "4", str(mp3)], check=False)
    # SAPI 不报词级时间：按句长比例铺时间轴
    total = ffprobe_seconds(mp3) or 0.0
    parts = [s.strip() for s in re.split(r"[。！？!?；;]", text) if s.strip()]
    weight = sum(len(s) for s in parts) or 1
    cue, out = 0.0, []
    for i, s in enumerate(parts, start=1):
        dur = total * len(s) / weight if total else 0.0
        out.append(f"{i}\n{ts(cue)} --> {ts(cue + dur)}\n{s}。\n")
        cue += dur
    srt.write_text("\n".join(out), encoding="utf-8")
    return True


def stage_voice(job: Path, p: dict, args) -> int:
    md = job / "02-文案.md"
    if not md.exists():
        sys.exit("缺 02-文案.md，先跑 02 阶段")
    text = plain_text(md.read_text(encoding="utf-8"))
    if not text:
        sys.exit("02-文案.md 是空的")
    mp3 = job / "03-配音.mp3"
    srt = job / "03-字幕.srt"
    engine = args.voice_engine
    if args.voice_file:
        src = Path(args.voice_file)
        shutil.copyfile(src, mp3)
        engine = "file"
    elif engine in ("edge", "auto"):
        if voice_edge(text, mp3, srt, args.voice, args.rate):
            engine = "edge"
        elif engine == "auto":
            if not voice_sapi(text, mp3, srt, args.sapi_voice):
                return 2
            engine = "sapi"
        else:
            return 2
    elif engine == "sapi":
        if not voice_sapi(text, mp3, srt, args.sapi_voice):
            return 2
    else:
        print("  --voice-engine none：沿用已有 03-配音.mp3")
        if not mp3.exists():
            sys.exit("没有 03-配音.mp3，不能 none")
    sec = ffprobe_seconds(mp3)
    write(job / "03-配音.json", json.dumps({
        "engine": engine, "voice": args.voice if engine == "edge" else args.sapi_voice,
        "seconds": round(sec, 2), "chars": len(text),
        "mp3": mp3.name, "srt": srt.name if srt.exists() else None,
    }, ensure_ascii=False, indent=2))
    print(f"  配音 {sec:.1f}s · {len(text)} 字 · {engine}")
    return 0


# ---------------------------------------------------------------- 04 渲染
def stage_render(job: Path, p: dict, args) -> int:
    t = targets().get(p["id"]) or {}
    pack = job / "04-交接包"
    pack.mkdir(exist_ok=True)
    for name in ("02-文案.md", "02-文案.txt", "03-配音.mp3", "03-字幕.srt"):
        src = job / name
        if src.exists():
            shutil.copyfile(src, pack / name)

    entry = (ROOT / p["id"] / (p.get("entry") or "")).as_posix() if p.get("entry") else ""
    entry_rel = f"{p['id']}/{p.get('entry')}"
    fmt = {
        "entry": entry_rel, "id": p["id"], "title": args.title,
        "job": str(job), "proj": str(job / "04-成片" / "工程"),
        "script": str(job / "02-文案.txt"), "voice": str(job / "03-配音.mp3"),
        "srt": str(job / "03-字幕.srt"), "slug": slugify(args.title),
    }

    if not t.get("render"):
        reason = t.get("reason", "该管线未声明渲染命令")
        write(job / "04-下一步.md", f"""# 04 渲染：交给 `{p['id']}` 自己跑

{reason}

交接包已经备好（文案 / 配音 / 字幕）：

- `04-交接包/02-文案.txt`
- `04-交接包/03-配音.mp3`
- `04-交接包/03-字幕.srt`

下一步照 [ {p['id']}/SKILL.md ]({p['id']}/SKILL.md) 的「快速开始」跑该管线，产物放进 `04-成片/`。
跑通后回来补一行到 `frontend/targets.json` 的 `{p['id']}`，下次就能一条命令走完。
""")
        print(f"  该管线未声明渲染命令（{reason}），已出交接包 + 04-下一步.md")
        return 4

    log = job / "04-成片" / "04-渲染日志.txt"
    log.parent.mkdir(parents=True, exist_ok=True)
    log.write_text("", encoding="utf-8")

    def run(template: str, label: str, timeout: int = 0) -> int:
        cmd = template.format(**fmt)
        started = time.time()
        with open(log, "a", encoding="utf-8") as f:
            f.write(f"$ [{label}] {cmd}\n")
            print(f"  $ [{label}] {cmd}")
            proc = subprocess.Popen(cmd, shell=True, cwd=str(ROOT), stdout=subprocess.PIPE,
                                    stderr=subprocess.STDOUT, text=True, encoding="utf-8",
                                    errors="replace")
            deadline = started + (timeout or 10**9)
            last_size, last_change = -1, time.time()

            def fresh_mp4() -> list:
                return [q for q in (job / "04-成片").rglob("*.mp4") if q.stat().st_mtime >= started - 1]

            while True:
                try:
                    out, _ = proc.communicate(timeout=5)
                    f.write(out or "")
                    return proc.returncode
                except subprocess.TimeoutExpired:
                    # 浏览器子进程会挂住管道：成片写完后长时间不再变长即视为收工
                    mp4 = fresh_mp4()
                    size = max((q.stat().st_size for q in mp4), default=-1)
                    if size != last_size or not mp4:
                        last_size, last_change = size, time.time()
                    settled = size > 0 and time.time() - last_change >= 12
                    if settled or time.time() > deadline:
                        subprocess.run(f"taskkill /F /T /PID {proc.pid}", shell=True,
                                       capture_output=True)
                        try:
                            out, _ = proc.communicate(timeout=20)
                        except subprocess.TimeoutExpired:
                            out = ""
                        f.write(out or "")
                        mp4 = fresh_mp4()
                        if mp4:
                            f.write(f"\n[watchdog] {label} 进程未自行退出（浏览器子进程占着管道），"
                                    "成片已落盘且体积稳定 → 判成功：" +
                                    "、".join(str(q.relative_to(job)) for q in mp4) + "\n")
                            print(f"  {label} 进程未退出，但成片已落盘且稳定，判成功：{mp4[0].relative_to(job)}")
                            return 0
                        f.write(f"\n[watchdog] {label} 未产出成片（等待 {timeout}s）\n")
                        print(f"  {label} 没有成片，日志见 {log.relative_to(ROOT)}")
                        return 124

    steps = [k for k in ("new", "ingest", "render", "deliver") if t.get(k)]
    for k in steps:
        rc = run(t[k], k, timeout=args.render_timeout if k == "render" else 0)
        if rc != 0:
            print(f"  {k} 阶段失败（rc={rc}），日志见 {log.relative_to(ROOT)}")
            return 5
    print(f"  渲染完成，产物在 04-成片/（日志 {log.name}）")
    return 0


# ---------------------------------------------------------------- 05 发布
def pick_tags(src: Path, title: str, topic: str, p: dict) -> list[str]:
    """fengmian 要求恰好 4 个话题；解析没吐出 enough 时按关键词 / 片名 / 选题补齐。"""
    sys.path.insert(0, str(FENGMian))
    try:
        from fm import analyze as A
        parsed = A.analyze(src, title)
    except Exception:
        parsed = {"keywords": [], "suggested_tags": []}
    pool: list[str] = []
    numeral = set(CN_DIGITS) | set(CN_UNITS) | {"几", "多", "许"}
    for t in list(parsed.get("suggested_tags") or []) + [f"#{k}" for k in parsed.get("keywords") or []]:
        core = t.lstrip("#")
        if not core or set(core) <= numeral or len(core) < 2:
            continue
        if t not in pool:
            pool.append(t)
    for chunk in re.split(r"[：:，,。、\s]+", f"{title} {topic}"):
        if len(chunk) >= 2 and f"#{chunk}" not in pool:
            pool.append(f"#{chunk}")
    for fallback in (f"#{p['name_zh']}", "#历史", "#科普", "#人文"):
        if len(pool) >= 4:
            break
        if fallback not in pool:
            pool.append(fallback)
    return pool[:4]


CN_DIGITS = {"零": 0, "〇": 0, "一": 1, "二": 2, "两": 2, "三": 3, "四": 4,
             "五": 5, "六": 6, "七": 7, "八": 8, "九": 9}
CN_UNITS = {"十": 10, "百": 100, "千": 1000, "万": 10000, "亿": 100000000}


def _cn_run(run: str) -> str:
    total = section = num = 0
    for ch in run:
        if ch in CN_DIGITS:
            num = CN_DIGITS[ch]
        elif ch in CN_UNITS:
            u = CN_UNITS[ch]
            if u >= 10000:
                section = (section + num) * u
                total += section
                section = 0
            else:
                section += (num or 1) * u
            num = 0
        else:
            return run
    return str(total + section + num)


def arabic_numbers(text: str) -> str:
    """发布信息校验要求标题里出现阿拉伯数字：把「一千一百」这类中文数字换成 1100。"""
    return re.sub(r"[〇零一二三四五六七八九两十百千万亿]{2,}", lambda m: _cn_run(m.group(0)), text)


def pick_title(job: Path, args) -> str:
    """发布信息要求两段式标题（≤25 字，含阿拉伯数字）；没给两段式就用片名 + 钩子首句凑一版。"""
    if args.fengmian_title:
        return args.fengmian_title
    if "：" in args.title or ":" in args.title:
        return args.title
    lead = args.title.split("·")[0][:12]
    tail = ""
    src = job / "02-文案.txt"
    if src.exists():
        first = src.read_text(encoding="utf-8").splitlines()[0]
        tail = re.sub(r"[\s，,。！!？?“”\"'、；;：:—…]+", "", first)
        tail = arabic_numbers(tail)[:12]
        tail = re.sub(r"[的给让在是被从对就也都和与及把将个]$", "", tail) or tail
    tail = tail or "3 分钟讲完"
    if not re.search(r"[0-9]", tail):
        tail = "3 分钟讲完"
    return f"{lead}：{tail}"[:25]


def stage_publish(job: Path, p: dict, args) -> int:
    fm = FENGMian / "fengmian.py"
    if not fm.exists():
        print("  仓库里没有 fengmian 模块，05 跳过")
        return 5
    src = job / "03-字幕.srt"
    if not src.exists():
        src = job / "02-文案.txt"
    out = job / "05-发布"
    out.mkdir(exist_ok=True)
    style = args.fengmian_style or ("laolang" if p["id"] == "laolang" else "tuiyan")
    title = pick_title(job, args)
    tags = " ".join(pick_tags(src, args.title, args.topic, p))
    cmd = [sys.executable, str(fm), "build", "--src", str(src), "--out", str(out),
           "--name", args.title, "--style", style, "--title", title, "--tags", tags, "--gate"]
    print(f"  标题：{title}")
    print(f"  话题：{tags}")
    print("  $ " + " ".join(f'"{c}"' if " " in c else c for c in cmd))
    rc = subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True,
                        encoding="utf-8", errors="replace")
    (job / "05-发布" / "05-日志.txt").write_text((rc.stdout or "") + (rc.stderr or ""), encoding="utf-8")
    if rc.returncode != 0:
        print("  fengmian build 没过校验：")
        print((rc.stdout or rc.stderr or "").strip()[-600:])
        return 5
    if os.environ.get("ARK_API_KEY"):
        covers = [sys.executable, str(fm), "covers", "--dir", str(out), "--backend", "ark"]
        print("  $ fengmian covers --backend ark")
        subprocess.run(covers, cwd=str(ROOT))
    else:
        print("  没有 ARK_API_KEY：两张封面提示词已备好，可手动出图")
    info = out / "发布信息.txt"
    if info.exists():
        print("  发布信息：")
        for line in info.read_text(encoding="utf-8").splitlines():
            print("    " + line)
    return 0


# ---------------------------------------------------------------- 清单
def stage_manifest(job: Path, p: dict, args, status: dict[str, int]) -> None:
    rows = []
    for f in sorted(job.rglob("*")):
        if f.is_file():
            rows.append(f"| `{f.relative_to(job).as_posix()}` | {f.stat().st_size / 1024:.1f} KB |")
    lines = [
        f"# 交付清单 · {args.title}",
        "",
        f"- 管线：`{p['id']}` · {p['name_zh']}",
        f"- 选题：{args.topic}",
        f"- 阶段：01 选题 → 02 文案 → 03 免费配音 → 04 渲染 → 05 封面/发布",
        f"- 生成：{datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "",
        "## 阶段结果",
        "",
        "| 阶段 | 结果 |",
        "| --- | --- |",
    ]
    names = {"01": "选题", "02": "文案", "03": "免费配音", "04": "风格管线渲染", "05": "封面 + 发布信息"}
    codes = {0: "完成", 3: "缺文案（已给提示稿）", 4: "未声明渲染命令（已出交接包）", 5: "失败"}
    for k in STAGE_ORDER:
        if k in status:
            lines.append(f"| {k} {names[k]} | {codes.get(status[k], '完成')} |")
    lines += ["", "## 文件", "", "| 文件 | 大小 |", "| --- | --- |"] + rows
    lines += [
        "",
        "## 复跑",
        "",
        "```powershell",
        f"python frontend/frontend.py run --pipeline {p['id']} --topic \"{args.topic}\" --title \"{args.title}\" --job \"{job}\"",
        "```",
        "",
    ]
    write(job / "06-交付清单.md", "\n".join(lines))


# ---------------------------------------------------------------- 入口
def cmd_check(args) -> int:
    ok = True
    for f in ("frontend.json", "targets.json", "frontend.py"):
        p = HERE / f
        print(("  ✓ " if p.exists() else "  ✗ ") + f"frontend/{f}")
        ok = ok and p.exists()
    fm = FENGMian / "fengmian.py"
    print(("  ✓ " if fm.exists() else "  ✗ ") + "fengmian/fengmian.py（最后一道发布模块）")
    ok = ok and fm.exists()
    tg = targets()
    ids = [p["id"] for p in catalog()]
    missing = [i for i in ids if i not in tg]
    declared = [i for i in ids if (tg.get(i) or {}).get("render")]
    print(f"  · 管线覆盖 {len(ids) - len(missing)}/{len(ids)}；已声明渲染命令 {len(declared)} 条：{', '.join(declared) or '—'}")
    if missing:
        print("  ✗ targets.json 缺：" + ", ".join(missing))
        ok = False
    try:
        import edge_tts  # noqa: F401
        print("  ✓ edge-tts（联网免费配音）")
    except ImportError:
        print("  · 没有 edge-tts（pip install edge-tts）；会自动退到 Windows SAPI")
    print(("  ✓ " if shutil.which("ffmpeg") else "  ✗ ") + "ffmpeg")
    print(("  ✓ " if shutil.which("ffprobe") else "  ✗ ") + "ffprobe")
    return 0 if ok else 1


def cmd_plan(p: dict, args) -> int:
    tg = (targets().get(p["id"]) or {})
    print(f"{p['id']} · {p['name_zh']} 走前端闭环：")
    print("  01 选题   → 01-选题.md")
    print("  02 文案   → 02-文案.md（--script 或 AV_LLM_BASE）")
    print(f"  03 配音   → 03-配音.mp3 + 03-字幕.srt（{args.voice_engine}）")
    if tg.get("render"):
        for k in ("new", "ingest", "render", "deliver"):
            if tg.get(k):
                print(f"  04 {k:<6}→ {tg[k]}")
    else:
        print(f"  04 渲染   → 未声明（{tg.get('reason', '按管线文档手动接')}）；会出 04-交接包 + 04-下一步.md")
    print("  05 发布   → fengmian build（发布信息 + 两张封面提示词）")
    return 0


def cmd_run(p: dict, args) -> int:
    job = Path(args.job) if args.job else new_job(args.title or args.topic)
    if not job.is_absolute():
        job = ROOT / job
    job.mkdir(parents=True, exist_ok=True)
    print(f"任务目录 {job.relative_to(ROOT)}")
    stages = [s.strip() for s in args.stages.split(",") if s.strip()] if args.stages else STAGE_ORDER
    status: dict[str, int] = {}
    for stage in stages:
        print(f"[{stage}]")
        if stage == "01":
            rc = stage_topic(job, p, args)
        elif stage == "02":
            rc = stage_script(job, p, args)
        elif stage == "03":
            rc = stage_voice(job, p, args)
        elif stage == "04":
            rc = stage_render(job, p, args)
        elif stage == "05":
            rc = stage_publish(job, p, args)
        else:
            print(f"  未知阶段 {stage}")
            rc = 2
        status[stage] = rc
        if rc in (2, 3, 5):
            print(f"停在 {stage} 阶段（rc={rc}）")
            break
    stage_manifest(job, p, args, status)
    worst = max(status.values()) if status else 0
    if 5 in status.values():
        return 5
    if 3 in status.values():
        return 3
    if 4 in status.values():
        return 4
    return worst


def main() -> int:
    ap = argparse.ArgumentParser(description="Auto-Video 可选前端闭环：选题 → 文案 → 免费配音 → 管线 → 封面/发布")
    sub = ap.add_subparsers(dest="cmd", required=True)

    c = sub.add_parser("check", help="自检模块、fengmian、TTS 与管线覆盖")
    c.set_defaults(func=cmd_check)

    pl = sub.add_parser("plan", help="打印某条管线走这条闭环的步骤")
    pl.add_argument("--pipeline", required=True)
    pl.add_argument("--topic", default="")
    pl.add_argument("--voice-engine", default="edge")
    pl.set_defaults(func=cmd_plan)

    r = sub.add_parser("run", help="跑闭环")
    r.add_argument("--pipeline", required=True)
    r.add_argument("--topic", default="")
    r.add_argument("--title", default="")
    r.add_argument("--script", default="", help="现成文案（.md/.txt）")
    r.add_argument("--voice-engine", default="edge", choices=["edge", "sapi", "none", "auto"])
    r.add_argument("--voice", default="zh-CN-YunxiNeural", help="edge-tts 音色")
    r.add_argument("--sapi-voice", default="Microsoft Huihui Desktop", help="Windows SAPI 音色")
    r.add_argument("--rate", default="+0%", help="edge-tts 语速，如 -10%%")
    r.add_argument("--voice-file", default="", help="直接用现成音频当配音")
    r.add_argument("--duration", type=int, default=60, help="目标时长（秒），决定文案字数提示")
    r.add_argument("--audience", default="抖音/视频号泛知识观众")
    r.add_argument("--job", default="", help="复用已有任务目录")
    r.add_argument("--stages", default="", help="只跑部分阶段，如 03,04,05")
    r.add_argument("--render-timeout", type=int, default=900,
                   help="04 渲染最长等待秒数；超时但成片已落盘则判成功（浏览器子进程有时挂住管道）")
    r.add_argument("--fengmian-style", default="", help="封面风格预设（tuiyan / laolang）")
    r.add_argument("--fengmian-title", default="", help="发布信息标题（两段式：前段：后段，≤25 字）")
    r.set_defaults(func=lambda a: cmd_run(find_pipeline(a.pipeline), a))

    args = ap.parse_args()
    utf8()
    if args.func is cmd_check:
        return cmd_check(args)
    if args.func is cmd_plan:
        if not args.topic:
            args.topic = "（未给选题）"
        return cmd_plan(find_pipeline(args.pipeline), args)
    if not args.topic and not args.job:
        sys.exit("要么给 --topic，要么给 --job 复用已有任务")
    if not args.title:
        args.title = args.topic[:20] or "未命名"
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
