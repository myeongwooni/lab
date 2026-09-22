import { BREAK_ODDS, COOLDOWN_SEC, snapshot } from "@/lib/store";
import CoinChain from "./CoinChain";

export const dynamic = "force-dynamic";

export default async function Page() {
  return (
    <CoinChain
      initial={await snapshot()}
      odds={BREAK_ODDS}
      cooldownSec={COOLDOWN_SEC}
    />
  );
}
