---
name: fushihui
description: 浮世绘（Ukiyo-e）管线：一张木版画：墨线、几个色块各自错开半格印上去，纸在吃墨。用于这一类题材的短片，口播可有可无。当用户说「浮世绘」「Ukiyo-e」时用。
---

# fushihui · 浮世绘

一条片子 = 一张木版画：墨线、几个色块各自错开半格印上去，纸在吃墨。

示例工程：`projects/012_toward/`（《向山》Toward the Mountain，44.0 s）。

## 一句话记住

- **blocks**：每个色组画进各自的离屏画布并缓存（主墨线 / 蓝 / 绿·次色 / 红·人物），合成时每块给一个固定的小错版偏移（1.5–2.5 px，方向各不相同）
- **line**：主墨线 2.4–3 px；大轮廓是变宽的填充笔触、两端收尖、低频宽度抖动 ±20–35%；远景用灰墨线或不画
- **bokashi**：渐变逐像素生成，上缘按列被低频噪声带偏移 ±20–30 px；绝不用 fillRect 拼条（会有竖缝）
- **seal**：朱印从红色里挖出字，边缘有缺口感
- **figure**：人物在景里很小（整幅约 80–130 px），平涂、剪影清楚，脸几笔
- **motion**：人物与自然 8 fps 步进；雨与急水 12 fps；相机 24 fps 走一拍一帧（相机步进会抖）
- **reveal**：印刷揭示：每块约 0.3 s 以对角刮擦出现，边缘带噪，落位时滑 5–6 px 进对位
- **type**：字幕 = 横向题签：米色纸条 + 粗细墨框 + 左侧小朱印，Shippori Mincho 500 墨色居中靠下；占底部约 150 px，地面线与人物要在这之上；保持 ≥ max(1.8 s, 语音+0.6 s)

## 入口

在仓库根执行，单一入口 `fushihui/scripts/fushihui.py`：

```bash
python tools/sync_fonts.py --fetch && python tools/sync_fonts.py --pipeline fushihui
python fushihui/scripts/fushihui.py probe  012_toward
python fushihui/scripts/fushihui.py stills 012_toward --times 3,12,28
python fushihui/scripts/fushihui.py render 012_toward
python fushihui/scripts/fushihui.py mux    012_toward
python fushihui/scripts/fushihui.py qa     012_toward
python fushihui/scripts/fushihui.py new    013_xxx
```

渲染交给共享运行时 `vendor/runtime/render-legacy.mjs`（页面契约 `window.READY` / `window.DUR` / `window.render(t)`）。
`subs.json` 只是可选的 SRT 源；这条线的字幕是 JS 现场排字，没有 `subs.json` 时 `srt` 会直接说明。

## 工程怎么改

| 文件 | 管什么 |
|---|---|
| `index.html` | module 入口 |
| `main.js` | 时间轴与合成：分色块、错版、印刷揭示、字幕题签 |
| `print.js` | 印刷层：分块画布、错版偏移、bokashi 渐变、线、印章 |
| `views.js` | 每一景（画面构图） |
| `traveler.js` | 旅人 |
| `nature.js` | 山、松、石、雨、雁 |
| `wave.js` | 浪与爪 |
| `story.js` | DUR 44 与镜头表 T / REVEAL_DUR |
| `lib.js` | 数学工具（原库 core/lib.js 的工程内副本） |

## 画面语法（选你要的那几条）

分色套印：颜色一块块错开半格印上去 / 印刷揭示带刮擦 / 朱印按下去 / 远景只用灰墨线 / 浪的爪。

转场只用这套材料自己的手段：不用叠化，不做常规剪辑。

## 画幅：横屏与竖屏（2026-11-19 起）

管线不再写死 16:9。`index.html` 的 canvas 按视口尺寸建，`print.js` 里 `W/H` 从 canvas 读、`FR`（墨框）按 `min(W,H)` 自动算边距：

- 竖屏：`node vendor/runtime/render-legacy.mjs pipelines/fushihui/projects/<工程> --width 1080 --height 1920 --fps 24 --out .../out/video-9x16.mp4`
- 横屏：同一条命令把 `--width/--height` 换成 1920/1080 即可
- 字体缺失时不再卡死：`main.js` 的 `document.fonts.load` 已被 2.5 s 超时兜住，缺字库就回落系统衬线

**画幅只解决画布，构图要自己重排**：竖屏把天空往上推、把题签移到右上竖排（`cartouche`）、地面线放到 1500 左右、人物按整幅 1/3 高的尺度画；横屏仍按「人物 80–130 px」的老规矩。竖屏参考工程：`projects/ep24v3_ukiyoe_portrait/`（EP24《门口的小摊》，1080×1920，10 s，人物带 IK 手臂会取杯）。
## 已知坑

1. bokashi 用 fillRect 拼会出竖缝——逐像素生成
2. 错版偏移给太大就成重影，1.5–2.5 px 且每块方向不同
3. 人物画大了就不是浮世绘——整幅 80–130 px
4. 相机按人物步进会抖——相机 24 fps 一拍一帧
5. 纯噪声的揭示像霉点——要带方向的对角刮擦

## 验收

- [ ] `stills` 抽 5–8 帧，材料质感与上面「一句话记住」的每条都对得上
- [ ] 步进与镜头分离：该走 12/8 fps 的只走那么快，相机不跟着步进
- [ ] 字幕/题字在材料上，不是浮层深色框
- [ ] `render` 帧数 = `DUR × fps`；`qa` 六项全绿（有音轨时）
- [ ] `python tools/validate.py` 这条管线 0 error

