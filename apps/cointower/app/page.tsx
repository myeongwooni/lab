import { NAME_MAX } from "@/lib/identity";
import { viewFor } from "@/lib/view";
import CoinTower from "./CoinTower";

export const dynamic = "force-dynamic";

export default async function Page() {
  return <CoinTower initial={await viewFor(null)} nameMax={NAME_MAX} />;
}
