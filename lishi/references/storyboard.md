# storyboard.json —— 分镜表

`lishi.py shots` 的唯一输入（配 `narration.json`）。它是这一集的"导演稿"：
每镜用哪张卡、写什么、配哪张底图、占几句词。

## 顶层字段

```jsonc
{
  "meta": {
    "slug": "004_xxx",           // 工程名
    "title": "xxx·yyy",           // 片名（也是成片文件名）
    "theme": "paper",             // 纸本主题；绢本重彩也用 paper + 朱砂锁
    "accentLock": true,           // 锁朱砂
    "fps": 30,
    "width": 1920, "height": 1080,
    "caption_size": 60,           // 字幕字号
    "caption_offset": 112,        // 字幕底距
    "narration": "narration.mp3"
  },

  "backgrounds": {                // 底图池：key → 文件与强度
    "b14_emperor": {"src": "bg/b14_emperor.png"}
  },
  "crowded": ["b06_court_bow"],   // 人群类底图，自动压到 0.44，避免抢字

  "ornament": {                   // 纸面装饰层（不写则不渲染）
    "railL": ["太常寺志卷三", "享祭位列諸妃之上"],   // 最多 4 列
    "railR": ["成祖居第四靖難兵起"],                 // 最多 2 列
    "year": "洪武三十一年",
    "place": "南京",
    "sealL": "太常", "sealR": "卷三",               // 角章，各 2 字
    "header": "南 京 太 常 寺 志 · 卷 三",           // 巨字卡上方小字
    "footer": "卷三 · 祭祀",                        // 卷轴卡下方小字
    "splatterAt": [1144, 369]                      // 名卡印泥飞溅中心
  },

  "oldfilm": {"scratch": 3, "dust": 22, "warm": 1, "vignette": 0.4},

  "audio_plan": {
    "risers": [11, 44],                            // 两次大转折，加低频堆起
    "key": {"1": "open", "3": "name", "11": "turn"}  // 镜号 → 音效类型
  },

  "shots": [ /* 见下 */ ]
}
```

## shots 每一条

```jsonc
{
  "card": "numcard",           // bookcard / sealcard / numcard / signcard
  "content": {"big": "正统", "note": "抢来的皇位，最怕这两个字", "seal": "疑"},
  "bg": "b05_throne",          // backgrounds 里的 key；不给则该镜只有纸底
  "count": 2                   // 这一镜占几句从句（关键字段）
}
```

### `count` 怎么定

`count` 是这一镜覆盖的从句数，不是时长。写法：

1. 先看 `narration.json` 的从句列表（一句一行，按标点切过）
2. 把从句按**语义单元**分给镜头：一个转折 / 一个名字 / 一个动作 = 一镜
3. 每镜 2–4 秒为佳，对应 1–3 句（中文约 6 字/秒，一句 8–15 字 ≈ 1.3–2.5 秒）
4. 总 `count` 必须等于从句总数，否则 `build_shots.py` 会报错并告诉你差多少

**不要按秒攒镜**。E3 重配一次（145.6s → 144.9s），按秒攒会让 18/53 镜的台词错位一句，
卡片和底图全部配错。

### 也可以精确指定

```jsonc
{"card": "sealcard", "content": {...}, "lines": [12, 13]}
```

`lines` 是从句索引（0 基，含端点）。适合改稿后只动某几镜的情况——
必须与上一镜结尾连续，否则报错。

### 四张卡的 content 槽

| card | content | 用途 |
|---|---|---|
| `bookcard` | `{mode, quote, source}`，mode = `quote` / `scroll` | 引文、档案原文、诏书 |
| `sealcard` | `{name, note, seal}` | 人名砸印（第一次/最后一次出现） |
| `numcard` | `{big, note, seal}` | 巨字结论、数字、判断 |
| `signcard` | `{name, label}` | 落款 |

卡片的默认占位是空的（历史版本曾把上一集的台词写死进去，跨项目复用时露馅）。

## 底图怎么配

- 一张图可以用多次，但**同向横移不要连续超过两镜**，否则能看出是同一张
- 人群类（朝堂、百官）必须进 `crowded`，否则字被压
- 底图 prompt 必写 `NOT a photograph, NOT a 3D render`，否则跑成摄影质感
- 生成后统一处理：去水印 → 补 16:9 → 纸白归一（见 `pipeline.json` 的 `backgrounds.post`）

## 检查

```bash
python lishi/scripts/lishi.py probe --project <slug>
```

会打印镜数、字幕条数、总时长、平均镜长，并标出短于 1 秒或长于 6 秒的镜。
