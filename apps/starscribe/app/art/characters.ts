// 스탠딩(立ち絵) — 역광의 명암 초상. viewBox 0 0 600 1000, 몸은 관객 기준 왼쪽을 향한 3/4 자세.
// 몸은 표정과 무관하게 같고, 얼굴(눈·눈썹·입·홍조·눈물)만 바뀝니다.
// 모든 id/클래스는 `ch-<id>-<expr>-` 접두어를 씁니다(같은 인물 두 표정이 교차 페이드해도 충돌하지 않음).

type Pt = [number, number] | [number, number, number]; // 세 번째 값 1 = 모서리(날카로운 점)

// 캔버스 규모(|n|≥100) 좌표는 정수로, 얼굴 쪽 작은 좌표는 소수 한 자리로 — 문자열 크기 절약
const f = (n: number): string => {
  const v = Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
  return Object.is(v, -0) ? "0" : String(v);
};

/** Catmull-Rom → 3차 베지어. 모서리 표시 점은 접선 0. */
function sp(pts: Pt[], closed = true, k = 1): string {
  const n = pts.length;
  const g = (i: number): Pt => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    const t1 = p1[2] ? 0 : k / 6, t2 = p2[2] ? 0 : k / 6;
    d += `C${f(p1[0] + (p2[0] - p0[0]) * t1)} ${f(p1[1] + (p2[1] - p0[1]) * t1)} ${f(p2[0] - (p3[0] - p1[0]) * t2)} ${f(p2[1] - (p3[1] - p1[1]) * t2)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return closed ? d + "Z" : d;
}

/** 가닥: 중심선을 따라 굵기가 줄어드는 닫힌 모양. mode 1 = 뿌리→끝 뾰족, 2 = 양끝 뾰족. */
function lock(c: Pt[], w: number, mode: 1 | 2 = 1, bulge = 0.5): string {
  const n = c.length;
  const L: Pt[] = [], R: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const len = Math.hypot(tx, ty) || 1;
    tx /= len; ty /= len;
    const t = i / (n - 1);
    const pr = mode === 1 ? Math.pow(1 - t, 0.8) + bulge * t * (1 - t) : Math.pow(Math.sin(Math.PI * t), 0.7);
    const hw = (w * pr) / 2;
    L.push([c[i][0] - ty * hw, c[i][1] + tx * hw]);
    R.push([c[i][0] + ty * hw, c[i][1] - tx * hw]);
  }
  const tip: Pt = [c[n - 1][0], c[n - 1][1], 1];
  if (mode === 1) {
    const l0 = L[0], r0 = R[0];
    return sp([[l0[0], l0[1], 1], ...L.slice(1, n - 1), tip, ...R.slice(1, n - 1).reverse(), [r0[0], r0[1], 1]]);
  }
  return sp([[c[0][0], c[0][1], 1], ...L.slice(1, n - 1), tip, ...R.slice(1, n - 1).reverse()]);
}

// ───────────────────────── 표정 ─────────────────────────
interface Ex {
  o: number; // 윗눈꺼풀 열림
  t: number; // 기울기 + 화남(안쪽 내려감) / - 슬픔
  lo: number; // 아랫눈꺼풀 올라감
  pu: number; // 홍채 크기
  bi: number; // 눈썹 안쪽 dy
  bo: number; // 눈썹 바깥 dy
  bf: number; // 먼 쪽 눈썹 추가 dy (비대칭)
  m: string; // 입
  bl: number; // 홍조
  tr: number; // 눈물 0/1(글썽)/2(흐름)
  arc?: boolean; // 눈 감은 웃음
}

const EXPR: Record<string, Ex> = {
  normal: { o: 1, t: 0, lo: 0, pu: 1, bi: 0, bo: 0, bf: 0, m: "n", bl: 0, tr: 0 },
  smile: { o: 0.88, t: 0, lo: 0.4, pu: 1, bi: -2, bo: -1, bf: 0, m: "smile", bl: 0.35, tr: 0 },
  sad: { o: 0.82, t: -0.7, lo: 0.12, pu: 0.96, bi: -6, bo: 2.5, bf: 0, m: "sad", bl: 0, tr: 1 },
  angry: { o: 0.86, t: 0.9, lo: 0.14, pu: 0.88, bi: 7, bo: -4, bf: 0, m: "angry", bl: 0, tr: 0 },
  surprise: { o: 1.22, t: -0.15, lo: 0, pu: 0.84, bi: -8, bo: -7, bf: 0, m: "o", bl: 0.2, tr: 0 },
  serious: { o: 0.8, t: 0.35, lo: 0.15, pu: 1, bi: 3, bo: 0, bf: 0, m: "flat", bl: 0, tr: 0 },
  tender: { o: 0.78, t: -0.3, lo: 0.32, pu: 1.04, bi: -3, bo: 1, bf: 0, m: "soft", bl: 0.55, tr: 0 },
  pain: { o: 0.5, t: -0.55, lo: 0.3, pu: 0.92, bi: -5, bo: 3, bf: 0, m: "grit", bl: 0.15, tr: 1 },
  smirk: { o: 0.74, t: 0.2, lo: 0.28, pu: 1, bi: 2, bo: 0, bf: -5, m: "smirk", bl: 0, tr: 0 },
  cry: { o: 0.8, t: -0.75, lo: 0.2, pu: 1, bi: -7, bo: 3, bf: 0, m: "cry", bl: 0.6, tr: 2 },
};

// ───────────────────────── 빌더 ─────────────────────────
class B {
  defs: string[] = [];
  sil: string[] = [];
  out: string[] = [];
  n = 0;
  p: string;
  constructor(p: string) {
    this.p = p;
  }
  id(s: string): string {
    return `${this.p}-${s}`;
  }
  /** 도형 정의(실루엣 포함 여부 선택) → id */
  def(d: string, tf = "", sil = true): string {
    const id = this.id("p" + this.n++);
    this.defs.push(`<path id="${id}" d="${d}"${tf ? ` transform="${tf}"` : ""}/>`);
    if (sil) this.sil.push(`<use href="#${id}"/>`);
    return id;
  }
  use(id: string, fill: string, tf = "", extra = ""): void {
    this.out.push(`<use href="#${id}" fill="${fill}"${tf ? ` transform="${tf}"` : ""}${extra}/>`);
  }
  /** 실루엣에 포함되는 부위(정의 1회 + 사용). tf = 머리 좌표계 변환 등 */
  part(d: string, fill: string, tf = "", sil = true, extra = ""): string {
    const id = this.def(d, tf, sil);
    this.use(id, fill, "", extra);
    return id;
  }
  /** 머리 가닥 묶음: 가닥마다 어두운 그림자 사본을 살짝 비껴 깔아 층을 만든다 */
  locks(tf: string, list: [Pt[], number, number?][], fill: string, sh: string, off = "2 1.6"): void {
    for (const [c, w, bu] of list) {
      const id = this.def(lock(c, w, 1, bu ?? 0.5), tf);
      this.use(id, sh, `translate(${off})`);
      this.use(id, fill);
    }
  }
  add(s: string): void {
    this.out.push(s);
  }
  lg(name: string, x1: number, y1: number, x2: number, y2: number, stops: [number, string, number?][]): string {
    const id = this.id(name);
    this.defs.push(
      `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}">${stops
        .map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ""}/>`)
        .join("")}</linearGradient>`,
    );
    return `url(#${id})`;
  }
  rg(name: string, cx: number, cy: number, r: number, stops: [number, string, number?][], extra = ""): string {
    const id = this.id(name);
    this.defs.push(
      `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"${extra}>${stops
        .map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ""}/>`)
        .join("")}</radialGradient>`,
    );
    return `url(#${id})`;
  }
  clip(name: string, inner: string): string {
    const id = this.id(name);
    this.defs.push(`<clipPath id="${id}">${inner}</clipPath>`);
    return `url(#${id})`;
  }
}

