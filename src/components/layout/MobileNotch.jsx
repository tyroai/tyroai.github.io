import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useEdgeNotchDesign } from "@/hooks/useEdgeNotchDesign"
import { useLocale } from "@/hooks/useLocale"
import { useWhatsNewCardStyle } from "@/hooks/useWhatsNewCardStyle"
import { EDGE_NOTCH_DESIGN_ATTR } from "@/lib/edgeNotchDesign"
import { onPanelRequest } from "@/lib/panelBus"
import { HangingNotchShell } from "./HangingNotchShell"
import { useNotchSlots } from "./notch/notchSlotStore"
import { NotchSlots } from "./notch/NotchSlots"
import { useNotchCounts } from "./useNotchCounts"

// Kabuğun gövde ölçüleri (px): şerit yuva sayısınca ray düğmesi (72 + 2 aralık) + 16 kenar payı ve
// tutamak; sekme yalnız tutamak. Omuzlar gövdenin iki yanına taşar (`HangingNotchShell`).
const barOf = (n) => ({ width: n * 74 + 14, height: 104, shoulder: 40 })
const TAB = { width: 72, height: 22, shoulder: 22 }
const DELAYS = [0.1, 0.18, 0.26]

/** Aç/kapa çizgisi: yan raydaki tutamağın yatayı — paletin renginde, kapalıyken de seçilir. */
function Handle({ label, expanded, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={expanded}
      className="relative grid h-5 w-16 place-items-center rounded-full outline-none after:absolute after:-inset-x-2 after:-inset-y-3 focus-visible:ring-2 focus-visible:ring-[var(--notch-focus)]"
    >
      <span
        aria-hidden="true"
        className="h-[0.1875rem] w-8 rounded-full bg-[linear-gradient(to_right,var(--notch-hot-1),var(--notch-hot-2),var(--notch-hot-3))] shadow-[0_0_6px_color-mix(in_oklch,var(--notch-hot-2)_45%,transparent)]"
      />
    </button>
  )
}

/**
 * Telefon ve tablet çentiği (< 1024 px): header çizgisinin ortasında asılı, yan rayın kıvrımlı
 * silüetiyle (`HangingNotchShell`). Kapalıyken küçük bir sekme; açılınca YATAY şerit — yan rayın
 * AYNI yuvaları (`NotchSlots`: halka, sayı rozeti, aynı paneller; widget yuvası tepsinin telefon
 * davranışıyla alttan çekmece). Çentik varken header'da posta,
 * takvim ve saat düğmesi yok (masaüstüyle aynı). Açık/kapalı oturumluk, varsayılan kapalı: açık
 * şerit içeriğin sağ üstünü örter.
 */
export function MobileNotch() {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState(null)
  const counts = useNotchCounts()
  const slots = useNotchSlots()
  const mobile = useIsMobile()
  const design = useEdgeNotchDesign()
  const cardStyle = useWhatsNewCardStyle()
  const shell = {
    design,
    designAttr: EDGE_NOTCH_DESIGN_ATTR[design] ?? "palette",
    cardVariant: cardStyle === "speakinglight" ? "light" : "gravity",
  }

  // Sayfadan gelen panel isteği (`lib/panelBus`): dar ekranda paneller burada açılır.
  useEffect(() => {
    const claim = (name) => () => {
      if (window.matchMedia("(min-width: 1024px)").matches) return false
      setOpen(true)
      setPanel(name)
      return true
    }
    const offMail = onPanelRequest("mail", claim("mail"))
    const offCalendar = onPanelRequest("calendar", claim("calendar"))
    return () => {
      offMail()
      offCalendar()
    }
  }, [])

  return (
    <nav
      data-slot="mobile-notch"
      aria-label={t("notch.aria")}
      // Ana sütunda ortalı: yanında panel açıkken `--notch-dock` onun genişliği (`useNotchEdge`).
      style={{ left: "calc((100% - var(--notch-dock, 0px)) / 2)" }}
      className="absolute top-0 z-30 -translate-x-1/2"
    >
      <AnimatePresence initial={false} mode="wait">
        {open ? (
          <motion.div
            key="bar"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <HangingNotchShell
              {...shell}
              {...barOf(slots.length)}
              className="flex flex-col items-center justify-between pt-1"
            >
              <div className="flex items-center gap-0.5">
                <NotchSlots
                  side="bottom"
                  mobile={mobile}
                  panel={panel}
                  onPanel={setPanel}
                  counts={counts}
                  delays={DELAYS}
                />
              </div>
              <Handle label={t("notch.collapse")} expanded onClick={() => setOpen(false)} />
            </HangingNotchShell>
          </motion.div>
        ) : (
          <motion.div
            key="tab"
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -6, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <HangingNotchShell {...shell} {...TAB} className="grid place-items-center">
              <Handle label={t("notch.expand")} expanded={false} onClick={() => setOpen(true)} />
            </HangingNotchShell>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
