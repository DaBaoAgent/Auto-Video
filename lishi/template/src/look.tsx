import React, {useEffect, useRef, useState} from 'react';
import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
  Img,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {clamp, easeOutCubic, easeOutQuint, ramp} from './lib/anim';
import {useBg} from './BgContext';

/* ------------------------------------------------------------------ *
 * Look · 历史蒙皮（theme 化）
 *
 * 设计：色板不再硬编码，改为 CSS 自定义属性（--lk-*）承载，
 * 由 <LookProvider theme="..."> 在根节点注入。所有常量与 ink/cin/gold
 * 助手都返回 var() 引用，因此 12 个场景文件一行都不用改。
 *
 * 七个语义槽对齐 video-shotcraft 的 template/src/themes/palettes.json：
 *   page → 纸底 · surface → 卡面 · field → 凹陷底
 *   text → 墨 · muted → 次要 · accent → 朱砂 · border → 旧金
 * ------------------------------------------------------------------ */

export type LookTheme = {
  id: string;
  label: string;
  origin?: string; // 来源标注（对比页用）
  page: string;    // 纸底
  surface: string; // 卡面 / 提亮
  field: string;   // 凹陷 / 次级底
  text: string;    // 墨（主文字）
  muted: string;   // 次要文字 / 辅助线
  accent: string;  // 朱砂（强调）
  border: string;  // 旧金（描边 / 分隔）
  /** 锁定朱砂：忽略 accent 槽，强制用项目基线色（历史主题专用） */
  accentLock?: boolean;
};

/**
 * 锁定朱砂的两个取值。
 *
 * 语义锁的是「朱砂」这个东西，不是某个 hex：浅纸底用 #b33a2b（jianying 定稿朱砂），
 * 暗底提到 #cf4a38 —— 同色相、亮度抬一档，否则 #b33a2b 压在 #191510 上只有
 * 2.3:1 对比度，印章会糊成一团暗斑。色相不变，这才叫「锁住朱砂」。
 */
export const LOCKED_ACCENT = '#b33a2b';
export const LOCKED_ACCENT_DARK = '#cf4a38';

/** 本项目基线：宣纸纸本（色板取自 jianying 纸雕定稿色） */
const PAPER_THEME: LookTheme = {
  id: 'paper',
  label: '宣纸纸本 · Paper（本项目基线）',
  origin: '本项目基线',
  page: '#efe6d2',
  surface: '#f6efdd',
  field: '#e0d2b4',
  text: '#24211c',
  muted: '#6d655a',
  accent: '#b33a2b',
  border: '#c9a24a',
};

/* ------------------------------------------------------------------ *
 * 历史主题组：都开 accentLock
 *
 * 上游那 9 套是「品牌 promo 配色」，换的是整套语义，朱砂必然失义。
 * 要往历史语境里走，正确的自由度是：**只动纸与墨（外加旧金），朱砂不动**。
 * 纸料决定时代感（绢本 / 绵纸 / 夜宴绢），朱砂决定这套视觉还是不是「朱砂叙事」。
 * ------------------------------------------------------------------ */
const HISTORY_THEMES: LookTheme[] = [
  {
    id: 'qinglv',
    label: '青绿山水 · Qinglv',
    origin: '历史主题 · accentLock',
    // 绢本设色：石青石绿压底，墨绿黑落笔，勾线用泥金
    page: '#dfe6da',
    surface: '#eef2e6',
    field: '#c6d3c2',
    text: '#1d2a25',
    muted: '#5b6d61',
    accent: LOCKED_ACCENT, // 被锁，值是占位
    border: '#9a7c4e',
    accentLock: true,
  },
  {
    id: 'zhupi',
    label: '朱批奏折 · Zhupi',
    origin: '历史主题 · accentLock',
    // 白绵纸：比基线更白更冷，墨更近纯黑，朱批红才压得住
    page: '#f1ecdd',
    surface: '#faf7ee',
    field: '#ded6c2',
    text: '#1a1815',
    muted: '#665f52',
    accent: LOCKED_ACCENT, // 被锁，值是占位
    border: '#b8a67e',
    accentLock: true,
  },
  {
    id: 'yeyan',
    label: '夜宴 · Yeyan',
    origin: '历史主题 · accentLock',
    // 墨夜绢本：暖黑压底、米黄落笔、暗金勾线；朱砂会自动提到 #cf4a38
    page: '#191510',
    surface: '#241e16',
    field: '#0f0c08',
    text: '#e9dcc0',
    muted: '#9c8b70',
    accent: LOCKED_ACCENT, // 被锁，暗底会自动取 LOCKED_ACCENT_DARK
    border: '#8a6a3a',
    accentLock: true,
  },
];

