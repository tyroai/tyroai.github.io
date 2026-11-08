import { useEffect, useRef, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { notify } from "@/lib/notify"
import { interruptsMuted } from "@/lib/quietMode"
import { askedToday, markAsked } from "./oofAsk"
import { removeOof, setUpOof } from "./oofActions"
import { rangeText } from "./oofText"
import { useOof } from "./useOof"

/**
 * Günde bir kez (TYRO açılınca, panelin parçası indiğinde): onaylı yaklaşan izin için otomatik yanıt
 * kurulmadıysa sorar ("Kur" hazır metinle planlar), TYRO'nun kurduğu yanıtın izni kalmadıysa
 * kaldırmayı sorar. Odak ve Sunum modunda sormaz. Soru cevaplanana kadar Denetim Merkezi'nin
 * şeridinde ve çanın listesinde bekler (`useOof` çana yazar). Çizmez.
 */
export function OofWatch() {
  const { t, locale } = useLocale()
  const [enabled] = useState(() => !askedToday(Date.now()))
  const oof = useOof({ enabled })
  const { ask } = oof
  const settled = enabled && oof.settled
  // Günde bir kez: soru çıktıktan sonra yeniden çalışmasın.
  const fired = useRef(false)

  useEffect(() => {
    if (!settled || fired.current) return
    fired.current = true
    markAsked(Date.now())
    if (!ask || interruptsMuted()) return
    if (ask.kind === "clear") {
      notify.info(t("control.oof.mismatch"), {
        duration: 20_000,
        action: { label: t("control.oof.remove"), onClick: () => removeOof(oof, t) },
      })
      return
    }
    notify.info(
      t("control.oof.askTitle", { range: rangeText(locale, ask.leave.start, ask.leave.end) }),
      {
        duration: 20_000,
        action: {
          label: t("control.oof.setUp"),
          onClick: () => setUpOof(oof, ask.leave, t, locale),
        },
      },
    )
  }, [settled, ask, oof, t, locale])
  return null
}
