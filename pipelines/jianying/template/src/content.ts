/**
 * 镜头文案槽。
 *
 * 每个镜头组件接受 `content`（来自 shots.json，最终来自 film.json 的 shots[].content），
 * 组件内的默认值是「赤壁样片」的取值 —— 换选题时只要在 film.json 里覆盖同名键，
 * 画面结构、运动参数、配色一行都不用动。
 *
 * 约定：只放「文案类」内容（标题、地名、日期、印章字），不放布局与时间参数。
 * 布局属于镜头卡本身（已知坑标注的参数不得降档）。
 */

export type ShotContent = Record<string, string>;

/** 取槽位，缺省回落到组件内默认值 */
export const c = (ct: ShotContent | undefined, key: string, fallback: string): string =>
  (ct && ct[key] ? ct[key] : fallback);
