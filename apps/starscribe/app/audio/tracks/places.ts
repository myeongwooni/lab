// Place themes: archive, tower, north, sea, festival.

import { Score, harm, voicing, above, Seg, rng, pc } from "../theory";
import type { Track } from "../track";

/** waltz accompaniment: pizz bass on 1, harp dyads on 2 & 3 */
function waltz(s: Score, segs: Seg[], v: number, bassLo = 43, up = 59): void {
  for (const seg of segs) {
    for (let b = 0; b < seg.d; b += 1) {
      const t = seg.t + b;
      if (b === 0) s.n("pz", t, 0.8, above(seg.c.bass, bassLo), v);
      else {
        const vs = voicing(seg.c, up, 2);
        vs.forEach((m, i) => s.n("harp", t + i * 0.015, 0.7, m, v * 0.6));
      }
    }
  }
}

// ================================================================ archive — 3/4, G major

export function archive(): Track {
  const s = new Score(101);
  const A1 = "Gmaj7:3 Em7:3 Am7:3 D7:3 Bm7:3 E7:3 Am7:3 D7sus4:1.5 D7:1.5";
  const A2 = "Gmaj7:3 Em7:3 Cmaj7:3 Cm6:3 Bm7:3 E7:3 Am7:2 D7:1 G:3";
  const B =
    "Em:3 Em/D:3 Cmaj7:3 B7:3 Em:3 Am/C:3 Am7:3 B7:3 Cmaj7:3 D:3 Bm7:3 Em:3 Am7:3 D:3 G/B:3 D7sus4:1.5 D7:1.5";
  const M1 = "B5:1 A5:.5 B5:.5 D6:1 | G5:2 F#5:.5 E5:.5 | E5:1 C6:1.5 B5:.5 | A5:3 | F#5:1 E5:.5 F#5:.5 A5:1 | G#5:2 B5:1 | C6:1 B5:.5 A5:.5 G5:.5 E5:.5 | G5:1.5 F#5:1.5";
  const M2 = "B5:1 A5:.5 B5:.5 D6:1 | E6:2 D6:.5 B5:.5 | C6:1 B5:1 G5:1 | A5:2 Eb5:1 | D5:1 F#5:.5 A5:.5 D6:1 | D6:1.5 B5:.5 G#5:1 | A5:1 C6:.5 B5:.5 F#5:1 | G5:2 r:1";
  const MB =
    "E5:1 F#5:.5 G5:.5 B5:1 | A5:1.5 G5:.5 F#5:1 | E5:2 G5:1 | F#5:3 | E5:1 F#5:.5 G5:.5 B5:1 | C6:1.5 B5:.5 A5:1 | G5:1 A5:.5 G5:.5 E5:1 | D#5:2 F#5:1 | " +
    "E5:1 G5:1 B5:1 | A5:2 F#5:1 | B5:1.5 A5:.5 F#5:1 | G5:3 | C6:1 B5:.5 A5:.5 E5:1 | F#5:1 A5:1 D6:1 | D6:2 B5:1 | A5:3";

  // A (0-48)
  const h1 = harm(A1, 0);
  const h2 = harm(A2, 24);
  s.seq("cel", 0, M1, { v: 1.0, hum: 0.02 });
  s.seq("cel", 24, M2, { v: 1.0, hum: 0.02 });
  waltz(s, [...h1, ...h2], 0.5);
  s.pad("pad", h2, 55, 3, 0.12);
  s.seq("pz", 46, "D3:1 F#3:1", { v: 0.8 });

  // B (48-96): flute, flowing harp
  const hb = harm(B, 48);
  s.seq("fl", 48, MB, { v: 0.95, dyn: (t) => (t < 24 ? 1 : 1.12) });
  s.arp("harp", hb, [0, 1, 2, 3, 2, 1], 0.5, { lo: 40, up: 52, v: 0.32, ring: 1.2, hum: 0.015 });
  hb.forEach((seg, i) => {
    s.n("pz", seg.t, 0.8, above(seg.c.bass, 40), 0.5);
    if (i % 2 === 1) s.n("cel", seg.t + 1.5, 1, voicing(seg.c, 84, 1)[0], 0.28);
  });
  s.pad("pad", hb, 55, 3, 0.14);

  // A' (96-144): celesta again, flute countermelody in long tones
  const h3 = harm(A1, 96);
  const h4 = harm(A2, 120);
  s.seq("cel", 96, M1, { v: 0.95, hum: 0.02 });
  s.seq("cel", 120, M2, { v: 0.95, hum: 0.02 });
  waltz(s, [...h3, ...h4], 0.46);
  s.pad("fl", [...h3, ...h4].filter((x) => x.d >= 3), 62, 1, 0.3);
  s.pad("pad", h3, 55, 3, 0.1);
  s.seq("pz", 142, "D3:1", { v: 0.7 });

  return {
    id: "archive",
    bpm: 104,
    len: 144,
    ev: s.ev,
    ch: {
      cel: { inst: "celesta", pan: 0.15, rev: 0.4, prio: 2, gain: 1.1 },
      fl: { inst: "flute", pan: 0.25, rev: 0.4, prio: 2, gain: 0.85 },
      pz: { inst: "pizz", pan: -0.1, rev: 0.25 },
      harp: { inst: "harp", pan: -0.35, rev: 0.35, gain: 0.85 },
      pad: { inst: "str", pan: 0.3, rev: 0.45, fx: "body", gain: 0.6, bright: 0.6, att: 1.0, prio: 0 },
    },
  };
}

