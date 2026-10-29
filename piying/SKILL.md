---
name: piying
description: 皮影/剪影卡片风历史神话视频管线。用 Playwright + Canvas 逐帧渲染，配合 ffmpeg 合成 1920×1080 / 30fps 口播视频，包含分镜生成、密度核验、四查门禁、逐帧捕获、音效、BGM、封面和交付检查。
---

# piying · 皮影剪影卡片视频管线

`piying` 是炎帝系列沉淀出的代码动画管线。画面由 Canvas 实时绘制，Playwright 逐帧截图，ffmpeg 负责音视频合成。全流程不依赖文生图或图生视频。

完整制作规范保留在 [references/yandi-video-spec.md](references/yandi-video-spec.md)，包含成片参数、密度阈值、字幕规则、背景运镜、音效、BGM、封面、发布信息和 28 条避坑记录。

## 目录

```text
piying/
├── package.json
├── render/piying/
│   ├── gen_sample_yandi.js
│   ├── gen_full_yandi.js
│   ├── page_yandi.html
│   ├── page_full_yandi.html
│   ├── audit_yandi.js
│   ├── qc_yandi.js
│   ├── qc_full_yandi.js
│   ├── capture_yandi.js
│   ├── capture_full_yandi.js
│   ├── make_sfx_yandi.js
│   ├── make_sfx_full_yandi.js
│   └── delivery_gate_yandi.js
├── output/007_炎帝/       # 炎帝示例输入与素材
├── output/006_女娲/       # piying 实际使用的共享背景与主角
├── tools/                 # 配音、转写、读音与素材处理工具
└── docs/                  # 系列制作规则与段落分配
```

## 快速开始

```bash
cd piying
npm ci

cd render/piying
node gen_full_yandi.js
node qc_full_yandi.js
node audit_yandi.js full
node capture_full_yandi.js
node make_sfx_full_yandi.js
node delivery_gate_yandi.js
```

默认浏览器为本机 Edge。需要换浏览器时设置 `PLAYWRIGHT_CHROME`：

```powershell
$env:PLAYWRIGHT_CHROME = 'C:/path/to/chrome.exe'
```

## 规格

| 项 | 定稿值 |
| --- | --- |
| 成片 | 1920×1080 / 30fps |
| 视频 | H.264、CRF 19、yuv420p、faststart |
| 音频 | AAC 192k / 44100Hz / stereo |
| 响度 | -16 LUFS / 真峰值不高于 -1.5 dBTP |
| 字幕 | 底部安全区、64px、无标点、关键词金色 |
| 转场 | dip / veil / softWipe / softIris，禁用全屏色块扫屏和闪白 |
| 密度 | 文字面积 ≤30%，同屏运动元素 ≥5，每 2 秒至少一个新动效点 |

## 验收

封装前必须依次通过：

1. `node qc_full_yandi.js`
2. `node audit_yandi.js full`
3. `node capture_full_yandi.js`
4. `node make_sfx_full_yandi.js`
5. `node delivery_gate_yandi.js`

交付门禁检查类型覆盖、字幕区越界、空渲染、坏文本、密度、响度和目录结构。
