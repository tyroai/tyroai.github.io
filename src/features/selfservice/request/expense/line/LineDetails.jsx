import { useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import { useLocale } from "@/hooks/useLocale"
import { LINE_DETAILS, filledDetails, listText } from "@/features/selfservice/lib/expenseLine"
import { optionLabel } from "@/lib/promptTemplates"
import { EXPENSE_ROW_OMIT, asciiDigits, formFields } from "@/lib/requestForm"
import { withDefaults } from "@/features/selfservice/lib/requestFormItems"
import { cn } from "@/lib/utils"
import { capFirst, errorText } from "../../formUi"
import { ListCell } from "./ListCell"
import { enterNext } from "./lineFocus"
import { INPUT, RULE } from "./lineUi"

const FIELDS = formFields("expense", EXPENSE_ROW_OMIT).extra.filter((f) =>
  LINE_DETAILS.includes(f.name),
)
const LOCATION = FIELDS.find((f) => f.name === "location").slot
// Yazı alanları: fiş no ve firma serbest metin, kişi sayısı tam sayı (tablodaki sınırlarla aynı).
const TEXT = {
  receipt: { maxLength: 40, spellCheck: false },
  firm: { maxLength: 120, spellCheck: true },
  people: { maxLength: 3, spellCheck: false, numeric: true },
}

/** Doldurulan ayrıntının kısa metni: "Fiş no 0042" · "Kızılay Otel" · "Yurtdışı" · "Kişi sayısı: 3". */
function detailText(t, locale, name, value) {
  if (name === "receipt") return t("selfService.expense.receiptNo", { no: value })
  if (name === "location") return capFirst(optionLabel(t, LOCATION, value), locale)
  if (name === "people") return `${capFirst(t("myspace.slot.people"), locale)}: ${value}`
  return value
}

/**
 * Lokasyon: iki seçenek yan yana (radyo grubu: tek sekme durağı, oklar seçer). Her seçenek kendi
 * adını taşır: seçili olanın kimliğine bağlı "Lokasyon" etiketi onun adının yerine geçmesin.
 * Dokunmatikte seçenekler 44 px.
 */
function Choice({ id, labelId, value, onChange }) {
  const { t, locale } = useLocale()
  const refs = useRef([])
  const options = LOCATION.options
  const onKey = (e, i) => {
    const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key]
    if (!step) return
    e.preventDefault()
    const next = (i + step + options.length) % options.length
    onChange(options[next])
    refs.current[next]?.focus()
  }
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      className="grid h-9 w-full max-w-[14rem] auto-cols-fr grid-flow-col gap-0.5 rounded-[0.625rem] bg-foreground/[0.06] p-0.5 pointer-coarse:h-12"
    >
      {options.map((o, i) => {
        const on = value === o
        const label = capFirst(optionLabel(t, LOCATION, o), locale)
        return (
          <button
            key={o}
            ref={(el) => {
              refs.current[i] = el
            }}
            // Kimlik seçili düğmede: etiket ve "alana git" odakları oraya düşer.
            id={on ? id : undefined}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={label}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "min-w-0 truncate rounded-[0.5rem] px-2 text-[0.8125rem] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
              on
                ? "bg-background text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.1)] dark:bg-white/[0.16]"
                : "text-foreground/70 hover:text-foreground",
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Kalemin "Ayrıntı"sı: fiş no, firma adı, lokasyon, kişi sayısı. Kapalıyken düğme ne olduğunu
 * söyler ("Ayrıntı ekle · fiş no, firma adı…"; doluysa "Ayrıntı (2) · Fiş no 0042 · …"). Açıkken
 * aynı gruplu liste, genişte iki sütun. Varsayılanlar görünür (`withDefaults`: lokasyon
 * kategoriden seçili, kişi sayısı "1" yer tutucuda — dokunup yazılan rakam onun yanına eklenmez)
 * ama yalnız kişi değiştirince yazılır. `forced`: hata yüzünden açık.
 */
export function LineDetails({ row, n, base, errors, open, forced, onToggle, onSet }) {
  const { t, locale } = useLocale()
  const shown = useMemo(() => withDefaults(FIELDS, row.values), [row.values])
  const filled = filledDetails(row.values)
  const panelId = `${base}-details`
  // Açılış bitince taşma serbest (odak halkaları kesilmesin). transitionEnd'e güvenilmez: açılışta
  // sık sık uygulanmıyor. Kapanış bitince sıfırlanır, yeniden açılış yine kırpılarak büyür.
  const [settled, setSettled] = useState(false)
  // Görünen lokasyonu yeniden seçmek bir şey yazmaz: cümleye yalnız kişinin seçtiği girer. Yazı
  // alanında her tuş yazılır (varsayılan yer tutucuda; "12"nin "1"i yutulmasın).
  const set = (name, value) => {
    if (name === "location" && row.values.location === undefined && value === shown.location) return
    onSet(name, value)
  }
  const title =
    open && !forced
      ? t("selfService.expense.line.detailsHide")
      : filled.length
        ? t("selfService.expense.line.detailsCount", { n: filled.length })
        : t("selfService.expense.line.detailsAdd")
  const hint = open
    ? null
    : filled.length
      ? filled.map(([name, value]) => detailText(t, locale, name, value)).join(" · ")
      : listText(
          locale,
          LINE_DETAILS.map((name) => t(`myspace.slot.${name}`)),
          "narrow",
        )

  return (
    <div className={cn("border-t", RULE)}>
      <button
        type="button"
        aria-expanded={open}
        // Kapalıyken panel çizilmez: olmayan öğeye işaret etmesin.
        aria-controls={open ? panelId : undefined}
        onClick={onToggle}
        className={cn(
          "flex min-h-11 w-full items-start gap-2 px-4 py-3 text-start text-[0.8125rem] transition-colors hover:bg-foreground/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40 pointer-coarse:min-h-12",
          !open && "rounded-b-[1.0625rem]",
        )}
      >
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          aria-hidden="true"
          strokeWidth={2}
          className={cn(
            "mt-px size-4 shrink-0 text-brand-ink transition-transform duration-200",
            open && "rotate-180",
          )}
        />
        {/* Dar kartta ne eklenebileceği ikinci satırda (kesilmesin); genişte aynı satırda. */}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 @[30rem]/line:flex-row @[30rem]/line:gap-1.5">
          <span className="shrink-0 font-semibold text-brand-ink">{title}</span>
          {hint && (
            <span className="min-w-0 text-[0.75rem] leading-[1.125rem] text-muted-foreground first-letter:uppercase @[30rem]/line:truncate @[30rem]/line:text-[0.8125rem] @[30rem]/line:leading-normal @[30rem]/line:first-letter:normal-case">
              <span aria-hidden="true" className="hidden @[30rem]/line:inline">
                ·{" "}
              </span>
              {hint}
            </span>
          )}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-label={t("selfService.form.detailsFor", { n })}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0, overflow: "hidden" }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            // Çıkan panel eski çizimle kalır (open hâlâ true): hangi animasyonun bittiğini hedef söyler.
            onAnimationComplete={(def) => setSettled(def?.height === "auto")}
            style={settled ? { overflow: "visible" } : undefined}
            className="overflow-hidden"
          >
            <div className="xl-list grid grid-cols-1 pb-1 @[36rem]/line:grid-cols-2">
              {FIELDS.map((f, i) => {
                const id = `${base}-${f.name}`
                const error = errorText(t, f.slot, errors?.[f.name])
                const text = TEXT[f.name]
                return (
                  <ListCell
                    key={f.name}
                    id={id}
                    label={capFirst(t(`myspace.slot.${f.name}`), locale)}
                    error={error}
                    side={i % 2 === 1}
                  >
                    {text ? (
                      <input
                        id={id}
                        type="text"
                        inputMode={text.numeric ? "numeric" : undefined}
                        enterKeyHint={i === FIELDS.length - 1 ? "done" : "next"}
                        autoComplete="off"
                        spellCheck={text.spellCheck}
                        maxLength={text.maxLength}
                        value={row.values[f.name] ?? ""}
                        // Boş alan çizgisiz: soluk tire (kişi sayısında varsayılanı), yazılacak
                        // yer belli olsun.
                        placeholder={f.name === "people" ? shown.people : "—"}
                        onChange={(e) =>
                          set(f.name, text.numeric ? asciiDigits(e.target.value) : e.target.value)
                        }
                        onKeyDown={enterNext}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? `${id}-error` : undefined}
                        className={cn(INPUT, text.numeric && "tabular-nums")}
                      />
                    ) : (
                      <Choice
                        id={id}
                        labelId={`${id}-label`}
                        value={shown.location}
                        onChange={(o) => set("location", o)}
                      />
                    )}
                  </ListCell>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
