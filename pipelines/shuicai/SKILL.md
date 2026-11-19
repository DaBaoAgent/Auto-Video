---
name: shuicai
description: 水彩笔刷（Watercolor Brush）管线：一笔一笔湿接湿的水彩，颜色在纸上自己走、自己干、自己留边。用于这一类题材的短片，口播可有可无。当用户说「水彩笔刷」「Watercolor Brush」时用。
---

# shuicai · 水彩笔刷

一条片子 = 一笔一笔湿接湿的水彩，颜色在纸上自己走、自己干、自己留边。

示例工程：`projects/012_aus/`（《从旱到涝》Arid to Wet，113.6 s）。

## 一句话记住

- **medium**：湿画法：颜色在湿纸上扩散、边界积水变深、干后留一圈边；不画硬边色块
- **paper**：纸本身的暖调与颗粒参与成像，不是白底
- **palette**：示例：旱到涝 红赭 → 鼠尾草 → 麦秆 → 蓝灰 → 深绿；港口清晨 天 #f3e2c8 / 水 #9fb4c4 / 船体 #5f7486 / 点缀 #c8442a；菜园 土 #e8e0c0 / 叶 #8ea860 / 影 #4e6e3c / 南瓜 #d9632e
- **motion**：60 fps + 平滑缓动（ss/eio/eo/ei），慢而流的水彩不该抖
- **type**：字幕写在纸上不开框：底部居中，衬线斜体约 36 px（最多两行平衡），第二语言一行约 2/3 字号，墨 78% 压在纸色光晕上；保持 ≥ max(1.8 s, 语音+0.6 s)

## 入口

在仓库根执行，单一入口 `shuicai/scripts/shuicai.py`：

```bash
python tools/sync_fonts.py --fetch && python tools/sync_fonts.py --pipeline shuicai
python shuicai/scripts/shuicai.py probe  012_aus
python shuicai/scripts/shuicai.py stills 012_aus --times 3,12,28
python shuicai/scripts/shuicai.py render 012_aus
python shuicai/scripts/shuicai.py mux    012_aus
python shuicai/scripts/shuicai.py qa     012_aus
python shuicai/scripts/shuicai.py new    013_xxx
```

渲染交给共享运行时 `vendor/runtime/render-legacy.mjs`（页面契约 `window.READY` / `window.DUR` / `window.render(t)`）。
`subs.json` 只是可选的 SRT 源；这条线的字幕是 JS 现场排字，没有 `subs.json` 时 `srt` 会直接说明。

## 工程怎么改

| 文件 | 管什么 |
|---|---|
| `index.html` | 传统 script 顺序加载（非 module）：aus.js → engine.js → plants.js → scene.js → main.js |
| `engine.js` | 笔刷引擎：湿接湿、边缘积水、纸纹吸收 |
| `scene.js` | 这一页的世界与 DUR 113.6 |
| `plants.js` | 植物（叶子、茎、花） |
| `main.js` | 时间轴、镜头、字幕 |
| `aus.js` | 澳洲的旱涝事实层（FACTS.md 是它的出处） |

## 画面语法（选你要的那几条）

一笔从旱画到涝 / 颜色自己流过去 / 留白当旱地 / 同一棵树湿了又干。

转场只用这套材料自己的手段：不用叠化，不做常规剪辑。

## 画幅：横屏与竖屏（2026-11-19 起）

`engine.js` 的 `W/H` 不再写死，改从页面 canvas 读；`index.html` 的 canvas 按视口建。渲染时用 `--width/--height` 决定横竖：

- 竖屏：`node vendor/runtime/render-legacy.mjs pipelines/shuicai/projects/<工程> --width 1080 --height 1920 --fps 60 --out .../out/video-9x16.mp4`
- 横屏：`--width 1920 --height 1080`

竖屏要重排构图：天与水分段、地平线抬到下部 1/4、主体竖向叠放；湿接水的笔触宽度按画幅短边等比缩。

竖屏参考工程：`projects/ep24v3_rainroad`（雨里骑车五十公里，1080×1920 / 10 s / 30 fps）。它把竖屏构图定成一条横穿画面的路面带 + 上半幅雨幕，是这条线的竖屏语法样板。

### 动起来的角色不要逐帧重描（2026-11-19 定案）

角色（人、车、手）如果每帧都用 `mk()`/`brush` 重描一遍，**笔触宽度里那点随机噪声每帧都不同，轮廓边缘就会逐帧变形**，观众看到的就是「身体一直在抖」，跟相机无关，跟位移也无关。定案做法：

1. **角色画在一块大小固定的离屏画布上**（局部坐标固定、`withSeed(定值, …)` 固定种子），每帧只重画这一小块；
2. **再用整数像素把整块贴到主画布**（`ctx.drawImage(spr, Math.round(bx - ox), Math.round(by - oy))`），位移落在整像素上，轮廓一个像素都不变；
3. **人体用实填轮廓 + 薄描边**（帽、脸、躯干、手臂、腿、鞋各是一个多边形），不要用几道宽笔叠出半透明身体——叠出来的重影也会读成抖；
4. 只有轮子辐条、脚蹬相位、水花这些「本来就该动」的部件留在动画里。

同一条规则适用于所有画角色并让角色平移的工程（浮世绘的摊主也一样）。

## 已知坑

1. 硬边色块 = 数码水彩，立刻塌掉风格：所有边都要有积水的深边
2. 字幕开深色框会破坏纸上印刷感
3. 60 fps 下笔刷不能抖，抖要来自水而不是相机
4. 水彩要多层湿接，一层到位会脏
5. 角色逐帧重描 = 身体发抖，见上面「动起来的角色不要逐帧重描」

## 验收

- [ ] `stills` 抽 5–8 帧，材料质感与上面「一句话记住」的每条都对得上
- [ ] 步进与镜头分离：该走 12/8 fps 的只走那么快，相机不跟着步进
- [ ] 字幕/题字在材料上，不是浮层深色框
- [ ] `render` 帧数 = `DUR × fps`；`qa` 六项全绿（有音轨时）
- [ ] `python tools/validate.py` 这条管线 0 error

