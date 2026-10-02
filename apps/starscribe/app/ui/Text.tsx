"use client";

// 한 글자씩 풀리는 문장. 아직 안 나온 글자도 투명하게 미리 깔아 두어 줄바꿈이 흔들리지 않습니다.
import { useEffect, useMemo, useRef, useState } from "react";
import { tokenize, visibleCount, type Piece } from "../engine/text";

export function Typed({
  text,
  msPerChar,
  finish,
  onDone,
}: {
  text: string;
  msPerChar: number;
  finish: number; // 값이 바뀌면 즉시 끝까지 보입니다
  onDone?: () => void;
}) {
  const pieces = useMemo(() => tokenize(text), [text]);
  const total = useMemo(() => visibleCount(pieces), [pieces]);
  const [n, setN] = useState(msPerChar <= 0 ? total : 0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const finishRef = useRef(finish);
  // 클릭으로 끝까지 펼친 뒤에는 남은 타이머가 글자 수를 되돌리지 못하게 막습니다.
  const finishedRef = useRef(false);

  useEffect(() => {
    finishedRef.current = false;
    if (msPerChar <= 0) {
      setN(total);
      return;
    }
    setN(0);
    let i = 0;
    let pi = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (finishedRef.current) return;
      // 멈춤 조각을 만나면 그만큼 쉽니다. 문장부호 뒤에서도 살짝 쉽니다.
      let delay = msPerChar;
      while (pi < pieces.length && pieces[pi].t === "pause") {
        delay += (pieces[pi] as { ms: number }).ms;
        pi++;
      }
      if (pi >= pieces.length) {
        setN(total);
        return;
      }
      const p = pieces[pi];
      pi++;
      i++;
      setN(i);
      if (p.t === "ch" && /[.,!?…—]/.test(p.ch)) delay += msPerChar * 5;
      if (i >= total) return;
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, 60);
    return () => clearTimeout(timer);
  }, [pieces, total, msPerChar]);

  useEffect(() => {
    if (finish !== finishRef.current) {
      finishRef.current = finish;
      finishedRef.current = true;
      setN(total);
    }
  }, [finish, total]);

  useEffect(() => {
    if (n >= total) doneRef.current?.();
  }, [n, total]);

  return <Pieces pieces={pieces} shown={n} />;
}

export function Pieces({ pieces, shown = Infinity }: { pieces: Piece[]; shown?: number }) {
  let k = 0;
  return (
    <>
      {pieces.map((p, idx) => {
        if (p.t === "pause") return null;
        const visible = k++ < shown;
        const cls = `${visible ? "ch on" : "ch"}${p.em ? " em" : ""}`;
        if (p.t === "ruby")
          return (
            <ruby key={idx} className={cls}>
              {p.base}
              <rt>{p.rt}</rt>
            </ruby>
          );
        return (
          <span key={idx} className={cls}>
            {p.ch}
          </span>
        );
      })}
    </>
  );
}

export function Rich({ text }: { text: string }) {
  const pieces = useMemo(() => tokenize(text), [text]);
  return <Pieces pieces={pieces} />;
}
