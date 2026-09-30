// 스탠딩(B조) — 리리, 토비, 세실리아, 아델하르트, 무면, 헤르만.
// TV 애니메이션 설정화 풍: 색마다 가장 어두운 톤의 외곽선, 2단 셀 음영, 큰 눈(그라데이션 홍채 + 하이라이트 2개),
// 머리카락 광택 띠. viewBox 0 0 600 1000, 몸은 관객 기준 왼쪽을 향한 3/4 자세, 허벅지에서 투명하게 사라진다.
// 몸은 표정과 무관하게 같고 얼굴만 바뀐다. 모든 id는 `ch-<id>-<expr>-` 접두어.

type Pt = [number, number] | [number, number, number]; // 세 번째 값 1 = 모서리

const f = (n: number): string => {
  const v = Math.abs(n) >= 12 ? Math.round(n) : Math.round(n * 10) / 10;
  return Object.is(v, -0) ? "0" : String(v);
};

/** Catmull-Rom → 3차 베지어. 모서리 표시 점은 접선 0. */
function sp(pts: Pt[], closed = true): string {
  const n = pts.length;
  const g = (i: number): Pt => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    const t1 = p1[2] ? 0 : 1 / 6, t2 = p2[2] ? 0 : 1 / 6;
    d += `C${f(p1[0] + (p2[0] - p0[0]) * t1)} ${f(p1[1] + (p2[1] - p0[1]) * t1)} ${f(p2[0] - (p3[0] - p1[0]) * t2)} ${f(p2[1] - (p3[1] - p1[1]) * t2)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return closed ? d + "Z" : d;
}

/** 스플라인 위의 점들 */
function samp(c: Pt[], per: number): [number, number][] {
  const n = c.length, out: [number, number][] = [];
  const g = (i: number) => c[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < n - 1; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    for (let j = 0; j < per; j++) {
      const t = j / per, t2 = t * t, t3 = t2 * t;
      const q = (k: 0 | 1) => 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t3);
      out.push([q(0), q(1)]);
    }
  }
  out.push([c[n - 1][0], c[n - 1][1]]);
  return out;
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

/** 털 뭉치(꼬리): 중심선 + 굵기 윤곽 + 바깥으로 튀는 털끝 */
function fur(c: Pt[], W: number, tuft: number): string {
  const s = samp(c, 5), n = s.length;
  const L: Pt[] = [], R: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = s[Math.max(0, i - 1)], b = s[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const len = Math.hypot(tx, ty) || 1;
    tx /= len; ty /= len;
    const t = i / (n - 1);
    const hw = (W / 2) * Math.pow(Math.sin(Math.PI * Math.min(1, 0.18 + t * 0.9)), 0.8) + 4;
    const k = i % 3 === 1 && i < n - 2 ? tuft : 0;
    L.push([s[i][0] - ty * (hw + k), s[i][1] + tx * (hw + k), k ? 1 : 0]);
    R.push([s[i][0] + ty * (hw + k * 0.8), s[i][1] - tx * (hw + k * 0.8), k ? 1 : 0]);
  }
  return sp([...L.slice(0, n - 1), [s[n - 1][0], s[n - 1][1], 1], ...R.slice(0, n - 1).reverse()]);
}

/** 곡선을 따라가는 광택 띠(아랫변 톱니) */
function band(x0: number, x1: number, yc: number, curve: number, th: number, n: number, slope = 0): string {
  const xm = (x0 + x1) / 2, hw = (x1 - x0) / 2;
  const top: Pt[] = [], bot: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const y = yc + curve * ((x - xm) / hw) ** 2 + slope * (x - xm);
    const k = Math.pow(Math.sin((Math.PI * i) / n), 0.6);
    top.push([x, y, i === 0 || i === n ? 1 : 0]);
    if (i > 0 && i < n) bot.push([x + (i % 2 ? 2 : 0), y + th * k * (i % 2 ? 2 : 0.7), i % 2]);
  }
  return sp([...top, ...bot.reverse()]);
}

/** 사인 물결 중심선(곱슬) */
function wave(x0: number, y0: number, x1: number, y1: number, amp: number, n: number, ph = 0): Pt[] {
  const out: Pt[] = [];
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = Math.sin(t * Math.PI * 2 * (n / 4) + ph) * amp * (0.4 + t);
    out.push([x0 + dx * t + nx * a, y0 + dy * t + ny * a]);
  }
  return out;
}

// ───────────────────────── 빌더 ─────────────────────────
type Pal = { b: string; s: string; l: string; h?: string };

class B {
  defs: string[] = [];
  out: string[] = [];
  n = 0;
  p: string;
  constructor(p: string) {
    this.p = p;
  }
  id(s: string): string {
    return `${this.p}-${s}`;
  }
  add(s: string): void {
    this.out.push(s);
  }
  def(d: string, tf = ""): string {
    const id = this.id("p" + this.n++);
    this.defs.push(`<path id="${id}" d="${d}"${tf ? ` transform="${tf}"` : ""}/>`);
    return id;
  }
  clipIds(ids: string[]): string {
    const c = this.id("c" + this.n++);
    this.defs.push(`<clipPath id="${c}">${ids.map((i) => `<use href="#${i}"/>`).join("")}</clipPath>`);
    return `url(#${c})`;
  }
  /** 도형 안쪽에 겹쳐 칠하기(셀 음영). inner는 tf 좌표계 */
  inside(ids: string[], tf: string, inner: string): void {
    this.add(`<g clip-path="${this.clipIds(ids)}">${tf ? `<g transform="${tf}">${inner}</g>` : inner}</g>`);
  }
  /** 외곽선 + 2단 셀 음영 부위 */
  pc(d: string, P: Pal, sh = "", tf = "", w = 2.4, hi = ""): string {
    const id = this.def(d, tf);
    const sw = w === 2.4 ? "" : ` stroke-width="${w}"`;
    if (!sh && !hi) {
      this.add(`<use href="#${id}" fill="${P.b}" stroke="${P.l}"${sw}/>`);
      return id;
    }
    this.add(`<use href="#${id}" fill="${P.b}"/>`);
    this.inside([id], tf, (sh ? `<path d="${sh}" fill="${P.s}"/>` : "") + (hi ? `<path d="${hi}" fill="${P.h}"/>` : ""));
    this.add(`<use href="#${id}" fill="none" stroke="${P.l}"${sw}/>`);
    return id;
  }
  /** 음영 없는 부위(참조 없이 바로) */
  pi(d: string, P: Pal, tf = "", w = 2.4): void {
    this.add(`<path d="${d}" fill="${P.b}" stroke="${P.l}"${w === 2.4 ? "" : ` stroke-width="${w}"`}${tf ? ` transform="${tf}"` : ""}/>`);
  }
  lines(ids: string[], col: string, w = 2.4): void {
    this.add(ids.map((i) => `<use href="#${i}" fill="none" stroke="${col}"${w === 2.4 ? "" : ` stroke-width="${w}"`}/>`).join(""));
  }
  g(tf: string, s: string): void {
    this.add(`<g transform="${tf}">${s}</g>`);
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
}

const pa = (d: string, fill: string, extra = ""): string => `<path d="${d}" fill="${fill}"${extra}/>`;
const ln = (d: string, col: string, w: number, extra = ""): string => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(w)}"${extra}/>`;
const op = (o: number) => ` opacity="${o}"`;

// ───────────────────────── 표정 ─────────────────────────
interface Ex {
  o: number; // 윗눈꺼풀 열림
  t: number; // + 화남(안쪽 내려감) / - 슬픔(바깥 내려감)
  lo: number; // 아랫눈꺼풀 올라감
  pu: number; // 홍채 크기
  bi: number; // 눈썹 안쪽 dy
  bo: number; // 눈썹 바깥 dy
  bf: number; // 가까운 쪽 눈썹 추가 dy (비대칭)
  m: string; // 입
  bl: number; // 홍조
  tr: number; // 눈물 0/1(글썽)/2(흐름)
  arc?: boolean; // 웃어서 감은 눈
  hl?: number; // 하이라이트 세기(0 = 죽은 눈)
  dk?: number; // 눈가 그림자
  sw?: boolean; // 땀방울
  pin?: boolean; // 동공 수축
}

const EXPR: Record<string, Ex> = {
  normal: { o: 1, t: 0, lo: 0, pu: 1, bi: 0, bo: 0, bf: 0, m: "n", bl: 0.25, tr: 0 },
  smile: { o: 1, t: 0, lo: 0.3, pu: 1, bi: -3, bo: -1, bf: 0, m: "smile", bl: 0.5, tr: 0, arc: true },
  sad: { o: 0.78, t: -0.8, lo: 0.1, pu: 0.96, bi: -8, bo: 3, bf: 0, m: "sad", bl: 0.2, tr: 1 },
  angry: { o: 0.82, t: 1, lo: 0.16, pu: 0.84, bi: 8, bo: -5, bf: 0, m: "angry", bl: 0, tr: 0 },
  surprise: { o: 1.16, t: -0.1, lo: 0, pu: 0.74, bi: -10, bo: -8, bf: 0, m: "o", bl: 0.2, tr: 0, sw: true, pin: true },
  serious: { o: 0.8, t: 0.4, lo: 0.12, pu: 0.96, bi: 4, bo: 0, bf: 0, m: "flat", bl: 0, tr: 0 },
  tender: { o: 0.7, t: -0.35, lo: 0.3, pu: 1.02, bi: -4, bo: 1, bf: 0, m: "soft", bl: 0.65, tr: 0 },
  pain: { o: 0.42, t: -0.7, lo: 0.3, pu: 0.9, bi: -7, bo: 4, bf: 0, m: "grit", bl: 0.15, tr: 1, sw: true },
  smirk: { o: 0.7, t: 0.3, lo: 0.3, pu: 0.96, bi: 2, bo: 0, bf: -6, m: "smirk", bl: 0, tr: 0 },
  cry: { o: 0.74, t: -0.85, lo: 0.24, pu: 1, bi: -9, bo: 3, bf: 0, m: "cry", bl: 0.6, tr: 2 },
};

