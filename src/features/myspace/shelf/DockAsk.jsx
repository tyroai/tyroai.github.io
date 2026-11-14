import { Suspense, lazy, useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowUp02Icon from "@hugeicons/core-free-icons/ArrowUp02Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import Mic01Icon from "@hugeicons/core-free-icons/Mic01Icon"
import PencilEdit02Icon from "@hugeicons/core-free-icons/PencilEdit02Icon"
import { BrandOrb } from "@/components/brand/BrandOrb"
import { useLocale } from "@/hooks/useLocale"
import { OFFICE, useAskBox } from "../hooks/useAskBox"
import { useDockDictation } from "../hooks/useDockDictation"
import { useDockMagnify } from "../hooks/useDockMagnify"
import { TemplatePrompt } from "../TemplatePrompt"
import { TranslateButton } from "../translate/TranslateButton"

/**
 * Kapsülün küresi: gerçek küre (kişinin görünümü), etkisiz; yazarken dinler. `size` maskotun ölçüsü:
 * görünen gövde onun ~1,27 katı (25 → 32 px, 19 → 24 px; kutu CSS'te gövde boyunda).
 */
function Orb({ size, listening }) {
  return (
    <span aria-hidden="true" inert className="hcd-orb">
      <BrandOrb
        surface="dashboard"
        state={listening ? "listening" : "idle"}
        mascotState={listening ? "listening" : "idle"}
        size={size}
        reading
      />
    </span>
  )
}

// Kutu boşken dönen örnekler: soru ve pano komutu karışık, hepsi TYRO'nun yaptığı işler.
const EXAMPLES = ["ex1", "ex2", "ex3", "ex4", "ex5"]
const TURN_MS = 4000

/**
 * Kutu boşken yer tutucu sırayla döner: önce genel çağrı, sonra örnekler. Yazmaya başlayınca ya da
 * sekme arka plandayken durur; durum dört saniyede bir yazılır (karede değil).
 */
function useRotatingHint(active, first, t) {
  const [turn, setTurn] = useState(0)
  useEffect(() => {
    if (!active) return undefined
    const id = setInterval(() => {
      if (!document.hidden) setTurn((n) => n + 1)
    }, TURN_MS)
    return () => clearInterval(id)
  }, [active])
  const all = [first, ...EXAMPLES.map((k) => t(`homeLayout.shelf.${k}`))]
  return { text: all[turn % all.length], turn }
}

function SendButton({ disabled, label }) {
  return (
    <button type="submit" disabled={disabled} aria-label={label} title={label} className="hcd-send">
      <HugeiconsIcon icon={ArrowUp02Icon} strokeWidth={2.4} aria-hidden="true" />
    </button>
  )
}

// Öneri simgelerinin tonu: paletin degradesi boyunca altı durak (`homeCommand.css` › `--hcd-h*`).
const HUES = 6

/** Dinlerken yer tutucunun başında paletin dalgası (yalnız dikte sürerken çizilir). */
function Wave() {
  return (
    <span aria-hidden="true" className="hcd-wave">
      <i />
      <i />
      <i />
      <i />
      <i />
      <i />
      <i />
    </span>
  )
}

/**
 * Yüzen sohbet çubuğunun içi (Anasayfa; kart görünümü `AskBox`, mantık ikisinde ortak
 * `hooks/useAskBox`). İki hâl:
 *
 * - **Soru:** cam yüzeyin kendisi alan (içinde ayrı kutu yok) — başta küre, ortada yazı (uzadıkça
 *   beş satıra kadar büyür), sonda mikrofon ve gönder (boşken paletin soluk tonu, yazı gelince
 *   dolu). ALTINDA ona bağlı öneriler: zeminsiz, paletin tonunda küçük simge + yazı, tek sıra, yana
 *   kayar; yalnız çubuğa tıklanınca (odakta) açılır, tıklanmadıkça çubuk tek satır. Mikrofon sesle yazdırır (`useDockDictation`): dinlerken
 *   küre dinler, dalga ve söylenen söz akar, kesinleşen söz kutuya eklenir; gönder gizlenir.
 * - **Şablon** (İzin talebi, Masraf girişi, İş avansı): kapsül bir karta açılır — başlıkta küre,
 *   şablonun adı, "metin olarak düzenle" ve "kapat"; ortada tam genişlikte alanlı cümle (alanlar
 *   kırılmaz, kendi boyunda); altta gönder. Eksik zorunlu alanla gönderilmez, o alan açılır.
 */
// Deneysel akışlar (kubbe/fiş + cümle formu): her biri ayrı parça, ilk açılışta iner.
const FLOWS = {
  advance: lazy(() => import("../flows/advance/AdvanceFlow")),
  leaveRequest: lazy(() => import("../flows/leave/LeaveFlow")),
  expense: lazy(() => import("../flows/expense/ExpenseFlow")),
}

export function DockAsk({ briefCta, onNewChat, onCommand, placeholder }) {
  const { t } = useLocale()
  const [flow, setFlow] = useState(null) // { kind, open, agent } — kapanış hareketi için bağlı kalır
  const {
    prompt,
    setPrompt,
    setChipAgent,
    inputRef,
    formRef,
    draft,
    tpl,
    chips,
    choose,
    chipOpen,
    send: submit,
    park,
    editTemplateAsText,
    clearTemplate,
  } = useAskBox({ briefCta, onNewChat, onCommand })
  const [typing, setTyping] = useState(false)
  const chipsRef = useRef(null)
  useDockMagnify(chipsRef, !tpl)
  const voice = useDockDictation({ text: prompt, setText: setPrompt })
  const listening = voice.listening && !tpl
  const hint = useRotatingHint(
    !prompt && !tpl && !listening,
    placeholder ?? t("myspace.ask.placeholder"),
    t,
  )
  // Dinlerken kutu süren sözü de gösterir (yalnız görüntü; kesinleşince `prompt`a eklenir).
  const shown =
    listening && voice.interim ? `${prompt}${prompt ? " " : ""}${voice.interim}` : prompt
  const submitNow = (e) => {
    if (voice.listening) voice.abort()
    submit(e)
  }
  const send = t("myspace.ask.send")
  const title = tpl ? (chips.find((c) => c.k === tpl.key)?.label ?? "") : ""

  return (
    <>
      <form
        ref={formRef}
        onSubmit={submitNow}
        data-template={tpl ? "" : undefined}
        data-listening={listening ? "" : undefined}
        className="hcd-field"
      >
        {tpl ? (
          <>
            <div className="hcd-head">
              <Orb size={19} listening />
              <span className="hcd-title">{title}</span>
              <button
                type="button"
                className="hcd-icon"
                onClick={editTemplateAsText}
                aria-label={t("myspace.template.edit")}
                title={t("myspace.template.edit")}
              >
                <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={1.8} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="hcd-icon"
                onClick={clearTemplate}
                aria-label={t("myspace.template.clear")}
                title={t("myspace.template.clear")}
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
            <div className="hcd-sentence">
              <TemplatePrompt
                tkey={tpl.key}
                values={tpl.values}
                onChange={draft.setSlot}
                forcedOpen={tpl.open}
                onForcedClose={draft.closeForced}
                onEditText={editTemplateAsText}
              />
              <SendButton label={send} />
            </div>
          </>
        ) : (
          <>
            <Orb size={25} listening={typing || listening} />
            <label htmlFor="myspace-ask" className="sr-only">
              {t("myspace.ask.label")}
            </label>
            {listening && <Wave />}
            <span className="hcd-input-wrap">
              {/* Dönen yer tutucu: her yenisi alttan yumuşakça belirir (`homeCommand.css`). */}
              {!shown && (
                <span
                  key={listening ? "listen" : hint.turn}
                  aria-hidden="true"
                  className="hcd-hint"
                >
                  {listening ? t("chat.mic.listeningPlaceholder") : hint.text}
                </span>
              )}
              <textarea
                id="myspace-ask"
                ref={inputRef}
                rows={1}
                maxLength={4000}
                value={shown}
                readOnly={listening}
                onFocus={() => setTyping(true)}
                onBlur={() => setTyping(false)}
                onChange={(e) => {
                  setPrompt(e.target.value)
                  if (!e.target.value.trim()) setChipAgent(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) submitNow(e)
                }}
                className="hcd-input"
              />
            </span>
            {prompt.trim() && !listening ? (
              <TranslateButton
                text={prompt}
                onPark={(q) => park(q, chipOpen(OFFICE) ? OFFICE : null)}
              />
            ) : null}
            {voice.usable && (
              <button
                type="button"
                className="hcd-mic"
                data-on={listening ? "" : undefined}
                aria-pressed={listening}
                aria-label={t(listening ? "chat.mic.stop" : "chat.mic.start")}
                title={t(listening ? "chat.mic.stop" : "chat.mic.start")}
                onClick={voice.toggle}
              >
                {listening ? (
                  <span aria-hidden="true" className="hcd-mic-stop" />
                ) : (
                  <HugeiconsIcon icon={Mic01Icon} strokeWidth={1.9} aria-hidden="true" />
                )}
              </button>
            )}
            {!listening && <SendButton disabled={!prompt.trim()} label={send} />}
          </>
        )}
      </form>
      {!tpl && (
        <div className="hcd-rail">
          <div className="hcd-rail-in">
            <div className="hcd-rail-row">
              <div
                ref={chipsRef}
                role="group"
                aria-label={t("myspace.chips.aria")}
                className="hcd-chips"
              >
                {chips.map((c, i) => (
                  <button
                    key={c.k}
                    type="button"
                    data-tone={c.tone}
                    className="hcd-chip"
                    style={{ "--hcd-hue": `var(--hcd-h${(i % HUES) + 1})` }}
                    // Odak yazı alanında kalır: öneriler odak kaybında kapanıyor, basış boşa gitmesin.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() =>
                      FLOWS[c.k] ? setFlow({ kind: c.k, open: true, agent: c.agent }) : choose(c)
                    }
                  >
                    {c.icon && <HugeiconsIcon icon={c.icon} strokeWidth={1.9} aria-hidden="true" />}
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {flow && <FlowHost flow={flow} setFlow={setFlow} onSend={park} />}
    </>
  )
}

/** Açık akışın penceresi; tür değişince öncekinin yerine yenisi bağlanır. */
function FlowHost({ flow, setFlow, onSend }) {
  const Flow = FLOWS[flow.kind]
  return (
    <Suspense fallback={null}>
      <Flow
        key={flow.kind}
        open={flow.open}
        onOpenChange={(open) => setFlow((f) => ({ ...f, open }))}
        onSend={(question) => onSend(question, flow.agent)}
      />
    </Suspense>
  )
}
