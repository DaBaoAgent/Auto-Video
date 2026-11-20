# 样片审查与迭代 · 交接文档

> 给接手的 codex：这份文档是 2026-11-20 那一轮的完整现场。仓库 `D:\@kaifa\Auto-Video`，分支 `main`，远端 `https://github.com/DaBaoAgent/Auto-Video.git`。
> 上一轮已落地并推送的提交：`5e342b4`（yetai 重出）、`08984da`（全站封面重挑 + 三条样片迭代）。

---

## 0. 一句话背景

演示站 `site/` 有 165 条管线、164 条样片。样片来自三个来源：本仓库 code 自渲（41 条带 `runtime/scene.js`）、上游模板出的片子（124 条）、少量实拍/混剪。这一轮做的事是：全量审查 → 换封面选帧算法 → 把能重渲的样片按各自画法重做。剩下的坑都在第 9 节 backlog 里。

---

## 1. 不可动摇的制作原则（用户硬性偏好）

1. **画面必须代码绘制**。禁止调用内置 AI 生图（除 `fengmian` 封面项目），像素/插画/分镜一律 canvas 或 SVG 算出来。
2. **样片不留白开场**，第 0 帧就要有笔触/主体/墨点，不能是一张空纸等落笔。
3. **每条样片都配 BGM**，曲库在 `D:\@kaifa\@\BGM`（另有 `D:\@kaifa\@\@风格动画BGM`）。母版不带音乐，站点版才混音。
4. **不能和上游样片雷同**。题材要按本管线画法的强项重写，不是把上游那条换个色。
5. **站点样式**：`badge` 写 `10 秒样片 · 自渲`，`source` 写明"本仓库 runtime 自渲（10 s，题材与画法均为本仓库重写）"，别照抄上游来源。
6. 交付目录只放最终交付物，中间产物（抽帧、母版、临时脚本）放 `review/` 下，别落到 `site/` 根或仓库根。

---

## 2. 目录与关键文件

```
pipelines/<id>/                 165 条管线
  ├─ pipeline.json              元数据（id / 别名 / 工位 / 风格）
  ├─ SKILL.md README.md CREDITS.md MIGRATION.md references/style.md
  ├─ scripts/<id>.py            出片入口（内部调 runtime/render.py）
  └─ runtime/                   ← 只有 41 条有这一层
      ├─ render.py              无头渲染：起 playwright 播 scene.js 逐帧截图给 ffmpeg
      ├─ stage.html / player.js
      ├─ lib/util.js            U 工具库（rng/clamp/lerp/p/easeOut/easeInOut/noise/tracePartial/paper…）
      └─ scene.js               画法脚本，入口 window.SCENES.<id> = { init, draw(ctx, t) }

site/
  ├─ media/<id>.mp4 / .jpg      站点样片与封面（16:9 多为 1024×576，竖屏 576×1024）
  ├─ assets/samples.json        样片清单（这份是唯一事实来源）
  ├─ assets/data.js             build_site.py 产物，不要手改
  └─ index.html / app.js

tools/
  ├─ sample_audit.py            ★ 全量审查：逐条抽 7 帧算亮度/对比/色彩/边缘/唯一色，检测空开场与封面撞车
  ├─ poster_appeal.py           ★ 封面选帧：45%–90% 区间按"完成度"打分重出 jpg
  ├─ audit_sheets.py            ★ 出封面墙（4 张 6 列缩略图），人工复核用
  ├─ poster_overrides.json      人工钉帧表，优先级最高（按 clip 内秒数）
  ├─ anidoodle_samples.py       6 条 anidoodle 样片打包（PLAN 表含 content/poster/bgm/music_at）
  ├─ mg_styles_selfsamples.py   4 条 mg-styles 样片打包（同上结构）
  ├─ build_samples.py           历史工具：切 10s + 按运动选帧（选帧逻辑已被 poster_appeal 取代）
  ├─ normalize_pipelines.py / build_pipeline_doc.py / build_site.py / validate.py / check_links.py / check_syntax.py

review/                        所有中间产物（audit.json、thumbs、strips、母版 mp4、抽帧 png）
```

---

## 3. 现状数字（交接基线）