// ───────────────────────── 얼굴 ─────────────────────────
interface EyeG {
  x: number; // 안쪽 눈꼬리
  y: number;
  w: number;
  h: number;
  s: 1 | -1; // 바깥 방향
}
interface FS {
  eyes: [EyeG, EyeG]; // [가까운, 먼]
  brows: [Pt, Pt, number][];
  bw: number;
  bc: string;
  iris: [string, string, string]; // 어두운, 중간, 밝은
  pupil: string;
  lash: string;
  lw: number;
  fem?: boolean;
  mouth: [number, number]; // 입 중심
  lip: string;
  skin: Pal;
  blush: string;
  cheek: [number, number, number, number]; // 가까운 볼 x,y / 먼 볼 x,y
}

const OU = [-0.02, -0.38, -0.52, -0.46, -0.16];
const CU = [0.06, 0.22, 0.3, 0.26, 0.12];
const US = [0, 0.2, 0.5, 0.8, 1];

function drawEye(b: B, e: EyeG, ex: Ex, fs: FS, irisFill: string): string {
  const X = (u: number) => e.x + e.s * u * e.w;
  const Y = (v: number) => e.y + v * e.h;
  const t = ex.t;
  const lw = fs.lw;
  let s = "";
  if (ex.arc) {
    s += pa(lock([[X(-0.02), Y(0.14)], [X(0.25), Y(-0.2)], [X(0.6), Y(-0.24)], [X(1.04), Y(0.12)]], 5.2 * lw, 2), fs.lash);
    if (fs.fem) s += ln(`M${f(X(0.98))} ${f(Y(0.06))}L${f(X(1.16))} ${f(Y(-0.06))}`, fs.lash, 1.6);
    return s;
  }
  const vv = US.map((u, i) => {
    let v = CU[i] + (OU[i] - CU[i]) * ex.o;
    v += t > 0 ? t * 0.3 * (1 - u) : -t * 0.28 * u;
    return v;
  });
  const up: Pt[] = US.map((u, i) => [X(u), Y(vv[i]), i === 0 || i === 4 ? 1 : 0] as Pt);
  const low: Pt[] = [[X(0.8), Y(0.42 - ex.lo * 0.5)], [X(0.45), Y(0.5 - ex.lo * 0.55)], [X(0.14), Y(0.3 - ex.lo * 0.3)]];
  const open = sp([...up, ...low]);
  const cid = b.id("e" + b.n++);
  b.defs.push(`<clipPath id="${cid}"><path d="${open}"/></clipPath>`);
  s += pa(open, "#fdfcff");
  const cx = X(0.5), cy = Y(0.05);
  const rx = 0.3 * e.w * ex.pu, ry = 0.52 * e.h * ex.pu;
  const hl = ex.hl ?? 1;
  let g = `<g clip-path="url(#${cid})">`;
  g += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${irisFill}" stroke="${fs.iris[0]}" stroke-width="1.4"/>`;
  g += `<ellipse cx="${f(cx + 0.08 * rx)}" cy="${f(cy + 0.52 * ry)}" rx="${f(rx * 0.62)}" ry="${f(ry * 0.3)}" fill="${fs.iris[2]}"${op(0.55)}/>`;
  const pr = ex.pin ? 0.26 : 0.44;
  g += `<ellipse cx="${f(cx)}" cy="${f(cy - 0.02 * ry)}" rx="${f(rx * pr)}" ry="${f(ry * (pr + 0.06))}" fill="${fs.pupil}"/>`;
  // 윗눈꺼풀 그림자
  g += pa(sp([...up, ...up.slice(1, 4).reverse().map((p) => [p[0], p[1] + e.h * 0.24] as Pt)]), fs.iris[0], op(0.4));
  if (hl > 0) {
    g += `<ellipse cx="${f(cx - 0.4 * rx)}" cy="${f(cy - 0.36 * ry)}" rx="${f(rx * 0.34 * hl)}" ry="${f(ry * 0.25 * hl)}" fill="#fff" transform="rotate(-20 ${f(cx - 0.4 * rx)} ${f(cy - 0.36 * ry)})"/>`;
    g += `<circle cx="${f(cx + 0.38 * rx)}" cy="${f(cy + 0.42 * ry)}" r="${f(rx * 0.14 * hl)}" fill="#fff"/>`;
  }
  if (ex.tr) {
    g += ln(`M${f(X(0.12))} ${f(Y(0.3))}Q${f(cx)} ${f(Y(0.2))} ${f(X(0.9))} ${f(Y(0.3))}`, "#fff", 1.6, op(0.85));
    g += `<circle cx="${f(cx + 0.1 * rx)}" cy="${f(cy - 0.1 * ry)}" r="${f(rx * 0.1)}" fill="#fff"${op(0.9)}/>`;
  }
  g += "</g>";
  s += g;
  // 아래 속눈썹
  s += ln(sp([[X(0.5), Y(0.5 - ex.lo * 0.55) + 0.4], low[0], [X(0.96), Y(vv[4] + 0.1)]], false), fs.lash, 1.3 * lw, op(0.75));
  // 윗 속눈썹(초승달) + 꼬리
  const th = [0.6, 1.8, 2.8, 3.4, 3.0].map((v) => v * lw);
  const top: Pt[] = up.map((p, i) => [p[0], p[1] - th[i], 0] as Pt);
  const tip: Pt = [X(fs.fem ? 1.14 : 1.06), Y(vv[4] + (fs.fem ? 0.02 : 0.05)), 1];
  s += pa(sp([up[0], up[1], up[2], up[3], [up[4][0], up[4][1], 0], tip, top[3], top[2], top[1], [top[0][0], top[0][1], 1]]), fs.lash);
  if (fs.fem) {
    s += pa(lock([[X(0.8), top[3][1] + 1.5], [X(0.98), top[3][1] - 3], [X(1.1), top[3][1] - 4.5]], 3.2, 1), fs.lash);
    s += pa(lock([[X(0.92), Y(vv[4]) - 1], [X(1.08), Y(vv[4]) - 3.5], [X(1.18), Y(vv[4]) - 3]], 2.6, 1), fs.lash);
  }
  // 쌍꺼풀
  s += ln(sp([[X(0.28), top[1][1] - 3.5 + 0.1 * e.h * (1 - ex.o)], [X(0.6), top[2][1] - 3.6], [X(0.94), top[3][1] - 1.5]], false), fs.skin.l, 1.1, op(0.6));
  return s;
}

function drawBrow(br: [Pt, Pt, number], ex: Ex, fs: FS, near: boolean): string {
  const [I, O, a] = br;
  const dy = near ? ex.bf : 0;
  const dir = O[0] > I[0] ? 1 : -1;
  const pinch = ex.t > 0.5 ? 2.5 : 0;
  const i: Pt = [I[0] + dir * pinch, I[1] + ex.bi + dy];
  const o: Pt = [O[0], O[1] + ex.bo + dy];
  const m: Pt = [(I[0] + O[0]) / 2, (I[1] + O[1]) / 2 - a + (ex.bi + ex.bo) * 0.5 + dy - (ex.t < -0.5 ? 1.5 : 0)];
  return pa(lock([i, [I[0] + (O[0] - I[0]) * 0.22, i[1] + (m[1] - i[1]) * 0.6], m, o], fs.bw, 1, 0.9), fs.bc);
}

const MOUTH_DARK = "#7c2a38", TONGUE = "#e87c88";
function drawMouth(m: string, fs: FS): string {
  const c = fs.lip;
  const L = (d: string, w = 1.8) => ln(d, c, w);
  const O = (d: string, fill = MOUTH_DARK) => pa(d, fill, ` stroke="${c}" stroke-width="1.6"`);
  let s = "";
  switch (m) {
    case "smile":
      s += O("M-10 -2Q1 1.5 12 -3.5Q10 10 1 12Q-8 11 -10 -2Z");
      s += pa("M-5.5 8Q1 4.5 7.5 7.5Q4 11.4 1 11.5Q-3 11.2 -5.5 8Z", TONGUE);
      break;
    case "gap": // 앞니 빠진 웃음
      s += O("M-11 -2Q1 1.5 13 -4Q11 11 1 13Q-9 12 -11 -2Z");
      s += pa("M-10 -1.4Q1 2 12 -3.2L11.4 1Q1 4.6 -9.4 1.8Z", "#fff");
      s += pa("M-1.2 0.6L3.2 0.3L3 4.1L-1 4.4Z", MOUTH_DARK);
      s += pa("M-6 9Q1 5 8 8.5Q4 12.6 1 12.6Q-3 12.4 -6 9Z", TONGUE);
      break;
    case "sweet":
      s += L("M-11 -3Q-5 4 1 4Q8 4 13 -4", 1.9);
      s += L("M-12 -4.5L-10 -2.5M14 -5.5L12 -3.5", 1.2);
      break;
    case "sad":
      s += L("M-8 2.5Q1 -2.5 10 2.2");
      break;
    case "angry":
      s += O("M-10 -1Q1 -5 12 -2Q11 9 1 10Q-9 9 -10 -1Z");
      s += pa("M-9 -0.6Q1 -4 11 -1.6L10.4 1.6Q1 -0.8 -8.6 2.2Z", "#fff");
      break;
    case "o":
      s += O("M-4.5 2Q-4.5 -4.5 1 -4.5Q6.5 -4.5 6.5 2Q6.5 8.5 1 8.5Q-4.5 8.5 -4.5 2Z");
      break;
    case "flat":
      s += L("M-7 0.6L9 -0.4");
      break;
    case "soft":
      s += L("M-9 -1.4Q1 4 11 -2");
      break;
    case "grit":
      s += pa("M-10 -1Q1 -3.5 12 -1.6L11 5Q1 7.5 -9 5Z", "#fff", ` stroke="${c}" stroke-width="1.6"`);
      s += ln("M-9.4 2Q1 3 11.4 1.8M-3 -2.4L-3 6.4M5 -2.6L5 6.4", c, 1, op(0.8));
      break;
    case "smirk":
      s += L("M-8 1.6Q2 2.6 12 -4.5");
      s += L("M11 -6L13.6 -3", 1.2);
      break;
    case "cry":
      s += O("M-9 1Q-4 -2.4 1 -1Q6 -2.6 11 1Q9 9 1 9.4Q-7 9 -9 1Z");
      s += pa("M-4.6 6.4Q1 4 6.6 6.4Q3 9 1 9Q-2 9 -4.6 6.4Z", TONGUE);
      break;
    case "stern": // 굳게 다문 입(아래로)
      s += L("M-8 1.4Q1 -0.6 10 1.6");
      break;
    default:
      s += L("M-7 0.2Q1 1.8 9 -0.8");
  }
  return `<g transform="translate(${f(fs.mouth[0])} ${f(fs.mouth[1])})">${s}</g>`;
}

