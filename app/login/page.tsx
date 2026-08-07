import type { Metadata } from "next";

import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Login",
  robots: noIndexRobots,
  alternates: { canonical: "/login" },
};

export default function Login() {
  return (
    <main>
      <h1>Login</h1>

      <p>Área de autenticação do Nexion Tools.</p>
    </main>
  );
}
