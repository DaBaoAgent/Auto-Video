"""跨平台的浏览器 / 字体 / ffmpeg 定位。

所有管线脚本统一从这里取路径，不再写死 `C:\\Users\\Administrator\\...` 或 `D:\\@kaifa\\...`。

用法（在管线脚本里）：

    REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    sys.path.insert(0, os.path.join(REPO, "tools"))
    from platform_paths import chrome_path, font_candidates, ffmpeg_path

查找顺序统一是「环境变量 → 各平台常见安装位置 → PATH」，找不到就返回 None，
由调用方给出中文报错（`require_chrome()` 已经写好这样的报错）。
"""

import os
import shutil
import sys
from pathlib import Path

CHROME_ENV_KEYS = ("CHROME_PATH", "AV_CHROME", "PLAYWRIGHT_CHROME", "AV_CHROME")

_WIN_BROWSERS = (
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
)
_MAC_BROWSERS = (
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
)
_LINUX_BROWSERS = (
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
)

_FONT_ENV_KEYS = ("AV_FONT_DIR", "FONT_DIR")
_WIN_FONT_DIRS = (r"C:\Windows\Fonts", r"C:\WINNT\Fonts")
_MAC_FONT_DIRS = ("/System/Library/Fonts", "/Library/Fonts", os.path.expanduser("~/Library/Fonts"))
_LINUX_FONT_DIRS = ("/usr/share/fonts", "/usr/local/share/fonts", os.path.expanduser("~/.fonts"))

# 管线常用字体：Windows 名 → 各平台等价的常见文件名（找不到就由调用方决定降级）
FONT_ALIASES = {
    "msyh.ttc": ("msyh.ttc", "NotoSansCJK-Regular.ttc", "NotoSansSC-Regular.otf", "SourceHanSansSC-Regular.otf"),
    "msyhbd.ttc": ("msyhbd.ttc", "NotoSansCJK-Bold.ttc", "NotoSansSC-Bold.otf", "SourceHanSansSC-Bold.otf"),
    "simhei.ttf": ("simhei.ttf", "NotoSansCJK-Bold.ttc", "NotoSansSC-Bold.otf"),
    "simsun.ttc": ("simsun.ttc", "NotoSerifCJK-Regular.ttc", "NotoSerifSC-Regular.otf"),
    "STXINGKA.TTF": ("STXINGKA.TTF", "LXGWMarkerGothic-Regular.ttf", "LongCang-Regular.ttf"),
    "STXINWEI.TTF": ("STXINWEI.TTF", "LXGWWenKai-Regular.ttf", "LXGWMarkerGothic-Regular.ttf"),
}


def chrome_path():
    """返回可用的 Chrome / Edge / Chromium 可执行文件路径；找不到返回 None。"""
    for key in CHROME_ENV_KEYS:
        v = os.environ.get(key)
        if v and Path(v).expanduser().exists():
            return str(Path(v).expanduser())
    if sys.platform == "win32":
        candidates = _WIN_BROWSERS
    elif sys.platform == "darwin":
        candidates = _MAC_BROWSERS
    else:
        candidates = _LINUX_BROWSERS
    for p in candidates:
        if Path(p).exists():
            return p
    for name in ("chrome", "google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "msedge", "microsoft-edge"):
        p = shutil.which(name)
        if p:
            return p
    return None


def require_chrome():
    """找不到浏览器时直接给出可操作的中文报错并退出。"""
    p = chrome_path()
    if p:
        return p
    sys.exit(
        "✗ 找不到 Chrome / Edge / Chromium。\n"
        "  装一个浏览器，或用环境变量指定：CHROME_PATH=/path/to/chrome（Windows 例：CHROME_PATH=\"C:/Program Files/Google/Chrome/Application/chrome.exe\"）"
    )


def font_dirs():
    for key in _FONT_ENV_KEYS:
        v = os.environ.get(key)
        if v and Path(v).exists():
            yield Path(v)
    if sys.platform == "win32":
        dirs = _WIN_FONT_DIRS
    elif sys.platform == "darwin":
        dirs = _MAC_FONT_DIRS
    else:
        dirs = _LINUX_FONT_DIRS
    for d in dirs:
        if Path(d).exists():
            yield Path(d)


def font_candidates(names):
    """把一串字体文件名展开成存在的绝对路径；按给出的顺序优先，找不到的跳过。

    `names` 里的名字会自动走 FONT_ALIASES 找平台等价字体（例如 msyh.ttc → 思源黑体）。
    """
    found = []
    dirs = list(font_dirs())
    for name in names:
        variants = FONT_ALIASES.get(name, (name,))
        for variant in variants:
            hit = None
            # 先看仓库自带字体目录（如果有），再看系统字体目录
            for d in [Path(__file__).resolve().parent.parent / "assets" / "fonts"] + dirs:
                p = d / variant
                if p.exists():
                    hit = str(p)
                    break
            if hit:
                if hit not in found:
                    found.append(hit)
                break
    return found


def ffmpeg_path():
    """ffmpeg 可执行文件；优先 $FFMPEG_PATH，其次 PATH。"""
    v = os.environ.get("FFMPEG_PATH")
    if v and Path(v).expanduser().exists():
        return str(Path(v).expanduser())
    return shutil.which("ffmpeg")


def ffprobe_path():
    v = os.environ.get("FFPROBE_PATH")
    if v and Path(v).expanduser().exists():
        return str(Path(v).expanduser())
    exe = shutil.which("ffprobe")
    if exe:
        return exe
    ff = ffmpeg_path()
    if ff:
        sibling = Path(ff).with_name("ffprobe" + (".exe" if sys.platform == "win32" else ""))
        if sibling.exists():
            return str(sibling)
    return None
