# samples-v2 · 10 秒样片制作进度（2026-11-18）

## 已完成（2 / 34）

| 管线 | 成片 | 规格 | 字幕 | 施工方式 |
|---|---|---|---|---|
| pencil 铅笔测试 | `samples-v2/pencil-10s.mp4` | 1920×1080 / 30fps / 10.000s | 有（自带） | 手写 `build(F)` 场景：0.02s 起笔 → 三个角色（走、抬手、换姿势）→ 擦改细线 → 五张变体连拍（02–06）→ 拉全纸带；**另铺一层动画台背景**（灯光/桌面/一叠纸/胶带/铅笔屑/散笔）；BGM 轻快怪趣 |
| shuicai 水彩笔刷 | `samples-v2/shuicai-10s.mp4` | 1920×1080 / 60fps / 10.000s | 无（按约定留空） | 取原片 44–54s（跨 03→04 章：桉树林 → 高湿林），关掉 `drawSubs`，叠 1.00→1.05 缓慢推镜，混旁白 + 自然纪录片弦乐 |
| shadow 皮影 | `samples-v2/shadow-10s.mp4` | 1920×1080 / 30fps / 10.000s | 有（自带） | 手写两场：匠人＋学徒在幕前（案台、灯笼、山草月云全插杆）→ 灯暗 0.6s 换场 → 将军／兵甲／史官三人对戏；`Y.puppet` 走位/抬手/转身/鞠躬/起舞，收尾灯落 |
| tapestry 贝叶挂毯 | `samples-v2/tapestry-10s.mp4` | 1920×1080 / 30fps / 10.000s | 有（自带） | 布卷从第 0 帧就左滚：织工绣出一排针脚 → 使者逐针"绣"上身（伸手/抬头/托举）→ 史官记账（卷轴、账筹、一摞书）；`B.scroll` 五段关键帧 |

## 硬规矩（用户 2026-11-18 追加）

1. **不留白开场**：第 0 帧就要有笔触/画面在动，第一条线最迟 0.1s 落。pencil 已改成 0.10s 起画（头圆 → 肩线 → 脊柱 → 地平），全部 34 条照此执行。
2. **每条都要配 BGM**，从 `D:\@kaifa\@\@风格动画BGM\` 里选与本条风格匹配的一首（库里 11 首按题材分好）。

| 管线 | 选曲 | 理由 |
|---|---|---|
| pencil | `搞笑 Funny Quirky Comedy (...).mp3`（开头 0.45s 静音后进正题） | 铅笔测试是轻巧、带点狡黠的手作感，配轻快怪趣最搭 |
| shuicai | `非洲-部落 AMAZING AFRICA ⧸ Inspiring Cinematic Tribal Safari Jungle Nature ...`（0s 就进音乐） | 桉树林从烧黑到抽芽，配自然纪录片式的宏大弦乐 |
| shadow | `悬疑-神秘 01_Ancient_Rite_仪式感悬疑_Kevin_MacLeod.mp3` | 皮影是灯下的仪式感，暗场换戏正配仪式感悬疑 |
| tapestry | `宇宙-氛围 The Unseen Consequence ... (Ambient Score).mp3` | 挂毯是长卷编年史，配空灵缓慢的氛围弦乐，衬托布卷一路往左走 |

三条纯材质片（shuicai / shuimo2 / fushihui）BGM 要更淡，压到 0.3 左右，让材质自己的声音出来。

## 混音公式（已验证）

```powershell
ffmpeg -y -i raw.mp4 -i bgm.mp3 -filter_complex "[1:a]atrim=0:10,volume=0.42,afade=t=in:st=0:d=0.7,afade=t=out:st=8.9:d=1.1[bg];[0:a]atrim=0:10[vo];[vo][bg]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[a]" -map 0:v -map "[a]" -t 10 -c:v libx264 -crf 18 -c:a aac -b:a 192k out.mp4
```

单次 loudnorm 对 10 秒短片会略低 1.5–2.5 dB，混完要复测，再用 `volume=±XdB` 补到 **-16.0 LUFS / 峰值 ≤ -1.5 dBTP**（`alimiter` 会把整体抬上去，别用）。

## 已知坑（踩过的）

1. **`fig.walk(at, x, {})` 不要带 `speed`**：传 `{speed:'normal'}` 会算出 NaN 笔画，页面直接崩在 `ribbon()`（报 `Cannot read properties of undefined (reading '0')`）。速度只能靠时间点之间隔控制。
2. **`D.write` 只认内置字形**：数字和部分字母可以，`/`、全角符号、生僻字符会出 NaN 同样崩掉。要写字先用简单数字/字母。
3. **`wash:true` 不是橡皮**：画出来是实心粗黑笔，别当白色擦除用；要表现擦改就用细线把画断开。
4. `D.figure` 的 `y` 越大越靠下，画稿容易压住字幕；字幕区大约在画面下 1/8，人物基线要抬到位。
5. 10 秒短片单次 `loudnorm` 误差大（±2 dB），要两遍：第一遍 `print_format=json` 取 `input_i/input_tp/input_thresh/target_offset`，第二遍用 `measured_*` + `linear=true`。

## 背景层怎么加（pencil 已验证）

橡皮纸不是白底，是一张压在动画台上的纸。做法：在 `build(F)` 开头往 `#stage` 塞一层 SVG，`z-index:2`（在纸纹理 z1 之上、画稿 canvas z5 之下），`pointer-events:none`、`data-motion:skip`（别让帧检当成运动），挂之前先判 `.pencil-desk` 类避免重复渲染时叠加。

