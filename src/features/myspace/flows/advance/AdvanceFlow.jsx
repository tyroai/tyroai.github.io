import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Building03Icon from "@hugeicons/core-free-icons/Building03Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import File01Icon from "@hugeicons/core-free-icons/File01Icon"
import Location01Icon from "@hugeicons/core-free-icons/Location01Icon"
import Money03Icon from "@hugeicons/core-free-icons/Money03Icon"
import UnfoldMoreIcon from "@hugeicons/core-free-icons/UnfoldMoreIcon"
import { useWeather } from "@/hooks/useWeather"
import { locationLabel } from "@/lib/advanceLocations"
import { getNumberFormat } from "@/lib/intl-cache"
import { isSlotEmpty } from "@/lib/promptTemplates"
import { AmountCard } from "../shared/AmountCard"
import { DayStrip } from "../shared/DayStrip"
import { FlowCard } from "../shared/FlowCard"
import { FlowClose, FlowWindow } from "../shared/FlowWindow"
import { cap, dayLabel } from "../shared/flowText"
import { ListPicker } from "../shared/ListPicker"
import { Segment } from "../shared/Segment"
import { Token } from "../shared/Token"
import { useFlow } from "../shared/useFlow"
import { CityPicker } from "./CityPicker"
import { CITY_COORDS, coordText, distanceKm, nearTurkey } from "./lib/turkeyMap"
import { TurkeyDome } from "./TurkeyDome"

// Şehir kartı uzun (arama + iki sıra fotoğraf): sözcüğün üstüne sığmazsa panelin tepesinden açılır.
const TALL = { destination: 460 }

/**
 * İŞ AVANSI AKIŞI — sohbet çubuğundaki "İş avansı" bunu açar: üstte Türkiye kubbesi
 * (seçilen yere yaklaşır), altında cümle biçiminde form — her sözcük kendi seçim kartını açar —
 * ve "TYRO'ya gönder". Alanlar şablonunkilerle birebir (`lib/promptTemplates` › advance: tarih,
 * tutar, para birimi, amaç, gidilecek yer, yansıtma şirketi, ödeme, belge); gönderilen cümle de
 * aynı (`composeTemplate`), yani asistan için hiçbir şey değişmez. Eksik zorunlu alanla
 * gönderilmez: o alanın kartı açılır. Masaüstünde pencere, telefonda alt çekmece.
 */
