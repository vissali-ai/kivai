import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Planos Kivai",
  robots: { index: false, follow: false },
};

/**
 * A antiga rota de checkout direto não pode iniciar pagamentos legados.
 * As contratações são feitas exclusivamente a partir de /planos.
 */
export default function CheckoutPage() {
  redirect("/planos");
}
