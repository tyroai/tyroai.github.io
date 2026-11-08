import { HugeiconsIcon } from "@hugeicons/react"
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon"
import PrinterIcon from "@hugeicons/core-free-icons/PrinterIcon"
import QuillWrite02Icon from "@hugeicons/core-free-icons/QuillWrite02Icon"
import { useLocale } from "@/hooks/useLocale"
import { useRecordForm } from "./useRecordForm"

/**
 * Kaydın formunun düğmeleri (`useRecordForm`): izinde Yazdır + İmzala & Mail, masrafta Yazdır +
 * Mail gönder; avansta ve formu olmayan kayıtta hiçbir şey. Düğmeler alt şeridin ızgarasına KARDEŞ
 * olarak girer (`ErpDone`): biçimi oradan alır (`base` nötr, `primary` renkli son düğme).
 */
export function FormActions({ record, person, base, primary }) {
  const { t } = useLocale()
  const form = useRecordForm(record, person)
  if (!form.available) return null
  return (
    <>
      <button
        type="button"
        aria-label={t("selfService.form.printAria")}
        onClick={form.print}
        className={base}
      >
        <HugeiconsIcon icon={PrinterIcon} strokeWidth={1.9} />
        {t("selfService.form.print")}
      </button>
      <button type="button" onClick={form.send} className={primary}>
        <HugeiconsIcon icon={form.sign ? QuillWrite02Icon : Mail01Icon} strokeWidth={1.9} />
        {t(form.sign ? "selfService.form.sign" : "selfService.form.mail")}
      </button>
      {form.dialog}
    </>
  )
}
