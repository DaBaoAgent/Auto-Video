# shouhui 管线迁移说明

## 来源

- 仓库：`DaBaoAgent/autojy`
- 分支：`main`
- 提交：`93607a92ae087ba10998db8b6d4bc80cd44980cc`
- 原路径：`shouhui/`
- 当前路径：`shouhui/`

## 迁移内容

```text
shouhui/
├── README.md
├── SKILL.md
├── scripts/
│   ├── shouhui.py      # new / audio / stills / render / qa / probe / all
│   ├── render.mjs      # 浏览器逐帧渲染
│   └── sfx_build.py    # 程序化音效 cue
└── projects/
    └── 012_shangzhouwang/
        ├── film.json
        ├── js/
        ├── assets/
        ├── audio/
        └── out/
```

本次迁移保留源仓库的全部 76 个文件，包括商纣王示例工程、角色设计、字体、音频和 10 秒样片，共约 124 MB。

## 外部依赖

渲染器从 `vendor/mg-styles-15` 读取引擎和 Node 依赖。源仓库没有提交这个目录。

```powershell
git clone --depth 1 https://github.com/Vincentwei1021/mg-styles-15.git vendor/mg-styles-15
Set-Location vendor/mg-styles-15
npm install --no-audit --no-fund puppeteer-core@25.12.0 simplex-noise@4.0.3 opentype.js@2.0.0
Set-Location ../..
New-Item -ItemType Junction -Path 'shouhui/node_modules' -Target 'vendor/mg-styles-15/node_modules'
```

示例工程还需要单独的配音源和 BGM 才能重跑 `audio`。`film.json` 中的 `出稿/012_商纣王/配音.wav` 与 `D:/@kaifa/BGM/悬疑/...mp3` 属于源仓库外部素材；已生成的旁白、混音和样片仍在示例工程内，可以直接用于 `probe`、静帧或重新渲染检查。

## 运行环境

- Python 3.10+
- Node.js 18+
- Edge
- ffmpeg 与 ffprobe

引擎和纸本素材来自 `mg-styles-15`，按 MIT 许可使用；示例字体按 OFL 许可使用。
