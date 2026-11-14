import "@/lib/i18n/tibot"
import { useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Ticket01Icon from "@hugeicons/core-free-icons/Ticket01Icon"
import { BrandOrb } from "@/components/brand/BrandOrb"
import { TicketSheet } from "@/components/tibot/TicketSheet"
import { useLocale } from "@/hooks/useLocale"
import { useMinuteNow } from "@/hooks/useMinuteNow"
import { useOrbStyle } from "@/hooks/useOrbStyle"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { dayDelta, deck } from "@/lib/tibot/tibotDeck"
import { counterpart, statusKey, statusLabel } from "@/lib/tibot/tibotModel"
import { TIBOT_PATH } from "@/lib/tibotPolicy"
import { cn } from "@/lib/utils"
import { WidgetBody } from "../WidgetBody"
import { WidgetEmpty } from "../WidgetEmpty"
import { FrameAction, WidgetFrame } from "../WidgetFrame"
import { TibotStatPop } from "./TibotStatPop"
import { useTibotStats } from "./useTibotStats"
import "./tibotNext.css"

const TIME = { hour: "2-digit", minute: "2-digit" }
const WEEKDAY = { weekday: "short", hour: "2-digit", minute: "2-digit" }
const SWIPE = 48
const DOTS = 5

/** Kartın zaman ifadesi ve tonu: gecikme · bugün/yarın saati · kalan gün · senden yanıt. */
function when(card, now, t, locale) {
  if (card.kind === "reply") return { tone: "warning", text: t("tibot.next.reply") }
  if (card.kind === "open")
    return {
      tone: "neutral",
      text: statusLabel(t, statusKey(card.row)) || t("tibot.next.noTarget"),
    }
  const delta = dayDelta(card.at, now)
  if (card.kind === "late")
    return {
      tone: "danger",
      text: delta === 0 ? t("tibot.next.lateToday") : t("tibot.next.late", { n: -delta }),
    }
  const time = getDateTimeFormat(locale, TIME).format(card.at)
  if (delta === 0) return { tone: "warning", text: t("tibot.next.today", { time }) }
  if (delta === 1) return { tone: "brand", text: t("tibot.next.tomorrow", { time }) }
  if (delta < 7) return { tone: "brand", text: getDateTimeFormat(locale, WEEKDAY).format(card.at) }
  return { tone: "brand", text: t("tibot.next.left", { n: delta }) }
}

/** Destenin başrolü: zaman ifadesi, konu (üç satır), numara · karşı taraf. */
function Hero({ card, now, index, total, onOpen, dragged }) {
  const { t, locale } = useLocale()
  const w = when(card, now, t, locale)
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={`${t("tibot.next.position", { i: index + 1, n: total })}: ${card.row.subject}`}
      onClick={() => !dragged.current && onOpen({ ...card.row, bucket: card.bucket })}
      className="tbn-card"
    >
      <span className="tbn-when" data-tone={w.tone}>
        <span aria-hidden="true" className="tbn-dot" />
        <span className="truncate">{w.text}</span>
        <span className="tbn-pos tabular-nums">
          {index + 1}/{total}
        </span>
      </span>
      <span className="tbn-subject" lang="tr">
        {card.row.subject}
      </span>
      <span className="tbn-meta">
        <span className="tabular-nums">#{card.row.requestId}</span>
        {counterpart(card.row, card.bucket) ? (
          <span className="truncate"> · {counterpart(card.row, card.bucket)}</span>
        ) : null}
      </span>
    </button>
  )
}

/** Destenin sonundaki tek kart: 14 günden eski gecikenler (her gün başrolde kalmasın). */
function StaleCard({ items, index, total, onOpen }) {
  const { t } = useLocale()
  return (
    <TibotStatPop title={t("tibot.next.stale")} items={items} bucket="assigned" onOpen={onOpen}>
      <button type="button" aria-haspopup="dialog" className="tbn-card" data-stale="">
        <span className="tbn-when" data-tone="neutral">
          <span aria-hidden="true" className="tbn-dot" />
          <span className="truncate">{t("tibot.next.stale")}</span>
          <span className="tbn-pos tabular-nums">
            {index + 1}/{total}
          </span>
        </span>
        <span className="tbn-subject tbn-big tabular-nums">{items.length}</span>
        <span className="tbn-meta">{t("tibot.next.staleSub", { n: items.length })}</span>
      </button>
    </TibotStatPop>
  )
}

