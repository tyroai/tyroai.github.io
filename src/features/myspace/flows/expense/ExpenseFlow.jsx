import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Add01Icon from "@hugeicons/core-free-icons/Add01Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import Invoice03Icon from "@hugeicons/core-free-icons/Invoice03Icon"
import Money03Icon from "@hugeicons/core-free-icons/Money03Icon"
import UnfoldMoreIcon from "@hugeicons/core-free-icons/UnfoldMoreIcon"
import { ReceiptPrinter } from "@/components/ui/receipt-printer"
import "@/lib/i18n/selfService"
import { isSlotEmpty, optionLabel } from "@/lib/promptTemplates"
import { AmountCard } from "../shared/AmountCard"
import { DayStrip } from "../shared/DayStrip"
import { FlowCard } from "../shared/FlowCard"
import { FlowClose, FlowWindow } from "../shared/FlowWindow"
import { cap, dayLabel } from "../shared/flowText"
import { ListPicker } from "../shared/ListPicker"
import { Token } from "../shared/Token"
import { useFlow } from "../shared/useFlow"
import { CategoryPicker } from "./CategoryPicker"
import { categoryArt } from "./expenseArt"
import { ExtrasCard } from "./ExtrasCard"
import "./expense.css"

const KEY = "expense"
const EXTRA = ["note", "firm", "receipt", "location", "people", "company"]
// Kategori kartı uzun (arama + illüstrasyonlar + liste): gerekirse panelin tepesinden açılır.
const TALL = { category: 560, extras: 420, company: 380 }

/**
 * MASRAF AKIŞI — sohbet çubuğundaki "Masraf girişi": avans akışının dili, haritanın
 * yerinde Self Servis'in fiş yazıcısı (`ReceiptPrinter`). Açılışta taslak fiş yazdırılır,
 * seçtikçe canlı dolar (kategori, tarih, tutar, açıklama, firma). Üstte kategori (illüstrasyonlu sık
 * kullanılanlar + aramalı tam liste), cümlede tarih ve tutar, "ayrıntı ekle"de şablonun isteğe bağlı
 * alanları. Alanlar şablonla birebir, gönderilen cümle aynı (`composeTemplate`): dokunulmayan
 * isteğe bağlı alan cümleye girmez.
 */
