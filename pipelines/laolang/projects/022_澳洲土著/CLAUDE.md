# 022 澳洲土著 · 项目交接（新窗口先读这份）

> 工作目录：`D:\@kaifa\Auto-Video\laolang`。管线规范见 `SKILL.md`，本轮新增的强制规则见
> `references/sync.md`。全局机器约定见 `C:\Users\20200\.claude\CLAUDE.md`（称呼「宝哥」、本地操作免确认、
> 个人资料走 Obsidian、公司资料走 CompanyKB、OCR 只用 Dabao-OCR）。

## 现在到哪了（2026-11-11 下午）

- **全片已完成并交付（12:49）**：195 镜 / 537.43 s 全部实现，`out/video-16x9.mp4`
  （30 fps / 史诗 BGM 版）全片 `shots` + `sync --ocr` PASS，交付包在 `laolang/out/001 会飞的中国人/`。
  细节见下文「全片已合成并交付」一节（含响度 -18.2 LUFS 这道待宝哥拍板的口子）。
- **人物**：29 人设定图已按管线出齐并审核通过；源码 `lao_cast_022.js`（页面用）与
  `toon-cast/` 冻结源码都**不要再改**。
- **全片时间轴**：已用真实 ASR 词时间重建，`timeline.js/json` = **132 句 / 537.43 s**；
  `paragraphs.js` 同步。ASR 原始文件在 `review/asr_a.json`、`asr_b.json`、`asr_c.json`。
- **20 秒样片 8 镜（2026-11-11 已渲染，sync 全项 PASS）**：
  - 切点：0 / 2.98 / 5.82 / 8.08 / 10.10 / 12.22 / 15.36 / 17.42 / 20.12；
    时长 2.02–3.14 s（平均 2.52）；全部落在 ASR 词首或 ≥0.12 s 停顿
    （8.08 距「骑」8.28 为 0.20 s，其余 Δ0.00）。
  - 画面：S01 酒馆全景入座倒酒；S02 澳洲内陆夜（篝火、长老侧坐矮石上屈膝讲故事、持矛武士、
    手印岩壁、银河）；S03 潘德明骑自行车飞过月亮（外套三条飘带 + 领带后掠）；S04 黎明山路骑行；
    S05 双翼机追不上；S06 酒馆过肩近景（朋友先愣后问）；S07 双人中景「是不是姓潘 / 对呀」；
    S08 拍桌（17.94 落掌、碗跳、停 0.2 s）+ 驴友震惊 + 虹膜收尾。
  - **2026-11-11 已修上一轮三处疑点**：
    S02 长老改为真正坐姿（矮石座、屈膝、双脚朝火，不再是「站着像木桩」）；
    S03 飘带加长提亮、分三条并错开摆动相位、加奶白描边，夜里读得清；
    S08 拳头加大并移到酒壶右侧（不再被壶挡），先抬拳到胸前外侧再拍下，桌面墨圈 + 尘点加强。
    字幕 **34 → 37 号**（宝哥要求再大 3 号，现与全片 `index.html` 一致），重渲后重新出过审阅包。
  - 新增绘制函数都在 `sample.html` 第 5–8 节：`outbackScene` / `drawBikeLocal` /
    `drawFlightCoat` / `drawPanFlight` / `flyingScene` / `drawRider` / `mountainScene` /
    `drawBiplane` / `biplaneScene` / `drawOtsShoulder`；`sound.js` 新增 `engine` 配方（航空发动机）。
  - `storyboard.md` 的 20 秒样片表已同步为这 8 镜。
  - 16 张审阅帧 + 每镜两帧拼图：`review/still-*.png`、**最新审阅包 `review/_review4/`**
    （`sheet.jpg` + `pair-S01…S08.jpg` + `thumb-01…16.jpg`）；上一版 `_review3/` 保留对照。
  - `python scripts/laolang.py shots projects/022_澳洲土著/sample.html --video out/video-16x9.mp4`
    已 PASS；`sync --ocr` 也 PASS（`review/sync_qa.json` 的 `ok: true`，音频滞后 0 ms，
    ASR 逐句起点中位偏 0.087 s / 超差 0 句）。**当前 `out/video-16x9.mp4` 就是这版 8 镜样片**
    （2026-11-11 06:34 重渲，604 帧 / 20.13 s），可以直接拿它验收。
- **宝哥已点头（2026-11-11）**：上一轮点名的三处（S02 坐姿、S03 飘带、S08 拳头）已改并重渲，
  审阅包在 `review/_review4/`；下一步是全片 537.43 s 重切。

### 全片重切（2026-11-11 中午开工）

- **分镜计划**：新增 `scripts/plan_shots.py`，用 `timeline.json` 的词级时间 + `storyboard.md`
  的 S01–S77 幕块表自动切镜 → **`review/shotplan.json` / `review/shotplan.md`：195 镜 / 537.43 s**。
  时长 2.02–4.08 s（中位 2.77）；切点 = 句首 92 / 长停顿 26 / 句读 35 / 词首 41 / 片头 1，全部合法。
  已验收样片的 7 个切点用 `--fixed "2.98,5.82,8.08,10.10,12.22,15.36,17.42"` 锁死，0–20.12 s 与样片逐帧一致。
  命令：`python scripts/plan_shots.py projects/022_澳洲土著 --fixed "2.98,5.82,8.08,10.10,12.22,15.36,17.42"`。
- **`index.html` 已重建**：原来那份 `index.html` **不是 022 的页面**，是另一部片子（玄奘 62.2 s 模板），
  已备份到 `review/_index_xuanzang-template-62s.html`。新的全片页由已验收的 `sample.html` 派生，
  加载 `timeline.js`，0–20.12 s 沿用样片 8 镜，20.12 s 之后按 shotplan 续写。
