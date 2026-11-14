import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import MoreHorizontalIcon from "@hugeicons/core-free-icons/MoreHorizontalIcon"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import PencilEdit01Icon from "@hugeicons/core-free-icons/PencilEdit01Icon"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { useLocale } from "@/hooks/useLocale"
import { formatAgo, formatStamp } from "@/lib/date"
import { cn } from "@/lib/utils"
import { AppLogo } from "../apps/AppLogo"
import { ageOf } from "./inbox"
import { BTN, BTN_PRIMARY, BTN_QUIET } from "./buttons"

/** Giriş adresi @'ten bölünür: yerel ad mürekkepte, alan adı soluk (tenant farkının işareti). */
export function PersonLine({ upn, className }) {
  const at = upn.indexOf("@")
  const local = at === -1 ? upn : upn.slice(0, at)
  const domain = at === -1 ? "" : upn.slice(at)
  return (
    <p className={cn("min-w-0 leading-tight", className)} title={upn}>
      <span className="font-semibold text-foreground [overflow-wrap:anywhere]">{local || "—"}</span>
      {/* Alan adı bölünmez: sığmazsa bütün olarak alt satıra iner. */}
      <span className="inline-block max-w-full truncate align-bottom text-muted-foreground">
        {domain}
      </span>
    </p>
  )
}

/** Göreli yaş; üç günü geçen bekleme kehribar. Kesin damga balonda. */
export function Age({ iso, pending, className }) {
  const { locale } = useLocale()
  const { aged } = ageOf(iso)
  return (
    <time
      dateTime={iso ?? undefined}
      title={formatStamp(iso)}
      className={cn(
        "shrink-0 text-xs tabular-nums",
        pending && aged ? "font-medium text-warning-ink" : "text-muted-foreground",
        className,
      )}
    >
      {formatAgo(iso, locale)}
    </time>
  )
}

/** Yönetici notu: varsa okunur blok + Düzenle; düzenlerken alan ve "kişi görür" ipucu. */
function AdminNote({ row, busy, editing, setEditing, onSave }) {
  const { t } = useLocale()
  const [text, setText] = useState(row.adminNote ?? "")
  if (editing) {
    const save = async () => (await onSave(text)) && setEditing(false)
    const cancel = () => {
      setText(row.adminNote ?? "")
      setEditing(false)
    }
    return (
      <div className="mt-3 max-w-[48rem] space-y-1.5">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          // Esc vazgeçer, ⌘/Ctrl+Enter kaydeder (yazarken fareye dönülmesin).
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault()
              e.stopPropagation()
              cancel()
            } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !busy) {
              e.preventDefault()
              save()
            }
          }}
          disabled={busy}
          rows={3}
          maxLength={2000}
          autoFocus
          aria-label={t("authz.req.adminNote")}
          placeholder={t("authz.req.adminNote.placeholder")}
          className="resize-none text-[0.8125rem]"
        />
        <p className="text-xs text-muted-foreground">{t("authz.req.adminNote.visible")}</p>
        <div className="flex gap-2">
          <button type="button" disabled={busy} onClick={save} className={cn(BTN, BTN_PRIMARY)}>
            {t("authz.save")}
          </button>
          <button type="button" disabled={busy} onClick={cancel} className={cn(BTN, BTN_QUIET)}>
            {t("authz.cancel")}
          </button>
        </div>
      </div>
    )
  }
  if (!row.adminNote) return null
  return (
    <div className="mt-2.5 max-w-[48rem] rounded-xl bg-muted/50 px-3 py-2 dark:bg-white/[0.04]">
      <p className="text-xs font-medium text-foreground/70">{t("authz.req.adminNote")}</p>
      <p className="mt-0.5 whitespace-pre-wrap break-words text-[0.8125rem] leading-relaxed">
        {row.adminNote}
      </p>
    </div>
  )
}

/**
 * Tek talep. Bekleyende eylemler: Onayla (birincil; yetki verir + kapatır) · Kapat (yetki
 * vermeden tamamlar) · not · ⋯ Sil. Tamamlananda: Geri al · not · ⋯ Sil. Kullanıcının notu
 * KIRPILMAZ: kırpılmış gerekçe okunmamış gerekçedir. `groupedBy`: grup başlığında yazan şey
 * (kişi ya da uygulama) satırda tekrar edilmez — bir şey bir yerde.
 *
 * Düzen kap genişliğine göre: dar kapta eylemler içeriğin altında (telefonda eşit pay); geniş
 * kapta (≥ 52rem) bilgi solda, eylemler sağ sütunda (GitHub erişim talepleri) — öğe kısalır,
 * göz solda kişiyi, sağda kararı tarar. `li` odaklanabilir: eylemden sonra odak sıradakine geçer.
 */
