import { useMemo, useState } from "react"
import { ErrorCause } from "@/components/common/ErrorCause"
import { BrandDialog } from "@/features/security/dialogs"
import { Button } from "@/components/ui/button"
import { useBackToClose } from "@/hooks/useBackToClose"
import { useLocale } from "@/hooks/useLocale"
import { APP_LOCK } from "@/lib/appLockPolicy"
import { bulkOptions, planBulk } from "@/features/security/lib/authzBulk"
import { cn } from "@/lib/utils"
import { AppOptions } from "./AppFilter"
import { useBulkRun } from "./useBulkRun"

const PRIMARY =
  "h-9 bg-brand-fill-deep px-3.5 text-[0.8125rem] text-brand-on-brand hover:bg-brand-fill-deep"
const SECONDARY = "h-9 px-3 text-[0.8125rem]"

function Line({ label, value, tone }) {
  return (
    <div className="flex min-h-11 items-center gap-3 px-4 py-2">
      <dt className="min-w-0 flex-1 text-sm">{label}</dt>
      <dd className={cn("text-base font-semibold tabular-nums", tone)}>{value}</dd>
    </div>
  )
}

/**
 * Toplu uygulama ver / al (M365 "toplu atama"): uygulama seç → ne olacağının dökümü (kaç kişi
 * değişir, kaçı zaten öyle — atlanır, kaç yönetici etkilenmez) → yazılır (ilerleme, Durdur) →
 * sonuç (başarılı · atlandı · hata, hatalılar için Tekrar dene). Plan `features/security/lib/authzBulk.js`.
 */
