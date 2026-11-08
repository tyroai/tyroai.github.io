import { useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import UserAdd01Icon from "@hugeicons/core-free-icons/UserAdd01Icon"
import UserRemove01Icon from "@hugeicons/core-free-icons/UserRemove01Icon"
import { UpnField } from "@/features/admin/UpnField"
import { DestructiveDialog } from "@/features/security/dialogs"
import { useLocale } from "@/hooks/useLocale"
import { APP_LOCK } from "@/lib/appLockPolicy"
import { approveRequest, createAuthorization, updateAuthorizedApps } from "@/lib/authorizations"
import { fold } from "@/lib/fold"
import { cn } from "@/lib/utils"
import { hadAppBefore, undoApproval } from "../requests/approveUndo"
import { BTN, BTN_PRIMARY, BTN_QUIET } from "../requests/buttons"
import { Age, PersonLine } from "../requests/RequestItem"
import { SearchBox } from "../requests/SearchBox"
import { useAuthzAction } from "../requests/useAuthzAction"
import { useFocusNext } from "../requests/useFocusNext"
import { CountText } from "./AppBits"
import { addPlan, appAdmins, appMembers, appRequests, withoutApp } from "./appIndex"

const PAGE = 50
const H3 = "mb-2 flex items-center gap-2 text-[0.8125rem] font-semibold"
const GROUP =
  "divide-y divide-border/60 overflow-hidden rounded-2xl bg-muted/40 dark:bg-white/[0.04]"
const local = (upn) => upn.split("@")[0]

/** Uyarı/bilgi notu (katalog dışı ad, kilitsiz uygulama) — açık olmayan bilgi, tek cümle. */
function Note({ tone, children }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-xl px-3 py-2 text-xs leading-relaxed",
        tone === "warning"
          ? "bg-warning/12 text-warning-ink"
          : "bg-muted/50 text-muted-foreground dark:bg-white/[0.04]",
      )}
    >
      {tone === "warning" && (
        <HugeiconsIcon
          icon={Alert02Icon}
          aria-hidden="true"
          className="mt-0.5 size-3.5 shrink-0"
          strokeWidth={2}
        />
      )}
      {children}
    </p>
  )
}

/**
 * Bir uygulamanın ayrıntısı: bekleyen talepleri (Onayla), kişi ekleme, erişimi olanlar
 * (kaldırma onaylı), kilidi atlayan yöneticiler (AYRI liste — onlara bu uygulama verilmedi,
 * yalnız kilit uygulanmıyor) ve Kişiler sekmesine geçiş.
 */
