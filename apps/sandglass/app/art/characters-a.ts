// 스탠딩 A — 엘리오스·라젤·시안·재의 왕(가면/맨얼굴). TV 애니메이션 설정화풍 셀 셰이딩.
// viewBox 0 0 600 1000, 몸은 관객 기준 왼쪽을 향한 3/4 자세. 표정마다 얼굴만 바뀝니다.
// 모든 id/클래스는 `ch-<id>-<expr>-` 접두어(같은 인물의 두 표정이 교차 페이드해도 충돌 없음).

type Pt = [number, number] | [number, number, number]; // 세 번째 값 1 = 모서리

let coarse = false; // 머리카락 등 큰 모양은 정수 좌표로(문자열 절약)
const f = (n: number): string => {
  const v = coarse || Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
  return Object.is(v, -0) ? "0" : String(v);
};

/** Catmull-Rom → 베지어. 모서리 점은 접선 0 */
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

/** 가닥: 중심선을 따라 가늘어지는 닫힌 모양. mode 1 = 뿌리→끝 뾰족, 2 = 양끝 뾰족 */
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
    return sp([[L[0][0], L[0][1], 1], ...L.slice(1, n - 1), tip, ...R.slice(1, n - 1).reverse(), [R[0][0], R[0][1], 1]]);
  }
  return sp([[c[0][0], c[0][1], 1], ...L.slice(1, n - 1), tip, ...R.slice(1, n - 1).reverse()]);
}

const P = (d: string, fill: string, line?: string, w = 2.2, extra = ""): string =>
  `<path d="${d}" fill="${fill}"${line ? ` stroke="${line}" stroke-width="${f(w)}"` : ""}${extra}/>`;
const S = (d: string, col: string, w: number, extra = ""): string =>
  `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(w)}"${extra}/>`;
const op = (o: number): string => ` opacity="${f(o)}"`;

// ───────────────────────── 빌더 ─────────────────────────
class B {
  defs: string[] = [];
  out: string[] = [];
  n = 0;
  p: string;
  constructor(p: string) {
    this.p = p;
  }
  id(s: string): string {
    return `${this.p}${s}`;
  }
  add(...s: string[]): void {
    this.out.push(...s);
  }
  /** 정의만(재사용용) → id */
  def(d: string): string {
    const id = this.id("d" + this.n++);
    this.defs.push(`<path id="${id}" d="${d}"/>`);
    return id;
  }
  grad(kind: "l" | "r", name: string, geo: string, stops: [number, string, number?][]): string {
    const id = this.id(name);
    const tag = kind === "l" ? "linearGradient" : "radialGradient";
    this.defs.push(
      `<${tag} id="${id}" gradientUnits="userSpaceOnUse" ${geo}>${stops
        .map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ""}/>`)
        .join("")}</${tag}>`,
    );
    return `url(#${id})`;
  }
  lg(name: string, x1: number, y1: number, x2: number, y2: number, stops: [number, string, number?][]): string {
    return this.grad("l", name, `x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"`, stops);
  }
  rg(name: string, cx: number, cy: number, r: number, stops: [number, string, number?][]): string {
    return this.grad("r", name, `cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"`, stops);
  }
  /** 도형 크기 기준(objectBoundingBox) 방사 그라데이션 */
  rgb(name: string, stops: [number, string, number?][]): string {
    const id = this.id(name);
    this.defs.push(`<radialGradient id="${id}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${f(a)}"` : ""}/>`).join("")}</radialGradient>`);
    return `url(#${id})`;
  }
  clip(name: string, inner: string): string {
    const id = this.id(name);
    this.defs.push(`<clipPath id="${id}">${inner}</clipPath>`);
    return `url(#${id})`;
  }
  mask(name: string, inner: string): string {
    const id = this.id(name);
    this.defs.push(`<mask id="${id}">${inner}</mask>`);
    return `url(#${id})`;
  }
}

// ───────────────────────── 표정 ─────────────────────────
interface Ex {
  o: number; // 윗눈꺼풀 열림
  t: number; // + 화남(안쪽 내려감) / - 슬픔
  lo: number; // 아랫눈꺼풀 올라감
  pu: number; // 홍채 크기
  bi: number; // 눈썹 안쪽 dy
  bo: number; // 눈썹 바깥 dy
  bf: number; // 먼 쪽 눈썹 추가 dy
  m: string; // 입
  bl: number; // 홍조
  tr: number; // 0 / 1 글썽 / 2 흐름
  sw?: number; // 땀
  lk?: number; // 시선 가로 이동
}

const EXPR: Record<string, Ex> = {
  normal: { o: 1, t: 0, lo: 0.05, pu: 1, bi: 0, bo: 0, bf: 0, m: "n", bl: 0, tr: 0 },
  smile: { o: 0.84, t: -0.1, lo: 0.42, pu: 1, bi: -2, bo: -1, bf: 0, m: "smile", bl: 0.35, tr: 0 },
  sad: { o: 0.8, t: -0.75, lo: 0.12, pu: 0.97, bi: -6, bo: 3, bf: 0, m: "sad", bl: 0, tr: 1, lk: 1.5 },
  angry: { o: 0.9, t: 0.95, lo: 0.16, pu: 0.84, bi: 7, bo: -4, bf: 0, m: "angry", bl: 0, tr: 0 },
  surprise: { o: 1.2, t: -0.15, lo: 0, pu: 0.8, bi: -8, bo: -7, bf: 0, m: "o", bl: 0.15, tr: 0, sw: 1 },
  serious: { o: 0.82, t: 0.4, lo: 0.16, pu: 0.96, bi: 3.5, bo: 0, bf: 0, m: "flat", bl: 0, tr: 0 },
  tender: { o: 0.78, t: -0.35, lo: 0.34, pu: 1.05, bi: -3, bo: 1, bf: 0, m: "soft", bl: 0.55, tr: 0 },
  pain: { o: 0.52, t: -0.6, lo: 0.3, pu: 0.92, bi: -5, bo: 3, bf: 0, m: "grit", bl: 0.1, tr: 1, sw: 1 },
  smirk: { o: 0.74, t: 0.25, lo: 0.3, pu: 1, bi: 2, bo: 0, bf: -5, m: "smirk", bl: 0, tr: 0 },
  cry: { o: 0.78, t: -0.8, lo: 0.22, pu: 1, bi: -7, bo: 3, bf: 0, m: "cry", bl: 0.6, tr: 2 },
};

// ───────────────────────── 얼굴 ─────────────────────────
interface EyeG {
  ix: number; iy: number; // 안쪽 눈꼬리
  ox: number; oy: number; // 바깥 눈꼬리
  h: number;
  rx: number; ry: number; // 홍채
  u: number; // 홍채 중심 위치(0 안쪽 → 1 바깥)
}
type Iris = [string, string, string, string]; // 어두운, 중간, 밝은, 동공

interface Face {
  skin: string; skinSh: string; skinLine: string; blush: string;
  lash: string; brow: string; browW: number;
  eyes: [EyeG, EyeG]; // [가까운(관객 오른쪽 = 인물의 왼쪽), 먼]
  iris: [Iris, Iris];
  brows: [Pt, Pt, Pt][]; // 안쪽, 가운데, 바깥
  mouth: [number, number, number, number]; // x y 왼 반폭 오른 반폭
  lip: string;
  sclera?: string;
  hideNear?: boolean; // 가까운 눈 가림(안대)
  dull?: boolean; // 바랜 눈(하이라이트 약하게)
}

function eyeGeom(e: EyeG, ex: Ex) {
  const X = (u: number) => e.ix + (e.ox - e.ix) * u;
  const Y = (u: number, v: number) => e.iy + (e.oy - e.iy) * u + v * e.h;
  const tl = (u: number) => ex.t * 0.55 * (1 - u) * Math.min(1, u * 4) - (ex.t < 0 ? ex.t * 0.12 * u * u : 0);
  const upV: [number, number][] = [[0, 0], [0.14, -0.62], [0.45, -1], [0.78, -0.96], [1, -0.26]];
  const up: Pt[] = upV.map(([u, v], i) => [X(u), Y(u, i === 0 || i === 4 ? v : v * ex.o + tl(u)), i === 0 || i === 4 ? 1 : 0]);
  const low: Pt[] = [
    [X(0.72), Y(0.72, 0.42 - ex.lo * 0.6)],
    [X(0.34), Y(0.34, 0.44 - ex.lo * 0.42)],
  ];
  return { X, Y, up, low, tl };
}