- 管线 165，样片 164（`peiyin` 只有封面、`tianshu` 无 mp4）。
- 有 `runtime/scene.js`、可真正重渲的 41 条：
  `aiji bijia bosi caojian cixiu dali diduo dongxue dunhuang fangao gaogeng guaerdi guangzhui halin huazi huopu jibuli keer kelimu liti2 lunbo luolun madisi mengke minjian muxia nanfang pangbei pikesi pintie tanbi wenyi xiajia xila xingbian xinhai xiula yetai yinxiang youcai yuanzhu`
- 开场近空白（首帧对比 <12 或唯一色 <12）的 65 条：
  `shuimo xianshiqi map blueprint daoshu diaocha zhanshu baozhuang youhua yibi baiban heiban biji make jianzhi boli jinbo kongban wangdian muke tongban siyin guaban bopu fugu ruishi jiandie xiangxing baohao wenzi xinxi chaijie poumian jixie shuoming bishi liushui xianwei jianbao anjian weiyou fabu zhuomian biaoge dianlu yinghuo liuchang shibo nihong jimu yizhou labi2 weixing cehui shuju shiwu dietie liaotian keli yugao tanbi youcai cixiu minjian yuanzhu`
- 上一轮封面重挑：150 张，中位边缘密度 6.35 → 7.15（+13%），60 条属明显改善；4 张改走人工钉帧（`huixingzhen 1.0`、`yuanzhu 8.6`、`baiban 6.0`、`biji 6.0`）。
- 已知撞脸家族（同一套占位构图，不同配色）：
  - 小楼剖面线稿族：`xinxi shuoming jianbao bishi poumian chaijie jixie liushui xianwei zhanshu dianlu blueprint`
  - 树影/风车剪影族：`jiaoxiang leida dangan mengtai zhike`
  - 荧光笔白纸族：`baiban biji make yibi`
  - 静物罐子族：`youhua` 与 `youcai` 早期版本接近（`youcai` 已在 `08984da` 改掉）

---

## 4. samples.json 契约（改之前先读懂）

`schema: auto-video/samples@1`，核心字段：

| 字段 | 说明 |
| --- | --- |
| `key` | 管线 id，与 `pipelines/<id>` 同名 |
| `mp4` / `poster` | 站内相对路径，形如 `media/<id>.mp4` |
| `width/height/aspect` | 16:9 = 1024×576；竖屏 = 576×1024 且 `aspect: "9:16"`（卡片靠 `app.js` 的 `it.aspect === "9:16"` 加 `.shot.portrait`） |
| `clip_seconds` / `seconds` / `duration` | 样片时长，统一 10.0（`duration` 展示用 `0:10`） |
| `poster_pick` | `{ by, note, seconds }`；`by` 取 `appeal-complete / manual-override / fixed / max-motion+edge` |
| `badge` | 自渲写 `10 秒样片 · 自渲` |
| `music` | 所用 BGM 的 stem（不含扩展名） |
| `source` | 来源说明，自渲要写明 runtime |

改完必须跑 `normalize_pipelines.py → build_pipeline_doc.py → build_site.py → validate.py`，`frontend/targets.json` 里没有条目会直接报"未覆盖管线"。

---

## 5. 标准作业流程（五步）

### 第 1 步：审查
```powershell
cd D:\@kaifa\Auto-Video
uv run --with numpy --with pillow python tools\sample_audit.py
uv run --with pillow python tools\audit_sheets.py
```
产物：`review/audit/audit.json`（逐条 7 帧指标 + `open_flat` 标记 + 封面 dhash 撞车对）、`review/audit/posters_all_1..4.jpg`（封面墙，直接看图复核）。

### 第 2 步：换封面
```powershell
uv run --with numpy --with pillow python tools\poster_appeal.py            # 全部（跳过钉帧表里的 key）
uv run --with numpy --with pillow python tools\poster_appeal.py <id> <id>  # 只挑指定几条
```
算法：只取 45%–90% 区间；排除 YAVG>232 / <20 与边缘低于全片中位 0.75 倍的帧；打分 = 0.52·z(边缘平滑) + 0.30·z(饱和度平滑) + 0.18·亮度居中度。
取舍原则：宁可"画完了的一张安静画面"，也不要"动作最猛但半张脸/糊掉"的帧。

