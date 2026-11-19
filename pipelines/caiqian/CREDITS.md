# CREDITS · caiqian 彩铅科普插画

画面全部由代码绘制：三维几何、彩铅排线、纸纹、手写标签、字幕、片尾，没有任何 AI 生图、贴图或外部模型。

## 引擎

- **three.js** — MIT License，`projects/*/lib/three.module.js` 随工程入库
  https://github.com/mrdoob/three.js

## 字体

- **LXGW WenKai 霞鹜文楷** — SIL Open Font License 1.1，作者 LXGW WenKai Project Authors（基于 Fontworks 的 Klee One）
  https://github.com/lxgw/LxgwWenKai
  固定版本 v1.245.1：
  `https://raw.githubusercontent.com/lxgw/LxgwWenKai/v1.245.1/fonts/TTF/LXGWWenKai-Regular.ttf`
  原始 TTF（15.2 MB）不入库，由 `projects/*/tools/make_font.py` 取用并子集化为 `fonts/LXGWWenKai-subset.ttf`。
  子集用于网页交付，属 OFL 允许的范围（保留字体名称不变）。

## 技法

- 四张 G-buffer（albedo+id / light+depth+normal / 排线方向 / 锚点+露出时间）+ 后处理排线，
  锚定坐标防漂移（笔画黏在物体上，只有轮廓按 2 帧一换的节奏抖），纸齿与颜料阈值合成。
  这套做法来自 开源风格库 的 `styles/colored-pencil`，本仓库迁入并固化为管线。

## 示例配音

`projects/029_jia_xueyu/voice/voice.wav` 由上游 Kokoro TTS（kokoro-onnx，Apache-2.0，`bf_emma`）生成，
仅用于本地验证，不入库。

## 事实

`projects/*/FACTS.md` 记录每句口播背后的数字与出处。
