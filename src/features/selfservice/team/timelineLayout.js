/**
 * Aynı satırda başka bir çubukla çakışan, ondan kısa (eşitse sonraki) çubuk: etiketi yazılmaz.
 * Çubuklar aynı ızgara gözünü paylaşır; iki etiket üst üste biniyordu (ipucu ve ekran okuyucu tam).
 */
export function covered(s, all) {
  const len = (x) => x.to - x.from
  return all.some(
    (o) =>
      o !== s &&
      o.from <= s.to &&
      o.to >= s.from &&
      (len(o) > len(s) || (len(o) === len(s) && all.indexOf(o) < all.indexOf(s))),
  )
}