// ================================================================ tower — 4/4, A minor

export function tower(): Track {
  const s = new Score(202);
  const r = rng(77);
  const stars = (segs: Seg[], v: number, dens = 0.6): void => {
    for (const seg of segs) {
      for (let b = 0; b < seg.d; b += 2) {
        if (r() > dens) continue;
        const vs = voicing(seg.c, 76, 3);
        const at = seg.t + b + 1.5 + (r() < 0.5 ? 0 : 1);
        if (at < seg.t + seg.d) s.n("pnoR", at, Math.min(3, seg.t + seg.d - at + 0.3), vs[Math.floor(r() * 3)], v * (0.8 + r() * 0.4));
      }
    }
  };
  const lhOpen = (segs: Seg[], v: number): void => {
    for (const seg of segs) {
      const b = above(seg.c.bass, 33);
      const vs = voicing(seg.c, b + 7, 2);
      s.n("pnoL", seg.t, seg.d + 0.5, b, v);
      vs.forEach((m, i) => s.n("pnoL", seg.t + 0.08 + i * 0.06, seg.d + 0.3, m, v * 0.7));
    }
  };

  // intro (0-8)
  s.n("pnoL", 0, 8.5, 33, 0.4);
  s.n("pnoL", 0.05, 8.5, 40, 0.3);
  s.seq("pnoR", 2, "E6:2 r:1.5 B5:1.5 C6:3", { v: 0.6 });

  // A (8-40)
  const ha = harm("Am:4 Fmaj7:4 Dm7:4 E7sus4:2 E7:2 Am:4 Fmaj7:4 Dm7:2 G7:2 Cmaj7:4", 8, 4);
  s.seq("vc", 8, "E4:3 D4:.5 C4:.5 | C4:2 A3:1 G3:1 | F4:3 E4:1 | A3:2 G#3:2 | E4:3 D4:.5 C4:.5 | A4:2 G4:1 F4:1 | F4:2 D4:1 B3:1 | E4:4", {
    v: 1.0,
    leg: 0.97,
  });
  lhOpen(ha, 0.34);
  stars(ha, 0.3);
  s.pad("pad", ha, 52, 3, 0.1);

  // B (40-72): warmth; the piano remembers the lullaby, a whistle answers
  const hb = harm("Fmaj7:4 F:2 Dm7:2 Dm7:2 Bbmaj7:2 Gm7:4 C7sus4:2 C7:2 Fmaj7:4 Bm7b5:4 E7:4", 40, 4);
  s.seq("pnoR", 38, "C5:1 F5:1 | A5:3 G5:1 F5:1 G5:1 D6:4 C6:3", { v: 0.95, hum: 0.02 });
  s.seq("vc", 40, "F2:4 | F2:2 D3:2 | D3:2 Bb2:2 | D4:2 Bb3:1 G3:1 | G3:2 E3:2 | A3:4 | F4:2 D4:1 B3:1 | B3:2 G#3:2", { v: 0.95, leg: 0.97 });
  s.arp("pnoL", hb, [0, 1, 2, 3], 1, { lo: 29, up: 41, v: 0.28, ring: 3, hum: 0.03 });
  s.seq("wh", 59, "C5:.5 F5:.5 | A5:1.5 G5:.5 F5:1 G5:1", { v: 0.75 });
  s.pad("pad", hb, 53, 3, 0.13);
  stars(hb.slice(4), 0.26, 0.5);

  // A' (72-104)
  const ha2 = harm("Am:4 Fmaj7:4 Dm7:4 E7sus4:2 E7:2 Am:4 Fmaj7:4 Dm7:2 E7:2 Amadd9:4", 72, 4);
  s.seq("vc", 72, "E4:3 D4:.5 C4:.5 | C4:2 A3:1 G3:1 | F4:3 E4:1 | A3:2 G#3:2 | E4:3 D4:.5 E4:.5 | C5:2 A4:1 G4:1 | F4:2 E4:1 G#3:1 | A3:4", {
    v: 1.0,
    leg: 0.97,
  });
  s.arp("pnoL", ha2, [0, 1, 2, 3, 2, 1, 2, 3], 0.5, { lo: 33, up: 45, v: 0.24, ring: 2, hum: 0.03 });
  stars(ha2, 0.28, 0.5);
  s.pad("pad", ha2, 52, 3, 0.1);

  // coda (104-112)
  const hc = harm("Fmaj7#11:4 E7sus4:4", 104, 4);
  lhOpen(hc, 0.3);
  s.seq("pnoR", 105, "B5:1 E6:2 r:1 | A5:3", { v: 0.55 });

  return {
    id: "tower",
    bpm: 58,
    len: 112,
    ev: s.ev,
    ch: {
      pnoR: { inst: "piano", pan: 0.05, rev: 0.45, prio: 2 },
      pnoL: { inst: "piano", pan: -0.1, rev: 0.4, gain: 0.9 },
      vc: { inst: "cello", pan: 0.25, rev: 0.38, prio: 2, gain: 1.1 },
      wh: { inst: "whistle", pan: 0.45, rev: 0.6, prio: 2, gain: 0.7 },
      pad: { inst: "str", pan: -0.3, rev: 0.55, gain: 0.55, bright: 0.5, att: 1.5, prio: 0 },
    },
  };
}

