# 炎帝 · 女娲系列 · 代码动画视频流水线

> 管线代号：**piying**（皮影 / 剪影卡片风）。2026-10-29 用户命名，目录 `render/piying/`（原 `render/yandi/`）。

用 Playwright + Canvas 逐帧渲染 + ffmpeg 合成 16:9 历史神话口播视频，不依赖文生图 / 图生视频。
完整生产规格见技能：`.workbuddy/skills/yandi-video-spec/SKILL.md`。

## 成片清单

| 序号 | 片名 | 时长 | 分镜 | 状态 |
|---|---|---|---|---|
| 1 | 炎帝 | 385.5s | 98 镜 / 320 字幕 / 163 音效点 | 已交付（新规格重制） |
| 2 | 女娲 | 427.2s | 100 镜 / 336 字幕 / 144 音效点 | 已交付 |
| 3 | 波斯湾伊甸园 | — | — | 已交付 |
| 4 | 周幽王 | 180.0s | 41 镜 / 154 字幕 / 40 音效点 | 已交付 |
| 5 | （下一集） | — | — | 待开工 |

---

## 炎帝最终成片参数（定稿，2026-10-25 五轮整改后）

| 项 | 值 |
|---|---|
| 文件 | `out/1 炎帝/炎帝_全片.mp4` |
| 时长 / 帧数 | 385.5s / 11565 帧 |
| 画面 | 1920×1080 / 30fps / H.264 CRF19 / yuv420p / +faststart |
| 声音 | AAC 192k / 44100Hz / stereo |
| 响度 | **-16.1 LUFS / -1.4 dBTP** |
| 音频构成 | 配音 + 163 个点缀音效（与卡片弹出/口播词逐句对齐）+ BGM `历史 古文明 Hidden_Wonders`（volume 0.0813，低人声 19dB） |
| 背景 | bg10 群峰叠嶂 aspect-fill + 运镜（横移±42px/52s + 推拉 1.09±0.03/38s 错拍交替） |
| 字幕 | 炎帝样式底部条 64px + 关键词金色高亮，时间轴停顿检测吸附 |
| 密度实测 | 文字 max 23.02% ｜ 运动元素 min 7 ｜ 193/193 窗口无空窗 ｜ 纯文字 3.3% |
| 门禁 | 四查全过（类型覆盖 / 字幕区越界 / 空渲染 / 坏文本） |
| 体积 | 164.5MB |

### 段落结构（8 段 / 98 镜）

| 段 | 名称 | 时间码 | 范式 |
|---|---|---|---|
| S0 | 开场钩子 | 0-32.4s | 概念（食物四卡→炎帝登场→尝百草72毒→四件事） |
| S1 | 教会种地 | 32.4-106.3s | 概念+故事（打猎不稳定→种子→五谷→定居→存粮链条） |
| S2 | 尝百草 | 106.4-160.8s | 概念+剪影（硬扛→亲口尝→本草经→临床实验→三大类） |
| S3 | 发明医药 | 160.8-210.7s | 概念+剪影（砭石→针灸演进→WHO→接生） |
| S4 | 日中为市 | 210.7-256.4s | 概念+剪影（以物换物→别打了→商业与和平起点） |
| S5 | 炎黄之战 | 256.4-298.4s | 故事剪影（兄弟→阪泉三仗→涿鹿→炎黄子孙） |
| S6 | 炎与陶器 | 298.4-329.1s | 概念+剪影（石头烧水→制陶→炎＝两个火） |
| S7 | 跟你有关 | 329.1-385.5s | 概念+收尾（四连问→遗产→唯一未中断文明→片尾卡） |

管线：`render/piying/`（gen_full_yandi → page_full_yandi → qc → audit 四查 → capture → sfx → BGM → 封装）。

---

## 女娲最终成片参数（定稿）

| 项 | 值 |
|---|---|
| 文件 | `out/2 女娲/女娲_全片.mp4` |
| 时长 / 帧数 | 427.2s / 12816 帧 |
| 画面 | 1920×1080 / 30fps / H.264 CRF19 / yuv420p / +faststart |
| 声音 | AAC 192k / 44100Hz / stereo |
| 响度 | **-16.0 LUFS / -1.4 dBTP** |
| 音频构成 | 配音（主体）+ 144 个点缀音效 + BGM `阿拉伯 Desert_Caravan`（低人声 19.3dB） |
| 背景 | **bg10_layeredpeaks**（群峰叠嶂）全片统一，aspect-fill 铺底 |
| 字幕 | 炎帝样式底部条（924–1024px 安全区）64px，关键词金色高亮 |
| 密度实测 | 文字 max 19.59% ｜ 运动元素 min 6 ｜ 15/15 窗口无空窗 |
| 体积 | 145.9MB |

