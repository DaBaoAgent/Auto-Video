# liaotian · 聊天叙事管线

一帧是一套聊天叙事的画法：故事发生在聊天软件里：气泡、输入中、语音条与引用卡，镜头推进一条时其余变暗。 运行时已完整入库，`new` 复制 `template/` 与 `runtime/` 到工程 `lib/`，`render` 直接调本地 `runtime/render.mjs`，不再需要上游 checkout。

首个实例就是 `template/` 的起步工程（12 s / 1080p）。完整流程与已知坑见 [SKILL.md](SKILL.md)，风格规范见 [references/style.md](references/style.md)，定版参数见 [pipeline.json](pipeline.json)，来源与同步见 [MIGRATION.md](MIGRATION.md)。

## 快速开始

```bash
python scripts/liaotian.py new projects/<名字> --title "片名"
python scripts/liaotian.py check projects/<名字>
python scripts/liaotian.py stills projects/<名字> --times 2,5,8
python scripts/liaotian.py render projects/<名字> --scale 0.6667
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

- **一屏一个聊天窗口**：`C.app()` 建窗口，`A.thread()` 建会话；横屏左侧留一条 `C.aside()` 放一句话/诗/年份。
- **消息是节拍单位**：`T.msg(b(n), who, text)` 落一条，`A.type()` 只做“正在输入”，不要用打字机逐字模拟每条消息。
- **推进即强调**：`C.push()` 推进某条消息时其余变暗；引用卡 `kind:'quote'` 必须带 `source`。
- **手机竖屏单独排**：9:16 时聊天窗满宽，aside 收进顶栏或直接删掉。

## 许可

运行时代码来自 [BB-Video](https://github.com/BubbleBrainBB/BB-Video)（MIT），见 `runtime/LICENSE.BB-Video` 与 [CREDITS.md](CREDITS.md)。
