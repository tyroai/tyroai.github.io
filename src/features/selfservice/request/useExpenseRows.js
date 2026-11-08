import { useEffect, useRef, useState } from "react"
import { applySlot } from "@/lib/promptTemplates"
import { newExpenseRow, valuesChanged } from "@/lib/requestForm"
import { carryOver, insertAt } from "@/features/selfservice/lib/requestFormItems"

export const MAX_ROWS = 20
/**
 * Bir masrafa en çok bu kadar fiş (hepsi masrafın başlığına eklenir): kalem sınırıyla aynı —
 * her kaleme bir fiş sığar; kalem sınırı değişirse fiş sınırı da onunla değişir.
 */
export const MAX_RECEIPTS = MAX_ROWS
let seq = 0
const nextId = () => `r${++seq}`
const thumbUrl = (file) => (file.type.startsWith("image/") ? URL.createObjectURL(file) : null)
const revoke = (f) => f.url && URL.revokeObjectURL(f.url)

/**
 * Masraf kalemleri ve fişleri. Fişler KALEMİN değil MASRAFIN: ERP'de masrafın başlığına eklenir
 * (HR MCP `attach_expense_receipt`), bu yüzden tek liste (`receipts`, en çok `MAX_RECEIPTS`).
 * Telefonda bir anda tek kalem açık (`active`), ötekiler tek satır özet; masaüstü tabloda hepsi
 * açık, isteğe bağlı alanlar kalem kalem "Ayrıntı"da (`details`). Yeni ya da kopyalanan kalem
 * açılır. Silinen kalem ve kaldırılan fiş geri alınabilir (`remove` → `restore`, `removeReceipt`
 * → `restoreReceipt`); bu yüzden fişlerin ön izleme adresi ancak form kapanınca bırakılır.
 * `initial`: taslaktan ya da sohbetteki karttan dönen form (`{ rows: [değerler], receipts:
 * [{ file, rotate }] }`). Fişin `rotate`i (0 · 90 · 180 · 270) gönderimde görsele uygulanır.
 */