// ================================================================ north — 4/4, D dorian

export function north(): Track {
  const s = new Score(303);
  // drones: open fifth D-A, re-struck every 8 beats with overlap (seamless)
  for (let t = 0; t < 96; t += 8) {
    s.n("drone", t, 8.6, 38, 0.42);
    s.n("drone", t, 8.6, 45, 0.36);
    s.n("choir", t, 8.6, 50, 0.22);
    s.n("choir", t, 8.6, 57, 0.18);
  }
  const roll = (t: number, notes: number[], v: number): void => notes.forEach((m, i) => s.n("harp", t + i * 0.18, 3, m, v));

  // A (0-32)
  const MA = "r:2 A4:1 D5:1 | E5:3 D5:.5 E5:.5 | F5:2 E5:1 C5:1 | D5:4 | A4:1 D5:1 F5:1 G5:1 | A5:3 G5:.5 F5:.5 | G5:2 E5:2 | D5:4";
  s.seq("fl", 0, MA, { v: 1.0 });
  [0, 8, 16, 24].forEach((t) => roll(t, [50, 57, 62, 69], 0.3));

  // B (32-64): noble parallel fifths
  const hb = harm("Bb5:4 C5:4 F5:4 G5:4 Bb5:4 C5:4 Dm:4 Asus4:2 A:2", 32, 4);
  s.seq("fl", 32, "D5:1 F5:1 Bb5:2 | A5:1.5 G5:.5 E5:2 | F5:1 A5:1 C6:2 | D6:3 C6:.5 B5:.5 | A5:2 F5:2 | G5:2 E5:2 | F5:1 E5:1 D5:1 C5:1 | E5:4", {
    v: 1.05,
    dyn: (t) => (t < 16 ? 1 + t / 40 : 1.3 - (t - 16) / 40),
  });
  s.pad("str", hb, 50, 3, 0.34, { sh: 1 });
  s.bass("cb", hb, 33, 0.35);
  s.n("timp", 32, 3, 46, 0.35);
  s.n("timp", 44, 3, 43, 0.4);
  s.n("timp", 48, 3, 46, 0.3);
  hb.forEach((seg) => roll(seg.t + 2, voicing(seg.c, 62, 3), 0.22));

  // A' (64-96): the whistle — and, in bar 5, the lullaby's opening in D minor
  s.seq("wh", 64, "r:2 A4:1 D5:1 | E5:3 D5:.5 E5:.5 | F5:2 E5:1 C5:1 | D5:3 A4:.5 D5:.5 | F5:1.5 E5:.5 D5:.5 E5:.5 r:1 | Bb5:2 A5:2 | G5:1 F5:1 E5:2 | D5:4", {
    v: 0.95,
  });
  s.seq("fl", 80, "F4:4 | D4:2 F4:2 | G4:2 A4:2 | F4:4", { v: 0.5 });
  [64, 72, 80, 88].forEach((t) => roll(t + 0.5, [45, 50, 57, 62, 69], 0.26));
  s.pad("str", harm("Dm:8 Gm/D:8 Bb/D:8 Dsus4:4 Dm:4", 64, 8), 50, 3, 0.2);

  return {
    id: "north",
    bpm: 63,
    len: 96,
    ev: s.ev,
    ch: {
      fl: { inst: "flute", pan: 0.1, rev: 0.6, prio: 2, gain: 1.05 },
      wh: { inst: "whistle", pan: -0.1, rev: 0.65, prio: 2, gain: 0.85 },
      drone: { inst: "str", pan: -0.2, rev: 0.5, gain: 0.8, bright: 0.45, att: 2.5, rel: 2.5, prio: 1 },
      choir: { inst: "choir", fx: "oo", pan: 0.3, rev: 0.6, gain: 0.55, att: 2.5, rel: 2.5, prio: 0 },
      str: { inst: "str", pan: 0.25, rev: 0.5, fx: "body", gain: 0.8, bright: 0.7, prio: 0 },
      cb: { inst: "str", pan: 0, rev: 0.3, gain: 0.7, bright: 0.45 },
      harp: { inst: "harp", pan: -0.45, rev: 0.55, gain: 0.8 },
      timp: { inst: "timp", pan: 0, rev: 0.6, gain: 0.8 },
    },
  };
}

