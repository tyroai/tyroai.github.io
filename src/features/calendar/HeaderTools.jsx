import { HugeiconsIcon } from "@hugeicons/react"
import Add01Icon from "@hugeicons/core-free-icons/Add01Icon"
import { ActionButton } from "@/components/common/ActionButton"
import { Fab } from "@/components/common/Fab"
import { RefreshButton } from "@/components/common/RefreshButton"
import { SearchField } from "@/components/common/SearchField"
import { useLocale } from "@/hooks/useLocale"
import { PeopleButton } from "./PeopleButton"

/** Sayfa başlığının sağı: bu sayfanın etkinliklerinde anlık arama (eşleşmeyenler gizlenir). */
export function SearchBox({ value, onChange }) {
  const { t } = useLocale()
  return (
    <SearchField
      value={value}
      onChange={onChange}
      placeholder={t("calendar.page.searchPlaceholder")}
      label={t("calendar.search")}
      shortcut
      className="cal-search"
    />
  )
}

/**
 * Başlığın sağında Yeni'nin solu: [Yenile] · [Kişi ekle]. Yenile ortak `RefreshButton`; bütün
 * kaynakları birlikte okur (`useCalendarRefresh`); dar yerde yalnız simge. Kişi ekle paylaşılan
 * takvim düzenleyicisini açar ve eklenmiş kişileri üstünde gösterir (`PeopleButton`).
 */
export function SourceButtons({
  compact,
  refreshing,
  people,
  layers,
  onRefresh,
  onAddPerson,
  onPrefetch,
}) {
  return (
    <>
      <RefreshButton iconOnly={compact} busy={refreshing} onRefresh={onRefresh} />
      <PeopleButton
        people={people}
        layers={layers}
        compact={compact}
        onClick={onAddPerson}
        onPrefetch={onPrefetch}
      />
    </>
  )
}

/**
 * Sayfanın ana eylemi "Yeni" — araç çubuğu standardında tek dolu düğme (`ActionButton`
 * `tone="prominent"` `size="toolbar"`); telefonda ortak yüzen düğme (`Fab`).
 */
export function NewButton({ floating = false, onClick }) {
  const { t } = useLocale()
  const icon = <HugeiconsIcon icon={Add01Icon} strokeWidth={2.4} aria-hidden="true" />
  if (!floating)
    return (
      <ActionButton
        tone="prominent"
        size="toolbar"
        aria-haspopup="dialog"
        data-tour="cal-new"
        onClick={(e) => onClick(e.currentTarget)}
      >
        {icon}
        {t("calendar.page.new")}
      </ActionButton>
    )
  return (
    <Fab
      icon={Add01Icon}
      label={t("calendar.page.new")}
      aria-haspopup="dialog"
      data-tour="cal-new"
      onClick={(e) => onClick(e.currentTarget)}
    />
  )
}
