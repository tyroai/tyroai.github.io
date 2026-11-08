import "@/lib/i18n/tibot"
import { HugeiconsIcon } from "@hugeicons/react"
import Calendar01Icon from "@hugeicons/core-free-icons/Calendar01Icon"
import CheckListIcon from "@hugeicons/core-free-icons/CheckListIcon"
import FilterRemoveIcon from "@hugeicons/core-free-icons/FilterRemoveIcon"
import ServerStack01Icon from "@hugeicons/core-free-icons/ServerStack01Icon"
import UserIcon from "@hugeicons/core-free-icons/UserIcon"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { BUCKET_COLOR } from "@/lib/tibot/bucketColor"
import { facetOptions, hasFilters, NO_MEMBER, statusLabel } from "@/lib/tibot/tibotModel"
import { cn } from "@/lib/utils"
import { CHIP, CHIP_OFF, CHIP_ON } from "../chips"
import { FacetMenu } from "../filters/FacetMenu"
import { ExpandingSearch } from "../board/ExpandingSearch"
import { MONTH } from "../kinds"

/**
 * Kova seçimi — Self Servis'in durum çipleriyle aynı giysi (`chips.js`): seçili gri kapsül, ötekiler
 * soluk yazı; noktada kovanın kimlik rengi (`BUCKET_COLOR`, halkalı kartla aynı), gecikme ekran
 * okuyucuya ve ipucuna yazılır. Telefonda kayan şerit.
 */
function BucketChips({ views, value, onChange }) {
  const { t } = useLocale()
  return (
    <div
      role="group"
      aria-label={t("tibot.bucketsLabel")}
      className="flex min-w-0 gap-0.5 overflow-x-auto [mask-image:linear-gradient(to_right,#000_calc(100%-1rem),transparent)] [scrollbar-width:none] pe-4 @[40rem]/ss:flex-wrap @[40rem]/ss:overflow-visible @[40rem]/ss:pe-0 @[40rem]/ss:[mask-image:none] pointer-fine:flex-wrap pointer-fine:overflow-visible pointer-fine:pe-0 pointer-fine:[mask-image:none]"
    >
      {views.map((v) => {
        const on = v.id === value
        return (
          <button
            key={v.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(v.id)}
            title={v.overdue > 0 ? t("tibot.overdueCount", { n: v.overdue }) : undefined}
            className={cn(CHIP, on ? CHIP_ON : CHIP_OFF)}
          >
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: BUCKET_COLOR[v.id] }}
            />
            {t(`tibot.bucket.${v.id}`)}
            <span className="text-[0.75rem] font-normal tabular-nums text-muted-foreground">
              {v.count}
            </span>
            {v.overdue > 0 && (
              <span className="sr-only">{t("tibot.overdueCount", { n: v.overdue })}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Talepler'in araç çubuğu (Self Servis kayıt sekmelerinin düzeni, `BoardToolbar`): SOLDA kova
 * çipleri, SAĞDA Atanan (yalnız Ekibim: kimin üstünde, kimsede değil) · Durum · Servis · Açılış
 * ayı filtreleri, Temizle ve arama. Seçeneklerin sayısı öteki filtrelere ve aramaya uyanlardan
 * (`tibotModel.facetOptions`). Yenile özet kartındaki düğmede.
 */
export function TicketsToolbar({ views, bucket, onBucket, items, filters, onFilters }) {
  const { t, locale } = useLocale()
  const monthFmt = getDateTimeFormat(locale, MONTH)
  const set = (patch) => onFilters({ ...filters, ...patch })
  const status = facetOptions(items, filters, "status").map((o) => ({
    ...o,
    label: statusLabel(t, o.key, bucket === "mine"),
  }))
  const service = facetOptions(items, filters, "service").map((o) => ({ ...o, label: o.key }))
  const month = facetOptions(items, filters, "month").map((o) => ({
    ...o,
    label: monthFmt.format(new Date(`${o.key}-01T12:00:00`)),
  }))
  const member =
    bucket === "team"
      ? facetOptions(items, filters, "member").map((o) => ({
          ...o,
          label: o.key === NO_MEMBER ? t("tibot.unassigned") : o.key,
        }))
      : []
  const active = hasFilters(filters)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-full min-w-0 @[64rem]/ss:w-auto">
        <BucketChips views={views} value={bucket} onChange={onBucket} />
      </div>
      <div className="flex min-w-0 flex-1 basis-40 items-center justify-end gap-2">
        {member.length > 1 && (
          <FacetMenu
            icon={UserIcon}
            label={t("tibot.filter.member")}
            allLabel={t("tibot.filter.allMembers")}
            value={filters.member}
            options={member}
            onSelect={(v) => set({ member: v })}
            compact
          />
        )}
        {status.length > 1 && (
          <FacetMenu
            icon={CheckListIcon}
            label={t("tibot.filter.status")}
            allLabel={t("tibot.filter.all")}
            value={filters.status}
            options={status}
            onSelect={(v) => set({ status: v })}
            compact
          />
        )}
        {service.length > 1 && (
          <FacetMenu
            icon={ServerStack01Icon}
            label={t("tibot.filter.service")}
            allLabel={t("tibot.filter.all")}
            value={filters.service}
            options={service}
            onSelect={(v) => set({ service: v })}
            compact
          />
        )}
        {month.length > 1 && (
          <FacetMenu
            icon={Calendar01Icon}
            label={t("tibot.filter.month")}
            allLabel={t("tibot.filter.allMonths")}
            value={filters.month}
            options={month}
            onSelect={(v) => set({ month: v })}
            compact
          />
        )}
        {active && (
          <button
            type="button"
            onClick={() => onFilters({})}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[0.75rem] font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"
          >
            <HugeiconsIcon icon={FilterRemoveIcon} aria-hidden="true" className="size-3.5" />
            {t("tibot.filter.clear")}
          </button>
        )}
        <ExpandingSearch
          value={filters.query ?? ""}
          onChange={(q) => set({ query: q })}
          label={t("tibot.search")}
          placeholder={t("tibot.search")}
          className="ss-search flex-1 basis-40 @[40rem]/ss:basis-56"
        />
      </div>
    </div>
  )
}