// ================================================================ sea — no pulse, E-flat lydian

export function sea(): Track {
  const s = new Score(404);
  const r = rng(4242);
  const prog = harm("Ebmaj7:8 F/Eb:8 Cm9:8 Abmaj7#11:8 Ebmaj7:8 F/Eb:8 Gm7:8 Bb7sus4:8 Bmaj7:8 C#/B:8 Abmaj9:8 Bb7sus4:8", 0, 8);
  s.pad("choir", prog, 55, 4, 0.34, { sh: 1, over: 1.2 });
  s.bass("choirLo", prog.map((x) => ({ ...x, d: x.d + 1.2 })), 39, 0.3);
  s.pad("choirLo", prog, 46, 1, 0.24, { over: 1.2 });
  s.pad("harm", prog, 79, 2, 0.16, { sh: 1, over: 1 });
  // bells: irregular, drawn from each chord plus the lydian 4th
  for (const seg of prog) {
    let t = seg.t + 0.3 + r() * 1.2;
    const pool = [...seg.c.pcs, pc(seg.c.root + 2)];
    while (t < seg.t + seg.d - 0.5) {
      const p = pool[Math.floor(r() * pool.length)];
      const m = above(p, 72 + Math.floor(r() * 14));
      s.n("bell", t, 4, m, 0.22 + r() * 0.22);
      if (r() < 0.25) s.n("cel", t + 0.4 + r() * 0.5, 2, m + 12, 0.18);
      t += 1.1 + r() * 2.2;
    }
  }
  // the name, surfacing from the water (slow, in bells)
  const name = (t: number, tr: number): void => {
    s.seq("bellM", t, "Bb5:1 C6:1 | Eb6:2.5 D6:.8 C6:3", { tr, v: 1.0 });
  };
  name(34, 0);
  name(66, -4);
  return {
    id: "sea",
    bpm: 60,
    len: 96,
    ev: s.ev,
    gain: 1.05,
    ch: {
      choir: { inst: "choir", fx: "ah", pan: 0.2, rev: 0.8, gain: 0.75, att: 3, rel: 3, prio: 1 },
      choirLo: { inst: "choir", fx: "oo", pan: -0.25, rev: 0.7, gain: 0.7, att: 3, rel: 3, prio: 1 },
      harm: { inst: "str", pan: -0.4, rev: 0.8, gain: 0.35, bright: 0.6, att: 3, rel: 3, prio: 0 },
      bell: { inst: "glass", pan: 0.35, rev: 0.85, gain: 0.9, prio: 1 },
      bellM: { inst: "glass", pan: -0.1, rev: 0.8, gain: 1.1, prio: 2 },
      cel: { inst: "celesta", pan: -0.45, rev: 0.9, gain: 0.8, prio: 0 },
    },
  };
}

