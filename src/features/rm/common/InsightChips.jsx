import { useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// Ton: nötr bilgi, marka (yaklaşan iş), tamam, dikkat, risk. Zemin hafif, ikon kutusu daha koyu.
const TONE = {
  neutral: {
    chip: "border-border/70 bg-card text-foreground/80",
    hover: "hover:border-foreground/25 hover:text-foreground",
    dot: "bg-foreground/[0.06] text-foreground/70 dark:bg-white/[0.08]",
  },
  brand: {
    chip: "border-brand/20 bg-brand/[0.05] text-foreground/85",
    hover: "hover:border-brand/40 hover:text-foreground",
    dot: "bg-brand/[0.12] text-brand",
  },
  ok: {
    chip: "border-success/25 bg-success/[0.06] text-success-ink",
    hover: "hover:border-success/45",
    dot: "bg-success/15 text-success-ink",
  },
  warn: {
    chip: "border-warning/35 bg-warning/[0.08] text-warning-ink",
    hover: "hover:border-warning/60",
    dot: "bg-warning/20 text-warning-ink",
  },
  danger: {
    chip: "border-danger/25 bg-danger/[0.06] text-danger-ink",
    hover: "hover:border-danger/50",
    dot: "bg-danger/15 text-danger-ink",
  },
}

// Sayı yer tutucuları kalın: göz önce rakamı yakalasın.
const BOLD = new Set(["n", "pct"])

/** Şablonu doldurur (`{ad}`); sayılar kalın. Dil sırası şablonda kalır. */
function fill(template, vars) {
  return String(template)
    .split(/(\{\w+\})/g)
    .map((part, i) => {
      const m = /^\{(\w+)\}$/.exec(part)
      if (!m || vars?.[m[1]] == null) return part
      const v = String(vars[m[1]])
      return BOLD.has(m[1]) ? (
        <b key={i} className="font-semibold tabular-nums">
          {v}
        </b>
      ) : (
        v
      )
    })
}

const plain = (template, vars) =>
  String(template).replace(/\{(\w+)\}/g, (m, k) => (vars?.[k] == null ? m : String(vars[k])))

function Chip({ icon, text, vars, tone = "neutral", tip, onClick }) {
  const [open, setOpen] = useState(false)
  // Dokunuşta odak balonu tıktan önce açar: aç/kapa dokunuştan önceki duruma göre (InfoTip gibi).
  const was = useRef(false)
  const t = TONE[tone] ?? TONE.neutral
  const act = typeof onClick === "function"
  const body = (
    <>
      <span
        aria-hidden="true"
        className={cn("grid size-6 shrink-0 place-items-center rounded-full", t.dot)}
      >
        <HugeiconsIcon icon={icon} className="size-3.5" strokeWidth={2} />
      </span>
      <span className="min-w-0 truncate">{fill(text, vars)}</span>
      {act ? (
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          aria-hidden="true"
          className="-me-1 size-3.5 shrink-0 opacity-45 transition-[opacity,translate] group-hover:translate-x-0.5 group-hover:opacity-90 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
          strokeWidth={2}
        />
      ) : null}
    </>
  )
  const base =
    "group inline-flex h-8 max-w-full items-center gap-2 rounded-full border ps-1 pe-3 text-[0.8125rem] leading-none transition-[border-color,color,box-shadow,translate]"
  if (!act && !tip) return <span className={cn(base, t.chip)}>{body}</span>
  const button = (
    <button
      type="button"
      onPointerDown={() => (was.current = open)}
      onClick={(e) => {
        if (act) return onClick()
        e.preventDefault()
        setOpen(e.nativeEvent.pointerType === "touch" ? !was.current : true)
      }}
      className={cn(
        base,
        t.chip,
        t.hover,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11",
        act ? "hover:-translate-y-px hover:shadow-sm" : "cursor-help",
      )}
    >
      {body}
    </button>
  )
  if (!tip) return button
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={8}
        className="max-w-[18rem] flex-col items-start gap-0 px-3 py-2.5 text-start"
      >
        <p className="text-[0.8125rem] font-semibold text-background">{plain(text, vars)}</p>
        <p className="mt-1 text-xs leading-relaxed text-background/80">{tip}</p>
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * Sayfa başlığının altındaki göstergeler: tonlu, ikonlu çipler. Açıklaması olan çip üstüne
 * gelince (dokunmatikte dokununca) ne demek olduğunu söyler; eylemi olan çip filtreyi açar.
 * Öğe: { key, icon, text (ham şablon, `rt(anahtar)`), vars?, tone?, tip?, onClick? }. `scroll`:
 * telefonda tek satır, yana kayan dizi.
 */
export function InsightChips({ items, label, scroll = false, className }) {
  const list = (items || []).filter(Boolean)
  if (!list.length) return null
  return (
    <ul
      aria-label={label}
      // Yana kayan dizi klavyeyle de kaydırılabilsin (içinde düğme olmayabilir).
      tabIndex={scroll ? 0 : undefined}
      className={cn(
        "flex gap-2",
        // Telefonda tek satır, yana kayar: gövde alanı göstergelere gitmesin.
        scroll ? "-mx-4 overflow-x-auto px-4 no-scrollbar" : "flex-wrap",
        className,
      )}
    >
      {list.map(({ key, ...it }) => (
        <li key={key} className={scroll ? "shrink-0" : "min-w-0 max-w-full"}>
          <Chip {...it} />
        </li>
      ))}
    </ul>
  )
}
