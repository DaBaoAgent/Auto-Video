# dongxue · 洞穴岩画管线

噪声岩壁作底、炭点毛边勾形，赭石真的吃进岩面；野牛两姿态交替跑，火光一直在摇。

画法来自 huashu-art-motion v1.3.1 的 `01_cave`，引擎已完整 vendored 进 `vendor/huashu-art-motion/engine`，入口只调本仓库内的 `render.py`，不依赖任何外部 checkout。首个实例是 6 秒风格段；完整流程见 [SKILL.md](SKILL.md)，画法原文见 [references/style.md](references/style.md)，来源与同步见 [MIGRATION.md](MIGRATION.md)。

## 快速开始

```bash
uv run --with playwright python scripts/dongxue.py --stills 0.5,2.5 --out review/dongxue
uv run --with playwright python scripts/dongxue.py --out out/dongxue_试片.mp4 --seconds 6
```

## 环境

- Python 3.9+、ffmpeg / ffprobe 在 PATH
- 本机 Chrome 或 Edge（脚本自动找；也可设 `CHROME_PATH`）
- playwright：没装时用 `uv run --with playwright python ...`

## 目录

| 目录 | 内容 |
|---|---|
| `scripts/` | 本管线入口（抽帧 / 出片） |
| `references/` | 上游风格配方卡原文 |
| `vendor/`（仓库根） | huashu 引擎、场景、转场、字体，MIT |

## 画法要点

噪声岩壁作底、炭点毛边勾形，赭石真的吃进岩面；野牛两姿态交替跑，火光一直在摇。

## 许可

引擎与配方卡来自 [huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion)（MIT），见 [CREDITS.md](CREDITS.md)。
