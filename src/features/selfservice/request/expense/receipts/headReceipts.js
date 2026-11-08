/**
 * Başlığın fiş şeridinin kimlikleri ve şeride dışarıdan (akış, özet) götüren yardımcılar. Fişler
 * kalemin değil masrafın: ERP'de masrafın başlığına eklenir (HR MCP `attach_expense_receipt`).
 */

export const receiptsId = (idBase) => `${idBase}-receipts`
export const receiptsAddId = (idBase) => `${idBase}-receipts-add`

const later = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn))
const calm = () => Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)

/**
 * Gövdeye bırakılan ya da yapıştırılan fiş başlığa gider: şerit ekranın dışındaysa (uzun kalem
 * listesi) görünür yere kayar, kişi fişin nereye eklendiğini görür. Odak yerinde kalır.
 */
export function revealHeadReceipts(idBase) {
  later(() => {
    const bar = document.getElementById(receiptsId(idBase))
    if (!bar) return
    const box = bar.closest(".overflow-y-auto")?.getBoundingClientRect()
    const at = bar.getBoundingClientRect()
    if (box && at.top >= box.top && at.bottom <= box.bottom) return
    bar.scrollIntoView({ block: "nearest", behavior: calm() ? "auto" : "smooth" })
  })
}

/**
 * Özetin "Fiş ekle"si: başlıktaki fiş seçicisini açar (fiş şeridi katın dışında, telefonda da
 * hep görünür). Seçici basışın içinde hemen açılmalı (Safari sonradan açılanı engeller); odak bir
 * sonraki çizimde şeridin "Fiş ekle"sine geçer — seçici kapanınca kişi fişlerin yanındadır.
 */
export function openHeadReceipts(idBase) {
  document.getElementById(receiptsAddId(idBase))?.click()
  later(() => {
    const add = document.getElementById(receiptsAddId(idBase))
    add?.focus({ preventScroll: true })
    add?.scrollIntoView({ block: "nearest" })
  })
}