/** 얼굴(눈·입·홍조·눈물·땀). 머리 좌표계 문자열을 돌려준다. */
function drawFace(b: B, fs: FS, ex: Ex): string {
  const iid = b.id("ir");
  b.defs.push(`<linearGradient id="${iid}" x1="0" y1="0" x2="0" y2="1"><stop offset=".15" stop-color="${fs.iris[0]}"/><stop offset=".6" stop-color="${fs.iris[1]}"/><stop offset="1" stop-color="${fs.iris[2]}"/></linearGradient>`);
  let s = "";
  const [nx, ny, fx, fy] = fs.cheek;
  if (ex.bl > 0) {
    const bid = b.id("bl");
    b.defs.push(`<radialGradient id="${bid}"><stop offset="0" stop-color="${fs.blush}" stop-opacity="${Math.min(0.75, ex.bl + 0.15)}"/><stop offset="1" stop-color="${fs.blush}" stop-opacity="0"/></radialGradient>`);
    s += `<ellipse cx="${nx}" cy="${ny}" rx="19" ry="9" fill="url(#${bid})"/><ellipse cx="${fx}" cy="${fy}" rx="11" ry="8" fill="url(#${bid})"/>`;
    if (ex.bl > 0.4) {
      let h = "";
      for (let i = 0; i < 4; i++) h += `M${f(nx - 10 + i * 6)} ${f(ny - 4)}l-3 7`;
      for (let i = 0; i < 2; i++) h += `M${f(fx - 3 + i * 5)} ${f(fy - 3)}l-2.4 6`;
      s += ln(h, fs.blush, 1.3, op(0.9));
    }
  }
  const [ne, fe] = fs.eyes;
  s += drawEye(b, ne, ex, fs, `url(#${iid})`) + drawEye(b, fe, ex, fs, `url(#${iid})`);
  s += drawMouth(ex.m, fs);
  if (ex.tr === 2) {
    const tear = (x: number, y: number, L: number) =>
      pa(`M${f(x - 2.4)} ${f(y)}C${f(x - 4)} ${f(y + L * 0.4)} ${f(x - 1)} ${f(y + L * 0.7)} ${f(x - 2)} ${f(y + L)}C${f(x + 2.6)} ${f(y + L * 0.7)} ${f(x + 3)} ${f(y + L * 0.4)} ${f(x + 2.4)} ${f(y)}Z`, "#d4ebff", ` stroke="#79a6da" stroke-width="1.1"${op(0.9)}`);
    s += tear(ne.x + ne.w * 0.62, ne.y + ne.h * 0.42, 44) + tear(fe.x - fe.w * 0.5, fe.y + fe.h * 0.44, 30);
  } else if (ex.tr === 1) {
    s += pa(`M${f(ne.x + ne.w * 1.02)} ${f(ne.y + ne.h * 0.1)}q-2.6 4.6 0 6.8q2.6-2.2 0-6.8Z`, "#e6f3ff", ` stroke="#79a6da" stroke-width="1"`);
  }
  if (ex.sw) s += pa("M76 -58C80 -50 84 -44 80 -39C77 -36 71 -37 70 -42C69 -47 73 -51 76 -58Z", "#e3f1ff", ` stroke="#7fa8d8" stroke-width="1.3"`);
  return s;
}

function faceDk(b: B, faceId: string, tf: string, dk: number, col = "#3a2140"): void {
  const gid = b.id("dk");
  b.defs.push(`<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity="0"/><stop offset=".3" stop-color="${col}" stop-opacity="${dk}"/><stop offset=".72" stop-color="${col}" stop-opacity="${dk * 0.7}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient>`);
  b.inside([faceId], tf, `<rect x="-90" y="-96" width="190" height="124" fill="url(#${gid})"/>`);
}

// ───────────────────────── 머리 틀 ─────────────────────────
interface Geo {
  face: Pt[];
  shade: Pt[];
  neck: Pt[];
  neckSh: Pt[];
}
const GIRL: Geo = {
  face: [[-62, -60], [-64, -20], [-62, 6], [-58, 28], [-49, 50], [-35, 70], [-19, 84], [-8, 91], [1, 93], [12, 89], [30, 78], [49, 58], [62, 32], [68, 4], [70, -30], [66, -72], [36, -106], [-16, -110], [-50, -92]],
  shade: [[58, -110], [61, -40], [58, 8], [50, 38], [36, 60], [16, 82], [2, 98], [100, 100], [100, -110]],
  neck: [[-4, 72], [44, 50], [46, 110], [52, 170], [-8, 170], [0, 110]],
  neckSh: [[-12, 70], [60, 36], [60, 116], [32, 104], [4, 98]],
};
const KID: Geo = {
  face: [[-64, -60], [-66, -20], [-64, 8], [-60, 30], [-52, 50], [-38, 66], [-22, 78], [-8, 84], [4, 85], [18, 82], [36, 72], [54, 54], [66, 28], [70, 0], [70, -30], [66, -72], [36, -106], [-16, -110], [-52, -92]],
  shade: [[60, -110], [62, -40], [60, 8], [52, 36], [38, 58], [18, 76], [2, 92], [100, 100], [100, -110]],
  neck: [[-2, 66], [42, 50], [44, 100], [48, 150], [-6, 150], [2, 100]],
  neckSh: [[-12, 64], [60, 36], [60, 106], [30, 96], [4, 90]],
};
const MAN: Geo = {
  face: [[-60, -64], [-62, -24], [-60, 2], [-56, 24], [-52, 44], [-42, 66], [-28, 84], [-14, 96], [-2, 101], [10, 100], [26, 92], [44, 76], [58, 56], [66, 30], [70, 0], [70, -34], [66, -76], [36, -108], [-16, -112], [-50, -94]],
  shade: [[56, -110], [60, -40], [58, 6], [52, 36], [42, 62], [24, 84], [4, 106], [100, 110], [100, -110]],
  neck: [[-10, 80], [50, 54], [54, 110], [60, 175], [-14, 175], [-6, 116]],
  neckSh: [[-18, 78], [66, 40], [66, 126], [30, 112], [0, 106]],
};

const EAR: Pt[] = [[60, -14], [72, -24], [83, -12], [82, 12], [74, 30], [60, 30]];

function neck(b: B, tf: string, g: Geo, S: Pal): void {
  b.pc(sp(g.neck), S, sp(g.neckSh), tf);
}

/** 목 + 얼굴 피부 + 코 + 셀 음영. 얼굴 id를 돌려준다. */
function headBase(b: B, tf: string, g: Geo, S: Pal, o: { bang?: Pt[]; ear?: boolean; noNeck?: boolean; nose?: string } = {}): string {
  if (!o.noNeck) neck(b, tf, g, S);
  if (o.ear) {
    b.pi(sp(EAR), S, tf, 2.2);
    b.g(tf, ln("M67 -8Q76 -12 76 2Q74 14 68 20", S.l, 1.4, op(0.8)));
  }
  let sh = sp(g.shade);
  if (o.bang) sh += sp([...o.bang, [110, -150], [-110, -150]]);
  const id = b.pc(sp(g.face), S, sh, tf, 2.4);
  b.g(tf, o.nose ?? ln("M-7 26Q-12 34 -8 37", S.l, 1.5) + pa("M-6 37L-1 36L-4 33Z", S.s));
  return id;
}

// ───────────────────────── 공통 조립 ─────────────────────────
interface Char {
  draw: (b: B, ex: Ex, expr: string) => void;
  tweak?: (ex: Ex, expr: string) => Ex;
  fade?: [number, number];
}

function finish(b: B, c: Char, style = ""): string {
  const [f0, f1] = c.fade ?? [820, 995];
  const fm = b.id("fm");
  const fd = b.lg("fd", 0, f0, 0, f1, [[0, "#fff"], [1, "#000"]]);
  b.defs.push(`<mask id="${fm}"><rect width="600" height="1000" fill="${fd}"/></mask>`);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 1000">${style}<defs>${b.defs.join("")}</defs>` +
    `<g mask="url(#${fm})" stroke-linejoin="round" stroke-linecap="round" stroke-width="2.4">${b.out.join("")}</g></svg>`
  );
}

// ───────────────────────── 팔레트 ─────────────────────────
const SKIN: Pal = { b: "#fdeade", s: "#f3c4b2", l: "#c27a68" };
const WHITE: Pal = { b: "#fbfaf8", s: "#dcd7e3", l: "#8a8498" };
const BLACK: Pal = { b: "#2e2d39", s: "#1c1b24", l: "#0b0a10", h: "#4c4b5e" };
const GLOVE: Pal = { b: "#fbfaf8", s: "#dcd7e3", l: "#8a8498" };

/** 맞잡은 두 손(앞) */
function hands(b: B, x: number, y: number, P: Pal, sc = 1): void {
  const tf = `translate(${x} ${y}) scale(${sc})`;
  b.pc(sp([[-26, -6], [-8, -16], [14, -14], [30, -4], [32, 10], [18, 20], [-4, 22], [-22, 14]]), P, sp([[-4, 8], [30, 0], [34, 24], [-6, 24]]), tf, 2.2);
  b.g(tf, ln("M-2 -12Q6 0 2 14M8 -12Q16 -2 12 14M-14 2Q-4 6 4 4", P.l, 1.3, op(0.8)));
}

