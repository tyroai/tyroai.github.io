const STEP = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }

/**
 * Düzenleyicide ok tuşları yazılabilir hücreler arasında gezdirir (tablo programı gibi): grup
 * satırı, tatil ve toplam hücreleri atlanır. Sağdan sola dilde sol ve sağ yer değiştirir.
 * Yalnız hücre düğmesindeyken çalışır; sayı alanındaki oklar alana kalır.
 */
export function onGridKey(e) {
  const step = STEP[e.key]
  if (!step || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
  if (!e.target.matches?.("[data-cell]")) return
  const td = e.target.closest("td")
  const table = td?.closest("table")
  if (!table) return
  const rtl = getComputedStyle(table).direction === "rtl"
  const [dr, dc] = [step[0], rtl ? -step[1] : step[1]]
  let r = td.parentElement.rowIndex
  let c = td.cellIndex
  let next = null
  while (!next) {
    r += dr
    c += dc
    const row = table.rows[r]
    const cell = row?.cells[dr ? td.cellIndex : c]
    if (!cell) return
    next = cell.querySelector("[data-cell]")
  }
  e.preventDefault()
  next.focus()
}
