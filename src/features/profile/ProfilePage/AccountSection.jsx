import { useState } from "react"
import { useMsal } from "@azure/msal-react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowUpRight01Icon from "@hugeicons/core-free-icons/ArrowUpRight01Icon"
import Logout01Icon from "@hugeicons/core-free-icons/Logout01Icon"
import { ErrorCause } from "@/components/common/ErrorCause"
import { Button } from "@/components/ui/button"
import { useIsInGroup, UNKNOWN } from "@/hooks/useIsInGroup"
import { useLocale } from "@/hooks/useLocale"
import { useMe } from "@/hooks/useMe"
import { clearMyProfileCache, useMyProfileDetails } from "@/hooks/useMyProfileDetails"
import { useMyManagerState } from "@/hooks/useMyManager"
import { useSignOut } from "@/hooks/useSignOut"
import { ADMIN_GROUP_ID } from "@/lib/constants"
import { STATUS } from "@/lib/graph"
import { isMsalConfigured } from "@/lib/msal"
import { CopyButton, Group, Row, SkeletonRows, StatusChip } from "./rows"

// İş/okul hesabının Microsoft "Hesabım" portalı (parola, güvenlik bilgisi, cihazlar).
const MS_ACCOUNT_URL = "https://myaccount.microsoft.com"

/** Değer satırı: ad solda (soluk), değer sağda kalın — göz değeri arar; kısalırsa tamamı `title`da. */
function ValueRow({ label, value, copy = false, href }) {
  if (!value) return null
  const text = (
    <span className="block truncate text-end text-sm font-semibold text-foreground" title={value}>
      {value}
    </span>
  )
  return (
    <div className="flex min-h-12 items-center gap-4 px-4 py-2 pointer-coarse:min-h-14">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="ms-auto flex min-w-0 items-center gap-1">
        {href ? (
          <a
            href={href}
            className="flex min-w-0 items-center underline-offset-4 hover:underline pointer-coarse:min-h-11"
          >
            {text}
          </a>
        ) : (
          <span className="min-w-0">{text}</span>
        )}
        {copy ? <CopyButton value={value} label={label} /> : null}
      </span>
    </div>
  )
}

/**
 * Hesap — Graph `/me` kaydı (salt okunur). Graph susarsa satırlar çizilmez: boş bir
 * "Departman —" satırı, bilmediğimizi değil kişinin departmanı olmadığını söylerdi.
 * Yöneticilik üç değerli: "sorulamadı" ayrı yazılır, "hayır" sayılmaz.
 */
export function AccountSection() {
  const [attempt, setAttempt] = useState(0)
  // Tekrar denemede önbellek boşaltılıp bölüm yeniden kurulur: kanca baştan sorar.
  function retry() {
    clearMyProfileCache()
    setAttempt((n) => n + 1)
  }
  return <AccountBody key={attempt} onRetry={retry} />
}

function AccountBody({ onRetry }) {
  const { t } = useLocale()
  const me = useMe()
  const { accounts } = useMsal()
  const { status, details, detail } = useMyProfileDetails()
  const signedIn = isMsalConfigured && accounts.length > 0
  const { manager } = useMyManagerState(signedIn)
  const adminVerdict = useIsInGroup(ADMIN_GROUP_ID)
  const signOut = useSignOut()

  const loading = signedIn && !details && status === STATUS.unauthenticated
  const failed = signedIn && !details && (status === STATUS.error || status === STATUS.denied)
  const upn = me.email || ""
  const directoryMail = details?.mail ?? ""
  const mailDiffers =
    directoryMail && upn && directoryMail.trim().toLowerCase() !== upn.trim().toLowerCase()

  return (
    <div className="space-y-8">
      <Group label={t("profile.account.groupPerson")} footer={t("profile.account.source")}>
        <ValueRow label={t("profile.account.name")} value={me.fullName} />
        {loading ? <SkeletonRows count={3} /> : null}
        {details ? (
          <>
            <ValueRow label={t("profile.field.jobTitle")} value={details.jobTitle} />
            <ValueRow label={t("profile.field.department")} value={details.department} />
            <ValueRow label={t("profile.field.office")} value={details.officeLocation} />
          </>
        ) : null}
        {manager ? <ValueRow label={t("profile.account.manager")} value={manager.name} /> : null}
        {failed ? (
          <Row
            label={t("profile.account.loadError")}
            hint={
              <>
                {t("profile.account.loadErrorHint")}
                <ErrorCause detail={detail} className="mt-1.5" />
              </>
            }
          >
            <Button type="button" variant="ghost" size="sm" onClick={onRetry}>
              {t("profile.account.retry")}
            </Button>
          </Row>
        ) : null}
      </Group>

      <Group
        label={t("profile.account.groupContact")}
        footer={mailDiffers ? t("profile.mailDiffers") : null}
      >
        <ValueRow label={t("profile.account.upn")} value={upn} copy href={`mailto:${upn}`} />
        {mailDiffers ? (
          <ValueRow label={t("profile.field.mail")} value={directoryMail} copy />
        ) : null}
        {details?.phone ? (
          <ValueRow
            label={t("profile.field.phone")}
            value={details.phone}
            copy
            href={`tel:${details.phone.replace(/\s+/g, "")}`}
          />
        ) : null}
      </Group>

      <Group label={t("profile.account.groupApp")}>
        {/* Rol düz değer (durum değil); çip yalnız olağan dışında. "Yönetici" yazmaz: hemen
            üstteki Yönetici satırı kişinin amiri, ikisi karışırdı. */}
        <Row label={t("profile.account.role")}>
          {!signedIn ? (
            <StatusChip tone="warning">{t("profile.session.preview")}</StatusChip>
          ) : adminVerdict === UNKNOWN ? (
            <StatusChip tone="warning">{t("profile.adminUnknown")}</StatusChip>
          ) : (
            <span className="text-sm font-semibold text-foreground">
              {adminVerdict === undefined
                ? "…"
                : t(
                    adminVerdict === true
                      ? "profile.account.roleAdmin"
                      : "profile.account.roleUser",
                  )}
            </span>
          )}
        </Row>
        {/* Parola, MFA ve cihazlar TYRO'da değil, Microsoft'un kendi hesap sayfasında. */}
        <a
          href={MS_ACCOUNT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 items-center gap-3 px-4 py-3 outline-none transition-colors hover:bg-foreground/[0.03] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 pointer-coarse:min-h-14"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-sm text-foreground">{t("profile.account.msAccount")}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {t("profile.account.msAccountHint")}
            </span>
          </span>
          <HugeiconsIcon
            icon={ArrowUpRight01Icon}
            className="size-4 shrink-0 text-muted-foreground rtl:-scale-x-100"
            strokeWidth={2}
            aria-hidden="true"
          />
        </a>
      </Group>

      {/* Hesap sayfasının sonunda çıkış (Apple Kimliği kalıbı): telefonda kullanıcı menüsü
          kenar çubuğunun içinde, burası iki dokunuş. Menüdeki gibi nötr, yıkıcı değil. */}
      <Group>
        <button
          type="button"
          onClick={signOut}
          className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-start text-sm text-foreground outline-none transition-colors hover:bg-foreground/[0.03] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 active:bg-foreground/[0.06] pointer-coarse:min-h-14"
        >
          <HugeiconsIcon
            icon={Logout01Icon}
            className="size-4 shrink-0 text-muted-foreground"
            strokeWidth={1.8}
          />
          {t("user.signout")}
        </button>
      </Group>
    </div>
  )
}