// ── 리리 ──
const LH: Pal = { b: "#f7954a", s: "#d8692f", l: "#8f3d1d", h: "#ffd49e" };
const LT: Pal = { b: "#fff8f0", s: "#ecd9cc", l: "#9a6e5a" };
const lili: Char = {
  draw(b, ex) {
    const HT = "translate(302 310) rotate(-3) scale(.98)";
    // 꼬리
    const tail: Pt[] = [[340, 700], [420, 700], [478, 640], [498, 548], [470, 452]];
    const tid = b.pc(fur(tail, 116, 9), LH, sp([[330, 720], [440, 720], [506, 640], [520, 560], [480, 600], [440, 690]]), "", 2.4);
    b.inside([tid], "", pa(sp([[440, 540], [480, 530, 1], [470, 510, 1], [520, 500], [520, 380], [400, 380], [420, 520], [446, 522, 1]]), LT.b) + pa(sp([[488, 520], [520, 500], [520, 560]]), LT.s));
    b.lines([tid], LH.l);
    // 뒷머리
    b.pi(sp([[-78, -70], [-62, -122], [-8, -142], [52, -136], [92, -104], [108, -50], [110, 10], [104, 60], [94, 98, 1], [78, 82], [62, 100, 1], [48, 72], [-50, 60], [-66, 94, 1], [-76, 72], [-88, 92, 1], [-92, 40], [-88, -20]]), { ...LH, b: LH.s }, HT);
    // 목, 몸
    neck(b, HT, GIRL, SKIN);
    const skirtSh = sp([[330, 590], [384, 590], [420, 760], [440, 1000], [360, 1000], [352, 760]]);
    b.pc(sp([[232, 580], [372, 580], [398, 660], [426, 780], [444, 1000, 1], [172, 1000, 1], [186, 780], [206, 660]]), BLACK, skirtSh);
    b.pc(sp([[286, 426], [250, 438], [222, 456], [208, 490], [214, 540], [230, 592], [372, 592], [388, 540], [398, 490], [392, 458], [368, 440], [336, 428]]), BLACK, sp([[340, 430], [400, 450], [410, 600], [350, 600], [358, 520]]));
    // 앞치마
    const ap = b.pc(sp([[246, 596], [362, 594], [388, 700], [404, 860], [412, 1000, 1], [206, 1000, 1], [214, 860], [224, 700]]), LT, sp([[330, 600], [370, 600], [400, 800], [410, 1000], [360, 1000], [350, 800]]));
    b.add(ln("M268 640Q262 780 250 1000M300 650Q300 800 298 1000M336 640Q346 780 356 1000", LT.l, 1.4, op(0.5)));
    void ap;
    b.pc(sp([[264, 478], [336, 474], [342, 596], [260, 598]]), LT, sp([[318, 476], [340, 474], [344, 598], [326, 598]]));
    // 가슴받이 프릴
    let fr = "";
    for (let i = 0; i < 6; i++) fr += `M${262 + i * 13} ${478 - i * 0.7}q6.5 -7 13 0`;
    b.add(ln(fr, LT.l, 1.6) + pa(`M262 478${Array.from({ length: 6 }, () => "q6.5 -7 13 -0.7").join("")}Z`, LT.b));
    // 허리띠
    b.pc(sp([[228, 582, 1], [374, 578, 1], [376, 604, 1], [230, 608, 1]]), LT, sp([[330, 578], [376, 578, 1], [376, 604, 1], [330, 606]]), "", 2.2);
    // 어깨끈
    b.pi(sp([[262, 480, 1], [240, 452], [252, 442], [276, 476, 1]]), LT, "", 2);
    b.pi(sp([[336, 476, 1], [358, 446], [372, 450], [348, 482, 1]]), LT, "", 2);
    // 깃
    b.pi(sp([[312, 430], [282, 432], [266, 450], [286, 466], [312, 450, 1]]), LT, "", 2.2);
    b.pc(sp([[312, 430], [346, 430], [362, 448], [340, 464], [314, 450, 1]]), LT, sp([[330, 430], [370, 440], [360, 470]]), "", 2.2);
    b.pi(sp([[304, 446], [292, 438], [290, 456], [304, 452], [318, 458], [320, 440], [310, 446]]), { b: "#3fa266", s: "#27774a", l: "#15452a" }, "", 1.8);
    // 소매(퍼프) + 팔
    b.pi(sp([[208, 494], [230, 504], [240, 560], [272, 600], [294, 614], [286, 636], [248, 620], [212, 580], [198, 540]]), BLACK, "", 2.4);
    b.pc(sp([[396, 498], [420, 502], [424, 560], [396, 610], [338, 634], [330, 612], [372, 590], [394, 556]]), BLACK, sp([[410, 500], [430, 500], [430, 600], [400, 620], [404, 560]]));
    b.pc(sp([[250, 440], [222, 446], [200, 470], [202, 504], [228, 512], [246, 488]]), BLACK, sp([[240, 480], [250, 500], [230, 516], [214, 500]]));
    b.pc(sp([[370, 440], [402, 444], [424, 470], [422, 506], [396, 514], [380, 488]]), BLACK, sp([[400, 440], [430, 460], [430, 516], [404, 520], [410, 480]]));
    b.add(ln("M214 462Q224 480 222 500M394 454Q404 476 402 500", BLACK.h, 1.6, op(0.8)));
    // 소매 끝 커프스
    b.pi(sp([[282, 606, 1], [298, 614, 1], [290, 642, 1], [274, 632, 1]]), LT, "", 2);
    b.pi(sp([[332, 608, 1], [346, 612, 1], [344, 640, 1], [328, 636, 1]]), LT, "", 2);
    hands(b, 312, 632, SKIN, 0.9);
    // 얼굴
    const fid = headBase(b, HT, GIRL, SKIN, { noNeck: true, bang: [[-70, -38], [-54, -18], [-40, -30], [-24, -10], [-8, -26], [6, -6], [20, -24], [34, -12], [52, -22], [70, -30]] });
    const fs: FS = {
      eyes: [{ x: 6, y: 0, w: 44, h: 40, s: 1 }, { x: -15, y: 0, w: 32, h: 38, s: -1 }],
      brows: [[[8, -36], [52, -40], 4], [[-14, -34], [-48, -30], 3]],
      bw: 4.6, bc: "#a8492a",
      iris: ["#155c35", "#35a860", "#c4f59a"], pupil: "#0c3a20",
      lash: "#5a2414", lw: 1.25, fem: true,
      mouth: [-2, 60], lip: "#b0584e", skin: SKIN, blush: "#f78a8a", cheek: [30, 34, -40, 30],
    };
    let face = drawFace(b, fs, ex);
    // 주근깨
    face = pa("M22 26h0M30 29h0M38 25h0M-38 24h0M-32 27h0", "none", ` stroke="#d0826a" stroke-width="2.2"${op(0.8)}`) + face;
    b.g(HT, face);
    void fid;
    // 옆머리 + 흰 끝
    const sides = [
      b.pc(lock([[-64, -100], [-84, -50], [-92, 10], [-88, 60], [-80, 94]], 30), LH, "", HT),
      b.pc(lock([[-50, -86], [-66, -40], [-72, 10], [-70, 56], [-62, 96]], 36), LH, "", HT),
      b.pc(lock([[74, -96], [96, -50], [104, 10], [102, 60], [90, 102]], 36), LH, "", HT),
      b.pc(lock([[54, -90], [70, -40], [78, 10], [78, 56], [70, 98]], 40), LH, "", HT),
    ];
    b.inside(sides, HT, pa(sp([[-130, 64], [-100, 58, 1], [-90, 70, 1], [-78, 60, 1], [-66, 72, 1], [-56, 62, 1], [60, 62, 1], [72, 74, 1], [82, 62, 1], [94, 72, 1], [106, 62, 1], [140, 70], [140, 140], [-130, 140]]), LT.b) +
      pa(sp([[40, 20], [110, 0], [110, 120], [60, 120]]), LH.s, op(0.6)));
    b.lines(sides, LH.l);
    // 머리 위(캡) + 앞머리
    const cap = b.pc(sp([[-70, -44], [-76, -88], [-52, -124], [-2, -140], [50, -134], [86, -104], [96, -60], [92, -30], [60, -70], [10, -86], [-44, -74]]), LH, "", HT);
    const bangs: [Pt[], number][] = [
      [[[-40, -110], [-56, -80], [-68, -50], [-74, -30]], 22],
      [[[-24, -120], [-44, -86], [-54, -52], [-58, -20]], 32],
      [[[-8, -124], [-22, -88], [-30, -50], [-32, -14]], 34],
      [[[6, -126], [4, -90], [0, -52], [-6, -8]], 28],
      [[[18, -126], [24, -90], [24, -52], [20, -20]], 30],
      [[[30, -124], [44, -90], [50, -54], [50, -14]], 32],
      [[[44, -120], [64, -90], [74, -58], [80, -28]], 30],
    ];
    const bids = bangs.map(([c, w]) => b.pc(lock(c, w, 1, 0.3), LH, "", HT));
    b.inside([cap, ...bids], HT, pa(sp([[40, -140], [100, -110], [100, 0], [60, -40], [56, -80]]), LH.s, op(0.7)) + pa(band(-70, 90, -78, 14, 6, 14, 0.14), LH.h));
    b.lines(bids, LH.l);
    // 여우 귀
    const ear = (o: Pt[], i: Pt[], shd: Pt[]) => {
      b.pc(sp(o), LH, sp(shd), HT);
      b.pi(sp(i), LT, HT, 1.8);
    };
    ear([[-70, -96], [-96, -150], [-92, -208, 1], [-54, -172], [-26, -126]], [[-64, -110], [-84, -150], [-84, -190, 1], [-74, -170, 1], [-66, -176, 1], [-58, -160], [-40, -130]], [[-40, -100], [-60, -180], [-40, -140]]);
    ear([[8, -132], [40, -180], [78, -216, 1], [92, -166], [88, -106]], [[24, -136], [50, -174], [74, -200, 1], [72, -180, 1], [80, -176, 1], [80, -160], [74, -118]], [[70, -200], [100, -160], [96, -100], [80, -110]]);
    // 머릿수건
    const kid = b.pc(sp([[-74, -88], [-70, -118], [-40, -142], [4, -154], [52, -148], [90, -122], [104, -88], [102, -60], [88, -78], [60, -100], [20, -112], [-26, -108], [-56, -98]]), LT, sp([[40, -160], [110, -120], [110, -50], [80, -84], [60, -120]]), HT);
    void kid;
    let sc = "";
    for (let i = 0; i < 13; i++) {
      const t = i / 12, x = -72 + t * 172, y = -92 - Math.sin(t * Math.PI) * 20 + t * 30;
      sc += `<circle cx="${f(x)}" cy="${f(y)}" r="5.5"/>`;
    }
    b.g(HT, `<g fill="${LT.b}" stroke="${LT.l}" stroke-width="1.8">${sc}</g>`);
    // 매듭 꼬리
    b.pi(sp([[98, -76], [132, -54], [124, -32, 1], [96, -56]]), LT, HT, 2);
    b.pi(sp([[96, -70], [118, -30], [102, -18, 1], [90, -58]]), LT, HT, 2);
    // 눈썹(앞머리 위, 반투명)
    b.g(HT, `<g opacity=".7">${fs.brows.map((br, i) => drawBrow(br, ex, fs, i === 0)).join("")}</g>`);
  },
};


