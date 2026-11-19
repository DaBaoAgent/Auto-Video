---
name: keli
description: 扁平颗粒插画（Flat Grain Illustration）：两种专色印在暖纸上，体积与光全靠点状颗粒；一条地平线把时代一段段长出来。 本地封装 开源风格包 styles/grain 运行时（runtime/ + template/ + render.mjs），new 建工程、check/stills 验画面、render 出片，不再依赖上游 checkout。
---

# keli：扁平颗粒插画（Flat Grain Illustration）

| 项 | 值 |
| --- | --- |
| 工位 | 05 平面图形 |
| 上游风格 | 开源风格包 `skills/开源风格包/styles/grain`（运行时已入库） |
| 演示片 | 《人类如何照亮夜晚》92.6 s（站点暂用上游成片） |
| 画幅 | 16:9 |
| 入口 | `pipelines/keli/scripts/keli.py` |

## 这条管线交什么

两种专色印在暖纸上，体积与光全靠点状颗粒；一条地平线把时代一段段长出来。

这是一条 **promo 型**风格：默认不配旁白，信息写在画面上；配乐与音效由 `score.js` / `sound.js` 在页面里合成。画面语言、可用组件与禁止事项见 [`references/style.md`](references/style.md)，那是上游 `STYLE.md` 的原文。

## 入口命令

```bash
# 1. 建工程（复制 template + runtime 到工程的 lib/）
python pipelines/keli/scripts/keli.py new projects/keli_demo --title "片名"

# 2. 改 brief.md / storyboard.md / index.html / score.js / sound.js

# 3. 自检与抽帧（--check 0 error 才算过）
python pipelines/keli/scripts/keli.py check projects/keli_demo
python pipelines/keli/scripts/keli.py stills projects/keli_demo --times 2,5,8

# 4. 出片（样片可 720p）
python pipelines/keli/scripts/keli.py render projects/keli_demo --scale 0.6667

# 5. 交付
python pipelines/keli/scripts/keli.py deliver projects/keli_demo --chugao 出稿/keli_片名 --name "keli_片名_1080p"
```

## 工程结构

| 路径 | 内容 |
| --- | --- |
| `runtime/` | 共享运行时 `core.js` / `promo.js` + 风格运行时 `grain.js` + 渲染器 `render.mjs`；MIT，见 `runtime/LICENSE` |
| `template/` | 起步工程：`index.html`、`score.js`、`sound.js`、`brief.md`、`assets/manifest.js` |
| `references/` | `style.md`（上游风格规范原文）、`storyboard.md`、`qa.md` |
| `scripts/` | 本管线编排：new / check / stills / render / probe / qa / deliver |

## 写法要点

- **先读 `references/style.md` 再写画面**：上游明确要求选风格后先读 STYLE.md，组件名和镜头语法都在里面。
- **每个屏幕文字都能回到 `brief.md`**：`--check` 会核对画面文字与事实表，没写进 brief 的字会被拦。
- **promo 靠节拍**：用 `F.beat(n)` 排事件，不要用秒数硬写；镜头推进、字卡、音效都卡在同一张节奏表上。
- **颜色/字体从 pipeline.json 的定版参数来**：不要在页面里随手改主题色；需要变体时在 `PROMO.compose({ theme })` 里显式声明。
- **`--check` 报 error 不许出片**：先补 brief / 补信息画面，再 render。

## 许可

运行时代码来自 [开源风格包](https://github.com/开源风格包)（MIT），许可见 `runtime/LICENSE`；风格规范与起步工程整理自同一仓库，见 [CREDITS.md](CREDITS.md) 与 [MIGRATION.md](MIGRATION.md)。
