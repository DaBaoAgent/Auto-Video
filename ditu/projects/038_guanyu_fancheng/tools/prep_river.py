"""Turn the raw tiles into the film's assets (inland river edition).

assets/height.bin        float32 metres, GW x GH, row 0 = north. Riverbed carries the water surface level.
assets/albedo.jpg        graded Sentinel-2 land + the river dyed its own silty green
assets/water.png         river mask (R channel), for the roughness map and the water plane
assets/meta.json         grid size, mercator box, km per pixel, water level, the corrected river centre line
assets/wide_*.{bin,jpg,png,json}   the backdrop mesh, same layout

usage (library root): .venv/bin/python -I films/guanyu-fancheng/tools/prep_river.py films/guanyu-fancheng
"""
import sys, os, json, math
import numpy as np
from PIL import Image
from scipy import ndimage

D = sys.argv[1]
RAW = os.path.join(D, 'raw'); OUT = os.path.join(D, 'assets'); os.makedirs(OUT, exist_ok=True)
Image.MAX_IMAGE_PIXELS = None

# the Han's course through this reach, in lon/lat, from the north-west down to the south-east:
# seeds only, each is snapped onto the water mask below
RIVER_SEED = [[111.96, 32.155], [112.00, 32.130], [112.045, 32.105], [112.085, 32.085],
              [112.115, 32.060], [112.132, 32.040], [112.148, 32.018], [112.170, 31.998],
              [112.200, 31.978], [112.240, 31.960], [112.290, 31.948]]


