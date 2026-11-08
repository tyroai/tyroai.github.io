import { HugeiconsIcon } from "@hugeicons/react"
import Link01Icon from "@hugeicons/core-free-icons/Link01Icon"
import LinkSquare02Icon from "@hugeicons/core-free-icons/LinkSquare02Icon"
import PrinterIcon from "@hugeicons/core-free-icons/PrinterIcon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocale } from "@/hooks/useLocale"
import { erpRecordUrl } from "@/features/selfservice/lib/erpLinks"
import { notify } from "@/lib/notify"
import { recordLink } from "../recordText"
import { ActionTip } from "../request/field/ActionTip"

const icon = (i) => <HugeiconsIcon icon={i} aria-hidden="true" strokeWidth={1.8} />

// Menü satırı dokunmatikte 44 px (taban 28 px).
const ITEM = "pointer-coarse:min-h-11"

/**
 * Kaydın "⋯" menüsü — kayıt penceresinde, telefon çekmecesinde ve listedeki satırda AYNI menü:
 * Bağlantıyı kopyala · ERP'de göster · Formu yazdır (formu olan kayıtta). ERP'nin bağlantısı formu
 * açar, kaydı değil: numarası olan kayıtta numara panoya kopyalanır, kişi ERP'nin aramasına
 * yapıştırır. `trigger`: tetik düğmesi (`asChild`); `form`: `useRecordForm` sonucu; `tip`: yalnız
 * simgeli tetiğin balonu.
 */
export function RecordMoreMenu({ record, form, trigger, tip, onOpenChange }) {
  const { t } = useLocale()
  const erp = erpRecordUrl(record)
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(recordLink(record))
      notify.success(t("selfService.copied"))
    } catch {
      notify.error(t("selfService.copyFailed"))
    }
  }
  const copyNumber = () => {
    if (!record.number) return
    navigator.clipboard
      ?.writeText(record.number)
      .then(() => notify.info(t("selfService.action.openErpCopied", { number: record.number })))
      .catch(() => {})
  }
  const button = <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      {tip ? <ActionTip label={tip}>{button}</ActionTip> : button}
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuItem onSelect={copyLink} className={ITEM}>
          {icon(Link01Icon)}
          {t("selfService.copyLink")}
        </DropdownMenuItem>
        {erp && (
          <DropdownMenuItem asChild className={ITEM}>
            <a href={erp} target="_blank" rel="noopener noreferrer" onClick={copyNumber}>
              {icon(LinkSquare02Icon)}
              {t("selfService.action.openErp")}
            </a>
          </DropdownMenuItem>
        )}
        {form.available && (
          <DropdownMenuItem onSelect={form.print} className={ITEM}>
            {icon(PrinterIcon)}
            {t("selfService.form.printAria")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
