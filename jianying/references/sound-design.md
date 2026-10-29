# 声音设计

## 原则

1. **音效是钉帧的，不是铺底的。** 每条 cue 都挂在某个镜头的某个偏移秒上，
   跟镜头的动作对齐（印章落定、翻页、甲片、门扇）。
2. **少而准，不是铺满。** E3 定版：53 镜只挂 19 个关键镜、共 40 条。
   每镜 2 点上限。宁可留白给 BGM，也不要每镜堆音。
   （走过弯路：每镜 3 点 + 周期性 riser + whisper = 211 条，听感密集。）
3. **点数少则单点重。** 40 条时把印章给到 −9 dB、撞击 −12.5 dB、转场 −15.5 dB；
   实测砸印那一刻 RMS −10.5 dBFS，空档 −17.0 dBFS，差 6.5 dB 才跳得出来。
   211 条时单点只有 −15 ~ −20 dB，因为密集期会累积吵闹。
4. **SFX 让位旁白。** 基准 −4 dB 叠进母版，说话时 BGM 自动再压 4.4 dB。
5. **无版权素材依赖。** 全部程序化合成（numpy + 标准库 `wave`），固定 seed，
   同一参数永远出同一段波形。**不依赖 scipy / soundfile**（本机 pip 走不通）。

## 28 种程序化音色（`scripts/make_audio.py` 的 `SYNTH`）

| 类别 | 音色 | 听感 / 用途 |
|---|---|---|
| 转场 | `whoosh` | 中频扫风：推进、平移、切镜 |
| | `whoosh_low` | 低频扫风：沉降、撤退、俯拍 |
| | `paper_turn` | 翻页：揭册、翻档 |
| | `wind` | 风：外景、空殿、地图 |
| | `robe` | 衣料摩擦：转身、落座 |
| | `step` | 脚步：廊道、上殿 |
| | `air_low` | 空气床：长留白的底 |
| 重音 | `stone` / `stone_low` | 石门摩擦 + 撞击：开门、落城、砸字 |
| | `seal` | 木头砸纸 + 尾音：印章落定 |
| | `book_close` | 合书 |
| | `gong` / `bell_low` | 锣 / 低钟：仪式、宣告 |
| | `chime` | 轻鸣：落款、点睛 |
| | `paper_tear` | 纸裂：改写、撕档 |
| 质感 | `heart` | 心跳：悬疑推进 |
| | `breath` | 呼吸：留白、人物临近 |
| | `sub_rise` | 低频堆起：幕间气口、大转折 |
| | `whisper` | 低语：宫廷秘闻 |
| | `flint` | 火折：点灯 |
| | `brush` | 笔锋：书写、朱批 |
| | `ink_drop` | 墨滴：落笔、洇开 |
| | `wood_creak` | 木轴：展卷、开门 |
| | `drawer` | 抽屉：取证 |
| | `crack` | 裂：断裂、崩塌 |
| | `water` | 水：江河 |
| | `hoof` | 马蹄：进军、地图路线 |

`seal` 的偏移要给到印章入场之后（卡里 `<Seal delay={16}>` → offset 约 0.30s）。

## 关键镜选点（`--mode key`，定版）

只有列进 `data/audio-plan.json` 的镜头挂音效，其余全静默（只留 BGM 与人声）。

| kind | 音效组合 | 用在 |
|---|---|---|
| `open` | `paper_turn` + `wind` | 开场第一镜 |
| `name` | `whoosh_low` + `seal` | 名卡砸印（人名第一次/最后一次落定） |
| `turn` | `whoosh` + `stone` | 剧情转折（战争、篡位、反转） |
| `map` | `wind` + `hoof` | 地图、地理转移 |
| `sign` | `breath` + `chime` | 落款、收尾 |

`risers` 只给两处最大转折（E3 是镜 11 靖难、镜 44 正统），不再周期性出现。

没有 `audio-plan.json` 时自动推导：首镜 `open` / 名卡 `name` / 落款 `sign` /
每 6 镜 `turn`。想加密就 `--mode shot`（每镜 2 点，约 106 条，这是密度上限）。

## 音频计划文件（`data/audio-plan.json`）

```json
{
  "note": "关键镜表",
  "risers": [11, 44],
  "key": {"1": "open", "3": "name", "11": "turn", "52": "sign"}
}
```

## BGM

```bash
python scripts/make_audio.py --project projects/xxx/work \
  --voice narration/narration.wav \
  --bgm "D:/@kaifa/BGM/未解/未解 02_Myst_on_the_Moor_迷雾未解之谜_Kevin_MacLeod.mp3" \
  --plan data/audio-plan.json --mode key
```

处理链：ffmpeg 转单声道 44.1k → 循环补齐 → 首尾 1.6s 淡入淡出 →
**底值 −8.5 dB**，人声触发时再压 **4.4 dB**（简易闪避，
0.35s 平滑窗、人声 RMS > 0.012 判定为说话中）。

**−8.5 dB 是实测反推出来的**：BGM 源 −19.5 dBFS、人声 −21.4 dBFS。
一开始设 −21 dB，静音窗实测只有 −44 dBFS，几乎听不见。现在说话时
BGM 恰在人声下约 17 dB。

## 素材库

`D:/@kaifa/BGM/` 14 个主题分类（乡村/人文/历史/史诗/埃及/宇宙/悬疑/战争/搞笑/未解/
自然/部落/非洲/阿拉伯），每期按选题匹配。`features.json` 里有每首的
时长/动态范围/低中高频能量占比，选曲先看这个再听。

## 逐镜音效写法（旧方案 `build_sfx.py`，与 `audio` 二选一）

```json
{
  "scene": "s09_ignite",
  "sfx": [{"name": "ignite", "offset": -0.1, "gain": -14.0}]
}
```

- `offset` 相对镜头起点，负值表示提前（音效要抢在画面前）。
- 一镜可多条，`build_sfx` 会叠在同一条床轨上。
- 名字必须在 `SYNTH` 里，否则脚本直接报错并列出可选值。

## 混音口径

| 项 | 值 |
|---|---|
| 积分响度 | −16.3 LUFS（门禁 −17.5 ~ −15.0） |
| 真峰值 | −1.5 dBTP（门禁 −3.0 ~ −0.3） |
| 采样率 | 48 kHz 双声道 AAC 192k |
| 音效床 | 峰值 0.5 → 再 −4 dB 混入 |
| 终混 | 人声 + 床 + BGM，超 0.98 时整体等比压回 |
