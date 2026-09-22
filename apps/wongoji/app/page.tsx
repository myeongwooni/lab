import { sheet } from "@/lib/view";
import Wongoji from "./Wongoji";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { cells, total, durable } = await sheet();
  return <Wongoji initialCells={cells} initialTotal={total} durable={durable} />;
}
