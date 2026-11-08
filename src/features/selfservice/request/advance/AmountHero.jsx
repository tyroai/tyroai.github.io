import { useState } from "react"
import { InfoTip } from "@/components/common/InfoTip"
import { useLocale } from "@/hooks/useLocale"
import { readAdvanceAmount } from "@/features/selfservice/lib/advanceInsights"
import { formatAmount, formatMoney, parseAmount } from "@/lib/amountParse"
import { PROMPT_TEMPLATES } from "@/lib/promptTemplates"
import { amountPlaceholder } from "@/lib/requestForm"
import { fieldState } from "../field/fieldState"
import { StatusBadge } from "../field/StatusBadge"
import "../field/fieldTile.css"
import { ERROR, LABEL, capFirst, errorText } from "../formUi"
import { SlotSelect } from "../SlotSelect"
import { CHIP, TIP_HIT } from "./advanceUi"

const CURRENCY_SLOT = PROMPT_TEMPLATES.advance.slots.currency

/**
 * Avansın tutarı: formun büyük sayısı, para birimi kutunun içinde. Serbest yazı okunur ("15 bin",
 * "15000 TL", "€2.500" — `lib/amountParse`): alandan çıkınca ya da Enter'da yerel biçime yazılır,
 * yazıdaki para birimi seçiciye geçer ve "₺15.000,00 olarak anladım" görünür. İki anlamlı yazıda
 * ("1,500") iki aday sunulur.
 * Durum alan karolarıyla aynı (`req-tile`): boşken hafif kırmızı çerçeve, okunabilen tutarda
 * etiketin yanında ✓, hatada net kırmızı. Serbest yazının örnekleri etiketin ⓘ balonunda.
 */
export function AmountHero({ form, idBase, field }) {
  const { t, locale } = useLocale()
  const { values, errors } = form
  const id = `${idBase}-amount`
  const labelId = `${id}-label`
  const errorId = `${id}-error`
  const echoId = `${id}-echo`
  const [echo, setEcho] = useState(null)
  const [which, setWhich] = useState(null)
  const currency = values.currency
  const err = errorText(t, field.slot, errors?.amount)
  const empty = !String(values.amount ?? "").trim()
  // Yazılmış ama okunamayan tutar "boş" değil: kırmızısız bekler, nedeni altında ve özette.
  const state = fieldState({
    filled: readAdvanceAmount(values, locale).state === "ok",
    required: empty,
    error: err,
  })

  const commit = (value, cur) => {
    const next = { amount: formatAmount(value, locale) }
    if (cur) next.currency = cur
    form.patch(next)
    return next.amount
  }
  const normalize = () => {
    const raw = String(values.amount ?? "").trim()
    const got = raw ? parseAmount(raw, locale) : null
    if (!got) return
    if (got.ambiguous) {
      setWhich(got)
      return
    }
    const text = commit(got.value, got.currency)
    if (text !== raw || (got.currency && got.currency !== currency))
      setEcho(formatMoney(got.value, got.currency ?? currency, locale))
  }
  const pick = (value) => {
    commit(value, which?.currency)
    setEcho(formatMoney(value, which?.currency ?? currency, locale))
    setWhich(null)
  }

  return (
    <div>
      <div className={LABEL}>
        <span id={labelId}>{capFirst(t("myspace.slot.amount"), locale)}</span>
        <StatusBadge state={state} className="static size-4 ring-0" />
        <InfoTip text={t("selfService.advance.amountTip")} className={TIP_HIT} />
      </div>
      <div
        data-field={state ?? undefined}
        className="req-tile relative flex h-16 items-center gap-2 rounded-2xl pe-2 ps-4 has-[[data-morph-open]]:z-30 pointer-coarse:h-14"
      >
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          maxLength={32}
          value={values.amount ?? ""}
          placeholder={amountPlaceholder(locale)}
          onChange={(e) => {
            setEcho(null)
            setWhich(null)
            form.setSlot("amount", e.target.value)
          }}
          onBlur={normalize}
          onKeyDown={(e) => e.key === "Enter" && normalize()}
          aria-labelledby={labelId}
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? errorId : echo ? echoId : undefined}
          className="no-ios-zoom min-w-0 flex-1 bg-transparent text-[2rem] font-semibold tracking-[-0.02em] tabular-nums outline-none placeholder:text-muted-foreground/40 pointer-coarse:text-[1.75rem]"
        />
        {/* Kutuda değil sarmalda: zorunlu boş tutarın kırmızı çerçevesi seçiciye geçmesin. */}
        <div className="shrink-0">
          <SlotSelect
            id={`${id}-currency`}
            label={capFirst(t("myspace.slot.currency"), locale)}
            name="currency"
            slot={CURRENCY_SLOT}
            value={currency}
            onPick={(v) => form.setSlot("currency", v)}
            align="end"
            panelWidth={160}
            className="w-[6.75rem]"
          />
        </div>
      </div>
      {err && (
        <p id={errorId} className={ERROR}>
          {err}
        </p>
      )}
      {echo && !err && (
        <p id={echoId} aria-live="polite" className="mt-1.5 text-[0.75rem] text-muted-foreground">
          {t("selfService.advance.echo", { amount: echo })}
        </p>
      )}
      {which && (
        <div
          role="group"
          aria-label={t("selfService.advance.which")}
          className="mt-2 flex flex-wrap items-center gap-2"
        >
          <span className="text-[0.75rem] text-muted-foreground">
            {t("selfService.advance.which")}
          </span>
          {which.ambiguous.map((n) => (
            <button key={n} type="button" className={CHIP} onClick={() => pick(n)}>
              {formatMoney(n, which.currency ?? currency, locale)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
