import { useEffect, useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import { DestructiveDialog } from "@/features/security/dialogs"
import { TextTabs } from "@/features/selfservice/board/TextTabs"
import { useLocale } from "@/hooks/useLocale"
import {
  approveRequest,
  deleteRequest,
  setRequestAdminNote,
  setRequestCompleted,
} from "@/lib/authorizations"
import { cn } from "@/lib/utils"
import { countLabel } from "../apps/countLabel"
import { lookupApp, useCatalogLookup } from "../apps/useCatalogLookup"
import { BTN, BTN_QUIET } from "./buttons"
import { hadAppBefore, undoApproval } from "./approveUndo"
import { useAuthzAction } from "./useAuthzAction"
import { groupRequests, inboxCounts, inboxView } from "./inbox"
import { RequestItem } from "./RequestItem"
import {
  GroupByMenu,
  GroupHead,
  InboxEmpty,
  InboxError,
  InboxGate,
  InboxSkeleton,
} from "./InboxParts"
import { useFocusNext } from "./useFocusNext"
import { useSlashFocus } from "./useSlashFocus"
import { SearchBox } from "./SearchBox"

const LIST =
  "divide-y divide-border/60 overflow-hidden rounded-2xl bg-muted/40 dark:bg-white/[0.04]"

/**
 * Talepler sekmesinin gövdesi — gelen kutusu üçlemesi (Bekleyen · Tamamlanan · Tümü), satır
 * içi karar (Gmail / Linear triage, GitHub erişim talepleri). Sayfa başı, KPI ve sekmeler
 * kabukta; burası h2'den başlar. Arşiv katlı ama erişilir: bu oturumda bir talep oraya
 * geçtiyse açık kalır ("onayladım, nereye gitti?" anı olmasın).
 */
export function RequestsInbox({ ctx }) {
  const { t, locale } = useLocale()
  const lookup = useCatalogLookup()
  const { busy, run } = useAuthzAction(ctx)
  const [segment, setSegment] = useState("pending")
  const [query, setQuery] = useState("")
  const [groupBy, setGroupBy] = useState("none")
  const [showDone, setShowDone] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const searchRef = useRef(null)
  const rootRef = useRef(null)
  const headingRef = useRef(null)
  // Silme kutusunu açan ⋯ düğmesi (vazgeçilince odak oraya döner).
  const returnRef = useRef(null)
  const { neighbors, refocus, returnTo } = useFocusNext(rootRef, headingRef)
  useSlashFocus(searchRef)

  const requests = useMemo(() => ctx.requests ?? [], [ctx.requests])
  const counts = useMemo(() => inboxCounts(requests), [requests])
  const view = useMemo(() => inboxView(requests, { segment: "all", query }), [requests, query])

  // İlk yükleme sayılmaz (arşiv kapalı açılır); sonraki tazelemede artış = bu oturumda taşındı.
  const prevDone = useRef(null)
  useEffect(() => {
    if (ctx.status !== "ready") return
    if (prevDone.current !== null && counts.done > prevDone.current) setShowDone(true)
    prevDone.current = counts.done
  }, [counts.done, ctx.status])

  if (!ctx.allowed) return <InboxGate text={t(ctx.gateKey)} />

  const local = (upn) => upn.split("@")[0]

  const act = async (row, fn, messages, delay) => {
    const order = neighbors(row.id)
    const ok = await run(row.id, fn, messages)
    if (ok) refocus(order, delay)
    return ok
  }

  // Seçili olmayan sekmenin sayısı daha koyu: soluk gri rozet zeminde AA'yı tutturmuyor.
  // İlk yüklemede sayı yazılmaz: cevap gelmeden "0" demek yarım saniyelik bir yalan.
  const badge = (n, on) =>
    on ? (
      n.toLocaleString(locale)
    ) : (
      <span className="text-foreground/75">{n.toLocaleString(locale)}</span>
    )
  const approve = (row) => {
    const req = { upn: row.upn, app: row.app, requestId: row.id }
    const had = hadAppBefore(ctx.authorizations, req)
    return act(row, () => approveRequest(req), {
      done: t("authz.inbox.approved", { person: local(row.upn), app: row.app }),
      undo: {
        label: t("authz.req.reopen"),
        onClick: () =>
          run(row.id, () => undoApproval(req, had), { done: t("authz.inbox.approveUndone") }),
      },
    })
  }
  // Bildirimdeki "Geri al" odağı taşımaz (kullanıcı o an başka yerde olabilir).
  const undoClose = (row) =>
    run(row.id, () => setRequestCompleted(row.id, false), { done: t("authz.inbox.reopened") })
  const reopen = (row) =>
    act(row, () => setRequestCompleted(row.id, false), { done: t("authz.inbox.reopened") })
  const close = (row) =>
    act(row, () => setRequestCompleted(row.id, true), {
      done: t("authz.inbox.closed"),
      undo: { label: t("authz.req.reopen"), onClick: () => undoClose(row) },
    })
  const saveNote = (row, text) =>
    run(row.id, () => setRequestAdminNote(row.id, text), { done: t("authz.inbox.noteSaved") })
  const remove = async (row) => {
    const ok = await act(row, () => deleteRequest(row.id), { done: t("authz.inbox.deleted") }, 250)
    if (ok) setConfirm(null)
  }

  // Toplu onay SIRAYLA: aynı kişinin iki talebi aynı satırı okuyup birbirinin yazdığını ezmesin.
  const approveAll = async (g) => {
    const last = g.items[g.items.length - 1]
    const order = neighbors(last.id).filter((id) => !g.items.some((r) => r.id === id))
    const ok = await run(
      `group:${g.key}`,
      async () => {
        for (const row of g.items) {
          await approveRequest({ upn: row.upn, app: row.app, requestId: row.id })
        }
      },
      {
        done: t("authz.inbox.approvedMany", {
          count: countLabel(t, locale, "authz.apps.pending", g.items.length),
        }),
      },
    )
    if (ok) refocus(order)
  }

  const renderList = (list, showStatus) =>
    groupRequests(list, groupBy).map((g) => {
      const groupBusy = busy === `group:${g.key}`
      const bulk = groupBy !== "none" && g.items.length > 1 && g.items.every((r) => !r.isCompleted)
      return (
        <div key={g.key} className="space-y-2">
          {groupBy !== "none" && (
            <GroupHead
              by={groupBy}
              label={g.label}
              count={g.items.length}
              lookup={lookup}
              action={
                bulk ? (
                  <button
                    type="button"
                    onClick={() => approveAll(g)}
                    disabled={groupBusy}
                    className={cn(BTN, BTN_QUIET, "shrink-0 px-2 text-brand-ink")}
                  >
                    {t("authz.inbox.approveAll")}
                  </button>
                ) : null
              }
            />
          )}
          <ul className={LIST}>
            {g.items.map((row) => (
              <RequestItem
                key={row.id}
                row={row}
                app={lookupApp(lookup, row.app)}
                groupedBy={groupBy === "none" ? null : groupBy}
                busy={busy === row.id || groupBusy}
                showStatus={showStatus}
                onApprove={() => approve(row)}
                onClose={() => close(row)}
                onReopen={() => reopen(row)}
                onDelete={(from) => {
                  returnRef.current = from
                  setConfirm(row)
                }}
                onSaveNote={(text) => saveNote(row, text)}
              />
            ))}
          </ul>
        </div>
      )
    })

  const loading = ctx.status === "loading" || ctx.status === "idle"
  const firstLoad = loading && requests.length === 0 && !ctx.error
  const searching = query.trim().length > 0
  // Sayılar ilk başarılı yüklemeden sonra: cevap yokken ya da yüklenemediyse "0" yalan olur.
  const known = !!ctx.fetchedAt
  // Yüklenemeyen liste "talep yok" demez: yalnız hata şeridi kalır.
  const nothing = !firstLoad && requests.length === 0 && !ctx.error

  return (
    <section
      ref={rootRef}
      aria-labelledby="authz-inbox-h"
      className="@container/inbox flex max-w-6xl flex-col gap-4"
    >
      <h2 id="authz-inbox-h" ref={headingRef} tabIndex={-1} className="sr-only">
        {t("authz.inbox.heading")}
      </h2>

      <div className="flex flex-col gap-3 @[44rem]/inbox:flex-row @[44rem]/inbox:items-center">
        <TextTabs
          label={t("authz.filter.label")}
          value={segment}
          onChange={setSegment}
          size="sm"
          className="pointer-coarse:[&>button]:min-w-11"
          options={[
            {
              value: "pending",
              label: t("authz.filter.pending"),
              count: known ? badge(counts.pending, segment === "pending") : undefined,
            },
            {
              value: "done",
              label: t("authz.filter.done"),
              count: known ? badge(counts.done, segment === "done") : undefined,
            },
            { value: "all", label: t("authz.filter.all") },
          ]}
        />
        <div className="flex min-w-0 flex-1 items-center gap-2 @[44rem]/inbox:justify-end">
          <SearchBox
            ref={searchRef}
            value={query}
            onChange={setQuery}
            placeholder={t("authz.inbox.search")}
            className="@[44rem]/inbox:max-w-72"
          />
          <GroupByMenu value={groupBy} onChange={setGroupBy} />
        </div>
      </div>

      {ctx.error ? <InboxError ctx={ctx} /> : null}

      {firstLoad ? (
        <InboxSkeleton />
      ) : ctx.error && requests.length === 0 ? null : nothing ? (
        <InboxEmpty title={t("authz.req.empty")} />
      ) : (
        <>
          {segment !== "done" &&
            (view.pending.length > 0 ? (
              renderList(view.pending, segment === "all")
            ) : searching ? (
              <InboxEmpty title={t("authz.search.empty")} quiet />
            ) : (
              <InboxEmpty
                success
                title={t("authz.req.allDone")}
                action={
                  counts.done > 0 && segment === "pending"
                    ? { label: t("authz.inbox.showDone"), onClick: () => setSegment("done") }
                    : null
                }
              />
            ))}

          {segment === "pending" && view.done.length > 0 && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowDone((v) => !v)}
                aria-expanded={showDone}
                className="flex min-h-10 w-full items-center gap-2 rounded-lg px-1 text-start text-[0.8125rem] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11"
              >
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  className={cn(
                    "size-4 transition-transform",
                    !showDone && "-rotate-90 rtl:rotate-90",
                  )}
                  strokeWidth={2}
                />
                {t("authz.req.doneGroup")}
                <span className="tabular-nums">{view.done.length.toLocaleString(locale)}</span>
              </button>
              {showDone && renderList(view.done, false)}
            </div>
          )}

          {segment !== "pending" &&
            (view.done.length > 0 ? (
              <div className="space-y-2">
                {segment === "all" && (
                  <h3 className="px-1 text-[0.8125rem] font-medium text-muted-foreground">
                    {t("authz.req.doneGroup")}
                  </h3>
                )}
                {renderList(view.done, false)}
              </div>
            ) : segment === "done" ? (
              <InboxEmpty
                title={searching ? t("authz.search.empty") : t("authz.inbox.noDone")}
                quiet
              />
            ) : null)}
        </>
      )}

      <DestructiveDialog
        open={!!confirm}
        onOpenChange={(o) => {
          if (o) return
          setConfirm(null)
          returnTo(returnRef.current)
        }}
        icon={Delete02Icon}
        title={t("authz.req.delete.title")}
        description={t("authz.req.delete.body.short")}
        subject={confirm ? `${confirm.app} · ${confirm.upn}` : null}
        consequences={[
          { kind: "lose", text: t("authz.req.delete.lose") },
          { kind: "keep", text: t("authz.req.delete.approveInstead") },
        ]}
        confirmLabel={t("authz.req.delete")}
        cancelLabel={t("authz.cancel")}
        onConfirm={() => remove(confirm)}
        busy={!!confirm && busy === confirm.id}
      />
    </section>
  )
}