export default function ExpenseFlow({ open, onOpenChange, onSend }) {
  const [view, act, body] = useFlow(KEY, { tall: TALL })
  const { t, locale, values, today, card, lead, choices, slots } = view
  const { set, pick, openCard, close } = act
  const up = (key) => t(key).toLocaleUpperCase(locale)
  const date = values.date instanceof Date ? values.date : null
  const dateText = dayLabel(t, locale, date, today)
  const amountOk = !isSlotEmpty(slots.amount, values.amount)
  const amountText = amountOk ? `${String(values.amount).trim()} ${values.currency}` : null
  const category = values.category ?? null
  const photo = categoryArt(category)
  const note = String(values.note ?? "").trim()
  const firm = String(values.firm ?? "").trim()
  // Asistanın varsayılanları (şablonun `addDefault`ı): kartta soluk görünür, cümleye girmez.
  const defaults = {
    location: slots.location.addDefault(values),
    people: "1",
    company: "own",
  }
  const filled = EXTRA.filter((name) => !isSlotEmpty(slots[name], values[name])).length
  const companyText = cap(optionLabel(t, slots.company, values.company ?? defaults.company), locale)
  const companies = useMemo(
    () =>
      slots.company.options.map((c) => ({
        value: c,
        title: c === "own" ? cap(optionLabel(t, slots.company, c), locale) : c,
        note: c === "own" ? "" : slots.company.describe(c),
      })),
    [slots, t, locale],
  )
  const send = () => {
    if (act.send(onSend)) onOpenChange(false)
  }
  const title = t("myspace.chip.expense")
  return (
    <FlowWindow open={open} onOpenChange={onOpenChange} title={title} onEscape={act.onEscape}>
      <div ref={body} className="af">
        <div className="af-top">
          <button
            type="button"
            className="af-pill af-pill--photo"
            data-slot="category"
            data-empty={category ? undefined : ""}
            aria-haspopup="dialog"
            aria-expanded={card?.name === "category"}
            aria-label={`${cap(lead("category"), locale)}: ${category ?? t("advanceFlow.expense.pickCategory")}`}
            onClick={(e) => openCard("category", e.currentTarget)}
          >
            {photo ? (
              <img src={photo} alt="" width="56" height="56" />
            ) : (
              <span className="af-pill-ic" aria-hidden="true">
                <HugeiconsIcon icon={Invoice03Icon} strokeWidth={1.9} />
              </span>
            )}
            <span className="af-pill-text">
              {category ?? t("advanceFlow.expense.pickCategory")}
            </span>
            <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} aria-hidden="true" />
          </button>
          <span className="af-top-gap" />
          <FlowClose onClose={() => onOpenChange(false)} />
        </div>

        <div className="af-receipt" data-private="" aria-hidden="true" inert>
          {/* Açılışta taslak fiş çıkar; kategori seçilince yeniden bağlanır ve baştan yazdırılır. */}
          <ReceiptPrinter
            key={category ?? "empty"}
            autoPrint
            lang={locale}
            model="TYRO · POS"
            merchant={firm || title}
            merchantSubtext={category ?? t("advanceFlow.expense.pickCategory")}
            merchantLogo={
              photo ? (
                <img src={photo} alt="" width="56" height="56" className="af-receipt-art" />
              ) : (
                <HugeiconsIcon icon={Invoice03Icon} strokeWidth={1.9} className="size-3.5" />
              )
            }
            meta={[{ label: up("selfService.receipt.date"), value: dateText ?? "—", strong: true }]}
            items={[{ name: category ?? "—", price: amountText ?? "—", description: note }]}
            totals={[{ label: up("selfService.receipt.total"), value: amountText ?? "—" }]}
            barcodeText={up("selfService.receipt.draft")}
            stamp={t("selfService.receipt.stamp")}
            showStatusCard={false}
            showActions={false}
            labels={{
              region: t("selfService.receipt.region"),
              printing: t("selfService.receipt.printing"),
              ready: t("selfService.receipt.ready"),
              idle: t("selfService.receipt.idle"),
              item: t("selfService.receipt.item"),
              price: t("selfService.receipt.price"),
            }}
          />
        </div>
        <p className="af-info">
          <span>
            {category && cap(lead("category"), locale)}
            {category && <b>{category}</b>}
          </span>
          {amountText && <strong data-private="">{amountText}</strong>}
        </p>

        <h2 className="af-title">{t("advanceFlow.expense.title")}</h2>
        <p className="af-sentence">
          <Token
            name="date"
            icon={Calendar03Icon}
            lead={lead("date")}
            value={dateText}
            placeholder={t("advanceFlow.pick.date")}
            open={card?.name}
            onOpen={openCard}
          />
          <Token
            name="amount"
            icon={Money03Icon}
            lead={lead("amount")}
            value={amountText}
            placeholder={t("advanceFlow.pick.amount")}
            open={card?.name}
            onOpen={openCard}
          />
          <Token
            name="extras"
            icon={Add01Icon}
            value={filled ? t("advanceFlow.expense.details", { n: filled }) : null}
            placeholder={t("advanceFlow.expense.addDetails")}
            open={card?.name === "company" ? "extras" : card?.name}
            onOpen={openCard}
          />
        </p>

        <button type="button" className="af-send" onClick={send}>
          {t("myspace.ask.send")}
        </button>

        {card && (
          <FlowCard
            key={card.name}
            label={
              card.name === "extras"
                ? t("advanceFlow.expense.addDetails")
                : cap(lead(card.name), locale)
            }
            place={card.place}
            onClose={close}
            wide
          >
            {card.name === "category" && (
              <CategoryPicker
                options={slots.category.options}
                value={category}
                onPick={(v) => pick("category", v)}
              />
            )}
            {card.name === "date" && (
              <DayStrip
                value={date}
                today={today}
                back={60}
                ahead={0}
                onPick={(v) => pick("date", v)}
              />
            )}
            {card.name === "amount" && (
              <AmountCard
                amount={values.amount}
                currency={values.currency}
                currencies={slots.currency.options}
                onAmount={(v) => set("amount", v)}
                onCurrency={(v) => set("currency", v)}
                onDone={close}
                step={50}
              />
            )}
            {card.name === "extras" && (
              <ExtrasCard
                values={values}
                defaults={defaults}
                set={set}
                choices={choices}
                companyText={companyText}
                onCompany={() =>
                  openCard("company", body.current?.querySelector('[data-slot="extras"]'))
                }
              />
            )}
            {card.name === "company" && (
              <ListPicker
                options={companies}
                value={values.company ?? defaults.company}
                onPick={(v) => {
                  set("company", v)
                  openCard("extras")
                }}
                searchLabel={t("advanceFlow.search.company")}
              />
            )}
          </FlowCard>
        )}
      </div>
    </FlowWindow>
  )
}
