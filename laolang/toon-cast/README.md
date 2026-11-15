# laolang · toon 人物定稿（2026-11-10 修正版 v20261110）

> 这套人物是 `xz-toon-lao` 20 秒样片定稿的三人组，后来扩成 18 人全片配置 + 24 动作库，并冻结为 `archive/v20261110_stable/`。
> **改比例/发型/脸型前先重出设定图给用户审核**，不要直接改这里。

> **在 Auto-Video 的 laolang 管线里**：`python scripts/laolang.py new <工程>` 会自动把 `runtime/toon.js`、`cast-lite.js` 复制到工程的 `lib/`；页面加载 `lib/toon.js`、`lib/cast-lite.js`、`lao_cast_full.js`、`lao_poses.js` 即可，不需要再跑 `build_toon.py`。本目录的 `lib/toon.js` 就是页面用的构建产物。

## 文件

- `lao_body.ts` — 侧视/正面整身绘制，追加在 `templates/bridge/toon.ts` 之后；沿用 `Pen` 与 600×1000 设计空间。
- `lao_cast.js` — 三个角色的冻结配置（`window.LAO_CAST`）；`CAST.draw(slot, LAO_CAST[slot], opts, side)`。
- `build_toon.py` — 把 `lao_body.ts` 接到 `toon.ts` 后，用 esbuild 编成 `lib/toon.js`（IIFE 全局 `TOON`）。

## 冻结参数

- 设计空间 600×1000，地面 `y = 975`。
- 腿长 **125**（上一版 250 的一半）；躯干约 **360** 高、最宽 **248**；头约占全高 1/4。
- 手臂比上一版短 **1/3**；手掌/鞋放大。
- 三种脸型：长脸（领队，基准）、圆脸（记录员，横 ×1.12 / 纵 ×0.90）、方脸（挖掘工，横 ×1.08 / 纵 ×0.97 + 下颌 6%）。
- 三种发型：三七分（领队）、秃顶 + 两侧短发（记录员）、板寸 + 宽檐帽（挖掘工）。
- 五官参数：`browY / browIn / eyeW / eyeH / lid / pupil / lookX / lookY / open / smile / teeth / tongue / jaw`。
- 平涂 + 硬边阴影 + 粗细变化墨线；眨眼用 `cast.ts` 的 `lidAt`（30 fps、0.5–2.3 s）。

## 用法

1. 把 `lao_body.ts` 追加到项目的 `toon.ts` 末尾，并确认 `bodySide/bodyFront` 里有 `if (o.lao) return lbodySide/lbodyFront(...)` 的分支。
2. `python build_toon.py` 生成 `lib/toon.js`。
3. 页面加载 `lib/toon.js`、`lib/cast-lite.js`、`lao_cast.js`，角色配置直接用 `window.LAO_CAST`。

## 已验收的成片

- `出稿/018_玄奘/07_toon_玄奘_20秒样片.mp4`（20.1 s，定稿人物）
- `出稿/018_玄奘/08_人物设定/`（四张设定图）

## 全片角色层（2026-11-09，待用户审核）

- `lao_cast_full.js`：全片 21 个上屏角色的配置（考古队 3 + 玄奘线 6 + 印度线 2 + 唐廷/功能 6 + 壁画 3 另表）。
- `lao_body.ts` 新增可选角色层，不影响已验收三人：
  - 服装：`robe`、`kasaya`、`sash`、`armor`
  - 头部：`beard` + `beardLen`、`hat: turban|crown|official|scholar|fur|helmet|band|pith`
  - 道具：`staff`、`knife`、`book`、`spear`、`warrant`、`telescope`、`prayer`
  - 个体脸型：`faceK = {fx, fy, nose, eye, jaw}`；`age` 加皱纹，`browCol` 改眉色
- 审核图：`出稿/018_玄奘/10_全片人物造型/`。

## 常用动作库（24 个，2026-11-09）

- `lao_poses.js`：`window.LAO_POSE`（22 个命名姿态）+ `window.LAO_ACTIONS`（24 条含角色/表情的目录）。
- 用法：`TOON.bodySide(p, outfit, { ...opts, act: 'point', actT: t })`；`actT` 用于招手/敲门/挥刀的往复。
- 过渡：页面把 `actPose` 从 idle 插值到目标姿态（0.6 s），再交给 `bodySide`，避免动作突然出现。
- 24 个动作：行走、奔跑、停步、静立、抬头看、低头看、伸手取物、推门、指方向、招手、敲门、递书、合十、跪拜、打坐、提灯、扛重物、拔刀、挥刀、惊讶后退、大笑、叹气、擦汗、思考。
- 审核片：`出稿/018_玄奘/11_动作库_24动作/`（60 s，24×2.5 s）。

## 2026-11-10 修正（v20261110，已固化）

这一版按用户逐条审核意见改完，源码与本目录 `archive/v20261110/` 快照一致；`MANIFEST.sha256` 是校验。

### 侧面肩/手臂

- 侧视近侧（右）肩窝在**人物中线**；上臂从中线出。
- 远侧（左）肩/上臂**完全藏在身体后**，不画肩片、不画半截上臂。
- 平时站立：除提灯、锡杖、长矛、书/镐等持物外，手臂**垂直向下**。
- 持物：手臂伸直向前，或上臂向下、前臂向前下方**反向屈肘约 45°**；手掌画在杆/灯之后，**盖住**杆身/提梁，形成握持。
- 05/06 左手只从身体右前缘露出**一小段小臂 + 手掌**，不与躯干重叠；06 只握现有的一根锡杖，不再另画棍子。

### 动作

- 05 抬头：右手在眉/眼上方；左手持锡杖。
- 06 低头：头低 17、肩下沉；左手握锡杖。
- 13 合十：**手掌合十**，不是手臂交叉；锡杖斜靠在肩膀上。
- 14 跪拜：两腿折到身后。
- 15 打坐：去掉双脚和小半截身体，缩短压低；锡杖斜靠肩膀。
- 16 提灯：手抬到胸前，灯提在身前。
- 20 惊讶后退：动作库视频里连退约 3 小步。
- 23 擦汗：只有**右手**在额头擦，左手藏住。

### 范围说明

- 书页上方标题 24 号 SimSun、石槃陀 50 号 SimSun、字幕 37 号属于**全片页面/字体**修正，不在本人物库内；对应工程 `work/xz-film-60/index.html`、`lib/goldenage.js`。
- 18 人全片配置在 `lao_cast_full.js`（ archaeologists 3 + 新增 15）。
### 动作库 01–03 直臂摆动（2026-11-10 补）

- 动作库 01 行走 / 02 奔跑：`straightArm: true`，右臂伸直垂在身侧，随脚步前后交替摆动；01 领队马灯挂在摆动的手腕上。
- 03 停步：走的时候直臂摆，停住后回垂直站姿。
- 只在动作库 01–03 打开，全片其它走戏不受影响。

## 2026-11-10 稳定版全片规范（60 s）

- 快照：`archive/v20261110_stable/`（页面、`goldenage.js`、`laolang.js`、人物/动作库、说明）。
- 规范：`archive/v20261110_stable/STABLE_SPEC.md`。
- 关键：4:3 / 1920×1080 / 30 fps；`drawings 30`、`boil 0.04`；关闭 gate weave，颗粒静态，去掉逐帧灰尘；人物全身 0.24–0.26、头靠横中线、脚下留白 100–160 px；每镜不同运镜。
- 人物/动作没有改；只冻结镜头、景别、画面稳定和场景动态规则。
