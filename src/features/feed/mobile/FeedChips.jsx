import { useEffect, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import UserStar01Icon from "@hugeicons/core-free-icons/UserStar01Icon"
import { useLocale } from "@/hooks/useLocale"
import { accentColor, FEED_SOURCES } from "@/lib/feedPolicy"
import { cn } from "@/lib/utils"
import { PERSONAL } from "../feedSections"
import { hashtag } from "../feedText"
import "./feedMobile.css"

const CHIP =
  "relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[0.8125rem] font-semibold tracking-[-0.01em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-9 pointer-coarse:after:absolute pointer-coarse:after:-inset-y-1 pointer-coarse:after:inset-x-0"
const CHIP_ON = "border-transparent bg-brand-soft text-brand-on-soft"

/**
 * Dar ekranın kanal filtresi (geniş ekranda sağ raydaki Trendler'in yerine): "Tümü", "#SanaÖzel"
 * (işaretli kişisel postalar; Popüler'de varsa) + kanallar, Trendler'in sırasıyla (çoktan aza)
 * ve sayılarıyla. Şerit yatay kayar, sağ ucu solar. Seçili
 * kanal "Tümü"nün hemen yanına gelir ve şerit başa döner: solan uçta kalmaz. Seçili kanala
 * yeniden basmak filtreyi kaldırır. `from`: Trendler'den seçilen gönderen ({ address, name }).
 */
export function FeedChips({ counts, tag, onTagChange, from, onClearFrom, className }) {
  const { t, locale } = useLocale()
  const ref = useRef(null)
  const ranked = FEED_SOURCES.map((s) => ({ ...s, count: counts[s.tag] ?? 0 })).sort(
    (a, b) => (b.tag === tag) - (a.tag === tag) || b.count - a.count,
  )

  useEffect(() => {
    if (ref.current) ref.current.scrollLeft = 0
  }, [tag, from?.address])

  return (
    <div
      ref={ref}
      role="group"
      aria-label={t("feed.discover")}
      className={cn("feed-strip flex min-w-0 items-center gap-1.5 overflow-x-auto py-1", className)}
    >
      <Chip active={!tag} onClick={() => onTagChange(null)}>
        {t("feed.all")}
      </Chip>
      {/* Trendler'den seçilen gönderen "#SanaÖzel"in yerinde durur (solan uçta kaybolmasın);
          basınca yalnız gönderen filtresi kalkar, "#SanaÖzel" geri gelir. */}
      {from ? (
        <button
          type="button"
          onClick={onClearFrom}
          aria-label={t("feed.from.clear", { name: from.name })}
          className={cn(CHIP, CHIP_ON)}
        >
          <HugeiconsIcon icon={UserStar01Icon} className="size-3.5 shrink-0" strokeWidth={2} />
          <span lang="tr" className="max-w-[10rem] truncate">
            {from.name}
          </span>
          <HugeiconsIcon
            icon={Cancel01Icon}
            className="size-3.5 shrink-0"
            strokeWidth={2.2}
            aria-hidden="true"
          />
        </button>
      ) : (
        (counts.personal > 0 || tag === PERSONAL) && (
          <Chip
            active={tag === PERSONAL}
            count={counts.personal ?? 0}
            onClick={() => onTagChange(tag === PERSONAL ? null : PERSONAL)}
          >
            <HugeiconsIcon icon={UserStar01Icon} className="size-3.5 shrink-0" strokeWidth={2} />
            <span lang={locale}>{hashtag(t("feed.section.important"), locale)}</span>
          </Chip>
        )
      )}
      {ranked.map((s) => (
        <Chip
          key={s.tag}
          active={tag === s.tag}
          count={s.count}
          onClick={() => onTagChange(tag === s.tag ? null : s.tag)}
        >
          <span
            aria-hidden="true"
            className="size-1.5 shrink-0 rounded-full"
            style={{ background: accentColor(s.accent) }}
          />
          <span lang={locale}>{hashtag(t(`feed.tag.${s.tag}`), locale)}</span>
        </Chip>
      ))}
    </div>
  )
}

function Chip({ active, count = 0, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        CHIP,
        active
          ? CHIP_ON
          : "border-border bg-card text-foreground/80 hover:bg-accent/60 hover:text-foreground",
      )}
    >
      {children}
      {count > 0 && (
        <span
          className={cn(
            "text-[0.6875rem] font-medium tabular-nums",
            active ? "text-brand-on-soft/80" : "text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}
