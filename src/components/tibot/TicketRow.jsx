import "@/lib/i18n/tibot"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { useLocale } from "@/hooks/useLocale"
import { formatRelative } from "@/lib/date"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { counterpart, isOverdue, statusKey, statusLabel, statusTone } from "@/lib/tibot/tibotModel"
import { cn } from "@/lib/utils"
import { TicketPeek } from "./TicketPeek"
import { OverdueBadge, TicketStatus } from "./TicketStatus"

const DAY = { weekday: "short", day: "numeric", month: "short" }

// Durum tonunun yazı rengi (satırın sade biçimi).
const INK = {
  success: "text-emerald-800 dark:text-emerald-300",
  warning: "text-amber-800 dark:text-amber-300",
  danger: "text-red-700 dark:text-red-300",
  info: "text-brand-ink",
  neutral: "text-foreground/70",
}

/**
 * Talep satırı (widget ve Self Servis sekmesi): numara ve konu, altında durum, karşı taraf ve son
 * güncelleme; hedefi geçmişse "Gecikti". Basınca ayrıntı (`TicketSheet`).
 */
export function TicketRow({ row, bucket, onOpen, active = false, dense = false }) {
  const { t, locale } = useLocale()
  const who = counterpart(row, bucket)
  const late = isOverdue(row)
  return (
    <li className={dense ? "-mx-2" : undefined}>
      <TicketPeek row={row} bucket={bucket} side={dense ? "right" : "top"}>
        <button
          type="button"
          onClick={() => onOpen(row)}
          aria-current={active || undefined}
          className={cn(
            "group flex w-full items-center gap-3 rounded-xl text-start outline-none transition hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-brand/40",
            dense ? "min-h-11 px-2 py-1" : "min-h-16 px-3 py-2.5",
            active && "bg-accent/60",
          )}
        >
          <span className="min-w-0 flex-1">
            {!dense && (
              // Listede satırın üstünde açılış günü (Self Servis kayıtlarındaki gibi).
              <span className="mb-0.5 block text-[0.6875rem] tabular-nums text-muted-foreground">
                {getDateTimeFormat(locale, DAY).format(new Date(row.createdAt))}
              </span>
            )}
            <span className="flex min-w-0 items-baseline gap-1.5">
              <span className="shrink-0 text-[0.6875rem] tabular-nums text-muted-foreground">
                #{row.requestId}
              </span>
              <span className="truncate text-[0.8125rem] font-medium leading-snug">
                {row.subject}
              </span>
            </span>
            {dense ? (
              // Kartta tek satır: durum renkli yazı, gecikme kırmızı, karşı taraf soluk.
              <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[0.6875rem]">
                <span className={cn("shrink-0 font-medium", INK[statusTone(statusKey(row))])}>
                  {statusLabel(t, statusKey(row), bucket === "mine")}
                </span>
                {late && (
                  <span className="shrink-0 font-medium text-red-700 dark:text-red-300">
                    · {t("tibot.overdue")}
                  </span>
                )}
                {who && <span className="min-w-0 truncate text-muted-foreground">· {who}</span>}
              </span>
            ) : (
              <span className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <TicketStatus row={row} mine={bucket === "mine"} />
                {late && <OverdueBadge />}
                <span className="min-w-0 truncate text-[0.6875rem] text-muted-foreground">
                  {[who, t("tibot.updated", { when: formatRelative(row.updatedAt, locale) })]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
            )}
          </span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            className="size-4 shrink-0 text-muted-foreground/60 transition group-hover:text-foreground rtl:rotate-180"
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>
      </TicketPeek>
    </li>
  )
}