内容就四样：40%/34% 处的暖光晕（radialGradient）、底部桌面渐深、一排很淡的蓝色格线（动画纸的定位线，透明度 0.10）、左下角三张错位叠着的纸 + 右下角一支躺着的铅笔（带落影）+ 胶带角 + 铅笔屑。全部是矢量，缩放不糊。

## shadow / tapestry 两条的额外坑

- **模板 `index.html` 都是文字卡兜底**（`AUTOSCENE.build`），真场景在 git 历史：`git show c3690d0:shadow/template/index.html`（298 行）、`git show c3690d0:tapestry/template/index.html`（115 行）。取回后要把脚本引用从 `lib/` 改成 `runtime/`，并且**把管线自己的 `runtime/` 目录整个复制进工程**，否则页面里 `PROMO` 是 undefined。
- **时长不认 `timeline.json`，认 `timeline.js`**：`window.TIMELINE` 里写死 `duration`。渲染时长 = `TIMELINE.duration + tail`，所以要做 10 秒片就把 `duration` 写 9.6、`tail` 留 0.4；旁白 wav 也要 `apad` 补到 9.6，不然音画末尾会空。
- **`F.px()` 不能解构**：`const PX = F.px` 之后调用会崩在 `promo.js:318`（`Cannot read properties of undefined (reading 'u')`）。必须每次写全 `F.px(4.0)`。
- **`Y.leather` 的 `draw(g, k)` 里第一层要自己包 `k.sv('g', {}, g)`**，直接拿 `g` 去 `k.line` 也会崩同一处。
- **shadow 字幕由 PROMO 统一画**，`compose` 里 `captions: false` 有效；tapestry 关不掉（关掉也不影响，因为它画的就是我们 timeline 里的那两句）。
- **皮影换场别再补 `Y.lamp`**：`Y.change(t, dur, {to})` 之后要再 `Y.change(z+0.18, .55, {to:1, color:'warm'})` 才能亮回来，否则第二场一直是暗的。
- **tapestry 的 `B.push` 会连绣字一起放大出画**，样片里改成不用推镜；要推就只推 1.15 以内。
- **tapestry 人物是"一针一针绣上身"**：`at` 给得晚了会半截人，10 秒片里第二个角色最早 0.7s 起、第三个 5.4s 起才完整。

## 环境（每次渲染都要带）

