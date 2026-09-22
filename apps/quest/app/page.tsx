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

const PARTICLE_COUNT = 16;
const HERO_CLASSES = [
  { icon: "⚔", name: "검사" },
  { icon: "✦", name: "마도사" },
  { icon: "➹", name: "궁수" },
  { icon: "♜", name: "수호기사" },
  { icon: "☾", name: "도적" },
  { icon: "✚", name: "성직자" },
];

function parseNames(value: string) {
  return [...new Set(value.split(/[\n,]/).map((name) => name.trim()).filter(Boolean))];
}

// 같은 이름이면 언제나 같은 직업과 레벨을 받도록 이름에서 값을 뽑아냅니다.
function hashName(name: string) {
  let hash = 2166136261;
  for (let index = 0; index < name.length; index += 1) {
    hash ^= name.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function heroOf(name: string) {
  const hash = hashName(name);
  const classIndex = hash % HERO_CLASSES.length;
  const heroClass = HERO_CLASSES[classIndex];

  return {
    name,
    classIndex,
    icon: heroClass.icon,
    className: heroClass.name,
    level: ((hash >>> 6) % 68) + 12,
    hp: ((hash >>> 13) % 62) + 38,
  };
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
  const [view, setView] = useState<"setup" | "party">("setup");
  const timers = useRef<number[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const names = useMemo(() => parseNames(namesText), [namesText]);
  const roster = useMemo(() => names.map(heroOf), [names]);

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

  // 파티원이 많으면 명단이 안쪽에서 스크롤되므로, 뽑힌 카드를 직접 보여 줍니다.
  useEffect(() => {
    if (!result) return;
    gridRef.current?.querySelector(".is-winner")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [result]);

  function resetOutcome() {
    setResult(null);
    setHighlighted(null);
  }

  function draw() {
    if (names.length < 2 || !quest.trim() || isDrawing) return;

    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    setResult(null);
    setHighlighted(null);
    setCopied(false);
    setCountdown(null);
    setIsDrawing(true);
    // 좁은 화면에서는 소환진이 바로 보이도록 원정대 쪽으로 넘겨 줍니다.
    setView("party");

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
  const dialogue = result
    ? `${result} 용사가 퀘스트를 수락했다!`
    : countdown
      ? "운명의 룬이 최후의 이름을 가리킨다…!"
      : isDrawing
        ? "소환진이 파티원의 운명을 읽는 중…"
        : names.length < 2
          ? "파티원이 부족하다. 모험가를 더 모아 오자."
          : "소환진이 조용히 빛난다. 의식을 시작하시겠습니까?";

  return (
    <main className={`${isDrawing ? "is-drawing" : ""} ${result ? "has-winner" : ""}`}>
      <div className="ambient-shape shape-one" aria-hidden="true" />
      <div className="ambient-shape shape-two" aria-hidden="true" />
      {result && <div className="screen-flash" aria-hidden="true" />}

      <header className="hero">
        <div className="guild-emblem" aria-hidden="true">♜</div>
        <span className="eyebrow">GUILD QUEST BOARD</span>
        <h1><span>오늘의</span> 퀘스트</h1>
        <p>길드의 운명을 맡길 단 한 명의 용사를 소환하세요.</p>
      </header>

      <section className={`quest-board ${countdown ? "is-counting" : ""}`} data-view={view} aria-label="퀘스트 추첨기">
        <i className="corner-rune rune-left" aria-hidden="true">✦</i>
        <i className="corner-rune rune-right" aria-hidden="true">✦</i>

        <div className="board-tabs" role="tablist" aria-label="화면 전환">
          <button
            type="button"
            role="tab"
            id="tab-setup"
            aria-selected={view === "setup"}
            aria-controls="panel-setup"
            disabled={isDrawing}
            onClick={() => setView("setup")}
          >
            <span aria-hidden="true">✎</span> 의뢰서
          </button>
          <button
            type="button"
            role="tab"
            id="tab-party"
            aria-selected={view === "party"}
            aria-controls="panel-party"
            disabled={isDrawing}
            onClick={() => setView("party")}
          >
            <span aria-hidden="true">♜</span> 원정대 <b>{names.length}</b>
          </button>
        </div>

        <div className="setup-panel" id="panel-setup" role="tabpanel" aria-labelledby="tab-setup">
          <div className="section-heading">
            <label htmlFor="quest">길드 의뢰 내용</label>
            <span>ORDER #001</span>
          </div>
          <div className="quest-input-wrap">
            <span className="input-icon" aria-hidden="true">⚔</span>
            <input
              id="quest"
              value={quest}
              disabled={isDrawing}
              onChange={(event) => {
                setQuest(event.target.value);
                resetOutcome();
              }}
              placeholder="어떤 임무를 맡길까요?"
              maxLength={60}
            />
          </div>

          <div className="quest-chips" aria-label="추천 퀘스트">
            {QUESTS.slice(0, 3).map((item) => (
              <button key={item} type="button" disabled={isDrawing} onClick={() => { setQuest(item); resetOutcome(); }}>
                {item}
              </button>
            ))}
            <button
              type="button"
              className="chip-reroll"
              disabled={isDrawing}
              onClick={() => {
                const pool = QUESTS.filter((item) => item !== quest);
                setQuest(pool[randomIndex(pool.length)]);
                resetOutcome();
              }}
            >
              <span aria-hidden="true">⟲</span> 다른 의뢰
            </button>
          </div>

          <div className="names-heading">
            <label htmlFor="names">모험가 명단</label>
            <span>PARTY {String(names.length).padStart(2, "0")}</span>
          </div>
          <textarea
            id="names"
            value={namesText}
            disabled={isDrawing}
            onChange={(event) => {
              setNamesText(event.target.value);
              resetOutcome();
            }}
            placeholder={"한 줄에 한 명씩 입력하세요\n쉼표로 구분해도 됩니다"}
            rows={7}
          />
          {names.length < 2 && <p className="hint">용사를 두 명 이상 불러 모아 주세요.</p>}

          <button className="summon-button" type="button" onClick={draw} disabled={!canDraw}>
            <span aria-hidden="true">▶</span>
            {isDrawing ? "소환 의식 진행 중…" : "운명의 룬으로 용사 소환"}
            <span aria-hidden="true">◀</span>
          </button>
          <p className="fairness">고대 룬도 납득할 브라우저 보안 난수로 추첨합니다.</p>
        </div>

        <div className="party-panel" id="panel-party" role="tabpanel" aria-labelledby="tab-party" aria-live="polite">
          <div className="panel-title">
            <span>원정대 대기실</span>
            <span className="status-dot">GUILD READY</span>
          </div>

          <div className="party-grid" ref={gridRef}>
            {roster.length ? roster.map((hero) => (
              <div
                className={`party-member hero-class-${hero.classIndex} ${highlighted === hero.name ? "is-highlighted" : ""} ${result === hero.name ? "is-winner" : ""}`}
                key={hero.name}
              >
                <span className="member-lv">LV{String(hero.level).padStart(2, "0")}</span>
                <span className="avatar" aria-hidden="true">{hero.icon}</span>
                <span className="member-name">{hero.name}</span>
                <span className="member-class">{hero.className}</span>
                <span className={`hp-bar ${hero.hp < 45 ? "is-low" : ""}`} aria-hidden="true">
                  <i style={{ "--hp": `${hero.hp}%` } as CSSProperties} />
                </span>
              </div>
            )) : (
              <div className="empty-party">길드에 등록된 모험가가 없습니다.</div>
            )}
          </div>

          {result ? (
            <div className="result-card">
              <div className="winner-burst" aria-hidden="true">
                {Array.from({ length: PARTICLE_COUNT }, (_, index) => (
                  <i key={index} style={{ "--particle": index } as CSSProperties} />
                ))}
              </div>
              <span className="result-kicker">THE CHOSEN HERO</span>
              <div className="result-crown" aria-hidden="true">QUEST ACCEPTED</div>
              <p className="winner-name">{result}</p>
              <p className="winner-quest"><span>부여된 퀘스트</span>“{quest.trim()}”</p>
              <div className="result-actions">
                <button type="button" onClick={shareResult}>{copied ? "전령 파견 완료!" : "전령 보내기"}</button>
                <button type="button" onClick={removeWinner} disabled={names.length <= 2}>파티에서 제외</button>
                <button type="button" onClick={draw}>재소환</button>
              </div>
            </div>
          ) : (
            <div className={`summoning-circle ${isDrawing ? "is-active" : ""} ${countdown ? "is-countdown" : ""}`}>
              <div className="scan-lines" aria-hidden="true" />
              <span className="roulette-label" aria-hidden="true">{countdown ? "DESTINY REVEALED" : isDrawing ? "RUNE SEARCHING..." : "SUMMONING ALTAR"}</span>
              <div className="roulette-name" aria-hidden="true">{countdown ?? highlighted ?? "?"}</div>
              <div className="loading-blocks" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
              <button className="altar-button" type="button" onClick={draw} disabled={!canDraw}>
                <span aria-hidden="true">▶</span> 소환 의식 시작
              </button>
            </div>
          )}

          <div className="dialog-box">
            <p>{dialogue}</p>
            <span className="dialog-cursor" aria-hidden="true">▼</span>
          </div>
        </div>
      </section>

      <footer>길드 기록 제001호 · 선택받은 용사는 퀘스트를 거부할 수 없습니다.</footer>
    </main>
  );
}
