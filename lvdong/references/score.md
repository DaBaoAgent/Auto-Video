# 声音：`score.json` 是谱，`sound.py` 是乐器

一支片子的声音由三样东西拼出来：**旁白**（人声，只切不重录）、**配乐**（程序合成，跟着拍点走）、**foley**（水/风/石头/脚步，全部由代码合成）。三者最后由 `sound.py` 混成一条 `mix.wav`。

- 谱是数据：`projects/<name>/score.json`。改一支片子的音乐＝改这个 JSON，不改代码。
- 乐器是代码：`scripts/sound.py`。改音色＝改 `sound.py` 上半段的合成函数，不改谱。
- 两个都归你自己：`sound.py` 里的音色表（`kalimba / marimba / bass / wood / shaker / clap / chime / logdrum / splash / thump / drip / sweep / wind / pad`）就是这套风格的全部声音；这支片子只加了两种（`logdrum`、`chime` 的用法）。

## `score.json` 全部键

```jsonc
{
  "bpm": 90,                 // 一拍 = 60/bpm；段界、事件都按它算
  "duration": 58.0,          // 影片总长（秒）
  "voice_seconds": 54.30,    // 旁白用到第几秒（后面是静音）
  "voice_fade": 0.22,        // 旁白收尾淡出
  "seed": 20261115,          // 随机种子：噪声类音色每次渲染一致
  "levels": {
    "voice_rms": 0.115,      // 旁白归一到的 RMS（先归一再加音乐，配音大小不随音色变）
    "music": 0.85,           // 音乐总线增益
    "foley": 1.85,           // foley 总线增益
    "duck_music": 0.42,      // 旁白压音乐的深度
    "duck_foley": 0.30,      // 旁白压 foley 的深度
    "peak_ref": 1.0          // 归一化用的分位点：1.0=绝对峰值；0.999=忽略单个噪点
  },

  "chords": [                // 持续和弦（strings 只在这里出现）
    {"t0": 0.0, "t1": 10.0, "notes": ["D2","F2","A2"], "amp": 0.9}
  ],
  "bass": {                  // 每小节：第一拍根音、第三拍后半五度
    "from": 0.0, "to": 58.0,
    "skip": [[41.3, 45.5]],  // 这几段不弹（让位给画面）
    "gains": [0.28, 0.15]
  },
  "shaker": {"from": 10.0, "to": 53.3, "gain": 0.10, "gain_after": 25.0, "gain_late": 0.13, "pan": -0.35},
  "clap":   {"from": 21.3, "to": 45.4, "beats": [1, 3], "gain": 0.16},

  "melodies": [{             // 一串按拍走的音阶（"step":"beat" 一拍一个，"eighth" 半拍一个）
    "from": 33.34, "n": 7, "step": "beat", "voice": "kalimba", "octave": 1,
    "dur": 0.9, "gain": 0.30, "send": 0.45, "pan_fan": 0.12,
    "notes": ["D4","E4","G4","A4","C5","D5","E5"]
  }],
  "bursts": [{               // 一小簇：同一个音色连打三下（「想长大 / 缩回去」）
    "at": 41.40, "n": 3, "gap": 0.10, "voice": "kalimba", "gain": 0.22, "send": 0.50,
    "notes": ["D4","E4","G4"]
  }],
  "hits": [{                 // 单发重音（合并、冻结、落定）
    "at": 45.5, "voice": "chime", "note": "A4", "dur": 3.4, "gain": 0.32, "send": 0.55
  }],
  "silences": [[29.35, 30.60]],   // 音乐在此区间一刀切掉（只留水和风）

  "bed": {"cut": [180, 1400], "gain": 0.035, "lap_hz": 0.19},   // 全程水声底噪
  "foley": [                 // 逐条事件：(at, kind, 参数, gain, pan, send)
    {"at": 6.85, "kind": "splash", "dur": 0.38, "amp": 1.0, "gain": 0.40, "pan": -0.20},
    {"at": 31.50, "kind": "drip", "dur": 0.45, "amp": 1.0, "f0": 1300, "gain": 0.26, "pan": 0.20, "send": 0.50},
    {"at": 26.45, "kind": "sweep", "dur": 0.55, "f0": 3200, "f1": 900, "curve": 2.6, "band": 2200, "gain": 0.30, "pan": 0.18}
  ]
}
```

`note` 可以是音名（`D4`）也可以是赫兹数（`36.71`）。音名表在 `sound.py` 的 `NAMES` 里，缺的自己加。

## 一件声音怎么放进去

1. **先拿拍点**：`python scripts/lvdong.py beats <project>` 打出每小节四个拍的时间。段界、重音、冻结都取在这些时间上。
2. **写进谱**：单发的进 `hits`；成串的进 `melodies`；同一种音色按拍重复的进 `shaker`/`clap`/`bass` 这类"模式"；画面上的水/石/脚步进 `foley`。
3. **验**：`python scripts/lvdong.py sound <project>`，它会打印一行 `{"rms":..,"peak":..,"voice_db":..}`。人声在 −18~−19 dB、整条 mix 的峰值贴着 0.71（= 归一后 .95 过 tanh 的结果）时，说明音频链路正常。**电平不对先看 foley 有没有漏 `gain`**。
4. **听**：三条 stem（`stem_voice / stem_music / stem_foley`）单独听一遍，谁抢了就调那条的增益，别去动别的。

## 这一支片子的谱面结构（可当模板）

| 时间 | 音乐在做什么 | 为什么 |
|---|---|---|
| 0–10 | Dm 和弦床 + 低频水声，只有 4 次 splash | 「点名」阶段，留白 |
| 10–21.3 | 换 B♭ 和弦，shaker 进（八分音符） | 第二段「悬案」开始推进 |
| 21.3–25.3 | G 和弦、claps 上「2 和 4」，logdrum + 风 | 托管者到场 |
| 25.3–30.6 | 回到 B♭，四次 spade 甩泥（sweep+splash） | 怀疑落到实物 |
| 29.35–30.60 | **音乐一刀切**，只剩水与风 | 转折前的静默 |
| 33.34+ | kalimba 七音上行，一拍一个 | 七个符号被刻出来 |
| 36.0+ | 马林巴高八度答一遍 | 第二列 |
| 41.4/42.05/42.7 | 三次「想起来又缩回去」的 burst | 三次失败的变形 |
| 45.5 | 一个 unison 的 chime + 低 logdrum，strings 接管 | 合并 |
| 53.0 | thump + splash（石件落水） | 落定 |
| 53.40 | 冻结：一声 chime，只剩尾音 | 冻结 |
| 55.6 / 56.5 | 两下脚步（thump+splash，pan 跟着走） | 走进日轮 |

## 已知行为

- **归一化看峰值**：`levels.peak_ref = 1.0` 时整条 mix 由最响的那一个采样定标。噪声类音色（splash/sweep）的峰值在不同种子下会差几个 dB，于是同样的谱两次渲染电平可能差 1~1.5 dB。这支片子实测 +1.4 dB（相对旧版 `mix.py`），峰位一致（0.709），因为它不影响 mux 之后 −14 LUFS 的目标。**要绝对稳定就把 `peak_ref` 设 0.999。**
- **`silences` 只切音乐**，foley 和旁白照旧——静默要的是「只剩水声」。
- **`send` 是混响量**（合成 IR，2.2 s），只给金属和水滴这类需要尾巴的；木块、脚步不要给。
- 谱里的时间是**影片时间**，不是旁白时间；旁白缺句时字幕让位，音乐不补。
