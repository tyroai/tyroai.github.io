import { HugeiconsIcon } from "@hugeicons/react"
import Add01Icon from "@hugeicons/core-free-icons/Add01Icon"
import MinusSignIcon from "@hugeicons/core-free-icons/MinusSignIcon"
import Money03Icon from "@hugeicons/core-free-icons/Money03Icon"
import { useLocale } from "@/hooks/useLocale"
import { Segment } from "./Segment"

/** Yazılan tutarın tam kısmı (binlik ayraçları atılır); okunamazsa 0. */
const whole = (v) =>
  Number.parseInt(
    String(v ?? "")
      .replace(/[.\s]/g, "")
      .split(",")[0],
    10,
  ) || 0

/**
 * Tutar: büyük rakam alanı, adım adım azalt/artır (`step`, varsayılan 500) ve para birimi (referanstaki yolcu sayısı + kabin
 * kartı). Enter kartı kapatır. Yazı serbest ("1.250,50" de olur): asistan okuyor.
 */
export function AmountCard({
  amount,
  currency,
  currencies,
  onAmount,
  onCurrency,
  onDone,
  step: STEP = 500,
}) {
  const { t } = useLocale()
  const step = (dir) => onAmount(String(Math.max(0, whole(amount) + dir * STEP)))
  return (
    <div className="af-amount">
      <div className="af-amount-row">
        <span className="af-amount-ic" aria-hidden="true">
          <HugeiconsIcon icon={Money03Icon} strokeWidth={1.9} />
        </span>
        <input
          data-autofocus=""
          inputMode="decimal"
          value={amount ?? ""}
          onChange={(e) => onAmount(e.target.value.replace(/[^\d\s.,]/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              onDone()
            }
          }}
          placeholder="0"
          aria-label={t("myspace.slot.amount")}
          autoComplete="off"
          enterKeyHint="done"
          className="af-amount-input"
        />
        <button
          type="button"
          className="af-round"
          onClick={() => step(-1)}
          aria-label={t("advanceFlow.minus", { n: STEP })}
          disabled={whole(amount) <= 0}
        >
          <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2.2} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="af-round af-round--solid"
          onClick={() => step(1)}
          aria-label={t("advanceFlow.plus", { n: STEP })}
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
      <Segment
        fill
        label={t("myspace.slot.currency")}
        value={currency}
        onChange={onCurrency}
        options={currencies.map((c) => ({ value: c, label: c }))}
      />
    </div>
  )
}
