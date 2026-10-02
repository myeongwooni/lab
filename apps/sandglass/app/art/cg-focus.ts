// CG 그림 파일(16:9)이 세로로 좁은 화면에서 어디를 중심으로 잘릴지 정합니다.
// 숫자는 그림 가로 폭에서 주인공이 있는 위치(%)입니다. 화면이 16:9보다 좁아지면 이 지점이 가운데 오도록 자릅니다.
// "fit"은 두 인물이 멀리 떨어져 어디를 잘라도 한 명이 빠지는 그림입니다. 좁은 화면에서는 그림 전체를 보여 주고,
// 남는 위아래는 같은 그림을 흐리게 깔아 채웁니다.
// 여기 없는 CG는 가운데(50)를 씁니다. 그림을 바꾸면 이 값도 다시 확인하세요.
export const CG_FOCUS: Record<string, number | "fit"> = {
  cg_fall: 35,
  cg_first_death: 45,
  cg_clocks: 57,
  cg_demon: 52,
  cg_sand: 57,
  cg_tea: 30,
  cg_e_good: 63,
  cg_e_waltz: 46,
  cg_unmask: 62,
  cg_r_good: 66,
  cg_return: 68,
  cg_true: 70,
  cg_r_bad: "fit",
  cg_s_eye: "fit",
  cg_s_good: "fit",
  cg_shatter: "fit",
  cg_two_kings: "fit",
};

const CG_ASPECT = 16 / 9;

// 화면 비율(가로/세로)에 맞춰 object-position의 가로 값(%)을 구합니다.
// cover로 잘릴 때 보이는 폭은 그림의 view 비율이고, 보이는 영역의 가운데가 focus에 오도록 맞춥니다.
export function cgObjectX(focus: number, screenAspect: number): number {
  if (screenAspect >= CG_ASPECT) return 50;
  const view = screenAspect / CG_ASPECT;
  const p = (focus / 100 - view / 2) / (1 - view);
  return Math.round(Math.min(1, Math.max(0, p)) * 1000) / 10;
}