const path = (d: string, fill: string, extra = ""): string => `<path d="${d}" fill="${fill}"${extra}/>`;
const stroke = (d: string, col: string, w: number, extra = ""): string =>
  `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;

// ───────────────────────── 얼굴 ─────────────────────────
interface EyeG {
  x: number; // 안쪽 눈꼬리
  y: number;
  w: number;
  h: number;
  s: 1 | -1; // 바깥 방향 (+1 = 오른쪽)
}

interface FaceSpec {
  eyes: [EyeG, EyeG]; // [가까운 눈, 먼 눈]
  brows: [Pt, Pt, number][]; // [안쪽, 바깥, 아치] 가까운/먼
  browW: number;
  browC: string;
  iris: [string, string, string]; // 어두운, 중간, 밝은
  lash: string;
  lashW: number; // 속눈썹 굵기 배수
  sclera: string;
  mouth: [number, number, number, number]; // mx, my, 왼쪽 반폭, 오른쪽 반폭
  lip: string;
  lipFill?: string; // 여성 입술 색
  blush: string;
  skinSh: string; // 선(주름) 색
  noseTip: Pt;
  female?: boolean;
  child?: boolean;
  old?: boolean;
  noEyes?: boolean;
  dim?: number; // 얼굴 전체 그림자 (young)
  mouthLater?: boolean; // 수염 위에 따로 그림
}

function eyeShape(e: EyeG, ex: Ex): { up: Pt[]; low: Pt[]; X: (u: number) => number; Y: (v: number) => number } {
  const X = (u: number) => e.x + e.s * u * e.w;
  const Y = (v: number) => e.y + v * e.h;
  const o = ex.o, t = ex.t;
  const up: [number, number][] = [
    [0, 0],
    [0.17, -0.7 * o + 0.42 * t],
    [0.52, -1.0 * o + 0.14 * t],
    [0.84, -0.86 * o - 0.12 * t],
    [1, -0.32 - 0.12 * t],
  ];
  const low: [number, number][] = [
    [1, -0.32 - 0.12 * t],
    [0.74, 0.3 - ex.lo * 0.62],
    [0.36, 0.34 - ex.lo * 0.4],
    [0, 0],
  ];
  return {
    up: up.map(([u, v], i) => [X(u), Y(v), i === 0 || i === 4 ? 1 : 0] as Pt),
    low: low.map(([u, v], i) => [X(u), Y(v), i === 0 || i === 3 ? 1 : 0] as Pt),
    X,
    Y,
  };
}

function drawEye(b: B, e: EyeG, ex: Ex, fs: FaceSpec, k: string, irisFill: string): void {
  const { up, low, X, Y } = eyeShape(e, ex);
  const lw = fs.lashW;
  if (ex.arc) {
    // 감은 웃음 눈: 위로 볼록한 곡선
    const d = sp([[X(0), Y(0.05)], [X(0.3), Y(-0.55)], [X(0.7), Y(-0.6)], [X(1.02), Y(-0.1)]], false);
    b.add(stroke(d, fs.lash, 2.6 * lw));
    b.add(stroke(sp([[X(0.9), Y(-0.3)], [X(1.12), Y(-0.5)]], false), fs.lash, 1.6 * lw));
    return;
  }
  const open = sp([...up, ...low.slice(1, 3)]);
  const cid = b.clip("e" + k, `<path d="${open}"/>`);
  b.add(path(open, fs.sclera));
  // 홍채
  const uc = 0.52 + 0.07 * e.s;
  const cx = X(uc);
  const cy = Y(-0.28);
  const rx = 0.27 * e.w * ex.pu * (fs.child ? 1.12 : 1);
  const ry = 0.8 * e.h * ex.pu * (fs.child ? 1.08 : 1);
  let g = `<g clip-path="${cid}">`;
  g += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${irisFill}"/>`;
  g += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="${fs.iris[0]}" stroke-width="1.1"/>`;
  g += `<ellipse cx="${f(cx + 0.04 * rx)}" cy="${f(cy - 0.06 * ry)}" rx="${f(rx * 0.4)}" ry="${f(ry * 0.44)}" fill="${fs.iris[0]}" opacity=".9"/>`;
  // 윗눈꺼풀 그림자
  const sh: Pt[] = [...up, ...up.slice(1, 4).reverse().map((p) => [p[0], p[1] + e.h * 0.34] as Pt)];
  g += path(sp(sh), fs.iris[0], ` opacity=".45"`);
  // 하이라이트
  g += `<ellipse class="${b.p}-gl" cx="${f(cx - 0.38 * rx)}" cy="${f(cy - 0.34 * ry)}" rx="${f(rx * 0.3)}" ry="${f(ry * 0.24)}" fill="#fff"/>`;
  g += `<circle cx="${f(cx + 0.42 * rx)}" cy="${f(cy + 0.36 * ry)}" r="${f(rx * 0.13)}" fill="#fff" opacity=".85"/>`;
  if (ex.tr) g += `<ellipse cx="${f(cx)}" cy="${f(Y(0.26))}" rx="${f(e.w * 0.42)}" ry="${f(e.h * 0.12)}" fill="#dfeaff" opacity=".7"/>`;
  g += "</g>";
  b.add(g);
  // 아랫눈꺼풀 선
  b.add(stroke(sp([[X(0.32), Y(0.33 - ex.lo * 0.4)], low[1], [X(0.97), Y(-0.3 - 0.12 * ex.t)]], false), fs.lash, 1.1 * lw, ` opacity=".55"`));
  // 속눈썹 선 (초승달) + 꼬리
  const th = [0.4, 1.3, 2.1, 2.7, 2.6].map((v) => v * lw);
  const top: Pt[] = up.map((p, i) => [p[0], p[1] - th[i], 0] as Pt);
  const tip: Pt = [X(1.13), Y(-0.6 - 0.12 * ex.t) - (fs.female ? 2 : 0), 1];
  const lash = sp([up[0], up[1], up[2], up[3], [up[4][0], up[4][1], 0], tip, top[3], top[2], top[1], [top[0][0], top[0][1], 1]]);
  b.add(path(lash, fs.lash));
  if (fs.female) {
    b.add(stroke(sp([[X(0.9), Y(-0.75 * ex.o)], [X(1.08), Y(-1.0 * ex.o) - 1]], false), fs.lash, 1.3));
  }
  // 쌍꺼풀
  b.add(stroke(sp([[X(0.2), Y(-0.95 * ex.o + 0.4 * ex.t) - 2.5], [X(0.55), Y(-1.2 * ex.o + 0.14 * ex.t) - 2.5], [X(0.92), Y(-1.0 * ex.o - 0.1 * ex.t) - 1.5]], false), fs.skinSh, 1, ` opacity=".7"`));
}

function drawBrow(b: B, br: [Pt, Pt, number], ex: Ex, fs: FaceSpec, far: boolean): void {
  const [I, O, a] = br;
  const dy = far ? ex.bf : 0;
  const ang = ex.t > 0.5 ? 2 : 0; // 화날 때 안쪽이 모임
  const dir = O[0] > I[0] ? 1 : -1;
  const i: Pt = [I[0] + dir * ang, I[1] + ex.bi + dy];
  const o: Pt = [O[0], O[1] + ex.bo + dy];
  const m: Pt = [I[0] + (O[0] - I[0]) * 0.5, I[1] + (O[1] - I[1]) * 0.5 - a + (ex.bi + ex.bo) * 0.5 + dy - (ex.t < -0.5 ? 1 : 0)];
  b.add(path(lock([i, [I[0] + (O[0] - I[0]) * 0.22, i[1] + (m[1] - i[1]) * 0.6], m, o], fs.browW, 1, 0.9), fs.browC));
}

function drawMouth(b: B, fs: FaceSpec, ex: Ex): void {
  const [mx, my, hl, hr] = fs.mouth;
  const l = mx - hl, r = mx + hr;
  const c = fs.lip;
  const dark = "#4a2232";
  const lw = fs.child ? 1.6 : 1.7;
  const lowShade = () => b.add(stroke(`M${f(mx - hl * 0.4)} ${f(my + 6)}Q${f(mx)} ${f(my + 7.2)} ${f(mx + hr * 0.4)} ${f(my + 5.6)}`, c, 1.3, ` opacity=".3"`));
  switch (ex.m) {
    case "smile":
      b.add(stroke(`M${f(l - 1)} ${f(my - 2.2)}Q${f(mx)} ${f(my + 4.2)} ${f(r + 1)} ${f(my - 3)}`, c, lw));
      lowShade();
      break;
    case "grin":
      b.add(path(`M${f(l - 1)} ${f(my - 2)}Q${f(mx)} ${f(my + 1)} ${f(r + 1)} ${f(my - 3)}Q${f(mx + 2)} ${f(my + 11)} ${f(l - 1)} ${f(my - 2)}Z`, dark));
      b.add(path(`M${f(l)} ${f(my - 1.6)}Q${f(mx)} ${f(my + 1.3)} ${f(r)} ${f(my - 2.5)}L${f(r - 1)} ${f(my)}Q${f(mx)} ${f(my + 3.2)} ${f(l + 1)} ${f(my)}Z`, "#f4eef2"));
      b.add(path(`M${f(mx - hl * 0.4)} ${f(my + 5)}Q${f(mx + 1)} ${f(my + 8)} ${f(mx + hr * 0.5)} ${f(my + 4.6)}Q${f(mx)} ${f(my + 4)} ${f(mx - hl * 0.4)} ${f(my + 5)}Z`, "#b85a6a", ` opacity=".8"`));
      break;
    case "sad":
      b.add(stroke(`M${f(l)} ${f(my + 1.8)}Q${f(mx)} ${f(my - 2.2)} ${f(r)} ${f(my + 2.2)}`, c, lw));
      lowShade();
      break;
    case "angry":
      b.add(path(`M${f(l)} ${f(my + 1.5)}Q${f(mx)} ${f(my - 2.5)} ${f(r + 1)} ${f(my + 0.5)}Q${f(r)} ${f(my + 7)} ${f(mx)} ${f(my + 7)}Q${f(l)} ${f(my + 6.5)} ${f(l)} ${f(my + 1.5)}Z`, dark));
      b.add(path(`M${f(l + 1)} ${f(my + 1)}Q${f(mx)} ${f(my - 2)} ${f(r)} ${f(my + 0.3)}L${f(r - 1)} ${f(my + 2.4)}Q${f(mx)} ${f(my + 1.2)} ${f(l + 1.5)} ${f(my + 3)}Z`, "#efe8ee"));
      break;
    case "o":
      b.add(path(`M${f(mx - 5)} ${f(my + 1.5)}Q${f(mx - 5)} ${f(my - 3)} ${f(mx + 0.5)} ${f(my - 3)}Q${f(mx + 6.5)} ${f(my - 3)} ${f(mx + 6)} ${f(my + 2.5)}Q${f(mx + 5.5)} ${f(my + 9)} ${f(mx + 0.5)} ${f(my + 9)}Q${f(mx - 5)} ${f(my + 8.5)} ${f(mx - 5)} ${f(my + 1.5)}Z`, dark));
      b.add(path(`M${f(mx - 2.5)} ${f(my + 7)}Q${f(mx + 1)} ${f(my + 4)} ${f(mx + 4)} ${f(my + 7)}Q${f(mx + 1)} ${f(my + 9)} ${f(mx - 2.5)} ${f(my + 7)}Z`, "#a8505e"));
      break;
    case "flat":
      b.add(stroke(`M${f(l + 1)} ${f(my + 0.4)}Q${f(mx)} ${f(my + 0.9)} ${f(r - 1)} ${f(my - 0.2)}`, c, lw));
      lowShade();
      break;
    case "soft":
      b.add(stroke(`M${f(l)} ${f(my - 0.8)}Q${f(mx)} ${f(my + 2.6)} ${f(r)} ${f(my - 1.6)}`, c, lw * 0.95));
      lowShade();
      break;
    case "grit":
      b.add(path(`M${f(l - 1)} ${f(my - 0.5)}Q${f(mx)} ${f(my - 3.4)} ${f(r + 1)} ${f(my - 1)}Q${f(r + 1.5)} ${f(my + 3.5)} ${f(mx + 1)} ${f(my + 4.2)}Q${f(l - 1.5)} ${f(my + 4)} ${f(l - 1)} ${f(my - 0.5)}Z`, "#e9e2ea", ` stroke="${dark}" stroke-width="1.2"`));
      b.add(stroke(`M${f(l)} ${f(my + 1)}L${f(r)} ${f(my + 0.8)}`, dark, 0.8, ` opacity=".6"`));
      break;
    case "smirk":
      b.add(stroke(`M${f(l)} ${f(my + 0.8)}Q${f(mx + 2)} ${f(my + 2.2)} ${f(r + 2)} ${f(my - 3.5)}`, c, lw));
      b.add(stroke(`M${f(r + 0.5)} ${f(my - 4.5)}L${f(r + 2.8)} ${f(my - 2.5)}`, c, 1, ` opacity=".6"`));
      lowShade();
      break;
    case "cry":
      b.add(path(`M${f(l)} ${f(my + 1.5)}Q${f(mx)} ${f(my - 2.5)} ${f(r)} ${f(my + 1.5)}Q${f(mx + 1)} ${f(my + 7.5)} ${f(l)} ${f(my + 1.5)}Z`, dark));
      b.add(stroke(`M${f(mx - 2)} ${f(my + 4.5)}Q${f(mx)} ${f(my + 3.5)} ${f(mx + 3)} ${f(my + 4.5)}`, "#b86474", 1.2));
      break;
    default:
      b.add(stroke(`M${f(l + 1)} ${f(my)}Q${f(mx)} ${f(my + 1.6)} ${f(r)} ${f(my - 0.7)}`, c, lw));
      lowShade();
  }
  if (fs.lipFill && (ex.m === "n" || ex.m === "soft" || ex.m === "flat" || ex.m === "smirk" || ex.m === "smile" || ex.m === "sad")) {
    b.add(path(`M${f(mx - hl * 0.5)} ${f(my + 1.8)}Q${f(mx)} ${f(my + 1)} ${f(mx + hr * 0.6)} ${f(my + 1.4)}Q${f(mx + 1)} ${f(my + 6.5)} ${f(mx - hl * 0.5)} ${f(my + 1.8)}Z`, fs.lipFill, ` opacity=".75"`));
  }
}

/** 얼굴 부품(눈, 눈썹, 입, 홍조, 눈물). 머리 좌표계 안에서 호출. */
function drawFace(b: B, fs: FaceSpec, ex: Ex): void {
  const iid = b.id("ir");
  b.defs.push(`<linearGradient id="${iid}" x1="0" y1="0" x2="0" y2="1"><stop offset=".1" stop-color="${fs.iris[0]}"/><stop offset=".55" stop-color="${fs.iris[1]}"/><stop offset="1" stop-color="${fs.iris[2]}"/></linearGradient>`);
  // 홍조
  if (ex.bl > 0) {
    const bid = b.id("bl");
    b.defs.push(`<radialGradient id="${bid}"><stop offset="0" stop-color="${fs.blush}" stop-opacity="${ex.bl}"/><stop offset="1" stop-color="${fs.blush}" stop-opacity="0"/></radialGradient>`);
    const bl = `url(#${bid})`;
    const [n, fa] = fs.eyes;
    const nx = n.x + n.w * 0.45, fx = fa.x - fa.w * 0.55, cy = n.y + n.h * 1.9;
    b.add(`<ellipse cx="${f(nx)}" cy="${f(cy)}" rx="${f(n.w * 0.5)}" ry="${f(n.h * 0.55)}" fill="${bl}"/><ellipse cx="${f(fx)}" cy="${f(cy)}" rx="${f(fa.w * 0.42)}" ry="${f(n.h * 0.5)}" fill="${bl}"/>`);
    if (ex.bl > 0.45) {
      let h = "";
      for (let i = 0; i < 3; i++) h += `M${f(nx - 6 + i * 5)} ${f(cy - 3)}l-2.5 5`;
      b.add(stroke(h, fs.blush, 1, ` opacity=".6"`));
    }
  }
  if (!fs.noEyes) {
    fs.eyes.forEach((e, i) => drawEye(b, e, ex, fs, String(i), `url(#${iid})`));
  }
  if (!fs.mouthLater) drawMouth(b, fs, ex);
  // 눈물
  if (ex.tr === 2 && !fs.noEyes) {
    const [n, fa] = fs.eyes;
    const tx = n.x + n.w * 0.45, ty = n.y + n.h * 0.4;
    b.add(path(`M${f(tx - 2)} ${f(ty)}C${f(tx - 3)} ${f(ty + 14)} ${f(tx - 1)} ${f(ty + 26)} ${f(tx - 3)} ${f(ty + 38)}C${f(tx)} ${f(ty + 27)} ${f(tx + 2)} ${f(ty + 14)} ${f(tx + 2)} ${f(ty)}Z`, "#cfe2ff", ` opacity=".8"`));
    b.add(`<ellipse cx="${f(tx - 3)}" cy="${f(ty + 41)}" rx="2.2" ry="3" fill="#e6f0ff" opacity=".9"/>`);
    const qx = fa.x - fa.w * 0.5;
    b.add(path(`M${f(qx - 1.5)} ${f(ty)}C${f(qx - 2)} ${f(ty + 10)} ${f(qx)} ${f(ty + 18)} ${f(qx - 1)} ${f(ty + 26)}C${f(qx + 1)} ${f(ty + 18)} ${f(qx + 1.5)} ${f(ty + 10)} ${f(qx + 1.5)} ${f(ty)}Z`, "#cfe2ff", ` opacity=".7"`));
  } else if (ex.tr === 1 && ex.m === "grit" && !fs.noEyes) {
    const [n] = fs.eyes;
    const tx = n.x + n.w * 1.02, ty = n.y - n.h * 0.1;
    b.add(path(`M${f(tx)} ${f(ty)}q-2.4 4.5 0 6.5q2.4-2 0-6.5Z`, "#dfeaff", ` opacity=".85"`));
  }
}

/** 눈썹은 앞머리 위에 그린다(透け眉) */
function drawBrows(b: B, tf: string, fs: FaceSpec, ex: Ex, op = 0.92): void {
  if (fs.noEyes) return;
  b.add(`<g transform="${tf}" opacity="${op}">`);
  fs.brows.forEach((br, i) => drawBrow(b, br, ex, fs, i === 1));
  b.add(`</g>`);
}

// ───────────────────────── 공통 조립 ─────────────────────────
interface Char {
  rim: string;
  draw: (b: B, ex: Ex, expr: string) => void;
  tweak?: (ex: Ex, expr: string) => Ex;
  halo?: number;
  fade?: [number, number]; // 아랫단이 사라지는 구간
}

function finish(b: B, c: Char): string {
  const P = b.p;
  const sil = b.id("sil");
  b.defs.push(`<g id="${sil}">${b.sil.join("")}</g>`);
  const rimG = b.lg("rg", 0, 60, 0, 980, [[0, c.rim, 1], [0.55, c.rim, 0.85], [1, c.rim, 0.3]]);
  const m1 = b.id("m1"), m2 = b.id("m2"), m3 = b.id("m3"), fm = b.id("fm");
  b.defs.push(
    `<mask id="${m1}"><use href="#${sil}" fill="#fff"/><use href="#${sil}" fill="#000" transform="translate(3.2 1.6)"/></mask>`,
    `<mask id="${m2}"><use href="#${sil}" fill="#fff"/><use href="#${sil}" fill="#000" transform="translate(10 4)"/></mask>`,
    `<mask id="${m3}"><use href="#${sil}" fill="#fff" transform="translate(-2.5 -1.2)"/><use href="#${sil}" fill="#000"/></mask>`,
  );
  const [f0, f1] = c.fade ?? [780, 990];
  const fade = b.lg("fd", 0, f0, 0, f1, [[0, "#fff"], [1, "#000"]]);
  b.defs.push(`<mask id="${fm}"><rect width="600" height="1000" fill="${fade}"/></mask>`);
  const style =
    `<style>.${P}-gl{animation:${P}-gl 5s ease-in-out infinite}.${P}-pl{animation:${P}-pl 3.6s ease-in-out infinite}` +
    `@keyframes ${P}-gl{0%,100%{opacity:1}50%{opacity:.6}}@keyframes ${P}-pl{0%,100%{opacity:.55}50%{opacity:1}}` +
    `@media (prefers-reduced-motion:reduce){.${P}-gl,.${P}-pl{animation:none}}</style>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 1000">${style}<defs>${b.defs.join("")}</defs>` +
    `<g mask="url(#${fm})">` +
    `<rect width="600" height="1000" fill="${rimG}" mask="url(#${m3})" opacity="${c.halo ?? 0.28}"/>` +
    b.out.join("") +
    `<rect width="600" height="1000" fill="${rimG}" mask="url(#${m2})" opacity=".2"/>` +
    `<rect width="600" height="1000" fill="${rimG}" mask="url(#${m1})"/>` +
    `</g></svg>`
  );
}

// ───────────────────────── 인물 ─────────────────────────
const SKIN = { lit: "#eedfd9", mid: "#d2bcc6", sh: "#a48eae", deep: "#6a5886", line: "#86688a" };
type Skin = typeof SKIN;

function drawNeck(b: B, tf: string, neck: Pt[], neckSh: Pt[], neckLine: Pt[] | undefined, s: Skin = SKIN): void {
  const neckG = b.lg("nk", -10, 0, 80, 0, [[0, s.mid], [0.3, s.sh], [1, s.deep]]);
  b.part(sp(neck), neckG, tf);
  b.add(`<g transform="${tf}">${path(sp(neckSh), s.deep, ` opacity=".9"`)}${neckLine ? stroke(sp(neckLine, false), s.deep, 1.5, ` opacity=".8"`) : ""}</g>`);
}

/** 머리(목·얼굴 피부·귀·명암)를 머리 좌표계로 그림. neck이 빈 배열이면 목은 따로(옷 뒤에) 그린 것 */
function head(b: B, tf: string, o: {
  face: Pt[]; neck: Pt[]; ear?: Pt[]; shade: Pt[]; neckSh: Pt[]; skin?: Skin; nose: Pt[]; noseSh: Pt[]; neckLine?: Pt[];
}): string {
  const s = o.skin ?? SKIN;
  const skinG = b.lg("sk", -60, -40, 90, 60, [[0, s.lit], [0.5, s.lit], [1, s.mid]]);
  if (o.neck.length) drawNeck(b, tf, o.neck, o.neckSh, o.neckLine, s);
  if (o.ear) b.part(sp(o.ear), s.sh, tf);
  const fid = b.part(sp(o.face), skinG, tf);
  const fc = b.clip("fc", `<use href="#${fid}"/>`);
  b.add(
    `<g clip-path="${fc}"><g transform="${tf}">${path(sp(o.shade), s.sh, ` opacity=".75"`)}</g></g><g transform="${tf}">` +
      path(sp(o.noseSh), s.sh, ` opacity=".8"`) +
      stroke(sp(o.nose, false), "#fffaf6", 1.1, ` opacity=".55"`) +
      `</g>`,
  );
  return fc;
}

