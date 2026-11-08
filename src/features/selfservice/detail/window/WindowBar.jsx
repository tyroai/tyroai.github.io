import AiChat02Icon from "@hugeicons/core-free-icons/AiChat02Icon"
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon"
import MoreHorizontalIcon from "@hugeicons/core-free-icons/MoreHorizontalIcon"
import QuillWrite02Icon from "@hugeicons/core-free-icons/QuillWrite02Icon"
import { RecordBar, RecordButton } from "@/components/record-window/RecordBar"
import { useLocale } from "@/hooks/useLocale"
import { RecordMoreMenu } from "../RecordMoreMenu"
import { useRecordForm } from "../useRecordForm"

/**
 * Pencerenin üst şeridi (macOS penceresi gibi): solda kapat ve kaydın türü, sağda eylemler
 * (`RecordActions`). Telefonda şerit yok: aynı eylemler çekmecenin alt şeridinde (`RecordSheet`).
 */
export function WindowBar({ record, person, onAsk, onClose }) {
  const { t } = useLocale()
  return (
    <RecordBar
      title={t(`selfService.detail.kind.${record.kind}`)}
      onClose={onClose}
      closeLabel={t("selfService.close")}
    >
      <RecordActions record={record} person={person} onAsk={onAsk} />
    </RecordBar>
  )
}

/**
 * Kaydın eylemleri, sırayla: TYRO'ya sor, "⋯" (`RecordMoreMenu`: bağlantıyı kopyala · ERP'de göster
 * · yazdır) ve tek birincil eylem (izinde İmzala & Mail, masrafta Mail gönder; formu olmayan kayıtta
 * yok). Listedeki satırın düğmeleri (`RowActions`) aynı sözlük ve sırayla. İmza/mail penceresi
 * (`form.dialog`) portalda açılır.
 */
export function RecordActions({ record, person, onAsk }) {
  const { t } = useLocale()
  const form = useRecordForm(record, person)
  return (
    <>
      <RecordButton
        icon={AiChat02Icon}
        onClick={() => onAsk(record)}
        aria-label={t("selfService.askTyro")}
      >
        {t("selfService.action.tyro")}
      </RecordButton>
      <RecordMoreMenu
        record={record}
        form={form}
        trigger={
          <RecordButton
            icon={MoreHorizontalIcon}
            variant="icon"
            aria-label={t("selfService.window.more")}
          />
        }
      />
      {form.available && (
        <RecordButton
          icon={form.sign ? QuillWrite02Icon : Mail01Icon}
          variant="primary"
          onClick={form.send}
        >
          {t(form.sign ? "selfService.form.sign" : "selfService.form.mail")}
        </RecordButton>
      )}
      {form.dialog}
    </>
  )
}