- **第一幕 0–46.89 s 已完成（18 镜）**：
  - 0–20.12 s = 样片原样（酒馆 → 澳洲夜 → 飞过月亮 → 山路 → 双翼机 → 过肩 → 双人 → 拍桌）。
  - 20.12–23.32 驴友近景（"我爷爷就是个厨师"）；23.32–26.60 闪回后厨（03 晚年杀鱼，暖褐回忆色）；
  - 26.60–29.62 三人中景（表弟 06 从桌右探身插嘴）；29.62–32.72 后厨刀砧近景；
  - 32.72–35.40 拆迁废墟全景；35.40–37.76 阁楼翻箱；
  - 37.76–40.02 泰姬陵照片特写；40.02–42.72 举照片拉回中景；
  - 42.72–44.86 照片推到满屏；44.86–46.892 旧报版面 + 网点，青年潘德明（01）从纸里浮出。
  - 成片 `out/video-16x9-act1.mp4`（1920×1080 / 30 fps / 46.90 s）；`shots` 已 PASS
    （18 镜 2.02–3.28 s，切点全部落在词界/停顿；报告 `review/sync_qa_shots.json`）。
    `sync --ocr` 全项 **PASS**（报告 `review/sync_qa.json` 的 `ok: true`：音频滞后 0 ms / r=0.9996，
    ASR 逐句起点中位偏 0.020 s / 超差 1 句（相似度 79% 是 small 模型同音字误差），
    字幕 OCR 本段 25 条逐条相符；声明切点 17 检出 16，17.42 未检出属场景检测漏检，逐帧确认对得上）。
    样片那份另存为 `review/sync_qa_sample8.json`。分段渲染的成片现在只校验本段内的字幕/切点
    （`sync_qa.py` 的 `video_duration()` 过滤）。
  - 新增/改动的绘制：`tavernScene` 支持 `opt.e04 / e05 / extra`（表情覆盖 + 追加人物），
    `draw06Table`（表弟坐桌右），`atticScene(ta, liftAt, {actor, hand})`（举照片时间可参数化），
    `halftone()`（旧报网点）。
- **第二幕 46.89–106.00 s 已完成（21 镜，S19–S39）**：上海站人海与「亚洲步行团」合影（少一人）、
  口号横幅、报纸线索、新加坡图书馆、季一德翻档案、护照与《名人留墨集》「壮游」。
  成片 `out/video-16x9-act2.mp4`（59.12 s / 30 fps）；`shots` PASS，`sync --start 46.89 --ocr`
  全项 PASS（视频 59.115 s，音频滞后 0 ms / r=0.9998，ASR 文本比 0.79、逐句起点中位偏 0.074 s /
  超差 1 句，OCR 34 条 0 失败；声明切点 20 检出 19，0.0 段首不计）。
- **第三幕 106.00–174.96 s 已完成（25 镜，S40–S64）**：
  - 湖北水乡（少年 02 在河岸）→ 油灯地图航线 → 晨跑院子（识字课本）→ 1927 南京运动会 →
    跳高没人过杆（人翻进沙坑）→ 潘德明西装皮鞋跳过去 → 四牌楼「天堂」西餐厅 →
    读报「亚洲病夫」→ 把餐厅交给姐姐 → 追到杭州入团 → 靠做饭被收下 →
    烈日减员 → 厦门写信/经费 → 进越南华侨捐款 → 领队不想走 → 争执 → 退团 →
    杭州/西贡买车 → 骑车离开。
  - 成片 `out/video-16x9-act3.mp4`（68.97 s / 30 fps，2026-11-11 07:54）。
    `shots --start 106.0` PASS（25 镜 2.18–3.59 s，切点全部合法；声明 25 检出 24，0.0 段首不计）；
    `sync --start 106.00 --ocr` **全项 PASS**（报告 `review/sync_qa.json`，另存
    `review/sync_qa_act3.json` / `review/sync_qa_shots_act3.json`：音频滞后 0 ms / r=0.9998，
    ASR 文本比 0.91、19 句、起点中位偏 0 / 最大 0.30 s / 超差 1 句，OCR 37 条 0 失败）。
  - 本段新增/改动的绘制：`hubeiScene` `dreamScene` `prepScene` `bunting` `drawHighJump`
    `stadiumBack`（`opt.fall` 横杆倒）`restFacade` `restInside({evening,calendar})` `newsScene`
    `paperClose` `handoverScene` `hangzhouScene` `cookScene` `heatRoadScene` `xiamenScene({money})`
    `vietnamScene({bare,focus})` `vietnamEdgeScene` `leaveScene` `saigonScene({bare})`；
    `drawJunk`（乌篷船）。屏幕文字只上了：一八九八·湖北 / 一九二七·南京 / 天堂 / 杭州 / 西贡。
