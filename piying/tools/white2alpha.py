# -*- coding: utf-8 -*-
"""
白底素材抠图：把 ImageGen/JPEG 输出的白底图转成 RGBA 透明 PNG。
用法: python white2alpha.py <输入图> <输出.png> [--thresh 28] [--feather 2]
- 从四角/四边中点采样背景色
- flood-fill 从边界向外蔓延，把与背景色接近且连通的像素设为透明（保护主体内白色高光）
- 边缘半透明过渡，避免白边
"""
import sys, os
from PIL import Image, ImageDraw
import numpy as np

def main():
    src = sys.argv[1]
    dst = sys.argv[2]
    thresh = 28
    feather = 2
    for i, a in enumerate(sys.argv):
        if a == '--thresh' and i+1 < len(sys.argv): thresh = int(sys.argv[i+1])
        if a == '--feather' and i+1 < len(sys.argv): feather = int(sys.argv[i+1])

    im = Image.open(src).convert('RGB')
    w, h = im.size
    arr = np.array(im).astype(np.int16)  # H,W,3

    # 采样背景色：四角+四边中点
    pts = [(2,2),(w-3,2),(2,h-3),(w-3,h-3),(w//2,2),(w//2,h-3),(2,h//2),(w-3,h//2)]
    bg_samples = np.array([arr[y,x] for x,y in pts])
    bg = bg_samples.mean(axis=0)

    # 计算每个像素到最近背景样本的距离
    # dist[i,j] = min over bg_samples of |pixel - sample|
    dist = np.full((h,w), 1e9, dtype=np.int32)
    for s in bg_samples:
        d = np.abs(arr - s).sum(axis=2)
        dist = np.minimum(dist, d)

    # 候选透明掩码：距离 < thresh
    cand = dist < thresh

    # flood-fill：从边界开始，只清除与边界连通的候选像素
    # 用 PIL ImageDraw.floodfill 在掩码上做（从边界点填充连通域）
    mask_img = Image.fromarray((cand*255).astype(np.uint8))
    # 从所有边界候选点开始 floodfill
    visited = np.zeros((h,w), dtype=bool)
    from collections import deque
    q = deque()
    # 边界所有候选点入队
    for x in range(w):
        for y in (0, h-1):
            if cand[y,x] and not visited[y,x]:
                visited[y,x]=True; q.append((x,y))
    for y in range(h):
        for x in (0, w-1):
            if cand[y,x] and not visited[y,x]:
                visited[y,x]=True; q.append((x,y))
    # BFS
    while q:
        x,y = q.popleft()
        for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
            nx,ny = x+dx,y+dy
            if 0<=nx<w and 0<=ny<h and cand[ny,nx] and not visited[ny,nx]:
                visited[ny,nx]=True; q.append((nx,ny))

    bg_mask = visited  # 与背景连通的近白区域 -> 透明

    # 构造 alpha：背景连通域 alpha=0，其余 alpha=255
    # 边缘羽化：在 bg_mask 边缘 1-2 像素内，按距离线性过渡
    alpha = np.full((h,w), 255, dtype=np.uint8)
    alpha[bg_mask] = 0
    # 对 bg_mask 做距离变换，靠近边缘的像素给半透明
    if feather > 0:
        # 简化：对 bg_mask 做膨胀找边缘，边缘像素按到 bg 的距离插值
        from scipy import ndimage
        # bg_mask 到 0 的距离（即背景内像素到非背景的距离）
        dt = ndimage.distance_transform_edt(bg_mask)
        # dt=1 的像素紧挨着非背景，给 128 左右的半透明
        edge = (bg_mask) & (dt <= feather)
        # 这些像素的 alpha = dt/feather * 255（dt=1 时约 255/feather）
        alpha[edge] = np.clip(dt[edge] / feather * 255, 0, 255).astype(np.uint8)

    # 组装 RGBA
    rgba = np.dstack([arr.astype(np.uint8), alpha])
    out = Image.fromarray(rgba, 'RGBA')

    # 输出到正方形画布（默认 1254，与女娲素材规格一致），主体居中
    out_size = 1254
    for i, a in enumerate(sys.argv):
        if a == '--out-size' and i+1 < len(sys.argv): out_size = int(sys.argv[i+1])

    # 先把 RGBA 缩放到短边=out_size（保持长宽比），再贴到 out_size×out_size 透明画布居中
    cur_w, cur_h = out.size
    scale = out_size / max(cur_w, cur_h)
    new_w, new_h = int(cur_w*scale), int(cur_h*scale)
    out = out.resize((new_w, new_h), Image.NEAREST)  # 像素风用 NEAREST 保持硬边

    canvas = Image.new('RGBA', (out_size, out_size), (0,0,0,0))
    canvas.paste(out, ((out_size-new_w)//2, (out_size-new_h)//2), out)
    out = canvas

    os.makedirs(os.path.dirname(dst), exist_ok=True)
    out.save(dst, 'PNG')
    print(f"OK {src} -> {dst}  size={out.size}  bg={bg.astype(int).tolist()}  cleared={bg_mask.sum()/(w*h)*100:.1f}%")

if __name__ == '__main__':
    main()
