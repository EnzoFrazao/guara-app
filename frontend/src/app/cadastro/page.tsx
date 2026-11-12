import { PageHeader } from "@/components/PageHeader";
import { CadastroView } from "./_components/CadastroView";

export default function CadastroPage() {
  return (
    <>
      <PageHeader
        titulo="Cadastro"
        descricao="Cadastre operários e dispositivos ESP32 e vincule cada pessoa ao transmissor que ela carrega."
      />
      <CadastroView />
    </>
  );
}
