/**
 * Tek satıra kaç çip sığar: hepsi sığıyorsa hepsi; sığmıyorsa sondaki "+N" çipine yer bırakılarak
 * baştan sığanlar. `widths` çiplerin genişliği (sırayla), `avail` satırın iç genişliği, `gap` çipler
 * arası boşluk, `more` "+N" çipinin genişliği. Yarım piksel pay: alt piksel yuvarlaması son çipi
 * boşuna "+N"e düşürmesin.
 */
export function fitCount(widths: number[], avail: number, gap: number, more: number): number {
  const total = widths.reduce((sum, w, i) => sum + w + (i ? gap : 0), 0)
  if (total <= avail + 0.5) return widths.length
  let used = more
  let n = 0
  for (const w of widths) {
    const next = used + gap + w
    if (next > avail + 0.5) break
    used = next
    n++
  }
  return n
}