def merc(lon, lat, z):
    n = 2 ** z * 256
    return (lon + 180) / 360 * n, (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n


def build(bbox_file, prefix, terrain_name, s2_name, out_prefix):
    m = json.load(open(os.path.join(RAW, bbox_file)))
    W, S, E, N = m['bbox']

    s2m = m['s2']; z = s2m['z']
    x0, y0 = merc(W, N, z); x1, y1 = merc(E, S, z)
    ox, oy = s2m['tx0'] * 256, s2m['ty0'] * 256
    img = Image.open(os.path.join(RAW, s2_name)).convert('RGB')
    box = (int(x0 - ox), int(y0 - oy), int(x1 - ox), int(y1 - oy))
    img = img.crop(box)
    IW, IH = img.size

    tm = m['terrain']; zt = tm['z']
    t0x, t0y = merc(W, N, zt); t1x, t1y = merc(E, S, zt)
    tox, toy = tm['tx0'] * 256, tm['ty0'] * 256
    t = np.asarray(Image.open(os.path.join(RAW, terrain_name)).convert('RGB'), np.float64)
    h = t[..., 0] * 256 + t[..., 1] + t[..., 2] / 256 - 32768
    ys = (np.arange(IH) + .5) / IH * (t1y - t0y) + t0y - toy - .5
    xs = (np.arange(IW) + .5) / IW * (t1x - t0x) + t0x - tox - .5
    X, Y = np.meshgrid(xs, ys)
    hi = ndimage.map_coordinates(h, [Y, X], order=3, mode='nearest').astype(np.float32)

    # ---- the river: dark water in the imagery AND the lowest ground in its own neighbourhood ----
    a = np.asarray(img, np.float32) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = .3 * r + .59 * g + .11 * b
    kpx = 40075.016 * math.cos(math.radians((S + N) / 2)) / (2 ** z * 256)          # km per image pixel
    # the neighbourhood test runs on a quarter grid: on the full grid a 350 m window costs minutes
    s4 = .25
    hi4 = ndimage.zoom(hi, s4, order=1)
    k4 = kpx / s4
    w1 = max(3, int(0.35 / k4) | 1)                                                 # a 350 m neighbourhood
    w2 = max(5, int(1.5 / k4) | 1)                                                  # a 1.5 km neighbourhood
    hmin4 = ndimage.minimum_filter(hi4, size=w1, mode='nearest')
    hmed4 = ndimage.median_filter(hi4, size=w2, mode='nearest')
    low4 = ((hi4 - hmin4) < 1.6)
    cut4 = hi4 < (hmed4 - .8)
    low = ndimage.zoom(low4.astype(np.float32), (IH / hi4.shape[0], IW / hi4.shape[1]), order=1) > .5
    cut = ndimage.zoom(cut4.astype(np.float32), (IH / hi4.shape[0], IW / hi4.shape[1]), order=1) > .5
    bluey = (b > r * .96) & ((b + g) * .5 > r - .03) & (lum < .46)
    water = (bluey & low) | (low & cut & (lum < .52))
    water = ndimage.binary_opening(water, iterations=2)
    water = ndimage.binary_closing(water, iterations=3)
    lab, n = ndimage.label(water)
    sizes = ndimage.sum(water, lab, range(1, n + 1))
    keep = np.zeros(n + 1, bool); keep[1:] = sizes > (2500 if prefix == 'f' else 900)
    water = keep[lab]

    level = float(np.median(hi[water])) if water.sum() > 1000 else float(np.percentile(hi, 3))
    # the terrain keeps the bed a touch below the surface, so the water plane always covers it
    hl = np.where(water, level - .6, hi)
    hl = np.where(~water, np.maximum(hl, 2.0), hl)

    # ---- albedo ----
    lin = a ** 2.2
    l = (lin * [.2126, .7152, .0722]).sum(-1, keepdims=True)
    L = l + (lin - l) * .84
    L = L * np.array([1.05, 1.0, .90])
    L = np.clip(L * .92, 0, 1) ** 1.14 * 1.10
    # the river reads as silt-green water, keeping a little of its own texture
    river_col = np.array([.055, .105, .088])
    rx = lin * np.array([.7, .95, .9])
    riv = river_col * .72 + rx * .38
    wm = ndimage.gaussian_filter(water.astype(np.float32), 1.4)[..., None]
    alb = L * (1 - wm) + riv * wm
    alb8 = (np.clip(alb, 0, 1) ** (1 / 2.2) * 255 + .5).astype(np.uint8)
    Image.fromarray(alb8).save(os.path.join(OUT, f'{out_prefix}albedo.jpg'), quality=93)
    Image.fromarray((wm[..., 0] * 255).astype(np.uint8)).resize((IW // 2, IH // 2), Image.LANCZOS).save(os.path.join(OUT, f'{out_prefix}water.png'))

    # ---- height grid for the mesh ----
    GW, GH = IW // 4, IH // 4
    hg = np.asarray(Image.fromarray(hl).resize((GW, GH), Image.BILINEAR), np.float32)
    water_g = np.asarray(Image.fromarray((water * 255).astype(np.uint8)).resize((GW, GH), Image.BOX), np.float32) > 120
    # a gentle low-pass: the mesh is stretched ×5 in height, and raw 16 m DEM jitter would read as craters
    hg = ndimage.gaussian_filter(hg, 1.7, mode='nearest')
    hg = np.where(water_g, np.minimum(hg, level - .6), hg)   # the bed stays under the surface
    hg.astype('<f4').tofile(os.path.join(OUT, f'{out_prefix}height.bin'))

    km_px = 40075.016 * math.cos(math.radians((S + N) / 2)) / (2 ** z * 256)
    meta = {'GW': GW, 'GH': GH, 'IW': IW, 'IH': IH, 'bbox': [W, S, E, N], 'z': z,
            'merc': [x0, y0, x1, y1], 'km_px': km_px, 'width_km': IW * km_px, 'height_km': IH * km_px,
            'hmax': float(hl.max()), 'hmin': float(hl.min()), 'water_m': level, 'water_frac': float(water.mean())}

    if prefix == 'f':
        # snap the seed points onto the water mask, so the ship lane really runs down the river
        pts = []
        for lo, la in RIVER_SEED:
            px, py = merc(lo, la, z)
            cx = (px - ox) - int(x0 - ox); cy = (py - oy) - int(y0 - oy)
            R = 100
            y0w, y1w = max(0, int(cy - R)), min(IH, int(cy + R))
            x0w, x1w = max(0, int(cx - R)), min(IW, int(cx + R))
            sub = water[y0w:y1w, x0w:x1w]
            if sub.sum() > 200:
                yy, xx = np.nonzero(sub)
                ny, nx = y0w + yy.mean(), x0w + xx.mean()
                N = 2 ** z * 256
                gx = nx + int(x0 - ox) + ox
                gy = ny + int(y0 - oy) + oy
                lo2 = gx / N * 360 - 180
                myf = gy / N
                la2 = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * myf))))
                pts.append([round(lo2, 4), round(la2, 4)])
            else:
                pts.append([lo, la])
        meta['river'] = pts
        meta['camp_band'] = [112.098, 32.058, 112.165, 32.098]
    json.dump(meta, open(os.path.join(OUT, f'{out_prefix}meta.json'), 'w'), indent=1)

    print(out_prefix, IW, IH, '->', GW, GH, '| water_m %.2f | frac %.3f | hmin %.1f hmax %.1f'
          % (level, water.mean(), hl.min(), hl.max()), flush=True)
    print('  river', meta.get('river'), flush=True)


build('bbox.json', 'f', 'terrain_z13.png', 's2_z14.jpg', '')
build('wbbox.json', 'w', 'wterrain_z11.png', 'ws2_z11.jpg', 'wide_')
print('prep done')