/** 앞머리 공통: 캡 + 가닥 + 광택 띠 + 선 */
function bangsOf(b: B, HT: string, H: Pal, cap: Pt[], list: [Pt[], number][], bandA: [number, number, number, number, number, number, number], extra = ""): string[] {
  const cid = b.pc(sp(cap), H, "", HT);
  const ids = list.map(([c, w]) => b.pc(lock(c, w, 1, 0.3), H, "", HT));
  b.inside([cid, ...ids], HT, extra + pa(band(...bandA), H.h!));
  b.lines(ids, H.l);
  return ids;
}
const browsOf = (b: B, HT: string, fs: FS, ex: Ex, o = 0.75) =>
  b.g(HT, `<g opacity="${o}">${fs.brows.map((br, i) => drawBrow(br, ex, fs, i === 0)).join("")}</g>`);

// ── 세실리아 ──
const CHR: Pal = { b: "#f8d573", s: "#ddab46", l: "#9a6a26", h: "#fff4c6" };
const PINK: Pal = { b: "#f7bfd0", s: "#e391ab", l: "#a4506e" };
const CW: Pal = { b: "#fffafc", s: "#ead9e6", l: "#9a869a" };
const cecilia: Char = {
  tweak(ex, e) {
    if (e === "smile") return { ...ex, m: "sweet" };
    if (e === "smirk") return { o: 0.94, t: 0, lo: 0.04, pu: 0.9, bi: 0, bo: 0, bf: 0, m: "sweet", bl: 0.3, tr: 0, hl: 0, dk: 0.4, pin: true };
    return ex;
  },
  draw(b, ex) {
    const HT = "translate(296 228) rotate(-3) scale(.94)";
    // 뒷머리(긴 곱슬)
    b.pc(sp([[-86, -60], [-70, -128], [-6, -150], [66, -140], [108, -100], [122, -30], [128, 60], [146, 170], [156, 280], [152, 380], [166, 460, 1], [134, 440], [122, 494, 1], [98, 446], [40, 420], [-30, 420], [-80, 466, 1], [-98, 424], [-122, 474, 1], [-126, 380], [-118, 280], [-110, 160], [-100, 60], [-94, -10]]), { ...CHR, b: CHR.s }, "", HT);
    b.pc(lock(wave(-96, 30, -118, 450, 9, 10), 48, 1, 0.8), CHR, "", HT);
    b.pc(lock(wave(122, 30, 150, 450, 9, 10, 1), 48, 1, 0.8), CHR, sp([[130, 0], [200, 0], [200, 500], [150, 500]]), HT);
    // 리본(뒤통수)
    b.pc(sp([[100, -74], [126, -10], [146, 48, 1], [128, 40], [112, 60, 1], [96, -60]]), CW, "", HT, 2);
    b.pc(sp([[96, -84], [110, -136], [150, -142], [150, -100], [104, -76]]), CW, sp([[120, -110], [160, -120], [160, -80]]), HT, 2);
    b.pc(sp([[104, -72], [150, -64], [162, -30], [132, -34], [100, -62]]), CW, "", HT, 2);
    neck(b, HT, GIRL, SKIN);
    // 치마
    b.pc(sp([[236, 530], [380, 530], [420, 640], [456, 800], [476, 1000, 1], [146, 1000, 1], [164, 800], [200, 640]]), PINK, sp([[340, 530], [390, 530], [440, 700], [480, 1000], [400, 1000], [380, 700]]));
    b.pc(sp([[282, 544], [340, 542], [366, 700], [388, 1000, 1], [234, 1000, 1], [250, 700]]), CW, sp([[322, 544], [342, 544], [388, 1000], [350, 1000]]));
    let ru = "";
    for (const y of [640, 760, 880]) {
      const w = 26 + (y - 540) * 0.26, x0 = 310 - w * 1.05 + (y - 540) * 0.04;
      ru += `M${f(x0)} ${y}` + Array.from({ length: 6 }, () => `q${f(w / 6)} 10 ${f(w / 3)} 0`).join("");
    }
    b.add(ln(ru, CW.l, 1.6, op(0.8)));
    // 가슴 피부 + 몸판
    b.pc(sp([[262, 364], [364, 360], [362, 406], [266, 410]]), SKIN, sp([[330, 360], [370, 360], [366, 410], [340, 410]]), "", 2);
    b.add(ln("M276 380Q292 388 304 386M326 384Q340 386 352 378", SKIN.l, 1.3, op(0.7)));
    b.pc(sp([[262, 400], [364, 396], [382, 420], [392, 470], [380, 540], [236, 544], [222, 470], [228, 420]]), PINK, sp([[336, 396], [390, 420], [400, 540], [360, 540], [370, 470]]));
    b.add(ln("M280 430Q290 490 290 540M340 428Q336 490 334 540", PINK.l, 1.3, op(0.55)));
    // 레이스 깃
    let lace = "";
    for (let i = 0; i < 9; i++) lace += `<circle cx="${262 + i * 13}" cy="${f(408 - i * 0.5)}" r="6.5"/>`;
    b.add(`<g fill="${CW.b}" stroke="${CW.l}" stroke-width="1.6">${lace}</g>`);
    b.pc(sp([[256, 394, 1], [368, 390, 1], [368, 406, 1], [258, 410, 1]]), CW, "", "", 2);
    b.pc(`M312 396l8 9l-8 11l-8 -11Z`, { b: "#f37aa2", s: "#c84a7a", l: "#8a2450" }, "", "", 1.6);
    b.add(pa("M310 399l3 3l-3 3l-2 -3Z", "#fff", op(0.8)));
    // 허리 리본
    b.pc(sp([[232, 528, 1], [382, 524, 1], [384, 548, 1], [234, 552, 1]]), { b: "#ef9cb8", s: "#d4789a", l: "#a4506e" }, "", "", 2);
    // 팔: 퍼프, 윗팔, 장갑
    b.pi(sp([[210, 428], [234, 436], [234, 480], [228, 502], [206, 498], [206, 460]]), SKIN);
    b.pi(sp([[394, 436], [418, 430], [422, 480], [420, 502], [396, 502], [394, 470]]), SKIN);
    b.pc(sp([[204, 488], [230, 490], [254, 538], [294, 562], [288, 590], [248, 572], [212, 530]]), GLOVE, "", "", 2.2);
    b.pc(sp([[396, 492], [422, 494], [416, 542], [340, 588], [330, 566], [380, 532]]), GLOVE, sp([[410, 492], [430, 494], [420, 560], [380, 580], [400, 540]]), "", 2.2);
    b.add(ln("M204 490q6 -6 13 -1q6 -5 13 1M396 494q6 -6 13 -1q6 -5 13 1", GLOVE.l, 1.4));
    b.pc(sp([[258, 368], [226, 376], [204, 400], [206, 434], [234, 442], [252, 414]]), CW, sp([[240, 420], [252, 430], [234, 446], [214, 436]]), "", 2.2);
    b.pc(sp([[362, 364], [398, 370], [420, 398], [418, 434], [390, 442], [374, 412]]), CW, sp([[398, 370], [426, 400], [424, 446], [398, 446], [406, 410]]), "", 2.2);
    b.add(ln("M222 390Q232 410 228 432M388 382Q400 404 398 428", CW.l, 1.3, op(0.7)));
    hands(b, 312, 576, GLOVE, 0.9);
    // 얼굴
    const fid = headBase(b, HT, GIRL, SKIN, { bang: [[-70, -40], [-56, -22], [-40, -30], [-30, -16], [-10, -26], [4, -14], [22, -28], [36, -18], [56, -24], [70, -34]] });
    const fs: FS = {
      eyes: [{ x: 6, y: 0, w: 45, h: 42, s: 1 }, { x: -15, y: 0, w: 33, h: 40, s: -1 }],
      brows: [[[8, -38], [52, -42], 4], [[-14, -36], [-48, -32], 3]],
      bw: 4.2, bc: "#b98a3c",
      iris: ["#2a62a8", "#5aaee8", "#dcf4ff"], pupil: "#173c70",
      lash: "#6a4420", lw: 1.3, fem: true,
      mouth: [-2, 60], lip: "#c0606a", skin: SKIN, blush: "#f590a8", cheek: [30, 34, -40, 30],
    };
    b.g(HT, drawFace(b, fs, ex) + pa("M-4 66Q1 69 6 66Q1 71 -4 66Z", "#f2a0b0", op(0.8)));
    if (ex.dk) faceDk(b, fid, HT, ex.dk);
    // 앞 곱슬(어깨 앞)
    const sides = [
      b.pc(lock(wave(-58, -70, -84, 300, 8, 10), 36, 1, 0.9), CHR, "", HT),
      b.pc(lock(wave(64, -70, 98, 330, 9, 10, 1), 40, 1, 0.9), CHR, sp([[80, -80], [140, -80], [140, 340], [96, 340], [90, 100]]), HT),
    ];
    b.inside(sides, HT, pa(band(-100, 130, 60, 0, 5, 16), CHR.h, op(0.8)));
    b.lines(sides, CHR.l);
    // 반묶음: 옆머리를 뒤로 넘긴 결
    b.pc(lock([[60, -86], [88, -94], [110, -92]], 22, 1), CHR, "", HT, 2);
    bangsOf(b, HT, CHR, [[-70, -44], [-78, -90], [-52, -126], [-2, -144], [52, -138], [90, -106], [98, -60], [92, -30], [60, -70], [10, -86], [-44, -74]], [
      [[[-30, -118], [-48, -86], [-60, -54], [-66, -28]], 30],
      [[[-12, -126], [-28, -90], [-38, -54], [-42, -22]], 34],
      [[[6, -128], [0, -92], [-8, -56], [-16, -16]], 30],
      [[[22, -126], [30, -90], [30, -56], [26, -26]], 30],
      [[[38, -122], [52, -92], [58, -60], [60, -28]], 32],
      [[[54, -116], [72, -86], [80, -56], [84, -24]], 26],
    ], [-72, 96, -84, 14, 6, 14, 0.14]);
    // 티아라
    const TI: Pal = { b: "#eef1f7", s: "#b4bdcb", l: "#636c7e" };
    b.pc(sp([[-44, -114, 1], [-26, -136, 1], [-14, -126], [6, -156, 1], [24, -130], [38, -140, 1], [54, -118, 1], [30, -122], [4, -126], [-20, -120]]), TI, sp([[10, -160], [60, -130], [54, -110], [12, -120]]), HT, 2);
    b.g(HT, `<circle cx="5" cy="-134" r="5.6" fill="#f37aa2" stroke="#8a2450" stroke-width="1.5"/><circle cx="3.4" cy="-136" r="1.8" fill="#fff"/>`);
    browsOf(b, HT, fs, ex);
  },
};

