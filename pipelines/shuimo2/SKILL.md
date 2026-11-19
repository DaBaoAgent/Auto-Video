---
name: shuimo2
description: 中国水墨（Chinese Ink Wash）管线：一张宣纸：墨分五色，一笔下去有骨有肉，朱砂只在印章和一个点上。用于这一类题材的短片，口播可有可无。当用户说「中国水墨」「Chinese Ink Wash」时用。
---

# shuimo2 · 中国水墨

一条片子 = 一张宣纸：墨分五色，一笔下去有骨有肉，朱砂只在印章和一个点上。

示例工程：`projects/012_river/`（《剑客与河》The Swordsman and the River，48.0 s）。

## 一句话记住

- **paper**：宣纸在合成器里程序化生成（不是贴图）：暖米 #F2ECDE、云状斑驳、长纤维、纸浆点、缩小后颗粒会退掉（不然闪）、轻晕影；锚在世界里
- **ink**：墨分五色（TONE）；一笔有骨有肉：中锋实、侧锋飞白、边缘渗化；泼墨与晕染分开
- **colour**：只有一支朱砂（约 #B02E22）给印章与故事里最多一处小点缀（主角带的东西）；绝不整片红、不用红字
- **motion**：人物 12 fps 拍二步进；位置、相机、晕、涟漪、飞溅 24 fps 一拍一帧
- **type**：题字用毛笔体（马善政 / 志莽行），正文衬线用 Cormorant；落款与印章在画内，不做浮层字幕框

## 入口

在仓库根执行，单一入口 `shuimo2/scripts/shuimo2.py`：

```bash
python tools/sync_fonts.py --fetch && python tools/sync_fonts.py --pipeline shuimo2
python shuimo2/scripts/shuimo2.py probe  012_river
python shuimo2/scripts/shuimo2.py stills 012_river --times 3,12,28
python shuimo2/scripts/shuimo2.py render 012_river
python shuimo2/scripts/shuimo2.py mux    012_river
python shuimo2/scripts/shuimo2.py qa     012_river
python shuimo2/scripts/shuimo2.py new    013_xxx
```

渲染交给共享运行时 `vendor/runtime/render-legacy.mjs`（页面契约 `window.READY` / `window.DUR` / `window.render(t)`）。
`subs.json` 只是可选的 SRT 源；这条线的字幕是 JS 现场排字，没有 `subs.json` 时 `srt` 会直接说明。

## 工程怎么改

| 文件 | 管什么 |
|---|---|
| `index.html` | module 入口 |
| `main.js` | 入口：挂 DUR / render / READY |
| `story.js` | DUR 48、时间表 T |
| `ink.js` | 墨：mk/draw/blot/mass、TONE（墨分五色） |
| `hero.js` | 主角（骨架 + 姿势 POSE / mixPose） |
| `land.js` | 山、水纹、芦苇 |
| `wave.js` | 浪 |
| `glyph.js` | 笔痕与飞白（shuiStrokes / cutStroke / tipAt） |
| `climax.js` | 高潮段（泼墨） |
| `cross.js` | 渡河段 |
| `face.js` | 脸的几笔 |
| `frames.js` | 画幅与装裱 |
| `passage.js` | 过场 |
| `seal.js` | 印章（朱砂） |
| `world.js` | 世界 |
| `comp.js` | 合成器（宣纸 + 墨） |
| `lib.js` | 数学工具（原库 core/lib.js 的工程内副本） |

## 画面语法（选你要的那几条）

一笔带过整片水 / 泼墨当高潮 / 飞白当风 / 留白当雾 / 印章收尾。

转场只用这套材料自己的手段：不用叠化，不做常规剪辑。

## 已知坑

1. 宣纸颗粒不锚世界会随镜头闪
2. 整片红会毁掉朱砂的唯一性
3. 人物与相机同步步进会抖，分离 12/24
4. 渗化边界要有噪声，否则像矢量描边
5. 字用黑体就出戏——毛笔体 + 衬线

## 验收

- [ ] `stills` 抽 5–8 帧，材料质感与上面「一句话记住」的每条都对得上
- [ ] 步进与镜头分离：该走 12/8 fps 的只走那么快，相机不跟着步进
- [ ] 字幕/题字在材料上，不是浮层深色框
- [ ] `render` 帧数 = `DUR × fps`；`qa` 六项全绿（有音轨时）
- [ ] `python tools/validate.py` 这条管线 0 error