// ================================================================ festival — 6/8 (beat = eighth)

export function festival(): Track {
  const s = new Score(505);
  const HA = "D:6 G:6 D:6 A:6 D:6 C:6 G:3 A:3 D:6";
  const HB = "Bm:6 G:6 D:6 A:6 Bm:6 G:6 Em:3 A:3 D:6";
  const HC = "D:6 D:6 C:6 A:6 D:6 D:6 C:6 A:6";
  const MA = "D5:1 F#5:1 A5:1 D6:2 A5:1 | B5:2 G5:1 E5:2 G5:1 | F#5:2 A5:1 D5:2 F#5:1 | E5:3 C#5:2 A4:1 | D5:1 F#5:1 A5:1 D6:2 A5:1 | C6:2 G5:1 E5:2 G5:1 | B5:1 A5:1 G5:1 F#5:1 E5:1 C#5:1 | D5:3 D5:2 A4:1";
  const MB = "F#5:2 D5:1 B4:2 D5:1 | G5:2 B5:1 D6:2 B5:1 | A5:2 F#5:1 D5:2 F#5:1 | E5:1 F#5:1 G5:1 A5:3 | B5:2 A5:1 F#5:2 D5:1 | G5:1 A5:1 B5:1 D6:2 B5:1 | G5:1 F#5:1 E5:1 A5:2 G5:1 | F#5:3 D5:3";
  const MC = "A5:1 B5:1 A5:1 F#5:3 | A5:1 B5:1 A5:1 D6:3 | C6:1 B5:1 A5:1 G5:3 | E5:1 F#5:1 G5:1 A5:3";

  const groove = (segs: Seg[], full: boolean): void => {
    for (const seg of segs) {
      for (let i = 0; i < seg.d; i++) {
        const t = seg.t + i;
        const pos = Math.round(t) % 6;
        const vs = voicing(seg.c, 57, 3);
        if (pos === 0 || pos === 3) {
          vs.forEach((m, k) => s.n("lute", t + k * 0.06, 1.8, m, pos === 0 ? 0.5 : 0.42));
          s.n("pz", t, 1.5, above(pos === 0 ? seg.c.bass : pc(seg.c.root + 7), 38), 0.6);
        } else if (full && (pos === 2 || pos === 5)) vs.slice(1).forEach((m, k) => s.n("lute", t + k * 0.04, 0.8, m, 0.25));
      }
    }
  };
  const drums = (t0: number, bars: number, level: number): void => {
    for (let b = 0; b < bars; b++) {
      const t = t0 + b * 6;
      s.n("dr", t, 1, 60, 0.85 * level);
      s.n("dr", t + 3, 1, 60, 0.6 * level);
      s.n("sl", t + 2, 1, 60, 0.4 * level);
      s.n("sl", t + 5, 1, 60, 0.5 * level);
      if (b % 4 === 3) s.n("sl", t + 4, 1, 60, 0.35 * level);
      for (let k = 0; k < 6; k++) s.n("tb", t + k, 0.5, 60, (k === 0 || k === 3 ? 0.55 : 0.3) * level);
    }
  };

  // intro (0-24): drums and a drone
  drums(0, 4, 0.8);
  s.n("drone", 0, 24.5, 50, 0.3);
  s.n("drone", 0, 24.5, 57, 0.26);
  groove(harm("D:6 D:6 D:6 A:6", 0, 6).slice(2), false);

  // A (24-72), A' (72-120)
  s.seq("fl", 24, MA, { v: 1.0 });
  groove(harm(HA, 24, 6), false);
  drums(24, 8, 1);
  s.seq("fl", 72, MA, { v: 1.05 });
  s.seq("fid", 72, MA, { v: 0.7, tr: -12 });
  groove(harm(HA, 72, 6), true);
  drums(72, 8, 1);

  // B (120-168), B' (168-216)
  s.seq("fl", 120, MB, { v: 1.0 });
  groove(harm(HB, 120, 6), false);
  drums(120, 8, 0.9);
  s.seq("fid", 168, MB, { v: 0.95 });
  s.seq("fl", 168, MB, { v: 0.7, tr: 12 });
  groove(harm(HB, 168, 6), true);
  drums(168, 8, 1);

  // C (216-264): the whole street claps along
  s.seq("fl", 216, MC, { v: 1.0 });
  s.seq("fl", 240, MC, { v: 1.05, tr: 12 });
  s.seq("fid", 240, MC, { v: 0.6 });
  groove(harm(HC, 216, 6), true);
  drums(216, 8, 1.1);
  for (let b = 0; b < 8; b++) s.n("dr", 216 + b * 6 + 4, 1, 60, 0.45);

  // A'' (264-312)
  s.seq("fl", 264, MA, { v: 1.05 });
  s.seq("fid", 264, MA, { v: 0.75, tr: -12 });
  groove(harm(HA, 264, 6), true);
  drums(264, 8, 1);

  // outro (312-336): fading back to the drums
  groove(harm("D:6 G:6 A:6 D:6", 312, 6), false);
  s.seq("fl", 312, "A5:3 F#5:3 | G5:3 B5:3 | A5:3 C#6:3 | D6:3 r:3", { v: 0.8 });
  drums(312, 4, 0.8);

  return {
    id: "festival",
    bpm: 312,
    len: 336,
    ev: s.ev,
    ch: {
      fl: { inst: "flute", pan: 0.15, rev: 0.3, prio: 2, gain: 1.0, att: 0.03 },
      fid: { inst: "str", pan: -0.25, rev: 0.3, fx: "body", prio: 2, gain: 0.8, att: 0.05 },
      lute: { inst: "lute", pan: -0.35, rev: 0.25, gain: 0.8 },
      pz: { inst: "pizz", pan: 0.1, rev: 0.2 },
      drone: { inst: "str", pan: 0.3, rev: 0.3, gain: 0.5, bright: 0.5, prio: 0 },
      dr: { inst: "fdrum", pan: 0.05, rev: 0.2 },
      sl: { inst: "fslap", pan: -0.1, rev: 0.2 },
      tb: { inst: "tamb", pan: 0.4, rev: 0.25, prio: 0 },
    },
  };
}
