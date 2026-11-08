import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import Robot01Icon from "@hugeicons/core-free-icons/Robot01Icon"
import AiBrain02Icon from "@hugeicons/core-free-icons/AiBrain02Icon"
import Office365Icon from "@hugeicons/core-free-icons/Office365Icon"
import SearchRemoveIcon from "@hugeicons/core-free-icons/SearchRemoveIcon"
import { DestructiveDialog } from "@/features/security/dialogs"
import { useConfig } from "@/hooks/useConfig"
import { useLocale } from "@/hooks/useLocale"
import { causeNote } from "@/lib/causeText"
import { notify } from "@/lib/notify"
import { cn, safeExternalUrl } from "@/lib/utils"
import { duplicateOf, filterItems, isShown, KIND, moveIds, statusCounts } from "./catalogLogic"
import { CatalogList } from "./CatalogList"
import { CatalogToolbar } from "./CatalogToolbar"
import { ListMessage, SkeletonRows } from "./CatalogStates"
import { EntityPanel } from "./EntityPanel"

const EMPTY_ICON = { agents: Robot01Icon, aiApps: AiBrain02Icon, businessApps: Office365Icon }

/**
 * Kutu kapanıp odak sayfa başına düştüyse komşu satıra (yoksa aramaya) alır. Kapanış animasyonu
 * süresince Radix odağı kendisi yönetir: iki deneme, yalnız odak boşta kaldıysa.
 */
function focusLater(id) {
  const attempt = () => {
    const lost = !document.activeElement || document.activeElement === document.body
    if (!lost) return
    const row = id && document.querySelector(`[data-row="${CSS.escape(String(id))}"] [data-main]`)
    const target =
      row || document.querySelector("#catalog-panel [data-main], #catalog-panel button")
    target?.focus({ preventScroll: true })
  }
  setTimeout(attempt, 0)
  setTimeout(attempt, 400)
}