人工兜底：往 `tools/poster_overrides.json` 的 `by_key` 加 `{ "seconds": x, "note": "为什么" }`（秒数是 clip 内秒数，不是母版秒数），再单独用 ffmpeg 重出那张 jpg 并把 `poster_pick` 写成 `by: "manual-override"`。

### 第 3 步：重渲样片（仅 41 条可做）
单条验证出帧（不用等整条渲染）：
```powershell
python pipelines\<id>\scripts\<id>.py --out review\audit\<id> --stills 0.1,4.6,8.6 --seconds 10
```
再 Read 那几张 PNG 肉眼过。样片打包：
```powershell
python tools\anidoodle_samples.py --only <id>        # anidoodle 六条 + PLAN 表
python tools\mg_styles_selfsamples.py --only <id>    # mg 四条
```
两者都会：出 1920×1080 母版（huazi 为 1080×1920）→ 压站点规格（1024×576 / 576×1024，crf30，10.000s）→ 混 BGM（`loudnorm=I=-23:TP=-2:LRA=11`，0.9s 淡入 / 1.0s 淡出）→ 抽封面 → upsert samples.json。

### 第 4 步：校验
```powershell
python tools\normalize_pipelines.py
python tools\build_pipeline_doc.py
python tools\build_site.py          # 期望：11 工位 / 165 管线 / 165 卡 / 164 带样片
python tools\validate.py            # 期望：OK 契约一致
python tools\check_links.py         # 期望：引用全部存在
python tools\check_syntax.py        # 期望：0 失败（当前 420 文件）
ffprobe -v error -show_entries format=duration -of csv=p=0 site\media\<id>.mp4   # 必须 10.000000
```

### 第 5 步：提交推送
```powershell
git add -A
git commit -m "站点样片：<一句话>"
$env:GIT_LFS_SKIP_PUSH='1'          # 仓库里只有一条无关 LFS 文件，LFS 锁校验会把 push 拖死
git push origin main
```
GitHub 在这台机器上 443 会周期性 reset。push 失败不是代码问题：等 20–60 秒重试，最多试 8 次。别为了绕道去改远端、加 SSH key——上一轮临时加过，用完已删。

---

## 6. 写一个新 scene.js 的最小规范

```js
(() => {
  const W = 1920, H = 1080;            // 竖屏写 1080×1920
  window.SCENES.<id> = {
    init: async () => {},
    draw(ctx, t) {                     // t 为秒，0 起；会被 --retime 拉伸
      // 第 0 帧就要有主体，不要留白
    },
  };
})();
```
- 可用工具全在 `runtime/lib/util.js`：`U.W/U.H`、`U.rng(seed)`、`U.hash`、`U.clamp`、`U.lerp`、`U.p(t,start,dur)`、`U.easeOut/easeInOut/smooth`、`U.noise`、`U.tracePartial(ctx, pts, k)`、`U.rgba`、`U.paper`、`U.softShadow`。
- 时长不够就拉长：`render.py --retime <content/seconds>` 把 content 秒的内容铺满目标时长（注意：retime 会等比放慢，后段元素出现时间也同比后移，封面秒数要跟着算）。
- 常用尺寸约定：母版 1920×1080 / 24fps / crf18；站点版 1024×576 / 30fps / crf30。
- 场景文件要同时改两处并保持一致：`pipelines/<id>/runtime/scene.js`（运行时）+ `tools/mg_styles_template/scenes/<id>.js`（模板，仅 mg 四条用）。

### 这一轮的三条可复用写法
- **区域铺针**（cixiu）：`ellipsePts()` 造形状 → `regionStitches()` 按扫描线在形状内排平行针脚，得到圆润的缎面块，比梭形拼接更像刺绣。
- **低多边形挂件**（diduo）：`place(u,v)` 用地形高度函数取屏幕坐标与缩放，再在屏幕空间画三角面树/帆船/鸟，保证跟地形同色系。
- **静物补景**（youcai）：先铺暖光罩 → 桌布折面 → 硬边投影 → 主体 → 边缘道具（杯子、枝叶），空画不空构图。