function drawEye(b: B, e: EyeG, ex: Ex, fc: Face, ir: Iris, k: string): void {
  const { X, Y, up, low } = eyeGeom(e, ex);
  const open = sp([...up, ...low]);
  const cid = b.clip("ec" + k, `<path d="${open}"/>`);
  const ig = b.lg("ig" + k, 0, Y(e.u, -1.1), 0, Y(e.u, 0.7), [[0, ir[0]], [0.45, ir[1]], [1, ir[2]]]);
  const cx = X(e.u) - (ex.lk ?? 0), cy = Y(e.u, -0.1) + (ex.lk ? 1 : 0);
  const rx = e.rx * ex.pu, ry = e.ry * ex.pu;
  let g = P(open, fc.sclera ?? "#fdfcff");
  g += `<g clip-path="${cid}">`;
  // 흰자 윗 그림자
  g += P(sp([...up, ...up.slice(1, 4).reverse().map((p) => [p[0], p[1] + e.h * 0.5] as Pt)]), "#c9c6dc");
  g += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${ig}" stroke="${ir[3]}" stroke-width="1.3"/>`;
  // 아래쪽 밝은 반달
  g += `<ellipse cx="${f(cx + 0.05 * rx)}" cy="${f(cy + 0.5 * ry)}" rx="${f(rx * 0.62)}" ry="${f(ry * 0.3)}" fill="${ir[2]}"${op(0.75)}/>`;
  // 동공
  g += `<ellipse cx="${f(cx)}" cy="${f(cy - 0.05 * ry)}" rx="${f(rx * 0.4)}" ry="${f(ry * 0.5)}" fill="${ir[3]}"/>`;
  // 윗꺼풀 그림자(홍채 위)
  g += P(sp([...up, ...up.slice(1, 4).reverse().map((p) => [p[0], p[1] + e.h * 0.62] as Pt)]), ir[3], undefined, 0, op(0.42));
  // 하이라이트 2개
  const hi = fc.dull ? 0.55 : 1;
  g += `<ellipse cx="${f(cx - 0.34 * rx)}" cy="${f(cy - 0.36 * ry)}" rx="${f(rx * 0.36)}" ry="${f(ry * 0.3)}" fill="#fff"${op(hi)}/>`;
  g += `<circle cx="${f(cx + 0.4 * rx)}" cy="${f(cy + 0.36 * ry)}" r="${f(rx * 0.16)}" fill="#fff"${op(hi * 0.9)}/>`;
  if (ex.tr) {
    g += `<ellipse cx="${f(cx + 0.5 * rx)}" cy="${f(cy - 0.05 * ry)}" rx="${f(rx * 0.14)}" ry="${f(ry * 0.12)}" fill="#fff"/>`;
    g += S(sp([[X(0.1), Y(0.1, 0.36 - ex.lo * 0.4)], low[1], low[0], [X(0.96), Y(0.96, -0.1)]], false), "#e8f2ff", 2.2, op(0.9));
  }
  g += "</g>";
  b.add(g);
  const L = fc.lash;
  // 아랫눈꺼풀
  b.add(S(sp([[X(0.4), Y(0.4, 0.44 - ex.lo * 0.44)], low[0], [X(0.98), Y(0.98, -0.18)]], false), L, 1.3, op(0.8)));
  // 윗 속눈썹(굵은 초승달 + 바깥 꼬리)
  const th = [0.6, 2, 3, 3.6, 3.4];
  const top: Pt[] = up.map((p, i) => [p[0] + (i === 0 ? 0 : 0), p[1] - th[i], 0] as Pt);
  const tipY = Y(1.1, -0.42 * ex.o + 0.05);
  const tip: Pt = [X(1.1), tipY, 1];
  const hook: Pt = [X(0.97), Y(0.97, 0.12), 1];
  b.add(P(sp([up[0], up[1], up[2], up[3], hook, [X(1.02), Y(1.02, -0.3)], tip, top[3], top[2], top[1], [top[0][0], top[0][1], 1]]), L));
  // 쌍꺼풀
  const cr = (u: number, v: number): Pt => [X(u), Y(u, v * ex.o) - 3.2 + eyeGeom(e, ex).tl(u) * e.h];
  b.add(S(sp([cr(0.24, -0.86), cr(0.55, -1.06), cr(0.9, -0.84)], false), fc.skinLine, 1.1, op(0.75)));
}

function drawBrow(b: B, br: [Pt, Pt, Pt], ex: Ex, fc: Face, far: boolean): void {
  const dy = far ? ex.bf : 0;
  const [I, M, O] = br;
  const pinch = ex.t > 0.5 ? (O[0] > I[0] ? 2 : -2) : 0;
  const i: Pt = [I[0] + pinch, I[1] + ex.bi + dy];
  const o: Pt = [O[0], O[1] + ex.bo + dy];
  const m: Pt = [M[0], M[1] + (ex.bi + ex.bo) * 0.5 + dy + (ex.t < -0.5 ? 1.5 : 0)];
  b.add(P(lock([i, [I[0] + (M[0] - I[0]) * 0.5, (i[1] + m[1]) / 2 - 0.5], m, o], fc.browW * (far ? 0.9 : 1), 1, 0.7), fc.brow));
}

function drawMouth(b: B, fc: Face, ex: Ex): void {
  const [mx, my, hl, hr] = fc.mouth;
  const l = mx - hl, r = mx + hr;
  const c = fc.lip, dark = "#5a2230", tongue = "#c46a72", teeth = "#fbf8f8";
  const shade = () => b.add(S(`M${f(mx - hl * 0.3)} ${f(my + 6.5)}Q${f(mx + 1)} ${f(my + 7.6)} ${f(mx + hr * 0.4)} ${f(my + 6)}`, fc.skinLine, 1.2, op(0.45)));
  switch (ex.m) {
    case "smile":
      b.add(S(`M${f(l - 1)} ${f(my - 2.4)}Q${f(mx)} ${f(my + 3.6)} ${f(r + 1)} ${f(my - 3.4)}`, c, 1.9));
      shade();
      break;
    case "grin": // 활짝(이 보임)
      b.add(P(`M${f(l - 2)} ${f(my - 3)}Q${f(mx)} ${f(my - 1)} ${f(r + 2)} ${f(my - 4)}Q${f(mx + 2)} ${f(my + 13)} ${f(l - 2)} ${f(my - 3)}Z`, dark, c, 1.4));
      b.add(P(`M${f(l)} ${f(my - 2.4)}Q${f(mx)} ${f(my - 0.4)} ${f(r)} ${f(my - 3.4)}L${f(r - 1.5)} ${f(my + 0.5)}Q${f(mx)} ${f(my + 2.6)} ${f(l + 1)} ${f(my + 0.2)}Z`, teeth));
      b.add(P(`M${f(mx - hl * 0.4)} ${f(my + 6)}Q${f(mx + 1)} ${f(my + 9.5)} ${f(mx + hr * 0.5)} ${f(my + 5.5)}Q${f(mx)} ${f(my + 4.5)} ${f(mx - hl * 0.4)} ${f(my + 6)}Z`, tongue));
      break;
    case "sad":
      b.add(S(`M${f(l)} ${f(my + 1.8)}Q${f(mx)} ${f(my - 2)} ${f(r)} ${f(my + 2.4)}`, c, 1.8));
      shade();
      break;
    case "angry":
      b.add(P(`M${f(l)} ${f(my + 1)}Q${f(mx)} ${f(my - 3)} ${f(r + 1)} ${f(my)}Q${f(r)} ${f(my + 7.5)} ${f(mx)} ${f(my + 7.5)}Q${f(l)} ${f(my + 7)} ${f(l)} ${f(my + 1)}Z`, dark, c, 1.3));
      b.add(P(`M${f(l + 1)} ${f(my + 0.6)}Q${f(mx)} ${f(my - 2.4)} ${f(r)} ${f(my - 0.2)}L${f(r - 1)} ${f(my + 2.2)}Q${f(mx)} ${f(my + 0.8)} ${f(l + 1.5)} ${f(my + 2.6)}Z`, teeth));
      break;
    case "o":
      b.add(P(`M${f(mx - 4.5)} ${f(my + 1.5)}Q${f(mx - 4.5)} ${f(my - 3)} ${f(mx + 0.5)} ${f(my - 3)}Q${f(mx + 6)} ${f(my - 3)} ${f(mx + 5.5)} ${f(my + 2.5)}Q${f(mx + 5)} ${f(my + 9)} ${f(mx + 0.5)} ${f(my + 9)}Q${f(mx - 4.5)} ${f(my + 8.5)} ${f(mx - 4.5)} ${f(my + 1.5)}Z`, dark, c, 1.3));
      b.add(P(`M${f(mx - 2.5)} ${f(my + 7)}Q${f(mx + 1)} ${f(my + 4)} ${f(mx + 4)} ${f(my + 7)}Q${f(mx + 1)} ${f(my + 9)} ${f(mx - 2.5)} ${f(my + 7)}Z`, tongue));
      break;
    case "flat":
      b.add(S(`M${f(l + 1)} ${f(my + 0.4)}Q${f(mx)} ${f(my + 0.8)} ${f(r - 1)} ${f(my - 0.3)}`, c, 1.8));
      shade();
      break;
    case "soft":
      b.add(S(`M${f(l)} ${f(my - 0.8)}Q${f(mx)} ${f(my + 2.8)} ${f(r)} ${f(my - 1.8)}`, c, 1.7));
      shade();
      break;
    case "grit":
      b.add(P(`M${f(l - 1)} ${f(my - 0.5)}Q${f(mx)} ${f(my - 3.4)} ${f(r + 1)} ${f(my - 1)}Q${f(r + 1.5)} ${f(my + 4)} ${f(mx + 1)} ${f(my + 4.5)}Q${f(l - 1.5)} ${f(my + 4)} ${f(l - 1)} ${f(my - 0.5)}Z`, teeth, dark, 1.3));
      b.add(S(`M${f(l)} ${f(my + 1.2)}L${f(r)} ${f(my + 0.9)}`, dark, 0.9, op(0.6)));
      break;
    case "smirk":
      b.add(S(`M${f(l)} ${f(my + 0.8)}Q${f(mx + 2)} ${f(my + 2.2)} ${f(r + 2)} ${f(my - 3.8)}`, c, 1.9));
      b.add(S(`M${f(r + 0.6)} ${f(my - 5)}L${f(r + 2.8)} ${f(my - 2.6)}`, c, 1.1, op(0.7)));
      shade();
      break;
    case "cry":
      b.add(P(`M${f(l)} ${f(my + 1.5)}Q${f(mx)} ${f(my - 2.5)} ${f(r)} ${f(my + 1.5)}Q${f(mx + 1)} ${f(my + 8)} ${f(l)} ${f(my + 1.5)}Z`, dark, c, 1.3));
      b.add(S(`M${f(mx - 2)} ${f(my + 5)}Q${f(mx)} ${f(my + 4)} ${f(mx + 3)} ${f(my + 5)}`, tongue, 1.3));
      break;
    default:
      b.add(S(`M${f(l + 1)} ${f(my)}Q${f(mx)} ${f(my + 1.4)} ${f(r)} ${f(my - 0.9)}`, c, 1.8));
      shade();
  }
}

