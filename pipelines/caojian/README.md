# caojian · 草间弥生波点管线

手绘不规则圆按六角网格取模；波点从猫身上一圈圈胀缩，镜屋一直往外长。

自包含封装：渲染器、舞台、画法脚本、字体、入口都在本管线内，`runtime/` 之外不依赖任何仓库。完整流程见 [SKILL.md](SKILL.md)，画法原文见 [references/style.md](references/style.md)，移植与许可见 [MIGRATION.md](MIGRATION.md) / [CREDITS.md](CREDITS.md)。

## 快速开始

```bash
python scripts/caojian.py --stills 0.5,2.5 --out review/caojian
python scripts/caojian.py --out out/caojian_试片.mp4 --seconds 6
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

手绘不规则圆按六角网格取模；波点从猫身上一圈圈胀缩，镜屋一直往外长。
