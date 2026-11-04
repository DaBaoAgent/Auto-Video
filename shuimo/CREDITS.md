# CREDITS · shuimo

## 风格来源

### kalpa-shan（本管线自带）

`projects/*/js/kalpa-shan.js` 是本项目独立实现的 约 15KB（gzip ≈ 5KB）、零依赖生成式 SVG 山水。
语法灵感来自 **LingDong-/shan-shui-inf**（MIT，https://github.com/LingDong-/shan-shui-inf）：
用噪声生成山脊、树、雾、水面，输出矢量山水。本管线未复制其代码，只借鉴了
「程序化山水」这一思路；所有函数、preset、肌理参数均为重写。

### InkField（墨扩散参考）

**ileivoivm/inkField**（https://github.com/ileivoivm/inkField）是 WebGL + p5.js 的
数字水墨系统，源码未公开，只公开了技术文档。本管线参考了其公开的墨扩散语法
（MIX / WET / FLYING 等扩散模式、墨在纸上停留的“lingering”感），
用 Canvas2D 的确定性遮罩与湿边实现类似观感，**没有使用其代码或资源**。

## 字体

| 字体 | 用途 | 许可 |
|---|---|---|
| LongCang-Regular | 题名、竖排地名 | SIL Open Font License（Google Fonts） |
| KaiTi | 字幕、注释 | 本机 Windows 字体，仅本地渲染使用，不随工程分发 |

## 依赖

- Node.js + puppeteer-core（渲染；node_modules 目录联接自 `vendor/mg-styles-15`）
- ffmpeg / ffprobe
- Microsoft Edge（headless）
- Python 3.11 标准库（音频合成/混音，无需 numpy）

## 管线代码

`shuimo/` 下的编排、渲染、配乐、混音脚本为本项目原创，可随项目分发。
