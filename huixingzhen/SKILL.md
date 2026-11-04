# huixingzhen · 回形针风科普短片管线

description: 粗描边贴纸人科普 MG 管线（mg-styles-15 #19「回形针 PaperClip」风格）。实拍照片贴纸化 + 精确图表 + 大画布连续运镜 + 句级字幕 + 代码合成音效床 + 确定性 HTML 逐帧渲染。当用户要做知识区/硬核科普/财经解释类短视频，或说「用回形针风出一集」「huixingzhen 出片」时使用。

上游风格来源：`mg-styles-15`（MIT）demos/19-paperclip + prompts/19-paperclip.md。
完整提示词见 `mg-styles-15/prompts-zh/19-paperclip.md`；演示片 `mg-styles-15/videos/19-paperclip.mp4`。

---

## 一、输入契约

| 输入 | 来源 | 说明 |
|---|---|---|
| 口播稿 / 配音 | `出稿/<编号>_<选题>/` 或 TTS 现录（GPT-SoVITS dabao 音色，`dabao_tts.cmd -t 文本 -o out.wav`） | 实测每段时长 → 定 cue 表 |
| 人物透明帧 | shouhui 产物 `shouhui/projects/<slug>/assets/vid/`（frames_*、原 mp4） | 复用已抠像资产，**勿改 shouhui** |
| 文物 / 器物图 | 公有领域图库（Met Open Access CC0 可直连；Wikimedia/台北故宫本机不可达） | 棚拍渐变底走卡片、纯底可抠图 |
| BGM | `D:/@kaifa/BGM/<主题>/` | 按选题选曲，取中段 20s |

## 二、目录结构

```
huixingzhen/
├── SKILL.md                  本文档
├── scripts/                  管线脚本（权威版本）
│   ├── render_frames.mjs     确定性渲染器：页面 → 逐帧 PNG（spawn Edge + connect）
│   ├── sfx_pack.py           音效合成器：37 种配方，cues.json → sfx.wav
│   ├── make_stickers.py      透明人物帧 → 白描边贴纸
│   ├── make_cards.py         文物照片 → 圆角白框卡片
│   └── gen_vidframes.py      人物动作视频 → 白描边小帧序列（含 alpha 修复）
└── projects/<slug>/          实例工程
    ├── index.html / index20.html   渲染页（renderAt 协议）
    ├── cues.json / audio/cues*.json  配音 cue 与音效 cue
    ├── assets/               贴纸、文物卡、字体、人物小帧
    ├── frames/               渲染帧（重渲缓冲，可删）
    └── out/                  成片
```

参考实现：`projects/paperclip_zhou/`（商纣王 20s 样片，含 10s 版对照）。

## 三、流程（六步）

### 1. 文案与 cue 表
- 口播稿按句读切从句，**≤14 字/条**；段间隙 0.2–0.3s。
- TTS 逐段生成 → ffprobe 实测时长 → 写 `audio/cues*.json`（narration 段 + 相机 keyframes + sfx cues）。
- **相机 keyframes 必须与语音段对齐**：每段语音期间相机停在对应屏，平移段放在两段语音之间的静音里。

### 2. 素材
- **人物贴纸（静）**：`make_stickers.py`——透明帧 → 距离变换 8px 抗锯齿白描边。
- **人物视频（动）**：`gen_vidframes.py`——**从原始 mp4 抽帧取 RGB**（matte 输出的透明区 RGB 已被抹黑，不可用）+ frames_* 的 alpha（fill_holes 修误删洞）合成 → 高 720 + 6px 白描边 → 24–40 帧/段。
- **文物**：`make_cards.py` 圆角白框照片卡片（上游 card() 路线）；纯色底物件才走抠图贴纸（make_stickers）。
- 素材规则：仅 CC0 / 公有领域 / OFL / 可免费商用；不使用真实商标；来源记入 CREDITS.md。
- 图库经验：`collectionapi.metmuseum.org`（v1.1 分页接口）+ `images.metmuseum.org` 可直连；Wikimedia/台北故宫/Openverse 均不可达。

