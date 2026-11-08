import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import MoreHorizontalIcon from "@hugeicons/core-free-icons/MoreHorizontalIcon"
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import { BottomSheet } from "@/components/common/BottomSheet"
import { RefreshButton } from "@/components/common/RefreshButton"
import { SearchField } from "@/components/common/SearchField"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocale } from "@/hooks/useLocale"
import { SORTS } from "@/lib/todoInsights"
import { Rail } from "./TodoRail"
import { listIcon } from "./listIcon"
import { VIEW_META } from "./viewMeta"
import "./todoMobile.css"

const ICON = "size-4"

/**
 * TELEFONUN TEK ARAÇ SATIRI: görünüm seçici (Bugün · Önemli · … · listeler, çekmecede ray),
 * ara (dokununca satırı kaplayan ortak `SearchField`), ortak `RefreshButton` ve ⋯ (sıralama); seçim satırın
 * yuvarlağından. Hepsi 44 px zeminsiz simge düğmesi (araç çubuğu standardı);
 * etiketli haplar ve çip şeridi telefonda yok. Ekleme sağ alttaki düğmede (`TodoAddFab`).
 */
export function TodoMobileBar({
  board,
  view,
  title,
  count,
  counts,
  today,
  onView,
  onDeleteList,
  query,
  onQuery,
  sort,
  onSort,
  onRefresh,
}) {
  const { t } = useLocale()
  const [searching, setSearching] = useState(false)
  const [picking, setPicking] = useState(false)
  const input = useRef(null)
  const open = searching || Boolean(query)
  const list = view?.startsWith("list:") ? board.lists.find((l) => `list:${l.id}` === view) : null
  const icon = list ? listIcon(list) : VIEW_META.find((v) => v.id === view)?.icon

  // Arama açılınca alan odaklanır (klavye hemen gelir).
  useEffect(() => {
    if (searching) input.current?.focus()
  }, [searching])

  function closeSearch() {
    onQuery("")
    setSearching(false)
  }

  if (open)
    return (
      <div className="todo-mbar">
        <SearchField
          value={query}
          onChange={onQuery}
          placeholder={t("todo.search.placeholder")}
          label={t("todo.search.aria")}
          inputRef={input}
          inputProps={{ onKeyDown: (e) => e.key === "Escape" && closeSearch() }}
          className="flex-1"
        />
        <button
          type="button"
          onClick={closeSearch}
          aria-label={t("todo.mobile.closeSearch")}
          className="todo-mbar-icon"
        >
          <HugeiconsIcon icon={Cancel01Icon} className={ICON} strokeWidth={1.9} />
        </button>
      </div>
    )

  return (
    <div className="todo-mbar">
      <button
        type="button"
        onClick={() => setPicking(true)}
        aria-haspopup="dialog"
        data-tour="todo-views-strip"
        className="todo-mbar-view"
      >
        {icon && (
          <HugeiconsIcon icon={icon} className="size-4 shrink-0 text-brand" strokeWidth={1.9} />
        )}
        <span className="min-w-0 truncate">{title}</span>
        {count != null && (
          <span className="shrink-0 font-medium tabular-nums text-foreground/70">{count}</span>
        )}
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          className="size-4 shrink-0 text-muted-foreground"
          strokeWidth={2}
        />
      </button>
      <button
        type="button"
        onClick={() => setSearching(true)}
        aria-label={t("todo.search.aria")}
        className="todo-mbar-icon"
      >
        <HugeiconsIcon icon={Search01Icon} className={ICON} strokeWidth={1.8} />
      </button>
      {onRefresh && (
        <RefreshButton
          iconOnly
          label={t("todo.refresh")}
          busy={board.refreshing}
          onRefresh={onRefresh}
        />
      )}
      {view !== "done" && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label={t("todo.mobile.more")} className="todo-mbar-icon">
              <HugeiconsIcon icon={MoreHorizontalIcon} className={ICON} strokeWidth={2} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>{t("todo.sort.label")}</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={sort} onValueChange={onSort}>
              {SORTS.map((s) => (
                <DropdownMenuRadioItem key={s} value={s} className="pointer-coarse:min-h-11">
                  {t(`todo.sort.${s}`)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <BottomSheet open={picking} onOpenChange={setPicking} title={t("todo.view.aria")}>
        <Rail
          board={board}
          view={view}
          counts={counts}
          today={today}
          onView={(v) => {
            setPicking(false)
            onView(v)
          }}
          onDeleteList={(l) => {
            setPicking(false)
            onDeleteList(l)
          }}
        />
      </BottomSheet>
    </div>
  )
}
