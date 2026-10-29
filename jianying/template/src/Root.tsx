import React from 'react';
import {Composition} from 'remotion';
import {Film} from './Film';
import {DEFAULT_THEME} from './look';
import shotsData from '../data/shots.json';

const meta = shotsData.meta;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Film"
      component={Film}
      durationInFrames={meta.durationInFrames}
      fps={meta.fps}
      width={meta.width}
      height={meta.height}
      defaultProps={{theme: meta.theme ?? DEFAULT_THEME, accentLock: meta.accentLock ?? false}}
    />
  );
};
