// Başlıktaki veri seti seçici (demo): ana set + altı sektör. Seçim sayfayı o sette baştan açar;
// ad, unvan ve şirket hiçbir sette değişmez.
import { HugeiconsIcon } from "@hugeicons/react"
import DatabaseIcon from "@hugeicons/core-free-icons/DatabaseIcon"
import Layers01Icon from "@hugeicons/core-free-icons/Layers01Icon"
import WashingMachineIcon from "@hugeicons/core-free-icons/WashingMachineIcon"
import CpuIcon from "@hugeicons/core-free-icons/CpuIcon"
import WheatIcon from "@hugeicons/core-free-icons/WheatIcon"
import Car01Icon from "@hugeicons/core-free-icons/Car01Icon"
import Restaurant01Icon from "@hugeicons/core-free-icons/Restaurant01Icon"
import Stethoscope02Icon from "@hugeicons/core-free-icons/Stethoscope02Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { DATASETS, switchDataset } from "../datasets/registry.js"

const ICONS = {
  layers: Layers01Icon,
  washing: WashingMachineIcon,
  cpu: CpuIcon,
  wheat: WheatIcon,
  car: Car01Icon,
  food: Restaurant01Icon,
  health: Stethoscope02Icon,
}

const TEXT = {
  tr: {
    button: "Veri setini değiştir",
    title: "Veri seti",
    note: "Ad ve unvan her sette aynı kalır. Tüm veriler kurgusaldır; gerçek bir sisteme bağlı değildir.",
  },
  en: {
    button: "Switch dataset",
    title: "Dataset",
    note: "Name and title stay the same in every set. All data is fictional and not connected to any real system.",
  },
}

export function DatasetSwitcher() {
  const { locale } = useLocale()
  const lang = locale === "tr" ? "tr" : "en"
  const text = TEXT[lang]
  const current = window.__DEMO__?.id ?? "ana"
  const active = DATASETS.find((d) => d.id === current) ?? DATASETS[0]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`${text.button}: ${active.label[lang]}`}
          title={`${text.button}: ${active.label[lang]}`}
          data-tour="demo-dataset"
          className="size-9 shrink-0 rounded-xl [&_svg]:!size-5 text-muted-foreground hover:text-foreground relative pointer-coarse:after:absolute pointer-coarse:after:-inset-1"
        >
          <HugeiconsIcon icon={DatabaseIcon} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-0.5 p-1.5">
        <div className="px-2 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {text.title}
        </div>
        {DATASETS.map((d) => {
          const selected = d.id === current
          return (
            <button
              key={d.id}
              type="button"
              aria-current={selected ? "true" : undefined}
              onClick={() => !selected && switchDataset(d.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent",
                selected && "bg-accent/60",
              )}
            >
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                <HugeiconsIcon icon={ICONS[d.icon] ?? Layers01Icon} className="size-[1.125rem]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium leading-tight">{d.label[lang]}</span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{d.desc[lang]}</span>
              </span>
              {selected && <HugeiconsIcon icon={Tick02Icon} className="mt-1 size-4 shrink-0 text-brand" />}
            </button>
          )
        })}
        <p className="px-2 pb-1 pt-2 text-[11px] leading-snug text-muted-foreground">{text.note}</p>
      </PopoverContent>
    </Popover>
  )
}