/** 얼굴 부품(홍조, 눈, 입, 눈물, 땀). 머리 좌표계 안에서 호출 */
function drawFace(b: B, fc: Face, ex: Ex): void {
  const [ne, fe] = fc.eyes;
  if (ex.bl > 0) {
    const bg = b.rgb("bl", [[0, fc.blush, ex.bl], [1, fc.blush, 0]]);
    const cy = ne.iy + 17;
    b.add(`<ellipse cx="${f(ne.ix + 18)}" cy="${f(cy)}" rx="15" ry="7" fill="${bg}"/><ellipse cx="${f(fe.ix - 16)}" cy="${f(cy)}" rx="10" ry="6.5" fill="${bg}"/>`);
    if (ex.bl > 0.3) {
      let h = "";
      for (let i = 0; i < 3; i++) h += `M${f(ne.ix + 11 + i * 5.5)} ${f(cy - 3)}l-3 6`;
      for (let i = 0; i < 2; i++) h += `M${f(fe.ix - 19 + i * 5)} ${f(cy - 2.5)}l-2.5 5`;
      b.add(S(h, fc.skinLine, 1.1, op(0.55)));
    }
  }
  if (!fc.hideNear) drawEye(b, ne, ex, fc, fc.iris[0], "n");
  drawEye(b, fe, ex, fc, fc.iris[1], "f");
  drawMouth(b, fc, ex);
  if (ex.tr === 2) {
    const e = fc.hideNear ? fe : ne;
    const { X, Y } = eyeGeom(e, ex);
    const tx = X(0.6), ty = Y(0.6, 0.4);
    const d = `M${f(tx - 2.2)} ${f(ty)}C${f(tx - 3.5)} ${f(ty + 14)} ${f(tx - 1)} ${f(ty + 28)} ${f(tx - 3)} ${f(ty + 42)}C${f(tx + 0.5)} ${f(ty + 29)} ${f(tx + 2.4)} ${f(ty + 14)} ${f(tx + 2.2)} ${f(ty)}Z`;
    b.add(P(d, "#d4e6ff", "#8fb0dc", 1, op(0.9)), `<ellipse cx="${f(tx - 3)}" cy="${f(ty + 44)}" rx="2.4" ry="3.2" fill="#eef5ff" stroke="#8fb0dc" stroke-width="1"/>`);
    if (!fc.hideNear) {
      const g2 = eyeGeom(fe, ex);
      const qx = g2.X(0.5), qy = g2.Y(0.5, 0.4);
      b.add(P(`M${f(qx - 1.6)} ${f(qy)}C${f(qx - 2.2)} ${f(qy + 10)} ${f(qx)} ${f(qy + 20)} ${f(qx - 1)} ${f(qy + 28)}C${f(qx + 1.2)} ${f(qy + 20)} ${f(qx + 1.6)} ${f(qy + 10)} ${f(qx + 1.6)} ${f(qy)}Z`, "#d4e6ff", "#8fb0dc", 0.9, op(0.85)));
    }
  }
  if (ex.sw) {
    const x = ne.ox + 14, y = ne.oy - 30;
    b.add(P(`M${f(x)} ${f(y)}q-5 9-4.5 12.5q1.2 4 4.5 4t4.5-4q.5-3.5-4.5-12.5Z`, "#e4f1ff", "#86a8d6", 1.2));
  }
}

function drawBrows(b: B, fc: Face, ex: Ex, o = 0.95): void {
  b.add(`<g${op(o)}>`);
  fc.brows.forEach((br, i) => drawBrow(b, br, ex, fc, i === 1));
  b.add(`</g>`);
}

// ───────────────────────── 공통 부품 ─────────────────────────
interface Tone { b: string; s: string; l: string; h: string }

/** 가닥 목록 → 그림(그림자 사본 + 본색 + 외곽선). 반환: 가닥 id 목록(마스크용) */
function hairLocks(b: B, list: [Pt[], number, number?][], t: Tone, off = "2.5 2", w = 2): string[] {
  const ids: string[] = [];
  for (const [c, wd, bu] of list) {
    coarse = true;
    const id = b.def(lock(c, wd, 1, bu ?? 0.5));
    coarse = false;
    ids.push(id);
    b.add(`${off ? `<use href="#${id}" fill="${t.s}" transform="translate(${off})"/>` : ""}<use href="#${id}" fill="${t.b}" stroke="${t.l}" stroke-width="${w}"/>`);
  }
  return ids;
}

/** 머리 광택 띠: 가닥들 모양으로 가린 띠 */
function sheen(b: B, name: string, ids: string[], d: string, col: string, o = 1): void {
  const m = b.mask(name, ids.map((id) => `<use href="#${id}" fill="#fff"/>`).join(""));
  b.add(`<g mask="${m}" fill="${col}"${op(o)}>${d.split("|").map((x) => `<path d="${x}"/>`).join("")}</g>`);
}

/** 광택: 머리 둥근 면을 따라 늘어선 짧은 반짝임 조각들. (cx,cy)=정수리 기준점, r=반지름 */
function gleam(cx: number, cy: number, r: number, a0: number, a1: number, n: number, len = 17, w = 5): string {
  let d = "";
  coarse = true;
  for (let i = 0; i < n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / (n - 1)) * Math.PI) / 180;
    const ux = Math.cos(a), uy = Math.sin(a);
    const L = len * (i % 2 ? 0.8 : 1);
    const x = cx + ux * (r + (i % 2 ? 2 : 0)), y = cy + uy * (r + (i % 2 ? 2 : 0));
    d += lock([[x - ux * L * 0.5, y - uy * L * 0.5], [x, y], [x + ux * L * 0.5, y + uy * L * 0.5]], w * (i % 2 ? 0.8 : 1), 2);
  }
  // 조각들을 잇는 얇은 띠
  const A = (a: number) => [cx + Math.cos((a * Math.PI) / 180) * (r + 1), cy + Math.sin((a * Math.PI) / 180) * (r + 1)];
  const [x0, y0] = A(a0 + 3), [x1, y1] = A(a1 - 3), [x2, y2] = A(a1 - 3), [x3, y3] = A(a0 + 3);
  const R1 = r + 1 + w * 0.3, R2 = r + 1 - w * 0.3;
  d += `|M${f(cx + ((x0 - cx) * R1) / (r + 1))} ${f(cy + ((y0 - cy) * R1) / (r + 1))}A${f(R1)} ${f(R1)} 0 0 1 ${f(cx + ((x1 - cx) * R1) / (r + 1))} ${f(cy + ((y1 - cy) * R1) / (r + 1))}L${f(cx + ((x2 - cx) * R2) / (r + 1))} ${f(cy + ((y2 - cy) * R2) / (r + 1))}A${f(R2)} ${f(R2)} 0 0 0 ${f(cx + ((x3 - cx) * R2) / (r + 1))} ${f(cy + ((y3 - cy) * R2) / (r + 1))}Z`;
  coarse = false;
  return d;
}

/** 지그재그 광택 띠: y0 윗선, 아래로 뾰족 */
function band(x0: number, x1: number, y0: number, h: number, n: number, curve = 0): string {
  const pts: Pt[] = [];
  const cy = (x: number) => y0 + curve * Math.pow((x - (x0 + x1) / 2) / ((x1 - x0) / 2), 2);
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    pts.push([x, cy(x) + (i % 2 ? h : h * 0.35), 1]);
  }
  const top: Pt[] = [];
  for (let i = n; i >= 0; i -= 2) {
    const x = x0 + ((x1 - x0) * i) / n;
    top.push([x, cy(x) - h * 0.15 - (i % 4 ? 1.5 : 0)]);
  }
  return sp([...pts, ...top.map((p, i) => (i === 0 || i === top.length - 1 ? ([p[0], p[1], 1] as Pt) : p))]);
}

function button(x: number, y: number, r = 5.5): string {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#d9a94a" stroke="#6b4a1a" stroke-width="1.6"/><circle cx="${f(x - r * 0.3)}" cy="${f(y - r * 0.3)}" r="${f(r * 0.4)}" fill="#fff0bf"/>`;
}

const SKIN_PALE = { skin: "#fdf0ea", skinSh: "#eccdca", skinLine: "#b8807e", blush: "#f5989a" };

function finish(b: B, fade: [number, number], style = ""): string {
  const fm = b.mask("fm", `<rect width="600" height="1000" fill="${b.lg("fd", 0, fade[0], 0, fade[1], [[0, "#fff"], [1, "#000"]])}"/>`);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 1000">${style}<defs>${b.defs.join("")}</defs>` +
    `<g mask="${fm}" stroke-linejoin="round" stroke-linecap="round">${b.out.join("")}</g></svg>`
  );
}

// 얼굴 윤곽(머리 좌표계: 눈높이 y=0, 턱 y≈63, 얼굴은 왼쪽을 향함)
const FACE_SLIM: Pt[] = [
  [-49, -40], [-51, -12], [-47, -2], [-48.5, 11], [-43, 31], [-30, 50], [-14, 63, 1], [6, 57], [26, 45], [41, 29], [48, 10], [51, -18], [48, -46], [0, -62],
];

/** 목(옷깃보다 먼저, 머리 좌표계 tf로) */
function neck(b: B, fc: Face, tf: string, pts: Pt[] = [[-12, 48], [-10, 104], [25, 104], [27, 34]]): void {
  b.add(`<g transform="${tf}">`, P(sp(pts), fc.skin, fc.skinLine, 2), P(sp([[-12, 58], [4, 56], [26, 44], [27, 34], [26, 84], [-10, 76]]), fc.skinSh), `</g>`);
}

function faceBase(b: B, fc: Face, outline: Pt[], earPts: Pt[] | null, extraShade = ""): string {
  // 귀
  if (earPts) {
    b.add(P(sp(earPts), fc.skin, fc.skinLine, 2));
    b.add(S(sp([[52, 0], [58, -4], [60, 8], [55, 20]], false), fc.skinLine, 1.4, op(0.8)));
    b.add(P(sp([[51, 2], [57, -1], [58, 9], [53, 18], [50, 12]]), fc.skinSh));
  }
  // 얼굴
  const fid = b.def(sp(outline));
  b.add(`<use href="#${fid}" fill="${fc.skin}" stroke="${fc.skinLine}" stroke-width="2.2"/>`);
  const fcid = b.clip("fc", `<use href="#${fid}"/>`);
  // 얼굴 가까운 쪽 셀 그림자
  b.add(`<g clip-path="${fcid}">${P(sp([[40, -60], [43.5, -12], [41, 10], [33, 28], [19, 44], [2, 56], [-8, 64, 1], [60, 70, 1], [60, -60, 1]]), fc.skinSh)}${extraShade}</g>`);
  // 코
  b.add(P(sp([[-9, 10], [-13, 20], [-16, 26.5, 1], [-10, 27], [-8, 24]]), fc.skinSh));
  b.add(S(sp([[-12, 18], [-16, 26], [-11, 27.5]], false), fc.skinLine, 1.5));
  return fcid;
}

// ───────────────────────── 엘리오스 ─────────────────────────
const E_HAIR: Tone = { b: "#2a2839", s: "#15141f", l: "#0a0910", h: "#4a4f78" };
const E_COAT: Tone = { b: "#2d3858", s: "#1c2340", l: "#0e1328", h: "#4a5a86" };
const GLOVE: Tone = { b: "#23222b", s: "#131218", l: "#08080b", h: "#555466" };
const SHIRT: Tone = { b: "#f7f7fc", s: "#cdd1e2", l: "#7d839c", h: "#fff" };

const EYE_NEAR: EyeG = { ix: 6, iy: 2, ox: 41, oy: -3, h: 14.2, rx: 10, ry: 12.8, u: 0.44 };
const EYE_FAR: EyeG = { ix: -16, iy: 2, ox: -42, oy: -2.5, h: 13.4, rx: 7.8, ry: 12.2, u: 0.45 };
const BROWS: [Pt, Pt, Pt][] = [
  [[6, -21], [26, -26.5], [47, -22]],
  [[-14, -21], [-31, -25], [-47, -20]],
];
const IRIS_RED: Iris = ["#5e0b18", "#c3243a", "#ff8f86", "#2a0409"];
const IRIS_GOLD: Iris = ["#7a4a06", "#d9a21e", "#fff0a0", "#3a2104"];