- **第四幕 174.96–278.88 s 已完成（36 镜，S65–S100）**：
  - 新加坡使馆（街上 → 递名片 → 大使打量 → 退护照 →「你就是那个步行团的吧」）→
    门口台阶差点哭 → 家信/南方水灾 → 华侨社团 → 胡文虎（万金油/星洲日报）→
    留墨集题词「愿世上所有道路都留下你的足迹」→ 潘在扉页写「世界是我的大学」→
    次日拿到印度签证 → 加尔各答泰戈尔（1924 访华叠化：林徽因/徐志摩/十六岁学徒）→
    学生跪礼摸鞋尖、夜谈 → 甘地 → 护照地图越走越远 → 全家福 + 明信片 → 希特勒 →
    伦敦旧货摊认出被偷的车、摊主喊「冒险家来了」→ 纽约（自由女神/帝国大厦/渡轮）→
    罗斯福轮椅 → 芝加哥世博会 → 福特十二种原材料木箱 → 西藏地图（念头埋下）。
  - 成片 `out/video-16x9-act4.mp4`（103.92 s / 30 fps / 3117 帧，2026-11-11 08:24）。
    `shots --start 174.96` **PASS**（36 镜 2.10–3.96 s，切点全部合法；声明 36 检出 35，
    0.0 段首不计）；`sync --start 174.96 --ocr` **全项 PASS**（报告 `review/sync_qa_act4.json` /
    `review/sync_qa_shots_act4.json`：音频滞后 0 ms / r=0.9997，ASR 文本比 0.8802、
    起点中位偏 0.12 s / 最大 0.40 s / 超差 1 句，OCR 55 条 0 失败）。
  - 本段新增绘制：`embassyExterior` `embassyOffice` `drawOfficeDesk` `passportClose`
    `homeLetterScene` `clubScene` `huOfficeBg` `huDesk` `bookScene` `visaScene`
    `calcuttaRoom` `stage1924` `tailorShop` `gandhiScene` `travelMontageScene`
    `familyPhotoScene` `hitlerScene` `londonMarketScene` `nyScene` `fdrScene`
    `chicagoScene` `fordBoxScene` `tibetThoughtScene`。
  - 本段踩到的坑：`AP.sit` / `AP.kneel` 不画腿，坐姿人物放在空地上会「悬浮」——要么改
    站立驼背，要么在身下垫坐垫/家具；`actorFront` 不认 `actPose`，要抬手一律用 `actorSide`；
    `inkLine` 的多点必须传**扁平坐标数组**，嵌套 `[[x,y],…]` 会整条画不出来。
- **第五幕上半 278.88–325.62 s 已完成（17 镜，S101–S117）**：
  - 印度密林往北 → 阿拉伯沙漠敲鼓退虎影 → 夜里被土匪绑了、翻箱只找到笔记本/信件/手鼓 →
    头目翻看手鼓、跟手下嘀咕 → 蒙眼推走 → 天亮解开眼罩，箱子完好、土匪不见影 →
    德黑兰茶馆老人讲「带鼓不带枪的是好人」→ 鼓比保镖管用 →
    波斯宫廷礼萨汗见他，「像看一面旗」。
  - 成片 `out/video-16x9-act5.mp4`（46.7 s / 30 fps / 1403 帧，2026-11-11 08:51）。
    `shots --start 278.88` **PASS**（17 镜 2.14–3.50 s，切点全部合法；声明 17 检出 15，
    漏检 301.72 / 307.24 两处——前镜头同色沙漠、后镜头同色茶馆，直方图检测误判，
    抽帧确认两处都是真硬切）；`sync --start 278.88 --ocr` **全项 PASS**
    （报告 `review/sync_qa_act5.json` / `review/sync_qa_shots_act5.json`：音频滞后 0 ms /
    r=0.9996，ASR 文本比 0.8734、11 句、起点中位偏 0.10 s / 最大 0.42 s / 超差 1 句，
    OCR 25 条 0 失败）。
  - 本段新增绘制：`drawTiger`（沙丘边老虎侧影）`indiaForest` `desertScene` `drawDesertCity`
    `drawTravelBox` `drawDrum`（绳网/鼓钉）`drawGrip`（扣鼓沿的手）`drawThrone`（波斯王座）
    `banditCamp` `spillScene` `tehranTeaScene` `palaceScene`。
    屏幕文字只上了：阿拉伯沙漠 / 德黑兰 / 手鼓 / 礼萨汗。
  - 本段踩到的坑：老虎第一版是平躺椭圆+竖线，像虫子，改成「背—臀—腿—颈—头」的整块侧影
    才读得出是虎；鼓面纯白会被看成盘子，加交叉绳网+鼓钉+高光才像手鼓；蒙眼布不要靠估算
    头部坐标——先渲一帧、按帧里的眼睛位置反推 scene 坐标，一次调准。
- **第五幕下半 325.62–364.84 s 已完成（14 镜，S118–S131）**：
  - 大马士革换新车 → 新车骑到耶路撒冷被偷（地上粉笔车影）→ 开罗留学生当向导看金字塔 →
    旧照片里金字塔半边埋在沙里 → 刀扎石缝扎不进去 → 埃及学生夜里叫他大哥、催大家用功 →
    希腊报纸讽刺 1932 年的中国 → 次日爬奥林匹斯山、石柱上刻多国文字 →
    巴黎夜谈（凯末尔 / 顾维钧 / 张学良），少帅题「壮游」→ 罗马当街枪战 → 巴黎战争前夜。
  - 成片 `out/video-16x9-act5b.mp4`（39.2 s / 30 fps / 1176 帧，2026-11-11 09:09）。
    `shots --start 325.62` **PASS**（14 镜 2.24–3.34 s，切点全部合法；声明 14 检出 12，
    漏检 t=0（段首不可检）与 342.64（S123→S124 同为开罗夜景、同一构图，直方图检测误判；
    抽帧 16.83 / 17.20 s 确认是真硬切）；`sync --start 325.62 --ocr` **全项 PASS**
    （报告 `review/sync_qa_act5b.json` / `review/sync_qa_shots_act5b.json`：音频滞后 0.0 ms /
    r=0.9995，ASR 文本比 0.890、21 句、起点中位偏 0.12 s / 最大 0.376 s / 超差 1 句，
    OCR 21 条 0 失败）。
  - 本段新增绘制：`damascusStreet` `jerusalemStreet`（错缝砂岩墙 + 粉笔车影）`pyramidScene`
    `cairoNight` `greekPaper` `olympusScene`（带柱础/柱头的石柱）`parisSalon` `romeStreet`
    `parisScene`（铁塔桁架）`sitFig`（盘腿学生）。屏幕文字只上了：大马士革 / 耶路撒冷 /
    开罗 / 金字塔 / 奥林匹斯山 / 凯末尔 / 顾维钧 / 张学良 / 壮游 / 罗马 / 巴黎。
    `sound.js` 新增 `gun`（街头手枪），罗马三枪用 `gun`。
  - 本段踩到的坑：`carve()` 之类的自写小函数一定要核对**参数个数**——把 6 个数字塞进
    `carve(x1,y1,x2,y2,w)`，第 5 个数会被当成线宽，画面里出现几根从天花板压下来的黑柱；
    `sitFig` 第一版是一个梯形身子+一个圆头，读成「花瓶」，加了盘腿的宽底、手臂和本子才像人；
    沙龙的长桌必须**画在人之后**，先画桌子会被人挡住、后画才压住腿；`inkFill` 前要有地面，
    否则桌子下方露出背景。
