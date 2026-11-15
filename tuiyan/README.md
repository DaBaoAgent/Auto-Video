# tuiyan — 历史战争推演视频生产线

「徐艾伦・全 3D 战场重现」系列：输入历史战争主题 → 自动产出 20 分钟+ 口播文案 + 3D 兵棋推演地图动画 + 字幕/音效/BGM 成片（稳帧 1080p）。赤壁之战完整版成片由此管线产出。

**来源**：本管线是从 `DaBaoAgent/alannew`（2026-10-14 产出赤壁之战完整版成片的项目）克隆的**干净子集**——只保留最终成片所需的管线与引擎部分，不含官渡等其他战役包、演示包（chibi 9 幕）、老变体（chibi-10min / chibi-full-12x / chibi-clone）、素材库与验证中间产物。取舍详情见 [MIGRATION.md](MIGRATION.md)。

## 目录结构

| 路径 | 内容 |
| --- | --- |
| `pipeline/laorou/` | 口播稿子管线：爆款稿机检 + 中文去味 Humanizer（自带 SKILL.md） |
| `scripts/` | 生产脚本：封面生成、音色试听、成片抽帧审核、发布信息校验、渲染启动 |
| `references/` | `历史战争推演视频_开发报告_v1.md`（架构与选型总纲） |
| `vendor/battlefield-editor/` | 3D 渲染引擎（上游 yazelin/battlefield-editor 的本地化派生版，MIT）：three.js 本地化、全量简中化、`packages/chibi-full/` 赤壁 46 幕完整素材包、`schema/`、`skills/`、`tools/` |

## 快速开始

```bash
# 数据校验
cd vendor/battlefield-editor
node tools/validate-data.mjs --pkg packages/chibi-full/battlefield.json

# 本地观战（赤壁 46 幕）
python -m http.server 8080
# → http://localhost:8080/play.html?pkg=packages/chibi-full/battlefield.json

# 门禁检查
node tools/audio-check.mjs --pkg packages/chibi-full/battlefield.json
PROXY=1 node tools/verify-zh.mjs        # 必须 errors: 0

# 全片稳帧渲染（逐帧截图 → x264）
node tools/render-film.mjs --pkg packages/chibi-full/battlefield.json --out <输出目录>
```

Windows 下可用 `scripts/start-film-render.ps1` 脱离终端启动渲染（写 PID + 日志）：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\start-film-render.ps1 `
    -Engine "vendor\battlefield-editor" -OutDir "content\01-赤壁之战\视频输出"
```

换配乐不重渲画面（`-c:v copy`）：

```bash
node tools/reburn-bgm.mjs --pkg packages/chibi-full/battlefield.json --video <原成片.mp4> --out <目录>
```

## 战役交付物规范

每个战役 = `content/NN-<战役名>/` 一个文件夹（`NN-` 两位序号），根目录只放 4 项最终交付物，其余中间产物进子目录：

```text
content/NN-<战役名>/
├── <战役名>_完整版*.mp4     # 最终成片（稳帧 1080p）
├── 封面-4比3.jpg            # doubao-seedream 生成（scripts/gen_covers_ark.mjs）
├── 封面-3比4.jpg
└── 发布信息.txt             # 两行：标题 ≤25 字两段式（含阿拉伯数字）+ 恰好 4 个 # 话题
```

校验：`python scripts/validate_publication_info.py content`。

## 依赖与版权

- **引擎**：派生自 MIT 许可的 [yazelin/battlefield-editor](https://github.com/yazelin/battlefield-editor)，本地化修改（不依赖 CDN，单文件 `play.html` 可直接运行）。
- **音效**：freesound CC0，授权与出处见 `vendor/battlefield-editor/sfx-library.json`。
- **配乐**：`audio.json#music.scenes` 逐幕选曲；影视原声（如 2010 版电视剧《三国》OST）**非 CC0、版权受保护**，来源与授权见 `packages/chibi-full/CREDITS.md`，本机自备、不入仓库。
- **成片与录制中间产物**（`.mp4` / `.capture-*`）体积过大不入 git，保留在 `content/<战役>/视频输出/`。

## 完整说明

架构、选型、数据六层与验证流程见 [references/历史战争推演视频_开发报告_v1.md](references/历史战争推演视频_开发报告_v1.md)（总纲，先读它）；管线入口见 [SKILL.md](SKILL.md)。
