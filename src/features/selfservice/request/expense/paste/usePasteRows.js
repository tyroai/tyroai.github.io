import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { isTabularText, parseExpensePaste } from "@/features/selfservice/lib/expensePaste"
import { focusCell } from "../table/gridFocus"

let seq = 0

/**
 * Excel'den (ya da Google Sheets'ten) yapıştırılan kalemler. `run(metin, sütun)`: metin tablo
 * gibiyse okunur (`features/selfservice/lib/expensePaste`), kalemler sona eklenir (tek ve boş kalemin yerine geçer,
 * 20'yi aşan düşer), odak ilk yeni kalemin ilk hücresine; dönüş true ise olay durdurulur (tek
 * değer alana olduğu gibi yapışır). İlk ekrandayken `onStart` kalemlere geçirir.
 *
 * Sonuç `last` (`{ key, added, limit, unreadable }`) alt şeritte 10 saniye durur; üstündeyken ya
 * da odak içindeyken süre işlemez (`useRowUndo` gibi). Geri alma yalnız yapıştırılan kalemleri
 * çıkarır: arada öteki kalemlerde yazılanlar yerinde kalır; hiç kalem kalmazsa yapıştırmadan
 * önceki boş kalem geri gelir.
 */
export function usePasteRows({ form, idBase, columns, onStart, ms = 10000 }) {
  const { locale } = useLocale()
  const [last, setLast] = useState(null)
  const [hold, setHold] = useState(false)
  // Geri alınacak kalemler: olayda okunur (çizimi beklemeden; Ctrl/⌘+Z hemen ardından da).
  const stash = useRef(null)
  const live = useRef(null)
  useLayoutEffect(() => {
    live.current = { form, columns, onStart, locale }
  })
  useEffect(() => {
    if (!last || hold) return
    const id = setTimeout(() => {
      stash.current = null
      setLast(null)
    }, ms)
    return () => clearTimeout(id)
  }, [last, hold, ms])

  const api = useMemo(() => {
    const clear = () => {
      stash.current = null
      setLast(null)
      setHold(false)
    }
    const run = (text, start = null) => {
      if (!isTabularText(text)) return false
      const { form, columns, onStart, locale } = live.current
      const got = parseExpensePaste(text, { columns: columns.visible, start, locale })
      const unreadable = got.skipped.filter((s) => s.reason === "unreadable").length
      if (!got.rows.length && !unreadable) return false
      if (got.rows.length) onStart?.()
      const res = got.rows.length
        ? form.expense.appendRows(got.rows)
        : { ids: [], skipped: 0, prev: null }
      stash.current = res.ids.length ? { ids: res.ids, prev: res.prev } : null
      setHold(false)
      setLast({ key: ++seq, added: res.ids.length, limit: res.skipped, unreadable })
      if (res.ids.length) focusCell(idBase, res.ids[0], columns.visible[0])
      return true
    }
    const undo = () => {
      const entry = stash.current
      if (!entry) return
      const { form, columns } = live.current
      const gone = new Set(entry.ids)
      const keep = form.expense.rows.filter((r) => !gone.has(r.id))
      const back = keep.length ? keep : entry.prev
      form.expense.restoreRows(back)
      clear()
      focusCell(idBase, back[back.length - 1]?.id, columns.visible[0])
    }
    return { run, undo, clear, setHold, canUndo: () => Boolean(stash.current) }
  }, [idBase])

  return useMemo(() => ({ ...api, last }), [api, last])
}
