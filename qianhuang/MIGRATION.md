# qianhuang · 迁移与定版说明

## 来源

本管线由 `gangbi`（钢笔淡彩）派生：同一套 `engine.js` / `poses.js` / `world.js` 骨架，同一份共享渲染器
`vendor/runtime/render-legacy.mjs`，同一套「一页纸 + 镜头在纸上走」的页面契约。

派生时改掉的部分：

| 项 | gangbi | qianhuang |
|---|---|---|
| 颜料 | 水彩洗（multiply，透明、错位、留纸白） | 浓彩平涂 + 硬边色片灯（先 multiply 染色再 screen 补光芯） |
| 色版 | 一版 | 两版同页：A 冷版（钴蓝夜湖）／B 浓彩版（血红海），trace / splitPlate 出对比 |
| 分镜 | 一页连续游走 | 2–4 秒硬切，十镜，每镜自己的 `mv` 运镜 |
| 暗部 | 冷紫灰 | `#0b0b0d` 墨黑，永不用灰 |
| 字 | 墨字写在纸上 | 黄字黑边（片名 + 字幕都描边） |
| 人物 | 线稿 → 上色 | 物件级铅黄化：朱红/钴蓝衣、雨衣两道灯边、面具黄蓝侧光 |
| 声音 | 可由 `audio/` 外部配 | `voice/make_sfx.py` 纯 Python 合成音效床，逐动作对齐 |
| 交付 | 24 fps / −14 LUFS | 30 fps / −14.6 LUFS / CRF 20 / 峰值 −1.6 |

## 为什么另开一条管线而不是改 gangbi

`gangbi` 的语法立在水彩的「透明、错位、留白」上；铅黄要的正好相反——颜料是不透明的、边缘是硬的、
光是有形状的。两者共用引擎但美术规则冲突，混在一条管线里会让 `SKILL.md` 的语法自相矛盾。

## 定版参数（不要随手改）

- 页：5120×2880，地平线 `HZ = 1490`
- 一镜 2–4 秒；切点即音效点
- 色片灯至少两束、角度互切；主体圈 `destination-out` 擦除并随镜头搬运
- 百叶：multiply .4 → **color .62** → screen .2（省掉 color 会变紫）
- 片名 MaShanZheng 268 px / 黄 `#ffc70a` / 黑边 5.5%
- 字幕 LongCang 58 px / 黑晕 blur 10 / 黑边 4.6 px / 黄 `#ffcb0e`
- 音效权重 0.82（amix `normalize=0`）；whoosh 提前 0.30 s，shing +0.02 s，thud +0.01 s
- 响度 −14.6 LUFS、峰值 −1.6 dBFS、CRF 20 / preset slow

## 字体

`assets/fonts/fonts.json` 里已有 `mashanzheng` 与 `longcang` 两个键；`tools/sync_fonts.py` 的 `MANIFEST`
已登记本管线四个落点。渲染前跑一次 `--pipeline qianhuang` 即可，工程目录里的 `.ttf` 不入库。
