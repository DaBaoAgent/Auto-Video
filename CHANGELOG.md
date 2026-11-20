# 更新日志

版本口径：`MAJOR.MINOR.PATCH`。管线数量、契约字段这类会打断已有工程的变化走 MINOR；只修 bug 走 PATCH。

## v1.4.0 · 2026-11-20

管线 155 → 166，站点上 165 条有可播片子；这一版同时把门面（README / About / 站点计数）和 CI 恢复到「新人第一次打开就能判断这是什么」。

### 新增

- **11 条管线**
  - anidoodle 6 条自研画法：`tanbi` 炭笔擦画 / `youcai` 梦境釉彩 / `cixiu` 刺绣 / `minjian` 民间故事绘本 / `diduo` 低多边形 / `yuanzhu` 圆珠笔；
  - mg 4 条：`pintie` 拼贴剪贴 / `yetai` 液态流动 / `xingbian` 形变动画 / `huazi` 综艺花字；
  - `qianhuang2` 铅黄剪影：全黑人物 + 双缘光 + 光池舞台，`STAGE_Y=872`、头顶压中线 540±40。
- **站点样片换代**：`site/media/` 换成仓库自渲的 10 秒风格段（163 段），另有两段取完整成片片头（22 s / 30 s）；
  165 张卡有片子可播，只剩 `peiyin`（配音前端，不出片）。

### 变更

- **README 重写**：592 行 / 48 KB → 311 行 / 20.5 KB。首屏 = 一句话定位 + 徽章 + 8 秒 teaser + `python demo/run.py` / `docker compose run --rm demo`；
  工位表压成 11 行，完整清单交给 `docs/pipelines.md`；删除更新日志块、50 行样片表与内部路径。
- **新增 `README-en.md`**（216 行），两份 README 顶栏互相切换。
- **About 重写**：描述由「33 条 / 32 条可直接出片」改成 165 + 1 双语定位；topics 换掉 4 个过时项，
  补 `deterministic-rendering`、`procedural-animation`、`motion-graphics`、`threejs`、`animation`。
- **`docs/pipelines.md` 生成器**：工位名与编号改从 `catalog/stations.json` 取（修 04 / 07 因 id 写成 `cartoon` / `space` 而掉进「99 其它」），
  样片列合并 `site/assets/samples.json`，无原片登记的显示 `10s（切片）`；口径变为 165 live / 0 待补。
- **`site/index.html` 计数**：154 / 155 / 146 三处写死数字改成 165 / 166 / 165，并重跑 `build_site.py`（`qianhuang2` 之前漏卡）。

### 修复

- `tools/normalize_pipelines.py`：f-string 里嵌套同引号只有 3.12+ 允许，CI 的 3.11 直接语法失败；改为先算变量。
- `tools/sync_runtime.py`：只把**持有 `runtime/core.js`** 的管线算作共享运行时参与者（47 条自包含管线不再被误判为「文件缺失」）；
  比对改按内容、忽略 CRLF / LF，修掉 10 条模板管线因换行差异长期报「漂移」。

### 验证

- `validate.py` → `OK 契约一致`（166 条 / 11 工位 / 147 条登记原片）；`check_links.py` → `OK`；`check_syntax.py` 在 Python 3.11 下 `失败 0 个`。
- GitHub Actions：`contract` 与 `site`（Pages）均通过；线上站点 kicker 显示 `166 条管线 · 11 个工位`。

## v1.3.1 · 2026-11-20

31 条 huashu 管线从「共享 vendor 引擎 + 薄入口」改成**自包含封装**：运行时不依赖上游仓库，也不再有
`vendor/huashu-art-motion`。

### 变更

- **每条管线自带 runtime**：`runtime/render.py`（自研画帧器：本地静态服务 + Chromium 逐帧 +
  image2pipe 进 ffmpeg）、`runtime/stage.html`、`runtime/player.js`（自研舞台与 `renderAt(t)` 协议）、
  `runtime/scene.js`（画法脚本，MIT 移植并注明来源）、`runtime/lib/`（只带该场景用到的库与字体子集）。
- **入口改写**：`scripts/<id>.py` 只拼参数并调本地 `runtime/render.py --scene <id>`，不再出现
  `--film gallery`、`--solo` 这类上游参数，也不读 `vendor/`。
- **目录瘦身**：删除 `vendor/huashu-art-motion`（约 18 MB）与一次性导入脚本 `tools/import_huashu_styles.py`；
  新增 `tools/package_huashu_runtimes.py` 记录打包口径。
- **口径更新**：`catalog` 的 `engine` 改为「自研封装 · 本地 runtime（Canvas 2D 逐帧）」；`pipeline.json`
  记 `runtime / stage / player / drawing_script / self_contained`；README、`docs/huashu接入记录.md` 同步。
