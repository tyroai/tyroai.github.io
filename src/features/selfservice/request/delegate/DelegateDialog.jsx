import "@/lib/i18n/selfService"
import { useId, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Loading03Icon from "@hugeicons/core-free-icons/Loading03Icon"
import SentIcon from "@hugeicons/core-free-icons/SentIcon"
import UserSwitchIcon from "@hugeicons/core-free-icons/UserSwitchIcon"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { askDelegate } from "@/features/selfservice/lib/delegateAsk"
import { DELEGATE } from "@/features/selfservice/lib/delegatePolicy"
import { cn } from "@/lib/utils"
import { ErpConfirm } from "../erp/ErpConfirm"
import { useDelegateErp } from "../erp/useDelegateErp"
import { keepEscape } from "../formUi"
import { RequestHeader } from "../RequestChrome"
import { RequestSheet } from "../RequestSheet"
import { DelegateFields } from "./DelegateFields"
import { useDelegateForm } from "./useDelegateForm"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SECONDARY =
  "h-11 shrink-0 rounded-full border border-border bg-background px-5 text-[0.8125rem] font-semibold text-foreground/85 shadow-xs transition hover:bg-foreground/[0.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-12"
const PRIMARY =
  "inline-flex h-11 items-center justify-center gap-2.5 rounded-full bg-brand-fill-deep px-5 text-[0.875rem] font-semibold text-brand-on-brand shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_8px_20px_-8px_rgb(0_0_0/0.45)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background pointer-coarse:h-12"

/**
 * "Yeni" menüsünün dördüncü düğmesi: Temsilci ata. Talep formlarıyla aynı çerçeve — masaüstünde
 * pencere (başlıkta doluluk halkalı simge kutusu, "i"de açıklama, altında kapsam), telefonda alt
 * çekmece — ve aynı karolar (`DelegateFields`). Birincil düğme her formdaki gibi "Gönder"; akışı
 * politikadan (`features/selfservice/lib/delegatePolicy.js` › `mode`): `"chat"` (bugün) atamayı İK asistanına yollar
 * (`features/selfservice/lib/delegateAsk.js`), sohbet açılır, pencere kapanır; `"erp"` izin/masraftaki yazım penceresiyle
 * (`ErpConfirm`, kind "delegate") Dataverse'e yazar. Yalnız politikadaki kişide açılır (çağıran bakar).
 */
export function DelegateDialog({ open, onClose, from = null, initial = null }) {
  const { t } = useLocale()
  const mobile = useIsMobile()
  const id = useId()
  const formId = `${id}-form`
  // Anlat'tan (`lib/narrate/delegate`): tarihler forma, ad seçicinin aramasına — kişiyi kişi seçer;
  // e-posta adresi yazıldıysa kişi zaten kesin, doğrudan seçili.
  const query = initial?.person ?? ""
  const mail = EMAIL.test(query) ? { name: query, address: query } : null
  const form = useDelegateForm({
    idBase: id,
    initial: { start: initial?.start, end: initial?.end, person: mail },
  })
  const erp = useDelegateErp({ onDone: onClose })
  const sent = useRef(false)
  const title = t("selfService.form.title.delegate")
  const description = t("selfService.new.desc.delegate")
  const context = t("selfService.erp.delegate.context")
  const busy = erp.state?.phase === "writing"

  const chat = DELEGATE.mode === "chat"
  const submit = (e) => {
    e.preventDefault()
    const plan = form.build()
    if (!plan) return
    if (!chat) return erp.start(plan)
    sent.current = true
    askDelegate(t, plan)
    onClose()
  }
  const onOpenChange = (o) => !o && onClose()
  // Dolu formda dışarı dokunuş yok sayılır (talep formlarının kuralı).
  const keepOutside = (e) => form.dirty && e.preventDefault()

  const body = (
    <form id={formId} onSubmit={submit} noValidate>
      <DelegateFields idBase={id} form={form} query={mail ? "" : query} />
    </form>
  )
  const send = (
    <button
      type="submit"
      form={formId}
      aria-busy={busy || undefined}
      className={cn(PRIMARY, mobile && "w-full")}
    >
      {t("selfService.form.send")}
      <HugeiconsIcon
        icon={busy ? Loading03Icon : SentIcon}
        aria-hidden="true"
        className={cn("size-4", busy && "animate-spin motion-reduce:animate-none")}
        strokeWidth={2}
      />
    </button>
  )
  const hint = (
    <p className="min-w-0 flex-1 text-[0.75rem] leading-snug text-muted-foreground">
      {t(
        chat
          ? "selfService.erp.delegate.hintChat"
          : DELEGATE.demo
            ? "selfService.erp.delegate.hintDemo"
            : "selfService.erp.delegate.hint",
      )}
    </p>
  )
  const confirm = <ErpConfirm erp={erp} kind="delegate" />

  if (mobile) {
    return (
      <RequestSheet
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        description={description}
        context={context}
        keepOutside={keepOutside}
        from={from}
        sent={sent}
        footer={
          <div className="flex flex-col gap-2.5">
            {hint}
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className={SECONDARY}>
                {t("selfService.form.cancel")}
              </button>
              <div className="min-w-0 flex-1">{send}</div>
            </div>
          </div>
        }
      >
        {body}
        {confirm}
      </RequestSheet>
    )
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={keepEscape}
        onPointerDownOutside={keepOutside}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          document.getElementById(`${id}-who`)?.focus()
        }}
        onCloseAutoFocus={(e) => {
          if (!from) return
          e.preventDefault()
          from.focus?.()
        }}
        className="flex max-h-[88dvh] w-[calc(100vw-2rem)] max-w-none flex-col gap-0 overflow-hidden rounded-[1.375rem] p-0 sm:max-h-[88dvh] sm:max-w-[min(40rem,calc(100vw-3rem))] sm:pb-0"
      >
        <RequestHeader
          icon={UserSwitchIcon}
          progress={form.progress}
          title={title}
          description={description}
          context={context}
          onClose={onClose}
        />
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6 pt-5 [scrollbar-gutter:auto]">
          {body}
        </div>
        <div className="flex shrink-0 items-center gap-3 border-t border-black/[0.06] bg-background px-6 py-4 dark:border-white/[0.08]">
          {hint}
          <button type="button" onClick={onClose} className={SECONDARY}>
            {t("selfService.form.cancel")}
          </button>
          {send}
        </div>
        {confirm}
      </DialogContent>
    </Dialog>
  )
}
