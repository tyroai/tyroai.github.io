/**
 * Günün okumasında öneri yoksa TYRO brifingden önerir (yalnız odak ve toplantı değil): bekleyen
 * davetler, önemli posta, gecikmiş iş; hiçbiri yoksa günün özeti. Öneri sohbete hazır soruyla gider
 * (`insight.offer.<id>Ask`; günün özeti Anasayfa'nın çipiyle aynı soru).
 */
export function chatOffer(items, t) {
  const has = (id, ok = () => true) => items.find((x) => x.id === id && ok(x))
  const pick = has("invites")
    ? "invites"
    : has("mail", (x) => x.important)
      ? "mail"
      : has("overdue")
        ? "overdue"
        : "day"
  return {
    key: pick,
    text: t(`insight.offer.${pick}`),
    prompt: pick === "day" ? t("myspace.prompt.daySummary") : t(`insight.offer.${pick}Ask`),
  }
}
