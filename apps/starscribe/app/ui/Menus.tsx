"use client";

// 저장·불러오기, 설정, 대사 기록, 갤러리, 음악실, 편지함, 챕터 선택.
import { useEffect, useMemo, useState } from "react";
import { cgSvg } from "../art";
import { TRACKS, audio } from "../audio/director";
import { CG_ORDER, CG_TITLES, CHAPTERS, ENDINGS, ROUTE_NAMES, SPEAKER_COLORS, chapterInfo, type Route } from "../engine/catalog";
import { SLOT_COUNT, deleteSlot, loadGlobal, loadSlot, type LogLine, type SaveData, type Settings } from "../engine/save";
import { plain } from "../engine/text";
import { Rich } from "./Text";

export function Panel({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);
  return (
    <div className="overlay" onClick={onClose} role="dialog" aria-label={title}>
      <div className={`panel${wide ? " wide" : ""}`} onClick={(e) => e.stopPropagation()}>
        <header className="panel-head">
          <span className="panel-orn" aria-hidden>✦</span>
          <h2>{title}</h2>
          <button className="panel-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </header>
        <div className="panel-body">{children}</div>
      </div>
    </div>
  );
}

function formatDate(t: number) {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

type SlotId = number | "auto" | "quick";

export function SaveLoad({
  mode,
  onClose,
  onSave,
  onLoad,
}: {
  mode: "save" | "load";
  onClose: () => void;
  onSave?: (slot: number) => void;
  onLoad?: (data: SaveData) => void;
}) {
  const [tick, setTick] = useState(0);
  const [confirm, setConfirm] = useState<SlotId | null>(null);
  const slots: SlotId[] = mode === "load" ? ["auto", "quick", ...Array.from({ length: SLOT_COUNT }, (_, i) => i + 1)] : Array.from({ length: SLOT_COUNT }, (_, i) => i + 1);
  const data = useMemo(() => new Map(slots.map((s) => [s, loadSlot(s)])), [tick, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (s: SlotId) => {
    const d = data.get(s);
    if (mode === "load") {
      if (d) onLoad?.(d);
      return;
    }
    if (d && confirm !== s) {
      setConfirm(s);
      return;
    }
    onSave?.(s as number);
    setConfirm(null);
    setTick((t) => t + 1);
  };

  return (
    <Panel title={mode === "save" ? "기록하기" : "펼쳐 보기"} onClose={onClose} wide>
      <div className="slots">
        {slots.map((s) => {
          const d = data.get(s);
          const ch = d ? chapterInfo(d.chapter) : null;
          return (
            <div key={String(s)} className={`slot${d ? "" : " empty"}${confirm === s ? " confirm" : ""}`}>
              <button className="slot-main" onClick={() => pick(s)} disabled={mode === "load" && !d}>
                <span className="slot-no">{s === "auto" ? "자동" : s === "quick" ? "빠른" : String(s).padStart(2, "0")}</span>
                {d && ch ? (
                  <span className="slot-info">
                    <span className="slot-ch">
                      {ch.route !== "common" && <em>{ROUTE_NAMES[ch.route]} · </em>}
                      {ch.label} 「{ch.title}」{d.state.day ? ` · 제${d.state.day}일` : ""}
                    </span>
                    <span className="slot-prev">{plain(d.preview)}</span>
                    <span className="slot-date">{formatDate(d.at)}</span>
                  </span>
                ) : (
                  <span className="slot-info">
                    <span className="slot-prev">— 빈 페이지 —</span>
                  </span>
                )}
                {confirm === s && <span className="slot-warn">한 번 더 누르면 덮어씁니다</span>}
              </button>
              {d && typeof s === "number" && (
                <button
                  className="slot-del"
                  aria-label="지우기"
                  onClick={() => {
                    deleteSlot(s);
                    setTick((t) => t + 1);
                  }}
                >
                  지우기
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function Range({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt?: (v: number) => string }) {
  return (
    <label className="setting">
      <span className="setting-label">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="setting-val">{fmt ? fmt(value) : value}</span>
    </label>
  );
}

const SPEED_NAMES = ["", "느리게", "천천히", "보통", "빠르게", "즉시"];
const AUTO_NAMES = ["", "짧게", "조금 짧게", "보통", "조금 길게", "길게"];

export function SettingsPanel({ settings, onChange, onClose, onReset }: { settings: Settings; onChange: (s: Settings) => void; onClose: () => void; onReset: () => void }) {
  const [sure, setSure] = useState(false);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => onChange({ ...settings, [k]: v });
  const pct = (v: number) => `${Math.round(v * 100)}`;
  return (
    <Panel title="환경 설정" onClose={onClose}>
      <div className="settings">
        <h3>글</h3>
        <Range label="글자 속도" value={settings.textSpeed} min={1} max={5} step={1} onChange={(v) => set("textSpeed", v)} fmt={(v) => SPEED_NAMES[v]} />
        <Range label="자동 진행 대기" value={settings.autoDelay} min={1} max={5} step={1} onChange={(v) => set("autoDelay", v)} fmt={(v) => AUTO_NAMES[v]} />
        <Range label="글자 크기" value={settings.fontScale} min={0.9} max={1.2} step={0.05} onChange={(v) => set("fontScale", v)} fmt={(v) => `${Math.round(v * 100)}%`} />
        <label className="setting toggle">
          <span className="setting-label">읽지 않은 문장도 넘기기</span>
          <input type="checkbox" checked={settings.skipUnread} onChange={(e) => set("skipUnread", e.target.checked)} />
          <span className="setting-val">{settings.skipUnread ? "켬" : "끔"}</span>
        </label>
        <h3>소리</h3>
        <Range label="배경음악" value={settings.bgm} min={0} max={1} step={0.05} onChange={(v) => set("bgm", v)} fmt={pct} />
        <Range label="효과음" value={settings.se} min={0} max={1} step={0.05} onChange={(v) => set("se", v)} fmt={pct} />
        <Range label="환경음" value={settings.amb} min={0} max={1} step={0.05} onChange={(v) => set("amb", v)} fmt={pct} />
        <h3>화면</h3>
        <div className="setting-row">
          <button
            className="btn"
            onClick={() => {
              const el = document.documentElement;
              if (document.fullscreenElement) void document.exitFullscreen?.();
              else void el.requestFullscreen?.().catch(() => {});
            }}
          >
            전체 화면 전환
          </button>
          <button className={`btn danger${sure ? " armed" : ""}`} onClick={() => (sure ? (onReset(), setSure(false)) : setSure(true))}>
            {sure ? "정말로 모든 기록을 지웁니다" : "모든 기록 지우기"}
          </button>
        </div>
        <p className="setting-help">
          클릭·Enter·Space 넘기기 · Ctrl 누르는 동안 넘기기 · A 자동 · L 기록 · H 창 숨기기 · S 저장 · Q 빠른 저장 · Esc 메뉴
        </p>
      </div>
    </Panel>
  );
}

export function Backlog({ log, onClose }: { log: LogLine[]; onClose: () => void }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (el) el.scrollTop = el.scrollHeight;
  }, [el]);
  return (
    <Panel title="지나온 문장" onClose={onClose} wide>
      <div className="backlog" ref={setEl}>
        {log.length === 0 && <p className="muted">아직 아무것도 적히지 않았습니다.</p>}
        {log.map((l, i) =>
          l.choice ? (
            <p key={i} className="log-choice">
              ◇ {l.text}
            </p>
          ) : (
            <p key={i} className={l.who ? "log-say" : "log-narr"}>
              {l.who && (
                <span className="log-who" style={{ color: SPEAKER_COLORS[l.who] ?? "#d8d4ec" }}>
                  {l.who}
                </span>
              )}
              <span className="log-text">{l.who ? <>“<Rich text={l.text} />”</> : <Rich text={l.text} />}</span>
            </p>
          ),
        )}
      </div>
    </Panel>
  );
}

export function Gallery({ onClose }: { onClose: () => void }) {
  const g = loadGlobal();
  const [tab, setTab] = useState<"cg" | "end">("cg");
  const [view, setView] = useState<string | null>(null);
  const got = new Set(g.cgs);
  const ends = new Set(g.endings);
  return (
    <Panel title="회상록" onClose={onClose} wide>
      <div className="tabs">
        <button className={tab === "cg" ? "on" : ""} onClick={() => setTab("cg")}>
          그림 {got.size}/{CG_ORDER.length}
        </button>
        <button className={tab === "end" ? "on" : ""} onClick={() => setTab("end")}>
          엔딩 {ends.size}/{ENDINGS.length}
        </button>
      </div>
      {tab === "cg" ? (
        <div className="cg-grid">
          {CG_ORDER.map((id) =>
            got.has(id) ? (
              <button key={id} className="cg-thumb" onClick={() => setView(id)}>
                <div className="thumb-art" dangerouslySetInnerHTML={{ __html: cgSvg(id) }} />
                <span>{CG_TITLES[id]}</span>
              </button>
            ) : (
              <div key={id} className="cg-thumb locked">
                <div className="thumb-art" />
                <span>? ? ?</span>
              </div>
            ),
          )}
        </div>
      ) : (
        <ol className="ending-list">
          {ENDINGS.map((e) => (
            <li key={e.id} className={ends.has(e.id) ? "got" : "locked"}>
              <span className={`kind kind-${e.kind.toLowerCase()}`}>{e.kind}</span>
              <span className="end-title">{ends.has(e.id) ? e.title : "? ? ?"}</span>
              <span className="end-route">{ROUTE_NAMES[e.route]}</span>
              {!ends.has(e.id) && <span className="end-hint">{e.hint}</span>}
            </li>
          ))}
        </ol>
      )}
      {view && (
        <div className="cg-view" onClick={() => setView(null)}>
          <div className="bg-art" dangerouslySetInnerHTML={{ __html: cgSvg(view) }} />
          <span className="cg-view-title">{CG_TITLES[view]}</span>
        </div>
      )}
    </Panel>
  );
}

export function MusicRoom({ onClose }: { onClose: () => void }) {
  const g = loadGlobal();
  const heard = new Set(g.tracks);
  const [now, setNow] = useState<string | null>(audio.currentBgm());
  return (
    <Panel title="음악실" onClose={onClose}>
      <ol className="tracks">
        {TRACKS.map((t, i) => {
          const open = heard.has(t.id);
          return (
            <li key={t.id}>
              <button
                className={`track${now === t.id ? " on" : ""}`}
                disabled={!open}
                onClick={() => {
                  audio.playBgm(t.id, 1200);
                  setNow(t.id);
                }}
              >
                <span className="track-no">{String(i + 1).padStart(2, "0")}</span>
                <span className="track-title">{open ? t.title : "? ? ?"}</span>
                <span className="track-note">{open ? t.note : "이야기 속에서 들을 수 있습니다"}</span>
                {now === t.id && <span className="track-eq" aria-hidden><i /><i /><i /></span>}
              </button>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

export function Letters({ onClose, onRead }: { onClose: () => void; onRead: (head: string, paras: string[]) => void }) {
  const g = loadGlobal();
  const order = (ch: string) => CHAPTERS.findIndex((c) => c.id === ch);
  const list = [...g.letters].sort((a, b) => order(a.ch) - order(b.ch));
  return (
    <Panel title="편지함" onClose={onClose}>
      {list.length === 0 ? (
        <p className="muted">아직 받은 편지가 없습니다.</p>
      ) : (
        <ol className="letter-list">
          {list.map((l, i) => {
            const ch = chapterInfo(l.ch);
            return (
              <li key={i}>
                <button onClick={() => onRead(l.head, l.paras)}>
                  <span className="letter-head">{l.head}</span>
                  <span className="letter-first">{plain(l.paras[0] ?? "")}</span>
                  <span className="letter-ch">
                    {ch.route !== "common" ? `${ROUTE_NAMES[ch.route]} · ` : ""}
                    {ch.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}

export function ChapterSelect({ onClose, onPick }: { onClose: () => void; onPick: (ch: string) => void }) {
  const g = loadGlobal();
  const reached = new Set(g.chapters);
  const groups: Route[] = ["common", "cassian", "lucien", "true"];
  return (
    <Panel title="장 고르기" onClose={onClose} wide>
      <div className="chapters">
        {groups.map((r) => {
          const list = CHAPTERS.filter((c) => c.route === r);
          if (r !== "common" && !list.some((c) => reached.has(c.id))) return null;
          return (
            <section key={r}>
              <h3>{r === "common" ? "공통 루트" : `${ROUTE_NAMES[r]} 루트`}</h3>
              <div className="chapter-row">
                {list.map((c) => (
                  <button key={c.id} className="chapter-card" disabled={!reached.has(c.id)} onClick={() => onPick(c.id)}>
                    <span className="cc-label">{c.label}</span>
                    <span className="cc-title">{reached.has(c.id) ? c.title : "? ? ?"}</span>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </Panel>
  );
}
