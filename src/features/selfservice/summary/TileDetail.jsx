import { InfoTip } from "@/components/common/InfoTip"
import { useLocale } from "@/hooks/useLocale"
import { STATUS_TONE } from "@/lib/selfServiceStatus"
import { cn } from "@/lib/utils"
import { countText, money, TONE_DOT } from "../kinds"
import { AccrualCard } from "../report/AccrualCard"
import { BalanceRow } from "../report/BalanceRow"
import { rowLabel, rowValue } from "../report/reportText"
import { leaveLine } from "../team/teamText"

const CAPS = "text-[0.75rem] font-medium text-muted-foreground"

// Kategori renkleri seçili paletin logo renklerinden (`--brand-logo-1…5`, her palette tanımlı):
// sayfada zaten görünen, birbiriyle uyumlu beş ton — yabancı renk yok. Satırın noktası ve
// dağılım çubuğunun parçası aynı renk. Tailwind sınıfı şablondan kurulmaz: satır içi stil.
const MIX = [1, 2, 3, 4, 5].map((i) => `var(--brand-logo-${i})`)

/**
 * Dağılım çubuğu: satırların payı tek ince çubukta, renkli parçalar. Ağırlık ana para birimindeki
 * tutar (gün), yoksa kayıt sayısı; sıfır olmayan parça en az %4 (görünsün). Bilgi satırlarda da
 * var: çubuk ekran okuyucudan gizli.
 */
export function MixBar({ rows, colorOf }) {
  const { weight, sum } = weigh(rows)
  return (
    <div aria-hidden="true" className="mb-3 flex h-2 w-full gap-1">
      {rows.map((r, i) => {
        const w = weight(r)
        if (!w) return null
        return (
          <span
            key={r.key}
            className={cn("h-full rounded-full", colorOf(r, i).className)}
            style={{ width: `${Math.max(4, (w / sum) * 100)}%`, ...colorOf(r, i).style }}
          />
        )
      })}
    </div>
  )
}

/** Satırların ağırlığı: ana para birimindeki tutar (gün), yoksa kayıt sayısı. Çubuk ve yüzde aynı. */
function weigh(rows) {
  const total = rows.reduce((n, r) => n + Math.abs(r.value ?? 0), 0)
  const weight = (r) => (total ? Math.abs(r.value ?? 0) : r.count)
  return { weight, sum: rows.reduce((n, r) => n + weight(r), 0) || 1 }
}

/** Satırın payı ("%54"): bölümün çubuğuyla aynı ağırlıkla. */
function pctOf(rows, locale) {
  const { weight, sum } = weigh(rows)
  return (r) => {
    const w = weight(r)
    // Tutarı yalnız başka para biriminde olan satırın ana para birimindeki payı yok: "%0" yanlış
    // okunurdu (ikinci büyük kalem sıfır görünüyordu).
    if (!w && Object.values(r.totals ?? {}).some(Boolean)) return "—"
    const n = Math.round((w / sum) * 100)
    // Sıfır olmayan pay "%0" yazılmaz.
    const text = w && n < 1 ? "<1" : String(n)
    return locale === "tr" ? `%${text}` : `${text}%`
  }
}

const mixColor = (r, i) => ({ style: { backgroundColor: MIX[i % MIX.length] } })
const toneColor = (r) => ({ className: TONE_DOT[STATUS_TONE[r.key]] ?? TONE_DOT.neutral })
const NOTE = "text-[0.75rem] text-muted-foreground"

export function Section({ title, info, children }) {
  return (
    <section className="min-w-0 border-t border-foreground/[0.07] pt-3.5 first:border-t-0 first:pt-0">
      <h4 className={cn(CAPS, "flex items-center gap-1")}>
        {title}
        <InfoTip text={info} />
      </h4>
      <div className="mt-2">{children}</div>
    </section>
  )
}

export function Row({ label, value, dot, color, pct }) {
  return (
    <div className="flex min-w-0 items-baseline gap-3 py-1 text-[0.8125rem]">
      <dt className="flex min-w-0 flex-1 items-center gap-2 text-foreground/85">
        {(dot || color) && (
          <span
            aria-hidden="true"
            className={cn("size-2 shrink-0 self-center rounded-full", dot)}
            style={color ? { backgroundColor: color } : undefined}
          />
        )}
        <span className="truncate">{label}</span>
      </dt>
      {pct && (
        <span className="shrink-0 text-[0.75rem] tabular-nums text-muted-foreground">{pct}</span>
      )}
      <dd className="shrink-0 font-semibold tabular-nums text-foreground">{value}</dd>
    </div>
  )
}

