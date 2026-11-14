import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon"
import { ErrorCause } from "@/components/common/ErrorCause"
import { useConfig } from "@/hooks/useConfig"
import { UNKNOWN, useGroupFailure, useIsInGroup } from "@/hooks/useIsInGroup"
import { useLocale } from "@/hooks/useLocale"
import { useMe } from "@/hooks/useMe"
import { ADMIN_GROUP_ID, IT_MANAGER_KEYS } from "@/lib/constants"
import {
  COPILOT_STUDIO_SCOPE,
  DATAVERSE_URL,
  isMsalConfigured,
  loginRequest,
  msalInstance,
} from "@/lib/msal"
import { isSignedOut } from "@/lib/silentSso"
import { cn } from "@/lib/utils"
import { BTN, BTN_QUIET } from "../requests/buttons"
import { Chips, CodeChip, InsetGroup, InsetRow, Verdict } from "./InsetGroup"
import { healthReasons, reportLines } from "./systemReport"

/** Durum satırı — önce cevap. Sağlamken sessiz (renk yalnız dikkat gerekince); Kopyala hep burada. */
function StatusSummary({ upn, reasons, copied, onCopy, catalogDetail }) {
  const { t } = useLocale()
  const attention = reasons.length > 0
  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-start gap-x-3 gap-y-2 rounded-2xl px-4 py-3",
        attention ? "bg-warning/12" : "bg-muted/40 dark:bg-white/[0.04]",
      )}
    >
      <HugeiconsIcon
        icon={attention ? Alert02Icon : CheckmarkCircle02Icon}
        aria-hidden="true"
        className={cn(
          "mt-0.5 size-4 shrink-0",
          attention ? "text-warning-ink" : "text-success-ink",
        )}
        strokeWidth={2}
      />
      <div className="min-w-0 flex-1 @max-[30rem]/sys:basis-[calc(100%-2rem)]">
        <p className="text-[0.875rem] font-medium leading-snug">
          {attention ? t("security.health.attention") : t("security.health.ok")}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground [overflow-wrap:anywhere]">{upn}</p>
        {attention && (
          <ul className="mt-1.5 list-disc space-y-0.5 ps-4 text-[0.8125rem] leading-snug">
            {reasons.map((r) => (
              <li key={r}>{t(r)}</li>
            ))}
          </ul>
        )}
        {reasons.includes("security.health.catalog") && (
          <ErrorCause detail={catalogDetail} className="mt-1.5" />
        )}
      </div>
      <button
        type="button"
        onClick={onCopy}
        className={cn(
          BTN,
          BTN_QUIET,
          "shrink-0 bg-muted hover:bg-accent @max-[30rem]/sys:ms-7 @max-[30rem]/sys:flex-1",
        )}
      >
        <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" className="size-4" strokeWidth={1.8} />
        {copied ? t("security.copied") : t("security.copy")}
      </button>
    </div>
  )
}

/**
 * Sistem sekmesi — oturumun erişim dökümü, SALT OKUNUR: politika kaynakta (grup `constants.js`,
 * kapsamlar `msal.js`, katalog Dataverse) ve değişiklik kod incelemesinden geçer. Her satır
 * ÇALIŞMA ANINDA okunur. Gruplama sisteme göre: Entra ID · Dataverse · Copilot Studio · bu
 * tarayıcı ("hangi sistemi açıp düzelteceğim"). Kapı Entra yönetici grubu (Kişiler ve
 * Talepler'in `tyro_isadmin` kapısından farklı küme — sebebi yazılır).
 */