### 段落结构（8 段 / 100 镜）

| 段 | 名称 | 时间码 | 范式 |
|---|---|---|---|
| S0 | 开场钩子 | 0–40.3s | 概念（三神横排 + 女娲登场） |
| S1 | 她造了人 | 40.3–89.5s | 故事+概念（捏泥人 / 甩泥点） |
| S2 | 她补了天 | 89.5–158.6s | 故事（共工触山 / 五色补天 / 神龟） |
| S3 | 她定了婚姻 | 158.6–211.3s | 故事+概念（石磨 / 火堆） |
| S4 | 她创造了笙簧 | 211.3–254.5s | 故事+概念（篝火笙簧） |
| S5 | 女娲伏羲关系 | 254.5–306.3s | 概念（三版本合一） |
| S6 | 为什么记得她 | 306.3–373.7s | 概念（四女神对比 / 信仰谱系） |
| S7 | 跟你有什么关系 | 373.7–427.2s | 概念+收尾（签名卡） |

---

## 内容规范（验收硬指标）

**密度三指标**（全帧仪表采集，非抽样）：
1. 文字面积 ≤ 30%（实测 max 19.59%）
2. 同屏运动元素 ≥ 5（实测 min 6，均值 12.6）
3. 每 2 秒 ≥ 1 个新动效点（15/15 窗口）

纯文字画面（章节标题/片头尾/金句）豁免，合计 ≤20% 时长（女娲 14 个金句 ≈11.5%）。

**手机可读性**：标签 ≥60px、内容 ≥64px、角色/关键图形 ≥170px 高、单镜主要元素 ≤5。

**构图**：人物默认居中于中线；第一幕三人横排与 VS 对称构图为有意例外；场景元素避让 924px 字幕线。

**转场**：温和轮换，禁止全屏色块扫屏与高频闪白（返工过两次）。

---

## 背景

全片采用 `output/006_女娲/背景图_v1/bg10_layeredpeaks.png`（ChatGPT 生成，1920×1080）。
背景库共 **10 版**：星雾深空 / 黄土泥沼 / 天裂 / 五色补天 / 篝火暖夜 / 青绿层峦 / 金殿香火 / 归星夜幕 / 远山水意 / 群峰叠嶂。

约束（任何新背景必须满足）：近黑深底、低饱和、元素集中四缘、**中心 60% 留空**、山景峰顶 ≤45% 画面高、铺底必须 aspect-fill 裁切。

切换/生成：`node gen_backgrounds.js`（代码绘制 8 版，零积分）、`node render_bgtest.js <名称…>`（叠图静帧）。

---

## 封面

| 文件 | 尺寸 | 说明 |
|---|---|---|
| `cover_4x3.png` | 1440×1080 | 金色行楷「女娲」横排 + 像素女娲 + 青绿群山 |
| `cover_3x4.png` | 1080×1440 | 同款竖排标题 |

制作口径（沿用 tushuo）：内置 ImageGen 出图（1536×1024 / 1024×1536）→ 上方 1/3 深色标题区 → **标题由模型直接画入**（金色毛笔行楷，恰好 N 字）→ 负面约束写死（无引号/副标题/字母/水印）→ 出图后 `delogo` 消角标 + 裁切缩放。
提示词模板参考 `D:/@kaifa/tushuo/content/liuxiu-4min/covers/prompt-*.txt`；原图留档 `output/006_女娲/封面生成_v1/`。

---

## 发布信息

`发布信息.txt` 固定格式：**5 条标题备选（≤27 字、两段式强钩子）+ 推荐/次选理由 + 1 行 4 个话题标签**。
女娲定稿：

```
【标题备选 · 5 选 1】
1. 没有女娲就没有中国人？她干的三件事，比补天更狠      ← 推荐
2. 课本不会告诉你：女娲补天的背后，藏着中国人的底层密码
3. 造人、补天、定婚姻：女娲才是中国神话里最狠的女神    ← 次选
4. 每个中国人身边，都藏着一个女娲
5. 西方造人靠上帝，中国造人为什么是她？

【话题】#中国神话 #女娲 #历史文化 #涨知识
```

---

## 交付目录契约

