import { board, chosenNames, durable, personalBest } from "./store";
import { nicknameFor } from "./identity";

/** The payload every route returns: the board with names already resolved,
 *  plus whatever this visitor needs to know about themselves. Names resolve
 *  at read time, so renaming yourself updates rows you set long ago. */
export async function viewFor(me: string | null) {
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