const FC_E: Face = {
  ...SKIN_PALE, lash: "#1a1420", brow: "#221e2c", browW: 5.6,
  eyes: [EYE_NEAR, EYE_FAR], iris: [IRIS_RED, IRIS_GOLD], brows: BROWS,
  mouth: [-10, 44, 8, 12], lip: "#a45b5e",
};

const EAR_POINTY: Pt[] = [[47, -6], [56, -12], [70, -28, 1], [66, -8], [63, 10], [58, 26], [47, 31]];

interface EHead { hair: Tone; fc: Face; bare?: boolean; ash?: boolean; face?: () => void; after?: () => void; outline?: Pt[]; shade?: string }

function eliosHead(b: B, ex: Ex, o: EHead): void {
  const { hair: H, fc } = o;
  // 뒷머리
  b.add(P(sp([[-10, -100], [40, -94], [68, -66], [78, -20], [80, 30], [86, 92, 1], [68, 76], [64, 106, 1], [48, 72], [30, 44], [-30, 50], [-46, 72], [-58, 104, 1], [-60, 66], [-70, 96, 1], [-72, 40], [-68, -20], [-52, -76]]), H.s, H.l, 2));
  // 먼 쪽/가까운 쪽 옆머리(얼굴 뒤)
  hairLocks(b, [
    [[[-50, -56], [-62, -18], [-63, 30], [-58, 70], [-62, 98]], 22],
    [[[58, -48], [68, -8], [70, 40], [66, 90]], 20],
    [[[46, -40], [58, 0], [60, 46], [54, 84]], 16],
  ], H);
  if (o.face) o.face();
  else {
    faceBase(b, fc, o.outline ?? FACE_SLIM, EAR_POINTY, o.shade);
    drawFace(b, fc, ex);
    if (o.after) o.after();
  }
  // 윗머리 덩어리
  const cap = b.def(sp([[-60, -14], [-64, -52], [-44, -86], [-6, -99], [36, -93], [62, -70], [70, -36], [64, -4], [48, -40], [0, -56], [-44, -44]]));
  b.add(`<use href="#${cap}" fill="${H.b}" stroke="${H.l}" stroke-width="2"/>`);
  // 뿔
  const horn = (c: Pt[], w: number) => {
    const d = lock(c, w, 1, 0.2);
    b.add(P(d, "#1d1b26", "#07070a", 1.8));
    b.add(S(sp([c[0], c[1], c[2]].map((p) => [p[0] - 1.8, p[1]] as Pt), false), "#5d5a74", 1.6, op(0.9)));
  };
  if (o.ash) {
    // 재로 부서지는 큰 뿔: 끝이 잘려 나간 모양 + 떨어져 나간 조각
    const ah = (c: Pt[], w: number, sx: number) => {
      const d = lock(c, w, 1, 0.1);
      b.add(P(d, "#2a2628", "#0e0c0d", 1.8));
      const t = c[c.length - 1];
      b.add(P(`M${f(t[0] - 6)} ${f(t[1] + 4)}l3 -5 3 3 2 -6 4 7Z`, "#8a8784", "#3d3a3a", 1.2));
      b.add(P(`M${f(t[0] + sx * 3)} ${f(t[1] - 8)}h3v3h-3zM${f(t[0] - sx * 2)} ${f(t[1] - 15)}h2.4v2.4h-2.4zM${f(t[0] + sx * 5)} ${f(t[1] - 21)}h1.8v1.8h-1.8z`, "#8a8784"));
      b.add(S(sp([c[0], c[1], c[2]].map((p) => [p[0] - 2, p[1]] as Pt), false), "#6f6a70", 1.8, op(0.8)));
    };
    ah([[-36, -80], [-44, -98], [-48, -114], [-47, -126]], 16, -1);
    ah([[26, -86], [33, -104], [36, -120], [35, -132]], 15, 1);
  } else {
    horn([[-36, -80], [-40, -93], [-37, -104], [-31, -112]], 12);
    horn([[26, -86], [31, -99], [29, -110], [23, -118]], 11);
  }
  // 앞머리
  const bangs = hairLocks(b, [
    [[[34, -86], [48, -58], [54, -28], [50, 4]], 24],
    [[[-36, -80], [-52, -50], [-60, -14], [-58, 24]], 24],
    [[[22, -92], [32, -64], [38, -36], [35, -8]], 22],
    [[[-20, -88], [-34, -58], [-42, -28], [-40, 2]], 24],
    [[[-2, -92], [-14, -62], [-22, -34], [-25, -11]], 24],
    [[[20, -92], [18, -62], [16, -34], [12, -14]], 18],
    [[[10, -94], [4, -60], [-2, -26], [-6, 10]], 22],
  ], H);
  b.add(P(sp([[-58, -44], [-50, -78], [-6, -99], [36, -93], [62, -70], [68, -44], [44, -68], [20, -76], [0, -78], [-22, -76], [-42, -64]]), H.b), S(sp([[-60, -40], [-50, -79], [-6, -100], [36, -94], [62, -71], [69, -42]], false), H.l, 2));
  sheen(b, "sh", [cap, ...bangs], gleam(6, -14, 58, 196, 338, 16, 26, 10), H.h);
  // 흰 가닥(인물의 오른쪽 = 관객 왼쪽 앞머리)
  if (!o.bare && !o.ash) {
    const W: Tone = { b: "#eef0f8", s: "#b6bbd0", l: "#6f7590", h: "#fff" };
    hairLocks(b, [
      [[[-30, -82], [-40, -50], [-45, -20], [-44, 2]], 7],
      [[[-24, -84], [-32, -52], [-36, -24], [-34, -4]], 6],
      [[[-37, -78], [-49, -46], [-53, -14], [-52, 12]], 6],
    ], W, "1 1", 1.4);
  }
  if (!o.face) drawBrows(b, fc, ex, 0.9);
}

function elios(b: B, ex: Ex): void {
  const C = E_COAT;
  // 등 뒤 깃 안감
  b.add(P(sp([[266, 238], [300, 224], [338, 226], [346, 270], [266, 268]]), "#141a30"));
  // 묶은 머리(어깨 너머)
  // 먼 팔
  b.add(P(sp([[218, 268], [192, 280], [178, 306], [172, 370], [170, 460], [168, 560], [169, 640, 1], [210, 644, 1], [211, 560], [213, 460], [216, 370], [222, 318]]), C.b, C.l, 2.4));
  b.add(P(sp([[200, 300], [208, 360], [206, 460], [206, 560], [209, 642, 1], [192, 641, 1], [192, 560], [192, 460], [194, 380]]), C.s));
  b.add(P(sp([[169, 610, 1], [211, 614, 1], [210, 644, 1], [169, 640, 1]]), C.s, C.l, 2), S("M170 613 210 617", "#d9a94a", 2));
  b.add(P(sp([[174, 640], [208, 644], [210, 674], [203, 702], [192, 716], [181, 712], [173, 690], [171, 662]]), GLOVE.b, GLOVE.l, 2));
  b.add(S("M182 690q2 12 7 20M207 688q2 12 3 22", GLOVE.h, 1.3, op(0.8)));
  // 몸통
  b.add(P(sp([[262, 252], [222, 264], [204, 292], [210, 350], [224, 430], [226, 500], [220, 600], [212, 1000, 1], [400, 1000, 1], [392, 600], [384, 500], [384, 430], [394, 350], [404, 296], [380, 264], [336, 252]]), C.b, C.l, 2.4));
  b.add(P(sp([[346, 270], [378, 292], [388, 350], [382, 430], [384, 500], [390, 600], [398, 1000, 1], [362, 1000, 1], [358, 600], [352, 500], [356, 420], [354, 330]]), C.s));
  b.add(P(sp([[244, 262], [340, 258], [356, 272], [322, 292], [288, 298], [254, 290]]), C.s));
  b.add(S("M256 282Q252 420 254 520Q252 700 246 1000", C.l, 2.2), S("M259 284Q256 420 258 520Q256 700 250 1000", C.h, 1.4, op(0.7)));
  b.add(S("M226 500Q300 514 386 498", C.l, 1.8), S("M252 560Q244 760 236 1000", C.s, 3), S("M232 520Q228 700 222 900", C.h, 1.4, op(0.35)));
  let bt = "";
  for (let i = 0; i < 5; i++) {
    const y = 298 + i * 48;
    bt += button(273 - i * 0.4, y, 5) + button(332 - i * 0.4, y + 2, 5.5);
  }
  b.add(bt);
  // 회중시계 줄
  b.add(S("M332 396Q298 442 252 418", "#6b4a1a", 3.6), S("M332 396Q298 442 252 418", "#f0c65a", 2.2, ` stroke-dasharray="3.2 2"`));
  b.add(S("M240 414l22-2", C.l, 1.8), `<circle cx="262" cy="421" r="3.4" fill="#f0c65a" stroke="#6b4a1a" stroke-width="1.3"/>`);
  // 가까운 팔
  b.add(P(sp([[380, 258], [412, 272], [434, 296], [444, 356], [446, 460], [448, 560], [452, 632, 1], [410, 640, 1], [408, 560], [406, 460], [402, 380], [398, 320], [390, 288]]), C.b, C.l, 2.4));
  b.add(P(sp([[420, 290], [438, 330], [444, 420], [446, 520], [451, 632, 1], [432, 634, 1], [428, 540], [426, 440], [424, 350]]), C.s));
  b.add(S("M404 330Q396 420 396 520", C.h, 1.6, op(0.6)));
  b.add(P(sp([[409, 606, 1], [450, 600, 1], [452, 632, 1], [410, 640, 1]]), C.s, C.l, 2), S("M410 610 450 604", "#d9a94a", 2));
  b.add(P(sp([[414, 636], [452, 632], [456, 666], [449, 698], [438, 720], [425, 722], [416, 704], [411, 668]]), GLOVE.b, GLOVE.l, 2));
  b.add(P(sp([[416, 646], [403, 668], [405, 688], [416, 686], [420, 666]]), GLOVE.b, GLOVE.l, 1.8));
  b.add(S("M428 692q2 14 5 24M425 688q1 14 2 24", GLOVE.h, 1.3, op(0.8)));
  neck(b, FC_E, "translate(300 164) scale(1.12)");
  // 목 앞 깃(높은 깃) + 흰 셔츠 깃
  b.add(P(sp([[254, 276], [257, 244], [272, 236], [290, 250, 1], [312, 236], [334, 232], [344, 274], [296, 284]]), C.b, C.l, 2.2));
  b.add(P(sp([[330, 238], [342, 274], [300, 284], [316, 268]]), C.s));
  b.add(P(sp([[266, 240], [289, 252, 1], [316, 238], [320, 231, 1], [290, 244, 1], [268, 233, 1]]), SHIRT.b, SHIRT.l, 1.6));
  b.add(S("M258 254Q272 246 289 260Q310 246 338 246", "#d9a94a", 1.6, op(0.9)));
  // 묶은 꼬리(가까운 어깨 앞으로)
  b.add(`<g>`);
  hairLocks(b, [
    [[[356, 236], [370, 272], [378, 318], [376, 366], [368, 402]], 30, 0.2],
    [[[352, 250], [362, 290], [362, 336], [356, 372]], 16],
  ], E_HAIR);
  b.add(P(sp([[354, 262], [376, 256], [382, 270], [360, 278]]), "#20284a", "#0b1024", 1.6));
  b.add(`</g>`);
  // 머리
  b.add(`<g transform="translate(300 164) scale(1.12)">`);
  eliosHead(b, ex, { hair: E_HAIR, fc: FC_E });
  b.add(`</g>`);
}

