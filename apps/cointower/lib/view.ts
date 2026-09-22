import { board, chosenNames, durable, personalBest } from "./store";
import { nicknameFor } from "./identity";

/** The payload every route returns: the board with names already resolved,
 *  plus whatever this visitor needs to know about themselves. Names resolve
 *  at read time, so renaming yourself updates rows you set long ago. */
export async function viewFor(me: string | null) {
  try {
    return await readView(me);
  } catch {
    // Upstash throttles once the plan's command budget runs out, and a
    // throw here would take the whole page down. Serve an empty board
    // carrying the same not-durable warning instead: the records are
    // still in Redis and come back when it answers again.
    return {
      top: [],
      runs: 0,
      flips: 0,
      durable: false,
      me,
      nickname: me ? nicknameFor(me) : null,
      named: false,
      best: 0,
    };
  }
}

async function readView(me: string | null) {
  const [state, best] = await Promise.all([
    board(),
    me ? personalBest(me) : Promise.resolve(0),
  ]);

  const ids = state.top.map((e) => e.id);
  if (me && !ids.includes(me)) ids.push(me);
  const chosen = await chosenNames(ids);

  return {
    ...state,
    durable,
    top: state.top.map((e) => ({
      ...e,
      name: chosen[e.id] ?? nicknameFor(e.id),
    })),
    me,
    nickname: me ? (chosen[me] ?? nicknameFor(me)) : null,
    named: me ? Boolean(chosen[me]) : false,
    best,
  };
}
