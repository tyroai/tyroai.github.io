import { useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import AiChat02Icon from "@hugeicons/core-free-icons/AiChat02Icon"
import Location01Icon from "@hugeicons/core-free-icons/Location01Icon"
import Video01Icon from "@hugeicons/core-free-icons/Video01Icon"
import { JoinButton } from "@/components/common/JoinButton"
import { LateMenu } from "@/components/common/late/LateMenu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useFits } from "@/hooks/useFits"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { useOneOnOnePrep } from "@/hooks/useOneOnOnePrep"
import { prepareMeeting } from "../meetingUtils"
import { physicalPlace } from "./meetingPlace"

const BTN =
  "inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[0.8125rem] font-semibold"
const RING =
  "transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
const PRIMARY = cn(BTN, RING, "min-w-0 flex-1 bg-brand-fill-deep text-brand-on-brand shadow-sm")
const PREP_TONE = "border border-brand/25 bg-brand/[0.06] text-brand hover:bg-brand/10"
// Yalnız ikon: görünüşte 32px, dokunmatikte basılan alan satır boyunca genişler.
// İkincil eylem: ikon + "Özet" etiketi (yalnız ikon ne yaptığını söylemiyordu).
const PREP_BTN = cn(
  BTN,
  RING,
  PREP_TONE,
  "relative shrink-0 gap-1.5 after:absolute after:-inset-1.5 pointer-coarse:after:content-['']",
)
// Geç kalıyorum: yalnız ikon, Hazırlan'ın tonunda (adı ipucunda ve düğmenin adında).
const LATE_BTN = cn(PREP_BTN, "late-card w-8 px-0")
// Ölçü kopyası: görünmez, tıklanmaz, yer kaplamaz; doğal genişliği ölçülür.
const GHOST = "pointer-events-none invisible absolute start-0 top-0 flex w-max gap-1.5"

/**
 * Biletin eylemleri — birincil düğme ve yanında Hazırlan:
 * - Çevrimiçi toplantı: **Katıl** (link aranırken bekler).
 * - Linki olmayan ama yeri olan (yüz yüze) toplantı: **Yol tarifi** — Google
 *   Haritalar'da o yere yol tarifi. Soluk, tıklanmayan bir Katıl kafa
 *   karıştırıyordu: pasif düğme gösterilmez.
 * - İkisi de yoksa birincil düğme yok; Hazırlan satırı etiketiyle alır.
 * - Hazırlan yalnız AI sohbet ikonu; ne yaptığı üstüne gelince ipucunda ve
 *   düğmenin adında ("TYRO ile Hazırlan").
 * - Toplantıya 15 dk kala (`late`, `lib/runningLate`) yanında "Geç kalıyorum" — yalnız ikon; çok
 *   dar kartta yok (`late.css`).
 * Dar kartta birincil düğmenin ikonu düşer, etiketi kesilmez (`useFits`).
 */
export function TicketActions({ event, join, live, late = false }) {
  const { t } = useLocale()
  const row = useRef(null)
  const full = useRef(null)
  const fitsFull = useFits(row, full)
  const place = join.url || join.pending ? null : physicalPlace(event)
  const primary = join.url || join.pending ? "join" : place ? "place" : null
  const icon = (
    <HugeiconsIcon
      icon={primary === "place" ? Location01Icon : Video01Icon}
      className="size-4 shrink-0"
      strokeWidth={2}
    />
  )
  const label = t(primary === "place" ? "myspace.meeting.directions" : "calendar.join")
  const prepIcon = (
    <HugeiconsIcon icon={AiChat02Icon} className="size-4 shrink-0" strokeWidth={1.8} />
  )
  // Doğrudan bağlınla 1:1'de bağlam toplanırken (birkaç saniye) düğme meşgul.
  const prep = useOneOnOnePrep(prepareMeeting)
  const prepare = () => prep.run(event)

  if (!primary)
    return (
      <div className="mt-2 flex gap-1.5">
        <button
          type="button"
          onClick={prepare}
          disabled={prep.busy}
          aria-busy={prep.busy}
          className={cn(BTN, RING, PREP_TONE, "flex-1")}
        >
          {prepIcon}
          {t("calendar.prepareShort")}
        </button>
        {late && <LateMenu event={event} compact className={LATE_BTN} />}
      </div>
    )

  return (
    <div ref={row} className="relative mt-2 flex items-center gap-1.5">
      <div ref={full} aria-hidden="true" className={GHOST}>
        <span className={BTN}>
          {icon}
          {label}
        </span>
        <span className={cn(BTN, "gap-1.5")}>
          {prepIcon}
          {t("calendar.summary")}
        </span>
        {late && <span className={LATE_BTN} />}
      </div>
      {primary === "join" ? (
        <JoinButton
          url={join.url}
          pending={join.pending}
          className={PRIMARY}
          activeClassName={cn("hover:brightness-110", live && "shadow-md shadow-brand/30")}
        >
          {fitsFull && icon}
          <span className="truncate">{label}</span>
        </JoinButton>
      ) : (
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label}: ${place}`}
          title={place}
          className={cn(PRIMARY, "hover:brightness-110")}
        >
          {fitsFull && icon}
          <span className="truncate">{label}</span>
        </a>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={prepare}
            disabled={prep.busy}
            aria-busy={prep.busy}
            className={PREP_BTN}
          >
            {prepIcon}
            {t("calendar.summary")}
          </button>
        </TooltipTrigger>
        <TooltipContent>{t("calendar.prepare")}</TooltipContent>
      </Tooltip>
      {late && <LateMenu event={event} compact className={LATE_BTN} />}
    </div>
  )
}
