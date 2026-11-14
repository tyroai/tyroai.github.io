import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

/** Hafta seçici (büyük ve küçük kartta aynı): Radix `Select`, açılan listede üç hafta. */
export function WeekSelect({ value, onChange, weeks, className }) {
  const { t } = useLocale()
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={t("myspace.rhythm.weekAria")}
        className={cn(
          "rhythm-week gap-1 rounded-full border-border/70 bg-background/60 px-3 text-[0.75rem] font-medium text-muted-foreground shadow-none transition hover:border-foreground/20 hover:text-foreground data-[state=open]:border-foreground/25 data-[state=open]:text-foreground dark:bg-background/40 [@media(pointer:coarse)]:data-[size=default]:h-9",
          className,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="end"
        sideOffset={6}
        // Escape rıhtıma kaçmaz (sohbet rıhtımı pencerede Escape dinliyor).
        onEscapeKeyDown={(e) => e.stopPropagation()}
        className="min-w-[9.5rem]"
      >
        {weeks.map((w) => (
          <SelectItem key={w.id} value={w.id} className="min-h-8 rounded-lg pr-8 text-[0.8125rem]">
            {w.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