/** 上游 video-shotcraft 的 9 套预设，7 槽原样抄自 palettes.json */
const SHOTCRAFT_THEMES: LookTheme[] = [
  {
    id: 'ink-press',
    label: '纸质 · Ink Press（上游默认）',
    // ink-press 在 visual-theme.tsx 里只覆盖 page，其余槽沿用 THEME
    page: '#f2eee6',
    surface: '#ffffff',
    field: '#edf2f8',
    text: '#142238',
    muted: '#5c6b82',
    accent: '#2563eb',
    border: '#d8e2ef',
  },
  {
    id: 'modern-light',
    label: '现代浅色 · Modern Light',
    page: '#f4f7fb',
    surface: '#ffffff',
    field: '#edf2f8',
    text: '#142238',
    muted: '#5c6b82',
    accent: '#2563eb',
    border: '#d8e2ef',
  },
  {
    id: 'midnight',
    label: '暗黑 · Midnight',
    page: '#090f1a',
    surface: '#111c2c',
    field: '#162438',
    text: '#f0f5ff',
    muted: '#9babbe',
    accent: '#61d9ef',
    border: '#293b52',
  },
  {
    id: 'solar-pop',
    label: '清新鼠尾草 · Sage',
    page: '#f9faf6',
    surface: '#ffffff',
    field: '#f0f3e7',
    text: '#26342b',
    muted: '#637067',
    accent: '#527434',
    border: '#dde4d5',
  },
  {
    id: 'coral-burst',
    label: '珊瑚点缀 · Coral',
    page: '#fffffe',
    surface: '#ffffff',
    field: '#f9f2f3',
    text: '#1f1235',
    muted: '#716579',
    accent: '#d94e59',
    border: '#e9dfe6',
  },
  {
    id: 'color-play',
    label: '柔和鸢尾 · Iris',
    page: '#f7f5fb',
    surface: '#ffffff',
    field: '#eee9f7',
    text: '#282039',
    muted: '#726781',
    accent: '#7354b5',
    border: '#e2dbea',
  },
  {
    id: 'deep-ocean',
    label: '深海蓝 · Deep Ocean',
    page: '#0b1620',
    surface: '#142735',
    field: '#1c3443',
    text: '#e8f1f5',
    muted: '#9fb6c3',
    accent: '#7cc8b4',
    border: '#304957',
  },
  {
    id: 'obsidian-violet',
    label: '黑曜紫 · Obsidian Violet',
    page: '#14121b',
    surface: '#211d2c',
    field: '#2e283d',
    text: '#f0edf7',
    muted: '#b3a9c5',
    accent: '#bca0e8',
    border: '#41364f',
  },
  {
    id: 'vintage-kraft',
    label: '复古牛皮纸 · Vintage Kraft',
    page: '#c8aa7d',
    surface: '#dfc69e',
    field: '#ccb086',
    text: '#382a20',
    muted: '#6b513b',
    accent: '#8b4937',
    border: '#ac895e',
  },
];

export const LOOK_THEMES: LookTheme[] = [PAPER_THEME, ...HISTORY_THEMES, ...SHOTCRAFT_THEMES];
export const DEFAULT_THEME = PAPER_THEME.id;

