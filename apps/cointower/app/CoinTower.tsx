"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Board, Entry } from "@/lib/store";

type Ranked = Entry & { name: string };
type Phase = "idle" | "flipping" | "ended";

/** Each flip waits a little longer than the last, so a run that is going
 *  somewhere slows down instead of blurring past. */
function delayFor(nth: number): number {
  return 200 + Math.min(nth, 15) * 28;
}

function pause(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function dateLabel(ms: number): string {
  if (!ms) return "";
  const d = new Date(ms + 9 * 3600_000);
  return `${d.getUTCMonth() + 1}.${d.getUTCDate()}`;
}

export default function CoinTower({
  initial,
  initialTop,
}: {
  initial: Board;
  initialTop: Ranked[];
}) {
  const [top, setTop] = useState<Ranked[]>(initialTop);
  const [runs, setRuns] = useState(initial.runs);
  const [flips, setFlips] = useState(initial.flips);
  const [me, setMe] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [best, setBest] = useState(0);

  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(0);
  const [face, setFace] = useState<"heads" | "tails" | null>(null);
  const [seq, setSeq] = useState(0);
  const [verdict, setVerdict] = useState("");

  const running = useRef(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const absorb = useCallback(
    (data: {
      top: Ranked[];
      runs: number;
      flips: number;
      me: string | null;
      nickname: string | null;
      best: number;
    }) => {
      setTop(data.top);
      setRuns(data.runs);
      setFlips(data.flips);
      setMe(data.me);
      setNickname(data.nickname ?? "");
      setBest(data.best);
    },
    [],
  );

  useEffect(() => {
    let on = true;
    fetch("/api/state", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (on && d) absorb(d);
      })
      .catch(() => {});
    return () => {
      on = false;
    };
  }, [absorb]);

  const go = async () => {
    if (running.current) return;
    running.current = true;
    setPhase("flipping");
    setCount(0);
    setFace(null);
    setVerdict("");

    try {
      const res = await fetch("/api/run", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setPhase("idle");
        setVerdict(data.error ?? "던지지 못했어요.");
        return;
      }

      for (let i = 1; i <= data.run; i++) {
        await pause(delayFor(i));
        if (!alive.current) return;
        setSeq((s) => s + 1);
        setFace("heads");
        setCount(i);
      }

      await pause(delayFor(data.run + 1));
      if (!alive.current) return;
      setSeq((s) => s + 1);
      setFace("tails");
      setPhase("ended");
      absorb(data);

      if (data.run === 0) setVerdict("첫 동전부터 뒷면. 탑을 세우지 못했어요.");
      else if (data.isRecord) setVerdict(`새 기록. ${data.run}층까지 쌓았어요.`);
      else setVerdict(`${data.run}층에서 무너졌어요. 최고 기록은 ${data.best}층.`);
    } catch {
      setPhase("idle");
      setVerdict("던지지 못했어요. 잠시 뒤에 다시.");
    } finally {
      running.current = false;
    }
  };

  const busy = phase === "flipping";
  const leader = top[0];

  return (
    <main className="wrap">
      <div className="masthead">
        <h1>동전탑</h1>
        <span className="odds">앞면과 뒷면, 정확히 반반</span>
      </div>

      <section className={`stage ${phase}${face === "tails" ? " fell" : ""}`}>
        <div className="coin" key={seq} data-face={face ?? "none"}>
          {face === "tails" ? "뒤" : face === "heads" ? "앞" : "?"}
        </div>
        <div className="count">{count}</div>
        <span className="label">연속 앞면</span>
        <div className="stack" aria-hidden="true">
          {Array.from({ length: count }, (_, i) => (
            <span className="brick" key={i} />
          ))}
        </div>
        <p className="verdict">
          {verdict ||
            (busy ? "던지는 중…" : "앞면이 나오는 동안 동전은 계속 던져집니다.")}
        </p>
      </section>

      <section className="throw">
        <button type="button" className="go" disabled={busy} onClick={go}>
          {busy ? "던지는 중…" : "던지기 시작"}
          <span className="sub">횟수 제한 없음. 될 때까지.</span>
        </button>
        {nickname && (
          <p className="who">
            이 기록판에서 당신의 이름은 <b>{nickname}</b>
          </p>
        )}
      </section>

      <dl className="figures">
        <div className="figure">
          <dt>내 최고</dt>
          <dd>{best}</dd>
        </div>
        <div className="figure">
          <dt>전체 1위</dt>
          <dd>{leader ? leader.best : 0}</dd>
        </div>
        <div className="figure">
          <dt>던져진 동전</dt>
          <dd>{flips.toLocaleString("ko-KR")}</dd>
        </div>
      </dl>

      <section>
        <h2>가장 높이 쌓은 사람</h2>
        {top.length ? (
          <ol className="board">
            {top.map((e, i) => (
              <li key={e.id} className={e.id === me ? "mine" : undefined}>
                <span className="rank">{i + 1}</span>
                <span className="name">{e.name}</span>
                <span className="when">{dateLabel(e.at)}</span>
                <span className="score">{e.best}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="empty">아직 아무도 탑을 쌓지 못했습니다. 첫 기록을 남겨보세요.</p>
        )}
      </section>

      <ul className="how">
        <li>
          <span className="bullet">·</span>버튼을 한 번 누르면 앞면이 나오는 동안 동전이
          저절로 계속 던져집니다.
        </li>
        <li>
          <span className="bullet">·</span>뒷면이 나오는 순간 탑이 무너지고, 그때까지의
          층수가 기록됩니다.
        </li>
        <li>
          <span className="bullet">·</span>확률은 정확히 반반입니다. 10층은 1,024번에 한 번,
          20층은 백만 번에 한 번 나옵니다.
        </li>
      </ul>

      <p className="foot">지금까지 {runs.toLocaleString("ko-KR")}번의 도전이 있었습니다.</p>
    </main>
  );
}
