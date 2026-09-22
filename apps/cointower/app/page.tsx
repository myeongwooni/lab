import { board } from "@/lib/store";
import { nicknameFor } from "@/lib/identity";
import CoinTower from "./CoinTower";

export const dynamic = "force-dynamic";

export default async function Page() {
  const state = await board();
  return (
    <CoinTower
      initial={state}
      initialTop={state.top.map((e) => ({ ...e, name: nicknameFor(e.id) }))}
    />
  );
}
