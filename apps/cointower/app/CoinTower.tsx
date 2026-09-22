"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Ranked = { id: string; best: number; at: number; name: string };

type View = {
  top: Ranked[];
  runs: number;
  flips: number;
  me: string | null;
  nickname: string | null;
  named: boolean;
  best: number;
  durable: boolean;
};

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

function trim(n: number): string {
  return n.toFixed(1).replace(/\.0$/, "");
}

/** "이 기록은 N번에 한 번" — Korean myriad groupings, because 1048576 reads
 *  as nothing while 백만 reads as a number people can feel. */
function oneInLabel(n: number): string {
  if (n < 10_000) return n.toLocaleString("ko-KR");
  if (n < 1e8) return `${trim(n / 1e4)}만`;
  if (n < 1e12) return `${trim(n / 1e8)}억`;
  if (n < 1e16) return `${trim(n / 1e12)}조`;
  return `${trim(n / 1e16)}경`;
}

function percentLabel(p: number): string {
  const pct = p * 100;
  if (pct >= 10) return `${trim(pct)}%`;
  if (pct >= 0.1) return `${pct.toFixed(2)}%`;
  if (pct >= 0.001) return `${pct.toFixed(4)}%`;
  return `${pct.toExponential(1)}%`;
}

/** A run of n means n heads in a row, so the chance of getting at least
 *  this far is 2^-n. */
function odds(run: number): { oneIn: string; percent: string } {
  const p = Math.pow(2, -run);
  return { oneIn: oneInLabel(Math.pow(2, run)), percent: percentLabel(p) };
}

export default function CoinTower({
  initial,
  nameMax,
}: {
  initial: View;
  nameMax: number;
}) {
  const [view, setView] = useState<View>(initial);

  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(0);
  const [face, setFace] = useState<"heads" | "tails" | null>(null);
  const [seq, setSeq] = useState(0);
  const [verdict, setVerdict] = useState("");
  const [finished, setFinished] = useState<number | null>(null);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [nameNote, setNameNote] = useState("");

  const running = useRef(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const absorb = useCallback((data: View) => setView(data), []);

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
    setFinished(null);

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
      setFinished(data.run);
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

  const saveName = async () => {
    setNameNote("");
    try {
      const res = await fetch("/api/name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draft }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNameNote(data.error ?? "이름을 바꾸지 못했어요.");
        return;
      }
      absorb(data);
      setEditing(false);
    } catch {
      setNameNote("이름을 바꾸지 못했어요. 잠시 뒤에 다시.");
    }
  };

  const busy = phase === "flipping";
  const leader = view.top[0];
  const chance = finished !== null && finished > 0 ? odds(finished) : null;

  return (
    <main className="wrap">
      <div className="masthead">
        <h1>동전탑</h1>
        <span className="odds">앞면과 뒷면, 정확히 반반</span>
      </div>

      {!view.durable && (
        <p className="alarm" role="status">
          기록 저장소에 닿지 못했습니다. 지금 보이는 순위는 실제 기록이 아니며, 이번에
          쌓은 탑도 남지 않을 수 있습니다.
        </p>
      )}

      <section className={`stage ${phase}${face === "tails" ? " fell" : ""}`}>
        <div className="coin" key={seq} data-face={face ?? "none"}>
          {face === "tails" ? "뒤" : face === "heads" ? "앞" : "?"}
        </div>

        <div className="tower" aria-hidden="true">
          {Array.from({ length: count }, (_, i) => (
            <span className="chip" key={i} />
          ))}
        </div>

        <div className="count">{count}</div>
        <span className="label">연속 앞면</span>

        <p className="verdict">
          {verdict ||
            (busy ? "던지는 중…" : "앞면이 나오는 동안 동전은 계속 던져집니다.")}
        </p>

        {chance && (
          <p className="chance">
            여기까지 쌓을 확률 <b>{chance.percent}</b>
            <span className="sep">·</span>
            {chance.oneIn}번에 한 번
          </p>
        )}
        {finished === 0 && (
          <p className="chance">두 번에 한 번은 이렇게 끝납니다.</p>
        )}
      </section>

      <section className="throw">
        <button type="button" className="go" disabled={busy} onClick={go}>
          {busy ? "던지는 중…" : "던지기 시작"}
          <span className="sub">횟수 제한 없음. 될 때까지.</span>
        </button>

        {editing ? (
          <form
            className="rename"
            onSubmit={(e) => {
              e.preventDefault();
              saveName();
            }}
          >
            <input
              id="name"
              type="text"
              maxLength={nameMax}
              value={draft}
              autoFocus
              enterKeyHint="done"
              placeholder="기록판에 남길 이름"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditing(false);
              }}
            />
            <button type="submit" className="ghost">
              저장
            </button>
            <button
              type="button"
              className="ghost quiet"
              onClick={() => setEditing(false)}
            >
              취소
            </button>
          </form>
        ) : (
          view.nickname && (
            <p className="who">
              기록판에서 당신의 이름은 <b>{view.nickname}</b>
              <button
                type="button"
                className="linky"
                onClick={() => {
                  setDraft(view.named ? (view.nickname ?? "") : "");
                  setNameNote("");
                  setEditing(true);
                }}
              >
                바꾸기
              </button>
            </p>
          )
        )}
        {!view.nickname && !editing && (
          <p className="who">
            <button
              type="button"
              className="linky"
              onClick={() => {
                setDraft("");
                setEditing(true);
              }}
            >
              이름 정하기
            </button>
          </p>
        )}
        {nameNote && <p className="who warn">{nameNote}</p>}
      </section>

      <dl className="figures">
        <div className="figure">
          <dt>내 최고</dt>
          <dd>{view.best}</dd>
        </div>
        <div className="figure">
          <dt>전체 1위</dt>
          <dd>{leader ? leader.best : 0}</dd>
        </div>
        <div className="figure">
          <dt>던져진 동전</dt>
          <dd>{view.flips.toLocaleString("ko-KR")}</dd>
        </div>
      </dl>

      <section>
        <h2>가장 높이 쌓은 사람</h2>
        {view.top.length ? (
          <ol className="board">
            {view.top.map((e, i) => (
              <li key={e.id} className={e.id === view.me ? "mine" : undefined}>
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
          <span className="bullet">·</span>확률은 정확히 반반이라 n층에 닿을 확률은
          2의 n제곱분의 1입니다. 10층은 1,024번에 한 번, 20층은 백만 번에 한 번.
        </li>
      </ul>

      <p className="foot">
        지금까지 {view.runs.toLocaleString("ko-KR")}번의 도전이 있었습니다.
      </p>
    </main>
  );
}
