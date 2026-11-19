"""Fetch public data for the Xiangyang / Fancheng reach of the Han River.

- Elevation: AWS Terrain Tiles (Mapzen/Tilezen "terrarium" PNG).
    detailed: zoom 13 (~16 m per cell at this latitude) over the battlefield
    backdrop: zoom 11 over the wider Nanyang basin
- Imagery: EOX Sentinel-2 cloudless 2016 (layer s2cloudless_3857, CC BY 4.0).
    detailed: zoom 14 (~8 m per pixel)   backdrop: zoom 11

usage (library root): .venv/bin/python -I films/guanyu-fancheng/tools/fetch_gf.py films/guanyu-fancheng
Writes raw/terrain_z*.png, raw/s2_z*.jpg, raw/wbbox.json, raw/bbox.json, raw/manifest.jsonl
"""
import sys, os, io, json, math, time, datetime, urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

D = sys.argv[1]
RAW = os.path.join(D, 'raw'); os.makedirs(RAW, exist_ok=True)
# detailed: the Han at Fancheng/Xiangyang, ~38 x 24 km
W, S, E, N = 111.955, 31.945, 112.330, 32.165
# backdrop: the Nanyang basin from the Funiu foothills down to the Han, ~150 x 110 km
WB, SB, EB, NB = 111.30, 31.60, 112.90, 32.55
UA = {'User-Agent': 'Auto-Video/1.0 (research)'}
LOG = open(os.path.join(RAW, 'manifest.jsonl'), 'a')


def tile_xy(lon, lat, z):
    n = 2 ** z
    x = (lon + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y


def get(url, data=None):
    for k in range(5):
        try:
            req = urllib.request.Request(url, data=data, headers=UA)
            with urllib.request.urlopen(req, timeout=120) as r:
                b = r.read()
            LOG.write(json.dumps({'url': url, 'bytes': len(b), 'date': datetime.date.today().isoformat()}) + '\n')
            return b
        except Exception as e:
            if k == 4:
                raise
            time.sleep(2 + 3 * k)


def mosaic(name, tmpl, z, ext, box, skip=False):
    w, s, e, n = box
    dst = os.path.join(RAW, f'{name}_z{z}.{ext}')
    x0, y0 = tile_xy(w, n, z); x1, y1 = tile_xy(e, s, z)
    tx0, ty0, tx1, ty1 = int(x0), int(y0), int(x1), int(y1)
    meta = {'z': z, 'tx0': tx0, 'ty0': ty0, 'tx1': tx1, 'ty1': ty1}
    if not os.path.exists(dst):
        jobs = [(x, y) for y in range(ty0, ty1 + 1) for x in range(tx0, tx1 + 1)]
        def one(j):
            x, y = j
            return j, get(tmpl.format(z=z, x=x, y=y))
        im = Image.new('RGB', ((tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256))
        with ThreadPoolExecutor(8) as ex:
            for (x, y), b in ex.map(one, jobs):
                im.paste(Image.open(io.BytesIO(b)).convert('RGB'), ((x - tx0) * 256, (y - ty0) * 256))
        im.save(dst, quality=95) if ext == 'jpg' else im.save(dst)
    print(name, z, meta, flush=True)
    return meta


TERR = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
S2 = 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg'

meta = {'bbox': [W, S, E, N]}
meta['terrain'] = mosaic('terrain', TERR, 13, 'png', (W, S, E, N))
meta['s2'] = mosaic('s2', S2, 14, 'jpg', (W, S, E, N))
json.dump(meta, open(os.path.join(RAW, 'bbox.json'), 'w'), indent=1)

wmeta = {'bbox': [WB, SB, EB, NB]}
wmeta['terrain'] = mosaic('wterrain', TERR, 11, 'png', (WB, SB, EB, NB))
wmeta['s2'] = mosaic('ws2', S2, 11, 'jpg', (WB, SB, EB, NB))
json.dump(wmeta, open(os.path.join(RAW, 'wbbox.json'), 'w'), indent=1)
print('done')
