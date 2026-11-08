import { useEffect, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import { BottomSheet } from "@/components/common/BottomSheet"
import { PageDockPortal } from "@/components/layout/PageDock"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { useRm } from "../shell/RmContext"

const DOCK_QUERY = "(min-width: 1180px)"

function Head({ title, sub, badges, lead, onClose, Title = "h2" }) {
  const { rt } = useRmText()
  return (
    <div className="flex items-start gap-3.5 border-b border-border/60 px-4 py-4 @[30rem]/detail:px-5">
      {lead ? <div className="shrink-0 pt-0.5">{lead}</div> : null}
      <div className="min-w-0 flex-1">
        {badges ? <div className="mb-1.5 flex flex-wrap items-center gap-1.5">{badges}</div> : null}
        <Title className="text-lg font-semibold leading-tight tracking-tight [overflow-wrap:anywhere]">
          {title}
        </Title>
        {sub ? <p className="mt-0.5 text-sm text-muted-foreground">{sub}</p> : null}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={rt("rm.action.close")}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
        </button>
      )}
    </div>
  )
}

/**
 * Ayrıntı çerçevesi (Güvenlik'teki gibi): geniş pencerede kabuğun kenar panelinde (liste
 * tıklanabilir kalır), dar masaüstünde sağdan yan pencere, telefonda alttan çekmece.
 */
export function RmDetailFrame({ open, id, title, sub, badges, lead, label, onClose, children }) {
  const { phone } = useRm()
  const dockable = useMediaQuery(DOCK_QUERY)
  const mode = phone ? "phone" : dockable ? "dock" : "sheet"
  const paneRef = useRef(null)
  const stopEscape = (e) => e.stopPropagation()
  useEffect(() => {
    if (mode === "dock" && open && id) paneRef.current?.focus({ preventScroll: true })
  }, [mode, open, id])

  if (mode === "dock") {
    return (
      <PageDockPortal open={open} onClose={onClose} label={label}>
        {open && (
          <div
            ref={paneRef}
            tabIndex={-1}
            // Escape paneli kapatır; panel içinden açılan liste (portal) kendi Escape'ini alır.
            onKeyDown={(e) => {
              if (e.key !== "Escape" || e.defaultPrevented) return
              if (!paneRef.current?.contains(e.target)) return
              e.stopPropagation()
              onClose()
            }}
            className="@container/detail flex h-full min-h-0 flex-col outline-none"
          >
            <Head title={title} sub={sub} badges={badges} lead={lead} onClose={onClose} />
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          </div>
        )}
      </PageDockPortal>
    )
  }
  if (mode === "phone") {
    return (
      <BottomSheet
        open={open}
        onOpenChange={(o) => !o && onClose()}
        title={typeof title === "string" ? title : label}
        description={typeof sub === "string" ? sub : undefined}
        closeOnBack
        onEscapeKeyDown={stopEscape}
        className="h-[92dvh]"
      >
        {open && <div className="@container/detail -mx-4">{children}</div>}
      </BottomSheet>
    )
  }
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        onEscapeKeyDown={stopEscape}
        className="@container/detail flex w-full flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[30rem]"
      >
        {open && (
          <>
            <SheetTitle className="sr-only">{label}</SheetTitle>
            <SheetDescription className="sr-only">
              {typeof sub === "string" ? sub : label}
            </SheetDescription>
            <Head title={title} sub={sub} badges={badges} lead={lead} Title="div" />
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

/** Panel içi bölüm: başlık (istenirse sayı ve sağda not) + içerik; bölümler ince çizgiyle ayrılır. */
export function DetailSection({ title, children, aside }) {
  return (
    <section className="border-b border-border/50 px-4 py-5 last:border-0 @[30rem]/detail:px-5">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-[0.8125rem] font-semibold tracking-[-0.005em] text-foreground">
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

const STAT_TONE = {
  danger: "text-danger-ink",
  warn: "text-warning-ink",
  ok: "text-success-ink",
}

/** Panelin özeti: başın altında yan yana kısa sayılar (doluluk, saat, boş gün…). */
export function PanelStats({ items }) {
  const list = items.filter(Boolean)
  return (
    <dl
      className="grid gap-2 border-b border-border/50 px-4 py-4 @[30rem]/detail:px-5"
      style={{ gridTemplateColumns: `repeat(${list.length}, minmax(0, 1fr))` }}
    >
      {list.map((it) => (
        <div
          key={it.key}
          className="min-w-0 rounded-xl bg-foreground/[0.035] px-3 py-2.5 dark:bg-white/[0.05]"
        >
          <dt className="truncate text-[0.6875rem] font-medium text-foreground/65">{it.label}</dt>
          <dd
            className={cn(
              "mt-0.5 truncate text-lg font-semibold leading-tight tabular-nums tracking-[-0.01em]",
              STAT_TONE[it.tone],
            )}
          >
            {it.value}
          </dd>
          {it.sub ? (
            <dd className="mt-0.5 truncate text-[0.6875rem] text-foreground/60">{it.sub}</dd>
          ) : null}
        </div>
      ))}
    </dl>
  )
}
