# huixingzhen · 回形针风科普短片管线

风格：`mg-styles-15` #19 PaperClip「回形针」风（MIT）——实拍照片贴纸化 + 精确图表 + 大画布连续运镜 +
句级字幕 + 代码合成音效床 + 确定性 HTML 逐帧渲染。
参考实现：`projects/paperclip_zhou/`（商纣王 20s 样片，含 10s 版对照；透明人物帧复用 `shouhui/projects/012_shangzhouwang/` 抠像产物）。

## 环境

| 依赖 | 说明 |
|---|---|
| Python 3.11+ | 编排与音效合成（纯标准库；`gen_vidframes.py` 另需 numpy / Pillow / scipy） |
| Node.js 18+ | 渲染器与 puppeteer-core（经 `shouhui/node_modules` 复用） |
| Edge | 无头渲染；路径见 `scripts/render_frames.mjs` 的 `EDGE`，可用 `PC_EDGE` 覆盖 |
| ffmpeg / ffprobe | PATH 中可用；本机在 `D:/GPT-SoVITS/tools/ffmpeg/` |
| 字体 | `projects/<slug>/assets/font/AlibabaPuHuiTi-3-85-Bold.ttf`（免费商用） |

`vendor/mg-styles-15` 是外部渲染引擎（未随仓库提交，与 shouhui 等管线共用），首次运行先安装：

```powershell
git clone --depth 1 https://github.com/Vincentwei1021/mg-styles-15.git vendor/mg-styles-15
Set-Location vendor/mg-styles-15
npm install
Set-Location ../..
New-Item -ItemType Junction -Path 'shouhui/node_modules' -Target 'vendor/mg-styles-15/node_modules'
```

`huixingzhen` 的 `render_frames.mjs` 复用 `shouhui/scripts/render.mjs` 的 puppeteer-core，因此只依赖上面
`shouhui/node_modules` 这一条联接；若丢失，按 [shouhui/MIGRATION.md](../shouhui/MIGRATION.md) 重建。

## 快速开始

以参考实现 `projects/paperclip_zhou/` 为例（新建工程按 [SKILL.md](SKILL.md) 六步流程）：

```bash
cd D:/@kaifa/Auto-Video

# 渲染：页面 → 逐帧 PNG（Edge 无头）
node huixingzhen/scripts/render_frames.mjs paperclip_zhou --page index20.html --dur 20

# 音效：cues.json → sfx.wav
python huixingzhen/scripts/sfx_pack.py projects/paperclip_zhou/cues.json projects/paperclip_zhou/audio/sfx.wav 20

# 素材：透明帧 → 白描边贴纸；文物照片 → 圆角白框卡片
python huixingzhen/scripts/make_stickers.py <src.png> <out.png> 6
python huixingzhen/scripts/make_cards.py
```

长片（>5 分钟）走数据驱动：`scripts/align_full.py`（从句级对齐）→ `scripts/gen_episode.py`（62 镜分屏页）。

## 文件协议

页面必须定义：

```js
window.DEMO = { width: 1920, height: 1080, fps: 30, duration: 20 };
window.renderAt = async (t) => { /* 画 t 时刻的一帧 */ };
window.__ready = true; // 字体与首帧就绪后
```

渲染器按 `t = frame / fps` 逐帧截屏；页面里所有动画必须是 `t` 的纯函数。

## 目录速查

- `SKILL.md` —— 完整流程、素材检索规则、已知坑
- `scripts/render_frames.mjs` —— Edge 逐帧渲染
- `scripts/sfx_pack.py` —— 37 种配方音效合成
- `scripts/align_full.py` / `gen_episode.py` —— 全片数据驱动（>5 分钟）
- `scripts/make_stickers.py` / `make_cards.py` / `gen_vidframes.py` —— 贴纸 / 卡片 / 人物小帧
- `theme/dark.css` —— 深色主题（「未解之谜」版）定稿参数
