import { useCallback, useMemo, useState } from "react"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import {
  defaultLayout,
  gridTemplate,
  moveColumn,
  normalizeLayout,
  reorderColumns,
  setShown,
  tableMinRem,
  visibleColumns,
} from "@/features/selfservice/lib/expenseColumns"

/**
 * Kişinin masraf ızgarası düzeni — yalnız bu tarayıcıda (envanter: `data/appMeta.js`). Kayıt
 * yalnız kişi sütunları değiştirince yazılır; yazılmamışsa her açılışta güncel varsayılan gelir.
 */
export const EXPENSE_COLUMNS_KEY = "tyro-expense-columns-v4"
// Önceki sürümün kaydı kişinin kendi seçimi: silinmez, yeni anahtara taşınır (`normalizeLayout`
// sonradan eklenen sütunu varsayılanıyla ekler). Daha eskileri ve taşınan kayıt envanterde yok:
// okurken silinir ("Tümünü temizle" görmez).
const PREVIOUS_KEY = "tyro-expense-columns-v3"
const OLD_KEYS = ["tyro-expense-columns-v1", "tyro-expense-columns-v2", PREVIOUS_KEY]
// Varsayılan düzenin görünür sütunları: ızgaranın pencereye sığma eşiği (`fitRem`).
const DEFAULT_VISIBLE = visibleColumns(defaultLayout())

function read() {
  try {
    const store = window.localStorage
    let raw = store.getItem(EXPENSE_COLUMNS_KEY)
    const previous = raw ? null : store.getItem(PREVIOUS_KEY)
    if (previous) {
      raw = JSON.stringify(normalizeLayout(JSON.parse(previous)))
      store.setItem(EXPENSE_COLUMNS_KEY, raw)
    }
    for (const key of OLD_KEYS) store.removeItem(key)
    return normalizeLayout(raw ? JSON.parse(raw) : null)
  } catch {
    return defaultLayout()
  }
}

function write(layout) {
  try {
    window.localStorage.setItem(EXPENSE_COLUMNS_KEY, JSON.stringify(layout))
  } catch {
    // Depo kapalıysa düzen yalnız bu pencerede geçerli; tablo yine çalışır.
  }
}

/**
 * Masraf tablosunun sütunları: hangileri görünür, hangi sırayla. Değişiklik hemen yerel depoya
 * yazılır; "Varsayılana dön" kaydı siler. `visible`: görünür sütun kimlikleri, `grid` ızgara
 * şablonu, `minRem` tablonun en dar genişliği (dokunmatikte eylem düğmeleri büyük: daha geniş).
 * `fitRem`: ızgaranın açılma eşiği — kişinin ızgarası varsayılandan darsa onunki, genişse
 * varsayılanınki: sütun ekleyen kişi kartlara düşüp "Sütunlar" menüsünü yitirmesin (sığmayan
 * ızgara pencereyle birlikte genişler, en sonda gövde yana kayar).
 */
export function useExpenseColumns() {
  const [layout, setLayout] = useState(read)
  const coarse = useMediaQuery("(pointer: coarse)")
  const update = useCallback((fn) => {
    setLayout((prev) => {
      const next = fn(prev)
      if (next !== prev) write(next)
      return next
    })
  }, [])

  return useMemo(() => {
    const visible = visibleColumns(layout)
    return {
      layout,
      visible,
      grid: gridTemplate(visible),
      minRem: tableMinRem(visible, coarse),
      fitRem: Math.min(tableMinRem(visible, coarse), tableMinRem(DEFAULT_VISIBLE, coarse)),
      show: (id, on = true) => update((l) => setShown(l, id, on)),
      move: (id, delta) => update((l) => moveColumn(l, id, delta)),
      reorder: (order) => update((l) => reorderColumns(l, order)),
      reset: () => {
        try {
          window.localStorage.removeItem(EXPENSE_COLUMNS_KEY)
        } catch {
          // depo kapalı: yalnız ekrandaki düzen sıfırlanır
        }
        setLayout(defaultLayout())
      },
    }
  }, [layout, update, coarse])
}
