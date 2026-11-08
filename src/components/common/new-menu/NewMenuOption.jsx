import { HugeiconsIcon } from "@hugeicons/react"
import "./newMenu.css"

/**
 * "Yeni" menüsünün bir seçeneği (Takvim ve Self Servis aynı satırı çizer): tonlu simge kutusu, ad
 * ve tek satır açıklama; `badge` adın yanında küçük hap (ör. "taslak"). `tone` çağıranın kökündeki
 * `[data-tone]` renklerini seçer (`--t-bg`, `--t-ink`).
 */
export function NewMenuOption({ tone, icon, title, sub, badge = null, onClick }) {
  return (
    <button type="button" className="nm-opt" data-tone={tone} onClick={onClick}>
      <span className="nm-opt-ic">
        <HugeiconsIcon icon={icon} strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="nm-opt-text">
        <strong className="nm-opt-title">
          {title}
          {badge && <span className="nm-opt-badge">{badge}</span>}
        </strong>
        <span className="nm-opt-sub">{sub}</span>
      </span>
    </button>
  )
}
