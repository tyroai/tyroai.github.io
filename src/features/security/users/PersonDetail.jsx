import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import ShieldKeyIcon from "@hugeicons/core-free-icons/ShieldKeyIcon"
import { AppChecklist } from "@/features/admin/authz/AppChecklist"
import { UpnField } from "@/features/admin/UpnField"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/hooks/useLocale"
import { APP_LOCK } from "@/lib/appLockPolicy"
import { formatStamp } from "@/lib/date"
import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"
import { draftState } from "./detailDraft"

// Korumalı eylemler `disabled` değil: tıklama kabul edilir, sebep söylenir (dokunmatikte de).
const guard = (message) => notify.info(message, { id: "authz-self-guard" })
const GROUP_TITLE =
  "mb-2 px-1 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground"
const GROUP = "rounded-2xl bg-muted/40 dark:bg-white/[0.04]"
const LINK =
  "rounded-md px-1.5 py-0.5 text-xs font-semibold text-brand-ink hover:bg-brand/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11"

function Group({ title, aside, children }) {
  const { locale } = useLocale()
  return (
    <section>
      <div className="flex items-center justify-between gap-2">
        <h3 lang={locale} className={GROUP_TITLE}>
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

/** Rol anahtarı (Apple ayar satırı): kendi yöneticiliğini kaldıramazsın — sebep söylenir. */
function RoleSwitch({ ctx, row, self, busy }) {
  const { t } = ctx
  const on = row.isAdmin
  return (
    <div className={cn(GROUP, "flex min-h-14 items-center gap-3 px-4 py-3")}>
      <span className="min-w-0 flex-1">
        <span id={`role-${row.id}`} className="block text-sm font-medium">
          {t("authz.badge.admin")}
        </span>
        <span className="block text-xs leading-snug text-muted-foreground">
          {t("authz.ws.editor.adminHint")}
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={`role-${row.id}`}
        aria-busy={busy || undefined}
        onClick={() => (self && on ? guard(t("authz.admin.self")) : !busy && ctx.toggleAdmin(row))}
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2",
          "pointer-coarse:after:absolute pointer-coarse:after:-inset-2.5 pointer-coarse:after:content-['']",
          on ? "bg-brand-fill-deep" : "bg-foreground/20",
          busy && "opacity-60",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-[inset-inline-start]",
            on ? "start-[1.125rem]" : "start-0.5",
          )}
        />
      </button>
    </div>
  )
}

/**
 * Yöneticide uygulama listesi erişimi belirlemiyor (kilidi atlar): önce bunu söyleyen kart, liste
 * katlı. Liste silinmez — yöneticilik kalkarsa geçerli olur, o yüzden açılıp düzenlenebilir.
 */
function AdminApps({ children }) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3 rounded-2xl bg-success/12 px-4 py-3">
        <HugeiconsIcon
          icon={ShieldKeyIcon}
          className="mt-0.5 size-4 shrink-0 text-success-ink"
          strokeWidth={1.8}
        />
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-success-ink">
          {t("authz.apps.allAdmin")}
        </p>
      </div>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={LINK}>
        {t("security.detail.editList")}
      </button>
      {open ? (
        <>
          <p className="px-1 text-xs leading-snug text-muted-foreground">
            {t("authz.apps.adminNote")}
          </p>
          {children}
        </>
      ) : null}
    </div>
  )
}

