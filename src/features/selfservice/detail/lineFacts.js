import { COMPANIES } from "@/data/hrValues"
import { extraText } from "./extraText"

// Kalemin başlık satırında zaten görünen alan.
const INLINE = new Set(["vendor"])

/**
 * Masraf kaleminin ek alanları (`{ key, label, value, title? }`): satırda BULUNANLAR — fiş no.,
 * masraf yeri, kişi sayısı, masraf merkezi, şirket para birimi karşılığı ve kur, raporlama tutarı,
 * yansıtma şirketi. Raporun kendisiyle aynı olan şirket ve masraf merkezi tekrarlanmaz (`report`).
 */
export function lineFacts(line, report, t, locale) {
  const facts = (line.extra ?? [])
    .filter((x) => !INLINE.has(x.key))
    .filter((x) => !(x.key === "costCenter" && x.value === report.costCenter))
    .map((x) => ({
      key: x.key,
      label: t(`selfService.field.${x.key}`),
      value: extraText(x, t, locale),
    }))
  if (line.company && line.company !== report.company) {
    facts.push({
      key: "company",
      label: t("selfService.field.company"),
      value: line.company,
      title: COMPANIES[String(line.company).toUpperCase()],
    })
  }
  return facts
}
