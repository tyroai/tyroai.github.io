import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ChartUpIcon from "@hugeicons/core-free-icons/ChartUpIcon"
import { useLocale } from "@/hooks/useLocale"
import { FEED_SOURCES } from "@/lib/feedPolicy"
import { cn } from "@/lib/utils"
import { RailSection } from "../FeedRail"
import { PERSONAL } from "../feedSections"
import { ChannelRows } from "./ChannelRows"
import { MARK_LOOK } from "./markLook"
import { PinnedRows } from "./PinnedRows"
import { pinnedMail, railKey } from "./railModel"
import { SenderRows } from "./SenderRows"
import { useSenderGroups } from "./useSenderGroups"

/** Ray bölümü: küçük büyük harfli başlık (isteğe bağlı işaret rozeti ve sayı) + içerik. */
function Block({ title, look, meta, children }) {
  const { locale } = useLocale()
  return (
    <section className="mt-3 border-t border-border/60 pt-3 first:mt-0 first:border-0 first:pt-0">
      {title && (
        <h3
          lang={locale}
          className="mb-1 flex items-center gap-1.5 px-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground"
        >
          {look && (
            <span className={cn("grid size-5 shrink-0 place-items-center rounded-md", look.tone)}>
              <HugeiconsIcon icon={look.icon} className="size-3" strokeWidth={2.2} />
            </span>
          )}
          <span className="min-w-0 flex-1 truncate">{title}</span>
          {meta != null && <span className="shrink-0 tabular-nums">{meta}</span>}
        </h3>
      )}
      {children}
    </section>
  )
}

/**
 * Sağ ray: X'in "gündem" sütunu gibi aşağı uzayan tek Trendler kartı. Bölümler (Özelleştir'den
 * açılıp kapanır): Sana özel ve gönderene göre alt grupları · Sabitlenenler · Kanallar.
 * Her satır tıklanır: gönderen ve kanal akışı süzer, sabit posta açılır, "#SanaÖzel" bölüme götürür.
 * `bare`: kartsız (rayın olmadığı kapta Trendler penceresinin içi, `mobile/TrendsSheet`).
 *
 * Gruplar ve sayılar akıştan türer (uydurma yok); kanal süzgeci açıkken kanal sayıları boştur
 * (sunucudan yalnız o kanal gelir), gönderen grupları son bilinen hâlinde kalır.
 */
export function FeedTrends({
  counts,
  tag,
  onTagChange,
  personal,
  personalPosts,
  marked,
  activeFrom,
  onSelectSender,
  photoFor,
  onOpen,
  hidden,
  bare = false,
}) {
  const { t } = useLocale()
  const live = !tag || tag === PERSONAL
  const groups = useSenderGroups(personalPosts, live)
  const pinned = useMemo(() => pinnedMail(marked), [marked])
  const channels = FEED_SOURCES.map((s) => ({ ...s, count: counts[s.tag] ?? 0 })).sort(
    (a, b) => b.count - a.count,
  )
  const personalTotal = groups.reduce((sum, g) => sum + g.count, 0)
  const total = channels.reduce((sum, s) => sum + s.count, 0) + personalTotal

  const showSenders = !hidden.has(railKey("senders")) && groups.length > 0
  const showPinned = !hidden.has(railKey("pinned")) && pinned.length > 0
  const showChannels = !hidden.has(railKey("channels"))
  // Tek başına kanallar kalınca ayrıca başlık yok: kartın başlığı zaten "Trendler".
  const channelsTitle = showSenders || showPinned ? t("feed.rail.section.channels") : undefined
  if (!showSenders && !showPinned && !showChannels) return null

  const body = (
    <>
      {showSenders && (
        <Block>
          <SenderRows
            groups={groups}
            total={personalTotal}
            share={total > 0 ? Math.round((personalTotal / total) * 100) : 0}
            onOpenTab={personal.onSelect}
            active={activeFrom}
            onSelect={onSelectSender}
            onClear={() => onTagChange(null)}
            photoFor={photoFor}
          />
        </Block>
      )}
      {showPinned && (
        <Block title={t("feed.rail.section.pinned")} look={MARK_LOOK.pinned} meta={pinned.length}>
          <PinnedRows items={pinned} onOpen={onOpen} photoFor={photoFor} />
        </Block>
      )}
      {showChannels && (
        <Block title={channelsTitle}>
          <ChannelRows rows={channels} total={total} tag={tag} onTagChange={onTagChange} />
        </Block>
      )}
      {/* Süzgeç açıkken ÇIKIŞI söyleyen satır (etikete ya da göndericiye yeniden basmak da temizler). */}
      {tag && (
        <button
          type="button"
          onClick={() => onTagChange(null)}
          className="mt-2 w-full rounded-lg px-2.5 py-1 text-start text-[0.6875rem] font-medium text-brand transition hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:min-h-9"
        >
          {t("feed.showAll")}
        </button>
      )}
    </>
  )
  if (bare) return <div>{body}</div>
  return (
    <RailSection
      title={t("feed.discover")}
      icon={ChartUpIcon}
      meta={total > 0 ? total : null}
      accentTop
    >
      {body}
    </RailSection>
  )
}
