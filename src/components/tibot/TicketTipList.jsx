import "@/lib/i18n/tibot"
import { useMemo, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { useTibotTickets } from "@/hooks/useTibotTickets"
import { tibotStats } from "@/lib/tibot/tibotStats"
import { cn } from "@/lib/utils"

/**
 * Ticket ipucundaki talepler (Günün özeti, TYRO brifingi, Karşılama; koyu yüzey). Öteki
 * ipuçlarının listesiyle aynı dil (`TipPreviewList`): numara · konu, ilk `limit` satır, "+n daha"
 * (basınca hepsi, uzunsa kayar). `kind`: "onMe" (bende bekleyen, gecikenler önce) ya da
 * "waiting" (beklediğim, benden yanıt bekleyenler önce). Satıra basınca talep penceresi
 * (`onOpen`). İpucu açılınca iner.
 */
export default function TicketTipList({ kind, onOpen, limit = 3 }) {
  const { t } = useLocale()
  const { data, status } = useTibotTickets(true)
  const [all, setAll] = useState(false)
  const stats = useMemo(() => tibotStats(data), [data])
  const items = kind === "waiting" ? stats.waiting.items : stats.onMe.items
  const bucket = kind === "waiting" ? "mine" : "assigned"
  if (status === "loading")
    return (
      <div aria-hidden="true" className="mt-2.5 space-y-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="block h-4 rounded-full bg-white/10" />
        ))}
      </div>
    )
  const hidden = items.length - limit
  const shown = hidden > 0 && !all ? items.slice(0, limit) : items
  return (
    <>
      <ul
        className={cn(
          "mt-2.5 flex flex-col text-[0.8125rem] leading-snug",
          all &&
            "max-h-[min(50vh,18rem)] overflow-y-auto overscroll-contain pe-1 [scrollbar-width:thin]",
        )}
      >
        {shown.map((row) => (
          <li
            key={row.requestId}
            className="group/tp relative -mx-2 flex items-baseline gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.07]"
          >
            <span className="w-[5.5rem] shrink-0 text-white/55 tabular-nums">#{row.requestId}</span>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => onOpen({ ...row, bucket })}
              className="min-w-0 flex-1 rounded-sm text-start font-medium decoration-white/40 underline-offset-[0.2em] outline-none [overflow-wrap:anywhere] after:absolute after:inset-0 after:rounded-lg after:content-[''] group-hover/tp:underline focus-visible:after:ring-2 focus-visible:after:ring-white/50"
            >
              {row.subject}
            </button>
          </li>
        ))}
      </ul>
      {hidden > 0 && !all && (
        <button
          type="button"
          onClick={() => setAll(true)}
          className="mt-1.5 self-start rounded-sm text-[0.75rem] font-medium text-white/70 underline decoration-white/25 underline-offset-[0.2em] outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/50 [@media(pointer:coarse)]:min-h-10"
        >
          {t("myspace.tip.more", { n: hidden })}
        </button>
      )}
    </>
  )
}