#### 素材检索与替代规则（2026-10-30 用户定稿，**长期有效**）

1. **先找实物，找不到就用同类替代，不许留空。** 检索 3–4 轮（实体名 → 加出土/馆藏限定词 → 拓片/线图 → 英文名）仍无可用图时，
   按优先级降级：**① 同墓葬同类器物 → ② 同年代同材质同类器物 → ③ 同文化圈图像（壁画/纹饰/地图）→ ④ 近似意象（如「殉人」→ 墓葬外观）**。
   实测案例：南越王墓象牙 6 轮无果 → 克利夫兰贝宁祭坛象牙；青铜羽人 → 同类器物；殉人 4 轮无果 → 博物院外观。
2. **替代品必须在 ASSETS.md 的「缺口」一节如实登记**（替代了什么、为什么），片尾脚注统一带「同类器物示意」。
   观众不细究，但清单里不能含糊——下一集复用素材时需要知道哪张是真身哪张是替身。
3. **不要为了"更像"伪造对应关系**：宁可替代 + 标注，也不要用 AI 生成图冒充实物。
4. **一图一用（2026-10-30 用户定稿，长期有效）**：成片任何素材不出现第二次。同一文物要上多个镜时，配**同器物不同角度/部位**的图（全形/纹饰/印面/细节各一），或按台词改配别的实体。
5. **查重必须在抠图/成卡结果层做**：把成品统一铺到深底、缩到 32×32 灰度、均值差 <6 判重复。**源图层面查重会漏检**——同一张照片不同裁切/压缩的候选，哈希和 24×24 感知比对都判"不重复"，铺深底并排一看就是同一张（踩坑：金印印面第一版=金印实物照、五色散石第一版=药石展柜照）。
6. 场景类（遗址/建筑/航拍/壁画）不强抠，做 1200×900 圆角照片卡；器物类抠图贴纸。同一实体既出贴纸又出卡时，两者必须来自不同照片。

#### 全片配图管线（2026-10-30 固化，`projects/yuren30/tools/`）

- `fetch_assets.py`：实体清单（key + 多组检索词）→ 必应 `cn.bing.com/images/async`（解析 `murl`）→ 每实体下载 ≤5 张候选到 `assets/web/<key>/`，域名白名单加权（博物馆/gov/edu/新华/央视优先）。
- `fetch_more.py`：定向补抓，覆盖同名 key 的候选目录，用于检索词换血重试。
- `sheet_cands.py`：候选审阅大表（每行一实体、5 列候选），人工逐行定 index。
- `cutout.py`：按 `assets/select.json`（`{key:{i,mode:'cut'|'card',src:'其他key'}}`）批量产出——
  **cut**：rembg(u2net) → 边缘去背景色溢色（alpha<0.95 的像素 RGB 换最近不透明像素色，**否则白底图在深底上有白圈**）→ 去小连通域（<最大块 2%，否则水印被白描边包成白块）→ trim → 白描边贴纸（560px）；
  **card**：1200×900 圆角照片卡（场景/遗址/壁画不强抠）。
- 模型：`~/.u2net/u2net.onnx`，GitHub 直连超时时走 `gh-proxy.com` 下载。
- 产出挂载：`episode.json` 每镜加 `asset:[key,'cut'|'card']`，`gen_episode.py` 把矢量母题换成 `<img>`（cut=contain+投影，card=cover+圆角）。
- 字幕时间轴必须与镜头表同源：**统一从词级对齐产物 `cues_full.json` 生成**，严禁再引入按字数累加的第二套时间（曾因此整体漂 4.8s）。