// ───────────────────────── 보조 ─────────────────────────
/** 시드 고정 난수 */
function rnd(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 폴리라인을 따라 들쭉날쭉한(털/넝마) 가장자리 점을 만든다. a>0 = 진행 방향의 오른쪽으로 뾰족 */
function jag(line: [number, number][], n: number, a: number, seed = 1): Pt[] {
  const r = rnd(seed);
  const out: Pt[] = [];
  const segs: number[] = [];
  let tot = 0;
  for (let i = 1; i < line.length; i++) {
    const d = Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
    segs.push(d);
    tot += d;
  }
  for (let k = 0; k <= n; k++) {
    let dist = (tot * k) / n, i = 0;
    while (i < segs.length - 1 && dist > segs[i]) dist -= segs[i++];
    const t = dist / segs[i];
    const [x0, y0] = line[i], [x1, y1] = line[i + 1];
    const tx = (x1 - x0) / segs[i], ty = (y1 - y0) / segs[i];
    const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
    const amp = k % 2 ? a * (0.6 + 0.6 * r()) : 0;
    out.push([x - ty * amp, y + tx * amp, k % 2 ? 1 : 0]);
  }
  return out;
}

const SKIN_TAN = { skin: "#f6dcc4", skinSh: "#dfae90", skinLine: "#9c6548", blush: "#e98a78" };

// ───────────────────────── 라젤 ─────────────────────────
const R_HAIR: Tone = { b: "#c39463", s: "#916538", l: "#553519", h: "#ecc796" };
const LEATHER: Tone = { b: "#8a5a36", s: "#603b20", l: "#2e1b0c", h: "#b98253" };
const FUR: Tone = { b: "#a7a7ae", s: "#76757e", l: "#3f3e47", h: "#d6d6dc" };
const STEEL: Tone = { b: "#c9ccd6", s: "#8d92a2", l: "#454a58", h: "#f2f4f8" };
const R_SLEEVE: Tone = { b: "#4f4038", s: "#382c26", l: "#1a1310", h: "#6a5a50" };
const FACE_WIDE: Pt[] = [
  [-52, -40], [-54, -12], [-50, -2], [-51.5, 12], [-47, 32], [-37, 50], [-24, 62], [-12, 65.5, 1], [8, 62], [28, 50], [44, 32], [51, 10], [54, -18], [50, -46], [0, -62],
];
const EAR_ROUND: Pt[] = [[48, -4], [58, -8], [64, 2], [63, 16], [56, 28], [47, 31]];

const FC_R: Face = {
  ...SKIN_TAN, lash: "#2a1a10", brow: "#5c3a1e", browW: 7.6,
  eyes: [
    { ix: 7, iy: 2, ox: 41, oy: -2, h: 12.4, rx: 9.4, ry: 11.6, u: 0.44 },
    { ix: -16, iy: 2, ox: -42, oy: -1.5, h: 11.8, rx: 7.4, ry: 11, u: 0.45 },
  ],
  iris: [["#6a3806", "#d88a1e", "#ffd97a", "#2e1604"], ["#6a3806", "#d88a1e", "#ffd97a", "#2e1604"]],
  brows: [
    [[5, -16], [26, -21], [48, -18]],
    [[-13, -16], [-31, -20], [-48, -15]],
  ],
  mouth: [-10, 45, 9, 14], lip: "#8e4e40",
};

function razelHead(b: B, ex: Ex): void {
  const H = R_HAIR, fc = FC_R;
  // 묶은 꼬리(머리 뒤 가까운 쪽으로 삐져나옴)
  hairLocks(b, [
    [[[46, -20], [62, 10], [66, 48], [62, 86]], 24, 0.3],
  ], H);
  b.add(P(sp([[-6, -100], [42, -96], [70, -70], [76, -30], [72, 4], [60, 24], [-60, 24], [-66, -20], [-58, -70]]), H.s, H.l, 2));
  // 뒷머리 흘러내린 잔머리(먼 쪽)
  hairLocks(b, [[[[-52, -40], [-62, -10], [-64, 20], [-60, 40]], 16]], H);
  faceBase(b, fc, FACE_WIDE, EAR_ROUND);
  // 수염 자국
  const fcid = b.id("fc");
  const r = rnd(7);
  let st = "";
  for (let i = 0; i < 14; i++) {
    const x = -34 + r() * 50;
    const y = 54 - Math.abs(x + 12) * 0.35 + r() * 8;
    st += `M${f(x)} ${f(y)}l.5 1.6`;
  }
  b.add(`<g clip-path="url(#${fcid})">${P(sp([[-48, 26], [-30, 44], [-12, 50], [8, 46], [30, 36], [48, 18], [52, 40], [30, 62], [-12, 70], [-40, 56]]), "#a08270", undefined, 0, op(0.16))}${S(st, "#6b4c38", 1.1, op(0.4))}</g>`);
  drawFace(b, fc, ex);
  // 흉터(콧등을 가로질러)
  b.add(S("M-27 12Q-12 8 1 1", "#b07060", 3.2), S("M-27 12Q-12 8 1 1", "#f7d2c4", 1.4), S("M-20 7l2 6M-8 4l1.6 6", "#b07060", 1, op(0.8)));
  // 윗머리(뒤로 넘김)
  const cap = b.def(sp([[-58, -22], [-62, -60], [-40, -92], [0, -104], [40, -98], [64, -76], [70, -40], [62, -8], [52, -34], [32, -54], [6, -60], [-24, -56], [-48, -40]]));
  b.add(`<use href="#${cap}" fill="${H.b}" stroke="${H.l}" stroke-width="2"/>`);
  b.add(S("M-30 -58Q-20 -86 18 -98M-8 -60Q6 -84 44 -90M14 -58Q34 -76 60 -70M-48 -42Q-44 -72 -10 -96M36 -52Q52 -58 66 -44", H.s, 2.2));
  b.add(P(sp([[62, -30], [66, -6], [58, 14, 1], [54, -12]]), H.b, H.l, 1.6));
  const fr = hairLocks(b, [
    [[[-30, -58], [-42, -36], [-47, -12], [-45, 4]], 11],
    [[[-6, -62], [-14, -42], [-20, -22], [-17, -6]], 11],
    [[[6, -60], [2, -42], [-2, -26]], 8],
    [[[34, -56], [44, -36], [48, -12]], 9],
  ], H, "1.5 1.2", 1.6);
  sheen(b, "sh", [cap, ...fr], gleam(4, -24, 70, 212, 325, 7, 30, 7), H.h);
  drawBrows(b, fc, ex, 1);
}

function razel(b: B, ex: Ex): void {
  const L = LEATHER;
  const TF = "translate(296 176) scale(1.14)";
  // 대검 손잡이(등 뒤, 먼 어깨 너머)
  b.add(P("M206 262L166 160 180 154 222 256Z", "#3a2a22", "#140c08", 2), S("M203 243l14-6M196 225l14-6M189 207l14-6M182 189l14-6M175 171l14-6", "#7a5a44", 2));
  b.add(P("M178 290L256 258 262 272 184 304Z", STEEL.b, STEEL.l, 2), P("M180 296L258 264 262 272 184 304Z", STEEL.s));
  b.add(`<circle cx="166" cy="148" r="11" fill="${STEEL.b}" stroke="${STEEL.l}" stroke-width="2"/><circle cx="163" cy="145" r="4" fill="${STEEL.h}"/>`);
  // 팔(소매 + 가죽 팔보호대 + 주먹)
  const arm = (o: Pt[], sh: Pt[], br: Pt[], fist: Pt[], knk: string) => {
    b.add(P(sp(o), R_SLEEVE.b, R_SLEEVE.l, 2.4), P(sp(sh), R_SLEEVE.s));
    b.add(P(sp(br), L.b, L.l, 2.2), P(sp(fist), SKIN_TAN.skin, SKIN_TAN.skinLine, 2), S(knk, SKIN_TAN.skinLine, 1.4));
  };
  arm([[196, 300], [160, 322], [140, 364], [134, 440], [138, 520], [140, 560, 1], [192, 564, 1], [194, 520], [198, 440], [206, 360]],
    [[176, 330], [188, 380], [186, 450], [186, 520], [190, 560, 1], [172, 560, 1], [172, 480], [170, 400]],
    [[138, 530, 1], [194, 532, 1], [198, 612, 1], [146, 616, 1]],
    [[146, 612], [198, 610], [202, 640], [194, 666], [172, 672], [150, 662], [144, 638]], "M154 640q6 4 12 2M170 646q6 3 12 0M186 640q4 3 8 0");
  // 다리(짙은 바지)
  b.add(P(sp([[212, 620, 1], [302, 620, 1], [298, 1000, 1], [216, 1000, 1]]), "#3d3430", "#17110e", 2.4), P(sp([[302, 620, 1], [398, 620, 1], [396, 1000, 1], [306, 1000, 1]]), "#3d3430", "#17110e", 2.4), P("M360 640L396 640 396 1000 366 1000Z", "#2a231f"));
  // 몸통(가죽 갑옷)
  b.add(P(sp([[246, 276], [192, 294], [174, 340], [184, 420], [208, 500], [212, 540], [210, 600, 1], [398, 600, 1], [394, 540], [396, 500], [418, 420], [428, 340], [412, 294], [352, 276]]), L.b, L.l, 2.6));
  b.add(P(sp([[360, 300], [404, 320], [414, 400], [392, 480], [394, 540], [396, 598, 1], [366, 598, 1], [364, 500], [380, 420], [376, 340]]), L.s));
  b.add(S("M300 334Q296 420 302 500M196 350Q240 400 300 392Q360 400 414 346M300 392L300 440M212 452Q300 470 390 450", L.l, 2), S("M306 334Q302 420 308 506", L.h, 1.5, op(0.6)));
  b.add(S("M220 368Q300 396 400 362", L.h, 1.3, op(0.5)));
  // 벨트 + 버클 + 허리 가죽 판
  let ts = "";
  for (let i = 0; i < 4; i++) {
    const x = 212 + i * 45;
    ts += P(`M${x} 540L${x + 46} 538 ${x + 50 + i * 2} 700 ${x - 6 + i * 3} 706Z`, i === 3 ? L.s : L.b, L.l, 2) + S(`M${x + 8} 552L${x + 6 + i} 690`, L.h, 1.2, op(0.5)) + `<circle cx="${x + 23}" cy="552" r="3" fill="#d9a94a" stroke="#6b4a1a"/>`;
  }
  b.add(ts);
  b.add(P(sp([[206, 504, 1], [398, 498, 1], [398, 538, 1], [210, 546, 1]]), "#4a2e18", L.l, 2), P("M288 505h28v36h-28z", "none", "#d9a94a", 3.4));
  // 대검 멜빵(가까운 어깨 → 먼 옆구리)
  b.add(P("M388 296L408 310 226 506 210 494Z", "#5a3a22", L.l, 2), P("M298 404h22v20h-22z", "#d9a94a", "#6b4a1a", 1.6));
  // 가까운 팔
  arm([[410, 300], [448, 322], [466, 364], [470, 440], [466, 520], [464, 560, 1], [412, 564, 1], [410, 520], [408, 440], [404, 360]],
    [[434, 324], [454, 370], [458, 450], [456, 520], [462, 560, 1], [440, 560, 1], [438, 480], [436, 400]],
    [[410, 532, 1], [466, 530, 1], [462, 612, 1], [410, 616, 1]],
    [[410, 612], [462, 610], [466, 640], [458, 664], [436, 672], [414, 664], [406, 640]], "M418 646q6 3 12 0M434 648q6 3 12 0M450 642q4 2 8-1");
  neck(b, FC_R, TF, [[-16, 46], [-16, 104], [34, 104], [36, 28]]);
  // 늑대 모피 망토(어깨)
  const fur: Pt[] = [
    [262, 262], [306, 282], [346, 262],
    ...jag([[346, 262], [410, 272], [458, 300], [480, 346], [478, 392]], 12, -9, 3),
    ...jag([[478, 392], [440, 372], [400, 360], [360, 348], [330, 330], [300, 318], [270, 330], [236, 350], [196, 360], [156, 374], [128, 392]], 22, -12, 5),
    ...jag([[128, 392], [126, 346], [146, 302], [196, 274], [262, 262]], 12, -9, 9),
  ];
  b.add(P(sp(fur), FUR.b, FUR.l, 2.2));
  b.add(P(sp([[380, 296], [430, 304], [462, 334], [470, 380, 1], [446, 368], [420, 360]]), FUR.s));
  b.add(S("M160 330l14 18M196 312l10 20M236 300l6 18M398 294l-4 18M436 310l-10 18M150 356l16 10M222 330l8 16", FUR.h, 2.2));
  b.add(S("M184 340l12 16M420 330l-8 16M456 342l-10 14", FUR.s, 2));
  // 망토 고정 쇠붙이
  b.add(`<circle cx="306" cy="296" r="9" fill="#d9a94a" stroke="#6b4a1a" stroke-width="2"/><circle cx="303" cy="293" r="3.4" fill="#fff0bf"/>`);
  b.add(`<g transform="${TF}">`);
  razelHead(b, ex);
  b.add(`</g>`);
}

// ───────────────────────── 시안 ─────────────────────────
const S_HAIR: Tone = { b: "#e2ebf4", s: "#afc0d6", l: "#687d9c", h: "#ffffff" };
const ROBE: Tone = { b: "#f5f7fc", s: "#cbd5e8", l: "#7c89a8", h: "#ffffff" };
const MANT: Tone = { b: "#3f66ad", s: "#2b4a86", l: "#16264d", h: "#7fa3e0" };
const SILVER = "#d9dee9";

const FC_S: Face = {
  ...SKIN_PALE, lash: "#3a3f58", brow: "#8a9ab6", browW: 4.4,
  eyes: [
    { ix: 6, iy: 2, ox: 40, oy: -3, h: 14.2, rx: 10, ry: 12.8, u: 0.44 },
    { ix: -15, iy: 2, ox: -42, oy: -2.5, h: 13.8, rx: 8.2, ry: 12.6, u: 0.46 },
  ],
  iris: [["#2c3d5c", "#6f8bb0", "#d4e4f6", "#172136"], ["#2c3d5c", "#6f8bb0", "#d4e4f6", "#172136"]],
  brows: [
    [[6, -22], [26, -27], [46, -23]],
    [[-13, -22], [-30, -26], [-46, -21]],
  ],
  mouth: [-10, 44, 8, 12], lip: "#a45b66", hideNear: true,
};

function eyepatch(b: B): void {
  const cx = 24, cy = -2;
  // 끈
  b.add(S("M44 -8L60 -10M8 -14L-6 -40", "#fbfbfd", 3.6), S("M44 -8L60 -10M8 -14L-6 -40", "#9aa3b8", 1, ` stroke-dasharray="2 2"`));
  // 레이스 가장자리(물결)
  let sc = "";
  const N = 18;
  const pts: Pt[] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const x = cx + Math.cos(a) * 23, y = cy + Math.sin(a) * 18;
    pts.push([x, y]);
    sc += `<circle cx="${f(x)}" cy="${f(y)}" r="3.6"/>`;
  }
  b.add(`<g fill="#fbfbfd" stroke="#9aa3b8" stroke-width="1.1">${sc}</g>`);
  b.add(P(sp(pts.map((p) => [cx + (p[0] - cx) * 1.02, cy + (p[1] - cy) * 1.02] as Pt)), "#fdfdff", "#9aa3b8", 1.4));
  b.add(P(sp(pts.map((p) => [cx + (p[0] - cx) * 0.8 + 3, cy + (p[1] - cy) * 0.8 + 3] as Pt)), "#e3e8f2", undefined, 0, op(0.7)));
  // 레이스 무늬(꽃)
  let fl = "";
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    fl += `<ellipse cx="${f(cx + Math.cos(a) * 7)}" cy="${f(cy + Math.sin(a) * 6)}" rx="3" ry="2.2" transform="rotate(${f((a * 180) / Math.PI)} ${f(cx + Math.cos(a) * 7)} ${f(cy + Math.sin(a) * 6)})"/>`;
  }
  b.add(`<g fill="none" stroke="#aeb6ca" stroke-width="1">${fl}<circle cx="${cx}" cy="${cy}" r="2.4"/><circle cx="${cx}" cy="${cy}" r="14"/></g>`);
  b.add(S(`M${cx - 16} ${cy + 9}q4 3 8 1M${cx + 12} ${cy + 11}q4-1 6-4`, "#aeb6ca", 1, op(0.8)));
}

