import CalculadoraDeMarkupClient from "./calculadora-de-markup-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("calculadora-de-markup");

export default function CalculadoraDeMarkupPage() {
  return <CalculadoraDeMarkupClient />;
}
