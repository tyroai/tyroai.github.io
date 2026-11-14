import { HugeiconsIcon } from "@hugeicons/react"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { useLayoutChoice } from "@/hooks/useLayoutChoice"
import { useLocale } from "@/hooks/useLocale"
import { LAYOUT_PAGES, PAGE_LAYOUTS, defaultLayout, writePageLayout } from "@/lib/pageLayout"
import { useRadioRoving } from "./ProfilePage/useRadioRoving"
import "./pageLayoutPicker.css"

// Sayfanın adı kenar çubuğundaki adıyla aynı sözlük anahtarından.
const PAGE_NAME = { home: "nav.myspace", selfService: "nav.selfService" }

// Düzenin adı ve tek satırlık farkı. Anasayfa'nın ilk düzeni ("standard") artık "Yedek".
const labelKey = (page, id) =>
  page === "home" && id === "standard"
    ? "profile.prefs.pageLayout.home.backup"
    : id === "standard"
      ? "profile.prefs.pageLayout.standard"
      : `profile.prefs.pageLayout.${page}.${id}`
const hintKey = (page, id) =>
  page === "home" && id === "standard"
    ? "profile.prefs.pageLayout.home.backupHint"
    : id === "standard"
      ? "profile.prefs.pageLayout.standardHint"
      : `profile.prefs.pageLayout.${page}.${id}Hint`
// "Deneme" etiketi: varsayılan da Yedek de değil, denenmek üzere sunulan düzen.
const isTrial = (page, id) => id !== defaultLayout(page) && id !== "standard"

/**
 * Anasayfa şemaları. Sahneler (varsayılan): üstte sahne şeridi, geniş karşılama kartı ve kartlar,
 * yanda sahne paneli. Yedek (ilk düzen): karşılama sütunu + kart ızgarası.
 */
function HomeSketch({ id }) {
  if (id === "scenes")
    return (
      <>
        <span className="plp-tabs">
          <span className="plp-tab plp-on" />
          <span className="plp-tab" />
          <span className="plp-tab" />
          <span className="plp-tab" />
        </span>
        <span className="plp-side">
          <span className="plp-stack">
            <span className="plp-pair plp-hero">
              <span className="plp-box plp-tint" />
              <span className="plp-box" />
            </span>
            <span className="plp-trio">
              <span className="plp-box" />
              <span className="plp-box" />
              <span className="plp-box" />
            </span>
          </span>
          <span className="plp-shelf">
            <span className="plp-line" />
            <span className="plp-line" />
            <span className="plp-line" />
          </span>
        </span>
      </>
    )
  return (
    <span className="plp-home">
      <span className="plp-col">
        <span className="plp-box plp-tint" />
        <span className="plp-box" />
      </span>
      <span className="plp-cells">
        <span className="plp-box plp-wide" />
        <span className="plp-box" />
        <span className="plp-box" />
        <span className="plp-box plp-wide" />
      </span>
    </span>
  )
}

/** Düzenin küçük şeması: gerçek ekran değil, yerleşimin iskeleti (yazı yok, okuyucuya gizli). */
function Sketch({ page, id }) {
  return (
    <span aria-hidden="true" className="plp-sketch" data-page={page} data-layout={id}>
      {page === "home" ? (
        <HomeSketch id={id} />
      ) : id === "standard" ? (
        <>
          <span className="plp-band" />
          <span className="plp-line" />
          <span className="plp-line" />
          <span className="plp-line" />
        </>
      ) : (
        <>
          <span className="plp-pair">
            <span className="plp-box" />
            <span className="plp-box plp-tint" />
          </span>
          <span className="plp-trio">
            <span className="plp-box" />
            <span className="plp-box" />
            <span className="plp-box" />
          </span>
          <span className="plp-line" />
          <span className="plp-line" />
        </>
      )}
    </span>
  )
}

function PageChoice({ page }) {
  const { t } = useLocale()
  const chosen = useLayoutChoice(page)
  const ids = PAGE_LAYOUTS[page]
  const choose = (id) => writePageLayout(page, id)
  const radio = useRadioRoving(ids, chosen, choose)
  const name = t(PAGE_NAME[page])
  return (
    <div className="plp-page">
      <p className="plp-name">{name}</p>
      <div role="radiogroup" aria-label={name} className="plp-grid">
        {ids.map((id, index) => {
          const selected = id === chosen
          const label = t(labelKey(page, id))
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              {...radio(id, index)}
              onClick={() => choose(id)}
              className="plp-tile"
            >
              <Sketch page={page} id={id} />
              <span className="plp-foot">
                <span className="plp-label">{label}</span>
                {isTrial(page, id) && (
                  <span className="plp-trial">{t("profile.prefs.pageLayout.trial")}</span>
                )}
                {selected && (
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    aria-hidden="true"
                    className="plp-tick"
                    strokeWidth={2.4}
                  />
                )}
              </span>
              {/* Yeni düzenin farkı tek satırda: karoya bakınca ne değişeceği anlaşılsın. */}
              <span className="plp-hint">{t(hintKey(page, id))}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Profil › Görünüm › Sayfa düzeni: her sayfa için varsayılan düzen (ilk karo) ve öteki düzenler,
 * küçük şemalı karolarla. Seçim anında uygulanır (`lib/pageLayout`).
 */
export function PageLayoutPicker() {
  return (
    <div className="plp">
      {LAYOUT_PAGES.map((page) => (
        <PageChoice key={page} page={page} />
      ))}
    </div>
  )
}