function sianHead(b: B, ex: Ex): void {
  const H = S_HAIR, fc = FC_S;
  b.add(P(sp([[-8, -100], [42, -94], [68, -66], [74, -24], [74, 20], [70, 58, 1], [52, 48], [36, 40], [-40, 44], [-58, 58, 1], [-68, 20], [-70, -24], [-52, -76]]), H.s, H.l, 2));
  hairLocks(b, [[[[-50, -56], [-62, -20], [-63, 20], [-58, 56]], 22]], H);
  faceBase(b, fc, FACE_SLIM, [[47, -6], [56, -10], [62, 2], [61, 16], [55, 28], [47, 31]]);
  drawFace(b, fc, ex);
  eyepatch(b);
  const cap = b.def(sp([[-60, -14], [-64, -52], [-44, -86], [-6, -99], [36, -93], [62, -70], [70, -36], [64, -4], [48, -40], [0, -56], [-44, -44]]));
  b.add(`<use href="#${cap}" fill="${H.b}" stroke="${H.l}" stroke-width="2"/>`);
  const bangs = hairLocks(b, [
    [[[52, -60], [64, -24], [64, 16], [58, 50]], 22],
    [[[36, -84], [48, -56], [54, -26], [52, 6]], 24],
    [[[-36, -80], [-52, -50], [-58, -14], [-57, 20]], 24],
    [[[-20, -90], [-30, -60], [-36, -30], [-35, -8]], 22],
    [[[20, -92], [30, -62], [36, -34], [38, -10]], 24],
    [[[8, -94], [12, -62], [16, -36], [19, -16]], 18],
    [[[-2, -94], [-8, -62], [-12, -32], [-11, -6]], 22],
  ], H);
  b.add(P(sp([[-58, -44], [-50, -78], [-6, -99], [36, -93], [62, -70], [68, -44], [44, -68], [20, -76], [0, -78], [-22, -76], [-42, -64]]), H.b), S(sp([[-60, -40], [-50, -79], [-6, -100], [36, -94], [62, -71], [69, -42]], false), H.l, 2));
  sheen(b, "sh", [cap, ...bangs], gleam(6, -14, 58, 196, 338, 16, 26, 10), H.h);
  // 왼쪽(가까운 쪽) 가는 땋은 머리 + 푸른 구슬
  let br = "";
  for (let i = 0; i < 8; i++) {
    const y = -30 + i * 11, x = 57 + i * 0.6;
    const s = i % 2 ? 1 : -1;
    br += `<use href="#${b.id("bs")}" transform="translate(${f(x)} ${f(y)}) scale(${s} 1)"/>`;
  }
  b.defs.push(`<path id="${b.id("bs")}" d="${lock([[-5, -6], [0, 0], [5, 6]], 8, 2)}"/>`);
  b.add(`<g fill="${H.b}" stroke="${H.l}" stroke-width="1.4">${br}</g>`);
  b.add(P("M58 56l3 6-3 5-3-5Z", H.b, H.l, 1.2));
  b.add(`<circle cx="60.5" cy="72" r="5.4" fill="#3d7fd6" stroke="#173c78" stroke-width="1.4"/><circle cx="58.8" cy="70.2" r="1.8" fill="#dff0ff"/>`);
  drawBrows(b, fc, ex, 0.85);
}

