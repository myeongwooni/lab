/** One break in every 200 flips. At 1-in-2 the chain dies at ~2 and the
 *  game never starts; 1-in-200 lets chains grow into the hundreds so that
 *  breaking one is an actual event. */
export const BREAK_ODDS = 200;
export const COOLDOWN_SEC = 30;

export type Break = { len: number; n: string; t: number };

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const usingRedis = Boolean(REST_URL && REST_TOKEN);

const CHAIN = "coin:chain";
const RECORD = "coin:record";
const FLIPS = "coin:flips";
const BREAKS = "coin:breaks";
const HALL = "coin:hall";
const RECENT = "coin:recent";
const cd = (id: string) => `coin:cd:${id}`;
const ipCd = (hash: string) => `coin:ipcd:${hash}`;

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
  chain: 0,
  record: 0,
  flips: 0,
  breaks: 0,
  hall: [] as Break[],
  recent: [] as Break[],
  keys: new Map<string, number>(),
};

function memTtl(key: string): number {
  const until = mem.keys.get(key);
  if (!until) return -2;
  const left = Math.ceil((until - Date.now()) / 1000);
  if (left <= 0) {
    mem.keys.delete(key);
    return -2;
  }
  return left;
}

export type Snapshot = {
  chain: number;
  record: number;
  flips: number;
  breaks: number;
  hall: Break[];
  recent: Break[];
};

export async function snapshot(): Promise<Snapshot> {
  if (!usingRedis) {
    return {
      chain: mem.chain,
      record: mem.record,
      flips: mem.flips,
      breaks: mem.breaks,
      hall: [...mem.hall].sort((a, b) => b.len - a.len).slice(0, 10),
      recent: mem.recent.slice(0, 10),
    };
  }
  const [chain, record, flips, breaks, hall, recent] = await Promise.all([
    redis<string | null>("GET", CHAIN),
    redis<string | null>("GET", RECORD),
    redis<string | null>("GET", FLIPS),
    redis<string | null>("GET", BREAKS),
    redis<string[]>("ZREVRANGE", HALL, 0, 9, "WITHSCORES"),
    redis<string[]>("LRANGE", RECENT, 0, 9),
  ]);
  return {
    chain: Number(chain ?? 0),
    record: Number(record ?? 0),
    flips: Number(flips ?? 0),
    breaks: Number(breaks ?? 0),
    hall: parseHall(hall),
    recent: recent.map((s) => JSON.parse(s) as Break),
  };
}

/** ZREVRANGE ... WITHSCORES comes back flat: member, score, member, score. */
function parseHall(flat: string[]): Break[] {
  const out: Break[] = [];
  for (let i = 0; i < flat.length; i += 2) {
    const [t, ...rest] = flat[i].split("|");
    out.push({ len: Number(flat[i + 1]), n: rest.join("|"), t: Number(t) });
  }
  return out;
}

export async function cooldownLeft(id: string): Promise<number> {
  const key = cd(id);
  if (!usingRedis) return Math.max(0, memTtl(key));
  const ttl = await redis<number>("TTL", key);
  return ttl > 0 ? ttl : 0;
}

/** Take the flip slot for this visitor. False means still cooling down. */
export async function startCooldown(id: string, seconds: number): Promise<boolean> {
  const key = cd(id);
  if (!usingRedis) {
    if (memTtl(key) > 0) return false;
    mem.keys.set(key, Date.now() + seconds * 1000);
    return true;
  }
  return (await redis<string | null>("SET", key, "1", "NX", "EX", seconds)) === "OK";
}

/** Coarse per-network throttle, shorter than the per-visitor one so that
 *  shared addresses are not locked out by a single neighbour. */
export async function networkAllows(hash: string): Promise<boolean> {
  const key = ipCd(hash);
  if (!usingRedis) {
    if (memTtl(key) > 0) return false;
    mem.keys.set(key, Date.now() + 2000);
    return true;
  }
  return (await redis<string | null>("SET", key, "1", "NX", "EX", 2)) === "OK";
}

export async function countFlip(): Promise<void> {
  if (!usingRedis) {
    mem.flips += 1;
    return;
  }
  await redis("INCR", FLIPS);
}

/** Extend the chain. INCR is atomic, so simultaneous flips each get their
 *  own link rather than overwriting one another. */
export async function extendChain(): Promise<number> {
  if (!usingRedis) {
    mem.chain += 1;
    mem.record = Math.max(mem.record, mem.chain);
    return mem.chain;
  }
  const chain = await redis<number>("INCR", CHAIN);
  const record = Number((await redis<string | null>("GET", RECORD)) ?? 0);
  if (chain > record) await redis("SET", RECORD, chain);
  return chain;
}

/** Cut the chain and return the length it stood at. GETSET is atomic, so
 *  two simultaneous tails cannot both claim the same break — the loser
 *  reads 0 and records nothing. */
export async function cutChain(): Promise<number> {
  if (!usingRedis) {
    const was = mem.chain;
    mem.chain = 0;
    return was;
  }
  return Number((await redis<string | null>("GETSET", CHAIN, "0")) ?? 0);
}

export async function recordBreak(entry: Break): Promise<void> {
  if (!usingRedis) {
    mem.hall.push(entry);
    mem.recent.unshift(entry);
    mem.recent = mem.recent.slice(0, 20);
    mem.breaks += 1;
    return;
  }
  await Promise.all([
    redis("ZADD", HALL, entry.len, `${entry.t}|${entry.n}`),
    redis("LPUSH", RECENT, JSON.stringify(entry)),
    redis("INCR", BREAKS),
  ]);
  await redis("LTRIM", RECENT, 0, 19);
}
