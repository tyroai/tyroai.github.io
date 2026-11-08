import { useId } from "react"
import { InfoTip } from "@/components/common/InfoTip"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { ApproverPerson } from "./approver/ApproverPerson"

/**
 * Talep formlarının (izin, masraf, avans) onay veren satırı: "Onay veren · Yönetici" etiketi, bağlı
 * olunan kişinin düğmesi (foto ya da baş harfler · ad · unvan; basınca kişi kartı); "Onay akışını ERP
 * belirler." etiketin ⓘ'sinde — ilk onay yöneticide, akışın gerisini ERP belirler. Yönetici Entra'dan
 * (`useMyManager`); bilinmiyorsa ya da henüz gelmediyse satır yok.
 */
export function ApproverRow({ manager, className }) {
  const { t } = useLocale()
  const id = useId()
  if (!manager) return null
  const labelId = `${id}-label`
  const noteId = `${id}-note`
  return (
    <div className={cn("min-w-0", className)}>
      <p className="mb-1.5 flex items-center gap-1 text-[0.75rem] font-medium leading-snug text-muted-foreground">
        <span id={labelId}>{t("selfService.leave.managerLabel")}</span>
        <InfoTip text={t("selfService.leave.managerNote")} />
      </p>
      <ApproverPerson manager={manager} labelledBy={labelId} describedBy={noteId} />
      <p id={noteId} className="sr-only">
        {t("selfService.leave.managerNote")}
      </p>
    </div>
  )
}
