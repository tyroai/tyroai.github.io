import { lazy, Suspense, useEffect, useMemo, useSyncExternalStore } from "react"
import { useFeedFresh } from "@/hooks/useFeedUnread"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useFocusMode } from "@/lib/focusMode"
import {
  bellCounts,
  parseBellSeen,
  readBellNotice,
  readBellSeenRaw,
  specialKeysOf,
  subscribeBellSeen,
} from "@/lib/bellSeen"
import { useSpecialDaysData } from "../special-days/useSpecialDaysData"
import { BellButton } from "./BellButton"
import { bellHandoff, bellReady, markBellIntent } from "./bellIntent"

// Panelin kodu (liste, takvim, kişi kartı, hareket) ilk niyetten sonra iner; o ana kadar aynı
// görünüşte yer tutucu düğme çizilir.
const BellCenter = lazy(() => bellReady.then(() => import("./BellCenter")))
const none = () => null

function onFocus() {
  bellHandoff.focused = true
  markBellIntent()
}

// Odak başka bir öğeye geçtiyse devredilmez; yer tutucu kaldırılırken gelen bulanıklıkta
// (`relatedTarget` yok) odak yeni düğmeye taşınır.
function onBlur(e) {
  if (e.relatedTarget) bellHandoff.focused = false
}

function onClick() {
  bellHandoff.open = true
  markBellIntent()
}

/**
 * BİLDİRİM ÇANI — header'ın sağ üstü. Düğme ve rozet hemen çizilir; panel (`BellCenter`) ilk
 * niyette ya da boşta iner, açılış paketine girmez. Rozet GÖRÜLMEMİŞLERİN sayısı: paneli açınca
 * söner; özel günler yeni günde, Keşfet yeni bildirimde, bekleyen soru yeni soruda döner
 * (`lib/bellSeen.js`). Keşfet'i açamayan kişide Keşfet bölümü yok. Odak modunda sayı susar.
 * Kurallar: `docs/features/ozel-gunler.md` › Bildirim çanı.
 */
export function BellPopover() {
  // Odak modunda sayı susar (macOS'un Odak filtresi gibi); açınca bildirimler yerinde.
  const quiet = useFocusMode().until != null
  const data = useSpecialDaysData()
  const feedOpen = usePageAccess().feed
  const feed = useFeedFresh()
  const raw = useSyncExternalStore(subscribeBellSeen, readBellSeenRaw, none)
  const notice = useSyncExternalStore(subscribeBellSeen, readBellNotice, none)
  const seen = useMemo(() => parseBellSeen(raw), [raw])
  const specialKeys = useMemo(() => specialKeysOf(data.soon, data.people), [data.soon, data.people])
  const counts = bellCounts({ day: data.todayIso, specialKeys, notice, feed }, seen)
  const badge = quiet ? 0 : counts.total

  useEffect(() => {
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(markBellIntent, { timeout: 5000 })
      : window.setTimeout(markBellIntent, 3000)
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle)
      else window.clearTimeout(idle)
    }
  }, [])

  return (
    <Suspense
      fallback={
        <BellButton
          badge={badge}
          onPointerEnter={markBellIntent}
          onFocus={onFocus}
          onBlur={onBlur}
          onClick={onClick}
        />
      }
    >
      <BellCenter
        badge={badge}
        data={data}
        feed={feed}
        feedOpen={feedOpen}
        notice={notice}
        specialKeys={specialKeys}
      />
    </Suspense>
  )
}
