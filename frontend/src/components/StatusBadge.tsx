import { COR_STATUS, ROTULO_STATUS } from "@/lib/rotulos";
import type { StatusTrabalho } from "@/lib/tipos";

export function StatusBadge({ status }: { status: StatusTrabalho }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COR_STATUS[status]}`}>
      {ROTULO_STATUS[status]}
    </span>
  );
}