---

## 7. 这台机器的环境坑

| 坑 | 处理 |
| --- | --- |
| Shell 是 pwsh 7，没有 Bash | 用 `PowerShell` 工具；`<<'PY'` 这类 heredoc 不支持，多行 python 写成 `tools\_tmp.py` 再跑，跑完删 |
| 没有 repo venv | 脚本里已自动 `uv run --with playwright python`；numpy/PIL 临时加 `uv run --with numpy --with pillow` |
| playwright 找不到 | 渲染前设 `PLAYWRIGHT_CORE = <仓库>\piying\node_modules\playwright-core`，`PATH` 里带上 ffmpeg7 |
| ffmpeg 取帧精度 | 用 `-ss` 前置（输入侧），并用 `-frames:v 1`；抽帧尺寸按长边 1024 或竖屏 `scale=-2:1024` |
| 中文字体 | `build_fonts.py` 生成的字体在 `site/assets/fonts`，canvas 里用 `ctx.font` 名前先确认已注册 |
| CRLF | git 会警告 "CRLF will be replaced by LF"，可忽略，不要批量改行尾 |

---

## 8. 封面审美准则（这一轮踩出来的）

1. 主体必须完整：线稿要画到闭合，静物要摆全，人物要整头整身。
2. 拒绝纯文字卡、标题卡、白屏过渡帧、纯黑渐隐帧。
3. 单色大平涂（>85% 像素接近纯白）不合格；近黑且无高光同样不合格。
4. 撞脸的几张（同族等价）宁可挑构图差异最大的那一帧，也不要都选"居中同一角度"。
5. 竖屏（`huazi`、`shipai`）封面必须 576×1024，别压成横图导致卡片变形。

---

## 9. 待办 backlog（按优先级，codex 直接接手）

### P0 · 补掉 65 条空开场
- 目的：第 0 帧就有内容。
- 范围：第 3 节列出的 65 条。其中 41 条可重渲的优先（`tanbi youcai cixiu minjian yuanzhu diduo` 等已重做过一轮，仍要确认首帧）。
- 做法：改写 `draw()` 开头 0–0.3s 就出现主体（哪怕一小团墨/一笔线/一个色块），或把已有内容整体前移。
- 验收：`sample_audit.py` 里该条 `open_flat == false`，且抽 0.05s 帧肉眼有主体。

### P1 · 拆掉撞脸家族
- 12 条小楼剖面线稿、5 条树影剪影、4 条荧光笔白纸：各换一套题材，按各自画法强项重写（例：`blueprint` 画剖面图纸+标注；`bishi` 画绘图仪走线；`muke` 画木刻刀痕；`baiban` 画讲师手写推演）。这些管线没有 runtime，需要先补 `runtime`（可复制 `tools/mg_styles_template/runtime` 的结构，再写 scene）。
- 验收：任两条封面 dhash 距离 > 10，题材互不相同。

### P2 · 站点卡片质量
- 现在 164 张卡里有 9:16 与 16:9 混排（`huazi` 竖屏在 graphic 工位）。评估是否统一按工位出尺寸，或给竖屏单独一列。
- 缩略图目前直接用 1024 宽 jpg，卡片里等比裁切；可评估为卡片另出 480×270 / 270×480 小图，减少首屏流量。

### P3 · 工具增强
- `poster_appeal.py` 加 `--dry-run`（只打印候选秒数不落盘）、`--top N`（对每条输出前 N 个候选帧拼一条对照带），便于批量人工复核。
- `sample_audit.py` 增加"镜头静止度"（全片帧差中位数），把"几乎静止的片子"单独列出来——这类样片即使封面好看，播放起来也死。
- 把 `build_samples.py` 的旧选帧函数标 deprecated 或直接删掉，避免两套逻辑并存。

---

## 10. 验收清单（每次改完照着勾）

