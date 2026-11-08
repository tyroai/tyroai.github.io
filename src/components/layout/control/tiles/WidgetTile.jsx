import { useLocale } from "@/hooks/useLocale"
import { faceOf } from "../../headerWidgets/faceOptions"
import { LiveCapsule } from "../../headerWidgets/faces/LiveCapsule"
import { MarketLabel } from "../../headerWidgets/faces/MarketLabel"
import { TrayGlyph } from "../../headerWidgets/faces/TrayGlyph"
import { useClockIndicator } from "../../headerWidgets/faces/useAwayCity"
import { headerFaceOf, useHeaderWidgets } from "../../headerWidgets/headerStore"
import { LiveLabel } from "../../headerWidgets/WidgetLabels"
import { tileSize } from "../controlModel"
import { preloadPanel } from "../panelPreload"
import { tileTitleKey } from "../tileTitle"
import { TileShell } from "./TileShell"

// Yüzünün verisini ayrı bir parça okuyanlar (notların destesi, Ticket'un sayısı): kutucuk
// açıkken o parça da çizilir, görünür bir şey eklemez (header'ın toplu tepsisi gibi).
const KEEP_LIVE = new Set(["sticky", "tibot-rings"])

/** Dünya saati: kutucuğun adı seçilen (ya da uzaktaki ilk) şehrin adı — hangi saat olduğu belli. */
function ClockName({ city, fallback }) {
  return useClockIndicator(city)?.name ?? fallback
}

/** Piyasa iki kurla: adı yerine iki satır değer (simge söyler, ad ekran okuyucuda). */
function MarketRows({ codes, title }) {
  return (
    <span className="cc-text cc-market2">
      <span className="sr-only">{title}</span>
      {codes.map((code) => (
        <span key={code} className="cc-sub">
          <MarketLabel codes={[code]} />
        </span>
      ))}
    </span>
  )
}

/**
 * Header'a girebilen bir widget'ın kutucuğu: yuvada header'daki yüzü (kadran, sayaç halkası,
 * kâğıt destesi, Ticket halkası …), yanında adı ve canlı bilgisi (kur, saat, kalan süre —
 * header'da "yalnız simge" seçilmiş olsa da). Yüz seçimi header'la ortak (`faces`: piyasada
 * kurlar, dünya saatinde şehir). Üstüne gelince penceresinin kodu önden iner; dokununca widget
 * panelin içinde açılır (`ControlDetail`).
 */
export function WidgetTile({ id, onOpen, size, ...shell }) {
  const { t } = useLocale()
  const { faces } = useHeaderWidgets()
  const saved = headerFaceOf(faces, id)
  const face =
    saved.show === "icon" ? { ...faceOf(id, null), codes: saved.codes, city: saved.city } : saved
  const title = t(tileTitleKey(id))
  const small = (size ?? tileSize(id)) === "small"
  const twoRates = id === "market" && face.codes.length > 1
  return (
    <TileShell id={id} size={size} {...shell}>
      {KEEP_LIVE.has(id) && <LiveCapsule id={id} bare />}
      <button
        type="button"
        className="cc-hit"
        onClick={() => onOpen(id)}
        onPointerEnter={() => preloadPanel(id)}
        onFocus={() => preloadPanel(id)}
      >
        {small && <span className="sr-only">{title}</span>}
        <span className="cc-ic">
          <TrayGlyph id={id} live={id === "sticky"} face={face} badge={id === "sticky"} />
        </span>
        {twoRates && <MarketRows codes={face.codes} title={title} />}
        {!small && !twoRates && (
          <span className="cc-text">
            <span className="cc-label">
              {id === "world-clock" ? <ClockName city={face.city} fallback={title} /> : title}
            </span>
            <span className="cc-sub">
              <LiveLabel id={id} face={face} />
            </span>
          </span>
        )}
      </button>
    </TileShell>
  )
}
