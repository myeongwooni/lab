"use client";

// 대사창(ADV), 소설식 화면(NVL), 선택지, 장 제목·날짜 카드, 편지.
import { useEffect, useState } from "react";
import { SPEAKER_COLORS } from "../engine/catalog";
import type { NvlLine } from "../engine/runtime";
import type { Option } from "../engine/script";
import { Rich, Typed } from "./Text";

export function speakerColor(who: string | null) {
  return (who && SPEAKER_COLORS[who]) || "#dcd8ee";
}

function Quote({ who, quiet, children }: { who: string | null; quiet?: boolean; children: React.ReactNode }) {
  if (!who) return <>{children}</>;
  return quiet ? (
    <span className="quiet">
      （{children}）
    </span>
  ) : (
    <>
      <span className="q">“</span>
      {children}
      <span className="q">”</span>
    </>
  );
}

export function TextBox({
  who,
  text,
  quiet,
  msPerChar,
  finish,
  done,
  onDone,
  auto,
  skip,
}: {
  who: string | null;
  text: string;
  quiet?: boolean;
  msPerChar: number;
  finish: number;
  done: boolean;
  onDone: () => void;
  auto: boolean;
  skip: boolean;
}) {
  const name = who === "???" ? "? ? ?" : who;
  return (
    <div className={`textbox${who ? " has-name" : " narration"}`}>
      <div className="textbox-frame" aria-hidden />
      {name && (
        <div className="nameplate" style={{ ["--c" as string]: speakerColor(who) }}>
          <span>{name}</span>
        </div>
      )}
      <p className={`line${who ? " spoken" : ""}`} aria-live="polite">
        <Quote who={who} quiet={quiet}>
          <Typed text={text} msPerChar={msPerChar} finish={finish} onDone={onDone} />
        </Quote>
      </p>
      <span className={`wait-mark${done ? " on" : ""}`} aria-hidden>
        ✦
      </span>
      {(auto || skip) && <span className="mode-badge">{skip ? "넘기는 중 ▸▸" : "자동 ▸"}</span>}
    </div>
  );
}

export function NvlPage({
  lines,
  seq,
  current,
  msPerChar,
  finish,
  done,
  onDone,
}: {
  lines: NvlLine[];
  seq: number;
  current: NvlLine | null;
  msPerChar: number;
  finish: number;
  done: boolean;
  onDone: () => void;
}) {
  return (
    <div className="nvl">
      <div className="nvl-page">
        {lines.map((l, i) => (
          <p key={i} className={`nvl-line${l.who ? " spoken" : ""}`}>
            {l.who && <span className="nvl-who" style={{ color: speakerColor(l.who) }}>{l.who === "???" ? "? ? ?" : l.who}</span>}
            <Quote who={l.who} quiet={l.quiet}>
              <Rich text={l.text} />
            </Quote>
          </p>
        ))}
        {current && (
          <p key={`c${seq}`} className={`nvl-line fresh${current.who ? " spoken" : ""}`}>
            {current.who && (
              <span className="nvl-who" style={{ color: speakerColor(current.who) }}>
                {current.who === "???" ? "? ? ?" : current.who}
              </span>
            )}
            <Quote who={current.who} quiet={current.quiet}>
              <Typed text={current.text} msPerChar={msPerChar} finish={finish} onDone={onDone} />
            </Quote>
            <span className={`wait-mark inline${done ? " on" : ""}`} aria-hidden>
              ✦
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

export function Choices({ options, onPick }: { options: Option[]; onPick: (o: Option) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= options.length && picked === null) {
        setPicked(n - 1);
        setTimeout(() => onPick(options[n - 1]), 420);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [options, onPick, picked]);
  return (
    <div className="choices" onClick={(e) => e.stopPropagation()}>
      {options.map((o, i) => (
        <button
          key={i}
          className={`choice${picked === i ? " picked" : ""}${picked !== null && picked !== i ? " faded" : ""}${o.cond ? " special" : ""}`}
          style={{ animationDelay: `${i * 90}ms` }}
          disabled={picked !== null}
          onClick={() => {
            setPicked(i);
            setTimeout(() => onPick(o), 420);
          }}
        >
          <span className="choice-orn" aria-hidden>
            ◇
          </span>
          <span className="choice-text">
            <Rich text={o.text} />
          </span>
        </button>
      ))}
    </div>
  );
}

export function TitleCard({ small, big }: { small: string; big: string }) {
  return (
    <div className="title-card">
      <div className="tc-small">{small}</div>
      <div className="tc-rule" aria-hidden>
        <i />✦<i />
      </div>
      <div className="tc-big">{big}</div>
    </div>
  );
}

export function DayCard({ n }: { n: number }) {
  return (
    <div className="day-card">
      <span className="day-ring" aria-hidden />
      <span className="day-label">백일서</span>
      <span className="day-n">
        제 <b>{n}</b> 일
      </span>
    </div>
  );
}

export function LetterCard({ head, paras, onClose }: { head: string; paras: string[]; onClose: () => void }) {
  const [shown, setShown] = useState(1);
  const journal = /일지|기록|쪽지/.test(head);
  useEffect(() => {
    if (shown >= paras.length) return;
    const t = setTimeout(() => setShown((s) => s + 1), 1100);
    return () => clearTimeout(t);
  }, [shown, paras.length]);
  return (
    <div
      className="letter-wrap"
      onClick={(e) => {
        e.stopPropagation();
        if (shown < paras.length) setShown(paras.length);
        else onClose();
      }}
    >
      <article className={`letter${journal ? " journal" : ""}`}>
        <header className="letter-headline">{head}</header>
        {paras.map((p, i) => (
          <p key={i} className={i < shown ? "on" : ""}>
            <Rich text={p} />
          </p>
        ))}
        <span className={`wait-mark${shown >= paras.length ? " on" : ""}`} aria-hidden>
          ✦
        </span>
      </article>
    </div>
  );
}
