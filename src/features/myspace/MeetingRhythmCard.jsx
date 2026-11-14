import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import ChartColumnIcon from "@hugeicons/core-free-icons/ChartColumnIcon"
import { CalendarRetry } from "./CalendarRetry"
import { RhythmBar } from "./RhythmBar"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { useStoredFlag } from "@/features/myspace/hooks/useStoredFlag"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { STATUS } from "@/lib/graph"
import { cn } from "@/lib/utils"
import { weekStats } from "@/features/myspace/lib/weekStats"
import { useSlotSize } from "@/features/widgets/slotSize"
import { Card, CardTitle } from "./CardShell"
import { OPTS_WEEKDAY_LONG, OPTS_WEEKDAY_SHORT } from "./cardFormats"
import { RhythmMini } from "./RhythmMini"
import { WeekSelect } from "./RhythmWeek"
import { rhythmWeeks } from "./lib/rhythmWeeks"
import { compactHours, formatHM } from "./rhythmFormat"
import { useRhythmTips } from "./hooks/useRhythmTips"
import "./rhythm.css"

/* ─── Toplantı ritmin ───────────────────────────────────────────────── */

function splitMinutes(total) {
  return { h: Math.floor(total / 60), m: total % 60 }
}

/** Yüklenirken çizilen hayalet çubukların boyu (%): hafta içi dolu, hafta
 *  sonu alçak — boş bir grafik değil, "bir hafta" gibi okunsun. */
const GHOST_BARS = [46, 72, 38, 88, 58, 22, 14]

/**
 * Referansın "Today activity" kartı: iki sütun genişliğinde, solda büyük
 * sayı + en yoğun an, sağda çubuklar.
 *
 * ⚠️ **İKİ SÜTUNLU İÇ DÜZEN KARTIN KENDİ GENİŞLİĞİNE BAĞLI** (`@container/rhythm`),
 * sayfanınkine değil: ızgara iki ya da üç sütuna düştüğünde kart dar kalıyor
 * ve orada sayı ile çubuklar ALT ALTA daha iyi okunuyor.
 *
 * ⚠️ **"EN YOĞUN GÜN" ARİTMETİK, YORUM DEĞİL** — referanstaki "Most active"in
 * karşılığı, çubukların en yükseğinin adı ve süresi. Hiç toplantı yoksa hiç
 * çizilmez: sıfır dakikalık bir "en yoğun gün" anlamsız bir iddia olurdu.
 *
 * ⚠️ **ÇUBUK BİR DÜĞME, ÜSTÜNE GELİNCE O GÜNÜN İPUCU.** Özetin koyu kartının
 * AYNISI (`InsightTip`): tarih · kaç toplantı
 * ve ne kadar · ilk üçü saatiyle · "+n daha" · çakışma varsa notu. Düğme,
 * çünkü ipucu dokunuşta ve klavyede de açılmak zorunda; `title` balonu
 * yok (ikisi birden çıkardı). Hedef ÇUBUK DEĞİL SÜTUN: sıfır dakikalı bir
 * günün çubuğu 6px — parmağa da imlece de küçük. Sayfada aynı anda tek ipucu
 * açık kalıyor ve biri açıkken diğerine geçiş beklemesiz (`useHoverPopover`),
 * yani fare grafiği tarayabiliyor.
 *
 * ⚠️ **YÜKLENİRKEN KART KENDİ ŞEKLİNDE** (büyük sayı · alt yazı · en yoğun gün
 * · yedi hayalet çubuk) ve hafta seçici GİZLİ: seçilecek bir veri yokken
 * açılan bir liste boş bir söz olurdu.
 */
export function MeetingRhythmCard(props) {
  // Panonun küçük kartında haftanın dört sayısı (eski "Haftam"); büyük kartta, header'da ve
  // telefonda çubuklu tam hâl.
  return useSlotSize() === "mini" ? (
    <RhythmMini cal={props.cal} load={props.load} now={props.now} className={props.className} />
  ) : (
    <RhythmFull {...props} />
  )
}

