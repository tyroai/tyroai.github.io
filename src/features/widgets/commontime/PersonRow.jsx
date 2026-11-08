import { PersonAvatar } from "@/components/common/PersonAvatar"
import { useLocale } from "@/hooks/useLocale"
import { cityOfZone, personNow } from "@/lib/commonTime"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { cn } from "@/lib/utils"

// Durum noktası: müsait yeşil, toplantıda sarı, gece mavi, diğerleri soluk.
const DOT = {
  free: "bg-success",
  busy: "bg-warning",
  night: "bg-sky-400",
  off: "bg-muted-foreground/40",
  after: "bg-muted-foreground/40",
  unknown: "bg-muted-foreground/30",
}

/**
 * Kişinin satırı: ad, şehri ve yerel saati, şimdiki durumu ("toplantıda · 13:00 itibarıyla boş" —
 * saat KİŞİNİN saatiyle, yanındaki yerel saat gibi). Takvimi henüz gelmediyse yalnız ad.
 */
export function PersonRow({ person, sched, now, start, photo }) {
  const { t, locale } = useLocale()
  const s = sched ? personNow(sched, now, start) : null
  const tz = sched?.tz ?? null
  const time = getDateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    ...(tz ? { timeZone: tz } : {}),
  })
  const city = cityOfZone(tz, locale)
  const status = !s
    ? ""
    : s.state === "busy" && s.until
      ? t("widgets.commonTime.state.busyUntil", { time: time.format(s.until) })
      : t(`widgets.commonTime.state.${s.state}`)
  const name = person.name || person.address
  return (
    <li className="flex min-h-9 items-center gap-2.5">
      <PersonAvatar name={name} photo={photo} className="size-7 text-[0.625rem]" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.8125rem] font-medium leading-snug">{name}</span>
        <span className="flex min-w-0 items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
          {s && (
            <span
              aria-hidden="true"
              className={cn("size-1.5 shrink-0 rounded-full", DOT[s.state])}
            />
          )}
          <span className="truncate">
            {[city && tz ? `${city} ${time.format(now)}` : null, status]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
      </span>
    </li>
  )
}
