import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import AiArtIcon from "@hugeicons/core-free-icons/AiArtIcon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { ago } from "@/features/widgets/format"
import { useLocale } from "@/hooks/useLocale"
import { formatCount } from "@/lib/intl-cache"
import { isolate } from "@/lib/bidi"
import { BellSection } from "./BellSection"

/**
 * KEŞFET bölümü (bildirim paneli): son Keşfet ziyaretinden beri gelen iş bildirimlerinin en yeni
 * üçü — sidebar rozetinin aynı sorgusu (`useFeedFresh`), ek istek yok. Yenisi yoksa bölüm hiç
 * çizilmez. Satır Keşfet'te o bildirimi açar (`?post=`); başlıktaki sayı yenilerin tamamı,
 * fazlası "Keşfet'te aç" ile. Okundu işareti Keşfet'in kendisi: buradan geçmek Keşfet'teki
 * okunmamışları değiştirmez.
 */
export function FeedNotices({ feed, onNavigate }) {
  const { t, locale } = useLocale()
  const items = feed.items ?? []
  if (!items.length) return null
  const count = feed.count ?? items.length

  return (
    <BellSection
      label={t("nav.feed")}
      count={formatCount(locale, count)}
      action={
        <Link to="/feed" onClick={onNavigate} className="bn-sec-link">
          {t("bell.feed.all")}
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} aria-hidden="true" />
        </Link>
      }
    >
      <ul className="bn-list">
        {items.map((x) => (
          <li key={x.id}>
            <Link
              to={`/feed?post=${encodeURIComponent(x.id)}`}
              onClick={onNavigate}
              className="bn-row"
            >
              <span className="bn-lead" data-kind="tile" aria-hidden="true">
                <HugeiconsIcon icon={AiArtIcon} strokeWidth={1.8} />
              </span>
              <span data-private="" className="bn-text">
                {x.subject && <span className="bn-name">{x.subject}</span>}
                <span className="bn-sub">
                  {[x.tag, isolate(x.author), ago(x.received ? new Date(x.received) : null, locale)]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              <span className="bn-dot" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </BellSection>
  )
}
