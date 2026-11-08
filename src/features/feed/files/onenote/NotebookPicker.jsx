import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import NotebookTabsIcon from "@hugeicons/core-free-icons/NotebookTabsIcon"
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocale } from "@/hooks/useLocale"
import { formatCount } from "@/lib/intl-cache"
import { stopEscape } from "../menuEscape"
import { SECTION_ACTION } from "../chipStyle"

// Sıralama menüsünün (`FilesToolbar` › `SortMenu`) giysisi: başlığın sağında sakin hap.
const ITEM = "gap-2 rounded-lg px-2 py-1.5 text-[0.78125rem] [@media(pointer:coarse)]:min-h-10"
// Seçim işareti sağda (radyo öğesinin kendi payı): sayı onun altında kalmasın.
const RADIO =
  "gap-2 rounded-lg py-1.5 pl-2 pr-8 text-[0.78125rem] [@media(pointer:coarse)]:min-h-10"

/**
 * Defter seçici — Tüm defterler · listedeki defterler (sayfa sayısıyla), altta Yenile (OneNote'a
 * yoklama yok: yeniden sormak yalnız burada). `value` seçili defterin kimliği ya da "".
 */
export function NotebookPicker({ notebooks, value, total, onPick, onRefresh }) {
  const { t, locale } = useLocale()
  const active = notebooks.find((nb) => nb.id === value)
  const label = active?.name || t("onenote.all")
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${t("onenote.filter")}: ${label}`}
          className={SECTION_ACTION}
        >
          <HugeiconsIcon
            icon={NotebookTabsIcon}
            className="size-3.5 text-muted-foreground"
            strokeWidth={1.9}
          />
          <span dir="auto" className="max-w-[14rem] truncate">
            {label}
          </span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className="size-3 shrink-0 opacity-60"
            strokeWidth={2}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-[min(20rem,50dvh)] w-64 overflow-y-auto p-1.5"
        onEscapeKeyDown={stopEscape}
      >
        <DropdownMenuRadioGroup value={value} onValueChange={onPick}>
          <DropdownMenuRadioItem value="" className={RADIO}>
            <span className="min-w-0 flex-1 truncate">{t("onenote.all")}</span>
            <span className="tabular-nums text-muted-foreground">{formatCount(locale, total)}</span>
          </DropdownMenuRadioItem>
          {notebooks.map((nb) => (
            <DropdownMenuRadioItem key={nb.id} value={nb.id} className={RADIO}>
              <span dir="auto" className="min-w-0 flex-1 truncate">
                {nb.name || t("onenote.untitledNotebook")}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {formatCount(locale, nb.count)}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onRefresh} className={ITEM}>
          <HugeiconsIcon icon={RefreshIcon} className="size-3.5" strokeWidth={1.9} />
          {t("onenote.refresh")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