```
out/<序号> <标题>/
├── <名称>_全片.mp4      # 成片（含 BGM）
├── cover_4x3.png        # 1440×1080
├── cover_3x4.png        # 1080×1440
├── 发布信息.txt          # 5 选 1 + 推荐 + 话题
└── 源文件/              # 样片、核验报告、标题详版等其余文件
```

顶层只允许 4 项，其余一律进 `源文件/`。

---

## 目录（双管线）

```
yandi-video/render/piying/     炎帝线（后续剧集模板）
├── gen_sample_yandi.js / gen_full_yandi.js   样片/全片分镜
├── page_yandi.html / page_full_yandi.html    渲染页
├── capture_yandi.js / capture_full_yandi.js  逐帧捕获
├── qc_yandi.js / qc_full_yandi.js            密度核验
├── audit_yandi.js                            四查门禁
├── make_sfx_yandi.js / make_sfx_full_yandi.js 音效混音
└── chroma2rgba.js / purplish2rgba.js / refine_main.js  素材抠图链

yandi-video/render/nuwa/      女娲线（历史定稿）
├── gen_full.js / page_full_nuwa.html / capture_full_nuwa.js
├── make_sfx_full.js / qc_full.js
├── probe_*.js / scan_empty.js / gen_backgrounds.js / render_bgtest.js
└── cover_nuwa_v2.js / rgb2rgba.js
```

## 目录（女娲素材）

```
output/006_女娲/
├── 口播稿.md                  8 段文案
├── 配音.json                  42 段配音时间轴（键名 chunks）
├── 配音.wav                   427.2s 总轨
├── narration-chunks/          85 段配音块
├── nuwa_front/side/back.png   三视图（1254² RGBA 像素）
├── 女娲故事常用素材_透明PNG_v1/ 24 张人物/动物/道具 + 清单.md
├── 背景图_v1/                 10 版背景 + 第一幕效果静帧 + 清单.md
└── 封面生成_v1/               ImageGen 封面原图

yandi-video/render/nuwa/
├── gen_full.js                分镜生成 → nuwa_full_sb.json
├── page_full_nuwa.html        渲染页（33 场景 + 背景底层 + QC 仪表）
├── capture_full_nuwa.js       逐帧捕获（约 13.5 分钟 / 12816 帧）
├── make_sfx_full.js           音效合成 → full_mix.wav
├── qc_full.js                 全片核验（分段汇总）
├── probe_full.js / probe_targets.js / scan_empty.js   探针与空画面扫描
├── gen_backgrounds.js / bg_page.html                  背景生成
├── render_bgtest.js           背景叠图静帧
├── cover_nuwa_v2.js           Canvas 合成封面（备用）
└── rgb2rgba.js                ImageGen 资产转 RGBA
```

---

## 复现步骤

```bash
cd yandi-video/render/nuwa

# 1. 停顿点（字幕对齐依据）
ffmpeg -v info -i ../../../output/006_女娲/配音.wav -af silencedetect=noise=-35dB:d=0.06 -f null - 2>&1 \
  | grep -oE "silence_start: [0-9.]+" | awk '{print $2}' > sil_full.txt

# 2. 分镜
node gen_full.js                       # → nuwa_full_sb.json

# 3. 探针（必须目检）
node probe_targets.js && node scan_empty.js

# 4. 全量捕获（约 13.5 分钟）
node capture_full_nuwa.js              # → ../../frames_full/f%05d.jpg

# 5. 音效 + BGM
node make_sfx_full.js                  # → full_mix.wav
ffmpeg -y -stream_loop -1 -i "D:/@kaifa/@/BGM/阿拉伯/阿拉伯 Desert_Caravan.mp3" -t 427.5 \
  -af "highpass=f=38,volume=0.084,afade=t=in:st=0:d=3,afade=t=out:st=420.5:d=7" -ar 44100 -ac 2 bgm_track.wav
ffmpeg -y -i full_mix.wav -i bgm_track.wav \
  -filter_complex "[0:a]aformat=channel_layouts=stereo[n];[n][1:a]amix=inputs=2:duration=first:normalize=0[o]" \
  -map "[o]" -ar 44100 -ac 2 mix_with_bgm_raw.wav
ffmpeg -y -i mix_with_bgm_raw.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=-19.11:measured_TP=-1.95:measured_LRA=1.70:measured_thresh=-29.12:offset=-0.02" \
  -ar 44100 -ac 2 final_mix_bgm.wav

# 6. 编码 + 封装（必须显式 -map）
ffmpeg -y -framerate 30 -i ../../frames_full/f%05d.jpg -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p full_video.mp4
ffmpeg -y -i full_video.mp4 -i final_mix_bgm.wav -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 192k -movflags +faststart -shortest "D:/@kaifa/yandi/yandi-video/out/2 女娲/女娲_全片.mp4"

# 7. 核验
node qc_full.js                        # 8 段全 PASS 才交付
```

