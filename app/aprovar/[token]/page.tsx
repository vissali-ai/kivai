import type { Metadata } from "next";
import { connection } from "next/server";
import { ApprovalReview } from "@/components/agency/approval-review";
import { getApprovalByToken, approvalActive } from "@/lib/agency/approvals";

export const metadata: Metadata = {
  title: "Revisar publicação | Kivai",
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};
export default async function ApprovalPage({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  const approval = await getApprovalByToken(token);
  if (!approval) return <main className="mx-auto min-h-[75vh] max-w-xl px-4 pt-32"><h1 className="text-2xl font-semibold">Link de aprovação indisponível</h1><p className="mt-3 text-muted-foreground">Peça à agência um novo link para revisar o conteúdo.</p></main>;
  return <ApprovalReview approval={approval} token={token} active={approvalActive(approval)} />;
}
