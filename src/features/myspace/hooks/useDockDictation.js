import { useEffect, useRef } from "react"
import { useIsBrave } from "@/hooks/useIsBrave"
import { useLocale } from "@/hooks/useLocale"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { DICTATION_ERRORS } from "@/lib/dictationErrors"
import { bcp47 } from "@/lib/intl-cache"
import { notify } from "@/lib/notify"

/**
 * Yüzen sohbet çubuğunda sesle yazdırma (sohbetin ve Çevir'in diktesiyle aynı
 * `useSpeechRecognition`). Arayüz dilinde dinler; kesinleşen parça yazının sonuna eklenir, süren
 * söz `interim` ile anında gösterilir. `usable`: motor var ve tarayıcı kapatmıyor (Brave konuşma
 * servisini çıkarıyor) — değilse mikrofon hiç çizilmez.
 */
export function useDockDictation({ text, setText }) {
  const { t, locale } = useLocale()
  const textRef = useRef(text)
  useEffect(() => {
    textRef.current = text
  }, [text])
  const isBrave = useIsBrave()
  const speech = useSpeechRecognition({
    lang: bcp47(locale),
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
  const { isSupported, isListening, interim, start, stop, abort } = speech
  return {
    usable: isSupported && !isBrave,
    listening: isListening,
    interim,
    toggle: () => (isListening ? stop() : start()),
    stop,
    abort,
  }
}
