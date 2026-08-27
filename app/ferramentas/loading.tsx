export default function FerramentasLoading() {
  return (
    <main
      className="min-h-screen bg-background pb-16 pt-24 text-foreground"
      aria-busy="true"
      aria-live="polite"
    >
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="mx-auto mt-5 h-10 w-full max-w-xl animate-pulse rounded bg-muted" />
          <div className="mx-auto mt-4 h-5 w-full max-w-2xl animate-pulse rounded bg-muted/70" />
        </div>

        <div className="mx-auto mt-10 max-w-4xl rounded-xl border border-border bg-background p-6 sm:p-8">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-4 h-32 w-full animate-pulse rounded bg-muted/60" />
          <div className="mt-5 flex gap-3">
            <div className="h-10 w-32 animate-pulse rounded bg-muted" />
            <div className="h-10 w-28 animate-pulse rounded bg-muted/70" />
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Carregando ferramenta...
        </p>
      </section>
    </main>
  );
}
