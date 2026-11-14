import { HugeiconsIcon } from "@hugeicons/react"
import ArrowExpand01Icon from "@hugeicons/core-free-icons/ArrowExpand01Icon"
import ArrowShrink01Icon from "@hugeicons/core-free-icons/ArrowShrink01Icon"
import ListViewIcon from "@hugeicons/core-free-icons/ListViewIcon"
import { useLocale } from "@/hooks/useLocale"

function Tool({ icon, label, on, onClick }) {
  return (
    <button
      type="button"
      className="cal-btn cal-tool"
      data-icon=""
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <HugeiconsIcon icon={icon} className="cal-ic" strokeWidth={2} aria-hidden="true" />
    </button>
  )
}

/**
 * Yoğun takvim araçları (araç çubuğunun sağında, görünüm seçicinin solunda): liste görünümü ve
 * rahat saat ölçeği (ızgarada; liste ve ay görünümünde yok — varsayılan açık).
 * Telefonda gösterilmez (orada zaten günün listesi var).
 */
export function ViewTools({ view, tools }) {
  const { t } = useLocale()
  const grid = view !== "month" && !tools.list
  // Ay görünümünde iki araç da yok: boş grup çizilmez.
  if (view === "month") return null
  return (
    <div className="cal-tool-group" role="group" aria-label={t("calendar.page.tools.label")}>
      <Tool
        icon={ListViewIcon}
        label={t("calendar.page.tools.list")}
        on={tools.list}
        onClick={tools.toggleList}
      />
      {grid && (
        <Tool
          icon={tools.comfort ? ArrowShrink01Icon : ArrowExpand01Icon}
          label={t(tools.comfort ? "calendar.page.tools.fit" : "calendar.page.tools.comfort")}
          on={tools.comfort}
          onClick={tools.toggleComfort}
        />
      )}
    </div>
  )
}
