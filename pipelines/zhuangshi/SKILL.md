---
name: zhuangshi
description: 装饰艺术（Art Deco）管线：金线、漆面黑、阶梯边：酒店大堂在午夜亮起来，一切都从中心展开。用于这一类题材的短片，口播可有可无。当用户说「装饰艺术」「Art Deco」时用。
---

# zhuangshi · 装饰艺术

一条片子 = 金线、漆面黑、阶梯边：酒店大堂在午夜亮起来，一切都从中心展开。

示例工程：`projects/012_starlight/`（《星光酒店午夜》Midnight at the Starlight Hotel，39.0 s）。

## 一句话记住

- **stroke**：签名笔画 gline：比线宽约 1.6 px 的深色刻线 + 金色渐变线 + 顶上一根细高光；可选发光与平行双线；没有任何东西是黑色卡通轮廓
- **palette**：漆面近黑、金渐变、象牙字、深绿/酒红点缀；金色是渐变不是单色，且越亮的地方金越白
- **bulbs**：灯泡招牌沿字形骨架排：用 crossing number 判节点、链端 14 px 内焊接，否则 G/S/R 在曲线上会断
- **motion**：人物 12 fps 拍二步进；相机、光、灯泡、金色描线、光泽 24 fps 一拍一帧
- **type**：标题、字幕、转场是一个系统：都从中心展开。字幕卡是漆面黑条约 88% + 阶梯端 + 双金线，Josefin Sans SemiBold 40–42 px 象牙色，可按声音加小喇叭图标；保持 ≥ max(1.8 s, 语音+0.6 s)
- **camera**：相机卡片化：镜头在装饰卡片上滑与翻，不做常规剪辑

## 入口

在仓库根执行，单一入口 `zhuangshi/scripts/zhuangshi.py`：

```bash
python tools/sync_fonts.py --fetch && python tools/sync_fonts.py --pipeline zhuangshi
python zhuangshi/scripts/zhuangshi.py probe  012_starlight
python zhuangshi/scripts/zhuangshi.py stills 012_starlight --times 3,12,28
python zhuangshi/scripts/zhuangshi.py render 012_starlight
python zhuangshi/scripts/zhuangshi.py mux    012_starlight
python zhuangshi/scripts/zhuangshi.py qa     012_starlight
python zhuangshi/scripts/zhuangshi.py new    013_xxx
```

渲染交给共享运行时 `vendor/runtime/render-legacy.mjs`（页面契约 `window.READY` / `window.DUR` / `window.render(t)`）。
`subs.json` 只是可选的 SRT 源；这条线的字幕是 JS 现场排字，没有 `subs.json` 时 `srt` 会直接说明。

## 工程怎么改

| 文件 | 管什么 |
|---|---|
| `index.html` | module 入口 |
| `main.js` | 入口：挂 DUR / render / READY |
| `film.js` | 时间轴（DUR = TL.DUR） |
| `timeline.js / timeline.json` | 时间表与场景切换 |
| `chars.js` | 人物（12 fps 步进） |
| `engine/deco.js` | 几何与金线：gline（刻线 + 金色渐变 + 细高光）、扇、日芒、阶梯、光晕 |
| `engine/type.js` | 装饰字体排版：从中心展开的标题条 |
| `engine/bulbs.js` | 灯泡招牌（沿字形骨架排灯泡） |
| `engine/cam.js` | 相机与卡片变换 |
| `scenes/lobby.js · roof.js · stairs.js · tower.js` | 四个场景：大堂、天台、楼梯、塔 |
| `shots_*.js` | 各场景的镜头表 |

## 画面语法（选你要的那几条）

标题从中心展开 / 金色描线一笔划过去 / 灯泡招牌一个个亮 / 卡片翻转换场 / 镜像双线。

转场只用这套材料自己的手段：不用叠化，不做常规剪辑。

## 已知坑

1. 黑色卡通轮廓会毁掉装饰艺术——描边是刻线 + 金线 + 高光三件套
2. 灯泡按邻居计数判节点会在曲线断开——用 crossing number 与 14 px 焊接
3. 相机步进读成卡顿——相机 24 fps
4. 字幕另做一种样式会脱系统——和标题同一套展开
5. 金色用单色会像土黄——必须是渐变

## 验收

- [ ] `stills` 抽 5–8 帧，材料质感与上面「一句话记住」的每条都对得上
- [ ] 步进与镜头分离：该走 12/8 fps 的只走那么快，相机不跟着步进
- [ ] 字幕/题字在材料上，不是浮层深色框
- [ ] `render` 帧数 = `DUR × fps`；`qa` 六项全绿（有音轨时）
- [ ] `python tools/validate.py` 这条管线 0 error
