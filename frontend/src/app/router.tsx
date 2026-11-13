import { Navigate, createBrowserRouter } from "react-router";
import CadastroPage from "./cadastro/page";
import DashboardPage from "./dashboard/page";
import HistoricoPage from "./historico/page";
import MapaPage from "./mapa/page";
import { Shell } from "./Shell";

// As quatro telas, uma pasta por pessoa (ver README do front). `/` abre o mapa: é o que o QR code
// da apresentação mostra.
export const roteador = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: "/", element: <Navigate to="/mapa" replace /> },
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/mapa", element: <MapaPage /> },
      { path: "/historico", element: <HistoricoPage /> },
      { path: "/cadastro", element: <CadastroPage /> },
    ],
  },
]);
