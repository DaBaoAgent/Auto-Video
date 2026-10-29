# -*- coding: utf-8 -*-
"""批量抠图：把 _raw 下的白底 JPG 批量转成 1254x1254 RGBA PNG，落到 人物/道具 子目录。"""
import os, subprocess, sys

BASE = r"D:\@kaifa\yandi\output\001_波斯湾伊甸园_口播稿+配音\波斯湾伊甸园故事常用素材_透明PNG_v1"
RAW = os.path.join(BASE, "_raw")
PY = r"D:\@kaifa\yandi\vendor\gpt-sovits\.venv\Scripts\python.exe"
SCRIPT = r"D:\@kaifa\yandi\tools\white2alpha.py"

# (raw_filename, 子目录, 中文名)
JOBS = [
    ("priest_statue.jpg",      "人物", "苏美尔祭司雕像"),
    ("linguist.jpg",           "人物", "语言学家"),
    ("archaeologist_ross.jpg", "人物", "罗斯考古学家"),
    ("enki.jpg",               "人物", "恩基"),
    ("sumerian_farmer.jpg",    "人物", "苏美尔农夫"),
    ("reed_boat.jpg",          "道具", "古航海船"),
    ("wooden_plow.jpg",        "道具", "苏美尔木犁"),
    ("seed_basket.jpg",        "道具", "播种篮"),
    ("ziggurat.jpg",           "道具", "金字形神塔"),
    ("king_list_stele.jpg",    "道具", "苏美尔王表石碑"),
    ("reed_ark.jpg",           "道具", "洪水方舟"),
    ("spring.jpg",             "道具", "沙漠泉眼"),
    ("ice_shelf.jpg",          "道具", "冰盖"),
    ("kish_mountain.jpg",      "道具", "基什山"),
    ("fish_hood.jpg",          "道具", "鱼皮兜帽"),
    ("dna_helix.jpg",          "道具", "DNA双螺旋"),
    ("four_rivers.jpg",        "道具", "四条大河"),
]

for raw, sub, cn in JOBS:
    src = os.path.join(RAW, raw)
    dst_dir = os.path.join(BASE, sub)
    os.makedirs(dst_dir, exist_ok=True)
    dst = os.path.join(dst_dir, f"{cn}.png")
    r = subprocess.run([PY, SCRIPT, src, dst, "--thresh", "30", "--feather", "2", "--out-size", "1254"],
                       capture_output=True, text=True, encoding="utf-8")
    print(r.stdout.strip() if r.returncode == 0 else f"FAIL {raw}: {r.stderr.strip()}")

# 背景图：直接缩放到 1920x1080（不抠图）
from PIL import Image
bg_src = os.path.join(RAW, "bg_persian_gulf.jpg")
bg_dir = os.path.join(BASE, "..", "背景图_v1")
os.makedirs(bg_dir, exist_ok=True)
bg_dst = os.path.join(bg_dir, "bg01_persian_gulf.png")
im = Image.open(bg_src).convert("RGB")
# aspect-fill 裁切到 16:9
tw, th = 1920, 1080
sw, sh = im.size
target_ratio = tw / th
src_ratio = sw / sh
if src_ratio > target_ratio:
    new_w = int(sh * target_ratio)
    left = (sw - new_w) // 2
    im = im.crop((left, 0, left + new_w, sh))
else:
    new_h = int(sw / target_ratio)
    top = (sh - new_h) // 2
    im = im.crop((0, top, sw, top + new_h))
im = im.resize((tw, th), Image.LANCZOS)
im.save(bg_dst, "PNG")
print(f"背景: {bg_dst}  size={im.size}")