function sian(b: B, ex: Ex): void {
  const R = ROBE, M = MANT;
  const TF = "translate(300 168) scale(1.1)";
  // 뒤로 늘어진 푸른 망토
  b.add(P(sp([[240, 270], [176, 300], [150, 380], [136, 520], [124, 700], [116, 1000, 1], [484, 1000, 1], [476, 700], [464, 520], [450, 380], [424, 300], [360, 270]]), M.s, M.l, 2.4));
  // 소매(넓은 소매, 손은 소매 안)
  const sleeve = (o: Pt[], sh: Pt[], cuff: Pt[], hole: Pt[]) => {
    b.add(P(sp(o), R.b, R.l, 2.4), P(sp(sh), R.s), P(sp(cuff), M.b, M.l, 2), P(sp(hole), "#9fb0cf", M.l, 1.6));
  };
  sleeve([[222, 276], [192, 296], [180, 340], [176, 420], [168, 520], [150, 640], [146, 690, 1], [226, 700, 1], [224, 600], [222, 500], [226, 420], [232, 330]],
    [[208, 310], [214, 400], [210, 500], [214, 600], [218, 698, 1], [196, 696, 1], [196, 600], [196, 500], [196, 400]],
    [[148, 662, 1], [226, 672, 1], [226, 700, 1], [146, 690, 1]],
    [[156, 690], [190, 686], [220, 698], [188, 706]]);
  // 로브 몸통
  b.add(P(sp([[262, 256], [226, 270], [210, 300], [214, 360], [224, 440], [226, 520], [216, 640], [204, 1000, 1], [402, 1000, 1], [392, 640], [382, 520], [384, 440], [392, 360], [398, 302], [378, 268], [338, 256]]), R.b, R.l, 2.4));
  b.add(P(sp([[350, 280], [384, 300], [390, 360], [380, 440], [382, 520], [392, 640], [400, 1000, 1], [364, 1000, 1], [362, 640], [352, 520], [356, 430], [356, 340]]), R.s));
  // 가운데 푸른 띠 + 은 장식
  b.add(P(sp([[282, 276, 1], [306, 276, 1], [312, 1000, 1], [280, 1000, 1]]), M.b, M.l, 2));
  b.add(S("M285 280L283 1000M303 280L309 1000", SILVER, 1.6));
  let dm = "";
  for (let i = 0; i < 6; i++) {
    const y = 330 + i * 70, x = 294.5 + i * 0.6;
    dm += `M${f(x)} ${y - 9}l6 9-6 9-6-9Z`;
  }
  b.add(P(dm, SILVER, "#6f7890", 1.2));
  // 허리 띠
  b.add(P(sp([[224, 500, 1], [384, 496, 1], [386, 520, 1], [224, 526, 1]]), M.b, M.l, 2), `<circle cx="296" cy="511" r="8" fill="${SILVER}" stroke="#6f7890" stroke-width="1.6"/><circle cx="296" cy="511" r="3.6" fill="#3d7fd6"/>`);
  // 가까운 소매
  sleeve([[378, 272], [410, 292], [422, 340], [428, 420], [436, 520], [452, 640], [458, 690, 1], [376, 700, 1], [378, 600], [380, 500], [378, 420], [372, 330]],
    [[406, 320], [414, 400], [420, 500], [434, 620], [456, 690, 1], [420, 696, 1], [412, 600], [406, 500], [400, 400]],
    [[378, 672, 1], [456, 662, 1], [458, 690, 1], [376, 700, 1]],
    [[384, 698], [414, 686], [448, 690], [416, 706]]);
  neck(b, FC_S, TF, [[-11, 48], [-9, 104], [24, 104], [26, 34]]);
  // 어깨 망토(케이프) + 높은 깃
  b.add(P(sp([[258, 258], [206, 272], [178, 302], [170, 350], [196, 366], [240, 370], [276, 340], [298, 300], [322, 340], [360, 370], [406, 366], [430, 350], [424, 300], [396, 270], [340, 256]]), M.b, M.l, 2.4));
  b.add(P(sp([[330, 290], [380, 282], [416, 300], [424, 348], [404, 362], [362, 364], [334, 336]]), M.s));
  b.add(S("M174 348Q220 376 272 344M324 344Q380 376 428 350", SILVER, 2.4));
  b.add(P(sp([[258, 280], [260, 240], [276, 232], [296, 244, 1], [316, 230], [334, 234], [340, 280], [298, 296]]), R.b, R.l, 2.2), P(sp([[324, 238], [336, 278], [300, 294], [316, 264]]), R.s));
  b.add(S("M262 246Q280 238 296 252Q314 236 336 240", "#3f66ad", 2.6));
  // 은사슬(가슴을 가로질러)
  b.add(S("M248 346Q298 392 350 346", "#6f7890", 3.4), S("M248 346Q298 392 350 346", SILVER, 2.2, ` stroke-dasharray="3.4 2"`));
  b.add(S("M240 362Q298 432 358 362", "#6f7890", 3.4), S("M240 362Q298 432 358 362", SILVER, 2.2, ` stroke-dasharray="3.4 2"`));
  b.add(`<circle cx="246" cy="348" r="6" fill="${SILVER}" stroke="#6f7890" stroke-width="1.4"/><circle cx="352" cy="348" r="6" fill="${SILVER}" stroke="#6f7890" stroke-width="1.4"/><path d="M299 388l7 10-7 10-7-10Z" fill="#3d7fd6" stroke="#173c78" stroke-width="1.4"/>`);
  b.add(`<g transform="${TF}">`);
  sianHead(b, ex);
  b.add(`</g>`);
}

// ───────────────────────── 재의 왕 ─────────────────────────
const A_HAIR: Tone = { b: "#efebe6", s: "#c3bcb5", l: "#7c746e", h: "#ffffff" };
const CLOAK: Tone = { b: "#3b3739", s: "#272426", l: "#121011", h: "#5c5759" };
const ASH_TF = "translate(300 170) scale(1.12)";

/** 재의 왕 몸(망토 + 긴 흰 머리 + 부서지는 재). 가면/맨얼굴 공통 */
function ashBody(b: B): void {
  const C = CLOAK, H = A_HAIR;
  // 긴 뒷머리(망토 뒤로)
  b.add(`<g transform="${ASH_TF}">`);
  hairLocks(b, [
    [[[-54, 0], [-78, 60], [-92, 160], [-100, 290]], 32, 0.3],
    [[[58, 0], [84, 66], [98, 170], [106, 300]], 34, 0.3],
    [[[-40, 0], [-64, 100], [-70, 220]], 30],
    [[[40, 0], [70, 110], [80, 240]], 30],
  ], H, "");
  b.add(`</g>`);
  // 망토: 넝마 가장자리
  const cl: Pt[] = [
    [262, 254], [338, 254],
    ...jag([[338, 254], [400, 266], [446, 296], [470, 350], [484, 450], [494, 600], [510, 800], [520, 1000]], 24, -8, 11),
    [300, 1000, 1],
    ...jag([[80, 1000], [92, 800], [106, 600], [116, 450], [128, 350], [152, 296], [200, 266], [262, 254]], 24, -8, 13),
  ];
  b.add(P(sp(cl), C.b, C.l, 2.4));
  b.add(P(sp([[360, 290], [420, 300], [452, 350], [466, 450], [476, 600], [490, 800], [500, 1000, 1], [430, 1000, 1], [424, 800], [416, 600], [400, 450], [384, 350]]), C.s));
  b.add(S("M190 400Q182 600 170 1000M240 420Q236 640 232 1000M354 430Q362 660 370 1000M430 440Q440 640 452 1000", C.l, 1.8, op(0.7)));
  b.add(S("M200 410Q194 600 184 1000M250 430Q248 640 246 1000", C.h, 1.4, op(0.5)));
  // 안쪽 옷(가운데 틈)
  b.add(P(sp([[276, 272], [320, 272], [332, 500], [340, 1000, 1], [262, 1000, 1], [268, 500]]), "#18161a", C.l, 1.6));
  // 어깨 넝마 덧망토
  const cape: Pt[] = [
    [250, 258], [300, 276], [350, 258],
    ...jag([[350, 258], [420, 272], [466, 310], [480, 370]], 10, -6, 17),
    ...jag([[480, 370], [420, 380], [360, 360], [300, 340], [240, 360], [180, 380], [122, 370]], 26, -16, 19),
    ...jag([[122, 370], [134, 310], [180, 272], [250, 258]], 10, -6, 23),
  ];
  b.add(P(sp(cape), "#4a4547", C.l, 2.2));
  b.add(P(sp([[340, 290], [410, 290], [456, 320], [470, 368, 1], [420, 372], [370, 352], [336, 330]]), "#353133"));
  b.add(S("M160 330l8 30M210 300l6 36M400 300l-4 36M440 318l-8 30", C.h, 1.6, op(0.7)));
  // 부서진 재 조각(가장자리, 정지)
  const r = rnd(31);
  let fl = "";
  for (let i = 0; i < 16; i++) {
    const side = i % 2 ? 1 : -1;
    const y = 320 + r() * 560;
    const x = 300 + side * (178 + (y - 320) * 0.07 + r() * 16);
    const s = 2 + r() * 4;
    fl += `M${f(x)} ${f(y)}l${f(s)} ${f(-s * 0.6)} ${f(s * 0.5)} ${f(s)} ${f(-s)} ${f(s * 0.4)}Z`;
  }
  b.add(P(fl, "#6a6567", undefined, 0, op(0.85)));
  // 앞으로 흘러내린 긴 머리(어깨 위)
  b.add(`<g transform="${ASH_TF}">`);
  hairLocks(b, [
    [[[-56, -20], [-72, 46], [-92, 110], [-98, 200], [-110, 290]], 30, 0.3],
    [[[-50, 10], [-62, 80], [-70, 150], [-66, 220]], 16],
    [[[60, -20], [78, 46], [100, 116], [106, 206], [118, 296]], 32, 0.3],
    [[[54, 20], [70, 90], [80, 170], [76, 236]], 16],
    [[[-60, 30], [-84, 90], [-80, 140], [-92, 190]], 10],
    [[[64, 30], [90, 96], [86, 150], [98, 206]], 10],
    [[[-48, 40], [-56, 100], [-48, 150]], 8],
  ], H);
  // 흐트러진 잔머리(정수리 실루엣)
  hairLocks(b, [
    [[[-40, -84], [-62, -88], [-78, -78]], 8],
    [[[44, -82], [66, -84], [82, -70]], 8],
    [[[-56, -60], [-76, -52], [-88, -34]], 7],
  ], H);
  b.add(`</g>`);
}

