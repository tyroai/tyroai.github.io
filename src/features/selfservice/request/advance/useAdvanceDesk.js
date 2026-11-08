import { useMemo, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { useToday } from "@/hooks/useToday"
import { advancePatch, lastCompany, recentAdvances } from "@/features/selfservice/lib/advanceHints"
import { locationLabel, matchLocation } from "@/lib/advanceLocations"
import { formatMoney } from "@/lib/amountParse"
import { capFirst } from "../formUi"
import { purposeIcon, purposeTone } from "./advanceLooks"
import { useAdvanceHints } from "./useAdvanceHints"

/**
 * Avans formunun masası: öneriler (takvimden yolculuk, önceki üç avans), uygulanınca "Geri al" ve
 * özetin okuduğu ipuçları. Form kabı (`RequestDialog`) bir kez kurar, çünkü öneriler telefonda
 * çekmecenin üst satırında (`PastAdvances`), masaüstünde ve yatay telefonda alanların başında
 * (`Suggestions`) durur — ikisi aynı durumu paylaşır. `enabled` false (izin, masraf): hiçbir şey
 * istenmez. Dönüş: `suggest` (iki bileşenin ortak girdisi), `available` (gösterecek bir şey var),
 * `hints`, `today`, `company` (son avansın şirketi).
 */
export function useAdvanceDesk({ form, advances, enabled }) {
  const { t, locale } = useLocale()
  const today = useToday()
  const hints = useAdvanceHints({ advances, today, enabled })
  const { values } = form
  // Uygulanan önerinin önceki değerleri: "Geri al" yalnız onları geri koyar.
  const [undo, setUndo] = useState(null)

  const apply = (patch) => {
    const keys = Object.keys(patch).filter((k) => patch[k] !== values[k])
    if (!keys.length) return
    setUndo({ prev: Object.fromEntries(keys.map((k) => [k, values[k]])), n: keys.length })
    form.patch(Object.fromEntries(keys.map((k) => [k, patch[k]])))
  }
  const undoApply = () => {
    if (undo) form.patch(undo.prev)
    setUndo(null)
  }

  const { last, trip } = hints
  // Önceki avanslar (en çok üç, aynı içerik bir kez): çipte amaç · yer · tutar.
  const past = useMemo(
    () =>
      (enabled ? recentAdvances(advances) : []).map((r) => {
        const code = matchLocation(r.location)
        return {
          id: r.id,
          record: r,
          icon: purposeIcon(r.purposeKey),
          tone: purposeTone(r.purposeKey),
          text: [
            r.purposeKey && capFirst(t(`myspace.purpose.${r.purposeKey}`), locale),
            code ? locationLabel(t, code) : r.location,
            r.amount > 0 && formatMoney(r.amount, r.currency || "TRY", locale),
          ]
            .filter(Boolean)
            .join(" · "),
        }
      }),
    [enabled, advances, t, locale],
  )
  // Takvimden öneri: yer yalnız lokasyon listesindeyse dolar; değiştireceği bir şey yoksa çip yok.
  const tripPatch = trip
    ? { purpose: trip.purpose, ...(trip.destination && { destination: trip.destination }) }
    : null
  const tripUseful = tripPatch && Object.keys(tripPatch).some((k) => tripPatch[k] !== values[k])

  const suggest = {
    trip: tripUseful ? trip : null,
    past,
    onTrip: () => apply(tripPatch),
    onPast: (id) => apply(advancePatch(past.find((p) => p.id === id)?.record, locale)),
    filled: undo?.n ?? 0,
    onUndo: undoApply,
  }
  return {
    today,
    hints,
    company: lastCompany(last),
    suggest,
    available: Boolean(suggest.trip || past.length || suggest.filled),
  }
}
