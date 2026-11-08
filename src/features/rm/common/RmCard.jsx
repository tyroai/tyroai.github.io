import { useContext, useId } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { InfoTip } from "@/components/common/InfoTip"
import { IconTile } from "@/features/selfservice/request/field/IconTile"
import { cn } from "@/lib/utils"
import { CardLevel } from "./cardLevel"
import { ICON_INK } from "./iconInk"

/**
 * tyroRM kartı: tonlu ikon kutusu (`icon`, `tone`), başlık, tek satır alt bilgi, istenirse "i"
 * balonu (`info`); sağda sessiz bağlantı hapı (`action`). Sayfalar aynı kabuğu kullanır.
 * `bare`: kutu yok, ikon başlığın önünde yalnız tonun renginde (Genel Bakış).
 */
export function RmCard({
  title,
  sub,
  icon,
  tone = "brand",
  bare = false,
  info,
  action,
  children,
  className,
}) {
  const id = useId()
  const H = `h${useContext(CardLevel)}`
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "flex min-w-0 flex-col rounded-3xl border border-border/60 bg-card p-4 shadow-xs sm:p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        {icon && !bare && <IconTile icon={icon} tone={tone} />}
        <div className="min-w-0 flex-1">
          <div className="flex min-h-5 items-center gap-1">
            {icon && bare && (
              <HugeiconsIcon
                icon={icon}
                aria-hidden="true"
                strokeWidth={1.8}
                className={cn("me-1 size-[1.125rem] shrink-0", ICON_INK[tone] ?? ICON_INK.brand)}
              />
            )}
            <H id={id} className="text-[0.9375rem] font-semibold leading-snug tracking-[-0.01em]">
              {title}
            </H>
            {/* Dokunmatikte görünmez geniş hedef: "i" küçük kalır, parmak ıskalamaz. */}
            {info && (
              <InfoTip
                text={info}
                label={title}
                className="relative after:absolute after:-inset-3 after:content-['']"
              />
            )}
          </div>
          {sub && <p className="mt-0.5 truncate text-xs text-foreground/60">{sub}</p>}
        </div>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="group -me-1.5 inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-foreground/65 transition-colors hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"
          >
            {action.label}
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              aria-hidden="true"
              className="size-3.5 opacity-60 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
              strokeWidth={2}
            />
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

/** Kart içi boş hâl: tek cümle, sakin. */
export function CardEmpty({ children }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>
}