/** Giriş adresi + "Adresi değiştir" (kendi satırında değil; sebep söylenir). */
function Address({ ctx, row, busy }) {
  const { t, upnDraft, setUpnDraft, saveUpn, canEditUpn } = ctx
  const editing = upnDraft.id === row.id
  return (
    <Group
      title={t("authz.ws.editor.address")}
      aside={
        !editing && (
          <button
            type="button"
            className={LINK}
            onClick={() =>
              canEditUpn(row)
                ? setUpnDraft({ id: row.id, text: row.upn })
                : guard(t("authz.upn.self"))
            }
          >
            {t("authz.ws.editor.changeUpn")}
          </button>
        )
      }
    >
      {editing ? (
        <div className="flex flex-col gap-2">
          <UpnField
            id={`authz-upn-${row.id}`}
            value={upnDraft.text}
            onChange={(text) => setUpnDraft({ id: row.id, text })}
            disabled={busy}
          />
          <p className="text-xs leading-snug text-warning-ink">{t("authz.upn.warning")}</p>
          <div className="flex gap-2">
            <Button
              className="h-9 px-3"
              disabled={busy || !upnDraft.text.trim()}
              onClick={() => saveUpn(row)}
            >
              {t("authz.save")}
            </Button>
            <Button
              variant="ghost"
              className="h-9 px-3"
              disabled={busy}
              onClick={() => setUpnDraft({ id: null, text: "" })}
            >
              {t("authz.cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <p className={cn(GROUP, "break-all px-4 py-3 text-sm font-medium text-foreground")}>
          {row.upn}
        </p>
      )}
    </Group>
  )
}

/** Kişinin talepleri (Talepler sekmesindeki kayıtların bu kişiye ait olanları). */
function Requests({ ctx, row }) {
  const { t, requests } = ctx
  const mine = useMemo(() => {
    const k = row.upn.trim().toLowerCase()
    return requests.filter((r) => r.upn.trim().toLowerCase() === k)
  }, [requests, row.upn])
  return (
    <Group title={t("security.detail.requests")}>
      {mine.length ? (
        <ul className={cn(GROUP, "divide-y divide-border/60")}>
          {mine.map((r) => (
            <li key={r.id} className="flex min-h-12 items-center gap-3 px-4 py-2.5 text-sm">
              <span lang="tr" className="min-w-0 flex-1 truncate">
                {r.app}
              </span>
              {r.createdOn && (
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {formatStamp(r.createdOn)}
                </span>
              )}
              <span
                className={cn(
                  "inline-flex h-6 shrink-0 items-center rounded-full px-2 text-xs font-medium",
                  r.isCompleted
                    ? "bg-success/12 text-success-ink"
                    : "bg-warning/12 text-warning-ink",
                )}
              >
                {r.isCompleted ? t("authz.filter.done") : t("authz.filter.pending")}
              </span>
              {/* Bekleyen talep burada da onaylanır: kişiyi düzenlerken sekme değiştirmeden. */}
              {!r.isCompleted && (
                <button
                  type="button"
                  disabled={ctx.busyId === r.id}
                  onClick={() => ctx.approve(r)}
                  className="h-8 shrink-0 rounded-lg px-2.5 text-xs font-semibold text-brand-ink hover:bg-brand/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-60 pointer-coarse:h-11"
                >
                  {t("authz.req.approve")}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-1 text-sm text-muted-foreground">{t("security.detail.noRequests")}</p>
      )}
    </Group>
  )
}

/** Kaydet şeridi: "Kaydedilmemiş değişiklik · Vazgeç · Kaydet" (yalnız taslak kayıttan farklıyken). */
export function SaveBar({ ctx, row }) {
  const { t, setDraft, busyId } = ctx
  const busy = busyId === row.id
  return (
    <div className="flex items-center gap-2">
      <span className="min-w-0 flex-1 truncate text-[0.8125rem] text-muted-foreground">
        {t("security.detail.dirty")}
      </span>
      <Button
        variant="ghost"
        className="h-9 px-3 text-[0.8125rem] pointer-coarse:h-11"
        disabled={busy}
        onClick={() => setDraft({ id: row.id, apps: row.apps })}
      >
        {t("security.detail.discard")}
      </Button>
      <Button
        className="h-9 bg-brand-fill-deep px-3.5 text-[0.8125rem] text-brand-on-brand hover:bg-brand-fill-deep hover:brightness-110 pointer-coarse:h-11"
        disabled={busy}
        onClick={() => ctx.saveApps(row)}
      >
        {t("authz.save")}
      </Button>
    </div>
  )
}

/**
 * KİŞİNİN AYRINTISI — adres, rol, gruplu uygulamalar (arama, Tümünü seç / Temizle; katalog dışı
 * adlar ayrı grupta, kaldırılabilsin), talepleri ve en altta silme. Uygulama seçimi taslakta
 * (`ctx.draft`); yalnız değişince kaydet şeridi belirir (telefonda çekmecenin kaymayan alt
 * şeridinde: `footerOutside`). Rol anında yazılır.
 */
export function PersonDetail({ ctx, row, footerOutside = false }) {
  const { t, myUpn, setDraft, busyId, canDelete, setConfirmDeleteAuth } = ctx
  const busy = busyId === row.id
  const self = row.upn.trim().toLowerCase() === myUpn
  const { picked, dirty } = draftState(ctx, row)
  const extra = useMemo(
    () => row.apps.filter((a) => !ctx.known.isBusiness?.(a)),
    [row.apps, ctx.known],
  )
  const checklist = (
    <AppChecklist
      value={picked}
      onChange={(apps) => setDraft({ id: row.id, apps })}
      disabled={busy}
      extra={extra}
    />
  )

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-1 flex-col gap-6 p-4 @[30rem]/detail:p-5">
        <Address ctx={ctx} row={row} busy={busy} />
        <Group title={t("authz.ws.editor.role")}>
          <RoleSwitch ctx={ctx} row={row} self={self} busy={busy} />
        </Group>
        <Group title={t("authz.ws.col.apps")}>
          {row.isAdmin && APP_LOCK.adminBypass ? <AdminApps>{checklist}</AdminApps> : checklist}
        </Group>
        <Requests ctx={ctx} row={row} />
        <div className="border-t border-border/60 pt-4">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              canDelete(row) ? setConfirmDeleteAuth(row) : guard(t("authz.delete.self"))
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[0.8125rem] font-medium text-danger-ink transition-colors hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 pointer-coarse:h-11"
          >
            <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={1.8} />
            {t("authz.ws.editor.delete")}
          </button>
        </div>
      </div>
      {dirty && !footerOutside && (
        <div className="sticky bottom-0 z-10 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur">
          <SaveBar ctx={ctx} row={row} />
        </div>
      )}
    </div>
  )
}
