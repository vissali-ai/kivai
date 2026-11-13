import type { Metadata } from "next";
import { AccountWorkspaceNav } from "@/components/account/account-workspace-nav";
import { SavedProjects } from "@/components/account/saved-projects";
import { VideoStudyLibrary } from "@/components/account/video-study-library";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = { title: "Meus Projetos", robots: noIndexRobots };

export default function AccountProjectsPage() {
  return (
    <main className="mx-auto min-h-[78vh] w-full max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
      <div className="grid min-w-0 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <AccountWorkspaceNav />
        <div className="min-w-0">
          <div className="mb-2">
            <h1 className="text-3xl font-semibold tracking-tight">Biblioteca de Projetos</h1>
            <p className="mt-2 text-sm text-muted-foreground">Encontre seus trabalhos salvos, filtre por cliente e acesse as ferramentas.</p>
          </div>
          <VideoStudyLibrary previewGuest={process.env.VERCEL_ENV === "preview"} />
          <SavedProjects />
        </div>
      </div>
    </main>
  );
}