- **第六幕 364.84–427.52 s 已完成（23 镜，S132–S154）**：
  - 悉尼港接船（桥拱 + 蒸汽船 + 栈桥）→ 洗衣房女华侨熨衣 → 后院送新车（红绸）→
    蓝山公路骑车 → 回旋镖把人从车上打下来 → 绑在柱子上、武士围住 → 矛尖抵胸 →
    毛利语声波解围 → 长老上前说「我的朋友」→ 火边夜宴（蜂蜜酒、烤蜥蜴）→
    讲一路见过的世界（地球仪虚影）→ 清晨武士护送下山 → 悉尼机库朋友摊开地图 →
    飞机沿山路找 → 俯瞰公路/飞机/自行车 → 墨尔本机场 → 近景两人不敢相信 →
    部落火堆传说 → 九十年后驴友听老人讲 → 驴友近景鸡皮疙瘩 → 上海茶馆当谈资 →
    一个人一辆车一面鼓 → 火边三杯相碰。
  - 成片 `out/video-16x9-act6.mp4`（62.7 s / 30 fps / 1881 帧，2026-11-11）。
    `shots --start 364.84` **PASS**（23 镜 2.31–3.96 s，切点全部合法；声明 23 检出 21，
    漏检 382.82（S139 毛利语）与 392.24（S142 讲世界）——都在前后同一暗夜火光构图的
    直方图不可分区段，按既有口径记为检测漏检）；`sync --start 364.84 --ocr` **全项 PASS**
    （报告 `review/sync_qa_act6.json` / `review/sync_qa_shots_act6.json`：音频滞后 0.0 ms /
    r=0.9997，ASR 文本比 0.855、19 句、起点中位偏 0.08 s / 最大 0.46 s / 超差 1 句，
    OCR 35 条 0 失败）。
  - 本段新增绘制：`sydneyHarbour`（桥拱 + 桥塔 + 蒸汽船 + 栈桥）`laundryScene`（晾衣绳/
    熨衣板/蒸汽）`bikeYardScene` `blueMountainRoad` `boomerangScene`（飞行/击中/翻车扬尘）
    `boundScene` `spearCloseScene` `maoriScene`（声波弧）`elderStepScene` `feastScene`
    `taleScene` `escortScene` `searchScene`（飞机沿山路）`hangarScene` `overheadScene`
    （俯瞰公路/飞机影子）`melbourneField` / `airfieldClose` `hikerCampScene` / `hikerCloseScene`
    `teaTableScene` `threeThingsScene` `toastScene`；小件 `childSit` `drawSpear` `drawMeadCup`
    `campTreeLine` `campDuskBg` `drawHarbourArch` `drawSteamer` `drawShirt` `drawBoomerang`
    `drawLizard` `drawTeapot`。
    屏幕文字只上了：澳大利亚 / 悉尼 / 毛利语 / 我的朋友 / 蜂蜜酒 / 墨尔本。
    `sound.js` 没有新增配方，全部复用已有音色。
  - 本段踩到的坑：**`G.shot(a, b, …)` 的 a、b 必须是数字字面量**——`sync_qa.py` 的
    `SHOT_RE` 只认 `\d+(\.\d+)?`，写成常量（`G.shot(E_ARR, E_WOMAN, …)`）会让页面声明在
    上一个数字镜头处静默截断（表现为「声明 0」「末镜结束 364.84」但结论仍 PASS）。
    时间常量可以留给 `K()` / `F.sfx()` 用，镜头边界一律写数值。
  - 第二轮润色（桥塔、洗衣房窗、回旋镖翻车、矛尖加粗、机库门外的飞机剪影、把
    `biplaneScene` 换成新画的山路找飞机、机场跑道虚线、鼓架、三杯相碰）**渲了静帧但没复看**
    （本会话读图预算用尽）。下次开窗先目视 `review/still-365.80/368.60/376.60/381.60/
    399.00/403.70/414.90/426.40.png` 确认，再决定是否细调。
