import { useId, useState } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { Highlight } from "@/features/help/Highlight"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { pick } from "./entryText"
import { KindLabel } from "./KindBadge"

/**
 * Tek kayıt: tür · başlık · brief · maddeler · "Göz at". Kartsız, ayraçlı satır (ferah sayfa).
 *
 * `id` ÇAPADIR: kaş, başlık ve hedefsiz kayıtta "Yeniliği keşfet" `/whats-new#<id>`ye gider; `id`
 * olmazsa hash hiçbir şeye denk gelmez. `scroll-mt`: kaydırma hedefi üst paylı çubuğun altında
 * kalmasın. Hedef halkası hash değişene kadar durur — kaybolan bir vurgu geç bakan gözü ıskalar.
 *
 * Maddeler geniş kapta hep açık; dar kapta (telefon) "Ayrıntılar" düğmesinin arkasında: en az ile
 * en çok. Arama (maddeleri de tarar) ve hedef kayıt açık gelir — eşleşme gizli kalmasın.
 */
export function EntryRow({ entry, unread, targeted, terms }) {
  const { t, locale } = useLocale()
  const listId = useId()
  const [open, setOpen] = useState(false)
  const points = entry.points ?? []
  // Arama ya da hedef maddeleri açık TUTAR: düğme o zaman gereksiz (kapatılamaz) ve çizilmez.
  const forced = targeted || terms.length > 0
  const expanded = open || forced
  const showToggle = points.length > 0 && !forced
  const title = pick(entry.title, locale)
  return (
    <article
      id={entry.id}
      aria-labelledby={`${listId}-t`}
      className={cn(
        "scroll-mt-24 -mx-3 -my-1.5 rounded-xl px-3 py-3 transition-colors",
        targeted && "bg-brand/[0.06] ring-1 ring-brand/25",
      )}
    >
      <div className="flex items-center gap-2">
        {unread ? (
          <>
            <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-brand" />
            <span className="sr-only">{t("whatsNew.unread")}</span>
          </>
        ) : null}
        <KindLabel kind={entry.kind} />
      </div>
      <h3
        id={`${listId}-t`}
        className="mt-1.5 text-base font-semibold leading-snug tracking-tight [overflow-wrap:anywhere]"
      >
        <Highlight text={title} terms={terms} />
      </h3>
      {/* Brief TEK BAŞINA anlamlı: giriş penceresinde yalnız bu çiziliyor, maddeler orada yok. */}
      <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
        <Highlight text={pick(entry.body, locale)} terms={terms} />
      </p>
      {points.length > 0 && (
        <ul
          id={listId}
          className={cn(
            "mt-2.5 max-w-[62ch] flex-col gap-1.5",
            expanded ? "flex" : "hidden @2xl/whatsnew:flex",
          )}
        >
          {points.map((pt, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-foreground/80">
              {/* Madde imi bir nokta, glif değil: liste kısa, ikon her satırda tekrar eden sıfır-bit bir işaret olurdu. */}
              <span
                aria-hidden="true"
                className="mt-[0.5625rem] size-1 shrink-0 rounded-full bg-foreground/40"
              />
              <span className="min-w-0">
                <Highlight text={pick(pt, locale)} terms={terms} />
              </span>
            </li>
          ))}
        </ul>
      )}
      {/* Eylem satırı: telefonda "Ayrıntılar" solda, "Göz at" başparmak tarafında (sonda); geniş kapta yalnız bağlantı, başta. */}
      {(showToggle || entry.to) && (
        <div
          className={cn(
            "mt-1 flex flex-wrap items-center justify-between gap-x-4",
            !entry.to && "@2xl/whatsnew:hidden",
          )}
        >
          {showToggle && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={expanded}
              aria-controls={listId}
              className={cn(
                "inline-flex min-h-8 items-center gap-1 rounded-md text-[0.8125rem] font-medium text-foreground/70 transition-colors hover:text-foreground @2xl/whatsnew:hidden",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11",
              )}
            >
              {t("whatsNew.details")}
              <span className="tabular-nums">{points.length}</span>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                aria-hidden="true"
                className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
                strokeWidth={2}
              />
            </button>
          )}
          {entry.to && (
            <Link
              to={entry.to}
              aria-label={`${t("whatsNew.glance")}: ${title}`}
              className={cn(
                "group/go ms-auto inline-flex min-h-8 items-center gap-1 rounded-md text-sm font-medium text-brand-ink @2xl/whatsnew:ms-0",
                "underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11",
              )}
            >
              {t("whatsNew.glance")}
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                aria-hidden="true"
                className="size-4 transition-transform group-hover/go:translate-x-0.5 rtl:rotate-180 rtl:group-hover/go:-translate-x-0.5"
                strokeWidth={2}
              />
            </Link>
          )}
        </div>
      )}
    </article>
  )
}
