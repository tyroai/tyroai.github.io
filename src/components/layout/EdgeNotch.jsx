import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import { useWhatsNewCardStyle } from "@/hooks/useWhatsNewCardStyle"
import { useEdgeNotchDesign } from "@/hooks/useEdgeNotchDesign"
import { useLocale } from "@/hooks/useLocale"
import { useEdgeNotchOpen } from "@/hooks/useEdgeNotchOpen"
import { NOTCH_COLLAPSED_X, NOTCH_ENTER_X, NOTCH_SHELL_CLASS } from "@/lib/edgeNotchGeometry"
import { readEdgeNotchOpen, writeEdgeNotchOpen } from "@/lib/edgeNotchState"
import { onPanelRequest } from "@/lib/panelBus"
import { cn } from "@/lib/utils"
import { NotchShell } from "./notch/NotchShell"
import { NotchSlots } from "./notch/NotchSlots"
import { useNotchCounts } from "./useNotchCounts"

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  SAĞ KENAR ÇENTİĞİ — palet renkli ray, header'ın panelleri
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Sayfanın sağ kenarından çıkan 90px'lik ray: en çok üç yuva (`notch/NotchSlots`; varsayılan Posta ·
 * Takvim · Saatler, kişi widget da koyabilir); yuvalar Anasayfa'nın düzenleme çubuğundan
 * düzenlenir (`notch/NotchEdit`). Posta ve takvim header'ın AYNI panellerini rayın solunda açar; widget yuvası
 * widget'ı header tepsisinin açtığı gibi açar. Halka süs değil ölçü (sayı/5); rozet header'ın
 * sayısıyla aynı kaynaktan (`useNotchCounts`). Kabuk ve silüet `notch/NotchShell`, düğme
 * `notch/RailButton`; tasarım kararlarının tarihçesi `docs/features/sag-centik.md`te.
 *
 * AÇ / KAPA: sol kenarın ortasındaki dikey tutamak; ray sağa kayıp yalnız şerit kalır. Tercih
 * kapsamına göre hatırlanır (`lib/edgeNotchState`: "Genel" grubu varsayılan açık, öteki sayfalar
 * kapalı). Kayma `translateX`, `display` DEĞİL: kapalıyken de mount kalır, kancalar veriyi tutar,
 * açılış anında halkalar boş görünmez.
 *
 * ⚠️ Rayın dış ölçüleri px: kök `font-size` görüntü alanı yüksekliğiyle ölçekleniyor ve kapalı
 * hâlin kayması rayın kendi genişliğinin yüzdesi (`lib/edgeNotchGeometry`). Konum ve sağdan
 * kırpma `EdgeNotchFrame`te. Yalnız `lg`+. `data-slot="edge-notch"`.
 */

/** Kapalı rayın açılma yayının oturma süresi (bkz. `animate`ın yayı). */
const NOTCH_EXPAND_MS = 450
/** Halkalar sırayla dolar: yuvanın yerine göre gecikme. */
const DELAYS = [0.35, 0.45, 0.55]

