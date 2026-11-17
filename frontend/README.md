# frontend · 可选前端闭环

一个选题，一条命令，走到能发的片子：

```
选题 → 文案 → 免费 TTS 配音（带 srt）→ 任意风格管线出片 → 封面 + 发布信息
 01      02           03                     04                05
```

这是 Auto-Video 33 条管线的**共同可选模块**。不接 `peiyin`（GPT-SoVITS 克隆音色）时，它就是那条最短路径：不用模型权重、不用起本机服务，装个 `edge-tts` 就能跑。

## 为什么单独拆出来

管线的下半段（画面、渲染、合成）各管各的，三条最容易卡住的地方其实都一样：**选题怎么落成稿、稿怎么变声音、声音怎么变成发布物料**。这三件事做成一件事，每条管线只负责它擅长的画面。

## 用

```powershell
python frontend/frontend.py check                                  # 自检
python frontend/frontend.py plan --pipeline laolang --topic "…"     # 看步骤
python frontend/frontend.py run  --pipeline laolang --topic "…" --title "…"
python frontend/frontend.py run  --pipeline laolang --topic "…" --title "…" --render-timeout 300
```

产物落在 `frontend/jobs/<日期-片名>/`，编号与阶段对齐：

```
01-选题.md / .json   02-文案.md / .txt   03-配音.mp3 + 03-字幕.srt + 03-配音.json
04-成片/（工程 + out/*.mp4 + 封面）或 04-交接包/
05-发布/（发布信息.txt + 封面提示词 / 封面成图）
06-交付清单.md
```

`run` 的退出码：`0` 全通；`2` 某阶段失败；`3` 缺依赖（如没装 `edge-tts` 又没 SAPI）；`4` 该管线只到交接包；`5` 渲染或发布没过门禁。

## 配音走哪条路

| 引擎 | 何时用 | 代价 |
| --- | --- | --- |
| `edge-tts` | 默认 | 联网，免费，带词级时间戳，直接出 srt |
| `Windows SAPI` | `edge-tts` 缺失或断网 | 离线，免费，无词级时间，按句长铺时间轴 |
| `--voice-file` | 已经有配音 | 只把现成音频与文稿配对 |

想用自己音色，就换 `peiyin` 模块；两者不叠加。

## 最后一道模块：fengmian

`05` 阶段一律调仓库里的 `fengmian/`（从 `DaBaoAgent/fengmian` 原样导入，见 `fengmian/VENDORED.md`）：输入字幕，输出

- `发布信息.txt`（两行制：标题 ≤25 字两段式 + 4 个话题，硬校验不过就非零退出）
- `源文件/封面提示词-4比3.txt`、`-3比4.txt`、`封面元信息.json`
- 有 `ARK_API_KEY` 时直接出 `封面-4比3.png`（2048×1536）/ `封面-3比4.png`（1536×2048）

## 接管哪条管线

`frontend/targets.json` 一张表说清楚，33 条逐条登记：

| 能力 | 管线 | 04 阶段做什么 |
| --- | --- | --- |
| 一条文案直接出片 | `laolang`、`map` | `new` → `vo` → `render`（模板按数据驱动，旁白几行都吃得下） |
| 建工程 + 灌文案配音，渲染归人 | `pencil`、`isometric`、`manga`、`tapestry`、`shadow`、`parable`、`goldenage`、`blueprint` | `new` → `vo`，然后在 `04-交接包/` 交文案 / 配音 / 字幕 + `04-下一步.md`：模板的 `index.html` 把 `s1…s8` 八个旁白行写死了，新稿段落数不同就会报 `timeline: narration line id "l2" not found`，改分幕再 `render` |
| 不自动接 | 其余 23 条 | 写 `reason`：要片源、要本地模型、要 key、要外部引擎，按各自 `SKILL.md` 手动接 |

补一条只改这个 JSON，不动代码。

## 两个已知的坑

- **渲染器可能不退出**：模板库 系的 `render.mjs` 把成片写完后，Chrome 子进程有时还占着管道，进程就一直挂着。`frontend.py` 带看门狗：成片落盘且体积 12 秒不再变化就判成功并结束进程树，最长等 `--render-timeout` 秒（默认 900）。日志里会留一行 `[watchdog]` 说明。
- **模板不是空白模板**：`pencil` 那 8 条的模板是某条具体片子的分幕，能直接吃任意文案的只有 `laolang`、`map`。想让它真出片，得先按新稿重写分幕——这一步 frontend 不替你做，但把材料都摆好了。

