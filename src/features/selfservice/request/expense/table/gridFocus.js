/**
 * Masraf ızgarasının odak yardımcıları. Hücre `${idBase}-${kalem}-${alan}` kimliğiyle bulunur
 * (kart düzeni de aynı kimliği kullanır). Kalem çiziliyse odak hemen verilir (hızlı yazan kişinin
 * harfi önceki hücreye düşmesin); yeni ya da geri gelen kalem henüz yoksa bir sonraki karede.
 */
const FIRST = "[data-cell] button:not(:disabled), [data-cell] input"

const rowEl = (idBase, rowId) => document.getElementById(`${idBase}-${rowId}`)

function soon(find) {
  const el = find()
  if (el) return el.focus()
  requestAnimationFrame(() => find()?.focus())
}

/**
 * Kalemin `name` hücresine (yoksa ilk hücresine) odak. `name` işlev olabilir: yeni kalemin boş
 * hücresi ancak çizildikten sonra bilinir.
 */
export function focusCell(idBase, rowId, name) {
  if (!rowId) return
  soon(() => {
    const row = rowEl(idBase, rowId)
    if (!row) return null
    const field = typeof name === "function" ? name() : name
    const cell = field ? document.getElementById(`${idBase}-${rowId}-${field}`) : null
    return cell ?? row.querySelector(FIRST)
  })
}

/**
 * Kalemin eylem düğmesine odak (`data-action`): silmeden sonra sonraki kalemin "Sil"i; düğme
 * kapalıysa (tek kalem kaldı) kalemin ilk hücresi.
 */
export function focusAction(idBase, rowId, action) {
  if (!rowId) return
  // Silinen kalem çizimden çıkınca kalan tek kalemin "Sil"i kapanır: karar bir sonraki karede.
  requestAnimationFrame(() => {
    const row = rowEl(idBase, rowId)
    const btn = row?.querySelector(`[data-action='${action}']`)
    const el = btn && !btn.disabled ? btn : row?.querySelector(FIRST)
    el?.focus()
  })
}
