import { causeText, withCause } from "@/lib/causeText"
import { notify } from "@/lib/notify"

/**
 * To Do işlemi düştü: kısa başlık + (varsa) neden cümlesi ve BT'ye iletilecek kod.
 * `res`: Graph sonucu (`detail`, `lib/graph.ts`); yoksa yalnız başlık.
 */
export function failToast(t, res, key = "todo.saveFailed") {
  notify.error(t(key), { description: withCause("", causeText(t, res?.detail)) || undefined })
}
