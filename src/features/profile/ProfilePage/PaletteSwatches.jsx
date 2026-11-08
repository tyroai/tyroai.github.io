import { HugeiconsIcon } from "@hugeicons/react"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { cn } from "@/lib/utils"
import { swatchStyle } from "./swatchStyle"

export function Swatches({ label, items, palette, setPalette, t, radio, offset }) {
  if (items.length === 0) return null
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2.5">
        {items.map((p, i) => {
          const name = t(p.labelKey, p.id)
          const selected = palette === p.id
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={selected}
              {...radio(p.id, offset + i)}
              aria-label={name}
              title={name}
              onClick={() => setPalette(p.id)}
              className={cn(
                "relative grid size-10 place-items-center rounded-full outline-none transition pointer-coarse:size-11",
                "ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring",
                selected ? "scale-110 ring-[2.5px] ring-brand" : "hover:scale-105",
              )}
            >
              <span
                style={swatchStyle(p)}
                className="size-8 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] pointer-coarse:size-9 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
              />
              {selected ? (
                <HugeiconsIcon
                  icon={Tick02Icon}
                  className="absolute size-4 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]"
                  strokeWidth={2.4}
                />
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
