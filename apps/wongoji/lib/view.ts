import { countCells, durable, readCells, type Cell } from "./store";

export type SheetView = {
  cells: Cell[];
  total: number;
  durable: boolean;
};

/** Upstash throttles once the plan's command budget runs out, and a throw
 *  here would take the whole page down. Serve an empty sheet carrying the
 *  same not-durable warning instead: what people wrote is still in Redis
 *  and comes back when it answers again. */
export async function sheet(): Promise<SheetView> {
  try {
    const [cells, total] = await Promise.all([readCells(), countCells()]);
    return { cells, total, durable };
  } catch {
    return { cells: [], total: 0, durable: false };
  }
}
