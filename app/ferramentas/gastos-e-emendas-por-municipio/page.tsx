import type { Metadata } from "next";
import { EmendasMunicipioClient } from "./municipio-client";
export const metadata: Metadata = {
 title: "Gastos e Emendas por Município | Kivai",
 description: "Encontre seu município pelo IBGE e acesse consultas oficiais de emendas parlamentares, pagamentos e favorecidos no Portal da Transparência.",
 robots: { index: false, follow: true },
};
export default function Page() { return <EmendasMunicipioClient/>; }
