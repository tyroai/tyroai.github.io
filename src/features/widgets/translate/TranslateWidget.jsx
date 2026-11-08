import "@/lib/i18n/tools"
import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import ClipboardPasteIcon from "@hugeicons/core-free-icons/ClipboardPasteIcon"
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon"
import PencilEdit02Icon from "@hugeicons/core-free-icons/PencilEdit02Icon"
import Tick01Icon from "@hugeicons/core-free-icons/Tick01Icon"
import TranslationIcon from "@hugeicons/core-free-icons/TranslationIcon"
import { useLocale } from "@/hooks/useLocale"
import { useTranslate } from "@/hooks/useTranslate"
import { requestOpenChat, setPendingAsk } from "@/lib/chatBus"
import { notify } from "@/lib/notify"
import { languageName, onDeviceTranslateReady } from "@/lib/onDeviceTranslate"
import { WidgetFrame } from "../WidgetFrame"
import { TranslateOutput } from "./TranslateOutput"
import "./translate.css"

/** Hedef diller: uygulamanın dört dili. */
const LANGS = ["tr", "en", "ru", "ar"]

/**
 * ÇEVİR — metni yapıştır ya da yaz, TR · EN · RU · AR'den birine çevrilir. Çeviri cihazda
 * (tarayıcının yerleşik çeviri modeli, `lib/onDeviceTranslate`): metin cihazdan çıkmaz, anahtar
 * yok. Kaynak dil kendiliğinden anlaşılır; hedef seçilmediyse arayüz dili (metin zaten o dildeyse
 * İngilizce). Tarayıcı cihazda çeviremiyorsa (Safari, Firefox, telefon) ya da dil çifti yoksa metin
 * çeviri isteğiyle TYRO'ya, sohbete gider (tyroOffice). Metin kişisel: Sunum modunda bulanık
 * (`data-private`), hiçbir yere kaydedilmez. ⌘/Ctrl + Enter çevirir.
 *
 * Dar kartta iki kip (`data-mode`): yazarken metin kutusu ve diller; çevirince kutu tek satırlık özete
 * iner ("Rusça · …", dokununca yeniden düzenlenir), Kopyala dillerin yanına geçer ve kalan yerin
 * tamamı çeviriye kalır — sabit boylu kartta çeviri sıfır yüksekliğe sıkışıyordu. Büyük kartta iki
 * bölme, ikisi hep görünür (`translate.css`).
 */
export default function TranslateWidget({ className }) {
  const { t, locale } = useLocale()
  const tr = useTranslate()
  const box = useRef(null)
  const sourceRef = useRef(null)
  const [text, setText] = useState("")
  const [target, setTarget] = useState(null)
  const [done, setDone] = useState(null) // en son çevrilen metin
  const [device, setDevice] = useState(null) // cihazda çeviri var mı (bilinene kadar null)
  const [editing, setEditing] = useState(true)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    let alive = true
    onDeviceTranslateReady().then((ok) => alive && setDevice(ok))
    return () => {
      alive = false
    }
  }, [])

  const clean = text.trim()
  const state = tr.state
  const shown = target ?? (state.status === "done" ? state.target : null)
  const mode = editing || state.status === "idle" ? "edit" : "result"

  function askTyro(want) {
    const question = want
      ? t("myspace.translate.promptTo", { lang: languageName(want, locale), text: clean })
      : t("myspace.translate.prompt", { text: clean })
    setPendingAsk({ question, agent: "tyroOffice" })
    requestOpenChat({ focusComposer: true })
  }

  function run(want = target) {
    if (!clean) return
    if (device === false) return askTyro(want)
    // Aynı metinde yalnız hedef değiştiyse dil yeniden aranmaz.
    const source = done === clean && state.source ? state.source : undefined
    setDone(clean)
    setEditing(false)
    tr.run(clean, { source, target: want ?? undefined })
    // Dar kartta kutu ve Çevir gizlenir: klavye odağı sayfanın başına düşmesin, özete geçsin.
    requestAnimationFrame(() => {
      if (box.current && !box.current.offsetParent)
        sourceRef.current?.focus({ preventScroll: true })
    })
  }

  function edit() {
    setEditing(true)
    requestAnimationFrame(() => box.current?.focus())
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(state.text)
      setCopied(true)
      notify.success(t("chat.message.copied"))
      setTimeout(() => setCopied(false), 1600)
    } catch {
      notify.error(t("chat.message.copyFailed"))
    }
  }

  function pick(code) {
    setTarget(code)
    if (done === clean && clean && state.status !== "idle") run(code)
  }

  async function paste() {
    try {
      const got = await navigator.clipboard.readText()
      if (got) setText(got)
    } catch {
      // İzin yok: kişi kutuya kendisi yapıştırır.
    }
    box.current?.focus()
  }

  function clear() {
    setText("")
    setDone(null)
    setEditing(true)
    tr.reset()
    box.current?.focus()
  }

  return (
    <WidgetFrame
      id="tyro-translate"
      title={t("widgets.translate.title")}
      icon={TranslationIcon}
      className={className}
    >
      <div
        className="tw-body"
        data-mode={mode}
        data-result={state.status !== "idle" ? "" : undefined}
      >
        {mode === "result" && (
          <button
            ref={sourceRef}
            type="button"
            onClick={edit}
            aria-label={t("tools.translate.edit")}
            title={t("tools.translate.edit")}
            className="tw-source"
            data-private=""
          >
            {state.source && (
              <span className="tw-source-lang">{languageName(state.source, locale)}</span>
            )}
            <span className="tw-source-text" dir="auto">
              {done}
            </span>
            <HugeiconsIcon icon={PencilEdit02Icon} aria-hidden="true" strokeWidth={1.9} />
          </button>
        )}
        <div className="tw-input" data-private="">
          <textarea
            ref={box}
            value={text}
            rows={3}
            dir="auto"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                run()
              }
            }}
            placeholder={t("tools.translate.placeholder")}
            aria-label={t("tools.translate.input")}
          />
          {text ? (
            <button
              type="button"
              onClick={clear}
              aria-label={t("tools.translate.clear")}
              title={t("tools.translate.clear")}
              className="tw-corner"
            >
              <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" strokeWidth={2} />
            </button>
          ) : (
            <button type="button" onClick={paste} className="tw-corner tw-paste">
              <HugeiconsIcon icon={ClipboardPasteIcon} aria-hidden="true" strokeWidth={1.9} />
              {t("tools.translate.paste")}
            </button>
          )}
        </div>
        <div className="tw-bar">
          <div role="radiogroup" aria-label={t("myspace.translate.target")} className="tw-langs">
            {LANGS.map((code) => (
              <button
                key={code}
                type="button"
                role="radio"
                aria-checked={shown === code}
                aria-label={languageName(code, locale)}
                title={languageName(code, locale)}
                onClick={() => pick(code)}
                className="tw-lang"
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => run()} disabled={!clean} className="tw-go">
            {device === false ? t("tools.translate.goChat") : t("myspace.translate.action")}
            <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" strokeWidth={2} />
          </button>
          {state.status === "done" && (
            <button type="button" onClick={copy} className="tw-chip tw-copy">
              <HugeiconsIcon
                icon={copied ? Tick01Icon : Copy01Icon}
                aria-hidden="true"
                strokeWidth={1.9}
              />
              {t("myspace.translate.copy")}
            </button>
          )}
        </div>
        <div className="tw-result">
          <TranslateOutput
            state={state}
            device={device}
            copied={copied}
            onCopy={copy}
            onChat={() => askTyro(target ?? state.target)}
          />
        </div>
      </div>
    </WidgetFrame>
  )
}
