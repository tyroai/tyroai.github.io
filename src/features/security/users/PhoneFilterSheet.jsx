import { useMemo, useState } from "react"
import { BottomSheet } from "@/components/common/BottomSheet"
import { SegmentedControl } from "@/components/common/SegmentedControl"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/hooks/useLocale"
import { filterPeople } from "@/features/security/lib/authzPeople"
import { AppOptions } from "./AppFilter"

/**
 * Telefonda filtre çekmecesi (Self Servis `FilterSheet` kalıbı): seçimler TASLAK, liste
 * arkada değişmez; "Sonuçları göster (n)" uygular, n taslağın sonucu. Geri tuşu kapatır.
 */
export function PhoneFilterSheet({ open, onOpenChange, view, rows, known, counts, appOptions }) {
  const { t, locale } = useLocale()
  const [draft, setDraft] = useState({ role: view.role, apps: view.apps })
  const [wasOpen, setWasOpen] = useState(open)
  // Her açılışta taslak URL'deki hâlden başlar.
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setDraft({ role: view.role, apps: view.apps })
  }
  const n = useMemo(
    () =>
      open
        ? filterPeople(rows, { query: view.q, role: draft.role, apps: draft.apps, known }).length
        : 0,
    [open, rows, view.q, draft, known],
  )
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("authz.filter.label")}
      closeOnBack
      footer={
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="h-11 px-4 text-sm"
            onClick={() => setDraft({ role: "all", apps: [] })}
          >
            {t("security.filter.reset")}
          </Button>
          <Button
            className="h-11 flex-1 bg-brand-fill-deep text-sm text-brand-on-brand hover:bg-brand-fill-deep"
            onClick={() => {
              view.update({ role: draft.role, apps: draft.apps })
              onOpenChange(false)
            }}
          >
            {t("security.filter.show", { n: new Intl.NumberFormat(locale).format(n) })}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <section>
          <h3 className="mb-2 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {t("authz.ws.editor.role")}
          </h3>
          <SegmentedControl
            fill
            label={t("authz.ws.editor.role")}
            value={draft.role}
            onChange={(role) => setDraft((d) => ({ ...d, role }))}
            options={[
              { value: "all", label: t("authz.filter.all") },
              { value: "admins", label: `${t("authz.filter.admins")} ${counts.admins}` },
              { value: "stale", label: `${t("security.people.stale")} ${counts.stale}` },
            ]}
          />
        </section>
        <section>
          <h3 className="mb-2 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {t("security.people.appFilter")}
          </h3>
          <AppOptions
            options={appOptions}
            value={draft.apps}
            onChange={(apps) => setDraft((d) => ({ ...d, apps }))}
          />
        </section>
      </div>
    </BottomSheet>
  )
}
