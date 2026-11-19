# bianping 配乐与音效

## 配乐

内置音色表里的拨弦音色（八音盒琶音 + 拇指琴点缀）：music_box（八音盒琶音）+ kalimba（拇指琴点缀）。

## 音效

内置音效表：thump（撞击）、crash（爆炸）、whoosh（转场）、ding（黑洞）、click。

## 混音

配音:音乐 = 1:0.35：
```bash
ffmpeg -i out/vo1.wav -i out/music.wav -filter_complex "[1:a]volume=0.35[bg];[0:a][bg]amix=inputs=2:duration=first" out/amix.wav
```

运行 music.py 需要 numpy，用 LVDONG_PY / BIANPING_PY 指定的解释器。
