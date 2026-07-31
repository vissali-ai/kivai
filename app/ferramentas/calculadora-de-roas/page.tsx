import CalculadoraDeRoasClient from "./calculadora-de-roas-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("calculadora-de-roas");

export default function CalculadoraDeRoasPage() {
  return <CalculadoraDeRoasClient />;
}