- **自研边界**：画帧器、舞台、播放协议、入口、参数与文档自研；画法脚本与绘制库按 MIT 移植，字体为
  SIL OFL 1.1 子集，全部内联在管线内。

### 验证

- `dongxue` / `kelimu`（中文字体）/ `pikesi`（Three.js）抽帧通过；31 条逐条抽帧见 `docs/huashu接入记录.md`。
- `validate` 155 条契约一致、`check_links` 全部存在。

## v1.3.0 · 2026-11-20

把 [huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion) v1.3.1 的 53 张风格配方逐条过了一遍：
去掉 12 条同族等价、10 条同族变体，接进 31 条；引擎 vendored 进仓库，入口不再依赖外部 checkout。

### 新增

- **31 条管线**：23 条实做（`dongxue` `aiji` `xila` `pangbei` `wenyi` `yinxiang` `fangao` `muxia` `liti2`
  `guangzhui` `kelimu` `mengke` `dunhuang` `caojian` `dali` `huopu` `jibuli` `xiula` `madisi` `halin`
  `lunbo` `xinhai` `bijia`）+ 8 条研究配方（`guaerdi` `luolun` `keer` `gaogeng` `xiajia` `bosi` `nanfang` `pikesi`）。
  id 按仓库传统取中文名双拼，撞车只有 `liti2`（`liti` 是纸片立体书）。
- **`vendor/huashu-art-motion/engine/`**：场景 01–55、转场库、绘画/骨架/相机/图表库、字体（SIL OFL）；
  全仓库共享一份，入口统一 `python pipelines/<id>/scripts/<id>.py --stills ... / --seconds ...`。
- **`tools/huashu_style_map.json`**：53 张配方逐条记 `import / equivalent / family`，是这批管线的唯一事实来源。
- **`tools/import_huashu_styles.py`**：按处置表落地目录、文档、catalog、frontend targets、站点样片，可重跑。
- **`docs/huashu接入记录.md`**：计数、31 条清单、12 条等价与 10 条同族变体的理由、样片与许可说明。

### 变更

- `catalog/pipelines.json` 124 → 155 条；站点 155 张卡 / 146 支可播样片；README 与站点计数同步。
- 23 条实做样片取自上游 Release 的 `art-motion-35-styles.mp4`，按段切（≈1.17 s/段）进 `site/media/`；
  8 条研究配方上游没有成片，只取原型单帧作封面，卡片标「研究配方」。
- `frontend/targets.json` 补齐 31 条：`render: null` + 单风格段交接理由。

### 不入库

- 上游 `demos/`（含花叔角色帧，不随 MIT 授权）、`reference_films/`、Clawd 素材、总览图与示范视频。
- 本批未接 9 种解说语法：它们是「怎么讲」的语法不是「怎么画」的风格，且主要交付形态已有对应管线。

## v1.2.0 · 2026-11-20

两件事同时落地：77 条管线从「转调外部 `build.sh`」改成**仓库内自研渲染**；6 条管线从「登记 + 外部复现」转成**本地运行时封装**。两边都不再依赖外部 checkout，本地能自己出帧。

### 新增

- **`vendor/runtime/stylekit.js`**：自研 Canvas2D 绘制内核，14 个风格族（刻印 / 网点 / 霓虹 / 屏幕 /
  像素 / 立体 / 图纸 / 地图 / 摄影 / 纸艺 / 板写 / 平面 / 赛璐珞 / 场），含纸纹、排线、半调网点、
  一位抖动、加色发光、扫描线、等轴测投影、图纸网格与限色后处理等原语。
- **`vendor/runtime/style-frames.mjs`**：通用抓帧器（puppeteer-core + 本机 Edge headless），
  页面协议 `window.__ready` / `window.renderAt(t)`。
- **`tools/av_style.py`**：77 条共用的命令行入口实现（`--check / --plan / --stills / --render / --frames-only / --mp4`）。
- **`tools/gen_style_projects.py`**：按 id 播种生成/重写 77 套 `projects/demo`（`index.html` + `main.js`）。

### 变更（77 条自研内核渲染）

- 77 条 `scripts/<id>.py` 改为转调 `av_style.main`；`pipeline.json` 补 `spec.style{family,palette,kit,harness,project}`。
- 77 条 `SKILL.md` / `README.md` 改写为「自己画」的口径；`catalog` 的 `engine` 按真实风格族写成
  `自研渲染 · vendor/runtime/stylekit.js（族名）`，`frontend/targets.json` 的 `reason` 不再写「上游复现」。
- 演示站卡片短片暂为早期外部样片，本地可用 `--render` 出自己的帧。

### 变更（6 条本地运行时封装）

- **6 条管线自包含**：`liaotian` / `keli` / `andiao` / `xuanyi` / `oupu` / `yugao` 各补
  `runtime/`（共享 `core.js` + `promo.js` + 风格 `<slug>.js` + `render.mjs` 等）、
  `template/`（起步工程）、`references/`（风格规范原文）与 `MIGRATION.md`。
