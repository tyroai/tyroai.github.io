import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import { BentoNotice } from "@/components/common/bento"
import { ErrorCause } from "@/components/common/ErrorCause"
import { useLocale } from "@/hooks/useLocale"
import { LANES, ROW_COLLAPSE, SHELF_COLLAPSE } from "@/features/feed/lib/forYouBoard"
import { cn } from "@/lib/utils"
import { MailRow, PinnedCard } from "./ForYouItems"
import { LANE_ICON } from "./look"

/**
 * SANA ÖZEL'İN LİSTESİ — Outlook'un sırasıyla üç şerit (satır biçimleri `ForYouItems`te):
 *
 *   SABİTLENMİŞ   RAF: kartlar (iki sütun) — başvuru malzemesi
 *   BAYRAKLI      sakin satırlar — yapılacak iş
 *   YÜKSEK ÖNEM   sakin satırlar (son 30 gün)
 *
 * ⚠️ Bir posta İLK uyduğu şeritte durur (`buildLanes`); başlıktaki "+n
 * yukarıda" bu şeridin işaretini taşıyıp üstte duranları sayıyor — kutucuğun
 * sayısıyla şeridin sayısı arasındaki fark böylece açıklanıyor.
 * ⚠️ Satıra basmak Akışım'ın penceresini açar (`?post=`) — ikinci okuyucu yok.
 * ⚠️ Kalabalık şerit katlanır (raf 4, satırlar 6) — ama süzgeç ya da arama
 * açıkken hepsi görünür: aranan şeyi katlamanın arkasına saklamak olmaz.
 */
function Toggle({ id, expanded, hidden, onToggle }) {
  const { t } = useLocale()
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={`foryou-lane-list-${id}`}
      onClick={onToggle}
      className="ml-3 mt-2 rounded-lg px-2 py-1.5 text-[0.75rem] font-medium text-muted-foreground transition hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:min-h-11"
    >
      {expanded ? t("feed.cel.showLess") : t("feed.cel.showMore", { count: hidden })}
    </button>
  )
}

function Lane({ lane, query, mark, now, photos, freshId, handoff, todoOpen, onOpen, onDone }) {
  const { t, locale } = useLocale()
  const [expanded, setExpanded] = useState(false)
  const shelf = lane.id === "pinned"
  const max = shelf ? SHELF_COLLAPSE : ROW_COLLAPSE
  const collapsible = !query && !mark && lane.items.length > max
  const shown = collapsible && !expanded ? lane.items.slice(0, max) : lane.items
  const tone = LANES.find((l) => l.id === lane.id)?.tone
  const props = (m) => ({
    key: m.id,
    item: m,
    photo: photos.get(m.address),
    now,
    fresh: freshId === m.id,
    handoff,
    todoOpen,
    onOpen,
    onDone: () => onDone(m.id),
  })
  return (
    <section aria-labelledby={`foryou-lane-${lane.id}`} className="min-w-0">
      <h3
        id={`foryou-lane-${lane.id}`}
        tabIndex={-1}
        lang={locale}
        className="flex flex-wrap items-center gap-x-2 gap-y-0.5 px-3 pb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground outline-none"
      >
        <HugeiconsIcon
          icon={LANE_ICON[lane.id]}
          className={cn("size-3.5", tone)}
          strokeWidth={2}
          aria-hidden="true"
        />
        <span>{t(`feed.important.${lane.id}`)}</span>
        <span className="font-medium tabular-nums">{lane.items.length}</span>
        {lane.id === "high" && (
          <span className="font-medium normal-case tracking-normal">
            · {t("feed.important.lane.window")}
          </span>
        )}
        {lane.above > 0 && (
          <span className="font-medium normal-case tracking-normal">
            · {t("feed.important.lane.above", { n: lane.above })}
          </span>
        )}
      </h3>
      {shelf ? (
        <ul
          id={`foryou-lane-list-${lane.id}`}
          className="grid grid-cols-1 gap-3 @[30rem]/foryou:grid-cols-2 @[30rem]/foryou:gap-4"
        >
          {shown.map((m) => {
            const { key, ...rest } = props(m)
            return <PinnedCard key={key} {...rest} />
          })}
        </ul>
      ) : (
        <ul id={`foryou-lane-list-${lane.id}`} className="ms-surface rounded-[1.5rem] p-1.5">
          {shown.map((m) => {
            const { key, ...rest } = props(m)
            return <MailRow key={key} {...rest} />
          })}
        </ul>
      )}
      {collapsible && (
        <Toggle
          id={lane.id}
          expanded={expanded}
          hidden={lane.items.length - max}
          onToggle={() => setExpanded((v) => !v)}
        />
      )}
    </section>
  )
}

