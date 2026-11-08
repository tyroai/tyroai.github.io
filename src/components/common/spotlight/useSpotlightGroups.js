import "@/lib/i18n/help"
import { useMemo } from "react"
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import { ALL_FAQ } from "@/features/help/helpContent"
import { OFFICES } from "@/data/offices"
import { useIsAppAdmin } from "@/hooks/useAuthorizations"
import { useCompanyDirectory } from "@/hooks/useCompanyDirectory"
import { useIsInGroup } from "@/hooks/useIsInGroup"
import { useLocale } from "@/hooks/useLocale"
import { usePageAccess } from "@/hooks/usePageAccess"
import { ADMIN_GROUP_ID } from "@/lib/constants"
import { STATUS } from "@/lib/graph"
import { getNumberFormat } from "@/lib/intl-cache"
import { searchOffices } from "@/lib/offices"
import { searchPeople } from "@/lib/peopleIndex"
import { ACTIONS, ADMIN_PAGES, DEEP, EXTERNAL, PAGES } from "./spotlightCatalog"
import { faqScore, itemScore, orderGroups, topScored } from "./spotlightMatch"
import { recentItems } from "./spotlightRecent"
import { useSpotlightFiles } from "./useSpotlightFiles"

export const SCOPES = ["all", "people", "offices", "files", "pages", "help"]
const SHORT = { people: 5, offices: 3, pages: 6, actions: 3, help: 3, files: 5 }
const LONG = { people: 30, offices: 31, pages: 20, actions: 3, help: 12, files: 6 }
const PEOPLE_MIN = 2

/**
 * Spotlight'ın grupları: kutu boşken son açılanlar, sayfalar ve eylemler; yazınca kişiler (şirket
 * rehberi), ofisler, sayfalar ve alt yerler, eylemler, Yardım cevapları ve dosyalar — sonda
 * "TYRO'ya sor". `scope` tek bir türe daraltır (daha çok sonuç). Her öğe `{ key, kind, label, … }`.
 */
