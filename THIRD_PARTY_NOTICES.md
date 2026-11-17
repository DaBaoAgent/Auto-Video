# 第三方声明

本仓库的**代码**是 MIT。下面这些是代码之外的东西——字体、样片、运行时依赖——各自归属不同，用在别处时请注意。

## 字体

字体**不进仓库**：`assets/fonts/fonts.json` 记着官方下载地址与 SHA256，第一次用跑 `python tools/sync_fonts.py --fetch` 下载；
下载物与复制到工程目录的副本都在 `.gitignore` 里。

| 字体 | 文件 | 授权 | 用途 |
|---|---|---|---|
| Noto Serif SC | `NotoSerifSC.ttf` | SIL Open Font License 1.1 | 正文、标题（`jianying` / `lishi` 等） |
| 阿里巴巴普惠体 3.0 85 Bold | `AlibabaPuHuiTi-3-85-Bold.ttf` | 阿里巴巴普惠体免费商用授权 | 大字标题（`dengju` / `shiliang` / `xianshiqi` / `xuni`） |
| 龙藏体 Long Cang | `LongCang-Regular.ttf` | SIL Open Font License 1.1 | 手写感旁注（`shouhui` / `shuimo`） |
| 霞鹜漫黑 LXGW Marker Gothic | `LXGWMarkerGothic-Regular.ttf` | SIL Open Font License 1.1 | 马克笔标注 |
| 霞鹜文楷 LXGW WenKai | `LXGWWenKai-Regular.ttf` | SIL Open Font License 1.1 | 楷体的 OFL 替代（见下） |

### 关于楷体（KaiTi）

`KaiTi` 是**微软 Windows 自带字体**，不在 MIT 也不可再分发，所以：

- **仓库里没有 `KaiTi.ttf`**，历史上那 4 份副本已经删掉；
- 渲染前 `tools/sync_fonts.py` 会从本机系统字体（Windows `%WINDIR%/Fonts/simkai.ttf`、macOS `STKaiti`、Linux `ukai`）复制一份到工程目录，
  本机看起来和以前完全一致，但这份字体**不会被提交**；
- 机器上没有楷体时（比如 Linux CI、Docker 陌生人），自动降级到 `LXGWWenKai-Regular.ttf`（OFL），字形是文楷而不是楷体；
- 想指定别的楷体文件：`BV_FONT_KAI=/path/to/your-kai.ttf python tools/sync_fonts.py`。

## 样片

`site/media/` 下的 88 条 mp4 / jpg 与 `teaser.gif` 都是本仓库管线渲染的产物（配音来自本地克隆音色的自用授权，不包含第三方素材）。

## 运行时依赖

- Chrome / Edge / Chromium：各自许可，仓库不分发；
- ffmpeg：LGPL/GPL，仓库不分发；
- `vendor/runtime/render.mjs` 依赖 playwright-core；`render-cdp.mjs` 依赖 puppeteer-core；`render-legacy.mjs` 依赖 playwright-core。均为 Apache-2.0，装在各工程或全局 `node_modules` 里，不入库。

## 模板库运行时

`vendor/runtime/` 里的 `core.js`、`promo.js`、`render.mjs`、`music.mjs`、`sound.mjs`、`bgm.mjs`、`lang.mjs`、
`net.mjs`、`autoscene.js`、`scores/` 以及 10 条派生管线里的同名副本，来自一个 MIT 授权的上游模板项目
（版权人 Dylan Deng，2026）。完整许可原文随每个副本一起放在 `runtime/LICENSE-upstream`，
MIT 要求保留的版权声明与许可条款原样未改。

本仓库**不在代码、目录、文档和管线元数据里使用上游项目名字**：运行时目录叫 `vendor/runtime/`，
CDP 渲染器叫 `render-cdp.mjs`，样式包叫 `styles/`，环境变量统一 `AV_*` 前缀。这条声明的用途只有一个——
按许可证要求交代出处。

## 样品工程里的素材

`*/projects/*/` 下的人声、音乐、图片，都是生产时用本地 TTS / 自绘 / 自己拍的素材，随工程一起入库只是为了让样片可复现；改用其他用途前请自行确认来源。