export function SystemPanel() {
  const { t } = useLocale()
  const me = useMe()
  const { agents, allAgents, source, error } = useConfig()
  const isAdmin = useIsInGroup(ADMIN_GROUP_ID)
  const failure = useGroupFailure(ADMIN_GROUP_ID)
  const [copied, setCopied] = useState(false)

  const session = useMemo(() => {
    const account = isMsalConfigured
      ? (msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0] ?? null)
      : null
    return {
      upn: account?.username ?? me.email ?? "—",
      name: account?.name ?? me.fullName ?? "—",
      tenantId: account?.tenantId ?? "—",
      accounts: isMsalConfigured ? msalInstance.getAllAccounts().length : 0,
      signedOutMarker: isSignedOut(),
    }
  }, [me.email, me.fullName])

  if (isAdmin !== true) {
    return (
      <div className="rounded-2xl bg-muted/40 px-4 py-10 text-center text-[0.8125rem] leading-relaxed text-muted-foreground dark:bg-white/[0.04]">
        <p>{isAdmin === undefined ? t("security.gate.pending") : t("security.gate.appTab")}</p>
        {isAdmin === UNKNOWN && <ErrorCause detail={failure} className="mx-auto" />}
      </div>
    )
  }

  const openAgents = agents.length
  const totalAgents = allAgents?.length ?? openAgents
  const reasons = healthReasons({
    signedOutMarker: session.signedOutMarker,
    source,
    msalConfigured: isMsalConfigured,
  })

  async function copy() {
    const lines = reportLines(t, {
      session,
      groupId: ADMIN_GROUP_ID,
      isAdmin,
      scopes: loginRequest.scopes,
      source,
      dataverseUrl: DATAVERSE_URL,
      openAgents,
      totalAgents,
      copilotScope: COPILOT_STUDIO_SCOPE,
    })
    try {
      await navigator.clipboard.writeText(lines.join("\n"))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Pano reddederse sessiz: istenmeyen bir uyarı kopyalayamamaktan kötü.
    }
  }

  return (
    <section
      aria-labelledby="authz-system-h"
      className="@container/sys flex max-w-3xl flex-col gap-8"
    >
      <h2 id="authz-system-h" className="sr-only">
        {t("authz.system.heading")}
      </h2>
      <StatusSummary
        upn={session.upn}
        reasons={reasons}
        copied={copied}
        onCopy={copy}
        catalogDetail={error?.detail}
      />

      <InsetGroup
        id="sys-entra"
        titleLang="en"
        title={t("security.sec.entra")}
        hint={t("security.sec.entra.hint")}
      >
        <InsetRow label={t("security.identity.upn")}>
          <CodeChip>{session.upn}</CodeChip>
        </InsetRow>
        <InsetRow label={t("security.identity.name")}>{session.name}</InsetRow>
        <InsetRow label={t("security.identity.tenant")}>
          {session.tenantId === "—" ? "—" : <CodeChip>{session.tenantId}</CodeChip>}
        </InsetRow>
        <InsetRow label={t("security.admin.group")}>
          <span className="inline-flex flex-wrap items-center justify-end gap-2">
            <CodeChip>{ADMIN_GROUP_ID}</CodeChip>
            <Verdict
              value={isAdmin}
              yes={t("security.yes")}
              no={t("security.no")}
              pending={t("security.pending")}
            />
          </span>
        </InsetRow>
        <InsetRow label={t("security.admin.unlocks")} stacked>
          {t("security.admin.unlocks.value")}
        </InsetRow>
        <InsetRow label={t("security.auth.login")} stacked>
          <Chips items={loginRequest.scopes} />
        </InsetRow>
        <InsetRow label={t("security.auth.silentSso")}>
          <Verdict
            value={!session.signedOutMarker}
            yes={t("security.auth.silentSso.on")}
            no={t("security.auth.silentSso.off")}
            pending={t("security.pending")}
          />
        </InsetRow>
        <InsetRow label={t("security.admin.itChain")} stacked>
          <Chips items={IT_MANAGER_KEYS} />
        </InsetRow>
      </InsetGroup>

      <InsetGroup
        id="sys-dv"
        titleLang="en"
        title={t("security.sec.dataverse")}
        hint={t("security.sec.dataverse.hint")}
      >
        {/* Kataloğun kaynağı en üstte: "dataverse" değilse aşağısı canlı değil, önbellek. */}
        <InsetRow label={t("security.storage.catalogSource")}>
          <Verdict
            value={source === "dataverse"}
            yes={source}
            no={source}
            pending={t("security.pending")}
          />
        </InsetRow>
        <InsetRow label={t("security.auth.dataverse")}>
          <CodeChip>{DATAVERSE_URL}</CodeChip>
        </InsetRow>
        <InsetRow label={t("security.agents.open")}>
          <span className="tabular-nums">
            {openAgents} / {totalAgents}
          </span>
        </InsetRow>
        <InsetRow label={t("security.agents.gate")} stacked>
          {t("security.agents.gate.value")}
        </InsetRow>
        <InsetRow label={t("security.agents.list")} stacked>
          <Chips items={agents.map((a) => a.name)} />
        </InsetRow>
      </InsetGroup>

      <InsetGroup
        id="sys-copilot"
        titleLang="en"
        title={t("security.sec.copilot")}
        hint={t("security.sec.copilot.hint")}
      >
        <InsetRow label={t("security.auth.copilot")} stacked>
          <CodeChip>{COPILOT_STUDIO_SCOPE}</CodeChip>
        </InsetRow>
      </InsetGroup>

      <InsetGroup
        id="sys-browser"
        title={t("security.sec.browser")}
        hint={t("security.sec.browser.hint")}
      >
        <InsetRow label={t("security.identity.accounts")}>
          <span className="tabular-nums">{session.accounts}</span>
        </InsetRow>
        <InsetRow label={<CodeChip>tyro-config-v2</CodeChip>} stacked>
          {t("security.storage.config")}
        </InsetRow>
        <InsetRow label={<CodeChip>tyro-chat-session-*</CodeChip>} stacked>
          {t("security.storage.chat")}
        </InsetRow>
        <InsetRow label={<CodeChip>tyro-changelog-seen-v1</CodeChip>} stacked>
          {t("security.storage.changelog")}
        </InsetRow>
        <InsetRow label={<CodeChip>tyro-signed-out · tyro-sso-attempted</CodeChip>} stacked>
          {t("security.storage.sso")}
        </InsetRow>
      </InsetGroup>

      <p className="px-4 text-xs leading-relaxed text-muted-foreground">{t("security.readonly")}</p>
    </section>
  )
}
