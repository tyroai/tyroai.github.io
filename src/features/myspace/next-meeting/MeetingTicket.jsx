import { HugeiconsIcon } from "@hugeicons/react"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import { useJoinUrl } from "@/hooks/useJoinUrl"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { teamsAppUrl } from "@/lib/teamsJoin"
import { cn } from "@/lib/utils"
import { OPTS_TIME } from "../cardFormats"
import { duration } from "../meetingUtils"
import { AttendeesRow } from "./AttendeesRow"
import { MeetingThumb } from "./MeetingThumb"
import { TicketActions } from "./TicketActions"

const OPTS_WD = { weekday: "short" }
const OPTS_DAY = { day: "numeric" }

/**
 * Sıradaki toplantının bir slaydı (bilet görünümü), her slaytta aynı iskelet:
 * bant (tarih kutucuğu · harita ya da rozet · geri sayım), konu ve hemen
 * altında saat · süre (basınca önizleme — `renderTrigger`), katılımcılar ve
 * dipte Katıl + Hazırlan (+ toplantıya 15 dk kala "Geç kalıyorum", `late`). Link listede yoksa davetin gövdesinden okunur
 * (`useJoinUrl`, yalnız görünen slayt).
 */
export function MeetingTicket({ event, live, late, active = true, countdown, renderTrigger }) {
  const { t, locale } = useLocale()
  const time = getDateTimeFormat(locale, OPTS_TIME)
  const subject = event.subject || t("calendar.noSubject")
  const join = useJoinUrl(event, active)
  const kind = join.pending
    ? "pending"
    : join.url
      ? teamsAppUrl(join.url)
        ? "teams"
        : "video"
      : "none"
  // Konu ve saat tek grup. `reserve`: görünmez kopya iki satırlık konunun
  // yerini tutar — kısa konuda boşluk saatin ALTINDA kalır, katılımcılar ve
  // düğmeler her slaytta aynı yerde.
  const info = (reserve) => (
    <>
      <span
        lang="tr"
        data-private=""
        title={reserve ? undefined : subject}
        className={cn(
          "line-clamp-2 text-[0.9375rem] font-semibold leading-[1.25] tracking-[-0.01em] text-foreground",
          reserve && "min-h-[2.5em]",
        )}
      >
        {subject}
      </span>
      <span className="mt-0.5 flex max-w-full items-center gap-1.5 whitespace-nowrap text-[0.75rem] tabular-nums text-muted-foreground">
        <HugeiconsIcon icon={Clock01Icon} className="size-3.5 shrink-0" strokeWidth={1.8} />
        <span className="truncate">
          {time.format(event.start)} – {time.format(event.end)} · {duration(event, t)}
        </span>
      </span>
    </>
  )

  return (
    <>
      <MeetingThumb
        event={event}
        kind={kind}
        countdown={countdown}
        pinLabel={t("myspace.meeting.location")}
        mapsLabel={t("myspace.meeting.directions")}
        tile={
          // Gün ve tarih tek satırda ("PZT 2"), sağ üstteki kalan süre hapıyla aynı kapsül.
          <span
            aria-hidden="true"
            className="relative z-10 flex shrink-0 items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[0.6875rem] font-semibold text-foreground/80 shadow-sm backdrop-blur-md dark:bg-black/45"
          >
            <span className="font-bold uppercase tracking-wide text-brand">
              {getDateTimeFormat(locale, OPTS_WD).format(event.start)}
            </span>
            <span className="tabular-nums text-foreground">
              {getDateTimeFormat(locale, OPTS_DAY).format(event.start)}
            </span>
          </span>
        }
      />
      <div className="grid">
        <div aria-hidden="true" className="invisible mt-2 flex flex-col py-0.5 [grid-area:1/1]">
          {info(true)}
        </div>
        <div className="flex min-w-0 flex-col self-start [grid-area:1/1]">
          {renderTrigger(info(false))}
        </div>
      </div>
      <AttendeesRow event={event} active={active} />
      <TicketActions event={event} join={join} live={live} late={late} />
    </>
  )
}
