# 迁移说明 · laolang（上海美影手绘赛璐璐）

## 来源

- 风格运行时：`BB-Video/skills/bb-video/promo/runtime/laolang.js`（冻结版：`styles/laolang/toon-cast/archive/v20261110_stable/laolang.js`）
- 底层投影：`BB-Video/skills/bb-video/promo/runtime/goldenage.js`（冻结版：`toon-cast/archive/v20261110_stable/goldenage.js`，关闭 gate weave / 静态颗粒 / 去逐帧灰尘）
- 共享运行时：`BB-Video/skills/bb-video/core/runtime/core.js`、`BB-Video/skills/bb-video/promo/runtime/promo.js`
- 标准动作：`BB-Video/skills/bb-video/promo/runtime/act.js`
- 定稿人物：`BB-Video/skills/bb-video/styles/laolang/toon-cast/`
  - `lao_body.ts` / `toon.ts` / `lao_cast.js` / `lao_cast_full.js` / `lao_poses.js` / `build_toon.py` / `lib/toon.js`
  - 冻结快照：`archive/v20261110_stable/`（页面、`goldenage.js`、`laolang.js`、`lao_body.ts`、`lao_poses.js`、`lao_cast_full.js`、`toon.ts`、`lib/toon.js`、`STABLE_SPEC.md`、`MANIFEST.sha256`）
- 眨眼/绘制入口：`BB-Video/work/xz-film-60/lib/cast-lite.js`
- 样片工程：`BB-Video/work/xz-film-60/` → `template/`
  - `index.html`（62.2 s 全片页面，与冻结快照逐字节一致）
  - `timeline.js` / `timeline.json`（19 句词级时间轴）
  - `brief.md`（事实与文案）、`sound.js`（音效）
  - `script.json`（`bgm:false`）
  - `lib/story.js`（SHOTS + cue + win，项目专属）
- 配乐（可选）：`BB-Video/work/xz-laolang/score.js`（竹笛/琵琶/低音/木鱼/小锣，五声音阶 G 宫，84 BPM）
- 风格规范：`BB-Video/skills/bb-video/styles/laolang/STYLE.md` → `references/style.md`
- 人物参数：`BB-Video/skills/bb-video/styles/laolang/CHARACTERS.md` → `references/characters.md`
- 动作集：`BB-Video/skills/bb-video/styles/laolang/ACTIONS.md` → `references/actions.md`
- 样片方法：`BB-Video/skills/bb-video/styles/laolang/PRODUCTION.md` → `references/production.md`
- 渲染链：`BB-Video/skills/bb-video/core/scripts/{render,music,bgm,sound,lang,net}.mjs`、`scores/*.mjs`（经 shadow 管线 vendored 版本）
- 编排脚本：以 `shadow/scripts/shadow.py` 为基底改写为 `laolang/scripts/laolang.py`；`make_vo.py` 为通用配音对齐脚本
- 成片：`出稿/018_玄奘/26_60秒样片_统一景别_稳定版/`（本地归档，未入库）

## 入库内容

- `runtime/`：BB-Video MIT 代码的逐字副本（`LICENSE.BB-Video` 随附）；其中 `goldenage.js` / `laolang.js` / `toon.js` 是 60 秒样片冻结版。
- `scripts/`：本管线新增的编排脚本 `laolang.py`（new / vo / check / stills / render / probe / qa / short-qa / deliver），以及 `make_vo.py`、`short_qa.py`。
- `references/`：风格规范、人物定稿参数、24 动作集、60 秒样片方法、分镜模板、验收清单。
- `toon-cast/`：人物/动作源码、构建脚本、冻结快照与 `MANIFEST.sha256`。
- `template/`：玄奘 60 秒样片工程；**不包含** `audio/`、`out/`、`review/`、`lib/` 中的运行时副本（模板只保留 `lib/story.js` 一个项目专属文件）。

## 不入库

- 配音 `audio/narration.m4a` / `.wav`、成片 `out/*.mp4`、抽帧 `review/*.png`、工程内 `lib/` 运行时副本（由 `scripts/laolang.py new` 生成）。
- 人物设定图、成片、封面的原图（在作者本地 `出稿/018_玄奘/` 归档）。
- 字体：stable 页面不使用 CDN 字体；渲染时回退本机 Ma Shan Zheng / Noto Serif SC / KaiTi / SimSun。

## 更新方式

BB-Video 的运行时或人物库更新后：

1. 重新复制 `runtime/` 对应文件；若人物/动作有改动，先新建 `toon-cast/archive/vYYYYMMDD/` 快照并更新 `MANIFEST.sha256`。
2. 跑一遍：

```bash
python scripts/laolang.py new <临时工程>
python scripts/laolang.py check <临时工程>
python scripts/laolang.py stills <临时工程> --times 2,8,15,25
```

3. `--check` 0 error、抽帧与样片视觉一致，才算同步完成。
4. **任何人物比例/发型/脸型/手臂结构改动，必须先出新设定图给用户审核**（见 `pipeline.json` 的 `frozen.rule`）。

## 与 shadow / blueprint 的关系

三条都是 BB-Video 风格运行时迁移过来的管线，目录结构一致，但引擎不同：

- `shadow`：透光牛皮影人 + 操纵杆 + 灯暗换场
- `blueprint`：蓝晒工程图 + 构造线 + 真实啮合机构
- `laolang`：手绘赛璐璐 + 装饰绘景 + 4:3 片门 + 定稿 toon 人物 + 24 动作 + 现成配音
