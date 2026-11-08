import { CardLevel } from "../common/cardLevel"

/**
 * Genel Bakış bölümü: küçük büyük harfli başlık ve sağa uzanan ince çizgi, altında kartlar.
 * Bölümler arasında geniş boşluk; kart başlıkları bölümün altında h3.
 */
export function OverviewSection({ id, title, children }) {
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-4 pt-4">
      <div className="flex items-center gap-3">
        <h2
          id={id}
          className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/65"
        >
          {title}
        </h2>
        <span aria-hidden="true" className="h-px flex-1 bg-border/80" />
      </div>
      <CardLevel.Provider value={3}>
        <div className="grid min-w-0 gap-4 @[60rem]/rm:grid-cols-2">{children}</div>
      </CardLevel.Provider>
    </section>
  )
}