export default function AdvanceFlow({ open, onOpenChange, onSend }) {
  const weather = useWeather()
  const [preview, setPreview] = useState(null)
  const [view, act, body] = useFlow("advance", { tall: TALL, onClose: () => setPreview(null) })
  const { t, locale, values, today, card, text, lead, choices, slots: SLOTS } = view
  const { set, pick, openCard, close } = act
  const place = preview ?? values.destination ?? null
  const placeName = place ? locationLabel(t, place) : null
  const date = values.date instanceof Date ? values.date : null
  const dateText = dayLabel(t, locale, date, today)
  // Rota başlangıcı: hava kartının bildiği konum (yalnız görsel; alan değil, asistana gitmez).
  // Tahmini merkez ofis yedeği, Türkiye dışı ya da gidilecek yerin kendisi (< 30 km) ise rota yok.
  const here = weather.status === "ready" ? weather.place : null
  const km =
    here && !here.fallback && place && CITY_COORDS[place] && nearTurkey(here.lon, here.lat)
      ? distanceKm([here.lon, here.lat], CITY_COORDS[place])
      : 0
  const origin = km >= 30 ? { lon: here.lon, lat: here.lat, name: here.name } : null
  const amountOk = !isSlotEmpty(SLOTS.amount, values.amount)
  const amountText = amountOk ? `${String(values.amount).trim()} ${values.currency}` : null
  const companies = useMemo(
    () =>
      SLOTS.company.options.map((c) => ({ value: c, title: c, note: SLOTS.company.describe(c) })),
    [SLOTS],
  )
  const send = () => {
    if (act.send(onSend)) onOpenChange(false)
  }

  const title = t("myspace.chip.advance")
  const content = (
    <div ref={body} className="af">
      <div className="af-top">
        <button
          type="button"
          className="af-pill"
          data-slot="purpose"
          aria-haspopup="dialog"
          aria-expanded={card?.name === "purpose"}
          aria-label={`${cap(lead("purpose"), locale)}: ${text("purpose")}`}
          onClick={(e) => openCard("purpose", e.currentTarget)}
        >
          {cap(text("purpose"), locale)}
          <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} aria-hidden="true" />
        </button>
        <Segment
          label={cap(lead("payment"), locale)}
          value={values.payment}
          onChange={(v) => set("payment", v)}
          options={choices("payment")}
        />
        <FlowClose onClose={() => onOpenChange(false)} />
      </div>

      <TurkeyDome code={place} label={placeName} origin={origin} />
      <p className="af-info">
        {origin ? (
          <span>
            {origin.name} → {placeName} ·{" "}
            {t("advanceFlow.km", { n: getNumberFormat(locale).format(Math.round(km / 10) * 10) })}
          </span>
        ) : (
          <span>
            {place && coordText(place, t("advanceFlow.north"), t("advanceFlow.east"))}
            {place ? <b>{placeName}</b> : t("advanceFlow.country")}
          </span>
        )}
        {amountText && <strong data-private="">{amountText}</strong>}
      </p>

      <h2 className="af-title">{t("advanceFlow.title")}</h2>
      <p className="af-sentence">
        <Token
          name="destination"
          icon={Location01Icon}
          lead={lead("destination")}
          value={values.destination ? locationLabel(t, values.destination) : null}
          placeholder={t("advanceFlow.pick.city")}
          open={card?.name}
          onOpen={openCard}
        />
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
          name="company"
          icon={Building03Icon}
          lead={lead("company")}
          value={values.company || null}
          placeholder={t("advanceFlow.pick.company")}
          open={card?.name}
          onOpen={openCard}
        />
        <Token
          name="document"
          icon={File01Icon}
          lead={lead("document")}
          value={text("document")}
          open={card?.name}
          onOpen={openCard}
        />
      </p>

      <button type="button" className="af-send" onClick={send}>
        {t("myspace.ask.send")}
      </button>

      {card && (
        <FlowCard
          key={card.name}
          label={cap(lead(card.name), locale)}
          place={card.place}
          onClose={close}
          wide={card.name === "destination" || card.name === "company"}
        >
          {card.name === "destination" && (
            <CityPicker
              options={SLOTS.destination.options}
              value={values.destination}
              onPick={(v) => pick("destination", v)}
              onPreview={setPreview}
            />
          )}
          {card.name === "date" && (
            <DayStrip value={date} today={today} onPick={(v) => pick("date", v)} />
          )}
          {card.name === "amount" && (
            <AmountCard
              amount={values.amount}
              currency={values.currency}
              currencies={SLOTS.currency.options}
              onAmount={(v) => set("amount", v)}
              onCurrency={(v) => set("currency", v)}
              onDone={close}
            />
          )}
          {card.name === "company" && (
            <ListPicker
              options={companies}
              value={values.company}
              onPick={(v) => pick("company", v)}
              searchLabel={t("advanceFlow.search.company")}
            />
          )}
          {(card.name === "purpose" || card.name === "document") && (
            <Segment
              fill
              label={cap(lead(card.name), locale)}
              value={values[card.name]}
              onChange={(v) => pick(card.name, v)}
              options={choices(card.name)}
            />
          )}
        </FlowCard>
      )}
    </div>
  )

  return (
    <FlowWindow open={open} onOpenChange={onOpenChange} title={title} onEscape={act.onEscape}>
      {content}
    </FlowWindow>
  )
}
