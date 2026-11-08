// Matris'in Excel'i: ekrandaki görünüm olduğu gibi (mod, ölçek, pencere, filtre). Grup satırı
// (proje ya da kişi) toplamıyla, altında girintili satırlar; en sağda pencerenin toplamı.

const sum = (list) => list.reduce((s, h) => s + (h || 0), 0)
const round = (h) => Math.round(h * 10) / 10
const cell = (h) => (h ? round(h) : "")
// Grup satırı kalın: Excel'de de hiyerarşi tek bakışta.
const bold = (v) => (v === "" ? "" : { v, fmt: "head" })

/**
 * @param {{ groups: object[], cols: object[], head: string, colLabel: (c: object) => string,
 *   total: string, name: string }} p
 * @returns {{ name: string, rows: any[][], widths: number[], freezeCols: number }}
 */
export function matrixSheet({ groups, cols, head, colLabel, total, name }) {
  const labels = cols.map(colLabel)
  const rows = [[head, ...labels, total]]
  for (const g of groups) {
    const top = g.totals ?? g.cells.map((c) => c.h)
    rows.push([g.label, ...top.map(cell), round(sum(top))].map(bold))
    for (const r of g.rows) {
      const hs = r.cells.map((c) => c.h)
      rows.push([`   ${r.label}`, ...hs.map(cell), round(sum(hs))])
    }
  }
  // Sütun eni başlığa göre: "H43 · 19.10 – 25.10" sığsın, gün sütunu dar kalsın.
  const widths = [40, ...labels.map((l) => Math.max(9, String(l).length + 2)), 10]
  return { name, rows, widths, freezeCols: 1 }
}

/** Dosya adı: tyroRM_Matris_2026-10-20.xlsx */
export function matrixFileName(today) {
  const d = new Date(today * 864e5).toISOString().slice(0, 10)
  return `tyroRM_Matris_${d}.xlsx`
}
