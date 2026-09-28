"use client";

import { useEffect, useRef, useState } from "react";
import { MonsterOnStage, SceneArt, Sprite } from "./game/Art";
import { CreateScreen } from "./game/CreateScreen";
import { D20, type DiceState } from "./game/Dice";
import {
  CLASSES,
  MONSTERS,
  STAT_NAMES,
  abilityCheck,
  heroAc,
  josa,
  mod,
  signed,
  startFight,
  takeTurn,
  type Action,
  type CheckResult,
  type Fight,
  type Hero,
  type RollShown,
  type Tally,
} from "./game/engine";
import { addFlag, affordable, applyEffects, hasAdvantage, usedKey, visibleChoices } from "./game/flow";
import { addEnding, clearSave, loadEndings, loadSave, writeSave, type LogEntry } from "./game/save";
import { ENDINGS, ENDING_ORDER, SCENES, type Choice, type EndingId, type Goto, type SceneId } from "./game/story";

const ROLL_MS = 1000;
const QUICK_MS = 380;

type Game = { hero: Hero; scene: SceneId; checkpoint: Hero; tally: Tally; log: LogEntry[] };
type FightGoto = Extract<Goto, { fight: unknown }>;

type View =
  | { t: "scene" }
  | { t: "resolve"; index: number; phase: "ready" | "rolling" | "done"; result?: CheckResult; text?: string; notes?: string[]; go?: Goto }
  | {
      t: "fight";
      fight: Fight;
      go: FightGoto;
      lines: string[];
      busy: boolean;
      rolling: boolean;
      roll?: RollShown;
      monster: "idle" | "hit" | "attack" | "down";
      heroHit: boolean;
      outcome?: "win" | "lose" | "fled";
    };

type Screen = { t: "title" } | { t: "create" } | { t: "play" } | { t: "end"; ending: EndingId };

const CLUES: Record<string, string> = {
  rumor: "주인장의 소문: 북쪽 새끼 용은 추위를 몹시 탄다",
  clue: "그을린 발자국: 도둑은 불을 지닌 짐승이다",
  runes: "돌문의 룬: 용의 이름은 '잿불'",
  mimicTip: "상인의 귀띔: 반짝이는 상자를 조심하라",
  mimicSeen: "보물상자의 정체는 미믹이다",
  shield: "낡은 방패: 방어 +1",
};

const EMPTY_TALLY: Tally = { rolls: 0, crits: 0, fumbles: 0, kills: 0 };

