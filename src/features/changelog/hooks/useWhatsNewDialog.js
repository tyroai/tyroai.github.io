import { useEffect, useMemo, useState } from "react"
import { useIsInGroup } from "@/hooks/useIsInGroup"
import { usePageAccess } from "@/hooks/usePageAccess"
import { ADMIN_GROUP_ID } from "@/lib/constants"
import { hasPendingAsk } from "@/lib/chatBus"
import { isReturningBrowser, readSeenId, writeSeenId } from "../entryText"
// Karar DİZİNDEN (`changelogMeta`, ~3,5 KB): pencere her açılışta bağlanıyor ve çoğu zaman açılmıyor;
// arşiv (~56 KB gz) yalnız açılacaksa iner (`loadEntries`).
import {
  entriesSince,
  hasEntry,
  latestEntryId,
  loadEntries,
  visibleEntries,
} from "@/data/changelogMeta"

/**
 * Girişteki Yenilikler penceresinin KARARI: açılsın mı, hangi kayıtlarla. Kurallar
 * `docs/features/yenilikler.md` › Pencere:
 * - Pencereyi `notify` işaretli kayıt açar, her yeni kayıt değil.
 * - İşaretsiz ama uygulamayı zaten kullanan tarayıcıya bir kez `catchup`; yeni kullanıcıda işaret
 *   sessizce kurulur.
 * - Park edilmiş "TYRO'ya sor" sorusu varsa açılmaz (kişi belirli bir iş için geldi).
 * - Yönetici cevabı gelmeden (`undefined`) hiçbir şey yazılmaz: yoksa yöneticiye özel kayıtlar
 *   duyurulmadan okunmuş sayılırdı.
 * - Okundu işareti pencerenin listesinden değil, sayfada görülebilen her şeyden (`marker`) yazılır.
 *
 * Döner: `[shown, setShown]` — `shown` `{ mode: "new" | "catchup", items }` ya da `null`.
 */
export function useWhatsNewDialog() {
  const adminVerdict = useIsInGroup(ADMIN_GROUP_ID)
  const isAdmin = adminVerdict === true
  const { canOpen } = usePageAccess()
  const [shown, setShown] = useState(null)

  // Pencerenin listesi düzeltmesiz; işaret sayfanın listesinden.
  const visible = useMemo(
    () => visibleEntries({ isAdmin, surface: "dialog", canOpen }),
    [isAdmin, canOpen],
  )
  const marker = useMemo(() => visibleEntries({ isAdmin, canOpen }), [isAdmin, canOpen])

  useEffect(() => {
    if (adminVerdict === undefined) return undefined
    const latest = latestEntryId(marker)
    if (!latest) return undefined
    let alive = true
    // İşaret ANCAK pencere açılınca yazılır: arşiv inmezse (çevrimdışı) bildirim kaybolmaz.
    const open = (mode, items) =>
      loadEntries(items)
        .then((full) => {
          if (!alive || !full.length) return
          setShown({ mode, items: full })
          writeSeenId(latest)
        })
        .catch(() => {})
    const stop = () => {
      alive = false
    }
    const seen = readSeenId()
    if (!seen) {
      if (isReturningBrowser() && visible.some((e) => e.notify)) {
        // Soru park edilmişse işaret de KURULMAZ: kurulsaydı yayın penceresi bir daha görünmezdi.
        if (hasPendingAsk()) return undefined
        open("catchup", visible)
        return stop
      }
      writeSeenId(latest)
      return undefined
    }
    if (seen === latest) return undefined
    const fresh = entriesSince(seen, visible)
    if (!fresh.length) {
      // Öksüz işaret (kayıt silinmiş) onarılır; soru KATALOĞA sorulur, süzülmüş listeye değil —
      // yalnız burada gizlenen kaydı silinmiş sanıp işareti geri çekmesin.
      if (!hasEntry(seen)) writeSeenId(latest)
      return undefined
    }
    if (!fresh.some((e) => e.notify)) return undefined
    if (hasPendingAsk()) return undefined
    open("new", fresh)
    return stop
  }, [visible, marker, adminVerdict])

  return [shown, setShown]
}
