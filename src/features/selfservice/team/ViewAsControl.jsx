import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import ViewIcon from "@hugeicons/core-free-icons/ViewIcon"
import { UpnField } from "@/features/admin/UpnField"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { GHOST, ICON } from "../chips"

/**
 * TEST GÖRÜNÜMÜ anahtarı (yalnız uygulama yöneticisi): bir kişi seçilir, Ekibim o kişinin
 * gözünden kurulur (`?as=<upn>`). Açıkken üstte şerit: kimin gözünden bakıldığı ve Kapat.
 */
export function ViewAsControl({ asUpn, subject, onChange }) {
  const { t } = useLocale()
  const [draft, setDraft] = useState("")
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("selfService.team.as.open")}
          title={t("selfService.team.as.open")}
          className={cn(GHOST, ICON, asUpn && "bg-brand/[0.1] text-brand-ink")}
        >
          <HugeiconsIcon icon={ViewIcon} strokeWidth={1.9} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-2 p-3">
        <p className="text-[0.8125rem] font-semibold">{t("selfService.team.as.title")}</p>
        <p className="text-[0.75rem] leading-snug text-muted-foreground">
          {t("selfService.team.as.hint")}
        </p>
        <UpnField id="ss-team-as" value={draft} onChange={setDraft} />
        <div className="flex justify-end gap-2">
          {asUpn && (
            <button
              type="button"
              className={cn(GHOST, "px-3")}
              onClick={() => {
                onChange(null)
                setOpen(false)
              }}
            >
              {t("selfService.team.as.clear")}
            </button>
          )}
          <button
            type="button"
            disabled={!draft.includes("@")}
            className={cn(GHOST, "bg-brand/[0.1] px-3 text-brand-ink disabled:opacity-50")}
            onClick={() => {
              onChange(draft.trim())
              setOpen(false)
            }}
          >
            {t("selfService.team.as.show")}
          </button>
        </div>
      </PopoverContent>
      {asUpn && <span className="sr-only">{subject?.name ?? asUpn}</span>}
    </Popover>
  )
}

/** Test görünümü şeridi: kimin gözünden bakıldığı ve Kapat. */
export function ViewAsBanner({ asUpn, subject, onClear }) {
  const { t } = useLocale()
  if (!asUpn) return null
  return (
    <div
      role="status"
      className="mt-3 flex items-center gap-2 rounded-xl border border-brand/25 bg-brand/[0.07] px-3 py-2 text-[0.8125rem]"
    >
      <HugeiconsIcon
        icon={ViewIcon}
        aria-hidden="true"
        className="size-4 shrink-0 text-brand-ink"
        strokeWidth={1.9}
      />
      <span className="min-w-0 flex-1">
        {t("selfService.team.as.banner", { name: subject?.name ?? asUpn })}
      </span>
      <button
        type="button"
        onClick={onClear}
        aria-label={t("selfService.team.as.clear")}
        className="grid size-7 shrink-0 place-items-center rounded-full text-brand-ink hover:bg-brand/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" strokeWidth={2.2} />
      </button>
    </div>
  )
}