// ── 아델하르트 ──
const AH: Pal = { b: "#f0cb62", s: "#c8983a", l: "#7a5418", h: "#fff3bc" };
const SIL: Pal = { b: "#d5dbe3", s: "#98a2b1", l: "#4a5262", h: "#f8fafd" };
const RED: Pal = { b: "#c02c34", s: "#86161e", l: "#4a0a10" };
const NAV: Pal = { b: "#2c3656", s: "#1a2038", l: "#0b0f1e" };
const GOLD: Pal = { b: "#f2c450", s: "#c48a2a", l: "#7a4e12" };
const SKIN_M: Pal = { b: "#fbe4d6", s: "#eebca6", l: "#b2705e" };
function crest(b: B, x: number, y: number, r: number): void {
  let rays = "";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, a1 = a - 0.13, a2 = a + 0.13;
    rays += `M${f(x + Math.cos(a1) * r)} ${f(y + Math.sin(a1) * r)}L${f(x + Math.cos(a) * r * 1.55)} ${f(y + Math.sin(a) * r * 1.55)}L${f(x + Math.cos(a2) * r)} ${f(y + Math.sin(a2) * r)}Z`;
  }
  b.add(pa(rays, GOLD.b, ` stroke="${GOLD.l}" stroke-width="1.4"`));
  b.add(`<circle cx="${x}" cy="${y}" r="${r}" fill="${GOLD.b}" stroke="${GOLD.l}" stroke-width="1.8"/>`);
  const h = r * 0.7, w = r * 0.5;
  b.add(pa(`M${f(x - w)} ${f(y - h)}H${f(x + w)}L${f(x + 1.5)} ${f(y)}L${f(x + w)} ${f(y + h)}H${f(x - w)}L${f(x - 1.5)} ${f(y)}Z`, NAV.b, ` stroke="${GOLD.l}" stroke-width="1.4"`));
  b.add(pa(`M${f(x - w * 0.5)} ${f(y + h)}L${f(x)} ${f(y + h * 0.35)}L${f(x + w * 0.5)} ${f(y + h)}Z`, GOLD.h ?? "#fff1c4"));
}
const adelhart: Char = {
  tweak(ex, e) {
    const o = { ...ex, o: ex.o * 0.84, t: ex.t + 0.18, bl: ex.bl * 0.3 };
    if (e === "normal") o.m = "stern";
    if (e === "smile") return { ...o, arc: false, o: 0.72, lo: 0.25, m: "smirk", bf: -2 };
    return o;
  },
  draw(b, ex) {
    const HT = "translate(300 210) rotate(-2) scale(.88)";
    // 망토 뒤판
    b.pc(sp([[196, 330], [430, 326], [482, 420], [510, 640], [532, 1000, 1], [98, 1000, 1], [116, 700], [140, 430]]), RED, sp([[390, 330], [482, 420], [532, 1000], [430, 1000], [440, 640]]));
    neck(b, HT, MAN, SKIN_M);
    // 하의 + 허리 갑주
    b.pc(sp([[236, 580], [382, 576], [394, 700], [398, 1000, 1], [224, 1000, 1], [228, 700]]), NAV, sp([[330, 580], [382, 576], [398, 1000], [350, 1000]]));
    b.add(ln("M312 640L310 1000", NAV.l, 1.6, op(0.8)));
    b.pc(sp([[226, 594, 1], [394, 588, 1], [404, 640], [398, 648, 1], [224, 656, 1], [218, 646]]), SIL, sp([[340, 588], [404, 588], [404, 650], [350, 650]]));
    b.pc(sp([[230, 548, 1], [390, 544, 1], [398, 596], [392, 602, 1], [230, 606, 1], [224, 596]]), SIL, sp([[340, 544], [400, 544], [400, 606], [350, 606]]));
    b.pc(sp([[232, 566, 1], [388, 562, 1], [388, 578, 1], [232, 582, 1]]), { b: "#5a3a22", s: "#3c2412", l: "#1e1006" }, "", "", 2);
    b.pc(sp([[294, 560, 1], [322, 558, 1], [322, 584, 1], [294, 586, 1]]), GOLD, "", "", 2);
    // 흉갑
    b.pc(sp([[262, 318], [362, 316], [400, 342], [408, 420], [398, 500], [384, 556], [236, 560], [220, 500], [214, 420], [226, 344]]), SIL,
      sp([[334, 316], [410, 340], [412, 560], [364, 560], [384, 470], [370, 380]]), "", 2.6, sp([[236, 360], [254, 344], [246, 440], [238, 490], [228, 440]]));
    b.add(ln("M306 330Q300 440 300 556", SIL.l, 1.5, op(0.7)) + ln("M238 360Q300 390 390 356", SIL.l, 1.2, op(0.5)));
    crest(b, 302, 430, 20);
    // 목가리개
    b.pc(sp([[268, 300], [350, 296], [366, 326], [340, 340], [284, 342], [256, 328]]), SIL, sp([[330, 296], [370, 326], [340, 344]]), "", 2.2);
    // 가까운 팔
    b.pi(sp([[398, 360], [440, 368], [450, 460], [446, 520], [410, 522], [402, 450]]), NAV);
    b.pc(sp([[406, 512], [450, 512], [458, 600], [454, 640], [416, 644], [408, 590]]), SIL, sp([[436, 512], [460, 512], [460, 644], [440, 644]]), "", 2.2);
    b.pc(sp([[412, 632], [458, 632], [466, 668], [450, 694], [418, 692], [408, 664]]), SIL, sp([[440, 632], [470, 640], [460, 700], [440, 700]]), "", 2.2);
    b.add(ln("M416 654Q436 660 460 652M418 672Q436 678 458 670", SIL.l, 1.3, op(0.8)));
    // 견갑
    b.pc(sp([[400, 384], [452, 396], [470, 432], [450, 444], [404, 424]]), SIL, sp([[440, 392], [476, 430], [452, 450]]), "", 2.2);
    b.pc(sp([[370, 330], [420, 332], [458, 358], [466, 400], [446, 412], [404, 394], [376, 362]]), SIL, sp([[430, 334], [470, 370], [470, 410], [446, 416]]), "", 2.4, sp([[384, 336], [410, 336], [400, 350]]));
    // 망토 앞자락(먼 어깨)
    const md = b.pc(sp([[272, 318], [222, 322], [180, 350], [160, 420], [150, 520], [156, 640], [170, 770], [206, 744], [230, 660], [244, 560], [250, 460], [258, 380]]), RED, sp([[230, 360], [252, 400], [248, 520], [236, 640], [214, 750], [226, 560]]));
    b.add(ln("M196 380Q180 520 186 700M220 420Q206 560 206 720", RED.l, 1.4, op(0.6)) + ln("M258 380L250 460L244 560L230 660L206 744", GOLD.b, 4));
    void md;
    b.add(`<circle cx="262" cy="330" r="11" fill="${GOLD.b}" stroke="${GOLD.l}" stroke-width="2"/><circle cx="388" cy="338" r="10" fill="${GOLD.b}" stroke="${GOLD.l}" stroke-width="2"/><circle cx="259" cy="327" r="3" fill="#fff6d0"/><circle cx="385" cy="335" r="3" fill="#fff6d0"/>`);
    // 얼굴
    const fid = headBase(b, HT, MAN, SKIN_M, { ear: true, bang: [[-70, -58], [-40, -66], [-10, -60], [20, -70], [50, -64], [74, -60]] });
    const fs: FS = {
      eyes: [{ x: 7, y: 0, w: 42, h: 27, s: 1 }, { x: -15, y: 0, w: 30, h: 26, s: -1 }],
      brows: [[[5, -24], [54, -30], 1], [[-13, -22], [-50, -22], 1]],
      bw: 5.6, bc: "#9a6a20",
      iris: ["#15366e", "#3874c4", "#b4dcff"], pupil: "#0a1c40",
      lash: "#3a2812", lw: 1.1,
      mouth: [-2, 68], lip: "#a8645a", skin: SKIN_M, blush: "#ec9a90", cheek: [30, 34, -40, 30],
    };
    b.g(HT, drawFace(b, fs, ex) + ln("M26 48Q34 56 32 62", SKIN_M.l, 1.2, op(0.5)));
    if (ex.dk) faceDk(b, fid, HT, ex.dk);
    // 머리(뒤로 넘김)
    b.pc(lock([[62, -70], [90, -64], [106, -30], [100, 8]], 30), AH, "", HT);
    b.pc(lock([[62, -40], [72, -14], [70, 8]], 14), AH, "", HT, 2);
    bangsOf(b, HT, AH, [[-66, -40], [-74, -92], [-48, -130], [2, -148], [58, -142], [94, -112], [108, -62], [104, -24], [88, -40], [76, -72], [40, -88], [-10, -92], [-50, -72]], [
      [[[-62, -52], [-52, -100], [-10, -138], [60, -142]], 34],
      [[[-40, -76], [-20, -116], [30, -138], [96, -120]], 30],
      [[[-10, -86], [20, -118], [70, -124], [110, -86]], 28],
      [[[22, -84], [56, -100], [90, -92], [112, -54]], 26],
      [[[-56, -60], [-68, -30]], 14],
      [[[-18, -92], [-34, -70], [-42, -44]], 16],
    ], [-62, 100, -112, 18, 5, 14, 0.2]);
    browsOf(b, HT, fs, ex, 0.9);
  },
};