export function useExpenseRows(initial = null) {
  const [rows, setRows] = useState(() =>
    initial?.rows?.length
      ? initial.rows.slice(0, MAX_ROWS).map((values) => ({ id: nextId(), values: { ...values } }))
      : [newExpenseRow(nextId())],
  )
  const [active, setActive] = useState(() => rows[0].id)
  const [details, setDetails] = useState(() => new Set())
  const [receipts, setReceipts] = useState(() =>
    (initial?.receipts ?? [])
      .slice(0, MAX_RECEIPTS)
      .map(({ file, rotate = 0 }) => ({ id: nextId(), file, url: thumbUrl(file), rotate })),
  )

  const live = useRef(receipts)
  // Kaldırılan fişler: geri alınabilsin diye adresleri form kapanana dek durur.
  const dropped = useRef([])
  useEffect(() => {
    live.current = receipts
  }, [receipts])
  // Adresler form kalkınca bir tur sonra bırakılır; bileşen hemen geri takılırsa (geliştirmede
  // StrictMode) iptal: taslaktan dönen fişlerin önizlemesi kırılmasın.
  const release = useRef(0)
  useEffect(() => {
    clearTimeout(release.current)
    const all = live
    const gone = dropped
    return () => {
      release.current = setTimeout(() => {
        all.current.forEach(revoke)
        gone.current.forEach(revoke)
      }, 0)
    }
  }, [])

  const patch = (id, fn) => setRows((rs) => rs.map((r) => (r.id === id ? fn(r) : r)))
  const withValues = (id, fn) => patch(id, (r) => ({ ...r, values: fn(r.values) }))
  const insert = (at, row) => {
    if (rows.length >= MAX_ROWS) return null
    setRows((rs) => insertAt(rs, at, row))
    setActive(row.id)
    return row.id
  }

  return {
    rows,
    active,
    activate: setActive,
    details,
    // `open` verilmezse açık/kapalı değişir.
    showDetails: (id, open) =>
      setDetails((d) => {
        const next = new Set(d)
        if (open ?? !d.has(id)) next.add(id)
        else next.delete(id)
        return next
      }),
    set: (id, name, value) => withValues(id, (v) => applySlot("expense", v, name, value).values),
    addSlot: (id, field) =>
      withValues(id, (v) => ({ ...v, [field.name]: field.slot.addDefault(v) })),
    removeSlot: (id, name) =>
      withValues(id, (v) => {
        const next = { ...v }
        delete next[name]
        return next
      }),
    /**
     * Birden çok kalemi sona ekler (Excel'den yapıştırma): `list` kalemlerin değerleri (eksik alan
     * yeni kalemin varsayılanından). Tek ve hiç dokunulmamış kalem varsa onun yerine geçer. Sınırı
     * aşan düşer. Dönüş `{ ids, skipped, prev }` — `prev` geri almak için (`restoreRows`).
     */
    appendRows: (list) => {
      const blank = rows.length === 1 && !valuesChanged(newExpenseRow("x").values, rows[0].values)
      const base = blank ? [] : rows
      const room = Math.max(0, MAX_ROWS - base.length)
      const take = list.slice(0, room).map((values) => {
        const fresh = newExpenseRow(nextId())
        return { ...fresh, values: { ...fresh.values, ...values } }
      })
      if (take.length) {
        setRows([...base, ...take])
        setActive(take[0].id)
      }
      return { ids: take.map((r) => r.id), skipped: list.length - take.length, prev: rows }
    },
    /**
     * Fişten okunan kalem (`expense/receipts/useReceiptReading`): `id` kalemi varsa (boş kalem)
     * değerleri `merge(eski)` ile katılır; yoksa yeni kalem olur — `before` kalemi varsa onun
     * önüne (fişlerin sırası korunsun), yoksa sona. Sınır doluysa eklenmez.
     */
    placeRow: (id, merge, before = null) =>
      setRows((rs) => {
        if (rs.some((r) => r.id === id))
          return rs.map((r) => (r.id === id ? { ...r, values: merge(r.values) } : r))
        if (rs.length >= MAX_ROWS) return rs
        const fresh = newExpenseRow(id)
        const row = { ...fresh, values: merge(fresh.values) }
        const at = before ? rs.findIndex((r) => r.id === before) : -1
        return insertAt(rs, at < 0 ? rs.length : at, row)
      }),
    /** `appendRows`dan önceki kalemlere döner. */
    restoreRows: (prev) => {
      if (!prev?.length) return
      setRows(prev)
      setActive(prev[0].id)
    },
    append: () => {
      const fresh = newExpenseRow(nextId())
      fresh.values = carryOver(fresh.values, rows[rows.length - 1].values)
      return insert(rows.length, fresh)
    },
    /** `id` kaleminin hemen altına yeni kalem (tarih ve para birimi o kalemden); 20'de null. */
    insertAfter: (id) => {
      const at = rows.findIndex((r) => r.id === id)
      if (at < 0) return null
      const fresh = newExpenseRow(nextId())
      fresh.values = carryOver(fresh.values, rows[at].values)
      return insert(at + 1, fresh)
    },
    duplicate: (id) => {
      const at = rows.findIndex((r) => r.id === id)
      return insert(at + 1, newExpenseRow(nextId(), rows[at]))
    },
    /** Kalemi siler; dönüş `{ row, at }` (geri almak için `restore`) ya da tek kalemde null. */
    remove: (id) => {
      if (rows.length < 2) return null
      const at = rows.findIndex((r) => r.id === id)
      if (at < 0) return null
      const row = rows[at]
      if (active === id) setActive(rows[at > 0 ? at - 1 : 1].id)
      setRows((rs) => rs.filter((r) => r.id !== id))
      return { row, at }
    },
    /** Silinen kalemi yerine koyar (sınır dolduysa koymaz); kalem açılır. */
    restore: (entry) => {
      if (!entry?.row) return
      setRows((rs) =>
        rs.length >= MAX_ROWS || rs.some((r) => r.id === entry.row.id)
          ? rs
          : insertAt(rs, Math.min(entry.at, rs.length), entry.row),
      )
      setActive(entry.row.id)
    },
    receipts,
    /** Fişleri masrafa ekler (en çok `MAX_RECEIPTS`); dönüş sığmayan fiş sayısı. */
    addReceipts: (files) => {
      const room = Math.max(0, MAX_RECEIPTS - receipts.length)
      const take = files.slice(0, room)
      if (take.length)
        setReceipts((list) => [
          ...list,
          ...take.map((file) => ({ id: nextId(), file, url: thumbUrl(file), rotate: 0 })),
        ])
      return files.length - take.length
    },
    /** Fişi kaldırır; dönüş geri almak için `{ file, at }` (bulunamazsa null). */
    removeReceipt: (fileId) => {
      const at = receipts.findIndex((f) => f.id === fileId)
      if (at < 0) return null
      dropped.current.push(receipts[at])
      setReceipts((list) => list.filter((f) => f.id !== fileId))
      return { file: receipts[at], at }
    },
    /** Fişi çeyrek tur döndürür (`step` 90 ya da -90): önizleme ve gönderilen görsel düzelir. */
    rotateReceipt: (fileId, step = 90) =>
      setReceipts((list) =>
        list.map((f) =>
          f.id === fileId ? { ...f, rotate: ((((f.rotate ?? 0) + step) % 360) + 360) % 360 } : f,
        ),
      ),
    /** Kaldırılan fişi yerine koyar (sınır dolduysa koymaz). */
    restoreReceipt: (entry) => {
      if (!entry?.file) return
      setReceipts((list) =>
        list.length >= MAX_RECEIPTS || list.some((f) => f.id === entry.file.id)
          ? list
          : insertAt(list, Math.min(entry.at, list.length), entry.file),
      )
    },
  }
}
