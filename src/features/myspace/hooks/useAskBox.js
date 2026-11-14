import { useLayoutEffect, useRef, useState } from "react"
import Beach02Icon from "@hugeicons/core-free-icons/Beach02Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import CalendarAdd01Icon from "@hugeicons/core-free-icons/CalendarAdd01Icon"
import Invoice03Icon from "@hugeicons/core-free-icons/Invoice03Icon"
import MoneyReceive01Icon from "@hugeicons/core-free-icons/MoneyReceive01Icon"
import Sun03Icon from "@hugeicons/core-free-icons/Sun03Icon"
import SunriseIcon from "@hugeicons/core-free-icons/SunriseIcon"
import SunsetIcon from "@hugeicons/core-free-icons/SunsetIcon"
import { agentOpenByName, useAgentAccess } from "@/hooks/useAgentAccess"
import { useConfig } from "@/hooks/useConfig"
import { useLocale } from "@/hooks/useLocale"
import { usePromptTemplate } from "@/hooks/usePromptTemplate"
import { setPendingAsk, requestOpenChat } from "@/lib/chatBus"
import { isTemplate } from "@/lib/promptTemplates"

/**
 * Hazır sorular. `agent` bir AD (GUID değil — Dataverse ortamları arasında değişiyor);
 * `ChatScreen` adı normalize edip çözüyor, bulamazsa mevcut asistana düşüyor.
 *
 * Toplantı ve posta özeti çipi yok: bugünün toplantılarını ve postalarını brifing söylüyor.
 * Günün özeti ile Haftalık özet yan yana: biri bugünü, öteki haftayı anlatır; haftalık özet
 * ısıtılmaz (haftada bir sorulan soruya her açılışta tur harcanmaz).
 * Bütün çipler birincil asistan tyroOffice'e gider (izin, masraf, avans araçları onda); eşleşme
 * "Office" anahtarıyla (`lib/agentName.js`).
 */
export const OFFICE = "tyroOffice"
const CHIPS_LEAD = [{ k: "weekSummary", agent: OFFICE, icon: Calendar03Icon }]
const CHIPS_HR = [
  { k: "leaveBalance", agent: OFFICE, icon: Beach02Icon },
  { k: "leaveRequest", agent: OFFICE, icon: CalendarAdd01Icon },
  { k: "expense", agent: OFFICE, icon: Invoice03Icon },
  { k: "advance", agent: OFFICE, icon: MoneyReceive01Icon },
]

/**
 * Çip gösterilsin mi: asistanı katalogda var ve kişiye kilitliyse hayır (soru kilitli asistana
 * gidemez). Adı katalogda yoksa çip kalır — soru açık asistana düşer ve cevaplanır.
 */
function useChipAccess() {
  const { agents } = useConfig()
  const { openAgents, ready } = useAgentAccess()
  return (name) => agentOpenByName(name, { agents, openAgents, ready })
}

/**
 * Anasayfa soru kutusunun mantığı — iki görünüm aynı kancayı kullanır: kart (`AskBox`) ve
 * sayfanın altındaki yüzen çubuk (`shelf/DockAsk`).
 *
 * Soru burada cevaplanmaz, sohbete park edilir: `setPendingAsk` + rıhtım açılır, cevap gerçek
 * asistandan gelir, sayfa yerinde kalır. Çip ya kutuya metin koyar ya da alanlı cümle (şablon,
 * `usePromptTemplate`, sohbet bestecisiyle ortak durum) açar. `onCommand`: cümle bir pano
 * komutuysa ("piyasayı göster") sohbete gitmez.
 *
 * Kutu içeriğe göre büyür: boşken tek satır, metin uzadıkça en çok beş satır (`field-sizing`
 * Safari'de yok; boy her değişimde `scrollHeight`ten kurulur).
 */
