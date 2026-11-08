import { HugeiconsIcon } from "@hugeicons/react"
import ShieldKeyIcon from "@hugeicons/core-free-icons/ShieldKeyIcon"
import { Checkbox } from "@/components/ui/checkbox"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

/** Yeni yetki kutusunda "Yetkileri yönetebilsin" seçeneği (işaretlenince uygulama seçimi gereksizleşir). */
export function AdminToggle({ checked, onChange, disabled }) {
  const { t } = useLocale()
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 transition-colors",
        checked ? "border-brand/30 bg-brand-soft/40" : "border-border hover:bg-foreground/[0.03]",
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        disabled={disabled}
        className="mt-0.5"
      />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-[0.8125rem] font-medium">
          <HugeiconsIcon
            icon={ShieldKeyIcon}
            className={cn("size-3.5", checked ? "text-brand" : "text-muted-foreground")}
            strokeWidth={1.9}
          />
          {t("authz.new.isAdmin")}
        </span>
        <span className="mt-0.5 block text-[0.6875rem] leading-snug text-muted-foreground">
          {t("authz.new.isAdmin.hint")}
        </span>
      </span>
    </label>
  )
}