/** Genişte sağda sıradaki kartlar (eski gecikenlerin kartı dahil): basınca başrole geçer. */
function Side({ items, start, stale, now, onPick }) {
  const { t, locale } = useLocale()
  return (
    <ul className="tbn-side" aria-label={t("tibot.next.nextOne")}>
      {items.map((card, i) => {
        const w = card
          ? when(card, now, t, locale)
          : { tone: "neutral", text: t("tibot.next.stale") }
        return (
          <li key={card ? card.row.requestId : "stale"}>
            <button type="button" className="tbn-mini" onClick={() => onPick(start + i)}>
              <span className="tbn-when" data-tone={w.tone}>
                <span aria-hidden="true" className="tbn-dot" />
                <span className="truncate">{w.text}</span>
              </span>
              <span className="tbn-mini-subject" lang="tr">
                {card ? card.row.subject : t("tibot.next.staleSub", { n: stale })}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function AllClear({ waiting, unclaimed }) {
  const { t } = useLocale()
  const orbStyle = useOrbStyle()
  return (
    <div className="tbn-clear">
      <span
        aria-hidden="true"
        inert
        className={cn("pointer-events-none", orbStyle === "mascot" ? "-my-1" : "-m-3")}
      >
        <BrandOrb surface="dashboard" state="idle" mascotState="idle" size={52} />
      </span>
      <p className="tbn-clear-line">{t("tibot.next.clear")}</p>
      <Link to={TIBOT_PATH} className="tbn-clear-foot">
        {t("tibot.next.clearFoot", { waiting, unclaimed })}
      </Link>
    </div>
  )
}

/**
 * TIBOT · SIRA SENDE — benden hamle bekleyen talepler bir deste: senden yanıt bekleyenler, yakın
 * gecikenler, yaklaşan hedefler, hedefsizler (`tibotDeck.deck`); 14 günden eski gecikenler sonda
 * tek kart. Başroldeki kart talebin kendisi (zaman · konu · numara); arkasında destenin kenarı
 * görünür. Oklar, ok tuşları ya da kaydırma sıradakine geçer (kendiliğinden dönmez). Genişte sağda
 * sıradaki iki kart. Hepsi tamamsa küre ve tek satır. Yalnız Ticket kitlesinde.
 */
export default function TibotNextWidget({ className }) {
  const { t } = useLocale()
  const reduce = useReducedMotion()
  const now = useMinuteNow().getTime()
  const { stats, data, bodyStatus, status, busy } = useTibotStats()
  const [open, setOpen] = useState(null)
  const [pick, setPick] = useState({ index: 0, dir: 1 })
  const dragged = useRef(false)
  const needsMe = useMemo(
    () => stats.waiting.items.filter((r) => r.status === "waiting_for_customer"),
    [stats.waiting.items],
  )
  const { cards, stale } = useMemo(
    () => deck(stats.onMe.items, needsMe, now),
    [stats.onMe.items, needsMe, now],
  )
  const total = cards.length + (stale.length ? 1 : 0)
  const index = Math.min(pick.index, Math.max(0, total - 1))
  const go = (next, dir) => setPick({ index: (next + total) % total, dir })
  const step = (d) => total > 1 && go(index + d, d)
  const onKey = (e) => {
    if (e.key === "ArrowRight") step(1)
    else if (e.key === "ArrowLeft") step(-1)
    else return
    e.preventDefault()
  }
  const current = cards[index]
  // Destenin sırası: kartlar, varsa sonda eski gecikenler (`null`).
  const order = stale.length ? [...cards, null] : cards
  const side = order.slice(index + 1, index + 3)
  const rest = order.length - (index + 1 + side.length)
  const restRows = order.slice(index + 1 + side.length).flatMap((c) => (c ? [c.row] : stale))
  const shift = reduce ? 0 : 28

  return (
    <WidgetFrame
      personal
      id="tibot-summary"
      title={t("widgets.tibotSummary.title")}
      shortTitle={t("widgets.tibotSummary.short")}
      icon={Ticket01Icon}
      busy={status === "loading" || busy}
      className={className}
      action={
        total > 0 ? (
          <FrameAction to={TIBOT_PATH} className="@max-[16rem]/widget:hidden">
            {t("widgets.tibot.all")}
          </FrameAction>
        ) : null
      }
    >
      <WidgetBody status={bodyStatus} rows={3}>
        {!data?.person ? (
          <WidgetEmpty icon={Ticket01Icon}>{t("tibot.noPerson")}</WidgetEmpty>
        ) : total === 0 ? (
          <AllClear waiting={stats.waiting.count} unclaimed={stats.unclaimed.count} />
        ) : (
          // Ok tuşları destenin içindeyken sıradakine geçer.
          <div className="tbn" onKeyDown={onKey}>
            <div className="tbn-main">
              <div className="tbn-stack" data-depth={Math.min(total - 1, 2)}>
                <AnimatePresence initial={false} mode="popLayout" custom={pick.dir}>
                  <motion.div
                    key={current ? current.row.requestId : "stale"}
                    className="tbn-slot"
                    custom={pick.dir}
                    initial={{ opacity: 0, x: pick.dir * shift }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -pick.dir * shift }}
                    transition={{ type: "spring", bounce: 0, duration: 0.35 }}
                    drag={total > 1 && !reduce ? "x" : false}
                    dragSnapToOrigin
                    dragElastic={0.18}
                    onDragStart={() => {
                      dragged.current = true
                    }}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -SWIPE || info.velocity.x < -400) step(1)
                      else if (info.offset.x > SWIPE || info.velocity.x > 400) step(-1)
                      setTimeout(() => {
                        dragged.current = false
                      }, 0)
                    }}
                  >
                    {current ? (
                      <Hero
                        card={current}
                        now={now}
                        index={index}
                        total={total}
                        onOpen={setOpen}
                        dragged={dragged}
                      />
                    ) : (
                      <StaleCard items={stale} index={index} total={total} onOpen={setOpen} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
              {side.length > 0 && (
                <Side
                  items={side}
                  start={index + 1}
                  stale={stale.length}
                  now={now}
                  onPick={(i) => go(i, 1)}
                />
              )}
            </div>
            {total > 1 && (
              <div className="tbn-foot">
                <button
                  type="button"
                  className="tbn-nav"
                  aria-label={t("tibot.next.prev")}
                  onClick={() => step(-1)}
                >
                  <HugeiconsIcon
                    icon={ArrowLeft01Icon}
                    strokeWidth={2}
                    className="rtl:rotate-180"
                  />
                </button>
                {rest > 0 && (
                  <TibotStatPop
                    title={t("widgets.tibotSummary.short")}
                    items={restRows}
                    bucket="assigned"
                    onOpen={setOpen}
                  >
                    <button
                      type="button"
                      className="tbn-rest tabular-nums"
                      aria-label={t("tibot.next.moreAria", { n: rest })}
                    >
                      +{rest}
                    </button>
                  </TibotStatPop>
                )}
                <span className="tbn-dots" aria-hidden="true">
                  {Array.from({ length: Math.min(total, DOTS) }, (_, i) => (
                    <span
                      key={i}
                      data-on={
                        i === Math.min(index, DOTS - 1) && (index < DOTS - 1 || i === DOTS - 1)
                          ? ""
                          : undefined
                      }
                    />
                  ))}
                </span>
                <button
                  type="button"
                  className="tbn-nav"
                  aria-label={t("tibot.next.nextOne")}
                  onClick={() => step(1)}
                >
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    className="rtl:rotate-180"
                  />
                </button>
              </div>
            )}
          </div>
        )}
      </WidgetBody>
      <TicketSheet row={open} onOpenChange={(o) => !o && setOpen(null)} />
    </WidgetFrame>
  )
}