- **第七幕 427.52–486.02 s 已完成（22 镜，S155–S176）**：
  - 新加坡华侨大会堂庆祝 → 捐款一万美元 → 西藏地图（铅笔圈住）→ 地图特写 →
    东南亚路线（马来亚·泰国·缅甸）→ 桂林山水（徐悲鸿）→ 留墨集题词「人有志向」→
    一九三七年七月六日上海北站 → 卢沟桥事变旧报 → 家书 → 捐款/抗战 →
    旧箱子遗物（护照/日记/相册）→ 上海弄堂 → 昏暗中翻相册 → 晚年厨房 → 后厨近景 →
    季一德在档案室翻出护照 → 档案室光线（重见天日）→ 纪录片《寻找潘德明》放映 →
    二零二六书桌 → 后人读文章 → 世界地图收尾。
  - 成片 `out/video-16x9-act7.mp4`（58.5 s / 30 fps / 1755 帧）。
    `shots --start 427.52` **PASS**（22 镜 2.0–3.5 s，切点全部合法；声明 22 检出 21，
    0.0 段首不计）；`sync --start 427.52 --ocr` **全项 PASS**
    （报告 `review/sync_qa_act7.json` / `review/sync_qa_shots_act7.json`：音频滞后 0 ms，
    字幕 OCR 全部相符，含收尾句「十多个国家 数万里路的年轻人」）。
  - 本段新增绘制：`drawLantern` `singaporeHall` `donationScene` `tibetMapScene`
    `tibetMapClose` `seAsiaMap` `guilinScene` `inscriptionScene` `shanghaiStation`
    `lugouScene` `letterScene` `moneyScene` `chestScene` `alleyScene` `albumDarkScene`
    `backKitchenScene` `kitchenCloseScene` `archiveRoomScene` `archiveLightScene`
    `screeningScene` `desk2026Scene` `articleScene` `worldMapScene`。
    屏幕文字只上了：新加坡 / 一万美元 / 西藏 / 马来亚 · 泰国 · 缅甸 / 桂林 / 徐悲鸿 /
    人有志向 / 一九三七年七月六日 / 卢沟桥 / 抗战 / 寻找潘德明 / 二零二六 /
    七年 · 四十多个国家 · 数万里。
    SFX 约 50 条，全部复用已有音色（crowd/low/cup/paperTurn/glint/room/whoosh/wind/
    splash/drip/whistle/steam/step/stamp/knock/chop/dust/engine），2026 键盘声是
    `knock` 高频短促循环，没有新增配方。
  - 本段踩到的坑：
    1) **收尾叠加文字压到字幕带**：`七年 · 四十多个国家 · 数万里` 原写 y 660，正好盖住
       烧录字幕，OCR 读出乱码（C28 FAIL）。叠加文字一律避开逻辑 y 620 以下，改到 y 118 后通过。
    2) **新 scene 函数重名**：Act 7 的 `kitchenScene` 覆盖了 Act 3 已有的 `kitchenScene`
       （JS 后声明覆盖前声明，会让第三幕后厨变样）。插入新函数后用
       `grep -o 'function [a-zA-Z0-9_]*' index.html | sort | uniq -c | sort -rn | head` 查重名，
       已把 Act 7 的改名为 `backKitchenScene`。
    3) 镜头边界继续写数字字面量（第六幕的 `SHOT_RE` 坑），时间常量只给 `K()`/`F.sfx()` 用。
  - 视觉复看：`review/_sheet7a/sheet.jpg`（428.60–455.50，11 帧）与
    `review/_sheet7b/sheet.jpg`（457.50–485.20，11 帧）已生成；两轮独立审图后**三处必改已改并复验通过**：
    444.40 的「人有志向」原来 x560/y330/76 号压在掌心，改到 x494/y300/72（手掌与字现在隔 52 px）；
    450.50 的四指改成平行指束（指根沿掌横轴排开、同向，13 条切面稳定 4 段）；
    474.00 的左光带压到剪影左缘（taper .4→.2）。**三项复验结论：过。**
    改完重渲 `out/video-16x9-act7.mp4`（58.5 s / 1755 帧），`shots --start 427.52` PASS、
    `sync --start 427.52 --ocr` PASS（ASR 相似度 86.9%、15 句起点中位偏 0.12 s / 最大 0.38 s / 超差 1 句），
    报告已归档 `review/sync_qa_act7.json` / `sync_qa_shots_act7.json`。
- **第八幕 + 第九幕 486.02–537.43 s 已完成（19 镜，S177–S195）**：
  - 你看明白没有（酒桌近景）→ 间隔年/机场背包客拉杆箱 → 九十年前穿西装跳过横杆 →
    英国签证官 → 澳洲内陆手鼓退匪 → 一面手鼓换一条命 → 篝火夜 → 遗物（护照/日记/相册）→
    2026 后人 → 片尾：牵狗走进巷口、抬手挥手、片名「会飞的中国人」+ 副题。
  - 成片 `out/video-16x9-act8.mp4`（51.4 s / 30 fps，含 `score.js` 配乐，说话时压 23 dB）。
    `shots --start 486.02` PASS（19 镜 2.06–3.52 s，切点全部合法；声明 19 检出 18，
    0.0 段首不计）；`sync --start 486.02 --ocr` **全项 PASS**
    （报告 `review/sync_qa_act8.json` / `sync_qa_shots_act8.json`：ASR 相似度 89.7%、
    13 句起点中位偏 0.08 s / 最大 0.22 s / 超差 0 句，字幕 28 条全部 ✓）。
  - 视觉复核中修掉的（按独立审图的屏幕坐标改，最后一轮复验：四指组全过、横把组 11 行达标）：
    1) 524.40 沙漠鼓的手：袖口改成实体环（浅色前臂端头收进环里，不再有"黑描边圆头封口"），
       前臂改锥形（近肘 30 → 近腕 21），金色边缘光贴上缘、不压绳网，四指改平行指束 + 独立描边拇指；
       **四指纹路最后一版**：指根 fy0 = 500/510/520/530，描边 7.6、肤色 4.6 → 实测指缝 4–8 屏幕 px，
       31 行满足"四段且缝 ≥4 px"（独立复验：B1/B2/B3 全过）。
    2) 536.90 片尾挥手：toon 手臂只有 ~87 world px、够不到头顶，改为**另画一条**肩(613,347)→肘(650,313)→
       腕(718,228) 的手臂 + 张开的手掌（掌心 730,214，四指 38 长、间距 14、指缝 ≈10 屏幕 px）+ 拇指；
       手背比晚霞暗一档（#cf9360，逆光读得出）；胸前握绳的手补 3 条指缝；左后方补一条 ≥35 px 宽的远侧摆臂
       （画在 `actorSide` 之前，压在大衣后面）。
    3) 537.20 片名：副题从居中改到 logical x368 / size25（屏幕中心 ≈792、y≈249），右端 ≈1030，不再压帽冠；
       顶部暗栏改成 y≤53 压暗 26% + 17%/8% 两档柔化到 y70，有一条看得见的下边界。
    4) 489.60 拉杆箱：整箱下移 14、右移 14（轮底 ≈929 贴鞋底 933），**改画在人物之前**（鞋压轮子）；
       箱子自己那根横把会被外套整段盖住，所以在 `actorSide` **之后**补画三样：袖子（logical
       474,520→512,484，外套绿 #939b48 + 深描边）、压住横把的手掌（掌心 518,474，屏幕 ≈960,651）、
       以及一段**实心近黑短杆** `inkShape(519,473.6 → sx+13,480.4)`（screen x≈974–996 / y≈652–661）
       把它连到右立杆顶（立杆顶端从 483 抬到 476）。**别给这段横把加高光**：实测 1 px 高光会把
       6.2 宽的线劈成两条细边，`sum<170` 只剩 2 行 → 复验不过；改成实心填色后 652–661 共 10–11 行全黑。
  - `score.js` 已启用（`script.json` 的 `bgm: true`）：D 大调 / 84 BPM，10 段和弦、9 个声部，
    低音拨弦与弦乐 `underVoice:'keep'`，其余声部说话时退开。
