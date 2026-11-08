/**
 * Tek satıra kaç çip sığar. `ends`: her çipin satır başından sağ kenarı (öncü yazı dahil, sırayla),
 * `width`: satırın genişliği, `more`: "+N" çipinin genişliği, `gap`: çipler arası boşluk.
 * Hepsi sığmıyorsa "+N" de yer ister. En az bir çip kalır (sığmazsa kısalır).
 */
export function fitCount(ends, width, more, gap) {
  const n = ends.length
  for (let k = n; k >= 1; k -= 1) {
    const need = ends[k - 1] + (k < n ? gap + more : 0)
    if (need <= width + 0.5) return k
  }
  return n ? 1 : 0
}
