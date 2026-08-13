import type { Metadata } from "next";

import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Cadastro indisponível",
  robots: noIndexRobots,
  alternates: { canonical: "/cadastro" },
};

export default function Cadastro() {
  return (
    <main>
      <h1>Cadastro</h1>

      <p>Crie sua conta no Kivai.</p>
    </main>
  );
}
