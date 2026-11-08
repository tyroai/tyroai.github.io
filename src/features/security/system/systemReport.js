/**
 * Sistem sekmesinin saf hesapları: dikkat sebepleri ve destek turu için düz metin döküm.
 * Her olgu çağıran tarafından ÇALIŞMA ANINDA okunup verilir; burada sabit bir değer yok.
 */

/** Dikkat sebepleri (anahtar listesi). Boşsa durum satırı sessiz kalır. Çok hesaplı tarayıcı arıza değil. */
export function healthReasons({ signedOutMarker, source, msalConfigured }) {
  const out = []
  if (signedOutMarker) out.push("security.health.sso")
  if (source !== "dataverse") out.push("security.health.catalog")
  if (!msalConfigured) out.push("security.health.mock")
  return out
}

/**
 * Kopyalanan döküm — harf harf okunabilsin diye düz metin (ekran görüntüsünde küçük-L / büyük-i
 * karışıyor). `f`: `{ session, groupId, isAdmin, scopes, source, dataverseUrl, openAgents,
 * totalAgents, copilotScope }`.
 */
export function reportLines(t, f) {
  const yesNo = f.isAdmin === true ? t("security.yes") : t("security.no")
  return [
    t("security.sec.entra"),
    `  ${t("security.identity.upn")}: ${f.session.upn}`,
    `  ${t("security.identity.name")}: ${f.session.name}`,
    `  ${t("security.identity.tenant")}: ${f.session.tenantId}`,
    `  ${t("security.admin.group")}: ${f.groupId} (${yesNo})`,
    `  ${t("security.auth.login")}: ${f.scopes.join(" ")}`,
    `  ${t("security.auth.silentSso")}: ${f.session.signedOutMarker ? t("security.auth.silentSso.off") : t("security.auth.silentSso.on")}`,
    t("security.sec.dataverse"),
    `  ${t("security.storage.catalogSource")}: ${f.source}`,
    `  ${t("security.auth.dataverse")}: ${f.dataverseUrl}`,
    `  ${t("security.agents.open")}: ${f.openAgents} / ${f.totalAgents}`,
    t("security.sec.copilot"),
    `  ${t("security.auth.copilot")}: ${f.copilotScope}`,
    t("security.sec.browser"),
    `  ${t("security.identity.accounts")}: ${f.session.accounts}`,
  ]
}
