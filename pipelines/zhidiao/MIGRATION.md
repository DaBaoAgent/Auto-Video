# zhidiao 管线迁移说明

## 来源

- 仓库：`DaBaoAgent/tushuo`
- 分支：`master`
- 提交：`608a58257c581674b546082402d6d8ff3d47fd3d`
- 原路径：`.claude/skills/zhidiao`
- 当前路径：`zhidiao/`

## 目录

```text
zhidiao/
├── SKILL.md
├── references/
├── scripts/                 # 配音对齐、组装、审计、抽帧
├── tools/
│   ├── dabao_batch_tts.py
│   ├── audit_pronunciation.py
│   └── zhidiao/             # 分镜素材、封面、交付打包
├── docs/
│   └── 读音规范.md
├── content/                 # 新片运行时创建
├── films/                   # 新片运行时创建
├── output/                  # 运行中间件，不入库
└── out/                     # 交付目录
```

## 路径适配

原仓库的技能位于 `.claude/skills/zhidiao`，部分脚本按旧目录深度定位仓库根。
迁移后统一以 `zhidiao/` 为管线根：

- `scripts/zhidiao_assemble.py`：项目根改为 `parents[1]`
- `scripts/zhidiao_make_audio.py`：去掉 `D:/@kaifa/tushuo` 硬编码，改为当前管线根
- `tools/` 保持原来的相对层级，其根目录自动解析为 `zhidiao/`

## 外部依赖

以下内容在原仓库被 `.gitignore` 排除，因此没有随公开仓库复制：

- `vendor/gpt-sovits/`：dabao 音色服务、模型与运行时
- `vendor/faster-whisper-small/`：词级转写模型
- `lib/`、`vendor/gsap.min.js`、字体等单片 composition 资源
- HyperFrames 渲染工具

新片开始前，应按 `SKILL.md` 和 `references/pipeline.md` 准备这些依赖。
