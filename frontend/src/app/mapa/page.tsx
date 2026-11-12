import { PageHeader } from "@/components/PageHeader";
import { MapaView } from "./_components/MapaView";

export default function MapaPage() {
  return (
    <>
      <PageHeader titulo="Mapa ao vivo" descricao="Posição atual de cada pessoa no pátio, atualizada a cada poucos segundos." />
      <MapaView />
    </>
  );
}
