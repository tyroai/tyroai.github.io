import { useEffect, useRef } from "react"
import { useIsBrave } from "@/hooks/useIsBrave"
import { useLocale } from "@/hooks/useLocale"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { DICTATION_ERRORS } from "@/lib/dictationErrors"
import { notify } from "@/lib/notify"

/**
 * Anlat'ta sesle yazdırma: sohbet bestecisinin diktesinin (`useComposerDictation`) hüzmesiz
 * hâli, aynı `useSpeechRecognition`. Dil Türkçe — çözücü Türkçe, Anlat yalnız Türkçe arayüzde.
 * Kesinleşen parça yazının sonuna eklenir; kişi yazdığını silmeden konuşarak sürdürebilir.
 * `usable`: motor var ve tarayıcı onu kapatmıyor (Brave konuşma servisini çıkarıyor, her deneme
 * "ağ hatası" verirdi) — değilse düğme hiç çizilmez. Kutu kapanınca kanca söküldüğü için dikte
 * de kesilir.
 */
export function useNarrateDictation({ text, setText }) {
  const { t } = useLocale()
  const textRef = useRef(text)
  useEffect(() => {
    textRef.current = text
  }, [text])
  const isBrave = useIsBrave()
  const speech = useSpeechRecognition({
    lang: "tr-TR",
    continuous: true,
    interimResults: true,
    onResult: ({ final, isFinal }) => {
      if (!isFinal || !final?.trim()) return
      const prev = textRef.current ?? ""
      const sep = prev === "" || /\s$/.test(prev) ? "" : " "
      setText(prev + sep + final.trim())
    },
    onError: (code) => {
      if (code === "aborted") return
      const key = DICTATION_ERRORS[code] ?? "chat.mic.error.unknown"
      // Sessizlik bir hata değil, doğal bir duraklama.
      if (code === "no-speech") notify.info(t(key))
      else notify.error(t(key))
    },
  })
  return {
    usable: speech.isSupported && !isBrave,
    listening: speech.isListening,
    toggle: () => (speech.isListening ? speech.stop() : speech.start()),
    stop: speech.stop,
  }
}
