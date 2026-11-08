import { FILES_PAGE } from "@/lib/filesPolicy"
import { ActiveChips, FilterButton } from "./FilesFilter"
import { RefreshButton } from "@/components/common/RefreshButton"
import { useIsMobile } from "@/hooks/use-mobile"
import { SearchBox, SourceTrack } from "./FilesToolbar"

const NO_FILTERS = { types: [], date: "", person: "" }

/**
 * Arama satırı (kutu · Filtreler · Yenile) + kapsam şeridi + etkin süzgeçler. Tek bir birincil
 * satır: süzgeçler düğmenin içinde, yalnız etkin olanlar şeridin altında çip — kapalıyken
 * hiçbir şey yer kaplamaz. "Temizle" yalnız süzgeçleri kaldırır, aranan metne dokunmaz.
 */
export function FilesSearchBar({
  t,
  text,
  setText,
  setQ,
  placeholder,
  inputRef,
  busy,
  filters,
  setFilter,
  showPerson,
  personOptions,
  counts,
  showRefresh,
  refreshing,
  onRefresh,
  source,
  setSource,
}) {
  // Yenile öteki sayfalardaki gibi yazılı; yalnız telefonda simge (araç çubuğu standardı).
  const phone = useIsMobile()
  const clearFilters = () => setFilter(NO_FILTERS)
  const noFilters = source === "onenote"
  return (
    <div className="flex min-w-0 flex-col gap-3">
      {/* ⚠️ YALNIZ ARAMA SATIRI YAPIŞKAN (§12.12, ≤ 64 px). */}
      <div role="search" aria-label={t("myfiles.search.label")} className="files-search-row">
        <SearchBox
          value={text}
          onChange={setText}
          onSubmit={() => setQ(text.trim())}
          placeholder={placeholder}
          inputRef={inputRef}
          busy={busy}
        />
        {/* OneNote sayfalarında tür/tarih/kişi yok: süzgeci defter seçicisi (`OneNoteFind`). */}
        {!noFilters && (
          <FilterButton
            filters={filters}
            onFilter={setFilter}
            onClearAll={clearFilters}
            showPerson={showPerson}
            personOptions={personOptions}
            typeCounts={counts}
          />
        )}
        {showRefresh && (
          <RefreshButton
            iconOnly={phone}
            label={t("myfiles.refresh")}
            busy={refreshing}
            onRefresh={onRefresh}
          />
        )}
      </div>
      <SourceTrack value={source} onChange={setSource} />
      {!noFilters && (
        <ActiveChips filters={filters} onFilter={setFilter} onClearAll={clearFilters} />
      )}
      {text.trim().length > 0 && text.trim().length < FILES_PAGE.minQuery && (
        <p className="px-1 text-[0.75rem] text-muted-foreground">{t("files.searchShort")}</p>
      )}
    </div>
  )
}
