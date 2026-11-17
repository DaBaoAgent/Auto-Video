#!/usr/bin/env python3
"""把 8 条 模板库 模板的 index.html 换成数据驱动分幕（AUTOSCENE）。

原来的模板把 8 句旁白写死在 scene 里（s('l1')…s('l8')），换稿就报
`timeline: narration line id "l2" not found`。这个脚本做一次性的改写：

- 保留模板原有的 head（字体、样式、runtime 脚本）
- 保留原作者写的 compose 选项（bpm / offset / grain / tail …）
- 保留原 theme 对象（底色、墨色、强调色、字体）
- 把 build 换成 AUTOSCENE.build(F, { title: document.title })
- 在 head 里补一行 <script src="lib/autoscene.js"></script>

幂等：已经改过的文件会跳过。想回到手写分幕，从 git 历史里取 index.html。
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PIPES = ["pencil", "isometric", "manga", "tapestry", "shadow", "parable", "goldenage", "blueprint"]


def find_object(s: str, start: int) -> tuple[int, int]:
    """从 start（指向 '{'）开始，按花括号配对返回 (i, j) 闭区间下标，跳过字符串。"""
    assert s[start] == "{"
    depth = 0
    i = start
    quote = None
    while i < len(s):
        c = s[i]
        if quote:
            if c == "\\":
                i += 2
                continue
            if c == quote:
                quote = None
        elif c in "\"'`":
            quote = c
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return start, i
        i += 1
    raise ValueError("花括号不配对")


def rewrite(path: Path) -> str:
    html = path.read_text(encoding="utf-8")
    if "AUTOSCENE.build" in html:
        return "已改过"

    m = re.search(r"PROMO\.compose\(\{", html)
    if not m:
        return "没有 PROMO.compose，跳过"
    compose_at = m.start()
    open_brace = html.index("{", compose_at)

    # 选项行：compose({ 之后到 theme: 之前
    theme_at = html.index("theme:", open_brace)
    head_opts = html[open_brace + 1 : theme_at].strip().rstrip(",").strip()
    theme_open = html.index("{", theme_at)
    _, theme_end = find_object(html, theme_open)
    theme_txt = html[theme_open : theme_end + 1]

    # compose 的收尾就是文件里最后一个 '});'（模板都以它结束）
    close_at = html.rindex("});")
    after = html[close_at + 3 :]

    # head：加一行 autoscene（放在 </head> 前，也就是 promo / kit 之后，AUTOSCENE 调用时 PROMO 已就绪）
    head = html[:compose_at]
    if "lib/autoscene.js" not in head:
        tag = '<script src="lib/autoscene.js"></script>\n'
        head = head.replace("</head>", tag + "</head>", 1)

    opts_block = (head_opts + ",\n") if head_opts else ""
    body = (
        head
        + "PROMO.compose({\n"
        + opts_block
        + "  theme: " + theme_txt + ",\n"
        + "  // 分幕从 TIMELINE 长出来：一句旁白一张卡，几行稿子都能渲（见 lib/autoscene.js）\n"
        + "  build: (F) => AUTOSCENE.build(F, { title: document.title }),\n"
        + "});"
        + after
    )
    path.write_text(body, encoding="utf-8")
    return "已改写"


def main() -> int:
    for p in PIPES:
        f = ROOT / p / "template" / "index.html"
        if not f.exists():
            print(f"  {p:<10} 缺 template/index.html")
            continue
        print(f"  {p:<10} {rewrite(f)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
