import { useId, useState } from "react"
import { SegmentedControl } from "@/components/common/SegmentedControl"
import { useLocale } from "@/hooks/useLocale"
import { parseAmount } from "@/lib/amountParse"
import { getNumberFormat } from "@/lib/intl-cache"
import { GRAINS, TRADE_UNITS, convertTrade } from "@/features/widgets/lib/tradeUnits"
import { cn } from "@/lib/utils"
import { useUsdTry } from "./useUsdTry"

const DIGITS = { minimumFractionDigits: 2, maximumFractionDigits: 2 }
const RATE = { maximumFractionDigits: 4 }
const FIELD =
  "rounded-xl border border-border bg-background text-[0.875rem] outline-none transition focus-visible:ring-2 focus-visible:ring-brand/40"

/**
 * Çevirici: tahıl seçilir (bushel'ın ağırlığı), değer ve birim girilir, öteki birimler hemen
 * görünür. ₺/t Piyasa kartının dolar kuruyla (gösterge; kur ipucunda ve ekran okuyucuda). Sayı
 * dilin ayraçlarıyla okunur. `compact` (içerik < 16rem): tahıl açılır listede, sonuçlar tek
 * satırlık — dört seçenek ve yan yana iki kutu dar kartta okunmuyordu.
 */
export function ConverterView({ compact }) {
  const { t, locale } = useLocale()
  const id = useId()
  const [grain, setGrain] = useState("wheat")
  const [text, setText] = useState("")
  const [unit, setUnit] = useState("cbu")
  const usdTry = useUsdTry()
  const parsed = parseAmount(text, locale)
  const value = parsed?.value ?? parsed?.ambiguous?.[0] ?? null
  const lb = GRAINS.find((g) => g.id === grain).lb
  const out = convertTrade(value, unit, lb, usdTry)
  const fmt = getNumberFormat(locale, DIGITS)
  const size = compact ? "h-8" : "h-9"
  const grainName = (g) => t(`widgets.trader.grains.${g}`)
  const unitSelect = (
    <>
      <label htmlFor={`${id}-u`} className="sr-only">
        {t("widgets.trader.unit")}
      </label>
      <select
        id={`${id}-u`}
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        // Dar kartta sabit genişlik: en uzun seçenek ("bushel") değer kutusunu eziyordu.
        className={cn(FIELD, size, "px-2 text-[0.8125rem]", compact && "w-16 shrink-0")}
      >
        {TRADE_UNITS.map((u) => (
          <option key={u} value={u}>
            {t(`widgets.trader.unitName.${u}`)}
          </option>
        ))}
      </select>
    </>
  )
  const input = (
    <>
      <label htmlFor={`${id}-v`} className="sr-only">
        {t("widgets.trader.amount")}
      </label>
      <input
        id={`${id}-v`}
        inputMode="decimal"
        autoComplete="off"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("widgets.trader.placeholder")}
        className={cn(FIELD, size, "min-w-0 flex-1 tabular-nums", compact ? "px-2" : "px-3")}
      />
    </>
  )
  return (
    <div className="mt-2 flex min-h-0 flex-1 flex-col gap-2">
      {compact ? (
        <>
          <label htmlFor={`${id}-g`} className="sr-only">
            {t("widgets.trader.grain")}
          </label>
          <select
            id={`${id}-g`}
            value={grain}
            onChange={(e) => setGrain(e.target.value)}
            className={cn(FIELD, size, "w-full px-2 text-[0.8125rem]")}
          >
            {GRAINS.map((g) => (
              <option key={g.id} value={g.id}>
                {grainName(g.id)}
              </option>
            ))}
          </select>
        </>
      ) : (
        <SegmentedControl
          fill
          label={t("widgets.trader.grain")}
          value={grain}
          onChange={setGrain}
          options={GRAINS.map((g) => ({ value: g.id, label: grainName(g.id) }))}
          itemClassName="h-7 px-2 text-[0.75rem]"
        />
      )}
      <div className="flex gap-2">
        {input}
        {unitSelect}
      </div>
      <output
        htmlFor={`${id}-v ${id}-u`}
        aria-live="polite"
        className={cn("grid gap-1.5", compact ? "gap-0.5" : "grid-cols-2")}
      >
        {out.map((o) => {
          const note =
            o.unit === "tryt"
              ? t("widgets.trader.fxNote", { rate: getNumberFormat(locale, RATE).format(usdTry) })
              : undefined
          const label = t(`widgets.trader.unitName.${o.unit}`)
          return compact ? (
            <span key={o.unit} title={note} className="flex items-baseline justify-between gap-2">
              <span className="text-[0.75rem] text-muted-foreground">{label}</span>
              <span className="truncate text-[0.8125rem] font-semibold tabular-nums">
                {fmt.format(o.value)}
              </span>
              {note && <span className="sr-only">{note}</span>}
            </span>
          ) : (
            <span
              key={o.unit}
              title={note}
              className="min-w-0 rounded-lg bg-muted/40 px-2.5 py-1.5"
            >
              <span className="block text-[0.6875rem] text-muted-foreground">{label}</span>
              <span className="block truncate text-[0.9375rem] font-semibold tabular-nums">
                {fmt.format(o.value)}
              </span>
              {note && <span className="sr-only">{note}</span>}
            </span>
          )
        })}
      </output>
    </div>
  )
}
