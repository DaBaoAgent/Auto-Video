# 镜头语法索引

12 张卡是赤壁样片用过的运动语法，每张都有已验证的实现。卡名分两栏：

- **本管线 id** —— `film.json` 里 `card` 字段的取值；
- **上游卡** —— video-shotcraft 仓库里语义最接近的配方卡 id，要查它的调参细节与
  已知坑时去 `assets/raw2/shotcraft/…/references/shots/<类别>/<上游卡>.md`。

**注意**：上游 124 张卡里只有 `paper-title-card` 与本管线同名同义，其余是本管线
按运动语法重新实现的，不是上游 demo 的移植。上游卡只能当「语义参照」。

## 能量曲线

一支 30 秒片的推荐走向（赤壁用的就是这条）：

```
字卡(落) → 推进(起) → 熄灭(伏) → 开门(转折) → 漫染(铺) → 列阵(扬)
→ 一线(收) → 等风(蓄) → 引爆(炸) → 火(顶) → 撤退(沉降) → 落款(定)
```

前 3 镜不要给高潮，最后 2 镜必须往下走。中间只有 **一个** 顶点（引爆/火），
顶点只能出现一次，重复就廉价。

## 索引

| # | 本管线 id | 上游卡 | 运动语法 | 镜头作用 | 能量 |
|---|---|---|---|---|---|
| 01 | `paper-title-card` | `paper-title-card` | 竖排大字逐字 blur 入场 + 轻微推近 | 定调、报时间/人物 | 落 |
| 02 | `depth-layer-moves` | `depth-layer-moves` | 舆图多层视差推进 + 箭头生长 | 交代空间与规模 | 起 |
| 03 | `light-play-moves` | `light-play-moves` | 光源收缩、字随光褪去 | 转折（人物死亡/局势变） | 伏 |
| 04 | `slam-entrance-moves` | `slam-entrance-moves` | 门扇左右分开、门洞透光 | 场景切换（进城/开门） | 转折 |
| 05 | `scan-bracket-sweep` | `scan-bracket-sweep` | 朱砂逐格漫染，一格一地名 | 铺陈范围（多地/多部） | 铺 |
| 06 | `space-camera-moves` | `space-camera-moves` | 横移 + 三层视差（远山/城墙/旗） | 建立纵深与体量 | 扬 |
| 07 | `glow-flyline-moves` | `glow-flyline-moves` | 一条线从中心向两侧展开 | 收束到「唯一」的意象 | 收 |
| 08 | `wind-streak` | `wind-streak` | 风向线横扫 + 人物侧影静立 | 蓄势（等条件成熟） | 蓄 |
| 09 | `radial-ripple-phone-chips` | `radial-ripple-phone-chips` | 一点朱砂引爆、冲击环扩散 | 事件触发 | 炸 |
| 10 | `impact-feedback` | `impact-feedback` | 多层火焰 + 画面冲击抖动 | 顶点 | 顶 |
| 11 | `overhead-camera-moves` | `overhead-camera-moves` | 俯拍路径生长 + 骑手沿线移动 | 沉降（撤退/归途） | 沉降 |
| 12 | `logo-shrink-wordmark-lockup` | `logo-shrink-wordmark-lockup` | 大字落定 + 细线 + 印章砸落 | 收尾定论 | 定 |

## 什么时候不用完整 12 镜

- **15 秒片**：取 1 / 4 / 6 / 9 / 12，五镜就够。
- **60 秒片**：12 镜做骨架，在「铺/扬/蓄」三段各加 2–3 镜（同类语法换素材，
  不要新增语法类型）。
- **只要一个镜头**：读对应 `cards/*.md`，copy `template/src/shots/Sxx.tsx`，
  改 `content` 与配色变量即可，不需要整条管线。

## 每张卡的固定结构

```
cards/NN-<id>.md
├── frontmatter：id / 上游卡 / 时长区间 / 能量 / 依赖资产
├── 画面        —— 观众看到什么（一句话）
├── 运动        —— 时间轴上的动作与缓动
├── 参数表      —— 可调项与已验证取值
├── content 槽  —— film.json 能覆盖的文案键
├── 已知坑      —— 调过的真相，不得降档
└── 参考实现    —— template/src/shots/Sxx.tsx
```

写新卡时照这个结构，`已知坑` 一节必须写——它是下一轮不被推倒重来的保险。