/** 떠오르는 재 조각(애니메이션) */
function ashFlakes(b: B): string {
  const r = rnd(5);
  let s = "";
  for (let i = 0; i < 11; i++) {
    const side = i % 2 ? 1 : -1, y = 260 + r() * 560;
    const x = 300 + side * (150 + (y - 260) * 0.09 + r() * 30);
    const sz = 2.5 + r() * 3.5;
    s += `<path class="${b.p}fl" style="animation-delay:-${f(r() * 7)}s;animation-duration:${f(6 + r() * 4)}s" d="M${f(x)} ${f(y)}l${f(sz)} ${f(-sz * 0.5)} ${f(sz * 0.4)} ${f(sz)} ${f(-sz)} ${f(sz * 0.3)}Z" fill="${i % 3 ? "#8a8784" : "#c9c4bc"}"/>`;
  }
  return s;
}

const ashStyle = (p: string): string =>
  `<style>.${p}fl{transform-box:fill-box;transform-origin:center;animation:${p}up 8s linear infinite}.${p}gw{animation:${p}gw 3.4s ease-in-out infinite}` +
  `@keyframes ${p}up{0%{transform:translate(0,0) rotate(0);opacity:0}15%{opacity:.9}100%{transform:translate(14px,-150px) rotate(160deg);opacity:0}}` +
  `@keyframes ${p}gw{0%,100%{opacity:1}50%{opacity:.55}}` +
  `@media (prefers-reduced-motion:reduce){.${p}fl,.${p}gw{animation:none}.${p}fl{opacity:.6}}</style>`;

interface MaskEx { rot: number; dy: number; g: number; gr: number; tear?: boolean; flick?: boolean }
const MASK_EX: Record<string, MaskEx> = {
  normal: { rot: 0, dy: 0, g: 0.6, gr: 1 },
  smile: { rot: -5, dy: 0, g: 0.75, gr: 1.05 },
  sad: { rot: 6, dy: 3, g: 0.35, gr: 0.9 },
  angry: { rot: -2, dy: -1, g: 1, gr: 0.7 },
  surprise: { rot: -1, dy: -2, g: 0.95, gr: 1.35 },
  serious: { rot: 2, dy: 1, g: 0.7, gr: 0.85 },
  tender: { rot: -8, dy: 1, g: 0.8, gr: 1.15 },
  pain: { rot: 9, dy: 3, g: 0.5, gr: 0.8, flick: true },
  smirk: { rot: -4, dy: 0, g: 0.85, gr: 0.9 },
  cry: { rot: 5, dy: 3, g: 0.45, gr: 1, tear: true },
};

function ashMask(b: B, expr: string): void {
  const m0 = MASK_EX[expr] ?? MASK_EX.normal;
  const m = { ...m0, g: Math.min(1, m0.g * 1.25 + 0.1) };
  const out: Pt[] = FACE_SLIM.map((p) => [p[0] * 1.05, p[1] * 1.04 + 1, p[2] ?? 0] as Pt);
  b.add(`<g transform="translate(0 ${m.dy}) rotate(${m.rot} 0 10)">`);
  // 가면 뒤 그림자
  b.add(P(sp(out.map((p) => [p[0] + 4, p[1] + 3, p[2] ?? 0] as Pt)), "#1a1718"));
  const mid = b.def(sp(out));
  b.add(`<use href="#${mid}" fill="#f5f2ec" stroke="#80786f" stroke-width="2.2"/>`);
  const mc = b.clip("mc", `<use href="#${mid}"/>`);
  b.add(`<g clip-path="${mc}">${P(sp([[38, -70], [46, -20], [42, 12], [30, 34], [8, 56], [70, 70, 1], [70, -70, 1]]), "#d7d1c9")}${P(sp([[-9, 6], [-16, 24], [-10, 28], [-6, 16]]), "#dcd6ce")}</g>`);
  b.add(S("M-9 6Q-14 18-16 25L-11 28", "#a79f96", 1.4), S("M-19 45Q-10 47 3 43", "#a79f96", 1.3, op(0.8)));
  // 눈구멍 + 잿빛 빛
  const holes: Pt[][] = [
    [[5, 1, 1], [14, -9], [28, -12], [40, -6, 1], [30, 5], [16, 6]],
    [[-15, 1, 1], [-25, -9], [-37, -9], [-44, -3, 1], [-35, 5], [-23, 5]],
  ];
  const gg = b.rgb("gg", [[0, "#ffffff", m.g], [0.25, "#e6e1d8", m.g * 0.9], [0.6, "#9c968e", m.g * 0.5], [1, "#2a2729", 0]]);
  holes.forEach((h, i) => {
    const hd = sp(h);
    const hc = b.clip("h" + i, `<path d="${hd}"/>`);
    const cx = i ? -30 : 22, cy = -2;
    b.add(P(hd, "#131113"), `<ellipse clip-path="${hc}"${m.flick ? ` class="${b.p}gw"` : ""} cx="${cx}" cy="${cy}" rx="${f((i ? 11 : 14) * m.gr)}" ry="${f(8 * m.gr)}" fill="${gg}"/>`, P(hd, "none", "#4a4442", 1.6));
  });
  // 금
  b.add(S("M30 -64L24 -46 30 -36 22 -22 26 -12M24 -46l8-4M-38 6L-34 20-42 32-36 44-28 58M-34 20l-8 2M-42 32l6 4", "#4f4844", 1.3));
  if (m.tear) b.add(S("M20 6L22 16 17 26 21 36 16 48 19 58", "#1d1a1a", 2.4), S("M22 16l4 3M17 26l-3 3", "#1d1a1a", 1.2));
  b.add(`</g>`);
}

function ashking(b: B, _ex: Ex, expr: string): void {
  ashBody(b);
  b.add(`<g transform="${ASH_TF}">`);
  eliosHead(b, EXPR.normal, { hair: A_HAIR, fc: FC_E, ash: true, face: () => ashMask(b, expr) });
  b.add(`</g>`);
  b.add(ashFlakes(b));
}

const FC_A: Face = {
  skin: "#efe6e0", skinSh: "#cfc2bc", skinLine: "#8f807b", blush: "#d99a98",
  lash: "#2a2426", brow: "#a9a19b", browW: 4.6,
  eyes: [
    { ix: 6, iy: 2, ox: 41, oy: -3, h: 13.6, rx: 9.6, ry: 12.4, u: 0.44 },
    { ix: -16, iy: 2, ox: -42, oy: -2.5, h: 13, rx: 7.6, ry: 12, u: 0.45 },
  ],
  iris: [["#4e3a3c", "#8c7a7a", "#d8cfcc", "#2a2222"], ["#44403f", "#858180", "#d4d0cc", "#282525"]],
  brows: BROWS,
  mouth: [-10, 44, 8, 12], lip: "#8a6664", dull: true,
};

function ashkingBare(b: B, ex: Ex): void {
  ashBody(b);
  neck(b, FC_A, ASH_TF);
  b.add(P(sp([[262, 254], [300, 270], [338, 254], [330, 290], [270, 290]]), "#18161a", CLOAK.l, 1.6));
  b.add(`<g transform="${ASH_TF}">`);
  // 목의 재 균열
  b.add(S("M10 70l6 10-4 9 7 12M16 80l6-2M-4 84l5 8", "#6a605c", 1.2, op(0.9)));
  const gaunt = `${P(sp([[-49, 10], [-40, 22], [-44, 36], [-50, 30]]), "#cfc2bc")}${P(sp([[44, 8], [30, 20], [22, 36], [34, 34], [46, 22]]), "#cfc2bc")}${S("M-4 30Q-2 38-6 42M24 30Q22 40 14 46", "#a8988f", 1.2, op(0.8))}`;
  eliosHead(b, ex, {
    hair: A_HAIR, fc: FC_A, ash: true, shade: gaunt,
    after: () => {
      // 눈 밑 그늘 + 뺨 균열
      b.add(S("M10 12Q24 17 38 10M-18 12Q-28 16-39 11M14 16Q24 20 34 15", "#9a8a82", 1.2, op(0.75)));
      b.add(S("M34 16l5 8-3 7 6 9M39 24l6-1M-40 24l-4 8 3 6", "#6a605c", 1.2, op(0.85)));
    },
  });
  b.add(`</g>`);
  b.add(ashFlakes(b));
}

// ───────────────────────── 조립 ─────────────────────────
type Draw = (b: B, ex: Ex, expr: string) => void;
interface CharDef { draw: Draw; fade: [number, number]; tweak?: Partial<Record<string, Partial<Ex>>>; style?: (p: string) => string }

const DEFS: Record<string, CharDef> = {
  elios: {
    draw: elios,
    fade: [690, 930],
    tweak: { normal: { o: 0.9, lo: 0.12 }, smile: { m: "soft", o: 0.82 } },
  },
  razel: {
    draw: razel,
    fade: [700, 940],
    tweak: { normal: { m: "smile", lo: 0.15, o: 0.95 }, smile: { m: "grin", o: 0.7, lo: 0.5, bl: 0.2 }, smirk: { m: "smirk" } },
  },
  sian: {
    draw: sian,
    fade: [700, 940],
    tweak: { normal: { m: "smile", o: 0.8, lo: 0.36 }, smile: { m: "soft", o: 0.66, lo: 0.52, t: -0.25 }, serious: { m: "flat" } },
  },
  ashking: { draw: ashking, fade: [680, 940], style: ashStyle },
  ashking_bare: {
    draw: ashkingBare,
    fade: [680, 940],
    style: ashStyle,
    tweak: { normal: { o: 0.74, lo: 0.2, t: -0.2, m: "flat" }, smile: { m: "soft", o: 0.66, t: -0.35 }, tender: { o: 0.66 } },
  },
};

function render(id: string, expr: string): string {
  const c = DEFS[id];
  const key = EXPR[expr] ? expr : "normal";
  const ex: Ex = { ...EXPR[key], ...(c.tweak?.[key] ?? {}) };
  const b = new B(`ch-${id}-${key}-`);
  c.draw(b, ex, key);
  return finish(b, c.fade, c.style ? c.style(b.p) : "");
}

export const CHARS_A: Record<string, (expr: string) => string> = Object.fromEntries(
  Object.keys(DEFS).map((id) => [id, (expr: string) => render(id, expr)]),
);
