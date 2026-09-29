// 스탠딩(立ち絵) — 역광의 명암 초상. viewBox 0 0 600 1000, 몸은 관객 기준 왼쪽을 향한 3/4 자세.
// 몸은 표정과 무관하게 같고, 얼굴(눈·눈썹·입·홍조·눈물)만 바뀝니다.
// 모든 id/클래스는 `ch-<id>-<expr>-` 접두어를 씁니다(같은 인물 두 표정이 교차 페이드해도 충돌하지 않음).

type Pt = [number, number] | [number, number, number]; // 세 번째 값 1 = 모서리(날카로운 점)

const f = (n: number): string => {
  const v = Math.round(n * 10) / 10;
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
    this.defs.push(`<path id="${id}" d="${d}"/>`);
    if (sil) this.sil.push(`<use href="#${id}"${tf ? ` transform="${tf}"` : ""}/>`);
    return id;
  }
  use(id: string, fill: string, tf = "", extra = ""): void {
    this.out.push(`<use href="#${id}" fill="${fill}"${tf ? ` transform="${tf}"` : ""}${extra}/>`);
  }
  /** 실루엣에 포함되는 부위(정의 1회 + 사용). tf = 머리 좌표계 변환 등 */
  part(d: string, fill: string, tf = "", sil = true, extra = ""): string {
    const id = this.def(d, tf, sil);
    this.use(id, fill, tf, extra);
    return id;
  }
  /** 머리 가닥 묶음: 가닥마다 어두운 그림자 사본을 살짝 비껴 깔아 층을 만든다 */
  locks(tf: string, list: [Pt[], number, number?][], fill: string, sh: string, off = "2 1.6"): void {
    for (const [c, w, bu] of list) {
      const id = this.def(lock(c, w, 1, bu ?? 0.5), tf);
      this.use(id, sh, `${tf} translate(${off})`);
      this.use(id, fill, tf);
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
  drawMouth(b, fs, ex);
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
  draw: (b: B, ex: Ex) => void;
  tweak?: (ex: Ex, expr: string) => Ex;
  halo?: number;
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
  const fade = b.lg("fd", 0, 780, 0, 990, [[0, "#fff"], [1, "#000"]]);
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

/** 머리(목·얼굴 피부·귀·명암)를 머리 좌표계로 그림 */
function head(b: B, tf: string, o: {
  face: Pt[]; neck: Pt[]; ear?: Pt[]; shade: Pt[]; neckSh: Pt[]; skin?: Skin; nose: Pt[]; noseSh: Pt[]; neckLine?: Pt[];
}): string {
  const s = o.skin ?? SKIN;
  const skinG = b.lg("sk", -60, -40, 90, 60, [[0, s.lit], [0.5, s.lit], [1, s.mid]]);
  const neckG = b.lg("nk", -10, 0, 80, 0, [[0, s.mid], [0.3, s.sh], [1, s.deep]]);
  b.part(sp(o.neck), neckG, tf);
  b.add(`<g transform="${tf}">${path(sp(o.neckSh), s.deep, ` opacity=".9"`)}${o.neckLine ? stroke(sp(o.neckLine, false), s.deep, 1.5, ` opacity=".8"`) : ""}</g>`);
  if (o.ear) b.part(sp(o.ear), s.sh, tf);
  const fid = b.part(sp(o.face), skinG, tf);
  const fc = b.clip("fc", `<use href="#${fid}"/>`);
  b.add(
    `<g transform="${tf}"><g clip-path="${fc}">${path(sp(o.shade), s.sh, ` opacity=".75"`)}</g>` +
      path(sp(o.noseSh), s.sh, ` opacity=".8"`) +
      stroke(sp(o.nose, false), "#fffaf6", 1.1, ` opacity=".55"`) +
      `</g>`,
  );
  return fc;
}

// ── 카시안 ──
const cassian: Char = {
  rim: "#9fb4d8",
  tweak: (ex) => ({ ...ex, o: ex.o * 0.86 }),
  draw(b, ex) {
    const HT = "translate(285 192) rotate(-3)";
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
    b.add(`<g transform="${HT}"><g clip-path="${fc}">${path(sp([[-60, -40], [-40, -18], [-20, -24], [0, -8], [20, -18], [40, -14], [60, -10], [80, -20], [80, -90], [-60, -90]]), SKIN.sh, ` opacity=".6"`)}</g></g>`);
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
    const HT = "translate(292 198) rotate(2) scale(.97)";
    const hD = "#4c4f7a", hL = "#f1f2ff";
    const hairG = b.lg("hg", -60, -120, 100, 80, [[0, "#eceefc"], [0.35, "#b4b8da"], [0.75, "#7a7eab"], [1, "#4e5182"]]);
    const robeG = b.lg("rb", 200, 380, 430, 800, [[0, "#bdbbdb"], [0.3, "#7e7cad"], [0.75, "#4a4878"], [1, "#2e2c55"]]);
    const robeD = "#3c3a68";
    const silver = "#eef0ff";
    // 뒷머리
    b.part(sp([[-58, -20], [-66, -60], [-50, -102], [0, -126], [56, -118], [98, -90], [118, -52], [122, -12], [112, 26], [96, 56], [70, 62], [60, 30], [20, 0]]), hairG, HT);
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
    // 먼 팔 + 책
    const faG = b.lg("fa", 180, 400, 280, 720, [[0, "#aeacd2"], [0.5, "#6c6a9c"], [1, "#34325e"]]);
    b.part(sp([[208, 396], [194, 440], [186, 510], [190, 570], [200, 620], [214, 668], [240, 684, 1], [256, 640], [300, 590], [304, 560], [246, 566], [222, 520], [222, 440]]), faG);
    b.add(stroke(sp([[198, 590], [214, 646], [236, 676]], false), "#3a3862", 1.5, ` opacity=".6"`));
    // 책 (흰 가죽, 은 모서리)
    b.part(sp([[226, 452, 1], [236, 444, 1], [248, 578, 1], [238, 584, 1]]), "#d9d8ee");
    const bk = b.part(sp([[236, 444, 1], [318, 432, 1], [328, 566, 1], [248, 578, 1]]), b.lg("bk", 236, 440, 330, 580, [[0, "#c6c4e2"], [1, "#6e6c9c"]]));
    void bk;
    b.add(stroke(`M244 452L312 442L320 558L254 568Z`, silver, 1.1, ` opacity=".7"`));
    b.add(`<path class="${b.p}-pl" d="M282 488l3 11l11 3l-11 3l-3 11l-3-11l-11-3l11-3Z" fill="#dfe8ff"/>`);
    b.add(path(`M236 444l10-1.5l1 9l-9.5 1.4Z M318 432l-10 1.5l1 9l9.5-1.4Z`, silver, ` opacity=".85"`));
    // 책을 쥔 손가락(은빛 끝)
    for (const y of [470, 487, 504, 520]) {
      const d = lock([[336, y + 2], [330, y - 4], [318, y - 4], [308, y]], 10, 1, 0.6);
      b.add(path(d, "#d9c6d2") + path(lock([[318, y - 4], [308, y]], 6, 1, 0.3), "#e4e8ff"));
    }
    b.add(path(sp([[322, 462], [340, 470], [342, 520], [330, 534], [322, 520]]), "#a48eae"));
    // 머리
    const fc = head(b, HT, {
      neck: [[10, 70], [48, 44], [50, 100], [54, 150], [30, 160], [14, 150], [14, 110]],
      neckSh: [[10, 74], [44, 52], [52, 70], [54, 120], [34, 118], [16, 100]],
      neckLine: [[44, 44], [36, 80]],
      ear: [[58, -6], [70, -14], [78, -4], [76, 14], [68, 28], [58, 26]],
      face: [[-44, -72], [-50, -42], [-51, -14], [-48, 3], [-50, 16], [-45, 40], [-34, 60], [-18, 76], [-5, 85], [4, 87], [16, 83], [36, 68], [54, 44], [64, 24], [70, -10], [66, -60], [28, -90], [-20, -88]],
      shade: [[48, -80], [54, -30], [46, 12], [40, 42], [28, 64], [10, 92], [100, 90], [100, -80]],
      nose: [[-4, 10], [-6, 22]],
      noseSh: [[2, 8], [-1, 24], [-3, 36], [2, 40, 1], [-6, 40], [-10, 37, 1], [-5, 37], [-2, 26]],
    });
    b.add(`<g transform="${HT}"><g clip-path="${fc}">${path(sp([[-60, -30], [-44, -12], [-20, -20], [0, -6], [24, -14], [50, -10], [80, -18], [80, -90], [-60, -90]]), SKIN.sh, ` opacity=".5"`)}</g></g>`);
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
    b.locks("", [
      [[[372, 282], [396, 316], [412, 380], [414, 460], [404, 540], [390, 610], [372, 668]], 50, 0.3],
      [[[366, 292], [386, 340], [396, 420], [392, 510], [376, 590], [356, 640]], 30],
      [[[384, 300], [414, 350], [428, 430], [424, 520], [418, 580]], 26],
      [[[392, 440], [404, 520], [396, 600], [398, 680]], 18],
    ], hairG, hD, "1.6 1.4");
    b.add(path(lock([[384, 320], [400, 390], [402, 470], [394, 560]], 6, 2), hL, ` opacity=".85"`));
    b.add(path(lock([[410, 360], [418, 440], [412, 520]], 3.5, 2), hL, ` opacity=".6"`));
    b.add(path(lock([[374, 350], [384, 430], [378, 520], [364, 600]], 3, 2), "#2e3060", ` opacity=".5"`));
    // 머리끈
    b.add(`<g transform="rotate(-30 386 312)"><rect x="362" y="304" width="46" height="13" rx="4" fill="#2c2a55"/><rect x="362" y="304" width="46" height="3" rx="1.5" fill="${silver}" opacity=".8"/></g>`);
  },
};

const CHARS: Record<string, Char> = { cassian, lucien };

export function characterSvg(id: string, expr: string): string {
  const c = CHARS[id];
  if (!c) return "";
  const e = EXPR[expr] ? expr : "normal";
  const ex0 = EXPR[e];
  const ex = c.tweak ? c.tweak({ ...ex0 }, e) : { ...ex0 };
  const b = new B(`ch-${id}-${e}`);
  c.draw(b, ex);
  return finish(b, c);
}
