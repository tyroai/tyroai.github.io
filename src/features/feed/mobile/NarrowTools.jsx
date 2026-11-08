import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ChartUpIcon from "@hugeicons/core-free-icons/ChartUpIcon"
import FilterHorizontalIcon from "@hugeicons/core-free-icons/FilterHorizontalIcon"
import MoreHorizontalIcon from "@hugeicons/core-free-icons/MoreHorizontalIcon"
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon"
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import { RefreshButton } from "@/components/common/RefreshButton"
import { SearchField } from "@/components/common/SearchField"
import { BottomSheet } from "@/components/common/BottomSheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { CustomizeList } from "../FeedCustomize"
import { hiddenCount } from "../useFeedHidden"
import { FeedChips } from "./FeedChips"

// Araç çubuğu standardı: yalnız simgeli düğme zeminsiz daire (macOS araç çubuğu simgesi).
const ICON_BTN =
  "relative grid size-control shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 data-[state=open]:bg-accent"

/**
 * Dar ekranın araç satırı (sekmelerin altında; genişte araçlar sekmelerin sağında). Popüler'de:
 * kanal çipleri · arama (telefonda büyüteçle açılır, çiplerin yerine geçer; tablette hep açık) ·
 * Trendler (sağ rayın içeriği bir pencerede, `onTrends`) · "⋯" (Yenile, Özelleştir — tür listesi
 * alttan açılan pencerede). Sana özel'de arama + Yenile. Bul'un kendi araç çubuğu var.
 */
export function NarrowTools({
  section,
  counts,
  tag,
  onTagChange,
  query,
  onQuery,
  busyRefresh,
  onRefresh,
  feedHidden,
  onTrends,
  from,
  onClearFrom,
}) {
  const { t } = useLocale()
  const [searching, setSearching] = useState(false)
  const [sheet, setSheet] = useState(false)
  const input = useRef(null)
  const open = searching || query !== ""
  useEffect(() => {
    if (searching) input.current?.focus()
  }, [searching])
  if (section === "docs") return null
  const agenda = section === "agenda"
  const off = feedHidden ? hiddenCount(feedHidden.hidden, { rail: false }) : 0
  const close = () => {
    onQuery("")
    setSearching(false)
  }

  return (
    <div
      data-tour="feed-tools-narrow"
      className="feed-tools-row flex items-center gap-1.5 pt-2 @[64rem]/feed:hidden"
    >
      {agenda && (
        <FeedChips
          counts={counts}
          tag={tag}
          onTagChange={onTagChange}
          from={from}
          onClearFrom={onClearFrom}
          className={cn(
            "-ms-4 flex-1 ps-4 @[40rem]/feed:ms-0 @[40rem]/feed:ps-0",
            open && "hidden @[40rem]/feed:flex",
          )}
        />
      )}
      <SearchField
        value={query}
        onChange={onQuery}
        placeholder={t("feed.searchPlaceholder")}
        label={t("feed.searchAria")}
        inputRef={input}
        inputProps={{ onKeyDown: (e) => e.key === "Escape" && close() }}
        className={cn(
          "flex-1",
          agenda && !open && "hidden @[40rem]/feed:flex",
          agenda && "@[40rem]/feed:w-56 @[40rem]/feed:flex-none",
        )}
      />
      {agenda && open && (
        <button
          type="button"
          onClick={close}
          className="shrink-0 rounded-full px-2 text-[0.8125rem] font-semibold text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-10 @[40rem]/feed:hidden"
        >
          {t("feed.search.cancel")}
        </button>
      )}
      {agenda && !open && (
        <button
          type="button"
          onClick={() => setSearching(true)}
          aria-label={t("feed.searchAria")}
          className={cn(ICON_BTN, "@[40rem]/feed:hidden")}
        >
          <HugeiconsIcon icon={Search01Icon} className="size-4" strokeWidth={1.9} />
        </button>
      )}
      {agenda && onTrends && (
        <button
          type="button"
          onClick={onTrends}
          aria-haspopup="dialog"
          aria-label={t("feed.discover")}
          className={cn(ICON_BTN, open && "hidden @[40rem]/feed:grid")}
        >
          <HugeiconsIcon icon={ChartUpIcon} className="size-4" strokeWidth={1.9} />
        </button>
      )}
      {agenda ? (
        <DropdownMenu>
          <DropdownMenuTrigger aria-label={t("feed.menu.aria")} className={ICON_BTN}>
            <HugeiconsIcon icon={MoreHorizontalIcon} className="size-4" strokeWidth={2} />
            {off > 0 && (
              <span className="absolute -end-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-brand-solid px-1 text-[0.625rem] font-semibold leading-4 text-brand-on-brand">
                {off}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={6} className="w-52">
            <DropdownMenuItem onSelect={onRefresh} disabled={busyRefresh}>
              <HugeiconsIcon icon={RefreshIcon} className="size-4" strokeWidth={1.9} />
              {busyRefresh ? t("feed.refreshing") : t("feed.refresh")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSheet(true)}>
              <HugeiconsIcon icon={FilterHorizontalIcon} className="size-4" strokeWidth={1.9} />
              <span className="flex-1">{t("feed.customize.button")}</span>
              {off > 0 && <span className="text-[0.75rem] tabular-nums text-brand-ink">{off}</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <RefreshButton iconOnly busy={busyRefresh} onRefresh={onRefresh} />
      )}
      {feedHidden && (
        <BottomSheet
          open={sheet}
          onOpenChange={setSheet}
          title={t("feed.customize.title")}
          closeOnBack
        >
          <div className="pb-2">
            <CustomizeList
              hidden={feedHidden.hidden}
              onToggle={feedHidden.toggle}
              onReset={feedHidden.reset}
              showTitle={false}
              rail={false}
            />
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
