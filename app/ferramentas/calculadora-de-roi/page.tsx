import CalculadoraDeRoiClient from "./calculadora-de-roi-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("calculadora-de-roi");

export default function CalculadoraDeRoiPage() {
  return <CalculadoraDeRoiClient />;
}