// ── 얼굴 틀 (머리 좌표계: 눈높이 y=0, 콧대 x=0) ──
interface Geo {
  face: Pt[]; neck: Pt[]; neckSh: Pt[]; neckLine?: Pt[]; ear?: Pt[]; shade: Pt[]; nose: Pt[]; noseSh: Pt[];
  eyes: [EyeG, EyeG]; brows: [Pt, Pt, number][]; mouth: [number, number, number, number];
}
const GEO: Record<"f" | "c" | "o", Geo> = {
  f: {
    face: [[-44, -70], [-50, -40], [-50, -14], [-47, 3], [-48, 16], [-43, 36], [-32, 56], [-17, 71], [-5, 79], [3, 81], [14, 78], [32, 64], [50, 42], [60, 22], [66, -10], [62, -60], [26, -88], [-20, -86]],
    neck: [[10, 64], [42, 44], [44, 100], [48, 150], [30, 160], [16, 150], [14, 110]],
    neckSh: [[10, 68], [40, 50], [46, 68], [46, 110], [30, 108], [16, 94]],
    neckLine: [[40, 44], [32, 80]],
    ear: [[56, -4], [66, -12], [73, -3], [71, 13], [64, 25], [56, 23]],
    shade: [[46, -80], [52, -30], [44, 10], [38, 38], [26, 58], [8, 86], [100, 86], [100, -80]],
    nose: [[-4, 10], [-5, 20]],
    noseSh: [[2, 10], [-1, 22], [-3, 32], [1, 35, 1], [-5, 35], [-8, 33, 1], [-4, 33], [-2, 24]],
    eyes: [{ x: 9, y: 4, w: 42, h: 18, s: 1 }, { x: -12, y: 4, w: 28, h: 17, s: -1 }],
    brows: [[[8, -18], [54, -20], 4], [[-10, -16], [-44, -15], 3]],
    mouth: [-4, 55, 8, 11],
  },
  c: {
    face: [[-44, -66], [-50, -36], [-51, -10], [-50, 8], [-49, 24], [-44, 42], [-32, 58], [-16, 68], [-4, 73], [4, 74], [16, 71], [36, 58], [52, 38], [60, 18], [64, -10], [60, -56], [24, -84], [-20, -82]],
    neck: [[12, 60], [42, 42], [42, 100], [46, 150], [30, 160], [16, 150], [16, 110]],
    neckSh: [[12, 62], [40, 46], [44, 64], [44, 100], [30, 98], [18, 86]],
    ear: [[54, -2], [64, -10], [71, -1], [69, 14], [62, 25], [54, 22]],
    shade: [[48, -80], [54, -30], [48, 10], [40, 38], [26, 56], [8, 80], [100, 80], [100, -80]],
    nose: [[-5, 16], [-6, 22]],
    noseSh: [[0, 18], [-2, 28], [1, 31, 1], [-4, 31], [-7, 29, 1], [-3, 28]],
    eyes: [{ x: 8, y: 6, w: 43, h: 22, s: 1 }, { x: -12, y: 6, w: 29, h: 21, s: -1 }],
    brows: [[[8, -20], [52, -22], 4], [[-10, -18], [-43, -17], 3]],
    mouth: [-3, 50, 7, 9],
  },
  o: {
    face: [[-44, -72], [-50, -42], [-52, -14], [-50, 3], [-52, 18], [-48, 42], [-40, 62], [-24, 80], [-8, 92], [4, 94], [18, 90], [38, 74], [56, 50], [66, 28], [72, -10], [68, -62], [30, -92], [-20, -90]],
    neck: [[8, 70], [50, 44], [54, 100], [58, 150], [30, 160], [10, 150], [10, 110]],
    neckSh: [[8, 74], [46, 52], [56, 70], [58, 120], [34, 118], [12, 100]],
    ear: [[60, -8], [74, -18], [84, -6], [82, 20], [72, 36], [60, 30]],
    shade: [[44, -80], [50, -30], [42, 14], [36, 44], [24, 68], [8, 98], [100, 98], [100, -80]],
    nose: [[-4, 10], [-8, 28]],
    noseSh: [[2, 8], [-2, 26], [-4, 40], [2, 44, 1], [-7, 44], [-12, 41, 1], [-6, 40], [-2, 28]],
    eyes: [{ x: 10, y: 6, w: 40, h: 12, s: 1 }, { x: -12, y: 6, w: 27, h: 11, s: -1 }],
    brows: [[[8, -12], [54, -12], 3], [[-10, -10], [-44, -8], 2]],
    mouth: [-4, 66, 10, 14],
  },
};
function spec(g: Geo, o: Partial<FaceSpec> & { iris: [string, string, string] }): FaceSpec {
  return {
    eyes: g.eyes, brows: g.brows, mouth: g.mouth, browW: 4, browC: "#2a2233", lash: "#1a1424", lashW: 1, sclera: "#eeebf4",
    lip: "#7a4a5c", blush: "#ec8f9c", skinSh: SKIN.line, noseTip: [-8, 32], ...o,
  };
}
function headGeo(b: B, tf: string, g: Geo, skin?: Skin, noEar = false, neckDone = false): string {
  return head(b, tf, { face: g.face, neck: neckDone ? [] : g.neck, neckSh: g.neckSh, neckLine: g.neckLine, ear: noEar ? undefined : g.ear, shade: g.shade, nose: g.nose, noseSh: g.noseSh, skin });
}
/** 앞머리가 이마에 드리우는 그림자 */
function bangShadow(b: B, tf: string, fc: string, pts: Pt[], skin: Skin = SKIN, op = 0.55): void {
  b.add(`<g clip-path="${fc}"><g transform="${tf}">${path(sp([...pts, [100, -100], [-80, -100]]), skin.sh, ` opacity="${op}"`)}</g></g>`);
}
function strands(b: B, tf: string, list: [Pt[], number][], col: string, op = 0.8): void {
  b.add(`<g transform="${tf}">` + list.map(([c, w]) => path(lock(c, w, 2), col, ` opacity="${op}"`)).join("") + `</g>`);
}

// ── 카시안 ──
const cassian: Char = {
  rim: "#9fb4d8",
  tweak: (ex) => ({ ...ex, o: ex.o * 0.86 }),
  draw(b, ex) {
    const HT = "translate(285 198) rotate(-3)";
    const hairD = "#0a0b16", hairL = "#48557f";
    const hairG = b.lg("hg", -50, -120, 90, 60, [[0, "#2c3154"], [0.45, "#1b1e36"], [1, "#0e0f1e"]]);
    // 망토 뒤판(먼 쪽 틈 + 가까운 쪽 바깥)
    const cloakG = b.lg("cg", 140, 360, 540, 900, [[0, "#3c4262"], [0.5, "#262a44"], [1, "#15162a"]]);
    b.part(sp([[400, 352], [470, 372], [506, 420], [522, 540], [532, 700], [540, 1000, 1], [440, 1000, 1], [440, 400, 1]]), cloakG);
    // 뒷머리
    b.part(
      sp([[-60, -20], [-72, -60], [-60, -98], [-22, -126], [30, -136], [76, -126], [108, -102], [126, -68], [134, -32], [128, 2], [142, 30, 1], [120, 22], [126, 58, 1], [102, 40], [100, 76, 1], [84, 50], [72, 72, 1], [64, 30], [20, 0]]),
      hairG, HT);
    // 몸통(셔츠)
    const shirtG = b.lg("sg", 180, 380, 440, 760, [[0, "#2e3252"], [0.5, "#1b1d34"], [1, "#0e0f20"]]);
    const torso = b.part(sp([[300, 334], [250, 348], [212, 362], [190, 392, 1], [192, 470], [208, 590], [214, 660], [206, 760], [204, 1000, 1], [422, 1000, 1], [420, 760], [404, 650], [414, 560], [436, 470], [462, 398, 1], [440, 366], [396, 346], [352, 330]]), shirtG);
    const tc = b.clip("tc", `<use href="#${torso}"/>`);
    b.add(`<g clip-path="${tc}">` +
      // 가슴 명암
      path(sp([[330, 400], [410, 390], [440, 470], [420, 600], [404, 660], [360, 640], [352, 520]]), "#0c0d1b", ` opacity=".55"`) +
      // 주름
      path(sp([[232, 450], [276, 520], [292, 610], [280, 650, 1], [304, 600], [290, 520]]), "#0a0b18", ` opacity=".7"`) +
      path(sp([[250, 610], [300, 640], [330, 656, 1], [296, 628]]), "#0a0b18", ` opacity=".6"`) +
      stroke(sp([[240, 452], [282, 524], [296, 604]], false), "#56608e", 1.6, ` opacity=".55"`) +
      stroke(sp([[376, 560], [370, 610], [352, 648]], false), "#56608e", 1.3, ` opacity=".4"`) +
      // 여밈선과 단추
      stroke(sp([[322, 400], [318, 520], [312, 650]], false), "#07080f", 2.2) +
      [430, 480, 530, 580, 626].map((y) => `<circle cx="${f(322 - (y - 400) * 0.05 + 7)}" cy="${y}" r="2.6" fill="#7f88ad"/>`).join("") +
      // 벨트
      path(`M200 668L420 660L422 700L202 712Z`, "#101122") +
      stroke(`M202 673L420 665`, "#5b648e", 1.4, ` opacity=".7"`) +
      `<rect x="296" y="661" width="30" height="42" rx="4" fill="none" stroke="#98a0c2" stroke-width="3.2"/>` +
      `</g>`);
    // 드러난 목과 쇄골(V) — 목은 머리 좌표계에서 먼저 그리고, 여기선 가슴 쪽
    b.part(sp([[296, 330], [322, 326], [350, 330], [338, 380], [322, 410, 1], [306, 380]]), "#8b779e", "", false);
    b.add(stroke(`M304 372Q316 380 321 396M340 370Q330 382 324 396`, "#5c4c78", 1.3, ` opacity=".7"`));
    // 높은 깃: 뒤쪽 띠 + 풀어 젖힌 앞 깃
    b.part(sp([[334, 286], [362, 292], [370, 336], [350, 344], [340, 316]]), "#101121");
    b.part(sp([[298, 290], [282, 300], [274, 336], [288, 372], [322, 412, 1], [304, 360], [300, 320]]), "#262a45");
    b.add(stroke(sp([[298, 292], [284, 304], [277, 336], [290, 370], [320, 408]], false), "#8d97c0", 1.6, ` opacity=".7"`));
    b.part(sp([[346, 290], [368, 312], [364, 350], [326, 412, 1], [344, 356], [344, 318]]), "#17182c");
    b.add(stroke(sp([[347, 292], [366, 314], [362, 350], [328, 408]], false), "#6f79a4", 1.4, ` opacity=".6"`));
    // 가까운 팔(늘어뜨림) — 망토 아래로 나옴
    const armG = b.lg("ag", 440, 500, 510, 860, [[0, "#262a46"], [1, "#0e0f1e"]]);
    b.part(sp([[436, 470], [488, 480], [498, 580], [498, 680], [492, 770], [486, 810, 1], [450, 812, 1], [450, 740], [452, 640], [442, 560]]), armG);
    b.add(stroke(sp([[470, 620], [476, 700], [470, 770]], false), "#3c4570", 1.5, ` opacity=".6"`));
    // 가까운 손목 족쇄
    b.add(`<g transform="rotate(-3 470 792)"><rect x="444" y="780" width="50" height="24" rx="7" fill="#161d38" stroke="#8fb8ff" stroke-width="3"/>` +
      `<rect class="${b.p}-pl" x="440" y="776" width="58" height="32" rx="10" fill="none" stroke="#b8d2ff" stroke-width="1.6"/></g>`);
    // 먼 팔(허리에 손)
    const farG = b.lg("fg", 110, 400, 230, 720, [[0, "#30355a"], [1, "#12132a"]]);
    b.part(sp([[204, 380], [180, 404], [158, 456], [138, 520], [120, 580], [114, 606, 1], [136, 634], [176, 662], [208, 680, 1], [216, 654], [186, 638], [160, 612], [156, 594], [170, 540], [186, 484], [200, 446]]), farG);
    b.add(stroke(sp([[176, 430], [152, 510], [132, 586]], false), "#58629a", 1.4, ` opacity=".5"`));
    b.add(path(sp([[204, 652], [232, 646], [244, 668], [234, 694], [206, 690]]), "#b39bb3"));
    b.add(stroke(`M214 656L238 652M212 668L240 664`, "#7c6590", 1.2, ` opacity=".7"`));
    b.add(`<g transform="rotate(-58 190 664)"><rect x="176" y="640" width="26" height="46" rx="7" fill="#161d38" stroke="#8fb8ff" stroke-width="3"/>` +
      `<rect class="${b.p}-pl" x="172" y="636" width="34" height="54" rx="10" fill="none" stroke="#b8d2ff" stroke-width="1.6"/></g>`);
    // 끊어진 사슬
    b.add(stroke(`M168 688l-8 18M158 712l-4 16`, "#6f7fb0", 4, ` opacity=".85"`));
    // 망토 앞자락(가까운 어깨에 걸침, 해진 끝)
    const cid = b.part(sp([[346, 322], [404, 336], [456, 354], [492, 384], [512, 430], [520, 500], [518, 560], [506, 586, 1], [494, 566], [482, 598, 1], [468, 570], [452, 604, 1], [440, 568], [424, 590, 1], [414, 540], [404, 470], [388, 408], [362, 360]]), cloakG);
    const cc = b.clip("cc", `<use href="#${cid}"/>`);
    b.add(`<g clip-path="${cc}">` +
      path(sp([[430, 380], [470, 440], [480, 540], [470, 600], [458, 520], [446, 440]]), "#14152a", ` opacity=".7"`) +
      stroke(sp([[372, 350], [396, 410], [410, 480], [420, 560]], false), "#7a86b4", 2.2, ` opacity=".7"`) +
      stroke(sp([[452, 372], [492, 420], [504, 500]], false), "#5a6594", 1.4, ` opacity=".5"`) +
      `</g>`);
    // 망토 여밈 끈
    b.add(stroke(`M360 346Q340 372 332 404`, "#7a86b4", 1.6, ` opacity=".6"`));
    // 머리
    const fc = head(b, HT, {
      neck: [[8, 70], [50, 42], [52, 100], [56, 150], [30, 160], [12, 150], [12, 110]],
      neckSh: [[8, 74], [46, 50], [54, 70], [56, 120], [34, 118], [14, 100]],
      neckLine: [[46, 40], [36, 90], [22, 136]],
      ear: [[60, -6], [72, -14], [80, -4], [78, 14], [70, 28], [60, 26]],
      face: [[-46, -72], [-52, -42], [-53, -14], [-50, 3], [-52, 16], [-47, 40], [-36, 60], [-20, 77], [-6, 86], [4, 88], [18, 84], [38, 70], [58, 46], [68, 26], [74, -10], [70, -60], [30, -90], [-20, -88]],
      shade: [[46, -80], [52, -30], [44, 12], [38, 42], [26, 64], [8, 92], [100, 90], [100, -80]],
      nose: [[-4, 10], [-6, 22]],
      noseSh: [[2, 8], [-1, 24], [-3, 36], [2, 40, 1], [-6, 40], [-10, 37, 1], [-5, 37], [-2, 26]],
    });
    // 앞머리 그림자(이마)
    b.add(`<g clip-path="${fc}"><g transform="${HT}">${path(sp([[-60, -40], [-40, -18], [-20, -24], [0, -8], [20, -18], [40, -14], [60, -10], [80, -20], [80, -90], [-60, -90]]), SKIN.sh, ` opacity=".6"`)}</g></g>`);
    const fs: FaceSpec = {
      eyes: [
        { x: 10, y: 4, w: 42, h: 15.5, s: 1 },
        { x: -12, y: 4, w: 28, h: 14.5, s: -1 },
      ],
      brows: [
        [[8, -15], [56, -19], 3],
        [[-10, -13], [-45, -14], 2],
      ],
      browW: 5,
      browC: "#15162a",
      iris: ["#252b40", "#5a6a86", "#b7c6da"],
      lash: "#0c0d18",
      lashW: 1.05,
      sclera: "#ebe8f2",
      mouth: [-4, 61, 10, 14],
      lip: "#6b4658",
      blush: "#e58a9a",
      skinSh: SKIN.line,
      noseTip: [-9, 36],
    };
    b.add(`<g transform="${HT}">`);
    drawFace(b, fs, ex);
    b.add(`</g>`);
    // 앞머리 — 흐트러진 결
    b.part(sp([[-58, -46], [-54, -88], [-24, -118], [22, -128], [66, -116], [94, -86], [96, -50], [64, -78], [20, -90], [-26, -80]]), hairG, HT);
    b.locks(HT, [
      // 정수리 삐침
      [[[20, -116], [44, -134], [70, -142]], 24, 0.3],
      [[[56, -114], [88, -124], [116, -116]], 22, 0.3],
      // 옆·뒤
      [[[86, -96], [104, -60], [104, -20], [92, 30]], 26],
      [[[74, -100], [84, -70], [88, -40], [96, -12]], 24],
      // 먼 쪽 관자놀이에서 튀는 가닥
      [[[-30, -100], [-58, -80], [-70, -56], [-82, -40]], 26],
      [[[-24, -104], [-50, -80], [-62, -50], [-66, -20]], 32],
      [[[-6, -110], [-28, -82], [-42, -52], [-48, -22]], 30],
      [[[58, -106], [62, -78], [58, -48], [64, -18]], 28],
      [[[10, -112], [-4, -82], [-16, -52], [-22, -12]], 28],
      [[[42, -112], [38, -82], [30, -50], [28, -14]], 28],
      [[[26, -112], [18, -80], [8, -48], [4, -4]], 20],
      [[[-12, -120], [20, -130], [56, -122], [86, -104]], 26, 0.2],
    ], hairG, hairD);
    // 결 하이라이트 + 천사의 고리
    const hl: [Pt[], number][] = [
      [[[-26, -100], [-46, -80], [-56, -58]], 4],
      [[[-4, -104], [-22, -82], [-32, -62]], 3.5],
      [[[12, -106], [2, -86], [-6, -66]], 3],
      [[[40, -106], [36, -86], [32, -66]], 3],
      [[[58, -100], [62, -82], [60, -64]], 3],
      [[[-36, -104], [-4, -118], [34, -120]], 3.2],
      [[[82, -80], [92, -50], [92, -20]], 3],
    ];
    b.add(`<g transform="${HT}">` + hl.map(([c, w]) => path(lock(c, w, 2), hairL, ` opacity=".75"`)).join("") + `</g>`);
    drawBrows(b, HT, fs, ex);
    // 흉터 (가까운 눈썹을 가름) — 앞머리 위로도 보이도록 마지막에
    b.add(`<g transform="${HT}">` + path(`M33 -28l2.6 .6l-5 22.4l-1.4-.4Z`, "#d9b9c4", ` opacity=".9"`) + `</g>`);
  },
};

