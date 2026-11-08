import { RecordFrame } from "@/components/record-window/RecordFrame"
import { RecordInfoList } from "@/components/record-window/RecordInfoList"
import { useLocale } from "@/hooks/useLocale"
import { useToday } from "@/hooks/useToday"
import { extraValue } from "@/lib/selfServiceFields"
import { countsInTotals, statusKind, statusText } from "@/lib/selfServiceStatus"
import { countText, day, money, number } from "../../kinds"
import { describe } from "../../recordText"
import { extraText } from "../extraText"
import { fieldIcon } from "../icons"
import { detailItems } from "../KindFields"
import { LinesPane } from "./LinesPane"
import { ProgressCard } from "./ProgressCard"
import { headOf, splitFacts } from "./headOf"
import { RecordHead } from "./RecordHead"
import { leaveProgress, processProgress } from "./progressModel"
import { WindowBar } from "./WindowBar"
import "./recordWindow.css"
import "./recordWindowBody.css"

const withDay = (d, locale) =>
  d ? `${day(d, locale)} ${new Intl.DateTimeFormat(locale, { weekday: "short" }).format(d)}` : null

/** İzin kartı: geri sayım ya da kaçıncı gün; değer süre (gün altıysa saatler altında). */
function leaveCard(record, today, t, locale) {
  const model = leaveProgress(record, today)
  if (!model) return null
  const days = (n) => countText(t, locale, "selfService.days", n)
  const sub =
    model.phase === "upcoming"
      ? model.daysToStart === 1
        ? t("selfService.window.leave.tomorrow")
        : t("selfService.window.leave.startsIn", { days: days(model.daysToStart) })
      : model.phase === "ongoing"
        ? model.day === model.total
          ? t("selfService.window.leave.lastDay")
          : t("selfService.window.leave.dayOf", {
              n: number(model.day, locale),
              left: days(model.total - model.day),
            })
        : t("selfService.detail.phase.past")
  const from = extraValue(record.extra, "startTime")
  const to = extraValue(record.extra, "endTime")
  return {
    title: t("selfService.window.leavePlan"),
    sub,
    value: describe(record, t, locale).value,
    caption: from && to ? `${from}–${to}` : null,
    model,
    past: model.phase === "past",
    labelOf: (s) => t(`selfService.window.leave.${s.id}`),
    metaOf: (s) => withDay(s.date, locale),
  }
}

/** Masraf ve avans kartı: onay süreci; değer toplam ya da tutar. */
function processCard(record, category, t, locale) {
  const expense = record.kind === "expense"
  const lines = record.lines ?? []
  const receipts = lines.filter((l) => extraValue(l.extra, "receipt")).length
  const balance = (record.extra ?? []).find((x) => x.key === "balance")
  const model = processProgress(
    record,
    category,
    expense ? (extraValue(record.extra, "reportDate") ?? record.date) : record.date,
  )
  return {
    title: t("selfService.window.process"),
    sub: model
      ? t("selfService.window.processSub", {
          done: number(model.done, locale),
          total: number(model.total, locale),
        })
      : null,
    value: expense
      ? (describe(record, t, locale).amounts ?? [])
      : money(record.amount, record.currency, locale),
    stacked: expense,
    caption: expense
      ? [
          countText(t, locale, "selfService.expense.lines", lines.length),
          receipts ? t("selfService.detail.withReceipt", { n: number(receipts, locale) }) : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : balance
        ? t("selfService.detail.balanceLeft", { amount: extraText(balance, t, locale) })
        : null,
    model,
    labelOf: (s) => t(s.label),
    metaOf: (s) =>
      s.state === "current" ? (
        <span className="rw-now">{t("selfService.window.now")}</span>
      ) : s.date ? (
        day(s.date, locale)
      ) : null,
  }
}

/** Ayrıntılar: başlıkta kullanılan alan tekrar etmez; avansta ödeme şekli hep burada. */
function infoRows(record, used, t, locale) {
  const rows = detailItems(record, t, locale)
  if (record.kind === "advance" && !rows.some((r) => r.key === "paymentMode")) {
    const pay = (record.extra ?? []).find((x) => x.key === "paymentMode")
    if (pay)
      rows.unshift({
        key: "paymentMode",
        label: t("selfService.field.paymentMode"),
        icon: fieldIcon("paymentMode"),
        value: extraText(pay, t, locale),
      })
  }
  return rows.filter((r) => r.key !== used)
}

/**
 * Kaydın içi (pencerede ve telefon çekmecesinde aynı): başlık (simge, ad, etiketler, sahibi),
 * ilerleme kartı (izinde takvim, masraf ve avansta onay süreci) ve ayrıntılar. Masrafta iki sütun:
 * solda süreç ve rapor bilgileri, sağda kalemler (`LinesPane`); dar ekranda alt alta.
 */
export function RecordContent({ record, facet, person }) {
  const { t, locale } = useLocale()
  const today = useToday()
  const category = record.statusKind ?? statusKind(record.status)
  const note = countsInTotals(category) ? null : t(`selfService.detail.excluded.${category}`)
  const { used } = headOf(record, t, locale)
  // Masrafta ayrıntılar başlığın etiket satırında; geniş alan kalırsa listede.
  const { facts, rest } = splitFacts(record, infoRows(record, used, t, locale))
  const card =
    record.kind === "leave"
      ? leaveCard(record, today, t, locale)
      : processCard(record, category, t, locale)
  const details = rest.length > 0 && (
    <RecordInfoList title={t("selfService.window.details")} rows={rest} personal />
  )
  // Masraf ve avansta durum süreç kartının şimdiki adımında; başlıkta ikinci kez durmaz. İzinde
  // (kart zaman planı) ve süreci çizilemeyen durumda başlıkta kalır.
  const flow = record.kind !== "leave" && Boolean(card?.model)
  const erp =
    flow && record.status && statusText(record.status, t) !== record.status
      ? record.status
      : undefined
  const progress = card && <ProgressCard {...card} liveTitle={erp} liveNote={flow ? note : null} />
  return (
    <>
      <RecordHead
        record={record}
        owner={person?.profile}
        note={flow ? null : note}
        status={!flow}
        facts={facts}
      />
      {record.kind === "expense" ? (
        <div className="rw-cols">
          <div className="rw-col">
            {progress}
            {details}
          </div>
          <LinesPane record={record} facet={facet} />
        </div>
      ) : (
        <>
          {progress}
          {details}
        </>
      )}
    </>
  )
}

/**
 * KAYIT PENCERESİ (masaüstü) — bir Mac uygulamasında kayıt açılmış gibi: üst şerit (kapat, tür,
 * eylemler) ve beyaz kâğıtta kaydın içi (`RecordContent`). İzin ve avans dar ve dikey; masraf
 * geniş, iki sütun. Telefonda aynı içerik alttan çekmecede (`RecordSheet`). Çatı, şerit, başlık,
 * kart ve liste ortak kalıptan (`components/record-window`).
 */
export function RecordWindow({ record, facet, person, onAsk, onClose }) {
  return (
    <RecordFrame
      bar={<WindowBar record={record} person={person} onAsk={onAsk} onClose={onClose} />}
    >
      <RecordContent record={record} facet={facet} person={person} />
    </RecordFrame>
  )
}
