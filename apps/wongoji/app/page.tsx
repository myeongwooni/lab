import { countCells, readCells } from "@/lib/store";
import Wongoji from "./Wongoji";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [cells, total] = await Promise.all([readCells(), countCells()]);
  return <Wongoji initialCells={cells} initialTotal={total} />;
}
