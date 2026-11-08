import "@/lib/i18n/tour"
import { Suspense, lazy, useEffect } from "react"
import { TOURS } from "./tours"
import { releaseTour, useTourTrigger } from "./useTourTrigger"

// Koşucu yalnız tur açılınca iner (çoğu ziyarette hiç gerekmez); parça inmezse tur sessizce düşer,
// sayfa bozulmaz.
const TourRun = lazy(() =>
  import("./TourRun").then((m) => ({ default: m.TourRun })).catch(() => ({ default: () => null })),
)

/**
 * SAYFA TURU — karartma + delikler + kart (Anasayfa, Self Servis, Keşfet, To-Do, Chat, düzenleme
 * kipi). Tanımlar `tours.js`te, metinler `tour.<tur>.*`; ne zaman açılacağı `useTourTrigger`,
 * çizimi `TourRun`. Açık bir pencerenin İÇİNDEKİ ipuçları ayrı: `CoachTour`.
 *
 * ⚠️ **BENZER HEDEFLER TEK ADIMDA**: bir adım birden çok hedefi birlikte aydınlatır, madde madde
 * anlatır; görünür hedefi olmayan adım atlanır (telefonda yer değiştiren ya da hiç olmayan öğe).
 *
 * `page`: sayfanın asıl turu (`?tour=1` onu da açar) · `when`: yalnız bu durumda (ör. düzenleme kipi).
 */
export function Tour({ id, page = false, when = true }) {
  const def = TOURS[id]
  const [run, close] = useTourTrigger(id, def, { when, page })
  // Sayfadan çıkılırsa sıra serbest kalsın.
  useEffect(() => () => releaseTour(id), [id])
  if (!run || !when) return null
  return (
    <Suspense fallback={null}>
      <TourRun key={run.replay ? "replay" : "auto"} id={id} run={run} onClose={close} />
    </Suspense>
  )
}
