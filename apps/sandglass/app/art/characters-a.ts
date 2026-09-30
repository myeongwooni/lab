// 스탠딩 A — 엘리오스·라젤·시안·재의 왕(가면/맨얼굴). TV 애니메이션 설정화풍 셀 셰이딩.
// viewBox 0 0 600 1000, 몸은 관객 기준 왼쪽을 향한 3/4 자세. 표정마다 얼굴만 바뀝니다.
// 모든 id/클래스는 `ch-<id>-<expr>-` 접두어(같은 인물의 두 표정이 교차 페이드해도 충돌 없음).

type Pt = [number, number] | [number, number, number]; // 세 번째 값 1 = 모서리

const f = (n: number): string => {
  const v = Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
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
    const bid = b.id("bl");
    b.defs.push(`<radialGradient id="${bid}"><stop offset="0" stop-color="${fc.blush}" stop-opacity="${ex.bl}"/><stop offset="1" stop-color="${fc.blush}" stop-opacity="0"/></radialGradient>`);
    const bg = `url(#${bid})`;
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
interface Tone { b: string; s: string; l: string; h?: string }

/** 가닥 목록 → 그림(그림자 사본 + 본색 + 외곽선). 반환: 가닥 id 목록(마스크용) */
function hairLocks(b: B, list: [Pt[], number, number?][], t: Tone, off = "2.5 2", w = 2): string[] {
  const ids: string[] = [];
  for (const [c, wd, bu] of list) {
    const id = b.def(lock(c, wd, 1, bu ?? 0.5));
    ids.push(id);
    b.add(`<use href="#${id}" fill="${t.s}" transform="translate(${off})"/><use href="#${id}" fill="${t.b}" stroke="${t.l}" stroke-width="${w}"/>`);
  }
  return ids;
}

/** 머리 광택 띠: 가닥들 모양으로 가린 띠 */
function sheen(b: B, name: string, ids: string[], d: string, col: string, o = 1): void {
  const m = b.mask(name, ids.map((id) => `<use href="#${id}" fill="#fff"/>`).join(""));
  b.add(`<path d="${d}" fill="${col}" mask="${m}"${op(o)}/>`);
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

function faceBase(b: B, fc: Face, outline: Pt[], earPts: Pt[] | null, neck: Pt[], extraShade = ""): string {
  // 목
  b.add(P(sp(neck), fc.skin, fc.skinLine, 2));
  b.add(P(sp([[-12, 58], [4, 56], [26, 44], [27, 34], [26, 84], [-10, 78]]), fc.skinSh));
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
const E_HAIR: Tone = { b: "#2a2839", s: "#15141f", l: "#0a0910", h: "#5b6190" };
const E_COAT: Tone = { b: "#2d3858", s: "#1c2340", l: "#0e1328", h: "#4a5a86" };
const GLOVE: Tone = { b: "#23222b", s: "#131218", l: "#08080b", h: "#555466" };
const SHIRT: Tone = { b: "#f7f7fc", s: "#cdd1e2", l: "#7d839c" };

const EYE_NEAR: EyeG = { ix: 6, iy: 2, ox: 40, oy: -3, h: 13.5, rx: 9.6, ry: 12.2, u: 0.44 };
const EYE_FAR: EyeG = { ix: -16, iy: 2, ox: -42, oy: -2.5, h: 12.8, rx: 7.6, ry: 11.6, u: 0.45 };
const BROWS: [Pt, Pt, Pt][] = [
  [[6, -21], [26, -26.5], [47, -22]],
  [[-14, -21], [-31, -25], [-47, -20]],
];
const IRIS_RED: Iris = ["#5e0b18", "#c3243a", "#ff8f86", "#2a0409"];
const IRIS_GOLD: Iris = ["#7a4a06", "#d9a21e", "#fff0a0", "#3a2104"];

function eliosHead(b: B, ex: Ex, o: { hair: Tone; fc: Face; bare?: boolean }): void {
  const { hair: H, fc } = o;
  // 뒷머리
  b.add(P(sp([[-10, -100], [40, -94], [68, -66], [78, -20], [80, 30], [86, 92, 1], [68, 76], [64, 106, 1], [48, 72], [30, 44], [-30, 50], [-46, 72], [-58, 104, 1], [-60, 66], [-70, 96, 1], [-72, 40], [-68, -20], [-52, -76]]), H.s, H.l, 2));
  // 먼 쪽/가까운 쪽 옆머리(얼굴 뒤)
  hairLocks(b, [
    [[[-50, -56], [-62, -18], [-63, 30], [-58, 70], [-62, 98]], 22],
    [[[58, -48], [68, -8], [70, 40], [66, 90]], 20],
    [[[46, -40], [58, 0], [60, 46], [54, 84]], 16],
  ], H);
  faceBase(b, fc, FACE_SLIM,
    [[47, -6], [56, -12], [70, -28, 1], [66, -8], [63, 10], [58, 26], [47, 31]],
    [[-12, 48], [-10, 110], [25, 110], [27, 34]]);
  drawFace(b, fc, ex);
  // 윗머리 덩어리
  const cap = b.def(sp([[-60, -14], [-64, -52], [-44, -86], [-6, -99], [36, -93], [62, -70], [70, -36], [64, -4], [48, -40], [0, -56], [-44, -44]]));
  b.add(`<use href="#${cap}" fill="${H.b}" stroke="${H.l}" stroke-width="2"/>`);
  // 뿔
  const horn = (c: Pt[], w: number) => {
    const d = lock(c, w, 1, 0.2);
    b.add(P(d, "#1d1b26", "#07070a", 1.8));
    b.add(S(sp([c[0], c[1], c[2]].map((p) => [p[0] - 1.8, p[1]] as Pt), false), "#5d5a74", 1.6, op(0.9)));
  };
  horn([[-36, -80], [-40, -93], [-37, -104], [-31, -112]], 12);
  horn([[26, -86], [31, -99], [29, -110], [23, -118]], 11);
  // 앞머리
  const bangs = hairLocks(b, [
    [[[40, -84], [50, -58], [55, -28], [52, 2]], 24],
    [[[-40, -76], [-53, -44], [-58, -8], [-56, 26]], 22],
    [[[26, -88], [32, -60], [38, -34], [37, -6]], 22],
    [[[-28, -84], [-38, -52], [-42, -22], [-40, 6]], 22],
    [[[12, -90], [15, -60], [18, -32], [15, -10]], 22],
    [[[-14, -90], [-22, -58], [-26, -28], [-22, -2]], 22],
    [[[0, -92], [-4, -60], [-6, -28], [-2, 8]], 20],
  ], H);
  b.add(P(sp([[-58, -44], [-50, -78], [-6, -99], [36, -93], [62, -70], [68, -44], [44, -68], [20, -76], [0, -78], [-22, -76], [-42, -64]]), H.b), S(sp([[-60, -40], [-50, -79], [-6, -100], [36, -94], [62, -71], [69, -42]], false), H.l, 2));
  sheen(b, "sh", [cap, ...bangs], band(-58, 64, -62, 10, 14, 14), H.h!);
  // 흰 가닥(인물의 오른쪽 = 관객 왼쪽 앞머리)
  if (!o.bare) {
    const W: Tone = { b: "#eef0f8", s: "#b6bbd0", l: "#6f7590" };
    hairLocks(b, [
      [[[-30, -82], [-40, -50], [-45, -20], [-44, 2]], 7],
      [[[-24, -84], [-32, -52], [-36, -24], [-34, -4]], 6],
      [[[-37, -78], [-49, -46], [-53, -14], [-52, 12]], 6],
    ], W, "1 1", 1.4);
  }
  drawBrows(b, fc, ex, 0.9);
}

function elios(b: B, ex: Ex): void {
  const C = E_COAT;
  // 등 뒤 깃 안감
  b.add(P(sp([[266, 238], [300, 224], [338, 226], [346, 270], [266, 268]]), "#141a30"));
  // 묶은 머리(어깨 너머)
  // 먼 팔
  b.add(P(sp([[232, 268], [206, 280], [192, 306], [186, 370], [184, 460], [182, 560], [183, 640, 1], [224, 644, 1], [225, 560], [227, 460], [230, 370], [236, 318]]), C.b, C.l, 2.4));
  b.add(P(sp([[214, 300], [222, 360], [220, 460], [220, 560], [223, 642, 1], [206, 641, 1], [206, 560], [206, 460], [208, 380]]), C.s));
  b.add(P(sp([[183, 610, 1], [225, 614, 1], [224, 644, 1], [183, 640, 1]]), C.s, C.l, 2), S("M184 613 224 617", "#d9a94a", 2));
  b.add(P(sp([[188, 640], [222, 644], [224, 674], [217, 702], [206, 716], [195, 712], [187, 690], [185, 662]]), GLOVE.b, GLOVE.l, 2));
  b.add(S("M196 690q2 12 7 20M207 688q2 12 3 22", GLOVE.h, 1.3, op(0.8)));
  // 몸통
  b.add(P(sp([[262, 252], [230, 264], [214, 290], [216, 350], [224, 430], [226, 500], [220, 600], [212, 1000, 1], [400, 1000, 1], [392, 600], [384, 500], [384, 430], [390, 350], [396, 296], [372, 264], [336, 252]]), C.b, C.l, 2.4));
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
  b.add(P(sp([[366, 258], [398, 272], [420, 296], [430, 356], [432, 460], [434, 560], [438, 632, 1], [396, 640, 1], [394, 560], [392, 460], [388, 380], [384, 320], [376, 288]]), C.b, C.l, 2.4));
  b.add(P(sp([[406, 290], [424, 330], [430, 420], [432, 520], [437, 632, 1], [418, 634, 1], [414, 540], [412, 440], [410, 350]]), C.s));
  b.add(S("M390 330Q396 420 396 520", C.h, 1.6, op(0.6)));
  b.add(P(sp([[395, 606, 1], [436, 600, 1], [438, 632, 1], [396, 640, 1]]), C.s, C.l, 2), S("M396 610 436 604", "#d9a94a", 2));
  b.add(P(sp([[400, 636], [438, 632], [442, 666], [435, 698], [424, 720], [411, 722], [402, 704], [397, 668]]), GLOVE.b, GLOVE.l, 2));
  b.add(P(sp([[402, 646], [389, 668], [391, 688], [402, 686], [406, 666]]), GLOVE.b, GLOVE.l, 1.8));
  b.add(S("M414 692q2 14 5 24M425 688q1 14 2 24", GLOVE.h, 1.3, op(0.8)));
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
  b.add(`<g transform="translate(300 168)">`);
  const fc: Face = {
    ...SKIN_PALE, lash: "#1a1420", brow: "#221e2c", browW: 5.6,
    eyes: [EYE_NEAR, EYE_FAR], iris: [IRIS_RED, IRIS_GOLD], brows: BROWS,
    mouth: [-10, 44, 8, 12], lip: "#a45b5e",
  };
  eliosHead(b, ex, { hair: E_HAIR, fc });
  b.add(`</g>`);
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
