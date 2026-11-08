import { formErrors } from "@/lib/requestForm"

// Kartta "+ alan" ile, tabloda sütun değilse "Ayrıntı"da duran alanlar.
const DETAIL = new Set(["note", "receipt", "firm", "location", "people"])
const FIRST =
  "[data-row-start] button, [data-row-start] input, [data-cell] button, [data-cell] input"
const FIRST_BUTTON = "[data-row-start] button, [data-cell] button"

const lineOf = (idBase, rowId) => document.getElementById(`${idBase}-${rowId}`)
const coarse = () => Boolean(window.matchMedia?.("(pointer: coarse)").matches)
const later = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn))

/** Kalemin alanının odaklanacak öğesi: kimliğiyle (kart ve tablo aynı adı taşır) ya da hücresi. */
export function fieldOf(idBase, rowId, field) {
  const own = document.getElementById(`${idBase}-${rowId}-${field}`)
  if (own) return own
  const cell = lineOf(idBase, rowId)?.querySelector(`[data-cell="${field}"]`)
  if (!cell) return null
  return cell.matches("button, input") ? cell : cell.querySelector("button, input")
}

/** Görünür değilse (yapışık başlığın altı, gövdenin dışı) ortaya kaydırır, sonra odaklar. */
function reveal(el) {
  const box = el.closest(".overflow-y-auto")?.getBoundingClientRect()
  const at = el.getBoundingClientRect()
  if (!box || at.top < box.top + 48 || at.bottom > box.bottom - 8)
    el.scrollIntoView({ block: "center" })
  el.focus({ preventScroll: true })
}

const shown = (el) => Boolean(el?.getClientRects().length)

/**
 * Masraf kaleminin alanına götürür (özetin "Eksikler"i, ileri tarih): tabloda hücre, kartta alan.
 * Alan çizili değilse (telefonda kapalı kart, tabloda "Ayrıntı"daki alan) önce kalem ve ayrıntısı
 * açılır, odak bir sonraki çizimde.
 */
export function focusField(expense, idBase, rowId, field) {
  const now = fieldOf(idBase, rowId, field)
  if (shown(now)) return reveal(now)
  expense.activate(rowId)
  if (DETAIL.has(field)) expense.showDetails(rowId, true)
  later(() => {
    const el = fieldOf(idBase, rowId, field)
    if (el) reveal(el)
  })
}

/**
 * Kalem açılınca (elle giriş, fişler geldi) odak ilk BOŞ alanına — ekrandaki sırayla (tabloda
 * kategori, kartta tutar). Dokunmatikte yazı alanına odak verilmez (klavye açılmasın). Kalem
 * kapalıysa (kartlarda açık olan başka kalem) odak yerinde kalır.
 */
export function focusFirstEmpty(idBase, row) {
  if (!row) return
  later(() => {
    const line = lineOf(idBase, row.id)
    if (!line) return
    const touch = coarse()
    const empty = Object.keys(formErrors("expense", row.values))
      .map((name) => fieldOf(idBase, row.id, name))
      .filter((el) => shown(el) && !(touch && el.tagName === "INPUT"))
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    const el = empty[0] ?? line.querySelector(touch ? FIRST_BUTTON : FIRST)
    if (!el) return
    el.focus({ preventScroll: true })
    el.scrollIntoView({ block: "nearest" })
  })
}
