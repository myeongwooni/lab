"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Break, Snapshot } from "@/lib/store";

const POLL_MS = 4000;

type Payload = Snapshot & {
  nickname?: string | null;
  cooldown?: number;
  outcome?: "heads" | "tails";
  broke?: number;
};

function when(ms: number): string {
  const d = new Date(ms + 9 * 3600_000);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 ${String(
    d.getUTCHours(),
  ).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export default function CoinChain({
  initial,
  odds,
  cooldownSec,
}: {
  initial: Snapshot;
  odds: number;
  cooldownSec: number;
}) {
  const [state, setState] = useState<Snapshot>(initial);
  const [nickname, setNickname] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [caption, setCaption] = useState("");
  const [broken, setBroken] = useState(false);
  const [beat, setBeat] = useState<"tick" | "snap" | "">("");

  const seenChain = useRef(initial.chain);

  const apply = useCallback((data: Payload, fromMe: boolean) => {
    setState({
      chain: data.chain,
      record: data.record,
      flips: data.flips,
      breaks: data.breaks,
      hall: data.hall,
      recent: data.recent,
    });
    if (data.nickname) setNickname(data.nickname);
    if (typeof data.cooldown === "number") setCooldown(data.cooldown);

    const grew = data.chain > seenChain.current;
    const cut = data.chain < seenChain.current;
    seenChain.current = data.chain;

    if (data.outcome === "tails" && fromMe) {
      setBroken(true);
      setBeat("snap");
      setCaption(`당신이 ${data.broke?.toLocaleString("ko-KR")}에서 끊었습니다.`);
    } else if (data.outcome === "heads" && fromMe) {
      setBroken(false);
      setBeat("tick");
      setCaption("앞면. 체인이 이어집니다.");
    } else if (cut) {
      setBroken(true);
      setBeat("snap");
      const last = data.recent[0];
      setCaption(
        last ? `${last.n}님이 ${last.len.toLocaleString("ko-KR")}에서 끊었습니다.` : "",
      );
    } else if (grew) {
      setBroken(false);
      setBeat("tick");
    }
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/state", { cache: "no-store" });
        if (!res.ok || !alive) return;
        apply(await res.json(), false);
      } catch {
        /* 다음 폴링에서 다시 */
      }
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [apply]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    if (!beat) return;
    const id = setTimeout(() => setBeat(""), 600);
    return () => clearTimeout(id);
  }, [beat, state.chain]);

  const flip = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/flip", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        if (typeof data.cooldown === "number") setCooldown(data.cooldown);
        setCaption(data.error ?? "던지지 못했어요.");
        return;
      }
      apply(data, true);
    } catch {
      setCaption("던지지 못했어요. 잠시 뒤에 다시.");
    } finally {
      setBusy(false);
    }
  };

  const locked = busy || cooldown > 0;

  return (
    <main className="wrap">
      <div className="masthead">
        <h1>동전 체인</h1>
        <span className="odds">뒷면 확률 {odds}분의 1</span>
      </div>

      <section className={broken ? "counter broken" : "counter"}>
        <span className="label">지금 체인</span>
        <div className={beat ? `chain ${beat}` : "chain"}>
          {state.chain.toLocaleString("ko-KR")}
        </div>
        <p className="caption">
          {caption ||
            (state.chain === 0
              ? "아무도 아직 첫 동전을 던지지 않았습니다."
              : `${state.chain.toLocaleString("ko-KR")}번 연속 앞면. 다음은 당신입니다.`)}
        </p>
      </section>

      <section className="throw">
        <button type="button" className="flip" disabled={locked} onClick={flip}>
          {cooldown > 0 ? (
            <>
              {cooldown}초 뒤에 다시
              <span className="sub">한 사람은 {cooldownSec}초에 한 번</span>
            </>
          ) : (
            <>
              동전 던지기
              <span className="sub">{odds}번에 한 번, 당신이 끊습니다</span>
            </>
          )}
        </button>
        {nickname && (
          <p className="who">
            이 자리에서 당신의 이름은 <b>{nickname}</b>
          </p>
        )}
      </section>

      <dl className="figures">
        <div className="figure">
          <dt>역대 최장</dt>
          <dd>{state.record.toLocaleString("ko-KR")}</dd>
        </div>
        <div className="figure">
          <dt>던져진 동전</dt>
          <dd>{state.flips.toLocaleString("ko-KR")}</dd>
        </div>
        <div className="figure">
          <dt>끊긴 횟수</dt>
          <dd>{state.breaks.toLocaleString("ko-KR")}</dd>
        </div>
      </dl>

      <section>
        <h2>가장 높은 곳에서 끊은 사람</h2>
        {state.hall.length ? (
          <ol className="hall">
            {state.hall.map((b: Break, i) => (
              <li key={`${b.t}-${i}`}>
                <span className="rank">{i + 1}</span>
                <span className="name">{b.n}</span>
                <span className="len">{b.len.toLocaleString("ko-KR")}</span>
                <span className="when">{when(b.t)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="empty">아직 아무도 체인을 끊지 못했습니다.</p>
        )}
      </section>

      <ul className="how">
        <li>
          <span className="bullet">·</span>동전을 던져 앞면이 나오면 체인이 1 늘어납니다.
        </li>
        <li>
          <span className="bullet">·</span>
          {odds}번에 한 번 뒷면이 나오고, 그 순간 체인은 0으로 돌아갑니다.
        </li>
        <li>
          <span className="bullet">·</span>끊은 사람의 이름과 그때의 숫자는 지워지지 않습니다.
        </li>
        <li>
          <span className="bullet">·</span>한 사람은 {cooldownSec}초에 한 번만 던질 수 있습니다.
        </li>
      </ul>
    </main>
  );
}
