/**
 * Şablonu parçalara böler: düz metin { text } ya da işaretli değer { text, key, ...işaret }.
 * `marks`: işaretlenecek yer tutucular ({ ad: { tone } }) — karşılamada ad palet renginde çizilir.
 */
export function templatePieces(template, vars = {}, marks = {}) {
  return String(template)
    .split(/(\{\w+\})/g)
    .filter(Boolean)
    .map((part) => {
      const m = /^\{(\w+)\}$/.exec(part)
      if (!m || vars[m[1]] == null) return { text: part }
      const mark = marks[m[1]]
      return mark ? { text: String(vars[m[1]]), key: m[1], ...mark } : { text: String(vars[m[1]]) }
    })
}
