# 主题系统

色板不是硬编码的，是 **8 个 CSS 自定义属性**，由 `<LookProvider theme accentLock>`
注入到整部片最外层。场景里所有颜色都写成 `var(--lk-*)`，所以换主题时
12 个镜头文件一行都不用改。

## 八个槽

| 槽 | 变量 | 用途 |
|---|---|---|
| page | `--lk-paper` | 纸底 |
| surface | `--lk-paper-light` | 卡面 / 提亮 |
| field | `--lk-paper-deep` | 凹陷 / 次级底 |
| text | `--lk-ink` | 墨 / 主文字 |
| muted | `--lk-muted` | 次要文字 / 辅助线 |
| accent | `--lk-cin` | 朱砂 |
| border | `--lk-gold` | 旧金 / 描边 |
| **solid** | `--lk-solid` | **实体剪影**（城墙/门扇/船身/骑手） |

前七个对齐上游 video-shotcraft 的 `template/src/themes/palettes.json`
（page / surface / field / text / muted / accent / border）。`solid` 是本管线加的。

出口函数：`ink(a) / cin(a) / gold(a) / paperRgba(a) / solid(a)`，参数是 0–1 的 alpha。
另有常量 `PAPER / PAPER_LIGHT / PAPER_DEEP / INK / CINNABAR / GOLD / SOLID`。

## accentLock：只换纸与墨

```bash
# 主题自带（三套历史主题都开了）
--props='{"theme":"yeyan"}'
# 给任意主题临时上锁：只借纸色，不借品牌强调色
--props='{"theme":"ink-press","accentLock":true}'
```

锁定后 `accent` 槽被忽略，回落 `#b33a2b`；**暗底（page 相对亮度 < 0.45）自动换
同色相提亮版 `#cf4a38`** —— 否则 `#b33a2b` 压 `#191510` 只有 2.3:1 对比度，
印章会糊成暗斑。

锁的是「朱砂」这个语义，不是某个 hex。要在 `film.json` 里开：
`"accentLock": true`，或主题自带。

## 13 套主题

### 基线

| id | 纸底 | 墨 | 朱砂 | 旧金 | 说明 |
|---|---|---|---|---|---|
| `paper` | `#efe6d2` | `#24211c` | `#b33a2b` | `#c9a24a` | 宣纸纸本，jianying 纸雕定稿色。赤壁成片用的就是这套 |

### 历史主题组（全部 accentLock）

| id | 纸底 | 墨 | 朱砂 | 旧金 | 判读 |
|---|---|---|---|---|---|
| `qinglv` 青绿山水 | `#dfe6da` | `#1d2a25` | `#b33a2b` 锁 | `#9a7c4e` | 绢本设色。底一冷，朱砂成了全场唯一暖色，冷暖对冲最强；代价是纸感换绢感 |
| `zhupi` 朱批奏折 | `#f1ecdd` | `#1a1815` | `#b33a2b` 锁 | `#b8a67e` | 白绵纸压纯黑，等于给基线加一档对比度。奏折/批注类叙事最稳 |
| `yeyan` 夜宴 | `#191510` | `#e9dcc0` | `#cf4a38` 锁·提亮 | `#8a6a3a` | 墨夜绢本。唯一能当全片暗色的一套 |

### 上游 9 套（对照用）

`ink-press` `modern-light` `midnight` `solar-pop` `coral-burst` `color-play`
`deep-ocean` `obsidian-violet` `vintage-kraft`

它们是「品牌 promo 配色」，换的是整套语义，朱砂必然失义。真正能借的只有两套：
`ink-press`（纸底 `#f2eee6`，同色族）和 `vintage-kraft`（`#dfc69e` 牛皮纸 + 程序化纸纹）。
其余要么是 SaaS 蓝，要么暗底让旗子发青光。

**不要默认「换主题 = 换风格」。** 换之前先问：这套的 accent 还是朱砂吗？
不是的话，开 `accentLock`。

## solid 槽：暗底必须处理的事

`ink()` 绑 `text` 槽。暗色主题里 `text` 是亮色，于是城墙、门扇、船身会
**反相成发光的米黄块**（夜宴主题第一版就这么崩的）。

`solid` 的取值：浅底 = `text`（与 `ink` 等价，对成片零影响）；暗底 = `#070504`。

| 用 `solid` | 用 `ink` |
|---|---|
| 城墙、垛口、门扇、门槛 | 文字、标题、落款 |
| 旗杆、旗上墨痕 | 细线、水纹、雨丝 |
| 船身、骑手、泥点、荒丛 | **路面、江面**（地被靠明度区分） |

路面是特例：压成 `#070504` 后与夜底糊成一片，几乎看不见。用 `ink` 反而对——
暗底上变成一条被月光照亮的白路，骑手只剩暗剪影。

## 混合模式也要跟随

朱砂色块在浅底用 `multiply`（印上去的手感），暗底必须换 `screen`，
否则被乘成黑斑。已处理：`Seal` 印章、`Paper` 的纸纹噪声与暖光、
S05 漫染、S09 引爆。判断用 `useIsDark()`。

## 渲染命令

```bash
cd projects/<slug>/work
npx remotion still src/index.ts Film out/t.png --frame=420 \
  --props='{"theme":"qinglv"}' \
  --browser-executable="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
```

批量出对比图看 `pipeline/build_theme_board.py`（在仓库根 `pipeline/` 下，
是赤壁那轮的产物，可当模板改成通用版）。
