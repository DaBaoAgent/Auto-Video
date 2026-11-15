import {staticFile} from 'remotion';

/**
 * 全片统一字体栈（思源字体系）：
 * - 标题/章节名/片尾主标题：思源宋体 Heavy（SERIF_TITLE）
 * - 章节副标题/正文强调：思源宋体 Bold（SERIF_BOLD）
 * - 正文、地名标签、字幕中文：思源黑体（SANS，Regular/Medium/Light）
 * - 数字/年份：思源宋体（等宽数字用 lining figures，避免等宽字体的工程感）
 *
 * 本机未安装思源字体，故把 6 个字重随 public 一起打包，用 @font-face 引入，
 * 渲染时不会回退到微软雅黑/宋体。
 */

export const FONTS = {
  serifTitle: '"Source Han Serif CN", "Source Han Serif SC", "Noto Serif SC", "SimSun", serif',
  serifBold: '"Source Han Serif CN", "Source Han Serif SC", "Noto Serif SC", "SimSun", serif',
  serif: '"Source Han Serif CN", "Source Han Serif SC", "Noto Serif SC", "SimSun", serif',
  sansMedium: '"Source Han Sans CN", "Source Han Sans SC", "Noto Sans SC", "Microsoft YaHei", sans-serif',
  sans: '"Source Han Sans CN", "Source Han Sans SC", "Noto Sans SC", "Microsoft YaHei", sans-serif',
  sansLight: '"Source Han Sans CN", "Source Han Sans SC", "Noto Sans SC", "Microsoft YaHei", sans-serif',
};

/** 渲染期要引用的字体文件（保证被打进 bundle） */
export const FONT_FILES = [
  staticFile('fonts/SourceHanSerifCN-Heavy.otf'),
  staticFile('fonts/SourceHanSerifCN-Bold.otf'),
  staticFile('fonts/SourceHanSerifCN-Regular.otf'),
  staticFile('fonts/SourceHanSansCN-Medium.otf'),
  staticFile('fonts/SourceHanSansCN-Regular.otf'),
  staticFile('fonts/SourceHanSansCN-Light.otf'),
];

export const FONT_CSS = `
@font-face {
  font-family: 'Source Han Serif CN';
  font-weight: 900;
  src: url('${staticFile('fonts/SourceHanSerifCN-Heavy.otf')}') format('opentype');
  font-display: block;
}
@font-face {
  font-family: 'Source Han Serif CN';
  font-weight: 700;
  src: url('${staticFile('fonts/SourceHanSerifCN-Bold.otf')}') format('opentype');
  font-display: block;
}
@font-face {
  font-family: 'Source Han Serif CN';
  font-weight: 400;
  src: url('${staticFile('fonts/SourceHanSerifCN-Regular.otf')}') format('opentype');
  font-display: block;
}
@font-face {
  font-family: 'Source Han Sans CN';
  font-weight: 500;
  src: url('${staticFile('fonts/SourceHanSansCN-Medium.otf')}') format('opentype');
  font-display: block;
}
@font-face {
  font-family: 'Source Han Sans CN';
  font-weight: 400;
  src: url('${staticFile('fonts/SourceHanSansCN-Regular.otf')}') format('opentype');
  font-display: block;
}
@font-face {
  font-family: 'Source Han Sans CN';
  font-weight: 300;
  src: url('${staticFile('fonts/SourceHanSansCN-Light.otf')}') format('opentype');
  font-display: block;
}
`;
