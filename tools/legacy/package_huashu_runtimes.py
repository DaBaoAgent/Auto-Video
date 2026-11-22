"""给 huashu 接入的 31 条管线各建一套自包含 runtime。

口径（2026-11-20 用户确认）：不依赖上游仓库。每条管线自带
    runtime/render.py   自研画帧器（HTTP 静态服务 + Chromium 逐帧 + ffmpeg 管道）
    runtime/stage.html  自研舞台
    runtime/player.js   自研播放/抓帧协议
    runtime/scene.js    画法脚本（MIT 移植，文件头注明）
    runtime/lib/        该场景真正用到的库与字体
入口 scripts/<id>.py 只调本地 runtime/render.py --scene <id>。

跑完会把 vendor/huashu-art-motion 从仓库删掉，脚本会先自检每条的 lib/scene 都在。
用法：python tools/package_huashu_runtimes.py [--keep-vendor]
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VENDOR = ROOT / "vendor" / "huashu-art-motion"
ENGINE = VENDOR / "engine"
MAP_PATH = ROOT / "tools" / "huashu_style_map.json"

RENDER_PY = '''#!/usr/bin/env python3
"""Auto-Video 本地画帧器（自研封装）

只认本目录：runtime/scene.js + runtime/lib + runtime/stage.html。
不引用任何外部仓库、不调外部渲染脚本。

    python runtime/render.py --scene 01_cave --out review/x --stills 0.5,2.5
    python runtime/render.py --scene 01_cave --out out/x.mp4 --seconds 6

