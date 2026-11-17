---
name: frontend
description: Auto-Video 的可选前端闭环。当用户只有一个选题、想不接 peiyin 克隆音色就直接出片时使用：选题 → 文案 → 免费 TTS 配音（带 srt）→ 任意风格管线出片 → fengmian 出封面与发布信息。
---

# frontend · 可选前端闭环

## 这个模块是什么

33 条管线的**共同前端**：你给一个选题，它把「文案、配音、字幕」这三件最容易卡住的事做完，再把交接包塞进你选的那条风格管线，最后交给仓库里的 `fengmian` 出两张封面和两行制发布信息。

它和 `peiyin` 的关系是**二选一**：`peiyin` 用 GPT-SoVITS 克隆你本人的音色（要模型权重、要本机服务）；`frontend` 用免费 TTS，不挑环境，开箱就能跑。

## 一条命令

```powershell
# 自检（模块、fengmian、edge-tts、33 条管线覆盖）
python frontend/frontend.py check

# 看某条管线走这条闭环会做什么
python frontend/frontend.py plan --pipeline laolang --topic "玄奘为什么非要去天竺"

# 跑：选题 → 文案 → 配音 → 出片 → 封面/发布
python frontend/frontend.py run --pipeline laolang --topic "玄奘为什么非要去天竺" --title "玄奘西行"
```

跑完在 `frontend/jobs/<日期-片名>/` 里拿到：`01-选题.md`、`02-文案.md`、`03-配音.mp3`、`03-字幕.srt`、`04-成片/`、`05-发布/`、`06-交付清单.md`。

## 五个阶段

| 阶段 | 谁做 | 产物 | 说明 |
| --- | --- | --- | --- |
| 01 选题 | frontend | `01-选题.md` | 把选题落成「只讲一件事 + 3 个事实 + 一句收尾」的结构 |
| 02 文案 | frontend | `02-文案.md` | 给了 `--script` 就用你的稿；配了 `AV_LLM_BASE/AV_LLM_KEY/AV_LLM_MODEL` 就调本地模型写；都没有就出提示稿等人填 |
| 03 配音 | frontend | `03-配音.mp3` + `03-字幕.srt` | `edge-tts`（联网免费，带词级时间戳）优先；失败自动退 `Windows SAPI`（离线免费，按句长铺时间轴） |
| 04 渲染 | 你选的那条管线 | `04-成片/` 或 `04-交接包/` | 按 `frontend/targets.json` 声明的 `new / ingest / render` 命令跑；只声明到 `ingest` 的，出交接包 + `04-下一步.md` |
| 05 发布 | fengmian | `05-发布/发布信息.txt` + 两张封面提示词 | 有 `ARK_API_KEY` 顺手出图；没有就留提示词 |

## 02 阶段什么时候能自动写

```powershell
$env:AV_LLM_BASE="http://127.0.0.1:1234/v1"   # 任意 OpenAI 兼容端点（LM Studio / llama.cpp server / 本地网关）
$env:AV_LLM_KEY="sk-…"                        # 本地端点通常留空
$env:AV_LLM_MODEL="qwen2.5-7b-instruct"
```

没配也能用：给 `--script 稿子.md`，或者先让 Agent 照 `02-文案-待写.md` 的提纲写一版，再 `--job` 续跑。

## 04 阶段现在覆盖到哪

`frontend/targets.json` 逐条登记 33 条管线：

- **一条文案直接出片（2 条）**：`laolang`、`map` —— 模板按数据驱动，旁白几行都吃得下，`new → vo → render` 全自动；
- **建工程 + 灌文案配音，渲染归人（8 条）**：`pencil`、`isometric`、`manga`、`tapestry`、`shadow`、`parable`、`goldenage`、`blueprint` —— 模板的 `index.html` 把 `s('l1')…s('l8')` 八个旁白行写死了，新稿段落数不同就报 `timeline: narration line id "l2" not found`；frontend 做 `new → vo` 并把文案 / 配音 / 字幕放进 `04-交接包/`，附 `04-下一步.md`，改完分幕再 `render`；
- **不自动接（23 条）**：写了 `reason`（片源驱动、本地模型出画、要 key、要外部引擎），按各自 `SKILL.md` 手动接。

校验 `python tools/validate.py` 会打印「frontend 覆盖 33 条管线，可直接渲染 2 条」。要给某条管线补自动化，只改 `targets.json` 一行，不用动代码。

## 渲染器不退出怎么办

BB-Video 系的 `render.mjs` 成片写完以后，Chrome 子进程有时还占着管道，进程不退出。`frontend.py` 自带看门狗：成片落盘且体积 12 秒不再变化就判成功、结束进程树，日志里留一行 `[watchdog]`；上限由 `--render-timeout` 控制（默认 900 秒）。

## 产物去向

`frontend/jobs/` 不进仓库（`.gitignore` 已挡）；出了要交付的片子，按各管线自己的交付规则把成片与封面移出去，别把中间产物留在交付根。
