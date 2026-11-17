"""检查文档里的相对链接与站点引用的媒体是否真的存在。

CI 里跟 validate.py / sync_runtime.py --check 一起跑；本地随时可以 `python tools/check_links.py`。
只查本地相对路径（http 链接交给外部，不在这里做网络请求）。
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = [ROOT / "README.md", ROOT / "CONTRIBUTING.md", ROOT / "CHANGELOG.md", ROOT / "SECURITY.md",
        ROOT / "CODE_OF_CONDUCT.md", ROOT / "docs" / "pipelines.md"]
MD_LINK = re.compile(r"\]\(([^)\s]+)\)")
MEDIA_REF = re.compile(r"media/([^\"')\s]+)")


def check_markdown(path, problems):
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8", errors="ignore")
    for m in MD_LINK.finditer(text):
        link = m.group(1)
        if link.startswith(("http://", "https://", "mailto:", "#", "www.")):
            continue
        rel = link.split("#")[0].strip()
        if not rel:
            continue
        target = (path.parent / rel).resolve()
        if not target.exists():
            problems.append(f"{path.relative_to(ROOT)}: 链接失效 → {link}")


def check_site(problems):
    site = ROOT / "site" / "index.html"
    if not site.exists():
        return
    text = site.read_text(encoding="utf-8", errors="ignore")
    media = ROOT / "site" / "media"
    for m in MEDIA_REF.finditer(text):
        target = media / m.group(1)
        if not target.exists():
            problems.append(f"site/index.html: 媒体缺失 → media/{m.group(1)}")


def main():
    problems = []
    for doc in DOCS:
        check_markdown(doc, problems)
    check_site(problems)
    if problems:
        print(f"✗ 发现 {len(problems)} 处断链：")
        for p in problems:
            print("  " + p)
        return 1
    print("OK 文档与站点引用全部存在")
    return 0


if __name__ == "__main__":
    sys.exit(main())
