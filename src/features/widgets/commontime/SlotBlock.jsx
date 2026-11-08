import { useLocale } from "@/hooks/useLocale"
import { DAYS, cityOfZone, composeUrl } from "@/lib/commonTime"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { FrameAction } from "../WidgetFrame"

const OPTS_TIME = { hour: "2-digit", minute: "2-digit" }
const OPTS_WD = { weekday: "long" }
const dayStart = (ms) => {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/**
 * İlk ortak boşluk: senin saatinle ("Yarın 16:30"), altında öbür şehirlerin saati (aynı şehir bir
 * kez) ve "Outlook'ta aç" — toplantı penceresi saat ve davetlilerle dolu açılır, gönderen sensin.
 * `me`: senin adresin — şehirlerden düşülür (cevabın sırasına güvenilmez).
 */
export function SlotBlock({ at, now, schedules, me, addresses, partial, overlap }) {
  const { t, locale } = useLocale()
  if (at == null)
    return (
      <p className="ct-slot text-[0.75rem] text-muted-foreground">
        {overlap ? t("widgets.commonTime.noSlot", { n: DAYS }) : t("widgets.commonTime.noOverlap")}
      </p>
    )
  const diff = Math.round((dayStart(at) - dayStart(now)) / 86_400_000)
  const day =
    diff === 0
      ? t("widgets.commonTime.today")
      : diff === 1
        ? t("widgets.commonTime.tomorrow")
        : getDateTimeFormat(locale, OPTS_WD).format(at)
  const cities = new Map()
  for (const s of schedules) {
    if (s.address === me) continue
    const city = cityOfZone(s.tz, locale)
    if (city && !cities.has(city))
      cities.set(city, getDateTimeFormat(locale, { ...OPTS_TIME, timeZone: s.tz }).format(at))
  }
  // İki satır: başlık + Outlook; saat (kalın) + öbür şehirler — dar kartta iki kişi satırına yer kalsın.
  return (
    <div className="ct-slot min-w-0">
      <p className="flex min-w-0 items-center justify-between gap-2">
        <span className="ct-slot-label truncate text-[0.6875rem] text-muted-foreground">
          {t("widgets.commonTime.slot")}
        </span>
        <FrameAction
          href={composeUrl(at, addresses)}
          target="_blank"
          rel="noopener noreferrer"
          className="-me-2.5 text-brand"
        >
          {t("widgets.commonTime.open")}
        </FrameAction>
      </p>
      <p className="ct-when text-[0.6875rem] text-muted-foreground">
        <span className="ct-day text-[0.9375rem] font-semibold text-foreground [&::first-letter]:uppercase">
          {day} {getDateTimeFormat(locale, OPTS_TIME).format(at)}
        </span>
        {cities.size > 0 && (
          <>
            <span className="ct-sep"> · </span>
            <span className="ct-cities">
              {[...cities].map(([city, time]) => `${city} ${time}`).join(" · ")}
            </span>
          </>
        )}
      </p>
      {partial && (
        <p className="truncate text-[0.6875rem] text-muted-foreground">
          {t("widgets.commonTime.partial")}
        </p>
      )}
    </div>
  )
}