// ── 루시엔 ──
const lucien: Char = {
  rim: "#c8c3e8",
  tweak: (ex) => ({ ...ex, lo: ex.lo + 0.14, t: ex.t - 0.12 }),
  draw(b, ex) {
    const HT = "translate(292 206) rotate(2) scale(.97)";
    const hD = "#4c4f7a", hL = "#f1f2ff";
    const hairG = b.lg("hg", -60, -120, 100, 80, [[0, "#eceefc"], [0.35, "#b4b8da"], [0.75, "#7a7eab"], [1, "#4e5182"]]);
    const robeG = b.lg("rb", 200, 380, 430, 800, [[0, "#bdbbdb"], [0.3, "#7e7cad"], [0.75, "#4a4878"], [1, "#2e2c55"]]);
    const robeD = "#3c3a68";
    const silver = "#eef0ff";
    // 뒷머리
    b.part(sp([[-58, -20], [-66, -60], [-50, -102], [0, -126], [56, -118], [98, -90], [118, -52], [122, -12], [112, 26], [96, 56], [70, 62], [60, 30], [20, 0]]), hairG, HT);
    drawNeck(b, HT, [[10, 70], [48, 44], [50, 100], [54, 150], [30, 160], [14, 150], [14, 110]], [[10, 74], [44, 52], [52, 70], [54, 120], [34, 118], [16, 100]], [[44, 44], [36, 80]]);
    // 몸통(로브)
    const torso = b.part(sp([[300, 330], [246, 346], [218, 368], [206, 398, 1], [208, 480], [220, 600], [224, 700], [216, 800], [212, 1000, 1], [414, 1000, 1], [410, 800], [400, 660], [402, 560], [418, 470], [436, 404, 1], [420, 370], [382, 346], [348, 330]]), robeG);
    const tc = b.clip("tc", `<use href="#${torso}"/>`);
    let t = `<g clip-path="${tc}">`;
    // 겹쳐 여민 앞자락
    t += path(sp([[322, 336], [352, 420], [362, 540], [360, 700], [360, 1000, 1], [430, 1000, 1], [430, 330, 1]]), robeD, ` opacity=".55"`);
    t += stroke(sp([[322, 338], [352, 420], [362, 540], [360, 700], [360, 1000]], false), silver, 1.6, ` opacity=".8"`);
    t += stroke(sp([[330, 336], [360, 420], [370, 540], [368, 700], [368, 1000]], false), silver, 1, ` opacity=".5"`);
    for (let i = 0; i < 9; i++) {
      const y = 380 + i * 44, x = 356 + Math.min(1, (y - 340) / 200) * 8 - Math.max(0, (y - 700) / 100);
      t += `<path d="M${f(x)} ${y - 5}l4 5l-4 5l-4-5Z" fill="${silver}" opacity=".7"/>`;
    }
    // 주름
    t += stroke(sp([[250, 620], [262, 720], [258, 860]], false), "#5a588a", 2, ` opacity=".6"`);
    t += stroke(sp([[296, 640], [306, 760], [300, 900]], false), "#5a588a", 1.6, ` opacity=".5"`);
    t += stroke(sp([[236, 610], [244, 700]], false), "#e6e6fa", 1.4, ` opacity=".45"`);
    // 허리띠
    t += path(`M214 646L404 636L406 676L216 690Z`, "#4a4876");
    t += stroke(`M215 650L404 640M216 686L405 672`, silver, 1.2, ` opacity=".6"`);
    t += path(sp([[350, 650], [364, 646], [370, 662], [362, 676], [348, 674]]), "#d7d8f0");
    t += `</g>`;
    b.add(t);
    // 높은 깃
    b.part(sp([[298, 286, 1], [324, 290], [346, 272], [356, 262, 1], [362, 330], [322, 344], [294, 334]]), "#a19fca");
    b.add(path(sp([[332, 286], [356, 262, 1], [362, 330], [336, 340]]), "#4a4878", ` opacity=".7"`));
    b.add(stroke(`M298 287Q324 292 356 262M294 334Q322 346 362 330`, silver, 1.5, ` opacity=".85"`));
    b.add(`<circle cx="322" cy="338" r="4.5" fill="#d9ddf6" stroke="#6a6c9a" stroke-width="1"/>`);
    // 가까운 팔(넓은 소매)
    const slG = b.lg("sl", 420, 400, 500, 820, [[0, "#6a689a"], [1, "#2a284e"]]);
    b.part(sp([[434, 400], [462, 450], [476, 560], [488, 680], [504, 800], [496, 830, 1], [430, 826, 1], [424, 720], [418, 600], [414, 480]]), slG);
    b.add(stroke(sp([[432, 818], [496, 822]], false), silver, 2, ` opacity=".6"`));
    b.add(stroke(sp([[456, 520], [468, 640], [478, 760]], false), "#3a3862", 1.6, ` opacity=".6"`));
    // 먼 팔(위팔은 책 뒤) + 책 + 책 앞을 가로지르는 아래팔
    const faG = b.lg("fa", 180, 400, 300, 700, [[0, "#aeacd2"], [0.5, "#6c6a9c"], [1, "#34325e"]]);
    b.part(sp([[208, 396], [192, 440], [184, 520], [188, 600], [216, 612], [228, 540], [226, 440]]), faG);
    b.part(sp([[226, 452, 1], [236, 444, 1], [248, 578, 1], [238, 584, 1]]), "#d9d8ee");
    b.part(sp([[236, 444, 1], [318, 432, 1], [328, 566, 1], [248, 578, 1]]), b.lg("bk", 236, 440, 330, 580, [[0, "#c6c4e2"], [1, "#6e6c9c"]]));
    b.add(stroke(`M244 452L312 442L320 558L254 568Z`, silver, 1.1, ` opacity=".7"`));
    b.add(`<path class="${b.p}-pl" d="M270 478l3 11l11 3l-11 3l-3 11l-3-11l-11-3l11-3Z" fill="#dfe8ff"/>`);
    b.add(path(`M236 444l10-1.5l1 9l-9.5 1.4Z M318 432l-10 1.5l1 9l9.5-1.4Z`, silver, ` opacity=".85"`));
    // 손등과 손가락(끝이 은빛으로 물듦)
    b.add(path(sp([[282, 572], [286, 546], [298, 530], [322, 532], [326, 552], [310, 574]]), "#cdb8c8"));
    const fx: [number, number, number, number][] = [[294, 534, 296, 500], [302, 531, 306, 496], [310, 531, 316, 499], [318, 534, 324, 507]];
    for (const [x0, y0, x1, y1] of fx) {
      b.add(stroke(`M${x0} ${y0}Q${f((x0 + x1) / 2 + 1)} ${f((y0 + y1) / 2)} ${x1} ${y1}`, "#d9c6d2", 7.2));
      b.add(stroke(`M${f(x1 - (x1 - x0) * 0.18)} ${f(y1 - (y1 - y0) * 0.18)}L${x1} ${y1}`, "#e8ecff", 7.2));
    }
    b.add(stroke(`M292 548Q306 540 320 546`, "#8f7aa0", 1, ` opacity=".6"`));
    b.part(sp([[190, 596], [198, 646], [220, 686], [248, 700, 1], [266, 656], [290, 610], [300, 586, 1], [292, 562, 1], [262, 570], [230, 590], [212, 592]]), faG);
    b.add(stroke(`M300 586L292 562`, silver, 2, ` opacity=".7"`));
    b.add(stroke(sp([[206, 620], [226, 664], [244, 690]], false), "#3a3862", 1.5, ` opacity=".6"`));
    // 머리
    const fc = head(b, HT, {
      neck: [],
      neckSh: [[10, 74], [44, 52], [52, 70], [54, 120], [34, 118], [16, 100]],
      neckLine: [[44, 44], [36, 80]],
      ear: [[58, -6], [70, -14], [78, -4], [76, 14], [68, 28], [58, 26]],
      face: [[-44, -72], [-50, -42], [-51, -14], [-48, 3], [-50, 16], [-45, 40], [-34, 60], [-18, 76], [-5, 85], [4, 87], [16, 83], [36, 68], [54, 44], [64, 24], [70, -10], [66, -60], [28, -90], [-20, -88]],
      shade: [[48, -80], [54, -30], [46, 12], [40, 42], [28, 64], [10, 92], [100, 90], [100, -80]],
      nose: [[-4, 10], [-6, 22]],
      noseSh: [[2, 8], [-1, 24], [-3, 36], [2, 40, 1], [-6, 40], [-10, 37, 1], [-5, 37], [-2, 26]],
    });
    b.add(`<g clip-path="${fc}"><g transform="${HT}">${path(sp([[-60, -30], [-44, -12], [-20, -20], [0, -6], [24, -14], [50, -10], [80, -18], [80, -90], [-60, -90]]), SKIN.sh, ` opacity=".5"`)}</g></g>`);
    const fs: FaceSpec = {
      eyes: [
        { x: 10, y: 4, w: 41, h: 15, s: 1 },
        { x: -12, y: 4, w: 27, h: 14, s: -1 },
      ],
      brows: [
        [[8, -16], [54, -19], 3.5],
        [[-10, -14], [-44, -13], 2.5],
      ],
      browW: 3.6,
      browC: "#585b86",
      iris: ["#2e3c5c", "#7390b4", "#d2e2f2"],
      lash: "#1c1e36",
      lashW: 0.95,
      sclera: "#eeecf5",
      mouth: [-4, 60, 10, 14],
      lip: "#7a5064",
      blush: "#e8909e",
      skinSh: SKIN.line,
      noseTip: [-9, 36],
    };
    b.add(`<g transform="${HT}">`);
    drawFace(b, fs, ex);
    // 안경 (가는 은테)
    b.add(`<rect x="3" y="-19" width="58" height="33" rx="12" fill="#e8ecff" fill-opacity=".07" stroke="#dfe3f6" stroke-width="1.7"/>` +
      `<rect x="-44" y="-18" width="35" height="31" rx="10" fill="#e8ecff" fill-opacity=".07" stroke="#dfe3f6" stroke-width="1.5"/>` +
      stroke(`M-9 -6Q-3 -10 3 -6M61 -6L72 -4`, "#dfe3f6", 1.6) +
      stroke(`M44 -14l-12 22M52 -12l-6 11`, "#fff", 1.4, ` opacity=".35"`));
    b.add(`</g>`);
    // 앞머리 (옆가르마, 긴 옆머리)
    b.part(sp([[-54, -46], [-52, -90], [-20, -118], [24, -126], [66, -114], [94, -84], [96, -50], [64, -86], [20, -96], [-26, -84]]), hairG, HT);
    b.locks(HT, [
      [[[-40, -92], [-60, -62], [-68, -20], [-64, 30], [-66, 70], [-58, 96]], 24, 0.6],
      [[[76, -98], [90, -58], [86, -10], [80, 40], [72, 94]], 26, 0.3],
      [[[62, -110], [72, -80], [72, -44], [76, -12]], 24],
      [[[40, -116], [10, -102], [-24, -78], [-46, -46], [-56, -14]], 34, 0.4],
      [[[36, -116], [12, -96], [-8, -66], [-18, -36], [-22, -16]], 30],
      [[[46, -114], [36, -88], [24, -58], [14, -28], [8, -10]], 26],
      [[[52, -114], [56, -86], [50, -54], [46, -22]], 24],
    ], hairG, hD, "1.6 1.4");
    const hl: [Pt[], number][] = [
      [[[24, -112], [-4, -96], [-30, -70]], 3.4],
      [[[40, -106], [26, -80], [16, -56]], 2.6],
      [[[-36, -100], [0, -118], [40, -120]], 3.2],
      [[[80, -86], [88, -50], [84, -4]], 2.8],
      [[[-52, -60], [-60, -20], [-58, 30]], 2.4],
    ];
    b.add(`<g transform="${HT}">` + hl.map(([c, w]) => path(lock(c, w, 2), hL, ` opacity=".85"`)).join("") + `</g>`);
    drawBrows(b, HT, fs, ex);
    // 어깨 앞으로 넘긴 묶은 머리 (목덜미에서 모아 가까운 어깨 위로)
    const ptG = b.lg("pt", 360, 280, 440, 660, [[0, "#c3c6e6"], [0.5, "#9296c4"], [1, "#5a5d90"]]);
    b.locks("", [
      [[[370, 292], [396, 322], [412, 380], [414, 460], [404, 540], [390, 610], [372, 668]], 50, 0.3],
      [[[366, 292], [386, 340], [396, 420], [392, 510], [376, 590], [356, 640]], 30],
      [[[384, 300], [414, 350], [428, 430], [424, 520], [418, 580]], 26],
      [[[392, 440], [404, 520], [396, 600], [398, 680]], 18],
    ], ptG, hD, "1.6 1.4");
    b.add(path(lock([[384, 320], [400, 390], [402, 470], [394, 560]], 6, 2), hL, ` opacity=".85"`));
    b.add(path(lock([[410, 360], [418, 440], [412, 520]], 3.5, 2), hL, ` opacity=".6"`));
    b.add(path(lock([[374, 350], [384, 430], [378, 520], [364, 600]], 3, 2), "#2e3060", ` opacity=".5"`));
    // 머리끈
    b.add(`<g transform="rotate(-16 404 352)"><rect x="382" y="346" width="44" height="13" rx="4" fill="#2c2a55"/><rect x="382" y="346" width="44" height="3" rx="1.5" fill="${silver}" opacity=".8"/></g>`);
  },
};

