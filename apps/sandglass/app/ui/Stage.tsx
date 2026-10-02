"use client";

// 무대: 배경(전환 연출 포함), 스탠딩, CG, 화면 색조, 흔들림과 번쩍임.
// 그림 슬롯(public/art)에 파일이 있으면 <img>로, 없으면 코드로 그린 SVG로 그립니다.
import { memo, useEffect, useRef, useState } from "react";
import { artCharId, backgroundSvg, bgImage, cgImage, cgSvg, charImage, characterSvg } from "../art";
import { CG_FOCUS, cgObjectX } from "../art/cg-focus";
import type { Actor, StageState } from "../engine/runtime";
import type { CharId, Transition } from "../engine/script";
import { Particles } from "./Particles";

const Svg = memo(function Svg({ markup, className }: { markup: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: markup }} />;
});

function Img({ src, className }: { src: string; className: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={src} alt="" draggable={false} decoding="async" />;
}

export function BgArt({ id, className = "bg-art" }: { id: string; className?: string }) {
  const src = bgImage(id);
  return src ? <Img className={`${className} art-img`} src={src} /> : <Svg className={className} markup={backgroundSvg(id)} />;
}

export function CgArt({ id, className = "bg-art" }: { id: string; className?: string }) {
  const src = cgImage(id);
  return src ? <Img className={`${className} art-img`} src={src} /> : <Svg className={className} markup={cgSvg(id)} />;
}

// 무대 위 CG. 화면이 16:9보다 좁으면 그림마다 정한 초점(CG_FOCUS)을 가운데로 잘라 보여 줍니다.
// 회상록의 CG 보기는 늘 전체를 보여 주므로 CgArt를 그대로 씁니다.
function StageCgArt({ id }: { id: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState(16 / 9);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => el.clientHeight > 0 && setAspect(el.clientWidth / el.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const src = cgImage(id);
  if (!src) return <CgArt id={id} />;
  const focus = CG_FOCUS[id] ?? 50;
  const narrow = aspect < 16 / 9 - 0.01;
  return (
    <div ref={box} className="cg-box">
      {focus === "fit" && narrow ? (
        <>
          <Img className="bg-art art-img cg-backdrop" src={src} />
          <Img className="bg-art art-img cg-fit" src={src} />
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="bg-art art-img"
          src={src}
          alt=""
          draggable={false}
          decoding="async"
          style={{ objectPosition: `${cgObjectX(focus === "fit" ? 50 : focus, aspect)}% 50%` }}
        />
      )}
    </div>
  );
}

function CharArt({ id, expr, className }: { id: string; expr: string; className: string }) {
  const src = charImage(id, expr);
  return src ? <Img className={`${className} actor-img`} src={src} /> : <Svg className={className} markup={characterSvg(id, expr)} />;
}

// ── 모래 전환: 이전 그림이 금빛 알갱이로 흩어집니다 ──────────
// SVG 필터(잡음 → 문턱값)를 이전 층에 걸고, 문턱값을 requestAnimationFrame으로 내립니다.
function SandFilter({ fid, ms }: { fid: string; ms: number }) {
  const keep = useRef<SVGFEFuncAElement>(null);
  const edge = useRef<SVGFEFuncAElement>(null);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const dur = Math.max(300, ms);
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const k = 1.2 - e * 9.4; // 1.2(모두 남음) → -8.2(모두 흩어짐)
      keep.current?.setAttribute("intercept", String(k));
      edge.current?.setAttribute("intercept", String(k + 1.1));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ms]);
  return (
    <svg className="sand-defs" width="0" height="0" aria-hidden>
      <filter id={fid} x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.009 0.022" numOctaves="3" seed="11" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.6 0 0 0 -0.25" result="na" />
        <feComponentTransfer in="na" result="keep">
          <feFuncA ref={keep} type="linear" slope="7" intercept="1.2" />
        </feComponentTransfer>
        <feComponentTransfer in="na" result="outer">
          <feFuncA ref={edge} type="linear" slope="7" intercept="2.3" />
        </feComponentTransfer>
        <feComposite in="SourceGraphic" in2="keep" operator="in" result="img" />
        <feFlood floodColor="#ffd27a" result="gold" />
        <feComposite in="gold" in2="outer" operator="in" result="goldAll" />
        <feComposite in="goldAll" in2="keep" operator="out" result="rim" />
        <feMerge>
          <feMergeNode in="img" />
          <feMergeNode in="rim" />
        </feMerge>
      </filter>
    </svg>
  );
}

type BgLayer = { seq: number; id: string; trans: Transition; ms: number };

function Backgrounds({ id, trans, ms, seq }: { id: string; trans: Transition; ms: number; seq: number }) {
  const [layers, setLayers] = useState<BgLayer[]>([{ seq, id, trans: "cut", ms: 0 }]);

  useEffect(() => {
    setLayers((prev) => {
      if (prev[prev.length - 1]?.seq === seq) return prev;
      return [...prev.slice(-1), { seq, id, trans, ms }];
    });
    // 전환이 끝나면 아래 층을 치웁니다.
    const t = setTimeout(() => setLayers((prev) => prev.filter((l) => l.seq === seq)), ms + 120);
    return () => clearTimeout(t);
  }, [id, trans, ms, seq]);

  const top = layers[layers.length - 1];
  const sand = layers.length > 1 && top.trans === "sand";
  return (
    <div className="bg-stack">
      {layers.map((l, i) => {
        const isTop = i === layers.length - 1 && layers.length > 1;
        const outgoing = sand && !isTop;
        const cls = isTop && !sand ? ` bg-in-${l.trans}` : outgoing ? " bg-out-sand" : "";
        return (
          <div
            key={l.seq}
            className={`bg-layer${cls}`}
            style={{ ["--ms" as string]: `${top.ms}ms`, ...(outgoing ? { filter: `url(#sand-${top.seq})`, zIndex: 1 } : null) }}
          >
            <BgArt id={l.id} />
          </div>
        );
      })}
      {sand && (
        <>
          <SandFilter key={`f-${top.seq}`} fid={`sand-${top.seq}`} ms={top.ms} />
          <div key={`g-${top.seq}`} className="sand-grains" style={{ ["--ms" as string]: `${top.ms}ms` }} aria-hidden />
        </>
      )}
      {layers.length > 1 && (top.trans === "fade" || top.trans === "white") && (
        <div key={`veil-${top.seq}`} className={`bg-veil veil-${top.trans}`} style={{ ["--ms" as string]: `${top.ms}ms` }} />
      )}
    </div>
  );
}

type ActorView = Actor & { art: string; leaving?: boolean; prevExpr?: string; prevArt?: string; exprSeq: number };

function ActorSprite({ a, speaking, dim }: { a: ActorView; speaking: boolean; dim: boolean }) {
  const changed = a.prevExpr !== undefined && (a.prevExpr !== a.expr || a.prevArt !== a.art);
  return (
    <div
      className={`actor pos-${a.pos}${a.leaving ? " leaving" : ""}${speaking ? " speaking" : ""}${dim ? " dim" : ""}`}
      data-id={a.id}
    >
      <div className="actor-inner">
        {changed && <CharArt key={`p${a.exprSeq}`} className="actor-art expr-out" id={a.prevArt ?? a.art} expr={a.prevExpr!} />}
        <CharArt key={`c${a.exprSeq}`} className={`actor-art${changed ? " expr-in" : ""}`} id={a.art} expr={a.expr} />
      </div>
    </div>
  );
}

function Actors({ actors, speaker, unmasked }: { actors: Actor[]; speaker?: CharId; unmasked: boolean }) {
  const artOf = (id: string) => artCharId(id, { unmasked });
  const [views, setViews] = useState<ActorView[]>(() => actors.map((a) => ({ ...a, art: artOf(a.id), exprSeq: 0 })));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setViews((prev) => {
      const next: ActorView[] = [];
      for (const a of actors) {
        const art = artOf(a.id);
        const old = prev.find((v) => v.id === a.id && !v.leaving);
        if (old && (old.expr !== a.expr || old.art !== art)) next.push({ ...a, art, prevExpr: old.expr, prevArt: old.art, exprSeq: old.exprSeq + 1 });
        else if (old) next.push({ ...old, ...a, art });
        else next.push({ ...a, art, exprSeq: 0 });
      }
      for (const v of prev) {
        if (!actors.some((a) => a.id === v.id) && !v.leaving) next.push({ ...v, leaving: true });
      }
      return next;
    });
    const t = setTimeout(() => setViews((prev) => prev.filter((v) => !v.leaving).map((v) => ({ ...v, prevExpr: undefined, prevArt: undefined }))), 520);
    timers.current.push(t);
  }, [actors, unmasked]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const many = actors.length > 1;
  return (
    <div className="actors">
      {views.map((v) => (
        <ActorSprite key={v.id} a={v} speaking={speaker === v.id} dim={many && !!speaker && speaker !== v.id} />
      ))}
    </div>
  );
}

