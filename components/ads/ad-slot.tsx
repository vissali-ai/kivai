type AdSlotVariant = "banner" | "rectangle" | "sidebar";

type AdSlotProps = {
  variant?: AdSlotVariant;
  className?: string;
};

const variantStyles: Record<AdSlotVariant, string> = {
  banner: "min-h-[90px] w-full",
  rectangle: "min-h-[250px] w-full max-w-[336px]",
  sidebar: "min-h-[600px] w-full max-w-[300px]",
};

export function AdSlot({
  variant = "banner",
  className = "",
}: AdSlotProps) {
  return (
    <aside
      aria-label="Publicidade"
      className={[
        "relative flex items-center justify-center overflow-hidden rounded-2xl",
        "border border-white/10 bg-white/[0.02]",
        variantStyles[variant],
        className,
      ].join(" ")}
    >
      <div className="flex flex-col items-center justify-center px-4 py-5 text-center">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/60">
          Publicidade
        </span>

        <div className="mt-2 text-xs text-muted-foreground/40">
          Espaço reservado
        </div>
      </div>
    </aside>
  );
}