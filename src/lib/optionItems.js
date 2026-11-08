/**
 * Seçici öğeleri (`ui/morph-select` ve telefondaki `common/SheetSelect` ortak): aramada büyük/küçük
 * harf ve aksan farkı olmaz, gevşek seçenekler adsız bölümde toplanır, kopya seçenek (`aliasOf`)
 * asıl değeri seçer. Öğe: `{ value, label, meta?, keywords?, icon?, disabled?, aliasOf? }` ya da
 * `{ label, options: […], hideOnSearch? }`.
 */

/** Arama ve harf atlaması için katlanmış metin: büyük/küçük ve aksan farkı yok. */
export const foldText = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")

const isGroup = (item) => Array.isArray(item?.options)

/** Gruplar arasındaki gevşek seçenekler adsız bölümde toplanır; sıra korunur. */
export function normalizeItems(items) {
  const out = []
  items.forEach((item, i) => {
    if (isGroup(item)) {
      out.push({
        key: `g${i}`,
        label: item.label,
        options: item.options,
        hideOnSearch: item.hideOnSearch,
      })
      return
    }
    const last = out[out.length - 1]
    if (last && !last.label) last.options.push(item)
    else out.push({ key: `l${i}`, options: [item] })
  })
  return out
}

/** Seçeneğin taşıdığı değer: kopya (`aliasOf`) asıl seçeneğin değerini seçer. */
export const realValue = (o) => o.aliasOf ?? o.value

/** Seçenek aramaya uyuyor mu (`needle` katlanmış): ad, yan bilgi ve anahtar sözcüklerde. */
export const optionMatches = (o, needle) =>
  foldText(`${o.label} ${o.meta ?? ""} ${o.keywords ?? ""}`).includes(needle)

/** Aramaya uyan bölümler; `hideOnSearch` bölümleri aramada gizli, boşalan bölüm düşer. */
export function filterSections(sections, needle) {
  if (!needle) return sections
  return sections
    .filter((s) => !s.hideOnSearch)
    .map((s) => ({ ...s, options: s.options.filter((o) => optionMatches(o, needle)) }))
    .filter((s) => s.options.length)
}
