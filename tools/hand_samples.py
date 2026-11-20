"""Render the first five Hand & Pencil station samples.

    uv run --with playwright --with edge-tts python tools/hand_samples.py
    uv run --with playwright --with edge-tts python tools/hand_samples.py --only caiqian --stills 0,3.8,7.1
    python tools/hand_samples.py --install
"""

from av import REPO
from paper_samples import main

PLAN = {
    "shouhui": {
        "title": "鼓阵开场", "poster": 7.16, "fps": 24,
        "poster_note": "击鼓、鼓面震动与笔刷火星同框，背景保留旗帜和灯笼",
        "music": "部落/部落 Raga_Dance_of_Music.mp3", "music_at": 11,
        "scripts": ["hand.js"],
        "effects": [(t, "drum") for t in (.52, 1.34, 2.16, 2.94, 3.65, 4.32, 5.08, 5.54, 6.63, 7.12, 7.61, 8.59, 9.42)],
    },
    "pencil": {
        "title": "跃栏试画", "poster": 6.02,
        "poster_note": "运动员腾空、跨栏及蓝色残像形成完整的动作剪影",
        "music": "人文/人文-情感 Documentary Cinematic (Inspiring Emotional Ambient Background)No Copyright Background Music.mp3",
        "music_at": 24, "scripts": ["hand.js"],
        "effects": [(4.27, "step"), (5.12, "step"), (6.89, "step"), (7.35, "step")],
    },
    "caiqian": {
        "title": "雨林弹射", "poster": 7.10, "fps": 24,
        "poster_note": "变色龙、弹出的舌头、目标昆虫与苔枝同框",
        "music": "自然/自然-动物 Blue_Macaw.mp3", "music_at": 14,
        "assets": ["pipelines/caiqian/projects/029_jia_xueyu/lib/three.module.js"],
        "voice": "zh-CN-YunyangNeural",
        "lines": ["转动眼睛，搜寻猎物。", "发现目标，两眼锁定。", "舌头弹出，黏住猎物。"],
    },
    "pingban": {
        "title": "海獭开贝", "poster": 8.8, "fps": 24,
        "poster_note": "收回全页后六格完整，海獭开贝的连续动作可读",
        "music": "自然/自然 Liquid_Time.mp3", "music_at": 32,
        "scripts": ["hand.js"], "effects": [(5.45, "shell"), (5.84, "shell"), (6.22, "shell")],
    },
    "gangbi": {
        "title": "花市一早", "poster": 8.8, "fps": 24,
        "poster_note": "水彩铺过两处花摊，车轮、人群与街面留白俱全",
        "music": "乡村/乡村 Juneberry_Junction.mp3", "music_at": 27,
        "scripts": ["hand.js"], "effects": [(4.08, "bell"), (4.22, "bell")],
    },
}

if __name__ == "__main__":
    main(PLAN, REPO / "tools" / "hand_samples", REPO / "review" / "hand_samples", __doc__)