// ── 이졸데 ──
const isolde: Char = {
  rim: "#e08a9a",
  tweak: (ex) => ({ ...ex, o: ex.o * 0.9, t: ex.t + 0.22, lo: ex.lo + 0.08 }),
  draw(b, ex) {
    const HT = "translate(294 224) rotate(-2) scale(.95)";
    const g = GEO.f;
    const hD = "#0c070d", hL = "#8a5a6c";
    const hairG = b.lg("hg", -60, -140, 110, 60, [[0, "#4e3244"], [0.45, "#2a1825"], [1, "#140a12"]]);
    const crim = b.lg("cr", 200, 380, 440, 900, [[0, "#b84a60"], [0.4, "#7c1f33"], [1, "#3a0e1c"]]);
    const blk = b.lg("bl", 220, 380, 420, 800, [[0, "#3a2c44"], [0.5, "#1c1426"], [1, "#0c0812"]]);
    const gold = "#e6c890";
    // 망토(진홍) 뒤판
    b.part(sp([[300, 346], [230, 372], [196, 420], [178, 560], [166, 760], [160, 1000, 1], [460, 1000, 1], [450, 760], [440, 560], [428, 420], [396, 370]]), crim);
    // 뒷머리 + 틀어 올린 머리
    b.part(sp([[-56, -20], [-62, -60], [-50, -100], [-6, -122], [52, -120], [96, -96], [114, -58], [110, -18], [98, 12], [80, 30], [64, 24], [60, 0], [20, -10]]), hairG, HT);
    b.part(sp([[40, -118], [58, -150], [96, -160], [128, -140], [132, -108], [110, -90], [80, -94]]), hairG, HT);
    strands(b, HT, [[[[56, -138], [86, -154], [118, -140]], 3.4], [[[62, -120], [96, -134], [122, -118]], 2.6]], hL, 0.8);
    b.add(`<g transform="${HT}">${stroke("M104 -150L138 -170", "#dfe3f6", 2.4)}<circle cx="140" cy="-171" r="3.4" fill="#e08a9a"/></g>`);
    drawNeck(b, HT, g.neck, g.neckSh, g.neckLine);
    // 몸통(검은 보디스 + 진홍 앞판)
    const torso = b.part(sp([[300, 330], [262, 348], [234, 368], [222, 394, 1], [226, 470], [240, 560], [246, 620], [232, 700], [214, 820], [204, 1000, 1], [436, 1000, 1], [426, 820], [404, 700], [388, 620], [392, 560], [406, 470], [420, 400, 1], [404, 370], [372, 348], [344, 330]]), blk);
    const tc = b.clip("tc", `<use href="#${torso}"/>`);
    let t = `<g clip-path="${tc}">`;
    t += path(sp([[276, 420], [360, 414], [350, 520], [326, 640, 1], [296, 520]]), crim);
    t += stroke(sp([[276, 420], [296, 520], [326, 640]], false), gold, 1.4, ` opacity=".75"`);
    t += stroke(sp([[360, 414], [350, 520], [326, 640]], false), gold, 1.4, ` opacity=".6"`);
    for (let i = 0; i < 5; i++) t += stroke(`M${290 + i * 2} ${444 + i * 40}L${352 - i * 5} ${440 + i * 40}`, "#1c0a12", 1.6, ` opacity=".7"`);
    // 치마 (진홍 겉치마 + 검은 속치마)
    t += path(sp([[240, 640], [326, 652], [400, 636], [420, 760], [440, 1000, 1], [190, 1000, 1], [214, 780]]), crim);
    t += path(sp([[300, 660], [326, 652], [352, 660], [362, 800], [370, 1000, 1], [280, 1000, 1], [290, 800]]), "#1a0f1c");
    t += stroke(sp([[300, 660], [290, 800], [280, 1000]], false), gold, 1.4, ` opacity=".7"`);
    t += stroke(sp([[352, 660], [362, 800], [370, 1000]], false), gold, 1.2, ` opacity=".5"`);
    t += stroke(sp([[250, 700], [238, 820], [230, 960]], false), "#3a0e1c", 2.2, ` opacity=".7"`);
    t += stroke(sp([[396, 690], [410, 820], [418, 960]], false), "#240812", 2.2, ` opacity=".7"`);
    t += stroke(`M238 646L326 656L402 640`, gold, 2, ` opacity=".8"`);
    t += `</g>`;
    b.add(t);
    // 팔: 허리 앞에서 두 손을 포갬
    const slv = b.lg("sv", 200, 400, 440, 700, [[0, "#3e3048"], [0.5, "#1c1426"], [1, "#0c0812"]]);
    b.part(sp([[226, 392], [210, 440], [204, 520], [210, 580], [236, 618], [280, 636], [290, 612], [250, 588], [236, 540], [240, 460]]), slv);
    b.part(sp([[418, 398], [436, 450], [440, 540], [430, 596], [390, 630], [330, 646], [322, 622], [376, 594], [404, 540], [404, 460]]), slv);
    b.add(stroke(sp([[226, 400], [210, 470], [212, 560], [240, 606]], false), "#6a4a6a", 1.4, ` opacity=".6"`));
    b.add(stroke(sp([[404, 470], [404, 540], [376, 594], [324, 624]], false), "#4a3450", 1.6, ` opacity=".8"`));
    b.add(stroke(sp([[240, 470], [236, 540], [252, 588], [284, 610]], false), "#4a3450", 1.6, ` opacity=".8"`));
    b.part(sp([[222, 392], [236, 364], [270, 356], [262, 400], [246, 440], [218, 440]]), crim);
    b.part(sp([[420, 400], [410, 368], [376, 356], [386, 400], [400, 444], [428, 444]]), crim);
    b.add(stroke(`M236 372Q246 400 240 436M252 362Q258 396 250 430M400 368Q400 404 410 440M388 362Q390 400 398 434`, "#3a0e1c", 1.6, ` opacity=".7"`));
    b.add(stroke(`M220 442Q232 446 246 440M400 444Q414 448 428 444`, gold, 1.6, ` opacity=".8"`));
    // 레이스 소맷부리 + 손
    b.add(path(sp([[276, 606], [300, 604], [334, 612], [342, 638], [318, 656], [288, 650]]), "#d4bccb"));
    b.add(path(sp([[300, 614], [330, 610], [348, 626], [340, 646], [312, 646]]), "#c8afc0"));
    b.add(stroke(`M312 622Q328 620 342 628M310 632Q326 632 340 638`, "#8a6e8a", 1, ` opacity=".7"`));
    b.add(`<circle cx="330" cy="616" r="3" fill="${gold}"/>`);
    b.add(stroke(`M276 606Q282 614 280 624Q286 630 284 640M324 646Q334 640 338 650`, "#efe3ee", 2, ` opacity=".7"`));
    // 높은 레이스 깃 (목을 감싸고 위로 벌어지는 주름 깃)
    b.part(sp([[288, 296, 1], [322, 306], [356, 282, 1], [370, 336], [324, 352], [284, 340]]), "#a996b0");
    b.add(path(sp([[330, 304], [356, 282, 1], [370, 336], [336, 350]]), "#5a4668", ` opacity=".6"`));
    let lace = "";
    for (let i = 0; i < 9; i++) {
      const u = i / 8, x = 288 + u * 68, y = 296 + Math.sin(u * Math.PI) * 8 - u * 14;
      lace += `<circle cx="${f(x)}" cy="${f(y)}" r="5.2" fill="${i > 5 ? "#8a7896" : "#c6b4c8"}"/>`;
    }
    b.add(lace);
    b.add(stroke(`M292 310Q322 322 358 300M290 326Q322 338 364 318`, "#f4eaf2", 1.2, ` opacity=".5"`));
    b.add(stroke(`M300 300l2 44M314 304l1 44M330 304l0 44M344 296l-1 48`, "#6e5878", 1, ` opacity=".45"`));
    b.add(path(`M322 342l8 10l-8 12l-8-12Z`, "#e0566e") + path(`M322 342l8 10l-8 3Z`, "#ffb0bc", ` opacity=".8"`) + stroke(`M322 342l8 10l-8 12l-8-12Z`, gold, 1.2));
    // 머리
    const fc = headGeo(b, HT, g, SKIN, false, true);
    bangShadow(b, HT, fc, [[-60, -60], [-30, -72], [10, -76], [50, -66], [80, -60]], SKIN, 0.45);
    const fs = spec(g, {
      iris: ["#3a3238", "#8a7a66", "#dcc79c"], lash: "#120a12", lashW: 1.25, female: true, browC: "#1e1119", browW: 3.8,
      lip: "#6e2a3a", lipFill: "#a8344a", blush: "#e88090",
    });
    b.add(`<g transform="${HT}">`);
    drawFace(b, fs, ex);
    b.add(`</g>`);
    // 앞머리: 이마를 드러내고 뒤로 넘김 + 옆 가닥
    b.part(sp([[-54, -44], [-52, -84], [-20, -112], [24, -120], [66, -112], [96, -84], [100, -40], [80, -58], [56, -72], [20, -80], [-18, -76], [-40, -60]]), hairG, HT);
    b.locks(HT, [
      [[[40, -104], [10, -96], [-20, -80], [-38, -58], [-48, -34]], 30, 0.5],
      [[[46, -100], [24, -84], [4, -70], [-10, -56]], 20],
      [[[-40, -74], [-54, -40], [-56, 0], [-54, 40], [-46, 76]], 12, 0.4],
      [[[64, -64], [74, -30], [74, 10], [70, 50]], 12, 0.4],
    ], hairG, hD, "1.4 1.2");
    strands(b, HT, [
      [[[-44, -66], [-20, -96], [20, -110], [60, -104]], 3.2],
      [[[-30, -60], [0, -82], [40, -88], [80, -76]], 2.4],
      [[[20, -76], [56, -86], [90, -70]], 2],
    ], hL, 0.75);
    // 은관
    b.add(`<g transform="${HT}">` +
      stroke(sp([[-46, -80], [-20, -104], [20, -114], [60, -108], [90, -90]], false), "#dfe3f6", 2.4) +
      path(`M10 -113l5-15l5 15Z M-12 -106l4-9l4 9Z M34 -113l4-9l4 9Z`, "#e8ecff") +
      `<circle class="${b.p}-gl" cx="15" cy="-117" r="3" fill="#ffb8c6"/></g>`);
    drawBrows(b, HT, fs, ex);
  },
};

// ── 그레고르 ──
const gregor: Char = {
  rim: "#d8b878",
  tweak: (ex) => ({ ...ex, o: ex.o * (ex.m === "o" ? 0.85 : 0.62), lo: ex.lo + 0.3, pu: ex.pu * 0.95 }),
  draw(b, ex) {
    const HT = "translate(292 226) rotate(4) scale(.96)";
    const g = GEO.o;
    const gold = "#d8b878", goldL = "#f2dca8";
    const whiteG = b.lg("wh", -60, -100, 100, 200, [[0, "#f4f1ea"], [0.5, "#c9c4d6"], [1, "#7c7898"]]);
    const robeG = b.lg("rb", 180, 380, 460, 900, [[0, "#4e4478"], [0.4, "#2e2750"], [1, "#16122a"]]);
    const stoleG = b.lg("st", 250, 380, 400, 900, [[0, "#e4c88c"], [0.5, "#a88448"], [1, "#5e4424"]]);
    // 몸통(두꺼운 예복) — 어깨가 둥글게 굽음
    const torso = b.part(sp([[300, 334], [252, 350], [214, 376], [196, 414, 1], [192, 500], [196, 640], [190, 800], [184, 1000, 1], [446, 1000, 1], [440, 800], [436, 640], [440, 500], [448, 420, 1], [428, 380], [384, 352], [346, 336]]), robeG);
    const tc = b.clip("tc", `<use href="#${torso}"/>`);
    let t = `<g clip-path="${tc}">`;
    // 금실 영대(스톨) 두 줄
    for (const [x0, x1] of [[270, 262], [364, 372]] as [number, number][]) {
      t += path(`M${x0 - 22} 360L${x0 + 22} 356L${x1 + 24} 1000L${x1 - 24} 1000Z`, stoleG);
      t += stroke(`M${x0 - 18} 362L${x1 - 20} 1000M${x0 + 18} 358L${x1 + 20} 1000`, "#5e4424", 1.4, ` opacity=".7"`);
      for (let i = 0; i < 6; i++) {
        const y = 420 + i * 90, x = x0 + (x1 - x0) * ((y - 360) / 640);
        t += `<path d="M${f(x)} ${y - 16}l10 16l-10 16l-10-16Z" fill="none" stroke="#fff4d6" stroke-width="1.4" opacity=".75"/><circle cx="${f(x)}" cy="${y}" r="3" fill="#8fb8ff" opacity=".85"/>`;
      }
    }
    t += stroke(sp([[220, 560], [236, 700], [230, 880]], false), "#12102a", 2.4, ` opacity=".7"`);
    t += stroke(sp([[420, 540], [410, 700], [414, 880]], false), "#12102a", 2.4, ` opacity=".7"`);
    t += `</g>`;
    b.add(t);
    // 가까운 소매
    const slG = b.lg("sl", 420, 420, 520, 860, [[0, "#3a3262"], [1, "#12102a"]]);
    b.part(sp([[440, 410], [470, 460], [486, 580], [500, 720], [514, 820], [500, 850, 1], [430, 846, 1], [432, 720], [430, 580], [426, 480]]), slG);
    b.add(stroke(`M432 836L506 840`, gold, 3.5, ` opacity=".8"`));
    b.add(stroke(sp([[460, 520], [474, 660], [486, 780]], false), "#12102a", 1.8, ` opacity=".7"`));
    // 어깨 망토(금 테두리)
    b.part(sp([[300, 330], [236, 350], [196, 390], [182, 450], [196, 486], [240, 470], [300, 452], [346, 458], [400, 476], [446, 490], [462, 440], [446, 392], [400, 352], [346, 330]]), b.lg("mt", 190, 340, 460, 490, [[0, "#5a4f86"], [0.5, "#352c5c"], [1, "#1c1636"]]));
    b.add(stroke(sp([[182, 452], [196, 486], [240, 470], [300, 452], [346, 458], [400, 476], [446, 490], [462, 442]], false), gold, 4));
    b.add(stroke(sp([[186, 440], [240, 458], [300, 440], [346, 446], [400, 464], [456, 478]], false), goldL, 1.2, ` opacity=".6"`));
    // 지팡이 (먼 손) + 성묵 결정
    const staffG = b.lg("sf", 140, 0, 170, 0, [[0, "#8a6a44"], [1, "#3e2c1c"]]);
    b.part(`M150 400L166 400L170 1000L148 1000Z`, staffG);
    b.add(stroke(`M151 410L152 1000`, goldL, 1.2, ` opacity=".5"`));
    b.part(sp([[196, 414], [176, 460], [164, 520], [160, 566], [182, 590], [204, 580], [210, 520], [214, 460]]), robeG);
    b.add(path(sp([[146, 548], [176, 540], [188, 560], [182, 590], [150, 592], [140, 572]]), "#c4acbc"));
    b.add(stroke(`M150 556Q166 550 182 556M148 570Q166 564 184 572`, "#7a6180", 1.1, ` opacity=".7"`));
    b.add(stroke(`M152 392L150 360M164 392L168 360`, gold, 3));
    const glow = b.rg("gw", 158, 330, 60, [[0, "#8fb8ff", 0.55], [1, "#8fb8ff", 0]]);
    b.add(`<circle class="${b.p}-pl" cx="158" cy="330" r="60" fill="${glow}"/>`);
    b.add(path(`M158 290L174 316L170 350L158 366L146 350L142 316Z`, "#6d9ae8") + path(`M158 290L174 316L158 330L142 316Z`, "#cfe0ff") + path(`M158 330L170 350L158 366Z`, "#3c64b8") + stroke(`M158 290L174 316L170 350L158 366L146 350L142 316Z`, "#e8f0ff", 1.2, ` opacity=".8"`));
    b.add(path(`M146 392l24 0l-4-26l-16 0Z`, gold));
    // 머리 (대머리 + 흰 옆머리)
    b.part(sp([[-50, -40], [-46, -84], [-10, -110], [40, -112], [86, -92], [110, -52], [112, -6], [96, 30], [60, 20], [0, 0]]), b.lg("sc", -50, -110, 110, 20, [[0, SKIN.lit], [0.5, SKIN.mid], [1, SKIN.sh]]), HT);
    b.locks(HT, [
      [[[84, -80], [104, -56], [112, -24], [110, 10], [100, 40]], 16, 0.8],
      [[[72, -70], [92, -44], [100, -10], [96, 22], [88, 48]], 16, 0.8],
      [[[62, -56], [76, -34], [80, -6], [74, 22]], 12],
      [[[96, -60], [118, -30], [122, 6], [114, 30]], 10],
      [[[-44, -52], [-54, -32], [-58, -8]], 14],
    ], whiteG, "#6c6888", "1.4 1.2");
    const fc = headGeo(b, HT, g);
    b.add(`<g transform="${HT}">` + stroke(`M-38 -52Q-8 -60 30 -54M-34 -38Q-6 -46 28 -40M-28 -24Q-2 -30 22 -26`, SKIN.line, 1.2, ` opacity=".45"`) +
      stroke(`M54 4l10 -4M54 10l11 2M52 16l9 5`, SKIN.line, 1, ` opacity=".6"`) + stroke(`M16 20Q30 26 46 20M-18 20Q-28 24 -38 20`, SKIN.line, 1, ` opacity=".5"`) + `</g>`);
    void fc;
    const fs = spec(g, {
      iris: ["#3a3230", "#7a6a5a", "#c8b89a"], lash: "#3a3040", lashW: 0.85, browC: "#f4f0ea", browW: 6.5, lip: "#6a4a52", mouthLater: true,
      brows: [[[8, -14], [58, -6], 4], [[-10, -12], [-46, -4], 3]],
    });
    b.add(`<g transform="${HT}">`);
    drawFace(b, fs, ex);
    // 수염 (볼·턱에서 가슴까지)
    const beard = sp([[-46, 30], [-44, 60], [-30, 100], [-24, 150], [-8, 210], [6, 250, 1], [22, 206], [44, 160], [60, 110], [64, 60], [66, 26], [50, 50], [30, 70], [4, 68], [-20, 58], [-36, 40]]);
    b.add(`</g>`);
    b.part(beard, whiteG, HT);
    b.add(`<g transform="${HT}">`);
    b.add(stroke(sp([[-30, 70], [-18, 130], [-4, 190]], false), "#8e8aa8", 1.4, ` opacity=".7"`) + stroke(sp([[10, 80], [14, 150], [8, 220]], false), "#8e8aa8", 1.4, ` opacity=".6"`) + stroke(sp([[40, 80], [36, 140], [24, 190]], false), "#6c6888", 1.4, ` opacity=".7"`));
    b.add(path(lock([[-34, 60], [-24, 120], [-12, 170]], 5, 2), "#fff", ` opacity=".6"`));
    // 콧수염
    b.add(path(sp([[-2, 52], [-18, 56], [-34, 68, 1], [-16, 64], [-2, 60], [14, 62], [34, 70, 1], [18, 56]]), "#e6e2dc"));
    drawMouth(b, { ...fs, mouth: [-3, 70, 8, 10] }, ex);
    b.add(`</g>`);
    b.add(`<g transform="${HT} translate(1.2 1.6)" opacity=".75">`);
    fs.brows.forEach((br, i) => drawBrow(b, br, ex, { ...fs, browC: "#6e6888" }, i === 1));
    b.add(`</g>`);
    drawBrows(b, HT, fs, ex, 1);
  },
};