const THEME_MAP: Record<string, LookTheme> = Object.fromEntries(
  LOOK_THEMES.map((t) => [t.id, t]),
);

export const getTheme = (id?: string): LookTheme =>
  (id && THEME_MAP[id]) || PAPER_THEME;

/** #rrggbb → "r g b"（配合 rgb(var(--x) / a) 语法用） */
const rgbTriple = (hex: string): string => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)).join(' ');
};

/** page 的相对亮度（0~1），用来判断这是不是暗色主题 */
const luminance = (hex: string): number => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const isDark = (t: LookTheme): boolean => luminance(t.page) < 0.45;

/**
 * accentLock 解析：锁定后忽略主题的 accent 槽，回落到项目基线的朱砂。
 * 暗底自动换成同色相提亮版（LOCKED_ACCENT_DARK），理由见上面的常量注释。
 *
 * lock 参数是外部覆盖：`<LookProvider accentLock>` 可以对任意主题临时上锁，
 * 这样上游那 9 套也能「只借纸色、不借强调色」地试一遍。
 */
export const accentOf = (t: LookTheme, lock?: boolean): string => {
  const locked = lock ?? t.accentLock ?? false;
  if (!locked) return t.accent;
  return isDark(t) ? LOCKED_ACCENT_DARK : LOCKED_ACCENT;
};

/**
 * shade = 「压暗」用的颜色，onDark = 「深底反白」用的文字色。
 *
 * 这两个不能直接复用 ink：ink 绑在主题的 text 槽上，暗色主题的 text 是亮色，
 * 拿它去压暗会把画面刷白（S06 城墙被 scrim 刷成浅灰就是这么来的）。
 * 所以按 page 亮度派生：浅色主题 shade=ink / onDark=surface；
 * 暗色主题 shade=纯黑 / onDark=text。
 */
const shadeOf = (t: LookTheme) => (isDark(t) ? '#000000' : t.text);
const onDarkOf = (t: LookTheme) => (isDark(t) ? t.text : t.surface);

/**
 * 朱砂元素的混合模式槽。
 *
 * multiply 在浅纸底上是「印上去」的正确手感，但在暗底上等于把朱砂乘成黑斑
 * —— 夜宴主题下印章会直接消失。所以暗底换 screen（发光感，像烛火映在朱砂上），
 * 浅底保持 multiply。
 */
export const blendOf = (t: LookTheme): 'multiply' | 'screen' => (isDark(t) ? 'screen' : 'multiply');

/**
 * solid = 「实体剪影」色：城墙、门扇、船身、道路这类大块实物。
 *
 * 它们不能用 ink：ink 绑 text 槽，暗色主题里 text 是亮色，城墙会反相成一块
 * 发光的米黄（夜宴主题第一版就是这么崩的）。实的剪影在哪种底色上都该比底更深，
 * 所以浅底等价于墨、暗底取一个压到底的深色。
 */
const solidOf = (t: LookTheme) => (isDark(t) ? '#070504' : t.text);

const cssVars = (t: LookTheme, lock?: boolean): React.CSSProperties => {
  const accent = accentOf(t, lock);
  const shade = shadeOf(t);
  const onDark = onDarkOf(t);
  const solid = solidOf(t);
  return {
    '--lk-paper': t.page,
    '--lk-paper-light': t.surface,
    '--lk-paper-deep': t.field,
    '--lk-ink': t.text,
    '--lk-ink-rgb': rgbTriple(t.text),
    '--lk-muted': t.muted,
    '--lk-muted-rgb': rgbTriple(t.muted),
    '--lk-cin': accent,
    '--lk-cin-rgb': rgbTriple(accent),
    '--lk-gold': t.border,
    '--lk-gold-rgb': rgbTriple(t.border),
    '--lk-paper-rgb': rgbTriple(t.page),
    '--lk-paper-light-rgb': rgbTriple(t.surface),
    '--lk-shade': shade,
    '--lk-shade-rgb': rgbTriple(shade),
    '--lk-ondark': onDark,
    '--lk-ondark-rgb': rgbTriple(onDark),
    '--lk-solid': solid,
    '--lk-solid-rgb': rgbTriple(solid),
    '--lk-blend': blendOf(t),
  } as React.CSSProperties;
};

