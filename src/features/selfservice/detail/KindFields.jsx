import { extraValue } from "@/lib/selfServiceFields"
import { CompanyValue } from "./DetailFields"
import { extraText } from "./extraText"
import { fieldIcon } from "./icons"

/** ERP yeri büyük harfle yazar ("MERSİN"): ayrıntıda yalnız baş harfler büyük ("Mersin"). */
export const placeName = (s) =>
  s && s === s.toLocaleUpperCase("tr")
    ? s
        .toLocaleLowerCase("tr")
        .replace(/(^|[\s/-])(\p{L})/gu, (_, a, b) => a + b.toLocaleUpperCase("tr"))
    : s

const empty = (v) => v == null || v === "" || v === false || v === "—"

/**
 * Kayıt penceresinin "Ayrıntılar" alanları — kayıtta BULUNAN ve başlıkta ya da ilerleme kartında
 * gösterilmeyenler (`window/RecordWindow`): izinde ek alanlar (gün altı izinin saatleri kartta) ve açıklama; masrafta şirket ve başlığın
 * ek alanları (açıklama, masraf merkezi, kaynak/yansıtma şirketi); avansta ödeme yöntemi, belge,
 * yansıtma şirketi ve not. Uzun metinler sonda, tam satır.
 */
export function detailItems(record, t, locale) {
  const items = []
  const add = (key, value, { wide = false, lang } = {}) => {
    if (empty(value)) return
    items.push({
      key,
      label: t(`selfService.field.${key}`),
      icon: fieldIcon(key),
      value,
      wide,
      lang,
    })
  }
  const extras = (skip = []) => {
    for (const x of record.extra ?? []) {
      if (skip.includes(x.key)) continue
      const wide = x.key === "explanation"
      add(x.key, x.kind === "company" ? <CompanyValue code={x.value} /> : extraText(x, t, locale), {
        wide,
        lang: wide ? "tr" : undefined,
      })
    }
  }
  if (record.kind === "leave") {
    // Gün altı izinde iki saat birden varsa süre değerinin altında: burada tekrarlanmaz.
    const both = extraValue(record.extra, "startTime") && extraValue(record.extra, "endTime")
    extras(both ? ["startTime", "endTime"] : [])
    add("description", record.description, { wide: true, lang: "tr" })
  } else if (record.kind === "expense") {
    add("company", record.company ? <CompanyValue code={record.company} /> : null)
    extras(["reportDate"])
  } else {
    // Kalan tutar kartta tutarın altında; ödeme yöntemini pencere hep ekler (`infoRows`).
    extras(record.location ? ["balance"] : ["balance", "paymentMode"])
    add("note", record.note, { wide: true, lang: "tr" })
  }
  return [...items.filter((x) => !x.wide), ...items.filter((x) => x.wide)]
}