// ── 미렐 ──
/** 곱슬 윤곽: 타원 호를 따라 볼록한 덩어리를 이어 붙임 */
function curls(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n: number, amp: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= n * 2; i++) {
    const a = a0 + ((a1 - a0) * i) / (n * 2);
    const r = i % 2 ? 1 + amp : 1;
    pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r, i % 2 ? 0 : 1]);
  }
  return pts;
}
const mirelle: Char = {
  rim: "#f2a7a0",
  tweak: (ex, e) => ({ ...ex, m: e === "smile" ? "grin" : e === "surprise" ? "o" : ex.m, arc: e === "smile", o: e === "surprise" ? 1.12 : ex.o }),
  draw(b, ex) {
    const HT = "translate(296 244) rotate(-4) scale(.95)";
    const g = GEO.c;
    const hD = "#4a1224", hL = "#ffb89a";
    const hairG = b.lg("hg", -70, -120, 110, 70, [[0, "#ee8a66"], [0.4, "#c04a48"], [1, "#5e1a30"]]);
    const tun = b.lg("tu", 220, 400, 420, 800, [[0, "#c6c4dc"], [0.4, "#8a88b0"], [1, "#3e3c64"]]);
    const cape = b.lg("cp", 220, 380, 420, 560, [[0, "#8a8ca8"], [0.5, "#5a5c7a"], [1, "#2c2d44"]]);
    // 뒷머리 (곱슬 단발)
    b.part(sp([[-54, 0], ...curls(24, -34, 86, 90, Math.PI * 0.95, Math.PI * 2.28, 9, 0.12), [70, 54], [40, 30]]), hairG, HT);
    drawNeck(b, HT, g.neck, g.neckSh, g.neckLine);
    // 몸통 (견습 튜닉) — 손은 등 뒤로
    const torso = b.part(sp([[304, 350], [268, 364], [240, 384], [230, 414, 1], [236, 490], [248, 580], [250, 640], [236, 760], [230, 1000, 1], [410, 1000, 1], [404, 760], [390, 640], [388, 580], [394, 490], [404, 420, 1], [390, 386], [364, 366], [338, 350]]), tun);
    const tc = b.clip("tc", `<use href="#${torso}"/>`);
    b.add(`<g clip-path="${tc}">` +
      path(`M246 640L392 632L396 664L248 674Z`, "#3a2c44") +
      stroke(`M247 644L392 636`, "#f2a7a0", 1.2, ` opacity=".5"`) +
      stroke(sp([[282, 690], [276, 820], [270, 980]], false), "#3e3c64", 2, ` opacity=".6"`) +
      stroke(sp([[350, 690], [360, 820], [366, 980]], false), "#2e2c54", 2, ` opacity=".6"`) +
      stroke(sp([[322, 360], [320, 500], [318, 630]], false), "#3e3c64", 1.6, ` opacity=".6"`) +
      // 가방끈
      path(`M388 392L402 404L258 640L244 628Z`, "#6a3a30") + stroke(`M390 396L250 632`, "#d8a080", 1, ` opacity=".6"`) +
      `</g>`);
    // 팔 (뒤로 돌린 위팔)
    b.part(sp([[232, 412], [220, 460], [218, 540], [230, 600], [250, 596], [248, 520], [250, 450]]), tun);
    b.part(sp([[402, 418], [416, 470], [418, 550], [404, 604], [388, 598], [390, 520], [390, 450]]), b.lg("na", 390, 420, 420, 600, [[0, "#6a6890"], [1, "#2e2c50"]]));
    // 가방 (먼 쪽 허리)
    b.part(sp([[214, 620, 1], [268, 614, 1], [272, 690, 1], [220, 698, 1]]), "#7a4434");
    b.add(path(`M214 620L268 614L268 640L214 648Z`, "#9a5a44") + `<circle cx="242" cy="642" r="4" fill="#e6c890"/>` + stroke(`M226 660l30-3M228 676l28-3`, "#d8a080", 1, ` opacity=".5"`));
    // 짧은 회색 망토
    const cp = b.part(sp([[300, 344], [256, 356], [226, 380], [210, 420], [206, 470], [214, 510], [236, 498], [262, 512], [290, 500], [320, 512], [350, 498], [380, 510], [408, 496], [424, 504], [428, 454], [418, 400], [392, 364], [344, 344]]), cape);
    void cp;
    b.add(stroke(sp([[206, 470], [214, 510], [236, 498], [262, 512], [290, 500], [320, 512], [350, 498], [380, 510], [408, 496], [424, 504]], false), "#c8cae0", 1.6, ` opacity=".6"`));
    b.add(stroke(`M262 400Q256 450 262 508M300 396Q300 450 290 500M372 396Q384 450 380 508`, "#2c2d44", 1.6, ` opacity=".7"`));
    // 깃 + 브로치
    b.part(sp([[292, 330], [322, 344], [350, 330], [356, 360], [322, 374], [288, 360]]), "#9c9eba");
    b.add(`<circle cx="322" cy="368" r="6" fill="#f2a7a0" stroke="#e6c890" stroke-width="1.6"/>`);
    // 머리
    const fc = headGeo(b, HT, g, SKIN, false, true);
    bangShadow(b, HT, fc, [[-60, -40], [-40, -22], [-16, -30], [8, -18], [30, -28], [56, -20], [80, -26]]);
    const fs = spec(g, {
      iris: ["#3a2a24", "#8a5a3a", "#e8c080"], lash: "#2a1018", lashW: 1.15, female: true, child: true, browC: "#8a3040", browW: 3.6, lip: "#8a4a54", blush: "#f08a8a",
    });
    b.add(`<g transform="${HT}">`);
    // 주근깨
    let fr = "";
    for (const [x, y] of [[-34, 26], [-28, 32], [-40, 32], [-22, 26], [26, 30], [34, 26], [40, 32], [30, 36], [46, 28], [-6, 22], [2, 24]] as [number, number][]) fr += `<circle cx="${x}" cy="${y}" r="1.3"/>`;
    b.add(`<g fill="#b86a5a" opacity=".6">${fr}</g>`);
    drawFace(b, fs, ex);
    // 막대사탕 막대
    const [mx, my, , hr] = fs.mouth;
    b.add(stroke(`M${mx + hr - 2} ${my + 1}L${mx + hr + 22} ${my + 20}`, "#f4f0ea", 3) + stroke(`M${mx + hr - 2} ${my + 1}L${mx + hr + 22} ${my + 20}`, "#b8b0c8", 1, ` opacity=".6" transform="translate(.8 1)"`));
    b.add(`</g>`);
    // 앞머리 (곱슬)
    b.part(sp([[-56, -30], ...curls(16, -60, 74, 62, Math.PI * 1.0, Math.PI * 1.95, 6, 0.14), [84, -40], [60, -60], [20, -70], [-20, -64]]), hairG, HT);
    b.locks(HT, [
      [[[-30, -96], [-52, -70], [-62, -40], [-56, -18], [-48, -24]], 26, 0.8],
      [[[-10, -100], [-26, -72], [-32, -44], [-26, -24], [-18, -30]], 24, 0.8],
      [[[14, -102], [4, -74], [0, -46], [8, -26], [14, -34]], 22, 0.8],
      [[[36, -100], [36, -72], [32, -46], [40, -28], [46, -36]], 22, 0.8],
      [[[58, -94], [66, -66], [66, -40], [74, -24], [78, -32]], 22, 0.8],
      [[[74, -80], [90, -46], [88, -6], [78, 24], [88, 30]], 24, 0.8],
      [[[-50, -60], [-70, -30], [-72, 8], [-62, 40], [-54, 34]], 22, 0.8],
    ], hairG, hD, "1.6 1.4");
    strands(b, HT, [
      [[[-40, -86], [-10, -104], [30, -106]], 3.4],
      [[[-58, -56], [-64, -30], [-60, -10]], 2.6],
      [[[-18, -86], [-26, -60], [-24, -40]], 2.4],
      [[[40, -88], [38, -64], [42, -44]], 2.2],
      [[[80, -60], [88, -30], [84, 0]], 2.4],
    ], hL, 0.75);
    drawBrows(b, HT, fs, ex);
  },
};

// ── 테오 ──
const theo: Char = {
  rim: "#b8d890",
  tweak: (ex, e) => ({ ...ex, m: e === "smile" ? "grin" : ex.m, lo: e === "smile" ? 0.5 : ex.lo }),
  draw(b, ex) {
    const HT = "translate(292 236) rotate(-2) scale(.96)";
    const g = GEO.c;
    const hD = "#1c0e0a", hL = "#d8a070";
    const hairG = b.lg("hg", -60, -120, 100, 60, [[0, "#a8704a"], [0.45, "#6a3e28"], [1, "#2e1a12"]]);
    const uni = b.lg("un", 210, 380, 430, 800, [[0, "#4e6070"], [0.4, "#2c3a48"], [1, "#141c26"]]);
    const brass = "#e0c080";
    // 뒷머리 (짧고 삐침)
    b.part(sp([[-54, -10], [-62, -54], [-50, -94], [-10, -118], [40, -122], [84, -108], [110, -80], [124, -52, 1], [110, -46], [118, -16, 1], [102, -12], [106, 16, 1], [88, 12], [82, 40, 1], [66, 20], [30, 0]]), hairG, HT);
    drawNeck(b, HT, g.neck, g.neckSh, g.neckLine);
    // 몸통 (간수 제복)
    const torso = b.part(sp([[302, 344], [262, 356], [230, 378], [216, 410, 1], [220, 490], [232, 580], [236, 650], [226, 760], [222, 1000, 1], [414, 1000, 1], [410, 760], [396, 650], [398, 580], [406, 490], [420, 414, 1], [404, 380], [372, 358], [340, 344]]), uni);
    const tc = b.clip("tc", `<use href="#${torso}"/>`);
    let t = `<g clip-path="${tc}">`;
    t += path(sp([[312, 360], [340, 360], [342, 650], [314, 654]]), "#3a4c5c", ` opacity=".6"`);
    for (let i = 0; i < 6; i++) t += `<circle cx="${f(336 - i * 0.6)}" cy="${400 + i * 42}" r="3.6" fill="${brass}"/>`;
    t += stroke(sp([[250, 440], [270, 520], [276, 610]], false), "#101620", 1.8, ` opacity=".7"`);
    t += stroke(sp([[378, 450], [372, 540], [368, 620]], false), "#6a8090", 1.3, ` opacity=".5"`);
    t += path(`M232 640L398 632L400 668L234 678Z`, "#1c1410") + `<rect x="306" y="636" width="24" height="36" rx="3" fill="none" stroke="${brass}" stroke-width="2.6"/>`;
    t += `</g>`;
    b.add(t);
    // 열쇠 꾸러미
    b.add(`<circle cx="256" cy="690" r="12" fill="none" stroke="${brass}" stroke-width="2.4"/>` + stroke(`M250 700l-6 26l6 0M262 700l4 22l6-2M256 702l0 30`, brass, 2.4));
    // 먼 팔 (늘어뜨린 주먹)
    b.part(sp([[220, 406], [202, 460], [194, 540], [196, 620], [200, 680], [226, 684], [228, 620], [234, 540], [240, 460]]), uni);
    b.add(path(sp([[196, 676], [228, 676], [232, 700], [214, 712], [196, 700]]), "#d2b8bc"));
    b.add(stroke(`M196 676L230 676`, "#6a8090", 3));
    // 견장
    b.part(sp([[222, 400], [262, 374], [276, 392], [236, 424]]), "#3a4c5c");
    b.add(stroke(`M226 404L266 380`, brass, 1.8, ` opacity=".8"`));
    // 가까운 팔 + 옆구리에 낀 투구
    b.part(sp([[418, 412], [440, 460], [446, 540], [440, 600], [420, 630], [400, 610], [412, 560], [410, 470]]), b.lg("na", 400, 420, 450, 640, [[0, "#3a4a58"], [1, "#141c26"]]));
    const hel = b.lg("he", 380, 560, 520, 700, [[0, "#a8b4c0"], [0.4, "#5e6a78"], [1, "#22283a"]]);
    b.part(sp([[392, 600], [404, 560], [440, 540], [486, 546], [516, 574], [524, 612, 1], [540, 620], [538, 640, 1], [382, 648, 1], [378, 630], [392, 624]]), hel);
    b.add(stroke(`M400 610Q456 590 520 612`, "#e0e8f0", 2, ` opacity=".6"`) + stroke(`M452 544Q456 580 454 626`, "#1a1e2c", 3, ` opacity=".6"`) + stroke(`M382 640L538 632`, "#c8d4e0", 1.4, ` opacity=".6"`));
    b.add(`<ellipse cx="450" cy="598" rx="10" ry="6" fill="#2a3040" opacity=".6"/>`);
    b.part(sp([[380, 610], [420, 606], [470, 616], [482, 632], [470, 650], [420, 648], [384, 640]]), uni);
    b.add(path(sp([[466, 614], [492, 612], [500, 630], [488, 648], [466, 648]]), "#d2b8bc"));
    b.add(stroke(`M470 618l0 28`, "#6a8090", 3));
    // 높은 깃
    b.part(sp([[294, 318], [322, 330], [352, 314], [360, 356], [322, 370], [290, 358]]), "#3a4c5c");
    b.add(stroke(`M294 320Q322 332 352 316`, brass, 1.6, ` opacity=".8"`));
    // 머리
    const fc = headGeo(b, HT, g, SKIN, false, true);
    bangShadow(b, HT, fc, [[-60, -44], [-40, -24], [-20, -32], [0, -20], [20, -30], [44, -24], [70, -30]]);
    const fs = spec(g, {
      iris: ["#2e2a1e", "#6a6038", "#c8c078"], lash: "#1c0e0a", lashW: 1, browC: "#3a2016", browW: 4.4, lip: "#7a4a50",
      eyes: [{ x: 8, y: 6, w: 42, h: 20, s: 1 }, { x: -12, y: 6, w: 28, h: 19, s: -1 }],
    });
    b.add(`<g transform="${HT}">`);
    drawFace(b, fs, ex);
    b.add(`</g>`);
    // 앞머리 (짧게 삐침)
    b.part(sp([[-56, -40], [-54, -84], [-20, -114], [24, -122], [66, -110], [92, -80], [94, -46], [60, -74], [20, -84], [-20, -76]]), hairG, HT);
    b.locks(HT, [
      [[[-20, -102], [-44, -84], [-60, -62], [-72, -50]], 26],
      [[[-4, -108], [-24, -80], [-36, -52], [-44, -30]], 26],
      [[[18, -110], [6, -80], [-6, -52], [-10, -28]], 24],
      [[[38, -110], [36, -80], [30, -54], [30, -30]], 22],
      [[[58, -104], [64, -78], [64, -52], [72, -32]], 22],
      [[[76, -92], [90, -60], [92, -30], [100, -10]], 20],
      [[[20, -118], [44, -134], [70, -136]], 20, 0.3],
      [[[50, -116], [78, -124], [100, -112]], 18, 0.3],
    ], hairG, hD, "1.6 1.4");
    strands(b, HT, [
      [[[-10, -104], [-30, -80], [-40, -60]], 3],
      [[[20, -106], [12, -84], [4, -64]], 2.6],
      [[[-30, -106], [0, -118], [36, -118]], 3],
      [[[62, -98], [68, -78], [68, -60]], 2.4],
    ], hL, 0.7);
    drawBrows(b, HT, fs, ex, 1);
  },
};

