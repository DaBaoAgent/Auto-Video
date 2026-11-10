# laolang · 24 个常用动作集（定稿人物，2026-11-09 建立 / 2026-11-10 修正）

> 源码：`toon-cast/lao_poses.js`（`window.LAO_POSE` 22 个命名姿态 + `window.LAO_ACTIONS` 24 条目录）。
> 消费端：`TOON.bodySide(p, outfit, { ...opts, act: 'point', actT: t })`。
> 审核片：`出稿/018_玄奘/11_动作库_24动作/`（60 s，24 × 2.5 s）+ `22_动作库_24动作_修正版/`。

## 1. 动作目录（24 条）

| # | key | 中文 | 英文 | 演示角色 | 表情 | 要点 |
|---|---|---|---|---|---|---|
| 01 | `walk` | 行走 | WALK | 领队 | neutral | 脚掌落地、双臂交替；`straightArm` 直臂摆；马灯挂手腕 |
| 02 | `run` | 奔跑 | RUN | 石槃陀 | effort | 大步、前倾；`straightArm` |
| 03 | `stop` | 停步 | STOP | 记录员 | curious | 最后两步收住、不滑行；停住回垂直站姿 |
| 04 | `idle` | 静立 | IDLE | 挖掘工 | neutral | 呼吸、眨眼、重心微移 |
| 05 | `look_up` | 抬头看 | LOOK UP | 玄奘（青年） | curious | 头后仰 head -14，右手搭到眉/眼上方 |
| 06 | `look_down` | 低头看 | LOOK DOWN | 玄奘（晚年） | sad | 头低 17、身体前倾 8、肩下沉 |
| 07 | `reach` | 伸手取物 | REACH | 辩机 | curious | 单臂前伸 |
| 08 | `push` | 推门 | PUSH | 领队 | effort | 压肩、门被推开 |
| 09 | `point` | 指方向 | POINT | 石槃陀 | stern | 单臂前指 |
| 10 | `wave` | 招手 | WAVE | 麴文泰 | smile | 抬臂、前臂往复 |
| 11 | `knock` | 敲门 | KNOCK | 李昌 | neutral | 握拳、叩门往复 |
| 12 | `handover` | 递书 | HAND OVER | 辩机 | smile | 双手前递、书（`farFront`） |
| 13 | `pray` | 合十 | PRAY | 玄奘（青年） | relief | 两手掌在胸口正中**并拢**；锡杖斜靠肩 |
| 14 | `kneel` | 跪拜 | KNEEL | 辩机 | sad | 两腿折到**身后**，身体坐脚跟上 |
| 15 | `sit` | 打坐 | SIT | 玄奘（晚年） | neutral | 两腿**盘在身前**；去掉双脚与小半截身体，整体压低；锡杖斜靠肩 |
| 16 | `lantern` | 提灯 | LANTERN | 领队 | neutral | 手抬到胸前，灯提在身前；手握住提梁 |
| 17 | `carry` | 扛重物 | CARRY | 挖掘工 | effort | 双臂上举、背包袱（`farFront`） |
| 18 | `draw` | 拔刀 | DRAW | 王祥 | stern | 手到腰、刀出鞘 |
| 19 | `swing` | 挥刀 | SWING | 石槃陀 | effort | 抬臂、刀刃往复 |
| 20 | `recoil` | 惊讶后退 | RECOIL | 记录员 | shock | 后仰、连退约 3 小步 |
| 21 | `laugh` | 大笑 | LAUGH | 戒日王 | laugh | 手按肚子、身体后仰 |
| 22 | `sigh` | 叹气 | SIGH | 玄奘（晚年） | sad | 低头、垂肩 |
| 23 | `wipe` | 擦汗 | WIPE | 挖掘工 | pained | 只有**右手**在额头来回擦，左手藏住 |
| 24 | `think` | 思考 | THINK | 吴承恩 | nervous | 手托下巴 |

## 2. 姿态参数表（`LAO_POSE`）

手臂角度约定：**0 = 下垂，-90 = 向前，+90 = 向后，-180 = 向上**。`armN` 是近侧（右）臂，`armF` 是远侧（左）臂；每项两个角是上臂/前臂。