/* 主题上下文：让 look.tsx 内部的原子组件（Seal / Paper）能读到当前主题，
 * 从而按明暗切换混合模式。场景文件依然只吃 var()，不需要感知。 */
const ThemeCtx = React.createContext<LookTheme>(PAPER_THEME);
export const useLookTheme = (): LookTheme => React.useContext(ThemeCtx);
export const useIsDark = (): boolean => isDark(React.useContext(ThemeCtx));

/**
 * 主题注入层。包在整部片最外层，之后所有 look 常量/助手都自动跟随。
 * 用 AbsoluteFill 而不是普通 div：它本身就是全屏绝对定位，
 * 不参与父级布局，不会改变原有 12 个场景的定位基准。
 */
export const LookProvider: React.FC<{
  theme?: string;
  accentLock?: boolean;
  children: React.ReactNode;
}> = ({theme, accentLock, children}) => {
  const t = getTheme(theme);
  return (
    <ThemeCtx.Provider value={t}>
      <AbsoluteFill style={{...cssVars(t, accentLock), backgroundColor: PAPER}}>{children}</AbsoluteFill>
    </ThemeCtx.Provider>
  );
};

/* --------------------------- 色板出口 --------------------------- *
 * 全部返回 var() 引用：场景里字符串拼接（渐变、box-shadow、
 * SVG fill）都能直接落地，无需感知主题。
 * ----------------------------------------------------------------- */

export const PAPER = 'var(--lk-paper)';
export const PAPER_LIGHT = 'var(--lk-paper-light)';
export const PAPER_DEEP = 'var(--lk-paper-deep)';
export const INK = 'var(--lk-ink)';
export const CINNABAR = 'var(--lk-cin)';
export const GOLD = 'var(--lk-gold)';

export const SERIF = '"NotoSerifSC", "Songti SC", serif';
export const KAI = '"KaiTi", "STKaiti", serif';

export const ink = (a: number) => `rgb(var(--lk-ink-rgb) / ${a})`;
export const cin = (a: number) => `rgb(var(--lk-cin-rgb) / ${a})`;
export const gold = (a: number) => `rgb(var(--lk-gold-rgb) / ${a})`;
export const paperRgba = (a: number) => `rgb(var(--lk-paper-rgb) / ${a})`;
/** 实体剪影色（城墙 / 船身 / 道路等大块实物）：浅底=墨，暗底=压到底的深色 */
export const solid = (a: number) => `rgb(var(--lk-solid-rgb) / ${a})`;
export const SOLID = 'var(--lk-solid)';

/* 字体：必须在渲染前加载完成，否则首帧会用回退字体 */
const FONT_FILES: [string, string, string][] = [
  ['NotoSerifSC', 'fonts/NotoSerifSC.ttf', '400 900'],
  ['KaiTi', 'fonts/KaiTi.ttf', '400'],
];

export const FontGate: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [handle] = useState(() => delayRender('loading CJK fonts'));
  const done = useRef(false);

  useEffect(() => {
    Promise.all(
      FONT_FILES.map(([family, file, weight]) =>
        new FontFace(family, `url(${staticFile(file)})`, {weight})
          .load()
          .then((face) => document.fonts.add(face)),
      ),
    )
      .then(() => {
        if (!done.current) {
          done.current = true;
          continueRender(handle);
        }
      })
      .catch((err) => cancelRender(err));
  }, [handle]);

  return <>{children}</>;
};

/* 宣纸纹理：feTurbulence 噪声（确定性），逐帧位移制造颗粒流动 */
const NOISE_URL = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='360'>` +
    `<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/>` +
    `<feColorMatrix type='saturate' values='0'/></filter>` +
    `<rect width='360' height='360' filter='url(#n)' opacity='0.5'/></svg>`,
)}`;