// ── 사공 ──
/** 가면의 기울기(도)와 그림자 세기로만 표정을 낸다 */
const FERRY: Record<string, [number, number, number]> = {
  normal: [0, 0.32, 0], smile: [-5, 0.22, 0], sad: [9, 0.55, 1], angry: [4, 0.72, 0], surprise: [-10, 0.2, 0],
  serious: [2, 0.5, 0], tender: [12, 0.3, 0], pain: [7, 0.62, 0], smirk: [-4, 0.3, 0], cry: [11, 0.55, 2],
};
const ferryman: Char = {
  rim: "#88c0c0",
  halo: 0.4,
  draw(b, _ex, e) {
    const [rot, shd, wet] = FERRY[e] ?? FERRY.normal;
    const HT = `translate(292 210) rotate(${rot} 20 60) scale(.95)`;
    const g = GEO.f;
    const hairG = b.lg("hg", 200, 60, 580, 700, [[0, "#f4f6f4"], [0.4, "#b8c4cc"], [1, "#5a6a80"]]);
    const hD = "#4a5a70";
    const rags = b.lg("rg2", 180, 380, 440, 900, [[0, "#8a96a4"], [0.4, "#4e5868"], [1, "#1e2432"]]);
    // 바람에 날리는 긴 흰 머리 (오른쪽으로)
    b.locks("", [
      [[[330, 110], [420, 130], [500, 180], [560, 250], [590, 330]], 70, 0.4],
      [[[340, 150], [430, 200], [500, 280], [540, 380], [570, 460]], 64, 0.4],
      [[[340, 200], [420, 270], [470, 360], [500, 470], [530, 560]], 56, 0.4],
      [[[340, 250], [400, 330], [430, 440], [450, 560], [476, 660]], 44, 0.4],
      [[[320, 110], [400, 100], [480, 120], [540, 150]], 40, 0.3],
    ], hairG, hD, "2 2");
    b.add(path(lock([[360, 140], [450, 180], [520, 250], [560, 330]], 5, 2), "#fff", ` opacity=".7"`) + path(lock([[360, 210], [440, 280], [480, 380], [510, 480]], 4, 2), "#fff", ` opacity=".5"`) + path(lock([[350, 120], [430, 116], [500, 136]], 3, 2), "#fff", ` opacity=".6"`));
    // 삿대 (몸 앞, 먼 쪽 손)
    const pole = b.lg("pl", 186, 0, 206, 0, [[0, "#9a8a70"], [1, "#3a3026"]]);
    // 해진 회색 옷
    const torso = b.part(sp([[300, 330], [252, 346], [222, 370], [206, 404, 1], [210, 500], [222, 620], [214, 760], [196, 900], [184, 1000, 1], [452, 1000, 1], [440, 900], [424, 760], [412, 620], [420, 500], [432, 410, 1], [416, 374], [380, 348], [346, 330]]), rags);
    const tc = b.clip("tc", `<use href="#${torso}"/>`);
    b.add(`<g clip-path="${tc}">` +
      path(sp([[250, 350], [330, 420], [410, 360], [430, 560], [380, 600], [330, 540], [270, 610], [214, 560]]), "#6a7686", ` opacity=".7"`) +
      stroke(sp([[270, 420], [290, 560], [280, 720], [268, 900]], false), "#1e2432", 2, ` opacity=".7"`) +
      stroke(sp([[360, 430], [372, 600], [380, 780], [392, 940]], false), "#1e2432", 2, ` opacity=".6"`) +
      stroke(sp([[240, 520], [246, 680]], false), "#c8d4dc", 1.4, ` opacity=".45"`) +
      path(`M214 600L412 590L414 616L216 628Z`, "#3a4252") +
      `</g>`);
    // 숄 (해진 끝)
    b.part(sp([[300, 326], [240, 344], [206, 380], [196, 430], [206, 470, 1], [222, 452], [236, 490, 1], [252, 460], [272, 500, 1], [290, 468], [316, 496, 1], [336, 462], [360, 490, 1], [380, 456], [404, 480, 1], [420, 448], [440, 470, 1], [446, 420], [430, 380], [390, 344], [346, 326]]), b.lg("sh", 200, 330, 450, 500, [[0, "#b4bec8"], [0.5, "#6e7888"], [1, "#2e3444"]]));
    b.add(stroke(`M250 360Q262 410 252 460M300 350Q300 410 290 468M372 356Q390 410 380 456`, "#2e3444", 1.6, ` opacity=".6"`));
    // 가까운 팔 (해진 소매)
    b.part(sp([[432, 408], [456, 460], [466, 560], [470, 660], [480, 740, 1], [464, 724], [456, 760, 1], [446, 730], [432, 756, 1], [424, 660], [420, 560], [418, 470]]), rags);
    // 먼 팔 — 삿대를 쥠
    b.part(sp([[208, 402], [192, 450], [186, 520], [196, 560], [226, 552], [228, 490], [232, 440]]), rags);
    b.part(`M188 30L204 30L210 1000L186 1000Z`, pole);
    b.add(stroke(`M190 40L189 1000`, "#e8e0cc", 1.2, ` opacity=".5"`));
    b.add(path(sp([[180, 520], [214, 512], [226, 536], [216, 566], [182, 568], [174, 544]]), "#c8c4cc"));
    b.add(stroke(`M184 530Q200 524 220 530M182 548Q200 542 222 548`, "#7a7888", 1.1, ` opacity=".7"`));
    // 머리: 매끈한 흰 천 가면
    drawNeck(b, HT, g.neck, g.neckSh, g.neckLine, { ...SKIN, mid: "#b8b4c4", sh: "#8a8698", deep: "#4a4a60" });
    b.part(sp([[-56, -20], [-62, -64], [-44, -106], [4, -124], [60, -116], [98, -88], [112, -48], [108, -6], [92, 28], [66, 40], [56, 10], [20, -10]]), hairG, HT);
    const maskG = b.lg("mk", -50, -80, 70, 80, [[0, "#fbfaf6"], [0.5, "#e4e2e0"], [1, "#b0aebe"]]);
    const mid = b.part(sp([[-46, -82], [-52, -44], [-52, -10], [-49, 10], [-48, 32], [-40, 52], [-28, 68], [-14, 78], [0, 82], [14, 79], [32, 66], [50, 44], [60, 22], [64, -10], [62, -60], [30, -92], [-16, -94]]), maskG, HT);
    const mc = b.clip("mc", `<use href="#${mid}"/>`);
    b.add(`<g clip-path="${mc}"><g transform="${HT}">` +
      path(sp([[40, -100], [46, -40], [38, 10], [30, 44], [16, 70], [0, 100], [100, 100], [100, -100]]), "#8a88a0", ` opacity="${shd}"`) +
      `<ellipse cx="30" cy="0" rx="18" ry="9" fill="#9a98b0" opacity="${f(shd * 0.3)}"/><ellipse cx="-26" cy="0" rx="11" ry="8" fill="#9a98b0" opacity="${f(shd * 0.25)}"/>` +
      path(sp([[-2, 2], [-6, 26], [-10, 36], [-2, 38]]), "#8a88a0", ` opacity="${f(0.2 + shd * 0.4)}"`) +
      stroke(sp([[-44, -30], [-10, -40], [30, -36], [62, -26]], false), "#a8a6bc", 1.2, ` opacity=".6"`) +
      stroke(sp([[-40, 40], [-10, 56], [20, 54], [50, 36]], false), "#a8a6bc", 1.2, ` opacity=".5"`) +
      (wet ? path(`M24 10C22 30 26 ${wet > 1 ? 60 : 36} 22 ${wet > 1 ? 80 : 44}L30 ${wet > 1 ? 80 : 44}C32 50 30 26 32 10Z`, "#7a88a8", ` opacity="${wet > 1 ? 0.45 : 0.3}"`) : "") +
      (wet > 1 ? path(`M-28 10C-30 26 -27 44 -30 60L-24 60C-22 40 -24 26 -22 10Z`, "#7a88a8", ` opacity=".35"`) : "") +
      `</g>` +
      // 가면 끈 (바람에 날림)
      stroke(`M62 -40Q100 -50 150 -30Q190 -14 230 -30M62 -30Q110 -20 150 0Q180 12 214 4`, "#e8e6e2", 3) +
      `</g>`);
    // 앞머리 몇 가닥 (가면 위로 흩날림)
    b.locks(HT, [
      [[[20, -118], [-20, -100], [-50, -72], [-66, -40]], 30, 0.4],
      [[[-44, -80], [-64, -40], [-70, 10], [-80, 60]], 16, 0.4],
    ], hairG, hD, "1.6 1.4");
  },
};

// ── 노엘 ──
const noel: Char = {
  rim: "#f0d080",
  fade: [600, 960],
  tweak: (ex, e) => ({ ...ex, arc: e === "smile", pu: ex.pu * 1.06, m: e === "smile" ? "grin" : ex.m }),
  draw(b, ex) {
    const HT = "translate(300 250) rotate(3) scale(1)";
    const g = GEO.c;
    const hD = "#3a2418", hL = "#f0d0a0";
    const hairG = b.lg("hg", -70, -110, 110, 90, [[0, "#c8a07a"], [0.45, "#8a6448"], [1, "#3e2a22"]]);
    const coat = b.lg("co", 200, 380, 440, 900, [[0, "#7a6a60"], [0.4, "#4a3e40"], [1, "#1e1a26"]]);
    // 헝클어진 뒷머리 (어깨까지)
    b.part(sp([[-58, 0], [-66, -50], [-52, -94], [-10, -116], [44, -114], [90, -90], [112, -50], [118, 0], [124, 50, 1], [106, 36], [110, 80, 1], [90, 60], [86, 100, 1], [70, 70], [60, 30], [20, 0]]), hairG, HT);
    drawNeck(b, HT, g.neck, g.neckSh, g.neckLine);
    // 너무 큰 낡은 외투 (어깨가 흘러내림)
    const torso = b.part(sp([[300, 350], [262, 362], [226, 388], [196, 440, 1], [188, 540], [196, 660], [186, 800], [176, 1000, 1], [440, 1000, 1], [432, 800], [424, 660], [428, 540], [428, 450, 1], [404, 392], [370, 364], [338, 350]]), coat);
    const tc = b.clip("tc", `<use href="#${torso}"/>`);
    b.add(`<g clip-path="${tc}">` +
      path(sp([[320, 372], [346, 480], [340, 640], [336, 1000, 1], [440, 1000, 1], [440, 372, 1]]), "#241e2a", ` opacity=".55"`) +
      stroke(sp([[320, 374], [346, 480], [340, 640], [336, 1000]], false), "#a89080", 1.4, ` opacity=".6"`) +
      [470, 560, 650].map((y) => `<circle cx="${f(338 + (y - 470) * -0.02)}" cy="${y}" r="5" fill="#2a2226" stroke="#a89080" stroke-width="1.2"/>`).join("") +
      // 기운 조각
      path(`M226 700L262 694L266 736L230 742Z`, "#5a4a3c") + stroke(`M226 700L262 694L266 736L230 742Z`, "#c8b090", 1, ` stroke-dasharray="3 3" opacity=".7"`) +
      stroke(sp([[240, 460], [250, 580], [244, 700]], false), "#1a1620", 2, ` opacity=".7"`) +
      stroke(sp([[400, 480], [394, 620], [404, 780]], false), "#1a1620", 2, ` opacity=".6"`) +
      `</g>`);
    // 긴 소매 (손을 덮음)
    b.part(sp([[200, 436], [182, 500], [174, 600], [176, 700], [184, 760], [232, 760], [230, 690], [228, 600], [226, 500]]), coat);
    b.add(stroke(`M186 752L230 752`, "#a89080", 2, ` opacity=".6"`) + stroke(sp([[200, 520], [196, 640], [204, 740]], false), "#1a1620", 1.6, ` opacity=".6"`));
    b.part(sp([[426, 444], [446, 510], [452, 620], [452, 720], [444, 770], [398, 766], [402, 680], [404, 580], [406, 500]]), b.lg("na", 400, 450, 450, 770, [[0, "#4a3e40"], [1, "#1a1620"]]));
    b.add(stroke(`M400 758L446 762`, "#a89080", 2, ` opacity=".5"`));
    // 세운 깃
    b.part(sp([[282, 330], [300, 356], [322, 372], [300, 390], [262, 380], [252, 356]]), "#6a5a52");
    b.part(sp([[360, 324], [372, 350], [390, 372], [362, 388], [336, 374], [346, 348]]), "#3a3034");
    // 머리
    const fc = headGeo(b, HT, g, SKIN, false, true);
    bangShadow(b, HT, fc, [[-60, -40], [-40, -20], [-18, -30], [4, -16], [26, -28], [50, -18], [80, -26]]);
    const fs = spec(g, {
      iris: ["#3a3020", "#8a7040", "#e8d090"], lash: "#2a1a14", lashW: 1.05, female: true, child: true, browC: "#6a4a34", browW: 3.2, lip: "#8a5a60",
      eyes: [{ x: 8, y: 8, w: 44, h: 23, s: 1 }, { x: -12, y: 8, w: 29, h: 22, s: -1 }],
      mouth: [-3, 52, 6, 8],
    });
    b.add(`<g transform="${HT}">`);
    drawFace(b, fs, ex);
    b.add(stroke(`M-40 34l-3 4M-34 36l-3 4M30 36l-3 4M38 34l-3 4`, "#d8a0a0", 1, ` opacity=".35"`));
    b.add(`</g>`);
    // 헝클어진 앞머리
    b.part(sp([[-56, -30], [-54, -80], [-20, -110], [24, -116], [66, -104], [92, -74], [94, -40], [60, -70], [20, -80], [-20, -72]]), hairG, HT);
    b.locks(HT, [
      [[[-24, -100], [-48, -76], [-62, -46], [-70, -20], [-78, -4]], 26],
      [[[-8, -106], [-26, -78], [-36, -48], [-38, -18]], 26],
      [[[12, -108], [4, -78], [-8, -50], [-12, -20]], 22],
      [[[30, -106], [30, -78], [24, -50], [28, -24]], 22],
      [[[50, -102], [58, -76], [56, -46], [66, -24]], 22],
      [[[72, -90], [88, -56], [88, -16], [80, 26], [88, 56]], 24],
      [[[-44, -76], [-62, -40], [-66, 4], [-58, 50], [-66, 80]], 18],
      [[[10, -114], [40, -128], [60, -140]], 12, 0.2],
      [[[40, -110], [66, -118], [80, -132]], 10, 0.2],
    ], hairG, hD, "1.6 1.4");
    strands(b, HT, [
      [[[-20, -98], [-40, -76], [-50, -54]], 3],
      [[[10, -104], [2, -80], [-6, -60]], 2.4],
      [[[-30, -104], [4, -114], [40, -110]], 3],
      [[[78, -70], [86, -40], [84, -6]], 2.4],
    ], hL, 0.7);
    drawBrows(b, HT, fs, ex, 0.9);
  },
};

