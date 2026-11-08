import "@/lib/i18n/insight"
import { lazy, Suspense, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { CUE_ICONS } from "./insightCueIcons"
import { Eyebrow } from "@/components/common/SectionHeading"
import { useLocale } from "@/hooks/useLocale"
import { STATUS } from "@/lib/graph"
import { greetingKey } from "@/lib/greeting"
import { timeFormatter } from "@/lib/clockFormat"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { cn } from "@/lib/utils"
import { devInsightKind, devInsightScene } from "@/dev/insightSamples"
import { dayInsightText } from "./dayInsightText"
import { InsightTip } from "./InsightTip"
import { dayInsight } from "./lib/dayInsight"
import { useGreetingHeading } from "./useGreetingHeading"
import "./homeGreeting.css"

const OPTS_DATE = { weekday: "long", day: "numeric", month: "long" }
// İpucunun gövdesi (şerit, satırlar, eylem) tembel: Anasayfa'nın parçası büyümesin.
const loadBody = () => import("./insight/InsightBody")
const InsightBody = lazy(loadBody)

/**
 * Anasayfa'nın başı — yazıyla kurulan sakin bir karşılama: kaş (öteki sayfalardaki marka
 * noktalı küçük satır: "CANLI · 30 EKİM CUMA"), selamlama ("İyi akşamlar, Ömer"; kutlama
 * gününde "İyi ki doğdun, Ömer!") ve altında günün okuması (`lib/dayInsight`): neden → sonuç →
 * öneri; sayıyı yalnız nedeni anlatıyorsa söyler (sayım Günün brifinginin işi). Bağlaçlar
 * soluk, anahtar ifade koyu mürekkep; sondaki kısa öneri etiketi (yoksa küçük (i)) günün
 * resmini ve tek eylemi açar.
 * Takvim yüklenirken satırın yeri tutulur; söylenecek doğru bir şey yoksa satır yok.
 */
export function HomeGreeting({
  firstName,
  celebration,
  cal,
  focus,
  now,
  rangeStart,
  rangeEnd,
  className,
}) {
  const { t, locale } = useLocale()
  const heading = useGreetingHeading(greetingKey(new Date(now).getHours()), celebration)
  const ready = cal.status === STATUS.ready
  // Yapılacaklar yalnız Microsoft To Do'dan (not "To-Do'ndan" diyor).
  const tasks = focus.mode === "todo" && !focus.loading ? focus.tasks : null
  const events = cal.events
  // DEV: `?insight=<hikâye>` örnek sahnesi (`dev/insightSamples`).
  const devKind = import.meta.env.DEV ? devInsightKind() : null
  const scene = useMemo(
    () => (devKind ? devInsightScene(devKind) : { events, tasks, now, rangeStart, rangeEnd }),
    [devKind, events, tasks, now, rangeStart, rangeEnd],
  )
  const insight = useMemo(() => (ready ? dayInsight(scene) : null), [ready, scene])
  const text = useMemo(
    () => (insight ? dayInsightText(insight, { t, locale }) : null),
    [insight, t, locale],
  )
  // Takvim kancasının yükleme hâli `STATUS`ta yok (yalnız sonuçlar): brifingle aynı dize.
  const loading = cal.status === "loading"
  // Tarihin yanında saat (dakikada bir yürür, `now` sayfanın dakika saati): header'daki saat
  // kalktı, Anasayfa'da saat buradan okunur (ürün sahibi).
  const date = `${getDateTimeFormat(locale, OPTS_DATE).format(new Date(now))} · ${timeFormatter(locale).format(new Date(now))}`
  // Düzen her dilde LTR (`LocaleProvider`); Arapça satır kendi içinde sağdan sola dizilsin
  // (nokta, ad doğru uca) ama blok sola yaslı kalsın (CSS).
  const dir = locale === "ar" ? "rtl" : undefined
  const hello = t("insight.hello", { greeting: heading, name: "\u0000" }).split("\u0000")

  return (
    <header className={cn("home-greeting", className)}>
      {/* "Canlı" yalnız takvim Outlook'tan okunduysa: söylenen doğru olsun. O zaman nokta ve
          "CANLI" palet tonunda hafif bir kapsülde (canlı rozeti), tarih ve saat kaşın düz yazısında. */}
      {ready ? (
        <span
          lang={locale}
          className="inline-flex items-center gap-2 text-eyebrow uppercase text-muted-foreground"
        >
          <span className="home-greeting__live">
            <span aria-hidden="true" className="home-greeting__live-dot" />
            {t("insight.live")}
          </span>
          {date}
        </span>
      ) : (
        <Eyebrow>{date}</Eyebrow>
      )}
      <h2 className="home-greeting__title" dir={dir}>
        {/* Ad paletin mürekkebinde; şablon dile göre sıralar (ad ortada da olabilir). */}
        {firstName ? (
          <>
            {hello[0]}
            <span className="home-greeting__name">{firstName}</span>
            {hello[1]}
          </>
        ) : (
          heading
        )}
        <span className="home-greeting__bang">!</span>
      </h2>
      {text ? (
        <p className="home-greeting__line" dir={dir}>
          {text.parts.map((p, i) =>
            p.mark ? (
              <strong key={i} className="home-greeting__mark">
                {p.text}
              </strong>
            ) : (
              p.text
            ),
          )}
          <InsightTip
            title={t("insight.tip.title")}
            kicker={text.kicker}
            list={(close) => (
              <Suspense fallback={<div className="home-greeting__tip-wait" />}>
                <InsightBody
                  insight={insight}
                  events={scene.events}
                  tasks={scene.tasks}
                  now={scene.now}
                  onChanged={cal.refresh}
                  close={close}
                />
              </Suspense>
            )}
            side="bottom"
            align="start"
            valueLang={null}
          >
            {/* Öneri varsa sonda kısa etiketi (simge + 1–2 söz) kartı açar, (i) yok: ürün sahibi
                uzun öneri cümlesini istemedi, bilgisi kartta. Öneri yoksa (i). */}
            {text.cue ? (
              <button
                type="button"
                className="home-greeting__cue"
                onPointerEnter={loadBody}
                onFocus={loadBody}
              >
                <HugeiconsIcon
                  icon={CUE_ICONS[text.cue.key]}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                <span>{text.cue.label}</span>
              </button>
            ) : (
              <button
                type="button"
                className="home-greeting__why"
                aria-label={t("insight.why")}
                onPointerEnter={loadBody}
                onFocus={loadBody}
              >
                <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={1.6} aria-hidden="true" />
              </button>
            )}
          </InsightTip>
        </p>
      ) : (
        loading && (
          <div aria-hidden="true" className="home-greeting__ghost">
            <span />
          </div>
        )
      )}
    </header>
  )
}
