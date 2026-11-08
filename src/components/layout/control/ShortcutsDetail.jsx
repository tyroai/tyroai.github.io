import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import Link04Icon from "@hugeicons/core-free-icons/Link04Icon"
import { useLocale } from "@/hooks/useLocale"
import { useControlActions } from "./controlActions"
import { LINK_MAX, LINK_NAME_MAX, safeLinkUrl } from "./controlModel"
import { SHORTCUT_SLOTS, useShortcutItems } from "./shortcuts"
import { setControlLinks, useControlLinks } from "./controlStore"

// Şemasız yazılan adrese https eklenir ("erp.www.tyrotech.example" → "https://erp.www.tyrotech.example").
const withScheme = (v) => (/^[a-z][a-z0-9+.-]*:/i.test(v.trim()) ? v.trim() : `https://${v.trim()}`)
const hostOf = (url) => {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

/**
 * Kısayolların ayrıntısı: şeride sığmayanlar (varsa, dokununca çalışır) ve kişinin kendi
 * bağlantıları (en çok dört; ERP, Xurrent portalı …) — listede kaldır, altta ad + adresle ekle.
 * Yalnız https; adres doğrulanır, hata alanın altında. Bu tarayıcıda saklanır (`tyro-control-v1`).
 */
export function ShortcutsDetail() {
  const { t } = useLocale()
  const links = useControlLinks()
  const actions = useControlActions()
  const rest = useShortcutItems().slice(SHORTCUT_SLOTS)
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [error, setError] = useState(null)

  function add(e) {
    e.preventDefault()
    const clean = safeLinkUrl(withScheme(url))
    if (!name.trim()) return setError({ field: "name", text: t("control.sc.badName") })
    if (!clean) return setError({ field: "url", text: t("control.sc.badUrl") })
    const id = Math.random().toString(36).slice(2, 10)
    setControlLinks([...links, { id, name: name.trim(), url: clean }])
    setName("")
    setUrl("")
    setError(null)
  }

  return (
    <>
      {rest.length > 0 && (
        <>
          <div className="cc-list">
            {rest.map((it) => (
              <button key={it.id} type="button" className="cc-row" onClick={() => it.run(actions)}>
                <span className="cc-ic">
                  <HugeiconsIcon icon={it.icon} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="cc-row-label">{it.translate ? t(it.tip) : it.label}</span>
              </button>
            ))}
          </div>
          <p className="cc-section">{t("control.sc.yours")}</p>
        </>
      )}
      {links.length ? (
        <div className="cc-list">
          {links.map((l) => (
            <div key={l.id} className="cc-row">
              <span className="cc-ic">
                <HugeiconsIcon icon={Link04Icon} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="cc-row-label">
                {l.name}
                <span className="cc-row-sub">{hostOf(l.url)}</span>
              </span>
              <button
                type="button"
                className="cc-icon-btn"
                aria-label={t("control.sc.remove", { name: l.name })}
                title={t("control.sc.remove", { name: l.name })}
                onClick={() => setControlLinks(links.filter((x) => x.id !== l.id))}
              >
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="cc-note">{t("control.sc.empty")}</p>
      )}
      {links.length < LINK_MAX ? (
        <form className="cc-form" onSubmit={add} noValidate>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error?.field === "name") setError(null)
            }}
            maxLength={LINK_NAME_MAX}
            placeholder={t("control.sc.namePlaceholder")}
            aria-label={t("control.sc.name")}
            aria-invalid={error?.field === "name" || undefined}
            className="cc-input"
          />
          <div className="cc-field">
            <input
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                if (error?.field === "url") setError(null)
              }}
              type="url"
              inputMode="url"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="https://"
              aria-label={t("control.sc.url")}
              aria-invalid={error?.field === "url" || undefined}
              className="cc-input"
            />
            <button type="submit" className="cc-pill" data-tone="prominent">
              {t("control.sc.add")}
            </button>
          </div>
          {error && (
            <p role="alert" className="cc-error">
              {error.text}
            </p>
          )}
        </form>
      ) : (
        <p className="cc-note">{t("control.sc.full", { n: LINK_MAX })}</p>
      )}
      <p className="cc-note">{t("control.sc.note")}</p>
    </>
  )
}