export function AppDetail({ ctx, app, onShowUsers }) {
  const { t } = useLocale()
  const { busy, run } = useAuthzAction(ctx)
  const rows = ctx.authorizations
  const members = useMemo(() => appMembers(rows, app.key), [rows, app.key])
  const admins = useMemo(() => appAdmins(rows, app.key, APP_LOCK.adminBypass), [rows, app.key])
  const requests = useMemo(() => appRequests(ctx.requests, app.key), [ctx.requests, app.key])
  const taken = useMemo(() => new Set(rows.map((r) => r.upn.trim().toLowerCase())), [rows])
  const [upn, setUpn] = useState("")
  const [typing, setTyping] = useState(false)
  const [query, setQuery] = useState("")
  const [limit, setLimit] = useState(PAGE)
  const [confirm, setConfirm] = useState(null)
  // Kaldırınca odak sıradaki kişiye, kutudan vazgeçince açan düğmeye (gövdeye düşmesin).
  const listRef = useRef(null)
  const headRef = useRef(null)
  const returnRef = useRef(null)
  const { neighbors, refocus, returnTo } = useFocusNext(listRef, headRef, "member")

  const plan = addPlan(rows, upn, app.key)
  // Kilitli olan yalnız katalogdaki asistan ve AI ürünü: iş uygulaması herkese açık, katalog
  // dışı ad hiçbir şey açmıyor — ikisinde kişi eklemek ve "yöneticiler" listesi anlamsız.
  const lockable = app.group === "agents" || app.group === "ai"
  const needle = fold(query)
  const shown = needle ? members.filter((r) => fold(r.upn).includes(needle)) : members

  const grant = async () => {
    const person = upn.trim()
    const done = t("authz.inbox.approved", { person: local(person), app: app.name })
    const ok =
      plan.kind === "update"
        ? await run("add", () => updateAuthorizedApps(plan.row.id, [...plan.row.apps, app.name]), {
            done,
          })
        : await run(
            "add",
            () => createAuthorization({ upn: person, apps: [app.name], isAdmin: false }),
            { done },
          )
    if (ok) setUpn("")
  }
  const revoke = async (row) => {
    const order = neighbors(row.id)
    const ok = await run(
      row.id,
      () => updateAuthorizedApps(row.id, withoutApp(row.apps, app.key)),
      {
        done: t("authz.apps.removed", { person: local(row.upn), app: app.name }),
      },
    )
    if (ok) {
      setConfirm(null)
      refocus(order, 250)
    }
  }
  const approve = (req) => {
    const r = { upn: req.upn, app: req.app, requestId: req.id }
    const had = hadAppBefore(rows, r)
    return run(req.id, () => approveRequest(r), {
      done: t("authz.inbox.approved", { person: local(req.upn), app: req.app }),
      undo: {
        label: t("authz.req.reopen"),
        onClick: () =>
          run(req.id, () => undoApproval(r, had), { done: t("authz.inbox.approveUndone") }),
      },
    })
  }

  const hint =
    plan.kind === "invalid" && !typing
      ? t("authz.new.malformed")
      : plan.kind === "already"
        ? t("authz.apps.already")
        : plan.kind === "update"
          ? plan.row.isAdmin && APP_LOCK.adminBypass
            ? t("authz.apps.addAdmin")
            : t("authz.apps.addExisting")
          : plan.kind === "create"
            ? t("authz.apps.addNew")
            : null

  return (
    <div className="@container flex flex-col gap-6 pb-4">
      {app.group === "other" && <Note tone="warning">{t("authz.apps.orphanNote")}</Note>}
      {app.group === "business" && <Note>{t("authz.apps.publicNote")}</Note>}

      {requests.length > 0 && (
        <section>
          <h3 className={H3}>
            {t("authz.apps.requests")}
            <span className="tabular-nums font-normal text-muted-foreground">
              {requests.length}
            </span>
          </h3>
          <ul className={GROUP}>
            {requests.map((req) => (
              <li key={req.id} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <PersonLine upn={req.upn} className="text-[0.8125rem]" />
                  <Age iso={req.createdOn} pending />
                </div>
                {req.userNote ? (
                  <p className="mt-1.5 whitespace-pre-wrap break-words border-s-2 border-border ps-3 text-[0.8125rem] leading-relaxed">
                    {req.userNote}
                  </p>
                ) : null}
                <div className="mt-2.5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => approve(req)}
                    disabled={busy === req.id}
                    className={cn(BTN, BTN_PRIMARY)}
                  >
                    <HugeiconsIcon icon={Tick02Icon} className="size-4" strokeWidth={2} />
                    {t("authz.req.approve")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {lockable && (
        <section>
          <h3 className={H3}>
            <label htmlFor={`authz-add-${app.key}`}>{t("authz.apps.add")}</label>
          </h3>
          <div className="flex flex-col gap-2 pointer-coarse:[&_input]:h-11">
            <UpnField
              id={`authz-add-${app.key}`}
              value={upn}
              onChange={setUpn}
              onFocusChange={setTyping}
              disabled={busy === "add"}
              warn={plan.kind === "already"}
              taken={taken}
              placeholder={t("authz.new.placeholder")}
            />
            {hint ? <p className="text-xs leading-snug text-muted-foreground">{hint}</p> : null}
            <button
              type="button"
              onClick={grant}
              disabled={busy === "add" || (plan.kind !== "update" && plan.kind !== "create")}
              className={cn(
                BTN,
                BTN_PRIMARY,
                "self-end disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 @max-[24rem]:w-full dark:disabled:bg-white/[0.06]",
              )}
            >
              <HugeiconsIcon icon={UserAdd01Icon} className="size-4" strokeWidth={2} />
              {t("authz.apps.addAction")}
            </button>
          </div>
        </section>
      )}

      {(lockable || members.length > 0) && (
        <section>
          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 ref={headRef} tabIndex={-1} className={cn(H3, "mb-0 outline-none")}>
              {t("authz.apps.members")}
              <span className="tabular-nums font-normal text-muted-foreground">
                {members.length}
              </span>
            </h3>
            {onShowUsers && members.length > 0 && (
              <button
                type="button"
                onClick={() => onShowUsers(app.name)}
                className={cn(BTN, BTN_QUIET, "-me-2 ms-auto px-2 text-brand-ink")}
              >
                {t("authz.apps.showUsers")}
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  aria-hidden="true"
                  className="size-4 rtl:rotate-180"
                  strokeWidth={2}
                />
              </button>
            )}
          </div>
          {members.length > 8 && (
            <SearchBox
              value={query}
              onChange={setQuery}
              placeholder={t("authz.apps.membersSearch")}
              className="mb-2 block"
            />
          )}
          {shown.length === 0 ? (
            <p className="rounded-2xl bg-muted/40 px-4 py-6 text-center text-[0.8125rem] text-muted-foreground dark:bg-white/[0.04]">
              {members.length === 0 ? t("authz.apps.membersEmpty") : t("authz.search.empty")}
            </p>
          ) : (
            <ul ref={listRef} className={GROUP}>
              {shown.slice(0, limit).map((row) => (
                <li
                  key={row.id}
                  data-member={row.id}
                  className="flex min-h-12 items-center gap-2 py-1 ps-4 pe-1.5 pointer-coarse:min-h-14"
                >
                  <PersonLine upn={row.upn} className="flex-1 text-[0.8125rem]" />
                  <button
                    type="button"
                    onClick={(e) => {
                      returnRef.current = e.currentTarget
                      setConfirm(row)
                    }}
                    disabled={busy === row.id}
                    aria-label={`${t("authz.apps.remove")}: ${row.upn}`}
                    title={t("authz.apps.remove")}
                    className={cn(
                      BTN,
                      BTN_QUIET,
                      "w-9 shrink-0 px-0 text-muted-foreground pointer-coarse:w-11",
                    )}
                  >
                    <HugeiconsIcon icon={UserRemove01Icon} className="size-4" strokeWidth={1.8} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {shown.length > limit && (
            <button
              type="button"
              onClick={() => setLimit((n) => n + PAGE * 4)}
              className={cn(BTN, BTN_QUIET, "mt-2 w-full")}
            >
              {t("authz.apps.more")} ·{" "}
              <CountText base="authz.apps.people" n={shown.length - limit} />
            </button>
          )}
        </section>
      )}

      {lockable && admins.length > 0 && (
        <details className="group">
          <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-lg text-[0.8125rem] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11 [&::-webkit-details-marker]:hidden">
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              aria-hidden="true"
              className="size-4 text-muted-foreground transition-transform group-open:rotate-90 rtl:rotate-180 rtl:group-open:rotate-90"
              strokeWidth={2}
            />
            {t("authz.apps.admins")}
            <span className="tabular-nums font-normal text-muted-foreground">{admins.length}</span>
          </summary>
          <p className="mb-2 mt-1 text-xs leading-relaxed text-muted-foreground">
            {t("authz.apps.adminsNote")}
          </p>
          <ul className={GROUP}>
            {admins.map((row) => (
              <li key={row.id} className="flex min-h-11 items-center px-4 py-2">
                <PersonLine upn={row.upn} className="text-[0.8125rem] opacity-80" />
              </li>
            ))}
          </ul>
        </details>
      )}

      <DestructiveDialog
        open={!!confirm}
        onOpenChange={(o) => {
          if (o) return
          setConfirm(null)
          returnTo(returnRef.current)
        }}
        icon={UserRemove01Icon}
        title={t("authz.apps.removeTitle")}
        description={t("authz.apps.removeBody", { app: app.name })}
        subject={confirm ? `${app.name} · ${confirm.upn}` : null}
        consequences={[
          { kind: "lose", text: t("authz.apps.removeLose") },
          { kind: "keep", text: t("authz.apps.removeKeep") },
        ]}
        confirmLabel={t("authz.apps.remove")}
        cancelLabel={t("authz.cancel")}
        onConfirm={() => revoke(confirm)}
        busy={!!confirm && busy === confirm.id}
      />
    </div>
  )
}
