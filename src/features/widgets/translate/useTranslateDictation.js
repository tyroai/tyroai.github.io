import { useEffect, useRef } from "react"
import { useIsBrave } from "@/hooks/useIsBrave"
import { useLocale } from "@/hooks/useLocale"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { DICTATION_ERRORS } from "@/lib/dictationErrors"
import { notify } from "@/lib/notify"

/** Uygulamanın dört dilinin konuşma tanıma etiketi. */
const SPEECH = { tr: "tr-TR", en: "en-US", ru: "ru-RU", ar: "ar-SA" }

/**
 * Çevir'de sesle yazdırma (Anlat'ın diktesiyle aynı `useSpeechRecognition`). Dinlenen dil `lang`:
 * çevrilecek metnin dili — çağıran arayüz dilini verir, hedef zaten oysa İngilizceyi. Kesinleşen
 * parça yazının sonuna eklenir (kişi yazdığını silmeden konuşarak sürdürür). `usable`: motor var
 * ve tarayıcı kapatmıyor (Brave konuşma servisini çıkarıyor) — değilse mikrofon hiç çizilmez.
 */
export function useTranslateDictation({ text, setText, lang }) {
  const { t } = useLocale()
  const textRef = useRef(text)
  useEffect(() => {
    textRef.current = text
  }, [text])
  const isBrave = useIsBrave()
  const speech = useSpeechRecognition({
    lang: SPEECH[lang] ?? "en-US",
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
