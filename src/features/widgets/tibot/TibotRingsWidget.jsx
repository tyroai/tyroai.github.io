import "@/lib/i18n/tibot"
import { useMemo, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import Ticket01Icon from "@hugeicons/core-free-icons/Ticket01Icon"
import { TicketSheet } from "@/components/tibot/TicketSheet"
import { useLocale } from "@/hooks/useLocale"
import { useMinuteNow } from "@/hooks/useMinuteNow"
import { BUCKET_COLOR } from "@/lib/tibot/bucketColor"
import { latePct, lateShare } from "@/lib/tibot/tibotBreakdown"
import { buckets } from "@/lib/tibot/tibotModel"
import { TIBOT_PATH } from "@/lib/tibotPolicy"
import { WidgetBody } from "../WidgetBody"
import { WidgetEmpty } from "../WidgetEmpty"
import { FrameAction, WidgetFrame } from "../WidgetFrame"
import { TibotRow } from "./TibotRow"
import { TibotStatPop } from "./TibotStatPop"
import { useTibotStats } from "./useTibotStats"
import "./tibotWidget.css"
import "./tibotRings.css"

// Dış halka bana atanan, ortası tarafımdan açılanlar, içi ekibim (kovaların sırası). İnce halkalar
// ve geniş iç boşluk: ortadaki sayı halkaya binmesin.
const RADIUS = { assigned: 54, mine: 45, team: 36 }
const ring = (r) => 2 * Math.PI * r

/**
 * İç içe halkalar: dolu kısım gecikmiş payı (`lateShare`), iz kovanın renginde soluk; seçili halka
 * öne çıkar, ortada yalnız onun sayısı (yüzde kovanın satırında). Dolu kısmın anlamı ipucunda.
 */
function Rings({ views, pick, onPick }) {
  const { t } = useLocale()
  const reduce = useReducedMotion()
  const view = views.find((v) => v.id === pick)
  return (
    <div className="tbg-rings" title={t("tibot.rings.fillHint")}>
      <svg viewBox="0 0 120 120" aria-hidden="true" className="tbg-svg">
        {views.map((v) => {
          const r = RADIUS[v.id]
          const c = ring(r)
          const s = lateShare(v)
          return (
            <g
              key={v.id}
              className="tbg-ring"
              data-bucket={v.id}
              data-on={v.id === pick ? "" : undefined}
              style={{ "--ring": BUCKET_COLOR[v.id] }}
              onClick={() => onPick(v.id)}
            >
              <circle className="tbg-track" cx="60" cy="60" r={r} />
              <motion.circle
                className="tbg-arc"
                cx="60"
                cy="60"
                r={r}
                strokeDasharray={c}
                initial={reduce ? false : { strokeDashoffset: c }}
                animate={{ strokeDashoffset: c * (1 - s) }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              />
            </g>
          )
        })}
      </svg>
      <span
        className="tbg-num tabular-nums"
        data-long={view && view.count > 99 ? "" : undefined}
        aria-hidden="true"
      >
        {view ? view.count : "—"}
      </span>
    </div>
  )
}

/**
 * Kovanın satırı: renk · kısa ad · sayı · gecikmiş payı (saat + kırmızı yüzde, halkanın dolu
 * kısmıyla aynı; gecikmiş yoksa boş).
 */
function KeyText({ view }) {
  const { t, locale } = useLocale()
  const late = latePct(view, locale)
  return (
    <>
      <span aria-hidden="true" className="tbg-dot" />
      <span className="truncate">{t(`tibot.bucketShort.${view.id}`)}</span>
      <span className="tbg-count tabular-nums">{view.count}</span>
      <span className="tbg-late tabular-nums" aria-hidden="true">
        {late && (
          <>
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={2.2} />
            {late}
          </>
        )}
      </span>
      {late && <span className="sr-only">{t("tibot.rings.lateShare", { pct: late })}</span>}
    </>
  )
}

/** Dar kart: lejant — renk · kısa ad · sayı; basınca o kovanın talepleri (`TibotStatPop`). */
function Legend({ views, onOpen }) {
  const { t } = useLocale()
  return (
    <ul className="tbg-legend">
      {views.map((v) => (
        <li key={v.id}>
          <TibotStatPop
            title={t(`tibot.bucket.${v.id}`)}
            items={v.items}
            bucket={v.id}
            onOpen={onOpen}
          >
            <button
              type="button"
              className="tbg-key"
              style={{ "--ring": BUCKET_COLOR[v.id] }}
              data-bucket={v.id}
            >
              <KeyText view={v} />
            </button>
          </TibotStatPop>
        </li>
      ))}
    </ul>
  )
}

/** Geniş kart: halkanın altında kova seçimi (lejant gibi: renk · ad · sayı). */
function Picks({ views, pick, onPick }) {
  const { t } = useLocale()
  return (
    <div role="tablist" aria-label={t("tibot.bucketsLabel")} className="tbg-picks">
      {views.map((v) => (
        <button
          key={v.id}
          type="button"
          role="tab"
          aria-selected={v.id === pick}
          onClick={() => onPick(v.id)}
          className="tbg-tab"
          data-bucket={v.id}
          style={{ "--ring": BUCKET_COLOR[v.id] }}
        >
          <KeyText view={v} />
        </button>
      ))}
    </div>
  )
}

/** Geniş kart: seçilen kovanın talepleri, kart içinde kayar. */
function List({ views, pick, onOpen }) {
  const { t } = useLocale()
  const view = views.find((v) => v.id === pick)
  return (
    // Sekme paneli listeyi saran kap: rol `ul`a verilince liste anlamı siliniyordu (axe).
    <div className="tbg-list" role="tabpanel" aria-label={t(`tibot.bucket.${pick}`)}>
      {view?.items.length ? (
        <ul className="tbw-scroll tbg-rows">
          {view.items.map((row) => (
            <TibotRow key={row.requestId} row={row} bucket={view.id} onOpen={onOpen} />
          ))}
        </ul>
      ) : (
        <p className="tbg-empty">{t(`tibot.empty.${pick}`)}</p>
      )}
    </div>
  )
}

/**
 * TIBOT TALEPLER · HALKA — kovalar iç içe halkalarda (dış bana atanan, orta tarafımdan açılanlar,
 * iç ekibim; renkler Ticket'ın çipleriyle aynı, `BUCKET_COLOR`). Halkanın dolu kısmı gecikmiş
 * payı; ortada seçili kovanın sayısı, satırında aynı pay yüzdeyle. Genişte halkanın altında kova seçimi,
 * sağda seçilenin talepleri (kart içinde kayar, üstüne gelince son not kartı); dar kartta lejant,
 * basınca talepler. Halkaya ya da ada basmak kovayı seçer; talebe basınca ayrıntı penceresi.
 */
export default function TibotRingsWidget({ className }) {
  const { t } = useLocale()
  const now = useMinuteNow().getTime()
  const { data, bodyStatus, status, busy } = useTibotStats()
  const views = useMemo(() => buckets(data, now), [data, now])
  const [pick, setPick] = useState("assigned")
  const [open, setOpen] = useState(null)

  return (
    <WidgetFrame
      personal
      id="tibot-rings"
      title={t("widgets.tibotRings.title")}
      shortTitle={t("widgets.tibotRings.short")}
      icon={Ticket01Icon}
      busy={status === "loading" || busy}
      className={className}
      action={
        <FrameAction to={TIBOT_PATH} className="@max-[16rem]/widget:hidden">
          {t("widgets.tibot.all")}
        </FrameAction>
      }
    >
      <WidgetBody status={bodyStatus} rows={3}>
        {!data?.person ? (
          <WidgetEmpty icon={Ticket01Icon}>{t("tibot.noPerson")}</WidgetEmpty>
        ) : (
          <div className="tbg">
            <div className="tbg-side">
              <Rings views={views} pick={pick} onPick={setPick} />
              <Picks views={views} pick={pick} onPick={setPick} />
            </div>
            <Legend views={views} onOpen={setOpen} />
            <List views={views} pick={pick} onOpen={setOpen} />
          </div>
        )}
      </WidgetBody>
      <TicketSheet row={open} onOpenChange={(o) => !o && setOpen(null)} />
    </WidgetFrame>
  )
}
