import { NextResponse } from "next/server";

export function apiError(error: unknown, fallback = "Não foi possível concluir a operação.") {
  const message = error instanceof Error ? error.message : fallback;
  const status = message === "Não autorizado." ? 401 : 400;
  return NextResponse.json({ error: message }, { status });
}
