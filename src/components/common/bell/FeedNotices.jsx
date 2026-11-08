import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import AiArtIcon from "@hugeicons/core-free-icons/AiArtIcon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { ago } from "@/features/widgets/format"
import { useLocale } from "@/hooks/useLocale"
import { formatCount } from "@/lib/intl-cache"
import { isolate } from "@/lib/bidi"

const ROW =
  "flex items-start gap-3 px-4 py-2.5 text-start transition hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"

/**
 * KEŞFET sekmesi (bildirim çanı): son Keşfet ziyaretinden beri gelen iş bildirimlerinin en yeni
 * üçü — sidebar rozetinin aynı sorgusu (`useFeedFresh`), ek istek yok. Satır Keşfet'te o
 * bildirimi açar (`?post=`); fazlası ve tümü Keşfet'te. Okundu işareti Keşfet'in kendisi:
 * buradan geçmek Keşfet'teki okunmamışları değiştirmez.
 */
export function FeedNotices({ feed, onNavigate }) {
  const { t, locale } = useLocale()
  const items = feed.items ?? []
  const count = feed.count ?? items.length

  if (!items.length) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <span className="grid size-10 place-items-center rounded-2xl bg-muted/60 text-muted-foreground dark:bg-white/[0.06]">
          <HugeiconsIcon icon={AiArtIcon} className="size-5" strokeWidth={1.8} />
        </span>
        <p className="text-[0.8125rem] text-muted-foreground">{t("widgets.feed.none")}</p>
        <Link
          to="/feed"
          onClick={onNavigate}
          className="inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-[0.8125rem] font-medium text-brand transition hover:bg-brand/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11"
        >
          {t("bell.feed.all")}
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            className="size-4 rtl:rotate-180"
            strokeWidth={2}
          />
        </Link>
      </div>
    )
  }

  const more = Math.max(0, count - items.length)
  return (
    <div className="min-h-0 overflow-y-auto overscroll-contain py-2 [scrollbar-width:thin]">
      <p className="px-4 pb-1 text-[0.6875rem] text-muted-foreground">
        {t("widgets.feed.count", { n: formatCount(locale, count) })}
      </p>
      <ul>
        {items.map((x) => (
          <li key={x.id}>
            <Link
              to={`/feed?post=${encodeURIComponent(x.id)}`}
              onClick={onNavigate}
              className={ROW}
            >
              <span
                aria-hidden="true"
                className="mt-[0.4375rem] size-2 shrink-0 rounded-full bg-brand"
              />
              <span data-private="" className="min-w-0 flex-1">
                <span className="block truncate text-[0.8125rem] font-medium">{x.subject}</span>
                <span className="block truncate text-[0.6875rem] text-muted-foreground">
                  {[x.tag, isolate(x.author), ago(x.received ? new Date(x.received) : null, locale)]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        to="/feed"
        onClick={onNavigate}
        className="mx-2 mt-1 flex min-h-10 items-center justify-between gap-2 rounded-xl border-t border-border/60 px-2 text-[0.8125rem] font-medium text-brand transition hover:bg-brand/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11"
      >
        {more > 0 ? t("bell.feed.more", { n: more }) : t("bell.feed.all")}
        <HugeiconsIcon icon={ArrowRight01Icon} className="size-4 rtl:rotate-180" strokeWidth={2} />
      </Link>
    </div>
  )
}