```powershell
$env:PATH="D:\@kaifa\model\tools\ffmpeg7;$env:PATH"
$env:PLAYWRIGHT_CORE="D:\@kaifa\Auto-Video\piying\node_modules\playwright-core"
$env:CHROME_PATH="C:\Users\Administrator\AppData\Local\Google\Chrome\Application\chrome.exe"
```

`render-legacy.mjs` 需要 PATH 里有 `ffmpeg`，`PLAYWRIGHT_CORE` 不设会直接报"找不到 playwright-core"。

## 两条已验证的路子

**A. 手写场景（模板类管线）**：`<id> = D.PROMO.<id>(F, opts)`，DSL 见该管线 `lib/`。范例可从 git 历史取回：
`git show c3690d0:pencil/template/index.html > %TEMP%\pencil_old.html`。
模板默认的 `AUTOSCENE.build` 只会出"一句旁白一张字卡"，不能用来做样片。

**B. 切窗口 + 关字幕（有现成工程的管线）**：复制工程到 `samples-v2/work/<id>/`，在该工程里把字幕函数改成 `return;`，再：
`python <管线>/scripts/<管线>.py render <工程目录> --start A --end B --out ...`

## 收尾动作（统一）

```powershell
ffmpeg -y -i raw.mp4 -i samples-v2/audio/<id>.wav ^
  -filter_complex "[1:a]apad=pad_dur=3.2,loudnorm=I=-16:TP=-1.5:LRA=11,atrim=0:10.0[a]" ^
  -map 0:v -map "[a]" -t 10.0 -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k ^
  samples-v2/<id>-10s.mp4
```

## 剩下的 32 条怎么走

- 有 `template/` 的（shadow / tapestry / goldenage / manga / isometric / parable / blueprint / map / bianping / lvdong / laolang）：走 A，每条手写一支 10 秒场景。
- 有 `projects/` 的（gangbi 012_wind、labi 012_moon、shuimo yuren30、fushihui 012_toward、shuimo2 012_river、zhuangshi 012_starlight、weisuo 012_pomelo、pingban 038、ditu 038、caiqian 029、shouhui 012_shangzhouwang、xianshiqi UAP30、xuni 009_prion、dengju yuren30、shiliang 010_shengming30、piying、shadow）：走 B，需要先确认该工程字幕是读 `cues.js` 的 `captions` 数组还是现场画。
- 三条纯材质片（shuicai 已完成 / shuimo2 / fushihui）字幕一律留空。

## 待确认

- pencil 场景里两处 console 提醒（同一个 figure 的动作 4.14s 写在 5.87s 之后）不影响出图，写法待理顺。
- 是否用 samples-v2 顶替 `site/media` 卡片，等验收后再定。

---

## 第二批（2026-11-18 晚）· laolang / fushihui / shuimo2 / goldenage / manga

全部 1920×1080、30fps、10.000 秒、都有配音 + BGM、第 0 帧就有画面。

| 管线 | 成片 | 窗口 | 字幕 | BGM | 响度 dBTP |
|---|---|---|---|---|---|
| laolang | laolang-10s.mp4 | 16–26s | 烧 ASS 两行 | 宇宙-氛围 Royalty Free Ambient Space | -15.98 / -1.48 |
| fushihui | fushihui-10s.mp4 | 12–22s | 留空 | 悬疑 BGM_ambient | -16.98 / -1.50 |
| shuimo2 | shuimo2-10s.mp4 | 26–36s | 留空 | 悬疑-神秘 Ancient_Rite | -16.81 / -1.49 |
| goldenage | goldenage-10s.mp4 | 6–16s | 烧 ASS 两行 | 搞笑 Funny Quirky Comedy | -16.29 / -1.50 |
| manga | manga-10s.mp4 | 9–19s | 烧 ASS 两行 | 悬疑-罪案 Mystery & Crime | -17.24 / -1.46 |

### 这一批踩到的坑（下次直接照做）

