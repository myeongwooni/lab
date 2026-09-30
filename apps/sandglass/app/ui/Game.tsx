"use client";

// 게임 전체의 흐름: 시작 화면 → 타이틀 → 본편(대사·선택지·장 전환) → 엔딩과 크레딧.
import { useCallback, useEffect, useRef, useState } from "react";
import { artCharId, bgImage, cgImage, charImage, hasBackground, preloadImages } from "../art";
import { TRACKS, audio } from "../audio/director";
import { CHARACTER_NAMES, ENDINGS, chapterInfo, deathInfo, endingInfo } from "../engine/catalog";
import { advance, buildStory, choose, enterChapter, newGame, pushNvl, run, type Beat, type GameState, type StepResult } from "../engine/runtime";
import {
  DEFAULT_SETTINGS,
  DEFAULT_VARS,
  PREFIX,
  addLetter,
  addUnique,
  flushGlobal,
  isSeen,
  latestSave,
  loadGlobal,
  loadSlot,
  makeSave,
  markSeen,
  trueUnlocked,
  updateGlobal,
  writeSlot,
  type LogLine,
  type SaveData,
  type Settings,
} from "../engine/save";
import { parseScript, type Option } from "../engine/script";
import { plain } from "../engine/text";
import { SOURCES } from "../story";
import { Choices, DayCard, LetterCard, NvlPage, TextBox, TitleCard } from "./Dialogue";
import { DeathSequence, RewindSequence } from "./Loop";
import { Backlog, ChapterSelect, DeathRecord, Extras, Gallery, MusicRoom, Records, SaveLoad, SettingsPanel } from "./Menus";
import { Particles } from "./Particles";
import { Stage, type Pulse } from "./Stage";

const STORY = buildStory(SOURCES, parseScript);

const MS_PER_CHAR = [0, 58, 40, 27, 14, 0];
const AUTO_BASE = [0, 700, 1100, 1600, 2200, 3000];

type Screen = "splash" | "title" | "game" | "ending";
type Overlay = null | "save" | "load" | "settings" | "log" | "extras" | "gallery" | "endings" | "deaths" | "music" | "letters" | "chapters" | "confirmTitle";

function extraVars() {
  return { true_unlocked: trueUnlocked() };
}

function beatPreview(b: Beat | null): string {
  if (!b) return "";
  if (b.kind === "say") return (b.who ? `${b.who} — ` : "") + plain(b.text);
  if (b.kind === "choice") return "◇ 선택의 갈림길";
  if (b.kind === "letter") return `기록 「${b.head}」`;
  if (b.kind === "death") return `사망 — ${deathInfo(b.id)?.title ?? ""}`;
  if (b.kind === "rewind") return `모래가 거꾸로 흐른다 — 제${b.loop}회차`;
  if (b.kind === "day") return `새벽제 제${b.n}일`;
  return "";
}

// 저장할 자리. 되감기 박자는 state.i가 라벨 바로 앞을 가리키므로, 불러오면 라벨부터 읽도록 한 칸 옮깁니다.
function snapshot(st: GameState, b: Beat | null): GameState {
  return b?.kind === "rewind" ? { ...st, i: st.i + 1 } : st;
}

// 곧 나올 배경·CG·스탠딩 그림 파일을 미리 받아 둡니다(그림 슬롯이 있을 때만 의미가 있습니다).
function preloadAhead(st: GameState) {
  const cmds = STORY.chapters[st.ch]?.cmds;
  if (!cmds) return;
  const urls: (string | null)[] = [];
  for (let k = Math.max(0, st.i); k < Math.min(cmds.length, st.i + 30); k++) {
    const c = cmds[k];
    if (c.t === "bg") urls.push(bgImage(c.id));
    else if (c.t === "cg" && c.id) urls.push(cgImage(c.id));
    else if (c.t === "show") urls.push(charImage(artCharId(c.id, st.vars), c.expr ?? "normal"));
  }
  preloadImages(urls);
}

