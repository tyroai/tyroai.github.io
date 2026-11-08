import { useId, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon"
import { IconOrLogo } from "@/components/common/IconOrLogo"
import { Button } from "@/components/ui/button"
import { useIsAppAdmin } from "@/hooks/useAuthorizations"
import { ErrorCause } from "@/components/common/ErrorCause"
import { useGroupFailure, useIsInGroup, UNKNOWN } from "@/hooks/useIsInGroup"
import { useLocale } from "@/hooks/useLocale"
import { useMe } from "@/hooks/useMe"
import { ADMIN_GROUP_ID } from "@/lib/constants"
import { isMsalConfigured } from "@/lib/msal"
import { cn } from "@/lib/utils"
import { Group, Row, StatusChip } from "./rows"
import { manageState } from "./status"
import { useAccessGroups } from "./useAccessGroups"

const STATE_CHIP = {
  open: { tone: "success", key: "profile.agents.open" },
  pending: { tone: "warning", key: "lock.reviewing" },
  locked: { tone: "muted", key: "lock.badge" },
  checking: { tone: "muted", key: "profile.access.checking" },
}

/** Ekrandakinin düz metni: Teams'e yapıştırılır, UPN harf harf okunur (görüntüde l/I karışır). */
function asPlainText({ upn, manage, groups, t }) {
  const lines = [`${t("profile.session")}: ${upn || "—"}`, `${t("profile.manage")}: ${manage}`]
  for (const g of groups) {
    lines.push(`${t(g.labelKey)}:`)
    for (const { item, state } of g.items)
      lines.push(`  ${item.name} — ${t(STATE_CHIP[state].key)}`)
  }
  return lines.join("\n")
}

/**
 * Erişim — önce cevap (açık · inceleniyor · kilitli sayısı), sonra katalogdaki her asistan, AI
 * ürünü ve iş uygulaması kendi logosu ve bu kişiye göre durumuyla (yetki kaydı, `useAppLock`);
 * en altta teşhis açılırı. Yönetici kilidi atlar: bunu bir cümle söyler, satırlar "Açık" der.
 */
export function AccessSection() {
  const { t } = useLocale()
  const me = useMe()
  const { accounts } = useMsal()
  const appAdmin = useIsAppAdmin()
  const adminVerdict = useIsInGroup(ADMIN_GROUP_ID)
  const failure = useGroupFailure(ADMIN_GROUP_ID)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const panelId = useId()

  const signedIn = isMsalConfigured && accounts.length > 0
  const upn = signedIn ? me.email : ""
  const manage = manageState(adminVerdict, t)
  const groups = useAccessGroups()
  const all = groups.flatMap((g) => g.items)
  const count = (s) => all.filter((x) => x.state === s).length

  async function copy() {
    try {
      await navigator.clipboard?.writeText(asPlainText({ upn, manage: manage.label, groups, t }))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Pano izni yoksa sessiz: döküm ekranda okunur durumda.
    }
  }

  return (
    <div className="space-y-8">
      {/* Önce cevap (Google Hesabım'ın durum özeti): üç sayı, tek bakış. */}
      <div className="space-y-2">
        <div className="grid grid-cols-3 divide-x divide-border/60 rounded-2xl bg-muted/40 py-3 rtl:divide-x-reverse dark:bg-white/[0.04]">
          {["open", "pending", "locked"].map((s) => (
            <div key={s} className="min-w-0 px-4">
              <p className="truncate text-xs text-muted-foreground">{t(STATE_CHIP[s].key)}</p>
              <p
                className={cn(
                  "mt-1 text-xl font-semibold tabular-nums",
                  s === "pending" && count(s) > 0 && "text-warning-ink",
                )}
              >
                {count(s)}
              </p>
            </div>
          ))}
        </div>
        {appAdmin === true ? (
          <p className="px-1 text-xs leading-relaxed text-muted-foreground">
            {t("profile.access.adminNote")}
          </p>
        ) : null}
      </div>

      {groups.length === 0 ? (
        <Group>
          <Row label={t("profile.agents.empty")} />
        </Group>
      ) : (
        groups.map((g) => (
          <Group
            key={g.kind}
            label={t(g.labelKey)}
            footer={
              g.kind === "businessApp"
                ? t("profile.access.businessNote")
                : g.items.some((x) => x.state === "locked")
                  ? t("profile.access.lockedNote")
                  : null
            }
          >
            {g.items.map(({ item, state }) => (
              <Row
                key={item.id ?? item.name}
                label={
                  <span className="flex min-w-0 items-center gap-3">
                    <AppGlyph item={item} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{item.name}</span>
                      {item.description ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      ) : null}
                    </span>
                  </span>
                }
              >
                <StatusChip tone={STATE_CHIP[state].tone}>{t(STATE_CHIP[state].key)}</StatusChip>
              </Row>
            ))}
          </Group>
        ))
      )}

      <section className="space-y-3">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="-mx-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className={cn("size-4 transition-transform", !open && "-rotate-90 rtl:rotate-90")}
            strokeWidth={2}
          />
          {t("profile.access.diag")}
        </button>
        {open ? (
          <div id={panelId} className="space-y-3">
            <Group>
              <Row label={t("profile.session")} hint={t("profile.session.hint")}>
                {signedIn ? null : (
                  <StatusChip tone="warning">{t("profile.session.preview")}</StatusChip>
                )}
              </Row>
              <div className="-mt-1 px-4 pb-3">
                <code className="block break-all rounded-md bg-background/70 px-2 py-1.5 font-mono text-xs">
                  {upn || "—"}
                </code>
              </div>
              <Row label={t("profile.manage")} hint={t("profile.manage.hint")}>
                <StatusChip tone={manage.tone}>{manage.label}</StatusChip>
              </Row>
              {adminVerdict === UNKNOWN ? (
                <div className="px-4 py-3">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {t("profile.manage.unknownHint")}
                  </p>
                  <ErrorCause detail={failure} className="mt-2" />
                </div>
              ) : null}
            </Group>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" size="sm" onClick={copy}>
                <HugeiconsIcon icon={Copy01Icon} className="size-4" strokeWidth={1.8} />
                <span aria-live="polite">
                  {copied ? t("profile.access.copied") : t("profile.access.copyReport")}
                </span>
              </Button>
              <p className="min-w-0 flex-1 basis-60 text-xs leading-relaxed text-muted-foreground">
                {t("profile.access.hint")}
              </p>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}

/** Anasayfa'daki gibi gerçek logo (yoksa katalog ikonu) yuvarlak kare içinde. */
function AppGlyph({ item }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-background text-muted-foreground shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]">
      {item.logo || item.iconName ? (
        <IconOrLogo iconName={item.iconName} logo={item.logo} className="size-5" alt="" />
      ) : (
        <span className="text-xs font-semibold">{item.name?.charAt(0)}</span>
      )}
    </span>
  )
}