- **全片已合成并交付（2026-11-11）**：`out/video-16x9.mp4`，537.4 s / 16123 帧 / 1920×1080 / 30 fps /
  295 MB，旁白 + `sound.js` 音效 + `score.js` 配乐。
  - `shots` 全片 PASS（195 镜、0 镜越界；声明切点 194 个检出 189，5 个没检出：17.42 / 301.72 /
    307.24 / 342.64 / 392.24 —— 都是相邻两镜画面太像，场景检测漏检，逐帧看过不是缺帧）。
  - 全片 `sync --ocr` **PASS**（报告 `review/sync_qa_full.json` / `sync_qa_shots_full.json`）：
    音频滞后 **0.0 ms**（r=0.9996）、ASR 相似度 **90.3%**、132 句起点中位偏 **0.10 s** / 最大 **0.20 s** /
    超差 **0 句**；288 条字幕 OCR **全部命中**；末条到 537.68 s（0.25 s 尾巴被片尾裁掉，正常）。
  - `short-qa`（带 195 镜表跑，`review/_shortqa_full.log`）：无黑帧、无异常白闪、无 ≥12 帧冻结、
    无静音；`POPS` 40 个 diff 尖峰里 34 个落在切点 ±2 帧（分镜表秒→帧四舍五入），其余 6 个是剧情动作
    节拍；渲染自带的跳帧/闪帧检查（吃真实切点表）报"没有突然跳一帧 / 闪一帧"。
  - `qa`：解码错误 0、黑帧 0；score 版响度 **-18.2 LUFS / -1.4 dBTP → "需要人工确认"**。
    **2026-11-11 下午已换史诗 BGM 并重混：-16.2 LUFS / -1.6 dBTP，QA OK**（见下节「成片换 BGM」）。
  - `deliver` 出了交付包：**2026-11-11 18:21 起按新契约统一到 `laolang/out/001 会飞的中国人/`**
    （`会飞的中国人_全片.mp4` + `封面-4比3.png`（2048×1536）+ `封面-3比4.png`（1536×2048）+
    `发布信息.txt`；封面提示词/元信息/srt/署名/旧交付都在 `源文件/`）。
    **字幕 srt 要按烧录字幕重建**：`out/captions-16x9.srt` 原来是 8 镜样片的 5 条（733 B），
    已用 `review/sync_qa.json` 的 `captions.captions`（288 条，就是画面上烧的那套）重写成 20 KB；
    老的留档在 `review/_captions_sample8.srt`。下回重渲后别忘了这一步。

### 成片换 BGM（2026-11-11 下午，史诗管弦）

- 宝哥指定 BGM：`D:\@kaifa\@\BGM\历史\历史-史诗 Epic Orchestral Cinematic Background Music ｜ Royalty Free.mp3`
  （180.14 s / 48 kHz / 192 kbps / 源响度 -14.4 LUFS），替换 `score.js` 的代码配乐。
- **`render --bgm` 对本工程无效**：页面有 `F.sfx` 音频计划，`--bgm` 只在「没有页面音频计划」时才接管；
  本工程必须走外部混音：
  1. `node runtime/render.mjs projects/022_澳洲土著 --audio --no-bgm` → `out/audio.wav`
     = 旁白 + `sound.js` 音效（515 个，说话时自动退开 507 个轻音效），无配乐。
  2. BGM 4 段 `acrossfade=2.5 s` 拼成 537.43 s → `review/bgm_loop_537.wav`。
  3. 侧链闪避：BGM `volume=0.12`，`sidechaincompress=threshold=0.03:ratio=6:attack=20:release=450`，
     侧链 = `audio/narration.m4a`；混音后再 `volume=6.90dB` + `alimiter=limit=0.80`。
  4. 成品音轨 `review/mix_bgm_norm3.wav`（另存 `out/audio_bgm-epic.wav`）：
     **-16.19 LUFS / -1.78 dBTP**。ducked BGM 集成响度约 -40.3 LUFS，比旁白 -23.5 低约 17 dB，人声清楚。
  5. `ffmpeg -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k` 重挂到 `out/video-16x9.mp4`。
- 结果：`qa` **OK**（-16.2 / -1.6，0 黑帧、0 解码错误）；`shots` **PASS**（195 镜，5 个已知场景检测漏检同前）；
  `sync --ocr` **PASS**（报告 `review/sync_qa.json` 的 `ok: true`：成片音频包络滞后 0 ms / r=0.9768；
  ASR 相似度 90.0%，132 句起点中位偏 0.100 s、最大 0.320 s、超差 1 句；288 条烧录字幕 OCR 全对；
  末条字幕 537.68 s 比片长多 0.25 s，属片尾裁切正常）。
  报告归档 `review/sync_qa_full_bgm.json` / `sync_qa_shots_full_bgm.json`。