/** Tek katalog türü: araç çubuğu, liste, düzenleme bölmesi, silme onayı. */
export function CatalogKind({ kind, phone, inView = true }) {
  const { t } = useLocale()
  const config = useConfig()
  const def = KIND[kind]
  const all = config[def.all]
  const items = useMemo(() => all ?? [], [all])
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [sortMode, setSortMode] = useState(false)
  const navigate = useNavigate()
  const [panel, setPanel] = useState({ open: false, item: null, draft: null, session: 0 })
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [flashId, setFlashId] = useState(null)
  const flashTimer = useRef(0)
  useEffect(() => () => clearTimeout(flashTimer.current), [])
  const filtered = Boolean(query.trim()) || status !== "all"
  const visible = useMemo(() => filterItems(items, { query, status }), [items, query, status])
  const counts = useMemo(() => statusCounts(items), [items])
  const name = (item) => item?.name ?? ""

  const openPanel = (item, draft = null) =>
    setPanel((p) => ({ open: true, item, draft, session: p.session + 1 }))
  const closePanel = () => setPanel((p) => ({ ...p, open: false }))
  const clearFilters = () => {
    setQuery("")
    setStatus("all")
  }

  async function save(saved) {
    try {
      const stored = await config[def.upsert](saved)
      notify.success(t("settings.toast.saved").replace("{name}", saved.name))
      closePanel()
      // Yeni kayıt sona düşer: bir an belirsin (kimlik sağlayıcının verdiği, sunucununki).
      if (!saved.id && stored?.id) {
        setFlashId(stored.id)
        clearTimeout(flashTimer.current)
        flashTimer.current = setTimeout(() => setFlashId(null), 2000)
      }
      return true
    } catch (err) {
      // Uzak yazma düştü: bölme açık kalır, yeniden denenebilir.
      notify.error(t("settings.toast.saveError").replace("{name}", saved.name), {
        description: causeNote(t, "dataverse", err),
      })
      return false
    }
  }

  async function move(from, to) {
    // Süzülmüş görünümde komşu satır gizli olabilir: sıra yalnız tam listede değişir.
    if (filtered) {
      notify.info(t("settings.catalog.sort.filtered"))
      return
    }
    const ids = moveIds(items, from, to)
    if (!ids) return
    try {
      await config.reorder(kind, ids)
    } catch (err) {
      // Sağlayıcı eski sırayı geri koydu; satırın neden geri sıçradığını söyle.
      notify.error(t("settings.toast.reorderError"), {
        description: causeNote(t, "dataverse", err),
      })
    }
  }

  // Gizle/göster herkesi etkiler ve filtreli listede satır kaybolur: sonucu söyle, Geri al sun
  // (Gmail). Geri alma kendisi bildirim üretmez.
  async function toggle(item, undoing = false) {
    const next = !isShown(item)
    try {
      await config.setActive(kind, item.id, next)
      if (undoing) return
      const key = next ? "settings.catalog.toast.shown" : "settings.catalog.toast.hidden"
      notify.success(t(key).replace("{name}", name(item)), {
        action: {
          label: t("settings.catalog.toast.undo"),
          onClick: () => toggle({ ...item, isActive: next }, true),
        },
      })
    } catch (err) {
      notify.error(t("settings.toast.visibilityError").replace("{name}", name(item)), {
        description: causeNote(t, "dataverse", err),
      })
    }
  }

  async function copy(label, value) {
    try {
      await navigator.clipboard.writeText(value)
      notify.success(t("settings.field.copied").replace("{name}", label))
    } catch {
      notify.error(t("settings.field.copyFailed"))
    }
  }

  async function confirmDelete() {
    if (!deleting || deleteBusy) return
    setDeleteBusy(true)
    // Silinen satırın komşusu: kutular kapanınca odak sayfa başına düşmesin (açanı artık yok).
    const at = visible.findIndex((x) => x.id === deleting.id)
    const neighbor = visible[at + 1] ?? visible[at - 1]
    try {
      await config[def.remove](deleting.id)
      notify.success(t("settings.toast.deleted").replace("{name}", name(deleting)))
      if (panel.item?.id === deleting.id) closePanel()
      setDeleting(null)
      focusLater(neighbor?.id)
    } catch (err) {
      notify.error(t("settings.toast.deleteError").replace("{name}", name(deleting)), {
        description: causeNote(t, "dataverse", err),
      })
    } finally {
      setDeleteBusy(false)
    }
  }

  let body
  if (config.loading && items.length === 0) body = <SkeletonRows />
  else if (items.length === 0)
    body = (
      <ListMessage
        icon={EMPTY_ICON[kind]}
        title={t(`settings.catalog.empty.${kind}`)}
        action={t(`settings.catalog.new.${kind}`)}
        onAction={() => openPanel(null)}
        primary
      />
    )
  else if (visible.length === 0)
    body = (
      <ListMessage
        icon={SearchRemoveIcon}
        title={t("settings.catalog.noResults")}
        action={t("settings.catalog.clearFilters")}
        onAction={clearFilters}
      />
    )
  else
    body = (
      <CatalogList
        kind={kind}
        items={items}
        visible={visible}
        filtered={filtered}
        sortMode={sortMode}
        flashId={flashId}
        phone={phone}
        onOpen={openPanel}
        onMove={move}
        onToggle={toggle}
        onCopy={copy}
        onDelete={setDeleting}
        onDuplicate={(item) =>
          openPanel(null, duplicateOf(item, kind, t("settings.catalog.copySuffix")))
        }
        onOpenLink={(item) =>
          window.open(safeExternalUrl(item.url), "_blank", "noopener,noreferrer")
        }
        onTryChat={(item) =>
          navigate(`/chat?agent=${encodeURIComponent(item.id)}&reset=${Date.now()}`)
        }
      />
    )

  return (
    <div className={cn("flex flex-col gap-3", phone && "pb-20")}>
      {/* Boş ya da yüklenen türde araç çubuğu yok: aranacak bir şey yok; boşta tek birincil eylem ortada. */}
      {items.length > 0 && (
        <CatalogToolbar
          kind={kind}
          phone={phone}
          query={query}
          onQuery={setQuery}
          status={status}
          onStatus={setStatus}
          counts={counts}
          sortMode={sortMode}
          onSortMode={(on) => {
            if (on) clearFilters()
            setSortMode(on)
          }}
          canSort={items.length > 1}
          showFab={inView}
          onNew={() => openPanel(null)}
        />
      )}
      {body}
      {/* Arama/filtre sonucu ekran okuyucuya: görünen liste değişir ama odak kutuda kalır. */}
      <p aria-live="polite" className="sr-only">
        {filtered ? t("settings.catalog.results").replace("{n}", visible.length) : ""}
      </p>
      {items.length > 0 && !(phone && sortMode) && (
        <p className="px-1 text-xs text-muted-foreground">{t("settings.catalog.scopeNote")}</p>
      )}
      {panel.session > 0 && (
        <EntityPanel
          key={panel.session}
          open={panel.open}
          kind={kind}
          item={panel.item}
          draft={panel.draft}
          phone={phone}
          onClose={closePanel}
          onSave={save}
          onDelete={setDeleting}
          onCopy={copy}
        />
      )}
      <DestructiveDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && !deleteBusy && setDeleting(null)}
        icon={Delete02Icon}
        title={t("settings.catalog.delete.title")}
        description={t("settings.catalog.delete.body")}
        subject={name(deleting)}
        consequences={[
          { kind: "drop", text: t("settings.catalog.delete.drop") },
          { kind: "keep", text: t("settings.catalog.delete.keep") },
        ]}
        confirmLabel={t("settings.action.delete")}
        cancelLabel={t("settings.action.cancel")}
        onConfirm={confirmDelete}
        busy={deleteBusy}
      />
    </div>
  )
}
