import { lazy, Suspense, useRef, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { useWeather } from "@/hooks/useWeather"
import { slotShortKey } from "./slotShort"
import { LiveCapsule } from "../headerWidgets/faces/LiveCapsule"
import { TrayGlyph } from "../headerWidgets/faces/TrayGlyph"
import { TrayAccess } from "../headerWidgets/HeaderWidgets"
import {
  headerFaceOf,
  headerLookOf,
  headerTitleKey,
  useHeaderWidgets,
} from "../headerWidgets/headerStore"
import { trayIcon } from "../headerWidgets/trayIcon"
import { TrayOverlay, WidgetPanel } from "../headerWidgets/trayParts"
import { panelClass } from "../headerWidgets/trayStyles"
import { IndicatorRailButton } from "./SlotIndicator"

const WeatherDetail = lazy(() => import("../headerWidgets/faces/WeatherDetail"))

/**
 * Çentikteki widget yuvası: ray düğmesinin dilinde (çember + ad), içinde widget'ın tepsideki yüzü
 * (`TrayGlyph`). Basınca widget tepsinin açtığı gibi açılır (`TrayOverlay` + `WidgetPanel`): yan
 * rayda rayın solunda, tablette şeridin altında, telefonda alttan çekmece. Hava header'daki gibi
 * doğrudan ayrıntı penceresini açar. Görünüm ve yüz header'daki seçimden; kişiye kapalı widget
 * çizilmez (kayıtta kalır).
 */
export default function NotchWidgetSlot({ id, side, mobile, delay }) {
  return (
    <TrayAccess>
      {(available) =>
        !available(id) ? null : id === "weather" ? (
          <WeatherSlot side={side} mobile={mobile} delay={delay} />
        ) : (
          <WidgetSlot id={id} side={side} mobile={mobile} delay={delay} />
        )
      }
    </TrayAccess>
  )
}

function useSlotButton(id, delay) {
  const { t } = useLocale()
  const { looks, faces } = useHeaderWidgets()
  const title = t(headerTitleKey(id))
  // Rayda kısa ad ("Hava"); tam adı pencerenin başlığında ve ipucunda.
  const short = t(slotShortKey(id))
  const face = headerFaceOf(faces, id)
  // Kısa gösterge (derece, saat, "3/7"…) tepsinin yüz seçimini izler (`SlotIndicator`).
  const button = (props) => (
    <IndicatorRailButton
      indicator={id}
      face={face}
      icon={trayIcon(id)}
      // Yapışkan notlar ve Tibot çentikte ikonuyla (deste ve rozet yalnız header'da; sayı çentiğin
      // kendi göstergesinde).
      glyph={
        id === "sticky" || id === "tibot-rings" ? undefined : <TrayGlyph id={id} face={face} />
      }
      label={short}
      count={0}
      accent="var(--notch-hot-3)"
      delay={delay}
      data-notch-slot={id}
      {...props}
    />
  )
  return { title, look: headerLookOf(looks, id), button }
}

function WidgetSlot({ id, side, mobile, delay }) {
  const [open, setOpen] = useState(false)
  const { title, look, button } = useSlotButton(id, delay)
  const overlay = (
    <TrayOverlay
      mobile={mobile}
      open={open}
      onOpenChange={setOpen}
      title={title}
      side={side}
      sideOffset={side === "left" ? 14 : 8}
      className={panelClass(id)}
      trigger={button()}
    >
      <WidgetPanel id={id} look={look} />
    </TrayOverlay>
  )
  // Yapışkan notların destesi ve Tibot'un sayısı canlı: veri okunur (görünür bir şey eklenmez).
  return id === "sticky" || id === "tibot-rings" ? (
    <LiveCapsule id={id} bare>
      {overlay}
    </LiveCapsule>
  ) : (
    overlay
  )
}

/** Hava okunamadıysa kartın penceresi (yükleniyor · yeniden dene), okunduysa ayrıntı penceresi. */
function WeatherSlot({ side, mobile, delay }) {
  const w = useWeather()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { button } = useSlotButton("weather", delay)
  if (w.status !== "ready")
    return <WidgetSlot id="weather" side={side} mobile={mobile} delay={delay} />
  return (
    <>
      {button({
        ref,
        "aria-haspopup": "dialog",
        "aria-expanded": open,
        "data-state": open ? "open" : "closed",
        onClick: () => setOpen(true),
      })}
      {open && (
        <Suspense fallback={null}>
          <WeatherDetail open onOpenChange={setOpen} w={w} returnFocusRef={ref} />
        </Suspense>
      )}
    </>
  )
}
