import { useRef, useState } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { RefreshButton } from "@/components/common/RefreshButton"
import { SearchField } from "@/components/common/SearchField"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { STATUS } from "@/lib/graph"
import { cn } from "@/lib/utils"
import { FEED_SECTIONS } from "./feedSections"
import { FeedCustomize } from "./FeedCustomize"
import { NarrowTools } from "./mobile/NarrowTools"
import { PhoneSearchBar, PhoneSearchButton } from "./mobile/PhoneSearch"
import { useStickyHeader } from "./timeline/useStickyHeader"
import "./mobile/feedMobile.css"

/**
 * Keşfet başlığı: bölüm sekmeleri ve araçlar. Genişte (sağ ray varken) arama, Özelleştir ve
 * Yenile sekmelerin sağında; darda sekmeler eşit üç sütun, araçlar altta tek satır
 * (`mobile/NarrowTools`: kanal çipleri, arama, "⋯"). Popüler'de yapışkan; telefonda aşağı
 * kaydırınca gizlenir, yukarıda geri gelir; çentiğin altında başlar (`feed-head`). Öteki
 * bölümlerde sabit: Dosyalarım'ın kendi yapışkan arama çubuğu var.
 * Telefonda (yatay da, `useIsMobile`) araç satırı yok: hikâyeler ve gönderiler doğrudan sekmelerin
 * altında; arama sekme satırının sonundaki büyüteçte (`mobile/PhoneSearch`), kanal çipleri onun içinde.
 * Ayrıntı ve kararların geçmişi: `docs/features/kesfet-bolumler.md`, `kesfet-mobil.md`.
 */
/** Bul'un arama kutusu: görünür alana getirip odaklar (dokunuşun içinde — iOS klavyesi açılsın). */
function focusFindSearch() {
  const input = document.querySelector("[data-find-search]")
  if (!input) return
  input.focus({ preventScroll: true })
  input.scrollIntoView({ block: "center", behavior: "smooth" })
}

