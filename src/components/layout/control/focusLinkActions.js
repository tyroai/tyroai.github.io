import { STATUS } from "@/lib/graph"
import { focusLinks, setApplied } from "./focusLinkStore"
import { clearPresence, createBlock, moveBlockEnd, setPresence } from "./graphTools"

const MIN = 60_000

/**
 * Bir bağı şimdi uygular ya da geri alır (anahtar Odak açıkken değişince de): takvim bloğu şimdiden
 * Odak'ın bitişine; Teams Rahatsız etmeyin aynı süreyle (süre bitince Teams kendisine döner).
 */
export async function applyLink(instance, account, name, on, until, subject) {
  const cur = focusLinks().applied ?? { until, eventId: null, presence: false }
  // İki bağ aynı anda uygulanır: yazarken en güncel izin üstüne (biri ötekini silmesin).
  const patch = (fields) => setApplied({ ...(focusLinks().applied ?? cur), ...fields })
  const now = Date.now()
  if (name === "calendar") {
    if (on && !cur.eventId) {
      const res = await createBlock(instance, account, {
        start: new Date(now),
        end: new Date(until),
        subject,
      })
      patch({ until, eventId: res.status === STATUS.ready ? res.data?.id : null })
    } else if (!on && cur.eventId) {
      await moveBlockEnd(instance, account, cur.eventId, new Date(now))
      patch({ eventId: null })
    }
  } else if (on) {
    const res = await setPresence(instance, account, "DoNotDisturb", (until - now) / MIN)
    patch({ until, presence: res.status === STATUS.ready })
  } else if (cur.presence) {
    await clearPresence(instance, account)
    patch({ presence: false })
  }
}
