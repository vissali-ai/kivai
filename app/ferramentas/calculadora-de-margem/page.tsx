import CalculadoraDeMargemClient from "./calculadora-de-margem-client";
import { getToolMetadata } from "@/lib/seo";

export const metadata = getToolMetadata("calculadora-de-margem");

export default function CalculadoraDeMargemPage() {
  return <CalculadoraDeMargemClient />;
}
