# guangzhui · 光追 CGI管线

统一塑料着色、逐像素棋盘倒影、铬球环境映射；绿色线框扫成渲染线。

画法来自 huashu-art-motion v1.3.1 的 `15_raytrace`，引擎已完整 vendored 进 `vendor/huashu-art-motion/engine`，入口只调本仓库内的 `render.py`，不依赖任何外部 checkout。首个实例是 6 秒风格段；完整流程见 [SKILL.md](SKILL.md)，画法原文见 [references/style.md](references/style.md)，来源与同步见 [MIGRATION.md](MIGRATION.md)。

## 快速开始

```bash
uv run --with playwright python scripts/guangzhui.py --stills 0.5,2.5 --out review/guangzhui
uv run --with playwright python scripts/guangzhui.py --out out/guangzhui_试片.mp4 --seconds 6
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

统一塑料着色、逐像素棋盘倒影、铬球环境映射；绿色线框扫成渲染线。

## 许可

引擎与配方卡来自 [huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion)（MIT），见 [CREDITS.md](CREDITS.md)。
