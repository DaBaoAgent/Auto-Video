# QA —— 字幕对齐与频闪预算

这两项都必须**逐帧量**，靠眼睛看静帧一个都发现不了。

## 一、字幕切点干净率

观众说"字幕不准"通常不是时码整体偏，而是**切在字中间**——话说一半字幕跳了。

### 量法

```bash
python - <<'PY'
import json, wave, numpy as np
w = wave.open("narration/narration.wav","rb")
sr = w.getframerate()
x = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float32)/32768
hop = int(0.01*sr); n = len(x)//hop
db = 20*np.log10(np.sqrt((x[:n*hop].reshape(n,hop)**2).mean(1))+1e-9)
peak = db.max(); th = peak-28
caps = json.load(open("data/shots.json",encoding="utf-8"))["captions"]
vals = []
for c in caps:
    for t in (c["t0"], c["t1"]):
        i = int(t/0.01)
        if 2 <= i < n:
            vals.append((float(db[i-1:i+2].max())-th)/(peak-th))
vals = np.array(vals)
print(f"切点 {len(vals)}｜真静音(<0.2) {(vals<0.2).sum()}｜响字(>0.7) {(vals>0.7).sum()}｜中位 {np.median(vals):.2f}")
PY
```

### 判据

| 指标 | 合格 | E3 实测 |
|---|---|---|
| 落在真静音（相对能量 < 0.2） | ≥ 85% | 216/233（93%） |
| 切在响字上（> 0.7） | ≤ 3 个 | 1 个 |
| 语速异常句（偏差 > 45%） | 0 条 | 0 条 |

### 做不到的话，问题在对齐方法

- **按字数比例外推**：句内必然切在字中间，E3 实测只有 55% 干净率。不要用。
- **段级 DP**：新配音常出现"一个语音段含多句"（句中没换气），段级 DP 无法在段内切，
  会把整段塞给一句，出现 11 字/秒 vs 2 字/秒的错配。
- **正解**（`realign_voice.py`）：候选边界 = 段间换气中点（免费）+ 长段内能量低谷
  （惩罚按该点音量加权），DP 选边界，代价 = (时长 − 字数/语速)² + 段内惩罚。
  `--inner-penalty 0.10` 是扫参数扫出来的（0.02/0.05/0.20 都试过）。
- 试过用相对偏差的四次方替代平方：反而更差（4 条异常、最长字幕 3.68s），已回退。

### 拆条

长句超过 14 字要拆。断点优先在这些字之后：

```
的了是在和与就都也里上中后前时着过
```

少了方位词会切出「它留下的《南京太常寺志》里**清** | **楚**楚写着」。

## 二、频闪预算

### 量法

```bash
ffmpeg -v error -i 成片.mp4 -vf scale=192:108 -f rawvideo -pix_fmt gray - | python -c "
import sys,numpy as np
a=np.frombuffer(sys.stdin.buffer.read(),dtype=np.uint8)
n=192*108; L=a.reshape(-1,n).astype(np.float32).mean(1)
d=np.abs(np.diff(L)); print('均值%.3f P99%.3f 最大%.3f'%(d.mean(),np.percentile(d,99),d.max()))
"
```

判据：**P99 < 1 灰阶；> 3 灰阶的跳变 0 处**（切镜帧除外，按 shots.json 的
`from` / `from+frames` 前后各排除 1 帧）。

E3 实测：均值 0.079 / P99 0.517 / 最大 1.659 / > 3 灰阶 0 处。

### 五个源头

| 源头 | 现象 | 修法 |
|---|---|---|
| 逐帧亮度抖动 | `sin(frame*2.1)` ≈ 10Hz，±2.5% 全画幅 | 删掉整层，不做"曝光闪烁" |
| 片门闪白 | 每 6.5s 一次、2 帧曝光跳变 | 删掉，改用暖调与暗角 |
| 纸纹逐帧位移 | 360px 平铺接缝横切画面，整帧跳 8 灰阶 | `backgroundPosition: '0px 0px'`，纸纤维静止 |
| 字幕衬底随字幕开关 | 字幕间空 1–3 帧就掉 30 灰阶 | 抽成 `CaptionVeil` 常驻层 |
| 粒子每帧重抽 | 灰尘 15Hz、划痕 7.5Hz 全换位 | 常驻粒子 + 连续漂移 |

### 定位方法

注释掉 `OldFilm` / `Ornament` 分别渲染同一帧对比，再用**分块差值**（8×6 网格）
看差异集中在画面哪一带——**差异集中在底部就是字幕层的问题**。

## 三、交付前自检

- [ ] 帧数 = `round(音频时长 × fps)`，末镜 `from + frames` 等于总帧数
- [ ] 字幕最长一条 ≤ 14 字，切点干净率 ≥ 85%
- [ ] 帧间亮度差 P99 < 1 灰阶、> 3 灰阶 0 处
- [ ] 响度 −16.3 LUFS（门禁 −17.5 ~ −15.0）、真峰值 −1.5 dBTP（门禁 −3.0 ~ −0.3）
- [ ] 抽 4 帧核对：每镜中点 + 每镜末帧，字幕与画面内容对得上
- [ ] 名卡砸印那一帧：印章完整、不压落款
- [ ] 封面两张比例正确、无生成器水印
