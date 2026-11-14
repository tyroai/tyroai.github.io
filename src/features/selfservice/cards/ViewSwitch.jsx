import { SegmentedControl } from "@/components/common/SegmentedControl"
import { useLocale } from "@/hooks/useLocale"
import { number } from "../kinds"

/**
 * Kartlar düzeninin görünüm anahtarı: Ben · Ekibim (sayısıyla, "Ekibim · 12"). Üst çubuğun başında
 * durur; Ekibim'de aynı anahtar ekibin çubuğunun başına geçer (`TeamView` › `lead`).
 * `team`: `{ active, count, onToggle }` (sayfanın ekip geçişi).
 */
export function ViewSwitch({ team }) {
  const { t, locale } = useLocale()
  const value = team.active ? "team" : "me"
  const teamName = t("selfService.view.team")
  return (
    <span data-tour="ss-team" className="ssc-switch">
      <SegmentedControl
        label={t("selfService.view.label")}
        value={value}
        onChange={(v) => v !== value && team.onToggle()}
        options={[
          { value: "me", label: t("selfService.cards.me") },
          {
            value: "team",
            label: team.count != null ? `${teamName} · ${number(team.count, locale)}` : teamName,
          },
        ]}
      />
    </span>
  )
}
