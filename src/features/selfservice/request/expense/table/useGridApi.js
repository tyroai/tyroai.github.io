import { useLayoutEffect, useMemo, useRef } from "react"
import {
  firstEmptyColumn,
  isColumnEmpty,
  neighbourOf,
} from "@/features/selfservice/lib/expenseColumns"
import { focusAction, focusCell } from "./gridFocus"

// Mac'te ⌥N ölü tuş (ñ): harf değil tuşun kodu okunur.
const isAddKey = (e) => e.altKey && !e.ctrlKey && !e.metaKey && e.code === "KeyN"
const mod = (e) => (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey
const isUndoKey = (e) => mod(e) && e.key?.toLowerCase() === "z"
// Ctrl/⌘+D üstteki kalemin aynı hücresini kopyalar (tablo programlarındaki "aşağı doldur").
const isCopyKey = (e) => mod(e) && e.code === "KeyD"
const isSubmitKey = (e) => mod(e) && e.key === "Enter"
// Yazı alanında Ctrl/⌘+Z yazının kendi geri alması: kalemi geri getirmez.
const isTyping = (el) =>
  el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.isContentEditable

/**
 * Izgaranın kalem işlemleri ve klavyesi — kimliği hiç değişmeyen işlevler: satırlar `memo` ile
 * yalnız kendi kalemi değişince yeniden çizilir (20 kalemde yazarken akıcı). En güncel form,
 * sütunlar ve geri alma bir ref'te (çizimden sonra güncellenir; işlevler olayda okur).
 *
 * Klavye: Enter aynı sütunda alttaki kaleme (Shift+Enter üsttekine) geçer; son kalemde, kalem
 * boş değilse yeni kalem açar ve odak ilk boş hücresine gider. Alt+N her yerden yeni kalem;
 * Ctrl/⌘+Z (yazı alanı dışında) son silinen kalemi geri getirir; Ctrl/⌘+D hücreye üstteki
 * kalemin değerini yazar; Ctrl/⌘+Enter formu gönderir (önce "Gözden geçir").
 * Excel'den yapıştırılan tablo (iki ve daha çok hücre ya da satır) kalem olur (`paste`,
 * `paste/usePasteRows`): odaklı hücrenin sütunundan başlar; tek değer alana olduğu gibi yapışır.
 * Ctrl/⌘+Z silinen kalem yoksa yapıştırmayı geri alır.
 */
export function useGridApi({ form, idBase, columns, undo, paste }) {
  const live = useRef({ form, columns, undo, paste })
  useLayoutEffect(() => {
    live.current = { form, columns, undo, paste }
  })

  return useMemo(() => {
    const exp = () => live.current.form.expense
    // Kalemin yazmaya başlanacak hücresi: odak verilirken (çizimden sonra) hesaplanır.
    const startOf = (id) => () => {
      const row = exp().rows.find((r) => r.id === id)
      return row ? firstEmptyColumn(live.current.columns.visible, row.values) : null
    }
    const add = (afterId) => {
      const e = exp()
      const id = afterId && e.insertAfter ? e.insertAfter(afterId) : e.append()
      focusCell(idBase, id, startOf(id))
    }
    const restore = () => {
      const u = live.current.undo
      if (!u.last) return
      exp().restore(u.last.entry)
      focusCell(idBase, u.last.entry.row.id)
      u.clear()
    }
    // Hücreye üstteki kalemin değeri; üstte değer yoksa hücre de boşalır (yukarıdaki gibi olur).
    const copyAbove = (cell) => {
      const name = cell.dataset.cell
      const rows = exp().rows
      const at = rows.findIndex((r) => r.id === cell.closest("[data-row]")?.dataset.row)
      if (!name || at < 1) return
      const value = rows[at - 1].values[name]
      if (value === undefined) exp().removeSlot(rows[at].id, name)
      else exp().set(rows[at].id, name, value)
    }
    return {
      add,
      restore,
      set: (id, name, value) => exp().set(id, name, value),
      details: (id, open) => exp().showDetails(id, open),
      pin: (name) => live.current.columns.show(name),
      copy: (id) => focusCell(idBase, exp().duplicate(id), live.current.columns.visible[0]),
      // Sil anında (onay yok: geri alma daha hızlı); odak sonraki kalemin "Sil"ine (sonuncuysa
      // öncekinin), art arda silmek kolay olsun.
      remove: (id, n) => {
        const next = neighbourOf(
          exp().rows.map((r) => r.id),
          id,
        )
        const entry = exp().remove(id)
        if (!entry) return
        live.current.undo.push({ entry, n })
        focusAction(idBase, next, "remove")
      },
      // Izgara dışındaki yazı alanı (sütun menüsü, seçicinin araması) kendi yapıştırmasını yapar.
      onPaste: (e) => {
        const p = live.current.paste
        const cell = e.target.closest?.("[data-cell]")
        if (!p || e.defaultPrevented || (isTyping(e.target) && !cell)) return
        if (!p.run(e.clipboardData?.getData("text/plain"), cell?.dataset.cell ?? null)) return
        e.preventDefault()
        live.current.undo.clear()
      },
      onKeyDown: (e) => {
        if (e.nativeEvent?.isComposing || e.defaultPrevented) return
        if (isAddKey(e)) {
          e.preventDefault()
          add()
          return
        }
        if (isSubmitKey(e)) {
          e.preventDefault()
          e.currentTarget.closest("form")?.requestSubmit()
          return
        }
        // Hücredeyken tarayıcının Ctrl/⌘+D'si (yer imi) açılmaz: ilk kalemde de.
        const cell = isCopyKey(e) ? e.target.closest?.("[data-cell]") : null
        if (cell) {
          e.preventDefault()
          copyAbove(cell)
          return
        }
        if (isUndoKey(e) && !isTyping(e.target)) {
          if (live.current.undo.last) {
            e.preventDefault()
            restore()
            return
          }
          if (live.current.paste?.canUndo()) {
            e.preventDefault()
            live.current.paste.undo()
            return
          }
        }
        if (e.key !== "Enter" || e.target.tagName !== "INPUT") return
        // Ayrıntı alanında Enter formu göndermesin; arama kutusunun Enter'ı kendi işi.
        if (e.target.closest("[data-details]")) return e.preventDefault()
        const name = e.target.dataset.cell
        if (!name) return
        e.preventDefault()
        const rows = exp().rows
        const at = rows.findIndex((r) => r.id === e.target.closest("[data-row]")?.dataset.row)
        if (at < 0) return
        const next = rows[at + (e.shiftKey ? -1 : 1)]
        if (next) return focusCell(idBase, next.id, name)
        if (e.shiftKey) return
        const row = rows[at]
        // Boş son kalemin altına boş kalem açılmaz: önce bu kalemin eksik hücresi.
        if (isColumnEmpty("amount", row.values) && isColumnEmpty("category", row.values))
          return focusCell(idBase, row.id, startOf(row.id))
        add()
      },
    }
  }, [idBase])
}
