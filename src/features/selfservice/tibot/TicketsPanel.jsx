import "@/lib/i18n/tibot"
import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import LinkSquare02Icon from "@hugeicons/core-free-icons/LinkSquare02Icon"
import { ActionButton } from "@/components/common/ActionButton"
import { TicketRow } from "@/components/tibot/TicketRow"
import { TicketSheet } from "@/components/tibot/TicketSheet"
import { useLocale } from "@/hooks/useLocale"
import { useTibotTickets } from "@/hooks/useTibotTickets"
import { getDateTimeFormat } from "@/lib/intl-cache"
import {
  bucketUrl,
  buckets,
  defaultBucket,
  filterRows,
  groupByMonth,
  hasFilters,
} from "@/lib/tibot/tibotModel"
import { cn } from "@/lib/utils"
import { MONTH } from "../kinds"
import { usePhone } from "../layout/phone"
import { TicketsToolbar } from "./TicketsToolbar"

const NOTE = "rounded-2xl bg-muted/50 px-4 py-3 text-[0.8125rem] text-foreground/80"

function Skeleton() {
  return (
    <div aria-hidden="true" className="mt-4 space-y-2">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="ms-skeleton block h-16 rounded-xl" />
      ))}
    </div>
  )
}

/** Ay grupları — Self Servis listesinin düzeni (`RecordList`): küçük büyük harfli ay, beyaz kart. */
function MonthGroups({ rows, bucket, openId, onOpen }) {
  const { t, locale } = useLocale()
  const phone = usePhone()
  const monthFmt = getDateTimeFormat(locale, MONTH)
  const groups = useMemo(() => groupByMonth(rows), [rows])
  const title = (key) => (key ? monthFmt.format(new Date(`${key}-01T12:00:00`)) : t("tibot.noDate"))
  return (
    <div className={cn("min-w-0", phone ? "space-y-5 pt-3" : "space-y-6 pt-4")}>
      {groups.map((g) => (
        <section key={g.key || "none"} aria-label={title(g.key)} className="min-w-0">
          <h3 className="flex items-baseline gap-2 px-3 pb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {title(g.key)}
            <span className="font-medium normal-case tracking-normal">· {g.items.length}</span>
          </h3>
          <ul className="ms-surface rounded-[1.5rem] p-1.5">
            {g.items.map((row) => (
              <TicketRow
                key={row.requestId}
                row={row}
                bucket={bucket}
                active={openId === row.requestId}
                onOpen={onOpen}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

/**
 * Tibotlar › Açık Talepler: Xurrent'teki açık talepler üç görünümde — bana atanan · tarafımdan
 * açılanlar · ekibim. Kayıt sekmelerinin düzeni: çipler, filtreler (Ekibim'de atanan · durum ·
 * servis · açılış ayı), arama, açılış ayına göre gruplar; basınca ayrıntı + notlar
 * (`TicketSheet`). Her görünüm en yeni 50 ile açılır; fazlası kişi isteyince 50'şer ("Daha fazla",
 * aynı anda tek istek), kova başına en çok 500 — sonrası "Xurrent'te tümü" bağlantısıyla.
 */
export default function TicketsPanel() {
  const { t } = useLocale()
  const { status, data, pages, loadMore, more } = useTibotTickets(true)
  const views = useMemo(() => buckets(data, undefined, pages), [data, pages])
  const [pick, setPick] = useState(null)
  const [filters, setFilters] = useState({})
  const [open, setOpen] = useState(null)
  const bucket = pick ?? defaultBucket(views)
  const view = views.find((v) => v.id === bucket)
  const rows = useMemo(() => filterRows(view?.items ?? [], filters), [view, filters])
  const filtered = hasFilters(filters)

  return (
    <div className="mt-1">
      <TicketsToolbar
        views={views}
        bucket={bucket}
        onBucket={(id) => {
          setPick(id)
          setFilters({})
        }}
        items={view?.items ?? []}
        filters={filters}
        onFilters={setFilters}
      />
      {status === "loading" ? (
        <Skeleton />
      ) : status !== "ready" ? (
        <p role="status" className={`${NOTE} mt-4`}>
          {t(status === "denied" ? "tibot.denied" : "tibot.failed")}
        </p>
      ) : !data?.person ? (
        <p role="status" className={`${NOTE} mt-4`}>
          {t("tibot.noPerson")}
        </p>
      ) : (
        <>
          {rows.length ? (
            <MonthGroups
              rows={rows}
              bucket={bucket}
              openId={open?.requestId}
              onOpen={(r) => setOpen({ ...r, bucket })}
            />
          ) : (
            <p role="status" className={`${NOTE} mt-4`}>
              {t(filtered ? "tibot.noMatch" : `tibot.empty.${bucket}`)}
            </p>
          )}
          {filtered && view.truncated && (
            <p className="mt-3 text-[0.6875rem] text-muted-foreground">
              {t("tibot.searchLoaded", { n: view.items.length })}
            </p>
          )}
          {view.more.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <ActionButton
                tone="soft"
                size="toolbar"
                onClick={() => loadMore(view)}
                disabled={more.busy}
                aria-busy={more.busy || undefined}
              >
                {t(more.busy ? "tibot.loadingMore" : "tibot.loadMore", {
                  shown: view.items.length,
                  total: view.count,
                })}
              </ActionButton>
              {more.failed && (
                <span role="status" className="text-[0.75rem] text-red-700 dark:text-red-300">
                  {t("tibot.moreFailed")}
                </span>
              )}
            </div>
          )}
          {view.truncated && view.more.length === 0 && (
            <a
              href={bucketUrl(bucket)}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-4 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-brand-ink hover:underline"
            >
              {t("tibot.truncated", { shown: view.items.length, total: view.count })}
              <HugeiconsIcon
                icon={LinkSquare02Icon}
                className="size-3.5"
                strokeWidth={2}
                aria-hidden="true"
              />
            </a>
          )}
        </>
      )}
      <p className="mt-12 text-[0.6875rem] text-muted-foreground">{t("tibot.source")}</p>
      <TicketSheet row={open} onOpenChange={(o) => !o && setOpen(null)} />
    </div>
  )
}