1. **`captions: false` 要传两层**：compose 里一层，`PROMO.<style>(F, {…, captions: false})` 再一层。只改 compose 无效——库自己画字幕（goldenage 685 行、laolang 60 行）。
2. **同一个 compose 对象里可能已有 `captions: {…}` 键**，后写的覆盖前面的；laolang 模板就是这种（第 26 行把第 23 行顶掉了）。改之前先 `Select-String captions`。
3. `--out` 只能写文件名，绝对路径会被拼成 `<proj>/out/<绝对路径>`。
4. fushihui / shuimo2 的入口在 `vendor/runtime/render-legacy.mjs`，**必须**带 `PLAYWRIGHT_CORE` 和 PATH 里的 ffmpeg7，否则报“找不到 playwright-core”。
5. fushihui 的 `NOSUB` 是 `const NOSUB = QS.has('nosub')` → 改成 `true`；shuimo2 的字幕是 `subs.js` 的 `subtitle()`（题跋），首行 `return;`。两条都在 projects 下复制成 `913_sample` 再渲，参数传 slug。
6. laolang 模板 `lib/` 只有 `story.js`，从 `laolang/runtime/` 复制 core/promo/goldenage/laolang/toon/cast-lite/act/autoscene 进去才不报 `PROMO is not defined`。
7. 单遍 loudnorm 常低 1.5–2.6 dB，用两遍法补（脚本 `loudfix.ps1`，实测 -17.5 → -16.9）。
8. 三条带字幕的片子，字幕用 `make_subs5.py` 按字数比例切两半生成 ASS，字号 58、白字黑描边 3。

---

## 第三、四、五批（34 条全部出片）

**第三批（11 条）**：pingban / labi / gangbi / weisuo / zhuangshi / ditu / shuimo / shiliang / xianshiqi / xuni / dengju。
工程 `git checkout backup-pre-rewrite -- <管线>/projects/<slug>` 补回，复制成 `913_sample`，逐条关库层字幕，渲整片后 ffmpeg `-ss` 切 10 秒；字幕 `make_subs_batch.py` 优先按「。」切句；混音 `mix_batch3.ps1`。

**第四批（模板组 4 条）**：isometric / blueprint / parable / map
- 手写场景必须取 `git show c3690d0:<p>/template/index.html`，当前 repo 是 `AUTOSCENE.build` 兜底版。
- three 三件套：`three.module.js` + `three.core.js` + `examples/jsm → lib/addons`，**主模块与 addons 必须同版本**（用 dengju\node_modules\three 一整套）。
- importmap 两个前缀都要改本地：`three` 与 `three/addons/`。
- 模板组字幕键会重复，`captions: {…}` 那行必须删掉，只留 `captions: false`。
- 渲染自检会因「空放/静止」中止成片，确认是有意的就加 `--force`。
- map 额外：d3.min.js、topojson-client.min.js 本地化；`const CDN='./lib/atlas/'`，把 `countries-110m.json` 放到 `lib/atlas/world-atlas@2.0.2/`；`G.world({detail:'110m',states:false})`；设置 `AV_CDP_TIMEOUT=600000`，否则 544 秒工程的 setup 会 120 秒超时；map 的 out 目录要先建。

**第五批（8 条：仓库工程缺件，改用同款风格库 demo 出片）**
- lvdong → `开源风格库\styles\silhouette-rhythm`（旧核心 `core/render/video.mjs` 渲染，`/styles/...` 改成相对路径）。
- caiqian → 旧核心直接渲 `caiqian\projects\913_sample`（仓库无 runtime）。
- bianping → flat-space-explainer、shouhui → sketchnote、zhidiao → papercut-red、xiangsu → pixel-rpg、huixingzhen → hardcore-info、lishi → engraving、piying → shadow-puppet、jianying → printed-long-take。
- 老库 demo 的坑：① 字体 gitignore，`@font-face` 的 `url(fonts/…)` 一律换 `local('Georgia')`；② 有的字体在 JS 里 `new FontFace(...)`，要 try/catch；③ 字幕有的是 DOM 选择器（CSS 隐藏即可）、有的是 canvas 画（`drawSub` 首行 `return;`）、有的支持 `nosub` 参数（改成 `NOSUB = true`）；④ paper-popup 要 `node_modules/three`，缺 HDR 素材跑不起来，改用 printed-long-take。

