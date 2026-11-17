# 一键 demo：宿主什么都不用装
#
#   docker compose run --rm demo
#
# 镜像里带 node / python3 / chromium / ffmpeg / 中文字体；产物写到 ./demo/out/demo.mp4
# （compose 已经把 demo/out 挂出来）。想换画法：docker compose run --rm demo --pipeline manga

FROM node:20-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PIP_NO_CACHE_DIR=1 \
    PYTHONUNBUFFERED=1 \
    CHROME_PATH=/usr/bin/chromium \
    LANG=C.UTF-8

RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 ffmpeg chromium ca-certificates \
        fonts-noto-cjk fonts-noto-cjk-extra \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . /app

# 先跑一条最短的片验证环境：出 3 秒 540p，失败就直接在构建里暴露，而不是等用户踩
RUN python3 demo/run.py --seconds 3 --scale 0.3 && rm -rf demo/out demo/_work

CMD ["python3", "demo/run.py"]
