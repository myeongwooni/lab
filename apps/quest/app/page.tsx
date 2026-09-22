"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_NAMES = "김민수\n이영희\n박철수\n최수진";
const DEFAULT_QUEST = "점심 메뉴를 결정하라";
const NAME_KEY = "today-quest:names";
const QUEST_KEY = "today-quest:quest";

const QUESTS = [
  "점심 메뉴를 결정하라",
  "회의의 첫 질문을 던져라",
  "오늘의 간식을 조달하라",
  "사진 속 모두를 웃겨라",
  "설거지 왕국을 구하라",
];

const AVATAR_COUNT = 8;
const PARTICLE_COUNT = 16;

function parseNames(value: string) {
  return [...new Set(value.split(/[\n,]/).map((name) => name.trim()).filter(Boolean))];
}

function randomIndex(length: number) {
  if (length <= 0) return 0;

  const range = 0x1_0000_0000;
  const limit = range - (range % length);
  const value = new Uint32Array(1);

  do {
    crypto.getRandomValues(value);
  } while (value[0] >= limit);

  return value[0] % length;
}

export default function Home() {
  const [namesText, setNamesText] = useState(DEFAULT_NAMES);
  const [quest, setQuest] = useState(DEFAULT_QUEST);
  const [result, setResult] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const timers = useRef<number[]>([]);
  const names = useMemo(() => parseNames(namesText), [namesText]);

  useEffect(() => {
    const savedNames = localStorage.getItem(NAME_KEY);
    const savedQuest = localStorage.getItem(QUEST_KEY);
    if (savedNames) setNamesText(savedNames);
    if (savedQuest) setQuest(savedQuest);
    setIsReady(true);

    return () => timers.current.forEach(window.clearTimeout);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    localStorage.setItem(NAME_KEY, namesText);
  }, [isReady, namesText]);

  useEffect(() => {
    if (!isReady) return;
    localStorage.setItem(QUEST_KEY, quest);
  }, [isReady, quest]);

  function draw() {
    if (names.length < 2 || !quest.trim() || isDrawing) return;

    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    setResult(null);
    setHighlighted(null);
    setCopied(false);
    setCountdown(null);
    setIsDrawing(true);

    const winner = names[randomIndex(names.length)];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      setHighlighted(winner);
      setResult(winner);
      setIsDrawing(false);
      return;
    }

    const steps = 24;
    let elapsed = 120;
    let previousIndex = -1;

    for (let step = 0; step < steps; step += 1) {
      let nextIndex = randomIndex(names.length);
      while (nextIndex === previousIndex && names.length > 1) {
        nextIndex = randomIndex(names.length);
      }
      previousIndex = nextIndex;
      const candidate = names[nextIndex];
      const progress = step / (steps - 1);
      elapsed += 55 + Math.round(180 * progress * progress);

      const timeout = window.setTimeout(() => {
        setHighlighted(candidate);
      }, elapsed);
      timers.current.push(timeout);
    }

    const lockAt = elapsed + 260;
    const countdowns = [
      { value: 3, delay: lockAt },
      { value: 2, delay: lockAt + 520 },
      { value: 1, delay: lockAt + 1040 },
    ];

    countdowns.forEach(({ value, delay }) => {
      const timeout = window.setTimeout(() => {
        setHighlighted(null);
        setCountdown(value);
      }, delay);
      timers.current.push(timeout);
    });

    const revealTimeout = window.setTimeout(() => {
      setCountdown(null);
      setHighlighted(winner);
      setResult(winner);
      setIsDrawing(false);
    }, lockAt + 1720);
    timers.current.push(revealTimeout);
  }

  function removeWinner() {
    if (!result) return;
    const remaining = names.filter((name) => name !== result);
    setNamesText(remaining.join("\n"));
    setResult(null);
    setHighlighted(null);
    setCountdown(null);
  }

  async function shareResult() {
    if (!result) return;
    const text = `⚔️ 오늘의 퀘스트\n${quest.trim()}\n\n선택받은 용사: ${result}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "오늘의 퀘스트", text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      }
    } catch {
      // 사용자가 공유 창을 닫은 경우에는 아무 일도 하지 않습니다.
    }
  }

  const canDraw = names.length >= 2 && quest.trim().length > 0 && !isDrawing;

  return (
    <main className={`${isDrawing ? "is-drawing" : ""} ${result ? "has-winner" : ""}`}>
      <div className="pixel-cloud cloud-one" aria-hidden="true" />
      <div className="pixel-cloud cloud-two" aria-hidden="true" />
      {result && <div className="screen-flash" aria-hidden="true" />}

      <header className="hero">
        <span className="eyebrow">★ DAILY PARTY MISSION ★</span>
        <h1>오늘의 퀘스트</h1>
        <p><span>NEW!</span> 운명은 공평하고, 임무는 피할 수 없습니다.</p>
      </header>

      <section className={`quest-board ${countdown ? "is-counting" : ""}`} aria-label="퀘스트 추첨기">
        <div className="board-tape tape-left" aria-hidden="true" />
        <div className="board-tape tape-right" aria-hidden="true" />
        <div className="setup-panel">
          <label htmlFor="quest">오늘의 임무</label>
          <div className="quest-input-wrap">
            <span className="pixel-icon" aria-hidden="true">!</span>
            <input
              id="quest"
              value={quest}
              disabled={isDrawing}
              onChange={(event) => {
                setQuest(event.target.value);
                setResult(null);
                setHighlighted(null);
              }}
              placeholder="어떤 임무를 맡길까요?"
              maxLength={60}
            />
          </div>

          <div className="quest-chips" aria-label="추천 퀘스트">
            {QUESTS.slice(0, 3).map((item) => (
              <button key={item} type="button" disabled={isDrawing} onClick={() => { setQuest(item); setResult(null); setHighlighted(null); }}>
                {item}
              </button>
            ))}
          </div>

          <div className="names-heading">
            <label htmlFor="names">파티원 명단</label>
            <span>{names.length}명 참가</span>
          </div>
          <textarea
            id="names"
            value={namesText}
            disabled={isDrawing}
            onChange={(event) => {
              setNamesText(event.target.value);
              setResult(null);
              setHighlighted(null);
            }}
            placeholder={"한 줄에 한 명씩 입력하세요\n쉼표로 구분해도 됩니다"}
            rows={7}
          />
          {names.length < 2 && <p className="hint">용사를 두 명 이상 불러 모아 주세요.</p>}

          <button className="summon-button" type="button" onClick={draw} disabled={!canDraw}>
            <span aria-hidden="true">✦</span>
            {isDrawing ? "운명이 고르는 중…" : "오늘의 용사 소환하기"}
            <span aria-hidden="true">✦</span>
          </button>
          <p className="fairness">브라우저의 보안 난수로 공정하게 추첨합니다.</p>
        </div>

        <div className="party-panel" aria-live="polite">
          <div className="panel-title">
            <span>현재 파티</span>
            <span className="status-dot">ONLINE</span>
          </div>

          <div className="party-grid">
            {names.length ? names.map((name, index) => (
              <div
                className={`party-member ${highlighted === name ? "is-highlighted" : ""} ${result === name ? "is-winner" : ""}`}
                key={name}
              >
                <span className={`avatar avatar-${index % AVATAR_COUNT}`} aria-hidden="true">
                  <i className="pixel-hair" />
                  <i className="pixel-face" />
                  <i className="pixel-body" />
                  <i className="pixel-feet" />
                </span>
                <span className="member-name">{name}</span>
                <span className="member-level">LV.{String((index * 7 + 12) % 87 + 1).padStart(2, "0")}</span>
              </div>
            )) : (
              <div className="empty-party">아직 모인 파티원이 없습니다.</div>
            )}
          </div>

          {result ? (
            <div className="result-card">
              <div className="winner-burst" aria-hidden="true">
                {Array.from({ length: PARTICLE_COUNT }, (_, index) => (
                  <i key={index} style={{ "--particle": index } as CSSProperties} />
                ))}
              </div>
              <span className="result-kicker">★ QUEST HERO ★</span>
              <div className="result-crown" aria-hidden="true">WIN!</div>
              <p className="winner-name">{result}</p>
              <p className="winner-quest">“{quest.trim()}”</p>
              <div className="result-actions">
                <button type="button" onClick={shareResult}>{copied ? "복사 완료!" : "결과 공유"}</button>
                <button type="button" onClick={removeWinner} disabled={names.length <= 2}>용사 제외</button>
                <button type="button" onClick={draw}>다시 소환</button>
              </div>
            </div>
          ) : (
            <div className={`summoning-circle ${isDrawing ? "is-active" : ""} ${countdown ? "is-countdown" : ""}`} aria-hidden="true">
              <div className="scan-lines" />
              <span className="roulette-label">{countdown ? "WHO IS THE HERO?" : isDrawing ? "SCANNING PARTY..." : "PRESS START"}</span>
              <div className="roulette-name">{countdown ?? highlighted ?? "?"}</div>
              <div className="loading-blocks"><i /><i /><i /><i /><i /><i /><i /><i /></div>
              <p>{countdown ? "두근두근..." : isDrawing ? "운명의 신호를 수신 중" : "용사를 기다리는 중"}</p>
            </div>
          )}
        </div>
      </section>

      <footer>오늘의 퀘스트 · 결과에 대한 이의 제기는 다음 생에</footer>
    </main>
  );
}