export function FeedHeader({
  scrollerRef,
  section,
  onSection,
  tag,
  onTagChange,
  counts,
  showRail,
  important,
  query,
  onQuery,
  busyRefresh,
  onRefresh,
  feedHidden,
  onTrends,
  from,
  onClearFrom,
}) {
  const { t, locale } = useLocale()
  const ref = useRef(null)
  const sticky = section === "agenda"
  const hidden = useStickyHeader(scrollerRef, ref, sticky)

  const customize = section === "agenda" && Boolean(feedHidden)
  const phone = useIsMobile()
  const [searching, setSearching] = useState(false)
  const phoneSearch = phone && section !== "docs"
  // Adresle gelen kanal/gönderen süzgeci de açık aramada görünür: kaldırmanın yolu Vazgeç.
  const filtered = section === "agenda" && Boolean(tag || from)
  const searchOpen = phoneSearch && (searching || query !== "" || filtered)
  const closeSearch = () => {
    onQuery("")
    setSearching(false)
    if (filtered) onTagChange(null)
  }
  return (
    <header
      ref={ref}
      data-phone={phone || undefined}
      className={cn(
        // Alt pay her bölümde aynı: sekmeden içeriğe boşluk bölüm değişince kaymasın (ürün sahibi).
        "feed-head notch-gutter shrink-0 pb-2",
        // Kaydırıcının üst payı yok (başlıkta): yapışan sekmeler en üste oturur.
        sticky &&
          "sticky top-0 z-20 transition-transform duration-300 ease-out focus-within:translate-y-0 motion-reduce:transition-none",
        // Tam genişlikte buzlu zemin: içerik hizası (ve çentik oluğu) bozulmasın diye kutu değil, katman genişler.
        sticky &&
          "before:absolute before:inset-y-0 before:-inset-x-4 before:-z-10 before:bg-background/95 before:backdrop-blur sm:before:-inset-x-6 lg:before:-inset-x-8",
        hidden && "-translate-y-full @[64rem]/feed:translate-y-0",
      )}
    >
      <h1 className="sr-only">{t("feed.title")}</h1>
      {/* Çizgi satırın kendisinde; sekmeler `-mb-px` ile üstüne oturur. `items-end`: arama
          hapı sekmelerden yüksek, ikisi tabandan hizalanır. */}
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-border">
        <div
          role="tablist"
          aria-label={t("feed.section.aria")}
          data-tour="feed-tabs"
          className={cn(
            "-mb-px flex w-full min-w-0 items-stretch gap-1 @max-[26rem]/feed:justify-between @[34rem]/feed:w-auto @[34rem]/feed:gap-2",
            phone && "w-auto flex-1",
          )}
        >
          {FEED_SECTIONS.map((sec) => {
            const on = section === sec.id
            return (
              <button
                key={sec.id}
                type="button"
                role="tab"
                id={`feed-sec-${sec.id}`}
                aria-selected={on}
                aria-controls={`feed-panel-${sec.id}`}
                onClick={() => onSection(sec.id)}
                lang={locale}
                className={cn(
                  "relative -mb-px flex min-w-0 items-center gap-1.5 px-1.5 pb-2.5 pt-1 text-[0.9375rem] font-semibold tracking-[-0.01em] transition @[34rem]/feed:px-3",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:min-h-11",
                  on ? "text-brand" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <HugeiconsIcon
                  icon={sec.icon}
                  className="size-4 shrink-0 @max-[22rem]/feed:hidden"
                  strokeWidth={1.9}
                />
                <span className="truncate">{t(sec.labelKey)}</span>
                {/* Telefonda sekmede sayı yok (ürün sahibi): üç sekme dar satıra sade sığsın. */}
                {sec.id === "important" &&
                  !phone &&
                  important.status === STATUS.ready &&
                  important.items.length > 0 && (
                    <span className="rounded-full bg-brand/[0.1] px-1.5 text-[0.6875rem] font-semibold tabular-nums text-brand-ink">
                      {important.items.length}
                      {Object.values(important.capped ?? {}).some(Boolean) ? "+" : ""}
                    </span>
                  )}
                {on && (
                  <motion.span
                    layoutId="feed-section-line"
                    aria-hidden="true"
                    className="absolute inset-x-1.5 bottom-0 h-[3px] rounded-full bg-brand @[34rem]/feed:inset-x-3"
                  />
                )}
              </button>
            )
          })}
        </div>
        {/* Bul'da da aynı yerde (sekme satırı her bölümde aynı kalsın): orada Bul'un kutusuna götürür. */}
        {phone && !searchOpen && (
          <PhoneSearchButton
            onOpen={section === "docs" ? focusFindSearch : () => setSearching(true)}
            label={section === "docs" ? t("myfiles.search.label") : undefined}
          />
        )}
        {/* Geniş ekranın araçları: arama ve yenile yalnız akışı süzer/tazeler, Dosyalarım'da
            yok. Blok rayın genişliğinde. Darda aynı işler `NarrowTools`ta. */}
        <div
          data-tour="feed-tools"
          className={cn(
            "mb-2 hidden items-center gap-2 @[64rem]/feed:flex @[64rem]/feed:w-[20rem]",
            showRail && "@[64rem]/feed:w-[17rem]",
            // "Özelleştir" yazılı düğme sabit genişliğe sığmıyor: blok içeriği kadar, arama en az 11rem.
            customize && "@[64rem]/feed:w-auto",
            // Bul'da araçlar yok ama YERİ kalır: satır kısalınca sekmeler 10 px zıplıyordu.
            section === "docs" && "invisible",
          )}
        >
          <SearchField
            value={query}
            onChange={onQuery}
            placeholder={t("feed.searchPlaceholder")}
            label={t("feed.searchAria")}
            shortcut
            className={cn("flex-1", customize && "@[34rem]/feed:w-44 @[34rem]/feed:flex-none")}
          />
          {customize && (
            <FeedCustomize
              hidden={feedHidden.hidden}
              onToggle={feedHidden.toggle}
              onReset={feedHidden.reset}
            />
          )}
          <RefreshButton busy={busyRefresh} onRefresh={onRefresh} />
        </div>
      </div>

      {searchOpen && (
        <PhoneSearchBar
          agenda={section === "agenda"}
          focus={searching}
          query={query}
          onQuery={onQuery}
          onClose={closeSearch}
          chips={{ counts, tag, onTagChange, from, onClearFrom }}
        />
      )}
      {!phone && (
        <NarrowTools
          section={section}
          counts={counts}
          tag={tag}
          onTagChange={onTagChange}
          query={query}
          onQuery={onQuery}
          busyRefresh={busyRefresh}
          onRefresh={onRefresh}
          feedHidden={customize ? feedHidden : null}
          onTrends={showRail ? onTrends : undefined}
          from={from}
          onClearFrom={onClearFrom}
        />
      )}
    </header>
  )
}
