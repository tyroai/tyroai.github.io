import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { resolveTargets } from "./tourGeometry"
import { markSeen, pendingSteps, tourState } from "./tourStore"

const START_DELAY_MS = 1200
const REPLAY_DELAY_MS = 400
const POLL_MS = 800
// Hedefler gelene dek en çok ~8 sn bakılır.
const REPLAY_TRIES = 10
// Tur ilk adımından başlar: o adımın hedefi henüz çizilmediyse (karşılama kartı sahne seçicisinden
// sonra geliyor) beklenir; yoksa tur ikinci adımdan açılıp ilkini hiç göstermiyordu.
const startsAtFirst = (steps, all) => steps.length > 0 && steps[0].id === all[0]?.id

// Aynı anda TEK tur: Anasayfa turu sürerken düzenleme turu ya da formun ipuçları bekler.
let active = null
export const claimTour = (id) => (active && active !== id ? false : ((active = id), true))
export const releaseTour = (id) => {
  if (active === id) active = null
}

// Açık bir pencere (Yenilikler, onay, geri sayım…) varken tur başlamaz: ikinci karartma ilkinin
// düğmelerini erişilmez kılardı. Formun ipuçları kendi penceresinin içinde: `insideDialog`.
const dialogOpen = () => Boolean(document.querySelector('[role="dialog"][data-state="open"]'))

// Başlarken hedefi görünen adımlar: sayaç baştan doğru olsun ("3 / 6"dan "5 / 6"ya atlamasın).
const visibleSteps = (steps) => steps.filter((step) => resolveTargets(step).length > 0)

/**
 * Turun ne zaman açılacağı: `{ steps, delta, replay } | null` ve kapatıcı.
 * - İlk kez (ya da sürüm büyümüşse yalnız yeni adımlarla, `delta`) — `when` doğru olunca, sayfa
 *   oturduktan sonra, açık pencere ve başka tur yokken. Depo kapalıysa ya da turlar kapalıysa hiç.
 *   Görünen adımı yoksa açılmaz ve görüldü sayılmaz (sayfa henüz boş ya da hata durumunda).
 * - Adreste `?tour=<id>` (sayfanın turu için `?tour=1` de): bütün adımlarla yeniden; parametre
 *   adreste kalmaz (yenileyince tur tekrar açılmasın).
 * Görüldü damgası tur AÇILIRKEN yazılır. Tanımı olmayan kimlikte (`def` yok) hiçbir şey olmaz.
 */
export function useTourTrigger(id, def, { when = true, page = false, insideDialog = false } = {}) {
  const [params, setParams] = useSearchParams()
  const asked = params.get("tour")
  const replay = asked === id || (page && asked === "1")
  const [run, setRun] = useState(null)
  const [replaying, setReplaying] = useState(false)

  useEffect(() => {
    if (!when || replay || replaying || !def) return undefined
    const { writable, off, seen } = tourState()
    if (!writable || off) return undefined
    const pending = pendingSteps(def, Number(seen[id]) || 0)
    if (!pending) {
      if ((Number(seen[id]) || 0) < def.version) markSeen(id, def.version)
      return undefined
    }
    let timer
    let tries = 0
    const attempt = () => {
      if ((!insideDialog && dialogOpen()) || !claimTour(id)) {
        timer = setTimeout(attempt, POLL_MS)
        return
      }
      const steps = visibleSteps(pending.steps)
      if (!startsAtFirst(steps, pending.steps) && tries < REPLAY_TRIES) {
        releaseTour(id)
        tries += 1
        timer = setTimeout(attempt, POLL_MS)
        return
      }
      if (!steps.length) {
        releaseTour(id)
        return
      }
      markSeen(id, def.version)
      setRun({ ...pending, steps, replay: false })
    }
    timer = setTimeout(attempt, def.delay ?? START_DELAY_MS)
    return () => clearTimeout(timer)
  }, [id, def, when, replay, replaying, insideDialog])

  // Yeniden göster: istek adresten hemen silinir (yenileyince tur tekrar açılmasın), tur kısa bir
  // beklemeyle açılır — hedefler yeni çizilmiş olabilir.
  useEffect(() => {
    if (!replay || !when || !def) return
    setParams(
      (p) => {
        const next = new URLSearchParams(p)
        next.delete("tour")
        return next
      },
      { replace: true },
    )
    // eslint-disable-next-line react-hooks/set-state-in-effect -- adresin isteği bir kez tüketiliyor
    setReplaying(true)
  }, [replay, when, def, setParams])

  // Hedefler henüz çizilmediyse (sayfanın parçası yavaş iniyor) birkaç kez daha bakılır: önce
  // 0,4 sn'de hedef yoksa tur sessizce hiç açılmıyordu ("Rehber turları"ndan Anasayfa).
  useEffect(() => {
    if (!replaying || !when) return undefined
    let tries = 0
    let timer
    const attempt = () => {
      const steps = visibleSteps(def.steps)
      if (!startsAtFirst(steps, def.steps) && tries < REPLAY_TRIES) {
        tries += 1
        timer = setTimeout(attempt, POLL_MS)
        return
      }
      setReplaying(false)
      if (!steps.length || !claimTour(id)) return
      markSeen(id, def.version)
      setRun({ steps, delta: false, replay: true })
    }
    timer = setTimeout(attempt, REPLAY_DELAY_MS)
    return () => clearTimeout(timer)
  }, [replaying, when, id, def])

  // Kimliği sabit: koşucunun ölçüm efekti her çizimde baştan kurulmasın (kaydırma zıplardı).
  const close = useCallback(() => {
    releaseTour(id)
    setRun(null)
  }, [id])
  return [run, close]
}
