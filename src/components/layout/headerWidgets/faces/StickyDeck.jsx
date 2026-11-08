import "@/lib/i18n/notchInd"
import { useLocale } from "@/hooks/useLocale"
import { useStickyPeek } from "@/lib/stickyCount"
import "./stickyDeck.css"

// Liste henüz okunmadıysa destenin renkleri (en yeni önce).
const IDLE = [
  { id: "idle-0", color: "sun" },
  { id: "idle-1", color: "sky" },
  { id: "idle-2", color: "rose" },
]

/**
 * Yapışkan notların yüzü (tepsi, toplu tepsi; çentikte not ikonu): son üç notun RENGİNDE küçük kâğıt destesi
 * — üstteki kâğıtta satır çizgileri ve kıvrık köşe; yeni not gelince üste düşer, düğmenin üstüne
 * gelince yelpaze gibi açılır. `badge`: sayı destenin köşesinde rozet (header). Basınca ne olacağı düğmenin işi (notların penceresi).
 */
export function StickyDeck({ badge = false }) {
  const { t } = useLocale()
  const peek = useStickyPeek()
  const top = peek?.top.length ? peek.top : IDLE
  const n = peek?.count ?? 0
  return (
    <span className="stk-deck" data-idle={peek ? undefined : ""} aria-hidden={!badge || !n}>
      {top
        .map((x, i) => <span key={x.id} className="stk-paper" data-color={x.color} data-pos={i} />)
        .reverse()}
      {badge && n > 0 && (
        <>
          <span key={n} className="stk-count" aria-hidden="true">
            {n > 99 ? "99+" : n}
          </span>
          <span className="sr-only">{t("notchInd.sticky", { n })}</span>
        </>
      )}
    </span>
  )
}
