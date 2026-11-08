import { Fragment, useEffect, useRef } from "react"
import { useLocale } from "@/hooks/useLocale"
import { FIND_SCOPES, VERTICALS } from "@/lib/findScope"
import { useEdgeFade } from "./useEdgeFade"

// Kişiler ↔ dosya kaynağı geçişi görünümü (ve şeridi) yeniden kurar: basılan dilimin odağı yeni
// şeridin aynı dilimine taşınır, klavyedeki kişi yerini kaybetmez.
let carryFocus = null

/**
 * KAPSAM ŞERİDİ — Tümü · Kişiler · Ofisler | OneDrive · SharePoint · Şirket · E-posta ekleri ·
 * OneNote.
 * Kişiler ve Ofisler Bul'un kendi görünümleri, öbürleri dosya kaynakları (aradaki ince çizgi).
 *
 * Sakin dil: ray, çerçeve ve simge yok; seçili dilim yumuşak marka zemininde. Sığmazsa yana
 * kayar ve kesik kenar solar (sonu görünür, devamı olduğu anlaşılır); seçili dilim görünür
 * alana getirilir.
 */
export function SourceTrack({ value, onChange }) {
  const { t } = useLocale()
  const railRef = useRef(null)
  const fade = useEdgeFade(railRef)

  useEffect(() => {
    const rail = railRef.current
    const on = rail?.querySelector('[aria-pressed="true"]')
    if (!rail || !on) return
    if (carryFocus === value) {
      carryFocus = null
      on.focus({ preventScroll: true })
    }
    const r = rail.getBoundingClientRect()
    const b = on.getBoundingClientRect()
    if (b.right > r.right) rail.scrollLeft += b.right - r.right + 24
    else if (b.left < r.left) rail.scrollLeft -= r.left - b.left + 24
  }, [value])

  return (
    <div
      ref={railRef}
      role="group"
      aria-label={t("myfiles.source.aria")}
      data-fade={fade}
      className="find-scope"
    >
      {FIND_SCOPES.map((s, i) => {
        const on = value === s
        const split = VERTICALS.includes(FIND_SCOPES[i - 1]) && !VERTICALS.includes(s)
        return (
          <Fragment key={s}>
            {split && <span aria-hidden="true" className="find-scope-sep" />}
            <button
              type="button"
              aria-pressed={on}
              onClick={() => {
                if (!on) carryFocus = s
                onChange(s)
              }}
              className="find-scope-btn"
            >
              {t(`myfiles.source.${s}`)}
            </button>
          </Fragment>
        )
      })}
    </div>
  )
}
