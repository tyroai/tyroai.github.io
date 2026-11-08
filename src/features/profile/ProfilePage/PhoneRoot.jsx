import { PageHeading } from "@/components/common/SectionHeading"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { UserAvatar } from "@/components/common/UserAvatar"
import { useLocale } from "@/hooks/useLocale"
import { useMe } from "@/hooks/useMe"
import { usePalette } from "@/hooks/usePalette"
import { useTheme } from "@/hooks/useTheme"
import { permissionLabel, permissionState, useIdentityLine } from "./status"
import { prefetchSection } from "./adminLoaders"
import { DrillRow, Group } from "./rows"
import { formatSize, storageTotals } from "./storageInventory"
import { useAccessGroups } from "./useAccessGroups"
import { DRILL_STATE } from "./useProfileSection"

/** Satır sağındaki değer önizlemeleri (Apple Ayarlar): alt sayfayı açmadan durum okunur. */
function usePreviews() {
  const { t, locale } = useLocale()
  const access = useAccessGroups().flatMap((g) => g.items)
  const accessOpen = access.filter((x) => x.state === "open").length
  const accessTotal = access.length
  const { preference } = useTheme()
  const { palette, palettes } = usePalette()
  const current = palettes.find((p) => p.id === palette)
  return {
    access: t("profile.access.openOf", { open: accessOpen, total: accessTotal }),
    preferences: [
      t(preference === "dark" ? "profile.prefs.dark" : "profile.prefs.light"),
      current ? t(current.labelKey, current.id) : null,
      t(`locale.${locale}`),
    ]
      .filter(Boolean)
      .join(" · "),
    notifications: permissionLabel(permissionState(), t),
    storage: formatSize(storageTotals().size, locale),
  }
}

/** Avatar: Graph fotoğrafı, yoksa addan türeyen renkte daire + baş harfler (`UserAvatar`). */
export function Avatar({ me, className, textClassName }) {
  return (
    <div className={className}>
      <UserAvatar photoUrl={me.photoUrl} label={me.fullName}>
        <span aria-hidden="true" className={textClassName} style={{ letterSpacing: "-0.02em" }}>
          {me.initials}
        </span>
      </UserAvatar>
    </div>
  )
}

/**
 * Telefon kökü (iOS Ayarlar): büyük başlık, dokununca Hesap'a inen profil başlığı, gruplu
 * bölüm satırları ve sağda değer önizlemesi. Her satır bir alt sayfaya iner (geçmişe adım).
 */
export function PhoneRoot({ sections, hrefFor }) {
  const { t } = useLocale()
  const me = useMe()
  const line = useIdentityLine()
  const previews = usePreviews()
  const mine = sections.filter((s) => s.group === "mine" && s.id !== "account")
  const admin = sections.filter((s) => s.group === "admin")

  return (
    <div className="space-y-6">
      <PageHeading eyebrow={t("profile.eyebrow")} title={t("profile.title")} />

      <Link
        to={hrefFor("account")}
        state={DRILL_STATE}
        data-section="account"
        aria-label={`${me.fullName} — ${t("profile.section.account")}`}
        className="flex items-center gap-4 rounded-2xl bg-muted/40 p-4 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/60 active:bg-muted/70 dark:bg-white/[0.04]"
      >
        <Avatar
          me={me}
          className="size-16 shrink-0"
          textClassName="select-none text-xl font-semibold leading-none"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{me.fullName}</p>
          {line ? <p className="truncate text-sm text-muted-foreground">{line}</p> : null}
          <p className="truncate text-sm text-muted-foreground">{me.email}</p>
        </div>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className="size-4 shrink-0 text-muted-foreground/70 rtl:rotate-180"
          strokeWidth={2}
          aria-hidden="true"
        />
      </Link>

      <Group level={2} label={t("profile.hub.groupMine")}>
        {mine.map((s) => (
          <DrillRow
            key={s.id}
            to={hrefFor(s.id)}
            state={DRILL_STATE}
            dataSection={s.id}
            icon={s.icon}
            label={t(s.labelKey)}
            value={previews[s.id]}
          />
        ))}
      </Group>

      {admin.length > 0 ? (
        <Group level={2} label={t("profile.hub.groupAdmin")}>
          {admin.map((s) => (
            <DrillRow
              key={s.id}
              onIntent={() => prefetchSection(s.id)}
              to={hrefFor(s.id)}
              state={DRILL_STATE}
              dataSection={s.id}
              icon={s.icon}
              label={t(s.labelKey)}
            />
          ))}
        </Group>
      ) : null}
    </div>
  )
}
