/** A fair coin, so a run of n has probability 2^-n. The cap exists only so
 *  a pathological sequence cannot spin forever; reaching it is a 1-in-2^80
 *  event and has never happened to anyone. */
const RUN_CAP = 80;

/** Not a game rule — runs are unlimited. This only stops a script from
 *  hammering the endpoint and burning the Redis command budget; the coin
 *  animation already takes longer than this. */
export const SPAM_FLOOR_SEC = 1;

export type Entry = { id: string; best: number; at: number };

// The Upstash integration injects its REST credentials under KV_* names,
// while a store wired up by hand usually carries UPSTASH_*. Both can be
// present at once and point at different stores, so take a matched pair
// rather than each half separately — a url from one store with a token
// from another authenticates against neither. A variable that exists but
// is blank counts as absent.
// Integration-managed credentials come first: they are provisioned and
// rotated with the store, so they win over a hand-entered pair that may
// be stale or point somewhere else.
const CREDENTIAL_PAIRS = [
  ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
  ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
] as const;

function credentials(): { url: string; token: string } | null {
  for (const [urlName, tokenName] of CREDENTIAL_PAIRS) {
    const url = process.env[urlName]?.trim();
    const token = process.env[tokenName]?.trim();
    if (url && token) return { url, token };
  }
  return null;
}

const CREDS = credentials();
const REST_URL = CREDS?.url;
const REST_TOKEN = CREDS?.token;

export const usingRedis = Boolean(CREDS);

/** Without Redis each serverless instance keeps its own records, so viewers
 *  see different boards and every cold start wipes them. Fine locally,
 *  never in production — say so on the page rather than losing data quietly. */
export const durable = usingRedis || process.env.NODE_ENV !== "production";

const BOARD = "tower:board";
const WHEN = "tower:when";
const NAMES = "tower:names";
const RUNS = "tower:runs";
const FLIPS = "tower:flips";
const slotKey = (id: string) => `tower:slot:${id}`;

async function redis<T>(...command: (string | number)[]): Promise<T> {
  const res = await fetch(REST_URL!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command.map(String)),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`upstash ${res.status} ${await res.text()}`);
  return (await res.json()).result as T;
}

const mem = {
  board: new Map<string, number>(),
  when: new Map<string, number>(),
  names: new Map<string, string>(),
  runs: 0,
  flips: 0,
  slots: new Map<string, number>(),
};

/** Names people chose for themselves, by id. Missing ids are simply
 *  absent — the caller falls back to the generated nickname, so a board
 *  row always has something to show. */
export async function chosenNames(
  ids: string[],
): Promise<Record<string, string>> {
  if (!ids.length) return {};
  if (!usingRedis) {
    const out: Record<string, string> = {};
    for (const id of ids) {
      const name = mem.names.get(id);
      if (name) out[id] = name;
    }
    return out;
  }
  const values = await redis<(string | null)[]>("HMGET", NAMES, ...ids);
  const out: Record<string, string> = {};
  ids.forEach((id, i) => {
    const name = values[i];
    if (name) out[id] = name;
  });
  return out;
}

export async function setChosenName(id: string, name: string): Promise<void> {
  if (!usingRedis) {
    mem.names.set(id, name);
    return;
  }
  await redis("HSET", NAMES, id, name);
}

export type Board = {
  top: Entry[];
  runs: number;
  flips: number;
};

export async function board(): Promise<Board> {
  if (!usingRedis) {
    const top = [...mem.board.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([id, best]) => ({ id, best, at: mem.when.get(id) ?? 0 }));
    return { top, runs: mem.runs, flips: mem.flips };
  }
  const [flat, runs, flips] = await Promise.all([
    redis<string[]>("ZREVRANGE", BOARD, 0, 19, "WITHSCORES"),
    redis<string | null>("GET", RUNS),
    redis<string | null>("GET", FLIPS),
  ]);
  const ids: string[] = [];
  for (let i = 0; i < flat.length; i += 2) ids.push(flat[i]);
  const whens = ids.length
    ? await redis<(string | null)[]>("HMGET", WHEN, ...ids)
    : [];
  const top: Entry[] = ids.map((id, i) => ({
    id,
    best: Number(flat[i * 2 + 1]),
    at: Number(whens[i] ?? 0),
  }));
  return { top, runs: Number(runs ?? 0), flips: Number(flips ?? 0) };
}

export async function personalBest(id: string): Promise<number> {
  if (!usingRedis) return mem.board.get(id) ?? 0;
  const score = await redis<string | null>("ZSCORE", BOARD, id);
  return Number(score ?? 0);
}

export async function takeSlot(id: string): Promise<boolean> {
  const key = slotKey(id);
  if (!usingRedis) {
    const until = mem.slots.get(key) ?? 0;
    if (until > Date.now()) return false;
    mem.slots.set(key, Date.now() + SPAM_FLOOR_SEC * 1000);
    return true;
  }
  return (
    (await redis<string | null>("SET", key, "1", "NX", "EX", SPAM_FLOOR_SEC)) ===
    "OK"
  );
}

/** Flip a fair coin until it comes up tails; the run is the heads before
 *  it. Decided here rather than in the page so a leaderboard entry cannot
 *  be typed into existence from a console. */
export function rollRun(randomBit: () => number): number {
  let heads = 0;
  while (heads < RUN_CAP && randomBit() === 0) heads += 1;
  return heads;
}

export async function recordRun(
  id: string,
  run: number,
  at: number,
): Promise<{ best: number; isRecord: boolean }> {
  const previous = await personalBest(id);
  const isRecord = run > previous;

  if (!usingRedis) {
    mem.runs += 1;
    mem.flips += run + 1;
    if (isRecord) {
      mem.board.set(id, run);
      mem.when.set(id, at);
    }
    return { best: Math.max(previous, run), isRecord };
  }

  await Promise.all([
    redis("INCR", RUNS),
    redis("INCRBY", FLIPS, run + 1),
    // GT keeps the highest score, so a weaker run landing at the same
    // moment cannot lower a record.
    isRecord ? redis("ZADD", BOARD, "GT", "CH", run, id) : Promise.resolve(),
    isRecord ? redis("HSET", WHEN, id, at) : Promise.resolve(),
  ]);
  return { best: Math.max(previous, run), isRecord };
}