// ── 헤르만 ──
const HH: Pal = { b: "#d8dce2", s: "#a2a9b4", l: "#5a616e", h: "#ffffff" };
const GRY: Pal = { b: "#57555f", s: "#3c3b45", l: "#1c1b22" };
const SKIN_O: Pal = { b: "#f8e1d4", s: "#e6b9a6", l: "#a86e5c" };
const herman: Char = {
  tweak(ex, e) {
    const o = { ...ex, o: ex.o * 0.72, bl: ex.bl * 0.4 };
    if (e === "normal") o.m = "soft";
    if (e === "smile") o.m = "soft";
    if (e === "smirk") return { o: 0.72, t: 0.1, lo: 0.3, pu: 0.78, bi: 0, bo: 0, bf: -8, m: "smirk", bl: 0, tr: 0, hl: 0.45, dk: 0.45, pin: true };
    return o;
  },
  draw(b, ex, e) {
    const HT = "translate(300 226) rotate(-2) scale(.88)";
    neck(b, HT, MAN, SKIN_O);
    // 연미복
    b.pc(sp([[258, 332], [222, 346], [206, 380], [204, 460], [214, 560], [222, 640], [214, 1000, 1], [402, 1000, 1], [394, 640], [398, 560], [410, 460], [410, 380], [394, 346], [354, 330]]), BLACK, sp([[350, 330], [410, 380], [410, 1000], [360, 1000], [372, 600]]));
    b.add(ln("M312 620L310 1000M250 640Q244 800 240 1000", BLACK.h, 1.4, op(0.7)));
    // 셔츠, 조끼
    b.pc(sp([[280, 336], [340, 332], [334, 420], [310, 470], [288, 420]]), WHITE, sp([[320, 334], [340, 332], [334, 420], [314, 460]]), "", 2);
    b.pc(sp([[272, 380], [298, 470], [312, 480], [328, 470], [350, 378], [372, 420], [374, 560], [346, 604], [312, 614], [276, 604], [246, 560], [250, 420]]), GRY, sp([[330, 470], [350, 378], [374, 420], [376, 560], [346, 606], [322, 610]]));
    b.add([496, 526, 556, 586].map((y) => `<circle cx="${f(314 + (y - 500) * 0.02)}" cy="${y}" r="3.4" fill="#c9ced8" stroke="#555d6a" stroke-width="1"/>`).join(""));
    // 옷깃
    b.pc(sp([[282, 336], [262, 352], [250, 420], [268, 480], [300, 520, 1], [282, 440], [288, 380]]), BLACK, "", "", 2.2, sp([[266, 360], [274, 356], [270, 440], [262, 430]]));
    b.pc(sp([[338, 332], [366, 350], [376, 420], [356, 486], [326, 520, 1], [344, 440], [338, 384]]), BLACK, sp([[356, 340], [380, 350], [380, 480], [360, 480]]), "", 2.2, sp([[350, 360], [362, 360], [364, 420], [354, 420]]));
    // 나비넥타이
    b.pc(`M310 350L286 338L284 362L310 352L334 364L334 338Z`, BLACK, "", "", 2);
    b.add(`<rect x="304" y="344" width="12" height="12" rx="3" fill="${BLACK.b}" stroke="${BLACK.l}" stroke-width="1.6"/>`);
    // 팔
    b.pc(sp([[214, 370], [238, 376], [238, 470], [270, 538], [298, 558], [290, 582], [252, 566], [212, 502], [202, 440]]), BLACK, "", "", 2.4, sp([[216, 390], [224, 392], [220, 470], [212, 460]]));
    b.pc(sp([[390, 372], [416, 380], [422, 460], [400, 530], [342, 576], [332, 556], [378, 516], [394, 460]]), BLACK, sp([[404, 380], [430, 380], [420, 540], [390, 540], [408, 460]]));
    b.pi(sp([[284, 552, 1], [302, 560, 1], [292, 588, 1], [276, 578, 1]]), WHITE, "", 2);
    b.pi(sp([[334, 552, 1], [350, 556, 1], [348, 584, 1], [332, 580, 1]]), WHITE, "", 2);
    hands(b, 314, 576, GLOVE, 0.92);
    // 얼굴
    const fid = headBase(b, HT, MAN, SKIN_O, { ear: true, bang: [[-70, -64], [-30, -74], [10, -76], [50, -70], [74, -62]] });
    const fs: FS = {
      eyes: [{ x: 8, y: 2, w: 40, h: 22, s: 1 }, { x: -15, y: 2, w: 28, h: 21, s: -1 }],
      brows: [[[6, -22], [52, -26], 4], [[-14, -20], [-48, -16], 3]],
      bw: 5, bc: "#9aa0ac",
      iris: ["#353c4c", "#6a7488", "#cfd8e6"], pupil: "#191c24",
      lash: "#4a4a54", lw: 1,
      mouth: [0, 74], lip: "#9a5a50", skin: SKIN_O, blush: "#e8a09a", cheek: [30, 36, -40, 32],
    };
    const W = SKIN_O.l;
    let face = drawFace(b, fs, ex);
    face += ln("M22 42Q32 58 28 76M-30 42Q-38 58 -32 70M54 2l9 -3M53 9l8 4M14 17Q30 23 46 17M-14 17Q-26 21 -38 16M-30 -44Q0 -50 40 -46", W, 1.3, op(0.55));
    // 콧수염
    face += pa(sp([[-2, 52], [10, 50], [24, 54], [38, 62, 1], [22, 62], [8, 60], [-2, 62], [-12, 60], [-26, 64, 1], [-16, 54]]), HH.b, ` stroke="${HH.l}" stroke-width="1.8"`) + ln("M2 55Q14 55 24 59M-4 56Q-12 57 -18 60", HH.s, 1.2);
    b.g(HT, face);
    if (ex.dk) faceDk(b, fid, HT, ex.dk, "#1e1a2e");
    // 머리(올백)
    b.pc(lock([[64, -64], [84, -44], [92, -14], [86, 4]], 22), HH, "", HT, 2);
    b.pc(sp([[-64, -46], [-72, -94], [-46, -130], [4, -146], [58, -140], [94, -110], [108, -62], [104, -22], [90, -32], [80, -66], [42, -86], [-10, -90], [-50, -74]]), HH, sp([[40, -150], [120, -110], [110, -20], [84, -60], [60, -120]]), HT, 2.4, band(-60, 90, -118, 16, 5, 14, 0.2));
    b.g(HT, ln("M-50 -78Q-20 -126 60 -132M-30 -88Q10 -126 84 -114M0 -90Q44 -116 98 -88M32 -86Q70 -96 102 -56", HH.l, 1.4, op(0.6)));
    browsOf(b, HT, fs, ex, 0.95);
    // 모노클 + 줄
    const [ne] = fs.eyes;
    const mx = ne.x + ne.w * 0.5, my = ne.y + 1;
    const glint = e === "smirk" ? `<path d="M${f(mx - 14)} ${f(my - 12)}L${f(mx + 10)} ${f(my + 12)}L${f(mx + 16)} ${f(my + 4)}L${f(mx - 4)} ${f(my - 18)}Z" fill="#fff" opacity=".85"/>` : "";
    b.g(HT, `<circle cx="${f(mx)}" cy="${f(my)}" r="25" fill="#e8f2ff" fill-opacity=".14" stroke="#c9ced8" stroke-width="3"/><circle cx="${f(mx)}" cy="${f(my)}" r="25" fill="none" stroke="#555d6a" stroke-width="1" />${glint}` +
      ln(`M${f(mx + 12)} ${f(my + 22)}Q${f(mx + 44)} 150 ${f(mx + 44)} 250`, "#c9ced8", 2, ` stroke-dasharray="3 2.4"`) + ln("M-8 -14Q0 -10 8 -14", "none", 0));
  },
};

// ── 무면 ──
const ROBE: Pal = { b: "#2b2a32", s: "#18171d", l: "#07070a", h: "#4a4956" };
const MASK: Pal = { b: "#f6f4f0", s: "#d8d2ca", l: "#8a837a", h: "#ffffff" };
const SV: Pal = { b: "#dae0e8", s: "#9aa3b0", l: "#555d6a", h: "#ffffff" };
const faceless: Char = {
  draw(b, _ex, e) {
    const HT = "translate(296 206) rotate(-3) scale(.88)";
    // 두건 뒤
    b.pc(sp([[-94, -40], [-98, -110], [-62, -164], [0, -184], [72, -172], [120, -128], [138, -60], [142, 20], [132, 96], [96, 150], [-40, 154], [-88, 104], [-102, 40]]), ROBE, sp([[60, -190], [150, -120], [150, 160], [90, 160], [120, 40]]), HT);
    // 로브
    b.pc(sp([[240, 330], [200, 352], [180, 400], [176, 500], [186, 640], [178, 1000, 1], [432, 1000, 1], [424, 640], [436, 500], [430, 400], [410, 352], [370, 330]]), ROBE, sp([[360, 330], [430, 400], [436, 1000], [370, 1000], [392, 640], [398, 460]]));
    b.add(ln("M250 520Q240 760 234 1000M300 560Q304 780 300 1000M360 520Q372 760 380 1000", ROBE.h, 1.5, op(0.6)));
    // 가슴의 황혼 문양
    const ex0 = 306, ey = 452;
    let r = "";
    for (let i = 0; i < 7; i++) {
      const a = Math.PI + (i + 0.5) * (Math.PI / 7);
      r += `M${f(ex0 + Math.cos(a) * 30)} ${f(ey + Math.sin(a) * 30)}L${f(ex0 + Math.cos(a) * 44)} ${f(ey + Math.sin(a) * 44)}`;
    }
    b.add(ln(r, SV.b, 3) + pa(`M${ex0 - 24} ${ey}A24 24 0 0 1 ${ex0 + 24} ${ey}Z`, SV.b, ` stroke="${SV.l}" stroke-width="1.6"`) + ln(`M${ex0 - 46} ${ey + 1}H${ex0 + 46}M${ex0 - 30} ${ey + 10}H${ex0 + 30}M${ex0 - 16} ${ey + 18}H${ex0 + 16}`, SV.b, 2.6));
    // 소매
    b.pc(sp([[212, 360], [184, 382], [168, 470], [172, 590], [210, 610], [232, 560], [232, 460]]), ROBE, "", "", 2.4, sp([[190, 400], [198, 400], [186, 560], [180, 560]]));
    // 칼(가까운 손, 아래로)
    b.pc(sp([[420, 666, 1], [432, 666, 1], [452, 960], [446, 996, 1], [434, 962]]), SV, sp([[428, 666], [440, 666], [452, 1000], [444, 1000]]), "", 1.8);
    b.pi(`M406 662H446L444 672H408Z`, SV, "", 1.8);
    b.pi(`M418 604H432V664H418Z`, { b: "#3a3440", s: "#241f28", l: "#0c0a0e" }, "", 1.8);
    b.pc(sp([[400, 360], [432, 382], [448, 480], [444, 600], [408, 622], [394, 560], [400, 460]]), ROBE, sp([[420, 370], [452, 400], [452, 620], [424, 620], [432, 480]]));
    b.pi(sp([[404, 604], [440, 602], [446, 632], [432, 650], [406, 646]]), { b: "#1e1d24", s: "#121116", l: "#050507" }, "", 2);
    // 두건 속 어둠 + 가면
    b.pi(sp([[-74, -60], [-72, -122], [-30, -152], [30, -154], [82, -126], [98, -60], [92, 20], [70, 84], [20, 112], [-40, 104], [-70, 52], [-80, 0]]), { b: "#0b0b10", s: "#000", l: "#050507" }, HT);
    const maskPts: Pt[] = [[-56, -80], [-60, -30], [-58, 10], [-52, 40], [-40, 66], [-22, 86], [-4, 96], [12, 94], [32, 82], [50, 60], [62, 30], [66, -10], [62, -60], [40, -96], [0, -108], [-36, -100]];
    const mid = b.pc(sp(maskPts), MASK, sp([[46, -110], [58, -40], [56, 10], [46, 50], [26, 80], [6, 104], [100, 100], [100, -110]]) + sp([[-60, 30], [-40, 60], [-10, 90], [-60, 100]]), HT, 2.2,
      sp([[-30, -90], [-12, -96], [-4, -60], [-10, -20], [-20, -30], [-24, -70]]));
    b.inside([mid], HT, pa(sp([[-4, -40], [4, -38], [2, 30], [-6, 40], [-12, 30]]), MASK.s, op(0.5)));
    if (e === "angry") {
      b.add(`<style>.${b.p}-rg{animation:${b.p}-rg 1.6s ease-in-out infinite}@keyframes ${b.p}-rg{0%,100%{opacity:.55}50%{opacity:1}}@media (prefers-reduced-motion:reduce){.${b.p}-rg{animation:none}}</style>`);
      b.g(HT, `<g class="${b.p}-rg">` + ln(sp(maskPts), "#d8323c", 9, op(0.35)) + ln(sp(maskPts), "#ff5a5a", 3.4, op(0.9)) + `</g>`);
      b.add(ln("M433 672L450 962", "#ff6060", 1.4, op(0.8)));
    }
    // 두건 테
    b.pc(sp([[-82, 40], [-88, -60], [-72, -132], [-20, -164], [42, -162], [96, -126], [112, -60], [108, 16], [94, -40], [72, -98], [30, -124], [-20, -122], [-56, -98], [-70, -40], [-72, 30]]), ROBE, sp([[40, -170], [120, -120], [120, 20], [96, -60], [70, -110]]), HT, 2.4, sp([[-70, -110], [-40, -140], [-30, -134], [-60, -100]]));
  },
};

