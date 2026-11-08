import { HugeiconsIcon } from "@hugeicons/react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { OCCASION_ICON } from "./occasionIcons"
import { tabOf } from "../kinds"
import { leaveLabel, leaveLine, occasionLine } from "./teamText"

// Bilgilerim'deki izin ikonunun aynısı.
const LEAVE_ICON = tabOf("leave").icon

// Çubuğun içine tür adı ancak bu kadar gün sığar (dar sütunda yalnız ipucu).
const LABEL_DAYS = 4

// Gösterge çubuklarla aynı tarif: izin dolu marka, onaydaki izin kesik amber.
const LEGEND = [
  ["absence", "h-2.5 w-4 rounded-sm bg-brand/25 ring-1 ring-inset ring-brand/55"],
  ["pending", "h-2.5 w-4 rounded-sm border border-dashed border-amber-500 bg-amber-400/25"],
  ["working", "h-2.5 w-4 rounded-sm border border-dashed border-brand/50"],
  ["partial", "size-2.5 rounded-full bg-brand"],
]
// Bana bağlı yokken (ekip arkadaşı) yalnız izin ve onaydaki izin anlatılır.
const BASIC = 2

/**
 * Gösterge; bana bağlı yoksa yalnız "İzin" (ekip arkadaşının çalışılan ve saatlik kaydı gelmez).
 * `kinds`: pencerede işareti olan günler ("birthday", "anniversary") — yalnız onlar anlatılır.
 */
export function Legend({ id, full, kinds = [], className }) {
  const { t } = useLocale()
  const items = full ? LEGEND : LEGEND.slice(0, BASIC)
  return (
    <ul
      id={id}
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-muted-foreground",
        className,
      )}
    >
      {items.map(([key, swatch]) => (
        <li key={key} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className={swatch} />
          {t(`selfService.team.timeline.legend.${key}`)}
        </li>
      ))}
      {kinds.map((kind) => (
        <li key={kind} className="inline-flex items-center gap-1.5">
          <HugeiconsIcon
            icon={OCCASION_ICON[kind]}
            aria-hidden="true"
            className="size-4 text-brand-ink"
            strokeWidth={2}
          />
          {t(`selfService.team.soon.${kind}`)}
        </li>
      ))}
    </ul>
  )
}

/**
 * Çubuk ve işaretin ipucu: ilk parça kalın başlık ("Yıllık İzin"), kalanı altında ("12–16 Eki · 5 gün").
 * Tarayıcının `title`ı geç açılıyor ve tek satır; bu hemen açılır. Ekran okuyucu metni ayrı (tablo).
 */
function Tip({ line, icon, children }) {
  const [head, ...rest] = String(line).split(" · ")
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        className="flex-col items-start gap-0.5 rounded-lg px-3 py-2"
      >
        <span className="flex items-center gap-1.5 text-[0.75rem] font-semibold">
          {icon && (
            <HugeiconsIcon icon={icon} className="size-3.5" strokeWidth={2} aria-hidden="true" />
          )}
          {head}
        </span>
        {rest.length > 0 && (
          <span className="text-[0.6875rem] text-background/75">{rest.join(" · ")}</span>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

export function Bar({ segment, first, last, label = true, onOpen }) {
  const { t, locale } = useLocale()
  const { from, to, record, absence, partial } = segment
  const pending = record.statusKind === "pending"
  const title = leaveLine(record, t, locale)
  const style = { gridColumn: `${from + 1} / ${to + 2}`, gridRow: 1 }
  if (partial)
    return (
      <Tip line={title}>
        <span
          onClick={onOpen}
          style={style}
          className="size-2.5 cursor-pointer justify-self-center rounded-full bg-brand"
        />
      </Tip>
    )
  // Pencerenin dışına taşan izin kenarda düz biter: "devam ediyor".
  const cutStart = record.start < first
  const cutEnd = (record.end ?? record.start) > last
  return (
    <Tip line={title}>
      <span
        onClick={onOpen}
        style={style}
        className={cn(
          // Çubuk ortasında izin ikonu: ince bir şerit çizelgede gözden kaçıyordu; satır 40px, çubuk
          // 28px ve ikon 16px — küçükken anlaşılmıyordu.
          "mx-px flex h-7 min-w-0 cursor-pointer items-center justify-center gap-1 overflow-hidden rounded-md px-1 text-[0.6875rem] font-semibold",
          // Onaydaki izin kesik amber: henüz izin değil, talep.
          pending
            ? "border-[1.5px] border-dashed border-amber-500 bg-amber-400/25 text-amber-800 dark:text-amber-300"
            : absence
              ? "bg-brand/25 text-brand-ink ring-1 ring-inset ring-brand/55"
              : "border border-dashed border-brand/50 text-foreground/75",
          cutStart && "ms-0 rounded-s-none",
          cutEnd && "me-0 rounded-e-none",
        )}
      >
        {/* Çakışan kısa çubuğun simgesi uzun çubuğun etiketinin üstüne biniyordu: o da gizli (ipucu tam). */}
        {label && (
          <HugeiconsIcon
            icon={LEAVE_ICON}
            aria-hidden="true"
            className="size-4 shrink-0"
            strokeWidth={2}
          />
        )}
        {label && to - from + 1 >= LABEL_DAYS && (
          <span className="truncate">{leaveLabel(record, t)}</span>
        )}
      </span>
    </Tip>
  )
}

/**
 * Doğum günü / iş yıl dönümü işareti: günün sütununda rozet (24px, ikon 16px — küçükken
 * anlaşılmıyordu). 3 aylık pencerede (`dense`, gün sütunu ~10px) küçük kalır, komşu güne taşmasın.
 * O gün bir izin çubuğu varsa daha küçük ve çubuğun üst kenarında (`stacked`), çubuğu örtmez.
 */
export function Marker({ occasion, col, stacked, dense, onOpen }) {
  const small = dense || stacked
  const { t, locale } = useLocale()
  return (
    <Tip line={occasionLine(occasion, t, locale)} icon={OCCASION_ICON[occasion.kind]}>
      <span
        onClick={onOpen}
        style={{ gridColumn: col + 1, gridRow: 1 }}
        className={cn(
          "z-[1] grid cursor-pointer place-items-center justify-self-center rounded-full bg-card text-brand-ink shadow-sm ring-1 ring-brand/35",
          small ? "size-[1.125rem]" : "size-6",
          stacked ? "-mt-1 self-start" : "self-center",
        )}
      >
        <HugeiconsIcon
          icon={OCCASION_ICON[occasion.kind]}
          className={small ? "size-3" : "size-4"}
          strokeWidth={2}
        />
      </span>
    </Tip>
  )
}
