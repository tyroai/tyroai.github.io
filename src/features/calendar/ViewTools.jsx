import { HugeiconsIcon } from "@hugeicons/react"
import ArrowExpand01Icon from "@hugeicons/core-free-icons/ArrowExpand01Icon"
import ArrowShrink01Icon from "@hugeicons/core-free-icons/ArrowShrink01Icon"
import ListViewIcon from "@hugeicons/core-free-icons/ListViewIcon"
import ViewOffIcon from "@hugeicons/core-free-icons/ViewOffIcon"
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
 * Yoğun takvim araçları (araç çubuğunun sağında, görünüm seçicinin solunda): liste görünümü,
 * rahat saat ölçeği (ızgarada; liste ve ay görünümünde yok) ve yanıtlanmamış davetleri gizleme.
 * Telefonda gösterilmez (orada zaten günün listesi var).
 */
export function ViewTools({ view, tools }) {
  const { t } = useLocale()
  const grid = view !== "month" && !tools.list
  return (
    <div className="cal-tool-group" role="group" aria-label={t("calendar.page.tools.label")}>
      {view !== "month" && (
        <Tool
          icon={ListViewIcon}
          label={t("calendar.page.tools.list")}
          on={tools.list}
          onClick={tools.toggleList}
        />
      )}
      {grid && (
        <Tool
          icon={tools.comfort ? ArrowShrink01Icon : ArrowExpand01Icon}
          label={t(tools.comfort ? "calendar.page.tools.fit" : "calendar.page.tools.comfort")}
          on={tools.comfort}
          onClick={tools.toggleComfort}
        />
      )}
      <Tool
        icon={ViewOffIcon}
        label={t("calendar.page.tools.hidePending")}
        on={tools.hidePending}
        onClick={tools.toggleHidePending}
      />
    </div>
  )
}
