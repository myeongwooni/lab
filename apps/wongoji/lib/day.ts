const KST_OFFSET_MS = 9 * 3600_000;
const DAY_MS = 86_400_000;

export function kstDayKey(ms: number = Date.now()): string {
  return new Date(ms + KST_OFFSET_MS).toISOString().slice(0, 10);
}

export function secondsUntilKstMidnight(ms: number = Date.now()): number {
  return Math.ceil((DAY_MS - ((ms + KST_OFFSET_MS) % DAY_MS)) / 1000);
}
