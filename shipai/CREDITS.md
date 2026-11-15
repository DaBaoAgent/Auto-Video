# 许可与来源

## 本管线代码

`shipai/scripts/` 下四个脚本为本项目原创，随仓库以 MIT 发布（见根目录 `LICENSE`）。

## 第三方

| 组件 | 用途 | 许可 |
|---|---|---|
| [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) | 素材拼装、字幕外的一切后期、成片输出（`cli.py`） | MIT |
| [faster-whisper](https://github.com/SYSTRAN/faster-whisper) | 语音转写与词级时间戳 | MIT |
| [Pixabay](https://pixabay.com/) 视频 API | 实拍素材检索与下载 | Pixabay License（免费商用、无需署名，禁止转售原始素材） |
| [Pillow](https://python-pillow.org/) | 字幕 PNG 渲染 | MIT-CMU |
| ffmpeg / ffprobe | 解码、切段、overlay、校验 | LGPL / GPL（视构建） |

## 字体

`MicrosoftYaHeiBold.ttc`（微软雅黑粗体）随 Windows 提供，本管线只在本机调用，**不分发字体文件**。迁移到别的机器时用 `--font` 指定本机可用的中文字体（思源黑体 / 苹方等）。

## 素材

`projects/004_玛雅巨人文明/` 的素材来自 Pixabay（id 见 `materials.json`）：危地马拉丛林中的玛雅金字塔、特奥蒂瓦坎太阳金字塔与石构细节。素材文件不入库，只保留 id 与顺序，便于按许可重新获取。