- 旧 score 版留档：`out/video-16x9_prev-score.mp4`（12:25，309.5 MB）。
- 封面与发布信息已改由 `D:\@kaifa\fengmian` 生成（2026-11-11 宝哥定）：
  工程根 `delivery.json` 里是 6 字主标「会飞的中国人」、8 字副标「一个人骑车绕地球」、
  两行制标题「会飞的中国人：90年前骑车跑赢飞机」、4 个话题与两张画面描述。
  fengmian 产出 `封面-4比3.png`（2048×1536）/ `封面-3比4.png`（1536×2048），
  提示词与元信息在 `源文件/封面提示词-*.txt` / `封面元信息.json`。
- 交付包：`laolang/out/001 会飞的中国人/`（成片 + 两张封面 + `发布信息.txt` + `源文件/`）。
  旧的 16:9 封面仍是 `out/cover-16x9.png`；旧的发布信息与 5 选 1 稿在
  `源文件/旧交付-2026-11-11/`。
- 注意：BGM 的 `volume=0.12` 是实测值，不要再调大；调大后会把「说话时配乐至少低 15 dB」这条打破。

## 新窗口第一步

```bash
cd D:/@kaifa/Auto-Video/laolang
export CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe"
# 复看审阅帧（不渲染成片）
node runtime/render.mjs projects/022_澳洲土著 --html sample.html \
  --stills 0.65,2.65,3.7,5.5,6.4,7.8,8.7,9.8,10.8,11.9,12.7,14.5,16.1,16.9,18,19.6
```

样片已在 2026-11-11 渲染并校验通过；要复看静帧就重跑第一段命令，要看片直接打开
`out/video-16x9.mp4`。需要重渲时：

```bash
node runtime/render.mjs projects/022_澳洲土著 --html sample.html --fps 30
python scripts/laolang.py shots projects/022_澳洲土著/sample.html \
  --video projects/022_澳洲土著/out/video-16x9.mp4
python scripts/laolang.py sync projects/022_澳洲土著 --html sample.html \
  --video projects/022_澳洲土著/out/video-16x9.mp4 --ocr
```

Python 用 `C:/Users/20200/AppData/Local/Programs/Python/Python312/python.exe`
（文档里旧的 OpenViking venv python 路径已不存在）。`render.mjs` 默认读 `index.html`，
所以样片必须显式 `--html sample.html`；Chrome 必须设 `CHROME_PATH`。

## 全片重切的做法

1. 先导出全片字幕段（`index.html` 读 `timeline.js`）：

   ```bash
   node runtime/render.mjs projects/022_澳洲土著 --captions
   ```

   每条字幕的起点就是词首时间，可直接当切点候选。

2. 以字幕段为单位排镜头：**每镜 2.0–4.0 秒**，一个长句拆 2–3 镜，两个短句可合一镜；
   切点只落在字幕/词首或 ≥0.12 s 的停顿。按 537.43 s 估算约 **180–200 镜**，以实际口播为准。
3. 逐镜写运镜与动作，改 `index.html` 的 `G.shot(a, b, …)`；同步更新 `storyboard.md` 的
   逐镜时间列（S01–S77 旧表要改，别留旧估算）。
4. 分段渲染（长片容易让 Chrome 空转），每段后跑 `shots`；全片完成跑：

   ```bash
   python scripts/laolang.py sync projects/022_澳洲土著 --html index.html \
     --video projects/022_澳洲土著/out/video-16x9.mp4 --ocr
   ```

5. 验收：`shots` / `sync` 退出码 0，`review/sync_qa.json` 的 `ok: true`，再 `qa` / `short-qa` /
   `deliver`。配乐（`score.js`）仍是待办，可单独做。

## 复跑样片校验 / 重建时间轴

> `out/video-16x9.mp4` 已是这版 8 镜样片（2026-11-11 06:28），可以直接复跑 `sync`；
> 若改了页面，先重渲成片再校验。

```bash
# 样片三层校验（分镜 + 字幕 + 音频 + OCR）
python scripts/laolang.py sync projects/022_澳洲土著 --html sample.html \
  --video projects/022_澳洲土著/out/video-16x9.mp4 --ocr

# 需要重建时间轴时（ASR 文件已放在项目 review/）
python scripts/laolang.py rebuild projects/022_澳洲土著 \
  --asr review/asr_a.json review/asr_b.json review/asr_c.json \
  --full-before 178 --b-before 362 --sample-end 20.12
```

`rebuild` 会覆写 `timeline.js/json`、`paragraphs.js`、`sample_timeline.js`；动手前先确认样片
是否还要保持当前版本。ASR 分界：a 覆盖 0–182，b 从 178，c 从 360；`--b-before 362` 是当时的
取值分界（360–362 取 b 的词）。

## 硬约束（别踩）

- **屏幕文字只从 `brief.md` 的表来**：第一幕只允许「上海沈家巷」；片名「会飞的中国人」与
  副题「潘德明 · 一九三〇—一九三七」全片各只出现一次。
- **不虚构史实**；希特勒保持中性，不做漫画像；受害者不做滑稽表演。
- **字幕只能由 `EV.captionSegments` 从时间轴词级时间生成**，不许按字数均分、不许手写时间。
- **每镜 2–4 秒**，切点跟口播；`shots` 不过不要渲染。
- **同步验收口径**：`sync` 音频滞后 ≤40 ms；逐句起点中位偏差 ≤0.30 s **且超差句数 ≤20%**。
- **`toon-cast/` 冻结**：任何人物比例/发型/脸型/手臂结构改动，先出新设定图并让宝哥确认。
- **ASR/OCR 注意**：faster-whisper 必须用 ffmpeg 解码成 ndarray（PyAV 在本机报
  `metadata_errors`）；Dabao-OCR 只认 Windows 绝对路径，服务在 `127.0.0.1:18224`。
- **分段校验用 `--start`**：`shots` / `sync` 都支持 `--start <段首秒>`（第三幕起已用）；
  分段成片只校验本段内的字幕与切点。
