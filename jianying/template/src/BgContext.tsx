import React, {createContext, useContext} from 'react';

/** 单镜纸底图 + 镜头运动。
 *  底图必须活在 Paper() 内部（纸张这一层），否则会把卡片的白页一起压掉。 */
export type BgCfg = {
  src: string;          // public/ 下的相对路径
  frames: number;       // 本镜帧数，用来把运动铺满整镜
  pan: number;          // 整镜横移像素（正=右，负=左）
  push: [number, number]; // 起止缩放，>1 才有横移余量
  opacity?: number;
};

export const BgContext = createContext<BgCfg | null>(null);

export const BgProvider: React.FC<{cfg: BgCfg; children: React.ReactNode}> = ({cfg, children}) => (
  <BgContext.Provider value={cfg}>{children}</BgContext.Provider>
);

export const useBg = () => useContext(BgContext);
