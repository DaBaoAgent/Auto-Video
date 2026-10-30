---
name: tuiyan
description: 历史战争推演视频管线（全 3D 战场重现）：口播稿 → 3D 兵棋推演动画 → 字幕/音效/BGM 成片（稳帧 1080p）。当用户要做历史战役推演视频、或说"按赤壁之战那套再来一部""用 tuiyan 出片"时使用。赤壁之战完整版成片由此管线产出。
---

# tuiyan —— 历史战争推演视频管线

「徐艾伦・全 3D 战场重现」系列的生产线：输入一个历史战争主题，产出 20 分钟级口播文案 + 3D 兵棋推演地图动画 + 字幕/音效/BGM 成片。

迁移自 `DaBaoAgent/alannew`（2026-10 赤壁之战成片管线），**只保留最终成片所需的最小自洽子集**：渲染引擎取 `packages/chibi-full`（赤壁 46 幕完整包），剔除官渡等未产出战役、演示包（chibi）、老变体（chibi-10min / chibi-full-12x / chibi-clone）与素材库。详细来源与取舍见 [MIGRATION.md](MIGRATION.md)。

## 定版实例

`vendor/battlefield-editor/packages/chibi-full/` —— 赤壁之战 46 幕完整包，产出 `赤壁之战_完整版_稳帧1080p_*.mp4`。

## 流水线（六层）

| 层 | 环节 | 落在哪里 |
| --- | --- | --- |
| 编剧层 | Hermes + DeepSeek 生成 5500-6500 字口播稿，机检 + 中文去味 | `pipeline/laorou/`（口播稿子管线，自带 SKILL.md） |
| 数据层 | battlefield 六层 JSON（battlefield/factions/units/structures/terrain/scene）+ Schema 校验 | `packages/chibi-full/` + `vendor/battlefield-editor/schema/` |
| 渲染层 | 3D 兵棋引擎 + 全片稳帧渲染（逐帧截图 → x264，非实时采集） | `vendor/battlefield-editor/`（`tools/render-film.mjs`） |
| 音频层 | TTS 配音 + whisper 对齐 + 音效/配乐（按幕选曲） | `tools/generate-film-narration.py`、`tools/assign-sfx.mjs`、`tools/assign-music.mjs` |
| 合成层 | ffmpeg 成片；`reburn-bgm` 免重渲换乐 | `tools/reburn-bgm.mjs`、`tools/record-video.mjs` |
| 发布层 | 封面（doubao-seedream）+ 发布信息.txt（两行校验）+ 多平台 | `scripts/gen_covers_ark.mjs`、`scripts/validate_publication_info.py` |

## 目录结构

```text
tuiyan/
├── SKILL.md                    # 本文件（管线入口）
├── README.md                   # 管线说明与快速开始
├── MIGRATION.md                # 迁移取舍与外部依赖
├── pipeline/laorou/            # 口播稿子管线（老肉风格机检 + blader-humanizer 去味）
├── scripts/                    # 生产脚本（封面/试听/审核/发布校验/渲染启动）
├── references/                 # 历史战争推演视频_开发报告_v1.md（总纲）
└── vendor/battlefield-editor/  # 3D 渲染引擎（本地化派生版，含 chibi-full 赤壁完整包）
```

## 常用命令（在 `vendor/battlefield-editor` 目录执行）

```bash
# 数据校验（含 Schema）
node tools/validate-data.mjs --pkg packages/chibi-full/battlefield.json

# 本地观战（赤壁 46 幕完整包）
python -m http.server 8080     # → http://localhost:8080/play.html?pkg=packages/chibi-full/battlefield.json

# 音频/中文残留门禁
node tools/audio-check.mjs --pkg packages/chibi-full/battlefield.json
PROXY=1 node tools/verify-zh.mjs           # 必须 errors: 0

# 全片稳帧渲染（逐帧截图 → x264）
node tools/render-film.mjs --pkg packages/chibi-full/battlefield.json --out <输出目录>

# 免重渲换配乐（画面 -c:v copy）
node tools/reburn-bgm.mjs --pkg packages/chibi-full/battlefield.json --video <原成片.mp4> --out <目录>
```

## 输入与输出

- **输入**：历史战争主题 + 史料调研 → `pipeline/laorou` 产出分幕口播稿 → 按幕注入 `narration/cues.json` 与配音音频
- **输出**（战役交付物规范，每个战役一个 `content/NN-<战役名>/` 目录，根目录只放 4 项）：
  - `<战役名>_完整版*.mp4` —— 最终成片（稳帧 1080p）
  - `封面-4比3.jpg`、`封面-3比4.jpg`
  - `发布信息.txt` —— 两行：标题 ≤25 字两段式（含阿拉伯数字）+ 恰好 4 个 `#` 话题
- 中间产物（母本/分镜/配音/试听）放 `源文件/`，渲染日志/预览放 `视频输出/`

## 验收条件

- `node tools/validate-data.mjs` 通过（数据 Schema 全绿）
- `PROXY=1 node tools/verify-zh.mjs` → `errors: 0`（零繁体/英文残留）
- `node tools/audio-check.mjs` → 无音频缺失/中文残留
- 成片抽帧人工复核：字幕切点贴近语音、画面无结构性错误、响度正常
- `python scripts/validate_publication_info.py content` → 发布信息格式通过

## 外部依赖

Node.js 18+、Python 3.10+、ffmpeg/ffprobe、Edge 或 Chrome（渲染录屏）。TTS 与 OST 配乐为本机自备项，详见 [MIGRATION.md](MIGRATION.md)。
