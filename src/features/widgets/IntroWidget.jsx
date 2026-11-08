import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import AiChat02Icon from "@hugeicons/core-free-icons/AiChat02Icon"
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon"
import { BrandOrb } from "@/components/brand/BrandOrb"
import { InsightTip } from "@/features/myspace/InsightTip"
import { prepareMeeting } from "@/features/myspace/meetingUtils"
import { useGreetingHeading } from "@/features/myspace/useGreetingHeading"
import { useLocale } from "@/hooks/useLocale"
import { requestOpenChat, setPendingAsk } from "@/lib/chatBus"
import { STATUS } from "@/lib/graph"
import { greetingKey } from "@/lib/greeting"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { planAgenda } from "@/lib/planAgenda"
import { cn } from "@/lib/utils"
import { BRIEF_ICON } from "./briefIcons"
import { introAction } from "./introAction"
import { planQuestion } from "@/lib/planQuestion"
import { useBrief } from "./useBrief"
import { useBrandInk } from "./useBrandInk"
import { useBriefTips } from "./useBriefTips"
import { useBriefLines } from "./useBriefLines"
import "./IntroWidget.css"

const OFFICE = "tyroOffice"
const OPTS_DATE = { weekday: "long", day: "numeric", month: "long" }
// Mini hücrede gün adı düşer ("27 Ekim"): kürenin yanında "27 EKİM S…" diye kesiliyordu.
const OPTS_DATE_MINI = { day: "numeric", month: "long" }
const MAX_CHIPS = 4
// Dokunmatikte hap 36 px görünür, görünmez bir kenarla 44 px'lik vuruş alanı alır.
const CHIP =
  "intro-card__chip relative inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[0.75rem] font-medium text-white ring-1 ring-white/20 backdrop-blur-sm transition active:scale-[0.97] pointer-coarse:h-9 pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
// Düğme: dar kartta (`@container/intro` < 40rem) haplarının altında kartın tam genişliğinde
// ana eylem; geniş kartta haplarla aynı satırda, sağ altta (eski, yana yaslı tek düğme dar
// kartta alt satıra düşüp sağda yalnız kalıyor, simetriyi bozuyordu).
const CTA =
  "intro-card__cta inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full px-4 text-[0.8125rem] font-semibold shadow-sm transition hover:brightness-95 hover:shadow-md active:scale-[0.98] pointer-coarse:h-11 @[40rem]/intro:col-start-2 @[40rem]/intro:h-7 @[40rem]/intro:w-auto @[40rem]/intro:justify-self-end @[40rem]/intro:px-3 @[40rem]/intro:text-[0.75rem] @[40rem]/intro:pointer-coarse:h-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
// Metin satırları kürenin altına girmesin: sağ pay kürenin boyu kadar.
const BESIDE_ORB = "pe-[calc(var(--orb,0px)+0.75rem)]"
// Panonun mini hücresi (< 16rem): cümleler kürenin ALTINDA tam genişlikte, toplantı satırı kısa,
// haplar yok (aynı sayılar cümlede) — yoksa ana düğme kartın dışında kalıyordu.
const MINI_PX = 256

/**
 * Karşılama — hava kartını istemeyenler için giriş kartı: paletin renklerinden
 * katmanlı premium zemin (`IntroWidget.css`), küre, selamlama ve günün brifingi.
 * Brifing Günün brifingi kartıyla AYNI veriden (`useBrief`); haplar aynı
 * ipuçlarını açar (`useBriefTips` — üstüne gelince ilk kayıtlar, önizleme,
 * ilgili yer); cümlelerdeki toplantı ifadeleri vurgulu (`useBriefLines`). Tek
 * düğme "sıradaki en iyi adım" (`introAction`): toplantıya hazırlan · günü/yarını
 * planla · haftaya hazırlan — istem gerçek gündemi taşır (`planQuestion`); "Günün özeti"
 * hazır soru kutucuğunda zaten var. Küre
 * kartın genişliğine göre ölçülür; gözler imleci izler, karta gelince dinler.
 * Alt bölüm kartın genişliğine göre (kap sorgusu): dar kartta haplar solda sarılır, düğme
 * altında tam genişlikte (hiçbir hap ya da düğme tek başına sağa düşmez); ≥ 40rem'de iki
 * sütun — haplar solda (gerekirse sarılır), düğme sağ altta, asla alt satıra düşmez.
 */
