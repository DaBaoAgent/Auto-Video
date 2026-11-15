# CREDITS

## 上游风格

- **mg-styles-15** — https://github.com/Vincentwei1021/mg-styles-15
  - 许可：MIT
  - 使用部分：`demos/10-synthwave` 的风格语法与 VHS 后处理思路；`assets/fonts/fonts.css` 的字体栈参考。
  - 本管线为独立重写（Three.js 场景 + Canvas 内容层 + 纯标准库配乐），未直接复制上游素材。
  - 二次分发请保留上游版权与 MIT 许可文本。

## 字体

- **Alibaba PuHuiTi 3.0 85-Bold** — 阿里巴巴普惠体，免费商用。
  文件：`projects/009_prion30/assets/font/AlibabaPuHuiTi-3-85-Bold.ttf`。
- 渲染时另用系统字体：`Consolas`（OSD/数据）、`Impact`（故障条）、`Segoe Script`（备用）。

## 素材

- 全部画面元素由代码程序化生成；无外部图片、视频、音频素材。
- 配乐与音效由 `scripts/make_score.py` 合成；人声来自 `出稿/009_朊病毒同类相食/配音.wav`。
- 片中出现的品牌/产品名（`MYTHOS.EXE`、`MYTH_DB`、`BSE // SURVEILLANCE`）均为虚构界面文案，
  不使用真实商标。

## 参考文档

- `mg-styles-15/prompts-zh/10-synthwave.md` —— 风格提示词与评分标准
- `mg-styles-15/rubric.md` —— 上游评审量规
- `references/publish.md` —— AutoJY 成片交付规范