const TITLE_BG = ["dawntower", "ashfall", "dawn"].find((id) => hasBackground(id)) ?? null;

export default function Game() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [session, setSession] = useState(0);
  const [gs, setGs] = useState<GameState>(() => newGame());
  const [beat, setBeat] = useState<Beat | null>(null);
  const [beatSeq, setBeatSeq] = useState(0);
  const [seenBefore, setSeenBefore] = useState(false);
  const [log, setLog] = useState<LogLine[]>([]);
  const [typed, setTyped] = useState(false);
  const [finish, setFinish] = useState(0);
  const [auto, setAuto] = useState(false);
  const [skip, setSkip] = useState(false);
  const [hideUi, setHideUi] = useState(false);
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [place, setPlace] = useState<{ seq: number; text: string } | null>(null);
  const [veil, setVeil] = useState(false);
  const [ending, setEnding] = useState<string | null>(null);
  const [reading, setReading] = useState<{ head: string; paras: string[] } | null>(null);
  const [toast, setToast] = useState<{ seq: number; text: string } | null>(null);
  const [hasSave, setHasSave] = useState(false);
  const [unlockedTrue, setUnlockedTrue] = useState(false);
  const [deathFirst, setDeathFirst] = useState(false);
  const [nudge, setNudge] = useState(0);

  const live = useRef({ gs, beat, beatSeq, typed, overlay, screen, hideUi, log, auto, skip });
  live.current = { gs, beat, beatSeq, typed, overlay, screen, hideUi, log, auto, skip };
  const seqRef = useRef(0);

  const notify = useCallback((text: string) => setToast({ seq: Date.now(), text }), []);

  useEffect(() => {
    const g = loadGlobal();
    setSettings(g.settings);
    setHasSave(!!latestSave());
    setUnlockedTrue(trueUnlocked(g));
  }, []);

  useEffect(() => {
    audio.setVolume("bgm", settings.bgm);
    audio.setVolume("se", settings.se);
    audio.setVolume("amb", settings.amb);
    document.documentElement.style.setProperty("--font-scale", String(settings.fontScale));
  }, [settings]);

  const changeSettings = (s: Settings) => {
    setSettings(s);
    updateGlobal((g) => (g.settings = s));
  };

  // ── 한 박자 적용 ──────────────────────────────
  const apply = useCallback((r: StepResult) => {
    setGs(r.state);
    for (const e of r.effects) {
      if (e.t === "se") audio.playSe(e.id);
      else if (e.t === "shake") setPulse({ seq: Math.random(), kind: e.big ? "shakeBig" : "shake" });
      else if (e.t === "flash") setPulse({ seq: Math.random(), kind: "flash", color: e.color });
      else if (e.t === "place") setPlace({ seq: Math.random(), text: e.text });
      else if (e.t === "unlockCg") addUnique("cgs", e.id);
      else if (e.t === "unlockDeath") {
        setDeathFirst(!loadGlobal().deaths.includes(e.id));
        addUnique("deaths", e.id);
      }
    }
    const b = r.beat;
    if (b.kind === "say") {
      setSeenBefore(isSeen(b.key));
      markSeen(b.key);
      setLog((l) => [...l.slice(-500), { who: b.who, text: b.text }]);
      setTyped(false);
    } else if (b.kind === "letter") {
      setSeenBefore(isSeen(b.key));
      markSeen(b.key);
      addLetter(b.head, b.paras, r.state.ch);
    } else if (b.kind === "choice") {
      setSkip(false);
      writeSlot("auto", makeSave(r.state, live.current.log, beatPreview(b)));
    } else if (b.kind === "rewind") {
      // 되감을 때마다 자동 기록
      writeSlot("auto", makeSave(snapshot(r.state, b), live.current.log, beatPreview(b)));
      flushGlobal();
    } else if (b.kind === "death") {
      setAuto(false);
      flushGlobal();
    }
    preloadAhead(r.state);
    seqRef.current += 1;
    setBeatSeq(seqRef.current);
    setBeat(b);
  }, []);

  const continueFrom = useCallback(
    (seq: number) => {
      if (seq !== seqRef.current) return;
      const { gs: st, beat: b } = live.current;
      if (!b) return;
      const base = st.stage.nvl && b.kind === "say" ? pushNvl(st, { who: b.who, text: b.text, quiet: b.quiet }) : st;
      try {
        apply(advance(STORY, base, extraVars()));
      } catch (err) {
        console.error(err);
        notify("원고를 읽다가 길을 잃었습니다. 타이틀로 돌아갑니다.");
        setScreen("title");
      }
    },
    [apply, notify],
  );

  const startAt = useCallback(
    (state: GameState, restoredLog: LogLine[] = []) => {
      setSession((s) => s + 1);
      setLog(restoredLog);
      setAuto(false);
      setSkip(false);
      setHideUi(false);
      setOverlay(null);
      setEnding(null);
      setScreen("game");
      addUnique("chapters", state.ch);
      if (state.i === 0) updateGlobal((g) => (g.chapterVars[state.ch] = { ...state.vars }));
      try {
        apply(run(STORY, state, extraVars()));
      } catch (err) {
        console.error(err);
        notify("이 기록은 더 이상 이어 읽을 수 없습니다.");
        setScreen("title");
      }
    },
    [apply, notify],
  );

  const newRun = () => startAt(newGame("prologue"));
  const loadData = (d: SaveData) => startAt(d.state, d.log);
  const continueLatest = () => {
    const s = latestSave();
    if (s) loadData(s.data);
  };

  const saveTo = (slot: number | "quick") => {
    writeSlot(slot, makeSave(snapshot(live.current.gs, live.current.beat), live.current.log, beatPreview(live.current.beat)));
    setHasSave(true);
    notify(slot === "quick" ? "빠른 기록에 적었습니다" : `${slot}번 페이지에 적었습니다`);
  };

  // ── 박자별 자동 진행 ──────────────────────────
  useEffect(() => {
    if (screen !== "game" || !beat) return;
    const seq = beatSeq;
    if (beat.kind === "title") {
      const t = setTimeout(() => continueFrom(seq), skip ? 700 : 3600);
      return () => clearTimeout(t);
    }
    if (beat.kind === "day") {
      const t = setTimeout(() => continueFrom(seq), skip ? 500 : 2300);
      return () => clearTimeout(t);
    }
    if (beat.kind === "wait") {
      const t = setTimeout(() => continueFrom(seq), skip ? 30 : beat.ms);
      return () => clearTimeout(t);
    }
    if (beat.kind === "next") {
      writeSlot("auto", makeSave({ ...live.current.gs }, live.current.log, `${chapterInfo(beat.chapter).label}의 첫머리`));
      setVeil(true);
      const target = beat.chapter;
      const t = setTimeout(() => {
        if (seq !== seqRef.current) return;
        const cur = live.current.gs;
        addUnique("chapters", target);
        updateGlobal((g) => (g.chapterVars[target] = { ...cur.vars }));
        try {
          apply(enterChapter(STORY, cur, target, extraVars()));
        } catch (err) {
          console.error(err);
          notify("다음 장의 원고를 찾지 못했습니다.");
          setScreen("title");
        }
        setTimeout(() => setVeil(false), 60);
      }, 1400);
      return () => clearTimeout(t);
    }
    if (beat.kind === "end") {
      setAuto(false);
      setSkip(false);
      if (beat.ending === "__missing") {
        notify("이 뒤의 원고는 아직 쓰이지 않았습니다.");
        setScreen("title");
        return;
      }
      addUnique("endings", beat.ending);
      flushGlobal();
      setEnding(beat.ending);
      setScreen("ending");
    }
  }, [beat, beatSeq, screen, skip, continueFrom, apply, notify]);

  // 자동 진행·넘기기
  useEffect(() => {
    if (screen !== "game" || overlay || !beat || hideUi) return;
    const seq = beatSeq;
    if (beat.kind === "say" || beat.kind === "letter") {
      if (skip) {
        if (!seenBefore && !settings.skipUnread) {
          setSkip(false);
          return;
        }
        const t = setTimeout(() => continueFrom(seq), beat.kind === "letter" ? 250 : 40);
        return () => clearTimeout(t);
      }
      if (auto && beat.kind === "say" && typed) {
        const len = plain(beat.text).length;
        const t = setTimeout(() => continueFrom(seq), AUTO_BASE[settings.autoDelay] + len * 38);
        return () => clearTimeout(t);
      }
    }
  }, [beat, beatSeq, typed, auto, skip, seenBefore, overlay, screen, hideUi, settings, continueFrom]);

  // 음악과 환경음은 무대 상태를 따라갑니다.
  useEffect(() => {
    if (screen !== "game") return;
    audio.playBgm(gs.stage.bgm, 2200);
    if (gs.stage.bgm) addUnique("tracks", gs.stage.bgm);
  }, [gs.stage.bgm, screen]);

  useEffect(() => {
    if (screen === "game") audio.setAmbient(gs.stage.amb);
    else audio.setAmbient(null);
  }, [gs.stage.amb, screen]);

  useEffect(() => {
    if (screen === "title") {
      audio.playBgm("title", 2400);
      addUnique("tracks", "title");
      setHasSave(!!latestSave());
      setUnlockedTrue(trueUnlocked());
    }
  }, [screen]);

  // 탭을 닫거나 내려도 이어할 수 있게 자동 기록
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        if (live.current.screen === "game" && live.current.beat) {
          writeSlot("auto", makeSave(snapshot(live.current.gs, live.current.beat), live.current.log, beatPreview(live.current.beat)));
        }
        flushGlobal();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, []);

  // ── 입력 ──────────────────────────────────
  const proceed = useCallback(() => {
    const { beat: b, typed: done, overlay: ov, hideUi: hidden, beatSeq: seq } = live.current;
    if (ov) return;
    if (hidden) {
      setHideUi(false);
      return;
    }
    if (!b) return;
    if (live.current.skip) setSkip(false);
    if (b.kind === "say") {
      if (!done) setFinish((f) => f + 1);
      else continueFrom(seq);
    } else if (b.kind === "title" || b.kind === "day") {
      continueFrom(seq);
    } else if (b.kind === "death" || b.kind === "rewind") {
      setNudge((n) => n + 1);
    }
  }, [continueFrom]);

  const pick = useCallback(
    (o: Option) => {
      const st = live.current.gs;
      setLog((l) => [...l, { who: null, text: plain(o.text), choice: true }]);
      try {
        apply(choose(STORY, st, o, extraVars()));
      } catch (err) {
        console.error(err);
        notify("그 길의 원고는 아직 쓰이지 않았습니다.");
      }
    },
    [apply, notify],
  );

  useEffect(() => {
    if (screen !== "game") return;
    const down = (e: KeyboardEvent) => {
      if (live.current.overlay) return;
      if (e.key === "Control") {
        setSkip(true);
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (live.current.beat?.kind === "letter") return;
        proceed();
      } else if (e.key === "a" || e.key === "A") setAuto((v) => !v);
      else if (e.key === "l" || e.key === "L" || e.key === "ArrowUp" || e.key === "PageUp") setOverlay("log");
      else if (e.key === "h" || e.key === "H") setHideUi((v) => !v);
      else if (e.key === "s" || e.key === "S") setOverlay("save");
      else if (e.key === "q" || e.key === "Q") saveTo("quick");
      else if (e.key === "Escape") setOverlay("settings");
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "Control") setSkip(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [screen, proceed]); // eslint-disable-line react-hooks/exhaustive-deps

  const onWheel = (e: React.WheelEvent) => {
    if (e.deltaY < -20 && !overlay && screen === "game") setOverlay("log");
  };

  // ── 화면 ──────────────────────────────────
  const say = beat?.kind === "say" ? beat : null;
  const msPerChar = skip ? 0 : MS_PER_CHAR[settings.textSpeed];

  const panels = (
    <>
      {overlay === "save" && <SaveLoad mode="save" onClose={() => setOverlay(null)} onSave={(s) => saveTo(s)} />}
      {overlay === "load" && <SaveLoad mode="load" onClose={() => setOverlay(null)} onLoad={loadData} />}
      {overlay === "settings" && (
        <SettingsPanel
          settings={settings}
          onChange={changeSettings}
          onClose={() => setOverlay(null)}
          onReset={() => {
            try {
              Object.keys(localStorage)
                .filter((k) => k.startsWith(PREFIX))
                .forEach((k) => localStorage.removeItem(k));
            } catch {}
            window.location.reload();
          }}
        />
      )}
      {overlay === "log" && <Backlog log={log} onClose={() => setOverlay(null)} />}
      {overlay === "extras" && <Extras onClose={() => setOverlay(null)} onOpen={(id) => setOverlay(id === "endings" ? "endings" : id)} />}
      {overlay === "gallery" && <Gallery onClose={() => setOverlay(screen === "title" ? "extras" : null)} />}
      {overlay === "endings" && <Gallery initialTab="end" onClose={() => setOverlay(screen === "title" ? "extras" : null)} />}
      {overlay === "deaths" && <DeathRecord onClose={() => setOverlay(screen === "title" ? "extras" : null)} />}
      {overlay === "music" && (
        <MusicRoom
          onClose={() => {
            setOverlay(screen === "title" ? "extras" : null);
            if (screen === "title") audio.playBgm("title", 1500);
          }}
        />
      )}
      {overlay === "letters" && <Records onClose={() => setOverlay(screen === "title" ? "extras" : null)} onRead={(head, paras) => setReading({ head, paras })} />}
      {overlay === "chapters" && (
        <ChapterSelect
          onClose={() => setOverlay(screen === "title" ? "extras" : null)}
          onPick={(ch) => {
            const vars = loadGlobal().chapterVars[ch] ?? { ...DEFAULT_VARS };
            startAt(newGame(ch, vars));
          }}
        />
      )}
      {overlay === "confirmTitle" && (
        <div className="overlay" onClick={() => setOverlay(null)}>
          <div className="confirm" onClick={(e) => e.stopPropagation()}>
            <p>타이틀로 돌아갈까요?</p>
            <p className="muted">지금 자리는 자동 기록에 남겨 둡니다.</p>
            <div className="confirm-row">
              <button
                className="btn"
                onClick={() => {
                  writeSlot("auto", makeSave(snapshot(gs, beat), log, beatPreview(beat)));
                  flushGlobal();
                  setOverlay(null);
                  setScreen("title");
                }}
              >
                돌아간다
              </button>
              <button className="btn ghost" onClick={() => setOverlay(null)}>
                계속 읽는다
              </button>
            </div>
          </div>
        </div>
      )}
      {reading && (
        <div className="overlay letter-overlay">
          <LetterCard head={reading.head} paras={reading.paras} onClose={() => setReading(null)} />
        </div>
      )}
      {toast && (
        <div key={toast.seq} className="toast" role="status">
          {toast.text}
        </div>
      )}
    </>
  );

  if (screen === "splash") {
    return (
      <main
        className="splash"
        onClick={() => {
          void audio.unlock();
          setScreen("title");
        }}
      >
        <TitleHourglass className="splash-glass" />
        <p className="splash-title">천 번째 새벽, 당신에게</p>
        <p className="splash-tap">화면을 눌러 모래를 뒤집으세요</p>
        <p className="splash-note">소리와 함께 읽기를 권합니다 · 죽음과 상실을 다루는 장면이 있습니다</p>
      </main>
    );
  }

  if (screen === "title") {
    return (
      <main className="app">
        <Stage
          key="title"
          stage={{ bg: TITLE_BG ?? "black", bgTrans: "cut", bgMs: 0, bgSeq: 0, cg: null, actors: [], bgm: "title", amb: null, fx: "sand", filter: null, nvl: false, nvlLines: [] }}
          pulse={null}
        >
          <div className={`title-screen${TITLE_BG ? " has-art" : " no-art"}`}>
            <div className="title-sky" aria-hidden />
            <Particles kind="ash" />
            <div className="logo">
              <TitleHourglass className="logo-glass" />
              <span className="logo-sub">To You, on the Thousandth Dawn</span>
              <h1>
                <span>천 번째 새벽,</span>
                <span>당신에게</span>
              </h1>
              <span className="logo-rule" aria-hidden>
                <i />
                <b />
                <i />
              </span>
              {unlockedTrue && <span className="logo-true">재의 왕에게 가는 길이 열렸습니다</span>}
            </div>
            <nav className="title-menu">
              <button onClick={newRun}>처음부터</button>
              <button onClick={continueLatest} disabled={!hasSave}>
                이어서
              </button>
              <button onClick={() => setOverlay("load")} disabled={!hasSave}>
                불러오기
              </button>
              <button onClick={() => setOverlay("extras")}>특별 수록</button>
              <button onClick={() => setOverlay("settings")}>설정</button>
            </nav>
            <footer className="title-foot">사망 회귀 판타지 로맨스 비주얼 노벨 · 각본 · 그림 · 음악 전부 코드로 · lab</footer>
          </div>
        </Stage>
        {panels}
      </main>
    );
  }

  if (screen === "ending" && ending) {
    return (
      <main className="app">
        <EndingRoll id={ending} onDone={() => setScreen("title")} />
        {panels}
      </main>
    );
  }

  const speaker = say?.char;
  return (
    <main className="app" onWheel={onWheel}>
      <Stage key={session} stage={gs.stage} speaker={speaker} pulse={pulse} unmasked={!!gs.vars.unmasked}>
        <div
          className={`play${hideUi ? " ui-hidden" : ""}`}
          onClick={proceed}
          onContextMenu={(e) => {
            e.preventDefault();
            setHideUi((v) => !v);
          }}
        >
          {place && (
            <div key={place.seq} className="place">
              <span>{place.text}</span>
            </div>
          )}
          {gs.day !== null && !hideUi && (
            <div className="day-chip">
              새벽제 제{gs.day}일 <span>· 제{Number(gs.vars.loop ?? 1)}회차</span>
            </div>
          )}

          {gs.stage.nvl && (say || beat?.kind === "choice" || gs.stage.nvlLines.length > 0) ? (
            <NvlPage
              lines={gs.stage.nvlLines}
              seq={beatSeq}
              current={say ? { who: say.who, text: say.text, quiet: say.quiet } : null}
              msPerChar={msPerChar}
              finish={finish}
              done={typed}
              onDone={() => setTyped(true)}
            />
          ) : (
            say && (
              <TextBox
                key={beatSeq}
                who={say.who}
                text={say.text}
                quiet={say.quiet}
                msPerChar={msPerChar}
                finish={finish}
                done={typed}
                onDone={() => setTyped(true)}
                auto={auto}
                skip={skip}
              />
            )
          )}

          {beat?.kind === "choice" && <Choices key={beatSeq} options={beat.options} onPick={pick} />}

          <nav className="quick" onClick={(e) => e.stopPropagation()} aria-label="빠른 메뉴">
            <button onClick={() => setOverlay("log")}>기록</button>
            <button className={auto ? "on" : ""} onClick={() => setAuto((v) => !v)}>
              자동
            </button>
            <button className={skip ? "on" : ""} onClick={() => setSkip((v) => !v)}>
              넘기기
            </button>
            <button onClick={() => setOverlay("save")}>저장</button>
            <button onClick={() => setOverlay("load")}>불러오기</button>
            <button className="wide-only" onClick={() => saveTo("quick")}>빠른저장</button>
            <button
              className="wide-only"
              onClick={() => {
                const d = loadSlot("quick");
                if (d) loadData(d);
                else notify("빠른 기록이 없습니다");
              }}
            >
              빠른로드
            </button>
            <button onClick={() => setOverlay("settings")}>설정</button>
            <button onClick={() => setHideUi(true)}>숨기기</button>
            <button onClick={() => setOverlay("confirmTitle")}>타이틀</button>
          </nav>
        </div>

        {beat?.kind === "title" && (
          <div className="card-layer" onClick={proceed}>
            <TitleCard small={beat.small} big={beat.big} />
          </div>
        )}
        {beat?.kind === "day" && (
          <div className="card-layer soft" onClick={proceed}>
            <DayCard n={beat.n} loop={Number(gs.vars.loop ?? 1)} />
          </div>
        )}
        {beat?.kind === "letter" && (
          <div className="card-layer letter-layer">
            <LetterCard key={beatSeq} head={beat.head} paras={beat.paras} onClose={() => continueFrom(beatSeq)} />
          </div>
        )}
        {beat?.kind === "death" && (
          <div className="card-layer loop-layer">
            <DeathSequence key={beatSeq} id={beat.id} first={deathFirst} fast={skip} nudge={nudge} onDone={() => continueFrom(beatSeq)} />
          </div>
        )}
        {beat?.kind === "rewind" && (
          <div className="card-layer loop-layer">
            <RewindSequence key={beatSeq} loop={beat.loop} fast={skip} nudge={nudge} onDone={() => continueFrom(beatSeq)} />
          </div>
        )}
        <div className={`veil${veil ? " on" : ""}`} />
      </Stage>
      {panels}
    </main>
  );
}

// ── 엔딩과 크레딧 ──────────────────────────────
function EndingRoll({ id, onDone }: { id: string; onDone: () => void }) {
  const info = endingInfo(id);
  const credits = info.kind !== "BAD";
  const [phase, setPhase] = useState<"card" | "roll" | "after">("card");
  const firstTime = useRef(loadGlobal().endings.filter((e) => e === id).length <= 1);

  useEffect(() => {
    audio.setAmbient(null);
    audio.playBgm(info.kind === "TRUE" || info.kind === "GOOD" ? "ending" : info.kind === "ANOTHER" ? "seoul" : info.kind === "NORMAL" ? "sorrow" : "between", 2500);
  }, [info.kind]);

  useEffect(() => {
    if (phase === "card") {
      const t = setTimeout(() => setPhase(credits ? "roll" : "after"), 6500);
      return () => clearTimeout(t);
    }
    if (phase === "roll") {
      const t = setTimeout(() => setPhase("after"), 62000);
      return () => clearTimeout(t);
    }
  }, [phase, credits]);

  const next = () => {
    if (phase === "card") setPhase(credits ? "roll" : "after");
    else if (phase === "roll") setPhase("after");
    else onDone();
  };

  const g = loadGlobal();
  const got = g.endings.length;
  return (
    <div className={`ending ending-${info.kind.toLowerCase()}`} onClick={next}>
      {phase === "card" && (
        <div className="ending-card">
          <span className="ending-kind">{info.kind} END</span>
          <span className="ending-title">{info.title}</span>
        </div>
      )}
      {phase === "roll" && (
        <div className="credits">
          <div className="credits-scroll">
            <p className="cr-logo">천 번째 새벽, 당신에게</p>
            <p className="cr-sub">To You, on the Thousandth Dawn</p>
            <p className="cr-gap" />
            <p className="cr-role">각본 · 연출</p>
            <p className="cr-name">Claude</p>
            <p className="cr-role">그림 · 캐릭터 · 배경</p>
            <p className="cr-name">Claude</p>
            <p className="cr-role">음악 · 소리</p>
            <p className="cr-name">Claude</p>
            <p className="cr-role">프로그램</p>
            <p className="cr-name">Claude</p>
            <p className="cr-gap" />
            <p className="cr-role">등장인물</p>
            {["한서하", ...Object.values(CHARACTER_NAMES)].map((n) => (
              <p key={n} className="cr-name small">
                {n}
              </p>
            ))}
            <p className="cr-gap" />
            <p className="cr-role">음악</p>
            {TRACKS.map((t) => (
              <p key={t.id} className="cr-name small">
                {t.title}
              </p>
            ))}
            <p className="cr-gap" />
            <p className="cr-role">그리고</p>
            <p className="cr-name small">천 번을 되돌아와 끝까지 읽어 준 당신에게</p>
            <p className="cr-gap" />
            <p className="cr-end">lab · 2026</p>
          </div>
        </div>
      )}
      {phase === "after" && (
        <div className="ending-after">
          <span className="ending-kind">{info.kind} END</span>
          <span className="ending-title">{info.title}</span>
          <p className="ending-note">
            {firstTime.current ? "엔딩 도감에 새 새벽이 기록되었습니다." : "이미 기록된 엔딩입니다."} ({got}/{ENDINGS.length}) · 사망 기록 {g.deaths.length}
          </p>
          {trueUnlocked() && id !== "true" && id !== "return" && (
            <p className="ending-note gold">세 사람의 새벽을 모두 보았습니다. 제5장의 마지막 갈림길에, 재의 왕에게 가는 길이 열렸습니다.</p>
          )}
          <p className="ending-tap">눌러서 타이틀로</p>
        </div>
      )}
    </div>
  );
}

// 거꾸로 선 금빛 모래시계: 아래 방울의 모래가 가는 줄기로 위 방울에 쌓입니다.
function TitleHourglass({ className }: { className?: string }) {
  return (
    <svg className={`hourglass ${className ?? ""}`} viewBox="0 0 200 320" aria-hidden>
      <defs>
        <linearGradient id="hg-frame" x1="0" x2="1">
          <stop offset="0" stopColor="#a8742e" />
          <stop offset="0.5" stopColor="#ffe3a1" />
          <stop offset="1" stopColor="#a8742e" />
        </linearGradient>
        <linearGradient id="hg-sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff1c4" />
          <stop offset="1" stopColor="#f5b04a" />
        </linearGradient>
        <clipPath id="hg-top">
          <path d="M44 28 C44 96 94 124 98 158 L102 158 C106 124 156 96 156 28 Z" />
        </clipPath>
        <clipPath id="hg-bot">
          <path d="M98 162 C94 196 44 224 44 292 L156 292 C156 224 106 196 102 162 Z" />
        </clipPath>
      </defs>
      <path className="hg-glass" d="M44 28 C44 96 94 124 98 160 C94 196 44 224 44 292 L156 292 C156 224 106 196 102 160 C106 124 156 96 156 28 Z" />
      {/* 위 방울: 거꾸로 흘러 쌓이는 모래 (윗면에 붙음) */}
      <g clipPath="url(#hg-top)">
        <rect className="hg-fill-top" x="30" y="28" width="140" height="130" fill="url(#hg-sand)" />
      </g>
      {/* 아래 방울: 줄어드는 모래 */}
      <g clipPath="url(#hg-bot)">
        <rect className="hg-fill-bot" x="30" y="162" width="140" height="130" fill="url(#hg-sand)" />
      </g>
      <line className="hg-stream" x1="100" y1="236" x2="100" y2="40" />
      <rect x="22" y="14" width="156" height="14" rx="4" fill="url(#hg-frame)" />
      <rect x="22" y="292" width="156" height="14" rx="4" fill="url(#hg-frame)" />
      <path d="M30 28 V292 M170 28 V292" stroke="url(#hg-frame)" strokeWidth="4" />
    </svg>
  );
}