export function BulkDialog({ ctx, mode, rows, onClose, onDone }) {
  const { t, locale } = useLocale()
  const nf = new Intl.NumberFormat(locale)
  const [apps, setApps] = useState([])
  const [step, setStep] = useState("pick")
  // Yazmaya başlarken plan dondurulur: tazelenen liste sonucu ("atlandı") değiştirmesin.
  const [frozen, setFrozen] = useState(null)
  const run = useBulkRun(ctx.reload)
  // Seçenek sayıları seçili kişiler içinde; almada yalnız onların taşıdığı adlar.
  const options = useMemo(() => bulkOptions(rows, ctx.catalog, mode), [rows, ctx.catalog, mode])
  const plan = useMemo(
    () => planBulk(rows, { mode, apps, adminBypass: APP_LOCK.adminBypass }),
    [rows, mode, apps],
  )
  const { phase, done, total, ok, failed, cancelled } = run.state
  const running = phase === "running"
  const title = t(mode === "grant" ? "security.bulk.grantTitle" : "security.bulk.revokeTitle")
  const close = () => {
    if (running) return false
    if (phase === "done") onDone(failed.map((c) => c.id))
    onClose()
  }
  // Geri tuşu kutuyu kapatır; yazma sürerken kapanmaz (adım yeniden eklenir).
  useBackToClose(true, close)

  let body
  let footer
  if (phase === "running" || phase === "done") {
    const skipped = (frozen ?? plan).unchanged.length + (frozen ?? plan).admins.length
    body =
      phase === "running" ? (
        <div className="flex flex-col gap-2" aria-live="polite">
          <p className="text-sm tabular-nums">
            {t("security.bulk.progress", { done: nf.format(done), total: nf.format(total) })}
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]">
            <div
              className="h-full rounded-full bg-brand-fill-deep transition-[width]"
              style={{ width: `${total ? Math.round((done / total) * 100) : 0}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <dl className="divide-y divide-border/60 rounded-2xl bg-muted/40 dark:bg-white/[0.04]">
            <Line
              label={t("security.bulk.ok")}
              value={nf.format(ok.length)}
              tone="text-success-ink"
            />
            <Line label={t("security.bulk.skipped")} value={nf.format(skipped)} />
            {cancelled.length > 0 && (
              <Line label={t("security.bulk.cancelled")} value={nf.format(cancelled.length)} />
            )}
            {failed.length > 0 && (
              <Line
                label={t("security.bulk.failed")}
                value={nf.format(failed.length)}
                tone="text-danger-ink"
              />
            )}
          </dl>
          {/* Kimin yazılamadığı adıyla (M365 toplu işlem sonucu): yönetici tek tek bakabilsin. */}
          {failed.length > 0 && (
            <ul
              aria-label={t("security.bulk.failed")}
              className="px-1 text-xs text-muted-foreground"
            >
              {failed.slice(0, 5).map((c) => (
                <li key={c.id} className="truncate">
                  {c.upn}
                </li>
              ))}
              {failed.length > 5 && <li>{t("authz.ws.more", { n: failed.length - 5 })}</li>}
            </ul>
          )}
          <ErrorCause detail={run.state.failDetail} className="mt-1" />
        </div>
      )
    footer = running ? (
      <Button variant="outline" className={SECONDARY} onClick={run.cancel}>
        {t("security.bulk.stop")}
      </Button>
    ) : (
      <>
        {failed.length + cancelled.length > 0 && (
          <Button
            variant="outline"
            className={SECONDARY}
            onClick={() => run.start([...failed, ...cancelled], { retry: true })}
          >
            {t("security.bulk.retry")}
          </Button>
        )}
        <Button className={PRIMARY} onClick={close}>
          {t("security.bulk.close")}
        </Button>
      </>
    )
  } else if (step === "confirm") {
    body = (
      <div className="flex flex-col gap-3">
        <div>
          <p
            lang={locale}
            className="mb-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground"
          >
            {t("authz.ws.col.apps")}
          </p>
          <ul className="flex flex-wrap gap-1">
            {apps.map((a) => (
              <li
                key={a}
                lang="tr"
                className="inline-flex h-6 items-center rounded-full bg-foreground/[0.06] px-2 text-xs"
              >
                {a}
              </li>
            ))}
          </ul>
        </div>
        <dl className="divide-y divide-border/60 rounded-2xl bg-muted/40 dark:bg-white/[0.04]">
          <Line label={t("security.bulk.changes")} value={nf.format(plan.changes.length)} />
          <Line
            label={t(mode === "grant" ? "security.bulk.alreadyHas" : "security.bulk.alreadyNot")}
            value={nf.format(plan.unchanged.length)}
          />
          {plan.admins.length > 0 && (
            <Line label={t("security.bulk.admins")} value={nf.format(plan.admins.length)} />
          )}
        </dl>
        {plan.changes.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("security.bulk.nothing")}</p>
        )}
      </div>
    )
    footer = (
      <>
        <Button variant="ghost" className={SECONDARY} onClick={() => setStep("pick")}>
          {t("security.bulk.back")}
        </Button>
        <Button
          className={PRIMARY}
          disabled={!plan.changes.length}
          onClick={() => {
            setFrozen(plan)
            run.start(plan.changes)
          }}
        >
          {t("security.bulk.apply", { n: nf.format(plan.changes.length) })}
        </Button>
      </>
    )
  } else {
    body = (
      <div className="flex flex-col gap-2">
        <AppOptions options={options} value={apps} onChange={setApps} />
        <p className="text-xs text-muted-foreground">{t("security.bulk.countHint")}</p>
      </div>
    )
    footer = (
      <>
        <Button variant="ghost" className={SECONDARY} onClick={onClose}>
          {t("authz.cancel")}
        </Button>
        <Button className={PRIMARY} disabled={!apps.length} onClick={() => setStep("confirm")}>
          {t("security.bulk.next")}
        </Button>
      </>
    )
  }

  return (
    <BrandDialog
      open
      onOpenChange={(o) => !o && close()}
      title={title}
      description={t("security.bulk.people", { n: nf.format(rows.length) })}
      busy={running}
      plain
      footer={footer}
      className="sm:max-w-md"
    >
      {body}
    </BrandDialog>
  )
}