function chance(bonus: number, dc: number, advantage: boolean) {
  const need = dc - bonus;
  const p = Math.min(0.95, Math.max(0.05, (21 - need) / 20));
  return Math.round((advantage ? 1 - (1 - p) ** 2 : p) * 100);
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

// 게임 마스터의 서술을 한 글자씩 풀어 놓습니다. 누르면 바로 끝까지 보입니다.
function Narration({ text, onDone }: { text: string; onDone?: () => void }) {
  const [n, setN] = useState(0);
  const done = n >= text.length;
  useEffect(() => {
    if (prefersReducedMotion()) {
      setN(text.length);
      return;
    }
    const id = window.setInterval(() => setN((v) => (v >= text.length ? v : v + 1)), 22);
    return () => window.clearInterval(id);
  }, [text]);
  useEffect(() => {
    if (done) onDone?.();
  }, [done, onDone]);
  return (
    <p className="narration" onClick={() => setN(text.length)}>
      <span>{text.slice(0, n)}</span>
      <span className="narration-rest" aria-hidden>
        {text.slice(n)}
      </span>
      {!done && <span className="sr-only">{text}</span>}
    </p>
  );
}

function HpBar({ hp, max, className }: { hp: number; max: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (hp / max) * 100));
  const tone = pct > 50 ? "ok" : pct > 25 ? "warn" : "low";
  return (
    <div className={`hpbar hpbar-${tone} ${className ?? ""}`} role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={hp} aria-label="체력">
      <div className="hpbar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

function Hud({ hero, hit, onLog }: { hero: Hero; hit: boolean; onLog: () => void }) {
  const cls = CLASSES[hero.classId];
  return (
    <header className={`hud${hit ? " hud-hit" : ""}`}>
      <div className="hud-portrait">
        <Sprite id={hero.classId} scale={3} />
      </div>
      <div className="hud-main">
        <div className="hud-name">
          <b>{hero.name}</b> <span>{cls.name}</span>
        </div>
        <HpBar hp={hero.hp} max={hero.maxHp} />
        <div className="hud-stats">
          <span>
            체력 {hero.hp}/{hero.maxHp}
          </span>
          <span>방어 {heroAc(hero)}</span>
          <span className="hud-item">
            <Sprite id="potion" scale={2} /> {hero.potions}
          </span>
          <span className="hud-item">
            <Sprite id="coin" scale={2} /> {hero.gold}
          </span>
        </div>
      </div>
      <button type="button" className="hud-log" onClick={onLog} aria-label="모험 일지 열기">
        일지
      </button>
    </header>
  );
}

function LogSheet({ game, onClose }: { game: Game; onClose: () => void }) {
  const { hero } = game;
  const clues = hero.flags.filter((f) => CLUES[f]);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="모험 일지" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h3>모험 일지</h3>
          <button type="button" className="link-btn" onClick={onClose}>
            닫기 ✕
          </button>
        </div>
        <div className="sheet-stats">
          {(["str", "dex", "int", "cha"] as const).map((s) => (
            <span key={s}>
              {STAT_NAMES[s]} <b>{hero.stats[s]}</b> ({signed(mod(hero.stats[s]))})
            </span>
          ))}
        </div>
        <h4>알아낸 것</h4>
        {clues.length ? (
          <ul className="clue-list">
            {clues.map((f) => (
              <li key={f}>{CLUES[f]}</li>
            ))}
          </ul>
        ) : (
          <p className="hint">아직 없다.</p>
        )}
        <h4>기록</h4>
        <ol className="log-list">
          {game.log.map((entry, i) => (
            <li key={game.log.length - i} className={`log-${entry.kind}`}>
              {entry.text}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function ChoiceButton({ choice, hero, onPick, n }: { choice: Choice; hero: Hero; onPick: () => void; n: number }) {
  const ok = affordable(choice, hero);
  const check = choice.check;
  const adv = hasAdvantage(choice, hero);
  return (
    <button type="button" className="choice" onClick={onPick} disabled={!ok}>
      <span className="choice-n">{n}</span>
      <span className="choice-label">{choice.label}</span>
      {check && (
        <span className="choice-check">
          {STAT_NAMES[check.stat]} {signed(mod(hero.stats[check.stat]))} · DC {check.dc}
          {adv && <em> · 유리</em>} · {chance(mod(hero.stats[check.stat]), check.dc, adv)}%
        </span>
      )}
      {!ok && <span className="choice-check">금화가 부족하다</span>}
    </button>
  );
}

function diceStateOf(r: { success: boolean; crit: boolean; fumble: boolean } | undefined, rolling: boolean): DiceState {
  if (rolling) return "rolling";
  if (!r) return "idle";
  if (r.crit) return "crit";
  if (r.fumble) return "fumble";
  return r.success ? "success" : "fail";
}

export default function Home() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>({ t: "title" });
  const [game, setGame] = useState<Game | null>(null);
  const [view, setView] = useState<View>({ t: "scene" });
  const [endings, setEndings] = useState<EndingId[]>([]);
  const [hasSave, setHasSave] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [typed, setTyped] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEndings(loadEndings());
    setHasSave(!!loadSave());
    setReady(true);
    return () => window.clearTimeout(timer.current);
  }, []);

  const later = (fn: () => void, ms: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(fn, prefersReducedMotion() ? Math.min(ms, 150) : ms);
  };

  const persist = (g: Game) => {
    writeSave({ v: 1, ...g });
    setHasSave(true);
  };

  const addLog = (g: Game, entry: LogEntry): Game => ({ ...g, log: [entry, ...g.log].slice(0, 80) });

  const enterScene = (g0: Game, id: SceneId) => {
    const g = addLog({ ...g0, scene: id, checkpoint: g0.hero }, { kind: "story", text: `— ${SCENES[id].title} —` });
    setGame(g);
    setView({ t: "scene" });
    setTyped(false);
    persist(g);
    topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  const finish = (g: Game, ending: EndingId) => {
    setEndings(addEnding(ending));
    if (ending === "fallen") {
      // 이어하기를 누르면 쓰러진 장면의 처음부터 다시 합니다.
      writeSave({ v: 1, ...g, hero: g.checkpoint });
    } else {
      clearSave();
      setHasSave(false);
    }
    setGame(g);
    setScreen({ t: "end", ending });
    window.scrollTo({ top: 0 });
  };

  const go = (g: Game, target: Goto) => {
    if (g.hero.hp <= 0) return finish(g, "fallen");
    if ("stay" in target) {
      setGame(g);
      setView({ t: "scene" });
      setTyped(true);
      persist({ ...g });
      return;
    }
    if ("scene" in target) return enterScene(g, target.scene);
    if ("ending" in target) return finish(g, target.ending);
    const fight = startFight(target.fight, target.surprise);
    const m = MONSTERS[target.fight];
    setGame(addLog(g, { kind: "fight", text: `${josa(m.name, "과", "와")} 전투 시작!` }));
    setView({
      t: "fight",
      fight,
      go: target,
      lines: target.surprise ? [`선수를 쳤다! ${josa(m.name, "은", "는")} 이미 상처를 입었다.`] : [`${josa(m.name, "이", "가")} 앞을 막아선다!`],
      busy: false,
      rolling: false,
      monster: target.surprise ? "hit" : "idle",
      heroHit: false,
    });
  };

  // ── 선택지와 판정 ──
  const pick = (index: number) => {
    if (!game) return;
    const choice = SCENES[game.scene].choices[index];
    let g = game;
    if (choice.once) g = { ...g, hero: addFlag(g.hero, usedKey(g.scene, index)) };
    if (choice.check) {
      setGame(g);
      setView({ t: "resolve", index, phase: "ready" });
      return;
    }
    const { hero, notes } = applyEffects(g.hero, choice.pass.effects);
    g = { ...g, hero };
    setGame(g);
    setView({ t: "resolve", index, phase: "done", text: choice.pass.text, notes, go: choice.pass.go });
  };

  const rollCheck = () => {
    if (!game || view.t !== "resolve" || view.phase !== "ready") return;
    const choice = SCENES[game.scene].choices[view.index];
    const check = choice.check!;
    const result = abilityCheck(game.hero, check.stat, check.dc, hasAdvantage(choice, game.hero));
    setView({ ...view, phase: "rolling", result });
    later(() => {
      const outcome = result.success ? choice.pass : choice.fail ?? choice.pass;
      const { hero, notes } = applyEffects(game.hero, outcome.effects);
      const tally = {
        ...game.tally,
        rolls: game.tally.rolls + result.dice.length,
        crits: game.tally.crits + (result.crit ? 1 : 0),
        fumbles: game.tally.fumbles + (result.fumble ? 1 : 0),
      };
      const verdict = result.crit ? "대성공" : result.fumble ? "대실패" : result.success ? "성공" : "실패";
      const g = addLog(
        { ...game, hero, tally },
        { kind: "roll", text: `${STAT_NAMES[check.stat]} 판정 DC ${check.dc}: ${result.natural}${signed(result.bonus)} = ${result.total}, ${verdict}` },
      );
      setGame(g);
      setView({ t: "resolve", index: view.index, phase: "done", result, text: outcome.text, notes, go: outcome.go });
    }, ROLL_MS);
  };

  // ── 전투 ──
  const act = (action: Action) => {
    if (!game || view.t !== "fight" || view.busy || view.outcome) return;
    const needsRoll = action === "attack" || action === "flee" || (action === "skill" && (game.hero.classId === "warrior" || game.hero.classId === "rogue"));
    setView({ ...view, busy: true, rolling: needsRoll, roll: undefined, monster: "idle", heroHit: false });
    later(() => {
      const step = takeTurn(view.fight, game.hero, action);
      let hero = step.hero;
      const lines = [...step.lines];
      const m = MONSTERS[view.fight.monster];
      let tally = {
        ...game.tally,
        rolls: game.tally.rolls + step.rolls,
        crits: game.tally.crits + step.crits,
        fumbles: game.tally.fumbles + step.fumbles,
      };
      if (step.outcome === "win") {
        tally = { ...tally, kills: tally.kills + 1 };
        if (m.gold) {
          hero = { ...hero, gold: hero.gold + m.gold };
          lines.push(`금화 ${m.gold}닢을 얻었다.`);
        }
      }
      const g = addLog({ ...game, hero, tally }, { kind: "fight", text: lines.join(" ") });
      setGame(g);
      setView({
        ...view,
        fight: step.fight,
        lines,
        busy: false,
        rolling: false,
        roll: step.roll,
        monster: step.outcome === "win" ? "down" : step.hitEnemy ? "hit" : step.hitHero ? "attack" : "idle",
        heroHit: step.hitHero,
        outcome: step.outcome,
      });
    }, needsRoll ? ROLL_MS : QUICK_MS);
  };

  const afterFight = () => {
    if (!game || view.t !== "fight" || !view.outcome) return;
    if (view.outcome === "lose") return finish(game, "fallen");
    if (view.outcome === "fled") return enterScene(game, view.go.flee ?? game.scene);
    const win = view.go.win;
    if (win in ENDINGS) return finish(game, win as EndingId);
    enterScene(game, win as SceneId);
  };

  // ── 화면 전환 ──
  const newGame = () => setScreen({ t: "create" });
  const continueGame = () => {
    const save = loadSave();
    if (!save) return setHasSave(false);
    const { v: _v, ...g } = save;
    setGame(g);
    setView({ t: "scene" });
    setTyped(false);
    setScreen({ t: "play" });
  };
  const startHero = (hero: Hero) => {
    const g: Game = {
      hero,
      scene: "tavern",
      checkpoint: hero,
      tally: { ...EMPTY_TALLY },
      log: [{ kind: "story", text: `${hero.name}, ${josa(CLASSES[hero.classId].name, "으로", "로")} 모험을 시작하다.` }],
    };
    setScreen({ t: "play" });
    enterScene(g, "tavern");
  };
  const retry = () => {
    if (!game) return;
    setScreen({ t: "play" });
    enterScene({ ...game, hero: game.checkpoint }, game.scene);
  };

  if (!ready) return <main className="shell" />;

  return (
    <main className="shell">
      <div ref={topRef} />
      {screen.t === "title" && <TitleScreen hasSave={hasSave} endings={endings} onNew={newGame} onContinue={continueGame} />}
      {screen.t === "create" && <CreateScreen onStart={startHero} onBack={() => setScreen({ t: "title" })} />}
      {screen.t === "play" && game && (
        <PlayScreen
          game={game}
          view={view}
          typed={typed}
          onTyped={() => setTyped(true)}
          onPick={pick}
          onRoll={rollCheck}
          onGo={(target) => go(game, target)}
          onAct={act}
          onAfterFight={afterFight}
          onLog={() => setShowLog(true)}
        />
      )}
      {screen.t === "end" && game && (
        <EndScreen
          ending={screen.ending}
          game={game}
          endings={endings}
          onRetry={retry}
          onNew={newGame}
          onTitle={() => setScreen({ t: "title" })}
        />
      )}
      {showLog && game && screen.t === "play" && <LogSheet game={game} onClose={() => setShowLog(false)} />}
    </main>
  );
}

function TitleScreen({ hasSave, endings, onNew, onContinue }: { hasSave: boolean; endings: EndingId[]; onNew: () => void; onContinue: () => void }) {
  return (
    <section className="title-screen">
      <p className="kicker">도트 TRPG</p>
      <h1 className="logo">다이스테일</h1>
      <p className="subtitle">제1화 · 꺼진 새벽 등불</p>
      <div className="title-stage">
        <SceneArt art="lair" label="금화 더미 위에서 등불을 안고 잠든 새끼 용" />
        <div className="title-party" aria-hidden>
          {(["warrior", "rogue", "mage", "bard"] as const).map((id, i) => (
            <span key={id} className="bob" style={{ animationDelay: `${i * 0.18}s` }}>
              <Sprite id={id} scale={3} />
            </span>
          ))}
        </div>
      </div>
      <div className="title-actions">
        {hasSave && (
          <button type="button" className="btn btn-primary btn-wide" onClick={onContinue}>
            이어하기 ▶
          </button>
        )}
        <button type="button" className={`btn btn-wide${hasSave ? "" : " btn-primary"}`} onClick={onNew}>
          새 모험
        </button>
      </div>
      <div className="panel rules">
        <h3 className="panel-title">규칙은 하나</h3>
        <p>
          행동을 고르면 게임 마스터가 판정을 요구합니다. <b>d20 + 능력 보정</b>이 <b>난이도(DC)</b> 이상이면 성공.
          20은 무조건 대성공, 1은 무조건 대실패입니다.
        </p>
      </div>
      <EndingBook endings={endings} />
    </section>
  );
}

function EndingBook({ endings, current }: { endings: EndingId[]; current?: EndingId }) {
  return (
    <div className="panel">
      <h3 className="panel-title">
        엔딩 도감 {endings.length}/{ENDING_ORDER.length}
      </h3>
      <ul className="ending-book">
        {ENDING_ORDER.map((id) => {
          const got = endings.includes(id);
          return (
            <li key={id} className={`${got ? "is-got" : ""}${current === id ? " is-current" : ""}`}>
              <div className="ending-thumb">{got ? <SceneArt art={ENDINGS[id].art} label={ENDINGS[id].title} /> : <span>?</span>}</div>
              <span>{got ? ENDINGS[id].title : "???"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type PlayProps = {
  game: Game;
  view: View;
  typed: boolean;
  onTyped: () => void;
  onPick: (i: number) => void;
  onRoll: () => void;
  onGo: (g: Goto) => void;
  onAct: (a: Action) => void;
  onAfterFight: () => void;
  onLog: () => void;
};

function PlayScreen({ game, view, typed, onTyped, onPick, onRoll, onGo, onAct, onAfterFight, onLog }: PlayProps) {
  const scene = SCENES[game.scene];
  const hero = game.hero;
  const fighting = view.t === "fight";
  const heroHit = view.t === "fight" && view.heroHit;
  return (
    <section className="play">
      <Hud hero={hero} hit={heroHit} onLog={onLog} />
      <div className={`stage${fighting ? " stage-fight" : ""}`}>
        <SceneArt art={scene.art} label={scene.title}>
          {view.t === "fight" && <MonsterOnStage id={view.fight.monster} state={view.monster} />}
        </SceneArt>
        <div className="stage-title">{scene.title}</div>
        {view.t === "fight" && (
          <div className="stage-enemy">
            <span>{MONSTERS[view.fight.monster].name}</span>
            <HpBar hp={view.fight.hp} max={view.fight.maxHp} className="hpbar-enemy" />
          </div>
        )}
      </div>

      <div className="dialog">
        {view.t === "scene" && <SceneView game={game} typed={typed} onTyped={onTyped} onPick={onPick} />}
        {view.t === "resolve" && <ResolveView game={game} view={view} onRoll={onRoll} onGo={onGo} />}
        {view.t === "fight" && <FightView game={game} view={view} onAct={onAct} onAfterFight={onAfterFight} />}
      </div>
    </section>
  );
}

function SceneView({ game, typed, onTyped, onPick }: { game: Game; typed: boolean; onTyped: () => void; onPick: (i: number) => void }) {
  const scene = SCENES[game.scene];
  const notes = (scene.notes ?? []).filter((n) => game.hero.flags.includes(n.flag));
  const choices = visibleChoices(game.scene, game.hero);
  return (
    <>
      <p className="gm-tag">게임 마스터</p>
      {typed ? <p className="narration">{scene.text}</p> : <Narration key={game.scene} text={scene.text} onDone={onTyped} />}
      {typed && notes.map((n) => <p key={n.flag} className="gm-note">✦ {n.text}</p>)}
      {typed && (
        <div className="choices">
          <p className="choices-q">어떻게 하겠습니까?</p>
          {choices.map(({ choice, index }, i) => (
            <ChoiceButton key={index} n={i + 1} choice={choice} hero={game.hero} onPick={() => onPick(index)} />
          ))}
        </div>
      )}
    </>
  );
}

function ResolveView({ game, view, onRoll, onGo }: { game: Game; view: Extract<View, { t: "resolve" }>; onRoll: () => void; onGo: (g: Goto) => void }) {
  const choice = SCENES[game.scene].choices[view.index];
  const check = choice.check;
  const r = view.result;
  const rolling = view.phase === "rolling";
  const state = diceStateOf(view.phase === "done" ? r : undefined, rolling);
  const bonus = check ? mod(game.hero.stats[check.stat]) : 0;
  const adv = hasAdvantage(choice, game.hero);
  return (
    <>
      <p className="picked">▶ {choice.label}</p>
      {check && (
        <div className={`check check-${state}`}>
          <div className="check-head">
            <b>{STAT_NAMES[check.stat]} 판정</b>
            <span>
              d20 {signed(bonus)} ≥ DC {check.dc}
              {adv && " · 유리(2개 중 높은 눈)"}
            </span>
          </div>
          <div className="check-dice">
            <D20 value={r?.natural} state={state} />
            {r && view.phase === "done" && r.dice.length > 1 && <span className="check-adv">[{r.dice.join(", ")}]</span>}
          </div>
          {view.phase === "done" && r ? (
            <p className="check-result">
              {r.natural} {signed(r.bonus)} = <b>{r.total}</b> {r.total >= r.dc ? "≥" : "<"} {r.dc}
              <strong>{r.crit ? " 대성공!" : r.fumble ? " 대실패!" : r.success ? " 성공!" : " 실패…"}</strong>
            </p>
          ) : (
            <button type="button" className="btn btn-dice btn-wide" onClick={onRoll} disabled={rolling}>
              {rolling ? "데구르르…" : "주사위 굴리기"}
            </button>
          )}
        </div>
      )}
      {view.phase === "done" && view.text && (
        <>
          <p className="gm-tag">게임 마스터</p>
          <Narration key={view.text} text={view.text} />
          {!!view.notes?.length && (
            <p className="effects">
              {view.notes.map((n) => (
                <span key={n}>{n}</span>
              ))}
            </p>
          )}
          <button type="button" className="btn btn-primary btn-wide" onClick={() => view.go && onGo(view.go)}>
            {game.hero.hp <= 0 ? "눈앞이 캄캄해진다…" : "계속 ▶"}
          </button>
        </>
      )}
    </>
  );
}

function FightView({ game, view, onAct, onAfterFight }: { game: Game; view: Extract<View, { t: "fight" }>; onAct: (a: Action) => void; onAfterFight: () => void }) {
  const hero = game.hero;
  const cls = CLASSES[hero.classId];
  const m = MONSTERS[view.fight.monster];
  const pm = mod(hero.stats[cls.primary]);
  const disabled = view.busy || !!view.outcome;
  const showDice = view.rolling || !!view.roll;
  return (
    <>
      <p className="gm-tag">
        전투 · {view.fight.round}번째 차례
        {view.fight.charging && <em className="warn"> · 불길 주의!</em>}
      </p>
      <div className="fight-log">
        {showDice && (
          <div className="fight-dice">
            <D20 value={view.roll?.natural} state={diceStateOf(view.roll, view.rolling)} scale={3} />
          </div>
        )}
        <div className="fight-lines" aria-live="polite">
          {view.busy ? <p className="narration">{view.rolling ? "주사위가 구른다…" : "…"}</p> : view.lines.map((l, i) => <p key={i}>{l}</p>)}
        </div>
      </div>
      {view.outcome ? (
        <button type="button" className="btn btn-primary btn-wide" onClick={onAfterFight}>
          {view.outcome === "win" ? "승리! 계속 ▶" : view.outcome === "fled" ? "몸을 피했다. 계속 ▶" : "쓰러졌다…"}
        </button>
      ) : (
        <div className="actions">
          <button type="button" className="act act-attack" onClick={() => onAct("attack")} disabled={disabled}>
            <b>공격</b>
            <span>
              {cls.weapon} {cls.weaponDice}
              {signed(pm)} · 명중 {signed(pm + 2)}
            </span>
          </button>
          <button type="button" className="act act-skill" onClick={() => onAct("skill")} disabled={disabled || view.fight.skillUsed}>
            <b>{cls.skill}</b>
            <span>{view.fight.skillUsed ? "이번 전투엔 썼다" : cls.skillText}</span>
          </button>
          <button type="button" className="act act-potion" onClick={() => onAct("potion")} disabled={disabled || hero.potions <= 0 || hero.hp >= hero.maxHp}>
            <b>물약 ×{hero.potions}</b>
            <span>2d4+3 회복</span>
          </button>
          <button type="button" className="act act-flee" onClick={() => onAct("flee")} disabled={disabled || !!m.boss || !view.go.flee}>
            <b>도망</b>
            <span>{m.boss || !view.go.flee ? "물러설 곳이 없다" : `민첩 ${signed(mod(hero.stats.dex))} · DC 11`}</span>
          </button>
        </div>
      )}
      <p className="fight-foot">
        {m.name}: 방어 {m.ac} · 공격 +{m.atk} · 피해 {m.dmg}
      </p>
    </>
  );
}

function EndScreen({
  ending,
  game,
  endings,
  onRetry,
  onNew,
  onTitle,
}: {
  ending: EndingId;
  game: Game;
  endings: EndingId[];
  onRetry: () => void;
  onNew: () => void;
  onTitle: () => void;
}) {
  const e = ENDINGS[ending];
  const { hero, tally } = game;
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const text = `다이스테일 — ${e.title}\n${hero.name}(${CLASSES[hero.classId].name}) · 주사위 ${tally.rolls}번 · 대성공 ${tally.crits}번 · 금화 ${hero.gold}\n${location.origin}`;
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      }
    } catch {
      // 공유 창을 닫은 경우
    }
  };
  return (
    <section className={`end-screen${e.good ? "" : " end-bad"}`}>
      <p className="kicker">{e.good ? "THE END" : "GAME OVER"}</p>
      <h2 className="end-title">{e.title}</h2>
      <div className="stage">
        <SceneArt art={e.art} label={e.title} />
      </div>
      <div className="dialog">
        <Narration text={e.text} />
      </div>
      <div className="panel end-card">
        <Sprite id={hero.classId} scale={4} />
        <div>
          <p className="end-name">
            <b>{hero.name}</b> · {CLASSES[hero.classId].name}
          </p>
          <ul className="end-stats">
            <li>
              주사위 <b>{tally.rolls}</b>번
            </li>
            <li>
              대성공 <b>{tally.crits}</b> · 대실패 <b>{tally.fumbles}</b>
            </li>
            <li>
              쓰러뜨린 적 <b>{tally.kills}</b>
            </li>
            <li>
              금화 <b>{hero.gold}</b>
            </li>
          </ul>
        </div>
      </div>
      <div className="title-actions">
        {!e.good && (
          <button type="button" className="btn btn-primary btn-wide" onClick={onRetry}>
            이 장면부터 다시 ({SCENES[game.scene].title})
          </button>
        )}
        <button type="button" className={`btn btn-wide${e.good ? " btn-primary" : ""}`} onClick={onNew}>
          새 모험가로 다시
        </button>
        {e.good && (
          <button type="button" className="btn btn-wide" onClick={share}>
            {copied ? "복사했어요" : "결과 공유"}
          </button>
        )}
        <button type="button" className="link-btn" onClick={onTitle}>
          처음 화면으로
        </button>
      </div>
      <EndingBook endings={endings} current={ending} />
    </section>
  );
}
