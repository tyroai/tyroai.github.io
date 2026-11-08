import { COMPANIES } from "@/data/hrValues"
import { displayCompanyName } from "@/lib/companyName"
import { extraValue } from "@/lib/selfServiceFields"
import { describe } from "../../recordText"

const LONG = 80

/**
 * Başlık, alt satır ve kullanılan alan (ayrıntı listesinde tekrar etmesin). Masrafta kısa açıklama
 * raporun adıdır ("Ekim 2026 masrafları") ve altında kategori satırı YOK: kategoriler kalemlerde
 * zaten yazıyor. Uzun açıklama başlıkta değil altında okunur, başlık kategoriler.
 */
export function headOf(record, t, locale) {
  const base = describe(record, t, locale)
  if (record.kind === "expense") {
    const explanation = extraValue(record.extra, "explanation")
    if (!explanation) return { title: base.title, sub: null, used: null }
    return explanation.length > LONG
      ? { title: base.title, sub: explanation, used: "explanation" }
      : { title: explanation, sub: null, used: "explanation" }
  }
  if (record.kind === "advance") {
    const purpose = record.purposeName || record.purpose
    return {
      title: purpose
        ? t("selfService.window.advanceTitle", { purpose })
        : t("selfService.detail.kind.advance"),
      sub: record.note || null,
      used: record.note ? "note" : null,
    }
  }
  return { title: base.title, sub: record.description || null, used: "description" }
}

/** Şirket tek satırda: "TAG · TYRO Tech" (kısa ad); resmî tam ad ipucunda. Bilinmeyen kod yalnız kod. */
export function companyLine(code) {
  const name = COMPANIES[String(code ?? "").toUpperCase()]
  return {
    text: name ? `${code} · ${displayCompanyName(name)}` : String(code ?? ""),
    title: name || null,
  }
}

/**
 * Masrafta ayrıntılar ayrı bölüm değil, başlığın etiket satırında — numara ve tarihten sonra,
 * aynı sırayla (şirket, sonra ERP'nin ek alanları). Geniş alan (uzun metin) etikete sığmaz,
 * listede kalır: `{ facts, rest }`. Etiketin metni düz yazı; şirket tek satır (`companyLine`).
 */
export function splitFacts(record, rows) {
  if (record.kind !== "expense") return { facts: [], rest: rows }
  const companyOf = (key) =>
    key === "company"
      ? record.company
      : (record.extra ?? []).find((x) => x.key === key && x.kind === "company")?.value
  const facts = rows
    .filter((r) => !r.wide)
    .map((r) => {
      const code = companyOf(r.key)
      if (code == null) return { ...r, title: null }
      const line = companyLine(code)
      return { ...r, value: line.text, title: line.title }
    })
  return { facts, rest: rows.filter((r) => r.wide) }
}
