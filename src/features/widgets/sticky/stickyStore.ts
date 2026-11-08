/**
 * Yapışkan notların TEK durumu: pano kartı, çentiğin/tepsinin penceresi ve çentikteki sayı aynı
 * listeyi görür (`useSyncExternalStore`). Yazmalar iyimser: not hemen ekranda, OneNote'a arka
 * planda; düşerse geri alınır ve bildirilir. Silme 5 sn "Geri al"lı: süre dolunca OneNote'tan
 * silinir. Kişisel veri: çıkışta `onSessionClear` ile boşalır.
 *
 * Dev'de oturumsuz (`?devauth=1`) ya da en kötü veri kipinde OneNote'a gidilmez: bellek içi
 * örnek notlar (ekranı denemek için).
 */
import { useSyncExternalStore } from "react"
import { STATUS } from "@/lib/graphRequest"
import type { GraphStatus, MsalAccount, MsalInstance } from "@/lib/graphRequest"
import { onSessionClear } from "@/lib/sessionCache"
import { worstMode } from "@/dev/worstCase/mode"
import { cleanNote, colorOf, sortNotes, type StickyColor, type StickyNote } from "./lib/stickyNotes"
import { createNote, deleteNote, listNotes, updateNote } from "./lib/stickySource"
import { setStickyPeek } from "@/lib/stickyCount"

export interface StickyState {
  status: GraphStatus | "idle" | "loading"
  notes: StickyNote[]
  detail?: string
}

const COLORS_KEY = "tyro-widgets-sticky-v1"
const STALE_MS = 5 * 60_000

let state: StickyState = { status: "idle", notes: [] }
let loadedAt = 0
let inflight: Promise<void> | null = null
const listeners = new Set<() => void>()

