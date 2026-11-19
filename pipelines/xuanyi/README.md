# xuanyi · 悬疑探秘管线

一帧是一套悬疑探秘的画法：冷面伪科学电视：4:3 蓝屏、编号症状、橡皮管贴纸演一遍，最后切到测试卡。 运行时已完整入库，`new` 复制 `template/` 与 `runtime/` 到工程 `lib/`，`render` 直接调本地 `runtime/render.mjs`，不再需要上游 checkout。

首个实例就是 `template/` 的起步工程（26 s / 1080p）。完整流程与已知坑见 [SKILL.md](SKILL.md)，风格规范见 [references/style.md](references/style.md)，定版参数见 [pipeline.json](pipeline.json)，来源与同步见 [MIGRATION.md](MIGRATION.md)。

## 快速开始

```bash
python scripts/xuanyi.py new projects/<名字> --title "片名"
python scripts/xuanyi.py check projects/<名字>
python scripts/xuanyi.py stills projects/<名字> --times 2,5,8
python scripts/xuanyi.py render projects/<名字> --scale 0.6667
```

## 环境

- Node 18+、ffmpeg / ffprobe 在 PATH
- Chrome 或 Edge（Windows 下脚本自动找；否则设 `CHROME_PATH`）
- Python 3.9+（只用标准库）

## 目录

| 目录 | 内容 |
|---|---|
| `runtime/` | 浏览器运行时 + 渲染器（BB-Video MIT） |
| `scripts/` | 建工程、自检、抽帧、渲染、QA、交付 |
| `references/` | 风格规范、分镜模板、验收清单 |
| `template/` | 起步工程（无音频与成片） |

## 风格要点

- **两套看法**：默认“症状清单”版；`look:'case'` 是案卷版（雾、划掉的猜测、证据板、红绳）。
- **冷面电视感**：4:3 蓝屏、管状暗角、台标、底部“虚构内容”爬行条，一个都不能少。
- **症状用贴纸演**：每个编号症状由一个橡皮管贴纸角色演出来，不要用真人或照片。
- **最后切测试卡**：信号中断是风格的收尾，不是事故。

## 许可

运行时代码来自 [BB-Video](https://github.com/BubbleBrainBB/BB-Video)（MIT），见 `runtime/LICENSE.BB-Video` 与 [CREDITS.md](CREDITS.md)。
