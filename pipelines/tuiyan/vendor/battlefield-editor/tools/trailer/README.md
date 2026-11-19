# tools/trailer — 零成本宣传片管线

这支宣传片(赤壁/水淹七军/官渡/垓下 showcase,16:9 / 9:16 / 4:5 三版)就是用这里的脚本做的。
**核心 insight:引擎本身就是电影运镜演出器 → 屏幕录它,不用「生成」影片。** 全程免费、无付费 API。

## 四阶段

| 阶段 | 脚本 | 做什么 |
|---|---|---|
| 1 Capture | `capture.mjs` | Playwright + xvfb 录自动播映的高潮幕 → `raw/*.webm` |
| 2 Narration | edge-tts(见下) | 生成中文旁白 → `narration/n0..n6.mp3` |
| 3 Verify | Gemini pro 代听 | 逐字验声调(破音字);whisper STT 验不了声调 |
| 4 Compose | `brand.py` + `compose.sh` | 字卡 + clip + 字幕 + 品牌条 + 尾卡 + 混音 → `out/trailer-*.mp4` |

## 跑法

```bash
# 依赖:playwright(npm i -D playwright)、ffmpeg、pillow、Noto Sans TC / Serif CJK 字型
npm i -D playwright

# 1. 录制(WebGL 要真 GL,务必 xvfb-run headed;portrait 版另录一次)
xvfb-run -a --server-args="-screen 0 1280x720x24" node tools/trailer/capture.mjs
xvfb-run -a --server-args="-screen 0 720x1280x24"  node tools/trailer/capture.mjs --portrait

# 2. 旁白(edge-tts;台词在 compose.sh 对应的 narration 档)
EDGE=zh-TW-YunJheNeural
edge-tts --voice $EDGE --rate=-5% --text "战场编辑器 —— 三维历史战场引擎。"          --write-media narration/n0.mp3
edge-tts --voice $EDGE --rate=-5% --text "赤壁，火烧连环，一夜烧尽曹军舰队。"        --write-media narration/n1.mp3
edge-tts --voice $EDGE --rate=-5% --text "水淹七军，决堤灌城，水深数丈。"            --write-media narration/n2.mp3
edge-tts --voice $EDGE --rate=-5% --text "官渡，乌巢夜袭，火烧袁军粮草。"            --write-media narration/n3.mp3
edge-tts --voice $EDGE --rate=-5% --text "垓下，四面楚歌，霸王末路。"                --write-media narration/n4.mp3
edge-tts --voice $EDGE --rate=-5% --text "一套引擎，六场战役。换一份资料，就换一场战役。" --write-media narration/n5.mp3
edge-tts --voice $EDGE --rate=-5% --text "免安装，打开浏览器就能看。"                --write-media narration/n6.mp3
#   破音字先绕:例「七军皆没」的「没 mò」→ edge-tts 会念 méi,改「水深数丈」避开。

# 3. 验声调:把 nX.mp3 base64 丢 gemini-2.5-pro,问「音高走向」逐字听写(非「念 A 还 B」)。

# 4. 配乐放 assets/music.mp3(tuiyan 中自备替换;上游原用 packages/chibi/assets/music/scene7.mp3,CC0),然后
python3 tools/trailer/brand.py     # 产品牌条 + 六印章尾卡 → brand-out/
bash    tools/trailer/compose.sh   # → out/trailer-{16x9,9x16,4x5}.mp4
```

## 版位对应

- `trailer-16x9.mp4` — YouTube 主片(无烧字幕,有声观众)
- `trailer-9x16.mp4` — LINE 分享 / YT Shorts / FB Reels(烧字幕,静音也看得懂)
- `trailer-4x5.mp4` — FB 动态贴文(占版面最大)。贴社团:影片进贴文、连结放第一则留言。

## 换到别的 app / 别场战役

改各脚本顶部的「每项目要换的旋钮」区块即可:`capture.mjs` 的 `BATTLES`(pkg / 跳哪幕 / hold)
与 `HIDE`;`brand.py` 的 `SEALS` / `WORDMARK` / `URL`;`compose.sh` 的台词、`CLIPS`、配乐。

**capture 阶段依 app 类型不同**:会动的 3D/canvas app → 屏幕录(本管线);纯出图项目 → 改用
ffmpeg `zoompan` 做 Ken Burns 幻灯 montage。其余(旁白/验音/合成/品牌)三段共用。
