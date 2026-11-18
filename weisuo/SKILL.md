---
name: weisuo
description: 孟菲斯微缩（Memphis Diorama）管线：一座 2D 形状搭起来的 3D 微缩小镇，一年四季在框里转，人在一格一格走。用于这一类题材的短片，口播可有可无。当用户说「孟菲斯微缩」「Memphis Diorama」时用。
---

# weisuo · 孟菲斯微缩

一条片子 = 一座 2D 形状搭起来的 3D 微缩小镇，一年四季在框里转，人在一格一格走。

示例工程：`projects/012_pomelo/`（《柚子镇四季》Four Seasons in Pomelo Town，45.0 s）。

## 一句话记住

- **paper**：框外永远是暖白 #FFFCF6，那里不画任何东西
- **outline**：法线 + 深度的后处理描边，1080p 下约 2 px 深靛 #25214A；光锥、贴片、粒子（雨雪花瓣烟）与细枝不描边
- **palette**：5–7 个饱和色 + 2–3 个粉彩；示例：黄 #FFD234 / 粉 #FF7EB3 / 天蓝 #5CC8FF / 薄荷 #5EDFB0 / 淡紫 #B9A0FF / 桃 #FF9C6B / 钴蓝 #2F5BFF / 珊瑚 #FF5A5F / 绿 #2FCB7A；墨 #25214A 只给轮廓、字、轮胎与窗框
- **night**：夜是往紫的亮度移，不是整体压暗（黄不会变橄榄）；所有灯同一个暖黄 #FFD36E；黄昏加一层橙粉 #FF9E7A 再进夜
- **motion**：60 fps，每一帧都在动；只有画面的颗粒在 12 fps 上 boil
- **type**：框下三行居中：标题中英 600 / 约 25 px 深色，第二行 400 / 约 18 px 灰，第三行等宽 15 px 浅灰（时间、节气、地点、坐标）；有旁白时是「一行中文 + 一行英文」成对变化，另一行空位不顶上来
- **frame**：画面约 1520×744 px，略高于中心；字在框下，永不压主体

## 入口

在仓库根执行，单一入口 `weisuo/scripts/weisuo.py`：

```bash
python tools/sync_fonts.py --fetch && python tools/sync_fonts.py --pipeline weisuo
python weisuo/scripts/weisuo.py probe  012_pomelo
python weisuo/scripts/weisuo.py stills 012_pomelo --times 3,12,28
python weisuo/scripts/weisuo.py render 012_pomelo
python weisuo/scripts/weisuo.py mux    012_pomelo
python weisuo/scripts/weisuo.py qa     012_pomelo
python weisuo/scripts/weisuo.py new    013_xxx
```

渲染交给共享运行时 `vendor/runtime/render-legacy.mjs`（页面契约 `window.READY` / `window.DUR` / `window.render(t)`）。
`subs.json` 只是可选的 SRT 源；这条线的字幕是 JS 现场排字，没有 `subs.json` 时 `srt` 会直接说明。

## 工程怎么改

| 文件 | 管什么 |
|---|---|
| `index.html` | importmap 指 ./lib/three.module.js；两个 canvas（#gl 离屏、#c 上屏） |
| `main.js` | 时间轴（DUR 45）、一年的四段、镜头、字幕三行、TEXTS |
| `memphis.js` | 微缩世界的搭建与材质：Diorama、setNight/setLamp/setWave/setZone/setDusk/setSeason、flat/mesh/box |
| `people.js` | 小人（person/walk/limb），12 fps 步进 |
| `fonts/fonts.css` | SC（思源黑体子集）、IT（Inter Tight）、PM（IBM Plex Mono） |

## 画面语法（选你要的那几条）

四季换季：同一座镇子换一层色与光 / 微缩景深：移轴式的浅景深让人变小 / 小人 12 fps 走，相机 60 fps 滑 / 夜间整镇换灯泡 / 下雨/落雪/花瓣翻页。

转场只用这套材料自己的手段：不用叠化，不做常规剪辑。

## 已知坑

1. 细的全是轮廓线的物件会读成一团墨迹——细枝、光锥、粒子一律不描边
2. 夜压暗会把黄变橄榄——用往紫的亮度移
3. 三行字的空行不要被下面的行顶上来，位置是固定三格
4. 小人 60 fps 溜冰要读成抖——人物只走 12 fps
5. three 的 importmap 指错路径整页白屏——工程内 lib/three.module.js

## 验收

- [ ] `stills` 抽 5–8 帧，材料质感与上面「一句话记住」的每条都对得上
- [ ] 步进与镜头分离：该走 12/8 fps 的只走那么快，相机不跟着步进
- [ ] 字幕/题字在材料上，不是浮层深色框
- [ ] `render` 帧数 = `DUR × fps`；`qa` 六项全绿（有音轨时）
- [ ] `python tools/validate.py` 这条管线 0 error
