"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { GRADES, fortuneOf, previousDayKey, randomSeed, todayKey } from "./fortune";
import { CatFace, CatScene, Decorations } from "./pixels";

const STORAGE_KEY = "nyankuji:draws";
const SHAKE_MS = 1500;
const REVEAL_MS = 1100;
const PETAL_COUNT = 10;

type Phase = "idle" | "shaking" | "reveal" | "done";
type Draws = Record<string, number>;

function loadDraws(): Draws {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveDraws(draws: Draws) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draws));
  } catch {
    // 저장이 막힌 브라우저에서도 오늘 한 번은 뽑을 수 있게 조용히 넘어갑니다.
  }
}

function streakOf(draws: Draws, today: string) {
  let key = draws[today] !== undefined ? today : previousDayKey(today);
  let count = 0;
  while (draws[key] !== undefined) {
    count += 1;
    key = previousDayKey(key);
  }
  return count;
}

function untilMidnight(now: Date) {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const total = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

function formatDate(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  const weekday = "일월화수목금토"[new Date(year, month - 1, day).getDay()];
  return `${month}월 ${day}일 ${weekday}요일`;
}

export default function Home() {
  const [isReady, setIsReady] = useState(false);
  const [draws, setDraws] = useState<Draws>({});
  const [today, setToday] = useState("");
  const [now, setNow] = useState<Date | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [showBook, setShowBook] = useState(false);
  const [copied, setCopied] = useState(false);
  const timers = useRef<number[]>([]);
  const paperRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const stored = loadDraws();
    const key = todayKey();
    setDraws(stored);
    setToday(key);
    setNow(new Date());
    setPhase(stored[key] !== undefined ? "done" : "idle");
    setIsReady(true);
    return () => timers.current.forEach((id) => window.clearTimeout(id));
  }, []);

  // 자정을 넘기면 새 쪽지를 뽑을 수 있도록 날짜를 다시 확인합니다.
  useEffect(() => {
    if (!isReady) return;
    const id = window.setInterval(() => {
      const current = new Date();
      setNow(current);
      const key = todayKey(current);
      if (key !== today) {
        setToday(key);
        setPhase("idle");
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [isReady, today]);

  const seed = today ? draws[today] : undefined;
  const fortune = useMemo(() => (seed === undefined ? null : fortuneOf(seed)), [seed]);
  const collected = useMemo(() => new Set(Object.values(draws).map((value) => fortuneOf(value).grade.id)), [draws]);
  const streak = today ? streakOf(draws, today) : 0;
  const shown = fortune && (phase === "reveal" || phase === "done") ? fortune : null;

  function draw() {
    if (phase !== "idle" || seed !== undefined) return;

    // 흔드는 도중에 새로고침해도 다시 뽑을 수 없도록 먼저 저장합니다.
    const next = { ...draws, [today]: randomSeed() };
    saveDraws(next);
    setDraws(next);
    setPhase("shaking");
    setCopied(false);

    timers.current.push(
      window.setTimeout(() => setPhase("reveal"), SHAKE_MS),
      window.setTimeout(() => {
        setPhase("done");
        window.setTimeout(() => paperRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      }, SHAKE_MS + REVEAL_MS),
    );
  }

  async function share() {
    if (!fortune) return;
    const text = [
      `🐾 오늘의 냥쿠지 제${fortune.number}번 · ${fortune.grade.label} (${fortune.grade.cat})`,
      `“${fortune.grade.meow}”`,
      `행운의 아이템: ${fortune.item}`,
    ].join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ title: "오늘의 냥쿠지", text, url: location.href });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${location.href}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // 공유 창을 닫은 경우는 무시합니다.
    }
  }

  const stageCoat = shown ? shown.grade.coat : "calico";
  const stageMood = shown ? shown.grade.mood : "smile";

  return (
    <main>
      <div className="petals" aria-hidden>
        {Array.from({ length: PETAL_COUNT }, (_, index) => (
          <span key={index} style={{ "--i": index } as CSSProperties} />
        ))}
      </div>

      <header className="title">
        <p className="title-kicker">NYAN-KUJI</p>
        <h1>오늘의 냥쿠지</h1>
        <p className="title-date">{today ? formatDate(today) : " "}</p>
      </header>

      <section className={`stage${shown ? ` is-${shown.grade.tier}` : ""}`}>
        <div className="shrine" aria-hidden>
          <span className="shrine-beam" />
          <span className="shrine-beam shrine-beam-low" />
          <span className="shrine-post shrine-post-left" />
          <span className="shrine-post shrine-post-right" />
        </div>

        <div className="cat-wrap" key={shown ? "revealed" : "waiting"}>
          {shown && <Decorations mood={stageMood} />}
          {phase === "reveal" && <span className="poof" aria-hidden />}
          {shown && (
            <span className="stick-tag">
              제 <b>{shown.number}</b> 번
            </span>
          )}
          <CatScene coat={stageCoat} mood={stageMood} stickOut={shown !== null} shaking={phase === "shaking"} />
        </div>

        <div className="stage-floor" aria-hidden />

        {!isReady ? (
          <p className="stage-hint">&nbsp;</p>
        ) : phase === "idle" ? (
          <>
            <p className="stage-hint">통을 흔들어 오늘의 쪽지를 뽑아 보라냥</p>
            <button className="pixel-button" type="button" onClick={draw}>
              딸랑딸랑 흔들기
            </button>
          </>
        ) : phase === "shaking" ? (
          <p className="stage-hint is-shaking">딸랑… 딸랑…</p>
        ) : (
          <p className="stage-hint">
            <b className="grade-inline">{fortune?.grade.label}</b> 이 나왔다냥!
          </p>
        )}
      </section>

      {phase === "done" && fortune && (
        <article className={`paper is-${fortune.grade.tier}`} ref={paperRef}>
          <div className="paper-head">
            <span className="paper-number">제 {fortune.number} 번</span>
            <span className="paper-stamp">{fortune.grade.label}</span>
            <span className="paper-cat">{fortune.grade.cat}</span>
          </div>

          <p className="paper-meow">“{fortune.grade.meow}”</p>

          <dl className="paper-lines">
            {fortune.lines.map((line) => (
              <div key={line.label}>
                <dt>{line.label}</dt>
                <dd>{line.text}</dd>
              </div>
            ))}
          </dl>

          <div className="paper-lucky">
            <div>
              <span>아이템</span>
              <b>{fortune.item}</b>
            </div>
            <div>
              <span>색</span>
              <b>
                <i style={{ background: fortune.color.hex }} />
                {fortune.color.name}
              </b>
            </div>
            <div>
              <span>방향</span>
              <b>{fortune.direction}</b>
            </div>
            <div>
              <span>숫자</span>
              <b>{fortune.luckyNumber}</b>
            </div>
          </div>

          <div className="paper-actions">
            <button className="pixel-button is-small" type="button" onClick={share}>
              {copied ? "복사했다냥!" : "자랑하기"}
            </button>
            <button className="pixel-button is-small is-ghost" type="button" onClick={() => setShowBook((value) => !value)}>
              냥이 도감 {collected.size}/{GRADES.length}
            </button>
          </div>

          <p className="paper-next">
            다음 쪽지까지 <b>{now ? untilMidnight(now) : "--:--:--"}</b>
          </p>
        </article>
      )}

      {(showBook || (phase === "idle" && collected.size > 0)) && (
        <section className="book">
          <div className="book-head">
            <h2>냥이 도감</h2>
            <p>
              {collected.size}/{GRADES.length}마리 · 연속 {streak}일째
            </p>
          </div>
          <ul>
            {GRADES.map((grade) => {
              const owned = collected.has(grade.id);
              return (
                <li key={grade.id} className={owned ? "is-owned" : undefined}>
                  <CatFace coat={grade.coat} mood={grade.mood} locked={!owned} />
                  <b>{owned ? grade.label : "?"}</b>
                  <span>{owned ? grade.cat : "아직 몰라냥"}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <footer className="foot">하루에 한 번, 자정마다 새 쪽지가 들어온다냥</footer>
    </main>
  );
}
