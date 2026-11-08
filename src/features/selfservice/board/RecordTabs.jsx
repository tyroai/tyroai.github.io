import { useMemo } from "react"
import { useLocale } from "@/hooks/useLocale"
import { inYear } from "@/lib/selfServiceModel"
import { TABS } from "../kinds"
import { usePhone } from "../layout/phone"
import { TextTabs } from "./TextTabs"

/**
 * Sekmeler: İzinler · Masraflar · İş avansları — altı çizili sade metin, yanında seçili dönemdeki
 * kayıt sayısı soluk. WAI-ARIA sekme kalıbı (`TextTabs` › `tabs`): yalnız seçili sekme sekme
 * durağı, oklar · Home · End sekmeyi değiştirir. Telefonda kısa adlar, eşit en.
 */
export function RecordTabs({ data, tab, year, onTab }) {
  const { t } = useLocale()
  const phone = usePhone()
  const options = useMemo(
    () =>
      TABS.map((it) => ({
        value: it.id,
        label: t(`selfService.tab.${it.id}`),
        short: t(`selfService.tabShort.${it.id}`),
        count: data?.[it.data] ? inYear(data[it.data], year).length : null,
      })),
    [data, year, t],
  )
  return (
    <TextTabs
      kind="tabs"
      label={t("selfService.records")}
      options={options}
      value={tab}
      onChange={onTab}
      idPrefix="ss-tab"
      controls="ss-panel"
      rail
      fill={phone}
      // Masaüstünde sayfanın ana gezinmesi biraz iri; telefonda üç eşit sekme tam en, olağan boy.
      size={phone ? "md" : "lg"}
    />
  )
}
