#!/usr/bin/env python3
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
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Users\Administrator\AppData\Local\Google\Chrome\Application\chrome.exe",
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
    ap.add_argument("--retime", type=float, default=1.0,
                    help="时间缩放：内容时间 = 帧时间 × retime。1.0 原速；出 10 秒样片时用 0.7 把 7 秒画法拉长")
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
                   f"&w={a.width}&h={a.height}&fps={a.fps}&retime={a.retime}")
            pg.goto(url)
            pg.wait_for_function("window.__ready === true || !!window.__bootFailed", timeout=120000)
            fail = pg.evaluate("window.__bootFailed || null")
            if fail:
                raise SystemExit("舞台加载失败：\n" + fail)

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
        print("页面报错，拒绝交付：\n" + "\n".join(real[:8]), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
