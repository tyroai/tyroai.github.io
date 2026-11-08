import "@/lib/i18n/control"
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { TrayOverlay } from "../headerWidgets/trayParts"
import { FLOATING } from "../headerWidgets/trayStyles"
import { ControlActions } from "./controlActions"
import { ControlButton } from "./ControlButton"
import { useControlLook } from "./controlStore"
import { CONTROL_EVENT, handoff } from "./controlIntent"
import { ControlPanel } from "./ControlPanel"
import { FocusLinks } from "./FocusLinks"
import { LiveStatus } from "./LiveStatus"
import { OofWatch } from "./OofWatch"
import { SmartPresent } from "./SmartPresent"
import "./control.css"
import "./controlTools.css"
import "./controlEdit.css"
import "./controlOffice.css"
import "./controlGlass.css"

const NotchSlotPicker = lazy(() => import("../notch/NotchSlotPicker"))
const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent)
const KEYS = isMac ? "⌥⌘K" : "Ctrl+Alt+K"
const button = () => document.querySelector('[data-tour="control"]')

/**
 * DENETİM MERKEZİ (macOS'un Denetim Merkezi gibi; header'da çanın solunda): sık kullanılan
 * araçlar tek pencerede — Odak ve Sunum modu, koyu görünüm, çentik, hızlı görev, kısayollar ve
 * header'a girebilen widget'lar (Tyrofy, Piyasa, odak sayacı, dünya saati, notlar, hava …).
 * Kutucuk panelin içinde çalışır; süren şey (radyo, açık mod) header'da görünür; kalıcı yer
 * bilerek seçilir (`PinMenu`). Masaüstünde ve tablette düğmeden yapışkan açılan pencere,
 * telefonda alttan çekmece. Kod ilk niyette ya da boşta iner (`ControlCenterGate`); yer
 * tutucuda basılmışsa açık gelir, odak düğmede kalır. Arama komutu ve ⌥⌘K da açar
 * (`requestControl`). Çentiği düzenle: pencere kapanır, yuva seçici düğmenin altında açılır.
 */
export default function ControlCenter() {
  const { t } = useLocale()
  const mobile = useIsMobile()
  const navigate = useNavigate()
  const [open, setOpen] = useState(() => handoff.open)
  const [refocus] = useState(() => handoff.focused)
  const [notchEdit, setNotchEdit] = useState(false)
  const anchor = useRef(null)

  useEffect(() => {
    handoff.open = false
    handoff.focused = false
    handoff.loaded = true
    if (refocus) button()?.focus({ preventScroll: true })
    const onRequest = (e) => setOpen((v) => (e.detail === "toggle" ? !v : true))
    window.addEventListener(CONTROL_EVENT, onRequest)
    return () => window.removeEventListener(CONTROL_EVENT, onRequest)
  }, [refocus])

  const actions = useMemo(
    () => ({
      close: () => setOpen(false),
      go: (path) => {
        setOpen(false)
        navigate(path)
      },
      openNotchEdit: () => {
        anchor.current = button()
        setOpen(false)
        setNotchEdit(true)
      },
    }),
    [navigate],
  )

  // Cam (deneysel) pencerenin kabında: içteki öğe arkayı bulanıklaştıramaz (kabın açılış
  // animasyonu bulanıklığın kökü olur). Telefonda çekmece kendi yüzeyi: düz.
  const glass = useControlLook() === "glass" && !mobile
  const title = t("control.title")
  return (
    <ControlActions value={actions}>
      <SmartPresent />
      <FocusLinks />
      <OofWatch />
      <TrayOverlay
        mobile={mobile}
        open={open}
        onOpenChange={setOpen}
        title={title}
        tip={`${title} (${KEYS})`}
        align="end"
        className={cn(FLOATING, "w-auto", glass && "cc-glass")}
        trigger={<ControlButton live={<LiveStatus />} />}
      >
        <ControlPanel mobile={mobile} />
      </TrayOverlay>
      {notchEdit && (
        <Suspense fallback={null}>
          <NotchSlotPicker
            anchor={anchor}
            opener={anchor}
            open
            onOpenChange={(next) => !next && setNotchEdit(false)}
            mobile={mobile}
            side="bottom"
          />
        </Suspense>
      )}
    </ControlActions>
  )
}