- **入口改写**：每条管线统一的 `new → check → stills → render → probe → qa → deliver` 七动作，
  渲染只调本地 `runtime/render.mjs`；`new` 把 runtime 复制进工程 `lib/`。
- **QA 口径**：promo 默认 −14 LUFS；`andiao` / `yugao` 暗调片按 −16 LUFS，并允许长黑场。
- **文档**：[`docs/风格集接入记录.md`](docs/风格集接入记录.md) 补“封装内容”与本地复现命令；
  README 的 6 条说明从“登记 + 外部复现”改为“本地运行时封装”。
- **验证**：6 条 `--check` 均 0 error；各出 12–34 s 本地成片（960×540，AAC），`qa` 全 OK。

## v1.1.0 · 2026-11-19

37 个候选画法逐条对照后，只接入 6 条真正缺的画法；其余 9 条已迁移、22 条同族等价，不重复登记。

### 新增

- **6 条管线**：`liaotian`（chat 聊天叙事）、`keli`（grain 扁平颗粒插画）、
  `andiao`（lumen 暗调励志）、`xuanyi`（mystery 悬疑探秘）、`oupu`（op 欧普艺术）、
  `yugao`（trailer 电影预告）。入口统一走本地编排脚本（v1.2.0 起只调 `runtime/render.mjs`）。
- **处置表**：[`tools/legacy_style_map.json`](tools/legacy_style_map.json)，37 个风格逐条记
  `already` / `equivalent` / `import`；接入说明见
  [`docs/风格集接入记录.md`](docs/风格集接入记录.md)。

- **演示站**：6 条先用外部 1080p 外链，封面从同片第 3.2 秒抽帧存
  `site/media/<id>.jpg`；等本地工程渲完再换自研成片。

## v1.0.0 · 2026-11-17

第一个可交付版本：33 条管线、11 个工位、32 条带样片，契约校验通过。

### 新增

- **一键 demo**：`python demo/run.py` / `docker compose run --rm demo`，不需要配音、模型或云端 API，出 15 秒片。
- **数据驱动分幕**：`vendor/runtime/autoscene.js`。8 条模板库派生模板（pencil / isometric /
  manga / tapestry / shadow / parable / goldenage / blueprint）不再写死 8 句旁白，稿子几行都能渲。
- **共享运行时单一源**：`vendor/runtime/`，`tools/sync_runtime.py` 负责下发与漂移校验。
- **去掉遗留品牌目录**：原带品牌前缀的 `vendor/<brand>/runtime/` 改为 `vendor/runtime/`，`render-mg.mjs` 改为
  `render-cdp.mjs`，样式包目录统一叫 `styles/`。环境变量前缀随之统一：`BV_*` / `MG_*` → `AV_*`
  （`AV_LANG`、`AV_CDP_TIMEOUT`、`AV_FRAME_TIMEOUT`、`AV_CHROME`、`AV_SITE`、`AV_VENDOR`、`AV_FONT_KAI`、`AV_FONT_DIR`）。
  旧变量名不再读取，自己脚本里写过的请一并改。版权与许可出处只保留在 `THIRD_PARTY_NOTICES.md`
  与 `vendor/runtime/LICENSE-upstream`（MIT 要求保留版权声明）。
- **贡献漏斗**：`CONTRIBUTING.md`、`CODE_OF_CONDUCT.md`、`SECURITY.md`、issue 表单与 PR 模板。
- **管线清单**：[docs/pipelines.md](docs/pipelines.md)，从 `catalog/pipelines.json` 生成，不再手写。

### 修复

- **渲染器不再留孤儿 Chrome**：`render.mjs` 在 Windows 上按进程树回收（`taskkill /T`），退出前显式
  `process.exit`，CDP 请求加超时。片出来，进程就退。
- **封面/联系表截图卡死**：PNG 截图不再无限等待（见下条已知问题）。
- **`.gitignore` / `.gitattributes`**：样片原片、审片目录、预览 GIF 不再进仓库；二进制与 LFS 规则补齐。

### 已知问题

- 体积：`.git` 已从 662 MB 重写为 322 MB（剔除 `showcase/`、工程产物视频与站点样片的 256 个历史旧版本），
  代价是**所有 commit hash 变化、旧 clone 作废**。剩余体积主要是字体 52 MB 与站点样片 101 MB，见
  [docs/素材与体积.md](docs/素材与体积.md)。
- 41 个脚本仍带硬编码盘符路径（`D:\…`、`C:\Users\…`），需要逐个改成环境变量。
- 8 条模板的「片头卡 + 卡片」是保底排版，不是原来样片的手绘美术；要那种画面仍走 `projects/` 里的手写工程。
- `frontend/targets.json` 里仍只有部分管线开了 render（原「只能出片 2/33」的现场问题）。