// ── 토비 ──
const TH: Pal = { b: "#8c5c34", s: "#63401f", l: "#35200d", h: "#c68e5a" };
const TS: Pal = { b: "#fbe0cc", s: "#e8b494", l: "#a86a52" };
const SH: Pal = { b: "#eedc9c", s: "#cfb46a", l: "#7e6632" };
const SU: Pal = { b: "#7a4e2c", s: "#5a3619", l: "#2e1a08" };
const PN: Pal = { b: "#6e5c4a", s: "#4e4032", l: "#231a12" };
const toby: Char = {
  tweak(ex, e) {
    if (e === "smile") return { ...ex, arc: false, o: 0.92, lo: 0.36, m: "gap" };
    return ex;
  },
  fade: [860, 998],
  draw(b, ex) {
    const HT = "translate(300 442) rotate(-4) scale(.8)";
    // 뒷머리
    b.pi(sp([[-78, -50], [-82, -104], [-50, -144], [0, -158], [56, -152], [98, -120], [114, -70], [116, -20], [104, 24, 1], [92, 4], [80, 30, 1], [72, -20], [-70, 0]]), { ...TH, b: TH.s }, HT);
    neck(b, HT, KID, TS);
    // 셔츠
    b.pc(sp([[276, 536], [236, 548], [214, 578], [206, 640], [212, 700], [220, 730], [390, 730], [398, 700], [402, 640], [394, 578], [372, 548], [336, 534]]), SH, sp([[340, 540], [396, 580], [404, 730], [360, 730], [372, 620]]));
    b.add(ln("M252 600Q262 660 256 720M330 610Q344 670 338 720", SH.l, 1.4, op(0.6)));
    // 소매(늘어진 어깨)
    b.pc(sp([[228, 554], [204, 572], [190, 640], [186, 720], [194, 764], [224, 766], [230, 700], [236, 630]]), SH, sp([[222, 580], [240, 580], [232, 770], [216, 770], [224, 680]]));
    b.pc(sp([[380, 552], [406, 568], [420, 640], [424, 720], [416, 764], [388, 766], [384, 700], [378, 630]]), SH, sp([[400, 570], [430, 600], [430, 770], [404, 770], [408, 660]]));
    b.pi(sp([[190, 748, 1], [226, 750, 1], [226, 772, 1], [190, 770, 1]]), { ...SH, b: SH.s }, "", 2);
    b.pi(sp([[386, 750, 1], [418, 748, 1], [418, 770, 1], [386, 772, 1]]), { ...SH, b: SH.s }, "", 2);
    b.pc(sp([[196, 770], [220, 770], [224, 790], [210, 800], [196, 792]]), TS, "", "", 2);
    b.pc(sp([[390, 770], [414, 770], [416, 792], [402, 800], [388, 790]]), TS, sp([[404, 770], [420, 770], [420, 800], [404, 800]]), "", 2);
    // 바지 + 기운 천
    b.pc(sp([[226, 716], [388, 710], [398, 820], [404, 1000, 1], [216, 1000, 1], [220, 820]]), PN, sp([[330, 712], [390, 712], [404, 1000], [356, 1000]]));
    b.add(ln("M310 740L308 1000", PN.l, 1.6, op(0.8)));
    b.pc(`M334 850L372 846L376 886L336 890Z`, { b: "#a07c4a", s: "#7c5c32", l: "#3e2c14" }, "", "", 1.8);
    b.add(ln("M338 854l4 4M346 852l4 4M358 850l4 4M368 849l3 4M340 886l4 -4M372 882l-3 -4", "#3e2c14", 1.1));
    // 멜빵
    b.pi(sp([[266, 546, 1], [282, 544, 1], [272, 718, 1], [256, 718, 1]]), SU, "", 2);
    b.pi(sp([[344, 540, 1], [360, 542, 1], [354, 716, 1], [338, 716, 1]]), SU, "", 2);
    b.add(`<circle cx="264" cy="712" r="5" fill="#caa060" stroke="#5a3a14" stroke-width="1.4"/><circle cx="346" cy="710" r="5" fill="#caa060" stroke="#5a3a14" stroke-width="1.4"/>`);
    // 목깃
    b.pi(sp([[286, 536], [272, 544], [290, 580, 1], [304, 560]]), SH, "", 2);
    b.pi(sp([[338, 532], [352, 540], [330, 578, 1], [318, 558]]), SH, "", 2);
    // 얼굴
    const fid = headBase(b, HT, KID, TS, { ear: true, bang: [[-72, -34], [-50, -30], [-40, -40], [-28, -22], [-10, -34], [0, -26], [20, -36], [30, -22], [48, -32], [70, -40]] });
    const fs: FS = {
      eyes: [{ x: 5, y: 2, w: 46, h: 44, s: 1 }, { x: -15, y: 2, w: 33, h: 42, s: -1 }],
      brows: [[[8, -38], [52, -41], 4], [[-14, -36], [-46, -32], 3]],
      bw: 4.6, bc: "#5a3a1c",
      iris: ["#5a3414", "#aa6a2c", "#f6d088"], pupil: "#2e1808",
      lash: "#3a2010", lw: 1.1,
      mouth: [-2, 58], lip: "#a45c4a", skin: TS, blush: "#f09080", cheek: [30, 36, -40, 32],
    };
    b.g(HT, `<ellipse cx="40" cy="44" rx="13" ry="7" fill="#8a6c52" opacity=".35" transform="rotate(-18 40 44)"/>` + ln("M32 46l12 -5M36 50l8 -3", "#7a5c42", 1.4, op(0.45)) + drawFace(b, fs, ex));
    if (ex.dk) faceDk(b, fid, HT, ex.dk);
    // 머리(헝클어짐)
    for (const [c, w] of [
      [[[-10, -140], [10, -168], [34, -178]], 26],
      [[[36, -140], [70, -160], [98, -158]], 24],
      [[[-34, -128], [-62, -148], [-84, -146]], 22],
      [[[80, -110], [110, -98], [128, -76]], 22],
      [[[90, -70], [114, -46], [120, -18]], 22],
      [[[-64, -80], [-90, -80], [-104, -64]], 20],
    ] as [Pt[], number][]) b.pc(lock(c, w, 1, 0.4), TH, "", HT, 2.2);
    bangsOf(b, HT, TH, [[-70, -40], [-78, -94], [-50, -136], [0, -154], [56, -148], [96, -114], [104, -60], [96, -30], [60, -74], [10, -86], [-44, -76]], [
      [[[-30, -120], [-52, -84], [-66, -56], [-80, -40]], 30],
      [[[-12, -126], [-28, -92], [-34, -60], [-44, -30]], 32],
      [[[6, -128], [6, -94], [2, -62], [-6, -36]], 30],
      [[[22, -126], [34, -94], [36, -62], [28, -30]], 30],
      [[[38, -122], [56, -94], [64, -62], [76, -40]], 30],
      [[[54, -116], [80, -90], [92, -64], [106, -50]], 24],
    ], [-72, 100, -96, 14, 6, 14, 0.14]);
    browsOf(b, HT, fs, ex, 0.8);
  },
};

const CHARS: Record<string, Char> = { lili, toby, cecilia, adelhart, faceless, herman };

function render(id: string, expr: string): string {
  const c = CHARS[id];
  const e = EXPR[expr] ? expr : "normal";
  const ex = c.tweak ? c.tweak({ ...EXPR[e] }, e) : { ...EXPR[e] };
  const b = new B(`ch-${id}-${e}`);
  c.draw(b, ex, e);
  return finish(b, c);
}

export const CHARS_B: Record<string, (expr: string) => string> = Object.fromEntries(
  Object.keys(CHARS).map((k) => [k, (expr: string) => render(k, expr)]),
);
