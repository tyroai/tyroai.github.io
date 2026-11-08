import { useMemo } from "react"
import { useLocale } from "@/hooks/useLocale"
import { OWN, SELF } from "@/lib/expenseHead"
import { PROMPT_TEMPLATES } from "@/lib/promptTemplates"
import { capFirst } from "../../formUi"

const COMPANY_SLOT = PROMPT_TEMPLATES.expense.slots.company

/**
 * Başlık şeridinin listeleri: kimin adına (kendim + İK'da yetki verenler, ad ve e-posta) ve
 * şirket (kendi şirketim, sonra kod · unvan; arama ikisinde de geçer). "Kendim" kişinin adıyla
 * yazılır (`owners.name`, `useExpenseOwners`), bilinmiyorsa "Kendim". Kişinin şirketi formun
 * açılışında listeden seçili gelir (`useRequestForm` › `ownCompany`). `ownerNote`: yetki
 * listesinin durumu — okunuyor · okunamadı · kimse yetki vermemiş; listede görünür metin.
 */
export function useHeadOptions(owners) {
  const { t, locale } = useLocale()
  const self = owners.name || t("selfService.form.head.self")
  const ownCompany = capFirst(t("myspace.company.own"), locale)

  const ownerOptions = useMemo(
    () => [
      {
        value: SELF,
        label: self,
        sub: owners.self || undefined,
        search: `${self} ${owners.self ?? ""}`,
      },
      ...owners.owners.map((o) => ({
        value: o.email,
        label: o.name,
        sub: o.email,
        search: `${o.name} ${o.email}`,
      })),
    ],
    [self, owners],
  )
  const companyOptions = useMemo(
    () => [
      { value: OWN, label: ownCompany },
      ...COMPANY_SLOT.options
        .filter((c) => c !== OWN)
        .map((code, i) => {
          const title = COMPANY_SLOT.describe(code) ?? ""
          return { value: code, code, label: title, search: `${code} ${title}`, split: i === 0 }
        }),
    ],
    [ownCompany],
  )
  const ownerNote =
    owners.status === "loading"
      ? t("selfService.form.head.ownersLoading")
      : owners.status === "error"
        ? t("selfService.form.head.ownersError")
        : owners.owners.length
          ? null
          : t("selfService.form.head.ownersNone")

  return { self, ownCompany, ownerOptions, companyOptions, ownerNote }
}
