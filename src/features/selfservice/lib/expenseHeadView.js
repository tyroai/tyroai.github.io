import { COMPANIES } from "@/data/hrValues"
import { OWN, SELF } from "@/lib/expenseHead"
import { fold } from "@/lib/fold"

/**
 * MASRAF BAŞLIĞININ GÖRÜNÜŞÜ (saf) — başlık şeridi ve dar ekrandaki özet satırı için: kimin adına
 * (kendim mi, yetki veren biri mi), şirketin kodu ve unvanı, açılır listede arama ve klavye adımı.
 * Değerin kendisi `lib/expenseHead`te; burada yalnız nasıl gösterildiği.
 */

/** Seçili sahip: kendimse `null`; başkasıysa `{ name, email }` (listede yoksa ad yerine e-posta). */
export function ownerOf(head, owners) {
  const email = head?.owner
  if (!email || email === SELF) return null
  const hit = (owners ?? []).find((o) => o.email === email)
  return { name: hit?.name || email, email }
}

/**
 * Başkası adına girilen masrafın kısa adı ("Kerem Aydın adına"); kendi adınaysa `null`.
 * Dar ekrandaki özet satırı ve pencerenin başlık bağlamı aynı metni kullanır.
 */
export function onBehalfText(t, head, owners) {
  const other = ownerOf(head, owners)
  return other ? t("selfService.expense.head.forName", { name: other.name }) : null
}

/** Şirket: kendi şirketim `null`; öteki şirket `{ code, title }` (unvan bilinmiyorsa boş). */
export function companyOf(code) {
  if (!code || code === OWN) return null
  return { code, title: COMPANIES[code] ?? "" }
}

/**
 * Listede arama: Türkçe katlamalı (ı/i, ş/s…), her kelime seçeneğin metninde geçmeli
 * ("tahıl yem" → "TYRO TAHIL VE YEM…"). Boş arama listeyi olduğu gibi döner.
 * Seçeneğin aranan metni `search` (yoksa `label`).
 */
export function filterOptions(options, query) {
  const words = fold(query).split(/\s+/).filter(Boolean)
  if (!words.length) return options
  return options.filter((o) => {
    const text = fold(o.search ?? o.label)
    return words.every((w) => text.includes(w))
  })
}

const PAGE = 8

/**
 * Klavyeyle listede yeni sıra (`at`: etkin seçeneğin sırası, yoksa -1). Uçlarda durur, başa
 * dönmez; tuş listeyi gezmiyorsa ya da liste boşsa `null`.
 */
export function stepIndex(key, at, count) {
  if (count <= 0) return null
  const last = count - 1
  const from = Math.min(at, last)
  switch (key) {
    case "ArrowDown":
      return from < 0 ? 0 : Math.min(last, from + 1)
    case "ArrowUp":
      return from < 0 ? last : Math.max(0, from - 1)
    case "Home":
      return 0
    case "End":
      return last
    case "PageDown":
      return Math.min(last, Math.max(from, 0) + PAGE)
    case "PageUp":
      return Math.max(0, from - PAGE)
    default:
      return null
  }
}