---

## 已知约束与坑（两集汇总，详见技能第九节 16 条）

- 字幕时间轴必须来自停顿检测，换配音需重跑步骤 1–2
- **缓动函数浮点边界**：`eob(0)` 浮点为 +2.22e-16，导致入场动画从首帧全量显示（炎帝五轮返工根因）——缓动必须 `if(t<=0)return 0`
- **场景类型必须注册到渲染页分发链/TYPE_CFG**，否则整段空渲染（女娲 globe；炎帝 11 处空卡空镜）
- **gen 的 items/nodes 若是 `{lb:..}` 对象数组，渲染端必须取 `.lb`**，否则出 `[object Object]`（用户看到"英文"）
- **越界审查必须含卡片与精灵**（QC.fgRects），只查文字框会漏卡片越线
- **改布局后重捕帧段必须覆盖全部同类场景**（hardendure 段曾漏捕）；捕获与编码必须串行，避免 x264 malloc 失败
- **色板新增颜色必须先加进 `COL`**，缺失渲染成黑块（blue/amber 事故）
- ImageGen `transparent` 实际输出 rgb24 → 纯品红底 + `chroma2rgba.js` + `refine_main.js`（或暗紫底 `purplish2rgba.js`）
- 交付前必须跑 **四查门禁**（`audit_yandi.js`）：类型覆盖 / 字幕区越界 / 空渲染 / 坏文本
- 多输入 ffmpeg **必须显式 `-map`**，否则取回旧音轨
- 图片铺底必须 aspect-fill，禁止直接缩放
- 中文路径 `file://` 需逐段 `encodeURIComponent`
- `rm -rf frames/` 会被安全拦截，捕获脚本覆写同名帧即可
- npm 安装需镜像：`--registry=https://registry.npmmirror.com`

### 周幽王新增踩坑（第4集，2026-10-27）

- **人物立绘必须等比绘制**：素材全是竖版 1024×1536，`sprite()` 若强制正方形会压扁人物。默认 `w=h*naturalWidth/naturalHeight`，不要写 `drawImage(im,-h/2,-h/2,h,h)`。
- **字幕时间戳必须用 whisper 词级转写原生时间**，不能手填估算。流程：faster-whisper 词级转写 → 对照口播稿逐句校准 start/end → 写回 subs。手填的时间轴到65秒后必然漂移。
- **场景边界必须收紧到字幕首尾**：scenes 的 s/e 要贴合它覆盖的 subs 的首条 start / 末条 end，否则场景切了字幕还停在上一句。用 `_tighten.js` 自动收紧。
- **背景默认用 bg10 群峰叠嶂**（古代题材通用），不要用代码画宫殿/黑块。运镜参数照搬炎帝：横移±42px/52s、推拉1.09±0.03/38s 错拍交替。
- **whisper 错别字修正表**：包四→褒姒、能火→烽火、包国→褒国、身後→申后、移救→宜臼、伯福→伯服、深侯→申侯、犬荣→犬戎、離山→骊山、爐走→掳走、隱狼入世→引狼入室、紅烟→红颜、墨西→妺喜、打击→妲己、白了个白→拜了个拜。
- **样片先行**：新一集先截前20秒样片验收（人物比例/字幕对齐/背景），验收通过再跑全片5400帧。不要直接跑全片再返工。

## 工作区清理（每集交付后）

```bash
cd yandi-video/render/piying
node clean_workspace.js            # dry-run
node clean_workspace.js --apply    # 执行（可释放 6.7GB/两集）
```

- 删：所有 frames*/ 帧目录、probe*/、qc/、*_draft*.mp4、中间 wav（pre_/full_mix/bgm_track/final_mix/sample_ 等）
- 留：全部脚本 .js/.html、分镜 *_sb.js/json、sil_full.txt、qc_report*.json、out/ 交付物、node_modules、素材源
- 已发布成片归档在 `out/@已发/<序号> <标题>/`，待发布在 `out/<序号> <标题>/`