function RhythmFull({ cal, load, now, className }) {
  const { t, locale } = useLocale()
  const [week, setWeek] = useState("current")
  const { tipFor, countText, dialog } = useRhythmTips(now)
  const { weeks, id: effWeek, days } = rhythmWeeks(load, week, t)
  const offset = effWeek === "previous" ? -1 : effWeek === "next" ? 1 : 0
  const total = days.reduce((s, d) => s + d.minutes, 0)
  const { h, m } = splitMinutes(total)
  // Telefonda istatistik kartı yer kaplamaz: özet satırı, grafik dokununca açılır.
  const mobile = useIsMobile()
  const [chartOpen, setChartOpen] = useStoredFlag("tyro-rhythm-chart-open-v1", false)
  const folded = mobile && !chartOpen
  // Ölçek İKİ HAFTANIN ortak tepesi: hafta değişince çubuklar kendi içinde
  // yeniden ölçeklenseydi, sakin bir hafta yoğun bir hafta gibi görünürdü.
  const peakAll = Math.max(
    60,
    ...load.current.map((d) => d.minutes),
    ...(load.previous ?? []).map((d) => d.minutes),
    ...(load.next ?? []).map((d) => d.minutes),
  )
  const peakThis = Math.max(...days.map((d) => d.minutes))
  // Haftanın öteki sayıları (eski Haftam): toplantı sayısı, boş odak (geçen haftada yok), mesai dışı.
  const stats = useMemo(() => weekStats(cal.events, now, offset), [cal.events, now, offset])
  const busiest = peakThis > 0 ? days.find((d) => d.minutes === peakThis) : null
  const weekdayFmt = getDateTimeFormat(locale, OPTS_WEEKDAY_SHORT)
  const weekdayLong = getDateTimeFormat(locale, OPTS_WEEKDAY_LONG)
  const todayKey = new Date(now).toDateString()
  const ready = cal.status === STATUS.ready

  return (
    <Card
      data-tour="rhythm"
      className={cn("@container/rhythm", className)}
      aria-busy={cal.status === "loading" ? true : undefined}
    >
      <CardTitle
        leadingIcon={ChartColumnIcon}
        action={
          // ⚠️ HAFTA SEÇİCİ: Radix `Select`, açılan listede geçen · bu · gelecek
          // hafta. Üç haftanın her gün — ayın ilk günlerinde de — aralıkta
          // olması `calendarRange`ın işi. Seçim YEREL (sayfa yeniden açılınca
          // bu hafta) — bir bakış ayarı, tercih değil.
          ready && mobile && chartOpen ? (
            <button
              type="button"
              onClick={() => setChartOpen(false)}
              aria-expanded="true"
              aria-label={t("myspace.rhythm.collapse")}
              title={t("myspace.rhythm.collapse")}
              className="-me-2 grid size-11 place-items-center rounded-full text-muted-foreground transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <HugeiconsIcon icon={ArrowDown01Icon} className="size-4 rotate-180" strokeWidth={2} />
            </button>
          ) : ready && !folded && weeks.length > 1 ? (
            <WeekSelect value={effWeek} onChange={setWeek} weeks={weeks} />
          ) : null
        }
      >
        {/* Dar kartta başlık tek satır (hafta seçicinin yanında iki satıra kırılınca kart
            taşıyordu); en darda kısa adı (`rhythm.css`). */}
        <span className="rhythm-title truncate">{t("myspace.rhythm.title")}</span>
        <span className="rhythm-title-short truncate">{t("myspace.rhythm.titleShort")}</span>
      </CardTitle>

      {cal.status === "loading" ? (
        <>
          <span className="sr-only">{t("myspace.loading")}</span>
          <div
            aria-hidden="true"
            className="rhythm-body mt-3 grid flex-1 gap-5 @[19rem]/rhythm:grid-cols-[auto_minmax(0,1fr)] @[19rem]/rhythm:gap-7"
          >
            <div className="flex flex-col">
              <div className="flex items-end gap-1.5">
                <span className="ms-skeleton h-9 w-9 rounded-xl" />
                <span className="ms-skeleton mb-1 h-3 w-4 rounded-full" />
                <span className="ms-skeleton ml-1.5 h-9 w-11 rounded-xl" />
                <span className="ms-skeleton mb-1 h-3 w-5 rounded-full" />
              </div>
              <span className="ms-skeleton mt-2.5 h-3 w-24 rounded-full" />
              <div className="rhythm-busiest mt-auto flex items-center gap-2.5 pt-4">
                <span className="ms-skeleton h-8 w-1 shrink-0 rounded-full" />
                <div className="space-y-1.5">
                  <span className="ms-skeleton block h-3 w-20 rounded-full" />
                  <span className="ms-skeleton block h-2.5 w-28 rounded-full" />
                </div>
              </div>
            </div>
            <div className="rhythm-bars grid grid-cols-7 items-stretch gap-1.5 self-stretch">
              {GHOST_BARS.map((pct, i) => (
                <div key={i} className="flex flex-col items-center justify-end gap-1.5">
                  <div className="rhythm-track flex max-h-52 min-h-24 w-full flex-1 items-end justify-center">
                    <span
                      className="ms-skeleton w-full max-w-4 rounded-full"
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className="ms-skeleton h-2.5 w-5 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : !ready ? (
        <div className="mt-3">
          <p className="text-[0.8125rem] leading-snug text-muted-foreground">
            {t("myspace.meeting.unavailable")}
          </p>
          <CalendarRetry cal={cal} />
        </div>
      ) : folded ? (
        <button
          type="button"
          onClick={() => setChartOpen(true)}
          aria-expanded="false"
          className="-mx-2 mt-1 flex min-h-11 items-center gap-3 rounded-xl px-2 text-start transition hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <span className="flex shrink-0 items-baseline gap-1 tabular-nums">
            <span className="text-[1.5rem] font-medium leading-none tracking-[-0.03em]">{h}</span>
            <span className="text-[0.75rem] text-muted-foreground">{t("myspace.rhythm.h")}</span>
            <span className="ml-1 text-[1.5rem] font-medium leading-none tracking-[-0.03em]">
              {m}
            </span>
            <span className="text-[0.75rem] text-muted-foreground">{t("myspace.rhythm.m")}</span>
          </span>
          {busiest && (
            <span className="min-w-0 truncate text-[0.75rem] text-muted-foreground">
              {t("myspace.rhythm.busiest")} · {weekdayFmt.format(busiest.date)}
            </span>
          )}
          <span className="sr-only">{t("myspace.rhythm.expand")}</span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            aria-hidden="true"
            className="ms-auto size-4 shrink-0 text-muted-foreground"
            strokeWidth={2}
          />
        </button>
      ) : (
        // ⚠️ Eşik 19rem (kartın İÇ genişliği): 1440px'te iki sütunluk kart
        // ~357px; daha büyük bir eşik onu alt alta düzene düşürür ve sayı ile
        // çubuklar arasında ~120px'lik boşluk açılır.
        <div className="rhythm-body mt-3 grid flex-1 gap-5 @[19rem]/rhythm:grid-cols-[auto_minmax(0,1fr)] @[19rem]/rhythm:gap-7">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1 tabular-nums">
              <span className="rhythm-num text-[2.25rem] font-medium leading-none tracking-[-0.03em]">
                {h}
              </span>
              <span className="text-[0.8125rem] text-muted-foreground">
                {t("myspace.rhythm.h")}
              </span>
              <span className="rhythm-num ml-1.5 text-[2.25rem] font-medium leading-none tracking-[-0.03em]">
                {m}
              </span>
              <span className="text-[0.8125rem] text-muted-foreground">
                {t("myspace.rhythm.m")}
              </span>
            </div>
            {/* Gelecek hafta HENÜZ geçmedi: "toplantıda geçti" yerine "planlandı". */}
            <p className="mt-1.5 text-[0.75rem] text-muted-foreground">
              {t(effWeek === "next" ? "myspace.rhythm.captionNext" : "myspace.rhythm.caption")}
            </p>
            <p className="mt-1 text-[0.75rem] tabular-nums text-muted-foreground">
              {countText(stats.count)}
              {stats.focusMinutes != null && (
                <span className="block">
                  {t("myspace.rhythm.focusFree", {
                    time: compactHours(stats.focusMinutes, t, locale),
                  })}
                </span>
              )}
              {stats.afterHours > 0 && (
                <span className="block text-amber-700 dark:text-amber-400">
                  {t("myspace.rhythm.afterHours", { n: stats.afterHours })}
                </span>
              )}
            </p>
            {busiest && (
              <div className="rhythm-busiest mt-auto flex items-center gap-2.5 pt-4">
                <span
                  aria-hidden="true"
                  className="h-8 w-1 shrink-0 rounded-full bg-gradient-to-b from-brand-from via-brand-via to-brand-to"
                />
                <div className="min-w-0">
                  <p className="text-[0.8125rem] font-medium leading-tight">
                    {t("myspace.rhythm.busiest")}
                  </p>
                  <p className="mt-0.5 text-[0.75rem] tabular-nums text-muted-foreground">
                    {weekdayLong.format(busiest.date)} · {formatHM(busiest.minutes, t)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ⚠️ Çubuklar kartın BOYUNU izler: ızgara satırı uzayınca sabit
              boylu bir iz kartın ortasında boşluk bırakırdı. İz satırın kalanını
              alır (en az 6rem, en çok
              13rem) — uzayan kart daha büyük bir grafik olur, boşluk değil. */}
          <div
            role="group"
            aria-label={t("myspace.rhythm.title")}
            className="rhythm-bars grid grid-cols-7 items-stretch gap-1.5 self-stretch"
          >
            {days.map((d, i) => {
              const pct = Math.round((d.minutes / peakAll) * 100)
              const isPeak = d.minutes > 0 && d.minutes === peakThis
              const isToday = effWeek === "current" && d.date.toDateString() === todayKey
              return (
                <RhythmBar
                  key={d.date.toISOString()}
                  index={i}
                  tip={tipFor(d, isToday)}
                  pct={pct}
                  minutes={d.minutes}
                  isPeak={isPeak}
                  isToday={isToday}
                  day={weekdayFmt.format(d.date)}
                  label={t("myspace.rhythm.dayAria", {
                    day: weekdayFmt.format(d.date),
                    minutes: d.minutes,
                  })}
                />
              )
            })}
          </div>
        </div>
      )}
      {dialog}
    </Card>
  )
}
