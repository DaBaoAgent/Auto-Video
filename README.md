<div align="center">

# Auto-Video

### 把口播稿变成成片，把创作经验变成可复用管线

面向 AI 视频、知识科普、历史叙事和自动化内容生产的管线集合。

[![GitHub stars](https://img.shields.io/github/stars/DaBaoAgent/Auto-Video?style=flat-square)](https://github.com/DaBaoAgent/Auto-Video/stargazers)
[![Last commit](https://img.shields.io/github/last-commit/DaBaoAgent/Auto-Video?style=flat-square)](https://github.com/DaBaoAgent/Auto-Video/commits/main)
![Pipelines](https://img.shields.io/badge/pipelines-5%20live-111111?style=flat-square)
![Roadmap](https://img.shields.io/badge/roadmap-99%20styles-c43b32?style=flat-square)

</div>

一条视频最耗时的地方，常常是配音、字幕、分镜、渲染和交付之间的反复接线。Auto-Video 收集可以直接运行的视频制作管线，把这条重复劳动沉淀成可复现的工程。

每条管线都包含实际执行脚本、模板、定版参数和验收条件。今天有 5 条，路线图目标是 99 条。纸本历史短片、历史纪录片、纸雕剪影、逐帧手绘和皮影剪影已经可以开工，更多题材、画风、节奏和平台需求会继续进入这里。

![lishi 历史科普短片画面](lishi/template/src/out/_compat.png)

<sub>`lishi` 的纸本视觉系统：楷体纪年、绢本底图、代码运镜与句级字幕。</sub>

## 现在能用什么

| 管线 | 适合的内容 | 视觉与生产方法 | 状态 |
| --- | --- | --- | --- |
| [jianying](jianying/SKILL.md) | 历史叙事、人物独白、悬案考据 | 绢本/纸本、卡片运动语法、Remotion 渲染 | 已上线 |
| [lishi](lishi/SKILL.md) | 历史人物、战事、悬案、纪年叙事 | 纸本/绢本、AI 静帧底图、代码运镜、Remotion 渲染 | 已上线 |
| [piying](piying/SKILL.md) | 历史神话、皮影剪影、卡片式讲解 | Playwright、Canvas 逐帧渲染、ffmpeg 音频合成 | 已上线 |
| [shouhui](shouhui/SKILL.md) | 手绘历史科普、短叙事、动作转场 | Canvas 手绘、线条沸腾、逐帧浏览器渲染 | 已上线 |
| [zhidiao](zhidiao/SKILL.md) | 长视频、历史图说、纸雕剪影解说 | TTS、词级转写、拼音 DP 对齐、HyperFrames 渲染 | 已上线 |

## 管线里有什么

一条管线会把内容如何进入画面也写进流程：口播稿如何对齐字幕，分镜如何锁定时间，素材如何对应镜头，成片如何检查，封面和发布信息如何打包。

`lishi` 会检查字幕切点、镜数分组、全片频闪预算和成片响度。`zhidiao` 会断言场景数与 manifest 一致，检查 SVG 补间、字幕重叠和成品抽帧，再输出专用发布目录。参数写成文件和代码，下一支片子仍能沿用。

## 一条视频怎么生产

```mermaid
flowchart LR
    A[选题与口播稿] --> B[配音与时间轴]
    B --> C[分镜与素材]
    C --> D[画面组装]
    D --> E[视频渲染]
    E --> F[质量检查]
    F --> G[封面与发布包]
```

| 阶段 | 输入 | 产出 | 通过条件 |
| --- | --- | --- | --- |
| 配音对齐 | 口播稿、配音 | 词级或句级时间轴 | 字幕切点贴近真实语音 |
| 分镜 | 时间轴、分镜表 | 镜头计划与素材映射 | 镜数、场景数、时长一致 |
| 组装渲染 | 分镜、模板、字体、素材 | 分段视频或完整成片 | 参数可复现，画面无结构性错误 |
| 质检 | 成片、时间轴、渲染数据 | 检查结果 | 字幕、频闪、补间和抽帧检查通过 |
| 交付 | 成片、封面、发布信息 | 可直接发布的目录 | 文件结构、尺寸和元信息符合规则 |

## 快速开始

```bash
git clone https://github.com/DaBaoAgent/Auto-Video.git
cd Auto-Video
```

仓库保存管线、模板和少量示例成片，不包含模型权重、外部渲染运行时或完整的私有素材库。

### lishi

需要 Python 3.11+、Node.js 18+、ffmpeg 和 ffprobe。选题目录准备好 `film.json`、分镜表和底图后，可从探针与整链开始：

```bash
python lishi/scripts/lishi.py probe --project <slug>
python lishi/scripts/lishi.py all --project <slug>
```

完整入口与参数见 [lishi/SKILL.md](lishi/SKILL.md) 和 [lishi/pipeline.json](lishi/pipeline.json)。

### jianying

需要 Python 3.11+、Node.js 18+、ffmpeg、numpy 和 ffprobe。新选题从 `new` 开始，`init` 会把模板和依赖链接到选题目录：

```bash
python jianying/scripts/jianying_shotcraft.py new myfilm --title "标题"
python jianying/scripts/jianying_shotcraft.py init --project myfilm
python jianying/scripts/jianying_shotcraft.py all --project myfilm
```

逐行配音还需要 GPT-SoVITS。完整入口、镜头卡和验收规则见 [jianying/SKILL.md](jianying/SKILL.md)。

### shouhui

需要 Python 3.10+、Node.js 18+、Edge 和 ffmpeg。仓库带有完整的商纣王示例工程；渲染前还要按迁移说明安装 `mg-styles-15` 渲染引擎：

```bash
python shouhui/scripts/shouhui.py probe 012_shangzhouwang
python shouhui/scripts/shouhui.py stills 012_shangzhouwang --times 1,3,5,7,9
python shouhui/scripts/shouhui.py render 012_shangzhouwang
```

完整环境和外部依赖见 [shouhui/MIGRATION.md](shouhui/MIGRATION.md)，手绘管线规则见 [shouhui/SKILL.md](shouhui/SKILL.md)。

### piying

需要 Node.js 20+、Edge 或 Chrome、ffmpeg 和 ffprobe。渲染示例页前先安装 Playwright：

```bash
cd piying
npm ci
cd render/piying
node gen_full_yandi.js
node qc_full_yandi.js
node audit_yandi.js full
```

迁移后的素材路径已经改为模块内相对路径。完整规格与门禁说明见 [piying/SKILL.md](piying/SKILL.md) 和 [piying/MIGRATION.md](piying/MIGRATION.md)。

### zhidiao

首次运行前要先准备 GPT-SoVITS、Faster-Whisper、HyperFrames，以及单片 composition 使用的共享样式、GSAP 和字体。迁移与依赖说明见 [zhidiao/MIGRATION.md](zhidiao/MIGRATION.md)。

```bash
cd zhidiao
python scripts/zhidiao_make_audio.py
python scripts/zhidiao_assemble.py --slug <slug>
```

封面、分镜素材和交付打包工具都在 `zhidiao/tools/`。完整七阶段流程见 [zhidiao/references/pipeline.md](zhidiao/references/pipeline.md)。

## 仓库结构

```text
Auto-Video/
├── jianying/
│   ├── SKILL.md              # 纸本历史短片入口
│   ├── scripts/              # 七阶段编排与制作脚本
│   ├── cards/                # 镜头运动语法
│   ├── references/           # 流程、主题、声音与验收规则
│   └── template/             # Remotion 画面工程
├── lishi/
│   ├── SKILL.md              # 历史科普短片入口
│   ├── pipeline.json         # 定版参数
│   ├── scripts/              # 对齐、分镜、音轨、渲染、封装
│   └── template/             # Remotion 画面工程
├── piying/
│   ├── SKILL.md              # 皮影剪影管线入口
│   ├── render/piying/        # 分镜、渲染、QC 与交付门禁
│   ├── output/               # 炎帝示例输入与素材
│   └── tools/                # 配音、转写与素材处理
├── shouhui/
│   ├── SKILL.md              # 逐帧手绘短片入口
│   ├── scripts/              # 编排、逐帧渲染与音效
│   └── projects/             # 示例工程与可直接查看的样片
└── zhidiao/
    ├── SKILL.md              # 纸雕剪影长视频入口
    ├── references/           # 目录契约、渲染、质检与交付规则
    ├── scripts/              # 配音对齐、组装、审计、抽帧
    └── tools/                # TTS、分镜素材、封面与交付打包
```

## 技术栈

| 环节 | 使用到的技术 |
| --- | --- |
| 内容与时间轴 | Python、GPT-SoVITS、Faster-Whisper、拼音 DP 对齐 |
| 画面工程 | TypeScript、Remotion、HTML、CSS、SVG、GSAP |
| 逐帧手绘 | Canvas、puppeteer-core、simplex-noise、opentype.js |
| 皮影剪影 | Playwright、Canvas、逐帧截图、ffmpeg |
| 长视频渲染 | HyperFrames、浏览器逐帧渲染 |
| 音频与交付 | ffmpeg、ffprobe、响度归一、两遍压缩 |
| 自动质检 | 字幕重叠检查、补间审计、频闪检测、成品抽帧 |

## 路线图

当前：`5 / 99`

Auto-Video 会按「完成一条，迁移一条」的方式持续扩展。新管线必须带自己的流程说明、脚本、可复用资源和验收条件，才算完成迁移。

99 条是长期目标，也就是 99 套能独立完成视频的生产方法。路线图会继续吸收不同题材、画风、媒介和平台需求，让更多人找到一条能直接开工的路径。

## English

Auto-Video is a growing collection of repeatable video production pipelines for AI-assisted storytelling. The current pipelines cover historical documentary shorts built with Remotion, paper-cut silhouette videos rendered with HyperFrames, frame-by-frame hand-drawn animation, and Canvas-based shadow-puppet animation rendered with Playwright. More visual and production styles are on the way, with a long-term roadmap of 99 pipelines.

## 关注更新

如果你正在寻找 AI 视频生成、自动剪辑、历史纪录片、纸雕动画、TTS 配音、字幕对齐或 ffmpeg 自动交付的实践，可以 Star 或 Watch 这个仓库。新管线完成后会直接进入项目。