const emit = (next: StickyState) => {
  state = next
  setStickyPeek(
    next.status === STATUS.ready
      ? {
          count: next.notes.length,
          top: next.notes.slice(0, 3).map((n) => ({ id: n.id, color: n.color })),
        }
      : null,
  )
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

onSessionClear(function clearStickyNotes() {
  loadedAt = 0
  emit({ status: "idle", notes: [] })
}, "stickyNotes")

function readColors(): Record<string, string> {
  try {
    const v = JSON.parse(window.localStorage.getItem(COLORS_KEY) ?? "{}")
    return v && typeof v === "object" ? v : {}
  } catch {
    return {}
  }
}

function writeColor(id: string, color: StickyColor | null) {
  try {
    const all = readColors()
    if (color) all[id] = color
    else delete all[id]
    window.localStorage.setItem(COLORS_KEY, JSON.stringify(all))
  } catch {
    // Depo kapalı: renk bu oturumda kalır.
  }
}

const fake = () => import.meta.env.DEV && typeof window !== "undefined"
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString()
function sampleNotes(): StickyNote[] {
  const mode = worstMode()
  if (mode === "empty") return []
  const base = [
    ["dev-st-1", "Fındık teklifi Cuma'ya\nUSD 7,40 · 120 ton", 5],
    ["dev-st-2", "Navlunu yeniden sor (Mersin)", 50],
    ["dev-st-3", "Ayşe'ye bütçe tablosunu ilet", 300],
  ] as const
  const long =
    mode === "worst"
      ? [
          [
            "dev-st-4",
            `${"Çok uzun bir yapışkan not satırı ".repeat(8)}\n\n${"ikinci paragraf ".repeat(20)}`,
            900,
          ] as const,
        ]
      : []
  return [...base, ...long].map(([id, text, min]) => ({
    id,
    text,
    color: colorOf(id, readColors()),
    modified: ago(min),
    webUrl: `https://tyrotech-my.sharepoint.example/onenote/${id}`,
  }))
}

interface Ctx {
  instance: MsalInstance
  account: MsalAccount
}
const isFake = (ctx: Ctx) => fake() && (!ctx.account || Boolean(worstMode()))

/** Listeyi yükler; `force` olmadan 5 dk tazeyse dokunmaz. */
export function loadStickyNotes(ctx: Ctx, force = false): Promise<void> {
  if (!force && state.status === STATUS.ready && Date.now() - loadedAt < STALE_MS)
    return Promise.resolve()
  if (inflight) return inflight
  if (isFake(ctx)) {
    loadedAt = Date.now()
    emit({ status: STATUS.ready, notes: sortNotes(sampleNotes()) })
    return Promise.resolve()
  }
  emit({ ...state, status: state.notes.length ? state.status : "loading" })
  inflight = listNotes(ctx.instance, ctx.account, readColors())
    .then((res) => {
      if (res.status === STATUS.ready) loadedAt = Date.now()
      // Bekleyen (henüz yazılmamış) notlar listeye eklenmeye devam eder.
      const pending = state.notes.filter((n) => n.pending)
      emit({
        status: res.status,
        notes: sortNotes([...pending, ...res.notes]),
        detail: res.detail,
      })
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

type Outcome = { ok: true } | { ok: false; status: string; detail?: string }

export async function addStickyNote(ctx: Ctx, raw: string, color?: StickyColor): Promise<Outcome> {
  const text = cleanNote(raw)
  if (!text) return { ok: false, status: "empty" }
  const tmp: StickyNote = {
    id: `tmp-${Date.now()}`,
    text,
    color: color ?? "sun",
    modified: new Date().toISOString(),
    pending: true,
  }
  emit({ ...state, status: STATUS.ready, notes: [tmp, ...state.notes] })
  if (isFake(ctx)) {
    const id = `dev-st-${Date.now()}`
    if (color) writeColor(id, color)
    emit({
      ...state,
      notes: state.notes.map((n) => (n.id === tmp.id ? { ...tmp, id, pending: false } : n)),
    })
    return { ok: true }
  }
  const res = await createNote(ctx.instance, ctx.account, text, readColors())
  if (res.status !== STATUS.ready || !res.note) {
    emit({ ...state, notes: state.notes.filter((n) => n.id !== tmp.id) })
    return { ok: false, status: res.status, detail: res.detail }
  }
  const note = res.note
  if (color) writeColor(note.id, color)
  emit({
    ...state,
    notes: state.notes.map((n) => (n.id === tmp.id ? { ...note, color: color ?? note.color } : n)),
  })
  return { ok: true }
}

export async function editStickyNote(ctx: Ctx, id: string, raw: string): Promise<Outcome> {
  const text = cleanNote(raw)
  const before = state.notes.find((n) => n.id === id)
  if (!before || !text || text === before.text) return { ok: true }
  const now = new Date().toISOString()
  emit({
    ...state,
    notes: sortNotes(state.notes.map((n) => (n.id === id ? { ...n, text, modified: now } : n))),
  })
  if (isFake(ctx)) return { ok: true }
  const res = await updateNote(ctx.instance, ctx.account, id, text)
  if (res.status === STATUS.ready) return { ok: true }
  emit({ ...state, notes: sortNotes(state.notes.map((n) => (n.id === id ? before : n))) })
  return { ok: false, status: res.status, detail: res.detail }
}

/** Renk yalnız bu tarayıcıda (OneNote'ta saklanacak alan yok). */
export function colorStickyNote(id: string, color: StickyColor) {
  writeColor(id, color)
  emit({ ...state, notes: state.notes.map((n) => (n.id === id ? { ...n, color } : n)) })
}

/**
 * Siler: not hemen listeden kalkar, OneNote'tan `delay` sonra silinir. Dönen `undo` süre
 * dolmadan çağrılırsa not geri gelir ve hiçbir şey silinmez.
 */
export function removeStickyNote(
  ctx: Ctx,
  id: string,
  { delay = 5000, onFail }: { delay?: number; onFail?: (o: Outcome) => void } = {},
): () => void {
  const note = state.notes.find((n) => n.id === id)
  if (!note) return () => {}
  emit({ ...state, notes: state.notes.filter((n) => n.id !== id) })
  const restore = () => emit({ ...state, notes: sortNotes([note, ...state.notes]) })
  const timer = setTimeout(async () => {
    if (isFake(ctx)) return
    const res = await deleteNote(ctx.instance, ctx.account, id)
    if (res.status === STATUS.ready) writeColor(id, null)
    else {
      restore()
      onFail?.({ ok: false, status: res.status, detail: res.detail })
    }
  }, delay)
  return () => {
    clearTimeout(timer)
    restore()
  }
}

export function useStickyNotes(): StickyState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  )
}
