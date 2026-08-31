import { getToolMetadataAsync } from "@/lib/seo";
import ConsultaDeCnpjClient from "./consulta-de-cnpj-client";

export async function generateMetadata() {
  return getToolMetadataAsync("consulta-de-cnpj");
}

export default function ConsultaDeCnpjPage() {
  return <ConsultaDeCnpjClient />;
}
