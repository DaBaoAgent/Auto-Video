# -*- coding: utf-8 -*-
"""赤壁·音色试听 样品生成：CosyVoice(百炼) + Qwen-TTS + 指令版。直连失败自动走代理。"""
import os, io, json, time, base64
from pathlib import Path
import requests

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "content" / "01-赤壁之战" / "音色试听"
OUT.mkdir(parents=True, exist_ok=True)

key = os.environ.get("DASHSCOPE_API_KEY", "").strip()
if not key:
    envp = Path(os.path.expanduser("~")) / "AppData/Local/hermes/.env"
    for line in envp.read_text(encoding="utf-8", errors="ignore").splitlines():
        if line.startswith("DASHSCOPE_API_KEY"):
            key = line.split("=", 1)[1].strip().strip('"').strip("'")
print("key:", ("OK len=%d" % len(key)) if key else "MISSING")

H = {"Authorization": "Bearer " + key, "Content-Type": "application/json"}
PROX = {"http": "http://127.0.0.1:15715", "https": "http://127.0.0.1:15715"}

TXT = "公元二零八年的冬天，长江之上，风急浪高。曹操刚扫平北方，亲率大军南下，兵锋直指江东。挡在他前面的，是孙权跟刘备的联军，退无可退。而这一仗，就是赤壁之战。"

CV_URL = "https://dashscope.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer"
MM_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"

state = {"proxy_only": False, "netfails": 0}

def post(url, body):
    modes = [True] if state["proxy_only"] else [False, True]
    for use_prox in modes:
        for attempt in range(2):
            try:
                r = requests.post(url, headers=H, json=body, timeout=(30, 150),
                                  proxies=PROX if use_prox else None)
                state["netfails"] = 0
                if use_prox and not state["proxy_only"]:
                    print("   (直连失败过，本次走了代理)")
                return r
            except Exception as e:
                print("   net-err:", type(e).__name__, str(e)[:110])
                time.sleep(2)
        if not use_prox:
            print("   -> 切换代理重试")
    state["netfails"] += 1
    if state["netfails"] >= 3:
        state["proxy_only"] = True
        print("   !! 连续网络失败，切为代理优先模式")
    return None

def save_audio(j, fname):
    o = j.get("output", {})
    a = o.get("audio", {}) if isinstance(o.get("audio"), dict) else {}
    val, how = None, None
    if a.get("url"): val, how = a["url"], "url"
    elif a.get("data"): val, how = a["data"], "b64"
    elif o.get("url"): val, how = o["url"], "url"
    if how == "url":
        data = None
        for use_prox in ([True] if state["proxy_only"] else [False, True]):
            try:
                data = requests.get(val, timeout=(30, 150), proxies=PROX if use_prox else None).content
                break
            except Exception as e:
                print("   dl-err:", str(e)[:100])
        if data: (OUT / fname).write_bytes(data)
    elif how == "b64":
        (OUT / fname).write_bytes(base64.b64decode(val))
    return how

def job(kind, model, voice, fname, extra=None):
    ob = OUT / fname
    if ob.exists() and ob.stat().st_size > 5000:
        print(f"[跳过] {fname}"); return
    tag = f"{model} / {voice}"
    if kind == "cosy":
        body = {"model": model, "input": {"text": TXT, "voice": voice},
                "parameters": {"format": "mp3", "sample_rate": 44100, "rate": 0.92, "volume": 55}}
        if extra: body["parameters"]["instruction"] = extra
        url = CV_URL
    else:
        params = {"voice": voice}
        if extra: params["instructions"] = extra
        body = {"model": model, "input": {"messages": [{"role": "user", "content": [{"text": TXT}]}]},
                "parameters": params}
        url = MM_URL
    r = post(url, body)
    if r is None:
        print(f"[FAIL-net] {tag} -> {fname}"); return
    if r.status_code != 200:
        print(f"[FAIL-{r.status_code}] {tag} :: {r.text[:200]}"); return
    j = r.json()
    how = save_audio(j, fname)
    if how:
        print(f"[OK] {tag} -> {fname} ({(OUT/fname).stat().st_size}B)")
    else:
        print(f"[SHAPE?] {tag} :: {json.dumps(j, ensure_ascii=False)[:260]}")

jobs = [
    ("cosy", "cosyvoice-v3.5-plus", "longcheng_v3",    "07_龙橙-智慧青年男(百炼v3.5).mp3", None),
    ("cosy", "cosyvoice-v3.5-plus", "longxiaochun_v3", "08_龙小淳-知性女(百炼v3.5).mp3", None),
    ("cosy", "cosyvoice-v3.5-plus", "longlaotie_v3",   "09_龙老铁-东北男(百炼v3.5).mp3", None),
    ("cosy", "cosyvoice-v2",        "longcheng_v2",    "10_龙橙-青年男(百炼v2).mp3", None),
    ("qwen", "qwen3-tts-flash",     "Ryan",            "11_Ryan-戏感男(qwen3tts).mp3", None),
    ("qwen", "qwen3-tts-flash",     "Ethan",           "12_晨煦-活力男(qwen3tts).mp3", None),
    ("qwen", "qwen3-tts-flash",     "Cherry",          "13_芊悦-亲切女(qwen3tts).mp3", None),
    ("qwen", "qwen3-tts-flash",     "Katerina",        "14_卡捷琳娜-御姐(qwen3tts).mp3", None),
    ("qwen", "qwen-tts",            "Dylan",           "15_Dylan-北京话(qwen-tts).mp3", None),
    ("qwen", "qwen-tts",            "Sunny",           "16_Sunny-四川话(qwen-tts).mp3", None),
    ("cosy", "cosyvoice-v3.5-plus", "longcheng_v3",    "17_龙橙-纪录片腔(指令版).mp3",
     "请用沉稳、厚重、纪录片解说风格朗读，语速中等偏慢，富有感染力。"),
    ("qwen", "qwen3-tts-instruct-flash", "Ryan",       "18_Ryan-纪录片腔(指令版).mp3",
     "用沉稳厚重、富有感染力的历史纪录片解说风格朗读，语速中等偏慢。"),
]

for j0 in jobs:
    try:
        job(*j0)
    except Exception as e:
        print(f"[EXC] {j0[1]}/{j0[2]} :: {type(e).__name__} {str(e)[:140]}")
    time.sleep(0.8)

print("\n=== 目录结果 ===")
for f in sorted(OUT.glob("*.mp3")):
    print(f"{f.stat().st_size:>7}B  {f.name}")
