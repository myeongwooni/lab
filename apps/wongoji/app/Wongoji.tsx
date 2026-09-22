"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Cell } from "@/lib/store";

const PER_SHEET = 200;
const POLL_MS = 10_000;

type Reader = { c: string; n: string; t: number } | null;

function chunk(cells: Cell[]): Cell[][] {
  const out: Cell[][] = [];
  for (let i = 0; i < cells.length; i += PER_SHEET) {
    out.push(cells.slice(i, i + PER_SHEET));
  }
  return out.length ? out : [[]];
}

function clock(totalSec: number): string {
  const s = Math.max(0, totalSec);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`;
}

function dayLabel(ms: number): string {
  return new Date(ms + 9 * 3600_000).toISOString().slice(0, 10);
}

export default function Wongoji({
  initialCells,
  initialTotal,
  durable: initialDurable,
}: {
  initialCells: Cell[];
  initialTotal: number;
  durable: boolean;
}) {
  const [cells, setCells] = useState(initialCells);
  const [total, setTotal] = useState(initialTotal);
  const [durable, setDurable] = useState(initialDurable);
  const [me, setMe] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [usedToday, setUsedToday] = useState(false);
  const [resetIn, setResetIn] = useState(0);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; warn: boolean }>({
    text: "불러오는 중이에요.",
    warn: false,
  });
  const [reader, setReader] = useState<Reader>(null);

  const knownTotal = useRef(initialTotal);
  const justIndex = useRef(-1);

  const apply = useCallback((data: {
    cells: Cell[];
    total: number;
    me: string | null;
    nickname: string | null;
    usedToday: boolean;
    resetInSec: number;
    durable?: boolean;
  }) => {
    justIndex.current = data.total > knownTotal.current ? data.cells.length - 1 : -1;
    knownTotal.current = data.total;
    setCells(data.cells);
    setTotal(data.total);
    setMe(data.me);
    setNickname(data.nickname ?? "");
    setUsedToday(data.usedToday);
    setResetIn(data.resetInSec);
    if (typeof data.durable === "boolean") setDurable(data.durable);
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/state", { cache: "no-store" });
        if (!res.ok || !alive) return;
        apply(await res.json());
      } catch {
        /* 다음 폴링에서 다시 시도 */
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
    if (!usedToday) return;
    const id = setInterval(() => setResetIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [usedToday]);

  useEffect(() => {
    if (busy) return;
    if (usedToday) setNote({ text: "", warn: true });
    else setNote({ text: "한 글자를 고르세요. 오늘 단 한 번, 되돌릴 수 없어요.", warn: false });
  }, [usedToday, busy]);

  const submit = async () => {
    const ch = Array.from(value)[0];
    if (!ch) {
      setNote({ text: "한 글자를 입력해 주세요.", warn: true });
      return;
    }
    setBusy(true);
    setNote({ text: "원고지에 적는 중…", warn: false });
    try {
      const res = await fetch("/api/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ c: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (typeof data.resetInSec === "number") setResetIn(data.resetInSec);
        if (data.usedToday) setUsedToday(true);
        setNote({ text: data.error ?? "쓰지 못했어요.", warn: true });
        return;
      }
      apply(data);
      setValue("");
      setNote({ text: "남겼어요. 내일 한 글자가 또 돌아옵니다.", warn: false });
    } catch {
      setNote({ text: "쓰지 못했어요. 잠시 뒤에 다시 시도해 주세요.", warn: true });
    } finally {
      setBusy(false);
    }
  };

  const sheets = chunk(cells);
  const people = new Set(cells.map((c) => c.a)).size;
  const locked = usedToday || busy;

  return (
    <main className="wrap">
      <header>
        <p className="eyebrow">한 사람이 하루에 한 글자</p>
        <h1>이어달리기 원고지</h1>
        <p className="lead">
          모두가 한 칸씩 이어 씁니다. 다음 글자가 무엇이 될지는 누구도 정할 수 없고, 한 번 쓴
          글자는 지워지지 않아요. 하루가 지나면 차례가 한 번 더 돌아옵니다.
        </p>
      </header>

      {!durable && (
        <p className="alarm" role="status">
          원고지 보관소에 닿지 못했습니다. 지금 보이는 글자는 실제 기록이 아니며, 지금
          쓰는 한 글자도 남지 않을 수 있습니다.
        </p>
      )}

      <dl className="stats">
        <div className="stat">
          <dt>쓰인 글자</dt>
          <dd>{total.toLocaleString("ko-KR")}</dd>
        </div>
        <div className="stat">
          <dt>이어쓴 사람</dt>
          <dd>{people.toLocaleString("ko-KR")}</dd>
        </div>
        <div className="stat">
          <dt>채운 원고지</dt>
          <dd>{sheets.length.toLocaleString("ko-KR")}</dd>
        </div>
      </dl>

      <p className="reading">
        {cells.length ? (
          <>
            {cells.map((c) => c.c).join("")}
            <span className="caret" />
          </>
        ) : (
          <span className="empty">아직 아무도 첫 글자를 쓰지 않았어요.</span>
        )}
      </p>

      <section className="compose">
        <div className="field">
          <label htmlFor="char">오늘의 한 글자</label>
          <input
            id="char"
            type="text"
            autoComplete="off"
            value={value}
            disabled={locked}
            onChange={(e) => {
              const arr = Array.from(e.target.value);
              setValue(arr.length ? arr[arr.length - 1] : "");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
        </div>
        <button type="button" className="send" disabled={locked} onClick={submit}>
          한 글자 남기기
        </button>
        <p className={note.warn ? "note warn" : "note"}>
          {usedToday && !busy ? (
            <>
              오늘 몫은 다 썼어요. 다음 차례까지 <b>{clock(resetIn)}</b>
            </>
          ) : (
            note.text
          )}
        </p>
      </section>

      <section>
        <div className="sheets">
          {sheets.map((body, si) => {
            const isLast = si === sheets.length - 1;
            const offset = si * PER_SHEET;
            return (
              <div key={si}>
                <div className="sheet-head">
                  <span>{si + 1}장</span>
                  <span>
                    {body.length} / {PER_SHEET}
                  </span>
                </div>
                <div className="sheet">
                  {Array.from({ length: PER_SHEET }, (_, i) => {
                    const cell = body[i];
                    if (!cell) {
                      const isNext = isLast && i === body.length;
                      return (
                        <span
                          key={i}
                          className={isNext ? "cell next" : "cell"}
                          aria-hidden="true"
                        />
                      );
                    }
                    const classes = ["cell", "filled"];
                    if (cell.c === " ") classes.push("space");
                    if (me && cell.a === me) classes.push("mine");
                    if (offset + i === justIndex.current) classes.push("just");
                    return (
                      <button
                        key={i}
                        type="button"
                        className={classes.join(" ")}
                        onClick={() => setReader({ c: cell.c, n: cell.n, t: cell.t })}
                      >
                        {cell.c === " " ? "" : cell.c}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <p className="reader" aria-live="polite">
          {reader ? (
            <>
              <b>“{reader.c === " " ? "띄어쓰기" : reader.c}”</b>
              {` — ${reader.n} · ${dayLabel(reader.t)}`}
            </>
          ) : (
            "칸을 누르면 누가 언제 썼는지 보여요."
          )}
        </p>
      </section>

      <ul className="rules">
        <li>
          <span className="marker">한</span>한 사람은 하루에 한 글자만 쓸 수 있어요. 자정(KST)에
          차례가 돌아옵니다.
        </li>
        <li>
          <span className="marker">두</span>띄어쓰기와 문장부호도 한 칸을 차지해요. 원고지니까요.
        </li>
        <li>
          <span className="marker">세</span>200칸이 차면 다음 장으로 넘어가고, 문장은 계속됩니다.
        </li>
        {nickname && (
          <li>
            <span className="marker">넷</span>이번 방문에서 당신의 이름은 <b>{nickname}</b>
            입니다.
          </li>
        )}
      </ul>
    </main>
  );
}
