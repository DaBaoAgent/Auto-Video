# bianping 配乐与音效

## 配乐

lemo-opuscar `core/audio/pluck.py`：music_box（八音盒琶音）+ kalimba（拇指琴点缀）。

## 音效

lemo-opuscar `core/audio/sfx.py`：thump（撞击）、crash（爆炸）、whoosh（转场）、ding（黑洞）、click。

## 混音

配音:音乐 = 1:0.35：
```bash
ffmpeg -i out/vo1.wav -i out/music.wav -filter_complex "[1:a]volume=0.35[bg];[0:a][bg]amix=inputs=2:duration=first" out/amix.wav
```

运行 music.py 用 lemo-opuscar 的 venv Python。