### 3. 渲染页（index.html）
页面协议（与 mg-styles-15 harness 一致）：
```js
window.DEMO = { width:1920, height:1080, fps:30, duration:20 };
window.renderAt = async (t) => { ... };   // 每帧由 t 纯函数驱动
window.__ready = true;
```
要点：
- 大画布（屏数×1920）#world + 相机 `translateX(-camX(t))`，分段 easeInOutCubic。
- **absolute 屏容器必须显式 width/height**，否则 shrink-to-fit≈0 导致内部文字竖排。
- 人物视频层：`<img>` + 帧池预载，`renderAt` 内换 src 后 `await el.decode()`（防截到半加载帧）；循环段取模、单段 clamp。
- 字幕（lishi 参数）：句级 ≤14 字、60 号普惠体、底距 112px、淡入 5 帧、CaptionVeil 400px 渐变(0.74/0.34)常驻；**条与条首尾相接全程无空窗**；无标点（逗号→空格）；窄白描边用双层文本（`::before content:attr(data-text)` 白 6px stroke 垫底）。
- 移动端可读：画面内任何文字 ≥21px；卡片标题 40px；底部 200px 为字幕带，画面元素避让。
- 字体：Alibaba PuHuiTi 3.0 85-Bold（免费商用，`assets/font/`，@font-face）。

### 4. 渲染
```bash
node scripts/render_frames.mjs <slug> --page index20.html --dur 20
```
- spawn Edge + connect（**Edge 154 上 puppeteer.launch 会静默退出**）；600 帧约 70s。
- 日志重定向到文件（`| head` 会 SIGPIPE 杀进程）；结尾 udd 清理已容错。

### 5. 音频（三层，各给增益后统一 loudnorm −14 LUFS）
- 人声 0dB；音效床 **−13.5dB**（长片实测值；30s 样片用 −9dB，音效越密越要压）；**BGM −24dB**（2026-10-30 用户定稿，v6 实测听感合适）。
- **BGM 不够长**：`asplit=N` → **链式 acrossfade d=5**（[a][b]→x1，[x1][c]→x2…共 N−1 次；`concat` 之后不能再接 acrossfade，会报 "unlabeled input pad"）→ atrim 片长 → −24dB → 首淡入 2.5s / 末淡出 5.3s。121s 曲子 ×6 = 597s 就这么接的。
- **BGM 响度调参的误区**：限幅器锁死峰值后，整体 loudnorm 的 `input_i` 不随 BGM 增益变化（−30/−24/−21 都停在 −14.5）——判断 BGM 轻重只能靠听感，别盯着积分响度调。
- `sfx_pack.py` 37 种配方（打击/武器/挥动/UI/动势/质感），cue = `{type,t,gain,...}` **落在画面动作帧上（误差<1帧）**。
- 注意：**配方首参必须位置传参**（`fn(100+i*7, **kw)`），用 `seed=` 关键字会落进 **kw。
- 音效-动作对位示例：挥钺先抽原视频帧定节拍（f45 举顶/f65 劈地 → 12.35s axe_swing / 12.95s axe_impact）。

### 6. 合成与 QA
```bash
ffmpeg -framerate 30 -i frames/%04d.png -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p out/video_only.mp4
ffmpeg -i video_only.mp4 -i fullmix.wav -c:v copy -c:a aac -b:a 192k -shortest out/<slug>.mp4
```
QA 清单：严格时长 / 1080p30 / −14±0.5 LUFS / 黑帧 0 / 字幕无空窗无重叠 / 音画对位（抽帧核对）/ 规格与 DEMO 一致。

## 三点五、深色主题（"未解之谜"版）

浅底是默认；**做悬疑/未解之谜/夜间档时整套翻深色**。定稿参数已固化在 `theme/dark.css`，
底图由 `projects/<slug>/tools/make_bg.py` 程序化生成（1920×1080，可复现）。

