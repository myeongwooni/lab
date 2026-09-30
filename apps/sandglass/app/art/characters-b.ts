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
  b.defs.push(`<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity="${dk}"/><stop offset=".7" stop-color="${col}" stop-opacity="${dk * 0.6}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient>`);
  b.inside([faceId], tf, `<rect x="-90" y="-80" width="190" height="104" fill="url(#${gid})"/>`);
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
    const HT = "translate(302 302) rotate(-3) scale(.9)";
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
    b.inside([cap, ...bids], HT, pa(sp([[40, -140], [100, -110], [100, 0], [60, -40], [56, -80]]), LH.s, op(0.7)) + pa(band(-66, 86, -94, 12, 6, 14, 0.12), LH.h));
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
    for (let i = 0; i < 9; i++) {
      const t = i / 8, x = -72 + t * 172, y = -92 - Math.sin(t * Math.PI) * 20 + t * 30;
      sc += `<circle cx="${f(x)}" cy="${f(y)}" r="6.5"/>`;
    }
    b.g(HT, `<g fill="${LT.b}" stroke="${LT.l}" stroke-width="1.8">${sc}</g>`);
    // 매듭 꼬리
    b.pi(sp([[98, -76], [132, -54], [124, -32, 1], [96, -56]]), LT, HT, 2);
    b.pi(sp([[96, -70], [118, -30], [102, -18, 1], [90, -58]]), LT, HT, 2);
    // 눈썹(앞머리 위, 반투명)
    b.g(HT, `<g opacity=".85">${fs.brows.map((br, i) => drawBrow(br, ex, fs, i === 0)).join("")}</g>`);
  },
};

const CHARS: Record<string, Char> = { lili };

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