export function IntroWidget({ ctx, firstName, celebration, greeted = false, className }) {
  const { t, locale } = useLocale()
  const brief = useBrief(ctx)
  const { tips, meetingsTip, dialog } = useBriefTips(brief.tipData)
  const { headline, meetingLine, shortMeetingLine } = useBriefLines(brief, meetingsTip)
  const heading = useGreetingHeading(greetingKey(brief.date.getHours()), celebration)
  const host = useRef(null)
  const [width, setWidth] = useState(0)
  const [live, setLive] = useState(false)
  const { ink, veil } = useBrandInk()

  useEffect(() => {
    const el = host.current
    if (!el || typeof ResizeObserver === "undefined") return undefined
    const ro = new ResizeObserver(() => setWidth(el.offsetWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const orb = width ? Math.round(Math.max(64, Math.min(124, width * 0.22))) : 0
  const mini = width > 0 && width < MINI_PX
  const date = getDateTimeFormat(locale, mini ? OPTS_DATE_MINI : OPTS_DATE).format(brief.date)
  const dateLine = brief.weekend ? `${date} · ${t("widgets.brief.weekendTag")}` : date

  const next = introAction({
    weekend: brief.weekend,
    part: brief.part,
    left: brief.left,
    now: brief.date.getTime(),
  })
  function act() {
    if (next.kind === "prepare") return prepareMeeting(next.meeting, t, locale)
    // Gerçek gündemle: asistan toplantıları ve işleri yeniden çekmesin (`lib/planAgenda`).
    const agenda = planAgenda(next.kind, {
      events: ctx.cal.events,
      tasks: ctx.focus.tasks,
      now: brief.date.getTime(),
      calendarReady: ctx.cal.status === STATUS.ready,
      tasksReady: !ctx.focus.loading,
    })
    setPendingAsk({ question: planQuestion(next.kind, agenda, t, locale), agent: OFFICE })
    requestOpenChat({ focusComposer: true })
  }

  return (
    <section
      ref={host}
      data-widget="intro"
      data-ink={ink}
      aria-label={t("widgets.intro.title")}
      onPointerEnter={() => setLive(true)}
      onPointerLeave={() => setLive(false)}
      style={{ "--orb": `${orb}px`, "--intro-veil": veil }}
      className={cn(
        "intro-card @container/intro relative isolate flex min-w-0 flex-col overflow-hidden rounded-[1.75rem] p-5 text-white shadow-[0_18px_40px_-24px_var(--brand-via)]",
        className,
      )}
    >
      <span aria-hidden="true" className="intro-card__aurora" />
      <span aria-hidden="true" className="intro-card__shade" />
      <span aria-hidden="true" className="intro-card__grain" />
      {orb > 0 && (
        <div aria-hidden="true" inert className="pointer-events-none absolute end-4 top-4">
          <span className="intro-card__glow absolute -inset-[18%] rounded-full bg-white/25 blur-xl" />
          <BrandOrb
            surface="dashboard"
            state={live ? "listening" : "idle"}
            mascotState={live ? "listening" : undefined}
            restState="idle"
            trackPage
            size={orb}
          />
        </div>
      )}
      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* Mini kartta baş blok kürenin dibine dek uzar (küre 1rem içeride, dolgu 1,25rem). */}
        <div style={mini ? { minHeight: orb - 4 } : undefined}>
          {/* Anasayfa'da selamlama sayfanın başında (`HomeGreeting`): kartın başlığı tarih olur. */}
          {!greeted && (
            <p
              className={cn(
                "intro-card__kicker truncate text-[0.6875rem] font-semibold uppercase tracking-[0.08em]",
                BESIDE_ORB,
              )}
            >
              {dateLine}
            </p>
          )}
          <h2
            className={cn(
              "mt-1 text-[length:clamp(1.375rem,6.5cqi,2rem)] font-semibold leading-[1.1] tracking-[-0.025em] [text-shadow:0_1px_2px_rgb(0_0_0/0.16)]",
              BESIDE_ORB,
            )}
          >
            {greeted ? (
              dateLine.charAt(0).toLocaleUpperCase(locale) + dateLine.slice(1)
            ) : firstName ? (
              <>
                {heading}, <span className="intro-card__name">{firstName}</span>!
              </>
            ) : (
              `${heading}!`
            )}
          </h2>
        </div>
        {brief.loading ? (
          <span
            aria-hidden="true"
            className="intro-card__skel mt-2 block h-4 w-2/3 rounded-full bg-white/20"
          />
        ) : (
          <>
            <p
              className={cn("mt-1.5 text-[0.875rem] font-medium leading-snug", !mini && BESIDE_ORB)}
            >
              {headline}
            </p>
            {meetingLine && (
              <p
                className={cn(
                  "mt-0.5 text-[0.75rem] font-medium leading-relaxed",
                  !mini && BESIDE_ORB,
                )}
              >
                {mini ? shortMeetingLine : meetingLine}
              </p>
            )}
          </>
        )}
        <div className="mt-auto grid gap-2.5 pt-3 @[40rem]/intro:grid-cols-[minmax(0,1fr)_auto] @[40rem]/intro:items-end @[40rem]/intro:gap-x-4">
          <div className="flex flex-wrap items-center gap-1.5 pointer-coarse:gap-2 empty:hidden">
            {brief.loading
              ? [0, 1, 2].map((i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    className="intro-card__skel h-7 w-20 rounded-full bg-white/15"
                  />
                ))
              : brief.items.slice(0, mini ? 0 : MAX_CHIPS).map((item) => (
                  <InsightTip key={item.id} {...tips[item.id]} side="bottom" align="start">
                    <button type="button" className={CHIP}>
                      <HugeiconsIcon
                        icon={BRIEF_ICON[item.id]}
                        className="size-3.5"
                        strokeWidth={2}
                      />
                      {t(`widgets.intro.chip.${item.id}`)}
                      <span className="font-semibold tabular-nums">{item.n}</span>
                    </button>
                  </InsightTip>
                ))}
          </div>
          <button type="button" onClick={act} className={`${CTA} bg-white`}>
            <HugeiconsIcon
              icon={next.kind === "prepare" ? AiChat02Icon : SparklesIcon}
              className="size-3.5"
              strokeWidth={2}
            />
            {t(`widgets.intro.${mini ? "ctaShort" : "cta"}.${next.kind}`)}
          </button>
        </div>
      </div>
      {dialog}
    </section>
  )
}
