import "@/lib/i18n/tools"
import { useId, useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDataTransferVerticalIcon from "@hugeicons/core-free-icons/ArrowDataTransferVerticalIcon"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import MoneyExchange02Icon from "@hugeicons/core-free-icons/MoneyExchange02Icon"
import { useLocale } from "@/hooks/useLocale"
import { parseAmount } from "@/lib/amountParse"
import { getNumberFormat } from "@/lib/intl-cache"
import { currencyName, stamp } from "../market/marketFormat"
import { useMarketData } from "../market/useMarketData"
import { WidgetFrame } from "../WidgetFrame"
import { TRY_ID, convert, fractionDigits, fxOptions, sanitizePair } from "./fxConvert"
import { useFxPair } from "./useFxPair"
import "./fx.css"

/** Seçeneğin kısa kodu (yuvada) ve adı (altında): dövizde ISO kodu, TL ve madenlerde sözlükten. */
function labelsOf(option, t, locale) {
  if (option.id === TRY_ID)
    return { code: t("tools.fx.tryCode"), name: currencyName("TRY", locale) }
  if (option.kind === "gold")
    return {
      code: t(`headerWidgets.marketShort.${option.id}`),
      name: t(`widgets.market.row.${option.id}`),
    }
  const code = option.id.toUpperCase()
  return { code, name: currencyName(code, locale) }
}

/** Bir taraf: para birimi yuvası (görünmez yerel liste üstünde) ve tutar ya da sonuç. */
function Side({ id, option, options, onPick, label, children }) {
  const { t, locale } = useLocale()
  const own = labelsOf(option, t, locale)
  return (
    <div className="fx-side">
      <label className="fx-pick">
        <span className="sr-only">{label}</span>
        <span aria-hidden="true" className="fx-code">
          {own.code}
        </span>
        <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" className="fx-chev" />
        <select id={id} value={option.id} onChange={(e) => onPick(e.target.value)}>
          {options.map((o) => {
            const l = labelsOf(o, t, locale)
            return (
              <option key={o.id} value={o.id}>
                {l.code === l.name ? l.code : `${l.code} · ${l.name}`}
              </option>
            )
          })}
        </select>
      </label>
      <span className="fx-name">{own.name}</span>
      {children}
    </div>
  )
}

/**
 * DÖVİZ ÇEVİRİCİ — tutarı yaz, iki para birimi arasında hemen çevrilir. Seçenekler TL, Piyasa'nın
 * dövizleri ve gram altın/gümüş; kurlar Piyasa kartıyla aynı önbellekten (`useMarketData`, yeni
 * istek yok), TL üzerinden çapraz (`fxConvert`). Ortadaki düğme iki tarafı değiştirir. Çift ve tutar
 * bu tarayıcıda kalır (`useFxPair`). Dar kartta iki kutu alt alta, genişte yan yana (`fx.css`).
 * Yenile düğmesi yok: kurlar dakikada bir kendiliğinden tazelenir; saat altta, kaynağın yanında.
 */
export default function FxWidget({ className }) {
  const { t, locale } = useLocale()
  const uid = useId()
  const market = useMarketData()
  const fx = useFxPair()
  const [turns, setTurns] = useState(0)
  const options = useMemo(() => fxOptions(market.data?.rows), [market.data])
  const pair = sanitizePair(fx.saved, options)
  const from = options.find((o) => o.id === pair.from)
  const to = options.find((o) => o.id === pair.to)
  const parsed = parseAmount(fx.saved.text, locale)
  const amount = parsed?.value ?? parsed?.ambiguous?.[0] ?? null
  const result = convert(amount, from, to)
  const rate = convert(1, from, to)
  const format = (v) => {
    const d = fractionDigits(v)
    return getNumberFormat(locale, { minimumFractionDigits: d, maximumFractionDigits: d }).format(v)
  }
  const loading = market.status === "loading"
  const when = market.data?.at ? stamp(market.data.at, locale) : null
  const swap = () => {
    fx.swap(pair)
    setTurns((n) => n + 1)
  }
  const fromCode = from && labelsOf(from, t, locale).code
  const toCode = to && labelsOf(to, t, locale).code

  return (
    <WidgetFrame
      id="tyro-fx"
      title={t("widgets.fx.title")}
      shortTitle={t("tools.fx.short")}
      icon={MoneyExchange02Icon}
      busy={loading}
      className={className}
    >
      {market.status === "error" ? (
        <p className="mt-3 text-[0.8125rem] leading-snug text-muted-foreground">
          {t("widgets.market.error")}
        </p>
      ) : loading || !from || !to ? (
        <div aria-hidden="true" className="fx-pad mt-2.5">
          <span className="ms-skeleton block h-[4.75rem] rounded-2xl" />
          <span className="ms-skeleton block h-[4.75rem] rounded-2xl" />
        </div>
      ) : (
        <div className="mt-2.5 flex min-h-0 flex-1 flex-col">
          <div className="fx-pad">
            <Side
              id={`${uid}-from`}
              option={from}
              options={options}
              onPick={fx.setFrom}
              label={t("tools.fx.from")}
            >
              <input
                inputMode="decimal"
                autoComplete="off"
                aria-label={t("tools.fx.amount")}
                value={fx.saved.text}
                onChange={(e) => fx.setText(e.target.value)}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                className="fx-num"
              />
            </Side>
            <button
              type="button"
              onClick={swap}
              aria-label={t("tools.fx.swap")}
              title={t("tools.fx.swap")}
              className="fx-swap"
            >
              <HugeiconsIcon
                icon={ArrowDataTransferVerticalIcon}
                aria-hidden="true"
                strokeWidth={2}
                style={{ transform: `rotate(${turns * 180}deg)` }}
              />
            </button>
            <Side
              id={`${uid}-to`}
              option={to}
              options={options}
              onPick={fx.setTo}
              label={t("tools.fx.to")}
            >
              <output htmlFor={`${uid}-from ${uid}-to`} aria-live="polite" className="fx-num">
                {result == null ? "—" : format(result)}
              </output>
            </Side>
          </div>
          <p className="fx-rate">
            <span className="tabular-nums">
              {`1 ${fromCode} = ${rate == null ? "—" : format(rate)} ${toCode}`}
            </span>
            <span className="truncate">
              {market.data?.stale
                ? t("widgets.market.stale", { time: when ?? "—" })
                : [
                    t(
                      market.data?.source === "ecb"
                        ? "widgets.market.sourceEcb"
                        : "widgets.market.source",
                    ),
                    when,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
            </span>
          </p>
        </div>
      )}
    </WidgetFrame>
  )
}
