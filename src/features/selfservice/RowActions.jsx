import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import AiChat02Icon from "@hugeicons/core-free-icons/AiChat02Icon"
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon"
import MoreHorizontalIcon from "@hugeicons/core-free-icons/MoreHorizontalIcon"
import QuillWrite02Icon from "@hugeicons/core-free-icons/QuillWrite02Icon"
import { useLocale } from "@/hooks/useLocale"
import { RecordMoreMenu } from "./detail/RecordMoreMenu"
import { useRecordForm } from "./detail/useRecordForm"
import { ActionTip } from "./request/field/ActionTip"

const FOCUS =
  "transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
// İkincil: yalnız simge (ad balonda ve `aria-label`da); menü açıkken basılı görünür.
const ICON_BTN = `${FOCUS} inline-flex size-8 items-center justify-center rounded-full text-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground data-[state=open]:bg-foreground/[0.06] data-[state=open]:text-foreground [&_svg]:size-4`
const PRIMARY = `${FOCUS} inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-solid px-3 text-[0.75rem] font-semibold text-brand-on-brand shadow-sm hover:brightness-110 [&_svg]:size-3.5`

/**
 * Satırın üstüne gelince (ya da klavye odağında) çıkan eylemler — kayıt penceresinin şeridiyle
 * (`window/WindowBar` › `RecordActions`) aynı sözlük ve sıra: TYRO'ya sor · ⋯ (`RecordMoreMenu`) ·
 * tek birincil (izinde İmzala & Mail, masrafta Mail gönder; formu olmayan kayıtta yok). Görüntüle
 * yok: satırın kendisi açar. `onBusy`: menü ya da imza penceresi açık — satır düğmeleri sökmesin.
 */
export function RowActions({ record, person, onAsk, onBusy }) {
  const { t } = useLocale()
  const form = useRecordForm(record, person)
  const [menu, setMenu] = useState(false)
  const busy = menu || Boolean(form.dialog)
  useEffect(() => onBusy(busy), [busy, onBusy])
  return (
    <div className="flex items-center gap-0.5 rounded-full bg-background p-1 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_8px_20px_-8px_rgb(0_0_0/0.18)] ring-1 ring-black/[0.06] dark:ring-white/[0.08]">
      {onAsk && (
        <ActionTip label={t("selfService.askTyro")}>
          <button
            type="button"
            aria-label={t("selfService.askTyro")}
            onClick={() => onAsk(record)}
            className={ICON_BTN}
          >
            <HugeiconsIcon icon={AiChat02Icon} aria-hidden="true" strokeWidth={1.8} />
          </button>
        </ActionTip>
      )}
      <RecordMoreMenu
        record={record}
        form={form}
        onOpenChange={setMenu}
        tip={t("selfService.window.more")}
        trigger={
          <button type="button" aria-label={t("selfService.window.more")} className={ICON_BTN}>
            <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" strokeWidth={1.8} />
          </button>
        }
      />
      {form.available && (
        <button type="button" onClick={form.send} className={PRIMARY}>
          <HugeiconsIcon
            icon={form.sign ? QuillWrite02Icon : Mail01Icon}
            aria-hidden="true"
            strokeWidth={1.9}
          />
          {t(form.sign ? "selfService.form.sign" : "selfService.form.mail")}
        </button>
      )}
      {form.dialog}
    </div>
  )
}
