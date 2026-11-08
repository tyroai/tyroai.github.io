/**
 * To-Do çoklu seçiminin saf kuralları (`features/todo/useTaskSelection.js`).
 * `order`: ekrandaki sırayla görünür görev kimlikleri (katlanmış gruplar hariç).
 */

/** İki kimlik arası, ikisi dahil ve ekran sırasıyla; biri görünmüyorsa yalnız `to`. */
export function rangeIds(order, from, to) {
  const a = order.indexOf(from)
  const b = order.indexOf(to)
  if (a < 0 || b < 0) return [to]
  return a <= b ? order.slice(a, b + 1) : order.slice(b, a + 1)
}

/**
 * Satıra basılınca yeni seçim. Shift'le (`range`) çapadan bu satıra kadar hepsi seçilir —
 * aralık seçimi hiçbir satırı seçimden çıkarmaz; düz basış yalnız o satırı çevirir.
 */
export function nextSelection(selected, order, id, { range = false, anchor = null } = {}) {
  const next = new Set(selected)
  if (range && anchor && anchor !== id) {
    for (const x of rangeIds(order, anchor, id)) next.add(x)
    return next
  }
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

/** Görünenlerin hepsi seçili mi (boş liste: hayır). */
export function allSelected(selected, order) {
  return order.length > 0 && order.every((id) => selected.has(id))
}
