#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""生成管线样片效果展示拼图。

用法：
  python showcase/make_poster.py
  python showcase/make_poster.py --frames-dir frames --out showcase-poster.jpg --title "Auto-Video · 管线样片（30 秒）"

约定：
  - 扫描 --frames-dir 下所有 *.jpg，按文件名排序（文件名即管线名）
  - 自动 3 列网格布局，每格底部标注管线名（可加中文风格说明）
  - 新增样片：把新管线帧放进 frames/ 后重跑即可
"""
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

STYLE = {
    'xuni': '合成波 / VHS',
    'shiliang': '扁平矢量 2D MG',
    'xianshiqi': '赛博朋克 HUD / FUI',
    'dengju': '等轴 2.5D 微缩场景',
    'piying': '皮影剪影',
    'shuimo': '水墨动画',
    'xiangsu': '像素风',
    # 后续新增管线在此补充，例如：
    # 'jianying': '纸本历史短片',
}

FONT = Path(__file__).resolve().parents[1] / 'xuni' / 'projects' / '009_prion30' \
       / 'assets' / 'font' / 'AlibabaPuHuiTi-3-85-Bold.ttf'

CELL_W, CELL_H = 640, 400          # 每格：画面 640x360 + 底部 40 标注
COLS = 3
TITLE_H = 72
BG = (16, 16, 18)
LABEL_BG = (0, 0, 0, 160)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--frames-dir', default='frames')
    ap.add_argument('--out', default='showcase-poster.jpg')
    ap.add_argument('--title', default='Auto-Video · 管线样片（30 秒）')
    args = ap.parse_args()

    root = Path(__file__).resolve().parent
    frames = sorted((root / args.frames_dir).glob('*.jpg'))
    if not frames:
        raise SystemExit(f'no frames in {root / args.frames_dir}')

    rows = (len(frames) + COLS - 1) // COLS
    canvas = Image.new('RGB', (COLS * CELL_W, TITLE_H + rows * CELL_H), BG)
    draw = ImageDraw.Draw(canvas)

    font_title = ImageFont.truetype(str(FONT), 44)
    font_label = ImageFont.truetype(str(FONT), 26)

    draw.text((24, (TITLE_H - 44) // 2), args.title, fill=(245, 245, 245), font=font_title)

    for i, fp in enumerate(frames):
        img = Image.open(fp).convert('RGB')
        img = img.resize((CELL_W, CELL_H - 40), Image.LANCZOS)
        col, row = i % COLS, i // COLS
        x, y = col * CELL_W, TITLE_H + row * CELL_H
        canvas.paste(img, (x, y))
        name = fp.stem
        label = f'{name}  ·  {STYLE.get(name, "")}'.rstrip(' · ')
        # 半透明标注条
        bar = Image.new('RGBA', (CELL_W, 40), LABEL_BG)
        canvas.paste(bar, (x, y + CELL_H - 40))
        ImageDraw.Draw(canvas).text((x + 12, y + CELL_H - 40 + 7), label,
                                    fill=(255, 255, 255), font=font_label)

    out = root / args.out
    canvas.save(out, quality=92)
    print(f'poster -> {out}  ({len(frames)} frames, {canvas.size[0]}x{canvas.size[1]})')


if __name__ == '__main__':
    main()