/** `scope`: "Genel" grubu ayrı hatırlanır, öteki sayfalar ortak (bkz. `edgeNotchState`). */
export function EdgeNotch({ scope = "pages" }) {
  const { t } = useLocale()
  const open = useEdgeNotchOpen(scope)
  // Hangi panel açık — sayfadan gelen istek (`lib/panelBus`) için denetimli.
  const [panel, setPanel] = useState(null)
  useEffect(() => {
    let timer
    const claim = (name) => () => {
      // Ray yalnız `lg`+ genişlikte görünür (`hidden lg:block`); altında telefon şeridi üstlenir.
      if (!window.matchMedia("(min-width: 1024px)").matches) return false
      clearTimeout(timer)
      if (readEdgeNotchOpen(scope)) {
        setPanel(name)
      } else {
        // Kapalı ray kenarın dışında: önce açılır, panel kayma bitince — panel tetiğe göre
        // konumlanıyor ve hareket eden tetiği izlemiyor.
        writeEdgeNotchOpen(true, scope)
        timer = setTimeout(() => setPanel(name), NOTCH_EXPAND_MS)
      }
      return true
    }
    const offMail = onPanelRequest("mail", claim("mail"))
    const offCalendar = onPanelRequest("calendar", claim("calendar"))
    return () => {
      clearTimeout(timer)
      offMail()
      offCalendar()
    }
  }, [scope])
  // Kartın SEÇİLİ görünümü zemini belirliyor (bkz. index.css `--notch-*`):
  // Ses · Açık → açık kabuk, gerisi (varsayılan Ses · Çekim) → koyu kabuk.
  const cardStyle = useWhatsNewCardStyle()
  const cardVariant = cardStyle === "speakinglight" ? "light" : "gravity"
  // Kabuk: Tercihler'den seçilen tasarım (palet · açık cam · palet camı).
  const design = useEdgeNotchDesign()

  const counts = useNotchCounts()

  return (
    <motion.nav
      data-slot="edge-notch"
      data-open={open ? "" : undefined}
      aria-label={t("notch.aria")}
      initial={{ x: NOTCH_ENTER_X, opacity: 0 }}
      // Kapalıyken ray sağa kayıyor; yalnız `HANDLE_STRIP` kadar şerit kalıyor.
      animate={{ x: open ? "0%" : NOTCH_COLLAPSED_X, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 28, mass: 0.9 }}
      /* Dikey konum (sayfa alanında ortalı) ve ölçüler `lib/edgeNotchGeometry.js`te. ⚠️ Genişlik LİTERAL: Tailwind kaynağı metin olarak tarar, şablon ifadesi
         ona görünmez; `NOTCH_RAIL_REM` ile aynı sayı olmak zorunda. */
      className="pointer-events-auto relative w-full"
    >
      <NotchShell
        design={design}
        cardVariant={cardVariant}
        className={cn(NOTCH_SHELL_CLASS, "w-full")}
      >
        {/* AÇ/KAPA tutamağı — sol kenarın ortasında dikey çizgi; üstüne gelince ok'a dönüyor.
          Dokunma hedefi 24×64 (WCAG 2.5.8): 9 px rayın içinde, kalan 15 px rayın dışına, sayfanın
          boş `notch-gutter` şeridine taşar. Çizgi paletin renginde (`--notch-hot-1..3`): kapalı
          çentiği yeniden açmanın tek yolu bu, açık camda da seçilmeli. */}
        <button
          type="button"
          onClick={() => writeEdgeNotchOpen(!open, scope)}
          aria-label={open ? t("notch.collapse") : t("notch.expand")}
          aria-expanded={open}
          className="group/handle absolute -left-[0.9375rem] top-1/2 z-10 flex h-16 w-6 -translate-y-1/2 items-center justify-end rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--notch-focus)]"
        >
          <span
            aria-hidden="true"
            className="h-7 w-[0.1875rem] rounded-full bg-[linear-gradient(to_bottom,var(--notch-hot-1),var(--notch-hot-2),var(--notch-hot-3))] shadow-[0_0_6px_color-mix(in_oklch,var(--notch-hot-2)_45%,transparent)] transition-all group-hover/handle:h-8 group-hover/handle:opacity-0"
          />
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            aria-hidden="true"
            className={cn(
              "absolute end-0 size-3.5 text-[var(--notch-hot-2)] opacity-0 transition-opacity group-hover/handle:opacity-90",
              open && "rotate-180",
            )}
            strokeWidth={2.2}
          />
        </button>
        <NotchSlots
          side="left"
          mobile={false}
          panel={panel}
          onPanel={setPanel}
          counts={counts}
          delays={DELAYS}
        />
      </NotchShell>
    </motion.nav>
  )
}
