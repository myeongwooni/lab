import { secondsUntilKstMidnight } from "./day";

export type Cell = {
  /** The character itself. A single grapheme, or " " for a blank square. */
  c: string;
  /** Short public id of the writer. */
  a: string;
  /** Nickname shown for the writer, frozen at write time. */
  n: string;
  /** Epoch ms. */
  t: number;
};

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const usingRedis = Boolean(REST_URL && REST_TOKEN);

const CELLS_KEY = "wongoji:cells";
const turnKey = (id: string, day: string) => `wongoji:turn:${day}:${id}`;
const ipKey = (hash: string, day: string) => `wongoji:ip:${day}:${hash}`;

/** Soft backstop so one network cannot flood the sheet. Korean mobile
 *  carriers put many people behind one address, so this is deliberately
 *  loose — the per-visitor turn is the real limit. */
const IP_DAILY_MAX = 8;

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

const memCells: string[] = [];
const memKeys = new Map<string, { value: number; expiresAt: number }>();

function memGet(key: string) {
  const hit = memKeys.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    memKeys.delete(key);
    return null;
  }
  return hit;
}

export async function readCells(limit = 4000): Promise<Cell[]> {
  const raw = usingRedis
    ? await redis<string[]>("LRANGE", CELLS_KEY, -limit, -1)
    : memCells.slice(-limit);
  return raw.map((s) => JSON.parse(s) as Cell);
}

export async function countCells(): Promise<number> {
  return usingRedis ? await redis<number>("LLEN", CELLS_KEY) : memCells.length;
}

export async function appendCell(cell: Cell): Promise<number> {
  const payload = JSON.stringify(cell);
  if (!usingRedis) return memCells.push(payload);
  return await redis<number>("RPUSH", CELLS_KEY, payload);
}

/** Take today's turn for this visitor, atomically. Returns false when it
 *  was already taken — SET NX is what makes the daily limit race-free. */
export async function claimTurn(id: string, day: string): Promise<boolean> {
  const ttl = secondsUntilKstMidnight();
  const key = turnKey(id, day);
  if (!usingRedis) {
    if (memGet(key)) return false;
    memKeys.set(key, { value: 1, expiresAt: Date.now() + ttl * 1000 });
    return true;
  }
  const res = await redis<string | null>("SET", key, "1", "NX", "EX", ttl);
  return res === "OK";
}

export async function turnTaken(id: string, day: string): Promise<boolean> {
  const key = turnKey(id, day);
  if (!usingRedis) return Boolean(memGet(key));
  return (await redis<string | null>("GET", key)) !== null;
}

/** Release a turn claimed just before a write that then failed. */
export async function releaseTurn(id: string, day: string): Promise<void> {
  const key = turnKey(id, day);
  if (!usingRedis) {
    memKeys.delete(key);
    return;
  }
  await redis("DEL", key);
}

export async function underIpLimit(hash: string, day: string): Promise<boolean> {
  const ttl = secondsUntilKstMidnight();
  const key = ipKey(hash, day);
  if (!usingRedis) {
    const hit = memGet(key);
    const next = (hit?.value ?? 0) + 1;
    memKeys.set(key, {
      value: next,
      expiresAt: hit?.expiresAt ?? Date.now() + ttl * 1000,
    });
    return next <= IP_DAILY_MAX;
  }
  const count = await redis<number>("INCR", key);
  if (count === 1) await redis("EXPIRE", key, ttl);
  return count <= IP_DAILY_MAX;
}
