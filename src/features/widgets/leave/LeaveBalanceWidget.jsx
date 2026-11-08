import "@/lib/i18n/selfService"
import { useMemo } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import SunglassesIcon from "@hugeicons/core-free-icons/SunglassesIcon"
import { ErrorCause } from "@/components/common/ErrorCause"
import { useLeaveSummary } from "@/features/widgets/hooks/useLeaveSummary"
import { useLocale } from "@/hooks/useLocale"
import { useMyProfileDetails } from "@/hooks/useMyProfileDetails"
import { getNumberFormat, pluralKey } from "@/lib/intl-cache"
import { leaveSummary } from "@/lib/leaveSummary"
import { hireDayOf } from "@/lib/selfServiceProfile"
import { useSlotSize } from "../slotSize"
import { WidgetBody } from "../WidgetBody"
import { WidgetEmpty } from "../WidgetEmpty"
import { FrameAction, WidgetFrame } from "../WidgetFrame"
import { leaveFacts } from "./leaveFacts"
import { LeaveRing } from "./LeaveRing"
import "./leaveBalance.css"

const NUM = { maximumFractionDigits: 1 }

/** Yükleniyor: halka ve iki satır gerçek yerinde (sonuç gelince kart zıplamasın). */
function Skeleton() {
  return (
    <div aria-hidden="true" className="lv-body">
      <span className="lv-sum flex items-center gap-3.5">
        <span className="lv-ring ms-skeleton rounded-full" />
        <span className="flex-1 space-y-2">
          <span className="ms-skeleton block h-3 w-28 rounded" />
          <span className="ms-skeleton block h-3 w-20 rounded" />
        </span>
      </span>
    </div>
  )
}

function Summary({ sum, size }) {
  const { t, locale } = useLocale()
  const num = getNumberFormat(locale, NUM)
  const days = (n) => t(pluralKey("selfService.days", locale, n), { n: num.format(n) })
  const facts = leaveFacts(sum, { t, locale, days, num })
  const known = sum.remain != null
  return (
    <div className="lv-body" data-size={size ?? undefined}>
      <Link
        to="/self-service"
        className="lv-sum -m-1.5 flex min-w-0 items-center gap-3.5 rounded-2xl p-1.5 outline-none transition hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <LeaveRing share={sum.share} pendingShare={sum.pendingShare}>
          <span data-private="" className="lv-num">
            {known ? num.format(sum.free) : "—"}
          </span>
          {known && (
            <span className="lv-unit">
              {t(pluralKey("selfService.accrual.unit", locale, sum.free))}
            </span>
          )}
        </LeaveRing>
        <span data-private="" className="min-w-0 flex-1">
          <span className="block text-[0.75rem] leading-snug text-muted-foreground">
            {known
              ? t("selfService.tile.balanceCaption", {
                  claim: num.format(sum.claim ?? 0),
                  used: num.format(sum.used ?? 0),
                })
              : t("selfService.tile.noBalance")}
          </span>
          {sum.pending > 0 && (
            <span className="mt-1 flex items-center gap-1.5 text-[0.75rem] font-medium leading-snug text-warning-ink">
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-warning" />
              {t("widgets.leave.pending", { days: days(sum.pending) })}
            </span>
          )}
          {sum.pending > 0 && known && (
            <span className="lv-after block text-[0.6875rem] leading-snug text-muted-foreground">
              {t("widgets.leave.erp", { days: days(sum.remain) })}
            </span>
          )}
        </span>
      </Link>
      {facts.length > 0 && (
        <ul className="lv-facts">
          {facts.map((f) => (
            <li key={f.key} className="lv-fact">
              <Link
                to={f.to}
                className="lv-fact-link -mx-1.5 flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1.5 outline-none transition hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-muted/60 text-muted-foreground">
                  <HugeiconsIcon icon={f.icon} className="size-4" strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.6875rem] text-muted-foreground">
                    {f.label}
                  </span>
                  <span data-private="" className="lv-fact-value block text-[0.75rem] font-medium">
                    {f.value}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * İzin bakiyem — ERP'deki yıllık izin bakiyesi (Self Servis'teki sayı), onaydaki talepler,
 * sıradaki izin, köprü fırsatı ve tahmini hak ediş. Veri `useLeaveSummary`: Self Servis yakın
 * zamanda açıldıysa onun verisi, değilse hafif bir okuma. "İzin iste" Self Servis'te izin
 * formunu açar (`?new=leave`). Mini kart tek bilgi satırı, büyük kart hepsi (`leaveBalance.css`).
 */
export function LeaveBalanceWidget({ ctx, className }) {
  const { t } = useLocale()
  const res = useLeaveSummary()
  const { details } = useMyProfileDetails()
  const size = useSlotSize()
  const hireTime = hireDayOf(details?.employeeHireDate)?.getTime() ?? null
  // Gün dönünce yeniden hesaplanır (panonun dakikalık saati).
  const now = new Date(ctx.now)
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const data = res.status === "ready" ? res.data : null
  const sum = useMemo(
    () =>
      data &&
      leaveSummary({
        balance: data.balance,
        leaves: data.leaves,
        hireDate: hireTime == null ? null : new Date(hireTime),
        now: new Date(day),
      }),
    [data, hireTime, day],
  )
  return (
    <WidgetFrame
      id="leave-balance"
      title={t("widgets.leave.title")}
      icon={SunglassesIcon}
      busy={res.status === "loading"}
      className={className}
      action={
        sum ? (
          <FrameAction to="/self-service?new=leave" className="lv-action">
            {t("widgets.leave.request")}
          </FrameAction>
        ) : res.status === "loading" ? null : (
          // Okunamadıysa nedeni (yetki, kayıt yok, bağlantı) Self Servis'te yazıyor.
          <FrameAction to="/self-service">{t("nav.selfService")}</FrameAction>
        )
      }
    >
      {res.status === "loading" ? (
        <Skeleton />
      ) : res.status === "notFound" ? (
        <WidgetEmpty icon={SunglassesIcon}>{t("selfService.state.notFound.title")}</WidgetEmpty>
      ) : (
        <>
          <WidgetBody status={res.status}>{sum && <Summary sum={sum} size={size} />}</WidgetBody>
          {(res.status === "denied" || res.status === "error") && (
            <ErrorCause detail={res.detail} className="mt-2" />
          )}
        </>
      )}
    </WidgetFrame>
  )
}