| 项 | 值 |
|---|---|
| 页面底图 | `assets/bg_dark_archive.png` 铺 `#viewport`（`center/cover`，**不随相机移动**，像一张桌面） |
| 底色 | `#0B0D11`；卡片 `rgba(255,255,255,.10)` + 描边 `.22` + 黑投影 + `backdrop-filter:blur(2px)` |
| 文字 | 主 `#E9EFF6` / 次 `#97A7B8` / 弱 `#6C7C8D` |
| 强调 | 橙 `#FF6B45`（主重音）、淡橙 `#FFB79B`（次级复述）、亮黄 `#FFD84D`（说明卡） |
| 字幕 | **66 号**（深色底比浅色底需要更大），衬底改 `rgba(3,5,9,.86/.44/0)`，白描边改**深描边** `rgba(4,6,10,.92)` |
| 卡片序号 | 反相：底 `#E9EFF6` + 字 `#0B0D11` |
| SVG 标注牌 | 深底 `rgba(10,14,20,.92)` + `stroke rgba(255,255,255,.18)`，**不能留 `fill="#fff"`** |
| 台标 | 圆形头像 58px（4× 超采样裁切 + 1.5px 亮环）+ 中文名 27/900/字距 3 + 英文名 21/字距 2.5，两者间距 **2px**，头像与文字块间距 14px |
| 最小字号 | 移动端可读线：小标题 **37**、卡正文 **31**、副注 **27–30**、页脚 **24**（低于此在 390px 宽的手机上糊） |

## 三点六、全片（>5 分钟）怎么做

30 秒样片是手写版式；**全片走数据驱动**，三步：

1. **时间轴** `scripts/align_full.py`：`silencedetect` 出停顿 → 两级 DP 对齐（先把段落字数钉到停顿，再在段内钉从句，语速比 `<0.7`/`>1.85` 重罚）。
   输出 `cues_full.json`（376 条从句 t0/t1）。**注意**：文本从句数 ≠ 口语停顿数（口播会在句中换气、又在标点处不停），DP 会吸收多出来的停顿；实测前 8 条误差 <0.1s，段中偶尔漂移 1–2s。字幕按"整从句不硬拆 + 按长度降字号"处理，漂移才不至于切断词。
2. **分屏数据** `episode.json`：每镜写 `{a,b（从句索引）, lay, kick, title[], cards[]/rows[]/q[], motif}`，7 种版式 `title/stats/list/quote/split/compare/diagram` + 9 个参数化 SVG 母题。62 镜覆盖 597s。
3. **生成** `scripts/gen_episode.py`：出 `index_full.html`（62 屏 × 1920 画布、相机 keyframes 自动从镜头表算、字幕与音效 cue 一并导出）。

**渲染速度**：带纹理深色底图 + PNG 截帧是 0.42s/帧；改 `PC_FMT=jpeg PC_Q=95` 后 **0.05s/帧**（8 倍）。17920 帧约 17 分钟，PNG 要 2 小时——**长片必须用 JPEG 截帧**，最后仍以 CRF17 编 H.264，画质无差。

**BGM 不够长**：选 229s 的曲子，`asplit` 三份各 229s、`acrossfade d=5` 接起来 = 677s，再 `atrim` 到片长，首 2.5s 淡入、末 5.3s 淡出。


### 全片 v2：前 30 秒原样复用 + 后续同规格动效（2026-10-29 定稿）

用户明确要求「成片完全遵循样片动效与规格」，因此全片页不是重新设计，而是**把样片页整段嵌进去**：

1. 从 `index.html` 切出 `<style>`、`#world` 里的 6 个屏、`#chrome`、`<script>`；
   script 里 `CAM`/`CAPS`/`camX` 全部正则改名 `CAM_A`/`CAPS_A`/`camA`（`\bCAM\b` 不匹配 `CAM_A`，安全），
   `renderAt` 主体切成 `function animA(t)`。**动效函数一行没改**，0–30s 与样片逐帧一致。
2. 30s 之后的屏由 `gen_episode.py` 生成，每镜必带：kicker + 标题 + **动效图（9 个参数化 SVG 母题）** + **卡片**，
   入场用 `ANIM_B` 数据驱动：`in`（上浮）/`pop`（弹入）/`wipe`（自上而下揭示）/`bar`（竖条长出），
   卡片入场时间绑到**本镜覆盖的从句**（`card_times()` 按 a..b 均分），因此卡片是跟着旁白一张张出的。
