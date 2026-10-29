# piying 管线迁移说明

## 来源

- 仓库：`DaBaoAgent/yandi`
- 分支：`main`
- 提交：`f67e21d912d219e76cf3f683e112ef835bfefe24`
- 原路径：`yandi-video/render/piying`
- 当前入口：`piying/`

## 迁移范围

本模块保留 piying 的全部 33 个渲染脚本与核验数据，并补齐运行所需的 Node 配置、Playwright 捕获脚本、制作规范、支持工具、炎帝示例素材和共享背景。

```text
piying/
├── render/piying/       # 分镜、渲染页、捕获、QC、四查、音效与交付门禁
├── output/007_炎帝/     # 配音时间轴、Q版素材、实拍风食材、封面原图
├── output/006_女娲/     # bg10 共享背景与女娲主角
├── tools/               # 配音、ASR、读音和素材处理
├── references/          # 原始 yandi-video 完整规范
├── docs/                # 历史制作规则
├── package.json
└── qc.sh
```

## 路径适配

原脚本写死了 `D:/@kaifa/yandi/output`、旧机器 Chrome 路径和旧交付目录。迁移后已经改为：

- 素材路径相对 `piying/output/`
- 默认浏览器使用本机 Edge
- `PLAYWRIGHT_CHROME` 可覆盖浏览器路径
- 交付门禁和 `qc.sh` 使用 piying 模块内的相对路径

## 运行依赖

- Node.js 20+
- `playwright-core`，由 `npm ci` 安装
- Edge 或 Chrome
- ffmpeg 与 ffprobe
- Python 3.10+，仅支持工具需要

源仓库未提交 `output/007_炎帝/配音.wav`、`narration-chunks/` 和最终成片母版。已有 `配音.json`、分镜、页面与视觉素材可以完成渲染和门禁检查；重新生成音效或封装全片时，需要补入对应配音 WAV。