依赖：playwright、ffmpeg/ffprobe、本机 Chrome/Edge（或 Playwright 自带 chromium）。
"""

from __future__ import annotations

import argparse
import base64
import http.server
import os
import socketserver
import subprocess
import sys
import threading
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
WIN_CHROME = [
    r"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    r"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    r"C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
]
GRAB = "(t)=>{ window.renderAt(t); return window.__canvas.toDataURL('image/png').split(',')[1]; }"


def serve(root: Path):
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **k):
            super().__init__(*a, directory=str(root), **k)

        def log_message(self, *a):
            pass

    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), Quiet)
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]


def chrome_kwargs():
    if os.environ.get("CHROME_PATH"):
        return {"executable_path": os.environ["CHROME_PATH"]}
    if os.environ.get("CHROME_CHANNEL"):
        return {"channel": os.environ["CHROME_CHANNEL"]}
    if os.name == "nt":
        for p in WIN_CHROME:
            if Path(p).exists():
                return {"executable_path": p}
    return {}


def main() -> int:
    ap = argparse.ArgumentParser(description="本地逐帧画器")
    ap.add_argument("--scene", required=True)
    ap.add_argument("--out", required=True, help="成片路径，或抽帧目录")
    ap.add_argument("--seconds", type=float, default=6.0)
    ap.add_argument("--stills", default="", help="逗号分隔的秒数：只抽这几帧")
    ap.add_argument("--fps", type=int, default=24)
    ap.add_argument("--crf", type=int, default=18)
    ap.add_argument("--width", type=int, default=1920)
    ap.add_argument("--height", type=int, default=1080)
    a = ap.parse_args()

    from playwright.sync_api import sync_playwright

    srv, port = serve(HERE)
    errors = []
    try:
        with sync_playwright() as p:
            b = p.chromium.launch(args=["--disable-web-security", "--enable-gpu-rasterization",
                                        "--ignore-gpu-blocklist"], **chrome_kwargs())
            pg = b.new_page(viewport={"width": a.width, "height": a.height})
            pg.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
            pg.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
            url = (f"http://127.0.0.1:{port}/stage.html?scene={a.scene}"
                   f"&w={a.width}&h={a.height}&fps={a.fps}")
            pg.goto(url)
            pg.wait_for_function("window.__ready === true || !!window.__bootFailed", timeout=120000)
            fail = pg.evaluate("window.__bootFailed || null")
            if fail:
                raise SystemExit("舞台加载失败：\\n" + fail)

            if a.stills:
                out = Path(a.out)
                out.mkdir(parents=True, exist_ok=True)
                for s in a.stills.split(","):
                    t = float(s)
                    png = base64.b64decode(pg.evaluate(GRAB, t))
                    (out / f"t{t:05.2f}.png").write_bytes(png)
                print("stills ->", out)
            else:
                vid = Path(a.out)
                vid.parent.mkdir(parents=True, exist_ok=True)
                ff = subprocess.Popen(
                    ["ffmpeg", "-y", "-v", "error", "-f", "image2pipe", "-framerate", str(a.fps),
                     "-c:v", "png", "-i", "-", "-c:v", "libx264", "-preset", "medium",
                     "-crf", str(a.crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(vid)],
                    stdin=subprocess.PIPE)
                n = round(a.seconds * a.fps)
                st = time.time()
                for i in range(n):
                    ff.stdin.write(base64.b64decode(pg.evaluate(GRAB, i / a.fps)))
                    if i % 48 == 0:
                        print(f"{i}/{n}  {time.time() - st:.0f}s", flush=True)
                ff.stdin.close()
                ff.wait()
                print("done ->", vid)
            b.close()
    finally:
        srv.shutdown()

    real = [e for e in errors if "favicon" not in e]
    if real:
        print("页面报错，拒绝交付：\\n" + "\\n".join(real[:8]), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
'''

STAGE_HTML = """<!doctype html>
<html lang="zh"><head><meta charset="utf-8"><link rel="icon" href="data:,">
<title>Auto-Video · local stage</title>
<style>html,body{{margin:0;background:#111;overflow:hidden}}canvas{{display:block}}</style></head>
<body>
<canvas id="c" width="1920" height="1080"></canvas>
<script>window.SCENES = window.SCENES || {{}};</script>
{LIBS}
<script src="scene.js"></script>
<script src="player.js"></script>
</body></html>
"""

LIBS = [
    "lib/fonts.js", "lib/util.js", "lib/paint.js", "lib/brush.js", "lib/render.js",
    "lib/post.js", "lib/rig.js", "lib/rig_huashu.js", "lib/kit.js", "lib/medium.js",
    "lib/motion.js", "lib/camera.js", "lib/diagram.js", "lib/typo.js", "lib/chart.js",
    "lib/ui.js", "lib/collage.js", "lib/media.js", "lib/toon.js", "lib/palettes.js",
    "lib/finish.js",
]

PLAYER_JS = """/* Auto-Video 本地舞台（自研）：单场景逐帧画布。
   协议：window.renderAt(t) 画一帧；window.__ready = true 表示字体/初始化完成；
   出错写 window.__bootFailed，render.py 会拒绝渲染。 */
(() => {
  const qs = new URLSearchParams(location.search);
  const W = +qs.get('w') || 1920, H = +qs.get('h') || 1080;
  const id = qs.get('scene');
  const cv = document.getElementById('c');
  const ctx = cv.getContext('2d');
  window.__canvas = cv;
  window.__bootFailed = null;

  (async () => {
    try {
      U.setStage(W, H);
      cv.width = W; cv.height = H;
      for (const f of (window.FONT_FACES || [])) {
        const ff = new FontFace(f.family, `url(${f.url})`, f.desc || {});
        await ff.load();
        document.fonts.add(ff);
      }
      await document.fonts.ready;
      const s = window.SCENES && window.SCENES[id];
      if (!s || typeof s.draw !== 'function') throw new Error('没有这个场景：' + id);
      window.IMG = {};
      if (s.init) await s.init(window.IMG);
      window.renderAt = (t) => {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, W, H);
        s.draw(ctx, t, t, window.IMG, undefined);
        ctx.restore();
      };
      window.renderAt(0);
      window.__ready = true;
    } catch (e) {
      window.__bootFailed = String(e && e.stack || e);
      console.error('BOOT FAILED\\n' + window.__bootFailed);
    }
  })();
})();
"""

ENTRY_PY = '''#!/usr/bin/env python3
"""Auto-Video · {id}（{name_zh} / {name_en}）

自包含入口：只调本管线的 runtime/render.py，再往下一层是 runtime/scene.js 与 runtime/lib。
不引用任何外部仓库。

    python pipelines/{id}/scripts/{id}.py --stills 0.5,2.5 --out review/{id}
    python pipelines/{id}/scripts/{id}.py --out out/{id}_试片.mp4 --seconds 6
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
RUNTIME = HERE.parent / "runtime" / "render.py"
SCENE = "{scene}"
DEFAULT_SECONDS = 6
DEFAULT_FPS = 24


def ensure_playwright() -> None:
    try:
        import playwright  # noqa: F401
        return
    except ImportError:
        pass
    if shutil.which("uv"):
        os.execvpe("uv", ["uv", "run", "--with", "playwright", "python", __file__, *sys.argv[1:]], os.environ)
    sys.exit("需要 playwright：uv run --with playwright python pipelines/{id}/scripts/{id}.py ...")


def main() -> int:
    p = argparse.ArgumentParser(description="{name_zh}（{name_en}）")
    p.add_argument("--out", required=True, help="成片路径，或抽帧目录（与 --stills 同用）")
    p.add_argument("--seconds", type=float, default=DEFAULT_SECONDS)
    p.add_argument("--stills", default="")
    p.add_argument("--fps", type=int, default=DEFAULT_FPS)
    p.add_argument("--crf", type=int, default=18)
    p.add_argument("--width", type=int, default=1920)
    p.add_argument("--height", type=int, default=1080)
    a = p.parse_args()

    ensure_playwright()
    cmd = [sys.executable, str(RUNTIME), "--scene", SCENE, "--out", a.out,
           "--seconds", str(a.seconds), "--fps", str(a.fps), "--crf", str(a.crf),
           "--width", str(a.width), "--height", str(a.height)]
    if a.stills:
        cmd += ["--stills", a.stills]
    print(" ".join(cmd))
    return subprocess.call(cmd)


if __name__ == "__main__":
    raise SystemExit(main())
'''

SKILL_BODY = """---
name: {id}
description: {name_zh}（{name_en}）：{tagline} 管线自带 runtime 与画法脚本，入口只调本目录画帧器，不依赖外部仓库。
---

# {id}：{name_zh}（{name_en}）

| 项 | 值 |
| --- | --- |
| 工位 | {station_no} {station_zh} |
| 渲染 | 本管线 `runtime/`（自研画帧器 + Canvas 2D 逐帧） |
| 画法 | `runtime/scene.js`（MIT 移植，文件头注明来源） |
| 上游质量 | {quality} |
| 画幅 | 16:9 · 24 fps |
| 入口 | `scripts/{id}.py` |

## 这条管线交什么

{tagline}

这是一条**自包含的单风格渲染线**：运行时、舞台、字体、画法脚本、入口全在 `pipelines/{id}/runtime/` 里，仓库外不留任何依赖。交付的是风格段 / 风格短片，默认不配旁白。

## 入口命令

```bash
# 抽两帧看画（没装 playwright 时用 uv 带一次）
python pipelines/{id}/scripts/{id}.py --stills 0.5,2.5 --out review/{id}

# 出 6 秒风格段
python pipelines/{id}/scripts/{id}.py --out out/{id}_试片.mp4 --seconds 6
```

## 写法要点

- **先读 `references/style.md`**：配方卡写的是这套画法的笔触、色光、空间和母题动法；`runtime/scene.js` 是它的画法实现。
- **画面是代码画的**：`runtime/scene.js` 不加载外部图片；换题材要重新构图，别把上游的「少女＋猫＋桌子」搬过去。
- **时间轴按秒算**：`--seconds` 出风格段长度；镜头内动作仍按画法的节拍走。
- **{quality_note}**

## 自研边界

- 自研：`runtime/render.py`（静态服务、逐帧抓取、ffmpeg 管道）、`runtime/stage.html`、`runtime/player.js`、`scripts/{id}.py`、参数与验收。
- 移植：`runtime/scene.js`（画法脚本）与 `runtime/lib/`（绘制库、字体）按 MIT 移植，来源与许可见 [CREDITS.md](CREDITS.md)、[MIGRATION.md](MIGRATION.md)。
- 运行时不读 `vendor/`、不读上游仓库、不调外部渲染脚本。
"""

README_BODY = """# {id} · {name_zh}管线

{tagline}

自包含封装：渲染器、舞台、画法脚本、字体、入口都在本管线内，`runtime/` 之外不依赖任何仓库。完整流程见 [SKILL.md](SKILL.md)，画法原文见 [references/style.md](references/style.md)，移植与许可见 [MIGRATION.md](MIGRATION.md) / [CREDITS.md](CREDITS.md)。

## 快速开始

```bash
python scripts/{id}.py --stills 0.5,2.5 --out review/{id}
python scripts/{id}.py --out out/{id}_试片.mp4 --seconds 6
```

## 环境

- Python 3.9+、ffmpeg / ffprobe 在 PATH
- 本机 Chrome 或 Edge（脚本自动找；也可设 `CHROME_PATH`）
- playwright：没装时用 `uv run --with playwright python ...`

## 目录

| 目录 | 内容 | 归属 |
|---|---|---|
| `scripts/` | 本管线入口 | 自研 |
| `runtime/render.py` | 本地画帧器（HTTP + Chromium + ffmpeg） | 自研 |
| `runtime/player.js` | 舞台协议 `renderAt(t)` | 自研 |
| `runtime/scene.js` | 画法实现 | MIT 移植 |
| `runtime/lib/` | 绘制库 + 字体子集 | MIT / OFL |
| `references/` | 画法配方卡 | 资料 |

## 画法要点

{tagline}
"""

MIGRATION_BODY = """# 封装说明 · {id}（{name_zh}）

## 结构

`pipelines/{id}/runtime/` 是一个完整可跑的画布舞台：

- `render.py`：自研画帧器。起本地静态服务 → 打开 `stage.html` → 逐帧 `renderAt(t)` → canvas PNG 走 image2pipe 进 ffmpeg。
- `stage.html` / `player.js`：自研舞台与协议，负责尺寸、字体加载、场景初始化与逐帧清屏。
- `scene.js`：画法脚本，文件头保留 MIT 来源说明。
- `lib/`：该场景真正用到的绘制库（约 230 KB）与按需字体子集，`lib/fonts/LICENSES.md` 记 OFL 清单。
- `scripts/{id}.py`：只拼参数并调用本地 `runtime/render.py`。

## 自研边界

| 部分 | 归属 | 说明 |
| --- | --- | --- |
| 画帧器 / 舞台 / 播放协议 / 入口 / 参数 / 文档 | 本仓库自研 | 不复制上游 render 管线 |
| 画法脚本 `scene.js` | MIT 移植 | 来源 huashu-art-motion v1.3.1 `{scene}`，文件头注明 |
| 绘制库 `lib/` | MIT 移植 | 只带该场景用到的模块 |
| 字体 `lib/fonts/` | SIL OFL 1.1 | 按场景裁剪，不全量随仓库 |

## 不依赖上游

- 入口只调 `runtime/render.py`，路径相对本管线解析；删掉仓库外任何目录也能跑。
- 不读 `vendor/`、不读 `~/huashu-art-motion`、不调外部 `render.py`。
- 字体、库、场景全部在 `runtime/` 内，离线可渲染。

## 更新画法

改 `runtime/scene.js` 即可；舞台与画帧器不用动。改了场景后至少抽一帧验收：

```bash
python pipelines/{id}/scripts/{id}.py --stills 0.5,2.5 --out review/{id}
```
"""

CREDITS_BODY = """# 来源与许可

## 本仓库自研

- `runtime/render.py`、`runtime/stage.html`、`runtime/player.js`、`scripts/{id}.py`、参数、验收与文档。

## 移植部分

- 画法脚本：huashu-art-motion v1.3.1 的 `{scene}`（作者花叔，MIT License），文件头保留来源。
- 绘制库：同上仓库的 `lib/` 模块，按场景裁剪后随管线内联。
- 字体：SIL OFL 1.1，清单见 `runtime/lib/fonts/LICENSES.md` 与 `OFL.txt`。
- 上游角色帧（花叔形象）、总览图、示范视频不随 MIT 授权，本仓库未收录。

## 参考

- 上游仓库：<https://github.com/alchaincyf/huashu-art-motion>
- 配方卡：`references/style.md`（资料，不参与渲染）
"""


def lib_body(name: str) -> str | None:
    p = ENGINE / "lib" / name
    return p.read_text(encoding="utf-8") if p.exists() else None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--keep-vendor", action="store_true")
    ap.add_argument("--only", default="")
    args = ap.parse_args()

    styles = json.loads(MAP_PATH.read_text(encoding="utf-8"))["styles"]
    imports = {v["id"]: v for v in styles.values() if v.get("disposition") == "import"}
    if args.only:
        want = set(args.only.split(","))
        imports = {k: v for k, v in imports.items() if k in want}

    font_map = {}
    fonts_js = (ENGINE / "lib" / "fonts.js").read_text(encoding="utf-8")
    for fam, file, desc in re.findall(r"family:'([^']+)', url:'lib/fonts/([^']+)'(?:, desc:(\{[^}]+\}))?", fonts_js):
        font_map[fam] = (file, desc)

    libs = [n for n in LIBS]
    for pid, v in imports.items():
        scene_src = (ENGINE / "scenes" / f"{v['scene']}.js").read_text(encoding="utf-8")
        d = ROOT / "pipelines" / pid
        rt = d / "runtime"
        if rt.exists():
            shutil.rmtree(rt)
        (rt / "lib" / "fonts").mkdir(parents=True)

        # 库
        need_three = "THREE." in scene_src
        for rel in libs:
            src = ENGINE / rel
            if src.exists():
                (rt / rel).write_text(src.read_text(encoding="utf-8"), encoding="utf-8", newline="\n")
        if need_three:
            shutil.copyfile(ENGINE / "lib" / "three.min.js", rt / "lib" / "three.min.js")
            shutil.copyfile(ENGINE / "lib" / "THREE_LICENSE.txt", rt / "lib" / "THREE_LICENSE.txt")

        # 字体：只带场景里出现过的 family
        used = [(fam, font_map[fam]) for fam in font_map if fam in scene_src]
        face_lines = []
        for fam, (file, desc) in used:
            shutil.copyfile(ENGINE / "lib" / "fonts" / file, rt / "lib" / "fonts" / file)
            face_lines.append("  {{family:'{0}', url:'lib/fonts/{1}'{2}}},".format(
                fam, file, (", desc:" + desc) if desc else ""))
        (rt / "lib" / "fonts.js").write_text(
            "// Auto-Video 本地字体登记：只登记本管线 runtime/lib/fonts 里真实存在的字重。\n"
            "window.FONT_FACES = [\n" + "\n".join(face_lines) + "\n];\n", encoding="utf-8", newline="\n")
        for extra in ("OFL.txt", "LICENSES.md"):
            if (ENGINE / "lib" / "fonts" / extra).exists():
                shutil.copyfile(ENGINE / "lib" / "fonts" / extra, rt / "lib" / "fonts" / extra)

        # 场景
        (rt / "scene.js").write_text(
            "/* 画法脚本：移植自 huashu-art-motion v1.3.1 的 scenes/{0}.js（MIT）。\n"
            "   运行所需的库、字体、舞台都在本管线的 runtime/ 内，不引用外部仓库。 */\n".format(v["scene"])
            + scene_src, encoding="utf-8", newline="\n")

        # 自研舞台
        page_libs = (["lib/three.min.js"] if need_three else []) + libs
        (rt / "player.js").write_text(PLAYER_JS, encoding="utf-8", newline="\n")
        (rt / "stage.html").write_text(STAGE_HTML.format(LIBS="\n".join(
            '<script src="{}"></script>'.format(x) for x in page_libs)), encoding="utf-8", newline="\n")
        (rt / "render.py").write_text(RENDER_PY, encoding="utf-8", newline="\n")

        # 自研入口
        fields = dict(id=pid, name_zh=v["name_zh"], name_en=v["name_en"], scene=v["scene"],
                      tagline=v["tagline"], station_no=STATION_NO.get(v["station"], ""),
                      station_zh=STATION_ZH.get(v["station"], ""), quality=v["quality"],
                      quality_note=("上游自评 ★，角色还扁，先按 beta 用。" if v.get("status") == "beta"
                                    else "画法已按配方卡验收过；换题材时重新构图。"))
        (d / "scripts").mkdir(exist_ok=True)
        (d / "scripts" / f"{pid}.py").write_text(ENTRY_PY.format(**fields), encoding="utf-8", newline="\n")
        for name, body in (("SKILL.md", SKILL_BODY), ("README.md", README_BODY),
                           ("MIGRATION.md", MIGRATION_BODY), ("CREDITS.md", CREDITS_BODY)):
            (d / name).write_text(body.format(**fields), encoding="utf-8", newline="\n")

        print(f"{pid:8} runtime={sum(p.stat().st_size for p in rt.rglob('*') if p.is_file())//1024}KB "
              f"libs={len(libs)} fonts={len(used)} three={need_three}")

    if not args.keep_vendor:
        print("删除 vendor/huashu-art-motion（入口已全部改成本地 runtime）")
        shutil.rmtree(VENDOR)
    return 0


STATION_NO = {"paper": "01", "hand": "02", "craft": "03", "toon": "04", "graphic": "05",
              "screen": "06", "d3": "07", "map": "08", "diagram": "09", "live": "10", "front": "11"}
STATION_ZH = {"paper": "纸本叙事", "hand": "手绘笔触", "craft": "传统工艺", "toon": "卡通动画",
              "graphic": "平面图形", "screen": "屏幕赛博", "d3": "三维推演", "map": "地图地理",
              "diagram": "图纸说明", "live": "实拍混剪", "front": "前端工位"}


if __name__ == "__main__":
    raise SystemExit(main())
