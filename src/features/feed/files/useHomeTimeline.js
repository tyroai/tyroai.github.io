import { useEffect, useMemo, useRef } from "react"
import { mergeTimeline } from "@/features/feed/lib/mailAttachments"
import { useAttachmentDownload } from "./useAttachmentDownload"

// Açılışta liste ayın başını geçene dek kendiliğinden inen en çok sayfa; sonrası "Daha fazla".
const AUTO_PAGES = 3
const noop = async () => {}

const monthStart = (now) => {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  d.setDate(1)
  return d.getTime()
}

/**
 * "Tümü"nün zaman çizgisi: son dosyalar + e-posta ekleri (`mergeTimeline`). "Bu ay" tam ve
 * "Daha eski"nin başı görünsün diye kesim ayın başından yeniyse sıradaki sayfa kendiliğinden
 * yüklenir (yenileme başına en çok `AUTO_PAGES`). Ekler okunamazsa liste yalnız dosyalarla kalır.
 */
export function useHomeTimeline({ recent, mail, now, nonce }) {
  const mailReady = mail?.status === "ready"
  const mailItems = mailReady ? mail.items : null
  const mailMore = mailReady && Boolean(mail.more)
  const filesMore = Boolean(recent.moreAvailable && !recent.capReached)
  const line = useMemo(
    () => mergeTimeline(recent.items, mailItems, { filesMore, mailMore }),
    [recent.items, mailItems, filesMore, mailMore],
  )
  const loadingMore = Boolean(recent.loadingMore || mail?.loadingMore)
  const loadMore = line.next === "mail" ? mail.more : line.next === "files" ? recent.loadMore : null
  // İlk açılışta ekler de gelsin: liste bir kez çizilsin, sonradan araya satır girmesin.
  const pending = mail?.status === "loading"
  // Yenileme yoldayken eski veriye sayfa eklenmez (yeni sonuç onu ezerdi).
  const settled = recent.status === "ready" && recent.nonce === nonce && !pending && !mail?.stale
  const floor = monthStart(now)

  // `busy`: istek yoldayken efekt yeniden koşsa da (StrictMode) aynı sayfa iki kez istenmez.
  const auto = useRef({ nonce, n: 0, busy: false })
  useEffect(() => {
    if (auto.current.nonce !== nonce) auto.current = { nonce, n: 0, busy: false }
    const a = auto.current
    if (!settled || loadingMore || !loadMore || a.busy || a.n >= AUTO_PAGES || line.cut < floor)
      return
    a.n += 1
    a.busy = true
    Promise.resolve(loadMore()).finally(() => {
      a.busy = false
    })
  }, [settled, loadingMore, loadMore, line.cut, floor, nonce])

  const { busyKey, run } = useAttachmentDownload(mail?.download ?? noop)
  return {
    items: line.items,
    pending,
    hasMore: Boolean(loadMore),
    loadMore,
    loadingMore,
    hasMail: line.items.some((it) => it.kind === "attachment"),
    busyKey,
    download: run,
  }
}
