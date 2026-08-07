import type { Metadata } from "next";

import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Painel administrativo",
  robots: noIndexRobots,
  alternates: { canonical: "/admin" },
};

export default function Admin() {
  return (
    <main>
      <h1>Painel Administrativo</h1>

      <p>Área exclusiva do administrador.</p>
    </main>
  );
}
