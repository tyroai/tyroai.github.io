import { useEffect, useMemo, useRef, useState } from "react"
import { revealHeadReceipts } from "./receipts/headReceipts"

/** Açılan kalemin ilk alanı (kartta `data-row-start`, tabloda satırın ilk hücresi). */
function focusRow(idBase, id) {
  requestAnimationFrame(() => {
    const el = id ? document.getElementById(`${idBase}-${id}`) : null
    el?.scrollIntoView({ block: "nearest" })
    const box = el ?? document
    box
      .querySelector("[data-row-start] button, [data-row-start] input, [data-cell] button")
      ?.focus()
  })
}

/**
 * Gözden geçirmeden başlığa dönüş ("Geri", başlığın "Değiştir"i): odak "Kimin adına"da; telefonda
 * hücreler katlıysa katlı satırda (odak alt şeritteki düğmede kalıp yanlışlıkla "Vazgeç"e basılmasın).
 */
function focusHead(idBase) {
  requestAnimationFrame(() => {
    const cell = document.getElementById(`${idBase}-head-owner`)
    cell?.focus()
    if (document.activeElement !== cell) document.getElementById(`${idBase}-head-toggle`)?.focus()
  })
}

/**
 * Masraf formunun akışı: kalemler (form doğrudan onlarla açılır; fişler isteğe bağlı, başlığın
 * şeridinden) → gözden geçirme (`review`: paketlenmiş `{ text, files }` — gönderilecek olan
 * birebir; tek kalemde de: kişi göndermeden önce temiz bir özet görür). Fişler kalemin değil masrafın: ERP'de başlığa eklenir, nereden
 * gelirse gelsin (gövdeye bırakma ya da yapıştırma, başlığın şeridi) başlığa gider. `receipts`:
 * başlığın fiş şeridinin nesnesi — liste, ekle/kaldır/geri koy/döndür ve sınıra takılan son
 * eklemede dışarıda kalan sayı (`skipped`). İzin ve avansta gözden geçirme yok.
 */
export function useExpenseFlow({ form, kind, idBase }) {
  const expense = kind === "expense"
  const [review, setReview] = useState(null)
  const [skipped, setSkipped] = useState(0)
  const list = form.expense.receipts
  // Fiş işlevleri her çizimde yeni (güncel listeyi tutar); şeride giden nesne yalnız liste ya da
  // uyarı değişince yenilenir: başlık (`memo`) kalem yazılırken yeniden çizilmez.
  const latest = useRef(form.expense)
  useEffect(() => {
    latest.current = form.expense
  })
  const bar = useMemo(
    () => ({
      list,
      skipped,
      /** Fişleri başlığa ekler; dönüş sığmayan sayısı (şeritte yazılır). */
      add: (files) => {
        const left = latest.current.addReceipts(files)
        setSkipped(left)
        return left
      },
      remove: (id) => {
        setSkipped(0)
        return latest.current.removeReceipt(id)
      },
      restore: (entry) => latest.current.restoreReceipt(entry),
      /** Fişi çeyrek tur döndürür (`step` 90 ya da -90): önizleme ve gönderilen görsel. */
      rotate: (id, step) => latest.current.rotateReceipt(id, step),
    }),
    [list, skipped],
  )
  return {
    expense,
    started: true,
    review,
    setReview,
    // Gönder düğmesi önce "Gözden geçir" olur (kalem sayısı fark etmez).
    reviewing: expense,
    receipts: expense ? bar : null,
    /** Kalemler varken gövdeye bırakılan ya da yapıştırılan fişler: başlığa; şerit görünür olur. */
    add: (files) => {
      bar.add(files)
      revealHeadReceipts(idBase)
    },
    /** Gözden geçirmeden düzenlemeye: `id` verilirse o kalem açılır ve odak ona geçer. */
    edit: (id) => {
      setReview(null)
      if (!id) return focusHead(idBase)
      form.expense.activate(id)
      focusRow(idBase, id)
    },
  }
}
