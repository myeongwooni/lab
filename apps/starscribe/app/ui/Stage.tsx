"use client";

// 무대: 배경(전환 연출 포함), 스탠딩, CG, 화면 색조, 흔들림과 번쩍임.
import { memo, useEffect, useRef, useState } from "react";
import { backgroundSvg, cgSvg, characterSvg } from "../art";
import type { Actor, StageState } from "../engine/runtime";
import type { CharId, Transition } from "../engine/script";
import { Particles } from "./Particles";

const Svg = memo(function Svg({ markup, className }: { markup: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: markup }} />;
});

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

  return (
    <div className="bg-stack">
      {layers.map((l, i) => {
        const top = i === layers.length - 1 && layers.length > 1;
        return (
          <div
            key={l.seq}
            className={`bg-layer${top ? ` bg-in-${l.trans}` : ""}`}
            style={{ ["--ms" as string]: `${l.ms}ms` }}
          >
            <Svg className="bg-art" markup={backgroundSvg(l.id)} />
          </div>
        );
      })}
      {layers.length > 1 && (layers[layers.length - 1].trans === "fade" || layers[layers.length - 1].trans === "white") && (
        <div
          key={`veil-${layers[layers.length - 1].seq}`}
          className={`bg-veil veil-${layers[layers.length - 1].trans}`}
          style={{ ["--ms" as string]: `${layers[layers.length - 1].ms}ms` }}
        />
      )}
    </div>
  );
}

type ActorView = Actor & { leaving?: boolean; prevExpr?: string; exprSeq: number };

function ActorSprite({ a, speaking, dim }: { a: ActorView; speaking: boolean; dim: boolean }) {
  return (
    <div
      className={`actor pos-${a.pos}${a.leaving ? " leaving" : ""}${speaking ? " speaking" : ""}${dim ? " dim" : ""}`}
      data-id={a.id}
    >
      <div className="actor-inner">
        {a.prevExpr && a.prevExpr !== a.expr && (
          <Svg key={`p${a.exprSeq}`} className="actor-art expr-out" markup={characterSvg(a.id, a.prevExpr)} />
        )}
        <Svg key={`c${a.exprSeq}`} className={`actor-art${a.prevExpr ? " expr-in" : ""}`} markup={characterSvg(a.id, a.expr)} />
      </div>
    </div>
  );
}

function Actors({ actors, speaker }: { actors: Actor[]; speaker?: CharId }) {
  const [views, setViews] = useState<ActorView[]>(() => actors.map((a) => ({ ...a, exprSeq: 0 })));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setViews((prev) => {
      const next: ActorView[] = [];
      for (const a of actors) {
        const old = prev.find((v) => v.id === a.id && !v.leaving);
        if (old && old.expr !== a.expr) next.push({ ...a, prevExpr: old.expr, exprSeq: old.exprSeq + 1 });
        else if (old) next.push({ ...old, ...a });
        else next.push({ ...a, exprSeq: 0 });
      }
      for (const v of prev) {
        if (!actors.some((a) => a.id === v.id) && !v.leaving) next.push({ ...v, leaving: true });
      }
      return next;
    });
    const t = setTimeout(() => setViews((prev) => prev.filter((v) => !v.leaving).map((v) => ({ ...v, prevExpr: undefined }))), 520);
    timers.current.push(t);
  }, [actors]);

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
          <Svg className="bg-art" markup={cgSvg(s.id)} />
        </div>
      ))}
    </>
  );
}

export type Pulse = { seq: number; kind: "shake" | "shakeBig" | "flash"; color?: string };

export function Stage({ stage, speaker, pulse, children }: { stage: StageState; speaker?: CharId; pulse: Pulse | null; children?: React.ReactNode }) {
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
        <Actors actors={stage.actors} speaker={speaker} />
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
