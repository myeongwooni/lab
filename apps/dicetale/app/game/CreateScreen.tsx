"use client";

import { useEffect, useRef, useState } from "react";
import { Sprite } from "./Art";
import { D6 } from "./Dice";
import { CLASSES, STAT_NAMES, STAT_ORDER, makeHero, mod, rollAbility, signed, type ClassId, type Hero, type StatId } from "./engine";

const NAMES = ["아린", "도윤", "하람", "미르", "소이", "라온", "이든", "해솔", "누리", "벼리"];
const CLASS_IDS: ClassId[] = ["warrior", "rogue", "mage", "bard"];
const ROLL_MS = 900;
const REROLLS = 3;

type Rolled = Record<StatId, { dice: number[]; value: number }>;

function rollAll(): Rolled {
  return { str: rollAbility(), dex: rollAbility(), int: rollAbility(), cha: rollAbility() };
}

export function CreateScreen({ onStart, onBack }: { onStart: (hero: Hero) => void; onBack: () => void }) {
  const [name, setName] = useState("");
  const [classId, setClassId] = useState<ClassId>("warrior");
  const [rolled, setRolled] = useState<Rolled | null>(null);
  const [rolling, setRolling] = useState(false);
  const [left, setLeft] = useState(REROLLS);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    setName(NAMES[Math.floor(Math.random() * NAMES.length)]);
    return () => window.clearTimeout(timer.current);
  }, []);

  const roll = () => {
    if (rolling || left <= 0) return;
    const next = rollAll();
    setRolled(next);
    setRolling(true);
    setLeft((n) => n - 1);
    timer.current = window.setTimeout(() => setRolling(false), ROLL_MS);
  };

  const cls = CLASSES[classId];
  const base = rolled ? (Object.fromEntries(STAT_ORDER.map((s) => [s, rolled[s].value])) as Record<StatId, number>) : null;
  const preview = base ? makeHero(name.trim() || "이름 없는 모험가", classId, base) : null;
  const canStart = !!preview && !rolling;

  return (
    <section className="create">
      <header className="screen-head">
        <button type="button" className="link-btn" onClick={onBack}>
          ◀ 처음으로
        </button>
        <h2>모험가 만들기</h2>
      </header>

      <div className="panel">
        <h3 className="panel-title">1. 직업</h3>
        <div className="class-grid" role="radiogroup" aria-label="직업">
          {CLASS_IDS.map((id) => {
            const c = CLASSES[id];
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={classId === id}
                className={`class-card${classId === id ? " is-selected" : ""}`}
                onClick={() => setClassId(id)}
              >
                <Sprite id={id} scale={3} className="class-sprite" />
                <span className="class-name">{c.name}</span>
                <span className="class-meta">주 능력 {STAT_NAMES[c.primary]}</span>
                <span className="class-meta">
                  체력 {c.hp} · 방어 {c.ac}
                </span>
              </button>
            );
          })}
        </div>
        <p className="class-blurb">{cls.blurb}</p>
        <p className="class-skill">
          <b>{cls.weapon}</b> {cls.weaponDice} · <b>{cls.skill}</b> {cls.skillText}
        </p>
      </div>

      <div className="panel">
        <h3 className="panel-title">2. 능력치 굴리기</h3>
        <p className="hint">능력치마다 육면체 주사위 4개를 굴려 낮은 하나를 버립니다. 직업의 주 능력치에는 +2.</p>
        <ul className="stat-list">
          {STAT_ORDER.map((s) => {
            const r = rolled?.[s];
            const lowest = r ? r.dice.indexOf(Math.min(...r.dice)) : -1;
            const value = preview?.stats[s];
            const bonus = s === cls.primary;
            return (
              <li key={s} className={bonus ? "is-primary" : undefined}>
                <span className="stat-name">{STAT_NAMES[s]}</span>
                <span className="stat-dice">
                  {r ? r.dice.map((d, i) => <D6 key={i} value={d} dropped={i === lowest} rolling={rolling} />) : <span className="stat-empty">? ? ? ?</span>}
                </span>
                <span className="stat-value">
                  {value !== undefined && !rolling ? value : "—"}
                  {bonus && <em>+2</em>}
                </span>
                <span className="stat-mod">{value !== undefined && !rolling ? signed(mod(value)) : ""}</span>
              </li>
            );
          })}
        </ul>
        <button type="button" className="btn btn-dice" onClick={roll} disabled={rolling || left <= 0}>
          {rolled ? `다시 굴리기 (${left}번 남음)` : "주사위 굴리기"}
        </button>
      </div>

      <div className="panel">
        <h3 className="panel-title">3. 이름</h3>
        <input className="name-input" value={name} maxLength={8} onChange={(e) => setName(e.target.value)} aria-label="모험가 이름" />
      </div>

      <button type="button" className="btn btn-primary btn-wide" disabled={!canStart} onClick={() => preview && onStart(preview)}>
        {rolled ? "모험 시작 ▶" : "먼저 능력치를 굴려 주세요"}
      </button>
    </section>
  );
}
