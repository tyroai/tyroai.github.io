import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Add01Icon from "@hugeicons/core-free-icons/Add01Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import DragDropIcon from "@hugeicons/core-free-icons/DragDropIcon"
import { useLocale } from "@/hooks/useLocale"
import "@/lib/i18n/homeLayout"

const OFF_MAX = 2
const SIZE = { "tyro-welcome": "hero" }

function Toggle({ on, name, note, onClick }) {
  return (
    <button type="button" role="switch" aria-checked={on} className="scp-row" onClick={onClick}>
      <span className="scp-name">
        {name}
        {note && <small>{note}</small>}
      </span>
      <span aria-hidden="true" className="scp-sw" />
    </button>
  )
}

/**
 * SAHNE PANELİ — açık sahnenin ayarları (prototip "Sahneyi düzenle"): küçük yerleşim haritası,
 * kartları aç-kapa (kapalılar: başka bir sahnede açık olanlar ve bu panelde az önce kapatılanlar),
 * katalogdan kart ekleme, yerleşimi düzenleme (sürükle, boyutlandır) ve "ne zaman açılsın" kuralı.
 * Kendi sahnende en altta "Sahneyi sil". Kapsayıcıyı çağıran seçer: geniş ekranda panonun yanında
 * sütun, dar ekranda sağ panel, telefonda alt çekmece (`HomeScenes`).
 *
 * `board`: panonun verdiği parçalar (`HomeBoard`): `cards` (açık kartlar `{ id, slot }`), `shape`
 * (yuvalar: `{ id, wide }`), `hidden` (eklenebilir kimlikler), `others` (öteki sahnelerin kartları),
 * `nameOf`, `add`, `remove`, `openCatalog`.
 */
export function ScenePanel({
  scene,
  board,
  rules,
  rule,
  ruleLabel,
  sceneName,
  onRule,
  onArrange,
  onDelete,
  onClose,
}) {
  const { t } = useLocale()
  // Bu panelde kapatılanlar listede kalır: yanlış kapatılan kart tek dokunuşla geri açılır.
  const [recent, setRecent] = useState([])
  const hidden = new Set(board.hidden)
  const off = recent.filter((id) => hidden.has(id)).map((id) => ({ id, scene: null }))
  for (const id of board.hidden) {
    if (off.length >= OFF_MAX) break
    if (off.some((x) => x.id === id)) continue
    const home = board.others.find((o) => o.ids.includes(id))
    if (home) off.push({ id, scene: home.id })
  }
  return (
    <>
      <div className="scp-head">
        <p className="scp-eyebrow">{t("homeLayout.scenes.panelTitle", { scene: scene.name })}</p>
        {onClose && (
          <button
            type="button"
            className="scp-x"
            aria-label={t("homeLayout.scenes.close")}
            title={t("homeLayout.scenes.close")}
            onClick={onClose}
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>
      <div aria-hidden="true" className="scp-mini">
        {board.shape.map((x) => (
          <i key={x.id} data-size={SIZE[x.id] ?? (x.wide ? "wide" : undefined)} />
        ))}
      </div>
      <ul aria-label={t("homeLayout.scenes.cards")} className="scp-list">
        {board.cards.map((c) => (
          <li key={c.id}>
            <Toggle
              on
              name={board.nameOf(c.id)}
              onClick={() => {
                setRecent((list) => [c.id, ...list.filter((id) => id !== c.id)])
                board.remove(c.slot, c.id)
              }}
            />
          </li>
        ))}
        {off.map((c) => (
          <li key={c.id}>
            <Toggle
              on={false}
              name={board.nameOf(c.id)}
              note={c.scene && t("homeLayout.scenes.openIn", { scene: sceneName(c.scene) })}
              onClick={() => board.add(c.id)}
            />
          </li>
        ))}
      </ul>
      <button type="button" className="scp-row" onClick={board.openCatalog}>
        <span aria-hidden="true" className="scp-tile">
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2.2} />
        </span>
        <span className="scp-name">
          {t("homeLayout.scenes.addFromCatalog")}
          <small>{t("homeLayout.scenes.catalogCount", { n: board.hidden.length })}</small>
        </span>
      </button>
      <button type="button" className="scp-row" onClick={onArrange}>
        <span aria-hidden="true" className="scp-tile">
          <HugeiconsIcon icon={DragDropIcon} strokeWidth={2} />
        </span>
        <span className="scp-name">
          {t("homeLayout.scenes.arrange")}
          <small>{t("homeLayout.scenes.arrangeHint")}</small>
        </span>
      </button>
      <p className="scp-eyebrow scp-eyebrow--gap">{t("homeLayout.scenes.when")}</p>
      <div role="group" aria-label={t("homeLayout.scenes.when")} className="scp-chips">
        {rules.map((r) => (
          <button key={r} type="button" aria-pressed={r === rule} onClick={() => onRule(r)}>
            {ruleLabel(r)}
          </button>
        ))}
      </div>
      {onDelete && (
        <button type="button" className="scp-del" onClick={onDelete}>
          {t("homeLayout.scenes.delete")}
        </button>
      )}
    </>
  )
}