export function ForYouList({
  state,
  lanes,
  listed,
  mark,
  query,
  now,
  photos,
  freshId,
  handoff,
  todoOpen,
  titleRef,
  onOpen,
  onDone,
  onClearMark,
  onClearQuery,
}) {
  const { t, locale } = useLocale()
  const missing = state.missing ?? []
  const list = (kinds) =>
    new Intl.ListFormat(locale, { type: "conjunction" }).format(
      kinds.map((k) => t(`feed.important.kind.${k}`)),
    )
  const markLane = LANES.find((l) => l.id === mark)
  // Yalnız gerçek durumlar: süzgeç çipi ve okunamayan kaynak. "Bir kısmı yüklendi" notu kalktı.
  const notices = Boolean(mark) || missing.length > 0 || Boolean(state.pinnedPartial)

  return (
    <>
      {/* Görünen başlık sayfanın tepesinde (sekmelerin üstünde, `FeedPage`); burada yalnız odak
          hedefi olarak gizli başlık. Sayı, açıklama, "TYRO ile önceliklendir" ve "Outlook'ta aç"
          kaldırıldı (ürün sahibi: sayfa sade). */}
      <h2 id="foryou-list-title" ref={titleRef} tabIndex={-1} className="sr-only">
        {t("feed.important.list.title")}
      </h2>

      {notices && (
        <div className="mb-5 flex flex-col items-start gap-2">
          {markLane && (
            <button
              type="button"
              onClick={onClearMark}
              aria-label={t("feed.important.filter.clear", { label: t(`feed.important.${mark}`) })}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-brand/30 bg-brand/[0.08] pl-2.5 pr-2 text-[0.75rem] font-medium text-foreground transition hover:bg-brand/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:min-h-11"
            >
              <HugeiconsIcon
                icon={LANE_ICON[mark]}
                className={cn("size-3.5", markLane.tone)}
                strokeWidth={2}
              />
              {t(`feed.important.${mark}`)}
              <HugeiconsIcon
                icon={Cancel01Icon}
                className="size-3.5 text-muted-foreground"
                strokeWidth={2}
              />
            </button>
          )}
          {missing.length > 0 && (
            <>
              <BentoNotice tone="warn" className="[&::first-letter]:uppercase">
                {t("feed.important.missing", { kinds: list(missing) })}
              </BentoNotice>
              <ErrorCause detail={state.detail} className="mt-0" />
            </>
          )}
          {state.pinnedPartial && (
            <BentoNotice tone="warn">{t("feed.important.pinnedPartial")}</BentoNotice>
          )}
        </div>
      )}

      {listed.length > 0 ? (
        <div className="space-y-7">
          {lanes.map((lane) => (
            <Lane
              key={lane.id}
              {...{ lane, query, mark, now, photos, freshId, handoff, todoOpen, onOpen, onDone }}
            />
          ))}
        </div>
      ) : query.trim() ? (
        <EmptyState
          icon={Search01Icon}
          title={t("feed.important.searchEmpty")}
          body={t("feed.important.searchScope")}
          action={t("feed.important.search.clear")}
          onAction={onClearQuery}
        />
      ) : mark ? (
        <EmptyState
          icon={LANE_ICON[mark]}
          title={t("feed.important.filter.empty")}
          action={t("feed.clearFilter")}
          onAction={onClearMark}
        />
      ) : null}
    </>
  )
}

function EmptyState({ icon, title, body, action, onAction }) {
  return (
    <div className="mt-6 rounded-[1.5rem] border border-dashed border-border px-6 py-12 text-center">
      <HugeiconsIcon
        icon={icon}
        className="mx-auto mb-3 size-8 text-muted-foreground/35"
        strokeWidth={1.5}
      />
      <p className="text-[0.9375rem] font-medium text-foreground/85">{title}</p>
      {body && (
        <p className="mx-auto mt-1.5 max-w-sm text-[0.8125rem] leading-relaxed text-muted-foreground">
          {body}
        </p>
      )}
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-full border border-border bg-card px-4 py-2 text-[0.8125rem] font-medium text-foreground/85 transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:min-h-11"
        >
          {action}
        </button>
      )}
    </div>
  )
}
