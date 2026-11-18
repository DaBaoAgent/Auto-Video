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

## 已知坑

1. 硬边色块 = 数码水彩，立刻塌掉风格：所有边都要有积水的深边
2. 字幕开深色框会破坏纸上印刷感
3. 60 fps 下笔刷不能抖，抖要来自水而不是相机
4. 水彩要多层湿接，一层到位会脏

## 验收

- [ ] `stills` 抽 5–8 帧，材料质感与上面「一句话记住」的每条都对得上
- [ ] 步进与镜头分离：该走 12/8 fps 的只走那么快，相机不跟着步进
- [ ] 字幕/题字在材料上，不是浮层深色框
- [ ] `render` 帧数 = `DUR × fps`；`qa` 六项全绿（有音轨时）
- [ ] `python tools/validate.py` 这条管线 0 error