export function useSpotlightGroups({ open, query, scope }) {
  const { t, locale } = useLocale()
  const { canOpen } = usePageAccess()
  const inAdminGroup = useIsInGroup(ADMIN_GROUP_ID) === true
  const isAuthzAdmin = useIsAppAdmin() === true
  const q = query.trim()
  const askPeople = open && q.length >= PEOPLE_MIN && wants(scope, "people")
  const dir = useCompanyDirectory(askPeople)
  const files = useSpotlightFiles(q, open && wants(scope, "files"))

  const catalog = useMemo(() => {
    const page = (p) => ({
      key: `page:${p.id}`,
      kind: "page",
      label: t(p.labelKey),
      icon: p.icon,
      path: p.path,
      keys: p.keys,
    })
    const pages = PAGES.filter((p) => canOpen(p.path)).map(page)
    const admin = ADMIN_PAGES.filter((p) => (p.gate === "group" ? inAdminGroup : isAuthzAdmin)).map(
      page,
    )
    const deep = DEEP.filter((d) => canOpen(PAGES.find((p) => p.id === d.page)?.path ?? "/")).map(
      (d) => ({
        ...page(d),
        key: `deep:${d.id}`,
        parent: d.parentKeys
          ? d.parentKeys.map((k) => t(k)).join(" › ")
          : t(PAGES.find((p) => p.id === d.page).labelKey),
      }),
    )
    const external = EXTERNAL.map((e) => ({
      key: `ext:${e.id}`,
      kind: "external",
      label: t(e.labelKey),
      sub: t(e.subtitleKey),
      icon: e.icon,
      href: e.href,
    }))
    const actions = ACTIONS.map((a) => ({
      key: `act:${a.id}`,
      kind: "action",
      id: a.id,
      label: t(a.labelKey),
      icon: a.icon,
      keys: a.keys,
    }))
    return { pages, admin, deep, external, actions }
  }, [t, canOpen, inAdminGroup, isAuthzAdmin])

  const groups = useMemo(() => {
    const on = (kind) => wants(scope, kind)
    const limit = scope === "all" ? SHORT : LONG
    const out = []
    if (!open) return out
    if (!q) {
      const byKey = new Map(
        [
          ...catalog.pages,
          ...catalog.admin,
          ...catalog.deep,
          ...catalog.external,
          ...catalog.actions,
        ].map((it) => [it.key, it]),
      )
      const recent = recentItems()
        .map((r) =>
          r.kind === "person"
            ? personItem(r.person)
            : r.kind === "office"
              ? officeItem(OFFICES.find((o) => `office:${o.id}` === r.key))
              : byKey.get(r.key),
        )
        .filter(Boolean)
        // Aynı öğe sayfalarda da var: iki satır aynı değeri taşırsa ikisi birden seçili görünür.
        .map((it) => ({ ...it, key: `recent:${it.key}`, of: it.key }))
      if (recent.length) out.push({ id: "recent", items: recent })
      out.push({ id: "pages", items: [...catalog.pages, ...catalog.admin] })
      out.push({ id: "actions", items: catalog.actions })
      out.push({ id: "external", items: catalog.external })
      return out
    }
    if (on("people") && dir.status === STATUS.ready && q.length >= PEOPLE_MIN) {
      const hits = searchPeople(dir.index, q)
      const items = hits.slice(0, limit.people).map((r) => personItem(r.person, r))
      // Fazlası Bul'da: orada filtre, sıralama ve organizasyon var.
      if (hits.length > items.length)
        items.push({
          key: "people-all",
          kind: "more",
          label: t("spotlight.peopleAll", { n: getNumberFormat(locale).format(hits.length) }),
          icon: Search01Icon,
        })
      if (items.length) out.push({ id: "people", items })
    }
    if (on("offices")) {
      const kindLabel = (k) => t(`find.office.kind.${k}`)
      const items = searchOffices(q, { locale, kindLabel }).slice(0, limit.offices).map(officeItem)
      if (items.length) out.push({ id: "offices", items })
    }
    if (on("pages")) {
      const all = [...catalog.pages, ...catalog.admin, ...catalog.deep, ...catalog.external]
      const items = topScored(all, (it) => itemScore(it.label, it.keys, q), limit.pages)
      if (items.length) out.push({ id: "pages", items })
      const acts = topScored(
        catalog.actions,
        (it) => itemScore(it.label, it.keys, q),
        limit.actions,
      )
      if (scope === "all" && acts.length) out.push({ id: "actions", items: acts })
    }
    if (on("help")) {
      const faqs = ALL_FAQ.map((n) => ({ n, q: t(`help.faq.q${n}`), a: t(`help.faq.a${n}`) }))
      const items = topScored(faqs, (f) => faqScore(f.q, f.a, q), limit.help).map((f) => ({
        key: `faq:${f.n}`,
        kind: "faq",
        n: f.n,
        label: f.q,
        answer: f.a,
      }))
      if (items.length) out.push({ id: "help", items })
    }
    if (on("files") && files.status === STATUS.ready && files.items.length) {
      out.push({
        id: "files",
        items: files.items
          .slice(0, limit.files)
          .map((f) => ({ key: `file:${f.id}`, kind: "file", label: f.name, file: f })),
      })
    }
    const ordered = orderGroups(out, q)
    if (q.length >= PEOPLE_MIN)
      ordered.push({ id: "ask", items: [{ key: "ask", kind: "ask", label: q }] })
    return ordered
  }, [open, q, scope, catalog, dir.status, dir.index, files, locale, t])

  const loading = {
    people: askPeople && (dir.status === "loading" || dir.status === "idle"),
    files: files.status === "loading",
  }
  return { groups, loading }
}

const wants = (scope, kind) => scope === "all" || scope === kind

function personItem(person, hit) {
  return {
    key: `person:${person.id}`,
    kind: "person",
    label: person.name,
    person,
    field: hit?.field,
    phone: hit?.phone,
  }
}

function officeItem(office) {
  return office ? { key: `office:${office.id}`, kind: "office", label: office.name, office } : null
}