| key | 参数 |
|---|---|
| `run` | `{ run: true, lean: 10 }` |
| `idle` | `{ armN: [6,3], armF: [-6,-3] }` |
| `look_up` | `{ armN: [210,170], armF: [6,3], head: -14, lean: -3, lookUpFace: true, lookUpStaff: true }` |
| `look_down` | `{ armN: [8,4], armF: [-8,-4], head: 17, lean: 8, lookDownStaff: true }` |
| `reach` | `{ armN: [-75,-85], armF: [-50,-65], lean: 4 }` |
| `push` | `{ armN: [-80,-78], armF: [-70,-70], lean: 10 }` |
| `point` | `{ armN: [-88,-88], armF: [6,3], handN: 'point' }` |
| `wave` | `{ armN: [-150,-100], armF: [6,3], wave: true }` |
| `knock` | `{ armN: [-70,-95], armF: [6,3], handN: 'fist', knock: true, lean: 3 }` |
| `handover` | `{ armN: [-65,-85], armF: [-60,-80], prop: 'book', farFront: true }` |
| `pray` | `{ armN: [15,140], armF: [-25,-115], lean: 2, head: 4, pray: true }` |
| `kneel` | `{ armN: [-50,-70], armF: [-40,-60], hip: 80, lean: 8, head: 8, kneel: true }` |
| `sit` | `{ armN: [-20,-35], armF: [-20,-35], hip: 0, lean: 0, head: 0, sit: true }` |
| `lantern` | `{ armN: [-45,-75], armF: [-6,-3], prop: 'lantern' }` |
| `carry` | `{ armN: [-150,-110], armF: [-150,-110], lean: 6, prop: 'sack', farFront: true }` |
| `draw` | `{ armN: [20,-40], armF: [6,3], prop: 'knife', lean: 2 }` |
| `swing` | `{ armN: [-120,-70], armF: [-20,-10], prop: 'knife', lean: 8, swing: true }` |
| `recoil` | `{ armN: [-40,-70], armF: [-40,-70], lean: -14, head: -6, recoil: true }` |
| `laugh` | `{ armN: [-30,-110], armF: [-30,-110], lean: -5, head: -3, farFront: true }` |
| `sigh` | `{ armN: [6,3], armF: [-6,-3], head: 8, lean: 4 }` |
| `wipe` | `{ armN: [210,170], armF: [6,3], head: 2, wipe: true }` |
| `think` | `{ armN: [-60,-150], armF: [-30,-60], head: 4, lean: 2 }` |

## 3. 调用方式

```js
// 单帧姿态（静态/展示页）
const c = CAST.draw(slot, LAO_FULL[slot], {
  act: 'point', actT: t,       // actT 驱动招手/敲门/挥刀的往复
  expr: 'stern', blink: CAST.lidAt(t, slot),
  phase: 0, mode: 'stand',
}, true);                       // side = true 侧视

// 入戏过渡：页面把 actPose 从 idle 插值到目标姿态（0.6 s），再交给 bodySide
const actPose = lerpPose(LAO_POSE.idle, LAO_POSE[action], ease(t));
CAST.draw(slot, LAO_FULL[slot], { ...actPose, actT: t }, true);
```

- **不要突然摆姿势**：0.6 s 过渡；动作结束回到 idle。
- `actT` 用于往复类动作（wave / knock / swing / wipe）；持续动作（walk / run）由 `phase` 驱动。
- 24 个动作的展示片切点是 120 BPM（每动作 2.5 s），页面按 `Math.floor(t / 2.5)` 轮换角色与动作。

## 4. 与 `runtime/act.js` 的分工

| 层 | 负责 | 字段/接口 |
|---|---|---|
| `act.js` | 步态、停步、看的方向、表情窗口、脚落地时刻 | `ph / walk / stop / settle / L / lift / face / look / lookY / blink / brow / browUp / mo / teeth / eyeWide / sm` |
| `lao_poses.js` | 关节姿态（手臂角度、头位、跪/坐、道具） | `opts.act` → `LAO_POSE[key]` |
| `toon.js` | 按 pose 画人物（limb 弯曲、cel 阴影、帽子延迟） | `TOON.bodySide / bodyFront` |

60 秒样片的走路同时用两层：`ACT.walkCurve(...)` 给出 `x/ph/stop/settle`，`CAST.draw(..., { phase: w.ph, mode: 'march' })` 画步态；需要静态动作时加 `act: 'point'` 等。

**步态铁律**：相位必须与位移积分绑定（`dφ = dx / L`），不要用 `t × 频率`；着地脚世界位置逐帧不动；停步后 `x`、`ph` 冻结在跨立站姿（0.06–0.14），最后一步有 1.6 单位下沉再回正。详见 `promo/references/act.md`。

## 5. 2026-11-10 修正记录（已固化）

- 侧面：远侧手臂不再完整画在躯干前，默认只露半截上臂；远侧手不画。
- 05 抬头：头后仰加大、身体微后仰、近手搭到眉上。
- 06 低头：头低 16–18、身体前倾 8、肩下沉。
- 13 合十：两手在胸口正中并拢（不是手臂交叉）；锡杖斜靠肩。
- 14 跪拜：两腿折到身后、坐在脚跟上。
- 15 打坐：两腿盘在身前，去掉双脚与小半截身体，缩短压低。
- 16 提灯：手抬到胸前，灯提在身前，手握住提梁。
- 20 惊讶后退：连退约 3 小步。
- 23 擦汗：只有右手在额头擦，左手藏住。
- 01–03：`straightArm: true`，右臂伸直垂在身侧随脚步摆动；01 马灯挂摆动手腕。

## 6. 展示片规格

- `11_动作库_24动作_60秒.mp4`：60.0 s / 1920×1080 / 30 fps / 无声；24 × 2.5 s，切点落 120 BPM。
- 每个人物从 idle 用 0.6 s 过渡到目标姿态；角色在 18 个定稿角色之间轮换。
- QA：1800 帧；无黑帧、无白闪、无冻结；39.53 s 的单帧差异尖峰来自 12.5 张/秒线条抖动/眨眼，不是跳变。
- 修正版：`22_动作库_24动作_修正版/`、`23_动作库_24动作_修正版2/`。

## 7. 自检

- 走路看脚：着地脚不许滑；停步看最后三拍（减速→冻结→下沉回弹）。
- 表情看窗口：先停一拍再动；惊讶先定住再眨眼/张嘴。
- 侧面看手：远侧手是否消失？持物手是否盖住杆？有没有第三只手？
- 大动作前有预备，结束后有回收；不要匀速。
