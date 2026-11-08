import { useMemo } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { formFields } from "@/lib/requestForm"
import { AdvanceFields } from "./AdvanceFields"
import { Suggestions } from "./AdvanceHints"
import { AmountHero } from "./AmountHero"
import { AdvanceSummary } from "./summary/AdvanceSummary"

/**
 * İş avansı talebi: solda girişler, sağda canlı "Avans özeti" (`summary/AdvanceSummary`) — izin
 * formuyla aynı düzen. Geniş pencerede iki sütun (kabın sorgusu, form ≥ 52rem; özet yapışık), dar
 * pencerede ve telefonda alt alta: özet girişlerin altında sıkı kart. Alanlar şablondaki yedi
 * alan: tutar + para birimi · tarih · amaç · gidilecek yer · yansıtma şirketi · ödeme · belge.
 * Solda öneriler (takvimden yolculuk — amaç, yer; önceki üç avans — tarih dışında her alan; yer
 * yalnız ERP'nin lokasyon listesindeyse; `desk`, `useAdvanceDesk`), tutar formun büyük sayısı,
 * altında alan karoları (`AdvanceFields`): ilk karo tarih — talebin yapıldığı gün (varsayılan
 * bugün), hiçbir öneri onu değiştirmez. Şirket sessizce doldurulmaz: "Son avansında: … · Kullan".
 * Kapatılmamış avans ve son avans bilgisi özette. Telefonun dikeyinde öneriler çekmecenin üst
 * satırında (`PastAdvances`), burada yok.
 * `step` (telefonun iki adımı, `usePhoneSteps`): "fields" yalnız girişler, "summary" yalnız özet
 * (ayrıntısı açık); verilmezse ikisi birden.
 */
export function AdvanceForm({ form, idBase, desk, step = null }) {
  const mobile = useIsMobile()
  const fields = useMemo(
    () => Object.fromEntries(formFields("advance").main.map((f) => [f.name, f])),
    [],
  )
  const { hints, today, company, suggest } = desk

  const summary = (
    <AdvanceSummary
      form={form}
      idBase={idBase}
      hints={hints}
      today={today}
      expanded={step === "summary"}
    />
  )
  if (step === "summary") return summary
  return (
    <div className="grid gap-6 @[52rem]/form:grid-cols-[minmax(0,1fr)_21rem] @[52rem]/form:items-start">
      <div className="@container/fields min-w-0 space-y-5 shorter:space-y-4">
        <Suggestions {...suggest} className={mobile ? "hidden shortest:flex" : undefined} />
        <AmountHero form={form} idBase={idBase} field={fields.amount} />
        <AdvanceFields
          idBase={idBase}
          fields={fields}
          form={form}
          company={company}
          today={today}
        />
      </div>
      {step !== "fields" && (
        <div className="min-w-0 @[52rem]/form:sticky @[52rem]/form:top-0">{summary}</div>
      )}
    </div>
  )
}
