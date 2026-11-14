import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import CalendarCheckOut01Icon from "@hugeicons/core-free-icons/CalendarCheckOut01Icon"
import UnfoldMoreIcon from "@hugeicons/core-free-icons/UnfoldMoreIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { getNumberFormat } from "@/lib/intl-cache"
import { addDays, dayInfo, leaveWorkdays } from "@/lib/leaveDays"
import { DayStrip } from "../shared/DayStrip"
import { FlowCard } from "../shared/FlowCard"
import { FlowClose, FlowWindow } from "../shared/FlowWindow"
import { cap, dayLabel, shortDay } from "../shared/flowText"
import { PhotoPicker } from "../shared/PhotoPicker"
import { Token } from "../shared/Token"
import { useFlow } from "../shared/useFlow"
import { leaveArt } from "./leaveArt"
import { LeaveScene } from "./LeaveScene"
import "./leave.css"

const KEY = "leaveRequest"
// İzin en erken iki hafta geriye, en geç altı ay ileriye seçilir.
const BACK = 14
const AHEAD = 183

/** İzinden sonraki ilk iş günü. */
function returnDay(end) {
  let d = addDays(end, 1)
  for (let i = 0; i < 14 && dayInfo(d).weight === 0; i += 1) d = addDays(d, 1)
  return d
}

/**
 * İZİN AKIŞI — sohbet çubuğundaki "İzin talebi": avans akışının dili, haritanın yerinde
 * tür illüstrasyonu ve takvim şeridi (`LeaveScene`). Üstte izin türü (illüstrasyonlu seçim), cümlede başlangıç ve bitiş (gün
 * şeridi; başlangıç seçilince bitiş açılır, bitiş başlangıçtan önce seçilemez), altında tahmini iş
 * günü ve işe dönüş günü. Alanlar şablonla birebir (tür · başlangıç · bitiş; günlük izin), gönderilen
 * cümle aynı (`composeTemplate`). Kesin süreyi ERP hesaplar: sayı ön izlemedir.
 */
export default function LeaveFlow({ open, onOpenChange, onSend }) {
  const [view, act, body] = useFlow(KEY)
  const { t, locale, values, today, card, text, lead, slots } = view
  const { pick, openCard, close } = act
  const start = values.start instanceof Date ? values.start : null
  const end = values.end instanceof Date ? values.end : null
  const days = leaveWorkdays(start, end)
  const back = end ? returnDay(end) : null
  const kind = values.kind
  const kinds = slots.kind.options.map((k) => ({
    value: k,
    name: cap(t(`myspace.leave.${k}`), locale),
    src: leaveArt(k),
  }))
  const send = () => {
    if (act.send(onSend)) onOpenChange(false)
  }
  const title = t("myspace.chip.leaveRequest")
  const n = days == null ? null : getNumberFormat(locale).format(days)
  return (
    <FlowWindow open={open} onOpenChange={onOpenChange} title={title} onEscape={act.onEscape}>
      <div ref={body} className="af" data-kind={kind}>
        <div className="af-top">
          <button
            type="button"
            className="af-pill af-pill--photo"
            data-slot="kind"
            aria-haspopup="dialog"
            aria-expanded={card?.name === "kind"}
            aria-label={`${cap(lead("kind"), locale)}: ${text("kind")}`}
            onClick={(e) => openCard("kind", e.currentTarget)}
          >
            <img src={leaveArt(kind)} alt="" width="56" height="56" />
            {cap(text("kind"), locale)}
            <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} aria-hidden="true" />
          </button>
          <span className="af-top-gap" />
          <FlowClose onClose={() => onOpenChange(false)} />
        </div>

        <LeaveScene
          kind={kind}
          src={leaveArt(kind)}
          start={start}
          end={end}
          today={today}
          locale={locale}
          badge={n == null ? null : t("advanceFlow.leave.days", { n })}
        />
        <p className="af-info">
          <span>{start && end && `${shortDay(locale, start)} → ${shortDay(locale, end)}`}</span>
          {back && (
            <strong>
              {t("advanceFlow.leave.back", { day: dayLabel(t, locale, back, today) })}
            </strong>
          )}
        </p>

        <h2 className="af-title">{t("advanceFlow.leave.title")}</h2>
        <p className="af-sentence">
          <Token
            name="start"
            icon={Calendar03Icon}
            lead={lead("start")}
            value={dayLabel(t, locale, start, today)}
            placeholder={t("advanceFlow.pick.date")}
            open={card?.name}
            onOpen={openCard}
          />
          <Token
            name="end"
            icon={CalendarCheckOut01Icon}
            lead={lead("end")}
            value={dayLabel(t, locale, end, today)}
            placeholder={t("advanceFlow.pick.date")}
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
            wide
          >
            {card.name === "kind" && (
              <PhotoPicker
                art
                label={cap(lead("kind"), locale)}
                items={kinds}
                value={kind}
                onPick={(v) => pick("kind", v)}
              />
            )}
            {card.name === "start" && (
              <DayStrip
                value={start}
                today={today}
                back={BACK}
                ahead={AHEAD}
                range={[start, end]}
                onPick={(v) => pick("start", v)}
              />
            )}
            {card.name === "end" && (
              <DayStrip
                value={end}
                today={today}
                back={BACK}
                ahead={AHEAD}
                min={start ?? undefined}
                range={[start, end]}
                onPick={(v) => pick("end", v)}
              />
            )}
          </FlowCard>
        )}
      </div>
    </FlowWindow>
  )
}