function Cg({ id }: { id: string | null }) {
  const [shown, setShown] = useState<{ id: string; out: boolean }[]>(id ? [{ id, out: false }] : []);
  useEffect(() => {
    setShown((prev) => {
      const rest = prev.filter((s) => s.id !== id).map((s) => ({ ...s, out: true }));
      return id ? [...rest, { id, out: false }] : rest;
    });
    const t = setTimeout(() => setShown((prev) => prev.filter((s) => !s.out)), 1000);
    return () => clearTimeout(t);
  }, [id]);
  return (
    <>
      {shown.map((s) => (
        <div key={s.id} className={`cg-layer${s.out ? " out" : ""}`}>
          <StageCgArt id={s.id} />
        </div>
      ))}
    </>
  );
}

export type Pulse = { seq: number; kind: "shake" | "shakeBig" | "flash"; color?: string };

export function Stage({
  stage,
  speaker,
  pulse,
  unmasked = false,
  children,
}: {
  stage: StageState;
  speaker?: CharId;
  pulse: Pulse | null;
  unmasked?: boolean;
  children?: React.ReactNode;
}) {
  const [shake, setShake] = useState<string>("");
  const [flash, setFlash] = useState<{ seq: number; color: string } | null>(null);

  useEffect(() => {
    if (!pulse) return;
    if (pulse.kind === "flash") {
      setFlash({ seq: pulse.seq, color: pulse.color ?? "#fff" });
      return;
    }
    setShake(pulse.kind === "shakeBig" ? "shake-big" : "shake");
    const t = setTimeout(() => setShake(""), 600);
    return () => clearTimeout(t);
  }, [pulse]);

  return (
    <div className={`stage ${shake} ${stage.filter ? `filter-${stage.filter}` : ""}`}>
      <div className="stage-scene">
        <Backgrounds id={stage.bg} trans={stage.bgTrans} ms={stage.bgMs} seq={stage.bgSeq} />
        <Actors actors={stage.actors} speaker={speaker} unmasked={unmasked} />
        <Cg id={stage.cg} />
      </div>
      <Particles kind={stage.fx} />
      <div className="stage-tint" />
      <div className="stage-vignette" />
      {flash && <div key={flash.seq} className="flash" style={{ background: flash.color }} />}
      {children}
    </div>
  );
}
