import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/account/reset-password-form";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = { title: "Redefinir senha", robots: noIndexRobots };

export default function ResetPasswordPage() {
  return <main className="flex min-h-[78vh] items-center justify-center px-4 py-20"><ResetPasswordForm /></main>;
}