- **`sync_qa.py` 本轮两处修复（别回退）**：
  1) 字幕 OCR 裁剪改为画面中间 `crop=iw*0.76:ih*0.20:iw*0.12:ih*0.80` 并传
     `ocr.maxSideLen=2048`。原来整幅 1920 宽会被 Dabao 默认 1024 长边缩小、字幕字高减半，
     实测 C23/C33 漏检；裁窄 + 不缩后全段 37 条 0 失败。
  2) 分段 ASR 的对照文本只取本段时间窗内的口播行（`offset-0.05 <= start < offset+dur`）；
     否则拿全片文本比一段音轨，相似度必然低（曾报 57%）。
- **画人物的两个坑**：
  - `actorFront` **不认 `actPose`**（Front 版的胳膊是写死的垂手），要抬手/比划/耸肩一律用
    `actorSide` 配 `actPose:{armN,armF,...}`；`actorFront` 只适合正面站桩或走路。
  - `G.write` 不传 `x/y` 会落在画面正中；地名条必须写 `x:104, y:100`（左上加下划线样式），
    否则会压在人脸上。
- **样片 `sample.html` 已验收并渲染**（2026-11-11）；`out/video-16x9.mp4` 就是这版，
  后续改页面后要重渲并复跑 `shots` + `sync --ocr`。

## 关键文件

| 文件 | 说明 |
|---|---|
| `sample.html` | 20 秒样片 **8 镜 / 20.12 s**，已渲染并通过 sync |
| `sample_timeline.js` | 样片真实词级时间（未改，仍是 5 句 / 20.12 s） |
| `index.html` | **全片页**（2026-11-11 重建，由 sample.html 派生）；已实现 0–486.02 s / 176 镜 |
| `timeline.js` / `timeline.json` | 132 句 / 537.43 s，ASR 重建 |
| `storyboard.md` | 20 秒样片表 8 镜；S01–S77 是幕块/节拍（不是镜头数），成片镜头表看 `review/shotplan.md` |
| `brief.md` | 事实表 + 屏幕文字表（唯一合法上屏文字来源） |
| `out/video-16x9.mp4` | **全片成片**（2026-11-11，537.4 s / 16123 帧 / 30 fps，含配乐；8 镜样片已被覆盖） |
| `out/video-16x9-act8.mp4` | **第八 + 第九幕 486.02–537.43 s 成片**（19 镜 / 51.4 s，shots + sync 全项 PASS） |
| `laolang/out/001 会飞的中国人/` | **唯一交付包**：成片 + `封面-4比3.png` + `封面-3比4.png` + `发布信息.txt`（fengmian 生成）；提示词/元信息/srt/署名/旧交付在 `源文件/` |
| `out/video-16x9-act1.mp4` | **第一幕 0–46.89 s 成片**（18 镜 / 46.90 s） |
| `out/video-16x9-act2.mp4` | **第二幕 46.89–106.00 s 成片**（21 镜 / 59.12 s，sync 全项 PASS） |
| `out/video-16x9-act3.mp4` | **第三幕 106.00–174.96 s 成片**（25 镜 / 68.97 s，sync 全项 PASS） |
| `out/video-16x9-act4.mp4` | **第四幕 174.96–278.88 s 成片**（36 镜 / 103.92 s，shots + sync 全项 PASS） |
| `out/video-16x9-act5.mp4` | **第五幕上半 278.88–325.62 s 成片**（17 镜 / 46.7 s，shots + sync 全项 PASS） |
| `out/video-16x9-act5b.mp4` | **第五幕下半 325.62–364.84 s 成片**（14 镜 / 39.2 s，shots + sync 全项 PASS） |
| `out/video-16x9-act6.mp4` | **第六幕 364.84–427.52 s 成片**（23 镜 / 62.7 s，shots + sync 全项 PASS） |
| `out/video-16x9-act7.mp4` | **第七幕 427.52–486.02 s 成片**（22 镜 / 58.5 s，shots + sync 全项 PASS） |
| `review/shotplan.json` / `.md` | **全片 195 镜分镜计划**（自动生成，切点全在词界） |
| `review/_index_xuanzang-template-62s.html` | 原 index.html（玄奘模板）备份，与本片无关 |
| `review/sync_qa.json` | **最近一次全项校验**（当前 = 全片，`ok: true`） |
| `review/sync_qa_full.json` / `sync_qa_shots_full.json` | **全片 537.43 s 全项 / 分镜报告留档** |
| `review/sync_qa_act8.json` / `sync_qa_shots_act8.json` | 第八 + 九幕全项 / 分镜报告留档 |
| `review/sync_qa_act3.json` / `sync_qa_shots_act3.json` | 第三幕全项 / 分镜报告留档 |
| `review/sync_qa_act4.json` / `sync_qa_shots_act4.json` | 第四幕全项 / 分镜报告留档 |
| `review/sync_qa_act5.json` / `sync_qa_shots_act5.json` | 第五幕上半全项 / 分镜报告留档 |
| `review/sync_qa_act5b.json` / `sync_qa_shots_act5b.json` | 第五幕下半全项 / 分镜报告留档 |
| `review/sync_qa_act6.json` / `sync_qa_shots_act6.json` | 第六幕全项 / 分镜报告留档 |
| `review/sync_qa_act7.json` / `sync_qa_shots_act7.json` | 第七幕全项 / 分镜报告留档 |
| `review/sync_qa_sample8.json` | 8 镜样片那份（`ok: true`，2026-11-11 06:38） |
| `review/_review4/` | 样片 16 张审阅帧：`sheet.jpg`、`pair-S01…S08.jpg`、`thumb-01…16.jpg` |
| `review/_a3v4a/` `_a3v4b/` `_a3v5/` | 第三幕最新审阅拼图（sheet + thumb） |
| `review/asr_a.json` 等 | 全片 ASR 原始词时间（a/b/c 三段） |
