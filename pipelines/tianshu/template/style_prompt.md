# tianshu · 提示词骨架

三段拼起来，顺序不要改：**画种锚点 → 画面内容 → 色板与禁令**。
脚本里 `tcfg.STYLE_HEAD` / `STYLE_TAIL` / `NEG_DEFAULT` 就是这三段，改这里也改那里。

## 1. 画种锚点（每张图必带）

```
Hand-painted 1983 Shanghai Animation Film Studio cel animation,
traditional Chinese ink-and-colour scenery, flat opaque gouache colour areas,
thin near-black ink contour (#080808), hard-edged shadow only,
visible paper grain, slightly faded aged print, muted dusty film colours,
4:3 academy frame with rounded corners.
```

线色是 **近黑 #080808**，不是墨褐、不是褐色勾线。
2026-11-13 的逐镜对位取色把这一点钉死了：原片薄涂线条实测 R/G/B 几乎相等，
只有旧版 026 前几镜的 I2V 提示词里还留着 “thin brown ink contour”，那是被推翻的表述。

## 2. 画面内容

一句一物，先空间后主体后光。不要写镜头语言（"特写""推近"），运镜归后期。

```
Composition: A five-tier stone pagoda stands on a rocky hillside above a jade-green lake,
layered grey-green mountain ranges behind it, the sky split into two horizontal bands
of pale cream and pale teal.
```

## 3. 色板 + 禁令

```
Palette: #bcc390 #7b8f74 #d9d2b0 #2a3327 #c0642f.
No gradient shading, no airbrush, no photographic lighting, no 3D volume,
no depth of field, no volumetric light, no specular highlight,
no ink wash bleed, no watercolour wash, no paper-cut silhouette, no text, no subtitle.
```

色板从对位原片帧用中值切分（MEDIANCUT）取 5–8 个 hex，逐镜不同。
**不要**让模型自己配色 —— 一让它配，全片就散。

## 4. 负面词（只留三类）

```
3D render, realistic, photorealistic, detailed texture, photographic, bokeh,
lens flare, anime style, hdri, ambient occlusion,
subtitle, lettering, chinese calligraphy text, watermark, signature, logo,
border, frame, matting, paper margin, white border, text overlay,
duplicate subject, extra pagoda, extra figure, crowd
```

雾、渐变、体积、材质这类负词全部放开：原片本身就带雾和体积感，
把它们写进负词，画面反而变塑料。**cfg 不能落回 1.0** ——
guidance-distilled 下负词分支被整条跳过，这三类负词就白写了。

## 5. I2V 提示词

只描述**氛围动态**，最后一句永远是 `The camera holds perfectly still.`：

```
Hand-painted flat cel animation, 1983 Shanghai Animation Film Studio style. {scene}
Thin near-black ink contour, flat colour blocks, no gradient shading, visible paper grain.
{慢雾掠过湖面 / 灰尘横向飘 / 灯火微颤 / 裂缝里的白光缓慢呼吸}
The camera holds perfectly still. Keep the drawing on the model sheet unchanged.
```

- 不要让它运镜：5B 模型不会运镜，要求它运只会毁掉这一镜；
- **有手的镜头不要进 I2V**：手指结构在 5 秒里必然崩；
- 大横移（0.14）用 1152×864 出，纯漂移用 960×720；母版大 20%，后期裁切才不吃画面。
