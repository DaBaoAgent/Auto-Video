#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""全片生成器：episode.json（分屏数据）+ cues_full.json（从句时间）→ index_full.html
版式沿用 yuren30 深色定稿（theme/dark.css 的参数写死在这里，便于一次性生成）。"""
import json, os, re, math

P = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EPS = os.path.join(P, 'episode.json')
CUES = os.path.join(P, 'cues_full.json')
OUT = os.path.join(P, 'index_full.html')
FPS, DUR = 30, 597.34


def load_caps():
    """从句 → 字幕条（相邻合并到 ≤14 字，时间取并集）"""
    cl = json.load(open(CUES, encoding='utf-8'))['clauses']
    caps, cur = [], None
    for c in cl:
        t = c['text'].strip()
        if not t:
            continue
        if cur and len(cur['text']) + len(t) <= 14 and c['t0'] - cur['t1'] < 0.6:
            cur['text'] = (cur['text'] + ' ' + t).strip()
            cur['t1'] = c['t1']
        else:
            if cur:
                caps.append(cur)
            cur = {'t0': c['t0'], 't1': c['t1'], 'text': t}
    if cur:
        caps.append(cur)
    # 首尾相接，消除空窗
    for i in range(len(caps) - 1):
        caps[i]['t1'] = caps[i + 1]['t0']
    caps[-1]['t1'] = DUR
    caps[0]['t0'] = 0.0
    # 不再硬拆长句（会切断词），改为按长度自动降字号（渲染端处理）
    out = caps
    for i in range(len(out) - 1):
        out[i]['t1'] = out[i + 1]['t0']
    out[0]['t0'] = 0.0
    out[-1]['t1'] = DUR
    return out


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def accent(s, word):
    if not word:
        return esc(s)
    return esc(s).replace(esc(word), f'<span class="ac">{esc(word)}</span>')


# ---------------- 图形母题（参数化 SVG） ----------------
def motif(kind):
    M = {}
    M['hill'] = '''<svg viewBox="0 0 900 480" class="art">
      <path d="M60,420 L60,392 C70,330 96,286 150,262 C220,232 300,228 360,228 L620,228 L620,420 Z"
            fill="#171C23" stroke="#55636F" stroke-width="3"/>
      <path d="M40,420 L860,420" stroke="#3B4653" stroke-width="3"/>
      <g stroke="#333D49" stroke-width="2" fill="none">
        <path d="M60,300 Q250,290 450,298 Q650,306 860,294"/>
        <path d="M60,356 Q250,346 450,354 Q650,362 860,350"/>
      </g>
      <path d="M620,228 L620,420" stroke="#5A6D7C" stroke-width="3"/>
      <text x="80" y="216" font-size="24" fill="#8AA0B2">削平的山头 30 多米</text></svg>'''
    M['ice'] = '''<svg viewBox="0 0 900 480" class="art">
      <defs><linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#33475B"/><stop offset="1" stop-color="#1D2A38"/></linearGradient></defs>
      <path d="M40,140 Q240,118 460,134 Q680,150 860,126 L860,330 Q680,342 460,336 Q240,330 40,340 Z"
            fill="url(#gi)" stroke="#5A7086" stroke-width="2"/>
      <g stroke="#3D5468" stroke-width="1.4" fill="none" opacity=".8">
        <path d="M46,200 Q240,180 460,196 Q680,212 856,190"/>
        <path d="M44,270 Q240,250 460,266 Q680,282 856,260"/></g>
      <path d="M40,338 Q200,376 380,360 Q560,344 720,362 Q800,370 860,330 L860,420 L40,420 Z"
            fill="#4C4033" stroke="#6E5F4C" stroke-width="2"/>
      <path d="M80,368 Q260,404 440,382 Q620,360 840,376" stroke="#4FA8D8" stroke-width="6" fill="none" stroke-linecap="round"/>
      <text x="70" y="120" font-size="24" fill="#B7C6D4">南极冰盖 · 厚约 3 km</text></svg>'''
    M['seal'] = '''<svg viewBox="0 0 900 480" class="art">
      <rect x="250" y="150" width="220" height="220" rx="12" fill="#2A3441" stroke="#FFB79B" stroke-width="4"/>
      <text x="360" y="212" font-size="34" fill="#FFD84D" text-anchor="middle" font-weight="900">文帝行玺</text>
      <g fill="#FFD84D" opacity=".9" font-size="30" text-anchor="middle" font-weight="900">
        <text x="310" y="290">文</text><text x="360" y="290">帝</text><text x="410" y="290">行</text><text x="460" y="290">玺</text></g>
      <path d="M250,340 L700,340" stroke="#39434F" stroke-width="2"/>
      <text x="250" y="386" font-size="24" fill="#97A7B8">龙钮金印 · 含金量 98%</text></svg>'''
    M['jade'] = '''<svg viewBox="0 0 900 480" class="art">
      <defs><pattern id="jp" width="24" height="19" patternUnits="userSpaceOnUse">
        <rect x="1" y="1" width="20" height="15" rx="3" fill="#6FAF93" stroke="#467A66" stroke-width="1.3"/></pattern></defs>
      <g transform="translate(450,240) scale(2.1) translate(-450,-240)" fill="#E9EFF6" stroke="#E9EFF6" stroke-width="5"
         stroke-linejoin="round" opacity=".9">
        <circle cx="450" cy="120" r="30"/><rect x="437" y="146" width="26" height="18"/>
        <path d="M410,164 Q450,152 490,164 L497,262 Q450,274 403,262 Z"/>
        <rect x="386" y="170" width="24" height="92" rx="9"/><rect x="490" y="170" width="24" height="92" rx="9"/>
        <rect x="420" y="260" width="30" height="96" rx="7"/><rect x="452" y="260" width="30" height="96" rx="7"/></g>
      <g transform="translate(450,240) scale(2.1) translate(-450,-240)" fill="url(#jp)" stroke="#5F9A84" stroke-width="2"
         stroke-linejoin="round">
        <circle cx="450" cy="120" r="30"/><rect x="437" y="146" width="26" height="18"/>
        <path d="M410,164 Q450,152 490,164 L497,262 Q450,274 403,262 Z"/>
        <rect x="386" y="170" width="24" height="92" rx="9"/><rect x="490" y="170" width="24" height="92" rx="9"/>
        <rect x="420" y="260" width="30" height="96" rx="7"/><rect x="452" y="260" width="30" height="96" rx="7"/></g>
      <text x="120" y="420" font-size="24" fill="#97A7B8">丝缕玉衣 · 玉片 2000+ 枚</text></svg>'''
    M['ship'] = '''<svg viewBox="0 0 900 480" class="art">
      <path d="M120,300 Q450,368 780,300" stroke="#4FA8D8" stroke-width="6" fill="none"/>
      <path d="M300,250 L600,250 L560,320 L340,320 Z" fill="#2A3441" stroke="#8AA0B2" stroke-width="3"/>
      <g stroke="#E9EFF6" stroke-width="3" opacity=".85">
        <path d="M380,250 L380,150 M450,250 L450,140 M520,250 L520,150"/>
        <path d="M380,160 Q420,180 450,160 Q490,140 520,160"/></g>
      <text x="120" y="400" font-size="24" fill="#97A7B8">羽冠 · 竞渡 · 弧形船身</text></svg>'''
    M['dna'] = '''<svg viewBox="0 0 900 480" class="art">
      <g stroke="#6FAF93" stroke-width="4" fill="none">
        <path d="M300,80 Q420,180 300,280 Q180,380 300,470"/>
        <path d="M600,80 Q480,180 600,280 Q720,380 600,470"/></g>
      <g stroke="#FFD84D" stroke-width="3" opacity=".8">
        <path d="M312,130 L588,130"/><path d="M340,180 L560,180"/><path d="M352,230 L548,230"/>
        <path d="M340,290 L560,290"/><path d="M312,340 L588,340"/><path d="M300,400 L600,400"/></g>
      <text x="120" y="450" font-size="24" fill="#97A7B8">11 例古基因组 · 4 处悬棺遗址</text></svg>'''
    M['plan'] = '''<svg viewBox="0 0 900 480" class="art">
      <g stroke="#56677A" stroke-width="2.5" fill="#232D38">
        <rect x="150" y="60" width="140" height="130"/><rect x="610" y="60" width="140" height="130"/>
        <rect x="150" y="230" width="140" height="110"/><rect x="610" y="230" width="140" height="110"/></g>
      <g stroke="#7E93A6" stroke-width="2.5" fill="#33404E">
        <rect x="330" y="60" width="240" height="90"/><rect x="330" y="160" width="240" height="150"/>
        <rect x="330" y="320" width="240" height="90"/></g>
      <text x="330" y="450" font-size="24" fill="#97A7B8">七间石室 · 前朝后寝 · 约 100 ㎡</text></svg>'''
    M['gold'] = '''<svg viewBox="0 0 900 480" class="art">
      <g fill="#E8C24A" stroke="#8A6B18" stroke-width="2.4">
        <circle cx="330" cy="200" r="26"/><circle cx="450" cy="180" r="26"/><circle cx="570" cy="200" r="26"/>
        <circle cx="380" cy="300" r="26"/><circle cx="520" cy="300" r="26"/></g>
      <g stroke="#E8C24A" stroke-width="3" fill="none" opacity=".8">
        <path d="M330,200 L450,180 M450,180 L570,200 M330,200 L380,300 M570,200 L520,300 M380,300 L520,300"/></g>
      <text x="120" y="420" font-size="24" fill="#97A7B8">焊珠金花泡 · 直径 1.1 cm</text></svg>'''
    M['stone'] = '''<svg viewBox="0 0 900 480" class="art">
      <g stroke="#8B6BB1" stroke-width="3"><path d="M250,180 L300,120 L380,140 L390,220 L300,250 Z" fill="#8B6BB1" opacity=".55"/></g>
      <g stroke="#3FA39B" stroke-width="3"><path d="M410,150 L480,120 L510,190 L450,230 Z" fill="#3FA39B" opacity=".55"/></g>
      <g stroke="#E0703A" stroke-width="3"><path d="M520,230 L600,210 L630,280 L560,310 Z" fill="#E0703A" opacity=".55"/></g>
      <g stroke="#E8C24A" stroke-width="3"><path d="M300,300 L360,282 L390,340 L330,360 Z" fill="#E8C24A" opacity=".55"/></g>
      <g stroke="#A9704C" stroke-width="3"><path d="M440,330 L510,318 L530,380 L460,395 Z" fill="#A9704C" opacity=".55"/></g>
      <text x="120" y="430" font-size="24" fill="#97A7B8">紫水晶 绿松石 雄黄 硫磺 赭石</text></svg>'''
    return M.get(kind, '')


CSS = '''
:root{--bg:#0B0D11;--ink:#E9EFF6;--slate:#97A7B8;--line:#39434F;--accent:#FF6B45;
  --accent-soft:#FFB79B;--yellow:#FFD84D;--paper:rgba(255,255,255,.10);--dim:#6C7C8D;}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:1920px;height:1080px;overflow:hidden;background:var(--bg);}
body{font-family:"Alibaba PuHuiTi",sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;}
#viewport{position:relative;width:1920px;height:1080px;overflow:hidden;
  background:#0B0D11 url('assets/bg_dark_archive.jpg') center/cover no-repeat;}
#viewport::before{content:"";position:absolute;inset:0;z-index:0;
  background-image:radial-gradient(circle,#2A3440 1.1px,transparent 1.3px);background-size:26px 26px;}
#world{position:absolute;top:0;left:0;height:1080px;z-index:1;will-change:transform;}
.sc{position:absolute;top:0;width:1920px;height:1080px;}
.abs{position:absolute;}
.card{background:var(--paper);border:1.6px solid rgba(255,255,255,.22);border-radius:12px;
  box-shadow:0 6px 22px rgba(0,0,0,.45);}
.tag{display:inline-block;background:rgba(255,255,255,.10);color:#fff;border-radius:999px;
  border:1.4px solid rgba(255,255,255,.20);padding:10px 24px;font-size:26px;font-weight:700;letter-spacing:2px;}
.kick{font-size:36px;color:var(--slate);letter-spacing:5px;font-weight:700;}
.ac{color:var(--accent);}
.yl{color:var(--yellow);}
.small{font-size:26px;color:var(--slate);line-height:1.5;}
.art{width:100%;height:100%;}
#chrome{position:absolute;inset:0;z-index:50;pointer-events:none;}
#brand{position:absolute;left:56px;top:44px;display:flex;align-items:center;gap:14px;}
#brand img{width:58px;height:58px;border-radius:50%;display:block;box-shadow:0 4px 14px rgba(0,0,0,.55);}
#brand .idline{display:flex;align-items:baseline;gap:2px;}
#brand .name{font-size:27px;font-weight:900;letter-spacing:3px;line-height:1;}
#brand .ep{font-size:21px;color:var(--slate);letter-spacing:2.5px;line-height:1;}
#epTag{position:absolute;right:56px;top:44px;}
#epTag .tag{font-size:24px;}
#foot{position:absolute;left:56px;right:56px;bottom:26px;display:flex;justify-content:space-between;
  align-items:center;border-top:1.5px solid var(--line);padding-top:11px;font-size:24px;color:var(--dim);}
@font-face{font-family:'Alibaba PuHuiTi';src:url('assets/font/AlibabaPuHuiTi-3-85-Bold.ttf') format('truetype');
  font-weight:700 900;font-display:block;}
#veil{position:absolute;left:0;right:0;bottom:0;height:400px;z-index:40;pointer-events:none;
  background:linear-gradient(to top, rgba(3,5,9,.86) 0%, rgba(3,5,9,.44) 46%, rgba(3,5,9,0) 100%);}
#cap{position:absolute;left:0;right:0;bottom:112px;z-index:41;pointer-events:none;
  display:flex;justify-content:center;opacity:0;}
#cap span{position:relative;font-weight:900;font-size:66px;letter-spacing:.12em;color:rgba(250,252,255,.97);
  white-space:nowrap;transform:translateY(10px);}
#cap span::before{content:attr(data-text);position:absolute;left:0;top:0;z-index:-1;
  -webkit-text-stroke:6px rgba(4,6,10,.92);color:rgba(4,6,10,.92);}
'''


def screen_html(i, s):
    x = i * 1920
    lay = s.get('lay', 'title')
    kick = f'<div class="abs kick" style="left:112px;top:186px;">{esc(s["kick"])}</div>' if s.get('kick') else ''
    title = ''.join(f'<div>{accent(t, s.get("accent"))}</div>' for t in s.get('title', []))
    tsize = s.get('tsize', 104)
    ttop = s.get('ttop', 236 if lay != 'diagram' else 150)
    tpart = f'<div class="abs" style="left:104px;top:{ttop}px;font-size:{tsize}px;font-weight:900;line-height:1.22;letter-spacing:2px;">{title}</div>' if title else ''
    body = ''

    if lay == 'title':
        note = s.get('note')
        if note:
            body = (f'<div class="abs card" style="left:110px;top:690px;width:auto;max-width:840px;padding:20px 30px;'
                    f'border-color:rgba(255,216,77,.34);"><div style="font-size:31px;line-height:1.5;color:var(--yellow);">'
                    f'{esc(note)}</div></div>')
    elif lay == 'stats':
        cs = s.get('cards', [])
        w = 390 if len(cs) >= 3 else 470
        for k, c in enumerate(cs):
            body += (f'<div class="abs card" style="left:{80+k*(w+24)}px;top:430px;width:{w}px;height:212px;padding:26px 28px;">'
                     f'<div style="font-size:33px;color:var(--slate);letter-spacing:2px;">{esc(c["k"])}</div>'
                     f'<div style="font-size:{min(96, int((w-60)*0.92/max(1,len(c.get("v","")))))}px;font-weight:900;line-height:1;margin-top:10px;">'
                     f'{accent(c["v"], c.get("ac"))}</div>'
                     f'<div style="font-size:24px;color:var(--dim);margin-top:8px;">{esc(c.get("n",""))}</div></div>')
    elif lay == 'list':
        rows = s.get('rows', [])
        for k, r in enumerate(rows):
            body += (f'<div class="abs" style="left:110px;top:{452+k*88}px;width:1620px;border-bottom:1.5px solid rgba(255,255,255,.12);'
                     f'padding-bottom:16px;display:flex;justify-content:space-between;align-items:baseline;">'
                     f'<span style="font-size:38px;font-weight:900;">{esc(r["a"])}</span>'
                     f'<span style="font-size:27px;color:var(--slate);">{esc(r.get("b",""))}</span></div>')
    elif lay == 'quote':
        n = len(s['q'])
        fs = 74 if n <= 14 else 62 if n <= 22 else 54 if n <= 32 else 46
        qs = s.get('qs', '')
        qshtml = f'<div style="font-size:26px;color:var(--slate);margin-top:26px;line-height:1.45;">{esc(qs)}</div>' if qs else ''
        body = (f'<div class="abs" style="left:150px;top:150px;width:1560px;height:640px;display:flex;align-items:center;">'
                f'<div style="position:relative;width:100%;padding:8px 0 8px 44px;border-left:9px solid var(--accent);">'
                f'<div style="position:absolute;left:26px;top:-46px;font-size:200px;font-weight:900;color:rgba(255,107,69,.14);'
                f'font-family:Georgia,serif;line-height:1;">“</div>'
                f'<div style="font-size:{fs}px;font-weight:900;line-height:1.44;letter-spacing:2px;max-width:1400px;">{accent(s["q"], s.get("accent"))}</div>'
                f'{qshtml}</div></div>')
    elif lay == 'split':
        body = (f'<div class="abs" style="left:900px;top:150px;width:940px;height:560px;">{motif(s.get("motif","hill"))}</div>')
        if s.get('note'):
            body += (f'<div class="abs small" style="left:112px;top:640px;width:740px;">{esc(s["note"])}</div>')
    elif lay == 'compare':
        for k, c in enumerate(s.get('cols', [])):
            body += (f'<div class="abs card" style="left:{110+k*830}px;top:420px;width:780px;padding:30px 34px;">'
                     f'<div style="font-size:32px;color:var(--slate);letter-spacing:2px;">{esc(c["h"])}</div>'
                     f'<div style="font-size:44px;font-weight:900;margin-top:14px;line-height:1.4;">{accent(c["t"], c.get("ac"))}</div></div>')
    elif lay == 'diagram':
        body = (f'<div class="abs" style="left:96px;top:320px;width:1728px;height:420px;">{motif(s.get("motif","ice"))}</div>')
        ttop = 150

    return f'<div class="sc" style="left:{x}px;">{kick}{tpart}{body}</div>'


def main():
    ep = json.load(open(EPS, encoding='utf-8'))
    caps = load_caps()
    shots = ep['shots']
    cl = json.load(open(CUES, encoding='utf-8'))['clauses']
    for sh in shots:
        if 'a' in sh:
            sh['t0'] = cl[sh['a']]['t0']
            sh['t1'] = cl[sh['b']]['t1']
    shots[0]['t0'] = 0.0
    shots[-1]['t1'] = DUR
    html = ['<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>羽人 · 全片</title><style>',
            CSS, '</style></head><body><div id="viewport"><div id="world" style="width:%dpx;">' % (len(shots) * 1920)]
    for i, s in enumerate(shots):
        html.append(screen_html(i, s))
    html.append('</div><div id="veil"></div><div id="cap"><span id="cap-text"></span></div>')
    html.append(f'''<div id="chrome">
  <div id="brand"><img src="assets/logo_circle.png" alt=""><div class="idline">
    <span class="name">徐艾伦</span><span class="ep">AlanXU</span></div></div>
  <div id="epTag"><span class="tag">EP.01 · 羽人</span></div>
  <div id="foot"><span>同类器物示意（克利夫兰艺术博物馆 CC0） · 出土数据据南越王墓公开资料</span>
    <span>1920×1080 · 30fps · {DUR:.1f}s</span></div></div></div>''')

    cam = []
    for i, s in enumerate(shots):
        t0, t1 = s['t0'], s['t1']
        if i == 0:
            cam.append([0.0, 0])
        else:
            cam.append([round(t0 - 0.18, 2), (i - 1) * 1920])
        cam.append([round(t0 + 0.18, 2), i * 1920])
    cam.append([DUR, (len(shots) - 1) * 1920])

    capjs = json.dumps([{'t0': round(c['t0'], 2), 't1': round(c['t1'], 2), 'text': c['text']} for c in caps],
                       ensure_ascii=False)
    js = f'''
"use strict";
window.DEMO={{width:1920,height:1080,fps:30,duration:{DUR}}};
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const seg=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const eoc=p=>1-Math.pow(1-p,3);
const eio=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
const CAM={json.dumps(cam)};
function camX(t){{for(let i=0;i<CAM.length-1;i++){{const [ta,xa]=CAM[i],[tb,xb]=CAM[i+1];
  if(t<=tb) return xa+(xb-xa)*eio(seg(t,ta,tb));}} return CAM[CAM.length-1][1];}}
const CAPS={capjs};
function caption(t){{const c=CAPS.find(c=>t>=c.t0&&t<c.t1)||CAPS[CAPS.length-1];
  const cap=$("cap"),sp=$("cap-text");const p=eoc(seg(t,c.t0,c.t0+5/30));
  cap.style.opacity=p;
  if(sp._t!==c.text){{sp._t=c.text;sp.textContent=c.text;sp.dataset.text=c.text;
    const n=c.text.length;sp.style.fontSize=(n<=16?66:n<=22?60:52)+'px';}}
  sp.style.transform=`translateY(${{(1-p)*10}}px)`;}}
let last=-1;
window.renderAt=async function(t){{if(t===last)return;last=t;
  $("world").style.transform=`translateX(${{-camX(t)}}px)`;caption(t);}};
window.__ready=true;'''
    html.append('<script>' + js + '</script></body></html>')
    open(OUT, 'w', encoding='utf-8').write('\n'.join(html))
    print('screens', len(shots), 'caps', len(caps), '->', OUT)
    # 同时导出音效 cue 与字幕表，供混音与核对
    json.dump({'cues': [{'type': 'whoosh', 't': round(s['t0'] + 0.18, 2), 'gain': 0.55} for s in shots[1:]]},
              open(os.path.join(P, 'audio', 'cues_full_sfx.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    json.dump(caps, open(os.path.join(P, 'caps_full.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
