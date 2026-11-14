import { HugeiconsIcon } from "@hugeicons/react"
import { SECTION_ACTION } from "./chipStyle"
import Sorting01Icon from "@hugeicons/core-free-icons/Sorting01Icon"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SearchField } from "@/components/common/SearchField"
import { useLocale } from "@/hooks/useLocale"
import { stopEscape } from "./menuEscape"

export { SourceTrack } from "./SourceTrack"

/**
 * BUL ARAÇ ÇUBUĞU — arama kutusu · sıralama (Yenile ortak `RefreshButton`). Süzgeçler `FilesFilter`da (tek düğme),
 * kapsam şeridi `SourceTrack`te; satırı `FilesSearchBar` kurar.
 *
 * ⚠️ **ÜÇ ŞERİT, ÜÇ GİYSİ.** Keşfet'in bölüm sekmeleri altı çizili, kapsam şeridi yumuşak hap,
 * süzgeç tek düğme — iki şeridin aynı giysiyi giymemesi sayfanın kuralı (`kesfet-bolumler.md`).
 */

/**
 * ARAMA KUTUSU — ortak `SearchField` (araç çubuğu standardı: arama, Filtreler ve Yenile aynı boyda).
 * "/" kısayolunu sayfa dinliyor (`useSlashFocus`): burada yalnız ipucu.
 */
export function SearchBox({ value, onChange, onSubmit, placeholder, inputRef, busy }) {
  const { t } = useLocale()
  return (
    <>
      <SearchField
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        placeholder={placeholder}
        label={t("myfiles.search.label")}
        inputRef={inputRef}
        busy={busy}
        hint
        className="flex-1"
        inputProps={{ "data-find-search": "", "aria-describedby": "myfiles-search-hint" }}
      />
      <span id="myfiles-search-hint" className="sr-only">
        {t("myfiles.search.hint")}
      </span>
    </>
  )
}

/* ─────────── Sıralama ─────────── */

export function SortMenu({ sort, options, onSort, align = "end" }) {
  const { t } = useLocale()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("myfiles.sort.aria", { value: t(`myfiles.sort.${sort}`) })}
          className={SECTION_ACTION}
        >
          <HugeiconsIcon
            icon={Sorting01Icon}
            className="size-3.5 text-muted-foreground"
            strokeWidth={1.9}
          />
          <span className="truncate">{t(`myfiles.sort.${sort}`)}</span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className="size-3 shrink-0 opacity-60"
            strokeWidth={2}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56 p-1.5" onEscapeKeyDown={stopEscape}>
        <DropdownMenuRadioGroup value={sort} onValueChange={onSort}>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o} value={o}>
              {t(`myfiles.sort.${o}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
