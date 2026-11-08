import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import { BottomSheet } from "@/components/common/BottomSheet"
import { DestructiveDialog } from "@/features/security/dialogs"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { useBackToClose } from "@/hooks/useBackToClose"
import { useLocale } from "@/hooks/useLocale"
import { useReturnFocus } from "@/hooks/useReturnFocus"
import { cn } from "@/lib/utils"
import { emptyEntity, isDirty, toSaved, validateEntity } from "./catalogLogic"
import { EntityFields } from "./EntityFields"

const BTN =
  "inline-flex h-9 items-center justify-center rounded-lg px-4 text-[0.8125rem] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"

/**
 * Kayıt düzenleme: masaüstünde sağ bölme (~34rem, liste bağlamı kaybolmaz — Stripe/Shopify),
 * telefonda tam boy alt çekmece. Alt şerit yapışkan (Vazgeç · Kaydet). Kaydedilmemiş değişiklik
 * varken kapatma (Esc, perde, ×, Vazgeç, Geri) önce sorar. Kaydet hiç kilitlenmez: eksik alan
 * satırda nedeniyle işaretlenir ve odak ona gider.
 */
export function EntityPanel({ open, kind, item, draft, phone, onClose, onSave, onDelete, onCopy }) {
  const { t } = useLocale()
  // `draft`: çoğaltmanın dolu başlangıcı (yeni kayıt olarak kaydedilir).
  const [form, setForm] = useState(() => item ?? draft ?? emptyEntity(kind))
  // Kirli karşılaştırmanın tabanı; başarılı kayıttan sonra yeni değer olur.
  const [base, setBase] = useState(form)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [asking, setAsking] = useState(false)
  const dirty = isDirty(base, form)
  const isEditing = Boolean(item?.id)
  const back = useReturnFocus()

  const update = (patch) => {
    setForm((f) => ({ ...f, ...patch }))
    // Düzeltilen alanın hatası hemen kalkar; ötekiler kaydette yeniden denetlenir.
    setErrors((e) => {
      const next = { ...e }
      for (const k of Object.keys(patch)) delete next[k]
      return next
    })
  }

  const requestClose = () => {
    if (busy) return false
    if (dirty) {
      setAsking(true)
      return false
    }
    onClose()
    return true
  }

  // Masaüstünde de Geri bölmeyi kapatır (telefonda BottomSheet'in kendi kancası).
  useBackToClose(open && !phone, requestClose)

  // Sekme kapanırken/yenilenirken kaydedilmemiş değişiklik uyarısı.
  useEffect(() => {
    if (!open || !dirty) return undefined
    const onUnload = (e) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", onUnload)
    return () => window.removeEventListener("beforeunload", onUnload)
  }, [open, dirty])

  async function submit(e) {
    e?.preventDefault()
    if (busy) return
    const found = validateEntity(form, kind)
    if (Object.keys(found).length) {
      // Neden satırda yazılı ve odak oraya gider; bildirim balonu Kaydet'in üstüne binerdi.
      setErrors(found)
      document.getElementById(`entity-${Object.keys(found)[0]}`)?.focus()
      return
    }
    setBusy(true)
    const ok = await onSave(toSaved(form, kind))
    setBusy(false)
    if (ok) setBase(form)
  }

  // Yeni kayıtta odak Ad'da; düzenlemede Radix ilk denetime (kapat) koyar, klavye açılmaz.
  const focusFirst = (e) => {
    if (isEditing) return
    e.preventDefault()
    requestAnimationFrame(() => document.getElementById("entity-name")?.focus())
  }

  // ⌘/Ctrl+Enter her alandan kaydeder (Linear/Notion); açıklama kutusunda Enter satır kalır.
  const onFormKeyDown = (e) => {
    if (e.key !== "Enter" || !(e.metaKey || e.ctrlKey)) return
    e.preventDefault()
    submit()
  }

  const title = isEditing ? item.name : t(`settings.catalog.new.${kind}`)
  const fields = (
    <form id="catalog-entity-form" onSubmit={submit} onKeyDown={onFormKeyDown} noValidate>
      <EntityFields
        kind={kind}
        form={form}
        errors={errors}
        update={update}
        onCopy={onCopy}
        onDelete={isEditing ? () => onDelete(item) : undefined}
      />
    </form>
  )
  const footer = (
    <div
      className={cn(
        "flex items-center gap-2",
        // Geniş çekmecede (tablet, yatay telefon) form ve şerit okunur ende, ortada.
        phone ? "mx-auto grid w-full max-w-xl grid-cols-2" : "justify-end",
      )}
    >
      {/* Kirli durum masaüstünde şeritte yazılı (Stripe); telefonda şerit iki düğmeye ayrılmış. */}
      {!phone && (
        <p
          aria-live="polite"
          className="me-auto flex min-w-0 items-center gap-2 text-xs text-muted-foreground"
        >
          {dirty && (
            <>
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-warning" />
              <span className="truncate">{t("settings.catalog.form.unsaved")}</span>
            </>
          )}
        </p>
      )}
      <button
        type="button"
        onClick={requestClose}
        className={cn(BTN, "text-foreground/80 hover:bg-foreground/[0.05] hover:text-foreground")}
      >
        {t("settings.action.cancel")}
      </button>
      <button
        type="submit"
        form="catalog-entity-form"
        aria-busy={busy || undefined}
        aria-keyshortcuts="Control+Enter Meta+Enter"
        className={cn(BTN, "bg-brand-fill-deep text-brand-on-brand shadow-sm hover:brightness-110")}
      >
        {busy
          ? t("settings.catalog.form.saving")
          : t(isEditing ? "settings.action.save" : "settings.action.create")}
      </button>
    </div>
  )

  const discard = (
    <DestructiveDialog
      open={asking}
      onOpenChange={setAsking}
      icon={Alert02Icon}
      title={t("settings.catalog.discard.title")}
      description={t("settings.catalog.discard.body")}
      confirmLabel={t("settings.catalog.discard.confirm")}
      cancelLabel={t("settings.catalog.discard.cancel")}
      onConfirm={() => {
        setAsking(false)
        onClose()
      }}
    />
  )

  if (phone) {
    return (
      <>
        <BottomSheet
          open={open}
          onOpenChange={(v) => !v && requestClose()}
          title={title}
          closeOnBack={requestClose}
          footer={footer}
          className="h-[94dvh] max-h-[94dvh]"
          onOpenAutoFocus={focusFirst}
        >
          <div className="mx-auto w-full max-w-xl pt-2 pb-4">{fields}</div>
        </BottomSheet>
        {discard}
      </>
    )
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && requestClose()}>
        <SheetContent
          side="right"
          showCloseButton={false}
          onOpenAutoFocus={(e) => {
            back.onOpenAutoFocus()
            focusFirst(e)
          }}
          onCloseAutoFocus={back.onCloseAutoFocus}
          className="w-full gap-0 bg-background p-0 text-sm data-[side=right]:sm:max-w-[34rem]"
        >
          <header className="flex shrink-0 items-start gap-3 border-b border-border/60 px-6 pt-5 pb-4">
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate text-base font-semibold tracking-[-0.01em]">
                {title}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {t(`settings.catalog.tab.${kind}`)}
              </SheetDescription>
            </div>
            <SheetClose
              aria-label={t("sheet.close")}
              className="-me-2 grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
            </SheetClose>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
            {fields}
          </div>
          <footer className="shrink-0 border-t border-border/60 px-6 py-3">{footer}</footer>
        </SheetContent>
      </Sheet>
      {discard}
    </>
  )
}
