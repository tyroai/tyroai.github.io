import { STATUS } from "@/lib/graph"
import { sanitizeHorizon } from "@/lib/horizon"
import {
  fetchListMilestones,
  fetchTodoLists,
  resetHorizonQuery,
} from "@/features/widgets/lib/horizonSource"
import { mapPool } from "@/lib/todo"
import { onTodoChanged } from "@/lib/todoSync"
import { onSessionClear } from "@/lib/sessionCache"

/**
 * Ufukta'nın deposu — panodaki kart, header'daki pencere ve header'daki kısa bilgi aynı veriyi
 * paylaşır (tek okuma). Ayar bu tarayıcıda: yalnız liste kimlikleri (`tyro-horizon-v1`), görev
 * içeriği diske yazılmaz. Görevler bellekte, hesap anahtarlı; çıkışta düşer
 * (`lib/sessionCache`,
 * `clearHorizonCache`). Liste başına önbellek: bir liste eklemek yalnız onu sorar. 5 dk tazelik;
 * To Do başka yüzeyden değişince bayat sayılır, bir sonraki açılışta ya da sekmeye dönüşte okunur.
 */
const KEY = "tyro-horizon-v1"
export const FRESH_MS = 5 * 60_000
const POOL = 2

function readSettings() {
  try {
    return sanitizeHorizon(JSON.parse(localStorage.getItem(KEY) ?? "null"))
  } catch {
    return sanitizeHorizon(null)
  }
}

const empty = (account = null) => ({
  account,
  status: "idle",
  detail: "",
  lists: null,
  listsAt: 0,
  byList: {},
})

let settings = typeof localStorage === "undefined" ? sanitizeHorizon(null) : readSettings()
let data = empty()
let busy = null
let snap = { settings, data }
const subs = new Set()

function emit() {
  snap = { settings, data }
  for (const fn of subs) fn()
}

export function subscribeHorizon(fn) {
  subs.add(fn)
  return () => subs.delete(fn)
}

export const horizonSnapshot = () => snap

export function setHorizonSettings(next) {
  settings = sanitizeHorizon({ ...settings, ...next })
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // Gizli pencere: ayar bu oturumla sınırlı kalır.
  }
  emit()
}

export function clearHorizonCache() {
  data = empty()
  busy = null
  resetHorizonQuery()
  emit()
}
onSessionClear(clearHorizonCache)

// Başka yüzey (To-Do sayfası, Bugünün odağı) yazdıysa önbellek bayat.
onTodoChanged((source) => {
  if (source === "horizon" || !data.lists) return
  const byList = Object.fromEntries(
    Object.entries(data.byList).map(([id, entry]) => [id, { ...entry, at: 0 }]),
  )
  data = { ...data, listsAt: 0, byList }
  emit()
})

const stale = (at, now) => now - at > FRESH_MS

function needsList(id, now, force) {
  const entry = data.byList[id]
  return force || !entry || stale(entry.at, now) || (settings.done && !entry.withDone)
}

/** Eksik ya da bayat olanı okur; aynı anda tek okuma (ikinci çağıran onu bekler, sonra yeniden bakar). */
export function loadHorizon(instance, account, { force = false } = {}) {
  const who = account?.homeAccountId
  if (!who) return Promise.resolve()
  if (data.account !== who) {
    data = empty(who)
    busy = null
  }
  if (busy) return busy.then(() => (force ? undefined : loadHorizon(instance, account)))
  const now = Date.now()
  const listsDue = force || !data.lists || stale(data.listsAt, now)
  if (!listsDue && !settings.lists.some((id) => needsList(id, now, false))) return Promise.resolve()
  const run = (async () => {
    if (!data.lists) {
      data = { ...data, status: "loading" }
      emit()
    }
    let lists = data.lists
    if (listsDue) {
      const res = await fetchTodoLists(instance, account)
      if (data.account !== who) return
      if (res.status !== STATUS.ready) {
        // Elde veri varsa kart onunla kalır; yoksa izin yok ya da ulaşılamıyor.
        if (!data.lists) {
          const status = res.status === STATUS.error ? "error" : "denied"
          data = { ...data, status, detail: res.detail ?? "" }
          emit()
        }
        return
      }
      lists = res.lists
      data = { ...data, lists, listsAt: Date.now() }
    }
    const due = lists.filter((l) => settings.lists.includes(l.id) && needsList(l.id, now, force))
    const withDone = settings.done
    const results = await mapPool(due, POOL, (l) =>
      fetchListMilestones(instance, account, l, { done: withDone }),
    )
    if (data.account !== who) return
    const byList = { ...data.byList }
    results.forEach((r, i) => {
      const id = due[i].id
      byList[id] = r.failed
        ? { at: 0, failed: true, tasks: byList[id]?.tasks ?? [] }
        : { at: Date.now(), withDone, tasks: r.tasks }
    })
    data = { ...data, status: "ready", detail: "", byList }
    emit()
  })()
  const task = run.finally(() => {
    if (busy === task) busy = null
  })
  busy = task
  return task
}

function patchList(listId, fn) {
  const entry = data.byList[listId]
  if (!entry) return
  data = { ...data, byList: { ...data.byList, [listId]: { ...entry, tasks: fn(entry.tasks) } } }
  emit()
}

/** İyimser değişiklik: tek hedef. */
export const patchMilestone = (listId, id, fn) =>
  patchList(listId, (tasks) => tasks.map((x) => (x.id === id ? fn(x) : x)))

export const insertMilestone = (listId, item) => patchList(listId, (tasks) => [...tasks, item])

export const dropMilestone = (listId, id) =>
  patchList(listId, (tasks) => tasks.filter((x) => x.id !== id))