export function useAskBox({ briefCta, onNewChat, onCommand = null }) {
  const { t } = useLocale()
  const [prompt, setPrompt] = useState("")
  // Çipin asistanı; kutu boşalınca düşer (elle yazılan yeni soru çipin asistanına gitmesin).
  const [chipAgent, setChipAgent] = useState(null)
  const inputRef = useRef(null)
  const formRef = useRef(null)
  const draft = usePromptTemplate(formRef)
  const { tpl, setTpl } = draft
  const chipOpen = useChipAccess()

  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    const cs = getComputedStyle(el)
    const line = parseFloat(cs.lineHeight) || 20
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
    const borderY = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth)
    // Boş kutu tek satır: `scrollHeight` okumak açılışta sayfayı zorla yerleştirirdi.
    if (!prompt) {
      el.style.height = `${Math.max(Math.round(line + padY) - padY, line) + padY + borderY}px`
      el.style.overflowY = "hidden"
      return
    }
    el.style.height = "auto"
    const content = el.scrollHeight - padY
    el.style.height = `${Math.min(Math.max(content, line), line * 5) + padY + borderY}px`
    el.style.overflowY = content > line * 5 ? "auto" : "hidden"
  }, [prompt, tpl])

  /** Soruyu sohbete bırakır, rıhtımı açar ve kutuyu boşaltır. */
  function park(question, agent) {
    setPendingAsk(agent ? { question, agent } : { question })
    requestOpenChat({})
    setPrompt("")
    setChipAgent(null)
  }

  function send(e) {
    e?.preventDefault()
    if (tpl) {
      // Eksik zorunlu alanla gönderilmez: kanca o alanı açar ya da odaklar.
      const question = draft.submit()
      if (!question) return
      setPendingAsk(tpl.agent ? { question, agent: tpl.agent } : { question })
      requestOpenChat({})
      setTpl(null)
      return
    }
    const question = prompt.trim()
    if (!question) return
    if (onCommand?.(question)) {
      setPrompt("")
      setChipAgent(null)
      return
    }
    park(question, chipAgent)
  }

  /**
   * İmleç sona değil, ilk `[yer tutucuya]`: sona konan imleçte uzun şablonun başı görünmezdi.
   * Şablon bir `[tutar]` taşıyorsa o parça seçili gelir, yazan onun yerine yazar.
   */
  function suggest(text, agent) {
    setTpl(null)
    setPrompt(text)
    setChipAgent(agent ?? null)
    requestAnimationFrame(() => {
      const el = inputRef.current
      if (!el) return
      el.focus()
      const slot = /\[[^\]]+\]/.exec(text)
      if (slot) el.setSelectionRange(slot.index, slot.index + slot[0].length)
      else el.setSelectionRange(text.length, text.length)
      el.scrollTop = 0
    })
  }

  /** Çip: şablonu olan soru alanlı cümle açar, olmayan metni kutuya koyar. */
  function pick(k, agent) {
    // Açık şablonun çipine tekrar basmak seçilen alanları sıfırlamaz.
    if (tpl?.key === k) return
    if (!isTemplate(k)) {
      suggest(t(`myspace.prompt.${k}`), agent)
      return
    }
    setPrompt("")
    setChipAgent(null)
    draft.start(k, { agent: agent ?? null })
  }

  /** Alanlı cümleyi serbest metne çevirir; seçilenler yerinde, boşlar `[etiket]`. */
  function editTemplateAsText() {
    if (!tpl) return
    suggest(draft.asText(), tpl.agent)
  }

  /** Şablonu kapatır, kutuyu boşaltır ve odağı metin kutusuna verir. */
  function clearTemplate() {
    setTpl(null)
    setPrompt("")
    setChipAgent(null)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  /**
   * Çipler, niyet sırasıyla: önce özetler (gün · hafta), sonra İK işleri. "Günün özeti" hep ilk:
   * pencere açıkken (sabah · akşam, önceden hazırlanmış özet) marka tonunda, sohbeti doğrudan
   * açar ve dashboard'un düğmesiyle aynı soruyu gönderir (`briefCta.ask`, ısıtılmış cevabı
   * devralmak için); kapalıyken öteki çipler gibi istemi kutuya doldurur.
   */
  const chips = []
  if (chipOpen(OFFICE)) {
    const brief = briefCta?.brief
    chips.push({
      k: brief ? "brief" : "daySummary",
      tone: brief ? "brand" : undefined,
      icon: !brief
        ? Sun03Icon
        : String(brief.windowId ?? "").endsWith("morning")
          ? SunriseIcon
          : SunsetIcon,
      label: t("myspace.chip.brief"),
      agent: OFFICE,
    })
  }
  for (const c of [...CHIPS_LEAD, ...CHIPS_HR]) {
    if (!chipOpen(c.agent)) continue
    chips.push({
      k: c.k,
      icon: c.icon,
      label: t(`myspace.chip.${c.k}`),
      agent: c.agent,
      active: tpl?.key === c.k,
    })
  }

  /** Çipe basınca: hazır özet sohbeti doğrudan açar, ötekiler kutuyu ya da şablonu doldurur. */
  function choose(chip) {
    if (chip.k === "brief") onNewChat(briefCta.ask)
    else pick(chip.k, chip.agent)
  }

  return {
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
    send,
    park,
    editTemplateAsText,
    clearTemplate,
  }
}
