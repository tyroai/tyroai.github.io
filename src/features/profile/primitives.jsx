import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"

/**
 * Orb Stüdyosu'nun kart kabuğu ve seçim kutusu. Profilin geri kalanı `ProfilePage/rows.jsx`teki
 * ayar satırlarını kullanır; bunlar yalnız stüdyonun içinde yaşıyor.
 */

export function ProfileCard({ className, children }) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card", className)}>
      {children}
    </section>
  )
}

/** Kartın başlığı: ikon karesi + ad + altyazı, sağda isteğe bağlı eylem. */
export function CardHead({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-start gap-3 border-b border-border/60 px-5 py-4 sm:gap-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft/60 text-brand-on-soft">
        <HugeiconsIcon icon={icon} className="size-[1.125rem]" strokeWidth={1.7} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-[0.9375rem] font-semibold leading-tight tracking-tight">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

/**
 * Seçilebilir kutu (stüdyonun seçenekleri). Seçili mürekkep `text-brand-on-soft`: marka
 * zemininde kontrast paletten palete düşer, bu token o iş için ayrılmış.
 */
export function Choice({ selected, onClick, children, className, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={ariaLabel}
      className={cn(
        "group flex min-h-11 items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-[0.8125rem] transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
        selected
          ? "border-brand/50 bg-brand-soft/40 font-medium text-brand-on-soft shadow-sm"
          : "border-border bg-card text-foreground/80 hover:border-brand/30 hover:bg-foreground/[0.03]",
        className,
      )}
    >
      {children}
    </button>
  )
}