// ── 황제 ──
const emperor: Char = {
  rim: "#eadcae",
  tweak: (ex) => ({ ...ex, o: ex.o * 0.72, lo: ex.lo + 0.12, t: ex.t - 0.2, pu: ex.pu * 0.9 }),
  draw(b, ex) {
    const HT = "translate(290 232) rotate(3) scale(.95)";
    const g = GEO.o;
    const gold = "#e2c47a", goldD = "#8a6a30";
    const whiteG = b.lg("wh", -60, -100, 120, 160, [[0, "#eeeae4"], [0.5, "#b4b0c4"], [1, "#6a6684"]]);
    const crimG = b.lg("cr", 150, 360, 470, 900, [[0, "#b8445a"], [0.4, "#7c1f33"], [1, "#2e0a16"]]);
    const skin = { lit: "#e2d2cc", mid: "#bca6b6", sh: "#8e7a9c", deep: "#56466e", line: "#7a6282" };
    // 진홍 망토 (뒤판)
    b.part(sp([[300, 340], [220, 364], [172, 420], [150, 560], [140, 760], [132, 1000, 1], [480, 1000, 1], [470, 760], [458, 560], [440, 420], [396, 364]]), crimG);
    // 가늘고 긴 흰 머리
    b.part(sp([[-56, -30], [-62, -70], [-40, -104], [10, -114], [70, -104], [104, -70], [114, -20], [112, 40], [106, 110], [96, 150, 1], [80, 100], [66, 50], [56, 10], [0, -10]]), whiteG, HT);
    drawNeck(b, HT, g.neck, g.neckSh, undefined, skin);
    // 속옷 (짙은 예복 + 금 띠)
    const torso = b.part(sp([[300, 346], [262, 360], [240, 400], [236, 520], [240, 700], [236, 1000, 1], [390, 1000, 1], [388, 700], [392, 520], [388, 400], [370, 360], [340, 346]]), b.lg("in", 240, 360, 390, 800, [[0, "#3e3050"], [1, "#120c1a"]]));
    const tc = b.clip("tc", `<use href="#${torso}"/>`);
    b.add(`<g clip-path="${tc}">` + path(`M296 360L330 360L336 1000L300 1000Z`, gold, ` opacity=".85"`) +
      [430, 520, 610, 700].map((y) => `<circle cx="316" cy="${y}" r="6" fill="#7c1f33" stroke="${goldD}" stroke-width="1.5"/>`).join("") + `</g>`);
    // 망토 앞자락 (양옆으로 늘어짐)
    b.part(sp([[250, 380], [200, 430], [186, 560], [190, 760], [196, 1000, 1], [262, 1000, 1], [262, 760], [260, 560], [270, 440]]), crimG);
    b.part(sp([[376, 380], [430, 430], [444, 560], [446, 760], [450, 1000, 1], [380, 1000, 1], [372, 760], [370, 560], [360, 440]]), crimG);
    b.add(stroke(sp([[262, 450], [260, 560], [262, 760], [262, 1000]], false), gold, 3) + stroke(sp([[362, 450], [370, 560], [372, 760], [380, 1000]], false), gold, 3));
    b.add(stroke(sp([[216, 500], [212, 640], [220, 820]], false), "#2e0a16", 2, ` opacity=".7"`) + stroke(sp([[420, 500], [424, 660], [428, 820]], false), "#2e0a16", 2, ` opacity=".7"`));
    // 흰 털 깃 (담비 무늬)
    const fur = b.part(sp([[300, 330], [240, 342], [196, 370], [176, 410], [194, 450], [240, 460], [280, 440], [320, 452], [360, 440], [400, 460], [446, 450], [462, 410], [440, 370], [396, 342], [346, 330]]), b.lg("fr", 180, 330, 460, 470, [[0, "#f4f0ea"], [0.5, "#c4c0d0"], [1, "#6e6a86"]]));
    void fur;
    let spots = "";
    for (const [x, y] of [[214, 408], [252, 430], [290, 420], [350, 424], [392, 436], [430, 414], [236, 384], [410, 384]] as [number, number][]) spots += `<path d="M${x} ${y}l2.5 7l-2.5 3l-2.5-3Z"/>`;
    b.add(`<g fill="#1a1420" opacity=".8">${spots}</g>`);
    b.add(stroke(`M186 420Q200 446 240 452M398 452Q440 448 456 418`, "#8a86a0", 1.4, ` opacity=".6"`));
    // 여윈 손 (지팡이 대신 가슴께의 홀)
    b.add(stroke(`M300 470L286 700`, gold, 5) + `<circle cx="302" cy="462" r="11" fill="#c63a52" stroke="${gold}" stroke-width="3"/>`);
    b.add(path(sp([[274, 540], [300, 530], [312, 548], [304, 572], [278, 574]]), "#c8b4bc") + stroke(`M280 548Q294 542 308 548M278 560Q294 554 308 562`, "#7a6282", 1, ` opacity=".7"`));
    b.part(sp([[250, 520], [274, 540], [278, 574], [248, 590], [236, 560]]), crimG);
    // 머리
    const fc = headGeo(b, HT, g, skin, true, true);
    // 여윈 볼과 깊은 눈두덩
    b.add(`<g clip-path="${fc}"><g transform="${HT}">` +
      path(sp([[20, 30], [40, 20], [50, 50], [36, 70], [24, 56]]), skin.sh, ` opacity=".6"`) +
      path(sp([[-44, 30], [-36, 24], [-34, 50], [-40, 62]]), skin.sh, ` opacity=".4"`) +
      `<ellipse cx="32" cy="2" rx="28" ry="14" fill="${skin.sh}" opacity=".45"/><ellipse cx="-26" cy="2" rx="18" ry="12" fill="${skin.sh}" opacity=".35"/>` +
      `</g>` +
      stroke(`M16 22Q30 30 48 22M-16 22Q-28 26 -38 20M8 44Q14 58 10 74M-22 44Q-28 58 -26 72`, skin.line, 1.1, ` opacity=".6"`) +
      stroke(`M-36 -44Q-6 -52 28 -46M-30 -32Q-4 -38 24 -34`, skin.line, 1, ` opacity=".45"`) +
      `</g>`);
    const fs = spec(g, {
      iris: ["#3a2e2a", "#6e5a4e", "#b8a488"], lash: "#2e2430", lashW: 0.9, browC: "#e8e4dc", browW: 4.5, lip: "#5e3a48", skinSh: skin.line, mouthLater: true,
    });
    b.add(`<g transform="${HT}">`);
    drawFace(b, fs, ex);
    // 가는 콧수염과 턱수염
    b.add(path(sp([[-2, 56], [-16, 60], [-28, 72, 1], [-12, 64], [-2, 62], [12, 64], [30, 74, 1], [16, 60]]), "#dcd8d0"));
    drawMouth(b, { ...fs, mouth: [-3, 69, 8, 11] }, ex);
    b.add(path(sp([[-12, 80], [4, 82], [16, 80], [8, 110], [2, 124, 1], [-6, 108]]), "#d8d4cc", ` opacity=".9"`));
    b.add(`</g>`);
    // 이마를 덮는 흰 머리 몇 가닥
    b.locks(HT, [
      [[[10, -106], [-20, -90], [-42, -64], [-56, -30], [-60, 10]], 22, 0.3],
      [[[70, -96], [84, -60], [88, -10], [84, 40], [80, 90]], 22, 0.3],
    ], whiteG, "#5a5674", "1.4 1.2");
    b.add(`<g transform="${HT} translate(1.2 1.6)" opacity=".7">`);
    fs.brows.forEach((br, i) => drawBrow(b, br, ex, { ...fs, browC: "#6e6888" }, i === 1));
    b.add(`</g>`);
    drawBrows(b, HT, fs, ex, 1);
    // 무거운 제관
    const crG = b.lg("cw", -60, -170, 110, -90, [[0, "#f6e2a6"], [0.5, gold], [1, goldD]]);
    b.part(`M-52 -86L-58 -140L-34 -120L-20 -168L0 -124L22 -176L42 -126L66 -164L76 -118L100 -134L96 -80Q24 -104 -52 -86Z`, crG, HT);
    b.add(`<g transform="${HT}">` + path(`M-54 -90Q24 -110 98 -86L96 -74Q24 -96 -52 -78Z`, goldD) +
      `<circle cx="22" cy="-100" r="7" fill="#c63a52" stroke="#fff2c8" stroke-width="1.4"/><circle cx="-18" cy="-94" r="5" fill="#4a6ab8"/><circle cx="62" cy="-94" r="5" fill="#4a6ab8"/>` +
      `<circle cx="-20" cy="-168" r="4" fill="#fff2c8"/><circle cx="22" cy="-176" r="4.5" fill="#fff2c8"/><circle cx="66" cy="-164" r="4" fill="#fff2c8"/>` +
      stroke(`M-40 -100L-44 -130M8 -110L14 -150M50 -110L58 -140`, "#fff2c8", 1.4, ` opacity=".6"`) + `</g>`);
  },
};

// ── 소년 기사 ──
const young: Char = {
  rim: "#dfe6ff",
  halo: 0.5,
  draw(b, ex) {
    const HT = "translate(290 226) rotate(-2) scale(.96)";
    const g = GEO.c;
    const hD = "#05060e";
    const hairG = b.lg("hg", -50, -120, 90, 60, [[0, "#262a48"], [0.5, "#141630"], [1, "#07080f"]]);
    const dark = { lit: "#6a6488", mid: "#4a4668", sh: "#34304e", deep: "#1e1c34", line: "#2a2640" };
    const tun = b.lg("tu", 210, 380, 430, 800, [[0, "#2c3050"], [0.5, "#181a30"], [1, "#0a0b16"]]);
    const steel = b.lg("stl", 230, 380, 420, 620, [[0, "#8a94b8"], [0.35, "#454e74"], [1, "#161a2e"]]);
    // 뒷머리 (짧음)
    b.part(sp([[-56, -14], [-64, -56], [-48, -98], [0, -120], [52, -114], [92, -88], [110, -50], [112, -10], [102, 18], [106, 40, 1], [88, 30], [80, 50, 1], [64, 24], [20, -6]]), hairG, HT);
    drawNeck(b, HT, g.neck, g.neckSh, undefined, dark);
    // 몸통 (튜닉)
    b.part(sp([[302, 340], [258, 354], [228, 376], [214, 408, 1], [218, 500], [230, 600], [232, 660], [222, 780], [218, 1000, 1], [418, 1000, 1], [414, 780], [402, 660], [402, 600], [410, 500], [424, 412, 1], [406, 378], [372, 354], [340, 340]]), tun);
    // 팔
    b.part(sp([[218, 404], [200, 460], [192, 540], [196, 630], [202, 700], [230, 700], [232, 630], [236, 540], [240, 470]]), tun);
    b.add(path(sp([[198, 694], [230, 694], [232, 720], [214, 732], [198, 718]]), "#3a3654"));
    b.part(sp([[422, 408], [444, 460], [452, 540], [450, 630], [446, 700], [418, 702], [414, 630], [412, 540], [408, 470]]), b.lg("na", 410, 410, 450, 700, [[0, "#1c1e36"], [1, "#07080f"]]));
    b.add(path(sp([[418, 696], [446, 696], [448, 722], [430, 732], [416, 718]]), "#2a2640"));
    // 가벼운 흉갑 + 견갑
    const cu = b.part(sp([[262, 380], [322, 392], [384, 378], [404, 430], [398, 520], [376, 580], [322, 598], [270, 582], [246, 520], [240, 430]]), steel);
    void cu;
    b.add(stroke(sp([[322, 396], [322, 596]], false), "#c8d0ec", 1.4, ` opacity=".5"`) + stroke(sp([[250, 440], [262, 520], [286, 576]], false), "#dfe6ff", 1.6, ` opacity=".7"`) + stroke(`M262 380Q322 400 384 378`, "#dfe6ff", 2, ` opacity=".6"`));
    b.part(sp([[214, 404], [224, 376], [262, 366], [274, 392], [250, 430], [218, 440]]), steel);
    b.part(sp([[424, 408], [414, 378], [380, 368], [372, 394], [398, 430], [428, 440]]), b.lg("pa", 370, 370, 430, 440, [[0, "#3a4264"], [1, "#101224"]]));
    b.add(path(`M232 600L408 592L410 626L234 636Z`, "#0e0f1c") + stroke(`M234 604L408 596`, "#8a94b8", 1.2, ` opacity=".6"`));
    // 깃
    b.part(sp([[294, 316], [322, 330], [352, 312], [360, 352], [322, 366], [290, 354]]), "#1c1e36");
    // 머리 — 달빛 역광으로 얼굴은 거의 그림자
    const fc = headGeo(b, HT, g, dark, false, true);
    const fs = spec(g, { iris: ["#1a1e30", "#3a4460", "#6a7894"], lash: "#05060e", lashW: 1, browC: "#0a0b16", browW: 4.4, lip: "#2a2238", sclera: "#5a5878", skinSh: dark.line });
    b.add(`<g transform="${HT}">`);
    drawFace(b, fs, ex);
    // 얼굴을 덮는 그림자, 옆얼굴 가장자리만 은빛
    b.add(`</g>`);
    b.add(`<g clip-path="${fc}"><g transform="${HT}">${path(sp([[-40, -100], [-44, -20], [-40, 40], [-24, 70], [0, 90], [100, 100], [100, -100]]), "#0e0f22", ` opacity=".72"`)}</g></g>`);
    // 앞머리
    b.part(sp([[-56, -40], [-54, -84], [-20, -112], [24, -120], [66, -110], [92, -80], [94, -46], [60, -74], [20, -84], [-20, -76]]), hairG, HT);
    b.locks(HT, [
      [[[-20, -100], [-44, -80], [-58, -54], [-64, -34]], 26],
      [[[-2, -106], [-22, -80], [-34, -52], [-40, -30]], 26],
      [[[18, -108], [6, -80], [-6, -52], [-10, -26]], 22],
      [[[38, -108], [34, -80], [28, -52], [26, -30]], 22],
      [[[58, -104], [62, -78], [60, -50], [66, -30]], 22],
      [[[76, -90], [90, -56], [90, -20], [84, 14]], 20],
    ], hairG, hD, "1.6 1.4");
    b.add(`<g transform="${HT}">` + path(lock([[-24, -104], [-46, -84], [-58, -60]], 3.4, 2), "#dfe6ff", ` opacity=".55"`) + path(lock([[-30, -108], [0, -118], [34, -116]], 3, 2), "#dfe6ff", ` opacity=".45"`) + `</g>`);
    drawBrows(b, HT, fs, ex, 0.7);
  },
};

const CHARS: Record<string, Char> = { cassian, lucien, isolde, gregor, mirelle, theo, ferryman, noel, emperor, young };

export function characterSvg(id: string, expr: string): string {
  const c = CHARS[id];
  if (!c) return "";
  const e = EXPR[expr] ? expr : "normal";
  const ex0 = EXPR[e];
  const ex = c.tweak ? c.tweak({ ...ex0 }, e) : { ...ex0 };
  const b = new B(`ch-${id}-${Object.keys(EXPR).indexOf(e)}`);
  c.draw(b, ex, e);
  return finish(b, c);
}