function LeaveDetail({ balance, accrual, facts, period }) {
  const { t, locale } = useLocale()
  return (
    <>
      {balance ? (
        <BalanceRow balance={balance} />
      ) : (
        <p className={NOTE}>{t("selfService.tile.noBalance")}</p>
      )}
      <AccrualCard accrual={accrual} remain={balance?.remain} />
      {facts.next && (
        <Section title={t("selfService.tile.detail.nextLeave")}>
          <p className="text-[0.75rem] text-foreground/80">{leaveLine(facts.next, t, locale)}</p>
        </Section>
      )}
      <Section title={t("selfService.tile.detail.byType", { period })}>
        {facts.types.length ? (
          <>
            <MixBar rows={facts.types} colorOf={mixColor} />
            <dl data-private="">
              {facts.types.map((r, i) => (
                <Row
                  pct={pctOf(facts.types, locale)(r)}
                  key={r.key}
                  label={rowLabel(r, t)}
                  value={rowValue(r, "days", null, t, locale)}
                  color={MIX[i % MIX.length]}
                />
              ))}
            </dl>
          </>
        ) : (
          <p className={NOTE}>{t("selfService.report.empty")}</p>
        )}
      </Section>
    </>
  )
}

function MoneyDetail({ kind, facts, period }) {
  const { t, locale } = useLocale()
  if (!facts.all) return <p className={NOTE}>{t("selfService.report.empty")}</p>
  const amount = (row, currency) => rowValue(row, "money", currency, t, locale)
  // Kategori satırı kalem sayar, avans türü ve durum kayıt sayar.
  const unit = kind === "expense" ? "selfService.expense.lines" : "selfService.list.count"
  const excluded = facts.statuses.some((s) => s.excluded)
  const mixTitle = t(`selfService.report.primary.${kind}`)
  return (
    <>
      <Section title={t("selfService.tile.detail.total", { period })}>
        <dl data-private="">
          {(facts.totals.length ? facts.totals : [["TRY", 0]]).map(([cur, amount]) => (
            <Row key={cur} label={cur} value={money(amount, cur, locale)} />
          ))}
        </dl>
      </Section>
      {facts.mix.length > 0 && (
        <Section
          title={
            facts.mixExcluded ? `${mixTitle} · ${t("selfService.report.excludedGroup")}` : mixTitle
          }
        >
          <MixBar rows={facts.mix} colorOf={mixColor} />
          <dl data-private="">
            {facts.mix.map((r, i) => (
              <Row
                pct={pctOf(facts.mix, locale)(r)}
                key={r.key}
                label={rowLabel(r, t)}
                value={`${amount(r, facts.mixCurrency)} · ${countText(t, locale, unit, r.count)}`}
                color={MIX[i % MIX.length]}
              />
            ))}
          </dl>
        </Section>
      )}
      <Section
        title={t("selfService.report.byStatus")}
        info={excluded ? t("selfService.tile.excludedHint") : null}
      >
        {/* Durum çubuğu kayıt sayısıyla: tutarlar farklı para biriminde olabilir. */}
        <MixBar rows={facts.statuses.map((s) => ({ ...s, value: 0 }))} colorOf={toneColor} />
        <dl data-private="">
          {facts.statuses.map((s) => (
            <Row
              key={s.key}
              label={rowLabel(s, t, { status: true })}
              value={`${countText(t, locale, "selfService.list.count", s.count)} · ${amount(s, facts.statusCurrency)}`}
              dot={TONE_DOT[STATUS_TONE[s.key]] ?? TONE_DOT.neutral}
            />
          ))}
        </dl>
      </Section>
    </>
  )
}

/**
 * Özet kutusunun ayrıntısı — masaüstünde hover kartında, telefonda çekmecede (üçü alt alta).
 * Sayılar özetle ve raporla aynı kaynaktan (`tileFacts`: `summarize`, `leaveReport`).
 */
export function TileDetail({ kind, balance, accrual, facts, period, className }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-3.5", className)}>
      {kind === "leave" ? (
        <LeaveDetail balance={balance} accrual={accrual} facts={facts.leave} period={period} />
      ) : (
        <MoneyDetail kind={kind} facts={facts[kind]} period={period} />
      )}
    </div>
  )
}
