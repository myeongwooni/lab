"use client";

import { useEffect, useState } from "react";
import { Sprite } from "./Art";

export type DiceState = "idle" | "rolling" | "success" | "fail" | "crit" | "fumble";

// 굴리는 동안에는 숫자가 빠르게 바뀌고, 멈추면 결과를 보여 줍니다.
export function D20({ value, state, scale = 5 }: { value?: number; state: DiceState; scale?: number }) {
  const [spin, setSpin] = useState(20);
  useEffect(() => {
    if (state !== "rolling") return;
    const id = window.setInterval(() => setSpin(Math.floor(Math.random() * 20) + 1), 55);
    return () => window.clearInterval(id);
  }, [state]);
  const shown = state === "rolling" ? spin : value ?? 20;
  const label = state === "rolling" ? "주사위를 굴리는 중" : value ? `주사위 눈 ${value}` : "20면체 주사위";
  return (
    <div className={`d20 d20-${state}`} style={{ width: 19 * scale, height: 19 * scale }} role="img" aria-label={label}>
      <Sprite id="d20" scale={scale} />
      <span className="d20-num" style={{ fontSize: Math.round(scale * (shown >= 10 ? 3.8 : 4.4)) }}>
        {shown}
      </span>
    </div>
  );
}

// 능력치를 굴릴 때 쓰는 작은 육면체 눈.
export function D6({ value, dropped, rolling }: { value: number; dropped?: boolean; rolling?: boolean }) {
  const [spin, setSpin] = useState(value);
  useEffect(() => {
    if (!rolling) return;
    const id = window.setInterval(() => setSpin(Math.floor(Math.random() * 6) + 1), 60);
    return () => window.clearInterval(id);
  }, [rolling]);
  return <span className={`d6${dropped && !rolling ? " d6-dropped" : ""}${rolling ? " d6-rolling" : ""}`}>{rolling ? spin : value}</span>;
}