export const Paper: React.FC<{dim?: number; warm?: number; cool?: number}> = ({
  dim = 0,
  warm = 0,
  cool = 0,
}) => {
  const frame = useCurrentFrame();
  const dark = useIsDark();
  const bg = useBg();
  const bgP = bg ? clamp(frame / Math.max(bg.frames - 1, 1)) : 0;
  return (
    <AbsoluteFill style={{backgroundColor: PAPER}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(125% 95% at 50% 40%, ${PAPER_LIGHT} 0%, ${PAPER} 46%, ${PAPER_DEEP} 100%)`,
        }}
      />
      {/* 纸底图：夹在底色与纹理之间；本镜独立运镜（缓慢横移 + 推拉） */}
      {bg ? (
        <AbsoluteFill style={{mixBlendMode: 'multiply', opacity: bg.opacity ?? 0.55, overflow: 'hidden'}}>
          <Img
            src={staticFile(bg.src)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `translateX(${(bg.pan * (bgP - 0.5)).toFixed(2)}px) scale(${(bg.push[0] + (bg.push[1] - bg.push[0]) * bgP).toFixed(4)})`,
              transformOrigin: '50% 48%',
            }}
          />
        </AbsoluteFill>
      ) : null}
      {/* 帘纹 */}
      <AbsoluteFill
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, ${ink(0.02)} 0 1px, transparent 1px 6px)`,
        }}
      />
      {/* 纸浆颗粒（静止）：纸纤维不会流动。
          原版按帧位移 backgroundPosition 制造"颗粒流动"，但 360px 平铺的接缝
          会在特定帧位置横切画面，整帧亮度跳 8 个灰阶，观感就是频闪。 */}
      <AbsoluteFill
        style={{
          backgroundImage: `url("${NOISE_URL}")`,
          backgroundSize: '360px 360px',
          backgroundPosition: '0px 0px',
          opacity: dark ? 0.1 : 0.15,
          mixBlendMode: dark ? 'screen' : 'multiply',
        }}
      />
      {warm > 0 ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(80% 70% at 50% 60%, ${cin(0.5 * warm)} 0%, transparent 70%)`,
            // 暗底同理：multiply 会把暖光压成黑，screen 才是「火照亮画面」
            mixBlendMode: dark ? 'screen' : 'multiply',
          }}
        />
      ) : null}
      {cool > 0 ? (
        <AbsoluteFill style={{backgroundColor: `rgba(40,52,66,${0.22 * cool})`}} />
      ) : null}
      {/* 暗角 */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(76% 66% at 50% 46%, ${ink(0)} 44%, ${ink(0.2)} 100%)`,
        }}
      />
      {dim > 0 ? (
        <AbsoluteFill style={{backgroundColor: ink(dim)}} />
      ) : null}
    </AbsoluteFill>
  );
};

/* ---------------------------- 字幕 ---------------------------- */

/** 字幕衬底 —— 常驻全片的一层，不属于任何一条字幕。
 *
 *  原来这块 430px 的纸色渐变画在 Caption 内部，于是「有字幕才有衬底」：
 *  两条字幕之间只要空 1-3 帧，底部就从奶白突然掉成底图本色（实测差 30 个灰阶），
 *  全片 117 条字幕，每次切换都闪一下。衬底必须常驻，字幕只负责文字。
 */
export const CaptionVeil: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 400,
        background: `linear-gradient(to top, ${paperRgba(0.74)} 0%, ${paperRgba(0.34)} 46%, ${paperRgba(0)} 100%)`,
      }}
    />
  </AbsoluteFill>
);