3. 相机：0–30s 用 `camA`，之后 `camB`（第一镜硬切到 11520，其后每镜 0.36s 快推）。
4. 长镜（>12s）给动效图加连续推移 `translateY(-14*prog) scale(1+0.035*prog)`，避免整屏静止。

**踩过的坑**：①`#world` 只能有一个——切片时要把样片 world 的开标签去掉，否则嵌套两个同 id；
②actB 屏必须偏移 11520，且 `.sc{position:absolute}` 必须补在合并页 CSS 里（样片页没这个 class，
漏了会让 56 个屏按普通流堆到画面下方，整段空白）；③`\bCAM\b` 改名后函数体里还留着 `CAM[`，要用词边界整体替换；
④卡片用「按从句分布」后，镜头长短不再影响节奏，17s 的长镜也能持续出卡。

## 四、已知坑（必读）

1. matte 产物透明区 **RGB 被抹黑**——人物素材一律回 mp4 取 RGB。
2. absolute 容器不设宽高 → 内部文字逐字竖排。
3. 屏内右缘元素留 ≥100px 余量（会侵入下一屏被相机拍到）；底部 200px 字幕带避让。
4. ffmpeg 新版无 `-vsync`，用 `-fps_mode passthrough`。
5. 本机 ffprobe/ffmpeg 在 `D:/GPT-SoVITS/tools/ffmpeg/`；Wikimedia 系不可达，Met 可达。
6. 字体防盗链：阿里 OSS 拒外链 Referer，从 GitHub 镜像（hongzhi725/AlibabaPuHuiTi）走 gh-proxy 下载。
7. **SVG `<path>` 不写 `fill` 默认填黑**——只描边的 group 必须 `fill="none"`，否则弧形分层线会被填成黑块。
8. **深浅互转不能只用正则换色值**：文字色 `#25313D→#E9EFF6` 会被一起改掉，但底下的 `rect fill="#fff"` 没改，结果是白底浅字糊成一片。换色后必须**逐块核对所有"块底 + 字"组合**。
9. 中文字形墨迹相对 em 框**天然低约 1px**，flex 居中会显"歪"——锁 `line-height:1` 再 `padding-bottom:2px` 做光学补偿。
10. **深色底图会拖慢渲染**：铺 2.3 MB 纹理 + 26px 点阵后，900 帧从 60s 涨到 **380s**（6 倍）。迭代阶段先用单帧 `--from a --to b` 试版式，定稿再整片渲。
11. **响度陷阱**：三层 `amix(normalize=0)` 原始只有 −23 LUFS，`loudnorm` 单遍/两遍都被 TP ceiling 卡在 −15.7 上不去；`acompressor` 在本机反而把整体压到 −26（别用）。正确解法是 `compand` 显式传输曲线压动态（`-42/-28|-26/-12|-12/-4|0/-3`, soft-knee 6）→ 增益 → `alimiter 0.74`，才能落到 −14.4 / TP −1.66。

## 五、迭代惯例

- 改文案/排版只动 `index*.html` 与 cues json，重渲一版分钟级完成。
- 新风格提示词参考 `mg-styles-15/template.md`；评审用 `mg-styles-15/rubric.md` 双 AI 打磨。
- 新实例：`projects/<slug>/` 复制参考实现结构，替换文案、贴纸与页面。

## 交付（封面 + 发布信息，2026-10-30 起全管线统一）

成片定稿后按 **根目录 `references/publish.md`** 交付四件套到 `out/<编号>_<人物>/`：
成片 + `src_3x4.png`（1080×1440）+ `src_4x3.png`（1440×1080）+ `发布信息.md`
（5 标题 + 4 标签 + AI 博主正文，模板在规范里）。

封面用 `python scripts/make_cover.py --bg <底图> --sticker <主视觉抠图> --font <字体>
--title "两字/三字" --sub "副题一行|第二行" --name 徐艾伦 --en AlanXU --dur "9 分 57 秒"
--out out/<编号>_<人物>`。主视觉贴纸按封面尺寸重出白描边（`make_stickers.outline(源,出,900)`），
不要把 560px 的成片贴纸直接放大上封面。
