// Düzenlemenin yazma yolu. İşlem planın kopyasına uygulanır ve sürüm etiketiyle (If-Match)
// yazılır; başkası arada kaydettiyse (412) taze plan okunur, aynı işlem onun üstüne bir kez
// daha uygulanır. Geri al yığını ve anlık görüntü saati bellekte; çıkışta temizlenir.
import { createSnapshot, readPlan, RM_CONFLICT, writePlan } from "../docStore"
import { DOC_FORMAT } from "../importPlan"
import { getRmEntry, onRmClear, setRmEntry } from "@/lib/rm/rmCache"

const UNDO_MAX = 20
// Geçmişe yeni anlık görüntü en çok bu aralıkla düşer (her kayıtta 100 KB'lık satır olmasın).
const SNAP_EVERY_MS = 30 * 60 * 1000

let stack = []
let lastSnap = 0
const listeners = new Set()

function emit() {
  for (const fn of listeners) fn(stack.length)
}

onRmClear(() => {
  stack = []
  lastSnap = 0
  emit()
})

export function subscribeUndo(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function undoDepth() {
  return stack.length
}

function applyTo(doc, fn) {
  const next = structuredClone(doc)
  fn(next.format === DOC_FORMAT ? next.plan : next)
  return next
}

function push(item) {
  stack = [...stack.slice(-(UNDO_MAX - 1)), item]
  emit()
}

const isDev = (entry) => entry?.meta?.id === "dev"

// Kayıtlar sırayla: art arda tıklamalar (iş listesi) aynı sürüm etiketiyle yarışmasın.
let queue = Promise.resolve()

/**
 * `fn(plan)` taslağı yerinde değiştirir; `note` geçmişe düşen anlık görüntünün notu. Döner:
 * { merged } — true ise değişiklik, arada başkasının kaydettiği planın üstüne uygulandı.
 */
export function commitEdit(fn, label, note = label) {
  const run = queue.then(() => write(fn, label, note))
  queue = run.catch(() => {})
  return run
}

async function write(fn, label, note) {
  const cur = getRmEntry()
  if (!cur?.doc) throw new Error("rm: no plan")
  if (isDev(cur)) {
    const next = applyTo(cur.doc, fn)
    setRmEntry({ meta: { ...cur.meta, modifiedOn: new Date().toISOString() }, doc: next })
    push({ label, before: cur.doc, etag: null })
    return { merged: false }
  }
  if (Date.now() - lastSnap > SNAP_EVERY_MS) {
    try {
      await createSnapshot(cur.doc, note)
      lastSnap = Date.now()
    } catch {
      // Anlık görüntü güvenlik ağı; alınamazsa düzenleme yine yazılır (geri al bellekte).
    }
  }
  let base = cur
  let merged = false
  for (;;) {
    const next = applyTo(base.doc, fn)
    try {
      const meta = await writePlan(base.meta.id, base.meta.etag, next)
      setRmEntry({ meta, doc: next })
      push({ label, before: base.doc, etag: meta.etag })
      return { merged }
    } catch (err) {
      if (err.code !== RM_CONFLICT || merged) throw err
      merged = true
      const fresh = await readPlan()
      if (!fresh?.doc) throw err
      base = fresh
    }
  }
}

/**
 * Son düzenlemeyi geri alır. Plan o düzenlemeden sonra değiştiyse (başkası kaydetti) ezmez:
 * RM_CONFLICT fırlatır. Döner: geri alınan işlemin etiketi ya da null.
 */
export async function undoLast() {
  const item = stack.at(-1)
  if (!item) return null
  const cur = getRmEntry()
  if (isDev(cur)) {
    setRmEntry({ meta: { ...cur.meta, modifiedOn: new Date().toISOString() }, doc: item.before })
  } else {
    if (cur?.meta?.etag !== item.etag) {
      const err = new Error("rm: plan changed since")
      err.code = RM_CONFLICT
      throw err
    }
    const meta = await writePlan(cur.meta.id, cur.meta.etag, item.before)
    setRmEntry({ meta, doc: item.before })
    // Bir önceki düzenlemenin "sonrası" şimdiki içerik: geri al zinciri sürsün.
    const prev = stack.at(-2)
    if (prev) prev.etag = meta.etag
  }
  stack = stack.slice(0, -1)
  emit()
  return item.label
}
