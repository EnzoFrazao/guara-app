import { redirect } from "next/navigation";

// O link publicado (e o QR code da apresentação) abre direto no mapa ao vivo.
export default function Inicio() {
  redirect("/mapa");
}