export const Caption: React.FC<{
  text: string;
  opacity?: number;
  tone?: 'ink' | 'paper';
  size?: number;
  offset?: number;
}> = ({text, opacity = 1, tone = 'ink', size = 36, offset = 62}) => {
  const frame = useCurrentFrame();
  // 字幕跟口型：0.2 秒内出齐（原 3→14 帧太慢，观感是"慢半拍"）
  const p = easeOutCubic(ramp(frame, 0, 5));
  const isPaper = tone === 'paper';
  const dark = useIsDark();
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: offset,
      }}
    >
      <div
        style={{
          position: 'relative',
          fontFamily: KAI,
          fontSize: size,
          letterSpacing: '0.14em',
          color: isPaper
            ? `rgb(var(--lk-${dark ? 'ink' : 'paper-light'}-rgb) / 0.96)`
            : ink(0.88),
          opacity: p * opacity,
          transform: `translateY(${(1 - p) * 10}px)`,
          textShadow: isPaper ? '0 2px 12px rgba(30,10,6,0.6)' : undefined,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

/* -------------------------- 逐字入场 -------------------------- */

type InkCharsProps = {
  text: string;
  size: number;
  color?: string;
  weight?: number;
  tracking?: number; // em
  stagger?: number; // 每字间隔帧
  delay?: number;
  dur?: number;
  vertical?: boolean;
  font?: string;
  glow?: string;
  style?: React.CSSProperties;
};

export const InkChars: React.FC<InkCharsProps> = ({
  text,
  size,
  color = INK,
  weight = 600,
  tracking = 0.06,
  stagger = 4,
  delay = 0,
  dur = 16,
  vertical = false,
  font = SERIF,
  glow,
  style,
}) => {
  const frame = useCurrentFrame();
  const chars = [...text];
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: vertical ? 'column' : 'row',
        alignItems: 'center',
        fontFamily: font,
        fontSize: size,
        fontWeight: weight,
        color,
        letterSpacing: vertical ? 0 : `${tracking}em`,
        lineHeight: vertical ? 1.16 : 1.1,
        whiteSpace: 'nowrap',
        textShadow: glow,
        ...style,
      }}
    >
      {chars.map((c, i) => {
        const t = easeOutQuint(clamp((frame - delay - i * stagger) / dur));
        if (c === ' ') {
          return <span key={i} style={{width: size * 0.32}} />;
        }
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: t,
              filter: `blur(${(1 - t) * 9}px)`,
              transform: vertical
                ? `translateY(${(1 - t) * 22}px) scale(${0.96 + 0.04 * t})`
                : `translateY(${(1 - t) * 26}px) scale(${0.94 + 0.06 * t})`,
            }}
          >
            {c}
          </span>
        );
      })}
    </div>
  );
};

/* ---------------------------- 印章 ---------------------------- */

export const Seal: React.FC<{
  text: string;
  size?: number;
  local: number;
  delay?: number;
  rotate?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({text, size = 104, local, delay = 0, rotate = -5, color = CINNABAR, style}) => {
  const t = easeOutQuint(ramp(local, delay, 7));
  const s = 1.62 - 0.62 * t;
  const dark = useIsDark();
  return (
    <div
      style={{
        position: 'absolute',
        width: size,
        height: size * 1.08,
        transform: `scale(${s}) rotate(${rotate}deg)`,
        opacity: t,
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: color,
          borderRadius: 3,
          boxShadow: `0 0 0 3px ${PAPER}, 0 0 0 5px ${color}`,
          opacity: 0.94,
          // 暗底不能 multiply（会把朱砂乘成黑斑），改 screen 保留发光感
          mixBlendMode: dark ? 'screen' : 'multiply',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: KAI,
          fontSize: size * 0.4,
          lineHeight: 1.02,
          color: PAPER,
          letterSpacing: 0,
        }}
      >
        {[...text].map((c, i) => (
          <span key={i}>{c}</span>
        ))}
      </div>
    </div>
  );
};

/* ------------------------- 细线 / 分隔 ------------------------- */

export const Rule: React.FC<{
  width: number | string;
  color?: string;
  thickness?: number;
  style?: React.CSSProperties;
}> = ({width, color = ink(0.35), thickness = 1, style}) => (
  <div style={{width, height: thickness, background: color, ...style}} />
);
