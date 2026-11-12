import { PageHeader } from "@/components/PageHeader";
import { HistoricoView } from "./_components/HistoricoView";

export default function HistoricoPage() {
  return (
    <>
      <PageHeader titulo="Histórico" descricao="Leituras de posição registradas, com filtros por nome, turno, função, status, trecho e dia." />
      <HistoricoView />
    </>
  );
}