export function RequestItem({
  row,
  app,
  groupedBy,
  busy,
  showStatus,
  onApprove,
  onClose,
  onReopen,
  onDelete,
  onSaveNote,
}) {
  const { t } = useLocale()
  const [editing, setEditing] = useState(false)
  const moreRef = useRef(null)
  const noteRef = useRef(null)
  const wasEditing = useRef(false)
  const pending = !row.isCompleted
  const noteLabel = row.adminNote ? t("authz.inbox.editNote") : t("authz.inbox.addNote")

  // Not alanı kapanınca (kaydet · vazgeç) odak not düğmesine döner, gövdeye düşmez.
  useEffect(() => {
    if (wasEditing.current && !editing) noteRef.current?.focus()
    wasEditing.current = editing
  }, [editing])

  return (
    <li
      data-req={row.id}
      data-state={pending ? "pending" : "done"}
      tabIndex={-1}
      className={cn(
        "px-4 py-3.5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40",
        !pending && "text-foreground/85",
      )}
      aria-busy={busy || undefined}
    >
      <div className="flex items-start gap-3">
        <AppLogo app={app} name={row.app} className="mt-0.5" />
        <div className="min-w-0 flex-1 @[52rem]/inbox:grid @[52rem]/inbox:grid-cols-[minmax(0,1fr)_auto] @[52rem]/inbox:gap-x-6">
          <div className="min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              {groupedBy === "person" ? (
                <p className="min-w-0 text-[0.875rem] font-semibold leading-tight [overflow-wrap:anywhere]">
                  {row.app || "—"}
                </p>
              ) : (
                <PersonLine upn={row.upn} className="text-[0.875rem]" />
              )}
              <Age
                iso={row.createdOn}
                pending={pending}
                className="hidden @[34rem]/inbox:block @[52rem]/inbox:hidden"
              />
            </div>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-muted-foreground">
              {groupedBy ? null : (
                <>
                  <span className="[overflow-wrap:anywhere]">{row.app || "—"}</span>
                  <span aria-hidden="true" className="@[34rem]/inbox:hidden @[52rem]/inbox:inline">
                    ·
                  </span>
                </>
              )}
              <Age
                iso={row.createdOn}
                pending={pending}
                className="@[34rem]/inbox:hidden @[52rem]/inbox:inline"
              />
              {!app && row.app ? (
                <span className="inline-flex h-5 items-center gap-1 rounded-full bg-warning/12 px-2 text-[0.6875rem] font-medium text-warning-ink">
                  <HugeiconsIcon icon={Alert02Icon} className="size-3" strokeWidth={2} />
                  {t("authz.apps.orphan")}
                </span>
              ) : null}
              {showStatus ? (
                <span
                  className={cn(
                    "inline-flex h-5 items-center rounded-full px-2 text-[0.6875rem] font-medium",
                    pending ? "bg-warning/12 text-warning-ink" : "bg-success/12 text-success-ink",
                  )}
                >
                  {pending ? t("authz.req.pending") : t("authz.req.done")}
                </span>
              ) : null}
            </p>

            {row.userNote ? (
              <p className="mt-2 max-w-[48rem] whitespace-pre-wrap break-words border-s-2 border-border ps-3 text-[0.8125rem] leading-relaxed text-foreground">
                {row.userNote}
              </p>
            ) : null}

            <AdminNote
              key={`${row.id}:${row.adminNote}`}
              row={row}
              busy={busy}
              editing={editing}
              setEditing={setEditing}
              onSave={onSaveNote}
            />
          </div>

          {!editing && (
            <div className="mt-3 flex items-center gap-2 @max-[34rem]/inbox:-ms-12 @[52rem]/inbox:col-start-2 @[52rem]/inbox:row-start-1 @[52rem]/inbox:mt-0 @[52rem]/inbox:self-start">
              <button
                ref={noteRef}
                type="button"
                onClick={() => setEditing(true)}
                disabled={busy}
                aria-label={noteLabel}
                title={noteLabel}
                className={cn(
                  BTN,
                  BTN_QUIET,
                  "order-3 w-9 shrink-0 px-0 text-muted-foreground pointer-coarse:w-11",
                  "@[34rem]/inbox:order-none @[34rem]/inbox:me-auto @[34rem]/inbox:-ms-2 @[34rem]/inbox:w-auto @[34rem]/inbox:px-2",
                  // Geniş kapta sağ sütunda yer dar: 64rem'e dek yalnız ikon.
                  "@[52rem]/inbox:me-0 @[52rem]/inbox:ms-0 @[52rem]/inbox:w-9 @[52rem]/inbox:px-0 @[64rem]/inbox:w-auto @[64rem]/inbox:px-2",
                )}
              >
                <HugeiconsIcon icon={PencilEdit01Icon} className="size-4" strokeWidth={1.8} />
                <span className="hidden @[34rem]/inbox:inline @[52rem]/inbox:hidden @[64rem]/inbox:inline">
                  {noteLabel}
                </span>
              </button>
              {pending ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={busy}
                    title={t("authz.inbox.closeHint")}
                    className={cn(BTN, BTN_QUIET, "flex-1 bg-muted @[34rem]/inbox:flex-none")}
                  >
                    {t("authz.inbox.close")}
                  </button>
                  <button
                    type="button"
                    onClick={onApprove}
                    disabled={busy}
                    className={cn(BTN, BTN_PRIMARY, "flex-1 bg-muted @[34rem]/inbox:flex-none")}
                  >
                    <HugeiconsIcon icon={Tick02Icon} className="size-4" strokeWidth={2} />
                    {t("authz.req.approve")}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onReopen}
                  disabled={busy}
                  className={cn(BTN, BTN_QUIET, "flex-1 bg-muted @[34rem]/inbox:flex-none")}
                >
                  {t("authz.req.reopen")}
                </button>
              )}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger
                  ref={moreRef}
                  disabled={busy}
                  aria-label={t("authz.inbox.more")}
                  className={cn(BTN, BTN_QUIET, "order-4 w-9 shrink-0 px-0 pointer-coarse:w-11")}
                >
                  <HugeiconsIcon icon={MoreHorizontalIcon} className="size-4" strokeWidth={2} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-40">
                  <DropdownMenuItem
                    variant="destructive"
                    // ⋯ düğmesi verilir: kutudan vazgeçilince odak oraya döner.
                    onSelect={() => onDelete(moreRef.current)}
                    className="pointer-coarse:min-h-11"
                  >
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                    {t("authz.req.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </li>
  )
}