**统一收尾**：字幕 `sub-<id>.ass`（微软雅黑 58px、白字黑描边 3、MarginV 80），混音公式 `fps=30 + ass` / `audio 550ms 延迟 + apad` / `BGM volume 0.42 + 淡入 0.7s 淡出 8.9s` / `amix normalize=0` / 单遍 `loudnorm I=-16 TP=-1.5 LRA=11`，输出 `-crf 18 -preset medium -c:a aac 192k`。全部 34 条复检：1920×1080 / 10.0s / 有音轨。

---

## piying 皮影卡片重制 v2（2026-11-20）

老样片问题：前 5 秒空场景、只有黄橙一路色、人物快结束才上台、道具只有山房树草。
重制保留管线优势（素白幕背光 / 透光牛皮 / 镂空漏光 / 一物一杆 / 红纸签 / 灯暗换场），改成两场热闹戏。

- **工程**：`samples-v2/work/piying_v2/`（`index.html` 手写场景 + `brief.md` 事实表 + `lib/` 从 `pipelines/shadow/runtime` 复制 core/promo/shadow/rods 四件）。参考底本是 `git show c3690d0:shadow/template/index.html`，已存成工程里的 `_ref_anu.html`。
- **第一场 0–4.55s 元宵灯会**：将军朱红骑马（`horse.move + gallop`，`gen.ride(horse)`）、娘子靛蓝水袖舞、文官墨绿说话作揖；楼阁、青绿+靛蓝两山、金月、祥云、六盏红灯笼、灯/会两旗、花丛、三只飞鸟，全部 `at: 0`，第 0 帧满台在动。
- **第二场 4.55–10s 武场**：白蛇游场抬头吐信、将军与丑角对打、娘子续舞；酒坛、芦苇、月亮、灯笼、飞鸟补齐密度；红纸签「四道门」→ 大字「开灯」→ `Y.lamp(9.0, {to:1.06})` 收尾。
- **渲染**：`node pipelines/shadow/runtime/render.mjs <工程> --no-audio --out raw.mp4 --workers 4 --blur 4 --force`，236 秒出 300 帧。**这条 render.mjs 走 CDP，不需要 PLAYWRIGHT_CORE**（那是 render-legacy.mjs 的事），只要 `CHROME_PATH` + PATH 里的 ffmpeg。
- **成片**：1920×1080 / 30fps / 10.000s / -15.97 LUFS / -1.94 dBTP；`samples-v2/piying-10s.mp4` + `site/media/piying.mp4`（1024×576）+ `piying.jpg`（取 3.2s）。BGM 用「搞笑 Funny Quirky Comedy」，配灯会的热闹，不用 shadow 那条的悬疑仪式感。

### 这一轮踩到的坑

1. **`k.blob()` 返回 path 字符串，不是点数组**：`k.plain(g, k.blob(pts), color)` 直接用；再包一层 `k.poly()` 就报 `pts.map is not a function`。`k.ring/oval/rose` 才是点数组，才配 `k.poly`。
2. **`Y.prop fire` 别放在山上**：multiply 叠在山皮上变成一撮黑刺，读不出火焰。要热闹用 jar / reeds / blossom 更稳。
3. **白蛇参数决定像不像蛇**：`w 54 + amp 74 + waves 3` 是一根粗波浪带子；改成 `w 34 / amp 46 / waves 2.5 / speed 2.2 / crawl 58`，细长多折才灵动。
4. **人物头顶别挂灯笼**：灯笼 `y ≈ 0.30H` 正好压将军头盔，错开 `x` 或抬到 `0.26H`。
5. **楼阁 `palace` 很抢戏**：`size 540 + depth .35` 是一大片灰黑屋顶；`size 370–430 + depth .5–.55` 虚化后才衬人物。
6. **无 brief.md 会报「事实核对」错误**：样片也要写一张屏幕文字表，列清每个上屏的字。
