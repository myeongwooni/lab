"use client";

import { useEffect, useMemo, useState } from "react";
import RoomArt from "./RoomArt";
import {
  COLOR_ICON, COLOR_NAME, ITEM_INFO, MAX_SECONDS, dailyPuzzle, formatDuration,
  gainItem, hasItem, isValidRun, newRun, removeItem, saw, todayKey,
  type Item, type Records, type Run, type Target,
} from "../lib/game";

const RUN_PREFIX = "pixelroom:run:";
const RECORD_KEY = "pixelroom:records:v1";

type Hotspot = { id: Target; name: string; left: number; top: number; width: number; height: number; spotX?: number; spotY?: number };
const HOTSPOTS: Hotspot[] = [
  { id: "books", name: "책장", left: 14, top: 23, width: 18, height: 49 },
  { id: "clock", name: "시계", left: 64.8, top: 13.8, width: 11.5, height: 25 },
  { id: "window", name: "창문", left: 36.4, top: 12.3, width: 20.8, height: 31 },
  { id: "painting", name: "그림", left: 34, top: 45.5, width: 20.5, height: 23 },
  { id: "lamp", name: "스탠드", left: 55.5, top: 44, width: 10.5, height: 20 },
  { id: "radio", name: "라디오", left: 68, top: 54, width: 10, height: 11 },
  { id: "drawer", name: "서랍", left: 61, top: 69, width: 17, height: 12 },
  { id: "plant", name: "화분", left: 9, top: 56.8, width: 11.5, height: 31 },
  { id: "rug", name: "카펫", left: 30, top: 75.5, width: 30, height: 17 },
  { id: "safe", name: "금고", left: 78.5, top: 76, width: 9.6, height: 16.8 },
  { id: "door", name: "출입문", left: 80.7, top: 23.5, width: 12, height: 47 },
];
const CLUE_NAMES = { books: "책장 · 색깔의 순서", clock: "시계 · 빨간 숫자", painting: "그림 · 파란 숫자", radio: "라디오 · 노란 숫자" };

function readRun(day: string): Run {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(`${RUN_PREFIX}${day}`) || "null");
    return isValidRun(value, day) ? value : newRun(day);
  } catch { return newRun(day); }
}
function readRecords(): Records {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(RECORD_KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value as Records : {};
  } catch { return {}; }
}
function formatDay(day: string) {
  const [, m, d] = day.split("-");
  return `${Number(m)}월 ${Number(d)}일`;
}

