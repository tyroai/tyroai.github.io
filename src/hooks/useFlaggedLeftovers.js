import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { useMsal } from "@azure/msal-react"
import { isMsalConfigured } from "@/lib/msal"
import { findLeftovers } from "@/lib/todoFlagged"
import { onSessionClear } from "@/lib/sessionCache"

/**
 * To-Do tablosundan, postası artık bayraklı olmayan işaretli e-posta
 * görevlerini çıkarır (karar `lib/todoFlagged.js`te). Sayfa, özet kartı ve
 * ayrıntı paneli aynı filtrelenmiş listeyi görür; `clean` görevleri To Do'dan da
 * siler (onay sayfada).
 *
 * ⚠️ Sonuç bellekte, hesap anahtarlı; çıkışta düşer (`lib/sessionCache`).
 * 60 sn tazelik ve sekmeye dönüşte bayatsa yeniden sorulur: Outlook'ta bayrağı
 * kaldırıp geri gelen kişi farkı hemen görsün. To Do görevleri değişmediyse
 * bile sorulur — kopan eşitlemede görev listesi zaten değişmiyor.
 */

let memo = null // { key, at, sig, ids }
const FRESH_MS = 60_000
const EMPTY = []
const listeners = new Set()

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
const snapshot = () => memo

export function clearFlaggedLeftovers() {
  memo = null
  for (const fn of listeners) fn()
}
onSessionClear(clearFlaggedLeftovers)

function accountOf(instance, key) {
  return instance.getAllAccounts().find((a) => a.homeAccountId === key) ?? null
}

export function useFlaggedLeftovers(board) {
  const { instance, accounts } = useMsal()
  const key = isMsalConfigured ? (accounts[0]?.homeAccountId ?? null) : null
  const listId = board.lists.find((l) => l.kind === "flagged")?.id ?? null
  const ready = board.status === "ready"
  // İçerik aynıysa dize de aynı: başka bir listedeki değişiklik yeniden sormaz.
  const sig = useMemo(
    () =>
      JSON.stringify(
        board.tasks
          .filter((x) => x.listId === listId && !x.done && !x.pending)
          .map((x) => [x.id, x.title]),
      ),
    [board.tasks, listId],
  )
  const snap = useSyncExternalStore(subscribe, snapshot, snapshot)
  const [nonce, setNonce] = useState(0)
  const [cleaning, setCleaning] = useState(false)

  useEffect(() => {
    if (!key || !listId || !ready) return undefined
    if (memo?.key === key && memo.sig === sig && Date.now() - memo.at < FRESH_MS) return undefined
    let cancelled = false
    const tasks = JSON.parse(sig).map(([id, title]) => ({ id, listId, title }))
    const known = new Set(memo?.key === key ? memo.ids : EMPTY)
    findLeftovers(instance, accountOf(instance, key), tasks, known).then((ids) => {
      if (cancelled || !ids) return
      memo = { key, at: Date.now(), sig, ids }
      for (const fn of listeners) fn()
    })
    return () => {
      cancelled = true
    }
  }, [key, listId, ready, sig, nonce, instance])

  useEffect(() => {
    if (!key || !listId) return undefined
    const onVisible = () => {
      if (document.hidden) return
      if (memo?.key !== key || Date.now() - memo.at > FRESH_MS) setNonce((n) => n + 1)
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [key, listId])

  const hidden = useMemo(() => new Set(snap?.key === key ? snap.ids : EMPTY), [snap, key])
  const tasks = useMemo(
    () => (hidden.size ? board.tasks.filter((x) => !hidden.has(x.id)) : board.tasks),
    [board.tasks, hidden],
  )
  const leftovers = useMemo(
    () => (hidden.size ? board.tasks.filter((x) => hidden.has(x.id)) : EMPTY),
    [board.tasks, hidden],
  )

  // "Yenile" bayrakları da yeniden sorar: Outlook'ta bayrağı kaldırıp yenileyen
  // kişi farkı beklemesin.
  const { refresh: refreshBoard, removeTask } = board
  const refresh = useCallback(() => {
    if (memo?.key === key) memo.at = 0
    setNonce((n) => n + 1)
    return refreshBoard()
  }, [key, refreshBoard])

  const clean = useCallback(async () => {
    setCleaning(true)
    // Sırayla (posta kutusunun eşzamanlılık sınırı); ilk retle durur, tek bildirim.
    for (const task of leftovers) if (!(await removeTask(task.id))) break
    setCleaning(false)
  }, [leftovers, removeTask])

  return { ...board, refresh, tasks, flagged: { leftovers, clean, cleaning } }
}
