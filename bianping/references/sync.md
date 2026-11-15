# bianping ASR 对齐

## 必须 ASR，不要手动估时间

手动估时间戳永远对不上口播。必须用 faster-whisper 拿到逐词时间。

## 步骤

1. 切配音：`ffmpeg -i 配音.wav -t 37 out/vo1.wav`
2. 转 16kHz：`ffmpeg -i out/vo1.wav -ar 16000 -ac 1 out/vo1_16k.wav`
3. 运行 asr.py（系统 Python 3.12，已装 faster-whisper）
4. 对照口播稿修正文字，但时间戳用 ASR 的
5. 更新 film.js 的 VO 数组和 CUTS

## 已知坑

- PyAV metadata_errors bug：必须用 wave 模块读成 numpy float32 传入，不能直接传文件路径
- 44.1kHz 输入识别乱码：必须先转 16kHz
- vad_filter=True 吞语音：设 False