export default function Home() {
  const [day, setDay] = useState("");
  const [run, setRun] = useState<Run | null>(null);
  const [records, setRecords] = useState<Records>({});
  const [clock, setClock] = useState(0);
  const [notice, setNotice] = useState("주위를 둘러보세요. 작은 단서도 놓치지 마세요.");
  const [selected, setSelected] = useState<Item | null>(null);
  const [dialog, setDialog] = useState<"safe" | "rules" | null>(null);
  const [dial, setDial] = useState("");
  const [showMarkers, setShowMarkers] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const current = todayKey();
    setDay(current);
    setRun(readRun(current));
    setRecords(readRecords());
    setClock(Date.now());
    const interval = window.setInterval(() => {
      const now = Date.now();
      setClock(now);
      const nextDay = todayKey(new Date(now));
      if (nextDay !== currentDayRef.value) {
        currentDayRef.value = nextDay;
        setDay(nextDay);
        setRun(readRun(nextDay));
        setSelected(null);
        setDialog(null);
        setNotice("새로운 하루, 새로운 방이 열렸습니다.");
      }
    }, 1000);
    const currentDayRef = { value: current };
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!run) return;
    try { localStorage.setItem(`${RUN_PREFIX}${run.day}`, JSON.stringify(run)); } catch { /* 저장이 차단돼도 플레이 가능 */ }
  }, [run]);

  useEffect(() => {
    if (!run || run.phase !== "playing" || run.deadline === null || !clock || clock < run.deadline) return;
    setRun((current) => current && current.phase === "playing" && current.deadline !== null && Date.now() >= current.deadline
      ? { ...current, phase: "lost" } : current);
    setDialog(null);
    setSelected(null);
  }, [run, clock]);

  useEffect(() => {
    if (!run || run.phase !== "won" || run.completedIn === null) return;
    setRecords((previous) => {
      const best = previous[run.day];
      if (best && (best.seconds < run.completedIn! || (best.seconds === run.completedIn && best.hints <= run.hints))) return previous;
      return { ...previous, [run.day]: { seconds: run.completedIn!, hints: run.hints, attempts: run.attempts } };
    });
  }, [run]);

  useEffect(() => {
    if (!day) return; // 첫 렌더의 빈 기록이 기존 저장 내용을 덮어쓰지 않도록 함
    try { localStorage.setItem(RECORD_KEY, JSON.stringify(records)); } catch { /* optional */ }
  }, [day, records]);

  const puzzle = useMemo(() => day ? dailyPuzzle(day) : null, [day]);
  const playing = run?.phase === "playing";
  const remaining = playing && run?.deadline ? Math.max(0, Math.ceil((run.deadline - clock) / 1000)) : MAX_SECONDS;
  const discovered = run ? ["books", "clock", "painting", "radio"].filter((key) => run.seen.includes(key)).length : 0;
  const todayBest = records[day];
  const history = Object.entries(records).filter(([, value]) => value && typeof value.seconds === "number")
    .sort(([a], [b]) => b.localeCompare(a)).slice(0, 3);

  function start() {
    if (!day) return;
    const now = Date.now();
    setRun({ ...newRun(day), phase: "playing", startedAt: now, deadline: now + MAX_SECONDS * 1000 });
    setNotice("문이 잠겼다! 이 방에 있는 것들을 조사해 보자.");
    setSelected(null);
    setDial("");
    setDialog(null);
    setClock(now);
  }

  function hint() {
    if (!run || !playing) return;
    let text = "주변에 놓인 물건을 자세히 살펴보세요.";
    if (!hasItem(run, "brass") && !run.drawerOpen) text = "발밑의 카펫이 조금 들떠 보입니다.";
    else if (!run.drawerOpen) text = "황동 열쇠를 선택한 뒤 서랍을 눌러 보세요.";
    else if (!run.paintingRevealed) text = "서랍에서 찾은 푸른 렌즈를 액자에 대 보세요.";
    else if (!run.radioWorking && !hasItem(run, "battery")) text = "식물의 잎 아래에는 무엇이 있을까요?";
    else if (!run.radioWorking) text = "건전지를 선택한 뒤 라디오에 사용해 보세요.";
    else if (!run.seen.includes("books")) text = "책 세 권의 색이 금고 숫자의 읽는 순서입니다.";
    else if (!run.seen.includes("clock")) text = "벽시계에 빨간 숫자가 적혀 있습니다.";
    else if (!run.safeOpen) text = "책장에 적힌 색 순서대로 숫자를 이어 붙여 금고에 입력하세요.";
    else text = "은빛 열쇠를 선택한 뒤 출입문을 누르면 됩니다.";
    setRun({ ...run, hints: run.hints + 1 });
    setNotice(`💡 ${text}`);
  }

  function inspect(target: Target) {
    if (!run || !puzzle || run.phase !== "playing") return;
    if (run.deadline !== null && Date.now() >= run.deadline) {
      setRun({ ...run, phase: "lost" });
      return;
    }
    let next = run;
    let message = "";
    const use = (item: Item) => selected === item;

    if (selected && !(
      (target === "drawer" && use("brass")) || (target === "painting" && use("lens")) ||
      (target === "radio" && use("battery")) || (target === "door" && use("silver"))
    )) {
      setNotice(`${ITEM_INFO[selected].name}을(를) 여기에 사용할 수 없어요. 가방에서 한 번 더 눌러 선택을 해제하세요.`);
      return;
    }

    switch (target) {
      case "rug":
        if (hasItem(run, "brass") || run.drawerOpen) message = "카펫 밑은 이제 비어 있다.";
        else { next = gainItem(run, "brass"); message = "카펫을 걷으니 황동 열쇠가 나왔다! 가방에서 열쇠를 선택해 보자."; }
        break;
      case "plant":
        if (hasItem(run, "battery") || run.radioWorking) message = "화분에는 촉촉한 흙만 남아 있다.";
        else { next = gainItem(run, "battery"); message = "잎사귀 사이에서 건전지 한 개를 찾았다."; }
        break;
      case "books":
        next = saw(run, "books");
        message = `가지런히 놓인 세 권의 색: ${puzzle.order.map((c) => `${COLOR_ICON[c]} ${COLOR_NAME[c]}`).join(" → ")}. 이 순서가 중요해 보인다.`;
        break;
      case "clock":
        next = saw(run, "clock");
        message = `멈춘 시계 아래 붉은 숫자 ${puzzle.digits.red}이(가) 새겨져 있다. 🔴 빨강의 숫자다.`;
        break;
      case "window":
        message = "창밖의 달빛이 방을 감싼다. 서둘러야 하지만, 단서는 늘 가까이에 있다.";
        break;
      case "lamp":
        next = { ...run, lampOn: !run.lampOn };
        message = run.lampOn ? "스탠드를 끄자 방의 그림자가 짙어졌다." : "스탠드를 켰다. 작은 책상 위가 환해졌다.";
        break;
      case "drawer":
        if (run.drawerOpen) message = "서랍은 열려 있다. 더 꺼낼 물건은 없다.";
        else if (use("brass")) {
          next = gainItem(removeItem(run, "brass"), "lens");
          next = { ...next, drawerOpen: true };
          setSelected(null);
          message = "찰칵! 서랍에서 푸른 렌즈를 꺼냈다. 어딘가 숨은 글씨를 볼 수 있을 것 같다.";
        } else message = "잠긴 서랍. 자물쇠가 작다. 작은 열쇠가 필요하다.";
        break;
      case "painting":
        if (run.paintingRevealed) message = `렌즈로 드러난 🔵 파랑의 숫자는 ${puzzle.digits.blue}이다.`;
        else if (use("lens")) {
          next = saw({ ...run, paintingRevealed: true }, "painting");
          message = `렌즈를 대니 그림 속에 🔵 파랑의 숫자 ${puzzle.digits.blue}이(가) 나타났다!`;
        } else message = "오래된 산 풍경화. 표면 아래에 감춰진 글씨가 있는 것 같다.";
        break;
      case "radio":
        if (run.radioWorking) message = `라디오 화면에 🟡 노랑의 숫자 ${puzzle.digits.yellow}이(가) 떠 있다.`;
        else if (use("battery")) {
          next = saw(removeItem({ ...run, radioWorking: true }, "battery"), "radio");
          setSelected(null);
          message = `치직... 라디오가 켜지고 🟡 노랑의 숫자 ${puzzle.digits.yellow}이(가) 나타났다!`;
        } else message = "전원이 꺼진 낡은 라디오. 뒤편 건전지 뚜껑이 열려 있다.";
        break;
      case "safe":
        if (run.safeOpen) message = "금고 안은 비어 있다. 은빛 열쇠는 이미 가방에 있다.";
        else {
          setDial(""); setDialog("safe");
          message = "세 자리 비밀번호가 필요하다. 색 순서와 숫자를 기억하자.";
        }
        break;
      case "door":
        if (use("silver")) {
          const seconds = Math.min(MAX_SECONDS, Math.max(1, Math.ceil((Date.now() - (run.startedAt ?? Date.now())) / 1000)));
          next = { ...run, phase: "won", completedIn: seconds };
          setSelected(null);
          message = "탈출 성공! 문틈으로 아침 햇살이 쏟아진다.";
        } else message = "무거운 문이 잠겨 있다. 은빛 열쇠가 있어야 열 수 있을 것 같다.";
        break;
    }
    setRun(next);
    setNotice(message);
  }

  function unlock(code: string) {
    if (!run || !puzzle || !playing) return;
    if (run.deadline !== null && Date.now() >= run.deadline) {
      setRun({ ...run, phase: "lost" }); setDialog(null); return;
    }
    if (code.length !== 3) return;
    if (code === puzzle.code) {
      setRun(gainItem({ ...run, safeOpen: true, attempts: run.attempts + 1 }, "silver"));
      setNotice("금고가 열렸다! 안에 은빛 열쇠가 있다. 가방에서 선택하고 출입문을 눌러 보자.");
      setSelected(null);
      setDialog(null);
      setDial("");
    } else {
      setRun({ ...run, attempts: run.attempts + 1 });
      setDial("");
      setNotice("삐빅! 비밀번호가 틀렸다. 책장에 적힌 색 순서를 다시 확인해 보자.");
    }
  }

  useEffect(() => {
    if (!dialog) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") { setDialog(null); return; }
      if (dialog !== "safe") return;
      if (/^[0-9]$/.test(event.key)) { event.preventDefault(); setDial((prev) => (prev + event.key).slice(0, 3)); }
      else if (event.key === "Backspace") { event.preventDefault(); setDial((prev) => prev.slice(0, -1)); }
      else if (event.key === "Enter") { event.preventDefault(); unlock(dial); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, dial, run, puzzle]);

  async function share() {
    if (!run || run.phase !== "won" || run.completedIn === null) return;
    const text = `🚪 픽셀룸 DAY ${puzzle?.number} 탈출 성공!\n⏱ ${formatDuration(run.completedIn)} · 힌트 ${run.hints}회 · 금고 시도 ${run.attempts}회\n오늘의 방에서 기다릴게요.`;
    const url = `${location.origin}${location.pathname}`;
    try {
      if (navigator.share) { await navigator.share({ title: "픽셀룸 탈출 기록", text, url }); return; }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { /* 공유 취소 또는 접근 제한 */ }
  }

  if (!run || !puzzle) return <main className="loading"><div className="loading-icon">▦</div>오늘의 방을 여는 중...</main>;

  const completeClues = Object.entries(CLUE_NAMES).map(([id, name]) => ({
    id, name, found: run.seen.includes(id),
    value: id === "books" ? puzzle.order.map((c) => COLOR_ICON[c]).join(" → ")
      : id === "clock" ? `🔴 ${puzzle.digits.red}`
      : id === "painting" ? `🔵 ${puzzle.digits.blue}` : `🟡 ${puzzle.digits.yellow}`,
  }));
  const markerClass = (spot: Hotspot) => {
    if (spot.id === "rug" && (hasItem(run, "brass") || run.drawerOpen)) return "is-checked";
    if (spot.id === "plant" && (hasItem(run, "battery") || run.radioWorking)) return "is-checked";
    if (spot.id === "drawer" && run.drawerOpen) return "is-checked";
    if (spot.id === "painting" && run.paintingRevealed) return "is-checked";
    if (spot.id === "radio" && run.radioWorking) return "is-checked";
    if (spot.id === "safe" && run.safeOpen) return "is-checked";
    if (run.seen.includes(spot.id)) return "is-checked";
    return "";
  };

  return (
    <main className="shell">
      <header className="masthead">
        <div className="brand"><div className="brand-mark" aria-hidden="true"><span>▣</span></div><div><div className="brand-name">PIXEL<span>ROOM</span><i>™</i></div><div className="brand-caption">하루 한 방, 10분의 탈출</div></div></div>
        <div className="top-actions"><span className="status-dot" /> 매일 00:00 KST 오픈 <button type="button" className="icon-button" onClick={() => setDialog("rules")} aria-label="게임 설명">?</button></div>
      </header>

      <section className="headline">
        <div className="eyebrow"><span className="eyebrow-square" /> DAILY ESCAPE CHALLENGE <span className="eyebrow-line" /></div>
        <div className="heading-row"><div><h1>오늘의 <em>비밀의 방</em></h1><p>모든 물건에는 이유가 있다. 10분 안에 문을 열어라.</p></div><div className="day-card"><span>ROOM NO.</span><strong>#{String(puzzle.number).padStart(3, "0")}</strong><small>{formatDay(day)}</small></div></div>
      </section>

      <section className="stats" aria-label="게임 정보">
        <div className={`stat timer ${playing && remaining <= 60 ? "is-urgent" : ""}`}><span className="stat-icon">◷</span><div><span className="stat-label">남은 시간</span><strong>{playing ? formatDuration(remaining) : run.phase === "won" ? formatDuration(run.completedIn ?? 0) : "10:00"}</strong></div><span className="stat-index">01</span></div>
        <div className="stat"><span className="stat-icon">◈</span><div><span className="stat-label">발견한 단서</span><strong>{discovered}<small> / 4</small></strong></div><span className="stat-index">02</span></div>
        <div className="stat"><span className="stat-icon">⌑</span><div><span className="stat-label">오늘의 최고 기록</span><strong>{todayBest ? formatDuration(todayBest.seconds) : "--:--"}</strong></div><span className="stat-index">03</span></div>
      </section>

      <section className="game-layout">
        <div className="left-column">
          <div className="scene-header"><div><span className="live-light" /> <strong>{puzzle.palette.name}</strong> <span className="chapter-number">/ EPISODE {String(puzzle.number).padStart(3, "0")}</span></div><button type="button" className="text-action" onClick={() => setShowMarkers(!showMarkers)}>{showMarkers ? "◉ 조사 위치 표시 중" : "◎ 조사 위치 표시"}</button></div>
          <div className={`scene-frame${!run.lampOn ? " is-dark" : ""}`}>
            <RoomArt puzzle={puzzle} run={run} />
            {playing && HOTSPOTS.map((spot) => <button
              type="button" key={spot.id} className={`hotspot ${markerClass(spot)} ${showMarkers ? "show-markers" : ""}`}
              style={{ left: `${spot.left}%`, top: `${spot.top}%`, width: `${spot.width}%`, height: `${spot.height}%` }}
              onClick={() => inspect(spot.id)} aria-label={`${spot.name} 조사`} title={`${spot.name} 조사`}>
              <span className="hotspot-tag"><b>+</b><span>{spot.name}</span></span>
            </button>)}
            {run.phase === "intro" && <div className="scene-overlay"><div className="overlay-symbol">⌑</div><span className="overlay-kicker">A NEW ROOM AWAITS</span><h2>문이 잠겼습니다.</h2><p>방 곳곳의 단서를 찾고, 아이템을 조합하고,<br/>숨어 있는 세 자리 암호를 풀어 탈출하세요.</p><div className="overlay-mini"><span>◷ 10분 제한</span><span>◇ 매일 새로운 암호</span><span>⌁ 무료 플레이</span></div><button type="button" className="primary-button" onClick={start}>오늘의 방 입장하기 <span>→</span></button></div>}
            {run.phase === "lost" && <div className="scene-overlay"><div className="overlay-symbol is-fail">◷</div><span className="overlay-kicker">TIME IS UP</span><h2>시간이 다 됐어요.</h2><p>문은 아직 잠겨 있지만, 포기할 필요는 없어요.<br/>처음부터 다시 도전할 수 있습니다.</p><button type="button" className="primary-button" onClick={start}>다시 도전하기 <span>↻</span></button></div>}
            {run.phase === "won" && <div className="scene-overlay is-win"><div className="overlay-symbol is-win">✦</div><span className="overlay-kicker">ESCAPE COMPLETE</span><h2>탈출 성공!</h2><p className="win-time">{formatDuration(run.completedIn ?? 0)}</p><p>힌트 {run.hints}회 · 금고 시도 {run.attempts}회</p><div className="win-actions"><button type="button" className="primary-button" onClick={share}>{copied ? "복사 완료!" : "탈출 기록 공유하기"} <span>↗</span></button><button type="button" className="secondary-button" onClick={start}>다시 하기</button></div></div>}
          </div>
          <div className="scene-footer"><span>↖ 방 안의 물건을 눌러 조사하세요. 모바일 터치도 지원해요.</span><span>PIXELROOM / {day}</span></div>

          <section className="message-panel" aria-live="polite"><div className="narrator-icon">✦</div><div><span className="panel-overline">ROOM LOG · 조사 결과</span><p>{notice}</p></div></section>
        </div>

        <aside className="sidebar">
          <section className="side-panel mission"><div className="side-head"><span className="panel-overline">01 / MISSION</span><span className="pill">오늘의 임무</span></div><h2>이 방을 탈출하라.</h2><p>{puzzle.palette.subtitle}</p><div className="mission-progress"><div className="progress-label"><span>단서 수집</span><b>{Math.round((discovered / 4) * 100)}%</b></div><div className="progress-bar"><div style={{ width: `${(discovered / 4) * 100}%` }} /></div></div><button type="button" className="hint-button" onClick={hint} disabled={!playing}>✧ 힌트 받기 <span>사용 {run.hints}회</span></button></section>

          <section className="side-panel inventory"><div className="side-head"><span className="panel-overline">02 / INVENTORY</span><span className="count">{run.inventory.length} / 4</span></div><h2>내 가방 <small>아이템을 선택해서 사용</small></h2><div className="inventory-grid">{Array.from({ length: 4 }, (_, i) => {
            const item = run.inventory[i];
            return item ? <button type="button" key={item} disabled={!playing} className={`inventory-slot filled ${selected === item ? "selected" : ""}`} aria-pressed={selected === item} onClick={() => setSelected(selected === item ? null : item)} title={ITEM_INFO[item].detail}><span className="item-symbol">{ITEM_INFO[item].symbol}</span><span className="item-name">{ITEM_INFO[item].name}</span></button>
              : <div className="inventory-slot" key={`empty-${i}`}><span>+</span></div>;
          })}</div><p className="slot-caption">{selected ? `${ITEM_INFO[selected].name} 선택 중 · 사용할 물건을 누르세요` : "아이템을 누른 뒤 방 안의 사물을 선택하세요."}</p></section>

          <section className="side-panel notebook"><div className="side-head"><span className="panel-overline">03 / NOTEBOOK</span><span className="count">{discovered} / 4</span></div><h2>단서 노트</h2><div className="clue-list">{completeClues.map(({id,name,found,value},i) => <div key={id} className={`clue ${found ? "is-found" : ""}`}><span className="clue-index">0{i+1}</span><div><span>{name}</span><b>{found ? value : "아직 발견하지 못했어요"}</b></div><span className="clue-check">{found ? "✓" : "○"}</span></div>)}</div></section>
          <div className="side-bottom"><div><span>DAILY BEST</span><strong>{todayBest ? formatDuration(todayBest.seconds) : "NO RECORD"}</strong></div><span>⌘</span></div>
        </aside>
      </section>

      <section className="below"><div className="section-title"><div><span className="panel-overline">ARCHIVES / 기록 보관함</span><h2>최근 탈출 기록</h2></div><span>기록은 이 브라우저에 저장됩니다.</span></div><div className="history-grid">{history.length > 0 ? history.map(([date, entry]) => <div className="history-card" key={date}><span>✦ {date}</span><strong>{formatDuration(entry.seconds)}</strong><small>힌트 {entry.hints}회 사용</small></div>) : <div className="history-empty">아직 탈출 기록이 없어요. 오늘 첫 번째 기록을 남겨 보세요. <span>↗</span></div>}</div></section>
      <footer className="footer"><div className="footer-brand">▣ PIXELROOM <small>BY LAB</small></div><span>매일 00:00 KST 새로운 암호가 열립니다.</span><span>MADE FOR CURIOUS MINDS. © 2026</span></footer>

      {dialog && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button type="button" className="modal-close" onClick={() => setDialog(null)} aria-label="닫기">×</button>{dialog === "safe" ? <><div className="modal-icon">▦</div><div className="panel-overline">SECURITY LOCK / 3 DIGITS</div><h2 id="modal-title">잠긴 금고</h2><p>책장에서 찾은 색의 순서대로 숫자를 입력하세요.</p><div className="pin-display" aria-label={`입력한 숫자 ${dial.length}자리`}>{[0,1,2].map((i) => <span key={i}>{dial[i] ?? "_"}</span>)}</div><div className="number-pad">{[1,2,3,4,5,6,7,8,9,"취소",0,"⌫"].map((key) => <button type="button" key={key} onClick={() => { if (key === "취소") { setDial(""); return; } if (key === "⌫") { setDial(dial.slice(0,-1)); return; } setDial((dial + key).slice(0,3)); }}>{key}</button>)}</div><button type="button" className="primary-button modal-submit" disabled={dial.length !== 3} onClick={() => unlock(dial)}>잠금 해제 <span>→</span></button><small>키보드 숫자 · Backspace · Enter · Esc 사용 가능</small></> : <><div className="modal-icon">✧</div><div className="panel-overline">HOW TO PLAY</div><h2 id="modal-title">픽셀룸 탐색 안내</h2><div className="rule-list"><p><b>01 / 조사</b><span>방 안에 표시된 사물을 눌러 단서나 숨은 아이템을 찾으세요.</span></p><p><b>02 / 사용</b><span>가방에서 아이템을 클릭한 후, 사용할 사물을 누르세요. 다시 누르면 선택이 해제됩니다.</span></p><p><b>03 / 암호</b><span>책장의 색 순서와 각각의 숫자를 모아 금고 비밀번호를 풀어야 해요.</span></p><p><b>04 / 탈출</b><span>금고의 열쇠를 이용해 출입문을 열면 성공! 제한 시간은 실제 10분이며 탭을 닫아도 흐릅니다.</span></p></div><button type="button" className="primary-button modal-submit" onClick={() => setDialog(null)}>알겠어요 <span>✓</span></button></>}</div></div>}
    </main>
  );
}
