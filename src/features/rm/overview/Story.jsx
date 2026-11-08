import { useMemo, useRef, useState } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { overviewStory } from "@/features/rm/lib/overviewStory"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { useRm } from "../shell/RmContext"

// Değerin rengi sayfanın durum tonları; altı aynı renkte kesik çizgi.
const INK = {
  danger: "text-danger-ink",
  warn: "text-warning-ink",
  ok: "text-success-ink",
  brand: "text-brand",
}
// İpucu ters zeminde: durum etiketi renkli nokta + metin (iki temada da okunur).
const DOT = { danger: "bg-danger", warn: "bg-warning", ok: "bg-success", brand: "bg-brand" }

function TipCard({ tip }) {
  return (
    <div className="grid w-[17.5rem] gap-2 text-start">
      <div>
        <p className="text-[0.8125rem] font-semibold text-background">{tip.title}</p>
        {tip.accent && (
          <p className="mt-0.5 flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-background/80">
            <span
              aria-hidden="true"
              className={cn("size-1.5 rounded-full", DOT[tip.accent.tone])}
            />
            {tip.accent.text}
          </p>
        )}
      </div>
      {tip.rows.length > 0 && (
        <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 text-xs">
          {tip.rows.map(([k, v], i) => (
            <div key={i} className="contents">
              <dt className="truncate text-background/65">{k}</dt>
              <dd className="text-end font-semibold tabular-nums text-background">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {tip.note && <p className="text-xs leading-relaxed text-background/75">{tip.note}</p>}
    </div>
  )
}

/** Anlatıdaki işaretli değer: üstüne gelince (dokunmatikte dokununca) ayrıntı; basınca panel. */
function Mark({ m, onPick }) {
  const [open, setOpen] = useState(false)
  // Dokunuşta odak balonu tıktan önce açar: aç/kapa dokunuştan önceki duruma göre.
  const was = useRef(false)
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onPointerDown={() => (was.current = open)}
          onClick={(e) => {
            if (e.nativeEvent.pointerType === "touch") setOpen(!was.current)
            else onPick(m.pick)
          }}
          className={cn(
            "relative inline rounded-sm font-semibold tabular-nums underline decoration-dotted decoration-[1.5px] underline-offset-[5px] [text-decoration-color:color-mix(in_oklab,currentColor_55%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:after:absolute pointer-coarse:after:-inset-y-2.5 pointer-coarse:after:inset-x-0",
            INK[m.tone] ?? INK.brand,
          )}
        >
          {m.text}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8} className="rounded-xl px-4 py-3">
        <TipCard tip={m.tip} />
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * Genel Bakış'ın durum anlatısı (selamın altında): doluluk, aşım ve en yüklü ekip, boş kapasite,
 * başlayan / kişisiz / riskli projeler. Değerler renkli ve kesik çizgili; ayrıntı ipucunda.
 */
export function OverviewStory({ ov, onMetric, onTeam }) {
  const { rt, locale } = useRmText()
  const { people } = useRm()
  const pieces = useMemo(
    () => overviewStory(ov, { rt, locale, nameOf: (n) => fullName(people, n) }),
    [ov, rt, locale, people],
  )
  const onPick = (p) => (p?.team ? onTeam(p.team) : p?.metric && onMetric(p.metric))
  return (
    <p
      dir="auto"
      className="-mt-1 max-w-[64rem] text-[0.9375rem] leading-[1.8] text-foreground/75 sm:text-base"
    >
      {pieces.map((p, i) => (p.tone ? <Mark key={i} m={p} onPick={onPick} /> : p.text))}
    </p>
  )
}
