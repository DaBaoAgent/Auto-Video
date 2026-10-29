# jianying 管线迁移说明

## 来源

- 仓库：`DaBaoAgent/autojy`
- 分支：`main`
- 提交：`93607a92ae087ba10998db8b6d4bc80cd44980cc`
- 当前路径：`jianying/`

## 迁移内容

```text
jianying/
├── SKILL.md
├── scripts/       # 编排、配音对齐、分镜、音轨、字幕、渲染、封装、质检
├── cards/         # 12 张镜头语法卡
├── references/    # 流程、镜头语法、主题、声音与验收规则
└── template/      # Remotion 工程模板、字体和示例音频
```

源仓库的 `jianying` 入口位于仓库根部。迁移时把根部的 `SKILL.md`、`scripts/`、`cards/`、`references/` 和 `template/` 放进独立目录。

脚本仍然使用 `PKG = Path(__file__).resolve().parent.parent`，因此复制后会自动把 `jianying/` 识别为管线根。新建选题会进入 `jianying/projects/<slug>/`，初始化工程时会复制 `jianying/template/`。

## 运行依赖

- Python 3.11+
- ffmpeg 与 ffprobe
- Node.js 18+
- Edge 或 Chrome
- numpy
- 逐行配音需要 GPT-SoVITS、requests、soundfile 和 dabao 音色预设
- 旧版 `sfx` 路径额外依赖 scipy；推荐使用 `audio` 路径，它只需要 numpy 和标准库

源仓库的示例项目和成片没有迁移。它们属于运行数据，可在 `jianying/projects/` 中通过新选题流程重新建立。
