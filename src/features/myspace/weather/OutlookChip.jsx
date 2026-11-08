import { HugeiconsIcon } from "@hugeicons/react"
import { useLocale } from "@/hooks/useLocale"
import { outlookIcon, outlookShort, outlookText } from "./outlookText"
import "./outlook.css"

/**
 * Hava kartının konum hapında üçüncü bölüm: şemsiye + saat (dar kart) ya da cümlenin tamamı
 * (geniş kart, `outlook.css`). Tam cümle dar kartta da ekran okuyucuda; ayrıntı penceresinde
 * hep yazılı. Bilgi yoksa bölüm yok.
 */
export function OutlookChip({ outlook, timeFmt, f, stroke }) {
  const { t } = useLocale()
  if (!outlook) return null
  return (
    <span className="sky-weather__outlook">
      <HugeiconsIcon icon={outlookIcon(outlook)} strokeWidth={stroke} aria-hidden="true" />
      <span aria-hidden="true" className="sky-weather__outlook-short">
        {outlookShort(outlook, { t, timeFmt, f })}
      </span>
      <span className="sky-weather__outlook-full">{outlookText(outlook, { t, timeFmt, f })}</span>
    </span>
  )
}
