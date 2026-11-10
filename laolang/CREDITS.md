# CREDITS · laolang

## 运行时与风格代码

- **BB-Video** — `core.js`、`promo.js`、`goldenage.js`、`laolang.js`、`act.js`、`render.mjs`、`music.mjs`、`bgm.mjs`、`sound.mjs`、`lang.mjs`、`net.mjs`、`scores/*`
  - 来源：<https://github.com/BubbleBrainBB/BB-Video>，MIT
  - 许可原文：`runtime/LICENSE.BB-Video`
  - `goldenage.js` / `laolang.js` 使用 60 秒样片冻结版（关闭片门晃动、静态颗粒、去逐帧灰尘）

## 人物与动作

- **claude-animated-shorts** — `toon.ts` / `cast.ts` / `story.ts` 的 Canvas2D Pen、600×1000 设计空间、眨眼时钟与镜头/ cue 结构；`lao_body.ts` 在其上重画。
  - 来源：`BB-Video/work/claude-animated-shorts`，MIT，Copyright (c) 2026 Mr omi
- **laolang toon-cast** — `lao_body.ts`、`toon.ts`、`lao_cast.js`、`lao_cast_full.js`、`lao_poses.js`、`build_toon.py`、`lib/toon.js`
  - 原创绘制；不复制《老狼请客》的狼/熊/狐狸或任何原片角色

## 样片

- **玄奘 60 秒样片** — 旁白：用户提供的 `配音.wav`（现成配音，只截取/转 48 kHz，不重录不变声）；画面、人物、动作、绘景、音效均由本管线代码生成。
- 成片与人物设定图在作者本地归档，未随仓库提交：`出稿/018_玄奘/26_60秒样片_统一景别_稳定版/`、`08_人物设定/`、`10_全片人物造型/`、`11_动作库_24动作/`。

## 字体

- Ma Shan Zheng（标题毛笔）— SIL Open Font License
- Noto Serif SC（正文）— SIL Open Font License
- KaiTi / STKaiti / SimSun — 本机系统字体（渲染时回退使用）

## 原创声明

本管线学习的是 1980 年上海美术电影制片厂手绘动画的**工艺与画面语言**：平涂、勾线、装饰绘景、4:3 片门、民乐小乐队。**不复制**任何原片角色、造型、服装、道具、题字、片头片尾、笑点、镜头或旋律。真实人物不做漫画像；历史人物用壁画、剪影、背影或象征物来演。
