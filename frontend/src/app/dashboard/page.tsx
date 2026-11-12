import { PageHeader } from "@/components/PageHeader";
import { DashboardView } from "./_components/DashboardView";

export default function DashboardPage() {
  return (
    <>
      <PageHeader titulo="Dashboard de monitoramento" descricao="Visão geral do turno: quem está em campo, em que status, e o que precisa de atenção." />
      <DashboardView />
    </>
  );
}