- [ ] `ffprobe` 每条改动样片时长 10.000000，且有 audio 流
- [ ] 尺寸：横屏 1024×576，竖屏 576×1024
- [ ] 封面非空白：`poster_appeal` 重算后 `bright` 在 20–232，`white` 占比 < 85%
- [ ] 第 0 帧有主体（抽 0.05s 帧看）
- [ ] BGM 已混入、`music` 字段写对
- [ ] `samples.json` 里 `badge` = `10 秒样片 · 自渲`、`source` 写明本仓库自渲
- [ ] `build_site.py` 输出 165 卡；`validate / check_links / check_syntax` 全 OK
- [ ] `git status` 只含预期文件（别把 `review/` 里的中间产物提交进站内目录）

---

## 11. 明确不要做

- 不要用 AI 生图补画面，不要搬上游那几条成片当样片。
- 不要为了让封面好看去裁切/加字卡遮住原画面。
- 不要动用户已有的 `pipelines/*/SKILL.md` 里的风格定义来迁就渲染。
- 不要批量重写 `samples.json` 结构；字段语义以本文第 4 节为准。
- 不要在没有校验链通过的情况下 push。

---

## 12. 样片重制标准（后续批次沿用）

按演示站的工位顺序和管线顺序分批制作。第 01 工位已重制 4 支。第 02 工位首批是逐帧手绘《鼓阵开场》、铅笔测试《跃栏试画》、彩铅科普《雨林弹射》、平板速写《海獭开贝》和钢笔淡彩《花市一早》。这五支可以作为后续样片的动作、色彩、场景密度和验收基准。

第 02 工位第二批是蜡笔儿童绘本《松鼠接栗子》、水彩笔刷《白鹭掠溪》、铅黄浓彩《剧场里的第三声》、油画厚涂《赤土牧归》和一笔画《一线追球》。

### 构思和制作

- 先读每条管线的 `SKILL.md` 和参考工程，写出这 10 秒里看得见的招牌技法。用一个完整的动作或事件把它串起来，从首帧的主体到中段动作，再到结束时的结果。
- 选题、构图、动作、道具均重新设计。对照原站样片和可访问的上游参考，避开相近的主体与标志性构图。画面全由代码绘制。
- 先做能读清的主体，再丰富场景。人和动物的动作要有重心、预备、接触与回弹，步态、翅膀、尾巴或衣料要跟着动作变化。用前中后景、与动作有关的道具、配角和环境运动增加场景层次。
- 在各管线的媒介范围内增加色彩层次。铅笔测试保留石墨、蓝线和单一暖色重点。铅黄浓彩的色彩由交叉硬光和浓彩塑形。水彩靠透明叠染、积色和纸白分层。
- 使用曲库匹配节奏。撞击、落地、切镜等动作需要音效时对齐实际发生帧。口播可用于解释画面中的信息，字幕跟实测语音时间码。

### 重渲与验收

工位 01 用 `tools/paper_samples.py`，工位 02 用 `tools/hand_samples.py`。样片的场景脚本、配乐段、封面秒数在对应入口和同名场景目录中。使用多个 `--only` 可只跑本批所选管线。以单支为例：

```powershell
uv run --with playwright --with edge-tts python tools/hand_samples.py --only labi --stills 0,3.8,7.85,9.5
uv run --with playwright --with edge-tts python tools/hand_samples.py --only labi
python tools/hand_samples.py --only labi --install
uv run --with numpy --with pillow python tools/sample_audit.py --check --only labi
```

1. 看第 0 帧、动作前后、峰值和收尾。全片连续回看一遍，检查肢体、接触点、遮挡、镜头运动和音画同步。封面选完整且能代表管线特点的画面。
2. 打包校验精确 10.000 秒、音轨覆盖全片、视频和封面尺寸。按管线选帧率和画幅，横屏发布版用 1024×576。`sample_audit.py --check --only <id> ...` 检查片头对比度和色阶、封面亮度和白像素占比，以及同批封面之间的 dHash 距离。指标通过后仍需看画面。
3. 更新已选条目的 MP4、JPG、样片清单和钉帧表，再跑第 5 节的站点校验链。仓库的语法检查用 Python 3.12。浏览器逐卡确认标题、自渲标签、悬停预播、点击有声播放以及退出灯箱。
4. 仅提交本批的源文件和站点交付物。推送后等 GitHub Pages 部署完成，检查线上卡片顺序和元数据，并比对线上 MP4、JPG 与本次交付文件的校验和。
